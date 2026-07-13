import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type SyncMode = "check" | "dry-run" | "write";

const OWNED_RELEASE_PATH = "src/data/release.json";
const OWNED_IMPACT_PATH = "src/data/release-impact.json";
const LEDGER_TOKEN_SOURCE = "packages/web/src/routes/globals.css";

const DOC_AREA_ORDER = [
  "src/content/docs/docs/getting-started/configuration.md",
  "src/content/docs/docs/getting-started/update-and-migrate.md",
  "src/content/docs/docs/reference/cli/",
  "src/content/docs/docs/reference/gateway-api/",
  "src/content/docs/docs/reference/cli/migrations.md",
  "src/content/machine/agents.md",
  "src/styles/generated/ledger-tokens.css",
] as const;

export interface ImpactCategories {
  authentication: string[];
  commander: string[];
  config: string[];
  gatewayRoutes: string[];
  ledgerTokens: string[];
  templatesAndMigrations: string[];
}

export interface ClassifiedImpact {
  categories: ImpactCategories;
  docsReviewAreas: string[];
  tokenSyncRequired: boolean;
}

export interface ReleaseImpactReport extends ClassifiedImpact {
  schemaVersion: 1;
  version: string;
  sourceCommit: string;
  changedSourceFiles: string[];
  inputProvenance: "fixture" | "selected-head";
  cliHelp: {
    changed: boolean;
    previousVersion: string | null;
    snapshotPath: string;
  };
  tokenSync: {
    required: boolean;
    command: "pnpm tokens:sync" | null;
  };
}

export interface SyncReleaseDocsOptions {
  changedFiles: string[];
  cliHelp: string;
  headCommit: string;
  jinnRoot: string;
  mode: SyncMode;
  inputProvenance?: "fixture" | "selected-head";
  runTokenSync?: (mode: "check" | "write", jinnRoot: string) => void;
  siteRoot: string;
}

export interface SyncReleaseDocsResult {
  changedOwnedFiles: string[];
  impact: ReleaseImpactReport;
}

interface ChangelogSection {
  date: string;
  markdown: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function normalizeText(value: string): string {
  return `${value.replace(/\r\n?/gu, "\n").trimEnd()}\n`;
}

const SELECTED_TRUTH_PATHS = [
  "packages/jinn/package.json",
  "CHANGELOG.md",
  "packages/jinn/bin/jinn.ts",
] as const;

export function assertSelectedSourceMatchesHead(
  jinnRoot: string,
  headCommit: string,
): void {
  for (const relativePath of SELECTED_TRUTH_PATHS) {
    const selected = execFileSync("git", [
      "-C",
      jinnRoot,
      "show",
      `${headCommit}:${relativePath}`,
    ]);
    const working = fs.readFileSync(path.join(jinnRoot, relativePath));
    if (!selected.equals(working)) {
      throw new Error(
        `selected head ${headCommit} differs from working ${relativePath}`,
      );
    }
  }
}

function publicChildCommands(help: string): string[] {
  const lines = help.replace(/\r\n?/gu, "\n").split("\n");
  const commandsIndex = lines.findIndex((line) => line.trim() === "Commands:");
  if (commandsIndex === -1) return [];
  const commands: string[] = [];
  for (const line of lines.slice(commandsIndex + 1)) {
    const match = /^ {2}([a-z][a-z0-9-]*)(?:[ <[]|$)/u.exec(line);
    if (match && match[1] !== "help") commands.push(match[1]);
  }
  return commands;
}

export function capturePublicCliHelp(
  jinnRoot: string,
  expectedVersion: string,
  nodeBinary: string,
): string {
  const packageJson = readJson(
    path.join(jinnRoot, "packages/jinn/package.json"),
  );
  if (packageJson.version !== expectedVersion) {
    throw new Error(
      `selected package version is ${String(packageJson.version)} but expected ${expectedVersion}`,
    );
  }
  const sourcePath = path.join(jinnRoot, "packages/jinn/bin/jinn.ts");
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`selected CLI source is missing: ${sourcePath}`);
  }
  const nodeVersion = execFileSync(
    nodeBinary,
    ["-p", "process.versions.node"],
    { encoding: "utf8" },
  ).trim();
  if (Number(nodeVersion.split(".")[0]) !== 24) {
    throw new Error(
      `CLI source capture requires Node 24; received ${nodeVersion}`,
    );
  }
  const runSource = (args: string[]): string =>
    normalizeText(
      execFileSync(
        nodeBinary,
        ["--experimental-strip-types", sourcePath, ...args],
        {
          cwd: jinnRoot,
          encoding: "utf8",
          env: { ...process.env, NO_UPDATE_NOTIFIER: "1" },
        },
      ),
    );
  const reportedVersion = runSource(["--version"]).trim();
  if (reportedVersion !== expectedVersion) {
    throw new Error(
      `CLI source reports ${reportedVersion} but package version is ${expectedVersion}`,
    );
  }

  const commandPaths: string[][] = [[]];
  const sections: string[] = [];
  for (let index = 0; index < commandPaths.length; index += 1) {
    const commandPath = commandPaths[index];
    const help = runSource([...commandPath, "--help"]);
    const invocation = ["jinn", ...commandPath, "--help"].join(" ");
    sections.push(`$ ${invocation}\n${help}`);
    for (const child of publicChildCommands(help)) {
      commandPaths.push([...commandPath, child]);
    }
  }
  return sections.join("\n");
}

export function extractChangelogSection(
  changelog: string,
  version: string,
): ChangelogSection {
  const normalized = changelog.replace(/\r\n?/gu, "\n");
  const header = new RegExp(
    `^## \\[${escapeRegex(version)}\\] - (\\d{4}-\\d{2}-\\d{2})$`,
    "mu",
  );
  const match = header.exec(normalized);
  if (!match) {
    throw new Error(`CHANGELOG.md has no exact section for ${version}`);
  }
  const nextHeader = normalized.indexOf(
    "\n## [",
    match.index + match[0].length,
  );
  const end = nextHeader === -1 ? normalized.length : nextHeader;
  return {
    date: match[1],
    markdown: normalizeText(normalized.slice(match.index, end)),
  };
}

const AUTHENTICATION_POLICY_PATHS = new Set([
  "packages/jinn/src/gateway/approval-authority.ts",
  "packages/jinn/src/gateway/session-comm-guards.ts",
  "packages/jinn/src/mcp/identity.ts",
  "packages/jinn/src/workflows/custom-triggers.ts",
]);

function matchesAuthentication(relativePath: string): boolean {
  if (!relativePath.startsWith("packages/jinn/src/")) return false;
  return (
    /(?:^|\/)(?:auth|pairing?|devices?)(?:[/.-]|$)/iu.test(relativePath) ||
    AUTHENTICATION_POLICY_PATHS.has(relativePath)
  );
}

function normalizeChangedFiles(changedFiles: readonly string[]): string[] {
  return [...new Set(changedFiles.map((file) => file.trim()))]
    .filter(Boolean)
    .sort();
}

export function classifyReleaseImpact(
  changedFiles: readonly string[],
): ClassifiedImpact {
  const unique = normalizeChangedFiles(changedFiles);
  const categories: ImpactCategories = {
    authentication: unique.filter(matchesAuthentication),
    commander: unique.filter(
      (file) =>
        file === "packages/jinn/bin/jinn.ts" ||
        file.startsWith("packages/jinn/src/cli/"),
    ),
    config: unique.filter(
      (file) =>
        file === "packages/jinn/src/shared/config.ts" ||
        file === "packages/jinn/src/shared/config-schema.ts" ||
        file === "packages/jinn/src/shared/types.ts" ||
        file === "packages/jinn/src/cli/setup.ts" ||
        file === "packages/jinn/template/config.yaml",
    ),
    gatewayRoutes: unique.filter(
      (file) =>
        /^packages\/jinn\/src\/gateway\/(?:api|server)(?:[/.-]|$)/u.test(
          file,
        ) ||
        file.startsWith("packages/jinn/src/gateway/routes/") ||
        file === "packages/jinn/src/gateway/files.ts" ||
        /\/gateway\/[a-z0-9-]+-(?:endpoint|routes?)\.ts$/u.test(file),
    ),
    ledgerTokens: unique.filter((file) => file === LEDGER_TOKEN_SOURCE),
    templatesAndMigrations: unique.filter(
      (file) =>
        file.startsWith("packages/jinn/template/") ||
        file.startsWith("packages/jinn/migrations/"),
    ),
  };

  const areas = new Set<string>();
  if (categories.config.length > 0) {
    areas.add("src/content/docs/docs/getting-started/configuration.md");
  }
  if (categories.templatesAndMigrations.length > 0) {
    areas.add("src/content/docs/docs/getting-started/update-and-migrate.md");
    areas.add("src/content/docs/docs/reference/cli/migrations.md");
  }
  if (categories.commander.length > 0) {
    areas.add("src/content/docs/docs/reference/cli/");
  }
  if (
    categories.gatewayRoutes.length > 0 ||
    categories.authentication.length > 0
  ) {
    areas.add("src/content/docs/docs/reference/gateway-api/");
    areas.add("src/content/machine/agents.md");
  }
  if (categories.ledgerTokens.length > 0) {
    areas.add("src/styles/generated/ledger-tokens.css");
  }

  return {
    categories,
    docsReviewAreas: DOC_AREA_ORDER.filter((area) => areas.has(area)),
    tokenSyncRequired: categories.ledgerTokens.length > 0,
  };
}

function compareSemver(left: string, right: string): number {
  const parse = (value: string): [number, number, number] => {
    const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(value);
    if (!match) throw new Error(`invalid stable semver: ${value}`);
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  };
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function previousCliSnapshot(
  siteRoot: string,
  version: string,
): { contents: string | null; version: string | null } {
  const directory = path.join(siteRoot, "src/data/cli-help");
  if (!fs.existsSync(directory)) return { contents: null, version: null };
  const candidates = fs
    .readdirSync(directory)
    .flatMap((file) => {
      const match = /^(\d+\.\d+\.\d+)\.txt$/u.exec(file);
      return match && compareSemver(match[1], version) < 0 ? [match[1]] : [];
    })
    .sort(compareSemver);
  const previousVersion = candidates.at(-1) ?? null;
  return {
    contents: previousVersion
      ? normalizeText(
          fs.readFileSync(
            path.join(directory, `${previousVersion}.txt`),
            "utf8",
          ),
        )
      : null,
    version: previousVersion,
  };
}

function renderChangelogPage(
  version: string,
  section: ChangelogSection,
): string {
  return `---
title: jinn-cli ${version}
description: Release notes for jinn-cli ${version}.
slug: docs/changelog/${version}
since: "${version}"
source:
  - CHANGELOG.md
audience: [operator, contributor]
generated: true
---

${section.markdown}`;
}

function readJson(absolutePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as Record<
    string,
    unknown
  >;
}

function renderReleaseMetadata(
  current: Record<string, unknown>,
  version: string,
  date: string,
  headCommit: string,
): string {
  const next: Record<string, unknown> = {
    version,
    releasedAt: date,
    stable: true,
    changelogPath: `/docs/changelog/${version}/`,
  };
  if (current.version === version && current.contractTarget === "npm") {
    next.contractTarget = "npm";
  } else {
    if (!/^[0-9a-f]{40}$/u.test(headCommit)) {
      throw new Error(
        "source release sync requires a full 40-character head commit",
      );
    }
    next.sourcePin = headCommit;
    next.contractTarget = "source";
  }
  return `${JSON.stringify(next, null, 2)}\n`;
}

function changed(
  relativePath: string,
  contents: string,
  siteRoot: string,
): boolean {
  const absolutePath = path.join(siteRoot, relativePath);
  return (
    !fs.existsSync(absolutePath) ||
    fs.readFileSync(absolutePath, "utf8") !== contents
  );
}

function writeOwned(
  relativePath: string,
  contents: string,
  siteRoot: string,
): void {
  const absolutePath = path.join(siteRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
}

export function syncReleaseDocs(
  options: SyncReleaseDocsOptions,
): SyncReleaseDocsResult {
  const packageJson = readJson(
    path.join(options.jinnRoot, "packages/jinn/package.json"),
  );
  const version = packageJson.version;
  if (typeof version !== "string") {
    throw new Error("packages/jinn/package.json has no string version");
  }
  const section = extractChangelogSection(
    fs.readFileSync(path.join(options.jinnRoot, "CHANGELOG.md"), "utf8"),
    version,
  );
  const currentRelease = readJson(
    path.join(options.siteRoot, OWNED_RELEASE_PATH),
  );
  const cliSnapshotPath = `src/data/cli-help/${version}.txt`;
  const changelogPath = `src/content/docs/docs/changelog/${version}.md`;
  const cliHelp = normalizeText(options.cliHelp);
  const previousCli = previousCliSnapshot(options.siteRoot, version);
  const classified = classifyReleaseImpact(options.changedFiles);
  const docsReviewAreas = new Set(classified.docsReviewAreas);
  if (previousCli.contents !== cliHelp) {
    docsReviewAreas.add("src/content/docs/docs/reference/cli/");
  }
  const impact: ReleaseImpactReport = {
    schemaVersion: 1,
    version,
    sourceCommit: options.headCommit,
    changedSourceFiles: normalizeChangedFiles(options.changedFiles),
    inputProvenance: options.inputProvenance ?? "fixture",
    categories: classified.categories,
    docsReviewAreas: DOC_AREA_ORDER.filter((area) => docsReviewAreas.has(area)),
    tokenSyncRequired: classified.tokenSyncRequired,
    cliHelp: {
      changed: previousCli.contents !== cliHelp,
      previousVersion: previousCli.version,
      snapshotPath: cliSnapshotPath,
    },
    tokenSync: {
      required: classified.tokenSyncRequired,
      command: classified.tokenSyncRequired ? "pnpm tokens:sync" : null,
    },
  };
  const outputs = new Map<string, string>([
    [
      OWNED_RELEASE_PATH,
      renderReleaseMetadata(
        currentRelease,
        version,
        section.date,
        options.headCommit,
      ),
    ],
    [changelogPath, renderChangelogPage(version, section)],
    [cliSnapshotPath, cliHelp],
    [OWNED_IMPACT_PATH, `${JSON.stringify(impact, null, 2)}\n`],
  ]);
  const changedOwnedFiles = [...outputs]
    .filter(([relativePath, contents]) =>
      changed(relativePath, contents, options.siteRoot),
    )
    .map(([relativePath]) => relativePath);

  if (classified.tokenSyncRequired && options.mode !== "dry-run") {
    const tokenMode =
      options.mode === "check" || changedOwnedFiles.length === 0
        ? "check"
        : "write";
    options.runTokenSync?.(tokenMode, options.jinnRoot);
  }
  if (options.mode === "check" && changedOwnedFiles.length > 0) {
    throw new Error(
      `release docs are out of sync: ${changedOwnedFiles.join(", ")}`,
    );
  }
  if (options.mode === "write") {
    for (const [relativePath, contents] of outputs) {
      if (changedOwnedFiles.includes(relativePath)) {
        writeOwned(relativePath, contents, options.siteRoot);
      }
    }
  }

  return { changedOwnedFiles, impact };
}

interface CliOptions {
  baseRef?: string;
  changedFilesFile?: string;
  cliHelpFile?: string;
  headCommit?: string;
  headRef: string;
  jinnRoot: string;
  mode: SyncMode;
  siteRoot: string;
}

export function resolveInputProvenance(inputs: {
  changedFilesFile?: string;
  cliHelpFile?: string;
  headCommit?: string;
}): "fixture" | "selected-head" {
  const supplied = [
    inputs.changedFilesFile,
    inputs.cliHelpFile,
    inputs.headCommit,
  ].filter((value) => value !== undefined).length;
  if (supplied === 0) return "selected-head";
  if (supplied === 3) return "fixture";
  throw new Error(
    "--changed-files-file, --cli-help-file, and --head-commit must be supplied together",
  );
}

function valueAfter(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

function parseArgs(args: string[], defaultSiteRoot: string): CliOptions {
  const optionArgs = args[0] === "--" ? args.slice(1) : args;
  const options: CliOptions = {
    headRef: "HEAD",
    jinnRoot: path.resolve(defaultSiteRoot, "../jinn"),
    mode: "write",
    siteRoot: defaultSiteRoot,
  };
  for (let index = 0; index < optionArgs.length; index += 1) {
    const arg = optionArgs[index];
    if (arg === "--check") options.mode = "check";
    else if (arg === "--dry-run") options.mode = "dry-run";
    else if (arg === "--base-ref")
      options.baseRef = valueAfter(optionArgs, index++, arg);
    else if (arg === "--head-ref")
      options.headRef = valueAfter(optionArgs, index++, arg);
    else if (arg === "--head-commit")
      options.headCommit = valueAfter(optionArgs, index++, arg);
    else if (arg === "--jinn-root")
      options.jinnRoot = path.resolve(valueAfter(optionArgs, index++, arg));
    else if (arg === "--site-root")
      options.siteRoot = path.resolve(valueAfter(optionArgs, index++, arg));
    else if (arg === "--changed-files-file")
      options.changedFilesFile = path.resolve(
        valueAfter(optionArgs, index++, arg),
      );
    else if (arg === "--cli-help-file")
      options.cliHelpFile = path.resolve(valueAfter(optionArgs, index++, arg));
    else throw new Error(`unknown option: ${arg}`);
  }
  if (optionArgs.includes("--check") && optionArgs.includes("--dry-run")) {
    throw new Error("--check and --dry-run are mutually exclusive");
  }
  return options;
}

function git(jinnRoot: string, args: string[]): string {
  return execFileSync("git", ["-C", jinnRoot, ...args], {
    encoding: "utf8",
  }).trim();
}

export function resolveCommitRef(jinnRoot: string, headRef: string): string {
  try {
    return git(jinnRoot, [
      "rev-parse",
      "--verify",
      "--end-of-options",
      `${headRef}^{commit}`,
    ]);
  } catch {
    throw new Error(`head ref "${headRef}" does not resolve to a commit`);
  }
}

function previousChangelogVersion(changelog: string, version: string): string {
  const versions = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - /gmu)].map(
    (match) => match[1],
  );
  const index = versions.indexOf(version);
  if (index === -1 || !versions[index + 1]) {
    throw new Error(
      `cannot infer previous release before ${version}; pass --base-ref`,
    );
  }
  return versions[index + 1];
}

function changedFilesFromFixture(file: string): string[] {
  const contents = fs.readFileSync(file, "utf8");
  if (file.endsWith(".json")) {
    const parsed = JSON.parse(contents) as unknown;
    if (
      !Array.isArray(parsed) ||
      !parsed.every((item) => typeof item === "string")
    ) {
      throw new Error("changed-files JSON fixture must be an array of strings");
    }
    return parsed;
  }
  return contents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function runCli(): void {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const defaultSiteRoot = path.resolve(scriptDirectory, "..");
  const cli = parseArgs(process.argv.slice(2), defaultSiteRoot);
  const packageJson = readJson(
    path.join(cli.jinnRoot, "packages/jinn/package.json"),
  );
  const version = packageJson.version;
  if (typeof version !== "string") {
    throw new Error("packages/jinn/package.json has no string version");
  }
  const changelog = fs.readFileSync(
    path.join(cli.jinnRoot, "CHANGELOG.md"),
    "utf8",
  );
  const baseRef =
    cli.baseRef ?? `v${previousChangelogVersion(changelog, version)}`;
  const inputProvenance = resolveInputProvenance(cli);
  const fixtureMode = inputProvenance === "fixture";
  const selectedHeadCommit = fixtureMode
    ? cli.headCommit!
    : resolveCommitRef(cli.jinnRoot, cli.headRef);
  if (!fixtureMode) {
    assertSelectedSourceMatchesHead(cli.jinnRoot, selectedHeadCommit);
  }
  const changedFiles = cli.changedFilesFile
    ? changedFilesFromFixture(cli.changedFilesFile)
    : git(cli.jinnRoot, [
        "diff",
        "--name-only",
        baseRef,
        selectedHeadCommit,
        "--",
      ])
        .split("\n")
        .filter(Boolean);
  const cliHelp = cli.cliHelpFile
    ? fs.readFileSync(cli.cliHelpFile, "utf8")
    : capturePublicCliHelp(cli.jinnRoot, version, process.execPath);
  const result = syncReleaseDocs({
    changedFiles,
    cliHelp,
    headCommit: selectedHeadCommit,
    inputProvenance,
    jinnRoot: cli.jinnRoot,
    mode: cli.mode,
    runTokenSync: (mode, jinnRoot) => {
      execFileSync(
        "pnpm",
        [
          mode === "check" ? "tokens:check" : "tokens:sync",
          "--",
          "--jinn-root",
          jinnRoot,
        ],
        {
          cwd: cli.siteRoot,
          stdio: "inherit",
        },
      );
    },
    siteRoot: cli.siteRoot,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  try {
    runCli();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}

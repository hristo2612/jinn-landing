import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import postcss from "postcss";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const DEFAULT_JINN_ROOT = resolve(PROJECT_ROOT, "../jinn");
const SOURCE_RELATIVE_TO_JINN = "packages/web/src/routes/globals.css";
const PUBLIC_SOURCE_PATH = `../jinn/${SOURCE_RELATIVE_TO_JINN}`;
const OUTPUT_PATH = resolve(
  PROJECT_ROOT,
  "src/styles/generated/ledger-tokens.css",
);

export const INDEPENDENT_TOKEN_ALLOWLIST = [
  "--text-caption2",
  "--text-caption1",
  "--text-footnote",
  "--text-subheadline",
  "--text-body",
  "--text-title3",
  "--text-title2",
  "--text-title1",
  "--text-large-title",
  "--leading-tight",
  "--leading-snug",
  "--leading-normal",
  "--leading-relaxed",
  "--tracking-tight",
  "--tracking-normal",
  "--tracking-wide",
  "--weight-regular",
  "--weight-medium",
  "--weight-semibold",
  "--weight-bold",
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-5",
  "--space-6",
  "--space-8",
  "--space-10",
  "--space-12",
  "--space-16",
  "--safe-top",
  "--safe-bottom",
  "--safe-left",
  "--safe-right",
] as const;

export const THEME_TOKEN_ALLOWLIST = [
  "--font-ui",
  "--font-display",
  "--font-code",
  "--bg",
  "--bg-secondary",
  "--bg-tertiary",
  "--material-regular",
  "--material-thick",
  "--material-thin",
  "--material-ultra-thin",
  "--fill-primary",
  "--fill-secondary",
  "--fill-tertiary",
  "--fill-quaternary",
  "--separator",
  "--separator-opaque",
  "--text-primary",
  "--text-secondary",
  "--text-tertiary",
  "--text-quaternary",
  "--accent",
  "--accent-fill",
  "--accent-contrast",
  "--system-blue",
  "--system-green",
  "--system-red",
  "--system-orange",
  "--system-yellow",
  "--system-purple",
  "--inset-shine",
  "--shadow-subtle",
  "--shadow-ambient",
  "--shadow-key",
  "--shadow-card",
  "--shadow-overlay",
  "--pill-bg",
  "--pill-border",
  "--code-bg",
  "--code-border",
  "--code-text",
  "--ribbon-bg",
  "--sidebar-bg",
  "--sidebar-backdrop",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-2xl",
  "--ease-spring",
  "--ease-smooth",
  "--ease-snappy",
] as const;

export interface TokenContract {
  independent: Record<string, string>;
  dark: Record<string, string>;
  light: Record<string, string>;
}

export interface TokenProvenance {
  sourcePath: string;
  sourceCommit: string;
  contentHash: string;
}

function collectAllowedDeclarations(
  container: postcss.Container,
  allowlist: readonly string[],
): Record<string, string> {
  const values = new Map<string, string>();

  container.walkDecls((declaration) => {
    if (allowlist.includes(declaration.prop)) {
      values.set(declaration.prop, declaration.value);
    }
  });

  return Object.fromEntries(
    allowlist.flatMap((token) => {
      const value = values.get(token);
      return value === undefined ? [] : [[token, value]];
    }),
  );
}

export function getThemeTokenKeys(theme: Record<string, string>): string[] {
  return Object.keys(theme).sort();
}

function assertSymmetricThemes(
  dark: Record<string, string>,
  light: Record<string, string>,
): void {
  const darkKeys = getThemeTokenKeys(dark);
  const lightKeys = getThemeTokenKeys(light);

  if (darkKeys.join("\n") !== lightKeys.join("\n")) {
    const missingFromDark = lightKeys.filter((key) => !darkKeys.includes(key));
    const missingFromLight = darkKeys.filter((key) => !lightKeys.includes(key));
    throw new Error(
      `Ledger theme token keys are asymmetric. Missing from dark: ${missingFromDark.join(", ") || "none"}. Missing from light: ${missingFromLight.join(", ") || "none"}.`,
    );
  }
}

function assertCompleteContract(
  label: "independent" | "dark" | "light",
  tokens: Record<string, string>,
  allowlist: readonly string[],
): void {
  const missing = allowlist.filter((token) => !(token in tokens));
  if (missing.length > 0) {
    throw new Error(
      `Missing required ${label} Ledger tokens: ${missing.join(", ")}.`,
    );
  }
}

export function extractLedgerTokens(sourceCss: string): TokenContract {
  const root = postcss.parse(sourceCss);
  const independentContainers: postcss.Container[] = [];
  const darkRules: postcss.Rule[] = [];
  const lightRules: postcss.Rule[] = [];

  root.walkAtRules("theme", (rule) => {
    independentContainers.push(rule);
  });
  root.walkRules((rule) => {
    const selectors = rule.selector
      .split(",")
      .map((selector) => selector.trim());

    if (rule.selector.trim() === ":root") independentContainers.push(rule);
    if (rule.parent?.type !== "root") return;
    if (selectors.includes('[data-theme="dark"]')) darkRules.push(rule);
    if (selectors.includes('[data-theme="light"]')) lightRules.push(rule);
  });

  if (darkRules.length !== 1)
    throw new Error(
      `Expected exactly one explicit dark theme block; found ${darkRules.length}.`,
    );
  if (lightRules.length !== 1)
    throw new Error(
      `Expected exactly one explicit light theme block; found ${lightRules.length}.`,
    );

  const independent = Object.assign(
    {},
    ...independentContainers.map((container) =>
      collectAllowedDeclarations(container, INDEPENDENT_TOKEN_ALLOWLIST),
    ),
  ) as Record<string, string>;
  const dark = collectAllowedDeclarations(darkRules[0], THEME_TOKEN_ALLOWLIST);
  const light = collectAllowedDeclarations(
    lightRules[0],
    THEME_TOKEN_ALLOWLIST,
  );

  assertCompleteContract(
    "independent",
    independent,
    INDEPENDENT_TOKEN_ALLOWLIST,
  );
  assertCompleteContract("dark", dark, THEME_TOKEN_ALLOWLIST);
  assertCompleteContract("light", light, THEME_TOKEN_ALLOWLIST);
  assertSymmetricThemes(dark, light);

  return { independent, dark, light };
}

export function writeTokenSnapshot(
  outputPath: string,
  generated: string,
): boolean {
  if (existsSync(outputPath) && readFileSync(outputPath, "utf8") === generated)
    return false;
  writeFileSync(outputPath, generated);
  return true;
}

function renderBlock(selector: string, tokens: Record<string, string>): string {
  const declarations = Object.entries(tokens)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join("\n");

  return `${selector} {\n${declarations}\n}`;
}

export function renderLedgerTokens(
  contract: TokenContract,
  provenance: TokenProvenance,
): string {
  assertSymmetricThemes(contract.dark, contract.light);

  return `/**
 * GENERATED FILE - DO NOT EDIT.
 * Source: ${provenance.sourcePath}
 * Source commit: ${provenance.sourceCommit}
 * Content SHA-256: ${provenance.contentHash}
 * Run: pnpm tokens:sync
 */

${renderBlock(":root", contract.independent)}

${renderBlock('[data-theme="dark"]', contract.dark)}

${renderBlock('[data-theme="light"]', contract.light)}
`;
}

export function generateFromCanonicalSource(
  jinnRoot = DEFAULT_JINN_ROOT,
): string {
  const sourceCss = readFileSync(
    resolve(jinnRoot, SOURCE_RELATIVE_TO_JINN),
    "utf8",
  );
  const sourceCommit = execFileSync(
    "git",
    ["rev-list", "-1", "HEAD", "--", SOURCE_RELATIVE_TO_JINN],
    { cwd: jinnRoot, encoding: "utf8" },
  ).trim();
  const contentHash = createHash("sha256").update(sourceCss).digest("hex");

  return renderLedgerTokens(extractLedgerTokens(sourceCss), {
    sourcePath: PUBLIC_SOURCE_PATH,
    sourceCommit,
    contentHash,
  });
}

function main(): void {
  const args = process.argv.slice(2);
  const mode = args.find((arg) => arg === "--write" || arg === "--check");
  const rootIndex = args.indexOf("--jinn-root");
  const rootValue = rootIndex === -1 ? undefined : args[rootIndex + 1];
  if (rootIndex !== -1 && (!rootValue || rootValue.startsWith("--"))) {
    throw new Error("--jinn-root requires a path");
  }
  const jinnRoot = resolve(
    rootValue ?? process.env.JINN_SOURCE_ROOT ?? DEFAULT_JINN_ROOT,
  );
  const generated = generateFromCanonicalSource(jinnRoot);

  if (mode === "--write") {
    const changed = writeTokenSnapshot(OUTPUT_PATH, generated);
    console.log(
      changed
        ? `Updated ${PUBLIC_SOURCE_PATH} token snapshot.`
        : "Ledger token snapshot was already current.",
    );
    return;
  }

  if (mode === "--check") {
    const committed = readFileSync(OUTPUT_PATH, "utf8");
    if (committed !== generated) {
      throw new Error(
        "Ledger token snapshot drifted. Run `pnpm tokens:sync` and commit the result.",
      );
    }
    console.log(
      "Ledger token snapshot is current; fixed contract is complete and light/dark keys are symmetric.",
    );
    return;
  }

  throw new Error(
    "Usage: sync-ledger-tokens.ts --write | --check [--jinn-root <path>]",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}

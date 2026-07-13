import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface SafetyViolation {
  path: string;
  rule: string;
  match: string;
}

const personalIdentifiers = [
  ["hri", "sto"].join(""),
  ["jimmy", "english"].join(""),
  ["prav", "ko"].join(""),
  ["move", "kit"].join(""),
  ["sql", "noir"].join(""),
  ["ho", "my"].join(""),
  ["spy", "cam"].join(""),
  ["aso", "maniac"].join(""),
  ["kiwi", "labs"].join(""),
];

const sanctionedRepositories = [
  `https://github.com/${["hri", "sto", "2612"].join("")}/jinn-landing`,
  `https://github.com/${["hri", "sto", "2612"].join("")}/jinn`,
];
const approvedDomains = new Set([
  "127.0.0.1",
  "answers.netlify.com",
  "astro.build",
  "datatracker.ietf.org",
  "developers.cloudflare.com",
  "docs.astro.build",
  "docs.netlify.com",
  "github.com",
  "gsap.com",
  "jinn.run",
  "openapi.vercel.sh",
  "starlight.astro.build",
  "www.npmjs.com",
  "www.google.com",
  "www.sitemaps.org",
  "www.w3.org",
]);

const textExtensions = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".txt",
  ".yaml",
  ".yml",
]);

function addMatches(
  violations: SafetyViolation[],
  content: string,
  path: string,
  rule: string,
  pattern: RegExp,
) {
  for (const match of content.matchAll(pattern)) {
    violations.push({ path, rule, match: match[0] });
  }
}

export function findPublicSafetyViolations(
  content: string,
  path: string,
): SafetyViolation[] {
  const violations: SafetyViolation[] = [];
  const inspected = sanctionedRepositories.reduce(
    (sanitized, repository) =>
      sanitized.replaceAll(repository, "[sanctioned-repository]"),
    content,
  );

  const normalizedPath = path.replaceAll("\\", "/");
  if (
    (normalizedPath.startsWith("src/") ||
      normalizedPath.startsWith("public/") ||
      normalizedPath.startsWith("dist/")) &&
    inspected.includes(String.fromCodePoint(0x2014))
  ) {
    addMatches(
      violations,
      inspected,
      path,
      "em-dash",
      new RegExp(String.fromCodePoint(0x2014), "gu"),
    );
  }

  for (const identifier of personalIdentifiers) {
    addMatches(
      violations,
      inspected,
      path,
      "personal-identifier",
      new RegExp(`\\b${identifier}\\b`, "giu"),
    );
  }

  addMatches(
    violations,
    inspected,
    path,
    "email",
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
  );
  addMatches(
    violations,
    inspected,
    path,
    "credential",
    /\b(?:sk-[A-Za-z0-9_-]{16,}|xox[a-z]-[A-Za-z0-9-]{10,}|AIza[A-Za-z0-9_-]{20,}|gh[oprsu]_[A-Za-z0-9]{20,}|apify_api_[A-Za-z0-9]{20,})\b/gu,
  );
  addMatches(
    violations,
    inspected,
    path,
    "external-id",
    /\b[CDGU](?=[A-Z0-9]{8,}\b)(?=[A-Z0-9]*\d)[A-Z0-9]{8,}\b/gu,
  );
  addMatches(
    violations,
    inspected,
    path,
    "home-path",
    /\/(?:Users|home)\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*/gu,
  );

  for (const match of inspected.matchAll(/https?:\/\/[^\s)`'"<>*${}]+/gu)) {
    const rawUrl = match[0].replace(/[.,;:]$/u, "");
    try {
      const hostname = new URL(rawUrl).hostname.toLowerCase();
      if (!approvedDomains.has(hostname)) {
        violations.push({ path, rule: "unapproved-domain", match: rawUrl });
      }
    } catch {
      violations.push({ path, rule: "invalid-url", match: rawUrl });
    }
  }

  return violations;
}

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function shouldScan(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  if (
    normalized.startsWith("variants/") ||
    normalized === "pnpm-lock.yaml" ||
    normalized.includes("/node_modules/") ||
    normalized.includes("/.playwright/")
  ) {
    return false;
  }

  return (
    textExtensions.has(extname(normalized)) || normalized.endsWith("/_headers")
  );
}

const generatedVendorArtifacts = [
  // Pagefind copies its own runtime, licenses, and contributor metadata.
  /^dist\/pagefind\//u,
  // Starlight's search UI vendor chunk contains upstream license metadata.
  /^dist\/_astro\/ui-core\.[A-Za-z0-9_-]+\.js$/u,
];

export function isGeneratedArtifactInScope(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  return (
    !generatedVendorArtifacts.some((pattern) => pattern.test(normalized)) &&
    shouldScan(normalized)
  );
}

function scanRepository() {
  const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const sourcePaths = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter(shouldScan)
    .map((path) => resolve(root, path))
    .filter(existsSync);
  const distRoot = resolve(root, "dist");
  const generatedPaths = statSync(distRoot, {
    throwIfNoEntry: false,
  })?.isDirectory()
    ? walk(distRoot).filter((path) =>
        isGeneratedArtifactInScope(relative(root, path)),
      )
    : [];
  const paths = [...new Set([...sourcePaths, ...generatedPaths])];
  const violations = paths.flatMap((path) => {
    const content = readFileSync(path, "utf8");
    return findPublicSafetyViolations(content, relative(root, path));
  });

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`${violation.path}: ${violation.rule}: ${violation.match}`);
    }
    throw new Error(
      `Public safety failed with ${violations.length} violation(s).`,
    );
  }

  console.log(
    `Public safety passed: ${paths.length} source/generated files scanned.`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  scanRepository();
}

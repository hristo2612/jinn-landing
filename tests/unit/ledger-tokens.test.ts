import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  INDEPENDENT_TOKEN_ALLOWLIST,
  THEME_TOKEN_ALLOWLIST,
  extractLedgerTokens,
  generateFromCanonicalSource,
  getThemeTokenKeys,
  renderLedgerTokens,
  writeTokenSnapshot,
} from "../../scripts/sync-ledger-tokens";

interface SourceOptions {
  duplicateDark?: boolean;
  duplicateLight?: boolean;
  omitDark?: string;
  omitIndependent?: string;
  omitLight?: string;
}

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function declarations(tokens: readonly string[], omit?: string): string {
  return tokens
    .filter((token) => token !== omit)
    .map((token, index) => `    ${token}: token-${index};`)
    .join("\n");
}

function completeSource(options: SourceOptions = {}): string {
  const dark = declarations(THEME_TOKEN_ALLOWLIST, options.omitDark);
  const light = declarations(THEME_TOKEN_ALLOWLIST, options.omitLight);

  return `
  @theme {
${declarations(INDEPENDENT_TOKEN_ALLOWLIST, options.omitIndependent)}
    --animate-blink: blink 1s infinite;
  }

  :root, [data-theme="dark"] {
${dark}
    --not-public: hotpink;
  }
  ${options.duplicateDark ? `\n[data-theme="dark"] {\n${dark}\n}` : ""}

  [data-theme="light"] {
${light}
    --not-public: lime;
  }
  ${options.duplicateLight ? `\n[data-theme="light"] {\n${light}\n}` : ""}

  .react-flow__node { color: red; }
`;
}

describe("Ledger token extraction", () => {
  it("generates from an explicit Jinn source root", () => {
    const directory = mkdtempSync(join(tmpdir(), "ledger-source-root-"));
    temporaryDirectories.push(directory);
    const jinnRoot = join(directory, "selected-jinn");
    const source = join(jinnRoot, "packages/web/src/routes/globals.css");
    mkdirSync(join(jinnRoot, "packages/web/src/routes"), { recursive: true });
    writeFileSync(source, completeSource());
    execFileSync("git", ["init", "-q"], { cwd: jinnRoot });
    execFileSync("git", ["add", "."], { cwd: jinnRoot });
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture.invalid",
        "commit",
        "-qm",
        "fixture",
      ],
      { cwd: jinnRoot },
    );
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: jinnRoot,
      encoding: "utf8",
    }).trim();

    const generated = generateFromCanonicalSource(jinnRoot);

    expect(generated).toContain(`Source commit: ${commit}`);
    expect(generated).toContain("--text-caption2: token-0;");
  });

  it("requires and extracts the complete fixed contract without app selectors", () => {
    const contract = extractLedgerTokens(completeSource());

    expect(Object.keys(contract.independent)).toEqual([
      ...INDEPENDENT_TOKEN_ALLOWLIST,
    ]);
    expect(Object.keys(contract.dark)).toEqual([...THEME_TOKEN_ALLOWLIST]);
    expect(Object.keys(contract.light)).toEqual([...THEME_TOKEN_ALLOWLIST]);
    expect(getThemeTokenKeys(contract.dark)).toEqual(
      getThemeTokenKeys(contract.light),
    );

    const output = renderLedgerTokens(contract, {
      sourcePath: "../jinn/packages/web/src/routes/globals.css",
      sourceCommit: "abc123",
      contentHash: "sha256-test",
    });
    expect(output).not.toContain(".react-flow");
    expect(output).not.toContain("--not-public");
    expect(output).not.toContain("@theme");
  });

  it("fails when any required independent token is missing", () => {
    expect(() =>
      extractLedgerTokens(
        completeSource({ omitIndependent: INDEPENDENT_TOKEN_ALLOWLIST[0] }),
      ),
    ).toThrow(/missing required independent.*--text-caption2/i);
  });

  it("fails when any required dark token is missing", () => {
    expect(() =>
      extractLedgerTokens(
        completeSource({ omitDark: THEME_TOKEN_ALLOWLIST[0] }),
      ),
    ).toThrow(/missing required dark.*--font-ui/i);
  });

  it("fails when any required light token is missing", () => {
    expect(() =>
      extractLedgerTokens(
        completeSource({ omitLight: THEME_TOKEN_ALLOWLIST[0] }),
      ),
    ).toThrow(/missing required light.*--font-ui/i);
  });

  it("rejects duplicate or ambiguous explicit theme blocks", () => {
    expect(() =>
      extractLedgerTokens(completeSource({ duplicateDark: true })),
    ).toThrow(/exactly one explicit dark theme block/i);
    expect(() =>
      extractLedgerTokens(completeSource({ duplicateLight: true })),
    ).toThrow(/exactly one explicit light theme block/i);
  });

  it("renders deterministically with provenance", () => {
    const contract = extractLedgerTokens(completeSource());
    const provenance = {
      sourcePath: "../jinn/packages/web/src/routes/globals.css",
      sourceCommit: "abc123",
      contentHash: "sha256-test",
    };

    const first = renderLedgerTokens(contract, provenance);
    const second = renderLedgerTokens(contract, provenance);

    expect(second).toBe(first);
    expect(first).toContain("Source commit: abc123");
    expect(first).toContain("Content SHA-256: sha256-test");
  });

  it("writes snapshots idempotently", () => {
    const directory = mkdtempSync(join(tmpdir(), "ledger-tokens-"));
    temporaryDirectories.push(directory);
    const output = join(directory, "ledger.css");

    expect(writeTokenSnapshot(output, "generated\n")).toBe(true);
    expect(writeTokenSnapshot(output, "generated\n")).toBe(false);
    expect(readFileSync(output, "utf8")).toBe("generated\n");
  });
});

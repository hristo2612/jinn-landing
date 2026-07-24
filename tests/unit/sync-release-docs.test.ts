import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  assertSelectedSourceMatchesHead,
  capturePublicCliHelp,
  classifyReleaseImpact,
  extractChangelogSection,
  resolveInputProvenance,
  syncReleaseDocs,
} from "../../scripts/sync-release-docs";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function fixture(): { jinnRoot: string; siteRoot: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jinn-release-sync-"));
  temporaryDirectories.push(root);
  const jinnRoot = path.join(root, "jinn");
  const siteRoot = path.join(root, "site");

  fs.mkdirSync(path.join(jinnRoot, "packages/jinn"), { recursive: true });
  fs.mkdirSync(path.join(siteRoot, "src/data/cli-help"), { recursive: true });
  fs.mkdirSync(path.join(siteRoot, "src/content/docs/docs/changelog"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(jinnRoot, "packages/jinn/package.json"),
    `${JSON.stringify({ name: "jinn-cli", version: "0.26.0" }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(jinnRoot, "CHANGELOG.md"),
    `# Changelog

## [0.26.0] - 2026-07-11

### ✨ Features
- **Tracked work.** Durable Todos now retain evidence.

### 🐛 Fixes
- A literal line stays exactly as authored -- no generated prose.

## [0.25.0] - 2026-07-07

### 🐛 Fixes
- Previous release.
`,
  );
  fs.writeFileSync(
    path.join(siteRoot, "src/data/release.json"),
    `${JSON.stringify(
      {
        version: "0.25.0",
        releasedAt: "2026-07-07",
        stable: true,
        changelogPath: "/docs/changelog/0.26.0/",
        upcomingVersion: "0.26.0",
        sourcePin: "a".repeat(40),
        contractTarget: "source",
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    path.join(siteRoot, "src/data/cli-help/0.25.0.txt"),
    "Usage: jinn [options]\n\nCommands:\n  start\n",
  );

  return { jinnRoot, siteRoot };
}

describe("release changelog extraction", () => {
  it("returns the exact matching release section and date", () => {
    const changelog = `# Changelog\n\n## [1.2.3] - 2026-07-11\n\n### Fixes\n- Keep **this**.\n\n## [1.2.2] - 2026-07-10\n- Older.\n`;

    expect(extractChangelogSection(changelog, "1.2.3")).toEqual({
      date: "2026-07-11",
      markdown: "## [1.2.3] - 2026-07-11\n\n### Fixes\n- Keep **this**.\n",
    });
  });

  it("fails instead of inventing notes when the package version is absent", () => {
    expect(() => extractChangelogSection("# Changelog\n", "9.9.9")).toThrow(
      /CHANGELOG\.md has no exact section for 9\.9\.9/u,
    );
  });
});

describe("release impact classification", () => {
  it("classifies the real identity and authority policy roots without matching consumers", () => {
    const impact = classifyReleaseImpact([
      "packages/jinn/src/mcp/identity.ts",
      "packages/jinn/src/gateway/session-comm-guards.ts",
      "packages/jinn/src/workflows/custom-triggers.ts",
      "packages/jinn/src/mcp/__tests__/identity-restart.test.ts",
      "packages/jinn/src/gateway/__tests__/session-comm-guards.test.ts",
      "packages/jinn/src/mcp/toolkit.ts",
      "packages/jinn/src/work-items/workflow-bridge.ts",
    ]);

    expect(impact.categories.authentication).toEqual([
      "packages/jinn/src/gateway/session-comm-guards.ts",
      "packages/jinn/src/mcp/identity.ts",
      "packages/jinn/src/workflows/custom-triggers.ts",
    ]);
    expect(impact.docsReviewAreas).toEqual([
      "src/content/docs/docs/reference/gateway-api/",
      "src/content/machine/agents.md",
    ]);
  });

  it("maps source diffs to explicit technical-review areas", () => {
    const impact = classifyReleaseImpact([
      "packages/jinn/src/gateway/api.ts",
      "packages/jinn/src/gateway/routes/public.ts",
      "packages/jinn/src/gateway/files.ts",
      "packages/jinn/src/gateway/hook-endpoint.ts",
      "packages/jinn/src/gateway/auth.ts",
      "packages/jinn/src/gateway/approval-authority.ts",
      "packages/jinn/bin/jinn.ts",
      "packages/jinn/src/shared/config.ts",
      "packages/jinn/src/shared/types.ts",
      "packages/jinn/src/cli/setup.ts",
      "packages/jinn/template/config.yaml",
      "packages/jinn/template/migrations/0.26.0/MIGRATION.md",
      "packages/web/src/routes/globals.css",
      "README.md",
    ]);

    expect(impact.categories.gatewayRoutes).toEqual([
      "packages/jinn/src/gateway/api.ts",
      "packages/jinn/src/gateway/files.ts",
      "packages/jinn/src/gateway/hook-endpoint.ts",
      "packages/jinn/src/gateway/routes/public.ts",
    ]);
    expect(impact.categories.authentication).toEqual([
      "packages/jinn/src/gateway/approval-authority.ts",
      "packages/jinn/src/gateway/auth.ts",
    ]);
    expect(impact.categories.commander).toEqual([
      "packages/jinn/bin/jinn.ts",
      "packages/jinn/src/cli/setup.ts",
    ]);
    expect(impact.categories.config).toEqual([
      "packages/jinn/src/cli/setup.ts",
      "packages/jinn/src/shared/config.ts",
      "packages/jinn/src/shared/types.ts",
      "packages/jinn/template/config.yaml",
    ]);
    expect(impact.categories.templatesAndMigrations).toEqual([
      "packages/jinn/template/config.yaml",
      "packages/jinn/template/migrations/0.26.0/MIGRATION.md",
    ]);
    expect(impact.categories.ledgerTokens).toEqual([
      "packages/web/src/routes/globals.css",
    ]);
    expect(impact.docsReviewAreas).toEqual([
      "src/content/docs/docs/getting-started/configuration.md",
      "src/content/docs/docs/getting-started/update-and-migrate.md",
      "src/content/docs/docs/reference/cli/",
      "src/content/docs/docs/reference/gateway-api/",
      "src/content/docs/docs/reference/cli/migrations.md",
      "src/content/machine/agents.md",
      "src/styles/generated/ledger-tokens.css",
    ]);
    expect(impact.tokenSyncRequired).toBe(true);
  });
});

describe("syncReleaseDocs", () => {
  it("resets a previous npm contract to the new source-pinned release", () => {
    const { jinnRoot, siteRoot } = fixture();
    fs.writeFileSync(
      path.join(siteRoot, "src/data/release.json"),
      `${JSON.stringify(
        {
          version: "0.25.0",
          releasedAt: "2026-07-07",
          stable: true,
          changelogPath: "/docs/changelog/0.25.0/",
          contractTarget: "npm",
        },
        null,
        2,
      )}\n`,
    );

    const options = {
      changedFiles: [],
      cliHelp: "Usage: jinn\n",
      headCommit: "e".repeat(40),
      jinnRoot,
      siteRoot,
    };
    syncReleaseDocs({ ...options, mode: "write" });

    expect(
      JSON.parse(
        fs.readFileSync(path.join(siteRoot, "src/data/release.json"), "utf8"),
      ),
    ).toMatchObject({
      version: "0.26.0",
      sourcePin: "e".repeat(40),
      contractTarget: "source",
    });

    const reviewed = JSON.parse(
      fs.readFileSync(path.join(siteRoot, "src/data/release.json"), "utf8"),
    ) as Record<string, unknown>;
    reviewed.contractTarget = "npm";
    delete reviewed.sourcePin;
    fs.writeFileSync(
      path.join(siteRoot, "src/data/release.json"),
      `${JSON.stringify(reviewed, null, 2)}\n`,
    );
    expect(() => syncReleaseDocs({ ...options, mode: "check" })).not.toThrow();
  });

  it("writes only deterministic release artifacts and is idempotent", () => {
    const { jinnRoot, siteRoot } = fixture();
    const tokenModes: string[] = [];
    const options = {
      changedFiles: [
        "packages/jinn/src/gateway/api.ts",
        " packages/jinn/src/gateway/api.ts ",
        "packages/jinn/bin/jinn.ts",
        "packages/web/src/routes/globals.css",
      ],
      cliHelp: "Usage: jinn [options]\n\nCommands:\n  start\n  workflow\n",
      headCommit: "b".repeat(40),
      jinnRoot,
      mode: "write" as const,
      runTokenSync: (mode: "check" | "write", sourceRoot: string) =>
        tokenModes.push(`${mode}:${sourceRoot}`),
      siteRoot,
    };

    const first = syncReleaseDocs(options);
    const second = syncReleaseDocs(options);

    expect(first.changedOwnedFiles).toEqual([
      "src/data/release.json",
      "src/content/docs/docs/changelog/0.26.0.md",
      "src/data/cli-help/0.26.0.txt",
      "src/data/release-impact.json",
    ]);
    expect(second.changedOwnedFiles).toEqual([]);
    expect(tokenModes).toEqual([`write:${jinnRoot}`, `check:${jinnRoot}`]);
    expect(
      JSON.parse(
        fs.readFileSync(path.join(siteRoot, "src/data/release.json"), "utf8"),
      ),
    ).toEqual({
      version: "0.26.0",
      releasedAt: "2026-07-11",
      stable: true,
      changelogPath: "/docs/changelog/0.26.0/",
      sourcePin: "b".repeat(40),
      contractTarget: "source",
    });
    expect(
      fs.readFileSync(
        path.join(siteRoot, "src/content/docs/docs/changelog/0.26.0.md"),
        "utf8",
      ),
    ).toContain(
      "## [0.26.0] - 2026-07-11\n\n### ✨ Features\n\n- **Tracked work.** Durable Todos now retain evidence.\n\n### 🐛 Fixes\n\n- A literal line stays exactly as authored -- no generated prose.\n",
    );
    expect(
      fs.readFileSync(
        path.join(siteRoot, "src/data/cli-help/0.26.0.txt"),
        "utf8",
      ),
    ).toBe("Usage: jinn [options]\n\nCommands:\n  start\n  workflow\n");

    const report = JSON.parse(
      fs.readFileSync(
        path.join(siteRoot, "src/data/release-impact.json"),
        "utf8",
      ),
    );
    expect(report).toMatchObject({
      schemaVersion: 1,
      version: "0.26.0",
      sourceCommit: "b".repeat(40),
      cliHelp: { changed: true, previousVersion: "0.25.0" },
      tokenSync: { required: true, command: "pnpm tokens:sync" },
    });
    expect(report.changedSourceFiles).toEqual([
      "packages/jinn/bin/jinn.ts",
      "packages/jinn/src/gateway/api.ts",
      "packages/web/src/routes/globals.css",
    ]);
    expect(report.docsReviewAreas).toContain(
      "src/content/docs/docs/reference/gateway-api/",
    );
  });

  it("check mode detects drift without writing and uses token check", () => {
    const { jinnRoot, siteRoot } = fixture();
    const releaseBefore = fs.readFileSync(
      path.join(siteRoot, "src/data/release.json"),
      "utf8",
    );
    const tokenModes: string[] = [];

    expect(() =>
      syncReleaseDocs({
        changedFiles: ["packages/web/src/routes/globals.css"],
        cliHelp: "Usage: jinn\n",
        headCommit: "c".repeat(40),
        jinnRoot,
        mode: "check",
        runTokenSync: (mode, sourceRoot) =>
          tokenModes.push(`${mode}:${sourceRoot}`),
        siteRoot,
      }),
    ).toThrow(/release docs are out of sync/u);
    expect(tokenModes).toEqual([`check:${jinnRoot}`]);
    expect(
      fs.readFileSync(path.join(siteRoot, "src/data/release.json"), "utf8"),
    ).toBe(releaseBefore);
    expect(
      fs.existsSync(path.join(siteRoot, "src/data/release-impact.json")),
    ).toBe(false);
  });

  it("dry-run reports planned changes without writing or syncing tokens", () => {
    const { jinnRoot, siteRoot } = fixture();
    let tokenCalls = 0;

    const result = syncReleaseDocs({
      changedFiles: ["packages/web/src/routes/globals.css"],
      cliHelp: "Usage: jinn\n",
      headCommit: "d".repeat(40),
      jinnRoot,
      mode: "dry-run",
      runTokenSync: () => {
        tokenCalls += 1;
      },
      siteRoot,
    });

    expect(result.changedOwnedFiles).toHaveLength(4);
    expect(result.impact.tokenSync.required).toBe(true);
    expect(tokenCalls).toBe(0);
    expect(
      fs.existsSync(path.join(siteRoot, "src/data/release-impact.json")),
    ).toBe(false);
  });
});

describe("public CLI help capture", () => {
  it("executes and validates the selected TypeScript source instead of stale dist", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jinn-cli-source-"));
    temporaryDirectories.push(root);
    fs.mkdirSync(path.join(root, "packages/jinn/bin"), { recursive: true });
    fs.mkdirSync(path.join(root, "packages/jinn/dist/bin"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, "packages/jinn/package.json"),
      `${JSON.stringify({ version: "1.2.3" }, null, 2)}\n`,
    );
    fs.writeFileSync(
      path.join(root, "packages/jinn/bin/jinn.ts"),
      `const value: string = process.argv.includes("--version") ? "1.2.3" : "SOURCE HELP";\nconsole.log(value);\n`,
    );
    fs.writeFileSync(
      path.join(root, "packages/jinn/dist/bin/jinn.js"),
      `console.log("STALE DIST");\n`,
    );

    expect(capturePublicCliHelp(root, "1.2.3", process.execPath)).toBe(
      "$ jinn --help\nSOURCE HELP\n",
    );
  });

  it("rejects source whose public version disagrees with package truth", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jinn-cli-version-"));
    temporaryDirectories.push(root);
    fs.mkdirSync(path.join(root, "packages/jinn/bin"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "packages/jinn/package.json"),
      `${JSON.stringify({ version: "1.2.3" }, null, 2)}\n`,
    );
    fs.writeFileSync(
      path.join(root, "packages/jinn/bin/jinn.ts"),
      `console.log(process.argv.includes("--version") ? "9.9.9" : "HELP");\n`,
    );

    expect(() => capturePublicCliHelp(root, "1.2.3", process.execPath)).toThrow(
      /CLI source reports 9\.9\.9 but package version is 1\.2\.3/u,
    );
  });

  it("captures deterministic command and nested-subcommand help", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jinn-cli-tree-"));
    temporaryDirectories.push(root);
    fs.mkdirSync(path.join(root, "packages/jinn/bin"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "packages/jinn/package.json"),
      `${JSON.stringify({ version: "1.2.3" }, null, 2)}\n`,
    );
    fs.writeFileSync(
      path.join(root, "packages/jinn/bin/jinn.ts"),
      `const args: string[] = process.argv.slice(2);\nif (args.includes("--version")) console.log("1.2.3");\nelse if (args[0] === "alpha" && args[1] === "beta") console.log("Usage: jinn alpha beta [options]");\nelse if (args[0] === "alpha") console.log("Usage: jinn alpha [options]\\n\\nCommands:\\n  beta  Nested command");\nelse console.log("Usage: jinn [options] [command]\\n\\nCommands:\\n  alpha  Parent command");\n`,
    );

    const help = capturePublicCliHelp(root, "1.2.3", process.execPath);

    expect(help).toContain("$ jinn --help\n");
    expect(help).toContain("$ jinn alpha --help\n");
    expect(help).toContain("$ jinn alpha beta --help\n");
    expect(help.indexOf("$ jinn --help")).toBeLessThan(
      help.indexOf("$ jinn alpha --help"),
    );
  });
});

describe("selected release source provenance", () => {
  it("requires fixture changed-files, CLI help, and head commit together", () => {
    expect(
      resolveInputProvenance({
        changedFilesFile: undefined,
        cliHelpFile: undefined,
        headCommit: undefined,
      }),
    ).toBe("selected-head");
    expect(
      resolveInputProvenance({
        changedFilesFile: "/fixture/changed.txt",
        cliHelpFile: "/fixture/help.txt",
        headCommit: "a".repeat(40),
      }),
    ).toBe("fixture");
    for (const partial of [
      { cliHelpFile: "/fixture/help.txt" },
      { changedFilesFile: "/fixture/changed.txt" },
      {
        changedFilesFile: "/fixture/changed.txt",
        cliHelpFile: "/fixture/help.txt",
      },
      { headCommit: "a".repeat(40) },
    ]) {
      expect(() => resolveInputProvenance(partial)).toThrow(
        /--changed-files-file, --cli-help-file, and --head-commit must be supplied together/u,
      );
    }
  });

  it("rejects package, changelog, or Commander source drift from the head ref", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jinn-head-truth-"));
    temporaryDirectories.push(root);
    fs.mkdirSync(path.join(root, "packages/jinn/bin"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "packages/jinn/package.json"),
      `${JSON.stringify({ version: "1.2.3" })}\n`,
    );
    fs.writeFileSync(
      path.join(root, "CHANGELOG.md"),
      "# Changelog\n\n## [1.2.3] - 2026-07-11\n- Truth.\n",
    );
    fs.writeFileSync(
      path.join(root, "packages/jinn/bin/jinn.ts"),
      'console.log("truth");\n',
    );
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture.invalid",
        "commit",
        "-qm",
        "truth",
      ],
      { cwd: root },
    );
    const head = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    fs.writeFileSync(
      path.join(root, "packages/jinn/bin/jinn.ts"),
      'console.log("ambient drift");\n',
    );

    expect(() => assertSelectedSourceMatchesHead(root, head)).toThrow(
      /selected head .* differs from working packages\/jinn\/bin\/jinn\.ts/u,
    );
  });

  it("records the peeled commit for an annotated release tag", () => {
    const { jinnRoot, siteRoot } = fixture();
    fs.mkdirSync(path.join(jinnRoot, "packages/jinn/bin"), { recursive: true });
    fs.writeFileSync(
      path.join(jinnRoot, "packages/jinn/bin/jinn.ts"),
      `const args: string[] = process.argv.slice(2);\nif (args.includes("--version")) console.log("0.26.0");\nelse console.log("Usage: jinn [options]");\n`,
    );
    execFileSync("git", ["init", "-q"], { cwd: jinnRoot });
    execFileSync("git", ["config", "user.name", "Fixture"], {
      cwd: jinnRoot,
    });
    execFileSync("git", ["config", "user.email", "fixture.invalid"], {
      cwd: jinnRoot,
    });
    execFileSync("git", ["add", "."], { cwd: jinnRoot });
    execFileSync("git", ["commit", "-qm", "base"], { cwd: jinnRoot });
    const baseCommit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: jinnRoot,
      encoding: "utf8",
    }).trim();
    fs.writeFileSync(path.join(jinnRoot, "RELEASE"), "0.26.0\n");
    execFileSync("git", ["add", "RELEASE"], { cwd: jinnRoot });
    execFileSync("git", ["commit", "-qm", "release"], { cwd: jinnRoot });
    execFileSync("git", ["tag", "-am", "release 0.26.0", "v0.26.0"], {
      cwd: jinnRoot,
    });
    const tagObject = execFileSync("git", ["rev-parse", "v0.26.0"], {
      cwd: jinnRoot,
      encoding: "utf8",
    }).trim();
    const releaseCommit = execFileSync(
      "git",
      ["rev-parse", "v0.26.0^{commit}"],
      { cwd: jinnRoot, encoding: "utf8" },
    ).trim();
    expect(tagObject).not.toBe(releaseCommit);

    const result = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        path.resolve("scripts/sync-release-docs.ts"),
        "--jinn-root",
        jinnRoot,
        "--site-root",
        siteRoot,
        "--base-ref",
        baseCommit,
        "--head-ref",
        "v0.26.0",
        "--dry-run",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status, result.stderr).toBe(0);
    const output = JSON.parse(result.stdout) as {
      impact: { sourceCommit: string };
    };
    expect(output.impact.sourceCommit).toBe(releaseCommit);
  });

  it("rejects a head ref that does not resolve to a commit", () => {
    const { jinnRoot, siteRoot } = fixture();
    fs.mkdirSync(path.join(jinnRoot, "packages/jinn/bin"), { recursive: true });
    fs.writeFileSync(
      path.join(jinnRoot, "packages/jinn/bin/jinn.ts"),
      'console.log("unused");\n',
    );
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
        "base",
      ],
      { cwd: jinnRoot },
    );
    const blob = execFileSync("git", ["hash-object", "-w", "--stdin"], {
      cwd: jinnRoot,
      encoding: "utf8",
      input: "not a commit\n",
    }).trim();
    execFileSync("git", ["update-ref", "refs/tags/blob-ref", blob], {
      cwd: jinnRoot,
    });

    const result = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        path.resolve("scripts/sync-release-docs.ts"),
        "--jinn-root",
        jinnRoot,
        "--site-root",
        siteRoot,
        "--base-ref",
        "HEAD",
        "--head-ref",
        "blob-ref",
        "--dry-run",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(
      /head ref "blob-ref" does not resolve to a commit/u,
    );
  });
});

describe("release:sync package command", () => {
  it("accepts pnpm's conventional separator before fixture dry-run options", () => {
    const { jinnRoot, siteRoot } = fixture();
    const fixtureRoot = path.dirname(jinnRoot);
    const changedFiles = path.join(fixtureRoot, "changed-files.txt");
    const cliHelp = path.join(fixtureRoot, "cli-help.txt");
    fs.writeFileSync(changedFiles, "packages/jinn/bin/jinn.ts\n");
    fs.writeFileSync(cliHelp, "Usage: jinn fixture\n");

    const result = spawnSync(
      "pnpm",
      [
        "release:sync",
        "--",
        "--jinn-root",
        jinnRoot,
        "--site-root",
        siteRoot,
        "--changed-files-file",
        changedFiles,
        "--cli-help-file",
        cliHelp,
        "--head-commit",
        "f".repeat(40),
        "--dry-run",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('"inputProvenance": "fixture"');
    expect(
      fs.existsSync(path.join(siteRoot, "src/data/release-impact.json")),
    ).toBe(false);

    const unknown = spawnSync(
      "pnpm",
      ["release:sync", "--", "--definitely-unknown"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(unknown.status).toBe(1);
    expect(unknown.stderr).toContain("unknown option: --definitely-unknown");
  });
});

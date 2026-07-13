import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const docsRoot = path.resolve("src/content/docs/docs");

const expectedPages = [
  "index.md",
  "getting-started/install.md",
  "getting-started/first-company.md",
  "getting-started/configuration.md",
  "getting-started/update-and-migrate.md",
  "core-concepts/gateway-and-local-first.md",
  "core-concepts/employees.md",
  "core-concepts/sessions-and-delegation.md",
  "core-concepts/todos.md",
  "core-concepts/workflows.md",
  "core-concepts/triggers.md",
  "core-concepts/approvals.md",
  "core-concepts/mcp.md",
  "guides/build-an-ai-team.md",
  "guides/connect-slack.md",
  "guides/schedule-work.md",
  "guides/create-a-workflow.md",
  "guides/add-and-manage-skills.md",
  "guides/pair-another-device.md",
  "reference/gateway-api/authentication.md",
  "reference/gateway-api/engines-and-limits.md",
  "reference/gateway-api/sessions-and-delegation.md",
  "reference/gateway-api/todos.md",
  "reference/gateway-api/workflows-and-triggers.md",
  "reference/gateway-api/org-skills-and-knowledge.md",
  "reference/gateway-api/cron-and-connectors.md",
  "reference/gateway-api/files-and-media.md",
  "reference/cli/lifecycle.md",
  "reference/cli/instances.md",
  "reference/cli/pairing-and-limits.md",
  "reference/cli/skills.md",
  "reference/cli/migrations.md",
  "changelog/index.md",
  "changelog/0.25.0.md",
  "changelog/0.26.0.md",
] as const;

function frontmatter(markdown: string): string {
  const match = /^---\n([\s\S]*?)\n---\n/u.exec(markdown);
  expect(match, "page must start with YAML frontmatter").not.toBeNull();
  return match![1];
}

function semverTuple(version: string): [number, number, number] {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(version);
  expect(match, `invalid stable semver: ${version}`).not.toBeNull();
  return [Number(match![1]), Number(match![2]), Number(match![3])];
}

function compareSemver(left: string, right: string): number {
  const a = semverTuple(left);
  const b = semverTuple(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

describe("documentation content contract", () => {
  it("contains the complete C2 information architecture", () => {
    const actual = expectedPages.filter((file) =>
      fs.existsSync(path.join(docsRoot, file)),
    );
    expect(actual).toEqual(expectedPages);
  });

  it("requires every page to carry the release-sync frontmatter contract", () => {
    const release = JSON.parse(
      fs.readFileSync("src/data/release.json", "utf8"),
    ) as {
      version: string;
      stable: boolean;
      upcomingVersion: string;
      sourcePin: string;
      contractTarget: string;
    };
    expect(release.stable).toBe(true);
    expect(release.contractTarget).toBe("source");
    expect(release.sourcePin).toMatch(/^[0-9a-f]{40}$/u);

    const authoredPages = fs
      .readdirSync(docsRoot, { recursive: true })
      .filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.endsWith(".md"),
      );
    expect(authoredPages.sort()).toEqual([...expectedPages].sort());
    for (const relative of authoredPages) {
      const markdown = fs.readFileSync(path.join(docsRoot, relative), "utf8");
      const yaml = frontmatter(markdown);
      for (const field of [
        "title",
        "description",
        "since",
        "source",
        "audience",
        "generated",
      ]) {
        expect(yaml, `${relative} is missing ${field}`).toMatch(
          new RegExp(`^${field}:`, "m"),
        );
      }
      const since = /^since:\s*["']?([^"'\n]+)["']?$/mu.exec(yaml)?.[1];
      expect(
        since,
        `${relative} is missing a parseable since version`,
      ).toBeDefined();
      expect(
        compareSemver(since!, release.upcomingVersion),
        `${relative} cannot postdate upcoming ${release.upcomingVersion}`,
      ).toBeLessThanOrEqual(0);
    }
  });

  it("ships the pinned upcoming machine contract", () => {
    const agents = fs.readFileSync("src/content/machine/agents.md", "utf8");
    expect(agents.length).toBeGreaterThan(4_000);
    expect(agents).toContain("POST /api/sessions");
    expect(agents).toContain("GET /api/engines");
    expect(agents).toContain("GET /api/engine-limits");
    expect(agents).toContain("multipart/form-data");
    expect(agents).toContain("gateway.json");
    expect(agents).toContain("POST /api/delegations");
    expect(agents).toContain("GET /api/work-items");
    expect(agents).toContain("POST /api/workflow-events");
    expect(agents).toContain("find_employees");

    const release = JSON.parse(
      fs.readFileSync("src/data/release.json", "utf8"),
    );
    expect(release).toMatchObject({
      version: "0.25.0",
      upcomingVersion: "0.26.0",
      contractTarget: "source",
    });
  });

  it("uses executable source-pinned migration guidance and the current marker", () => {
    const migrationPages = [
      "getting-started/configuration.md",
      "getting-started/update-and-migrate.md",
      "reference/cli/migrations.md",
      "changelog/0.26.0.md",
    ].map((file) => fs.readFileSync(path.join(docsRoot, file), "utf8"));
    const migrationCorpus = migrationPages.join("\n");

    expect(migrationCorpus).not.toMatch(/jinn migrate --(?:check|auto)\b/u);
    expect(migrationCorpus).not.toMatch(
      /(?:jinn\.version:\s*|jinn migrate --mark-done )"?0\.25\.0/u,
    );
    expect(migrationPages[0]).toContain('version: "0.26.0"');
    expect(migrationPages[3]).toContain("`jinn migrate`");
    expect(migrationPages[3]).toContain("`jinn migrate --apply`");
  });

  it("documents external attachments with multipart bytes and managed IDs", () => {
    const filesAndMedia = fs.readFileSync(
      path.join(docsRoot, "reference/gateway-api/files-and-media.md"),
      "utf8",
    );
    const runtimeContract = fs.readFileSync(
      "scripts/check-docs-release-contract.ts",
      "utf8",
    );

    expect(filesAndMedia).not.toContain('-d \'{"path":"./report.pdf"');
    expect(filesAndMedia).toContain('-F "file=@./report.pdf"');
    expect(filesAndMedia).toContain("FILE_ID=");
    expect(filesAndMedia).toContain('"attachments":["$FILE_ID"]');
    expect(runtimeContract).toContain(
      '"reference/gateway-api/files-and-media.md"',
    );
    expect(runtimeContract).toMatch(
      /assertDocumentedInlineShape\(\s*filesAndMedia,/u,
    );
  });

  it("curates engine and limit discovery in the human API reference", () => {
    const relative = "reference/gateway-api/engines-and-limits.md";
    const absolute = path.join(docsRoot, relative);
    expect(fs.existsSync(absolute)).toBe(true);
    if (!fs.existsSync(absolute)) return;

    const enginesAndLimits = fs.readFileSync(absolute, "utf8");
    const runtimeContract = fs.readFileSync(
      "scripts/check-docs-release-contract.ts",
      "utf8",
    );
    expect(enginesAndLimits).toContain("GET /api/engines");
    expect(enginesAndLimits).toContain("GET /api/engine-limits");
    expect(enginesAndLimits).toContain("`{default,engines}`");
    expect(enginesAndLimits).toContain("`{generatedAt,default,engines}`");
    expect(runtimeContract).toContain(
      '"reference/gateway-api/engines-and-limits.md"',
    );
    expect(runtimeContract).toMatch(
      /assertDocumentedInlineShape\(\s*enginesAndLimits,/u,
    );
  });

  it("documents direct sessions with null employee and configured selections", () => {
    const agents = fs.readFileSync("src/content/machine/agents.md", "utf8");
    const runtimeContract = fs.readFileSync(
      "scripts/check-docs-release-contract.ts",
      "utf8",
    );
    const introduction =
      "A direct response has this stable shape (IDs/timestamps/title vary):";
    const example = /```json\n([\s\S]*?)\n```/u.exec(
      agents.slice(agents.indexOf(introduction) + introduction.length),
    );
    expect(example).not.toBeNull();
    expect(JSON.parse(example![1])).toMatchObject({ employee: null });
    expect(agents).toMatch(
      /engine, model, and effortLevel values vary by configuration/iu,
    );
    expect(runtimeContract).toContain("assert.equal(body.employee, null)");
  });

  it("advertises the pinned upcoming four-block surface", () => {
    const content = [
      ...fs
        .readdirSync(docsRoot, { recursive: true })
        .filter(
          (entry): entry is string =>
            typeof entry === "string" && entry.endsWith(".md"),
        )
        .map((entry) => fs.readFileSync(path.join(docsRoot, entry), "utf8")),
      fs.readFileSync("src/content/machine/agents.md", "utf8"),
      fs.readFileSync("src/content/machine/llms.md", "utf8"),
    ].join("\n");

    expect(content).toContain("/api/delegations");
    expect(content).toContain("/api/work-items");
    expect(content).toContain("/api/workflow-events");
    expect(content).toContain('since: "0.26.0"');
  });

  it("keeps the source/npm release contract in the required check gate", () => {
    expect(fs.existsSync("scripts/check-docs-release-contract.ts")).toBe(true);
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts.check).toContain("docs:contract");
    expect(packageJson.scripts["docs:contract"]).toBe(
      "tsx scripts/check-docs-release-contract.ts",
    );
  });
});

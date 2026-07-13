import fs from "node:fs";

import { describe, expect, it } from "vitest";

import { assertDocumentedInlineShape } from "../../scripts/lib/machine-contract";

describe("machine contract prose binding", () => {
  const agents = fs.readFileSync("src/content/machine/agents.md", "utf8");
  const engineResponse = { default: "claude", engines: {} };

  it("accepts the documented fields when the live envelope contains them", () => {
    expect(() =>
      assertDocumentedInlineShape(
        agents,
        "`GET /api/engines` returns ",
        engineResponse,
      ),
    ).not.toThrow();
  });

  it("rejects the reviewer's false providers field mutation", () => {
    const mutated = agents.replace(
      "`GET /api/engines` returns `{default,engines}`",
      "`GET /api/engines` returns `{default,providers}`",
    );
    expect(mutated).not.toBe(agents);
    expect(() =>
      assertDocumentedInlineShape(
        mutated,
        "`GET /api/engines` returns ",
        engineResponse,
      ),
    ).toThrow('documented field "providers" is missing');
  });

  it("binds nested field fragments such as bounded-tail pagination", () => {
    expect(() =>
      assertDocumentedInlineShape(agents, "bounded-tail reads also include ", {
        messagesPage: { hasOlder: false },
      }),
    ).not.toThrow();
  });

  it("allows explicitly optional documented fields to be omitted", () => {
    expect(() =>
      assertDocumentedInlineShape(agents, "`POST /api/cron/:id/trigger` → ", {
        triggered: true,
        jobId: "job-id",
        name: "Job",
        message: "Triggered",
      }),
    ).not.toThrow();
  });
});

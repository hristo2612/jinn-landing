import { describe, expect, it } from "vitest";

import { renderLlmsTxt } from "../../src/lib/llms-txt";

describe("llms.txt generator", () => {
  it("renders the pinned upcoming version, canonical sections, and machine links", () => {
    const text = renderLlmsTxt({
      version: "0.25.0",
      releasedAt: "2026-07-07",
      stable: true,
      upcomingVersion: "0.26.0",
      sourcePin: "b534e88de17b66f3e2c089cde8fcf8763ca3e069",
    });

    expect(text).toMatch(/^# Jinn$/m);
    expect(text).toContain("Current documented version: 0.26.0");
    expect(text).toContain("Release status: upcoming; source pin: b534e88");
    expect(text).toContain("https://jinn.run/docs/getting-started/install/");
    expect(text).toContain(
      "https://jinn.run/docs/core-concepts/gateway-and-local-first/",
    );
    expect(text).toContain("https://jinn.run/docs/guides/build-an-ai-team/");
    expect(text).toContain(
      "https://jinn.run/docs/reference/gateway-api/authentication/",
    );
    expect(text).toContain("https://jinn.run/docs/reference/cli/lifecycle/");
    expect(text).toContain("https://jinn.run/docs/changelog/0.26.0/");
    expect(text).toContain("https://jinn.run/agents.md");
    expect(text).toContain("https://www.npmjs.com/package/jinn-cli");
  });
});

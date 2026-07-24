import { describe, expect, it } from "vitest";

import {
  findPublicSafetyViolations,
  isGeneratedArtifactInScope,
} from "../../scripts/check-public-safety";

describe("public safety guard", () => {
  it("accepts generic content, sanctioned repositories, and deployment metadata", () => {
    const account = ["hri", "sto", "2612"].join("");
    const productRepository = `https://github.com/${account}/jinn`;
    const websiteRepository = `https://github.com/${account}/jinn-landing`;
    expect(
      findPublicSafetyViolations(
        [
          "The operator runs a local gateway.",
          productRepository,
          websiteRepository,
          "https://openapi.vercel.sh/vercel.json",
        ].join("\n"),
        "src/example.ts",
      ),
    ).toEqual([]);
  });

  it("rejects personal identifiers, contact data, secrets, real IDs, and home paths", () => {
    const unsafe = [
      ["Hri", "sto"].join(""),
      ["Prav", "ko"].join(""),
      ["person", "@", "example.com"].join(""),
      ["sk-", "1234567890abcdef"].join(""),
      ["C", "0AQD2ZB5EE"].join(""),
      ["/", "Users/", "operator/private"].join(""),
    ].join("\n");

    const rules = findPublicSafetyViolations(unsafe, "src/example.ts").map(
      ({ rule }) => rule,
    );
    expect(rules).toEqual(
      expect.arrayContaining([
        "personal-identifier",
        "email",
        "credential",
        "external-id",
        "home-path",
      ]),
    );
  });

  it("rejects domains outside the documented allow-list", () => {
    const unapprovedUrl = `https://${["tracking", "invalid"].join(".")}/collect`;
    expect(findPublicSafetyViolations(unapprovedUrl, "src/example.ts")).toEqual(
      [expect.objectContaining({ rule: "unapproved-domain" })],
    );
  });

  it("rejects em dashes from public website source and built output", () => {
    const emDash = String.fromCodePoint(0x2014);
    expect(
      findPublicSafetyViolations(
        `Before ${emDash} after`,
        "src/components/example.astro",
      ),
    ).toEqual([expect.objectContaining({ rule: "em-dash" })]);
    expect(
      findPublicSafetyViolations(`Before ${emDash} after`, "dist/index.html"),
    ).toEqual([expect.objectContaining({ rule: "em-dash" })]);
    expect(
      findPublicSafetyViolations(
        `Internal ${emDash} planning note`,
        "docs/superpowers/plans/example.md",
      ),
    ).toEqual([]);
  });

  it("preserves byte-exact generated CLI help while keeping safety checks active", () => {
    const emDash = String.fromCodePoint(0x2014);
    expect(
      findPublicSafetyViolations(
        `Restart the gateway ${emDash} safely`,
        "src/data/cli-help/0.28.1.txt",
      ),
    ).toEqual([]);

    const unsafe = [
      `Restart the gateway ${emDash} safely`,
      ["person", "@", "example.com"].join(""),
    ].join("\n");
    expect(
      findPublicSafetyViolations(unsafe, "src/data/cli-help/0.28.1.txt"),
    ).toEqual([expect.objectContaining({ rule: "email" })]);
  });

  it("scans first-party bundles while excluding only documented vendor output", () => {
    expect(isGeneratedArtifactInScope("dist/_astro/page.ABC123.js")).toBe(true);
    expect(isGeneratedArtifactInScope("dist/_astro/ui-core.ABC123.js")).toBe(
      false,
    );
    expect(isGeneratedArtifactInScope("dist/pagefind/pagefind.js")).toBe(false);
  });
});

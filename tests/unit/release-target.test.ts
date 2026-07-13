import { describe, expect, it } from "vitest";

import { resolveReleaseTarget } from "../../scripts/lib/release-target";

const release = {
  version: "0.25.0",
  stable: true,
  upcomingVersion: "0.26.0",
  sourcePin: "b534e88de17b66f3e2c089cde8fcf8763ca3e069",
} as const;

describe("release contract target", () => {
  it("builds the upcoming contract from its pinned source", () => {
    expect(
      resolveReleaseTarget({ ...release, contractTarget: "source" }),
    ).toEqual({
      kind: "source",
      version: "0.26.0",
      sourcePin: release.sourcePin,
    });
  });

  it("flips the unchanged upcoming contract to npm with one field", () => {
    expect(resolveReleaseTarget({ ...release, contractTarget: "npm" })).toEqual(
      {
        kind: "npm",
        version: "0.26.0",
      },
    );
  });
});

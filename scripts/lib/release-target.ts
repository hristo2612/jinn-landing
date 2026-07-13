import assert from "node:assert/strict";

export interface ReleaseMetadata {
  version: string;
  stable: boolean;
  upcomingVersion?: string;
  sourcePin?: string;
  contractTarget: "source" | "npm";
}

export interface ResolvedReleaseTarget {
  kind: "source" | "npm";
  version: string;
  sourcePin?: string;
}

export function resolveReleaseTarget(
  release: ReleaseMetadata,
): ResolvedReleaseTarget {
  const version = release.upcomingVersion ?? release.version;
  if (release.contractTarget === "npm") return { kind: "npm", version };

  assert(
    release.sourcePin && /^[0-9a-f]{40}$/u.test(release.sourcePin),
    "source contract target requires a full 40-character sourcePin",
  );
  return { kind: "source", version, sourcePin: release.sourcePin };
}

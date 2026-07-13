export interface ReleaseMetadata {
  version: string;
  releasedAt: string;
  stable: boolean;
  upcomingVersion?: string;
  sourcePin?: string;
}

export interface DocumentationEntry {
  id: string;
  description: string;
}

const canonicalSections = [
  {
    id: "docs/getting-started/install",
    label: "Getting Started",
    url: "/docs/getting-started/install/",
  },
  {
    id: "docs/core-concepts/gateway-and-local-first",
    label: "Core Concepts",
    url: "/docs/core-concepts/gateway-and-local-first/",
  },
  {
    id: "docs/guides/build-an-ai-team",
    label: "Guides",
    url: "/docs/guides/build-an-ai-team/",
  },
  {
    id: "docs/reference/gateway-api/authentication",
    label: "Gateway API",
    url: "/docs/reference/gateway-api/authentication/",
  },
  {
    id: "docs/reference/cli/lifecycle",
    label: "CLI Reference",
    url: "/docs/reference/cli/lifecycle/",
  },
] as const;

export function renderLlmsTxt(
  release: ReleaseMetadata,
  entries: DocumentationEntry[] = [],
  summary = "Jinn is an open-source, local-first gateway that runs installed agent CLIs as a file-backed AI company.",
): string {
  const descriptions = new Map(
    entries.map((entry) => [entry.id, entry.description]),
  );
  const lines = [
    "# Jinn",
    "",
    summary.trim(),
    "",
    `Current documented version: ${release.upcomingVersion ?? release.version}`,
    release.upcomingVersion
      ? `Release status: upcoming; source pin: ${release.sourcePin}`
      : `Release date: ${release.releasedAt}`,
    release.upcomingVersion
      ? "Documentation policy: pinned upcoming source; deployment waits for this version to become npm latest."
      : "Documentation policy: latest stable release; historical release notes remain versioned.",
    "",
    "## Canonical documentation",
    "",
    ...canonicalSections.map(({ id, label, url }) => {
      const description = descriptions.get(id);
      return `- ${label}: https://jinn.run${url}${description ? ` - ${description}` : ""}`;
    }),
    `- Changelog: https://jinn.run/docs/changelog/${release.upcomingVersion ?? release.version}/`,
    "",
    "## Machine and package links",
    "",
    "- Agent gateway protocol: https://jinn.run/agents.md",
    "- npm package: https://www.npmjs.com/package/jinn-cli",
    "- Product site: https://jinn.run/",
    "",
  ];
  return lines.join("\n");
}

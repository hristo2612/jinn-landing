import { env } from "node:process";

import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// Extra hostnames the dev server may be reached through (comma-separated).
// Used for private-network previews; unset in normal development and CI.
const allowedHosts = (env.SITE_DEV_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  site: "https://jinn.run",
  output: "static",
  vite: {
    server: {
      allowedHosts,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/test-fixtures/"),
    }),
    starlight({
      title: "Jinn",
      disable404Route: true,
      customCss: ["./src/styles/starlight.css"],
      components: {
        PageFrame: "./src/components/docs/DocsPageFrame.astro",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://jinn.run/og.png",
          },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:width", content: "1200" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:height", content: "630" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:type", content: "image/png" },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: "https://jinn.run/og.png",
          },
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [{ autogenerate: { directory: "docs/getting-started" } }],
        },
        {
          label: "Core Concepts",
          items: [{ autogenerate: { directory: "docs/core-concepts" } }],
        },
        {
          label: "Guides",
          items: [{ autogenerate: { directory: "docs/guides" } }],
        },
        {
          label: "Gateway API",
          items: [
            { autogenerate: { directory: "docs/reference/gateway-api" } },
          ],
        },
        {
          label: "CLI Reference",
          items: [{ autogenerate: { directory: "docs/reference/cli" } }],
        },
        {
          label: "Changelog",
          items: [{ autogenerate: { directory: "docs/changelog" } }],
        },
      ],
    }),
  ],
});

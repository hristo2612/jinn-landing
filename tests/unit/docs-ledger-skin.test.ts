import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const config = readFileSync("astro.config.mjs", "utf8");
const stylesheetPath = "src/styles/starlight.css";

function readStylesheet(): string {
  return existsSync(stylesheetPath) ? readFileSync(stylesheetPath, "utf8") : "";
}

describe("Ledger documentation skin contract", () => {
  it("loads one dedicated stylesheet through Starlight's supported customCss hook", () => {
    expect(config).toContain('customCss: ["./src/styles/starlight.css"]');
  });

  it("uses one delegating PageFrame override for progressive accessibility enhancement", () => {
    expect(config).toContain(
      'PageFrame: "./src/components/docs/DocsPageFrame.astro"',
    );
    expect(existsSync("src/components/docs/DocsPageFrame.astro")).toBe(true);
  });

  it("maps Starlight chrome to the generated Ledger contract without literal theme colors", () => {
    const css = readStylesheet();

    expect(css).toContain('@import "./fonts.css"');
    expect(css).toContain('@import "./generated/ledger-tokens.css"');
    expect(css).toContain("--sl-color-bg: var(--bg)");
    expect(css).toContain("--sl-color-bg-sidebar: var(--sidebar-bg)");
    expect(css).toContain("--sl-font: var(--font-ui)");
    expect(css).toContain("--sl-font-mono: var(--font-code)");
    expect(css).not.toMatch(/#[\da-f]{3,8}\b/iu);
    expect(css).not.toMatch(/rgba?\(/u);
  });

  it("keeps the single Ledger route marker tied to current navigation state", () => {
    const css = readStylesheet();

    expect(css).toContain('.sidebar-pane a[aria-current="page"]::before');
    expect(css).toContain("background: var(--accent)");
  });

  it("defines readable type, stable numerals, visible focus, and 44px controls", () => {
    const css = readStylesheet();

    expect(css).toContain("text-wrap: balance");
    expect(css).toContain("text-wrap: pretty");
    expect(css).toContain("font-variant-numeric: tabular-nums");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 2px solid var(--accent)");
    expect(css).toContain("min-height: 2.75rem");
  });

  it("uses explicit, reduced-motion-safe transitions", () => {
    const css = readStylesheet();

    expect(css).toContain("transition-property:");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).not.toMatch(/transition(?:-property)?\s*:\s*all\b/u);
    expect(css).not.toContain("will-change: all");
  });
});

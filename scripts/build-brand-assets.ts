/**
 * Brand raster assets (AMENDMENT §3) — regenerates, from the checked-in
 * Noto Emoji genie (see scripts/brand/NOTICE.md):
 *
 *   public/favicon-32.png / favicon-64.png  — transparent PNG fallbacks
 *   public/apple-touch-icon.png             — genie on the dark `--bg` tile
 *   public/og.png                           — 1200×630 quiet-ember OG card
 *
 * Renders through Playwright Chromium at high DPR, then resamples to exact
 * pixel sizes with macOS `sips` (this is a local, on-demand tool — CI never
 * runs it; the outputs are checked in).
 *
 *   pnpm exec tsx scripts/build-brand-assets.ts
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const repo = resolve(new URL("..", import.meta.url).pathname);
const genieUrl = pathToFileURL(
  join(repo, "scripts/brand/noto-genie-1f9de.png"),
).href;
const hankenUrl = pathToFileURL(
  join(
    repo,
    "node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2",
  ),
).href;
const plexUrl = pathToFileURL(
  join(
    repo,
    "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
  ),
).href;

// Dark Ledger tokens (src/styles/generated/ledger-tokens.css).
const bg = "#14130F";
const textPrimary = "#E8E4D8";
const textSecondary = "rgba(232,228,216,0.62)";
const accent = "#E0A33C";

const iconPage = (size: number, tile: boolean) => `<!doctype html>
<html><head><style>
  html, body { margin: 0; }
  body {
    display: grid;
    place-items: center;
    width: ${size}px;
    height: ${size}px;
    ${tile ? `background: ${bg};` : ""}
  }
  img { width: ${tile ? "62%" : "88%"}; height: auto; }
</style></head>
<body><img src="${genieUrl}" /></body></html>`;

const ogPage = `<!doctype html>
<html><head><style>
  @font-face {
    font-family: "Hanken Grotesk";
    font-weight: 100 900;
    src: url("${hankenUrl}") format("woff2-variations");
  }
  @font-face {
    font-family: "IBM Plex Mono";
    font-weight: 400;
    src: url("${plexUrl}") format("woff2");
  }
  html, body { margin: 0; }
  body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 1200px;
    height: 630px;
    background: ${bg};
    font-family: "Hanken Grotesk", sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }
  img { width: 96px; height: 96px; }
  .wordmark {
    margin-top: 20px;
    color: ${textSecondary};
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  h1 {
    margin: 34px 0 0;
    color: ${textPrimary};
    font-size: 76px;
    font-weight: 250;
    font-variation-settings: "wght" 250;
    letter-spacing: -0.012em;
    line-height: 1;
  }
  h1 b {
    font-weight: 640;
    font-variation-settings: "wght" 640;
    letter-spacing: -0.042em;
  }
  h1 span { color: ${accent}; }
  .eyebrow {
    margin-top: 30px;
    color: ${textSecondary};
    font-family: "IBM Plex Mono", monospace;
    font-size: 19px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
</style></head>
<body>
  <img src="${genieUrl}" />
  <div class="wordmark">jinn</div>
  <h1>Run your own <b>AI company<span>.</span></b></h1>
  <div class="eyebrow">Open source · Local-first · Multi-engine</div>
</body></html>`;

const jobs = [
  { file: "favicon-32.png", html: iconPage(32, false), w: 32, h: 32, dpr: 4 },
  { file: "favicon-64.png", html: iconPage(64, false), w: 64, h: 64, dpr: 2 },
  {
    file: "apple-touch-icon.png",
    html: iconPage(180, true),
    w: 180,
    h: 180,
    dpr: 2,
  },
  { file: "og.png", html: ogPage, w: 1200, h: 630, dpr: 2 },
];

const workDir = mkdtempSync(join(tmpdir(), "jinn-brand-"));
const browser = await chromium.launch();

try {
  for (const job of jobs) {
    const template = join(workDir, `${job.file}.html`);
    writeFileSync(template, job.html);
    const context = await browser.newContext({
      viewport: { width: job.w, height: job.h },
      deviceScaleFactor: job.dpr,
    });
    const page = await context.newPage();
    await page.goto(pathToFileURL(template).href);
    await page.evaluate(() => document.fonts.ready);
    const raw = join(workDir, `raw-${job.file}`);
    await page.screenshot({
      path: raw,
      omitBackground: job.file.startsWith("favicon"),
    });
    await context.close();
    const out = join(repo, "public", job.file);
    execFileSync("sips", [
      "-z",
      String(job.h),
      String(job.w),
      raw,
      "--out",
      out,
    ]);
    console.log(`wrote public/${job.file} (${job.w}×${job.h})`);
  }
} finally {
  await browser.close();
  rmSync(workDir, { recursive: true, force: true });
}

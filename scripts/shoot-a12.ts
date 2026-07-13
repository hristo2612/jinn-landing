/**
 * A-12 theatre checkpoint shots → docs/screens/a12/ (DPR 2).
 *
 * One continuous desktop session drives the real playback path: night feed
 * resolves dark → the sunrise fires on morning entry (mid-flight + resolved
 * shots) → the light back half (MCP / steps / CTA / footer) is shot in the
 * same post-sunrise session. Mobile (390) re-drives night + morning in a
 * fresh context. Brand shots clip the fixed nav in both themes; favicon +
 * OG renders are composed from the shipped public/ assets.
 *
 *   pnpm preview --host 127.0.0.1 --port 4332   # after pnpm build
 *   pnpm exec tsx scripts/shoot-a12.ts
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, expect, type Page } from "@playwright/test";

const base = process.env.SHOOT_BASE ?? "http://127.0.0.1:4332/";
const out = new URL("../docs/screens/a12/", import.meta.url).pathname;
const repoPublic = new URL("../public/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const NIGHT = "[data-scene-window][data-scene-id='night-shift']";
const MORNING = "[data-scene-window][data-scene-id='morning-approval']";

async function center(page: Page, selector: string): Promise<void> {
  await page
    .locator(selector)
    .evaluate((node) =>
      node.scrollIntoView({ block: "center", behavior: "instant" }),
    );
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log(`shot ${name}`);
}

const browser = await chromium.launch();

// ---- desktop 1440: the full theatre, real playback ----
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  // Brand: nav in the dark theme.
  const nav = page.locator(".site-nav");
  await page.waitForTimeout(1_600);
  await nav.screenshot({ path: join(out, "brand-nav-dark.png") });
  console.log("shot brand-nav-dark");

  await center(page, NIGHT);
  await expect(page.locator(NIGHT)).toHaveAttribute(
    "data-scene-checkpoint",
    "resolved",
    { timeout: 10_000 },
  );
  await page.waitForTimeout(600);
  await shoot(page, "night-feed-resolved-1440-dark");

  // The sunrise, mid-flight (~1/2 through the 900ms token cross-tween).
  await center(page, MORNING);
  await page.waitForFunction(
    () => document.documentElement.dataset.themeTransition === "active",
    undefined,
    { timeout: 5_000 },
  );
  await page.waitForTimeout(350);
  await shoot(page, "morning-mid-sunrise-1440");

  await expect(page.locator(MORNING)).toHaveAttribute(
    "data-scene-checkpoint",
    "resolved",
    { timeout: 15_000 },
  );
  await page.waitForTimeout(500);
  await shoot(page, "morning-resolved-1440-light");

  // Brand: the same fixed nav after it crossed the sunrise.
  await nav.screenshot({ path: join(out, "brand-nav-light.png") });
  console.log("shot brand-nav-light");

  // The light back half, same post-sunrise session.
  for (const [name, selector] of [
    ["mcp-1440-light", ".mcp"],
    ["steps-1440-light", "#install"],
    ["cta-1440-light", ".cta"],
    ["footer-1440-light", "footer"],
  ] as const) {
    await center(page, selector);
    await page.waitForTimeout(900);
    await shoot(page, name);
  }
  await context.close();
}

// ---- mobile 390: night + morning ----
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // Let the load-time observer pass settle before programmatic scrolling —
  // an instant jump during it can hand the motion channel to a barely
  // visible showcase stage.
  await page.waitForTimeout(900);

  // Activate at the window, then reframe to the section head (clear of
  // the fixed nav) for the shot.
  const reframe = async (section: string) => {
    await page.evaluate((selector) => {
      const top =
        window.scrollY +
        document.querySelector(selector)!.getBoundingClientRect().top;
      window.scrollTo({ top: top - 24 });
    }, section);
    await page.waitForTimeout(400);
  };

  await center(page, NIGHT);
  await expect(page.locator(NIGHT)).toHaveAttribute(
    "data-scene-checkpoint",
    "resolved",
    { timeout: 10_000 },
  );
  await reframe(".night");
  await shoot(page, "night-feed-resolved-390-dark");

  await center(page, MORNING);
  await expect(page.locator(MORNING)).toHaveAttribute(
    "data-scene-checkpoint",
    "resolved",
    { timeout: 15_000 },
  );
  await reframe(".morning-section");
  await shoot(page, "morning-resolved-390-light");
  await context.close();
}

// ---- favicon + OG renders from the shipped assets ----
{
  copyFileSync(join(repoPublic, "og.png"), join(out, "meta-og.png"));
  console.log("copied meta-og");

  const strip = `<!doctype html><html><head><style>
    body { display: flex; align-items: center; gap: 40px; margin: 0;
      width: 720px; height: 220px; justify-content: center;
      background: #14130F; }
    .cell { display: grid; justify-items: center; gap: 10px;
      color: rgba(232,228,216,0.62);
      font: 11px "SF Mono", Menlo, monospace; }
    img.r { border-radius: 22%; }
  </style></head><body>
    <div class="cell"><img src="${pathToFileURL(join(repoPublic, "favicon.svg")).href}" width="32" height="32"><span>favicon.svg ·32</span></div>
    <div class="cell"><img src="${pathToFileURL(join(repoPublic, "favicon-32.png")).href}" width="32" height="32"><span>favicon-32.png</span></div>
    <div class="cell"><img src="${pathToFileURL(join(repoPublic, "favicon-64.png")).href}" width="64" height="64"><span>favicon-64.png</span></div>
    <div class="cell"><img class="r" src="${pathToFileURL(join(repoPublic, "apple-touch-icon.png")).href}" width="120" height="120"><span>apple-touch-icon (iOS mask preview)</span></div>
  </body></html>`;
  const stripPath = join(out, ".favicon-strip.html");
  writeFileSync(stripPath, strip);
  const context = await browser.newContext({
    viewport: { width: 720, height: 220 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(stripPath).href);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, "meta-favicons.png") });
  console.log("shot meta-favicons");
  await context.close();
}

await browser.close();
console.log("done →", out);

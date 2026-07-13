/**
 * Amendment "alive" checkpoint shots → docs/screens/amend/ (DPR 2, dark —
 * the showcase range is dark by design; STORYBOARD-AMENDMENT-1 §7).
 *
 * Every position is driven by the scene system's own runtime attributes
 * (data-scene-checkpoint / data-scene-time / data-active-ambient-scene),
 * never by wall-clock sleeps against beat times. Desktop 1440 drives the
 * ribbon jump, all three ambient loops, the switcher, and the paused-ambient
 * proof; mobile 390 re-drives the ambient panes on the stacked windows.
 *
 *   pnpm preview --host 127.0.0.1 --port 4332   # after pnpm build
 *   pnpm exec tsx scripts/shoot-amend.ts
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, expect, type Page } from "@playwright/test";

const base = process.env.SHOOT_BASE ?? "http://127.0.0.1:4332/";
const out = new URL("../docs/screens/amend/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const SHARED = "[data-scene-shared-window]";
const CONTROLLER = "[data-scene-controller]";

async function shoot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log(`shot ${name}`);
}

async function centerStage(page: Page, id: string): Promise<void> {
  await page
    .locator(`[data-scene-stage][data-scene-id='${id}']`)
    .evaluate((node) => {
      const rect = node.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top + rect.height / 2 - innerHeight / 2,
      });
    });
  await expect(page.locator(CONTROLLER).first()).toHaveAttribute(
    "data-active-scene",
    id,
  );
}

/** Wait until the window's timeline sits inside [from, to) milliseconds. */
async function waitForTimeWindow(
  page: Page,
  windowSelector: string,
  from: number,
  to: number,
): Promise<void> {
  await page.waitForFunction(
    ({ selector, lower, upper }) => {
      const node = document.querySelector<HTMLElement>(selector);
      const time = Number(node?.dataset.sceneTime ?? 0);
      return time >= lower && time < upper;
    },
    { selector: windowSelector, lower: from, upper: to },
    { timeout: 60_000, polling: 60 },
  );
}

async function waitForAmbient(page: Page, id: string): Promise<void> {
  await expect(page.locator(CONTROLLER).first()).toHaveAttribute(
    "data-active-ambient-scene",
    id,
    { timeout: 20_000 },
  );
}

const browser = await chromium.launch();

// ---- desktop 1440: ribbon jump, ambient loops, switcher, paused proof ----
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1_200);

  // ribbon-nav.jump — View Todos from the hero; stage 3 head + todos pane
  // at the ledger checkpoint.
  await page.locator("[data-ribbon-nav='todos']").click();
  await page.waitForSelector(`${SHARED}[data-scene-checkpoint='ledger']`, {
    timeout: 20_000,
  });
  await shoot(page, "ribbon-nav-jump-1440");

  // org.ambient-peak — dev node active, mid-cycle (t≈14s).
  await centerStage(page, "employees");
  await waitForAmbient(page, "org-ambient");
  await page.waitForSelector(`${SHARED}[data-scene-checkpoint='dev-active']`, {
    timeout: 40_000,
  });
  await shoot(page, "org-ambient-peak-1440");

  // window.paused-ambient — the single pause control freezes the ambient
  // frame at a beat boundary.
  await page.locator(`${SHARED} [data-scene-playback-control]`).click();
  await page.waitForTimeout(600);
  await shoot(page, "window-paused-ambient-1440");
  await page.locator(`${SHARED} [data-scene-playback-control]`).click();

  // todos.ambient-entered / -unblocked.
  await centerStage(page, "todos");
  await waitForAmbient(page, "todos-ambient");
  await page.waitForSelector(`${SHARED}[data-scene-checkpoint='entered']`, {
    timeout: 40_000,
  });
  await shoot(page, "todos-ambient-entered-1440");
  await page.waitForSelector(`${SHARED}[data-scene-checkpoint='unblocked']`, {
    timeout: 40_000,
  });
  await shoot(page, "todos-ambient-unblocked-1440");

  // flows.switcher-rest — must equal the old parked shot except the
  // switcher chrome. Run #142's gate is parked and absolutely still.
  await centerStage(page, "workflow-approval");
  await expect(page.locator(SHARED)).toHaveAttribute(
    "data-scene-player-state",
    "completed",
    { timeout: 12_000 },
  );
  await page.waitForTimeout(500);
  await shoot(page, "flows-switcher-rest-1440");

  // flows.backup-running — Nightly backup selected, step 2 running
  // (approved cadence: prune runs 2400→6400ms).
  await page.locator(`${SHARED} [data-scene-option='nightly-backup']`).click();
  await waitForTimeWindow(page, SHARED, 2_600, 6_000);
  await shoot(page, "flows-backup-running-1440");

  // flows.backup-complete — run #139 Completed badge, dwell state.
  await page.waitForSelector(
    `${SHARED} [data-target='bk-badge'][data-state='completed']`,
    { state: "attached", timeout: 30_000 },
  );
  await page.waitForTimeout(400);
  await shoot(page, "flows-backup-complete-1440");

  // triggers.ambient-fired — webhook fired + run #140 row present. The
  // scroll activation also proves the switcher reset on the way.
  await centerStage(page, "trigger-fire");
  await waitForAmbient(page, "triggers-ambient");
  await page.waitForSelector(`${SHARED}[data-scene-checkpoint='fired']`, {
    timeout: 40_000,
  });
  await shoot(page, "triggers-ambient-fired-1440");

  await context.close();
}

// ---- mobile 390: the ambient panes on the stacked windows ----
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const mobileWindow = (id: string): string =>
    `[data-scene-stage][data-scene-id='${id}'] [data-scene-mobile-window]`;

  const centerMobile = async (id: string): Promise<void> => {
    await page
      .locator(mobileWindow(id))
      .evaluate((node) =>
        node.scrollIntoView({ block: "center", behavior: "instant" }),
      );
  };

  await centerMobile("employees");
  await waitForAmbient(page, "org-ambient");
  await page.waitForSelector(
    `${mobileWindow("employees")}[data-scene-checkpoint='dev-active']`,
    { timeout: 40_000 },
  );
  await shoot(page, "org-ambient-peak-390");

  // window.paused-ambient at 390 — the single control freezes the mobile
  // ambient frame at a beat boundary.
  await page
    .locator(`${mobileWindow("employees")} [data-scene-playback-control]`)
    .click();
  await page.waitForTimeout(600);
  await shoot(page, "window-paused-ambient-390");
  await page
    .locator(`${mobileWindow("employees")} [data-scene-playback-control]`)
    .click();

  await centerMobile("todos");
  await waitForAmbient(page, "todos-ambient");
  await page.waitForSelector(
    `${mobileWindow("todos")}[data-scene-checkpoint='entered']`,
    { timeout: 40_000 },
  );
  await shoot(page, "todos-ambient-entered-390");
  await page.waitForSelector(
    `${mobileWindow("todos")}[data-scene-checkpoint='unblocked']`,
    { timeout: 40_000 },
  );
  await shoot(page, "todos-ambient-unblocked-390");

  await centerMobile("workflow-approval");
  await expect(page.locator(mobileWindow("workflow-approval"))).toHaveAttribute(
    "data-scene-player-state",
    "completed",
    { timeout: 12_000 },
  );
  await page.waitForTimeout(500);
  await shoot(page, "flows-switcher-rest-390");

  await page
    .locator(
      `${mobileWindow("workflow-approval")} [data-scene-option='nightly-backup']`,
    )
    .click();
  await waitForTimeWindow(
    page,
    mobileWindow("workflow-approval"),
    2_600,
    6_000,
  );
  await shoot(page, "flows-backup-running-390");

  // flows.backup-complete at 390 — run #139's Completed dwell state.
  await page.waitForSelector(
    `${mobileWindow("workflow-approval")} [data-target='bk-badge'][data-state='completed']`,
    { state: "attached", timeout: 30_000 },
  );
  await page.waitForTimeout(400);
  await shoot(page, "flows-backup-complete-390");

  await centerMobile("trigger-fire");
  await waitForAmbient(page, "triggers-ambient");
  await page.waitForSelector(
    `${mobileWindow("trigger-fire")}[data-scene-checkpoint='fired']`,
    { timeout: 40_000 },
  );
  await shoot(page, "triggers-ambient-fired-390");

  await context.close();
}

await browser.close();
console.log("amend checkpoint matrix complete");

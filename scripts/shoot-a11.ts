import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

const base = process.env.SHOOT_BASE ?? "http://127.0.0.1:4332/";
const out = new URL("../docs/screens/a11/", import.meta.url).pathname;
const scenes = [
  ["employees", "resolved", "resolved", "2700"],
  ["todos", "resolved", "resolved", "3600"],
  ["workflow-approval", "parked", "resolved", "4100"],
  ["trigger-fire", "resolved", "resolved", "3000"],
] as const;

await mkdir(out, { recursive: true });
const browser = await chromium.launch();

async function expectWorkflowParked(window: Locator): Promise<void> {
  await expect(window.locator("[data-target='rail']")).toHaveAttribute(
    "data-progress",
    String(2 / 3),
  );
  await expect(window.locator("[data-target='run-badge']")).toHaveText(
    "Running",
  );
  await expect(window.locator("[data-target='step-gate']")).toHaveAttribute(
    "data-state",
    "awaiting-approval",
  );
  await expect(window.locator("[data-target='step-post']")).toHaveAttribute(
    "data-state",
    "queued",
  );
}

for (const viewport of [
  { label: "1440", width: 1440, height: 900 },
  { label: "390", width: 390, height: 844 },
] as const) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator("nav")
    .first()
    .evaluate((node) => {
      node.style.setProperty("display", "none", "important");
    });

  for (const [scene, label, checkpoint, time] of scenes) {
    const stage = page.locator(`[data-scene-stage][data-scene-id='${scene}']`);
    await stage.evaluate((node) =>
      node.scrollIntoView({ block: "center", behavior: "instant" }),
    );

    if (viewport.width >= 900) {
      const controller = page.locator("[data-scene-controller]").first();
      const window = controller.locator("[data-scene-shared-window]");
      await expect(controller).toHaveAttribute("data-active-scene", scene);
      await expect(window).toHaveAttribute(
        "data-scene-player-state",
        "completed",
        { timeout: 8_000 },
      );
      await expect(window).toHaveAttribute("data-scene-checkpoint", checkpoint);
      await expect(window).toHaveAttribute("data-scene-time", time);
      if (scene === "workflow-approval") await expectWorkflowParked(window);
      await page.screenshot({
        path: `${out}${scene}-${label}-${viewport.label}-dark.png`,
      });
    } else {
      const window = stage.locator("[data-scene-mobile-window]");
      await expect(window).toHaveAttribute(
        "data-scene-player-state",
        "completed",
        { timeout: 8_000 },
      );
      await expect(window).toHaveAttribute("data-scene-checkpoint", checkpoint);
      await expect(window).toHaveAttribute("data-scene-time", time);
      if (scene === "workflow-approval") await expectWorkflowParked(window);
      await stage.locator(".showcase__mobile").screenshot({
        path: `${out}${scene}-${label}-${viewport.label}-dark.png`,
      });
    }
  }
  await context.close();
}

await browser.close();

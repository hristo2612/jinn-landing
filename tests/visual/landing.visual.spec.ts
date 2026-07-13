import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  desktopSceneCheckpoints,
  mobileVisualStates,
  reducedMotionStates,
} from "../../scripts/qa-gates";
import { landingSceneDefinitions } from "../../src/lib/scenes/install-scene-system";
import { pauseAndSeekScene, settleVisualPage } from "./scene-visual-helpers";

const themes = ["dark", "light"] as const;
const productStoryIds = new Set([
  "employees",
  "todos",
  "workflow-approval",
  "trigger-fire",
]);

async function forceTheme(page: Page, theme: "dark" | "light"): Promise<void> {
  await page.evaluate((nextTheme) => {
    document.documentElement.dataset.theme = nextTheme;
    document.querySelectorAll<HTMLElement>("[data-theme]").forEach((node) => {
      node.dataset.theme = nextTheme;
    });
  }, theme);
}

async function seekOverlay(
  page: Page,
  sceneId: string,
  time: number,
): Promise<void> {
  const resolvedTime = checkpointTime(sceneId, "resolved");
  const overlay = page.locator("[data-scene-debug]").filter({
    has: page.locator(`[data-scene-debug-scrubber][max='${resolvedTime}']`),
  });
  await expect(overlay).toBeAttached();
  await pauseAndSeekScene(overlay, time);
}

function checkpointTime(sceneId: string, checkpoint: string): number {
  const definition = landingSceneDefinitions.get(sceneId);
  const match = definition?.checkpoints.find(({ name }) => name === checkpoint);
  if (!match) throw new Error(`Unknown checkpoint ${sceneId}/${checkpoint}`);
  return match.at;
}

async function activateProductStory(
  page: Page,
  sceneId: string,
): Promise<Locator> {
  const story = page.locator(`[data-product-story='${sceneId}']`);
  await story.scrollIntoViewIfNeeded();
  await expect(
    story.locator(`[data-scene-window][data-scene-id='${sceneId}']`),
  ).toHaveAttribute("data-scene-player-state", /playing|paused/u);
  return story;
}

test.describe("desktop checkpoint matrix", () => {
  test.skip(({ isMobile }) => isMobile);

  for (const theme of themes) {
    for (const [sceneId, checkpoints] of Object.entries(
      desktopSceneCheckpoints,
    )) {
      for (const checkpoint of checkpoints) {
        test(`${sceneId} ${checkpoint} ${theme}`, async ({ page }) => {
          await settleVisualPage(page, "/");
          let target: Locator;

          if (sceneId === "delegation") {
            target = page.locator(".hero");
          } else if (productStoryIds.has(sceneId)) {
            target = await activateProductStory(page, sceneId);
          } else if (sceneId === "night-shift") {
            target = page.locator(".night");
            await target.scrollIntoViewIfNeeded();
          } else {
            target = page.locator(".morning-section");
            await target.scrollIntoViewIfNeeded();
          }

          await seekOverlay(page, sceneId, checkpointTime(sceneId, checkpoint));
          await forceTheme(page, theme);
          await expect(target).toHaveScreenshot(
            `${sceneId}-${checkpoint}-${theme}.png`,
          );
        });
      }
    }
  }
});

test.describe("mobile key states", () => {
  test.skip(({ isMobile }) => !isMobile);

  for (const theme of themes) {
    for (const state of mobileVisualStates) {
      test(`${state.id} ${theme}`, async ({ page }) => {
        await settleVisualPage(page, "/");
        let target: Locator;

        if (state.id === "hero") {
          target = page.locator(".hero");
          await seekOverlay(
            page,
            "delegation",
            checkpointTime("delegation", "resolved"),
          );
        } else if (state.id === "footer") {
          target = page.locator("footer");
          await target.scrollIntoViewIfNeeded();
        } else if (state.sceneId === "morning-approval") {
          target = page.locator(".morning-section");
          await target.scrollIntoViewIfNeeded();
          await seekOverlay(
            page,
            state.sceneId,
            checkpointTime(state.sceneId, state.checkpoint!),
          );
        } else {
          target = await activateProductStory(page, state.sceneId!);
          await seekOverlay(
            page,
            state.sceneId!,
            checkpointTime(state.sceneId!, state.checkpoint!),
          );
        }

        await forceTheme(page, theme);
        if (state.id === "hero") {
          await page.evaluate(() => window.scrollTo(0, 0));
          await expect(page).toHaveScreenshot(`${state.id}-${theme}.png`);
          return;
        }
        await expect(target).toHaveScreenshot(`${state.id}-${theme}.png`);
      });
    }
  }
});

test.describe("reduced motion pair", () => {
  for (const state of reducedMotionStates) {
    test(`${state.id}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== `${state.viewport}-dpr2`);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await settleVisualPage(page, "/");
      const target = page.locator(state.target).first();
      await target.scrollIntoViewIfNeeded();
      await expect(target).toHaveScreenshot(`${state.id}.png`);
    });
  }
});

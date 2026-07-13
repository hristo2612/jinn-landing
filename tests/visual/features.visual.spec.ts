import { expect, test, type Page } from "@playwright/test";

import {
  featuresStaticShots,
  featuresVisualStates,
} from "../../scripts/qa-gates";
import { featuresSceneDefinitions } from "../../src/lib/scenes/features-scene-registry";
import { pauseAndSeekScene, settleVisualPage } from "./scene-visual-helpers";

/**
 * STORYBOARD-FEATURES §8 checkpoint matrix. The features page is light end
 * to end (its one theatrical exception - the §05 dark window - is window
 * chrome, not a page theme), so unlike the landing there is no per-theme
 * axis: every state is shot once per breakpoint.
 */

function resolvedTime(sceneId: string): number {
  const definition = featuresSceneDefinitions.get(sceneId);
  const match = definition?.checkpoints.find(({ name }) => name === "resolved");
  if (!match) throw new Error(`Unknown scene ${sceneId}`);
  return match.at;
}

async function seekScene(
  page: Page,
  sceneId: string,
  time: number,
): Promise<void> {
  const overlay = page.locator("[data-scene-debug]").filter({
    has: page.locator(
      `[data-scene-debug-scrubber][max='${resolvedTime(sceneId)}']`,
    ),
  });
  await expect(overlay).toBeAttached();
  await pauseAndSeekScene(overlay, time);
}

test.describe("features checkpoint matrix", () => {
  for (const state of featuresVisualStates) {
    test(state.id, async ({ page }) => {
      await settleVisualPage(page, "/features/");
      const window = page.locator(
        `[data-scene-window][data-scene-id='${state.sceneId}']`,
      );
      await window.scrollIntoViewIfNeeded();
      await expect(window).toHaveAttribute("data-scene-player-state", /.+/u);
      await seekScene(page, state.sceneId, state.at);
      await expect(window).toHaveScreenshot(`${state.id}.png`);
    });
  }
});

test.describe("hero + statics + nav", () => {
  test("hero-rest", async ({ page }) => {
    await settleVisualPage(page, "/features/");
    await expect(page.locator(".fhero")).toHaveScreenshot("hero-rest.png");
  });

  test("fold", async ({ page, viewport }) => {
    test.skip(viewport!.width < 900);
    await settleVisualPage(page, "/features/");
    // §8 hero.rest fold framing: §01's window crop peeks above the fold.
    await expect(page).toHaveScreenshot("fold.png", { fullPage: false });
  });

  for (const shot of featuresStaticShots) {
    test(shot.id, async ({ page }) => {
      await settleVisualPage(page, "/features/");
      const target = page.locator(shot.target).first();
      await target.scrollIntoViewIfNeeded();
      await expect(target).toHaveScreenshot(`${shot.id}.png`);
    });
  }

  test("nav-landing-current", async ({ page }) => {
    await settleVisualPage(page, "/");
    await expect(page.locator(".site-nav")).toHaveScreenshot(
      "nav-landing-current.png",
    );
  });
});

test.describe("page reduced", () => {
  test("page-reduced", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await settleVisualPage(page, "/features/");
    // §8 page.reduced - every window presents its resolved truth with zero
    // timelines. Shot per window: a single ~19000px full-page capture never
    // stabilizes (frosted materials re-sample during stitching) and would be
    // a wasteful binary baseline.
    await expect(page.locator("[data-scene-timeline-count='1']")).toHaveCount(
      0,
    );
    for (const sceneId of featuresSceneDefinitions.keys()) {
      const window = page.locator(
        `[data-scene-window][data-scene-id='${sceneId}']`,
      );
      await window.scrollIntoViewIfNeeded();
      await expect(window).toHaveScreenshot(`reduced-${sceneId}.png`);
    }
  });
});

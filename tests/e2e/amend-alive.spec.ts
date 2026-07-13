import { expect, test, type Page } from "@playwright/test";

const sceneWindow = (page: Page, id: string) =>
  page.locator(`[data-scene-window][data-scene-id='${id}']`).first();

async function center(page: Page, id: string): Promise<void> {
  await sceneWindow(page, id).evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
}

test.describe("independent landing proofs", () => {
  test("removes shared navigation, pane swapping, and ambient ownership", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.locator(
        "[data-scene-controller], [data-scene-pin], [data-ribbon-nav], [data-workflow-switcher], [data-scene-shared-window], [data-scene-mobile-window], [data-active-ambient-scene]",
      ),
    ).toHaveCount(0);
  });

  test("keeps the workflow gate parked and the cron run local to their windows", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const workflow = sceneWindow(page, "workflow-approval");
    await expect(workflow.locator("[data-target='step-gate']")).toHaveAttribute(
      "data-state",
      "awaiting-approval",
    );
    await expect(workflow.locator("[data-target='step-post']")).toHaveAttribute(
      "data-state",
      "queued",
    );

    const triggers = sceneWindow(page, "trigger-fire");
    await expect(
      triggers.locator("[data-target='binding-cron']"),
    ).toHaveAttribute("data-state", "fired");
    await expect(triggers.locator("[data-target='run-row']")).toBeVisible();
  });

  test("pause controls are keyboard operable, stable, and at least 44px", async ({
    page,
  }) => {
    await page.goto("/");

    for (const id of ["delegation", "todos", "workflow-approval"]) {
      await center(page, id);
      const window = sceneWindow(page, id);
      const control = window.locator("[data-scene-playback-control]");
      await expect(control).toBeVisible();
      await expect(control).toHaveAttribute("aria-label", "Pause animation");
      const box = await control.boundingBox();
      expect(box?.width, id).toBeGreaterThanOrEqual(44);
      expect(box?.height, id).toBeGreaterThanOrEqual(44);

      await control.focus();
      await page.keyboard.press("Space");
      await expect(control).toHaveAttribute("aria-label", "Play animation");
      const pausedAt = await window.getAttribute("data-scene-time");
      await page.waitForTimeout(300);
      await expect(window).toHaveAttribute("data-scene-time", pausedAt!);
      await page.keyboard.press("Enter");
      await expect(control).toHaveAttribute("aria-label", "Pause animation");
    }
  });
});

import { expect, test, type Locator, type Page } from "@playwright/test";

const storyIds = [
  "employees",
  "todos",
  "workflow-approval",
  "trigger-fire",
] as const;

function story(page: Page, id: (typeof storyIds)[number]): Locator {
  return page.locator(`[data-product-story='${id}']`);
}

test.describe("normal-flow product stories", () => {
  test("renders one hero window and four independent story windows", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.locator("[data-product-stories]")).toHaveCount(1);
    await expect(
      page.locator(".hero [data-scene-window][data-scene-id='delegation']"),
    ).toHaveCount(1);
    await expect(
      page.locator("[data-product-story] [data-scene-window]"),
    ).toHaveCount(4);
    await expect(
      page.locator(
        "[data-scene-controller], [data-scene-pin], [data-scene-shared-window], [data-scene-mobile-window], [data-ribbon-nav]",
      ),
    ).toHaveCount(0);

    for (const id of storyIds) {
      await expect(
        story(page, id).locator(`[data-scene-window][data-scene-id='${id}']`),
      ).toHaveCount(1);
    }
  });

  test("keeps every story in ordinary document flow", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const boxes = [];
    for (const id of storyIds) {
      const root = story(page, id);
      const box = await root.boundingBox();
      expect(box, id).not.toBeNull();
      boxes.push(box!);
      expect(
        await root.evaluate((node) => getComputedStyle(node).position),
        id,
      ).not.toMatch(/sticky|fixed/u);
    }
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index].y).toBeGreaterThan(
        boxes[index - 1].y + boxes[index - 1].height,
      );
    }
  });

  test("ships resolved story truth with JavaScript disabled", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");

    await expect(
      story(page, "workflow-approval").locator("[data-target='step-gate']"),
    ).toHaveAttribute("data-state", "awaiting-approval");
    await expect(
      story(page, "trigger-fire").locator("[data-target='run-row']"),
    ).toBeVisible();
    await context.close();
  });
});

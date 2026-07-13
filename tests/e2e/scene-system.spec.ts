import { expect, test, type Page } from "@playwright/test";

const sceneWindow = (page: Page, id: string) =>
  page.locator(`[data-scene-window][data-scene-id='${id}']`).first();

async function center(page: Page, id: string): Promise<void> {
  await sceneWindow(page, id).evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
}

test("hands one page-wide motion owner between independent windows", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const hero = sceneWindow(page, "delegation");
  await expect(hero).toHaveAttribute("data-scene-player-state", "playing", {
    timeout: 4_000,
  });
  const heroActivationCount = await hero.getAttribute(
    "data-scene-activation-count",
  );
  let heroPausedAt = "0";

  let outgoingId = "delegation";
  for (const id of [
    "employees",
    "todos",
    "workflow-approval",
    "trigger-fire",
  ]) {
    const outgoing = sceneWindow(page, outgoingId);
    await center(page, id);
    await expect(sceneWindow(page, id)).toHaveAttribute(
      "data-scene-player-state",
      "playing",
    );
    await expect(
      page.locator("[data-scene-player-state='playing']"),
    ).toHaveCount(1);
    await expect(outgoing).toHaveAttribute("data-scene-player-state", "paused");
    const outgoingTime = await outgoing.getAttribute("data-scene-time");
    if (outgoingId === "delegation") heroPausedAt = outgoingTime!;
    await page.waitForTimeout(550);
    await expect(outgoing).toHaveAttribute("data-scene-time", outgoingTime!);
    outgoingId = id;
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(hero).toHaveAttribute("data-scene-player-state", "playing");
  await expect(page.locator("[data-scene-player-state='playing']")).toHaveCount(
    1,
  );
  await expect(hero).toHaveAttribute(
    "data-scene-activation-count",
    heroActivationCount!,
  );
  const resumedAt = Number(await hero.getAttribute("data-scene-time"));
  // The attribute/state expectations above poll while the resumed timeline is
  // already advancing. Keep the continuity bound below the offscreen freeze
  // interval without pretending those assertions consume zero wall time.
  expect(Math.abs(resumedAt - Number(heroPausedAt))).toBeLessThan(550);
  await page.waitForTimeout(300);
  expect(await hero.getAttribute("data-scene-time")).not.toBe(heroPausedAt);
});

test("keeps the active independent loop paused while the page is hidden", async ({
  page,
}) => {
  await page.goto("/");
  await center(page, "todos");
  const active = sceneWindow(page, "todos");
  await expect(active).toHaveAttribute("data-scene-player-state", "playing");

  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hiddenAt = await active.getAttribute("data-scene-time");
  await page.waitForTimeout(550);
  await expect(active).toHaveAttribute("data-scene-time", hiddenAt!);

  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(active).toHaveAttribute("data-scene-player-state", "playing");
  await page.waitForTimeout(300);
  expect(await active.getAttribute("data-scene-time")).not.toBe(hiddenAt);
});

test("resizing never duplicates independent players", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await center(page, "workflow-approval");
  await expect(page.locator("[data-scene-player-state='playing']")).toHaveCount(
    1,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.locator("[data-scene-player-state='playing']").count(),
  ).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(
    await page.locator("[data-scene-player-state='playing']").count(),
  ).toBeLessThanOrEqual(1);
  await expect(page.locator("[data-scene-root-player-count='1']")).toHaveCount(
    7,
  );
});

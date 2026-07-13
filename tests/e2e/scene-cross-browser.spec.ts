import { expect, test, type Locator } from "@playwright/test";

async function center(locator: Locator): Promise<void> {
  await locator.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
}

test("WebKit keeps mobile product stories in flow and activates the visible window", async ({
  browserName,
  page,
}) => {
  test.skip(browserName !== "webkit", "WebKit mobile scene smoke");
  await page.goto("/");
  const root = page.locator("[data-product-stories]");
  const org = root.locator("[data-scene-window][data-scene-id='employees']");

  await expect(
    page.locator("[data-scene-controller], [data-scene-pin], .pin-spacer"),
  ).toHaveCount(0);
  await center(org);
  await expect(org).toHaveAttribute("data-scene-player-state", "playing");
  expect(
    await root.evaluate((node) => getComputedStyle(node).position),
  ).not.toMatch(/sticky|fixed/u);
});

test("Firefox navigates and keeps reduced-motion scenes static", async ({
  browserName,
  page,
}) => {
  test.skip(browserName !== "firefox", "Firefox navigation and motion smoke");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Jinn - Run your own AI company");
  await expect(page.locator("[data-scene-timeline-count='1']")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute(
    "data-scene-runtime",
    "reduced",
  );
  await expect(page.locator("[data-scene-player-state]")).toHaveCount(0);
  await expect(page.locator("[data-product-story]")).toHaveCount(4);

  const docsResponse = await page.goto("/docs/");
  expect(docsResponse?.status()).toBe(200);
  await expect(page).toHaveURL(/\/docs\/$/u);
});

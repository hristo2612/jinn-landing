import { expect, test } from "@playwright/test";

const HERO_SCENE = ".hero [data-scene-window][data-scene-id='delegation']";

test.describe("operator landing refinements", () => {
  test("shows the complete hero window inside the hero section", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const hero = await page.locator(".hero").boundingBox();
    const scene = await page.locator(HERO_SCENE).boundingBox();
    expect(hero).not.toBeNull();
    expect(scene).not.toBeNull();
    expect(scene!.y).toBeGreaterThanOrEqual(hero!.y);
    expect(scene!.y + scene!.height).toBeLessThanOrEqual(
      hero!.y + hero!.height + 1,
    );
  });

  test("keeps every feature story focused on its own surface", async ({
    page,
  }) => {
    await page.goto("/");

    const stories = page.locator("[data-product-story] [data-scene-window]");
    await expect(stories).toHaveCount(4);
    await expect(
      page.locator("[data-product-story] .scene-window__sidebar"),
    ).toHaveCount(0);
    await expect(
      page.locator("[data-product-story] .scene-window__ribbon"),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        stories.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-window-chrome")),
        ),
      )
      .toEqual(["focused", "focused", "focused", "focused"]);
  });

  test("keeps Docs in the shared navigation on desktop and mobile", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const docs = page
        .getByRole("navigation")
        .getByRole("link", { name: "Docs", exact: true });
      await expect(docs).toBeVisible();
      await expect(docs).toHaveAttribute("href", "/docs/");
    }
  });

  test("shows concrete model names in product windows", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator(`${HERO_SCENE} .chat__pill-sub`)).toContainText(
      "Opus 4.8",
    );
    await expect(
      page.locator("[data-product-story='employees'] .org__engine"),
    ).toHaveText([
      "Opus 4.8",
      "GPT-5.6 Sol",
      "Fable 5",
      "GPT-5.6 Sol",
      "Opus 4.8",
    ]);

    await page.goto("/features/");
    await expect(
      page.locator("[data-scene-id='engine-switch'] .echat__engine-static"),
    ).toHaveText("GPT-5.6 Sol");
  });

  test("stays dark through the end of the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );
    await page.waitForTimeout(1_200);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("[data-daylight]")).toHaveCount(0);
  });

  test("does not replay a delayed page entrance after first paint", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const entranceAnimations = await page.locator(".hero").evaluate((hero) =>
      hero
        .getAnimations({ subtree: true })
        .map((animation) => {
          const effect = animation.effect as KeyframeEffect | null;
          return {
            name:
              animation instanceof CSSAnimation
                ? animation.animationName
                : "transition",
            target:
              effect?.target instanceof HTMLElement
                ? effect.target.className
                : "unknown",
          };
        })
        .filter(({ name }) => name.startsWith("hero-")),
    );
    expect(entranceAnimations).toEqual([]);
  });

  test("keeps the hero visible while the motion bundle loads slowly", async ({
    page,
  }) => {
    await page.route(/\/install-scene-system\.[^/]+\.js$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const frame = page.locator(`${HERO_SCENE} [data-scene-frame]`);
    await expect(frame).toBeVisible();
    const loadingBox = await frame.boundingBox();
    expect(loadingBox).not.toBeNull();
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene-runtime",
      "motion",
      { timeout: 4_000 },
    );
    await expect(frame).toBeVisible();
    const motionBox = await frame.boundingBox();
    expect(motionBox).not.toBeNull();
    expect(Math.abs(motionBox!.width - loadingBox!.width)).toBeLessThan(1);
    expect(Math.abs(motionBox!.height - loadingBox!.height)).toBeLessThan(1);
  });

  test("keeps a visible static hero when the motion bundle fails", async ({
    page,
  }) => {
    await page.route(/\/install-scene-system\.[^/]+\.js$/, (route) =>
      route.abort("failed"),
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const frame = page.locator(`${HERO_SCENE} [data-scene-frame]`);
    await expect(frame).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene-runtime",
      "static",
    );
    await page.waitForTimeout(1_000);
    await expect(frame).toBeVisible();
    await expect(page.locator(HERO_SCENE)).not.toHaveAttribute(
      "data-scene-player-state",
      /.+/,
    );
  });

  test("starts the hero window loop promptly on load", async ({ page }) => {
    await page.addInitScript(() => {
      const startedAt = { value: null as number | null };
      Object.defineProperty(window, "__heroStartedAt", {
        get: () => startedAt.value,
      });
      document.addEventListener("DOMContentLoaded", () => {
        const observer = new MutationObserver(() => {
          const hero = document.querySelector<HTMLElement>(
            ".hero [data-scene-window][data-scene-id='delegation']",
          );
          if (hero?.dataset.scenePlayerState === "playing") {
            startedAt.value = performance.now();
            observer.disconnect();
          }
        });
        observer.observe(document.body, {
          subtree: true,
          attributes: true,
          attributeFilter: ["data-scene-player-state"],
        });
      });
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator(HERO_SCENE)).toHaveAttribute(
      "data-scene-player-state",
      "playing",
      { timeout: 1_000 },
    );
    const startedAt = await page.evaluate(
      () =>
        (window as typeof window & { __heroStartedAt: number | null })
          .__heroStartedAt,
    );
    expect(startedAt).not.toBeNull();
    expect(startedAt!).toBeLessThan(300);
    await expect
      .poll(async () =>
        Number(await page.locator(HERO_SCENE).getAttribute("data-scene-time")),
      )
      .toBeGreaterThan(50);
  });

  test("keeps offscreen feature loops from stealing first-load motion", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const hero = page.locator(HERO_SCENE);
    await expect(hero).toHaveAttribute("data-scene-player-state", "playing");
    await page.waitForTimeout(500);
    await expect(hero).toHaveAttribute("data-scene-player-state", "playing");

    const offscreen = page.locator("[data-product-story] [data-scene-window]");
    await expect
      .poll(() =>
        offscreen.evaluateAll((nodes) =>
          nodes.map((node) => ({
            state: (node as HTMLElement).dataset.scenePlayerState,
            time: Number((node as HTMLElement).dataset.sceneTime),
          })),
        ),
      )
      .toEqual([
        { state: "paused", time: 0 },
        { state: "paused", time: 0 },
        { state: "paused", time: 0 },
        { state: "paused", time: 0 },
      ]);
  });
});

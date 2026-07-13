import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const META_DESCRIPTION =
  "Jinn is an open-source, local-first platform for running your own AI company. Hire AI employees, hand them real work, and approve what matters.";

const themeColors = {
  dark: {
    background: [20, 19, 15],
    text: [232, 228, 216],
    accent: [224, 163, 60],
  },
  light: {
    background: [244, 241, 232],
    text: [33, 30, 22],
    accent: [146, 101, 22],
  },
} as const;

type Rgb = [number, number, number];

function parseRgb(value: string): Rgb {
  const channels = value
    .match(/[\d.]+/gu)
    ?.slice(0, 3)
    .map(Number);
  if (!channels || channels.length !== 3) {
    throw new Error(`Expected an RGB color, received: ${value}`);
  }
  return channels as Rgb;
}

function colorDistance(left: Rgb, right: readonly number[]): number {
  return left.reduce(
    (total, channel, index) => total + Math.abs(channel - right[index]),
    0,
  );
}

function expectIntermediateColor(
  value: string,
  start: readonly number[],
  end: readonly number[],
) {
  const channels = parseRgb(value);
  channels.forEach((channel, index) => {
    expect(channel).toBeGreaterThan(Math.min(start[index], end[index]));
    expect(channel).toBeLessThan(Math.max(start[index], end[index]));
  });
}

async function readThemeFrame(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const nav = document.querySelector<HTMLElement>(".site-nav");
    const install = document.querySelector<HTMLElement>(".site-nav__install");
    if (!nav || !install) throw new Error("Missing themed nav surface");

    const transitions = document
      .getAnimations()
      .map((animation) => {
        const transition = animation as CSSTransition;
        return {
          duration: Number(animation.effect?.getTiming().duration),
          property: transition.transitionProperty,
        };
      })
      .filter(({ property }) => typeof property === "string");

    return {
      background: getComputedStyle(document.body).backgroundColor,
      color: getComputedStyle(root).color,
      install: getComputedStyle(install).backgroundColor,
      navShadow: getComputedStyle(nav).boxShadow,
      transitions,
    };
  });
}

async function tabToName(page: Page): Promise<string | null> {
  await page.keyboard.press("Tab");
  return page.evaluate(
    () =>
      document.activeElement?.getAttribute("aria-label") ??
      document.activeElement?.textContent?.trim() ??
      null,
  );
}

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const) {
  test(`${viewport.name} shell has the expected theme and keyboard order`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: "Install" })).toHaveAttribute(
      "href",
      "/#install",
    );

    expect(await tabToName(page)).toBe("jinn");
    expect(await tabToName(page)).toBe("Features");
    expect(await tabToName(page)).toBe("Docs");
    if (viewport.name === "desktop") {
      expect(await tabToName(page)).toBe("GitHub");
      expect(await tabToName(page)).toBe("npm");
    }
    expect(await tabToName(page)).toBe("Install");
  });
}

test("uses copy-deck metadata and has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Jinn - Run your own AI company");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    META_DESCRIPTION,
  );

  // Assess the settled page: the hero's one-time entrance fades text in, and
  // axe composites a mid-fade opacity into its contrast reading. Wait for the
  // choreography (and fonts) to settle before auditing.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  );

  const results = await new AxeBuilder({ page }).analyze();
  const seriousViolations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );
  expect(seriousViolations).toEqual([]);
});

test("ships the 🧞 brand: nav glyph, favicon set, and social meta", async ({
  page,
  request,
}) => {
  await page.goto("/");

  // The typographic brand mark - the raw emoji glyph, no amber plate.
  const mark = page.locator(".site-nav__mark");
  await expect(mark).toHaveText("🧞");
  expect(
    await mark.evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe("rgba(0, 0, 0, 0)");
  await expect(page.locator("footer .footer__mark")).toHaveText("🧞");

  // Favicon set: SVG emoji primary + Noto-derived PNG fallbacks.
  await expect(
    page.locator("link[rel='icon'][type='image/svg+xml']"),
  ).toHaveAttribute("href", "/favicon.svg");
  await expect(page.locator("link[rel='apple-touch-icon']")).toHaveAttribute(
    "href",
    "/apple-touch-icon.png",
  );
  for (const asset of [
    "/favicon.svg",
    "/favicon-32.png",
    "/favicon-64.png",
    "/apple-touch-icon.png",
    "/og.png",
  ]) {
    const response = await request.get(asset);
    expect(response.status()).toBe(200);
    if (asset.endsWith(".png")) {
      expect(response.headers()["content-type"]).toBe("image/png");
    }
  }

  // Social meta (copy deck + AMENDMENT §3 OG spec).
  await expect(page.locator("meta[property='og:title']")).toHaveAttribute(
    "content",
    "Jinn - Run your own AI company",
  );
  await expect(page.locator("meta[property='og:description']")).toHaveAttribute(
    "content",
    META_DESCRIPTION,
  );
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute(
    "content",
    "https://jinn.run/og.png",
  );
  await expect(page.locator("meta[property='og:image:width']")).toHaveAttribute(
    "content",
    "1200",
  );
  await expect(
    page.locator("meta[property='og:image:height']"),
  ).toHaveAttribute("content", "630");
  await expect(page.locator("meta[property='og:image:type']")).toHaveAttribute(
    "content",
    "image/png",
  );
  await expect(page.locator("meta[property='og:image:alt']")).toHaveAttribute(
    "content",
    "Jinn - Run your own AI company",
  );
  await expect(page.locator("meta[name='twitter:card']")).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("publishes canonical marketing URLs and a crawler policy", async ({
  page,
  request,
}) => {
  for (const [route, canonical] of [
    ["/", "https://jinn.run/"],
    ["/features/", "https://jinn.run/features/"],
  ] as const) {
    await page.goto(route);
    await expect(page.locator("link[rel='canonical']")).toHaveCount(1);
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
      "href",
      canonical,
    );
  }

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toBe("text/plain; charset=utf-8");
  expect(await robots.text()).toBe(
    "User-agent: *\nAllow: /\nSitemap: https://jinn.run/sitemap-index.xml\n",
  );
});

test("serves the custom 404 inside the marketing shell", async ({ page }) => {
  const unexpectedConsoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const httpErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text() !==
        "Failed to load resource: the server responded with a status of 404 (Not Found)"
    ) {
      unexpectedConsoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) =>
    failedRequests.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`,
    ),
  );
  page.on("response", (response) => {
    if (response.status() >= 400) {
      const url = new URL(response.url());
      httpErrors.push(
        `${response.request().resourceType()} ${url.pathname} ${response.status()}`,
      );
    }
  });

  const response = await page.goto("/missing-page");

  expect(response?.status()).toBe(404);
  expect(httpErrors).toEqual(["document /missing-page 404"]);
  expect(unexpectedConsoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  await expect(page).toHaveTitle("Page not found - Jinn");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Page not found - Jinn",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow",
  );
  await expect(page.locator("link[rel='canonical']")).toHaveCount(0);
  await expect(page.locator("meta[property='og:url']")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-page", "not-found");
  await expect(
    page.getByRole("heading", { level: 1, name: "Nothing here." }),
  ).toBeVisible();
  await expect(
    page.getByText("The page you're looking for doesn't exist."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back home →" })).toHaveAttribute(
    "href",
    "/",
  );

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    ),
  ).toEqual([]);
});

test("publishes only public routes in the production sitemap", async ({
  request,
}) => {
  const response = await request.get("/sitemap-0.xml");
  expect(response.status()).toBe(200);
  const locations = Array.from(
    (await response.text()).matchAll(/<loc>(.*?)<\/loc>/gu),
    (match) => match[1],
  );

  const expected = [
    "https://jinn.run/",
    "https://jinn.run/docs/",
    "https://jinn.run/docs/changelog/",
    "https://jinn.run/docs/changelog/0.25.0/",
    "https://jinn.run/docs/changelog/0.26.0/",
    ...[
      "approvals",
      "employees",
      "gateway-and-local-first",
      "mcp",
      "sessions-and-delegation",
      "todos",
      "triggers",
      "workflows",
    ].map((page) => `https://jinn.run/docs/core-concepts/${page}/`),
    ...["configuration", "first-company", "install", "update-and-migrate"].map(
      (page) => `https://jinn.run/docs/getting-started/${page}/`,
    ),
    ...[
      "add-and-manage-skills",
      "build-an-ai-team",
      "connect-slack",
      "create-a-workflow",
      "pair-another-device",
      "schedule-work",
    ].map((page) => `https://jinn.run/docs/guides/${page}/`),
    ...[
      "instances",
      "lifecycle",
      "migrations",
      "pairing-and-limits",
      "skills",
    ].map((page) => `https://jinn.run/docs/reference/cli/${page}/`),
    ...[
      "authentication",
      "cron-and-connectors",
      "engines-and-limits",
      "files-and-media",
      "org-skills-and-knowledge",
      "sessions-and-delegation",
      "todos",
      "workflows-and-triggers",
    ].map((page) => `https://jinn.run/docs/reference/gateway-api/${page}/`),
    "https://jinn.run/features/",
  ];

  expect([...locations].sort()).toEqual([...expected].sort());
});

test("indexable launch routes emit no console, page, or network errors", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      failures.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`));
  page.on("requestfailed", (request) =>
    failures.push(
      `network: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`,
    ),
  );

  for (const route of [
    "/",
    "/features/",
    "/docs/",
    "/docs/getting-started/install/",
  ]) {
    await page.goto(route, { waitUntil: "networkidle" });
  }

  expect(failures).toEqual([]);
});

test("keeps cumulative layout shift negligible while fonts settle", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as Window & { __marketingCls?: number };
    state.__marketingCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<
        PerformanceEntry & { hadRecentInput: boolean; value: number }
      >) {
        if (!entry.hadRecentInput)
          state.__marketingCls = (state.__marketingCls ?? 0) + entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  // Wait for the hero entrance to finish (its last beat ends ~1900ms) so a
  // late transform/opacity regression could not slip past a 250ms probe.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  );
  await page.waitForTimeout(250);

  const cls = await page.evaluate(
    () => (window as Window & { __marketingCls?: number }).__marketingCls ?? 0,
  );
  expect(cls).toBeLessThanOrEqual(0.01);
});

test("cross-tweens every themed surface on one 900ms clock", async ({
  page,
}) => {
  await page.goto("/");

  // Deterministic in-page probe (the flaky-reversal precedent): observe
  // frames with requestAnimationFrame instead of racing wall-clock
  // samples across the protocol. The invariant is expressed per frame -
  // one frame must show EVERY themed surface mid-flight together, with
  // the live transitions all on the one 900ms clock.
  const probe = await page.evaluate(
    async ({ dark, light }) => {
      const parse = (value: string): number[] =>
        (value.match(/[\d.]+/gu) ?? []).slice(0, 3).map(Number);
      const between = (
        value: string,
        start: readonly number[],
        end: readonly number[],
      ): boolean =>
        parse(value).every(
          (channel, index) =>
            channel > Math.min(start[index], end[index]) &&
            channel < Math.max(start[index], end[index]),
        );
      const readFrame = () => {
        const nav = document.querySelector<HTMLElement>(".site-nav")!;
        const install =
          document.querySelector<HTMLElement>(".site-nav__install")!;
        return {
          background: getComputedStyle(document.body).backgroundColor,
          color: getComputedStyle(document.documentElement).color,
          install: getComputedStyle(install).backgroundColor,
          navShadow: getComputedStyle(nav).boxShadow,
        };
      };
      const nextFrame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      document.dispatchEvent(
        new CustomEvent("jinn:theme-change", { detail: { theme: "light" } }),
      );

      let intermediate: ReturnType<typeof readFrame> | null = null;
      let transitions: { duration: number; property: string }[] = [];
      for (let frame = 0; frame < 240; frame += 1) {
        await nextFrame();
        const current = readFrame();
        if (
          !intermediate &&
          between(current.background, dark.background, light.background) &&
          between(current.color, dark.text, light.text) &&
          between(current.install, dark.accent, light.accent)
        ) {
          intermediate = current;
          transitions = document
            .getAnimations()
            .map((animation) => ({
              duration: Number(animation.effect?.getTiming().duration),
              property: (animation as CSSTransition).transitionProperty,
            }))
            .filter(({ property }) => typeof property === "string");
        }
        if (
          intermediate &&
          document.documentElement.dataset.themeTransition === undefined
        ) {
          break;
        }
      }
      // Let the transition contract finish before reading the final frame.
      for (
        let frame = 0;
        frame < 240 &&
        document.documentElement.dataset.themeTransition !== undefined;
        frame += 1
      ) {
        await nextFrame();
      }

      return {
        intermediate,
        transitions,
        final: readFrame(),
        theme: document.documentElement.dataset.theme ?? null,
        transitionAttr:
          document.documentElement.dataset.themeTransition ?? null,
      };
    },
    {
      dark: themeColors.dark,
      light: themeColors.light,
    },
  );

  // One frame carried every themed surface mid-flight together - page,
  // root text, and the nav's accent surface (the brand mark is now the
  // typographic 🧞 glyph, AMENDMENT §3) - with a live shadow.
  expect(probe.intermediate).not.toBeNull();
  expect(probe.intermediate!.navShadow).not.toBe("none");
  expect(probe.transitions).toEqual(
    expect.arrayContaining(
      ["background-color", "color", "box-shadow"].map((property) =>
        expect.objectContaining({ duration: 900, property }),
      ),
    ),
  );

  expect(probe.theme).toBe("light");
  expect(probe.transitionAttr).toBeNull();
  expect(parseRgb(probe.final.background)).toEqual(
    themeColors.light.background,
  );

  const lightResults = await new AxeBuilder({ page }).analyze();
  expect(
    lightResults.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    ),
  ).toEqual([]);
});

test("reverses mid-flight from the current visual state without snapping", async ({
  page,
}) => {
  await page.goto("/");

  const { beforeReverse, immediatelyAfterReverse, returning } =
    await page.evaluate(
      async ({ dark, light }) => {
        const readBackground = (): [number, number, number] => {
          const channels = getComputedStyle(document.body)
            .backgroundColor.match(/[\d.]+/gu)
            ?.slice(0, 3)
            .map(Number);
          if (!channels || channels.length !== 3) {
            throw new Error("Expected the body background to be an RGB color");
          }
          return channels as [number, number, number];
        };
        const distance = (left: readonly number[], right: readonly number[]) =>
          left.reduce(
            (total, channel, index) => total + Math.abs(channel - right[index]),
            0,
          );
        const nextFrame = () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );

        document.dispatchEvent(
          new CustomEvent("jinn:theme-change", {
            detail: { theme: "light" },
          }),
        );

        let beforeReverse: [number, number, number] | undefined;
        for (let frame = 0; frame < 120; frame += 1) {
          await nextFrame();
          const current = readBackground();
          if (distance(current, dark) > 120 && distance(current, light) > 120) {
            beforeReverse = current;
            break;
          }
        }
        if (!beforeReverse) {
          throw new Error(
            "Theme transition never reached an intermediate frame",
          );
        }

        document.dispatchEvent(
          new CustomEvent("jinn:theme-change", {
            detail: { theme: "dark" },
          }),
        );
        const immediatelyAfterReverse = readBackground();

        let returning: [number, number, number] | undefined;
        for (let frame = 0; frame < 120; frame += 1) {
          await nextFrame();
          const current = readBackground();
          if (distance(current, dark) < distance(beforeReverse, dark) - 2) {
            returning = current;
            break;
          }
        }
        if (!returning) {
          throw new Error("Theme transition never returned toward dark");
        }

        return { beforeReverse, immediatelyAfterReverse, returning };
      },
      {
        dark: [...themeColors.dark.background],
        light: [...themeColors.light.background],
      },
    );

  expect(
    colorDistance(beforeReverse, themeColors.dark.background),
  ).toBeGreaterThan(10);
  expect(
    colorDistance(beforeReverse, themeColors.light.background),
  ).toBeGreaterThan(10);
  expect(colorDistance(immediatelyAfterReverse, beforeReverse)).toBeLessThan(2);
  expect(
    colorDistance(immediatelyAfterReverse, themeColors.light.background),
  ).toBeGreaterThan(10);
  expect(
    colorDistance(immediatelyAfterReverse, themeColors.dark.background),
  ).toBeGreaterThan(10);
  expect(colorDistance(returning, themeColors.dark.background)).toBeLessThan(
    colorDistance(beforeReverse, themeColors.dark.background),
  );

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme-transition",
  );
});

test("cross-tweens when the View Transitions API is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Document.prototype, "startViewTransition", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");
  expect(await page.evaluate(() => typeof document.startViewTransition)).toBe(
    "undefined",
  );

  await page.evaluate(() => {
    document.dispatchEvent(
      new CustomEvent("jinn:theme-change", { detail: { theme: "light" } }),
    );
  });
  await page.waitForTimeout(450);

  const intermediate = await readThemeFrame(page);
  expectIntermediateColor(
    intermediate.background,
    themeColors.dark.background,
    themeColors.light.background,
  );
  expect(intermediate.transitions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        duration: 900,
        property: "background-color",
      }),
    ]),
  );

  await page.waitForTimeout(500);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme-transition",
  );
  expect(parseRgb((await readThemeFrame(page)).background)).toEqual(
    themeColors.light.background,
  );
});

test("changes theme without animation when reduced motion is requested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.evaluate(() => {
    document.dispatchEvent(
      new CustomEvent("jinn:theme-change", {
        detail: { theme: "light" },
      }),
    );
  });

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme-transition",
  );
});

for (const machineRoute of ["/agents.md", "/llms.txt"] as const) {
  test(`${machineRoute} is a plain-text production artifact`, async ({
    request,
  }) => {
    const response = await request.get(machineRoute);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe(
      "text/plain; charset=utf-8",
    );

    const body = await response.text();
    expect(body).toMatch(/^# Jinn/m);
    expect(body).not.toMatch(/<!doctype|<html/i);
  });
}

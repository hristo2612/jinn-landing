import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function contrastRatio(foreground: string, background: string): number {
  const channels = (value: string): number[] =>
    [...value.matchAll(/[\d.]+/gu)]
      .slice(0, 3)
      .map(([channel]) => Number(channel));
  const luminance = (value: string): number => {
    const [red, green, blue] = channels(value).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

async function useTheme(page: Page, theme: "dark" | "light"): Promise<void> {
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
    localStorage.setItem("starlight-theme", value);
  }, theme);
  await page.reload();
}

test("documentation sidebar renders every C2 group", async ({ page }) => {
  await page.goto("/docs/getting-started/install/");

  for (const group of [
    "Getting Started",
    "Core Concepts",
    "Guides",
    "Gateway API",
    "CLI Reference",
    "Changelog",
  ]) {
    await expect(page.getByText(group, { exact: true }).first()).toBeVisible();
  }
});

test("documentation pages publish the shared social image", async ({
  page,
}) => {
  for (const route of ["/docs/", "/docs/getting-started/install/"]) {
    await page.goto(route);
    await expect(page.locator("meta[property='og:image']")).toHaveAttribute(
      "content",
      "https://jinn.run/og.png",
    );
    await expect(
      page.locator("meta[property='og:image:width']"),
    ).toHaveAttribute("content", "1200");
    await expect(
      page.locator("meta[property='og:image:height']"),
    ).toHaveAttribute("content", "630");
    await expect(
      page.locator("meta[property='og:image:type']"),
    ).toHaveAttribute("content", "image/png");
    await expect(page.locator("meta[name='twitter:image']")).toHaveAttribute(
      "content",
      "https://jinn.run/og.png",
    );
  }
});

test("representative documentation is accessible", async ({ page }) => {
  await page.goto("/docs/getting-started/install/");

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    ),
  ).toEqual([]);
});

test("documentation chrome stays quiet and touch-safe on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/reference/gateway-api/authentication/");

  for (const control of [
    page.getByRole("button", { name: /Search/u }),
    page.getByRole("button", { name: /Menu/u }),
  ]) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(40);
    expect(box?.height).toBeGreaterThanOrEqual(40);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );

  await page.getByRole("button", { name: /Menu/u }).click();
  const activeLink = page
    .getByRole("link", { name: "Authentication", exact: true })
    .last();
  await expect(activeLink).toBeVisible();
  expect(
    await activeLink.evaluate(
      (element) => getComputedStyle(element, "::before").content,
    ),
  ).not.toBe("none");
});

test("documentation keeps Starlight code-copy controls usable", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/reference/gateway-api/authentication/");

  const copy = page.locator(".expressive-code .copy button").first();
  await copy.scrollIntoViewIfNeeded();
  await copy.click();

  await expect(
    page.locator(".expressive-code .copy [aria-live]").first(),
  ).toHaveText("Copied!");
});

test("settled copy feedback uses visible theme-aware Ledger colors", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  for (const theme of ["light", "dark"] as const) {
    await page.goto("/docs/reference/gateway-api/sessions-and-delegation/");
    await useTheme(page, theme);

    const copy = page.locator(".expressive-code .copy button").first();
    await copy.scrollIntoViewIfNeeded();
    await copy.click();

    const feedback = page
      .locator(".expressive-code .copy .feedback.show")
      .first();
    await expect(feedback).toBeVisible();
    await expect
      .poll(() =>
        feedback.evaluate((element) =>
          Number(getComputedStyle(element).opacity),
        ),
      )
      .toBeGreaterThanOrEqual(0.99);

    const colors = await feedback.evaluate((element) => {
      const actual = getComputedStyle(element);
      const expected = document.createElement("span");
      expected.style.color = "var(--accent-contrast)";
      expected.style.backgroundColor = "var(--system-green)";
      document.body.append(expected);
      const expectedStyle = getComputedStyle(expected);
      const values = {
        foreground: actual.color,
        background: actual.backgroundColor,
        expectedForeground: expectedStyle.color,
        expectedBackground: expectedStyle.backgroundColor,
        visibility: actual.visibility,
      };
      expected.remove();
      return values;
    });

    expect(colors.visibility).toBe("visible");
    expect(colors.foreground).toBe(colors.expectedForeground);
    expect(colors.background).toBe(colors.expectedBackground);
    expect(
      contrastRatio(colors.foreground, colors.background),
    ).toBeGreaterThanOrEqual(4.5);
  }
});

test("wide API tables are named focusable regions that reach hidden columns by keyboard", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const theme of ["light", "dark"] as const) {
      await page.goto("/docs/reference/gateway-api/sessions-and-delegation/");
      await useTheme(page, theme);

      const table = page.locator(".sl-markdown-content table").first();
      await expect(table).toHaveAttribute("tabindex", "0");
      await expect(table).toHaveAttribute(
        "aria-label",
        /Sessions and Delegation API data table/u,
      );
      await table.focus();
      await expect(table).toBeFocused();
      expect(
        await table.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).outlineWidth),
        ),
      ).toBeGreaterThanOrEqual(2);

      const maximum = await table.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      );
      expect(maximum).toBeGreaterThan(0);
      for (let press = 0; press < 64; press += 1)
        await table.press("ArrowRight");
      await expect
        .poll(() => table.evaluate((element) => element.scrollLeft))
        .toBeGreaterThanOrEqual(maximum - 2);

      const results = await new AxeBuilder({ page })
        .withRules(["scrollable-region-focusable"])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  }
});

test("opening the mobile drawer reveals the current route without manual scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/reference/gateway-api/sessions-and-delegation/");
  await page.evaluate(() => sessionStorage.removeItem("sl-sidebar-state"));
  await page.reload();
  await page.getByRole("button", { name: /Menu/u }).click();

  const activeLink = page
    .getByRole("link", { name: "Sessions and Delegation API", exact: true })
    .last();
  await expect(activeLink).toBeVisible();
  const position = await activeLink.evaluate((element) => {
    const scroller = element.closest(".sidebar-pane");
    if (!(scroller instanceof HTMLElement))
      throw new Error("missing sidebar scroller");
    return {
      active: element.getBoundingClientRect().toJSON(),
      scroller: scroller.getBoundingClientRect().toJSON(),
      scrollTop: scroller.scrollTop,
    };
  });
  expect(position.scrollTop).toBeGreaterThan(0);
  expect(position.active.top).toBeGreaterThanOrEqual(position.scroller.top);
  expect(position.active.bottom).toBeLessThanOrEqual(position.scroller.bottom);
});

test("open Pagefind search has a real accessible name on desktop and mobile", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/docs/");
    await page.getByRole("button", { name: /Search/u }).click();

    const input = page.locator("#starlight__search input").first();
    await expect(input).toHaveAttribute("aria-label", "Search documentation");
    await expect(input).toBeFocused();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(
        ({ impact }) => impact === "serious" || impact === "critical",
      ),
    ).toEqual([]);
  }
});

test("empty social chrome does not draw a decorative header divider", async ({
  page,
}) => {
  await page.goto("/docs/");

  expect(
    await page
      .locator("header .social-icons")
      .evaluate((element) => getComputedStyle(element, "::after").display),
  ).toBe("none");
});

test("documentation search opens, resolves, and navigates", async ({
  page,
}) => {
  await page.goto("/docs/");
  await page.getByRole("button", { name: /Search/u }).click();
  await page.getByPlaceholder("Search").fill("authentication");

  const result = page
    .getByRole("dialog")
    .getByRole("link", { name: "Authentication", exact: true })
    .first();
  await expect(result).toHaveAttribute(
    "href",
    "/docs/reference/gateway-api/authentication/",
  );
  await result.click();

  await expect(page).toHaveURL(
    /\/docs\/reference\/gateway-api\/authentication\/$/u,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Authentication",
  );
});

test("Gateway API sidebar exposes Engines and Limits discovery", async ({
  page,
}) => {
  await page.goto("/docs/reference/gateway-api/sessions-and-delegation/");

  const link = page.getByRole("link", { name: "Engines and Limits API" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    "href",
    "/docs/reference/gateway-api/engines-and-limits/",
  );
  await link.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Engines and Limits API",
  );
  await expect(
    page.getByText("GET /api/engines", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("GET /api/engine-limits", { exact: true }).first(),
  ).toBeVisible();
});

test("machine routes expose the complete agent contract", async ({
  request,
}) => {
  const agents = await request.get("/agents.md");
  expect(agents.status()).toBe(200);
  const agentBody = await agents.text();
  expect(agentBody).toContain("POST /api/sessions");
  expect(agentBody).toContain("GET /api/engines");
  expect(agentBody).toContain("multipart/form-data");
  expect(agentBody).toContain("POST /api/delegations");
  expect(agentBody).toContain("POST /api/workflows/events/ticket.created");
  expect(agentBody).toContain("decide_work_item_approval");
  expect(agentBody).not.toContain(
    "Jinn is an open-source, local-first gateway.\n",
  );

  const llms = await request.get("/llms.txt");
  expect(llms.status()).toBe(200);
  const llmsBody = await llms.text();
  expect(llmsBody).toContain("Current documented version: 0.28.2");
  expect(llmsBody).toContain("Release date: 2026-07-24");
  expect(llmsBody).toContain("Documentation policy: latest stable release");
  expect(llmsBody).toContain("https://jinn.run/docs/getting-started/install/");
  expect(llmsBody).toContain("https://jinn.run/agents.md");
});

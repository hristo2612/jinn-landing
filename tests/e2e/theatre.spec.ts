import { expect, test, type Page } from "@playwright/test";
import { MORNING_PANE, NIGHT_FEED } from "../../src/lib/scenes/dashboard";

const NIGHT = "[data-scene-window][data-scene-id='night-shift']";
const MORNING = "[data-scene-window][data-scene-id='morning-approval']";

async function centerWindow(page: Page, selector: string): Promise<void> {
  await page
    .locator(selector)
    .evaluate((node) =>
      node.scrollIntoView({ block: "center", behavior: "instant" }),
    );
}

async function waitForMorningResolved(page: Page): Promise<void> {
  await centerWindow(page, MORNING);
  await expect(page.locator(MORNING)).toHaveAttribute(
    "data-scene-checkpoint",
    "resolved",
    { timeout: 15_000 },
  );
}

test.describe("section 6 - while you slept", () => {
  test("renders the overnight feed verbatim from canonical data", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const feed = page.locator(NIGHT);

    await expect(feed.locator("[data-field='header']")).toHaveText(
      NIGHT_FEED.header,
    );
    for (const row of NIGHT_FEED.rows) {
      const rowRoot = feed.locator(`[data-target='${row.target}']`);
      await expect(rowRoot.locator("[data-field='time']")).toHaveText(row.time);
      await expect(rowRoot.locator("[data-field='text']")).toHaveText(row.text);
      await expect(rowRoot).toHaveAttribute("data-tone", row.tone);
    }
    // Only the waiting decision holds the amber wash. Without motion the
    // wash ships statically on the amber-tone row; `data-active` is
    // playback state and must not be pre-lit in the markup.
    await expect(feed.locator("[data-target][data-active]")).toHaveCount(0);
    const washes = await feed
      .locator("[data-target^='row-']")
      .evaluateAll((rows) =>
        rows.map((row) => getComputedStyle(row).backgroundColor),
      );
    expect(washes.filter((color) => color !== "rgba(0, 0, 0, 0)")).toEqual([
      "rgba(224, 163, 60, 0.14)",
    ]);
    expect(washes.at(-1)).toBe("rgba(224, 163, 60, 0.14)");
  });

  test("applies the amber wash only at its authored 3000ms beat", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(900);
    await centerWindow(page, NIGHT);

    // Mid-scene - rows entering, highlight beat not yet reached - the
    // reducer's highlight map is empty, so the DOM must carry no wash.
    const before = await page.waitForFunction(
      (selector) => {
        const figure = document.querySelector<HTMLElement>(selector);
        const time = Number(figure?.dataset.sceneTime ?? "0");
        if (time < 1_500 || time > 2_900) return null;
        const row = figure!.querySelector("[data-target='row-6']");
        return { time, active: row?.hasAttribute("data-active") ?? false };
      },
      NIGHT,
      { timeout: 10_000 },
    );
    const probe = await before.jsonValue();
    expect(probe).not.toBeNull();
    expect(probe!.active).toBe(false);

    await expect(page.locator(NIGHT)).toHaveAttribute(
      "data-scene-checkpoint",
      "resolved",
      { timeout: 10_000 },
    );
    await expect(
      page.locator(`${NIGHT} [data-target='row-6']`),
    ).toHaveAttribute("data-active", "");
  });

  test("plays once on entry, stays dark, and retains the resolved feed", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await centerWindow(page, NIGHT);
    await expect(page.locator(NIGHT)).toHaveAttribute(
      "data-scene-checkpoint",
      "resolved",
      { timeout: 10_000 },
    );
    // The night section is the payoff of the dark opening - no theme change.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(
      page.locator(`${NIGHT} [data-target='row-6']`),
    ).toHaveAttribute("data-active", "");
  });
});

test.describe("section 7 - stable-theme approval", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("stays dark at load, through Morning, and at the final CTA", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await waitForMorningResolved(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.locator("#install").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("resolves run #142 honestly without mutating the page theme", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForMorningResolved(page);

    const morning = page.locator(MORNING);
    await expect(morning.locator("[data-target='step-gate']")).toHaveAttribute(
      "data-state",
      "approved",
    );
    await expect(
      morning.locator("[data-target='step-gate-status']"),
    ).toHaveText(MORNING_PANE.steps[0].detail);
    await expect(morning.locator("[data-target='step-post']")).toHaveAttribute(
      "data-state",
      "done",
    );
    await expect(
      morning.locator("[data-target='step-post-status']"),
    ).toHaveText(MORNING_PANE.steps[1].detail);
    await expect(morning.locator("[data-target='run-badge']")).toHaveAttribute(
      "data-state",
      "completed",
    );
    await expect(morning.locator("[data-target='rail-tail']")).toHaveAttribute(
      "data-progress",
      String(MORNING_PANE.progress),
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ] as const) {
    test(`a fresh ${viewport.name} load at /#install stays dark`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/#install");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(page.locator("[data-daylight]")).toHaveCount(0);
    });
  }

  test("clicking Install keeps the theme stable", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Install" }).click();
    await expect(page).toHaveURL(/#install$/u);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("honest state - the gate resolves only in the morning", () => {
  test("the workflow story stays parked after the morning approves", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitForMorningResolved(page);

    // Return to the independent workflow proof. Its gate is still awaiting a
    // human - parked is authoritative everywhere but the morning scene.
    await page
      .locator("[data-scene-window][data-scene-id='workflow-approval']")
      .evaluate((node) => {
        const rect = node.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top + rect.height / 2 - innerHeight / 2,
        });
      });
    const workflow = page.locator(
      "[data-scene-window][data-scene-id='workflow-approval']",
    );
    await expect(workflow.locator("[data-target='step-gate']")).toHaveAttribute(
      "data-state",
      "awaiting-approval",
      { timeout: 10_000 },
    );
    await expect(workflow.locator("[data-target='step-post']")).toHaveAttribute(
      "data-state",
      "queued",
    );
    await expect(workflow.locator("[data-target='run-badge']")).toHaveText(
      "Running",
    );
    await expect(workflow.locator("[data-target='rail']")).toHaveAttribute(
      "data-progress",
      String(2 / 3),
    );
  });
});

test.describe("morning surface - canonical data", () => {
  test("renders the approval card and rail tail verbatim", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const morning = page.locator(MORNING);

    const card = morning.locator("[data-target='approval-card']");
    await expect(card.locator("[data-field='header']")).toHaveText(
      MORNING_PANE.header,
    );
    await expect(card.locator("[data-field='title']")).toHaveText(
      MORNING_PANE.title,
    );
    await expect(card.locator("[data-field='line']")).toHaveText(
      MORNING_PANE.line,
    );
    await expect(card.locator("[data-field='hold']")).toHaveText(
      MORNING_PANE.holdLabel,
    );
    await expect(card.locator("[data-field='approve']")).toHaveText(
      MORNING_PANE.approveLabel,
    );
    await expect(morning.locator("[data-field='run']")).toHaveText(
      MORNING_PANE.run,
    );
    for (const step of MORNING_PANE.steps) {
      const stepRoot = morning.locator(`[data-target='${step.target}']`);
      await expect(stepRoot).toHaveAttribute("data-state", step.status);
      await expect(stepRoot.locator("[data-field='title']")).toHaveText(
        step.title,
      );
      await expect(stepRoot.locator("[data-field='status']")).toHaveText(
        step.detail,
      );
    }
  });
});

test.describe("stable theme (reduced motion / no JS)", () => {
  test("reduced motion serves one dark page with the resolved proof", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("[data-daylight]")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
    ).toBe("rgb(20, 19, 15)");

    // The morning proof stands resolved with no scene runtime at all.
    const morning = page.locator(MORNING);
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene-runtime",
      "reduced",
    );
    await expect(morning).not.toHaveAttribute("data-scene-player-state", /.+/u);
    await expect(morning.locator("[data-target='step-gate']")).toHaveAttribute(
      "data-state",
      "approved",
    );
  });

  test("no JS serves the same stable theme with the resolved proof", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(baseURL!);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("[data-daylight]")).toHaveCount(0);
    await expect(
      page.locator(`${MORNING} [data-target='step-gate']`),
    ).toHaveAttribute("data-state", "approved");
    // The waiting row's wash ships statically (no playback attribute).
    expect(
      await page
        .locator(`${NIGHT} [data-target='row-6']`)
        .evaluate((row) => getComputedStyle(row).backgroundColor),
    ).toBe("rgba(224, 163, 60, 0.14)");
    await context.close();
  });
});

test.describe("sections 8–11 - the final dark sections", () => {
  test("serializes every visible string exactly from the copy deck", async ({
    page,
  }) => {
    await page.goto("/");

    const serialize = (selector: string) =>
      page
        .locator(selector)
        .evaluate((node) =>
          (node as HTMLElement).innerText.replace(/\s+/gu, " ").trim(),
        );

    // Whole-section serialization: the closed deck's law is that no other
    // visible text may appear, so compare everything, not fragments.
    // Kickers serialize in their rendered (CSS-uppercased) form - the
    // design system's kicker treatment, authored lowercase in the deck.
    expect(await serialize(".mcp")).toBe(
      [
        "MCP IS THE HANDS",
        "One tool interface. The whole company.",
        "Every employee operates Jinn through the same MCP surface - org, todos, workflows, sessions. A COO orchestrates, reviews, and gates approvals, so you only see what matters.",
        "create_work_item · delegate_task · start_workflow_run · decide_approval",
      ].join(" "),
    );

    expect(await serialize("#install")).toBe(
      [
        "FROM ZERO TO COMPANY",
        "Three steps. Then it runs.",
        "01 · Install",
        "One command. The gateway runs on your machine - your keys, your data, nothing leaves home.",
        "$ npm i -g jinn-cli",
        "02 · Hire your team",
        "Describe a role in chat. Jinn drafts the persona, picks a model - Opus 4.8, GPT-5.6 Sol, Fable 5, and more - and seats them in the org.",
        "03 · Let it run",
        "Triggers wake the company. Workflows advance the work. The COO reports back - you approve what matters.",
      ].join(" "),
    );

    expect(await serialize(".cta")).toBe(
      [
        "Your company is one command away.",
        "$ npm install -g jinn-cli",
        "GitHub → npm →",
      ].join(" "),
    );

    expect(await serialize("footer")).toBe(
      // STORYBOARD-FEATURES §4.0/§13: the Features link joins the shared
      // footer on both pages.
      "🧞 jinn Open source · local-first · your keys, your machine Features Docs GitHub npm",
    );
  });
});

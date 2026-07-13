import { expect, test } from "@playwright/test";
import {
  RIBBON,
  SESSIONS,
  delegationResolved,
  segmentsToText,
} from "../../src/lib/scenes/dashboard";

const GITHUB_URL = "https://github.com/hristo2612/jinn";

test.describe("hero copy + canonical data", () => {
  test("renders the hero copy-deck strings verbatim", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".hero__eyebrow")).toHaveText(
      "Open source · Local-first · Multi-engine",
    );
    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline.locator(".hero__line").nth(0)).toHaveText(
      "Run your own",
    );
    await expect(headline.locator(".hero__line").nth(1)).toHaveText(
      "AI company.",
    );
    await expect(
      page.getByText(
        "Jinn is an open-source, local-first gateway. Hire AI employees, hand them real work, and step in only when it matters.",
        { exact: true },
      ),
    ).toBeVisible();
    const cmd = page.locator(".command-pill__cmd").first();
    await expect(cmd.locator(".command-pill__prompt")).toHaveText("$");
    const commandText = await cmd.evaluate((element) =>
      Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? "")
        .join("")
        .trim(),
    );
    expect(commandText).toBe("npm install -g jinn-cli");
    await expect(
      page.getByRole("link", { name: "View on GitHub" }),
    ).toHaveAttribute("href", GITHUB_URL);
    await expect(page.locator(".hero__scroll")).toHaveText("Scroll");
  });

  test("shipped DOM equals the canonical scene data (single source of truth)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const root = page.locator("[data-scene-window]").first();

    // Header pill + composer come from delegationResolved.
    await expect(root.locator(".chat__pill")).toHaveText(
      `${delegationResolved.pill.name}${delegationResolved.pill.meta}`,
    );
    await expect(root.locator(".chat__pill-sub")).toHaveText(
      delegationResolved.pill.meta,
    );
    await expect(root.locator("[data-target='composer-input']")).toHaveText(
      delegationResolved.composerPlaceholder,
    );

    // Every thread item's text appears exactly at its own local data-target.
    for (const item of delegationResolved.thread) {
      if (item.kind === "message") {
        await expect(root.locator(`[data-target='${item.target}']`)).toHaveText(
          segmentsToText(item.body),
        );
      } else if (item.kind === "chips") {
        for (const chip of item.chips) {
          await expect(
            root.locator(`[data-target='${chip.target}']`),
          ).toHaveText(`${chip.lead} ${segmentsToText(chip.body)}`);
        }
      }
    }

    // Sessions render verbatim, including the middle-dot subtitles.
    for (const row of SESSIONS) {
      const rowLocator = root
        .locator(".scene-window__srow")
        .filter({ hasText: row.title });
      await expect(rowLocator.locator(".scene-window__stt")).toHaveText(
        row.title,
      );
      await expect(rowLocator.locator(".scene-window__sst")).toHaveText(
        row.sub,
      );
    }
  });
});

test.describe("runtime shell contract", () => {
  test("exposes unique ribbon + pane targets for every pane", async ({
    page,
  }) => {
    await page.goto("/");
    const root = page.locator("[data-scene-window]").first();

    for (const item of RIBBON) {
      await expect(
        root.locator(`[data-target='ribbon-${item.pane}']`),
      ).toHaveCount(1);
      await expect(
        root.locator(`[data-target='pane-${item.pane}']`),
      ).toHaveCount(1);
    }

    // The active pane/ribbon is chat (the resolved hero state).
    await expect(root.locator("[data-target='ribbon-chat']")).toHaveAttribute(
      "data-active",
      "",
    );
    await expect(root.locator("[data-target='pane-chat']")).toHaveAttribute(
      "data-active",
      "",
    );
    await expect(root.locator("[data-target='pane-org']")).not.toHaveAttribute(
      "data-active",
      "",
    );
  });

  test("uses a single id-safe icon sprite", async ({ page }) => {
    await page.goto("/");

    const symbolIds = await page.$$eval("symbol", (nodes) =>
      nodes.map((node) => node.id),
    );
    const unique = new Set(symbolIds);
    expect(symbolIds.length).toBeGreaterThan(0);
    expect(unique.size).toBe(symbolIds.length); // no duplicate document ids
    expect(await page.locator(".scene-sprite").count()).toBe(1);
  });
});

test.describe("accessibility + focus contract", () => {
  test("keeps the decorative frame inert but reserves a real control slot", async ({
    page,
  }) => {
    await page.goto("/");
    const root = page.locator("[data-scene-window]").first();

    // No focusable controls inside the decorative frame chrome.
    await expect(
      root.locator(
        "[data-scene-frame] a, [data-scene-frame] button, [data-scene-frame] input, [data-scene-frame] select, [data-scene-frame] textarea, [data-scene-frame] [tabindex]",
      ),
    ).toHaveCount(0);
    await expect(root.locator("[data-scene-frame]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    // A non-aria-hidden control slot is reserved for the real pause control.
    const controls = root.locator("[data-scene-controls]");
    await expect(controls).toHaveCount(1);
    expect(await controls.getAttribute("aria-hidden")).toBeNull();

    // The scene proof reaches AT via the exact transcript.
    await expect(root.locator("figcaption")).toHaveText(
      "You message the COO about a signup dip. It replies with a plan, delegates research to the analyst and a copy fix to the writer, and reports the first finding - with a todo already open.",
    );

    // The copy button is a real, focusable control (the hero's is the
    // first of the page's three install pills).
    await expect(
      page.getByRole("button", { name: "Copy install command" }).first(),
    ).toBeVisible();
  });

  test("keeps the delegation resolved-state honest (no typing indicator)", async ({
    page,
  }) => {
    await page.goto("/");
    const root = page.locator("[data-scene-window]").first();
    await expect(root.locator("[data-target='thread-typing']")).toBeHidden();
  });
});

test.describe("install command pill", () => {
  test("every copy target is at least 44x44", async ({ page }) => {
    await page.goto("/");
    const buttons = page.getByRole("button", { name: "Copy install command" });
    // Hero, step 01, and the final CTA each carry an install pill.
    await expect(buttons).toHaveCount(3);
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("copies via the modern clipboard API with feedback", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    const pill = page.locator("[data-command-pill]").first();
    await pill.getByRole("button", { name: "Copy install command" }).click();

    await expect(pill).toHaveAttribute("data-copied", "true");
    await expect(pill.locator(".command-pill__status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "npm install -g jinn-cli",
    );
  });

  test("falls back to execCommand and cleans up its scratch node", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });
      document.execCommand = () => true;
    });
    await page.goto("/");

    const before = await page.locator("textarea").count();
    const pill = page.locator("[data-command-pill]").first();
    await pill.getByRole("button", { name: "Copy install command" }).click();

    await expect(pill).toHaveAttribute("data-copied", "true");
    expect(await page.locator("textarea").count()).toBe(before); // no leftover
  });

  test("shows no false feedback and leaks nothing when copy fails", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });
      document.execCommand = () => {
        throw new Error("copy blocked");
      };
    });
    await page.goto("/");

    const before = await page.locator("textarea").count();
    const pill = page.locator("[data-command-pill]").first();
    await pill.getByRole("button", { name: "Copy install command" }).click();

    await expect(pill).not.toHaveAttribute("data-copied", "true");
    expect(await page.locator("textarea").count()).toBe(before); // no leftover
  });
});

test.describe("motion + static-first", () => {
  test("opts into motion with the pre-paint flag", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "ok");
  });

  test("renders the full settled scene with no animation under reduced motion", async ({
    page,
  }) => {
    const scripts: string[] = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "script") {
        scripts.push(new URL(response.url()).pathname);
      }
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene-runtime",
      "reduced",
    );
    await expect(
      page.locator(
        "[data-scene-timeline-count], [data-scene-playback-control]",
      ),
    ).toHaveCount(0);
    expect(scripts.join("\n")).not.toMatch(
      /install-scene-system|scene-player|gsap|ScrollTrigger/iu,
    );

    const running = await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    );
    expect(running).toBe(0);
    const root = page.locator("[data-scene-window]").first();

    // The complete resolved scene is present.
    for (const item of delegationResolved.thread) {
      if (item.kind === "message") {
        await expect(
          root.locator(`[data-target='${item.target}']`),
        ).toBeVisible();
      }
    }
  });

  test("reinstalls motion scenes when the OS preference changes", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene-runtime",
      "reduced",
    );
    await expect(page.locator("[data-scene-player-state]")).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator("html")).toHaveAttribute("data-motion", "ok");
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene-runtime",
      "motion",
    );
    await expect(
      page.locator(
        "[data-scene-window][data-scene-id='delegation'][data-scene-player-state='playing']",
      ),
    ).toHaveCount(1);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene-runtime",
      "reduced",
    );
    await expect(page.locator("[data-scene-player-state]")).toHaveCount(0);
    await expect(page.locator("[data-scene-playback-control]")).toHaveCount(0);
  });

  test("communicates the product with JavaScript disabled", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");

    // No motion flag without JS; the settled scene still renders.
    expect(await page.locator("html").getAttribute("data-motion")).toBeNull();
    const root = page.locator("[data-scene-window]").first();
    await expect(root.locator("[data-target='thread-typing']")).toBeHidden();
    const finalMessage = delegationResolved.thread.find(
      (item) => item.kind === "message" && item.target === "msg-coo-2",
    );
    if (!finalMessage || finalMessage.kind !== "message") {
      throw new Error("Canonical final delegation message is missing");
    }
    await expect(root.locator("[data-target='msg-coo-2']")).toHaveText(
      segmentsToText(finalMessage.body),
    );
    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline.locator(".hero__line").nth(0)).toHaveText(
      "Run your own",
    );
    await expect(headline.locator(".hero__line").nth(1)).toHaveText(
      "AI company.",
    );
    await context.close();
  });
});

test.describe("mobile geometry", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("gives the pane one 16px gutter and drops the stage glow", async ({
    page,
  }) => {
    await page.goto("/");
    const root = page.locator("[data-scene-window]").first();

    const frame = await root.locator("[data-scene-frame]").boundingBox();
    expect(frame?.x).toBeGreaterThanOrEqual(14);
    expect(frame?.x).toBeLessThanOrEqual(18);
    expect(frame?.width).toBeGreaterThanOrEqual(352);

    // Ribbon + sidebar are cut on mobile.
    await expect(root.locator(".scene-window__ribbon")).toBeHidden();
    await expect(root.locator(".scene-window__sidebar")).toBeHidden();

    // Stage glow pseudo-element is disabled below 900px.
    const glowDisplay = await page.evaluate(() => {
      const el = document.querySelector("[data-scene-window]");
      return el ? getComputedStyle(el, "::before").display : "missing";
    });
    expect(glowDisplay).toBe("none");
  });
});

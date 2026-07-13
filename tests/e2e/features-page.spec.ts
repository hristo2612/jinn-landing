import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { DECK } from "./fixtures/features-deck";
import { featuresSceneDefinitions } from "../../src/lib/scenes/features-scene-registry";

/**
 * Every serialization oracle below is the FROZEN deck transcription in
 * fixtures/features-deck.ts (B2 review finding 10) - independent of the
 * src/lib/scenes/features module the page renders from, so implementation
 * and deck cannot drift together silently.
 */
const {
  DASHBOARD_CHIPS,
  ENGINE_CHIPS,
  ENGINE_PILL,
  FEATURES_CTA,
  FEATURES_HERO,
  FEATURES_META,
  FEATURES_SECTIONS,
  MCP_HANDS_CARD,
  ORG_HIRE_PANE,
  SKILL_CARD,
  SLACK_APPROVE_CARD,
  TODO_APPROVAL_PANE,
  TRIAGE_RUN_PANE,
  TREE_CARD,
  WEBHOOK_FIRE_PANE,
  CANVAS_STATUS_LINES,
  FEATURES_CAPTIONS,
} = DECK;

const segmentsToText = (body: readonly { text: string }[]): string =>
  body.map(({ text }) => text).join("");

const SCENE_IDS = [
  "engine-switch",
  "org-hire",
  "todo-approval",
  "triage-run",
  "webhook-fire",
  "mcp-hands",
  "slack-approve",
] as const;

const REQUIRED_PAUSE_SCENES = SCENE_IDS.filter((sceneId) => {
  const scene = featuresSceneDefinitions.get(sceneId)!;
  const resolvedAt = scene.checkpoints.find(
    ({ name }) => name === "resolved",
  )!.at;
  return (
    resolvedAt +
      (scene.playback.dwellMs ?? 0) +
      (scene.playback.quietResetMs ?? 0) >
    5_000
  );
});

function sceneWindow(page: Page, sceneId: string): Locator {
  return page.locator(`[data-scene-window][data-scene-id='${sceneId}']`);
}

test.describe("copy deck serialization (reduced motion = resolved truth)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/features/");
  });

  test("meta, hero, and CTA carry the deck verbatim", async ({ page }) => {
    await expect(page).toHaveTitle(FEATURES_META.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      FEATURES_META.description,
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    const hero = page.locator(".fhero");
    await expect(hero.locator(".fhero__eyebrow")).toHaveText(
      FEATURES_HERO.eyebrow,
    );
    await expect(hero.locator("h1")).toContainText(FEATURES_HERO.h1Thin);
    await expect(hero.locator("h1")).toContainText(`${FEATURES_HERO.h1Bold}.`);
    await expect(hero.locator(".fhero__sub")).toHaveText(FEATURES_HERO.sub);

    const cta = page.locator(".fcta");
    await expect(cta.locator("h2")).toContainText(FEATURES_CTA.h2Thin);
    await expect(cta.locator("h2")).toContainText(`${FEATURES_CTA.h2Bold}.`);
    await expect(cta.locator(".command-pill__cmd")).toContainText(
      FEATURES_CTA.command,
    );
  });

  test("every section serializes its kicker, title, body, and fact rail", async ({
    page,
  }) => {
    for (const copy of Object.values(FEATURES_SECTIONS)) {
      const section = page.locator(`#${copy.id}`);
      await expect(section.locator(".fsec__kicker, .rest__kicker")).toHaveText(
        copy.kicker,
      );
      await expect(section.locator("h2").first()).toHaveText(copy.title);
      await expect(section.locator(".fsec__body, .rest__body")).toHaveText(
        copy.body,
      );
      await expect(section.locator(".fact-rail__label")).toHaveText(
        copy.rail.map(({ label }) => label),
      );
      await expect(section.locator(".fact-rail__text")).toHaveText(
        copy.rail.map(({ text }) => text),
      );
    }
  });

  test("the engine and dashboard chip rows carry the deck's chips", async ({
    page,
  }) => {
    await expect(page.locator("#engines .chip-row__chip")).toHaveText([
      ...ENGINE_CHIPS,
    ]);
    await expect(page.locator("#dashboard .chip-row__chip")).toHaveText([
      ...DASHBOARD_CHIPS,
    ]);
  });

  test("the statics carry the SKILL.md snippet and the ~/.jinn tree", async ({
    page,
  }) => {
    const skill = page.locator("[data-static='skill']");
    await expect(skill.locator(".scard__path")).toHaveText(SKILL_CARD.path);
    for (const line of SKILL_CARD.snippet) {
      await expect(skill.locator("pre")).toContainText(line);
    }
    const tree = page.locator("[data-static='tree']");
    await expect(tree.locator("pre")).toContainText(TREE_CARD.root);
    for (const row of TREE_CARD.rows) {
      await expect(tree.locator("pre")).toContainText(row.name);
      await expect(tree.locator("pre")).toContainText(row.comment);
    }
  });

  test("every scene window ships its caption for assistive tech", async ({
    page,
  }) => {
    for (const sceneId of SCENE_IDS) {
      await expect(
        sceneWindow(page, sceneId).locator("[data-scene-caption]"),
      ).toHaveText(FEATURES_CAPTIONS[sceneId]);
    }
  });
});

test.describe("windows render the canonical resolved data (DOM == data)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/features/");
  });

  test("engine-switch: resolved thread, codex pill, composer", async ({
    page,
  }) => {
    const root = sceneWindow(page, "engine-switch");
    await expect(root.locator(".echat__engine-static")).toHaveText(
      ENGINE_PILL.engine,
    );
    for (const item of DECK.ENGINE_THREAD) {
      if (item.kind !== "message") continue;
      await expect(root.locator(`[data-target='${item.target}']`)).toHaveText(
        segmentsToText(item.body),
      );
    }
    await expect(root.locator("[data-target='composer-input']")).toHaveText(
      DECK.ENGINE_COMPOSER,
    );
  });

  test("org-hire: six employees, three departments, resolved header", async ({
    page,
  }) => {
    const root = sceneWindow(page, "org-hire");
    await expect(root.locator(".orgh__head-static")).toHaveText(
      ORG_HIRE_PANE.header,
    );
    for (const employee of ORG_HIRE_PANE.employees) {
      const node = root.locator(`[data-target='${employee.target}']`);
      await expect(node.locator("[data-field='name']")).toHaveText(
        employee.name,
      );
      await expect(node.locator("[data-field='role']")).toHaveText(
        employee.role,
      );
      await expect(node.locator("[data-field='engine']")).toHaveText(
        employee.engine,
      );
    }
    for (const department of ORG_HIRE_PANE.departments) {
      await expect(
        root.locator(
          `[data-target='${department.target}'] [data-field='label']`,
        ),
      ).toHaveText(department.label);
    }
  });

  test("todo-approval: segments, cards, and the decided approval row", async ({
    page,
  }) => {
    const root = sceneWindow(page, "todo-approval");
    await expect(root.locator("[data-field='segment']")).toHaveText(
      TODO_APPROVAL_PANE.segments.map(({ label }) => label),
    );
    for (const card of TODO_APPROVAL_PANE.cards) {
      const cardRoot = root.locator(`[data-target='${card.target}']`);
      await expect(cardRoot.locator("[data-field='title']")).toHaveText(
        card.title,
      );
      await expect(cardRoot.locator("[data-field='owner']")).toHaveText(
        card.owner,
      );
      // The deck's card state labels are serialized text (Addendum B2-1.7).
      await expect(cardRoot.locator("[data-field='state']")).toHaveText(
        card.statusLabel,
      );
    }
    await expect(
      root.locator("[data-target='card-refund'] [data-field='badge']"),
    ).toHaveText(TODO_APPROVAL_PANE.badge);
    const row = root.locator("[data-target='row-refund']");
    await expect(row).toHaveAttribute("data-state", "decided");
    await expect(row.locator("[data-field='request']")).toHaveText(
      TODO_APPROVAL_PANE.request,
    );
    await expect(row.locator("[data-target='row-approve']")).toHaveText(
      TODO_APPROVAL_PANE.approveLabel,
    );
    await expect(row.locator(".tap__sendback")).toHaveText(
      TODO_APPROVAL_PANE.sendBackLabel,
    );
    await expect(row.locator("[data-field='status']")).toHaveText(
      TODO_APPROVAL_PANE.decidedStatus,
    );
  });

  test("triage-run: node titles, status vocabulary, parked chip", async ({
    page,
  }) => {
    const root = sceneWindow(page, "triage-run");
    await expect(root.locator("[data-field='title']")).toHaveText(
      TRIAGE_RUN_PANE.title,
    );
    await expect(root.locator(".cmini__lens-seg")).toHaveText([
      ...TRIAGE_RUN_PANE.lenses,
    ]);
    for (const node of TRIAGE_RUN_PANE.nodes) {
      const el = root.locator(`[data-target='${node.target}']`);
      await expect(el.locator("[data-field='node-title']")).toHaveText(
        node.title,
      );
      await expect(el).toHaveAttribute("data-state", node.status);
    }
    // Status-line vocabulary, verbatim (status-line.ts).
    await expect(
      root.locator("[data-target='node-gate'] .cmini__s--awaiting"),
    ).toHaveText(new RegExp(CANVAS_STATUS_LINES["awaiting-approval"]));
    const chip = root.locator("[data-target='chip-run']");
    await expect(chip).toHaveAttribute("data-state", "waiting");
    await expect(chip.locator("[data-field='run']")).toHaveText(
      TRIAGE_RUN_PANE.chip.run,
    );
    await expect(chip.locator("[data-field='waiting']")).toHaveText(
      TRIAGE_RUN_PANE.chip.waiting,
    );
    await expect(
      root.locator("[data-target='edge-route-refund']"),
    ).toHaveAttribute("data-progress", "1");
  });

  test("webhook-fire: four bindings, token chip, fired label, run row", async ({
    page,
  }) => {
    const root = sceneWindow(page, "webhook-fire");
    await expect(root.locator("[data-field='header']")).toHaveText(
      WEBHOOK_FIRE_PANE.header,
    );
    for (const binding of WEBHOOK_FIRE_PANE.bindings) {
      const el = root.locator(`[data-target='${binding.target}']`);
      await expect(el.locator("[data-field='title']")).toHaveText(
        binding.title,
      );
      await expect(el.locator("[data-field='detail']")).toHaveText(
        binding.detail,
      );
      await expect(el.locator("[data-field='kind']")).toHaveText(binding.kind);
      if ("token" in binding && binding.token) {
        await expect(el.locator("[data-field='token']")).toHaveText(
          binding.token,
        );
      }
      if ("fired" in binding && binding.fired) {
        await expect(el.locator("[data-field='fired']")).toHaveText(
          binding.fired,
        );
      }
    }
    await expect(root.locator("[data-target='run-row']")).toHaveText(
      new RegExp(WEBHOOK_FIRE_PANE.run.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")),
    );
  });

  test("mcp-hands: four calls with their results", async ({ page }) => {
    const root = sceneWindow(page, "mcp-hands");
    await expect(root.locator("[data-field='header']")).toHaveText(
      MCP_HANDS_CARD.header,
    );
    for (const row of MCP_HANDS_CARD.rows) {
      const el = root.locator(`[data-target='${row.target}']`);
      await expect(el.locator("[data-field='call']")).toHaveText(row.call);
      await expect(el).toHaveAttribute("data-state", "ok");
      if ("result" in row && row.result) {
        await expect(el.locator("[data-field='result']")).toHaveText(
          row.result,
        );
      }
    }
  });

  test("slack-approve: channel, message, reaction, threaded reply", async ({
    page,
  }) => {
    const root = sceneWindow(page, "slack-approve");
    await expect(root.locator("[data-field='channel']")).toHaveText(
      SLACK_APPROVE_CARD.channel,
    );
    await expect(root.locator("[data-field='sender']")).toHaveText(
      SLACK_APPROVE_CARD.sender,
    );
    await expect(root.locator("[data-field='message']")).toHaveText(
      SLACK_APPROVE_CARD.message,
    );
    await expect(root.locator("[data-field='reaction']")).toHaveText(
      SLACK_APPROVE_CARD.reaction,
    );
    await expect(root.locator("[data-field='reply']")).toHaveText(
      SLACK_APPROVE_CARD.reply,
    );
  });
});

test.describe("window chrome and theme laws", () => {
  test("windows are pane-only crops - no ribbon, no sessions sidebar", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/features/");
    await expect(page.locator(".scene-window__ribbon")).toHaveCount(0);
    await expect(page.locator(".scene-window__sidebar")).toHaveCount(0);
    await expect(page.locator("[data-target^='ribbon-']")).toHaveCount(0);
    await expect(page.locator("[data-scene-window]")).toHaveCount(7);
  });

  test("§05 is the page's ONE dark-scoped window while <html> stays light", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/features/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("[data-scene-frame][data-theme]")).toHaveCount(1);
    const darkFrame = page.locator("[data-scene-frame][data-theme='dark']");
    await expect(darkFrame).toHaveCount(1);
    await expect(
      sceneWindow(page, "webhook-fire").locator("[data-scene-frame]"),
    ).toHaveAttribute("data-theme", "dark");

    const probe = await page.evaluate(() => {
      const parse = (value: string): number[] =>
        (value.match(/[\d.]+/gu) ?? []).slice(0, 3).map(Number);
      const luminance = (value: string): number => {
        const [r, g, b] = parse(value);
        return (r + g + b) / 3;
      };
      const frame = document.querySelector<HTMLElement>(
        "[data-scene-frame][data-theme='dark']",
      )!;
      return {
        frame: luminance(getComputedStyle(frame).backgroundColor),
        body: luminance(getComputedStyle(document.body).backgroundColor),
      };
    });
    expect(probe.frame).toBeLessThan(64);
    expect(probe.body).toBeGreaterThan(192);
  });

  test("reduced motion instantiates no scene runtime", async ({ page }) => {
    const scripts: string[] = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "script") {
        scripts.push(new URL(response.url()).pathname);
      }
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/features/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene-runtime",
      "reduced",
    );
    for (const sceneId of SCENE_IDS) {
      const root = sceneWindow(page, sceneId);
      await expect(root).not.toHaveAttribute("data-scene-player-state", /.+/u);
      await expect(root).not.toHaveAttribute(
        "data-scene-timeline-count",
        /.+/u,
      );
      await expect(root.locator(".scene-playback-control")).toHaveCount(0);
    }
    expect(scripts.join("\n")).not.toMatch(
      /install-scene-system|scene-player|gsap|ScrollTrigger/iu,
    );
  });

  test("no-JS serves the resolved proof statically", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/features/");
    await expect(
      page.locator("[data-target='row-refund'] [data-field='status']"),
    ).toHaveText(TODO_APPROVAL_PANE.decidedStatus);
    await expect(
      sceneWindow(page, "engine-switch").locator(".echat__engine-static"),
    ).toHaveText(ENGINE_PILL.engine);
    await expect(page.locator("[data-scene-timeline-count]")).toHaveCount(0);
    await context.close();
  });

  test("has no serious accessibility violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/features/");
    await page.evaluate(() => document.fonts.ready);
    // The full page is audited with NO exclusions (B2 review finding 8):
    // the decorative frames are aria-hidden for AT, but their visible
    // miniatures must still hold AA contrast for sighted low-vision
    // visitors.
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(({ impact }) =>
      ["critical", "serious"].includes(impact ?? ""),
    );
    expect(serious).toEqual([]);
  });

  test("todo approval active mobile-light metadata meets AA", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({
      colorScheme: "light",
      reducedMotion: "no-preference",
    });
    await page.goto("/features/");
    const root = sceneWindow(page, "todo-approval");
    await root.scrollIntoViewIfNeeded();
    await expect(root).toHaveAttribute(
      "data-scene-player-state",
      /playing|paused/u,
    );
    const metadataSelectors = [
      "[data-scene-id='todo-approval'] .tap__meta [data-field='owner']",
      "[data-scene-id='todo-approval'] .tap__meta [data-field='state']",
    ] as const;
    for (const selector of metadataSelectors) {
      const results = await new AxeBuilder({ page })
        .include(selector)
        .analyze();
      const contrast = results.violations
        .filter(({ id }) => id === "color-contrast")
        .flatMap(({ nodes }) => nodes);
      expect(contrast, selector).toEqual([]);
    }
  });
});

test.describe("the one page-wide motion channel across seven loops", () => {
  test("scrolling through hands ownership window to window", async ({
    page,
  }) => {
    await page.goto("/features/");
    await expect(sceneWindow(page, "engine-switch")).toHaveAttribute(
      "data-scene-player-state",
      "playing",
      {
        timeout: 10_000,
      },
    );

    for (const sceneId of ["todo-approval", "webhook-fire", "slack-approve"]) {
      await sceneWindow(page, sceneId).scrollIntoViewIfNeeded();
      await expect(sceneWindow(page, sceneId)).toHaveAttribute(
        "data-scene-player-state",
        "playing",
        { timeout: 10_000 },
      );
      const playing = page.locator("[data-scene-player-state='playing']");
      await expect(playing).toHaveCount(1);
    }
  });

  test("every window carries its own real ≥44px labeled pause control", async ({
    page,
  }) => {
    await page.goto("/features/");
    const controls = page.locator(
      "[data-scene-controls] .scene-playback-control",
    );
    await expect(controls).toHaveCount(7);
    for (let index = 0; index < 7; index += 1) {
      const control = controls.nth(index);
      await expect(control).toHaveAttribute(
        "aria-label",
        /^(Pause|Play) animation$/u,
      );
      const box = await control.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("every loop over five seconds pauses with Space and resumes with Enter", async ({
    page,
  }) => {
    await page.goto("/features/");

    for (const sceneId of REQUIRED_PAUSE_SCENES) {
      const root = sceneWindow(page, sceneId);
      await root.scrollIntoViewIfNeeded();
      await expect(root).toHaveAttribute("data-scene-player-state", "playing");
      const control = root.locator("[data-scene-playback-control]");
      await control.focus();
      await page.keyboard.press("Space");
      await expect(control).toHaveAttribute("aria-label", "Play animation");
      const pausedAt = await root.getAttribute("data-scene-time");
      await page.waitForTimeout(300);
      await expect(root).toHaveAttribute("data-scene-time", pausedAt!);
      await page.keyboard.press("Enter");
      await expect(control).toHaveAttribute("aria-label", "Pause animation");
    }
  });

  test("the engine switch depicts the swap: pill crossfades to codex", async ({
    page,
  }) => {
    await page.goto("/features/");
    const root = sceneWindow(page, "engine-switch");
    await root.scrollIntoViewIfNeeded();
    await expect(root.locator("[data-target='pill-engine']")).toHaveText(
      ENGINE_PILL.initialEngine,
      { timeout: 15_000 },
    );
    await expect(root.locator("[data-target='pill-engine']")).toHaveText(
      ENGINE_PILL.engine,
      { timeout: 15_000 },
    );
    await expect(root).toHaveAttribute(
      "data-scene-checkpoint",
      /switched|sent|resolved/u,
    );
  });
});

test.describe("motion governance (B2 review findings 4/9)", () => {
  test("no-JS renders every window truly static - zero running CSS animations", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/features/");
    for (const sceneId of ["triage-run", "mcp-hands"]) {
      await sceneWindow(page, sceneId).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    const running = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.constructor.name === "CSSAnimation" &&
              animation.playState === "running",
          ).length,
    );
    expect(running).toBe(0);
    await context.close();
  });

  test("channel loss settles every CSS animation in the outgoing window", async ({
    page,
  }) => {
    await page.goto("/features/");
    const triage = sceneWindow(page, "triage-run");
    await triage.scrollIntoViewIfNeeded();
    // Wait for the trigger's fired beat - the amber wash's start condition.
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLElement>(
          "[data-scene-id='triage-run'] [data-target='node-trigger']",
        )?.dataset.state === "done",
      undefined,
      { timeout: 20_000 },
    );
    // Hand the channel to the night window mid-wash.
    await sceneWindow(page, "webhook-fire").scrollIntoViewIfNeeded();
    await expect(sceneWindow(page, "webhook-fire")).toHaveAttribute(
      "data-scene-player-state",
      "playing",
      { timeout: 10_000 },
    );
    await expect(triage).toHaveAttribute("data-scene-player-state", "paused");
    // The governance invariant: no CSS animation advances inside ANY window
    // whose player is not playing (one-shot transitions are the sanctioned
    // settle-to-committed-value category and are exempt).
    const offenders = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => {
          if (
            animation.constructor.name !== "CSSAnimation" ||
            animation.playState !== "running"
          ) {
            return false;
          }
          const target = (animation.effect as KeyframeEffect | null)?.target;
          const window =
            target instanceof Element
              ? target.closest<HTMLElement>("[data-scene-window]")
              : null;
          return (
            window !== null && window.dataset.scenePlayerState !== "playing"
          );
        })
        .map((animation) => (animation as CSSAnimation).animationName ?? "css"),
    );
    expect(offenders).toEqual([]);
  });

  test("scroll-through handoff yields the outgoing loop at a beat boundary - one advancing player throughout", async ({
    page,
  }) => {
    // HANDOFF-A05 (7986713): a claim over an advancing non-ambient loop
    // defers ownership until the outgoing player's current beat commits
    // (≤500ms); the incoming player stays controller-paused meanwhile. The
    // law is about handoff between two VISIBLE windows, so the viewport is
    // tall enough to keep the outgoing window on screen through the claim.
    await page.setViewportSize({ width: 1440, height: 2000 });
    await page.goto("/features/");
    const outgoing = sceneWindow(page, "engine-switch");
    const incoming = sceneWindow(page, "org-hire");
    await expect(outgoing).toHaveAttribute(
      "data-scene-player-state",
      "playing",
      { timeout: 10_000 },
    );

    // Pin the handoff deterministically INSIDE the 1500–2400ms composer
    // typing beat so the deferral window is observable and the frozen time
    // must be beat-resolved.
    await page.waitForFunction(
      () => {
        const time = Number(
          document.querySelector<HTMLElement>("[data-scene-id='engine-switch']")
            ?.dataset.sceneTime ?? Number.NaN,
        );
        return time >= 1600 && time < 2200;
      },
      undefined,
      { timeout: 30_000, polling: "raf" },
    );

    // Scroll so the incoming window ENTERS the viewport while the outgoing
    // window stays visible AND no third window enters - rapid claims
    // coalesce to the LATEST claimant, so the geometry must admit exactly
    // one new claim for the assertion to name its owner.
    const outgoingBox = (await outgoing.boundingBox())!;
    const incomingBox = (await incoming.boundingBox())!;
    const thirdBox = (await sceneWindow(page, "todo-approval").boundingBox())!;
    const scrollTo = Math.round(incomingBox.y + incomingBox.height - 2000 + 80);
    // Preconditions on the hand-set geometry: outgoing stays ≥200px visible,
    // incoming fully enters, the third window stays out.
    expect(outgoingBox.y + outgoingBox.height - scrollTo).toBeGreaterThan(200);
    expect(scrollTo).toBeLessThanOrEqual(incomingBox.y);
    expect(thirdBox.y).toBeGreaterThan(scrollTo + 2000);
    await page.evaluate(
      (top) => window.scrollTo({ top, behavior: "instant" }),
      scrollTo,
    );

    // Record the whole handoff, per frame.
    const samples = await page.evaluate(
      () =>
        new Promise<
          { playing: string[]; outgoingTime: number; incomingTime: number }[]
        >((resolve) => {
          const log: {
            playing: string[];
            outgoingTime: number;
            incomingTime: number;
          }[] = [];
          const started = performance.now();
          const read = (id: string): HTMLElement =>
            document.querySelector<HTMLElement>(`[data-scene-id='${id}']`)!;
          const sample = (): void => {
            log.push({
              playing: Array.from(
                document.querySelectorAll<HTMLElement>(
                  "[data-scene-player-state='playing']",
                ),
              ).map((window) => window.dataset.sceneId ?? "?"),
              outgoingTime: Number(
                read("engine-switch").dataset.sceneTime ?? Number.NaN,
              ),
              incomingTime: Number(
                read("org-hire").dataset.sceneTime ?? Number.NaN,
              ),
            });
            if (performance.now() - started < 1200) {
              requestAnimationFrame(sample);
            } else {
              resolve(log);
            }
          };
          requestAnimationFrame(sample);
        }),
    );

    // Exactly one advancing player at every sampled frame, and the incoming
    // player never advances while the outgoing loop is still completing its
    // beat.
    for (const frame of samples) {
      expect(frame.playing.length, JSON.stringify(frame)).toBeLessThanOrEqual(
        1,
      );
      if (frame.playing[0] === "engine-switch") {
        expect(frame.incomingTime, JSON.stringify(frame)).toBe(0);
      }
    }
    const deferral = samples.filter(
      (frame) => frame.playing[0] === "engine-switch",
    );
    expect(deferral.length).toBeGreaterThan(0);

    // Ownership transferred: incoming advances, outgoing parked.
    await expect(incoming).toHaveAttribute(
      "data-scene-player-state",
      "playing",
      { timeout: 10_000 },
    );
    await expect(outgoing).toHaveAttribute("data-scene-player-state", "paused");

    // The outgoing loop froze at an authored beat boundary: it COMPLETED the
    // interrupted typing beat (so ≥ its 2400ms end - never an instant
    // mid-beat cut) and its parked time sits strictly inside no beat.
    const frozen = Number(await outgoing.getAttribute("data-scene-time"));
    expect(frozen).toBeGreaterThanOrEqual(2400);
    const definition = featuresSceneDefinitions.get("engine-switch")!;
    for (const beat of definition.beats) {
      const end = beat.at + (beat.duration ?? 0);
      const inside = frozen > beat.at && frozen < end;
      expect(inside, `frozen ${frozen}ms inside beat @${beat.at}–${end}`).toBe(
        false,
      );
    }
    // And it stays frozen - parked means parked.
    await page.waitForTimeout(400);
    expect(Number(await outgoing.getAttribute("data-scene-time"))).toBe(frozen);
  });

  test("the document never pans horizontally at the mobile contract width or the stress width", async ({
    page,
  }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/features/");
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(metrics.scroll, `viewport ${width}`).toBe(metrics.client);
    }
  });
});

test.describe("navigation integration", () => {
  test("features nav marks this page current and anchors Install locally", async ({
    page,
  }) => {
    await page.goto("/features/");
    const featuresLink = page.locator(".site-nav__text-link--features");
    await expect(featuresLink).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Install" })).toHaveAttribute(
      "href",
      "#install",
    );
    await expect(page.locator("footer .footer__link").first()).toHaveText(
      "Features",
    );
  });

  test("the landing nav and footer link here without claiming currency", async ({
    page,
  }) => {
    await page.goto("/");
    const featuresLink = page.locator(".site-nav__text-link--features");
    await expect(featuresLink).toHaveAttribute("href", "/features/");
    await expect(featuresLink).not.toHaveAttribute("aria-current", "page");
    await expect(
      page.locator("footer .footer__link", { hasText: "Features" }),
    ).toHaveAttribute("href", "/features/");
  });
});

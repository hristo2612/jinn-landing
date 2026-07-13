# Landing Normal Scroll Verification Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the three Important findings at reviewed HEAD `eeae112bfd2e0b155af3049411f19c7cd6e3dc70`: make landing visual capture deterministic, approve the normal-scroll visual matrix, and bring the two mobile-light Todo Approval metadata labels to WCAG AA contrast without changing product claims or the accepted normal-scroll behavior.

**Architecture:** Keep the standalone hero plus independent in-flow story/feature windows intact. Stabilize capture in test code by replacing one-shot page-context and pause-state assumptions with a shared, condition-based visual helper; make the smallest token-derived contrast correction in the Todo Approval surface; then approve only the deterministic landing-composition and contrast deltas. Every behavior change follows RED -> GREEN, and no baseline is written until two consecutive compare-only runs have identical non-race results.

**Tech Stack:** Astro 7.0.7, TypeScript 5.9.3, GSAP 3.15.0 on motion-capable visits only, Ledger CSS tokens, Vitest 4.1.0, Playwright 1.58.2, axe-core 4.12.1, Lighthouse CI 0.15.1, pnpm 10.6.4, Node 24.13.0.

## Global Constraints

- Work only in `~/Projects/.worktrees/jinn-landing-normal-scroll` on `feat/landing-normal-scroll`, based on frozen `main` commit `7b510ed471167c4db1ce374ed45e3b5952239bb2`.
- Begin implementation from reviewed HEAD `eeae112bfd2e0b155af3049411f19c7cd6e3dc70`; before any edit, the only allowed uncommitted path is this plan.
- `~/Projects/.worktrees/jinn-landing-preview` is strictly off-limits: do not read from it, run commands in it, edit it, merge into it, or bind its port.
- `~/Projects/jinn` is a read-only truth source. Do not edit, stage, clean, stash, reset, checkout, install in, or otherwise mutate it.
- Never bind or interact with ports `4321` or `7777`. Checked-in QA may use only its existing nonprotected ports `4331`, `4333`, `4334`, `4342`, and `4343`.
- Never merge, push, open a PR, deploy, publish, alter DNS, update the protected preview, create a release, or mutate the live Jinn gateway.
- Preserve exactly the six untracked `variants/*/shoot.mjs` files in the main checkout; never edit, stage, import, execute, or otherwise touch anything under `variants/`.
- Preserve all pre-existing work. Never reset, clean, stash, overwrite, repurpose a worktree, or use blanket staging.
- Keep public claims, public and machine documentation, release metadata, CLI snapshots, `PLAN.md`, and `docs/TECH-PLAN.md` unchanged. The older sticky architecture described there is historical documentation and is not authorization to restore it.
- Do not add scroll pinning, sticky scene ownership, scroll scrubbing, scripted product-code scrolling, a smooth-scroll library, or a shared scene window.
- Keep the accepted Hanken Grotesk/IBM Plex Mono treatment, Ledger palette, truthful copy, 3–6 second loop contracts, resolved dwell, quiet reset, lifecycle pause behavior, and reduced-motion/no-JS behavior unchanged.
- Keep the existing budgets unchanged: Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO = 100, LCP <= 2.5s, CLS <= 0.05, TBT <= 200ms, eager landing JavaScript <= 90KB gzip, and initial transferred assets <= 500KB.
- Baseline snapshots may change only after a separate reviewer explicitly approves the exact deterministic current/expected/diff set. Never update snapshots to hide a race, functional failure, contrast failure, or unrelated visual drift.

---

## Frozen Evidence and Prior Findings

### Proven identities and preservation boundary

- Main checkout `main`, frozen `baseBranch/baseHead`, and merge-base all resolve to `7b510ed471167c4db1ce374ed45e3b5952239bb2`.
- `feat/landing-normal-scroll` is attached to `~/Projects/.worktrees/jinn-landing-normal-scroll`, shares `~/Projects/jinn-landing/.git`, and is clean at `eeae112bfd2e0b155af3049411f19c7cd6e3dc70` before this plan edit.
- The frozen base is an ancestor of reviewed HEAD. The branch contains the intended six scoped commits: test contract, normal-scroll implementation, lifecycle test alignment, gate plan, Ledger provenance refresh, and plan genericization.
- No repository-local `AGENTS.md` or `AGENTS.override.md` exists under the landing repository.
- The main checkout contains exactly six untracked files, with frozen SHA-256 values:

  ```text
  4e6cb7f4b4ba8bda32750f53974e6cc762d2582fabe8fd27ffea711248efbf7c  variants/ember-ledger/shoot.mjs
  bc635129b9b11e3fc15fd0e5eea0f61513fea229f1ba780c36ad74dce7e55d1c  variants/l2-keynote/shoot.mjs
  a522a0b03e68b44afc783910e6d661309031d43c58a59142499adb1e1a68be03  variants/l2-product-real/shoot.mjs
  55cb90f5619dc113e56422a3618dd0d64f04b093e6fdffc4c42accae8d21a854  variants/l2-quiet-ember/shoot.mjs
  2881354371f1bda2b395bd71f67e261d4d3b0c9f8bc298e359a25fc4213d5dba  variants/living-org/shoot.mjs
  2fcc4c6ad1ef372b85519a3ae2ce816f938ce650f0b262099b42cb530c451554  variants/smoke-genie/shoot.mjs
  ```

### Independent verifier result at `eeae112`

- PASS: `pnpm check`; 21 Vitest files / 144 tests; 41-page build; public safety; 61 built links; 59/59 docs contracts.
- PASS: 162/162 browser E2E tests across Chromium, Firefox, and WebKit, including normal flow, independent ownership, keyboard/focus, axe, JavaScript-disabled truth, reduced motion, pause controls, and lifecycle behavior.
- PASS: six cold mobile Lighthouse runs at Performance 98–99, Accessibility 96–100, Best Practices 100, SEO 100, max LCP 2,130ms, max CLS 0.00523, max TBT 30ms, and max transfer 294,176 bytes.
- PASS: eager JavaScript at 52.6 KiB for `/` and 56.8 KiB for `/features/`.
- FAIL: visual comparison was nondeterministic. The independent run reported 71 passed / 36 failed / 63 skipped, while the implementation runs reported 72 / 35 / 63.
- Important 1: three functional capture races appeared in the independent run: `document.fonts.ready` lost its execution context at `tests/visual/landing.visual.spec.ts:20`; `employees initial dark` and `employees resolved dark` failed the pause-state expectation at line 57.
- Important 2: after separating functional races, 33 landing screenshot comparisons still target the obsolete shared composition. All 45 applicable feature comparisons passed, so the new landing composition has no stable approved baseline matrix yet.
- Important 3: Lighthouse found two visible 11px Todo Approval metadata labels at 3.76:1 on mobile light, below the required 4.5:1. The configured aggregate accessibility score still passed, but the node-level violation must be fixed.

### Root-cause evidence already visible in source

- `tests/visual/landing.visual.spec.ts` waits with one page-bound `page.evaluate(() => document.fonts.ready)` and assumes a single conditional pause click has settled the player.
- `tests/visual/features.visual.spec.ts` exercises the same scene machinery but retries the visibility-claim/pause transition with `expect(...).toPass({ timeout: 5000 })`; all 45 applicable feature checks passed. This working example is the implementation pattern to share rather than duplicate.
- The landing visual failure set changes only when page readiness or pause ownership races. The 33 screenshot mismatches are the expected architectural delta from shared/pinned to independent windows, not permission to update them before review.
- `tests/e2e/features-page.spec.ts` audits the features page under reduced motion. Lighthouse found the contrast failure on the active mobile-light presentation, so the current axe test does not reproduce that exact state.
- `src/components/features/surfaces/TodoApprovalSurface.astro` owns the affected 11px metadata presentation. The exact failing selectors must be copied from the Lighthouse `color-contrast` audit before changing CSS; do not perform a broad small-text recolor.

### IMPLEMENT scoped corrections (2026-07-12)

- The branch entered IMPLEMENT at `734a60f`, the planned failing contrast-test commit, with only this plan modified in the worktree. Reviewed product HEAD `eeae112` remained an ancestor and the frozen base/main state remained unchanged.
- This repository's Playwright scripts forward filters directly; including a literal `--` caused the full suite to run. Focused commands therefore omit that separator while preserving the same project, grep, repetition, and worker arguments.
- The provisional label-conditional pause helper still exposed a frame-level ownership handoff: the rendered `Play` label could trail the live debug player. The shared test-only helper now toggles the live player, seeks, and requires the requested timestamp plus `Play` state to remain stable across two animation frames inside `expect(...).toPass`. It adds no sleep and changes no product timing.
- Two complete post-fix compare-only runs were identical at 71 passed / 36 failed / 63 skipped with zero functional failures. The deterministic delta is 35 stale landing-composition PNGs plus one contrast-owned mobile-light Todo Approval PNG, not the provisional 33-plus-Todo set. Baselines remain untouched pending separate explicit review of the current/expected/diff triplets.

## Design Review: Before and After

| Before                                                                                                        | After                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Landing visual setup relies on a page execution context that can disappear during cold dev-server navigation. | One shared helper waits on reload-safe document/font conditions before any scene interaction.                                    |
| Landing pause/seek assumes viewport ownership cannot change between label read and click.                     | Pause acquisition is condition-based and verified before and after seek, matching the already-stable features pattern.           |
| Approved landing PNGs depict the obsolete shared/sticky composition.                                          | Approved PNGs depict one standalone hero window and four calm, independent in-flow story windows.                                |
| Two active mobile-light Todo Approval metadata labels measure 3.76:1.                                         | Only the failing metadata selector uses the nearest Ledger-derived ink that measures at least 4.5:1, preserving quiet hierarchy. |

The signature remains the truthful Ledger dashboard frame and semantic state changes. No new palette, typography, decorative motion, numbering, claims, or component architecture belongs in this rework.

## File Map

### Create

- `tests/visual/scene-visual-helpers.ts` — reload-safe page/font settling plus condition-based pause-and-seek for landing and features visual tests.

### Modify

- `tests/visual/landing.visual.spec.ts` — consume the shared settling/seek helper; retain every named checkpoint and target.
- `tests/visual/features.visual.spec.ts` — consume the same helper so the working behavior is centralized and landing cannot drift from it.
- `tests/e2e/features-page.spec.ts` — add an active mobile-light regression for the exact Lighthouse contrast nodes, while retaining the full reduced-motion axe audit.
- `src/components/features/surfaces/TodoApprovalSurface.astro` — change only the exact failing metadata color declaration after RED identifies the two nodes; do not change type size, copy, layout, or animation.
- `tests/visual/baselines/desktop-dpr2/landing.visual.spec.ts/*.png` — only the deterministic, separately approved landing deltas.
- `tests/visual/baselines/mobile-dpr2/landing.visual.spec.ts/*.png` — only the deterministic, separately approved landing deltas.
- `tests/visual/baselines/{desktop-dpr2,mobile-dpr2}/features.visual.spec.ts/*.png` — only Todo Approval PNGs that visibly change because of the approved contrast correction; every other feature baseline must remain byte-identical.
- `docs/superpowers/plans/2026-07-12-landing-normal-scroll-rework.md` — this plan only during PLAN.

### Deliberately unchanged

- Normal-scroll product structure and runtime: `src/components/marketing/Hero.astro`, `src/components/marketing/ProductStories.astro`, `src/pages/index.astro`, `src/pages/features.astro`, `src/lib/scenes/**`, `src/scenes/**`, and `src/styles/scene-system.css`.
- Visual checkpoint inventory and gate infrastructure: `scripts/qa-gates.ts`, `scripts/run-visual.ts`, `playwright.visual.config.ts`, and `lighthouserc.json` unless root-cause evidence contradicts the source-local hypothesis; if it does, stop for a new plan rather than widening this rework.
- Feature copy/data, public docs, machine docs, release metadata, CLI snapshots, `PLAN.md`, `docs/TECH-PLAN.md`, package manifests, lockfiles, generated Ledger tokens, deployment files, and every path under `variants/`.

## Acceptance Mapping

| Acceptance criterion                                    | Exact files                                                                                             | Automated evidence                                                                                        | Browser/visual evidence and stop rule                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Natural document scrolling                              | Existing `src/components/marketing/ProductStories.astro`, `src/pages/index.astro`                       | `tests/e2e/product-stories.spec.ts`, `tests/e2e/scene-cross-browser.spec.ts`, full `pnpm test:e2e`        | Chromium desktop/mobile wheel + PageDown and WebKit mobile remain in normal flow; any sticky/fixed result stops the rework. |
| No shared/sticky scene swap                             | Deleted `PinnedShowcase.astro` and `wire-showcase-controls.ts`; existing standalone `SceneWindow.astro` | `product-stories.spec.ts`, `scene-system.spec.ts` assert zero shared/pin/mobile-window/ribbon-nav markers | Every approved capture must show local ownership, never a shared runway or pane swap.                                       |
| Independent story/feature windows; one hero window      | `Hero.astro`, `ProductStories.astro`, `FeatureWindow.astro`                                             | `hero.spec.ts`, `product-stories.spec.ts`, `features-page.spec.ts`                                        | Review one hero, four landing story, and seven feature windows at 1440x900 and 390x844.                                     |
| Truthful 3–6 second loops, action, dwell, quiet reset   | Existing landing/feature scene definitions                                                              | `showcase-scenes.test.ts`, `features-scenes.test.ts`, `scene-reducer.test.ts`, `scene-validator.test.ts`  | Named checkpoint captures retain truthful employee/todo/gate/run outcomes; no timing or copy change is allowed.             |
| Keyboard-accessible pause over five seconds             | Existing player/controller and `scene-system.css`; visual helper is test-only                           | `scene-system.spec.ts`, `features-page.spec.ts`, `scene-player.spec.ts`                                   | Tab, Space, Enter, visible focus, >=44x44, no overlap; a failure stops baseline work.                                       |
| Pause offscreen/background                              | Existing scene player, controller, and motion channel                                                   | `scene-system.spec.ts`, `features-page.spec.ts`, `scene-cross-browser.spec.ts`                            | Time remains stable offscreen/hidden and resumes with at most one advancing owner.                                          |
| Reduced motion resolved; no GSAP/ScrollTrigger          | Existing `install-motion-scenes.ts`, page bootstraps                                                    | `install-motion-scenes.test.ts`, `hero.spec.ts`, `features-page.spec.ts`, eager-JS gate                   | Reduced visits request no runtime/GSAP/ScrollTrigger and show no timeline/control attributes.                               |
| Desktop/mobile light/dark                               | Visual specs, shared visual helper, approved PNGs                                                       | two deterministic compare runs before approval; one compare run after approval                            | Chromium DPR2 1440x900 + 390x844; inspect both landing themes and the feature page's light presentation.                    |
| Keyboard/focus and JavaScript-disabled resolved content | Existing SSR surfaces and real playback controls                                                        | `hero.spec.ts`, `product-stories.spec.ts`, `features-page.spec.ts`, axe                                   | Keyboard-only and JS-disabled `/` + `/features/`; fake chrome stays outside the tab order.                                  |
| Claims truthful; docs unaffected                        | Existing scene definitions/data; docs/release paths unchanged                                           | `pnpm check`, safety, docs contract, protected-path diff guard                                            | Captions and resolved UI retain reviewed truth; any copy/docs diff stops.                                                   |
| Preserve performance budgets                            | Existing motion bootstrap and measurement scripts                                                       | `pnpm check`, both eager-JS measurements, `pnpm test:lighthouse`                                          | Do not relax thresholds; contrast must pass node-level audit as well as aggregate score.                                    |
| No public deployment                                    | No deploy file/action                                                                                   | final branch/scope/status audit                                                                           | End with local evidence only; no remote, preview, DNS, hosting, or gateway action.                                          |

## Task 1: Reproduce and Pin the Three Verification Failures

**Files:**

- Modify test-first: `tests/e2e/features-page.spec.ts`
- Inspect only: `tests/visual/landing.visual.spec.ts`, `tests/visual/features.visual.spec.ts`, Lighthouse JSON emitted by the checked-in runner

**Interfaces:**

- Consumes reviewed HEAD `eeae112`, Playwright traces, and Lighthouse `audits["color-contrast"].details.items`.
- Produces a recorded race/mismatch classification and a failing active mobile-light contrast assertion naming exactly two nodes.

- [ ] **Step 1: Re-prove the implementation boundary**

  ```bash
  cd ~/Projects/.worktrees/jinn-landing-normal-scroll
  export PATH="$HOME/.nvm/versions/node/v24.13.0/bin:$PATH"
  export JINN_SOURCE_ROOT=~/Projects/jinn
  export JINN_SOURCE_REPO=~/Projects/jinn
  export PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright/browsers"
  test "$(git branch --show-current)" = feat/landing-normal-scroll
  test "$(git merge-base 7b510ed471167c4db1ce374ed45e3b5952239bb2 HEAD)" = 7b510ed471167c4db1ce374ed45e3b5952239bb2
  test "$(git merge-base eeae112bfd2e0b155af3049411f19c7cd6e3dc70 HEAD)" = eeae112bfd2e0b155af3049411f19c7cd6e3dc70
  test -z "$(git diff --name-only eeae112bfd2e0b155af3049411f19c7cd6e3dc70 -- | grep -v '^docs/superpowers/plans/2026-07-12-landing-normal-scroll-rework.md$')"
  test "$(node --version)" = v24.13.0
  test "$(pnpm --version)" = 10.6.4
  git status --short --branch
  ```

  Expected: only this plan differs from reviewed HEAD. Otherwise stop without editing tests or product code.

- [ ] **Step 2: Reproduce landing races separately from stale pixels**

  ```bash
  pnpm test:visual -- --grep "delegation initial dark|employees (initial|resolved) dark" --repeat-each=10 --workers=2
  pnpm test:visual
  ```

  Expected before the harness fix: screenshot mismatches are stale-baseline failures; any `Execution context was destroyed` or `expected Play, received Pause` is classified separately as a functional harness race. Preserve the trace and test title. Do not update snapshots.

- [ ] **Step 3: Identify the exact contrast nodes from Lighthouse evidence**

  ```bash
  pnpm test:lighthouse
  ```

  Read the runner's mobile-light `/features/` JSON and record the two `color-contrast` selectors, foreground/background colors, font size, and 3.76 ratio. Expected: both nodes belong to the Todo Approval metadata presentation. If the node count, surface, or ratio differs, stop and revise PLAN from the new evidence.

- [ ] **Step 4: Add the active mobile-light contrast regression (RED)**

  In `tests/e2e/features-page.spec.ts`, add a test for the two supplied Todo Approval metadata roles, scroll `todo-approval` into view, wait for its active scene state, run axe without exclusions, and assert neither selector produces a `color-contrast` node:

  ```ts
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
  ```

  Expected selectors: `.tap__meta [data-field='owner']` and `.tap__meta [data-field='state']`. If the Lighthouse JSON names different nodes, stop under the Task 1 evidence rule rather than changing the test to chase a different surface.

- [ ] **Step 5: Run RED and commit only the regression test**

  ```bash
  pnpm test:e2e -- --project=chromium tests/e2e/features-page.spec.ts --grep "active mobile-light metadata"
  git add tests/e2e/features-page.spec.ts
  git diff --cached --check
  git diff --cached --name-only
  git commit -m "test: reproduce active todo metadata contrast"
  ```

  Expected: the test fails because the two recorded nodes are 3.76:1; staged path is exactly `tests/e2e/features-page.spec.ts`.

## Task 2: Make Visual Capture Deterministic

**Files:**

- Create: `tests/visual/scene-visual-helpers.ts`
- Modify: `tests/visual/landing.visual.spec.ts`
- Modify: `tests/visual/features.visual.spec.ts`

**Interfaces:**

- Produces `settleVisualPage(page, path)` and `pauseAndSeekScene(page, overlay, time)`; both visual suites use the same contracts.
- Does not change product source, checkpoint times, screenshot names, target locators, thresholds, projects, or worker configuration.

- [ ] **Step 1: Add a reload-safe settle helper**

  Implement this exact condition-based shape in `tests/visual/scene-visual-helpers.ts`:

  ```ts
  import { expect, type Locator, type Page } from "@playwright/test";

  export async function settleVisualPage(
    page: Page,
    path: string,
  ): Promise<void> {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        document.readyState === "complete" &&
        document.fonts.status === "loaded",
    );
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          caret-color: transparent !important;
          transition: none !important;
        }
        [data-scene-debug] { visibility: hidden !important; }
      `,
    });
  }

  export async function pauseAndSeekScene(
    overlay: Locator,
    time: number,
  ): Promise<void> {
    const toggle = overlay.locator("[data-scene-debug-toggle]");
    const acquirePause = () =>
      expect(async () => {
        await toggle.evaluate((button) => {
          if (button.textContent === "Pause")
            (button as HTMLButtonElement).click();
        });
        expect(await toggle.textContent()).toBe("Play");
      }).toPass({ timeout: 5_000 });
    const scrubber = overlay.locator("[data-scene-debug-scrubber]");
    const seek = () =>
      scrubber.evaluate((input, nextTime) => {
        const node = input as HTMLInputElement;
        node.value = String(nextTime);
        node.dispatchEvent(new Event("input", { bubbles: true }));
      }, time);
    await acquirePause();
    await seek();
    await expect(overlay.locator("[data-scene-debug-time]")).toHaveText(
      `${time}ms`,
    );
    await acquirePause();
    await seek();
    await expect(overlay.locator("[data-scene-debug-time]")).toHaveText(
      `${time}ms`,
    );
    await expect(toggle).toHaveText("Play");
  }
  ```

- [ ] **Step 2: Replace both duplicated helpers**

  Import `settleVisualPage` and `pauseAndSeekScene` in both visual specs. Landing calls `settleVisualPage(page, "/")`; features calls `settleVisualPage(page, "/features/")`. Each suite retains its registry-specific overlay lookup and passes that overlay plus the resolved time to `pauseAndSeekScene`.

- [ ] **Step 3: Verify the targeted races are GREEN under repetition**

  ```bash
  pnpm test:visual -- --grep "delegation initial dark|employees (initial|resolved) dark" --repeat-each=10 --workers=2
  ```

  Expected: only deterministic stale-baseline mismatches remain; there is no lost execution context and every overlay remains paused at the requested millisecond.

- [ ] **Step 4: Prove the whole pre-approval visual matrix is stable twice**

  ```bash
  pnpm test:visual
  pnpm test:visual
  ```

  Expected before contrast/source changes: both runs report the same deterministic failure set and zero functional errors. IMPLEMENT evidence corrected the provisional count to 35 stale landing screenshots; if counts, names, or failure types differ, stop and do not update baselines.

- [ ] **Step 5: Commit only harness code**

  ```bash
  git add tests/visual/scene-visual-helpers.ts tests/visual/landing.visual.spec.ts tests/visual/features.visual.spec.ts
  git diff --cached --check
  git diff --cached --name-only
  git commit -m "test: stabilize scene visual capture"
  ```

  Expected staged paths: exactly the helper and two visual spec files; no PNG is staged.

## Task 3: Fix Only the Proven Todo Approval Contrast Nodes

**Files:**

- Modify: `src/components/features/surfaces/TodoApprovalSurface.astro`
- Test: `tests/e2e/features-page.spec.ts`

**Interfaces:**

- Consumes the two exact selectors and computed colors recorded in Task 1.
- Produces >=4.5:1 for normal 11px text in active mobile-light state using existing Ledger ink; no copy, font-size, layout, timing, or semantic state changes.

- [ ] **Step 1: Change the narrowest owning selector**

  If Task 1 confirms the two nodes are the owner/state children of `.tap__meta`, set their owning color to the existing primary Ledger ink:

  ```css
  .tap__state,
  .tap__owner {
    color: var(--text-primary);
  }
  ```

  Leave `.tap__meta` at 11px and leave the emoji disc, card title, badge, status line, other surfaces, tokens, and all animation declarations unchanged. If Task 1 names different nodes, stop for a plan correction instead of broadening this selector.

- [ ] **Step 2: Run GREEN accessibility checks**

  ```bash
  pnpm test:e2e -- --project=chromium tests/e2e/features-page.spec.ts --grep "active mobile-light metadata|serious accessibility"
  pnpm test:lighthouse
  ```

  Expected: the active-state regression and full reduced-motion axe audit pass; Lighthouse reports no Todo Approval color-contrast item, Accessibility >=95, and all performance budgets remain green.

- [ ] **Step 3: Review the visual-detail delta**

  Confirm the metadata remains visually subordinate to `.tap__card-title`, no text wraps or clips at 390px, and no unrelated color changes. This rework deliberately uses a stronger existing Ledger ink rather than a new hardcoded color or token edit.

- [ ] **Step 4: Commit source only**

  ```bash
  git add src/components/features/surfaces/TodoApprovalSurface.astro
  git diff --cached --check
  git diff --cached --name-only
  git commit -m "fix: raise todo metadata contrast"
  ```

  Expected staged path: exactly `TodoApprovalSurface.astro`.

## Task 4: Review and Approve the Deterministic Visual Matrix

**Files:**

- Execute: `tests/visual/landing.visual.spec.ts`, `tests/visual/features.visual.spec.ts`
- Modify after approval only: approved PNGs under the landing baseline directories
- Modify after approval only: Todo Approval feature PNGs changed solely by Task 3

**Interfaces:**

- Consumes two stable compare-only runs and explicit reviewer approval.
- Produces a complete approved matrix; no test source or threshold changes in this task.

- [ ] **Step 1: Run compare-only twice after the contrast fix**

  ```bash
  pnpm test:visual
  pnpm test:visual
  ```

  Expected: both runs have identical failure names. The evidenced set is 35 stale landing composition PNGs plus only the Todo Approval feature PNG whose pixels changed from the contrast fix. Any functional failure, feature delta outside Todo Approval, or differing failure set stops approval.

- [ ] **Step 2: Obtain explicit design approval**

  Review every current/expected/diff triplet. Approval requires:

  - one standalone hero product window;
  - four independent complete story windows in ordinary flow;
  - desktop 5/7 alternation and mobile copy -> window -> caption ordering;
  - no shared, sticky, pinned, clipped, overflowing, or scroll-scrubbed presentation;
  - coherent light/dark Ledger themes at 1440x900 and 390x844;
  - truthful resolved employee, todo, parked approval-gate, and fired-run states;
  - calm visible action, resolved dwell, quiet reset, concentric radii, shadow-led depth, balanced headings, pretty body/caption wrapping, and optically centered pause controls;
  - playback hit areas at least 44x44 with no overlap;
  - resolved static reduced-motion hero/todo with no motion residue;
  - Todo Approval metadata remains quiet but legible after the contrast correction;
  - no unrequested copy, palette, typography, decoration, feature, or docs change.

  Record approve/reject against the exact failure list. Rejection or unavailable approval means stop with compare artifacts and do not write PNGs.

- [ ] **Step 3: Update only the approved snapshots**

  ```bash
  UPDATE_VISUAL_BASELINES=1 pnpm test:visual --update-snapshots --workers=1
  git diff --name-only -- tests/visual/baselines
  git diff --numstat -- tests/visual/baselines
  ```

  Expected: changed PNGs equal the recorded approval list exactly. No unrelated feature PNG, extra/missing snapshot, spec, config, or threshold may change.

- [ ] **Step 4: Re-run compare mode from approved files**

  ```bash
  pnpm test:visual
  ```

  Expected: 107 applicable comparisons pass and 63 configured project skips remain; zero failures.

- [ ] **Step 5: Commit only approved PNGs**

  ```bash
  git add tests/visual/baselines/desktop-dpr2/landing.visual.spec.ts \
    tests/visual/baselines/mobile-dpr2/landing.visual.spec.ts
  git add tests/visual/baselines/desktop-dpr2/features.visual.spec.ts \
    tests/visual/baselines/mobile-dpr2/features.visual.spec.ts
  git diff --cached --name-only
  git commit -m "test: approve normal-scroll visual baselines"
  ```

  Expected: the staged list matches the reviewer-approved PNG list exactly. Explicit path staging is mandatory.

## Task 5: Run the Complete Acceptance and Preservation Gates

**Files:**

- Test only: all source/test paths in the Acceptance Mapping.
- Modify tracked files: none.

**Interfaces:**

- Produces green deterministic, cross-browser, accessibility, visual, performance, safety, docs, scope, and preservation evidence at one exact HEAD.

- [ ] **Step 1: Run deterministic and full browser gates**

  ```bash
  pnpm check
  pnpm test:e2e
  pnpm test:visual
  ```

  Expected: token/type/lint/format/unit/build/safety/link/docs gates pass; 162 existing E2E tests plus the new contrast regression pass across the configured projects; all 107 applicable visuals pass with 63 configured skips. Record actual totals if the new test changes the total by one.

- [ ] **Step 2: Measure eager JavaScript on both product pages**

  ```bash
  pnpm build
  EAGER_JS_PORT=4333 EAGER_JS_PATH=/ pnpm exec tsx scripts/measure-eager-js.ts
  EAGER_JS_PORT=4334 EAGER_JS_PATH=/features/ pnpm exec tsx scripts/measure-eager-js.ts
  ```

  Expected: landing <=90KB gzip and remains near 52.6 KiB; features remains near 56.8 KiB; neither reduced-motion page requests scene runtime, GSAP, or ScrollTrigger.

- [ ] **Step 3: Run final cold-mobile Lighthouse**

  ```bash
  pnpm test:lighthouse
  ```

  Expected on `/` and `/features/`: Performance >=90, Accessibility >=95, Best Practices >=95, SEO=100, LCP <=2.5s, CLS <=0.05, TBT <=200ms, transfer <=500KB, and zero Todo Approval color-contrast items.

- [ ] **Step 4: Prove protected content and branch scope**

  ```bash
  git diff --exit-code 7b510ed471167c4db1ce374ed45e3b5952239bb2..HEAD -- \
    src/content/docs src/content/machine src/data/release.json src/data/cli-help \
    src/data/release-impact.json PLAN.md docs/TECH-PLAN.md variants package.json pnpm-lock.yaml
  git diff --check 7b510ed471167c4db1ce374ed45e3b5952239bb2..HEAD
  git diff --cached --name-only
  pnpm safety:check
  ```

  Expected: no protected-path/package/variant diff, no whitespace errors, no staged files, and no privacy finding.

- [ ] **Step 5: Re-prove main-checkout preservation**

  ```bash
  git -C ~/Projects/jinn-landing status --short --branch
  for file in ~/Projects/jinn-landing/variants/*/shoot.mjs; do shasum -a 256 "$file"; done
  ```

  Expected: main remains `7b510ed…` with exactly the six original untracked files and the six frozen hashes above.

- [ ] **Step 6: End locally with exact evidence**

  ```bash
  git status --short --branch
  git log --oneline --decorate --reverse 7b510ed471167c4db1ce374ed45e3b5952239bb2..HEAD
  git diff --name-status 7b510ed471167c4db1ce374ed45e3b5952239bb2..HEAD
  ```

  Report exact HEAD, commits/files, test totals, two-run pre-approval failure set, approval record, post-approval visual total, Lighthouse/contrast evidence, eager-JS totals, and preservation checks. Explicitly confirm no merge, push, PR, deploy, publish, DNS, protected-preview, Jinn-source, gateway, port 4321, or port 7777 action occurred.

## Rollback and Stop Conditions

Stop without destructive recovery if any of the following occurs:

1. Main is not frozen at `7b510ed…`, reviewed HEAD `eeae112…` is not an ancestor, the branch/path/common Git directory differs, or an unplanned pre-existing change overlaps this plan.
2. Any main-checkout variant path/count/hash changes, or any command would read/execute under `variants/` beyond the final hash verification.
3. Repeated visual failures do not separate into the supplied page-context/pause races plus the same 35 stale landing screenshots.
4. The condition-based helper does not eliminate both race classes, or stabilizing it would require product-code timing, global worker serialization, relaxed screenshot thresholds, arbitrary sleeps, or changed checkpoint names/times.
5. Lighthouse does not identify exactly two Todo Approval metadata nodes at the supplied 3.76 ratio; return the actual selectors/evidence to PLAN.
6. The active mobile-light regression does not fail before the CSS change or does not pass after it.
7. Meeting contrast would require hardcoded off-system color, token snapshot edits, copy/layout/type-size changes, or a broad recolor outside the exact owning selector.
8. Two consecutive compare-only visual runs differ by failure count/name/type, any feature PNG outside the contrast-owned Todo Approval set changes, or a reviewer rejects/does not explicitly approve a delta.
9. A baseline update changes an unapproved PNG, any test/config/source file, snapshot count, or threshold.
10. Any acceptance, accessibility, performance, safety, docs, privacy, or cross-browser gate fails after the scoped changes. Preserve reports; never weaken a test or budget.
11. Any public docs, claim copy, release data, package/lockfile, generated Ledger tokens, variants, main checkout, Jinn source, protected preview, remote, hosting, DNS, gateway, or deployment state changes.
12. Any command would bind/interact with `4321` or `7777`, or perform a merge, push, PR, deploy, publish, release, DNS, protected-preview, or live-gateway action.

## Final Definition of Done

- The landing visual harness completes repeated and full runs without execution-context or pause-state races.
- Before baseline writes, two compare-only runs report the exact same deterministic 35 landing composition mismatches plus only the contrast-owned Todo Approval feature delta.
- The two active mobile-light Todo Approval metadata nodes measure at least 4.5:1 and are covered by a failing-first browser regression plus Lighthouse.
- A separate reviewer explicitly approves every changed PNG; post-update compare mode passes all 107 applicable visuals with 63 configured skips.
- `pnpm check`, full Playwright E2E, visual, both eager-JS measurements, and Lighthouse are green at one exact HEAD.
- Natural scrolling, one hero window, independent story/feature windows, truthful loop timing, dwell/reset, keyboard pause, lifecycle pausing, reduced/no-JS resolved states, light/dark responsive presentation, claims, docs, and budgets remain intact.
- Public docs, release data, claims, variants, Jinn source, main checkout, protected preview, remotes, hosting, DNS, gateway, and deployment state remain untouched.

# Landing Normal Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page's shared pinned dashboard with ordinary document-flow story sections, retain one standalone hero product window, and make every animated product vignette a calm, truthful, independently paused loop.

**Architecture:** The landing hero remains one full `SceneWindow`. The four product stories become four independent full-dashboard `SceneWindow` roots in normal flow, matching the already-independent features-page model; viewport ownership continues to allow at most one advancing player. A GSAP-free bootstrap gates the dynamic scene-runtime import so reduced-motion and JavaScript-disabled visits remain resolved static HTML and never load GSAP or ScrollTrigger.

**Tech Stack:** Astro 7, TypeScript 5.9, GSAP 3.15 core (motion visits only), Ledger CSS tokens, Vitest, Playwright, axe-core, Lighthouse CI, pnpm 10.6.4, Node 24.13.0.

## Global Constraints

- Work only in `~/Projects/.worktrees/jinn-landing-normal-scroll` on `feat/landing-normal-scroll`, based on frozen commit `7b510ed471167c4db1ce374ed45e3b5952239bb2`.
- Treat `~/Projects/jinn` and `~/Projects/.worktrees/jinn-landing-preview` as strictly read-only and do not run commands in the protected preview.
- Never bind ports `4321` or `7777`. Existing project QA ports `4331`, `4333`, `4342`, and `4343` are nonprotected and may be used by their checked-in scripts.
- Do not merge, push, open a PR, deploy, publish, alter DNS, update the protected preview, or mutate the live Jinn gateway.
- Preserve the six untracked main-checkout files under `variants/*/shoot.mjs`; never edit, stage, import, or otherwise touch anything under `variants/`.
- Preserve all pre-existing work. Never reset, clean, stash, overwrite, or use blanket staging.
- Render resolved content in static HTML; JavaScript is enhancement only.
- Use native document scrolling. Do not add a smooth-scroll library, `position: sticky`, pinning, scroll-scrubbing, or scripted `window.scrollTo()` navigation to product code.
- Keep Hanken Grotesk, IBM Plex Mono, Ledger tokens, current truthful copy, and current public documentation unchanged.
- Preserve the cold-mobile budgets: Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO = 100, LCP <= 2.5s, CLS <= 0.05, TBT <= 200ms, eager landing JavaScript <= 90KB gzip, and initial transferred assets <= 500KB.
- Use explicit transition properties only. Keep the existing 44x44px pause control, `scale(0.96)` active feedback, `0.25 -> 1` icon crossfade, `4px -> 0` blur, and zero-bounce calm motion.
- Baseline snapshots may be rewritten only after the new composition passes design review; never update baselines to conceal a defect.

---

## Preflight Evidence (2026-07-12)

- Main checkout `main` and frozen `baseHead` both resolve to `7b510ed471167c4db1ce374ed45e3b5952239bb2`.
- The requested branch and worktree did not exist before creation. The task worktree was created directly from the frozen SHA and now reports:
  - top level: `~/Projects/.worktrees/jinn-landing-normal-scroll`
  - branch: `feat/landing-normal-scroll`
  - HEAD: `7b510ed471167c4db1ce374ed45e3b5952239bb2`
  - common Git directory: `~/Projects/jinn-landing/.git`
  - clean status before this plan was written
- The main checkout still contains exactly these six untracked files and no other changes:
  - `variants/ember-ledger/shoot.mjs`
  - `variants/l2-keynote/shoot.mjs`
  - `variants/l2-product-real/shoot.mjs`
  - `variants/l2-quiet-ember/shoot.mjs`
  - `variants/living-org/shoot.mjs`
  - `variants/smoke-genie/shoot.mjs`
- No repository-local `AGENTS.md` exists beneath the landing repository; the workflow-provided operating instructions therefore govern.
- `pnpm --version` is correct at `10.6.4`; the active shell currently reports Node `v25.4.0`, while `.node-version` requires `24.13.0` and `package.json` requires `>=24 <25`. Implementation must switch to Node 24.13.0 before install/build/test and stop if that cannot be proven.
- No predecessor verifier handoff or prior-loop findings were supplied. Historical comments such as “B2 review finding” remain repository history, not findings from this workflow run.

## Current-State Findings

1. `src/components/marketing/PinnedShowcase.astro` owns one absolute/pinned, viewport-height window and four 130vh trigger stages. Desktop uses one shared frame and pane swapping; mobile/reduced/no-JS uses duplicate stage-local windows.
2. `src/lib/scenes/scene-controller.ts` dynamically imports ScrollTrigger only for a staged controller, but it also contains scroll navigation and pin lifecycle code. Standalone windows already avoid that branch.
3. `src/pages/features.astro` already renders seven independent `FeatureWindow` roots. This is the correct ownership model to preserve, not a new framework.
4. `src/components/marketing/Hero.astro` already renders one standalone full product window and must remain the landing hero's only window.
5. Reduced motion currently avoids timeline creation but still reaches modules with static `gsap` imports through the page script. The new contract requires a GSAP-free bootstrap with a dynamic runtime import only when motion is allowed.
6. Feature loops are currently asserted as 10–16 seconds with 6–8 second dwells. The new loop contract is a full cycle of 3–6 seconds, including a legible resolved dwell and 600ms quiet reset.
7. The existing pause control in `src/styles/scene-system.css` already meets the visual-detail rules: 44x44px, optical play alignment, exact-property transitions, 0.96 press scale, and 0.25/4px icon crossfade. Reuse it unchanged unless browser QA finds a collision.

## Design Direction

- **Subject and job:** Jinn is a local-first AI-company gateway; the page's job is to show one real unit of work per window without forcing visitors through a presentation timeline.
- **Signature:** the full product frame remains in the hero. Below it, each story is its own “working proof” with a local title, claim, caption, window, and playback control. The repeated independent windows replace the shared-stage trick.
- **Layout:** desktop alternates copy and window in a restrained 5/7 grid; the workflow story may use the wider stacked treatment if its rail needs room. At <=899px every story becomes copy -> window -> caption with ordinary block flow. No 100vh stage, hidden duplicate, absolute head stack, or spacer runway.
- **Palette/type:** no new palette or font. Use the existing Ledger light/dark tokens, Hanken display hierarchy, IBM Plex Mono kickers, and rationed amber only where semantics already call for it.
- **Motion:** one clear semantic change per scene, visible within the first second; full cycles 3,000–6,000ms; resolved dwell >=800ms; quiet reset exactly 600ms; one page-wide advancing timeline; offscreen/background pause. No decorative parallax, bounce, scroll scrub, or pane swap.
- **Self-critique:** alternating story cards are intentionally quiet and could become generic. Keep them Jinn-specific by retaining the full dashboard chrome, real pane vocabulary, semantic states, captions, and honest approval/run outcomes; do not add decorative numbering beyond the existing real narrative order.

## File Map

### Create

- `src/components/marketing/ProductStories.astro` — four normal-flow, self-contained landing story windows and their copy.
- `src/lib/scenes/install-motion-scenes.ts` — GSAP-free media-query gate that dynamically imports the scene runtime only when motion is allowed and destroys it when reduced motion becomes active.
- `tests/e2e/product-stories.spec.ts` — normal-flow structure, no shared/pinned DOM, desktop/mobile geometry, no-JS truth, reduced-motion runtime exclusion, and pause-control coverage.

### Modify

- `src/pages/index.astro` — replace `PinnedShowcase` with `ProductStories`; own the single landing bootstrap call.
- `src/components/marketing/Hero.astro` — retain one hero `SceneWindow`; remove the page-wide installer and obsolete shared-window control wiring from this component.
- `src/pages/features.astro` — switch the features scene installer to the same motion-gated bootstrap.
- `src/components/scenes/SceneWindow.astro` — remove the `windowRole` shared/mobile ownership API and shared ribbon-navigation/workflow-switcher overlays; keep a standalone frame plus its real pause-control slot.
- `src/lib/scenes/install-scene-system.ts` — discover only standalone `[data-scene-window][data-scene-id]` roots for product pages; exclude ambient definitions from the landing registry.
- `src/lib/sunrise.ts` — accept the independently installed morning controller without relying on any shared showcase controller; keep the one-way theme boundary behavior.
- `src/scenes/landing/delegation.scene.ts`
- `src/scenes/landing/employees.scene.ts`
- `src/scenes/landing/todos.scene.ts`
- `src/scenes/landing/workflow-approval.scene.ts`
- `src/scenes/landing/trigger-fire.scene.ts` — make the four story scenes loop and bring all five landing product loops into the 3–6 second full-cycle envelope without changing resolved truth.
- `src/scenes/features/engine-switch.scene.ts`
- `src/scenes/features/org-hire.scene.ts`
- `src/scenes/features/todo-approval.scene.ts`
- `src/scenes/features/triage-run.scene.ts`
- `src/scenes/features/webhook-fire.scene.ts`
- `src/scenes/features/mcp-hands.scene.ts`
- `src/scenes/features/slack-approve.scene.ts` — shorten long dwells; compress `triage-run` beats so every feature cycle fits the same envelope.
- `scripts/measure-eager-js.ts` — settle landing measurement on a standalone player instead of waiting for a ScrollTrigger count.
- `scripts/qa-gates.ts` — retain the named checkpoint matrix while pointing mobile/reduced selectors at independent story roots; update any compressed feature checkpoint times.
- `tests/unit/showcase-scenes.test.ts` — rename its description to product stories and assert the new loop envelope while preserving resolved semantic states.
- `tests/unit/features-scenes.test.ts` — replace the 10–16 second/6-second-dwell contract with the 3–6 second/visible-dwell contract.
- `tests/unit/qa-gates.test.ts` — preserve desktop/mobile/light/dark/reduced coverage after selector changes.
- `tests/e2e/scene-system.spec.ts` — prove ownership moves between independent windows and returns to the hero with no breakpoint rebuild or shared controller.
- `tests/e2e/dashboard-surfaces.spec.ts` — point surface fidelity checks at each story's own window.
- `tests/e2e/theatre.spec.ts` — replace the “back through pinned showcase” traversal with reverse traversal through ordinary story sections.
- `tests/e2e/amend-alive.spec.ts` — retire shared-window ambient/switcher assertions and retain only still-user-visible surface truth in independent roots.
- `tests/e2e/scene-cross-browser.spec.ts` — verify normal flow/offscreen pausing in Firefox and WebKit rather than desktop pin/mobile mode changes.
- `tests/e2e/hero.spec.ts` — assert exactly one hero window and the motion-gated runtime behavior.
- `tests/e2e/features-page.spec.ts` — assert the shortened loop contract, pause behavior, and reduced-motion non-import behavior without changing feature claims.
- `tests/visual/landing.visual.spec.ts` — seek each independent story root directly; remove shared-controller activation helpers.
- `tests/visual/features.visual.spec.ts` — update only checkpoint times changed by the loop compression.

### Delete

- `src/components/marketing/PinnedShowcase.astro` — the rejected shared/pinned composition.
- `src/lib/scenes/wire-showcase-controls.ts` — ribbon navigation and definition swapping exist only for the shared window.
- `tests/e2e/pinned-showcase.spec.ts` — superseded by `tests/e2e/product-stories.spec.ts`.

### Deliberately Unchanged

- `src/content/docs/**`, `src/content/machine/**`, `PLAN.md`, `docs/TECH-PLAN.md`, release metadata, CLI snapshots, Ledger token snapshot, and every path under `variants/`.
- `~/Projects/jinn`, the protected preview, gateway state, remotes, hosting, DNS, and public deployment state.

## Acceptance Mapping

| Acceptance criterion                                          | Implementation files                                                         | Automated evidence                                                                                                                                                           | Browser/visual evidence                                                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Natural document scrolling                                    | `ProductStories.astro`, `index.astro`                                        | `product-stories.spec.ts` asserts increasing in-flow `top` positions, no `position: sticky/fixed`, no tall trigger spacers, and ordinary wheel/PageDown progress             | Chromium + WebKit fast/slow scroll at 1440x900 and 390x844                                   |
| No shared/sticky scene swap                                   | delete `PinnedShowcase.astro`, remove `windowRole` overlays                  | assert zero `[data-scene-controller]`, `[data-scene-pin]`, `[data-scene-shared-window]`, `[data-scene-mobile-window]`, and `[data-ribbon-nav]` on `/`                        | Inspect DOM and computed styles in both themes                                               |
| Independent feature/story windows; one hero window            | `ProductStories.astro`, `Hero.astro`, existing `FeatureWindow.astro`         | assert one hero `delegation` root, one root per story/feature ID, unique local targets, and no nested scene roots                                                            | Desktop/mobile screenshots of hero and every story window                                    |
| Truthful 3–6 second loops, visible action, dwell, quiet reset | landing/feature scene definitions, unit tests                                | calculate `resolved.at + dwellMs + quietResetMs` in `[3000,6000]`; `dwellMs >= 800`; `quietResetMs === 600`; existing reducer end-state assertions remain exact              | Observe one full cycle per scene; confirm readable resolved hold and low-salience fade reset |
| Keyboard pause for loops over five seconds                    | `SceneWindow.astro`, existing `scene-player.ts`, existing `scene-system.css` | for every calculated cycle >5000ms assert labeled button, 44x44 box, Enter/Space toggles `Pause animation`/`Play animation`, and focus remains visible                       | Keyboard-only pass at desktop/mobile; ensure controls do not overlap content                 |
| Pause offscreen/background                                    | existing player/channel plus independent roots                               | `scene-system.spec.ts`, `features-page.spec.ts`, `scene-player.spec.ts` assert stable `data-scene-time` offscreen/hidden and resume from same time; at most one playing root | Scroll quickly between adjacent roots; background/restore tab in Chromium and WebKit         |
| Reduced motion: resolved, no GSAP/ScrollTrigger               | `install-motion-scenes.ts`, page bootstraps                                  | block/record scene-runtime requests; assert no GSAP/ScrollTrigger chunk request, no timeline/control attributes, resolved semantic DOM, and no CSS animation                 | Desktop/mobile reduced-motion screenshots in both themes                                     |
| Desktop/mobile, light/dark                                    | story layout + visual specs                                                  | existing visual matrix remains named and deterministic                                                                                                                       | 1440x900 and 390x844, device scale 2, light/dark, Chromium; mobile WebKit smoke              |
| Keyboard/focus and JavaScript-disabled truth                  | standalone controls and SSR markup                                           | axe, tab-order, fake chrome inert, no-JS resolved states, no horizontal overflow                                                                                             | Keyboard-only navigation and focus-ring review at 1440 and 390                               |
| Claims truthful; documentation unaffected                     | scene reducers/copy retained; docs untouched                                 | existing canonical-data/copy tests pass; diff guard proves no changes under public docs/machine/release paths                                                                | Compare captions and resolved UI for employees, reviewed todo, parked gate, fired run        |
| Preserve performance budgets                                  | dynamic import, no ScrollTrigger request, shorter active work                | `pnpm check`, eager-JS measurement, Lighthouse; budgets remain unchanged                                                                                                     | Cold mobile Lighthouse x3 and performance trace with <=1 active timeline                     |
| No public deployment                                          | no deployment files/actions                                                  | final Git status and scoped diff only                                                                                                                                        | No preview/protected/live verification is attempted                                          |

## Task 1: Lock the Rejected-Architecture Contract in Tests

**Files:**

- Create: `tests/e2e/product-stories.spec.ts`
- Modify: `tests/unit/showcase-scenes.test.ts`
- Modify: `tests/e2e/hero.spec.ts`
- Delete after replacement: `tests/e2e/pinned-showcase.spec.ts`

**Interfaces:**

- Consumes: current `/` SSR markup and `landingSceneDefinitions`.
- Produces: selectors `[data-product-stories]`, `[data-product-story]`, and one standalone `[data-scene-window][data-scene-id]` per scene.

- [ ] **Step 1: Write failing structural tests**

  Add assertions equivalent to:

  ```ts
  await expect(page.locator("[data-product-stories]")).toHaveCount(1);
  await expect(page.locator(".hero [data-scene-id='delegation']")).toHaveCount(
    1,
  );
  await expect(
    page.locator("[data-product-story] [data-scene-window]"),
  ).toHaveCount(4);
  await expect(
    page.locator(
      "[data-scene-controller], [data-scene-pin], [data-scene-shared-window], [data-scene-mobile-window]",
    ),
  ).toHaveCount(0);
  ```

  For each story root, assert its bounding box participates in normal flow, the next root starts below the previous root, and computed `position` is neither `sticky` nor `fixed`.

- [ ] **Step 2: Write the new loop-envelope unit failure**

  Use this exact contract for hero + four story definitions:

  ```ts
  const cycleMs = (scene: SceneDefinition) =>
    scene.checkpoints.find(({ name }) => name === "resolved")!.at +
    (scene.playback.dwellMs ?? 0) +
    (scene.playback.quietResetMs ?? 0);

  expect(scene.playback.mode, scene.id).toBe("loop");
  expect(cycleMs(scene), scene.id).toBeGreaterThanOrEqual(3_000);
  expect(cycleMs(scene), scene.id).toBeLessThanOrEqual(6_000);
  expect(scene.playback.dwellMs, scene.id).toBeGreaterThanOrEqual(800);
  expect(scene.playback.quietResetMs, scene.id).toBe(600);
  ```

- [ ] **Step 3: Run the focused tests and preserve the expected failure**

  Run under Node 24.13.0:

  ```bash
  pnpm test -- tests/unit/showcase-scenes.test.ts
  pnpm test:e2e -- --project=chromium tests/e2e/product-stories.spec.ts tests/e2e/hero.spec.ts
  ```

  Expected: unit failures on `once` playback/long hero cycle and browser failures because `ProductStories` does not yet exist and pinned/shared markers still exist.

- [ ] **Step 4: Commit only the contract tests**

  ```bash
  git add tests/e2e/product-stories.spec.ts tests/unit/showcase-scenes.test.ts tests/e2e/hero.spec.ts
  git commit -m "test: define normal-scroll product story contract"
  ```

## Task 2: Replace the Pinned Showcase with Independent Story Windows

**Files:**

- Create: `src/components/marketing/ProductStories.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/components/marketing/Hero.astro`
- Modify: `src/components/scenes/SceneWindow.astro`
- Delete: `src/components/marketing/PinnedShowcase.astro`
- Delete: `src/lib/scenes/wire-showcase-controls.ts`

**Interfaces:**

- Consumes: `SceneWindow`, `OrgSurface`, `TodosSurface`, `WorkflowSurface`, `TriggersSurface`, and the existing four truthful copy records.
- Produces: `ProductStories.astro` with four direct child story sections, each carrying `data-product-story` and one scene ID.

- [ ] **Step 1: Build `ProductStories.astro` from the existing four copy records**

  Keep the exact IDs, titles, bodies, and captions currently authored in `PinnedShowcase.astro`. Render each record once. Each window must use:

  ```astro
  <section
    class:list={["product-story", flip && "product-story--flip"]}
    data-product-story={story.id}
  >
    <header class="product-story__copy">...</header>
    <div class="product-story__stage">
      <SceneWindow
        caption={story.caption}
        activePane={story.pane}
        sceneId={story.id}
      >
        <!-- render only the surface belonging to story.pane -->
      </SceneWindow>
      <p class="product-story__caption">{story.caption}</p>
    </div>
  </section>
  ```

  Desktop CSS: bounded 5/7 grid, alternating with `order` or grid placement, `position: relative/static`, no viewport-height lock. Mobile CSS: one column with `text -> window -> caption`; use the existing scene window's mobile height and no duplicate markup.

- [ ] **Step 2: Swap the page composition**

  Replace the `PinnedShowcase` import/render in `src/pages/index.astro` with `ProductStories`. Move landing scene bootstrap ownership out of `Hero.astro` and into the page so the hero remains only presentation markup.

- [ ] **Step 3: Remove shared/mobile role APIs from `SceneWindow`**

  Remove `windowRole`, `data-scene-shared-window`, `data-scene-mobile-window`, ribbon overlay buttons, workflow switcher buttons, and their CSS. Preserve the decorative full dashboard, `sceneId`, `activePane`, caption, and `[data-scene-controls]` slot. Fake dashboard chrome remains `aria-hidden`; the player-inserted pause control remains outside it.

- [ ] **Step 4: Remove the rejected component and obsolete wiring**

  Delete `PinnedShowcase.astro` and `wire-showcase-controls.ts`. Verify no production import remains:

  ```bash
  rg -n "PinnedShowcase|wireShowcaseControls|data-scene-pin|data-scene-shared-window|data-scene-mobile-window|data-ribbon-nav" src --glob '!src/pages/test-fixtures/**'
  ```

  Expected: no matches.

- [ ] **Step 5: Run structure and type gates**

  ```bash
  pnpm typecheck
  pnpm test:e2e -- --project=chromium tests/e2e/product-stories.spec.ts tests/e2e/hero.spec.ts
  ```

  Expected: normal-flow structure passes; loop-envelope assertions may remain red until Task 4.

- [ ] **Step 6: Commit the composition**

  ```bash
  git add src/pages/index.astro src/components/marketing/Hero.astro src/components/marketing/ProductStories.astro src/components/scenes/SceneWindow.astro src/components/marketing/PinnedShowcase.astro src/lib/scenes/wire-showcase-controls.ts
  git commit -m "feat: replace pinned showcase with product stories"
  ```

## Task 3: Make Reduced Motion a True No-Runtime Path

**Files:**

- Create: `src/lib/scenes/install-motion-scenes.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/features.astro`
- Modify: `src/lib/scenes/install-scene-system.ts`
- Modify: `src/lib/sunrise.ts`
- Modify: `tests/e2e/hero.spec.ts`
- Modify: `tests/e2e/features-page.spec.ts`

**Interfaces:**

- Produces: `installMotionScenes(options): () => void` with the following structural contract, deliberately avoiding a runtime import of `SceneController`:

  ```ts
  export interface DestroyableSceneController {
    destroy(): void;
  }

  export interface InstallMotionScenesOptions<
    TController extends DestroyableSceneController,
  > {
    load(): Promise<() => Promise<TController[]>>;
    ready?(controllers: readonly TController[]): void;
  }

  export function installMotionScenes<
    TController extends DestroyableSceneController,
  >(options: InstallMotionScenesOptions<TController>): () => void;
  ```

- Guarantees: no static import path from either page entry to `scene-player.ts`, `scene-motion-channel.ts`, GSAP, CustomEase, or ScrollTrigger when the initial media query is reduced.

- [ ] **Step 1: Write reduced-runtime request tests**

  Before navigation, emulate reduced motion and collect same-origin `.js` responses. Assert:

  ```ts
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.locator("[data-scene-timeline-count], [data-scene-playback-control]"),
  ).toHaveCount(0);
  await expect(
    page.locator(
      "[data-scene-id='workflow-approval'] [data-target='step-gate']",
    ),
  ).toHaveAttribute("data-state", "awaiting-approval");
  ```

  Also assert `html[data-scene-runtime='reduced']` and that no requested JS response is the dynamically named scene runtime/GSAP/ScrollTrigger chunk. Repeat for `/features/`.

- [ ] **Step 2: Implement the GSAP-free bootstrap**

  The bootstrap must:

  1. create `matchMedia("(prefers-reduced-motion: reduce)")` without importing the runtime;
  2. mark `html.dataset.sceneRuntime = "reduced"` and leave SSR resolved when matched;
  3. dynamically call `options.load()` only when not matched;
  4. retain installed controllers and call `destroy()` on a later transition to reduced;
  5. reinstall once when the preference changes back to motion;
  6. return cleanup that removes the media listener and destroys controllers.

  Page usage must be a dynamic loader, not a static runtime import:

  ```ts
  installMotionScenes({
    load: async () => {
      const runtime = await import("../lib/scenes/install-scene-system");
      return () => runtime.installSceneSystem();
    },
    ready: (controllers) => installSunrise(controllers),
  });
  ```

  The features loader imports both `install-scene-system` and `features-scene-registry` inside `load` and passes the feature registry to the installer.

- [ ] **Step 3: Restrict production discovery to independent roots**

  In `install-scene-system.ts`, query only `[data-scene-window][data-scene-id]`; reject a nested scene root in development; remove ambient scene definitions from `landingSceneDefinitions`. Its ordered keys must be exactly `delegation`, `employees`, `todos`, `workflow-approval`, `trigger-fire`, `night-shift`, and `morning-approval`. Do not delete the historical ambient files in this task unless a separate cleanup is approved.

- [ ] **Step 4: Preserve sunrise behavior**

  `installSunrise` continues to find the controller whose `root` is the `morning-approval` window, gate it with pause reason `api`, and perform the one-way light transition after the 350ms in-view dwell. It must not query a shared showcase root or use ScrollTrigger.

- [ ] **Step 5: Run reduced and preference-change checks**

  ```bash
  pnpm test:e2e -- --project=chromium tests/e2e/hero.spec.ts tests/e2e/features-page.spec.ts tests/e2e/theatre.spec.ts
  ```

  Expected: initial reduced visits have resolved DOM, no scene timeline/control/runtime request; motion -> reduced destroys players and restores resolved DOM; reduced -> motion lazily installs one player per root.

- [ ] **Step 6: Commit the bootstrap**

  ```bash
  git add src/lib/scenes/install-motion-scenes.ts src/lib/scenes/install-scene-system.ts src/lib/sunrise.ts src/pages/index.astro src/pages/features.astro tests/e2e/hero.spec.ts tests/e2e/features-page.spec.ts
  git commit -m "perf: skip scene runtime under reduced motion"
  ```

## Task 4: Re-author Every Loop into the 3–6 Second Envelope

**Files:**

- Modify: the five landing scene files and seven feature scene files listed in the File Map.
- Modify: `tests/unit/showcase-scenes.test.ts`
- Modify: `tests/unit/features-scenes.test.ts`
- Modify: `scripts/qa-gates.ts`
- Modify: `tests/unit/qa-gates.test.ts`

**Interfaces:**

- Preserves: scene IDs, claims, transcripts, targets, named resolved states, and action vocabulary.
- Changes: playback mode/dwell and, only where needed, integer beat/checkpoint times.

- [ ] **Step 1: Adopt these exact cycle targets**

  | Scene               | Resolved target |  Dwell | Reset | Full cycle |
  | ------------------- | --------------: | -----: | ----: | ---------: |
  | `delegation`        |          4200ms | 1000ms | 600ms |     5800ms |
  | `employees`         |          2700ms | 1200ms | 600ms |     4500ms |
  | `todos`             |          3600ms | 1000ms | 600ms |     5200ms |
  | `workflow-approval` |          4100ms | 1000ms | 600ms |     5700ms |
  | `trigger-fire`      |          3000ms |  900ms | 600ms |     4500ms |
  | `engine-switch`     |          4400ms |  800ms | 600ms |     5800ms |
  | `org-hire`          |          3400ms | 1000ms | 600ms |     5000ms |
  | `todo-approval`     |          3600ms | 1000ms | 600ms |     5200ms |
  | `triage-run`        |          4200ms | 1000ms | 600ms |     5800ms |
  | `webhook-fire`      |          2800ms | 1000ms | 600ms |     4400ms |
  | `mcp-hands`         |          4800ms |  600ms | 600ms |     6000ms |
  | `slack-approve`     |          2600ms | 1000ms | 600ms |     4200ms |

  Convert `employees`, `todos`, `workflow-approval`, and `trigger-fire` from `once` to `loop`, with `entry: "play"` and `offscreen: "pause"`. Keep all resolved truth assertions unchanged.

- [ ] **Step 2: Compress only the two overlong action tracks**

  - `delegation`: keep type -> send -> typing -> COO plan -> analyst chip -> writer chip -> first finding, but overlap the semantic handoff enough to resolve by 4200ms. Retain the named `initial`, `sent`, `delegated`, and `resolved` checkpoints with monotonically increasing integer times.
  - `triage-run`: keep draw -> trigger -> triage -> route -> approval gate, with the refund path still parked and never completed; retime to resolve at 4200ms. Preserve all node/state/progress outcomes.

  Do not shorten text by changing the public claim or inventing a new event. Do not add a new action type.

- [ ] **Step 3: Replace old long-cycle tests**

  In `features-scenes.test.ts`, remove “each cycle is 10–16 seconds” and “dwells at least six seconds.” Apply the common `[3000,6000]`, dwell >=800, reset 600 contract, except the explicitly approved 600ms dwell for `mcp-hands`, whose full cycle is exactly 6000ms and whose resolved four-call grid remains continuously readable.

- [ ] **Step 4: Update deterministic checkpoint times**

  Update only `delegation` and `triage-run` checkpoint entries in `scripts/qa-gates.ts`/visual state data when their authored named times change. Do not rename checkpoints or reduce the visual matrix.

- [ ] **Step 5: Run scene tests**

  ```bash
  pnpm test -- tests/unit/scene-validator.test.ts tests/unit/scene-reducer.test.ts tests/unit/showcase-scenes.test.ts tests/unit/features-scenes.test.ts tests/unit/qa-gates.test.ts
  ```

  Expected: all definitions validate; every final state equals canonical data; every cycle fits the contract.

- [ ] **Step 6: Commit the loops**

  Explicitly stage only the scene files, their unit tests, and `scripts/qa-gates.ts`, then commit:

  ```bash
  git commit -m "feat: tighten product scene loops"
  ```

## Task 5: Update Real-Page Lifecycle, Surface, and Cross-Browser Tests

**Files:**

- Modify: `tests/e2e/scene-system.spec.ts`
- Modify: `tests/e2e/dashboard-surfaces.spec.ts`
- Modify: `tests/e2e/theatre.spec.ts`
- Modify: `tests/e2e/amend-alive.spec.ts`
- Modify: `tests/e2e/scene-cross-browser.spec.ts`
- Modify: `tests/e2e/features-page.spec.ts`
- Modify: `scripts/measure-eager-js.ts`

**Interfaces:**

- Consumes: independent scene roots and the existing `SceneMotionChannel` ownership contract.
- Produces: browser evidence for one active timeline, offscreen/background pause, keyboard control, normal scroll, and truthful resolved states.

- [ ] **Step 1: Replace shared selectors with local scene roots**

  Standardize real-page helpers on:

  ```ts
  const sceneWindow = (page: Page, id: string) =>
    page.locator(`[data-scene-window][data-scene-id='${id}']`).first();
  ```

  Do not retain helpers named `showcase`, `sharedWindow`, `stage`, or `activateDesktopScene` for the landing page.

- [ ] **Step 2: Prove ownership and pause behavior**

  Scroll hero -> employees -> todos -> workflow -> triggers -> night -> morning and back. At each stop assert exactly one `[data-scene-player-state='playing']`; outgoing `data-scene-time` remains stable for at least 500ms; returning resumes the same loop without creating a second timeline. Dispatch `visibilitychange` with the existing fixture approach and verify time is stable until visible again.

- [ ] **Step 3: Prove keyboard control only where required**

  Calculate cycles from the exported definitions. For each >5000ms scene, focus its pause button, press Space, assert `aria-label="Play animation"` and stable time, press Enter, assert `aria-label="Pause animation"` and time progression. Bounding boxes must be at least 44x44 and nonoverlapping.

- [ ] **Step 4: Preserve semantic truth tests**

  Keep the existing assertions that:

  - a completed todo means reviewed/done;
  - workflow post remains queued at the human gate;
  - cron/webhook firing creates a visible run;
  - feature webhook copy says token-authenticated, not signed;
  - sunrise is one-way per full page visit.

- [ ] **Step 5: Update eager-JS settling**

  In `measure-eager-js.ts`, make both `/` and `/features/` wait for the first `[data-scene-window][data-scene-player-state]`. Remove all ScrollTrigger-count comments and waits. Preserve gzip output and use `EAGER_JS_PORT=4333` or another nonprotected port.

- [ ] **Step 6: Run Chromium and cross-browser gates**

  ```bash
  pnpm test:e2e -- --project=chromium tests/e2e/product-stories.spec.ts tests/e2e/scene-system.spec.ts tests/e2e/dashboard-surfaces.spec.ts tests/e2e/theatre.spec.ts tests/e2e/amend-alive.spec.ts tests/e2e/features-page.spec.ts
  pnpm test:e2e -- tests/e2e/scene-cross-browser.spec.ts
  ```

  Expected: normal scrolling, one owner, pause/resume, reduced/no-JS, Firefox reduced smoke, and WebKit mobile scroll all pass.

- [ ] **Step 7: Commit browser coverage**

  ```bash
  git add tests/e2e scripts/measure-eager-js.ts
  git commit -m "test: verify independent scene lifecycle"
  ```

## Task 6: Visual, Accessibility, Documentation-Scope, and Performance Gates

**Files:**

- Modify: `tests/visual/landing.visual.spec.ts`
- Modify: `tests/visual/features.visual.spec.ts` only if compressed checkpoint times require it.
- Modify after design approval only: affected files under `tests/visual/baselines/**`.

**Interfaces:**

- Consumes: named checkpoints and current QA ports.
- Produces: approved desktop/mobile/light/dark/reduced evidence without public deployment.

- [ ] **Step 1: Seek independent windows directly**

  Remove `activateDesktopScene`/`activateMobileScene`. Scroll the target `[data-scene-id]` into view, find its own development overlay, pause, seek the named checkpoint, then capture the local story section. Preserve every entry in `desktopSceneCheckpoints`, `mobileVisualStates`, and `reducedMotionStates`.

- [ ] **Step 2: Run nonvisual full gates under Node 24.13.0**

  ```bash
  export JINN_SOURCE_ROOT=~/Projects/jinn
  export JINN_SOURCE_REPO=~/Projects/jinn
  pnpm install --frozen-lockfile
  pnpm check
  pnpm test:e2e
  ```

  The Jinn paths are environment values consumed read-only by existing token/docs checks; do not run commands in that repository or alter it.

- [ ] **Step 3: Run visual comparison before any baseline write**

  ```bash
  pnpm test:visual
  ```

  Expected: old landing composition baselines fail in known, reviewable ways; feature snapshots should remain unchanged except approved timing captures. Inspect the full diff at 1440x900 and 390x844, light/dark, plus reduced motion.

- [ ] **Step 4: Perform the design and accessibility review**

  Confirm:

  - hero contains one standalone full window;
  - each story reads as one self-contained proof;
  - no window is clipped, pinned, or shared;
  - headings balance and body/caption text wraps cleanly;
  - nested radii remain concentric and shadows—not decorative hairlines—define depth;
  - pause icons are optically centered and their hit areas do not overlap content;
  - no `transition: all` or speculative `will-change` was introduced;
  - axe reports no serious violations and focus remains visible in both themes.

- [ ] **Step 5: Update only approved baselines**

  After a separate design review explicitly approves the new composition:

  ```bash
  UPDATE_VISUAL_BASELINES=1 pnpm test:visual --update-snapshots
  pnpm test:visual
  ```

  If approval is not available, leave baseline changes unstaged and hand off the failed visual diff as the required review artifact.

- [ ] **Step 6: Prove performance budgets**

  ```bash
  pnpm build
  EAGER_JS_PORT=4333 pnpm tsx scripts/measure-eager-js.ts
  EAGER_JS_PORT=4334 EAGER_JS_PATH=/features/ pnpm tsx scripts/measure-eager-js.ts
  pnpm test:lighthouse
  ```

  Expected: landing eager JS <=90KB gzip; no ScrollTrigger network request on `/`; assets <=500KB; Lighthouse and LCP/CLS/TBT thresholds unchanged. If a budget fails, remove runtime work/layers/blur before considering any design expansion; never raise a threshold.

- [ ] **Step 7: Prove docs and safety scope**

  ```bash
  git diff --exit-code 7b510ed471167c4db1ce374ed45e3b5952239bb2 -- src/content/docs src/content/machine PLAN.md docs/TECH-PLAN.md src/data/release.json src/data/cli-help src/data/release-impact.json
  git diff --check
  pnpm safety:check
  ```

  Expected: no public documentation/release diff, no whitespace errors, and no privacy findings.

- [ ] **Step 8: Final scoped review and commit**

  Recheck both worktrees before staging:

  ```bash
  git status --short --branch
  git diff --name-only
  git -C ~/Projects/jinn-landing status --short --branch
  ```

  The main checkout must still show exactly the six untracked `variants/*/shoot.mjs` files. Stage explicit task files only, never `git add -A`, and commit the approved QA/baseline changes with:

  ```bash
  git commit -m "test: complete normal-scroll landing QA"
  ```

## Rollback and Stop Conditions

Stop without destructive recovery and report the exact evidence if any condition occurs:

1. Worktree path, branch, HEAD ancestry, or frozen base no longer matches the preflight identity.
2. Any file under `variants/`, the protected preview, the Jinn product repository, public docs/release data, or the main checkout changes unexpectedly.
3. Node 24.13.0 and pnpm 10.6.4 cannot both be proven before dependency/build/test commands.
4. The new layout needs scroll scripting, pinning, a shared window, duplicate desktop/mobile markup, or invented product copy to work.
5. Reduced motion issues a GSAP/CustomEase/ScrollTrigger request, creates a timeline/control, or fails to render the resolved SSR state.
6. A scene cannot fit the 3–6 second cycle without making its truthful outcome unreadable. Split/simplify the scene rather than speeding text, removing the dwell, or inventing a claim.
7. More than one timeline advances, an offscreen/hidden timeline advances, or keyboard pause loses its user reason after visibility changes.
8. A visual change is not approved, axe finds a serious issue, focus is obscured, or a control hit area is below 44x44.
9. Eager JS, transferred assets, Lighthouse, LCP, CLS, TBT, or main-thread budgets regress. Do not relax budgets.
10. Any command attempts port 4321/7777, a public deploy, push/PR/merge, DNS, gateway mutation, or protected-preview mutation.

## Prior Verifier Findings Addressed

No prior verifier findings were supplied for this workflow run. The plan directly addresses the task-origin findings proven by source inspection: shared/pinned landing composition, shared pane swapping, long low-action loops, runtime import under reduced motion, and test/performance tooling coupled to ScrollTrigger.

## Final Definition of Done

- The scoped branch contains only reviewed implementation/tests/approved baselines plus this plan.
- `/` scrolls naturally at desktop and mobile widths with one hero window and four independent story windows; `/features/` retains seven independent windows.
- Every visible product loop has truthful resolved state, a 3–6 second full cycle, a dwell, and a quiet reset; every >5 second cycle has a working keyboard pause control.
- Offscreen/background scenes pause; only one timeline advances.
- Reduced motion and no-JS show resolved content, and reduced motion loads no GSAP or ScrollTrigger runtime.
- Desktop/mobile, light/dark, keyboard/focus, axe, no-JS, visual, full test, safety, link, docs-contract, eager-JS, and Lighthouse gates pass.
- Public docs, release data, product repository, protected preview, gateway, remotes, variants, and deployment state remain untouched.

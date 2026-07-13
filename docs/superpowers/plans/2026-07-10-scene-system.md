# Scene System A-05–A-07 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the typed, deterministic scene-definition layer, the GSAP-backed `ScenePlayer`, and responsive `SceneController`, then wire the resolved-first `delegation` hero end to end.

**Architecture:** Scene definitions remain semantic TypeScript data. A pure validator/reducer resolves named checkpoints without browser globals; a DOM-scoped player compiles one validated definition into one GSAP timeline; a page controller owns activation and breakpoint-specific ScrollTrigger/IntersectionObserver bindings while allowing only one active player. Static SSR remains the resolved truth, and progressive enhancement primes the initial state only when `html[data-motion="ok"]` is present.

**Tech Stack:** Astro 7, strict TypeScript 5.9, Vitest 4, GSAP + ScrollTrigger, Playwright 1.58.

## Global Constraints

- Keep every scene target local to its `[data-scene-window]` root.
- Keep the action vocabulary to `type-text`, `replace-text`, `enter`, `exit`, `set-state`, `set-progress`, `highlight`, `pulse`, and `theme`.
- Use only `smooth`, `spring`, and `snappy` Ledger easing tokens.
- The `delegation` loop must dwell for exactly `5000ms` and quiet-reset for exactly `600ms`.
- Reduced motion must instantiate neither GSAP timelines nor ScrollTrigger and must preserve the static resolved DOM.
- Desktop behavior starts at `900px`; mobile behavior is normal-flow stacked windows with viewport activation.
- The visible user control labels are exactly `Pause animation` and `Play animation`, with a minimum `44px × 44px` hit area.
- Do not modify the theme system or hero composition beyond sanctioned declarative runtime hooks.
- Eager JavaScript on `/`, including GSAP, must remain at or below `90KB` gzip.
- Preserve the six pre-existing untracked `variants/**/shoot.mjs` files.

---

### Task 1: A-05 — Scene definitions, validation, and checkpoint reduction

**Files:**

- Modify: `src/lib/scenes/types.ts`
- Modify: `src/lib/scenes/dashboard.ts`
- Create: `src/lib/scenes/scene-validator.ts`
- Create: `src/lib/scenes/scene-reducer.ts`
- Create: `src/scenes/landing/delegation.scene.ts`
- Create: `tests/unit/scene-validator.test.ts`
- Create: `tests/unit/scene-reducer.test.ts`

**Interfaces:**

- Produces: `SceneDefinition`, the nine semantic `SceneAction` variants, `validateSceneDefinition(definition)`, `resolveSceneCheckpoint(definition, checkpoint)`, `delegationInitial`, and `delegationScene`.
- Guarantees: definition validation is DOM-free; `resolveSceneCheckpoint(delegationScene, "resolved")` is deeply equal to `delegationResolved`.

- [ ] **Step 1: Write validator tests that fail for missing/duplicate targets, illegal transitions, overlapping text actions, invalid easing tokens, and unbounded loop/pulse policies.**

```ts
expect(() => validateSceneDefinition(invalidDefinition)).toThrowError(
  'Scene "invalid": beat at 0ms targets missing target "missing"',
);
```

- [ ] **Step 2: Run `pnpm vitest run tests/unit/scene-validator.test.ts` and confirm RED because the validator module does not exist.**

- [ ] **Step 3: Add the typed contracts and the minimal pure validator.**

```ts
export type SceneAction =
  | TypeTextAction
  | ReplaceTextAction
  | EnterAction
  | ExitAction
  | SetStateAction
  | SetProgressAction
  | HighlightAction
  | PulseAction
  | ThemeAction;

export function validateSceneDefinition<TState>(
  definition: SceneDefinition<TState>,
): ValidatedSceneDefinition<TState>;
```

- [ ] **Step 4: Run the focused validator tests and confirm GREEN.**

- [ ] **Step 5: Write reducer tests for `initial`, intermediate checkpoints, unknown checkpoints, and exact resolved equality with `delegationResolved`; confirm RED.**

```ts
expect(resolveSceneCheckpoint(delegationScene, "resolved")).toEqual(
  delegationResolved,
);
```

- [ ] **Step 6: Add `delegationInitial`, author the storyboard timeline verbatim, and implement the immutable chat checkpoint reducer.**

```ts
export function resolveSceneCheckpoint<TState>(
  definition: SceneDefinition<TState>,
  checkpoint: string,
): TState;
```

- [ ] **Step 7: Run `pnpm vitest run tests/unit/scene-validator.test.ts tests/unit/scene-reducer.test.ts`, then all unit tests.**

- [ ] **Step 8: Stage only A-05 files, run privacy leak-grep and `git diff --cached --check`, then commit `feat: add typed scene definitions and reducer`.**

---

### Task 2: A-06 — ScenePlayer and lifecycle controls

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/components/scenes/SceneWindow.astro`
- Modify: `src/components/marketing/Hero.astro`
- Create: `src/lib/scenes/scene-dom.ts`
- Create: `src/lib/scenes/scene-player.ts`
- Create: `src/styles/scene-system.css`
- Create: `tests/e2e/scene-player.spec.ts`
- Modify: `tests/e2e/hero.spec.ts`

**Interfaces:**

- Consumes: validated `SceneDefinition` and a `[data-scene-window]` root.
- Produces: `ScenePlayer` with `play()`, `pause()`, `resume()`, `restart()`, `seek(ms)`, `destroy()`, `currentTime`, `currentCheckpoint`, and `isPlaying`.
- Guarantees: one GSAP timeline per player; exact root-scoped target lookup; resolved snapshot restoration on destroy; no GSAP instantiation under reduced motion.

- [ ] **Step 1: Add Playwright tests for exact copy assertions, missing/duplicate local targets, one timeline, the 44px pause control, pause/resume time continuity, seek/restart, reduced-motion bypass, and destroy cleanup; confirm RED.**

```ts
await expect(
  root.getByRole("button", { name: "Pause animation" }),
).toBeVisible();
expect(await root.evaluate((node) => node.dataset.sceneTimelineCount)).toBe(
  "1",
);
```

- [ ] **Step 2: Pin GSAP with `pnpm add --save-exact gsap@<verified-current-version>` and keep package hardening intact.**

- [ ] **Step 3: Implement DOM snapshot/scoping helpers and compile all nine actions into one GSAP timeline using Ledger easing values.**

```ts
const matches = root.querySelectorAll<HTMLElement>(
  `[data-target="${CSS.escape(target)}"]`,
);
if (matches.length !== 1) throw new Error(...);
```

- [ ] **Step 4: Implement loop dwell/quiet-reset, user/visibility/offscreen pause reasons, accessible control mounting, and complete cleanup.**

```ts
player.pause("user");
player.resume("user");
player.destroy();
```

- [ ] **Step 5: Add the sanctioned `data-scene-id="delegation"` hook and install the hero player only for motion-capable browsers.**

- [ ] **Step 6: Run the focused Playwright file on a non-4321 test port, then the full unit suite.**

- [ ] **Step 7: Stage only A-06 files, run privacy leak-grep and `git diff --cached --check`, then commit `feat: add scene player lifecycle`.**

---

### Task 3: A-07 — Responsive SceneController and debug tooling

**Files:**

- Create: `src/lib/scenes/scene-controller.ts`
- Create: `src/lib/scenes/scene-debug.ts`
- Create: `src/lib/scenes/install-scene-system.ts`
- Create: `src/pages/__fixtures__/scene-controller.astro`
- Modify: `src/components/marketing/Hero.astro`
- Modify: `src/styles/scene-system.css`
- Modify: `playwright.config.ts`
- Create: `tests/e2e/scene-controller.spec.ts`

**Interfaces:**

- Consumes: declarative `[data-scene-stage][data-scene-id]` registrations and scene-window definitions.
- Produces: `SceneController` with `start()`, `activate(id)`, and `destroy()`; `installSceneSystem()` for page bootstrapping.
- Guarantees: desktop ScrollTrigger pinning/discrete bidirectional activation; mobile normal-flow one-shot viewport activation; one active page-wide timeline; breakpoint rebinding preserves semantic/player state; dev-only overlay loaded through a dead-code-eliminable `import.meta.env.DEV` branch.

- [ ] **Step 1: Add a noindex fixture with four declarative stages and Playwright tests for desktop forward/reverse activation, pane/ribbon `data-active` movement, mobile no-pinning, root scoping, one active timeline, and resize cleanup; confirm RED.**

```ts
expect(await page.locator("[data-scene-player-state='playing']").count()).toBe(
  1,
);
await expect(sceneRoot.locator("[data-target='pane-org']")).toHaveAttribute(
  "data-active",
  "",
);
```

- [ ] **Step 2: Implement controller ownership and desktop/mobile binding adapters; rebuild only bindings on media-query changes.**

- [ ] **Step 3: Implement and DEV-gate the overlay (tabular time, checkpoint, play/pause, restart, scrubber) and verify it is absent from the production build.**

- [ ] **Step 4: Replace direct hero-player installation with `installSceneSystem()` and ensure navigation/pagehide destroys controller resources.**

- [ ] **Step 5: Run focused controller Playwright tests, then `pnpm check` and `pnpm test:e2e`.**

- [ ] **Step 6: Measure every eager root-page script from `dist/` and report the summed gzip bytes, explicitly including the chunk that contains GSAP/ScrollTrigger.**

```sh
gzip -9 -c dist/_astro/<eager-chunk>.js | wc -c
```

- [ ] **Step 7: Stage only A-07 files, run privacy leak-grep and `git diff --cached --check`, then commit `feat: orchestrate responsive scenes`.**

---

### Task 4: Final verification and handoff

**Files:**

- Modify only if a verification failure first receives a reproducing test.

- [ ] **Step 1: Run `pnpm check` and save the verbatim successful tail.**
- [ ] **Step 2: Run `pnpm test:e2e` and save the verbatim successful tail.**
- [ ] **Step 3: Run `git diff --check main...HEAD`, inspect `git status`, and run the branch leak-grep excluding the one sanctioned repository URL.**
- [ ] **Step 4: Confirm one commit minimum per A-05/A-06/A-07 and summarize any TECH-PLAN/handoff deviations.**
- [ ] **Step 5: Give A-08 the stable target/rendering/lifecycle contracts it must preserve when adding surfaces.**

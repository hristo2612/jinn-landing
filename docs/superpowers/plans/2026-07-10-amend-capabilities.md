# Amendment Scene Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `test-driven-development` and execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pointer stage navigation, ambient scheduling, and scene swapping to the existing scene machinery without changing production page markup or visible output.

**Architecture:** Keep scroll position authoritative by separating navigation intent from ScrollTrigger activation. Extend the shared motion channel with ambient-aware ownership, and refactor `ScenePlayer` runtime setup/teardown so `swap()` can rebuild one surface safely while preserving the existing DOM snapshot and reducer-retention laws.

**Tech Stack:** Astro 7, strict TypeScript, GSAP 3, Vitest, Playwright.

## Global Constraints

- Machinery and tests only; no production ribbon, switcher, or ambient definitions.
- Desktop pinned navigation only at widths of at least 900px; mobile and reduced-motion navigation are no-ops.
- Scroll position remains the source of truth and must continue to drive the single page-level sunrise owner.
- Ambient scenes never instantiate under reduced motion, never preempt scripted owners, and yield only at a beat boundary within 500ms.
- Preserve page-wide LIFO motion ownership, completion-time retention, distinct pause reasons, and strict surface/theme isolation.
- One commit per capability and one documentation commit; leak-grep every staged commit.

---

### Task 1: Pointer-driven stage navigation

**Files:**

- Modify: `src/lib/scenes/scene-controller.ts`
- Modify: `src/pages/test-fixtures/scene-controller.astro`
- Modify: `tests/e2e/scene-controller.spec.ts`
- Modify: `tests/e2e/theatre.spec.ts`

**Interfaces:**

- Consumes: stage activation offsets and existing `activate(sceneId, seekTo?)` behavior.
- Produces: `SceneController.navigateToStage(sceneId): void`, which starts a smooth desktop scroll and suppresses binding activations until the destination or user cancellation.

- [x] Write Playwright tests for current-stage navigation, in-flight replacement, rapid successive jumps, manual-scroll cancellation, mobile no-op, skipped-stage resolution, and sunrise crossing.
- [x] Run the focused specs and confirm failures identify missing smooth-scroll intent behavior.
- [x] Implement a navigation transaction with a destination offset, cancellation listeners, binding suppression, and an internal scroll-driven activation path.
- [x] Run focused unit/e2e tests until green and commit only navigation machinery/tests.

### Task 2: Ambient scheduling policy

**Files:**

- Modify: `src/lib/scenes/types.ts`
- Modify: `src/lib/scenes/scene-validator.ts`
- Modify: `src/lib/scenes/scene-player.ts`
- Modify: `src/lib/scenes/scene-motion-channel.ts`
- Modify: `src/lib/scenes/scene-controller.ts`
- Modify: `src/pages/test-fixtures/scene-controller.astro`
- Modify: `tests/unit/scene-validator.test.ts`
- Modify: `tests/unit/scene-motion-channel.test.ts`
- Modify: `tests/e2e/scene-controller.spec.ts`

**Interfaces:**

- Consumes: `ScenePlayer.onStatusChange`, completion-time retention, and the shared `SceneMotionChannel` claim stack.
- Produces: `SceneDefinition.ambient?: { follows: string; startDelay: number }`, beat-boundary yielding, delayed re-arming, and ambient-only channel claims.

- [x] Write failing validator/channel/browser tests for malformed policies, ≤500ms yielding, delayed start, re-arm, user/visibility/offscreen pause governance, reduced-motion absence, host retention, and LIFO restoration.
- [x] Run focused tests and confirm expected failures.
- [x] Implement policy validation, player yield requests, ambient-aware channel ownership, and controller scheduling/cancellation.
- [x] Run focused tests until green and commit only ambient machinery/tests/fixture data.

### Task 3: `ScenePlayer.swap(sceneId)`

**Files:**

- Modify: `src/lib/scenes/scene-player.ts`
- Modify: `src/lib/scenes/scene-controller.ts`
- Modify: `src/pages/test-fixtures/scene-player.astro`
- Modify: `tests/e2e/scene-player.spec.ts`

**Interfaces:**

- Consumes: a definition registry supplied through `ScenePlayerOptions.definitions` and the existing snapshot/theme lifecycle.
- Produces: `ScenePlayer.swap(sceneId): void`, preserving the player object while fully tearing down and rebuilding the selected scene runtime.

- [x] Write failing browser tests for unknown IDs, repeated swap cycles, playback-time swap, listener/control/style/timeline cleanup, retained once/play semantics, restart-on-enter semantics, and reduced motion.
- [x] Run focused tests and confirm failures are due to the missing API.
- [x] Refactor setup/teardown into reusable lifecycle methods and implement registry-backed swap reinitialization.
- [x] Run focused tests until green and commit only swap machinery/tests/fixture data.

### Task 4: Consumer contract and release gates

**Files:**

- Modify: `docs/HANDOFF-A05.md`
- Add: `docs/superpowers/plans/2026-07-10-amend-capabilities.md`

**Interfaces:**

- Documents all three public signatures, invariants, failure modes, and consumer prohibitions.

- [x] Replace future-tense handoff language with exact shipped API contracts and failure behavior.
- [x] Run Prettier/lint on documentation and commit the plan plus handoff as the single docs commit.
- [x] Run `pnpm check`, `pnpm test:e2e` twice, eager-JS measurement against `main`, production-output comparison, and final leak-grep/status review.

# Scene Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all eight findings in the A-05–A-07 independent review while
preserving static-first rendering, one GSAP timeline per player, the 90KB eager
JavaScript budget, and the public privacy firewall.

**Architecture:** Tighten the pure validator first. Then make `ScenePlayer`
reconstruct DOM deterministically by resetting to its captured SSR/initial
state before replaying to an arbitrary time, and add honest lifecycle/entry
semantics. Finally place a shared motion channel above controllers, coalesce
ScrollTrigger crossings into one destination activation, record skipped stages
as pure resolved states, and make installer discovery inclusive. Publication
and browser-matrix changes remain isolated from runtime changes.

**Tech Stack:** Astro 7, TypeScript 5.9 strict mode, GSAP 3.15 +
ScrollTrigger, Vitest 4, Playwright 1.58, Starlight sitemap.

## Global Constraints

- Work only on `a05-scenes`; do not touch the live preview worktree or port 4321.
- Every production behavior change starts with a failing unit or Playwright
  test and an observed expected failure.
- One active motion channel page-wide; skipped desktop stages resolve without
  constructing or starting their timelines.
- Reduced motion instantiates no GSAP timeline or ScrollTrigger and retains
  resolved SSR state.
- Keep the eager `/` JavaScript closure including GSAP ≤90KB gzip.
- Leak-grep every staged commit for private names, projects, emails, keys, IDs,
  and absolute personal paths.
- Preserve the six pre-existing untracked `variants/**/shoot.mjs` files.

---

### Task 1: Cross-field scene validation (finding 4)

**Files:**

- Modify: `tests/unit/scene-validator.test.ts`
- Modify: `src/lib/scenes/scene-validator.ts`

**Interfaces:**

- Consumes: `SceneDefinition`, `SceneTargetDefinition`, and the existing exact
  error convention `Scene "<id>": <message>`.
- Produces: `validateSceneDefinition()` rejecting target/action mismatches,
  missing state origins, mismatched embedded targets, ambiguous placements,
  and resolved checkpoints before the final beat completes.

- [ ] Add one exact-error test for each rejected shape from review finding 4:
      state target without `initialState`, `type-text` on a state target, embedded
      `enter` target mismatch, both `before` and `after`, a missing placement
      anchor, and `resolved` before the last beat completion.
- [ ] Run
      `pnpm vitest run tests/unit/scene-validator.test.ts` and verify all new tests
      fail because the invalid definitions currently validate.
- [ ] Add an action/target compatibility map and cross-field validators. State
      transitions must start from the declared current state; embedded content
      targets must equal `beat.target`; placement is optional but mutually
      exclusive and any anchor must be declared; `initial` is 0 and no checkpoint
      may extend past `resolved`; `resolved.at` must be at least the maximum
      `beat.at + duration`.
- [ ] Re-run the validator unit file, then all unit tests, and verify green.
- [ ] Stage only validator/test files, leak-grep, and commit
      `fix: enforce scene definition invariants`.

---

### Task 2: Deterministic player time and typing cadence (findings 2 and 5)

**Files:**

- Create: `src/lib/scenes/scene-typing.ts`
- Create: `tests/unit/scene-typing.test.ts`
- Modify: `src/lib/scenes/scene-player.ts`
- Modify: `src/lib/scenes/scene-dom.ts`
- Modify: `src/lib/scenes/types.ts`
- Modify: `src/scenes/landing/delegation.scene.ts`
- Modify: `src/pages/test-fixtures/scene-player.astro`
- Modify: `tests/e2e/scene-player.spec.ts`

**Interfaces:**

- Produces: deterministic `typingBoundaries(text)` with repeatable
  per-character jitter and punctuation hesitation; playback
  `startDelayMs?: number`; `ScenePlayer.seek(ms)` that reconstructs from the
  captured SSR/semantic initial state before rendering the requested time.

- [ ] Unit-test that typing boundaries are deterministic, normalized to 1,
      contain multiple letter cadences, and give punctuation a longer interval
      than normal letters. Run the focused unit test and observe the missing-module
      failure.
- [ ] Extend the player fixture with `enter`, `exit`, `set-state`, and
      `highlight` targets plus resolved SSR attributes. Add Playwright assertions
      for forward seek followed by backward seek to 0, checking exact text,
      `hidden`, `data-state`, `data-active`, checkpoint, and theme restoration.
      Run the focused Playwright test and observe stale forward mutations.
- [ ] Add a hero test asserting the resolved composer remains unchanged and
      scene time stays 0 during the initial delay, then typing begins after about
      1200ms. Run it and observe immediate playback.
- [ ] Extract deterministic typing weights. Add `startDelayMs: 1200` to the
      delegation playback policy and validate it as a non-negative integer.
- [ ] Rework player seek/render so it pauses at 0 with callbacks suppressed,
      restores captured root and page theme state, primes declared initial
      state/entering targets, invalidates the timeline, then advances forward to
      the requested time. A seek must preserve whether playback was active.
- [ ] Add lifecycle-safe initial-delay scheduling that can be paused by
      visibility/offscreen/user reasons and is cancelled on destroy. Keep beat
      offsets and the 1900ms typing duration unchanged.
- [ ] Run focused unit/e2e tests and then the full unit suite.
- [ ] Stage only player/typing/fixture/test files, leak-grep, and commit
      `fix: make scene playback deterministic`.

---

### Task 3: Entry policy and honest completion lifecycle (finding 6)

**Files:**

- Modify: `src/lib/scenes/scene-player.ts`
- Modify: `src/lib/scenes/scene-controller.ts`
- Modify: `src/pages/test-fixtures/scene-controller.astro`
- Modify: `tests/e2e/scene-player.spec.ts`
- Modify: `tests/e2e/scene-controller.spec.ts`

**Interfaces:**

- Produces: `ScenePlayer.status`, `ScenePlayer.isCompleted`, and
  `ScenePlayer.onStatusChange(listener)`; once timelines report `completed`;
  controller re-entry honors `play` versus `restart-on-enter` consistently.

- [ ] Add Playwright tests that a once scene reaches `completed`,
      `isPlaying === false`, and emits a completed lifecycle status.
- [ ] Add a mobile revisit test that pauses near the end, leaves the stage,
      revisits it, and proves `restart-on-enter` starts near 0 rather than resuming.
- [ ] Run focused tests and observe the current false `playing` state and
      resumed time.
- [ ] Track player status explicitly, extend once timelines through the
      resolved checkpoint, notify status listeners only on changes, and preserve
      composed pause reasons.
- [ ] Add a re-entry operation that resets for `restart-on-enter` while
      preserving user/visibility/offscreen reasons; let `play` resume retained
      state.
- [ ] Re-run focused tests and full scene tests.
- [ ] Stage only lifecycle/controller tests and implementation, leak-grep, and
      commit `fix: honor scene entry and completion`.

---

### Task 4: Global motion ownership, inclusive discovery, and skip resolution

(findings 1 and 3)

**Files:**

- Create: `src/lib/scenes/scene-motion-channel.ts`
- Modify: `src/lib/scenes/install-scene-system.ts`
- Modify: `src/lib/scenes/scene-controller.ts`
- Modify: `src/pages/test-fixtures/scene-controller.astro`
- Modify: `tests/e2e/scene-controller.spec.ts`

**Interfaces:**

- Produces: one shared `SceneMotionChannel` passed to every installed
  controller; inclusive discovery of top-level controller roots and standalone
  windows outside them; `SceneController.forceResolve(sceneId)` and
  `getSceneState(sceneId)`; frame-coalesced desktop destination activation.

- [ ] Add a fixture mode with two controller roots and one standalone window.
      Test that all three are discovered, exactly one player is running across the
      document, activating another root transfers ownership, and pagehide cleans
      every root.
- [ ] Add instantaneous first→last and last→first desktop jump tests. Assert
      the shared-window activation count increases once per jump, only the
      destination plays, every crossed stage is marked `resolved`, and
      `getSceneState()` deep-equals the pure reducer's resolved state.
- [ ] Run focused tests and observe exclusive discovery, multiple channels,
      and four activations per jump.
- [ ] Implement the shared arbiter. Controllers construct players without an
      uncontrolled autoplay window, claim/release the page channel on activation
      and destroy, and no longer enforce ownership only through a private set.
- [ ] Discover both controller roots and standalone roots not contained by a
      controller, sharing one channel and one definitions map.
- [ ] Queue desktop ScrollTrigger callbacks to one animation-frame destination.
      Resolve indices strictly between current and destination using the pure
      reducer without constructing players, mark their stage checkpoints, then
      activate only the destination. Cancel pending frames on rebuild/destroy.
- [ ] Re-run focused tests, all scene tests, and breakpoint tests.
- [ ] Stage only orchestration/channel/fixture/test files, leak-grep, and commit
      `fix: coordinate scene motion page-wide`.

---

### Task 5: Fixture publication and browser matrix (findings 7 and 8)

**Files:**

- Modify: `astro.config.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `playwright.config.ts`
- Create: `tests/e2e/scene-controller.cross-browser.spec.ts`
- Modify: `tests/e2e/marketing-shell.spec.ts` or add a focused sitemap test

**Interfaces:**

- Produces: sitemap filter excluding `/test-fixtures/**`; Chromium full suite;
  Firefox and WebKit controller smoke projects.

- [ ] Add a browser assertion that the built sitemap contains neither fixture
      URL. Run it and observe both URLs in `sitemap-0.xml`.
- [ ] Add cross-browser controller smoke tests for desktop pin/activation,
      mobile normal-flow viewport activation, and reduced-motion zero timelines.
      Run the new projects to establish current behavior/baseline.
- [ ] Add exact `@astrojs/sitemap` dependency and register it before Starlight
      with `filter: (page) => !new URL(page).pathname.startsWith("/test-fixtures/")`
      so Starlight does not inject its unfiltered integration.
- [ ] Add Firefox/WebKit Playwright projects scoped to the cross-browser smoke
      file; keep Chromium running the complete suite.
- [ ] Build and assert sitemap output; run all three browser projects.
- [ ] Stage only config/dependency/browser tests, leak-grep, and commit
      `test: cover scene orchestration across browsers`.

---

### Task 6: Correct handoff and final gates

**Files:**

- Modify: `docs/HANDOFF-A05.md`

**Interfaces:**

- Documents the now-shipped inclusive discovery, page-wide channel,
  deterministic seek/force-resolution, honest lifecycle status, entry policy,
  and initial-delay behavior without claiming future amendment APIs exist.

- [ ] Update the handoff sections contradicted by findings 1–6. Remove the
      advice that A-08 must fix controller ownership. Document skipped-stage state
      APIs, status subscription, and that future navigation can reuse the shipped
      destination/skip mechanism.
- [ ] Run Prettier and `git diff --check`, stage only the handoff, leak-grep,
      and commit `docs: update corrected scene runtime contract`.
- [ ] Run `pnpm check` and `pnpm test:e2e` to completion and preserve their
      verbatim tails.
- [ ] Build production, grep for debug artifacts, and measure the unique eager
      `/` JavaScript closure with deterministic `gzip -n -9`; verify ≤90KB.
- [ ] Run `git diff --check main...HEAD`, final branch leak-grep, and report all
      eight finding statuses keyed to the review numbering.

## Self-review

- Findings 1–8 each map to a task above; HIGH and MEDIUM findings have direct
  red/green tests, and LOW cross-browser coverage is included rather than
  deferred.
- Every new runtime API is introduced by a failing behavior test and documented
  in Task 6.
- Future `navigateToStage`, ambient scheduling, and `swap` are not implemented;
  this plan ships only the prerequisite skip ledger, lifecycle signal, and
  page-wide ownership boundary approved by the current scope.

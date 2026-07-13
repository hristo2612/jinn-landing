# Pinned Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the four remaining dashboard surfaces, four scripted scenes, and desktop/mobile showcase stages for A-08 through A-11.

**Architecture:** Keep the existing four-layer scene architecture intact: canonical semantic data feeds pure Astro surfaces; scene definitions describe the storyboard; the existing player and controller own animation and activation. The hero remains a standalone `delegation` scene, while sections 2–5 use one desktop shared window and four stage-local mobile windows through the documented declarative hooks.

**Tech Stack:** Astro 7, strict TypeScript, GSAP/ScrollTrigger through the existing scene runtime, Vitest, Playwright, Ledger CSS tokens, Lucide-derived shared SVG symbols.

## Global Constraints

- Do not modify `src/lib/scenes/*.ts` scene machinery except `dashboard.ts` canonical data and `install-scene-system.ts` registration.
- Render resolved truth in SSR; reduced motion and no-JS instantiate no timelines and expose every completed stage proof.
- Keep every timeline target mounted and scoped to its own `data-scene-window`.
- Desktop pins one shared window through sections 2–5; mobile below 900px stacks pane-only windows in document flow.
- Workflow approval ends parked: rail stops at the gate, step 4 stays queued, and the badge stays `Running`.
- Preserve future ribbon-navigation, ambient, and workflow-switcher seams without implementing those capabilities.
- Use copy from `docs/STORYBOARD.md` §6 verbatim and note real-app source paths in each surface file header.
- Commit exactly once per task: A-08, A-09, A-10, and A-11; leak-grep before every commit.

---

### Task 1: A-08 faithful dashboard surfaces

**Files:**

- Modify: `src/lib/scenes/types.ts`
- Modify: `src/lib/scenes/dashboard.ts`
- Modify: `src/components/scenes/SceneIconSprite.astro`
- Modify: `src/components/marketing/Hero.astro`
- Create: `src/components/scenes/surfaces/OrgSurface.astro`
- Create: `src/components/scenes/surfaces/TodosSurface.astro`
- Create: `src/components/scenes/surfaces/WorkflowSurface.astro`
- Create: `src/components/scenes/surfaces/TriggersSurface.astro`
- Modify: `tests/e2e/hero.spec.ts`
- Create: `scripts/shoot-a08.ts`
- Create: `docs/screens/a08/*.png`

**Interfaces:**

- Consumes: the existing `SceneWindow` named slots and `data-target="pane-<key>"` contract.
- Produces: `ORG_PANE`, `TODOS_PANE`, `WORKFLOW_PANE`, and `TRIGGERS_PANE` canonical objects plus stable targets such as `node-coo`, `card-142`, `step-gate`, and `binding-cron`.

- [ ] Write Playwright assertions that every pane's DOM equals canonical data, the four slots exist in the hero window, and decorative chrome contains no focusable controls.
- [ ] Run `pnpm exec playwright test tests/e2e/hero.spec.ts --project=chromium` and confirm failure because the four surfaces/data exports do not exist.
- [ ] Add semantic pane types/data, Lucide-derived symbols, and pure surface components whose visual variants come only from `data-state` and Ledger tokens.
- [ ] Mount all four surfaces in the hero's existing `SceneWindow`; keep chat active and every other pane mounted.
- [ ] Run the focused browser suite until green, capture deterministic resolved desktop/mobile theme screenshots, then run `pnpm check`.
- [ ] Stage only A-08 files, run the required leak grep, and commit `feat: build faithful dashboard surfaces`.

### Task 2: A-09 employee scene and stage system

**Files:**

- Create: `src/scenes/landing/employees.scene.ts`
- Create: `src/components/marketing/PinnedShowcase.astro`
- Create: `src/components/marketing/ShowcaseStage.astro`
- Modify: `src/components/scenes/SceneWindow.astro`
- Modify: `src/lib/scenes/install-scene-system.ts`
- Modify: `src/pages/index.astro`
- Create: `tests/unit/showcase-scenes.test.ts`
- Create: `tests/e2e/showcase.spec.ts`
- Modify: `scripts/shoot-a08.ts`

**Interfaces:**

- Consumes: `ORG_PANE`, `SceneWindow` pane slots, and existing `SceneController` shared/mobile discovery.
- Produces: registered `employeesScene`, `data-scene-controller`, `data-scene-pin`, one `data-scene-shared-window`, and stage-local `data-scene-mobile-window` roots.

- [ ] Write unit assertions for the exact employee timeline/checkpoints/playback and browser assertions for stage copy, desktop pinning, employee checkpoint state, and mobile stacked activation.
- [ ] Run the focused unit/e2e tests and confirm failure because `employeesScene` and the showcase markup are missing.
- [ ] Author the scene definition with the exact targets, 0–2700ms timeline, and `restart-on-enter` policy; register it centrally.
- [ ] Build the four stage shells with verbatim head copy, a 520vh desktop controller, and normal-flow mobile windows; initially only employees is registered/active while later task tests remain excluded.
- [ ] Verify reverse reactivation starts employees from initial and fast-scroll uses the existing controller force-resolution path.
- [ ] Capture `employees.initial`, `employees.seated`, and `employees.resolved`, run gates, leak-grep, and commit `feat: add employee showcase scene`.

### Task 3: A-10 todo and workflow-approval scenes

**Files:**

- Create: `src/scenes/landing/todos.scene.ts`
- Create: `src/scenes/landing/workflow-approval.scene.ts`
- Modify: `src/lib/scenes/install-scene-system.ts`
- Modify: `tests/unit/showcase-scenes.test.ts`
- Modify: `tests/e2e/showcase.spec.ts`
- Modify: `scripts/shoot-a08.ts`

**Interfaces:**

- Consumes: stable todo/workflow targets from A-08 and the stage roots from A-09.
- Produces: registered `todosScene` and `workflowApprovalScene` with canonical checkpoint state.

- [ ] Add unit tests for exact storyboard beat sequences and reducer end states, including #142 `done` and workflow `parked` semantics.
- [ ] Add browser tests for ledger/completing/resolved checkpoints and the workflow honest-state law at and after `parked`.
- [ ] Run focused tests and confirm failure because the new definitions are missing/unregistered.
- [ ] Author both definitions using only existing verbs; use `replace-text` on stable text nodes and `set-state`/`set-progress` on semantic hosts.
- [ ] Register both scenes and verify desktop forward/reverse activation, mobile entry, reduced-motion resolved truth, and no-JS resolved truth.
- [ ] Capture `todos.ledger`, `todos.resolved`, `workflow.advancing`, and `workflow.parked`; run gates, leak-grep, and commit `feat: add todo and workflow showcase scenes`.

### Task 4: A-11 trigger scene and completed four-stage showcase

**Files:**

- Create: `src/scenes/landing/trigger-fire.scene.ts`
- Modify: `src/lib/scenes/install-scene-system.ts`
- Modify: `tests/unit/showcase-scenes.test.ts`
- Modify: `tests/e2e/showcase.spec.ts`
- Modify: `scripts/shoot-a08.ts`
- Create: `scripts/report-eager-js.ts`

**Interfaces:**

- Consumes: `TRIGGERS_PANE`, the final trigger stage, and the existing shared controller.
- Produces: registered `triggerFireScene`, complete activation order `employees → todos → workflow-approval → trigger-fire`, and deterministic evidence/reporting scripts.

- [ ] Add failing exact-timeline/reducer/browser assertions for `initial`, `fired`, and `resolved`, including one bounded pulse and run #142 creation.
- [ ] Implement/register the trigger scene and confirm the final pin release returns the page to normal flow.
- [ ] Extend browser coverage for both-direction activation, fast skip, all mobile windows, reduced motion, no-JS, and the workflow forbidden-state law after navigating away/back.
- [ ] Capture the four best named checkpoint screenshots in both required viewport families and both themes.
- [ ] Build and gzip the landing's eager JavaScript entry graph; fail if it exceeds 90KB.
- [ ] Run `pnpm check` and `pnpm test:e2e`, record verbatim output tails, run the final range leak audit, and commit `feat: complete trigger showcase scene`.

## Self-Review

- Spec coverage: A-08 surfaces/data/focus/screens, A-09 employees/stage system, A-10 todo+workflow/honest-state, and A-11 trigger/full activation/performance all map to one task.
- Placeholder scan: no implementation placeholder or deferred capability is included; amendment capabilities are explicitly out of scope.
- Type consistency: surface keys use `chat | org | todos | flows | triggers`; scene IDs use `employees | todos | workflow-approval | trigger-fire`; pane targets preserve `pane-flows` while the workflow surface's internal targets retain `flow-*`/`step-*` names.

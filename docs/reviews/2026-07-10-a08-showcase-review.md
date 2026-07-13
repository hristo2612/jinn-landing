# A-08–A-11 Pinned Showcase Code Review

- **Date:** 2026-07-10
- **Branch:** `a08-showcase`
- **Reviewed range:** `main...a08-showcase`
- **Implementation commits:** `333c96a`, `659aa92`, `0308b26`, `bc43312`,
  `f3d591b`
- **Verdict:** **BLOCK**
- **Findings:** 2 high · 4 medium · 2 low

The four dashboard surfaces are visually convincing, their claimed real-app
references exist, the desktop/mobile shell is coherent, and the normal
workflow ending does not falsely approve the gate or complete the post step.
The shared motion channel also survived targeted ownership churn, breakpoint,
and teardown probes without concurrent playback or unbounded history.

The branch is not shippable yet. The workflow rail's visual state and semantic
DOM disagree at resolution, three scenes replay despite explicit retain
policies, and force-resolved skipped state is recorded but never consumed by
later activation. The 390px Org proof also clips its executive card. Green
suites do not cover those production failures.

## Required remediation before merge

1. Make `set-progress` commit the semantic `data-progress` value under the
   same beat-ordering rule as the reducer and visual custom property. Add exact
   initial, intermediate, resolved, reverse-seek, and teardown equality tests.
2. Author Todos, Workflow, and Triggers with retained once-scene entry
   semantics. Consume a skipped stage's recorded resolved state when that
   stage is later reached, while preserving Employees' explicit
   reverse-scroll replay policy.
3. Prevent fixed-height mobile Org content from flex-shrinking the executive
   node below its content height. Add overflow assertions at 390×844, not only
   visibility assertions for the outer window.
4. Replace hard-coded narrative state inside reusable surface chrome with
   canonical semantic data, then compare exact serialized DOM for the desktop
   shared root and every mobile scene root, including exact row/card counts.
5. Add direct `SceneMotionChannel` regression tests for LIFO restoration,
   inactive release, composed pause reasons, rapid claim/release cycles,
   breakpoint rebuilds, overlapping mobile stages, and pagehide cleanup.
6. Restore the storyboard's nested Org-node and Workflow-step staggers, and
   make the beat-fidelity tests assert those details rather than only the
   parent target/action tuple.

## Findings

### 1. HIGH — Workflow resolution leaves semantic progress at 1/3 while the visual rail reaches 2/3

- **Location:** `src/lib/scenes/scene-player.ts:427-436`,
  `src/lib/scenes/scene-player.ts:606-615`,
  `src/lib/scenes/scene-reducer.ts:153-158`,
  `tests/e2e/pinned-showcase.spec.ts:81-112`,
  `tests/e2e/dashboard-surfaces.spec.ts:90-126`
- **Contract:** the reviewed A-05 standard is
  `DOM(t) === reducer(definition, t)`, including semantic attributes. The
  Workflow scene must end parked exactly at 2/3 progress.

`primeInitialDom()` writes both representations of progress:
`data-progress="0.333…"` and `--scene-progress: 0.333…`. The compiled
`set-progress` beat updates only the CSS custom property. The pure reducer,
meanwhile, correctly resolves `progress.rail` to `2/3`.

A production-page probe after the normal 4100ms completion returned:

```json
{
  "dataProgress": "0.3333333333333333",
  "cssProgress": "0.666667",
  "gate": "awaiting-approval",
  "post": "queued",
  "badge": "Running"
}
```

This is not a formatting discrepancy: the rendered semantic DOM continues to
claim the initial state after the scene reports `completed`. The browser test
asserts only the CSS value, while the surface-data test runs reduced motion
against the SSR-resolved markup. Neither crosses the animated player boundary,
so both pass.

The player needs one commit rule for the semantic attribute and visual value,
and browser equality must compare both representations with the reducer at
initial, mid-beat, resolved, reverse-seek, and restored states.

### 2. HIGH — Three scenes violate retain-once playback, and skipped resolved state is never applied

- **Location:** `src/scenes/landing/todos.scene.ts:41`,
  `src/scenes/landing/workflow-approval.scene.ts:50`,
  `src/scenes/landing/trigger-fire.scene.ts:34`,
  `src/lib/scenes/scene-controller.ts:97-117`,
  `src/lib/scenes/scene-controller.ts:120-165`,
  `src/lib/scenes/scene-controller.ts:375-398`,
  `tests/e2e/pinned-showcase.spec.ts:47-79`,
  `tests/e2e/scene-controller.spec.ts:60-143`
- **Contract:** STORYBOARD §§3.3–3.5 says Todos retains resolved, Workflow
  retains parked, and Triggers retains resolved. Only Employees explicitly
  replays from initial when reverse scroll reactivates it. Fast-skipped stages
  must be force-resolved and consumed without playing intermediate timelines.

All four new definitions declare `entry: "restart-on-enter"`. That is correct
for Employees and incorrect for the other three. A normally completed Workflow
scene was moved to Triggers and then re-entered in reverse. The production DOM
changed from:

```json
{ "time": "4100", "state": "completed", "gate": "awaiting-approval" }
```

to:

```json
{
  "time": "99",
  "state": "playing",
  "gate": "queued",
  "progress": "0.3333333333333333"
}
```

The fast-skip path has a second half of the same defect. `forceResolve()` puts
the pure resolved state into `resolvedStates`, and the fixture proves that
`getSceneState()` can read it. No activation path reads that map. A skipped
Workflow stage therefore also begins at its authored initial state when the
visitor reverses into it, despite already carrying a resolved checkpoint and
resolve count.

The current tests verify activation counts, checkpoint markers, and the
out-of-band map. They do not assert the shared/mobile DOM on later entry. Fixing
only the three definition flags will not fix never-instantiated skipped scenes;
controller activation must deliberately consume the recorded state too.

### 3. MEDIUM — The 390px Org surface flex-shrinks and visibly clips the executive identity

- **Location:** `src/components/scenes/surfaces/OrgSurface.astro:98-119`,
  `src/components/scenes/surfaces/OrgSurface.astro:312-361`,
  `tests/e2e/pinned-showcase.spec.ts:114-128`
- **Contract:** STORYBOARD §5 requires stacked, full-width mobile departments
  and nodes, with every scene's proof surviving the mobile cut.

The mobile chart has a fixed available height, `overflow: hidden`, and children
that may shrink. The executive node declares `height: 62px` but no non-shrink
constraint. At 390×844 its measured box is only `23.2px` high while its
identity content is `34.0px` high; `scrollHeight=29` exceeds `clientHeight=23`.
The name and role extend outside the node and are clipped by its overflow.

The committed 390px screenshot shows the same defect. The mobile E2E checks
only that the scene window is visible and its ribbon/sidebar are hidden, so it
cannot detect content clipping or lost proof inside the window.

### 4. MEDIUM — The canonical-data and exact-DOM gate remains partial and breaks the future workflow-swap seam

- **Location:** `src/components/scenes/surfaces/WorkflowSurface.astro:31-99`,
  `src/components/scenes/surfaces/TodosSurface.astro:80-90`,
  `tests/e2e/dashboard-surfaces.spec.ts:20-170`,
  `tests/unit/showcase-scenes.test.ts:1-152`
- **Contract:** HANDOFF-A05 §6/§9 requires canonical semantic data, no
  Morning-specific copy baked into reusable workflow chrome, exact per-root
  targets, and exact assertions. STORYBOARD-AMENDMENT-1 keeps the later
  Morning/backup swap additive rather than a surface rewrite.

The surface test always selects the first page-wide scene window. It checks
known fields one by one, skips absent optional fields, and never asserts exact
employee/department/card/step/binding counts. Extra DOM passes. It does not
serialize the desktop showcase root or any of the four duplicated mobile
roots. The scene unit tests use `toMatchObject`, so extra or divergent semantic
state also passes.

The implementation is not entirely canonical-data-driven. Workflow hard-codes
the animated initial strings `Writing summary…` and `Queued` inside markup,
while its exported pane object represents the resolved narrative. Todos also
hard-codes its animated execution-line initial. That split is why one test can
certify SSR-resolved data while the player produces a different semantic DOM,
and it bakes the current narrative into the render component the approved
workflow switcher must reuse.

Canonical data should model both authored initial and resolved semantic
states. The gate should deeply compare those objects with exact DOM
serialization for each unique root and reject unexpected rows, targets,
attributes, and fields.

### 5. MEDIUM — The authorized claimant-stack change has no direct stack-level regression gate

- **Location:** `src/lib/scenes/scene-motion-channel.ts:4-30`,
  `src/lib/scenes/scene-controller.ts:200-225`,
  `src/lib/scenes/scene-controller.ts:270-369`,
  `tests/e2e/scene-system.spec.ts:51-83`
- **Contract:** the authorized machinery change must restore the right prior
  owner under direction flips, resize, mobile viewport churn, and teardown,
  while preserving independent pause reasons and bounded ownership history.

The implementation itself is defensible under source audit:

- claims are de-duplicated before moving a player to the top;
- releasing an inactive claimant removes it without disturbing the owner;
- releasing the active claimant restores the most recent remaining claimant;
- only the `controller` pause reason is removed from the promoted player;
- controller destruction releases every retained player; and
- mobile visibility is accumulated across observer callback batches before
  the highest-ratio stage is selected.

Targeted probes agreed. An `A → B → C`, release-`B`, release-`C` sequence
restored `A`; 10,000 `B` claim/release cycles left history length `1`, not a
growing stack. Rapid desktop/mobile scroll churn never observed more than one
playing scene. Breakpoint changes created no duplicate active player, and
pagehide left zero scene timelines.

The committed regression test proves only the reported user path: scroll hero
→ first showcase stage → top, then observe hero playing. It does not exercise
the stack as a stack, inactive release, pause-reason composition, resize while
multiple claims exist, two mobile stages visible at once, or history bounds.
It can pass through the root-visibility reclaim path without proving the LIFO
behavior introduced by `bc43312`. No existing test was weakened, but this
high-risk shared mechanism needs a direct unit contract plus the lifecycle
matrix above.

### 6. MEDIUM — Two storyboard entrance gestures are flattened while tests call the timelines verbatim

- **Location:** `src/scenes/landing/employees.scene.ts:69-91`,
  `src/scenes/landing/workflow-approval.scene.ts:52-84`,
  `tests/unit/showcase-scenes.test.ts:9-43`,
  `tests/unit/showcase-scenes.test.ts:76-116`
- **Contract:** STORYBOARD §3 specifies the beat detail, not only parent beat
  offsets: Platform employees stagger by 80ms, Growth employees by 60ms, and
  Workflow step cards enter left-to-right with a 90ms stagger after the chip.

Employees enters each whole department as one target/tween, so its child nodes
have no 80ms/60ms stagger. Workflow enters the trigger at 500ms and the entire
rail host at 590ms, causing all four cards to arrive as one block rather than
left-to-right at 90ms intervals.

The high-level offsets, durations, parent targets, state transitions, and
checkpoints otherwise match the tables. The unit test's “verbatim” assertion
maps each beat down to `[at, duration, target, action.type]`; it cannot express
or reject the missing nested timing details.

### 7. LOW — A-11's checkpoint and eager-JS evidence is present but not reproducible as labeled

- **Location:** `scripts/shoot-a11.ts:1-45`,
  `docs/reports/a11-eager-js.md:1-16`, `docs/screens/a11/`
- **Contract:** A-11 requires deterministic resolved checkpoint evidence and
  verification of the exact 62,839-byte eager-JS claim.

All eight A-11 screenshots exist, but the capture script forces
`reducedMotion: "reduce"` at both widths and always screenshots
`.showcase__mobile`. The file labeled `1440` is therefore the reduced-motion
stacked fallback, not the pinned desktop shared window after real scene
activation. The image is useful static-state evidence but not evidence for the
desktop pin/checkpoint path.

The bundle remains comfortably within budget. A production request trace
identified the expected page, scene, GSAP, and ScrollTrigger closure, and a
deterministic `gzip -n -9` sum measured **62,378 bytes**. The committed report
claims **62,839 bytes**, 461 bytes higher. That is plausibly gzip header/tool
variance and does not threaten the 90KiB ceiling, but there is no committed
report script, input manifest, or command to reproduce either exact total.

### 8. LOW — Workflow progress animates layout dimensions in the pinned range

- **Location:** `src/lib/scenes/scene-player.ts:427-436`,
  `src/components/scenes/surfaces/WorkflowSurface.astro:229-238`,
  `src/components/scenes/surfaces/WorkflowSurface.astro:384-404`
- **Contract:** TECH-PLAN §6 prefers transform/opacity-first animation and no
  main-thread task above 50ms during the showcase.

The 400ms progress tween animates a CSS custom property consumed by `width` on
desktop and `height` on mobile. That requires layout/paint on each frame rather
than a compositor-only scale. The affected rail is small, and no visible jank
was observed in this review, so this is a low-risk performance debt rather
than a measured budget failure. It should be converted to a fixed-size fill
with transform-origin plus scale before the final trace gate.

## Surface fidelity audit

Every source path named in the surface headers exists in the Jinn app:

| Surface  | Claimed references                                               | Review result                                                                                                                                        |
| -------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Org      | `components/org/employee-node.tsx`, `components/org/org-map.tsx` | Plausible mirror of executive stripe, employee identity, engine pills, presence, department tone, and connectors. Mobile clipping remains finding 3. |
| Todos    | `routes/todos/card.tsx`, `state-glyph.tsx`, `active-view.tsx`    | Plausible card/status-disc, owner, execution, cost, and blocked/done treatments. Narrative initial copy is split from canonical data.                |
| Workflow | `routes/workflow/node-card.tsx`, `run-view.tsx`                  | Plausible trigger, running badge, step cards, status icons, and rail. Semantic progress and reusable-data seams remain findings 1 and 4.             |
| Triggers | `routes/workflow/edit.tsx`, `routes/cron/page.tsx`               | Plausible compact binding rows, type labels, fired status, and resulting run row.                                                                    |

Additional surface checks:

- Ledger tokens are used consistently; cards rely on material fill/shadow
  rather than decorative one-pixel hairline borders.
- Connector and rail lines communicate topology and are not card decoration.
- The frame contains no links, buttons, form fields, or `[tabindex]` fake
  controls. The committed test proves zero focusable controls in the canonical
  window.
- The copy deck, status colors, icons, headers, and transcript captions match
  the storyboard apart from the timing/data issues above.

## Scene and honest-state audit

| Scene               | Beat/checkpoint result                                                                                                                          | Playback result                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `employees`         | Parent beat offsets, durations, targets, presence transitions, and checkpoints match. Child node staggers are missing.                          | Correct: replays from initial on reverse reactivation. |
| `todos`             | Four card entrances use the required 110ms offsets; completing disc, execution copy, final card state, and checkpoints match.                   | Incorrect: restarts instead of retaining resolved.     |
| `workflow-approval` | Parent offsets, two bounded gate pulses, state/text changes, and checkpoints match. Step-card stagger is missing; semantic rail state diverges. | Incorrect: restarts instead of retaining parked.       |
| `trigger-fire`      | Three row entrances use the required 120ms offsets; pulse, fired transition, resulting run, and checkpoints match.                              | Incorrect: restarts instead of retaining resolved.     |

No authored action targets `step-post` or changes `run-badge`. A normal browser
completion leaves the gate `awaiting-approval`, post `queued`, badge `Running`,
and visual rail at 2/3. Forward completion, reverse replay, and fast-skip probes
found no path that approves the gate, runs/completes step 4, or advances the
visual rail beyond the gate. The honest-state browser test should still add
explicit seek-past-end, skipped-stage, and reverse-away/back cases; its current
normal-completion path alone did not catch findings 1 or 2.

## Pin, lifecycle, and machinery audit

- Four stages at `130vh` produce the requested ~`520vh` pinned range.
- Desktop uses one shared window, native scrolling, one pin trigger, and four
  stage triggers. Activation is discrete in both directions.
- Per-frame destination coalescing activates only the final fast-scroll stage;
  skipped timelines are not constructed. Recorded-state consumption remains
  broken as described in finding 2.
- Mobile below 900px has no pin and uses four normal-flow pane-only windows.
  The ribbon and sidebar are visually cut while target DOM remains mounted.
- Breakpoint rebuilds kill old bindings, preserve the active scene/time where
  applicable, and reject stale async desktop binding work. Existing E2E and
  targeted resize probes found no duplicate playing timeline.
- Offscreen, visibility, controller, and user pause reasons compose in
  `ScenePlayer`; the claimant stack removes only the controller reason when
  restoring a prior owner.
- `pagehide` destroys controller and standalone players, timelines, observers,
  controls, and runtime attributes. Production probes ended with zero retained
  timelines.

## Build, performance, and hygiene audit

- `pnpm check` passes: token contract, Astro/type checking, lint/format, 7 unit
  files / 39 tests, production build, 131-file public safety scan, and 19-link
  crawl.
- `pnpm test:e2e` passes twice: **60/60** on run 1 and **60/60** on run 2,
  including Chromium plus the configured WebKit/Firefox scene smokes.
- The desktop production page eagerly requests ScrollTrigger because the
  showcase controller starts at desktop load. That strategy is reasonable for
  immediate pin measurement and remains below budget.
- No unthrottled `scroll` handler was added. Scroll work is delegated to
  ScrollTrigger; mobile selection uses IntersectionObserver.
- Production output contains no scene debug overlay marker/copy/module. The
  only broad `DEBUG` literal is third-party Pagefind code, not the scene
  overlay.
- Generated sitemap remains exactly `/` and `/docs/`; fixture routes are
  noindexed, unlinked, and excluded from the sitemap/link gates.
- All A-08 and A-11 screenshots are present. The A-08 set covers four surfaces
  at 1440/390 in both themes; A-11's reduced fallback limitation is finding 7.
- `git diff --check` is clean. The five implementation commits are
  understandable and the authorized machinery change is isolated in
  `bc43312`. No existing test was weakened to accommodate it.
- The amendment's ribbon buttons, ambient scheduling, Workflow switcher,
  backup run, and branding changes did not leak into production source. The
  existing decorative ribbon and internal destination primitive remain inert.
- Pre-existing untracked `variants/*/shoot.mjs` files were excluded from the
  review and review commit.

## Amendment readiness

No amendment capability was implemented early, but the seams are not equally
ready:

| Capability         | Readiness and risk                                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ribbon navigation  | The internal destination/coalescing primitive and stable stage/pane identities are viable. It still needs a separate scroll-intent API. Skipped-state consumption must be fixed before a ribbon jump can promise resolved intermediate stages.                                 |
| Ambient scheduling | The page-wide claimant stack and honest completion signal are good foundations. Direct stack behavior needs the tests in finding 5, and immediate pause/resume still needs the already-documented authored beat-boundary yield policy.                                         |
| Workflow switcher  | A stable workflow host and target vocabulary exist, but Morning-specific animated copy is baked into the component and canonical data does not model both initial/resolved variants. The surface needs the data boundary in finding 4 before `swap()` can reinitialize safely. |

The Todos amendment also expects status-driven relocation. The current flat
list is faithful to this storyboard stage but has no explicit status-group
render boundary, so that later work should introduce one without letting a
surface component own timers or ambient state.

## Verification record

| Command/check                       | Result                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm check`                        | Pass: 7 unit files / 39 tests plus token, type, lint, build, public-safety, and link gates     |
| `pnpm test:e2e` run 1               | Pass: 60/60                                                                                    |
| `pnpm test:e2e` run 2               | Pass: 60/60                                                                                    |
| Workflow normal completion probe    | Fail: CSS progress `0.666667`, semantic `data-progress=0.3333333333333333`                     |
| Workflow reverse reactivation probe | Fail: completed parked scene restarts at ~99ms with queued gate and 1/3 progress               |
| Fast-skip consumption probe         | Fail: resolved state is recorded, but reverse activation starts the skipped scene from initial |
| Motion-channel LIFO/bounds probe    | Pass: correct inactive release/restoration; 10,000 cycles leave one claimant                   |
| Rapid ownership churn               | Pass: maximum one playing scene observed                                                       |
| Breakpoint rebuild probe            | Pass: no duplicate active player; active scene retained                                        |
| Mobile multi-stage churn            | Pass: maximum one playing mobile scene observed                                                |
| Pagehide teardown probe             | Pass: zero scene timelines remain                                                              |
| 390px Org overflow measurement      | Fail: 62px executive node shrinks to 23.2px; content height is 34.0px                          |
| Eager `/` gzip                      | Pass: 62,378 deterministic bytes; report's 62,839 remains below 90KiB but lacks a reproducer   |
| Production debug grep               | Pass: no scene debug artifact                                                                  |
| Sitemap/link gates                  | Pass: `/` and `/docs/` only; 19-URL link crawl green                                           |

## Risk read

**Night/morning + sunrise risk: high.** The next narrative batch depends on the
parked Workflow state remaining authoritative until morning resolves it. Today
that state can restart on reverse/skip and its semantic progress is already
wrong at the parked checkpoint. The sunrise also adds a page-level theme beat
to the same lifecycle/ownership machinery; the claimant-stack implementation
looks sound, but its edge matrix is not yet protected by tests.

**Amendment rollout risk: high until findings 1, 2, 4, and 5 close; medium-high
afterward.** Ribbon navigation depends on consumed skip resolution, ambient
motion depends on proven ownership plus beat-boundary yielding, and Workflow
swap depends on a truly semantic reusable render boundary. No forbidden
capability leaked into this batch, so the remaining work is contained rather
than a rollback.

---

## Re-review after remediation

- **Date:** 2026-07-10
- **Reviewed range:** `0a6c485...c59ed11`
- **Remediation commits:** `bd3ad1d`, `45df8fa`, `d324e29`, `5c4a2a7`,
  `ff1730f`, `c2908ec`, `c59ed11`
- **Verdict:** **BLOCK**
- **Remaining findings:** 0 high · 1 medium · 0 low

Seven findings are closed and the eighth is substantially repaired, but its
retained-state guarantee still fails when a completed inactive mobile player
must later be recreated in the desktop shared root. The normal desktop path,
fast-skip hydration, same-root reverse retention, semantic workflow progress,
mobile geometry, canonical surface data, claimant-stack matrix, storyboard
staggers, capture evidence, and transform-only rail all pass.

### Finding closure matrix

| Finding                 | Before                                                                                                         | After                                                                                                                                                                                                                  | Status   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1 — semantic progress   | Visual rail reached 2/3 while `data-progress` remained 1/3.                                                    | `set-progress` now animates the visual custom property and commits `data-progress` at `sceneBeatCommitAt`; forward, midpoint, reverse-seek, resolved, and teardown browser proofs agree with the reducer.              | Closed   |
| 2 — retained/skip state | Todos, Workflow, and Triggers restarted; skipped resolved state was never materialized.                        | All three definitions use `entry: "play"`; shared-root completion and force-skip records hydrate at the resolved checkpoint. Cross-root breakpoint recreation remains incomplete below.                                | **Open** |
| 3 — mobile Org clipping | The 62px executive node flex-shrank to 23.2px at 390px.                                                        | Mobile executive node is non-shrinking with a 62px minimum; inner overflow and identity-height assertions pass.                                                                                                        | Closed   |
| 4 — canonical exact DOM | Initial narrative strings were embedded in surface chrome and only one root received partial field assertions. | Canonical pane data carries initial/resolved values; exact serialized targets, rows, fields, counts, states, and progress match on the desktop shared root and every mobile root. Unit end states use deep equality.   | Closed   |
| 5 — claimant stack      | The claimant stack had no direct LIFO, pause-reason, churn, breakpoint, or overlap regression matrix.          | Unit tests cover LIFO/inactive release, independent pause reasons, and 10,000 cycles; browser tests cover overlap, breakpoint ownership, hero restoration, and pagehide cleanup. No production stack defect was found. | Closed   |
| 6 — nested staggers     | Department children and Workflow steps entered as undifferentiated parent blocks.                              | Platform children use 80ms offsets, Growth children 60ms, and Workflow steps 90ms; exact beat assertions lock every target and offset.                                                                                 | Closed   |
| 7 — evidence            | A-11 captured reduced-motion fallback at 1440 and the eager-JS total had no reproducer.                        | Capture drives real desktop/mobile motion to exact checkpoints and exposed the corrected full-width pin. The committed measurement script reproduces the exact **63,426-byte** manifest.                               | Closed   |
| 8 — rail performance    | Progress animated layout `width`/`height`.                                                                     | The fill has fixed geometry and animates `scaleX`/`scaleY` from the progress custom property. No layout-dimension progress animation remains.                                                                          | Closed   |

### Remaining finding

#### MEDIUM — Completed retained mobile scenes are not recorded before cross-root release

- **Location:** `src/lib/scenes/scene-controller.ts:138-168`,
  `src/lib/scenes/scene-controller.ts:203-260`,
  `src/lib/scenes/scene-controller.ts:372-383`,
  `tests/e2e/scene-controller.spec.ts:127-224`,
  `tests/e2e/scene-controller.spec.ts:267-302`
- **Contract:** a `once` + `entry: "play"` product scene retains its resolved
  state across reactivation and breakpoint rebuilds, including when the player
  must move between a stage-local mobile root and the desktop shared root.

`recordCompletedState()` is called only inside the branch where the outgoing
player and incoming scene share the same root. That records completed desktop
scenes before the shared root is reused. On mobile, switching stages takes the
different-root branch and only releases the outgoing player; its completed
semantic state is not added to `resolvedStates`.

The retained mobile player works while the controller stays mobile because it
can be reused in place. After a breakpoint rebuild, the desktop controller
needs a new player on the shared root. If the scene was not also force-resolved
by a skipped-stage jump, `activate()` finds neither a same-root player nor a
resolved record and starts from initial.

An isolated controller probe reproduced the state loss exactly:

```json
{
  "mobileCompleted": { "state": "completed", "time": "1000" },
  "recordedAfterMobileSwitch": null,
  "desktopReentry": { "state": "playing", "time": "78" }
}
```

The production Todos path reproduces under natural scroll: complete Todos on
mobile, enter Workflow, resize to desktop, move into the Workflow activation
range, then reverse into Todos. The resolved mobile card becomes the authored
initial state:

```json
{
  "before": { "state": "completed", "time": "3600", "card": "done" },
  "after": {
    "state": "playing",
    "time": "801",
    "card": "executing",
    "disc": "executing",
    "exec": "Session · landing-copy-pass · Open"
  }
}
```

The new tests cover same-root desktop recording, force-resolved hydration,
same-layout mobile reuse, and preservation of the currently active scene
through a breakpoint. None completes an inactive retained mobile scene, changes
mode while another scene owns the channel, and then recreates the first scene
on the shared root.

Record a completed retained player before either release branch (or
equivalently preserve every completed retained player before a mode rebuild),
then add that exact mobile → other stage → desktop → original stage regression.
The inverse desktop → mobile recreation should be asserted in the same matrix.

### Judgment calls

| Topic                           | Before                                                                                                                               | After / verdict                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `step-post` entrance exception  | The original unit guard rejected every beat targeting `step-post`, which also rejected the storyboard-required visual card entrance. | **Accepted.** `step-post` has exactly one `enter` beat at 860ms. An element-only `enter` has no reducer mutation; no `set-state`, `set-progress`, text, pulse, or highlight action targets it. Exact reducer state plus normal, skipped, and reverse-retained browser probes keep it `queued`, keep the badge `Running`, and stop progress at 2/3.                                                                                                          |
| `parked` / `resolved` at 4100ms | The narrative calls the unresolved human-gate state `parked`, while player lifecycle requires a terminal `resolved` checkpoint.      | **Accepted with note.** Both named checkpoints reduce to byte-equivalent semantic state. Runtime intentionally reports the later canonical lifecycle name `resolved`; capture explicitly maps narrative filename `parked` to runtime checkpoint `resolved`. Morning can request `parked`, while ambient scheduling keys from `completed`, so no current consumer is ambiguous. Keep that label/checkpoint mapping explicit in future capture and swap code. |

### Re-verification record

| Command/check                        | Result                                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                         | Pass: 8 unit files / 43 tests; token, type, lint/format, build, 135-file public-safety, and 19-link gates green |
| `pnpm test:e2e` run 1                | Pass: 65/65                                                                                                     |
| `pnpm test:e2e` run 2                | Pass: 65/65                                                                                                     |
| Workflow normal/skip/reverse probe   | Pass: checkpoint `resolved`, time `4100`, semantic/CSS progress 2/3, gate waiting, post queued, badge running   |
| `step-post` source/reducer audit     | Pass: visual `enter` only; no semantic action or transition reaches it                                          |
| `parked` vs `resolved` reducer probe | Pass: both 4100ms checkpoints return identical semantic state                                                   |
| Mobile retained cross-root probe     | **Fail:** completed retained player has no record and replays initial after desktop recreation                  |
| A-11 eager-JS reproducer             | Pass: exact committed manifest and total, 63,426 bytes                                                          |
| A-11 screenshot inspection           | Pass: actual 1440 pinned window and 390 stacked Workflow proof; no executive clipping or pin-width crop         |
| Production progress/performance grep | Pass: transform-only fill; no progress-driven `width`/`height`, `transition: all`, or `will-change: all`        |
| Remediation leak grep / diff check   | Pass                                                                                                            |

### Re-review risk read

**Night/morning + sunrise risk: medium-high until the remaining retention path
is fixed; moderate afterward.** The parked Workflow state now has exact
semantic/visual truth, but a responsive cross-root recreation can still replay
an already resolved retained scene. The sunrise theme/lifecycle machinery and
claimant stack otherwise have the evidence needed for the next batch.

**Amendment rollout risk: medium-high.** Ribbon skip hydration, exact canonical
surfaces, and motion ownership are materially ready. The remaining breakpoint
retention hole also affects Workflow swap/navigation continuity and should be
closed before amendment work. After that, the known work is the planned
beat-boundary ambient yield, scroll-intent API, and deliberate swap
reinitialization—not repair of this showcase foundation.

---

## Final verification after cross-root retention fix

- **Date:** 2026-07-10
- **Reviewed commits:** `a3d2c72`, `4dbf9c7`
- **Verdict:** **SHIP-CLEAN**
- **Remaining findings:** 0 high · 0 medium · 0 low

The final medium finding is closed. Each controller-created player now
subscribes to its lifecycle before the motion channel can start it. When a
`once` + `entry: "play"` player reports `completed`, the controller immediately
records the pure reducer-resolved state; retention no longer depends on which
root owns the player or which later activation happens to release it. The
existing shared-root teardown recording remains a safe defensive path.

The subscription is bounded by the player lifecycle: `destroy()` reports its
terminal status and clears all listeners. Restart-on-entry and looping scenes
remain excluded by `recordCompletedState()`'s existing predicates, and skipped
stage hydration continues to consume the same canonical state map.

The new browser regression exercises the exact failed sequence—complete a
retained mobile scene, yield to another mobile root, rebuild on desktop while
the other scene owns the channel, then recreate the first scene—and asserts it
hydrates completed at the resolved checkpoint. It also verifies the mirrored
desktop → other scene → mobile recreation and repeated adjacent re-entry.

### Final verification record

| Check                           | Result                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                    | Pass: 8 unit files / 43 tests; token, type, lint/format, build, 135-file public-safety, and 19-link gates green       |
| `pnpm test:e2e`                 | Pass: 66/66, including the cross-root retention regression                                                            |
| Completion-time retention audit | Pass: listener precedes playback, records reducer end state only for retained once scenes, and is cleared on teardown |
| Breakpoint recreation matrix    | Pass: mobile → desktop and desktop → mobile both hydrate completed at the 1000ms resolved checkpoint                  |
| A-11 eager-JS reproducer        | Pass: exact committed manifest and total, 63,452 bytes                                                                |
| Commit-range diff check         | Pass                                                                                                                  |

**Risk read:** night/morning + sunrise and the amendment rollout are now
moderate-risk follow-on work: the showcase foundation is sound, while the next
batch still must preserve the documented beat-boundary ambient yield,
scroll-intent separation, and deliberate swap reinitialization contracts.

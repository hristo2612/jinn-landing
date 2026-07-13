# A-05–A-07 Scene System Code Review

- **Date:** 2026-07-10
- **Branch:** `a05-scenes`
- **Reviewed range:** `main...e5ce377` (implementation commits `75a4407`,
  `f245a9c`, `dd88853`; formatting/docs commits skimmed for accuracy)
- **Verdict:** **BLOCK**
- **Findings:** 4 high · 3 medium · 1 low

The reducer's final-state equality is genuine, the per-root DOM target contract
is correctly enforced, the hero quiet reset is a real fade rather than a snap,
and both required test commands are green. The branch is still not a complete
A-05–A-07 foundation: fast scroll has no force-resolution path, public seeking
cannot reconstruct semantic state, invalid cross-field definitions pass the
validator, and the one-motion-channel law is controller-local rather than
page-wide. Those gaps would be amplified by A-08 and by all three amendment
capabilities.

## Required remediation before merge

1. Add explicit fast-scroll destination/skip handling. Skipped stages must be
   resolved without starting their timelines, in both scroll directions, and a
   browser test must exercise a single top-to-bottom and bottom-to-top jump.
2. Make `seek(t)` reconstruct the exact semantic/DOM state for `t`, including
   reverse seeks across `enter`, `exit`, `set-state`, and `highlight` callbacks.
   The debug scrubber must prove forward and backward checkpoint fidelity.
3. Move motion-channel ownership above individual controllers, or establish
   one page-level controller that discovers every scene root. Adding a staged
   controller must not stop the standalone hero from being discovered.
4. Validate the relationship between target kind, action, embedded content,
   state-transition origin, and checkpoint coverage. A validated `resolved`
   checkpoint must include every beat that defines the end state.
5. Honor `playback.entry`, report once-scene completion honestly, and expose a
   lifecycle signal suitable for future ambient scheduling.
6. Restore the specified ~1200ms hero scene start and add deterministic natural
   per-character jitter while retaining the locked 1900ms beat and punctuation
   hesitation.
7. Exclude test fixtures from the production sitemap. Add the missing
   WebKit/Firefox scene coverage before the Phase A browser matrix becomes a
   release gate.

## Findings

### 1. HIGH — Fast scrolling activates every crossed scene; skipped scenes are never force-resolved

- **Location:** `src/lib/scenes/scene-controller.ts:86-131`,
  `src/lib/scenes/scene-controller.ts:235-245`,
  `src/lib/scenes/scene-controller.ts:276-279`,
  `tests/e2e/scene-controller.spec.ts:23-58`
- **Contract:** TECH-PLAN §3 requires discrete activation in both directions;
  the review contract additionally requires fast-scroll force-resolution.
  STORYBOARD-AMENDMENT-1 §5 defines the same skipped-stage behavior for future
  navigation.

Each stage owns an independent `onEnter`/`onEnterBack` callback that immediately
calls `activate()`. There is no scroll-velocity or destination detection, no
skipped-stage ledger, no `forceResolve` operation, and no transit suppression.
On the shared desktop root, every crossed callback constructs and starts a
player before the next callback destroys it.

A production-fixture probe jumped directly from the first stage to the last.
`data-scene-activation-count` rose from `1` to `4`: all crossed scenes were
activated. The current E2E scrolls to Org, then Flows, then Chat in separate
settled steps, so it cannot detect this failure. At best this wastes work; once
theme/state side effects land, crossed scenes can briefly execute effects the
visitor never chose to watch.

The acceptance gate needs one instantaneous multi-stage jump in each direction,
assertions that only the destination timeline plays, and exact resolved state
for every skipped stage.

### 2. HIGH — `seek()` changes GSAP time but cannot reconstruct semantic DOM state

- **Location:** `src/lib/scenes/scene-player.ts:187-195`,
  `src/lib/scenes/scene-player.ts:289-375`,
  `src/lib/scenes/scene-player.ts:431-467`,
  `src/lib/scenes/scene-debug.ts:63-65`,
  `tests/e2e/scene-player.spec.ts:24-68`
- **Contract:** `ScenePlayer` exposes deterministic seek/checkpoint control;
  the development scrubber is the named checkpoint QA tool.

The root cause is that `enter`, `exit`, `set-state`, `highlight`, and `theme`
perform imperative mutations from `timeline.call()` callbacks. `seek()` only
sets the timeline clock; it neither restores the SSR snapshot nor renders the
reducer state for the destination checkpoint. Running those callbacks while
seeking backward repeats the forward mutation instead of applying an inverse.

Reproduction on the controller fixture:

- activate `stage-org`, pause, and seek to `200ms` → `pane-org` is active;
- seek back to `0ms` → `currentCheckpoint === "initial"`, but `pane-org`
  remains active rather than restoring the initial Chat pane.

The shipped test seeks only forward to `750ms`, checks the numeric data
attribute, and then restarts; it never asserts DOM state after a backward seek.
This is not isolated to the fixture: future state, progress, theme, and pane
actions all depend on the same forward-only callback pattern.

The invariant should be `DOM(t) === render(reduce(definition, t))` for arbitrary
forward and backward `t`, not merely that the GSAP clock accepted the number.

### 3. HIGH — The one-active-timeline law is not page-wide, and adding A-08's controller can disable the hero

- **Location:** `src/lib/scenes/install-scene-system.ts:9-25`,
  `src/lib/scenes/scene-controller.ts:30-34`,
  `src/lib/scenes/scene-controller.ts:288-292`,
  `docs/HANDOFF-A05.md:40-64`, `docs/HANDOFF-A05.md:282-299`
- **Contract:** STORYBOARD §7 guardrail 1 says the controller enforces that two
  scenes never animate simultaneously. The review gate requires page-wide
  enforcement, not an architectural intention.

`enforceOneActivePlayer()` only iterates the current controller's private
`players` set. There is no shared arbiter. More importantly, installer discovery
is mutually exclusive: if any `[data-scene-controller]` exists, all standalone
`[data-scene-window][data-scene-id]` roots are ignored. A-08 cannot add a
separate showcase controller while retaining the current standalone hero.

The concurrently added handoff correctly acknowledges both problems and tells
A-08 either to restructure the hero and all stages under one controller or add
a page coordinator. That is an admission that A-07 did not establish the
promised page-wide invariant. It transfers foundational orchestration work into
A-08, whose planned responsibility is faithful dashboard surfaces.

The acceptance gate needs at least two controller roots plus a standalone root,
then must prove exactly one running player across the document while every root
is still discovered and cleanly destroyed.

### 4. HIGH — Validator strictness stops at field-level checks; invalid definitions still validate

- **Location:** `src/lib/scenes/scene-validator.ts:17-65`,
  `src/lib/scenes/scene-validator.ts:68-97`,
  `src/lib/scenes/scene-validator.ts:142-158`,
  `tests/unit/scene-validator.test.ts:50-176`
- **Contract:** A-05 must make invalid targets, transitions, overlapping text,
  and unbounded loops fail before visual work; the declarative layer is meant
  to prevent reducer/DOM divergence.

The implemented tests genuinely reject a missing beat target, one undeclared
transition, same-target overlapping text, an unbounded pulse, and a loop
without dwell/reset. Cross-field consistency is not validated. An isolated
runtime probe confirmed that all four of these definitions are accepted:

- a `state` target with no `initialState`, followed by a declared
  `queued → done` transition;
- `type-text` applied to a `state` target;
- an `enter` beat for `msg-a` whose embedded message declares target `msg-b`;
- a `resolved` checkpoint at `100ms` with a final text beat at `200–300ms`.

The third case is especially dangerous: the reducer inserts the embedded
`msg-b` content while the player animates DOM target `msg-a`, breaking the
same-state invariant even though validation succeeded. The fourth contradicts
the definition contract that the end state is computed by applying all beats.

Validation needs an action/target compatibility matrix, exact embedded-target
identity, required state origins, unambiguous placement, and checkpoint bounds.
Each rejected shape needs an exact error assertion.

### 5. MEDIUM — The wired hero starts ~1.2 seconds too early and typing has cadence but no natural jitter

- **Location:** `src/components/marketing/Hero.astro:57-66`,
  `src/lib/scenes/scene-player.ts:138-144`,
  `src/lib/scenes/scene-player.ts:41-53`,
  `src/lib/scenes/scene-player.ts:377-409`
- **Contract:** STORYBOARD §4 starts `delegation` at approximately `1200ms`;
  guardrail 4 specifies ~28ms/character with jitter and punctuation hesitation.

`installSceneSystem()` constructs the player during module startup, and the
constructor calls `play()` immediately. A fresh production-page probe reached
the load event with scene time `20ms`, state `playing`, and an already-cleared
composer. At the specified start, the resolved/primed composer should remain
still while the hero entrance completes.

`typingBoundaries()` assigns four deterministic weights: letters are all
`25.45ms`, spaces `14.00ms`, em dash/comma-like punctuation `48.36ms`, and
sentence punctuation `71.27ms` for this 1900ms line. This provides cadence and
some punctuation delay, but no per-character jitter despite the definition's
claim of "natural jitter."

The internal beat table, assistant composed-block behavior, two chip timings,
5000ms dwell, and 600ms whole-frame fade-reset otherwise match the storyboard.
The reset swaps content while the frame is fully faded, so it is not a snap.

### 6. MEDIUM — Playback entry and completion semantics are declared but not implemented

- **Location:** `src/lib/scenes/types.ts:93-101`,
  `src/lib/scenes/scene-player.ts:154-185`,
  `src/lib/scenes/scene-controller.ts:96-126`,
  `src/pages/test-fixtures/scene-controller.astro:133-137`,
  `tests/e2e/scene-controller.spec.ts:116-153`
- **Contract:** definitions declare `play` versus `restart-on-enter`; ambient
  readiness needs an honest resolved/completed lifecycle.

No runtime code reads `definition.playback.entry`. Reusing a mobile player
always calls `resume("controller")`, even though the fixture definitions
explicitly declare `restart-on-enter`; desktop shared-root activation always
destroys and reconstructs instead. The same policy therefore behaves
differently by layout and never controls either behavior.

`isPlaying` checks only `!timeline.paused()`. GSAP does not mark a completed
once timeline as paused, so a fixture at its resolved endpoint reported:

```text
currentTime=1000, checkpoint=resolved, isPlaying=true,
data-scene-player-state=playing
```

The controller test calls "activates each once" an activation-count check; it
does not prove restart-on-enter or completed-state semantics. This blocks a
clean ambient `follows` implementation because there is no accurate completion
signal on which to start the 2000ms hold.

### 7. MEDIUM — Both browser fixtures are published in the production sitemap

- **Location:** `src/pages/test-fixtures/scene-player.astro:10-18`,
  `src/pages/test-fixtures/scene-controller.astro:19-27`, `astro.config.mjs:14-32`,
  generated `dist/sitemap-0.xml`
- **Contract:** fixture routes must be noindexed and excluded from sitemap/link
  discovery.

Both pages correctly emit `noindex,nofollow`, are unlinked, and contain no
private or embarrassing data. Pagefind reports only one indexed page, so the
fixtures are not in site search. The generated sitemap nevertheless advertises
both canonical URLs:

```text
https://jinn.run/test-fixtures/scene-controller/
https://jinn.run/test-fixtures/scene-player/
```

The link gate starts from its four required public URLs, so the unlinked
fixtures are appropriately outside that crawl. Sitemap publication still
contradicts `noindex` and exposes test infrastructure as first-class site URLs.

### 8. LOW — Scroll/sticky coverage remains Chromium-only

- **Location:** `playwright.config.ts:13-20`,
  `tests/e2e/scene-controller.spec.ts:23-171`, `docs/TECH-PLAN.md:389-395`
- **Contract:** the QA matrix assigns mobile Safari scroll/sticky behavior to
  WebKit and navigation/reduced-motion smoke coverage to Firefox.

`pnpm test:e2e` has one Desktop Chrome project. The mobile tests change the
Chromium viewport; they do not exercise WebKit's sticky/IntersectionObserver
behavior. This is not the cause of the blockers above, but A-07 is precisely
the point where the cross-browser scene-controller smoke gate becomes useful.

## Reducer and definition audit

The following parts pass:

- `scene-reducer.ts` imports only the validator and type declarations; the
  A-05 layer has no DOM or GSAP dependency.
- Missing beat targets, duplicate declared targets, the tested undeclared
  transition, same-target overlapping text actions, easing vocabulary,
  pulse bounds, and loop dwell/reset requirements fail with exact messages.
- Checkpoint resolution sorts same-time beats stably and applies a beat only
  when its duration has completed by the checkpoint.
- `resolveSceneCheckpoint(delegationScene, "resolved")` is compared with
  `delegationResolved` using deep equality. The E2E independently scopes to the
  hero root and compares exact canonical DOM text under reduced motion. This
  closes the reducer-data-DOM chain for the current scene; it is not vacuous.
- The delegation definition's offsets, durations, targets, and action sequence
  match STORYBOARD §3. Assistant messages use block `enter`, not typed text.

The generic state seam is still weak for A-08: `SceneDefinition<TState>` is
constrained to `ChatSceneState`, and the reducer is chat-thread-specific with
generic `targetStates`/`progress` dictionaries grafted onto it. Rich Org,
Todos, Workflow, and Trigger canonical states will require specialization or a
reducer split; the handoff acknowledges this rather than presenting a stable
typed surface contract.

## Player lifecycle audit

The following parts pass for the current delegation scene:

- One `ScenePlayer` constructs one GSAP timeline; beats do not create sibling
  timelines.
- Missing and duplicate DOM targets fail loudly and are scoped to the supplied
  scene root.
- Pause reasons compose for user plus visibility/offscreen in the tested path.
- The loop holds `resolved` for 5000ms, fades the whole frame out for 300ms,
  primes initial content while invisible, and fades in for 300ms. This is the
  required quiet reset.
- The visible control lives in `[data-scene-controls]`, is 44×44, uses the exact
  `Pause animation` / `Play animation` labels, and is absent under reduced
  motion.
- Reduced motion returns before `compileTimeline()`, control mounting, or
  observer binding. Runtime inspection found zero scene timelines and no
  ScrollTrigger state.
- `destroy()` kills the current timeline/observer/lifecycle bindings, removes
  the control, restores the captured SSR attributes/text, and leaves no inline
  style in the current hero test.

The teardown model is not yet sufficient for the future `theme` verb:
`transitionTheme()` mutates page-level state outside the captured scene root,
and reverse seek/destroy has no corresponding theme restoration. That should
be resolved with finding 2 before A-11 depends on it.

## Controller, build, performance, and hygiene audit

- Desktop fixture pinning and settled, discrete activation in both directions
  pass. Mobile uses normal-flow stage windows with per-root target scoping.
- Breakpoint generations reject stale dynamic imports and kill old
  ScrollTrigger bindings. The present test proves one running player, but not
  listener cardinality or the page-wide law in finding 3.
- Production artifact grep found no `scene-debug`, `data-scene-debug`, debug
  copy, or debug CSS. The dev-only module is genuinely tree-shaken; the DOM-only
  test is supported by artifact evidence.
- Deterministic `gzip -n -9` over the unique eager `/` JS closure measured
  **39,905 bytes**. The claimed 39,995 bytes is reproducible within 90 bytes of
  compression/header-tool variance and is materially accurate. It is well
  below the 90KB budget.
- A production network trace requested the page, Hero, MarketingLayout,
  scene-controller, scene-player, preload helper, and theme-transition chunks.
  It requested **no ScrollTrigger chunk**. The real page has no staged
  controller today, so ScrollTrigger remains lazy.
- The committed fixture copy is generic and safe. `pnpm safety:check` scanned
  101 source/generated files successfully.
- Implementation commits are sensibly separated by A-05/A-06/A-07, and the
  formatting commits are docs-only. `e5ce377` appeared concurrently during the
  review and adds only `docs/HANDOFF-A05.md`; it accurately discloses the
  controller-local channel and A-08 restructuring gap, but overstates current
  `seek()` and `isPlaying` behavior as described above.

## Amendment readiness

The architecture cannot absorb all three approved future capabilities without
rework yet:

| Capability                                 | Readiness and friction                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SceneController.navigateToStage(paneKey)` | Stage registrations expose scene IDs but no navigation/activation-offset API; trigger handles retain only `kill()`. Transit suppression depends on the missing fast-scroll destination/skip ledger from finding 1. Adding a smooth-scroll method alone would replay intermediate scenes.                                                                                                 |
| Ambient scheduling                         | There is no resolved/completed event, no current-beat boundary or ≤500ms yield API, no page-wide motion arbiter, and the pause control is private to one player. Once scenes report `playing` after completion. Ambient scheduling therefore requires lifecycle and ownership changes, not just an `ambient` field.                                                                      |
| `ScenePlayer.swap(sceneId)`                | Definition, target map, snapshots, and timeline are readonly construction-time state, and the player has no scene registry. A correct swap must rebuild those internals, remove outgoing control/listeners/styles, and restore page-level theme effects. Current `destroy()+new ScenePlayer()` can be a primitive, but the requested player API is not an additive method on this shape. |

## Verification record

| Command/check                       | Result                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                        | Pass: token contract, typecheck (0 errors), lint/format, 5 unit files / 27 tests, build, 101-file safety scan, 19-link crawl |
| `pnpm test:e2e`                     | Pass: 38 Chromium tests                                                                                                      |
| Reverse checkpoint probe            | Fail: seek `200ms → 0ms` reports `initial` while `pane-org` remains active                                                   |
| Fast-scroll probe                   | Fail: one first→last jump increments shared-window activation count `1 → 4`                                                  |
| Once completion probe               | Fail: `resolved` at `1000ms` still reports `isPlaying=true` / `playing`                                                      |
| Validator strictness probe          | Fail: all four invalid cross-field definitions described in finding 4 validate                                               |
| Hero-start probe                    | Fail: scene is already playing at `20ms`; composer is cleared at page load rather than waiting ~1200ms                       |
| Reduced-motion source/runtime audit | Pass: no GSAP scene timeline, observer, control, pin, or ScrollTrigger instantiated                                          |
| Quiet-reset source audit            | Pass: 5000ms dwell + 300ms fade-out + invisible prime + 300ms fade-in                                                        |
| Production debug grep               | Pass: debug module/copy/CSS absent from `dist/`                                                                              |
| Eager JS gzip                       | Pass: 39,905 bytes across the unique eager dependency closure                                                                |
| Real-page network trace             | Pass: no ScrollTrigger request                                                                                               |
| Fixture discovery                   | Partial: both noindexed/unlinked and absent from Pagefind; both incorrectly present in sitemap                               |

## Risk read

**A-08 risk: high.** The task can build static surfaces, but connecting them
requires restructuring the standalone hero into the staged controller (or
adding a page coordinator), replacing the chat-only state seam, and deciding
how skipped/resolved state is retained. Doing that atop the current A-07 would
mix foundational orchestration repair into surface work.

**Amendment rollout risk: high.** `navigateToStage` directly depends on the
missing skip/force-resolve model; ambient depends on honest completion,
beat-boundary yielding, and global arbitration; `swap` depends on mutable
construction-time player resources and broader teardown. Fix the four high
findings plus completion semantics before using this branch as the base for
A-08 or any amendment capability.

---

## Re-review after remediation

- **Date:** 2026-07-10
- **Reviewed range:** `ab475f7...cf8eb44`
- **Remediation commits:** `05f8619`, `6d5376b`, `9ffd140`, `4f9e488`,
  `86c3ac6`, `18d2b1c`, `cf8eb44`
- **Verdict:** **BLOCK**
- **Remaining findings:** 1 high · 0 medium · 0 low

Seven of the eight original findings are fixed and their new gates are real.
Fast jumps activate only their destination and resolve skipped semantic states;
reverse seek reconstructs the DOM and document theme; installer discovery and
motion ownership are page-wide; hero delay/jitter, entry/completion lifecycle,
sitemap exclusion, and cross-browser smoke coverage all pass. One core A-05
invariant is still open: transition validation orders state changes by beat
start while the player commits them at beat completion. A validly typed scene
can therefore pass validation and reduce to a different resolved state than the
browser renders.

### Remaining finding

#### 4. HIGH — Overlapping state transitions still validate and break `DOM(resolved) === reduce(resolved)`

- **Location:** `src/lib/scenes/scene-validator.ts:128-156`,
  `src/lib/scenes/scene-reducer.ts:172-195`,
  `src/lib/scenes/scene-player.ts:415-423`,
  `tests/unit/scene-validator.test.ts:177-340`
- **Original requirement:** invalid transitions must fail before visual work;
  state origins and resolved checkpoint coverage must preserve the reducer/DOM
  invariant.

`validateTransitions()` sorts state beats by `beat.at` and advances its
semantic cursor immediately. `resolveSceneCheckpoint()` uses the same start
ordering for all completed beats. `ScenePlayer`, however, schedules each
`set-state` mutation at `beat.at + duration`. These are different ordering
rules whenever two transitions on one target overlap and finish out of order.

The following definition passes `validateSceneDefinition()`:

```text
target origin: queued
declared transitions: queued → executing, executing → done

at 0ms,   duration 500ms: queued → executing
at 100ms, duration 100ms: executing → done
resolved checkpoint: 500ms
```

The validator processes the starts as `queued → executing → done`, and the
pure reducer returns `targetStates.status === "done"`. A production-browser
probe against the compiled `ScenePlayer` produced:

```json
{
  "dom": "executing",
  "time": 500,
  "checkpoint": "resolved",
  "status": "completed",
  "isCompleted": true
}
```

The `done` callback fires at 200ms, then the earlier-authored `executing`
callback fires at 500ms. The scene reports itself resolved/completed while its
DOM contradicts the reducer. This also makes controller force-resolution
unsafe: a skipped stage can record `done` even though normal playback of the
same validated definition ends at `executing`.

Reject overlapping `set-state` intervals on the same target with an exact
validator assertion, or define one completion-order rule and apply it
identically in the validator, reducer, and player. The acceptance gate should
include this counterexample plus a browser equality assertion for a valid
multi-transition scene.

### Re-verification of the other seven findings

- **Finding 1, fast-scroll destination/skip handling — fixed.** ScrollTrigger and mobile
  observer activations coalesce through one animation frame. The first-to-last
  and last-to-first browser jumps increment destination activation only once,
  never instantiate skipped players, and compare each skipped state's exact
  reducer output.
- **Finding 2, deterministic reverse seek — fixed.** `seek(t)` restores the captured SSR
  DOM and document theme, primes initial state, then replays the single
  timeline to `t`. The browser test checks text, `enter`, `exit`, `set-state`,
  `highlight`, and theme at resolved and again after seeking back to zero.
- **Finding 3, page-wide motion ownership and inclusive discovery — fixed.** One
  installer-owned `SceneMotionChannel` is shared by every controller and
  standalone root. The three-root fixture proves discovery, ownership
  transfer, exactly one playing timeline, and pagehide teardown.
- **Finding 5, hero start and typing feel — fixed.** The definition retains the exact
  1900ms storyboard beat, adds a 1200ms start delay, and uses stable seeded
  per-character variance with longer punctuation intervals. TECH-PLAN's
  pre-paint initial-state priming remains intact; the composer/time proof shows
  typing itself does not begin early.
- **Finding 6, entry/completion semantics — fixed.** `restart-on-enter` and `play` now
  behave distinctly. Once scenes expose `completed`, `isCompleted`, an honest
  `isPlaying`, and `onStatusChange`; the browser tests exercise replay versus
  retained resolution.
- **Finding 7, fixture sitemap publication — fixed.** The generated sitemap and exact
  browser assertion contain only `https://jinn.run/` and
  `https://jinn.run/docs/`. All three fixtures remain noindexed, unlinked, and
  excluded from Pagefind/link discovery.
- **Finding 8, browser coverage — fixed.** WebKit exercises the mobile unpinned
  activation path; Firefox exercises navigation plus reduced motion. Both run
  inside the normal `pnpm test:e2e` command.

### Lifecycle, build, performance, and hygiene re-check

- The player still builds exactly one GSAP timeline per scene. The 5000ms
  resolved dwell and 600ms whole-frame fade-reset remain continuous: initial
  content is restored only while the frame is fully transparent.
- Reduced motion returns before timeline, control, observer, or ScrollTrigger
  construction. Destroy restores captured target/frame styles and text, global
  theme state, controls, timers, observers, page/visibility listeners, and
  runtime data attributes.
- Breakpoint generations cancel stale bindings/imports, and the shared motion
  owner prevents hidden retained players from advancing. The installer fixture
  verifies pagehide cleanup across two controller roots and one standalone
  root.
- Production artifact grep contains no debug overlay marker/copy/module. The
  development-only dynamic import is tree-shaken, not merely hidden at runtime.
- Deterministic level-9 gzip over the unique eager `/` JavaScript closure is
  **42,988 bytes**, exactly matching the remediation handoff. A real production
  page trace requested GSAP core but no ScrollTrigger chunk.
- Remediation commits are separated by validator, deterministic playback,
  lifecycle, page arbitration, browser coverage, handoff, and formatting. Diff
  whitespace checks pass; the pre-existing untracked `variants/*/shoot.mjs`
  files were excluded from this review commit.

### Amendment readiness and A-08 risk

**A-08 is high risk until finding 4 is closed.** Its Todos, Workflow, and
Triggers scenes are the first heavy users of chained `set-state` beats; the
current validator can certify an end state the browser does not render. Once
transition timing is made single-source-of-truth, A-08 falls to moderate risk:
the shared desktop/mobile target matrix and the still chat-shaped generic state
model remain the main integration seams, but no controller rewrite is needed
for the five scripted surfaces.

The amendment capabilities are absorbable, but not zero-rework:

- The shipped `navigateToStage(sceneId)` is currently the internal
  destination-coalescing/activation primitive. The amendment gives that public
  name to desktop smooth-scroll navigation with a mobile no-op. Landing it will
  require splitting or renaming the current method so ScrollTrigger/observer
  callbacks retain direct destination handling while ribbon input scrolls.
- Completion signaling and the page-wide motion owner are good ambient seams.
  `SceneMotionChannel` still has only immediate claim/pause, though; the
  amendment's cancelable 2s hold and "finish the current beat, then yield"
  policy need a beat-boundary signal and a richer ownership state machine.
- `ScenePlayer` binds its definition, targets, snapshots, frame, and timeline
  immutably at construction. `swap()` can reuse the teardown guarantees, but
  it will need controller-managed player replacement or a deliberate internal
  reinitialization/render boundary. A-08 must keep the workflow host and target
  markup stable as the handoff specifies.

Overall amendment risk is **medium-high**: the architecture now has the right
page owner and lifecycle signal, but transition ordering must be fixed first,
and navigation/ambient/swap each require contained runtime API work rather than
mere policy wiring.

### Re-review verification commands

| Gate                    | Result                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm check`            | Pass: 34 unit tests plus tokens, typecheck, lint, build, public safety, and link crawl      |
| `pnpm test:e2e` run 1   | Pass: 47/47                                                                                 |
| `pnpm test:e2e` run 2   | Pass: 47/47                                                                                 |
| Timing flake pass       | Pass: 24/24 over eight repetitions of delayed start, completion signaling, and entry replay |
| Eager `/` gzip          | Pass: 42,988 bytes                                                                          |
| Real-page network trace | Pass: GSAP core requested; ScrollTrigger not requested                                      |
| Production debug grep   | Pass: no overlay marker/copy/module                                                         |
| Generated sitemap       | Pass: `/` and `/docs/` only                                                                 |

The green suites do not cover the remaining transition-order counterexample;
that is why this re-review remains **BLOCK**.

---

## Final scoped re-review of transition ordering

- **Date:** 2026-07-10
- **Reviewed commit:** `9a3f946`
- **Verdict:** **BLOCK**
- **Remaining findings:** 1 high · 0 medium · 0 low

The shared ordering module fixes the reported resolved-state counterexample.
`scene-beat-order.ts` is pure, defines `set-state` commit time once, and is
consumed by validator, reducer, and player. The production fixture now settles
to `{ dom: "done", reducer: "done" }`, and an additional browser probe confirms
that same-time state beats retain definition order. The fix nevertheless opens
the same invariant at the required `initial` checkpoint.

### HIGH — A `set-state` beat at 0ms makes reducer `initial` disagree with player `seek(0)`

- **Location:** `src/lib/scenes/scene-beat-order.ts:8-11`,
  `src/lib/scenes/scene-reducer.ts:188-192`,
  `src/lib/scenes/scene-player.ts:247-269`,
  `tests/unit/scene-reducer.test.ts:143-208`
- **Contract:** the named `initial` checkpoint at 0ms represents the authored
  initial semantic state, and deterministic seek must reconstruct the same
  DOM/state as checkpoint reduction.

The remediation fixture starts its first transition at 0ms. The new reducer
rule includes every beat whose commit time is less than or equal to the
checkpoint, so resolving `initial` immediately applies `queued → executing`.
The player intentionally handles zero differently: `seek(0)` restores and
primes the initial DOM, then skips timeline replay because replay occurs only
when `clamped > 0`.

The exact production/source probes return:

```text
player after seek(0):
{ dom: "queued", time: 0, checkpoint: "initial", authoredInitial: "queued" }

resolveSceneCheckpoint(definition, "initial"):
{ targetStates: { status: "executing" } }
```

The new unit test asserts only the 100ms intermediate and 1000ms final
checkpoints; the browser test asserts only completion. Both therefore pass
while the first required checkpoint violates `DOM(t) === reduce(t)`.

Make `resolveSceneCheckpoint(definition, "initial")` return an immutable copy
of `definition.initialState` even when a beat starts at 0ms, and add the missing
unit plus browser `seek(0)` equality assertions. Moving only this fixture's
first beat later would not close the generic contract because 0ms state beats
remain valid definitions.

### What passed

- Shared start-order semantics resolve the original overlap fixture to `done`
  in validator, reducer, and production player.
- Same-time `set-state` beats settle in stable definition order in both reducer
  and player.
- `HANDOFF-A05.md` accurately records the three amendment seams: scrolling
  versus activation, beat-boundary ambient yielding, and player reinitializing
  swap.
- `pnpm check` passes with 35 unit tests.
- `pnpm test:e2e` passes 48/48 across Chromium, WebKit, and Firefox.

**Risk:** A-08 remains high risk until the initial checkpoint boundary is made
single-source-of-truth, then drops to moderate. Amendment rollout remains
medium-high for the already documented navigation, ambient-yield, and swap
runtime extensions; this commit adds no new amendment blocker.

---

## Loop-cap final verification

- **Date:** 2026-07-10
- **Reviewed commit:** `b2e1920`
- **Verdict:** **SHIP-CLEAN**
- **Remaining findings:** 0 high · 0 medium · 0 low

The initial-boundary defect is closed without splitting the validator, reducer,
and player semantics again. `sceneBeatCommitAt()` maps a `set-state` beat
authored at 0ms to the first positive timeline instant (0.001ms). This preserves
the authored pre-timeline state at the exact `initial` checkpoint while all
three consumers retain the same stable transition order as soon as playback
advances.

The new assertions are substantive:

- the reducer returns `queued` at `initial` for a 0ms transition;
- the browser compares that reducer value with the scoped player DOM after
  `seek(0)`, which also returns `queued`;
- the existing intermediate checkpoint returns `executing`;
- the overlap fixture still settles to `{ dom: "done", reducer: "done" }`;
- same-time state beats remain stable in definition order.

No new lifecycle, performance, production-artifact, fixture-publication, or
amendment-readiness issue is introduced. The 0.001ms offset is an internal
semantic boundary, documented in both source and handoff; authored beat and
checkpoint times remain integer milliseconds.

### Final verification record

| Gate                           | Result                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `pnpm check`                   | Pass: 35 unit tests plus tokens, typecheck, lint, build, public safety, and link crawl |
| `pnpm test:e2e`                | Pass: 49/49 across Chromium, WebKit, and Firefox                                       |
| Transition source audit        | Pass: validator, reducer, and player consume the shared commit-time rule               |
| Initial-boundary browser proof | Pass: reducer = authored initial = player `seek(0)`                                    |
| Diff and fixture hygiene       | Pass: scoped generic changes; pre-existing untracked variant scripts excluded          |

**Risk:** A-08 is now moderate integration risk, centered on authoring the four
new semantic surfaces against the shared desktop/mobile target matrix. The
amendment rollout remains medium-high but contained to the already documented
scroll/API separation, beat-boundary ambient yielding, and player swap
reinitialization; none requires reopening A-05–A-07.

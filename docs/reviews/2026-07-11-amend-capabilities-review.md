# Amendment Scene Capabilities Code Review

- **Date:** 2026-07-11
- **Branch:** `amend-capabilities`
- **Reviewed range:** `main...amend-capabilities`
- **Reviewed commits:** `2ade140`, `b37461a`, `cf329eb`, `6a69234`
- **Verdict:** **BLOCK**
- **Open findings:** **4 high · 3 medium · 1 low**

The branch preserves the current landing-page markup and authored production
scene data, and both full required gate pairs pass. It does not yet satisfy the
three amendment capability contracts. Manual navigation cancellation can leave
scroll and scene state disagreeing; ambient scheduling can start and run while
the document is hidden; ambient playback and `swap()` have no coordinated
handoff; and the documented reduced-motion switch path cannot materialize the
selected scene. These are foundation failures for the next UI batch, not UI
nits.

## Required remediation before the Fable UI batch

1. Make navigation cancellation reconcile the active stage from the current
   scroll position in the same transaction, including pointer/touch cancellation
   that produces no subsequent scroll event.
2. Govern the ambient hold itself with visibility, offscreen, user, and channel
   pause state; never construct or start an ambient runtime while hidden.
3. Put `swap()` through a controller-aware loop/ambient handoff, or reject it
   loudly when the active player is controller-owned ambient playback. Clear all
   ambient ownership state and preserve beat-boundary yield semantics.
4. Define and test the reduced-motion switch contract end to end through a
   staged controller: the selected definition must have exact resolved DOM with
   no timeline, and the switcher must not receive `null` from
   `getActivePlayer()`.
5. Provide one stable window pause control that governs the scripted host, the
   post-resolution hold, and ambient playback without changing identity or
   disappearing during handoff.
6. Enforce the amendment's ambient authoring laws and replace timing sleeps with
   in-page, state-driven probes that exercise the real failure sequences below.

## Findings

### 1. HIGH — Manual cancellation can strand the viewport on a new stage while the old scene remains active

`activateFromBinding()` suppresses every ScrollTrigger callback while a
navigation transaction exists (`src/lib/scenes/scene-controller.ts:495`). A
manual intent then clears the transaction and freezes the smooth scroll, but
`cancelNavigation()` does not resolve the stage at the resulting scroll
position (`src/lib/scenes/scene-controller.ts:550`). If the relevant
ScrollTrigger `onEnter` already fired while suppressed, no callback is replayed
unless the user happens to generate another meaningful scroll.

Adversarial browser probe on the shipped fixture:

```text
navigateToStage("stage-flows")
pointerdown when scrollY reaches 945px; no drag or later scroll

scrollY:        945
centered stage: stage-org
active scene:   stage-chat
```

This violates the scroll-single-source-of-truth and manual-cancel contracts.
It also makes the handoff statement “normal scroll activation then wins” false
for a pointer/touch cancellation that ends without subsequent movement. The
sunrise owner itself remains position-driven and did not double-fire in the
probe, but scene/pane state can still disagree with the narrative position
beside that boundary.

The current test at `tests/e2e/scene-controller.spec.ts:342` hides this failure:
after dispatching the cancel event it performs a second instant
`scrollIntoView()` call, which creates the missing activation event instead of
asserting the state at the actual cancellation point.

### 2. HIGH — The post-resolution ambient hold ignores document visibility and starts a live timeline while hidden

`scheduleAmbient()` arms a raw timeout (`scene-controller.ts:580`) that is not
composed with the host player's visibility pause reason. `startAmbient()` only
checks controller/channel identity (`scene-controller.ts:599`); it does not
check `document.visibilityState` or the host's paused status. The newly created
ambient player binds a `visibilitychange` listener after the document is
already hidden, so it never receives the event that should pause it.

Reproduction on `?ambient=1`:

```text
activate stage-todos
wait for scripted host status = completed
set document.visibilityState = hidden; dispatch visibilitychange
wait beyond the 300ms fixture hold

active definition: stage-todos-ambient
player status:      playing
scene time:         170ms
visibility:         hidden
```

This directly violates Amendment §2.0 and §5: ambient must pause on
`visibilitychange`, and its scheduling policy must not instantiate a moving
runtime that escaped that pause. The handoff's claim that visibility reasons
continue to compose is therefore incomplete. The authored test changes
visibility only after ambient is already running
(`tests/e2e/scene-controller.spec.ts:134`), so it never covers the scheduling
hold.

### 3. HIGH — `swap()` can hard-cut controller-owned ambient playback and leave stale ownership/lifecycle state

The public consumer recipe calls `getActivePlayer()?.swap(sceneId)`, but
`ScenePlayer.swap()` has no knowledge of its owning controller or motion
channel (`src/lib/scenes/scene-player.ts:378`). If the returned player is an
active ambient player, `swap()` kills the timeline immediately rather than
using `yieldAtBeatBoundary()`. The controller still retains the old
`ambientHostPlayer`, `activeSceneId`, and `data-active-ambient-scene`, because
only `beginAmbientYield()` clears those fields
(`scene-controller.ts:631`).

Same-surface falsification during the fixture's 400ms ambient beat:

```text
before swap:
  definition = stage-todos-ambient; time = 86ms
  activeScene = stage-todos; activeAmbientScene = stage-todos-ambient

getActivePlayer().swap("stage-todos")
after the swapped host completes:
  definition = stage-todos; status = completed
  activeScene = stage-todos
  activeAmbientScene = stage-todos-ambient  (stale)
```

The ambient beat was cut rather than finished, and the swapped-in player was
created from the ambient player, which has no controller completion
subscription. It therefore cannot perform the normal retention/re-arm
lifecycle. Swapping to another registered definition is worse: the controller
continues to advertise the original stage while the player runs the other
definition.

This fails the requested ambient-plus-swap and swap-during-beat seams. The
Fable batch cannot safely follow the handoff recipe until the API either
coordinates with controller ownership or rejects the misuse before touching
the outgoing runtime.

### 4. HIGH — The reduced-motion switch path cannot produce the selected scene's resolved truth

There are two independent failures:

1. A staged `SceneController` in reduced mode creates no active player at all
   (`scene-controller.ts:354`). It records only `activeSceneId`, so the handoff's
   consumer call `getActivePlayer()?.swap(sceneId)` is a no-op for the pinned
   Workflow switcher under reduced motion.
2. A directly constructed reduced-motion player does swap definitions, but
   `initializeRuntime()` returns after setting bookkeeping attributes
   (`scene-player.ts:200`) without reconstructing the destination's resolved
   DOM. The new test actually codifies the outgoing DOM as success: after
   swapping to `fixture-loop`, whose resolved `replace-text` value is
   `"Looping"`, it expects the old text `"Resolved"`
   (`tests/e2e/scene-player.spec.ts:66`).

That violates the established `DOM(resolved) === reduce(resolved)` law and the
handoff claim that reduced motion performs the same definition/snapshot
handoff without a timeline. It is directly user-visible in the Fable batch:
selecting Nightly backup with reduced motion cannot truthfully render the
backup run's resolved static state.

### 5. MEDIUM — The generated pause control governs only the ambient loop, not scripted playback or the hold

`ScenePlayer.mountControl()` returns for every non-loop definition
(`scene-player.ts:471`). The showcase hosts that ambient follows are retained
`once` scenes, so their scripted playback and the post-resolution hold have no
generated pause control. When ambient starts, its player creates a button;
when ambient yields, that button is removed and the next scripted host again
has none.

The result is a changing, ambient-only control rather than the amendment's one
window pause control governing scripted **and** ambient motion. It also leaves
no user-pause reason available to stop the hold before ambient construction.
The handoff tells consumers not to add a second control, so a consumer following
only that document cannot meet the contract.

### 6. MEDIUM — Ambient validation accepts schedules that violate the global motion laws

The validator checks loop mode, a non-negative delay, forbidden surfaces, and
individual durations over 500ms (`scene-validator.ts:186`). It does not enforce
the amendment's 2000ms hold, 5–8s cadence, one-beat-at-a-time rule, cycle/dwell
bounds, or that `follows` names a non-ambient scripted host on the same
surface/pane.

A definition with `startDelay: 0`, `dwellMs: 1`, `quietResetMs: 1`, and two
simultaneous 500ms pulses on different targets passes
`validateSceneDefinition()`. That definition violates both the specified hold
and the page-wide one-motion law while passing the branch's loud-development
gate. The next UI batch should not be able to accidentally author this state.

### 7. MEDIUM — New race tests rely on wall-clock timing and overclaim the missing contracts

The new E2E coverage adds fixed sleeps at 250ms, 300ms, 400ms, and 1300ms, a
40ms `setTimeout()` race, and a `performance.now()` ≤520ms assertion. Those are
the contention-sensitive pattern the theatre review replaced with an in-page
`requestAnimationFrame` probe. More importantly, several named guarantees are
not asserted:

- manual cancellation performs a second scroll, masking finding 1;
- visibility is toggled only after ambient starts, masking finding 2;
- the ambient/swap seam is absent;
- the reduced-motion swap test asserts outgoing DOM, masking finding 4;
- sunrise navigation checks only final `light`, not one owner/one sweep under
  navigation spam or interruption;
- atomic swap coverage exercises an unknown ID, but not invalid policy,
  missing/duplicate destination targets, or missing controls while preserving
  the live outgoing runtime.

Both complete E2E runs passed, but these are coverage gaps and deterministic
test-design defects, not intermittent failures observed in the suite.

### 8. LOW — The documented navigation type is narrower than the exported API

The handoff publishes `navigateToStage(paneKey: PaneKey): void`, while the
implementation exports `PaneKey | string` (`scene-controller.ts:164`), which
collapses to unrestricted `string`. Exact fixture IDs are deliberately
accepted, but the public type gives production consumers no compile-time
protection against arbitrary stage IDs and makes the “pane key” contract less
useful. A branded/internal test-only path or an exact overload would preserve
the documented consumer surface without removing fixture coverage.

## Seam audit

### Sunrise and theme ownership

- No second production theme authority was added. `navigateToStage()` changes
  scroll position only; `src/lib/sunrise.ts` remains the single position owner.
- Navigation across the fixture boundary fired the real `installSunrise()`
  path, and navigation spam did not add a parallel `transitionTheme()` call.
- Manual interruption can desynchronize the scene (finding 1), but the theme
  still followed position: it stayed dark above the passed boundary and became
  light once the boundary was entirely above the viewport.
- `ambient-yield` is a distinct composable pause reason; it does not collide
  with `api`, `user`, `visibility`, `offscreen`, or `controller`.
- The `de0ca69` theme snapshot ownership rule remains structurally intact.
  Swap teardown restores an owning definition's document snapshot before the
  incoming definition captures its own snapshot. No production theme-owning
  scene is routed through `swap()` on this branch.

### State, retention, and ownership

- Existing completion-time retention behavior remains green, including the
  mobile↔desktop cross-root regression.
- Showcase run #142 and the separate Morning approval surface remain isolated;
  no production definition or surface data changed.
- Normal repeated direct-player swaps balance visibility/pagehide listeners and
  observers, retain one timeline/control, and restore inline styles on final
  destruction. The failure is the uncoordinated controller-owned ambient seam,
  not the ordinary direct-player teardown loop.
- The shared installer still creates one `SceneMotionChannel` for all page
  controllers, and the channel's ordinary LIFO restoration tests pass.

## No-production-UI-change proof

- `main...HEAD` changes no production component, production page, authored
  landing scene definition, stylesheet, public asset, or sitemap config.
- The only page files changed are the two noindex, unlinked
  `src/pages/test-fixtures/*` routes. They remain excluded from the sitemap, and
  the built link gate still scans exactly 22 intended internal URLs.
- All pre-existing production E2E files are unchanged and pass in both full
  runs. The static production page therefore retains its reviewed copy,
  canonical DOM, pinned showcase, theatre, sunrise, accessibility, and mobile
  behavior at the currently wired surface.
- Sanctioned shared machinery is eagerly imported by the production scene
  system, so the JavaScript payload does change. A fresh identical measurement
  reports **67,230 gzip bytes (65.654 KiB)** versus main's **65,088 bytes
  (63.563 KiB)**: **+2,142 bytes (+2.092 KiB, +3.29%)**. This remains below the
  90 KiB budget. The implementation plan's checked eager-delta gate is
  reproducible, though no numeric branch report was committed.
- Fixture-specific definitions remain in fixture-only chunks and do not enter
  the landing page's eager request manifest.

## Verification record

| Check                 | Run 1                                                                                        | Run 2                                       | Review result                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm check`          | pass                                                                                         | pass                                        | 9 unit files / 55 tests; type, format/lint, build, token, 156-file safety, and 22-link gates green |
| `pnpm test:e2e`       | pass                                                                                         | pass                                        | 104 tests, exit 0 both clean runs                                                                  |
| E2E process hygiene   | pass left an orphan preview; pre-test retry hit port 4331; process removed; clean run passed | clean shutdown                              | environmental runner issue, not counted as a branch finding                                        |
| Manual-cancel probe   | active `stage-chat` while viewport centered on `stage-org`                                   | reproduced with pointerdown/no later scroll | finding 1                                                                                          |
| Hidden-hold probe     | ambient instantiated `playing` at 170ms while hidden                                         | reproducible                                | finding 2                                                                                          |
| Ambient/swap probe    | beat cut at 86ms; stale ambient marker after host completion                                 | reproducible                                | finding 3                                                                                          |
| Invalid ambient probe | overlapping, zero-delay, 1ms dwell/reset definition accepted                                 | reproducible                                | finding 6                                                                                          |
| Eager JS              | 67,230 B gzip                                                                                | main 65,088 B gzip                          | +2,142 B; budget pass                                                                              |
| Diff/leak hygiene     | `git diff --check` clean; scoped leak grep clean                                             | four coherent capability/docs commits       | pass                                                                                               |

Six pre-existing untracked variant shoot scripts were left untouched and are
excluded from the review commit.

## Fable UI batch risk

**Risk: HIGH; do not build the ribbon buttons, ambient scenes, and Workflow
switcher on these contracts yet.** The current production page remains safe
because none of the APIs is wired there. The next batch would immediately make
the failures reachable: ribbon interruption can desynchronize the chapter,
ambient can move in a hidden tab and lacks a stable shared pause control, and
the switcher cannot truthfully work under reduced motion or when it intersects
controller-owned ambient playback. Fix and regression-gate the four high
findings before UI integration; then close the validator and deterministic-test
gaps so Fable receives a narrow, honest contract rather than compensating in
component code.

---

## Final re-review — remediation commits `31b79f7`, `fdc5299`, `9ed6ee9`, `36afa22`

**Final verdict: BLOCK.** Remaining/new counts: **2 high, 0 medium, 0 low**.

The remediation closes seven findings and the beat-boundary/ownership portion
of finding 3, but it does not close the branch contract. One retained-state seam
still fails at runtime, and the newly strict ambient validator rejects the
amendment's own authored scenes before the Fable batch can instantiate them.

### Must-fix findings

#### 1. HIGH — The validator and handoff make the amendment's exact ambient scenes impossible to register

`validatePlayback()` treats every action row as a separate 5–8 second cadence
event and also includes the dwell/reset wraparound in that cadence
(`scene-validator.ts:230-286`). `HANDOFF-A05.md:395-400` publishes the same
extra “including the wraparound gap” rule. That is not a viable contract for
the actual definitions in `STORYBOARD-AMENDMENT-1.md`:

- Org is rejected because its 13,000ms pulse is authored at 600ms; even if that
  duration were shortened, its specified cycle produces a 12,900ms wrap gap
  from the 20,000ms row through dwell/reset to the 6,000ms row.
- Todos is rejected because its causal state/text pairs at 11,000/12,000ms and
  19,000/20,000ms are one second apart.
- Triggers is rejected because its 7,000ms pulse is authored at 600ms; its
  7,000/7,600/8,000ms causal sequence would then fail row-to-row cadence.

An exact-definition probe returned:

```text
org      Scene "org": ambient beat at 13000ms exceeds the 500ms yield boundary
todos    Scene "todos": ambient beat cadence must stay between 5000ms and 8000ms
triggers Scene "triggers": ambient beat at 7000ms exceeds the 500ms yield boundary
```

The global-law prose and the authored tables are internally inconsistent, but
the machinery handoff cannot silently resolve that by enforcing an
interpretation that rejects all three scheduled ambient scenes. Reconcile the
storyboard and runtime contract explicitly—particularly whether cadence applies
to causal beat clusters rather than every action row and whether dwell/reset is
outside cadence—then gate the exact Org, Todos, and Triggers schedules. The
current evenly spaced fixture at 0/6,000/12,000/18,000ms is a vacuous substitute
for that consumer proof.

#### 2. HIGH — Ambient-to-scripted swap loses completed-host retention and replays from initial state

Ambient start destroys and removes the completed host, then constructs a fresh
ambient `ScenePlayer` (`scene-controller.ts:699-743`). Retention is player-local
(`scene-player.ts:442-464`), so that new player does not inherit either the
destroyed host's retained set or the controller's recorded resolved state. On a
controller-owned ambient swap, `beginAmbientYield()` commits through that fresh
player (`scene-controller.ts:747-761`).

The rAF probe swapped `stage-todos-ambient` back to its already completed
`stage-todos` host both at 100ms and at the 399/400ms boundary. Beat completion
and scheduler cleanup were correct, but the incoming host was immediately:

```text
definition = stage-todos
time = 0
checkpoint = initial
status = playing
```

The handoff instead promises that a retained `play` definition hydrates at its
resolved checkpoint (`HANDOFF-A05.md:475-477`), and the seam requirement says
completion-time retention must remain untouched. The new E2E test
(`scene-controller.spec.ts:426-510`) verifies the boundary and eventual re-arm
but never asserts the incoming host's time/checkpoint, so it passes by waiting
for the unintended replay to complete. Preserve controller retention through
the ambient player handoff and assert `resolved` immediately after commit.

### Original finding disposition

| Original finding                  | Final disposition                                                                                                                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Manual navigation cancellation | **Closed.** Cancellation freezes scroll, derives the centered stage synchronously, resolves crossings, and activates without a later scroll event. The original no-later-scroll probe and a post-sunrise-boundary cancellation both produced centered scene = active scene. |
| 2. Hidden ambient hold            | **Closed.** Remaining delay is pausable and start rechecks document/root visibility, user pause, host completion, and channel ownership. Hidden for longer than 2,000ms instantiated no ambient player.                                                                     |
| 3. Ambient plus swap              | **Partially closed.** Current beat commits within the boundary, ownership/marker cleanup is atomic, direct ambient-ID selection throws before teardown, and re-arm works; retained-host hydration remains broken as finding 2 above.                                        |
| 4. Reduced-motion swap            | **Closed.** Controllers expose a non-null static player; swaps synchronously materialize exact resolved DOM with zero timeline/control/observer runtime.                                                                                                                    |
| 5. Pause control                  | **Closed.** One stable controller-owned button governs scripted playback, the hold, and ambient playback; its identity survives handoffs and pause reasons remain composable.                                                                                               |
| 6. Ambient validation             | **Not accepted as closed.** The missing numeric/registry checks now exist, but their cadence interpretation creates finding 1 above and is not tested against the authored consumers.                                                                                       |
| 7. Deterministic tests            | **Closed for the original races.** The new lifecycle/navigation probes use in-page rAF/state predicates and exact assertions. The retained-checkpoint omission and artificial validator fixture are the remaining coverage defects attached to the two high findings.       |
| 8. Navigation type                | **Closed.** The exported API accepts `PaneKey` only.                                                                                                                                                                                                                        |

### Seam and falsification result

- Navigation spam across the sunrise boundary still uses `src/lib/sunrise.ts`
  as the only theme authority. Manual interruption while Todos was centered
  after the boundary ended `light`, active `stage-todos`, centered
  `stage-todos`, with exactly one dark→light mutation. No second theme path or
  light-above/dark-below split appeared.
- Ambient yield at 100ms committed the 400ms beat before teardown; a request at
  399ms committed cleanly at the same boundary. The ambient marker cleared and
  direct ambient-ID selection failed atomically.
- Hidden, offscreen, user-pause, channel-displacement, reduced-motion, and
  re-arm governance passed. The one shared channel retains LIFO behavior, and
  `ambient-yield` remains distinct from `api`, `user`, `visibility`,
  `offscreen`, and `controller`.
- Three direct-player swap cycles balance visibility/pagehide listeners and
  observers, retain one timeline/control, and restore snapshots on destroy.
  Theme snapshot ownership and the separate showcase/Morning state remain
  unchanged. The controller ambient handoff is the isolated retention failure.

### Final verification record

| Check                                | Run 1                                                   | Run 2                                    | Result                                                                                    |
| ------------------------------------ | ------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm check`                         | pass                                                    | pass                                     | 9 unit files / 59 tests; type, lint/format, build, safety, token, and 22-link gates green |
| `pnpm test:e2e`                      | 108 passed                                              | 108 passed                               | both clean runs, exit 0                                                                   |
| Manual sunrise-boundary interruption | active/centered `stage-todos`, light transition count 1 | repeated by checked-in navigation probes | navigation/sunrise seam pass                                                              |
| Ambient/swap boundary                | 100→400ms commit                                        | 399→400ms commit                         | yield/cleanup pass; incoming retained host incorrectly restarts at 0ms                    |
| Exact storyboard validator probe     | Org rejected                                            | Todos and Triggers rejected              | finding 1                                                                                 |
| Eager JS                             | 68,992 B gzip                                           | main 65,088 B gzip                       | +3,904 B (+3.81%); under 90 KiB                                                           |

No production page, component, scene definition, style, public asset, or sitemap
path changed from main. Only shared scene machinery, handoff documentation,
unit/E2E tests, and noindex fixture routes changed; the production page remains
behaviorally identical at its current wiring. The six pre-existing untracked
variant shoot scripts remain untouched.

## Final Fable UI batch risk

**Risk: HIGH; do not merge or begin the ribbon/ambient/switcher batch yet.**
Ribbon navigation itself is now a sound base, and reduced-motion, pause,
visibility, ownership, teardown, and sunrise seams are materially improved.
But the ambient batch cannot register its exact approved definitions, and an
ambient/switch interaction can replay a retained narrative scene instead of
holding resolved truth. Resolve and exact-gate these two contracts first; the
remaining UI batch risk should then fall to normal integration risk.

---

## Terminal re-review — commits `d9ee78c`, `3279d2f`, `6380f13`

**Final verdict: SHIP-CLEAN.** Remaining findings: **0 high, 0 medium, 0 low**.

Both blocking contracts are now closed under the COO's adjudicated envelope:

- The validator accepts verbatim Org, Todos, and Triggers schedules while
  retaining loud negative gates for the exact 2,000ms hold, positive
  dwell/reset, 10–45 second cycle, serial non-overlap, 400ms start-spacing
  floor, 600ms non-text/theme authoring ceiling, registry ownership, and
  Night/Morning prohibition. The handoff correctly separates the 600ms
  authoring envelope from the runtime's ≤500ms yield deadline.
- Controller-owned swap hydration now consults the completion-time
  `resolvedStates` map after the replacement player commits. Independent rAF
  probes requested ambient → retained-host swaps at 100ms and 399ms; both
  cleared ambient ownership and landed immediately at `1000ms`, `resolved`,
  `completed`, with no 0ms replay. The checked-in E2E now asserts that exact
  retained state before re-arm.

Verification is clean: `pnpm check` passes with 9 unit files / 60 tests, the
targeted verbatim-schedule falsification passes all three approved scripts, and
`pnpm test:e2e` passes all 108 tests. The three remediation commits touch only
shared scene machinery, handoff documentation, and tests; production UI paths
remain unchanged. The six pre-existing untracked variant shoot scripts remain
untouched.

## Terminal Fable UI batch risk

**Risk: NORMAL integration risk.** The ribbon, ambient scenes, and Workflow
switcher can now build on these APIs. Keep the approved definitions as exact
validator fixtures and preserve the existing single-channel, retention,
sunrise-owner, reduced-motion, and teardown gates during UI wiring.

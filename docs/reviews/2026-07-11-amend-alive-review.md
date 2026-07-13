# Amendment “alive” final feature-batch review

**Branch:** `amend-alive` at `1f65a34` · **Base:** `main` at `ed126d6` ·
**Verdict:** **BLOCK** · **Findings:** **5 high, 1 medium, 2 low**

The batch is not ready for the closing taste/browser gauntlet. The shared scene
runtime machinery remains unchanged beyond registry wiring, and the approved
Org and Triggers ambient definitions are faithful. However, the production
consumer bypasses the navigation API for Chat, adds a forbidden observer, and
lets CSS motion escape the one shared channel. Todos and Nightly backup also do
not implement their approved beat tables verbatim despite tests that say they
do.

## Findings

### 1. HIGH — `View Chat` bypasses `navigateToStage()` and ribbon spam desynchronizes scroll from the active scene

`wire-showcase-controls.ts:18-29` special-cases Chat with its own
`window.scrollTo({ top: 0, behavior: "smooth" })`. This directly violates the
capability consumer contract: every ribbon click is navigation through
`navigateToStage(PaneKey)`, consumers must not issue a second `scrollTo`, and
rapid calls must replace the in-flight destination inside the controller.

This is a runtime failure, not only an API-shape objection. From the Employees
stage I dispatched `View Todos`, then `View Chat` one animation frame later.
After scrolling settled, the browser reported:

```json
{
  "scrollY": 0,
  "active": "todos",
  "heroState": "playing"
}
```

The page is at the hero and its loop is playing while the showcase still
declares Todos active. The direct Chat scroll does not cancel/replace the
controller's in-flight Todos destination; `scrollend` force-commits that stale
destination. This breaks the one-source-of-truth law and makes ribbon-spam near
the Morning boundary unsafe even though ordinary controller-owned sunrise
navigation remains green.

The checked-in Chat test (`amend-alive.spec.ts:106-120`) covers only a settled
Todos → Chat trip. It never overlaps ribbon requests or asserts scroll position
equals active narrative state.

### 2. HIGH — The switcher installs a forbidden consumer-owned observer and a second control-state owner

`wire-showcase-controls.ts:71-80` creates a `MutationObserver` on
`data-active-scene` and imperatively rewrites `data-selected`/`aria-pressed` for
every switcher. `HANDOFF-A05.md` explicitly prohibits a second observer or
state machine in a surface consumer; scroll activation and swap lifecycle are
machinery-owned.

The observer is also never disconnected when the controller is destroyed. It
therefore outlives the controller lifecycle and independently owns the visible
selection state. The implementation comment says it owns no state
(`wire-showcase-controls.ts:1-7`), but the observer is exactly the additional
state synchronization channel the handoff forbids.

### 3. HIGH — Todos ambient is not the approved verbatim script and splits single semantic transitions into temporarily dishonest states

The approved §2.3 table has six rows. The implementation has nine beats
(`todos-ambient.scene.ts:79-151`) and materially changes the order and targets:

| Semantic moment   | Approved                                             | Implemented                                                          |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| Start running     | `11000`, 350ms, `card.relnotes.disc`, `set-state`    | text changes at `11000`; disc at `11400`; card state at `11800`      |
| Show session      | `12000`, 300ms, `card.relnotes.exec`, `replace-text` | text is staged at `11000`, then exposed by the later card-state beat |
| Complete          | `19000`, 350ms disc state; `20000`, 300ms text       | disc at `19000`, separate card state at `19400`, text at `20000`     |
| Unblock changelog | `26000`, 350ms, one card state                       | disc at `26000`, card/badge at `26400`                               |

The split creates 400ms intervals where the glyph and card disagree: e.g. the
changelog disc is assigned while the card still displays `Blocked`, and the
release-note disc is done while the card remains executing. That violates both
the exact beat table and the honest-state law; the change is not merely a
component-local presentation of one `set-state` beat.

The test named “authors the todos ambient storyboard verbatim”
(`amend-scenes.test.ts:36-86`) hard-codes this altered nine-beat sequence, so it
protects the divergence rather than the contract.

### 4. HIGH — Nightly backup rewrites the approved cadence and adds copy/actions outside the closed deck

The §2.4 scene must enter trigger/rail/steps at 0ms, then transition at
1200/1800/2400/6400/7000/7600/12600/13100ms and resolve at about 13.5s.
`nightly-backup.scene.ts:86-243` instead adds pane/ribbon highlights, delays the
entrance to 500–800ms, moves the semantic transitions to
1700/2450/2900/6900/7600/8100/13100/13850ms, adds six separate status-text
beats, and resolves at 14.3s.

The canonical model also visibly introduces interim step strings `Running`
and `Queued` (`dashboard.ts:328-366`). The closed §4 deck approves the badge
strings and the three completed step lines, not new interim step-line copy.

As with Todos, the “verbatim” unit test (`amend-scenes.test.ts:152-224`) asserts
the rewritten twenty-beat implementation rather than the nine-row amendment
table. This is a direct script/copy contract failure.

### 5. HIGH — Running spinners escape pause/offscreen governance and create a second page-wide motion channel

The new Todos and Nightly stories enter `executing`/`running` states whose
glyphs spin through independent infinite CSS animations
(`TodosSurface.astro:352-354`, `WorkflowSurface.astro:440-442`). The scene
player and shared pause control govern the GSAP timeline, but not these CSS
animations. New surface transitions at `TodosSurface.astro:223-278` are
similarly outside the player clock.

Two production probes falsified the aliveness laws:

- Desktop Nightly at scene time `3433ms`: clicking the one pause control froze
  scene time at `3433`, but the spinner's `CSSAnimation.currentTime` advanced
  from `516.6ms` to `1166.6ms` over the next 650ms and remained `running`.
- Mobile Nightly after scrolling the flows window offscreen to Triggers: scene
  time stayed frozen at `3419` and player state was `paused`, but the offscreen
  spinner advanced from `550.0ms` to `1200.0ms`, still `running`.

The second case is both a CPU-discipline failure and a concrete two-channel
failure: the offscreen workflows spinner keeps waking while the visible
Triggers scene owns the sanctioned channel. The existing E2E pauses Nightly
only after every step is complete (`amend-alive.spec.ts:218-233`), so it cannot
detect this.

### 6. MEDIUM — Reduced-motion users cannot use the workflow switcher even though `swap()` supports a static resolved handoff

`SceneWindow.astro:552-558` hides the switcher entirely under
`prefers-reduced-motion`. The amendment requires a real keyboard/tap switcher;
the handoff specifically guarantees that reduced-motion `swap()` synchronously
materializes the selected definition's resolved DOM with zero timeline,
observer, control, or ambient runtime.

The consumer discards that supported accessible path instead of allowing the
visitor to choose the resolved Nightly backup proof. The reduced-motion E2E
asserts only that ambient timelines are absent (`amend-alive.spec.ts:323-348`)
and never exercises the switcher/static swap contract.

### 7. LOW — The new tests are deterministic but omit the branch's critical falsification cases

The new E2E uses runtime predicates rather than wall-clock sleeps, which is
good. Its coverage nevertheless misses:

- rapid ribbon replacement including Chat;
- pause/offscreen while a running spinner exists;
- reduced-motion switcher selection;
- exact storyboard tables sourced independently from the implementation.

The mobile target-size assertion also measures the whole switcher group
(`amend-alive.spec.ts:263-276`), not either option. Each button's layout box is
36px high (`SceneWindow.astro:517-540`) and relies on overlapping pseudo-element
hit regions for the claimed 44px target, so the current assertion does not
prove the stated per-option requirement.

### 8. LOW — The §7 mobile screenshot matrix is incomplete

All required desktop aliveness checkpoints are present, and the earlier A-12
matrix contains the brand/meta shots. The amendment matrix omits mobile
`flows.backup-complete` and mobile `window.paused-ambient`, although §7 says
ambient-pane checkpoints are also shot at 390×844. The shoot script stops after
`flows-backup-running-390` and only captures the paused state on desktop.

## Machinery boundary audit

The hard machinery gate itself passes:

- No diff exists in `scene-controller.ts`, `scene-player.ts`,
  `scene-motion-channel.ts`, `scene-validator.ts`, `scene-reducer.ts`, or beat
  ordering/runtime modules.
- `install-scene-system.ts` changes only the landing registry and exports that
  registry for tests.
- The small `types.ts` additions are canonical surface-data fields
  (`initialBadge`, `runRefund`), not changes to scene/controller/player APIs.

The new `wire-showcase-controls.ts` is production consumer wiring. Its direct
scroll and observer are findings 1–2; they are not accepted as machinery
extensions.

## Contract audit outside the findings

- Org ambient matches the approved 6000/13000/20000ms table, 6s dwell, and
  600ms reset.
- Triggers ambient matches the approved 7000/7600/8000ms table, 8s dwell, and
  600ms reset.
- The three scheduled ambient definitions declare their exact 2000ms host
  delay. Night and Morning have no ambient followers.
- Nightly is swap-selected, not directly scheduler-selected; the Morning
  digest remains the default parked `workflow-approval` definition and scroll
  activation restores it.
- Ribbon controls are real labeled buttons outside the decorative
  `aria-hidden` frame and are absent on mobile.
- Run-number grep finds only #139, #140, and #142 in production source.
- No drag gesture or drag-and-drop claim is introduced; Todos movement is
  status-driven.

## Reported `scene-controller.spec.ts:567` flake

I could not reproduce the reported failure:

- focused test with `--repeat-each=10 --workers=1`: **10/10 pass**;
- full E2E run 1: **118/118 pass**;
- full E2E run 2: **118/118 pass**.

The test, its fixture, and all controller/swap machinery are byte-unchanged
from `main`; the test was introduced in the already reviewed capability batch.
It performs three synchronous controller calls in one browser task and polls a
DOM-independent final player ID. There is no evidence this UI batch newly
exposes a timing bug. If the prior report was a real failure, the remaining
plausible class is pre-existing runner/preview contention rather than this
branch's production changes. I assign it no branch severity; retain traces if
it reappears in the closing browser gauntlet.

## Verification record

| Check                          | Result                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `pnpm check` run 1             | pass — 10 unit files / 65 tests, type/lint/build/safety/link gates green      |
| `pnpm check` run 2             | pass — same result                                                            |
| `pnpm test:e2e` run 1          | pass — 118/118                                                                |
| `pnpm test:e2e` run 2          | pass — 118/118                                                                |
| focused line-567 test ×10      | pass — 10/10                                                                  |
| eager JS measurement           | **71,094 B gzip**, exact match to report; below 90 KiB budget                 |
| runtime ribbon-spam probe      | fail — `scrollY=0`, showcase still `active=todos`                             |
| runtime pause probe            | fail — scene frozen, CSS spinner advanced 650ms                               |
| runtime mobile-offscreen probe | fail — player paused, CSS spinner advanced 650ms                              |
| `git diff --check main...HEAD` | clean                                                                         |
| production run-number audit    | only #139/#140/#142                                                           |
| branch privacy leak grep       | clean                                                                         |
| commit scoping                 | eight coherent feature/test/docs commits; no machinery implementation changes |

Six pre-existing untracked variant shoot scripts were left untouched.

## Closing-gauntlet risk

**Risk: HIGH. Do not spend the full-page taste/browser QA pass on this branch
yet.** The closing gauntlet would be evaluating motion and navigation behavior
that is already contractually and demonstrably wrong: ribbon spam can split
scroll from scene state, and pause/offscreen cannot stop all motion. Reconcile
consumer ownership and restore the verbatim Todos/Nightly scripts first; then
rerun the taste pass and browser matrix against the corrected motion model.

---

# Final re-verification — remediation + authorized machinery extensions

**Re-verified branch:** `amend-alive` at `3a25576` · **Original review:**
`5067aaf` · **Verdict:** **BLOCK** · **Current findings:** **2 high, 0 medium,
2 low**

The eight original findings were addressed, and the three post-review machinery
changes are exactly the extensions the COO authorized. The revised branch is
substantially healthier: consumer ownership, scene tables, spinner governance,
reduced motion, hit areas, and the screenshot matrix now pass. Two untested
motion laws still fail on the production page, however. Returning to the
Morning digest visibly reanimates its parked gate, and the swap-selected
Nightly loop is not recognized as ambient when a scripted stage activation asks
it to yield at the current beat boundary.

## Must-fix findings

### 1. HIGH — Returning to Morning visibly replays the gate that must stay absolutely still

The amendment is explicit: run #142's parked gate "stays absolutely still," the
default Morning digest is motionless, and switching back restores it instantly
with no replay (`STORYBOARD-AMENDMENT-1.md:164-175,193-198`). The implementation
restores the correct semantic endpoint, but not a still presentation.

Production falsification at 1440×900:

1. Let `workflow-approval` resolve at its parked gate.
2. Select Nightly backup and wait until its run is in progress.
3. Select Morning digest.

The returned player immediately reports `completed`, `data-scene-time="4100"`,
and `step-gate[data-state="awaiting-approval"]`, yet the gate subtree exposes
eight running CSS transitions. The visible icon state evolves for 300ms:

| Sample  | Queued icon opacity / scale | Approval icon opacity / scale |
| ------- | --------------------------- | ----------------------------- |
| t=0ms   | `1` / `1`                   | `0` / `0.25`                  |
| t=75ms  | `0.346` / `0.509`           | `0.654` / `0.741`             |
| t=175ms | `0.066` / `0.300`           | `0.934` / `0.950`             |
| t=350ms | `0` / `0.25`                | `1` / `1`                     |

This comes from retained hydration changing the restored queued snapshot to the
resolved gate while the surface transitions at
`WorkflowSurface.astro:391-438` remain enabled. The general HANDOFF §10
permission for short derived transitions does not supersede §2.4's specific
"absolutely still" / "instantly (retained, no replay)" law.

The E2E named "restores the parked digest instantly" checks only the final DOM
attributes and timeline time (`amend-alive.spec.ts:289-296`); it never asserts
that the returned default subtree has zero active animations. This is a
must-fix motion-contract failure, not a taste nit.

### 2. HIGH — Nightly backup is a loop in the ambient channel, but scripted activation kills its current beat instead of yielding at the boundary

Section 2.4 defines Nightly backup as a run that "loops as the ambient
channel." The global law requires any scripted activation to let the current
ambient beat commit (at most 500ms) before the loop freezes
(`STORYBOARD-AMENDMENT-1.md:80-84`). The selected Nightly definition is a loop
(`nightly-backup.scene.ts:80-86`) but deliberately has no `ambient.follows`
metadata because it is switcher-selected rather than scheduler-selected.

The controller's yield path only recognizes `definition.ambient`
(`scene-controller.ts:254-263,786-815,826-850`). Consequently, a stage
activation while Nightly is running takes `activateImmediately()`, destroys the
player, and starts the destination without waiting for the beat boundary.

Production falsification during the 2400–2750ms Prune transition:

```json
{
  "before": { "time": 2467, "state": "playing", "step": "running" },
  "activationElapsedMs": 26,
  "after": { "time": 11, "state": "playing", "active": "trigger-fire" }
}
```

At t=2467 the authored 350ms state beat still had roughly 283ms remaining, but
the destination owned the window 26ms later. The page-wide channel does remain
singular—there is no concurrent second player—and pause, offscreen, and reduced
motion governance all pass. What fails is the equally explicit boundary-yield
part of that channel contract. The current tests cover scheduler-owned ambient
yield but never the swap-selected Nightly loop.

## Non-blocking notes

### 3. LOW — The disclosed ARIA reset gap is real but bounded to the switcher's reveal transition

Visible selected styling is correctly derived from `flow-variant` and cannot
desynchronize. There is also no consumer observer. ARIA is reconciled only on
click, focus, pointerover, or the switcher's own opacity transition end
(`wire-showcase-controls.ts:26-83`).

After selecting Nightly, scroll-resetting away and back to Workflows produced:

| Moment after Workflows activation | Variant  | Morning `aria-pressed` | Nightly `aria-pressed` | Opacity |
| --------------------------------- | -------- | ---------------------- | ---------------------- | ------- |
| activation                        | `digest` | `false`                | `true`                 | `0.756` |
| +100ms                            | `digest` | `true`                 | `false`                | `1`     |

A virtual cursor can therefore encounter stale semantics during the short
visible reveal, before `transitionend`; focus and pointer users reconcile before
interaction, and the transition self-corrects without either. I judge this an
acceptable low-severity note for this release rather than a must-fix. The clean
long-term model is machinery-owned ARIA in the swap/reset snapshot, as already
disclosed, not a consumer observer.

### 4. LOW — The checked eager-JS report is stale after the three machinery extensions

The reproducible command now measures **71,266 gzip bytes (69.60 KiB)**, not the
report's **71,094 bytes** (`docs/reports/amend-alive-eager-js.md:17-34`). The
172-byte increase is consistent with the authorized controller/player changes,
and the branch still passes the 90 KiB budget comfortably. The budget claim is
sound; the exact manifest and total should be refreshed before the final record
is called current.

## Original-finding disposition

| Original finding                          | Final disposition                                                                                                                                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 Chat bypass / ribbon desync            | **Closed.** Every button calls `navigateToStage(PaneKey)`; rapid keyboard Chat replacement passed on all three full runs.                                                                                         |
| F2 consumer observer / second state owner | **Closed.** No observer or `data-selected`; visual state derives from machinery DOM. The bounded ARIA note is finding 3 above.                                                                                    |
| F3 Todos non-verbatim / split truth       | **Closed.** Six approved beats, one state owner per semantic moment, exact copy and status-driven presentation.                                                                                                   |
| F4 Nightly cadence / copy divergence      | **Closed for script fidelity.** The approved entrance and 1200/1800/2400/6400/7000/7600/12600/13100ms rows are exact; Addendum 1a authorizes interim details and co-timed text. Boundary yield remains finding 2. |
| F5 spinners escape pause/offscreen        | **Closed.** Desktop pause and mobile offscreen probes freeze spinner animations with the player and resume only through the single control.                                                                       |
| F6 reduced switcher hidden                | **Closed.** Visible stage-local static players swap exact resolved DOM with zero timelines.                                                                                                                       |
| F7 test gaps                              | **Closed for the listed cases.** Rapid Chat, spinner governance, reduced swap, exact tables, and interaction-proven hit areas landed. The tests still miss findings 1–2 above.                                    |
| F8 mobile matrix incomplete               | **Closed.** All 17 amendment shots exist, including mobile backup-complete and paused-ambient.                                                                                                                    |

## Authorized machinery-extension audit

The prior automatic machinery finding does not apply to the three authorized
changes:

- `8ebba57` adds Chat-as-above-range inside the existing navigation
  transaction. Ribbon spam including keyboard Chat ends at `scrollY=0`, the
  hero owns motion, and the showcase releases its claim.
- `41fc1b4` captures and restores only `pane-*` / `ribbon-*` selection across
  `swap()`. Repeated swaps preserve the active Workflows pane without ambient-ID
  selection or a consumer mutation.
- `9784cdc` adds inert reduced stage-local static players plus
  `getPlayerForRoot()`. They instantiate no timelines, observers, controls, or
  channel ownership, and the consumer refuses inactive live players.

No other machinery module changed. `scene-motion-channel.ts`, validator,
reducer, beat ordering, and scene runtime compilation remain byte-unchanged
from the reviewed capability batch.

## Aliveness and behavior audit

- Ribbon controls are real labeled buttons outside the decorative
  `aria-hidden` frame, desktop-only, and issue no consumer `scrollTo`, pane
  mutation, or activation call.
- Ribbon replacement, including Chat, held one source of truth under rapid
  input. The sunrise owner and monotonic morning tests remained green across
  all three runs; no double sunrise or dark reversal surfaced.
- Org, Todos, and Triggers ambient start only after scripted resolution plus
  2000ms, use one page-wide owner, pause offscreen/hidden/user-paused, and are
  absent under reduced motion.
- Night and Morning have no ambient followers. Morning's semantic gate remains
  `awaiting-approval`; its presentation-on-return failure is finding 1.
- Nightly uses the single player/control and obeys pause/offscreen/reduced
  motion, but its scripted-activation boundary yield fails as finding 2.
- Production copy contains only run #139, #140, and #142. Todos introduces no
  drag gesture or drag-and-drop claim.

## Flake-class judgment

The disclosed 124/125 run had no retained artifact, so it cannot be attributed.
This re-verification produced three consecutive clean 125/125 suites. The
formerly reported `scene-controller.spec.ts:567` reset test passed in 71ms,
68ms, and 69ms respectively. Because no spec failed once in this review, the
requested focused-×10 trigger did not fire and no failure artifact existed to
copy aside. Playwright remains configured with `trace: "retain-on-failure"`.

The evidence still supports a runner/preview contention class rather than a
known branch regression. I assign it no finding severity, but the closing
browser run should preserve the first trace before retrying if it recurs.

## Final verification record

| Check                               | Result                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm check`                        | pass — 10 unit files / 65 tests; type, lint, build, safety, and link gates green |
| `pnpm test:e2e` run 1               | pass — 125/125                                                                   |
| `pnpm test:e2e` run 2               | pass — 125/125                                                                   |
| `pnpm test:e2e` run 3               | pass — 125/125                                                                   |
| focused repeat                      | not triggered — no spec failed in any review run                                 |
| Nightly → Morning zero-motion probe | **fail** — eight transitions run for 300ms on the parked gate subtree            |
| Nightly boundary-yield probe        | **fail** — mid-beat destination activation in 26ms, before beat commit           |
| ARIA reset probe                    | low note — stale during reveal; automatically correct by +100ms                  |
| eager JS                            | budget pass at **71,266 B gzip**; exact 71,094 B report is stale by 172 B        |
| amendment screenshot matrix         | pass — 17/17 files present, desktop plus required mobile checkpoints             |
| `git diff --check main...HEAD`      | clean                                                                            |
| production run-number / drag audit  | pass                                                                             |
| machinery scope                     | only the three authorized extensions plus their fixtures/tests/docs              |

Six pre-existing untracked variant shoot scripts remain untouched.

## Closing-gauntlet risk

**Risk: HIGH. Do not merge into the full-page taste pass yet.** The closing
browser QA would immediately be judging a switcher transition that contradicts
the defining silence of run #142, while Nightly still bypasses the ambient
beat-boundary guarantee. Both failures are deterministic and narrowly scoped,
but they sit on the feature's central motion contract. Fix those two paths,
add direct zero-animation and swap-loop-yield assertions, refresh the eager-JS
record, then rerun the closing taste/browser gauntlet. The ARIA and flake items
can remain release notes unless new evidence expands them.

---

# Scoped closure re-verification — `871eabb` + `24a91e0`

**Re-verified branch:** `amend-alive` at `24a91e0` · **Prior review:**
`bd74068` · **Verdict:** **BLOCK** · **Current findings:** **1 high, 0 medium,
2 low**

Both deterministic failures from the prior round are closed. The
player-owned restoration transaction eliminates retained-state presentation
motion, and role-based motion-channel occupancy makes the swap-selected
Nightly loop yield at its exact authored beat boundary. The new role lifecycle
nevertheless regresses the required mobile scroll-reset path: after the
selected loop yields to another stacked window, returning to Workflows leaves
the backup presentation mounted under a completed Morning player and makes the
switcher inert.

## Closed prior findings

### Prior HIGH 1 — Nightly → Morning retained restore motion: CLOSED

`ScenePlayer` now owns `data-scene-restoring` around snapshot restore,
retained seek, and reduced static resolution. The global rule suppresses
descendant CSS transitions/animations only while that internal transaction is
committing; consumers neither manage nor read the marker as state.

The exact production probe now behaves correctly. Starting at Nightly
t=2463ms, selecting Morning waits for the current beat, commits after 334ms,
and returns the resolved gate at `data-scene-time="4100"` with zero active
animations across the commit and next two frames:

```json
{
  "frames": [0, 0, 0],
  "markers": [true, false, false],
  "state": "awaiting-approval",
  "player": "completed",
  "time": "4100"
}
```

The new desktop-retained and reduced-static E2E assertions exercise the same
path. This is a machinery-owned presentation transaction, not a consumer pause
channel, so the original ownership concern is resolved.

### Prior HIGH 2 — Nightly scripted-activation boundary yield: CLOSED

`SceneMotionChannel` now owns the ambient role independently of a definition's
optional scheduler declaration. A swap to a looping alternate marks the active
player as the ambient occupant; controller activation and swap consult that
role, while declared followers still use the scheduler-specific host restore.

The exact production activation probe started at t=2470ms during the authored
Prune beat, observed the old player through t=2754ms, and activated Triggers
after 297ms:

```json
{
  "before": 2470,
  "maxBeforeActivation": 2754,
  "elapsed": 296.8,
  "after": { "active": "trigger-fire", "time": 16, "state": "playing" }
}
```

That is the required 2750ms beat boundary, within the 500ms yield ceiling. The
new fixture E2E and motion-channel unit test encode the role distinction.

## Remaining must-fix finding

### 1. HIGH — A mobile Nightly yield leaves two players on the flows root, so scroll re-entry does not reset to Morning and the switcher is dead

The updated HANDOFF deliberately retains a swap-selected occupant when a
cross-root mobile activation takes the channel (`HANDOFF-A05.md:441-445`). On
return, however, `activateImmediately()` releases but does not destroy a player
whose root differs from the destination (`scene-controller.ts:295-303`), then
looks up a reusable player by **both** narrative definition ID and root
(`scene-controller.ts:306-330`). The retained player on the flows root is still
defined as `nightly-backup`, so it does not match `workflow-approval`; the
controller constructs a second player on that same root.

The new Morning player reaches its retained 4100ms checkpoint, but
`workflow-approval` does not own the `flow-variant` target. Its snapshot was
captured from the retained backup DOM, so the visible root remains
`flow-variant="backup"`. `getPlayerForRoot()` then returns the earlier retained
Nightly player by set insertion order (`scene-controller.ts:192-195`). The
consumer correctly refuses that inactive live player
(`wire-showcase-controls.ts:54-64`), leaving both switcher options inert.

Production falsification at 390×844:

1. Enter mobile Workflows and let Morning resolve.
2. Select Nightly and leave for Triggers during the t≈2469 Prune beat.
3. The loop correctly yields at t=2750 and remains paused offscreen.
4. Re-enter Workflows and attempt to select Morning.

```json
{
  "beforeMorningClick": {
    "variant": "backup",
    "time": "4100",
    "state": "completed",
    "morning": "false",
    "nightly": "true"
  },
  "afterMorningClick": {
    "variant": "backup",
    "time": "4100",
    "state": "completed",
    "morning": "false",
    "nightly": "true"
  }
}
```

This violates both guarantees in the same handoff: a later scroll activation
must reset a swapped surface to the registered narrative definition
(`HANDOFF-A05.md:525-533`), and one stable scene root must have one addressable
player. The full suite remains green because the new selected-loop test is
desktop-only; existing mobile tests either use scheduler followers or leave a
Nightly spinner offscreen without re-entering and operating that flows window.

## Low notes carried forward

- The disclosed switcher ARIA reset remains a bounded reveal-transition note;
  these commits do not expand it.
- The eager-JS budget still passes, now at **71,441 gzip bytes (69.77 KiB)**.
  The checked 71,094-byte report is stale by 347 bytes after the authorized
  machinery work.

## Scoped verification record

| Check                                     | Result                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm check`                              | pass — 10 unit files / 66 tests; type, lint, build, safety, and link gates green           |
| `pnpm test:e2e`                           | pass — 126/126                                                                             |
| retained Morning animation probe          | pass — `[0,0,0]`, resolved gate static                                                     |
| desktop t≈2467 boundary probe             | pass — old player reaches 2750ms boundary before activation                                |
| mobile selected-loop leave/re-enter probe | **fail** — returns as backup under completed 4100ms Morning player; Morning click is inert |
| eager JS                                  | budget pass — 71,441 B gzip; exact report remains stale                                    |
| implementation scope                      | two focused machinery commits plus tests and HANDOFF documentation                         |

Six pre-existing untracked variant shoot scripts remain untouched.

## Final closing-gauntlet risk

**Risk: HIGH. Do not merge yet.** The two requested fixes work on their direct
paths, but the new cross-root occupant lifecycle breaks the mobile Workflows
reset and its only real control after ordinary leave/re-entry. Resolve the
one-player-per-root/reset handoff and add the missing mobile selected-loop
round-trip assertion; then the branch is ready for the taste/browser gauntlet.

---

# Cap-round final re-verification — `c3e55f7`

**Re-verified branch:** `amend-alive` at `c3e55f7` · **Prior review:**
`454e4e0` · **FINAL verdict:** **SHIP-WITH-NITS** · **Current findings:**
**0 high, 0 medium, 2 low**

The remaining high finding is closed. SceneController now makes the scene root
the player-ownership key, rejects a second registration loudly, and reconciles
a parked swap-selected definition back to the registered narrative definition
before retained hydration. The exact production round trip and the repeated
fixture falsification both pass. No must-fix finding remains.

## Closed prior finding

### Prior HIGH — Mobile selected-loop re-entry created two players and an inert switcher: CLOSED

`SceneController.players` is now a `Map<HTMLElement, ScenePlayer>` rather than
a definition-and-root-scanned set. Every construction path registers through
the same guarded helper, and every replacement/destruction path unregisters
the exact current owner. `getPlayerForRoot()` is therefore unambiguous by
construction. During mobile narrative activation, a parked player whose
definition differs from the stage registration is recorded, released,
unregistered, and destroyed before the retained narrative player is created
and sought.

The ownership audit covered normal stage activation, reduced static players,
scheduler ambient replacement, beat-boundary yield teardown, failed ambient
claim cleanup, and whole-controller destruction. The diagnostic
`data-scene-root-player-count="1"` mirrors internal ownership; consumers do not
set or interpret it as control state. The amended HANDOFF documents the same
root-keyed invariant and narrative-re-entry lifecycle.

The exact 390×844 production path now passes:

1. Resolve Workflows, select Nightly, and leave during the Prune beat.
2. Activate Triggers after the authored boundary yield.
3. Re-enter Workflows and recover Morning digest at retained t=4100.
4. Observe exactly one player and one timeline; focus reconciles Morning's
   `aria-pressed`, and both Nightly and Morning remain operable.

The five-cycle fixture falsification also passes with one root owner, one
timeline, no extra playback control, and the narrative player addressable on
every return. The reduced-motion round-trip remains covered by the full suite.

## Notes retained, not must-fix

- **LOW — bounded ARIA reveal gap.** A virtual-cursor read without focus or
  hover can still encounter stale `aria-pressed` between scroll reset and the
  first perceivability event. Visible state remains a pure machinery-DOM/CSS
  derivation, and there is no second observer or state machine. This remains an
  acceptable accessibility note for this batch; machinery-owned ARIA would be
  the clean long-term closure.
- **LOW — stale exact eager-JS report.** The deterministic current total is
  **71,580 gzip bytes (69.90 KiB)**, comfortably below the 90 KiB budget, but
  `docs/reports/amend-alive-eager-js.md` still records 71,094 bytes. This is an
  evidence freshness nit, not a runtime or budget failure.

## Final verification record

| Check                                     | Result                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| root-keyed ownership / destruction audit  | pass — all player construction and teardown routes use the guarded root map     |
| exact mobile Nightly leave/re-enter probe | pass — digest at t=4100; one player/timeline; live switcher and reconciled ARIA |
| five-cycle selected-loop re-entry probe   | pass — one player/timeline and addressable narrative owner on every return      |
| `pnpm check`                              | pass — 10 unit files / 66 tests; type, lint, build, safety, and links green     |
| `pnpm test:e2e`                           | pass — 128/128                                                                  |
| eager JS                                  | budget pass — 71,580 B gzip; checked exact report remains stale                 |
| working tree hygiene                      | six pre-existing untracked variant shoot scripts untouched                      |

## Final closing-gauntlet risk

**Risk: LOW. Merge is clear for the full-page taste pass and browser QA.** The
previous deterministic motion, yield, and mobile ownership failures now have
direct passing coverage, and the complete static/unit/browser gates are clean.
The closing gauntlet should concentrate on cross-browser visual taste and the
bounded ARIA timing note; retain the first Playwright trace if the previously
non-reproducing contention-class flake appears.

---

# Closing taste-gauntlet review — `gauntlet-taste`

**Reviewed branch:** `gauntlet-taste` at `7bde010` · **Base:** `main` at
`ae6d539` · **Verdict:** **SHIP-WITH-NITS** · **Scoped findings:** **0 high,
0 medium, 2 low**

The full-page taste pass stays inside its authorized presentation lane, both
machinery fixes close the deterministic N1/N2 failures, and every required
gate is clean. No must-fix finding remains. The two lows are housekeeping: one
duplicate CSS declaration and a 63-byte stale exact eager-JS manifest.

## Machinery verification

### N1 — ribbon navigation destination lost at the activation boundary: CLOSED

`navigateToStage()` now treats geometric arrival and scene commitment as one
controller transaction. A `scrollend` event cannot force an early commit: the
controller first verifies the target offset, explicitly activates the intended
stage, and preserves binding suppression through the following animation
frame. Rapid replacement and manual-interruption paths continue to use the
same navigation owner.

The focused production probe passed all five hero routes (Chat plus the four
showcase destinations) and all twelve directed stage-to-stage pairs. Both full
E2E runs repeated that coverage along with rapid input, keyboard Chat return,
manual-scroll cancellation, crossed-stage resolution, and the sunrise owner.
No destination was replaced by a boundary callback.

### N2 — sunrise resumed an install-time Morning player: CLOSED

`installSunrise()` now retains the Morning controller, not a player handle, and
resolves `getActivePlayer()` at fire time. The initial gate still applies to
the install-time owner, while fire releases whichever player the controller
currently owns after a mobile lifecycle replacement. No other shipped
install-time player capture exists.

Adversarial evidence:

- the deterministic replacement test passed ten replacements per run across
  ten focused repeats: **100/100** live players received exactly one `api`
  resume;
- the taste report's mobile fast-scroll geometry produced a live, advancing
  Morning player **30/30** times instead of the prior permanent initial state;
- ten longer production repeats all reached the authored `approved` checkpoint
  at approximately t=4.77s;
- both complete 130-test browser runs repeated the replacement, monotonicity,
  no-banked-peek, deep-link, and approval-state coverage.

## Taste-lane and fidelity audit

- Commits `bf7ab68`, `35fe87b`, `3c649c3`, and `263d242` change only CSS,
  component composition, and presentation-only avatar fields. They do not
  alter scene definitions, beats, checkpoints, cadence, scheduler ownership,
  pause channels, or consumer wiring.
- The deck remains closed. No visible copy string changed; the verbatim hero,
  stage, theatre, back-half, and canonical surface serialization tests pass in
  both full runs.
- Honest-state disc changes are presentation derived from the existing
  canonical statuses: assigned remains neutral, executing is blue, blocked is
  orange, completed is green, and started runs are blue. DOM state and
  canonical data still serialize identically on desktop and mobile.
- The five avatar values exactly match the real app's current deterministic
  `emojiForName` results: Jimbo 🌈, Analyst 🎪, Writer 🪐, Dev 🦞, and Designer
  ⚔️. They remain inside the decorative scene frame and introduce no accessible
  copy. Chromium, Firefox, and WebKit all render the glyphs at the intended
  geometry; repeated Firefox captures ruled out an initial headless compositor
  capture artifact.
- The twelve after-state screenshots and five before-state screenshots are
  present and match the report's desktop/mobile matrix. The top-anchored hero,
  unified kicker treatment, pane anchoring, state colors, mobile theatre
  spacing, and workflow trigger placement read coherently without contract
  drift.

## Scoped findings

### 1. LOW — duplicate mobile Todos padding declaration

`TodosSurface.astro:497-498` repeats the same
`padding-top: var(--space-4)` declaration in one rule. It is behaviorally
inert and does not affect the screenshots or layout, but it is avoidable taste
commit residue.

### 2. LOW — exact eager-JS evidence trails the two machinery fixes by 63 bytes

The deterministic branch total is **71,643 gzip bytes (69.96 KiB)**, safely
below the 90 KiB budget. `docs/reports/amend-alive-eager-js.md` still records
main's 71,580-byte total, so its exact manifest is stale by 63 bytes. The
budget claim remains true; only the exact evidence needs a later refresh.

The previously accepted bounded switcher-ARIA note is inherited unchanged
from main and is not rescored against this scoped diff.

## Verification record

| Check                                    | Result                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| N1 focused destination probe             | pass — 5 hero destinations plus all 12 directed stage pairs                 |
| N2 focused replacement probe             | pass — 100/100 live replacements resumed exactly once                       |
| N2 production fast-scroll probe          | pass — 30/30 live; 10/10 longer runs reached `approved`                     |
| `pnpm check`                             | pass — 10 unit files / 66 tests; type, lint, build, safety, and links green |
| `pnpm test:e2e` run 1                    | pass — 130/130                                                              |
| `pnpm test:e2e` run 2                    | pass — 130/130                                                              |
| trace retention                          | enabled (`retain-on-failure`); no failure produced an artifact              |
| canonical copy / DOM serialization       | pass in both browser runs                                                   |
| Chromium / Firefox / WebKit emoji sanity | pass                                                                        |
| `git diff --check main...HEAD`           | clean                                                                       |
| working tree hygiene                     | six pre-existing untracked variant shoot scripts untouched                  |

## Browser-QA handoff risk

**Risk: LOW. Merge is clear for the browser-QA station.** The two reported
machinery failures are now directly and repeatedly falsified, while the taste
changes preserve the deck, timeline semantics, honest-state data, and reduced
motion. Browser QA should concentrate on real-device typography/emoji texture
and whole-page feel; neither scoped low is runtime-significant.

# A-05–A-07 → A-08 Handoff

**Tasks A-05 scene data/reducer · A-06 `ScenePlayer` · A-07 orchestration ·
2026-07-10**

This is the implementation contract for A-08 dashboard surfaces and the later
scene-authoring batches. Read it with `TECH-PLAN.md` §3,
`HANDOFF-A04.md`, `STORYBOARD.md` §3/§7, and
`STORYBOARD-AMENDMENT-1.md`.

The shipped layering is:

1. `SceneWindow` + surface components render the resolved semantic state.
2. `scenes/landing/*.scene.ts` describe targets, beats, checkpoints, and
   playback without selectors or GSAP.
3. `ScenePlayer` validates one scene root and compiles one GSAP timeline.
4. `SceneController` chooses the active scene for desktop, mobile, and reduced
   motion.

A-08 owns layer 1 for Org, Todos, Workflows, and Triggers. It must preserve the
contracts below so the later definitions can attach without restructuring the
surfaces.

---

## 1. Scene registration

The browser entry point is `src/lib/scenes/install-scene-system.ts`. Its
definition registry currently contains only `delegation`:

```ts
import { delegationScene } from "../../scenes/landing/delegation.scene";

const definitions = new Map<string, SceneDefinition<ChatSceneState>>([
  [delegationScene.id, delegationScene],
]);
```

When a scripted scene lands, import its definition here and add exactly one
entry keyed by its `definition.id`:

```ts
import { employeesScene } from "../../scenes/landing/employees.scene";

const definitions = new Map<string, SceneDefinition<ChatSceneState>>([
  [delegationScene.id, delegationScene],
  [employeesScene.id, employeesScene],
]);
```

The `data-scene-id` on a stage must equal that registered ID exactly.
Definitions are validated again when a player is constructed. A missing
definition, missing window, missing target, duplicate target, invalid state
transition, overlapping text action, invalid easing, unbounded pulse, or loop
without dwell/reset fails loudly.

Call `installSceneSystem()` once per page. Do not construct an extra
`ScenePlayer` beside it and do not add a second installer call in a surface.
Tests may pass a definition map to `installSceneSystem(definitions)`; production
uses the built-in registry.

### Discovery and page-wide ownership

Discovery is inclusive. The installer starts every `[data-scene-controller]`
and every standalone `[data-scene-window][data-scene-id]` that is not nested in
a controller. Nested shared/mobile windows belong to their controller and are
not double-registered. The current standalone hero therefore remains live when
A-08 adds a separate staged showcase.

All discovered controllers receive one shared `SceneMotionChannel`. A claim
over a non-looping, non-advancing, or static owner remains synchronous: the
channel pauses the previous page-wide owner with the composable `controller`
pause reason before the destination may advance. A claim over an actively
advancing, non-ambient loop is a deferred ownership transaction instead: the
incoming player remains `controller`-paused while the outgoing player commits
its current authored beat through `yieldAtBeatBoundary()` (at most 500ms), then
the channel transfers ownership and removes the yield reason from the parked
outgoing player. Exactly one player advances throughout.

Rapid loop claims coalesce to the latest still-live claimant. Every claim and
release updates the channel's shared eligibility stack immediately; when the
outgoing beat settles, ownership is chosen from the then-current stack rather
than from the claimant that happened to be latest when yielding began. A
superseded claimant stays eligible for LIFO restoration until its root releases
its claim, so releasing a newer claimant before or after transfer cannot strand
the still-visible player in `controller` pause. Releasing and reclaiming the
outgoing root while its yield is pending follows the same settlement rule and
does not cut the beat. Ambient-role occupants keep their existing
controller-owned yield path, and reduced/static players never enter this
asynchronous path. Consumers must only call `claim()`/`release()`; they must not
pre-pause the outgoing loop, resume the incoming player, await a guessed
timeout, or maintain parallel visibility or ownership state.

Channel eligibility and scheduler wake state are deliberately distinct. LIFO
restoration can make an offscreen or document-hidden player the active owner,
but its `offscreen`/`visibility` pause reason remains authoritative, so it does
not advance and the shared GSAP ticker may stay asleep; clearing that final
pause reason notifies the channel through the registered player status and
wakes the ticker. If an advancing loop goes offscreen while a beat-boundary
handoff is pending, scheduler idling does not cancel the transaction: the
bounded yield still settles, then the channel re-reads live eligibility and
wakes only the eligible incoming player. Static/reduced players register for
lifecycle symmetry but never wake the ticker or enter deferred yielding.

Ownership follows visibility, not controller lifetime. When a staged
controller leaves its pinned range in either direction, or a mobile stage is no
longer active, it releases its claim. The channel then restores the most recent
still-mounted claimant and removes only that player's `controller` pause
reason; its own playback policy and other pause reasons still decide whether it
can advance. This is what lets reverse scroll from the showcase resume the hero
loop without creating a second timeline.

---

## 2. Declarative orchestration hooks

All target lookup is scoped to the actual scene-window root. Repeating target
names across desktop/mobile windows is valid; repeating a target twice inside
one root is an error.

| Hook                                | Contract                                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `[data-scene-controller]`           | One orchestration region. Multiple regions are allowed; the installer shares one page-wide motion owner.       |
| `[data-scene-pin]`                  | Desktop-only element ScrollTrigger pins through the stage range. Do not place it under a transformed ancestor. |
| `[data-scene-stage][data-scene-id]` | A semantic story section. The ID selects its registered scene. Stage order is narrative order.                 |
| `[data-scene-shared-window]`        | The one persistent desktop scene-window root used by every stage.                                              |
| `[data-scene-mobile-window]`        | The stage-local window used below 900px. It remains in normal document flow.                                   |
| `[data-scene-window]`               | A `ScenePlayer` root. All of that definition's targets and `[data-scene-controls]` live inside it.             |
| `[data-scene-frame]`                | Decorative frame animated during quiet resets; remains `aria-hidden="true"`.                                   |
| `[data-scene-controls]`             | Non-decorative host for real pause and future switcher/ribbon controls.                                        |
| `[data-target="…"]`                 | Stable component-local target whose value exactly matches a definition target ID.                              |

Minimal output-level structure:

```html
<div data-scene-controller>
  <div data-scene-pin>
    <figure data-scene-window data-scene-shared-window>
      <div data-scene-frame aria-hidden="true">
        <!-- All five persistent panes and their scene targets. -->
      </div>
      <div data-scene-controls></div>
    </figure>
  </div>

  <section data-scene-stage data-scene-id="delegation">
    <!-- Hero/stage copy. -->
    <figure data-scene-window data-scene-mobile-window>
      <div data-scene-frame aria-hidden="true">
        <!-- Resolved delegation markup + complete delegation targets. -->
      </div>
      <div data-scene-controls></div>
    </figure>
  </section>

  <section data-scene-stage data-scene-id="employees">
    <!-- 01 / Employees copy. -->
    <figure data-scene-window data-scene-mobile-window>
      <div data-scene-frame aria-hidden="true">
        <!-- Resolved Org markup + complete employees targets. -->
      </div>
      <div data-scene-controls></div>
    </figure>
  </section>
</div>
```

`SceneWindow.astro` does not yet expose `shared`/`mobile` orchestration props or
arbitrary attribute forwarding. Add a small typed prop for those roles when
the real controller markup lands; the marker must be on the element passed to
`ScenePlayer`, not on an unrelated page wrapper.

Desktop (≥900px) uses the shared window, pins only when more than one stage is
registered, and activates stages discretely in both scroll directions. Mobile
(<900px) never pins; an `IntersectionObserver` activates the stage-local
window. Keep the ribbon/sidebar DOM available if a definition targets it even
when mobile CSS visually cuts it—the player does not silently ignore missing
`highlight` targets.

The working multi-stage reference is
`src/pages/test-fixtures/scene-controller.astro`; inclusive discovery is proven
by `src/pages/test-fixtures/scene-system.astro`. Both are noindex, unlinked,
excluded from the production sitemap, and must not be copied into the real page
as placeholder content.

---

## 3. Surface and target authoring contract

- Render the **resolved** state at build time. JavaScript may prime the initial
  state only after `html[data-motion="ok"]` exists. No-JS and reduced-motion
  visitors must see the complete proof.
- Surface components map semantic state (`executing`, `done`,
  `awaiting-approval`, progress, presence) to Ledger tokens. They do not know
  timestamps, easings, scroll position, GSAP, or controller state.
- Put every target needed by the scripted resolved state in both its desktop
  shared-window pane and its mobile window. Targets must remain mounted for
  the whole scene; hide or restyle them rather than replacing the target node.
- Keep `ribbon-<pane>` and `pane-<pane>` hooks and their boolean
  `data-active` state. Scene `highlight` actions move that state; surfaces must
  not create a second pane-selection state machine.
- Use `data-state`, `data-progress`, and `data-active` for semantic visual
  variants. The player snapshots and restores those attributes plus `style`
  and `hidden` during teardown.
- Canonical strings/state belong in `lib/scenes/dashboard.ts` or a focused
  canonical surface-data module, not duplicated between Astro markup and a
  scene definition. Keep reducer-resolved state and SSR data comparable.
- Keep fake dashboard chrome non-focusable inside `[data-scene-frame]`.
  Visible transcripts/captions remain outside the decorative a11y tree. Real
  controls belong in `[data-scene-controls]`.
- Use the nine existing semantic actions only: `type-text`, `replace-text`,
  `enter`, `exit`, `set-state`, `set-progress`, `highlight`, `pulse`, and
  `theme`. Definitions contain no selectors, DOM queries, callbacks, or GSAP.
- `set-state` commits semantically at the beat start (`beat.at`), even when its
  duration overlaps a later transition. The exact `initial` checkpoint remains
  the authored pre-timeline state, so a state beat authored at 0ms commits on
  the first positive timeline tick. Validator ordering, checkpoint reduction,
  and DOM scheduling all consume the shared rule in `scene-beat-order.ts`; do
  not reimplement transition ordering in a surface or player extension.
- `set-progress` animates its visual custom property through the beat, then
  commits `data-progress` at the shared completed-beat commit time. Forward
  playback and reconstructed seeks therefore expose the same semantic value
  as the reducer, while surfaces may consume the custom property with a
  compositor-only scale transform.

The generic `ChatSceneState` currently carries `targetStates`, `progress`,
`highlights`, and `theme` for later surfaces despite its historical name. If a
surface needs richer semantic data, extend/specialize the state types and pure
reducer deliberately; do not encode presentation in those fields or bypass
the reducer with DOM-only state.

The dashboard pane data models both authored initial and resolved semantic
values (`initialPresence`, `initialStatus`, `initialDetail`,
`initialProgress`, and `initialExec`). Reusable surface chrome reads both
states from that canonical module; later workflow swaps must replace data, not
embed narrative strings in Astro markup.

---

## 4. `ScenePlayer` API and invariants

Construction:

```ts
const player = new ScenePlayer(sceneRoot, definition);
```

Public API:

| API                  | Behavior                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `currentTime`        | Current timeline time in integer milliseconds.                                                                            |
| `currentCheckpoint`  | Latest named checkpoint at the current time.                                                                              |
| `isPlaying`          | True only while a live, non-completed timeline is advancing.                                                              |
| `isCompleted`        | True after a once scene reaches its resolved endpoint.                                                                    |
| `status`             | `waiting`, `playing`, `paused`, `completed`, `static`, or `destroyed`.                                                    |
| `onStatusChange(fn)` | Immediately reports status, then reports exact lifecycle changes; returns an unsubscribe function.                        |
| `play()`             | Clears pause reasons and starts from 0. Use for an explicit fresh play, not routine visibility recovery.                  |
| `pause(reason?)`     | Adds `api`, `user`, `visibility`, `offscreen`, or `controller`; ambient scheduling owns the internal `ambient-yield`.     |
| `resume(reason?)`    | Removes only that reason; playback resumes only when no reasons remain.                                                   |
| `restart()`          | Restores the initial scene state, clears pause reasons, and restarts.                                                     |
| `seek(milliseconds)` | Clamped deterministic seek; rebuilds DOM/theme from the captured snapshot before replaying to the requested time.         |
| `enter()`            | Applies `playback.entry`: restart a revisited `restart-on-enter` scene, or retain a completed `play` scene.               |
| `swap(sceneId)`      | Fully tears down the current definition and deliberately initializes a registered definition on the same root.            |
| `destroy()`          | Kills the timeline, observers, listeners, and control; restores the captured SSR DOM and removes runtime data attributes. |

Invariants:

- One definition compiles to exactly one GSAP timeline. Beats are not separate
  timelines.
- Pause reasons compose. In particular, returning to a visible tab must not
  override a user pause; `resume("visibility")` removes only the visibility
  reason.
- Controller-owned players are constructed with `{ autoplay: false }`; only
  the shared motion channel removes their `controller` pause reason. Direct
  standalone `ScenePlayer` construction still autoplays by default.
- A once scene ends in honest `completed` state with `isPlaying === false`.
  Its lifecycle signal records retention before arming an ambient follower.
- `seek(t)` is bidirectional: `enter`, `exit`, `set-state`, `highlight`, text,
  progress, and theme effects are reconstructed rather than left as stale
  forward callbacks. The debug scrubber uses this same path.
- Document-theme ownership is explicit: a definition owns theme only when it
  declares `initialState.theme` or contains a `theme` beat. Only owning players
  snapshot and restore the document theme during `seek()`/`destroy()`;
  non-owning players never alter document-level theme lifecycle state.
- A standalone looping player requires `[data-scene-controls]` and receives one
  ≥44px button labeled exactly `Pause animation` / `Play animation`.
  Controllers with an ambient follower instead own one stable button for the
  whole window; its DOM identity survives scripted playback, the delay, and
  ambient handoffs.
- Looping scenes hold their resolved state for `dwellMs`, then perform a
  whole-frame `quietResetMs` fade. Never hand-reset target nodes with a snap.
- Missing or duplicate DOM targets fail at construction and are scoped to the
  supplied root.
- `pagehide` and explicit `destroy()` restore resolved SSR markup and remove
  inline styles/listeners. New surfaces must not depend on player-generated
  inline styles after teardown.
- Under reduced motion or absent `html[data-motion="ok"]`, no GSAP timeline,
  observer, listener, timer, or pause control is instantiated. The selected
  definition is synchronously reduced into exact resolved DOM.

---

## 5. `SceneController` API and invariants

Construction/startup:

```ts
const controller = new SceneController(controllerRoot, definitions);
await controller.start();
```

Public API:

| API                          | Behavior                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `start()`                    | Binds breakpoint/page lifecycle, chooses desktop/mobile/reduced mode, starts the active player, and mounts the development overlay.   |
| `getActivePlayer()`          | Returns this controller's active player; another controller may currently hold the page-wide channel.                                 |
| `getPlayerForRoot(root)`     | Returns the player bound to that exact controller-owned scene root, including inert reduced-mode stage-local players, or `null`.      |
| `getSceneState(sceneId)`     | Returns a clone of a recorded reducer-resolved semantic state (skipped or completed retained scene), or `null` when none is recorded. |
| `activate(sceneId, seekTo?)` | Activates a registered scene in the correct shared/mobile root and optionally seeks it.                                               |
| `navigateToStage(paneKey)`   | Smooth-scrolls the desktop pinned story to that pane's stage, suppresses transit activation, and resolves skipped stages.             |
| `destroy()`                  | Kills ScrollTriggers/observers, destroys every player, removes listeners/debug UI, and clears controller runtime attributes.          |

Controller invariants:

- Each scene root owns zero or one player, keyed by root rather than by
  definition. Registration on an occupied root throws; the diagnostic
  `data-scene-root-player-count="1"` mirrors that ownership and is not consumer
  state.
- Exactly one player may be in `playing` state across the page. Previously
  visited mobile players and players in other controllers may remain
  instantiated, but retain the `controller` pause reason.
- ScrollTrigger callbacks coalesce to their final destination once per frame.
  Every stage crossed in either direction is resolved with the pure reducer,
  recorded by `getSceneState()`, and never has a timeline constructed merely
  because the visitor skipped over it.
- Desktop stage changes destroy/rebuild the player on the shared root so a new
  definition never inherits old target styles or listeners.
- When a once scene with `entry: "play"` emits its completed lifecycle status,
  its resolved state is recorded independently of root or channel ownership
  and later hydrated directly at its resolved checkpoint. Shared-root teardown
  keeps a defensive recording path. A force-resolved skipped `play` scene
  consumes the same record on first entry; `restart-on-enter` scenes
  deliberately ignore it and replay from initial. This completion-time rule is
  load-bearing for the amendment's ambient one-channel policy: yielding to a
  different root must never be the event that decides whether retention exists.
- Breakpoint changes kill and rebuild only the orchestration bindings when
  safe, preserving active scene/time and avoiding duplicate timelines. Moving
  into or out of reduced motion performs full player teardown.
- ScrollTrigger is loaded only for a non-reduced desktop controller with
  stages. Scrolling remains native; activation is discrete and never hijacks
  wheel/touch input.
- Mobile windows activate on viewport entry in normal flow and reuse their
  existing player when its definition still matches the stage narrative. If a
  prior visit left a swap-selected definition parked on that root, re-entry
  destroys it before constructing/hydrating the retained narrative player;
  duplicate players, listeners, timelines, and ambiguous
  `getPlayerForRoot()` results are impossible by construction.
- Reduced staged controllers retain the shared static player for compatibility
  and also construct one inert static player per mounted stage-local mobile
  window. These players bind no timeline, listener, observer, control, or
  channel claim; consumers address one explicitly with `getPlayerForRoot()`.
- `pagehide` performs full cleanup. The controller also ignores stale async
  ScrollTrigger imports after a breakpoint generation changes.

The installer owns the page-wide motion channel. Directly constructing a
controller without passing a channel creates a private channel for isolated
tests/embeds; production code must continue through the one installer.

---

## 6. Amendment capability usage contract

The three amendment machinery capabilities are shipped. The next UI session
may wire real controls to them, but must not add another pane-selection,
playback, timer, or motion-ownership state machine.

### Capability 1 — `SceneController.navigateToStage(paneKey)`

Signature:

```ts
controller.navigateToStage(paneKey: PaneKey): void;
```

The controller resolves the `PaneKey` only through each registered stage
definition's `initialState.pane` (`org` → `employees`, `flows` →
`workflow-approval`, and so on). The one deliberate non-stage destination is
`chat`: when no Chat stage is registered, it means above the pinned range at
`scrollY = 0`. Stage IDs and arbitrary strings are not part of this API. On a motion-capable desktop controller with at
least two stages and `[data-scene-pin]`, the call smooth-scrolls to the
stage's `top center` activation offset. Scroll position remains authoritative:
ScrollTrigger callbacks are suppressed during transit, crossed stages are
reducer-resolved only when the destination settles, and only the final stage
activates. Arrival is committed only after the browser reaches the requested
offset (a `scrollend` event is not itself proof of arrival), then the controller
explicitly activates the requested stage while retaining transit suppression
through the following animation frame. This prevents activation-boundary
callbacks queued by the final scroll event from replacing the destination.

Rapid calls replace the in-flight destination. A wheel, touch, pointer, or
scroll-navigation key stops the programmatic scroll and, in the same
transaction, derives the centered stage from the resulting viewport, resolves
every crossed stage, and activates that stage. This reconciliation does not
depend on a later scroll event. Calling the current pane at its settled offset
is a no-op. The method is also a no-op below 900px, under
reduced motion, on destroyed controllers, and on non-pinned/single-stage
controllers; an unknown pane on an eligible controller throws before
scrolling.

Chat-to-top uses the same suppress/replace/manual-cancel transaction as a
stage destination. When it settles, every crossed stage is reducer-resolved
and the showcase releases its page-wide claim through the upward pinned-range
exit; it never force-activates a stale in-range destination. If a controller
does register a Chat stage, normal stage resolution takes precedence.

Consumer rules:

- call this method from the real ribbon button; do not call `activate()`, set
  `data-active`, or mutate pane visibility from the click handler;
- keep `data-pane`, stage definition `initialState.pane`, and
  `[data-scene-stage]` identity aligned;
- put the buttons in `[data-scene-controls]`, outside
  `[data-scene-frame][aria-hidden="true"]`;
- do not issue a second `scrollTo` or wait on a guessed timeout. The method is
  intentionally `void`, and scroll/scene DOM state is the completion signal.

Native scroll events also drive `src/lib/sunrise.ts`. A navigation that passes
the Morning boundary therefore fires the one page-level sunrise exactly like
wheel scroll, an anchor, restoration, or any other route; consumers must never
call the theme transition themselves.

The sunrise owner retains the Morning controller, never an install-time player
handle. It gates the current player when installed and resolves
`getActivePlayer()` again at the instant the position rule fires, so a mobile
rebuild between installation and sunrise releases the live player rather than
a destroyed predecessor. Consumers must not cache a Morning player across a
controller rebuild or add a second pause gate around the sunrise.

### Capability 2 — ambient scheduling

Definition signature:

```ts
interface SceneDefinition {
  ambient?: {
    follows: string;
    startDelay: number;
  };
}
```

An ambient definition must use `playback.mode: "loop"`, name a different
registered non-ambient host on the same surface and pane, and declare exactly
`startDelay: 2000` plus positive `dwellMs` and `quietResetMs`. The enforceable
authoring envelope is derived from the approved Org, Todos, and Triggers
scripts: total cycle (resolved checkpoint + dwell + reset) is 10–45 seconds,
beats are serial, beat starts are at least 400ms apart, and non-text/theme
motion is at most 600ms so the approved pulse beats remain valid. Runtime
handoff is independently capped at 500ms, so a 600ms authored pulse is sought
to its boundary rather than delaying scripted ownership. A controller permits
one ambient follower per host. Validation rejects missing hosts, duplicate
followers, and ambient declarations on `night` and `morning` surfaces; those
sections remain strictly silent.

The host's `completed` lifecycle first records reducer retention, then arms a
pausable delay. Time accrues only while the pane is onscreen, the document is
visible, the stable window control is not user-paused, and that host owns the
page-wide motion channel. The loop starts only if all of those predicates still
hold. Any scripted activation cancels a pending delay. If ambient is already
moving, it completes the current beat within
500ms, adds the distinct internal `ambient-yield` pause reason, restores the
host's original DOM snapshot, and only then permits scripted initialization.
Re-entering an active pane whose retained scripted host is resolved arms the
loop again.

Yield authority belongs to the current `SceneMotionChannel` occupant role, not
to the definition's optional `ambient` declaration. Scheduler-started followers
enter that role through `claimAmbient()`; a controller-owned `swap()` to a
looping alternate on the active surface (for example, the selected backup run)
marks the same player as the ambient occupant until it swaps back to a scripted
definition or releases the channel. Consequently either kind of occupant
finishes and freezes at the exact current beat boundary (never later than
500ms) before a scripted activation or scripted swap commits. The declaration
continues to mean scheduler ownership only; consumers must not add synthetic
`ambient.follows` metadata to switcher-selected loops.
After a cross-root mobile activation, a swap-selected occupant remains
instantiated and paused in its own offscreen window, exactly like another
visited player. Re-entering that window is a narrative stage activation, so the
controller reconciles the root back to its registered scene through the same
single-player teardown/retention path; a same-root activation does likewise.
Only a declared scheduler follower uses the special destroy-and-restore-host
handoff.

Ambient uses the same installer-owned `SceneMotionChannel` on desktop and
mobile. It can replace only its own active completed host and never preempts a
different scripted owner; release restores the prior eligible claimant in LIFO
order. The controller-owned pause button moves between the desktop and mobile
`[data-scene-controls]` slots without replacement and governs scripted
playback, the delay, and ambient playback. `user`, `visibility`, `offscreen`,
and `controller` remain distinct pause reasons. Under reduced motion the
controller never constructs the ambient player, observer, control, timer, or
timeline.

Consumer rules and failure modes:

- register the scripted and ambient definitions in the same map passed to the
  one page installer; direct controllers create private channels and are not a
  valid page-wide setup;
- mount every ambient target in both the desktop shared root and its mobile
  root, and keep DOM semantic attributes equal to canonical scene data;
- do not create a second pause button, timer, CSS animation, observer, or
  channel claim in a surface;
- do not call `swap()` with an ambient definition ID. Ambient selection is
  scheduler-owned and the controller rejects direct selection before teardown;
- missing hosts, duplicate followers, invalid policies, missing/duplicate
  targets, or missing loop controls fail loudly during controller/player
  initialization.

### Capability 3 — `ScenePlayer.swap(sceneId)`

Construction and signature:

```ts
const player = new ScenePlayer(root, initialDefinition, {
  definitions,
});

player.swap(sceneId: string): void;
```

Controllers already pass their shared registry. A directly constructed player
must pass `options.definitions` if it will swap; without it, only the initial
definition is registered. Calling the current ID or calling after `destroy()`
is a no-op. An unknown ID, invalid definition, missing/duplicate target, or
missing loop-control host throws before the outgoing runtime is touched.

A successful swap pre-validates the destination, records a completed
`once`/`entry: "play"` definition as retained, then kills the outgoing timer,
yield request, observer, visibility/pagehide listeners, control, and sole
timeline. It restores the outgoing local DOM and owned document-theme
snapshot, resolves the incoming target set, captures a new snapshot, mounts
exactly one new runtime, and preserves external `onStatusChange` subscriptions
plus `api`, `user`, `visibility`, `offscreen`, and `controller` pause reasons.
The internal `ambient-yield` reason is not carried across.
The outgoing root's pane selection (`data-active` across `pane-*` and
`ribbon-*` targets) is captured before snapshot restoration and reapplied only
after incoming initialization/retention hydration. The destination therefore
does not need compensating zero-time pane or ribbon highlight beats.

When the player is controller-owned, `swap()` is also controller-aware. A swap
requested while that player occupies the motion channel's ambient role is
prevalidated immediately, then queued until the current beat commits (≤500ms);
only then does the same player perform the teardown/reinitialization and clear
ambient ownership. This applies equally to a declared scheduler follower and a
swap-selected looping alternate. A second
scripted activation still wins through the page-wide channel. Direct selection
of a registered ambient definition throws because ambient start/re-arm belongs
exclusively to the scheduler.

When a retained `play` definition is swapped back in, it hydrates directly at
its resolved checkpoint. For controller-owned ambient playback, this decision
comes from the controller's completion-time retention map rather than the
replacement ambient player's private history, so ambient → host never replays
a previously resolved host from 0ms. Snapshot restoration, retained seeks, and
reduced static resolution run inside the player-owned
`data-scene-restoring` transaction. The marker exists only for the synchronous
DOM application and its commit frame; the global governance rule disables CSS
transitions and animations beneath that root so hydration is an instant state
replacement, never an unowned replay. Consumers must not set, clear, style, or
use this internal marker as application state.

A definition swapped out before completion replays, and `restart-on-enter`
always replays from its authored initial state. Reduced motion performs the
same definition/snapshot handoff, exposes the selected
static player through `getActivePlayer()`, and synchronously applies exact
resolved DOM without a timeline, listener, observer, control, or ambient
runtime. The initial reduced-motion load preserves the already canonical
static-first SSR DOM; the first successful swap materializes the selected
definition's resolved truth. A later scroll activation of the stage always
resets a swapped surface to the registered narrative definition.

Consumer rules:

- keep one stable scene root and one `[data-scene-controls]` slot; call
  `getActivePlayer()?.swap(sceneId)` from the real segmented control;
- for a switcher inside a visible reduced stacked window, call
  `getPlayerForRoot(windowRoot)?.swap(sceneId)`; never fall back to the hidden
  shared player or construct a consumer-owned player;
- keep every candidate definition's target host mounted and source all
  semantic copy/state from canonical data. `swap()` reinitializes the scene
  runtime; it does not render a new surface model for the consumer;
- do not mutate `player.definition`, construct a second player, retain
  references to outgoing controls/timelines, or manually remove inline styles;
- keep the default SSR/narrative workflow as Morning digest parked at its
  human gate. The backup scene must never hydrate its state into the separate
  Morning approval surface.

---

## 7. Development debug overlay

`SceneController.start()` dynamically imports `scene-debug.ts` only when
`import.meta.env.DEV` is true. In `pnpm dev`, each controller mounts a fixed
overlay containing:

- active timeline time in milliseconds;
- active named checkpoint;
- play/pause;
- restart;
- a millisecond scrubber whose maximum follows the scene's `resolved`
  checkpoint.

Use it on the real page to inspect authored checkpoints; use the fixture only
for orchestration mechanics. The controls call the public player API, so they
exercise the same pause/restart/seek behavior as tests.

The module and `scene-debug.css` are tree-shaken from production. Do not import
either directly from a surface or global stylesheet, and do not make
production behavior depend on `[data-scene-debug]`.

---

## 8. Delegation wiring A-08 must not break

The hero is the proof that all four layers agree:

- `Hero.astro` calls `installSceneSystem()` and renders
  `<SceneWindow sceneId="delegation">` with `ChatSurface`.
- `install-scene-system.ts` registers `delegationScene`.
- `delegation.scene.ts` targets exactly `composer-input`, `msg-user-1`,
  `thread-typing`, `msg-coo-1`, `chip-analyst`, `chip-writer`, and
  `msg-coo-2` inside that root.
- `dashboard.ts` is the canonical source for both `delegationInitial` and
  `delegationResolved`; the reducer's final state equals the shipped resolved
  data, and Playwright asserts DOM equals that data.
- The scene holds its resolved SSR proof for a 1200ms entrance delay, resolves
  at 5900ms, dwells for 5000ms, and quiet-resets over 600ms. Typing cadence is
  deterministically jittered with longer punctuation hesitation. Its loop is
  Chat's future ambient behavior; never add a second Chat ambient loop.
- The pause button must stay in `[data-scene-controls]` with the exact labels
  `Pause animation` / `Play animation`.
- `[data-scene-frame]` stays decorative and `aria-hidden`; the caption stays
  available to assistive technology.
- `html[data-motion]` remains the pre-paint authority. No-JS/reduced motion
  must keep the resolved conversation, hide the typing indicator, and create
  zero timelines.
- Keep the single page-level icon sprite. Duplicated desktop/mobile windows
  reference it; they do not render additional symbol IDs.

When moving the hero into the multi-stage controller, preserve its entrance
choreography and fold crop, but make `delegation` the first registered stage
and mark the persistent figure `[data-scene-shared-window]`. Remove or relocate
the existing installer call rather than invoking it twice. Re-run the exact
hero copy, DOM==data, one-timeline, pause continuity, reduced-motion, no-JS,
and cleanup tests after that structural move.

---

## 9. A-08 completion checklist

- Four faithful surface components render from canonical semantic data at
  1440 and 390 in both themes.
- The desktop shared window and every mobile scene root contain one exact
  instance of every target required by their registered definition.
- All five pane/ribbon hooks retain their stable names and `data-active`
  semantics.
- Mobile visually removes ribbon/sidebar without removing required target DOM.
- Internal fake controls remain outside the tab order; real-control hosts stay
  outside the decorative frame.
- Resolved SSR, visible caption, no-JS, and reduced-motion states communicate
  the proof without animation.
- No surface owns playback timers, GSAP, ScrollTrigger, pane navigation, or
  ambient scheduling.
- Scene registration is centralized and installer/controller ownership is
  page-wide, not duplicated per surface.
- Unit/e2e target lookups are scoped to their scene root and verbatim copy
  contracts use exact assertions.
- `pnpm check`, `pnpm test:e2e`, production debug grep, eager-JS budget, and
  staged privacy leak-grep are green before commit.

---

## 10. Amendment-batch consumer clarifications (2026-07-11)

Recorded during the "alive" batch review remediation; these clarify, not
change, the shipped contracts.

- **Swap restores the SSR pane.** `swap()` restores the outgoing player's
  snapshot, captured at that player's initialization — before its highlight
  beats ran. The window's `ribbon-*`/`pane-*` `data-active` therefore
  regresses to the SSR pane on every swap. Until a machinery ruling on pane
  continuity across swap, a swap-selected definition must open with its own
  ribbon/pane highlight beats at `t=0` (see the amendment Addendum 1a).
- **No consumer observers — derive, don't mirror.** Real-control chrome
  (the workflow switcher's selected segment) must derive from
  machinery-owned DOM (`[data-target="flow-variant"][data-state]`) via CSS;
  ARIA state is written only in the control's own event handlers (click,
  its own `transitionend`), reading machinery DOM truth at that moment.
  A `MutationObserver` on controller/player attributes is a second state
  channel and is forbidden.
- **CSS animation governance.** Any continuous CSS animation inside a scene
  window (running/executing spinners) must pause when its window's player
  is not playing:
  `[data-scene-window]:not([data-scene-player-state="playing"])` +
  `animation-play-state: paused`. One-shot CSS transitions triggered by
  player-committed attribute changes are sanctioned and settle to the
  committed value (≤500ms, mirroring the beat-completion rule).

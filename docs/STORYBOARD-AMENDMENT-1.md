# jinn.run — Storyboard Amendment 1: Aliveness + the Genie

**Phase A refinement · Creative direction (jinn-designer, Fable 5) · 2026-07-10**
**Responds to:** `OPERATOR-NOTES.md` 2026-07-10 (directives 1 + 2).
**Reads with:** `STORYBOARD.md` (unchanged — this file is the delta) and
`TECH-PLAN.md` §3. Implementation reads both documents.

Product-truth checks performed against the real app source before writing
this spec:

- `packages/web/src/routes/todos/` — the Active view is a **status-column
  board** on desktop; cards relocate between columns when their **status
  changes**. There is **no drag-and-drop** in the todos surface.
- `packages/web/src/components/emoji-favicon.tsx` — the real app already
  renders **🧞 (U+1F9DE) as its default favicon**. The genie is not a
  marketing invention; it is the product's own mark.

---

## 1. Interaction model verdict: HYBRID — scroll is the spine, the ribbon is chapter navigation, ambient loops are the life

Scroll-only leaves the operator's directive unmet (the window reads as a
film, not a product); click-only destroys the page's greatest asset — the
run-#142 narrative that scroll order tells. The hybrid resolves both, but
only if there is **one source of truth**: clicking a ribbon icon does not
swap the pane directly — it **smooth-scrolls the page to that stage's
activation offset**, and the SceneController activates the scene exactly as
if the visitor had scrolled there. The ribbon becomes a table of contents
for the story, not a second state machine beside it. By construction the
narrative can never desync: the pin never releases out-of-band, the stage
head copy beside the window always matches the pane, reverse jumps follow
the existing reverse-scroll replay rules, and when the visitor resumes
scrolling they are already exactly where the story says they are.
Exploration happens _inside_ the narrative frame — you click to a chapter,
its scripted beat plays, and then the pane's **ambient loop** keeps the
company visibly working for as long as you care to watch. That dwell-and-
watch state is the operator's "look what you can do with jinn" moment.

Resolved tensions, explicitly:

- **Clicking ahead of the story** — the pin holds; the page scrolls; the
  destination scene activates; intermediate stages are skipped (their
  scenes are force-set to `resolved`, matching the fast-scroll rule the
  controller already needs). Narrative re-sync is automatic because the
  scroll position moved, not just the pane.
- **Pinned stages vs free exploration** — no separate "explore mode."
  Free exploration = jumping between chapters + unlimited ambient dwell on
  any of them. The story order remains the default reading.
- **Mobile (stacked windows)** — the ribbon is already cut below 900px
  (STORYBOARD §5); there is nothing to click and nothing changes about
  navigation. Aliveness still arrives in full: each stacked window runs its
  pane's ambient loop after its entry scene resolves (while in viewport).
  The one tap-affordance added on mobile is the workflows switcher (§2.4),
  a real ≥44px control.
- **After the pin releases** (sections 6+) the window has scrolled away;
  ribbon navigation is a pinned-range behavior only.

The ribbon items are therefore promoted from decorative chrome to **real
`<button>` elements** — keyboard-focusable, labeled (`View Todos`, …),
living in the same non-aria-hidden layer as the pause control. This is a
scoped amendment to the HANDOFF-A04 §5 zero-focusable rule: the rule now
reads "zero focusable elements inside the _decorative_ chrome — the
ribbon and the controls slot are real controls." The sessions sidebar and
composer remain decorative and non-focusable.

---

## 2. Ambient aliveness spec

### 2.0 Global ambient laws

These govern every ambient loop; each loop below is a normal scene
definition with `loop` playback plus the `ambient` scheduling policy
(capability request 2, §5).

1. **Sequencing** — an ambient loop starts only after its pane's scripted
   scene reaches `resolved`, plus a **2000ms hold** of stillness (the
   resolved state is the point of the scene — guardrail #10 — the visitor
   reads it before the pane breathes again).
2. **One channel page-wide** — only the **active pane's** ambient loop
   runs. A scripted activation (scroll or ribbon-nav to any stage)
   immediately yields the channel: the current ambient beat completes
   (≤500ms), then the loop freezes. It re-arms when its pane is active
   and scripted playback has resolved again.
3. **Cadence** — ambient beats are **5–8s apart**; each beat's motion is
   ≤500ms; a full cycle is 25–40s ending in a **6s dwell** and the hero's
   established **600ms quiet fade-reset** (never a snap). One thing moves
   at a time _within_ the loop, always.
4. **Controls + a11y** — the window's pause control governs scripted AND
   ambient motion. Ambient pauses offscreen, on `visibilitychange`, and is
   **never instantiated under reduced motion** (the resolved static state
   stands). Ambient beats are decorative repetition of already-captioned
   behavior; captions do not change.
5. **Honest-state law applies without exception.** Every ambient beat is a
   state transition the real product performs. Running = blue spinner,
   done = green check, waiting = bell/clock. No beat may exist only to
   look busy.
6. **Vocabulary** — every beat below uses the approved eight verbs.
   **Vocabulary requests: none.** (Card relocation on status change is the
   todos surface's _presentation_ of `set-state` — a FLIP move the surface
   owns, exactly as the disc crossfade is the presentation of
   `set-state` today. No new verb.)

### 2.1 Chat — `delegation` (hero)

**No new ambient scene.** The hero already loops with a 5s dwell and pause
control — the loop _is_ chat's aliveness, and it stays the page's only
scripted loop. When a visitor ribbon-navigates back to the hero stage, the
loop replays per its existing policy. Adding a second motion layer to the
busiest pane would break guardrail #1 for nothing.

### 2.2 Org — `org-ambient`

Presence is the org chart's heartbeat, and presence dots are already
sanctioned continuous state (guardrail #8). The loop tells a true micro-
story: the Dev's session (visible in the sidebar: `Deploy checklist · Dev`)
comes alive, works, and goes quiet.

Initial state = `employees` resolved (all seated; analyst + writer active).

| t (ms) | dur | target   | action      | detail                                  |
| ------ | --- | -------- | ----------- | --------------------------------------- |
| 6000   | 300 | node.dev | `set-state` | presence → `active` (green dot enters)  |
| 13000  | 600 | node.coo | `pulse`     | one soft amber wash — the COO checks in |
| 20000  | 300 | node.dev | `set-state` | presence → `idle` (dot exits)           |

Cycle ~26s + 6s dwell + fade-reset. Three beats, long silences — the chart
reads as a quiet office, not a switchboard.

### 2.3 Todos — `todos-ambient` (the operator-named beat)

**⚠️ Drag-and-drop flag (decision + open question for the operator):** the
real app has **no drag-and-drop** on the todo board — cards move between
status columns because their _status changes_ (system- or review-driven).
Scripting a hand-drag would show a feature the product does not have and
violate the honest-state law, so this loop scripts **status-driven
movement**: cards enter, change state, and physically relocate in the
ledger when their status group changes — which is exactly what the real
board does, and gives the kinetic "cards moving" feel the operator asked
for. **If drag-and-drop ships in the product later, this loop upgrades to
script it.** Question routed to Jimbo/operator: is board drag on the
product roadmap, or is status-driven motion the permanent truth?

The loop is one honest micro-story that also pays off an existing card:
the release notes the changelog todo is blocked on get written.

Initial state = `todos` resolved (four cards; #142 done · reviewed).

| t (ms) | dur | target             | action         | detail                                                                                                                       |
| ------ | --- | ------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 5000   | 400 | card.relnotes      | `enter`        | new card rises in at top: `Draft release notes for v0.24` · Dev · assigned (grey disc) — existing cards FLIP down one slot   |
| 11000  | 350 | card.relnotes.disc | `set-state`    | `assigned → executing` (blue spinner enters — honest running blue)                                                           |
| 12000  | 300 | card.relnotes.exec | `replace-text` | exec line → `Session · release-notes · Open`                                                                                 |
| 19000  | 350 | card.relnotes.disc | `set-state`    | `executing → done` (spinner → green check)                                                                                   |
| 20000  | 300 | card.relnotes.exec | `replace-text` | → `Done · reviewed by Jimbo`                                                                                                 |
| 26000  | 350 | card.changelog     | `set-state`    | blocked badge clears → `assigned` (the block is resolved — cause and effect on screen); card FLIPs to its new group position |

Cycle ~32s + 6s dwell + fade-reset to the resolved ledger. The fade-reset
is a whole-pane crossfade (hero pattern), so no card ever visibly "un-
completes."

### 2.4 Workflows — the switcher + `nightly-backup`

Run #142's parked gate is narrative-critical and **stays absolutely still**
— ambient motion on the waiting gate would read as nagging and would
foreshadow the morning payoff. The operator's "one or two switchable
workflows" becomes the pane's aliveness instead:

The pane header gains a **real segmented switcher** (two options:
`Morning digest` · `Nightly backup`), mounted in the non-decorative
controls layer, ≥44px hit areas, keyboard-accessible (capability
request 3). Default = `Morning digest` (the scripted `workflow-approval`
scene, retained parked state, motionless). Selecting `Nightly backup`
swaps the surface to the `nightly-backup` scene — a complete, gate-less
run that loops as the ambient channel:

Header: `Nightly backup · Run #139 · round 1`, blue `Running` badge.
Trigger chip: `⚡ Every night · 02:00`. Three step cards: Snapshot
database / Prune old snapshots / Verify integrity.

| t (ms) | dur | target              | action         | detail                                      |
| ------ | --- | ------------------- | -------------- | ------------------------------------------- |
| 0      | 400 | flow.trigger + rail | `enter`        | chip, then steps L→R 90ms stagger           |
| 1200   | 350 | step.snapshot       | `set-state`    | `running → done`; status → `Completed · 4s` |
| 1800   | 400 | rail                | `set-progress` | fill to step 2                              |
| 2400   | 350 | step.prune          | `set-state`    | `queued → running` (blue spinner)           |
| 6400   | 350 | step.prune          | `set-state`    | `running → done`; status → `Completed · 3s` |
| 7000   | 400 | rail                | `set-progress` | fill to step 3                              |
| 7600   | 350 | step.verify         | `set-state`    | `queued → running`                          |
| 12600  | 350 | step.verify         | `set-state`    | `running → done`; status → `Completed · 2s` |
| 13100  | 250 | run.badge           | `set-state`    | `Running → Completed` (green)               |

Cycle ~13.5s + 8s dwell on `Completed` + fade-reset. This is the fiction's
own run #139 (the overnight feed already reports it completed at 02:31) —
the switcher lets the visitor replay it. Switching back to
`Morning digest` restores the parked state instantly (retained, no
replay). Scroll-activating the stage always resets the switcher to
`Morning digest` so the narrative beat is never hidden.

### 2.5 Triggers — `triggers-ambient`

The scripted scene proved the cron; the ambient proves the webhook — the
second binding fires, exactly the way the feed says it did overnight.

Initial state = `trigger-fire` resolved (cron fired; run #142 row present).

| t (ms) | dur | target          | action      | detail                                                     |
| ------ | --- | --------------- | ----------- | ---------------------------------------------------------- |
| 7000   | 600 | binding.webhook | `pulse`     | one amber wash — the firing                                |
| 7600   | 250 | binding.webhook | `set-state` | → `fired` (disc amber; label `fired · 03:05 today` enters) |
| 8000   | 350 | run.row-refund  | `enter`     | `↳ run #140 started — Refund review` slides in beneath     |

Cycle ~14s (incl. lead-in silence) + 8s dwell + fade-reset to resolved
(cron fired state persists through reset; only the webhook beats reset).

### 2.6 Night feed + morning approval — deliberately NOT alive

The overnight feed and the approval card are the page's theatre; guardrail
#7 demands silence around them. They keep their `once` / retain behavior
with zero ambient. Aliveness is a property of the five product panes in
the showcase window, where "a working company" is the claim being proven.

---

## 3. The 🧞 logo

The genie is already the product's mark — the app ships 🧞 as its default
favicon today. The landing adopts it the same way the app does: as a
**typographic glyph, not a drawn logo**. The amber rounded square dies
everywhere it exists (nav brand mark, footer brand mark, any favicon/OG
draft that used it). The amber _accent_ survives untouched — the Install
pill, the H1 period, and the accent washes are color, not mark.

- **Nav + footer brand mark** — the raw 🧞 emoji glyph, rendered by the
  platform's own emoji font, ~20px, optically baseline-aligned beside the
  `jinn` wordmark (nudge ≈2px down; verify per §6 shot). No plate, no
  background, no border — the emoji sits directly on the page the way the
  period sits in the headline. Platform-to-platform variance is accepted
  _by design_: an Apple visitor sees the Apple genie, exactly as they will
  in the product. That is native-feeling, and it is honest.
- **Favicon** — primary: SVG favicon containing a single `<text>` emoji
  glyph (platform-rendered, matching the in-app `emoji-favicon.tsx`
  behavior). Fallback (Safari and PNG-only contexts): static 32/64px PNGs
  rasterized from **Noto Emoji's** genie artwork. ⚠️ **Licensing rule:**
  shipped raster assets must never be rasterized from Apple's emoji font —
  Apple's artwork is not licensed for redistribution and this repo is
  public. Noto is Apache/OFL and safe. `apple-touch-icon` (180px): Noto
  genie centered on a `--bg` (dark Ledger) rounded-square tile — the tile
  is an iOS platform convention, not the amber square returning.
- **OG image (1200×630)** — crafted once, dark Ledger: `--bg` field, Noto
  genie glyph small (≈96px) above the `jinn` wordmark, headline
  `Run your own AI company.` with the amber period, eyebrow line beneath
  in mono tertiary. Quiet-ember, no window screenshot (it dies at small
  sizes).
- **Hero and page body** — the genie does **not** appear in the hero, the
  headline, section kickers, or anywhere else. One mark, used twice (nav,
  footer), plus the metadata surfaces. A genie repeated across a calm page
  stops being a mark and starts being a sticker.

---

## 4. Copy deck deltas

Additions to STORYBOARD §6 ("no other text" law now covers these). All
strings product-true and generic.

**Todos ambient** — new card: `Draft release notes for v0.24` / owner
`Dev` / exec lines `Session · release-notes · Open` and
`Done · reviewed by Jimbo` (reused pattern). Changelog card after unblock:
badge text `Blocked` is removed; card reads as assigned (no new string).

**Workflows switcher + backup run** — switcher segments: `Morning digest`
· `Nightly backup`. Pane header: `Nightly backup · Run #139 · round 1`;
badges `Running` / `Completed` (existing). Trigger chip:
`Every night · 02:00`. Steps: `Snapshot database / Completed · 4s`,
`Prune old snapshots / Completed · 3s`, `Verify integrity / Completed ·
2s`. Switcher a11y label: `Choose workflow`.

**Triggers ambient** — webhook fired label: `fired · 03:05 today`; run
row: `↳ run #140 started — Refund review`.

**Ribbon a11y labels** (now real buttons): `View Chat`, `View Org`,
`View Todos`, `View Workflows`, `View Triggers`.

**Meta** — no copy change; favicon/OG asset swap only.

Run-number ledger (fiction consistency): #139 Nightly backup (overnight,
replayable via switcher) · #140 Refund review (webhook) · #142 Morning
digest (the spine). No other run numbers may appear.

---

## 5. Scene/capability requests (exactly three)

Everything else in this amendment compiles to the existing TECH-PLAN §3
machinery (scene definitions, loop/once policies, the eight verbs, pause
rules). Three controller/runtime capabilities are new:

1. **`SceneController.navigateToStage(paneKey)` — pointer-driven stage
   navigation.** Ribbon buttons call it; it programmatically smooth-scrolls
   to the target stage's activation offset, suppressing intermediate scene
   activations in transit (skipped stages are force-set to `resolved`,
   same as the fast-scroll rule). Scroll position remains the single
   source of truth; desktop pinned range only; no-op below 900px.
   _Justification: the entire hybrid verdict hangs on click = navigation,
   not click = pane mutation. One API, no second state machine._

2. **Ambient scheduling policy.** A scene definition may declare
   `ambient: { follows: '<scene-id>', startDelay: 2000 }`: the controller
   auto-starts it (loop playback) after the host scene resolves, yields it
   to any scripted activation (finish current beat ≤500ms, freeze,
   re-arm), enforces the one-channel-page-wide rule, and wires it to the
   window pause control, offscreen/visibility pausing, and the
   reduced-motion kill-switch. _Justification: aliveness is the operator's
   directive on four panes; without a controller-level policy each pane
   would hand-roll identical (and divergent) scheduling._

3. **In-pane scene switcher.** A real segmented control in the window's
   non-decorative controls layer that swaps which scene definition plays
   on one surface (`ScenePlayer.swap(sceneId)` with full teardown of the
   outgoing scene's inline styles/listeners). Used once: the workflows
   pane (`workflow-approval` ⇄ `nightly-backup`). Scroll activation of the
   stage resets the switcher to the narrative scene. _Justification: it is
   the only honest way to show "switchable workflows firing" (operator's
   words) without animating the parked gate the morning section must
   resolve._

No new timeline verbs. No new surfaces beyond A-08's planned five panes
(the backup run reuses the workflow rail surface with different data).

---

## 6. Guardrail amendments (STORYBOARD §7)

Two guardrails are amended under the operator's aliveness directive; the
rest stand unchanged and apply to ambient beats in full.

- **#1 "One thing moves at a time" — amended scope, same law.** The
  motion budget now spans scripted _and_ ambient channels: page-wide, at
  most one channel animates, and within it one beat at a time. Ambient
  runs only in the active pane, only after scripted resolution + 2s hold,
  and yields instantly to any scripted activation. ("Alive" is achieved
  by _patience_ — long-cadence single movements — not by concurrency.)
- **#8 "Pulses are bounded" — amended exception list.** Sanctioned
  continuous motion is now: the hero loop, app-faithful presence dots,
  and **declared ambient loops** — each of which must obey the §2.0 laws
  (5–8s beat cadence, ≤500ms motions, dwell + quiet reset, pause control
  governance, offscreen pause, absent under reduced motion). Individual
  `pulse` beats remain 1–2 cycles then still, ambient included.

---

## 7. QA checkpoint deltas

New named checkpoints (all shot at 1440×900; ambient panes also at
390×844 stacked; dark theme — the showcase range is dark by design):

| Checkpoint                           | State                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `org.ambient-peak`                   | dev node active, mid-cycle (t≈14s)                                                                  |
| `todos.ambient-entered`              | release-notes card entered, ledger FLIPped (t≈6s)                                                   |
| `todos.ambient-unblocked`            | changelog card unblocked, relnotes done (t≈27s)                                                     |
| `flows.switcher-rest`                | switcher visible, Morning digest parked (must equal old `parked` shot except the switcher chrome)   |
| `flows.backup-running`               | Nightly backup selected, step 2 running                                                             |
| `flows.backup-complete`              | run #139 Completed badge, dwell state                                                               |
| `triggers.ambient-fired`             | webhook fired + run #140 row present                                                                |
| `ribbon-nav.jump`                    | after `navigateToStage('todos')` from hero: stage 3 head + todos pane active at `ledger` checkpoint |
| `window.paused-ambient`              | pause control engaged mid-ambient: frame frozen at a beat boundary                                  |
| `brand.nav-dark` / `brand.nav-light` | 🧞 + wordmark baseline alignment, both themes (nav crosses the sunrise)                             |
| `meta.favicon` / `meta.og`           | rendered favicon assets (SVG + PNG fallback) and the 1200×630 OG composition                        |

Plus two behavioral assertions (e2e, not screenshots): reduced-motion
serves zero ambient timelines (resolved statics only); ribbon buttons are
focusable with correct labels while the decorative chrome still contains
zero focusable elements.

---

## 8. Rollout order (incremental, per constraint)

1. **A-08 as planned** — the four remaining surfaces, scripted scenes
   only. Nothing in this amendment blocks it.
2. **Brand swap** (independent, small): nav/footer 🧞, favicon set, OG.
3. **Capability 1 + ribbon promotion** — ribbon-nav lands; page is
   hybrid-navigable with zero ambient yet.
4. **Capability 2 + ambient scenes**, one pane at a time, order:
   triggers → org → todos (each is an isolated scene file + screenshots).
5. **Capability 3 + `nightly-backup`** — the switcher last; it is the
   only piece with new interactive chrome.

Each step ships independently reviewable with its checkpoint shots.

---

## Addendum 1a — post-review clarifications (jinn-designer, 2026-07-11)

Issued by the amendment's author after the 2026-07-11 feature-batch review;
these are design-office rulings, not implementation licenses.

**§4 deck delta (backup step interim details).** The §2.4 step cards carry a
status line before completion: `Running` on the active step (the real app's
exact `nodeStatusLine` string for a running node) and `Queued` on waiting
steps (already in the base deck's workflow vocabulary). The completed lines
remain `Completed · 4s / 3s / 2s` as approved. No other interim strings are
sanctioned.

**§2.4 status-line serialization.** The table's `status →` annotations are
implemented as `replace-text` beats co-timed with their state rows — the
same serialization the approved `workflow-approval` scene uses for
`step-draft-status` / `step-gate-status`. They are the rows' presentation,
not additional semantic moments.

**§2.4 swap-opening highlights — RESOLVED.** The machinery now preserves
pane selection across `swap()` (`41fc1b4`); the interim `t=0` ribbon/pane
highlight beats have been deleted and the scene matches the approved table
exactly. Reduced-motion visitors also get the switcher: reduced stage-local
players (`9784cdc`) let `swap()` materialize the selected run's resolved
proof statically.

**§2.3 single-owner states.** The six approved rows are implemented one
action per semantic moment. All card-level visuals (session line, badge,
waiting-reason, contextual disc) are the surface's derived presentation of
the row's one owned state — never a second attribute flip.

# Amendment "alive" review remediation

**Branch:** `amend-alive` · **Responds to:**
`2026-07-11-amend-alive-review.md` (BLOCK — 5 high, 1 medium, 2 low) ·
**Author:** jinn-designer, 2026-07-11.

Per-finding disposition. Machinery remains byte-unchanged; two findings
require machinery work and are reported to the COO for scoped authorization
rather than papered over with consumer bookkeeping.

## Finding 1 (HIGH) — CLOSED (machinery `8ebba57` + consumer follow-up)

`navigateToStage("chat")` now resolves "above the pinned range" inside the
one navigation transaction (suppress/replace/manual-cancel; upward claim
release). The ribbon wiring routes every pane — Chat included — through the
API; the KNOWN-BROKEN marker is gone. New deterministic e2e covers rapid
stage→stage replacement and Chat replacing an in-flight destination via
KEYBOARD activation, then asserts the single source of truth (scrollY 0,
hero owns motion, showcase not playing) across a 600ms rAF probe.

### Original report (for the record)

`View Chat` cannot be correct without the navigation transaction: the hero
is not a registered stage, so `navigateToStage("chat")` throws, and any
consumer-issued `scrollTo` (current interim) cannot replace an in-flight
destination — keyboard activation (no pointerdown) reproduces the reviewer's
desync deterministically. The two compliant resolutions are both outside
this batch's authority:

- **(a) preferred:** extend `navigateToStage` to accept `chat` as
  "navigate above the pinned range" — target `scrollY = 0`, the same
  suppress/replace/manual-cancel transaction, releasing the claim upward as
  the existing `onLeaveBack` path already does. Small and contained: the
  transaction machinery all exists; only the destination resolution learns
  one non-stage case.
- **(b):** fold the hero into the controller as stage 1 (HANDOFF §8's
  anticipated restructure) — large, reshapes the approved hero layout.

The consumer click handler now carries a KNOWN-BROKEN marker referencing
this record. No UI-side cancellation shim was added, per the
single-source-of-truth rule.

## Finding 2 (HIGH) — FIXED (`8084e69`)

The `MutationObserver` and consumer-owned `data-selected` are gone. The
selected segment derives in CSS (`:has`) from the machinery-owned
`flow-variant` state, so the visible selection cannot desync from the
surface; ARIA is written only inside the control's own event handlers
(click, its own opacity `transitionend`), reading machinery DOM truth at
that moment. Nothing stored, mirrored, or observed.

## Finding 3 (HIGH) — FIXED (`7068027`)

`todos-ambient` now plays the approved §2.3 table verbatim — six beats, one
action per semantic moment, approved targets and times. The card-level
visuals are derived presentation: the relnotes card carries no state
attribute (done-dim and the session line key off its disc via `:has` and
the exec text via `:empty` — the line grows open with the approved 12000ms
replace-text beat itself); the changelog disc renders attribute-less and
derives blocked/assigned from the card's single owned state. No split-truth
windows remain. The unit test now encodes the amendment table.

## Finding 4 (HIGH) — FIXED (`00fa3ec`) with one documented interim

Approved cadence restored verbatim: entrance at 0ms with the 90ms L→R
stagger; transitions at 1200/1800/2400/6400/7000/7600/12600/13100ms;
resolved 13.5s. Status-line `replace-text` beats are co-timed with their
state rows — the table's own `status →` annotations, matching the approved
`workflow-approval` serialization. Interim step strings are ruled into the
deck by the amendment's Addendum 1a (design-office authority): `Running` is
the real app's exact `nodeStatusLine` string; `Queued` is existing
base-deck vocabulary.

**CLOSED (machinery `41fc1b4` + consumer follow-up):** pane selection is
now preserved across `swap()` by the machinery; the two interim `t=0`
highlight beats and their pane targets are deleted. The scene now matches
the amendment §2.4 table EXACTLY (verified by the unit fixture), and
Addendum 1a records the interim as resolved.

## Finding 5 (HIGH) — FIXED (`eed4b00`)

All three surface spinners (todos, workflow, morning) carry
`animation-play-state: paused` whenever their window's machinery-owned
`data-scene-player-state` is not `playing`. The single pause control,
offscreen release, visibility changes, and channel yields freeze them with
the timeline — no second motion channel, no consumer JS. Both falsified
probes are now deterministic e2e (pause-freezes-and-resumes; offscreen
mobile spinner freezes with its paused player). One-shot CSS transitions
triggered by player-committed attribute changes remain sanctioned
(HANDOFF §10) and settle ≤400ms, mirroring the beat-completion rule.

## Finding 6 (MEDIUM) — CLOSED (machinery `9784cdc` + consumer follow-up)

Reduced-mode controllers now expose inert static players per stage-local
window via `getPlayerForRoot(root)`. The switcher is visible under reduced
motion and swaps the selected run's exact resolved DOM statically; the
wiring addresses the window's own player and still refuses to mutate an
INACTIVE live window (`status !== "static"` guard). New e2e: reduced
switcher selects run #139's resolved proof (badge Completed, steps done,
zero timelines page-wide) and restores the parked digest.

### Original report (for the record)

The reduced-motion static-swap guarantee cannot reach any _visible_ window
on this page: the reduced-mode controller instantiates a static player only
on the shared root, which the reduced layout hides; the visible stacked
mobile windows have no players, so `getActivePlayer()?.swap()` can only
mutate the hidden window. Offering the switcher there would ship a dead
control. **Machinery need reported:** reduced-mode static players on (or
on-demand for) stage-local mobile windows. The switcher stays hidden under
reduced motion until then.

## Finding 7 (LOW) — FIXED (`a073d2d`) within this batch's authority

- Pause/offscreen spinner races: covered (finding 5 tests).
- Per-option ≥44px: proven by interaction — a tap 3px outside each
  option's 36px layout box (the ±4px hit extension) must activate it.
- Storyboard tables: unit tests now encode the approved tables.
- Rapid ribbon replacement incl. Chat and reduced-motion switcher
  selection: blocked on findings 1/6 machinery rulings; test plans noted in
  those sections.

## Finding 8 (LOW) — FIXED (`a073d2d`)

The §7 matrix gains mobile `flows.backup-complete` and
`window.paused-ambient`; all 17 shots re-taken against the approved
cadences.

## Verification

- `pnpm check` ×2 — green (link gate tail both runs).
- `pnpm test:e2e` ×2 — 120/120 both runs (two new governance tests).
- Leak-grep clean on every commit.

## Machinery follow-up round (same day)

All three needs were implemented by the machinery owner (`8ebba57`,
`41fc1b4`, `9784cdc`, docs `f0a65ba`) and consumed here: Chat rides the
navigation transaction, nightly-backup is the §2.4 table exactly, and the
reduced-motion switcher works through `getPlayerForRoot`. ARIA
reconciliation on the switcher is layered on the moments state becomes
perceivable (focus, hover, the control's own visibility transitions) —
still zero observers; the visible selection itself derives in CSS and can
never go stale. Full e2e re-run ×2 after the changes; matrix re-shot.

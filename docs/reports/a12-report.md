# A-12 report — the theatre (sections 6–11, the sunrise, the 🧞 brand)

**Batch:** Phase A implementation, batch 4 · branch `a12-theatre` off main ·
jinn-designer · 2026-07-10.
**Scope shipped:** section 6 (`night-shift`), section 7 (`morning-approval`
with THE SUNRISE), sections 8–11 (MCP / three steps / final CTA / footer),
the 🧞 brand swap (nav + footer glyph, favicon set, OG card, meta), the
theatre e2e suite, checkpoint screenshots, eager-JS budget.

> **Review status:** the 2026-07-10 review
> (`docs/reviews/2026-07-10-a12-theatre-review.md`, verdict BLOCK) is fully
> remediated — see **§8 Review remediation** for the per-finding record.
> §4's machinery need was separately authorized and landed as `de0ca69`
> before the review. Sections below §8 that describe the pre-review
> mechanism (the pauseable start delay as the hysteresis, the anchor-jump
> caveat) are superseded by the sunrise position rule.

## 8. Review remediation (2026-07-10, post-BLOCK)

**Finding 1 (HIGH) — FIXED — the sunrise is now a monotonic page-position
rule.** New `src/lib/sunrise.ts` (page code; scene machinery untouched):
one one-way transition rule owns the sunrise with scroll position as the
single source of truth. (a) _Narrative entry:_ the morning window held on
stage for one **continuous 350ms dwell** fires it — leaving resets the
dwell; peeks can never bank. (b) _Passed by any route_ (same-page anchor
click, instant jump, deep link, scroll restoration, bfcache return): the
Morning section entirely above the viewport fires it immediately. Fresh
loads at `/#install` resolve **pre-paint** in the daylight scope's inline
script — no dark flash, no sweep on arrival. (c) The morning scene's
playback is gated on the same rule via the player's public composable
`api` pause reason: until the fire, the timeline cannot tick, so run
#142's approval can never commit from peeks (the reviewer's banked-visits
sequence now ends at `t=0`, gate `awaiting-approval`). The scene's
authored `initialState.theme` was removed — darkness at t=0 is the page's
state, not scene-forced — so the pre-paint light path is never primed back
to dark; theme ownership remains via the t=0 beat (covered by `de0ca69`).
Regression suite: "sunrise monotonicity" describe — fresh `/#install`
loads at 1440 and 390 land light with the scene un-advanced; the nav
Install click fires the sunrise; an instant jump past Morning fires it;
ten 120ms peek/retreat cycles leave the page dark with the timeline at 0
and the gate awaiting, after which one genuine dwell still resolves
normally.

**Finding 2 (MEDIUM) — FIXED — row 6 lights only at its 3000ms beat.** The
SSR no longer ships `data-active`; the static (no-JS / reduced-motion)
wash moved to the established motion/static split
(`html:not([data-motion="ok"])` keyed on the row's amber tone), so motion
playback shows the wash only when the highlight beat sets `data-active` —
`DOM(t) === reducer(t)` before, during, and after the beat. New e2e probes
the animated DOM mid-scene (t≈1.5–2.9s: no wash) and at resolved (wash
present); the wash also gained the 400ms smooth transition (out-specified
by the 900ms theme clock during the sunrise, so the one-clock rule holds).

**Finding 3 (MEDIUM) — FIXED — the deck serializes verbatim.** Step labels
now render `01 · Install` / `02 · Hire your team` / `03 · Let it run`
exactly (number, middot, title as one serialized string); the invented
`JB` avatar initials were removed from the approval card (the deck is
closed — no design-side exception granted). The copy gate now serializes
each back-half section's complete `innerText` (kickers in their rendered
CSS-uppercase form) and compares whole sections, not fragments.

**Finding 4 (MEDIUM) — FIXED — pinned Noto provenance.**
`scripts/brand/NOTICE.md` now pins the source to revision
`de7f127a26f7044e5647490af9e3b187d9532703` with the committed copy's
SHA-256 (`a6f98932…197c2693`) and links the file at that exact revision;
the applicable Apache-2.0 text ships as `scripts/brand/LICENSE-noto-emoji`
and the upstream copyright attribution (§4(c)) as
`scripts/brand/AUTHORS-noto-emoji` — both fetched from the same revision —
with an explicit warning that current Noto `main` is OFL-1.1 and must not
be used for provenance.

**Finding 5 (MEDIUM) — FIXED —** `pnpm tokens:sync` refreshed the Ledger
snapshot provenance to the current canonical source (snapshot header:
commit `c55ccc5ea37f0b446a9865229200c573916200a6`; token values
unchanged); the full `pnpm check` aggregate gate is green again.

**Finding 6 (LOW) — FIXED —** the eager-JS report was re-measured at
remediation HEAD: **65,088 gzip bytes (63.56 KiB)**, +1,636 over the A-11
baseline for the theatre + the machinery guard + the sunrise rule — PASS
vs 90 KiB, manifest retained in `docs/reports/a12-eager-js.md`.

Screenshots under `docs/screens/a12/` were re-taken at remediation HEAD
(the approval card without the avatar; exact step labels).

**Re-review notes (2026-07-10, second pass):**

- The one-clock theme test was nondeterministic (wall-clock samples racing
  the 900ms tween under parallel load). It now uses the same in-page
  `requestAnimationFrame` probe as the batch-1 reversal fix: frames are
  observed as they render, the invariant is asserted on an observed frame
  (every themed surface mid-flight together, live transitions all at
  900ms), and the final state is read after the transition contract
  clears. Verified 20/20 focused repeats plus the full suite ×2.
- **Below-Morning reload (documented, not changed):** a reload that
  restores scroll below Morning shows the browser's own paint-then-
  restore-scroll sequence (~two dark frames) before the sweep, unlike the
  pre-paint `/#install` path. Extending the pre-paint scope to this path
  is not cheap without breaking a contract: scroll restoration happens
  after first paint, so a pre-paint decision would need persisted
  "sunrise fired" state — and any persisted state conflicts with the
  storyboard's re-arm-on-full-reload law for reloads at the top of the
  page. The sweep the module fires on restore is the graceful recovery.

## 1. Commits

| Hash      | Commit                                                               |
| --------- | -------------------------------------------------------------------- |
| `a4cdd6f` | feat(scenes): night-shift + morning-approval definitions + data      |
| `c11b0d2` | feat(night): section 6 — While you slept, the overnight feed         |
| `a0712b8` | feat(morning): section 7 — approval card + run #142's rail tail      |
| `a324f2d` | feat(sections): 8–11 — MCP statement, three steps, final CTA, footer |
| `c987642` | feat(brand): the 🧞 mark — typographic glyph, favicon set, OG card   |
| `ce462fb` | feat(page): assemble the theatre + sunrise static split + e2e suite  |
| `4981ac1` | docs(a12): checkpoint screenshots, shoot script, eager-JS budget     |

Leak-grep ran clean on every staged diff. The preview worktree and port
4321 were never touched (shoots used 4332/4340, servers killed after).

## 2. Gates (verbatim tails)

`pnpm check`:

```
Public safety passed: 151 source/generated files scanned.
Link gate passed: 22 internal URLs scanned; all required routes are healthy.
```

`pnpm test:e2e`, two consecutive runs:

```
run 1:   1 skipped
        80 passed (43.4s)
run 2:   1 skipped
        80 passed (43.7s)
```

The 1 skipped is the deliberate `test.fixme` documenting the frozen-machinery
need (§4). Unit suite: 58 tests green (8 new in
`tests/unit/theatre-scenes.test.ts`). Axe: the existing full-page audits
cover the new sections in dark (load audit) and light (post-tween audit).
Eager JS (`docs/reports/a12-eager-js.md`): **64,589 gzip bytes (63.08 KiB)**,
+1,137 B over the A-11 baseline for the entire theatre — PASS vs 90 KiB.

## 3. Screenshots (13 in `docs/screens/a12/`, DPR 2)

Best five: `night-feed-resolved-1440-dark.png` (the darkest frame; row 6
holds the page's only amber) · `morning-mid-sunrise-1440.png` (the 900ms
token cross-tween mid-flight) · `morning-resolved-1440-light.png` (approval
card + run #142 tail completed in daylight) · `morning-resolved-390-light.png`
(mobile: full-width card, vertical mini-rail, ≥44px buttons) · `meta-og.png`
(the 1200×630 OG card). Also: night 390 dark, MCP/steps/CTA/footer 1440
light, brand nav dark + light, favicon strip.

## 4. ⚠️ Frozen-machinery need (reported, NOT changed)

**File:** `src/lib/scenes/scene-player.ts`.
**Behavior:** the constructor captures the document theme
(`this.themeSnapshot`, lines ~120–124) and `restoreThemeSnapshot()` is
called **unconditionally** in both `destroy()` and `seek()`. Every player
constructed while the page is dark therefore carries a "restore dark"
side effect.
**How it manifests:** desktop stage changes destroy/rebuild players on the
shared showcase root (`SceneController.activate`). After the sunrise,
reverse-scrolling **through the pinned showcase** destroys a pre-sunrise
player and snaps the whole page back to dark. Confirmed live: theme stays
light at the night section and the trigger-fire stage, snaps dark on
entering the workflow-approval stage. `seek()` on a retained pre-sunrise
player has the same effect (skip-resolution hydration path).
**Required fix (proposed, ~4 lines):** in the constructor compute
`ownsTheme = definition.initialState.theme !== undefined ||
definition.beats.some(({ action }) => action.type === "theme")`; make
`restoreThemeSnapshot()` a no-op unless `ownsTheme` (guards both the
`destroy()` and `seek()` call sites). Only `morning-approval` owns theme,
so its own cleanup semantics (and the existing scene-player theme spec)
are preserved.
**Where it's tracked:** `tests/e2e/theatre.spec.ts` carries a `test.fixme`
("keeps morning all the way back up through the pinned showcase") with the
root cause in a comment — flip it to a live test when the guard lands.
Everything else about the no-reverse requirement passes today: holds
through scroll-up to the night section, sub-hysteresis peek stays dark,
retained on re-entry, re-arms only on a full load.

Per the batch instructions (machinery frozen; STOP and report if theme
wiring needs machinery), I did **not** apply this change. The `theme`
action itself needed no machinery work — it was already wired
player → `transitionTheme()` → the page-level 900ms clock.

## 5. Two-pass self-critique (what changed and why)

**Pass 1 — live smoke against the built page:**

- Caught and fixed a real bug pre-ship: the morning rail's
  `--scene-progress` default was declared on the rail element itself, where
  the player's inline custom property on the `rail-tail` target could never
  override it (CSS specificity: local declaration beats inherited inline).
  Moved the default to the target container.
- Verified the load-time de-race empirically: without `startDelayMs: 350`,
  the last-constructed standalone controller claims the motion channel at
  load and the sunrise fires before the offscreen observers park it. With
  the delay, the page provably stays dark at load (asserted in e2e).
- Confirmed the §4 machinery interaction with a live reproduction rather
  than code-reading alone.
- Composition reads: the night section breathes correctly; the morning card
  balance and the tail's completion moment land; the mid-sunrise frame
  feels like dawn, not a switch.

**Pass 2 — checkpoint shots, then refinement:**

- The pre-play scene frames collapsed to **zero height** (all
  enter-targets ship `hidden`), which shifts layout mid-scene (CLS) and
  starves IntersectionObserver activation. Both frames now reserve their
  resolved footprint (`min-height`, measured at 1440 and 390). Written back
  into the jinn-design skill as a standing rule.
- Night/morning mobile silence increased from 64px to 128px padding-block —
  guardrail #7 says the theatre gets MORE spacing, and the baseline mobile
  rhythm is ~96px.
- Mobile shot framing fixed (activate at the window, reframe to the section
  head clear of the fixed nav).
- Brand check: the 🧞 baseline nudge (+1px) verified optically against the
  wordmark in both themes (`brand-nav-dark/light.png`).

## 6. Storyboard deviations (disclosed)

1. **Footer note/links use `--text-secondary`, not `--text-quaternary`**
   (§Section 11) — quaternary fails the 4.5:1 AA gate the axe audit
   enforces at footer sizes. Same amendment A-04 made for the hero eyebrow.
   The MCP mono tool row likewise uses secondary, not tertiary.
2. **The morning tail carries a `run #142` mono label + the run badge**
   above the two steps. The storyboard's `run.badge` beat needs a visible
   home on the morning surface; this is the quietest composition found.
3. **Anchor-jump caveat:** the nav Install pill jumps to section 9 without
   crossing the morning window, so a motion visitor who jumps immediately
   after load sees the back half still dark until they cross section 7
   (all back-half sections are fully theme-aware; the sunrise catches them
   on the way back up). Inherent to visibility-triggered theatre — flagged,
   not "fixed", since any global scroll listener would build a second theme
   state machine.
4. **Data-contract extension:** `types.ts` gains `night`/`morning` surface
   values, `NightFeed*`/`Morning*` data shapes, and `ChatSceneState.pane`
   widened to `PaneKey | "none"` for standalone card surfaces — sanctioned
   by HANDOFF-A05 §3 ("extend/specialize the state types deliberately").
   Validator, player, controller, and motion channel are untouched.
5. **Test maintenance for approved design changes:** the theme cross-tween
   spec no longer samples the nav mark's background (the amber square died
   by amendment; the Install pill is the nav's themed accent surface);
   "Copy install command" assertions account for three pills; reduced
   motion expects three static standalone players.

## 7. Amendment-rollout notes (ribbon nav + ambient + switcher batch)

1. **Land the §4 theme-snapshot guard first.** `navigateToStage()` ribbon
   jumps destroy/seek players constantly; post-sunrise, every one of those
   is a dark-snap until the guard exists. Then flip the `test.fixme` in
   `tests/e2e/theatre.spec.ts`.
2. **Mobile stage-observer initial pass:** the showcase's mobile
   IntersectionObserver (thresholds `[0.45, 0.6]`) treats any
   `isIntersecting` entry as visible on its initial pass, so a ~2%-visible
   stage can steal the motion channel during load-time programmatic
   scrolling (this bit the shoot script; real users can't race the first
   pass). Ribbon-nav's programmatic smooth scroll can — guard the mobile
   visibility handler with a minimum ratio when wiring capability 1.
3. **Night feed + approval card stay dead still** (AMENDMENT §2.6): once /
   retain, zero ambient. Do not schedule loops on them; their standalone
   controllers already claim/release the shared channel by visibility.
4. **The two theatre scenes are standalone roots** (`data-scene-window` +
   `data-scene-id`, one controller each). Ribbon navigation is a
   pinned-range behavior only and must not touch them.
5. **Keep the resolved-footprint `min-height`** on the theatre frames if
   surfaces change (now a jinn-design skill rule); re-measure with
   reduced-motion renders at 1440/390 if copy or spacing changes.
6. **Brand assets** regenerate via
   `pnpm exec tsx scripts/build-brand-assets.ts` (Playwright + macOS
   `sips`; Noto genie source + licensing note in `scripts/brand/NOTICE.md`).
   Apple's emoji artwork must never be rasterized into this public repo.
7. **Sunrise interplay for new capabilities:** anything that constructs a
   player pre-sunrise and destroys it post-sunrise hits §4; anything that
   re-primes `initialState.theme` mid-page must stay scoped to
   `morning-approval` — it is the only theme-owning scene, and the unit
   suite asserts exactly one `theme` beat exists page-wide.

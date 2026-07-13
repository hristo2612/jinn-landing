# Taste pass — the whole page as one artifact

**Closing gauntlet, station 1 · jinn-designer (Fable 5) · 2026-07-11 · branch `gauntlet-taste`**

Method: production build experienced in-browser three ways before any code was
read — a slow reader scrolling with the story, a skimmer fast-scrolling and
clicking ribbon chapters, and a 390×844 mobile visitor — then judged against
STORYBOARD §2/§7, AMENDMENT-1 §2.0/§6, and BRIEF-LEDGER, then fixed and
re-experienced. Ambient cadence was measured with a MutationObserver beat log,
not eyeballed (triggers ambient: beats ~7 s apart, one motion at a time,
cycle + dwell per §2.0 — the "quiet office" law holds).

Severity legend: **polish** = fixed here, in lane · **flag** = fiction/deck
observation, no action · **need** = machinery/timeline, routed to Jimbo.

---

## Verdict

**Hits the bar after this pass — with two machinery needs open.** The showcase
scenes, the night→sunrise→morning arc, and the light back half are genuinely
"obviously considered"; the sunrise lands emotionally on both breakpoints, and
the fiction (run #142) reads as one story through five surfaces. The two
machinery items below (N1, N2) are the only things I'd insist on before the
operator shows it to the world: one makes chapter navigation land on the wrong
chapter, the other silently drops the page's climax for roughly one in three
fast-scrolling mobile visitors. Both have exact repro + root-cause hypotheses
and look like small fixes — but they're in the scene controller / sunrise gate,
which are contracts, not taste.

---

## What only the whole-page read revealed (and what was done)

### P1 · polish — the hero told its story below the fold _(fixed)_

The desktop chat thread was **bottom-anchored** (`justify-content: flex-end`),
so at 1440×900 the visible crop of the hero window was ~400 px of empty pane;
the payoff message landed exactly on the fold line, half-cut, colliding with
the SCROLL cue; the typing beat played entirely offscreen. The real app's
thread flows **top-down** (chat-messages.tsx) — and the landing's own mobile
variant already did. Now the whole delegation story (message → plan → two
delegation chips → first finding) resolves inside the hero crop, and the
scroll cue floats in clear space.
Before: `docs/screens/taste/before/hero-bottom-anchored.png` · after:
`docs/screens/taste/01-hero-1440.png` · commit `bf7ab68`.

### P2 · polish — three kicker voices, and amber over budget _(fixed)_

Different batches gave the same element three treatments: showcase/night/
morning kickers were **amber** in dark + **text-primary** in light; MCP/steps
kickers were text-secondary; the hero eyebrow its own recipe. Amber kickers
put 4–7 ambers in ordinary dark frames (§7.2: brand, Install, H1 period, send,
engine pills, trigger chip, washes — kickers are not on the salary). All
kickers now share one quiet recipe (11 px mono semibold, `--text-secondary`,
both themes). Stage titles also get `text-wrap: balance`, killing the
"written / **down.**" orphan on the workflows head. Commit `35fe87b`.

### P3 · polish — the window wasn't the product _(fixed)_

Guardrail #9 says every surface must survive comparison with the real app.
Three places didn't:

- **The ribbon brand mark was the amber rounded square** — the mark Amendment
  1 §3 explicitly killed. The app's rail renders the 🧞 glyph (pill-nav top
  slot, U+FE0F color presentation). Swapped; also returns one permanent amber
  to the budget in _every_ dark frame.
- **Monogram avatars (JB/AN/WR/DV/DS)** — monograms are retired in the
  product; the app renders `emojiForName` emoji on a fill circle. The five
  fiction names now carry their app-canonical emoji (Jimbo 🌈 · Analyst 🎪 ·
  Writer 🪐 · Dev 🦞 · Designer ⚔️) across the sessions sidebar, todo owner
  chips, and org nodes — install the product and the same faces greet you.
- **Trigger bindings wore invented per-kind tints** (amber/orange/purple
  discs) with the cron disc amber _before_ firing — making the storyboard's
  "disc goes amber" beat a visual no-op. Rest discs are now neutral
  (`--fill-secondary`); amber appears exactly when a binding fires, which is
  the app's own grammar (cron rows: `accent-fill` only when active).

Commits `3c649c3`, `263d242`.

### P4 · polish — honest-state colour slips _(fixed)_

- `↳ run #142 started` / `↳ run #140 started` rows carried **green** dots — a
  started run is live work; green claimed completion. Now `--system-blue`.
- The "Funnel investigation" card (assigned, idle) wore the **blue** disc
  while the amendment's own ambient card enters as "assigned — grey disc".
  Assigned now stays on the neutral disc; blue is reserved for executing.
  Commits `263d242`, `3c649c3`.

### P5 · polish — pane content floated at three different heights _(fixed)_

Todos content began just under its header; triggers centered mid-pane;
workflows centered lower still — so ribbon-clicking chapters made the proof
band jump around the window (each pane was built by a different batch; each
chose its own vertical logic). All pane content now top-anchors under its
header like the app's list views, one consistent band across swaps. The
workflow trigger chip also moved from floating mid-rail to **anchored over
step 1's column** (desktop) / onto the vertical rail spine (mobile) — a
trigger starts the run, so it points at the start. Commit `263d242`.

### P6 · polish — mobile theatre rhythm inverted; pause control on content _(fixed)_

- §7.7 gives night/morning MORE silence than any section; on mobile they had
  96 px while MCP had 128 px. Theatre now carries 128 px — which additionally
  holds the night card clear of the sunrise band (see F3 flag below).
- The docked pause control sat on top of the last content row in the mobile
  stacked windows (Post to Slack card, todo metadata, org node). Stacked
  showcase windows now run 60svh (hero keeps the §4 55svh), giving the
  control clear floor. Commits `35fe87b`.

### Verified sound (no action)

Desktop section rhythm is systematic (201.6 px theatre padding vs 158.4 px
close — a composed scale, not accident); the sunrise is one continuous sweep
in both directions of approach and resolves pre-paint on `/#install` loads;
the install-jump from the hero lands light with steps at top; reduced motion
serves the full static dark/light arc with zero timelines; the workflow
switcher honors parked-state stillness and replays run #139 honestly; ambient
cadence measured at ~7 s single-beat spacing with correct yield-to-scripted
behaviour; both fired states retain per the dwell law; captions, deck strings,
and run-number ledger all verbatim.

---

## Needs (machinery — routed to Jimbo, exact repro in hand)

### N1 · need — ribbon chapter navigation lands one chapter short

From the hero: **View Org → no scene activates at all** (`activeScene`
undefined); **View Workflows → Todos stage active**; **View Triggers →
Workflows active**. Only View Todos works — the one jump the amendment QA
checkpoint (`ribbon-nav.jump`) covers. Geometry is identical in every case
(target stage top = 450 px = exactly `innerHeight/2`): `navigateToStage`
scrolls to `stage.top − innerHeight/2`, which is the activation boundary
itself; the trigger band starts ~60 px past it. The wrong state persists
forever; a 60 px manual nudge instantly corrects it. Suggested fix: bias the
landing ~80–100 px past the boundary (or activate the target scene explicitly
on arrival, as the skip-force-resolve path already does). Repro:
`scratchpad probe-ribbon.mjs` (3 s per jump, deterministic).

### N2 · need — the morning approval silently no-shows (~1 in 3) on mobile fast-scroll

Same wheel sequence, same final geometry (stage top 380, y 4900): two runs out
of three the scene runs `initial → daylight → approved → resolved`; the third
stays `initial` forever — sunrise fires, page turns light, and the approval
card never enters. The visitor gets the theme flip but **loses the page's
climax**, permanently. Hypothesis: `installSunrise` captures
`controller.getActivePlayer()` **once** at install and gates it via
`pause("api")`; if the mobile stacked window's player is rebuilt between
install and fire, `resume("api")` lands on the stale player handle and the
live one stays gated. Repro: `probe-m-morning2.mjs` (3 iterations, flake
reproduces reliably within a few runs).

### N3 · observation — plain fast scroll leaves skipped once-scenes at `initial`

Ribbon navigation force-resolves skipped stages; plain fast scrolling doesn't
(night/morning read `initial` from the footer after a fast skim). Mostly
self-healing — re-entry activates them — but it's the state N2's race lives
in. Worth folding into the N2 fix conversation.

---

## Flags (deck/fiction — no action taken; the deck is closed)

- **F1** Under the `Active` segment, two `Done` cards are visible (spec'd
  card set — but the real app's filter would hide them; a future deck could
  label the segment differently or swap card states).
- **F2** The approval card keeps its pressable Hold/Approve after the run
  completes; a resolved treatment (buttons giving way to `Approved by you ·
09:02`) would close the fiction more cleanly. Timeline change — not taken.
- **F3** On mobile, the sunrise can fire while the night feed is still
  half-on-screen (short sections + the 0.85·viewport on-stage band). The P6
  padding increase softens this; moving the band later is a sunrise-contract
  change if you want the night card strictly dark until it leaves.
- **F4** The visible caption paragraph under each stage body is a fourth text
  layer per head; it reads slightly "spec sheet" to me. It's shipped intent
  (transcript made visible), so left alone — flagging the option to demote
  captions to a11y-only.

---

## Evidence

- Key states, after: `docs/screens/taste/{01-hero,02-showcase-todos,03-night,04-sunrise-mid,05-morning,06-footer}-{1440,390}.png`
- Before shots for the meaningful fixes: `docs/screens/taste/before/`
- Fix commits: `bf7ab68`, `35fe87b`, `3c649c3`, `263d242`
- Gates: `pnpm check` green (tokens/typecheck/lint/unit/build/safety/links);
  `pnpm test:e2e` — **128 passed**, run twice, both green. No visual-test
  baselines exist in this repo (`test:visual` is not-implemented), so none
  changed.

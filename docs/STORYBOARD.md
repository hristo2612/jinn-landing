# jinn.run — Landing Page Storyboard

**Phase A1 · Creative direction (jinn-designer, Fable 5) · 2026-07-10**

This is the single source of truth for the landing page. Implementers build
exactly what is written here. Every scene is expressed in the TECH-PLAN §3
action vocabulary (`type-text` / `replace-text` / `enter` / `exit` /
`set-state` / `set-progress` / `highlight` / `pulse` / `theme`).
**Vocabulary requests: none.** The page is buildable with the approved set.

---

## 1. Narrative spine

A visitor lands at night, inside a beautiful dark product, and watches
themselves hand real work to an AI COO in one chat message (**0% — "this is a
real product, and the interface is a conversation"**). As they scroll, the same
window navigates itself through the company that message created: the people
(**25% — "it has an actual org — engines wearing roles, ranked, seated"**),
the ledger and the SOPs (**50% — "work is tracked, repeatable, and it parks at
a human gate instead of pretending to be done"**), then the trigger that
started it all fires on screen and an overnight feed rolls past (**75% — "this
thing wakes itself up and works while I'm away"**). Then the page does its one
theatrical move: sunrise. The whole site inverts to the light Ledger theme,
and in daylight the visitor performs the only human act on the page —
approving the digest the company prepared overnight (**"and I stay in
control"**). By the footer they believe the close: the entire company they
just watched is one command away (**100% — copy `npm install -g jinn-cli` and
go**).

The trick of the page: the visitor doesn't know the darkness _meant_ night
until the sunrise reframes everything they've scrolled through as "that all
happened while you slept."

---

## 2. Theme arc

**Dark from 0% to ~70% of the page. One inversion. Light to the footer.**

- **Hero opens dark** (locked decision) — the exact l2-product-real look:
  Ledger dark tokens, amber rationed, the staged dashboard under the headline.
- The dark is _narrative_, not just aesthetic: the hero through the trigger
  stage and the overnight-feed section are "the company at night." The
  night-shift section (`While you slept`) stays **dark** — it is the payoff of
  the dark opening, the moment the darkness is explained. No theme change yet.
- **The inversion lands at the morning-approval section** (`Morning.` / "You
  approve what matters."). As that section enters, a single `theme` beat
  floods the page to the **light Ledger theme** over ~900ms — sunrise. The
  visitor's one interactive-feeling moment (the COO's approval gate resolving)
  happens in daylight. Dark = the company's autonomy; light = your control.
  That is the trust story told in color temperature.
- **The page resolves light**: MCP statement, three steps, final CTA, and
  footer all live in the light theme. Morning energy — you've seen the night
  shift, now it's your move. No second inversion; Apple makes one move and
  holds it.
- Reduced motion / no JS: the sections above the morning beat are statically
  dark-scoped, the sections from the morning beat down are statically
  light-scoped. The arc survives with zero animation.

This refines the TECH-PLAN `night-shift` inventory row: the "runs while you
sleep" beat spans **two** sections — a dark overnight feed (`night-shift`
scene) and the light morning approval (`morning-approval` scene, which owns
the `theme` beat). Both scripted below.

---

## 3. Section-by-section script

Page order (desktop):

| #   | Section               | Theme                | Window/vignette             | Scene id            |
| --- | --------------------- | -------------------- | --------------------------- | ------------------- |
| 0   | Nav                   | dark → follows page  | —                           | —                   |
| 1   | Hero (pin start)      | dark                 | full dashboard · chat pane  | `delegation`        |
| 2   | 01 Employees (pinned) | dark                 | same window · org pane      | `employees`         |
| 3   | 02 Todos (pinned)     | dark                 | same window · todos pane    | `todos`             |
| 4   | 03 Workflows (pinned) | dark                 | same window · workflow run  | `workflow-approval` |
| 5   | 04 Triggers (pin end) | dark                 | same window · triggers pane | `trigger-fire`      |
| 6   | While you slept       | dark                 | overnight feed card         | `night-shift`       |
| 7   | Morning / approval    | **inverts to light** | approval card + rail tail   | `morning-approval`  |
| 8   | MCP statement         | light                | — (pure type)               | —                   |
| 9   | Three steps           | light                | — (step cards)              | —                   |
| 10  | Final CTA             | light                | —                           | —                   |
| 11  | Footer                | light                | —                           | —                   |

The pinned showcase (sections 1–5) is the proven l2-product-real mechanic:
one sticky window, the ribbon's active icon moves, the content pane swaps.
~520vh of scroll. After the trigger stage the pin releases and the page
returns to normal flow — the rhythm change is deliberate (tour → story).

**The continuity thread (one fiction, whole page):** you ask Jimbo about a
signup dip → he delegates to the analyst and the writer → the writer's fix
appears in Todos and completes → the _Morning digest_ workflow (run #142)
advances and parks at the approval gate → the Triggers pane shows the 09:00
cron that started run #142 → the overnight feed shows everything else that
fired while you slept → in the morning section you approve run #142's digest
and it posts. One story, told through five product surfaces.

Honest-state law (inherited from the app, non-negotiable): a running step is
**blue and spinning**, never green; a gate is **waiting**, never
pre-approved; nothing is shown complete before its beat completes it.

---

### Section 0 — Nav

Frosted pill nav (`--pill-bg` material, `--shadow-overlay`), fixed. Left:
brand mark (amber rounded square) + `jinn` wordmark. Right: `GitHub`, `npm`
(text links, hidden ≤640px), and one amber `Install` pill (anchors to §9).
The nav inherits the page theme — it crosses the sunrise with the page.

---

### Section 1 — Hero + `delegation`

**Headline:** `Run your own` (thin) / `AI company.` (bold, amber period)
**Subcopy:** _Jinn is an open-source, local-first gateway. Hire AI employees,
hand them real work, and step in only when it matters._
**Eyebrow (mono, above H1):** `Open source · Local-first · Multi-engine`
**CTA row:** install command pill (`$ npm install -g jinn-cli` + copy) and
ghost link `View on GitHub →`.

**Layout intent:** Quiet-ember type over the product-real staged dashboard —
headline block centered in the upper ~45% of the viewport, the full dashboard
window (icon ribbon → sessions sidebar → chat thread, the app's tonal
staircase) rising from below and deliberately cut by the fold. Full spec in
§4.

#### Scene `delegation`

- **Claim:** You run the company by talking to it — one message becomes
  delegated, owned work.
- **Surface:** chat pane. Sidebar shows 5 sessions (Jimbo/analyst/writer/
  workflow/dev rows per the mock). Header pill `Jimbo · COO · claude`.
- **Initial state:** thread empty except the header pill; composer shows
  placeholder `Message Jimbo…`; no chips; typing indicator hidden.
- **Timeline:**

| t (ms) | dur  | target         | action      | detail                                                                                                                        |
| ------ | ---- | -------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 0      | 1900 | composer.input | `type-text` | "Morning. Signups dipped 12% last week — find out why and fix what's fixable." (~28ms/char, natural jitter)                   |
| 2100   | 150  | composer.input | `exit`      | text clears (send)                                                                                                            |
| 2100   | 350  | msg.user-1     | `enter`     | user bubble (accent-fill) rises into thread                                                                                   |
| 2600   | 250  | thread.typing  | `enter`     | three-dot typing indicator                                                                                                    |
| 3400   | 150  | thread.typing  | `exit`      |                                                                                                                               |
| 3400   | 400  | msg.coo-1      | `enter`     | "On it. I'll split this: funnel research to the analyst, landing copy to the writer. I'll review both before anything ships." |
| 4300   | 300  | chip.analyst   | `enter`     | `↳ Delegated — analyst · funnel investigation`                                                                                |
| 4600   | 300  | chip.writer    | `enter`     | `↳ Delegated — writer · landing copy pass`                                                                                    |
| 5400   | 400  | msg.coo-2      | `enter`     | "First signal: the pricing anchor slipped below the fold on mobile. Todo #142 is open — the writer is on it."                 |

- **Checkpoints:** `initial` (0) · `sent` (2600) · `delegated` (5000) ·
  `resolved` (5900).
- **Playback:** `loop`. Resolved dwell 5000ms, then a quiet 600ms fade-reset
  to `initial` (never a snap). Visible pause control (≥44px) docked to the
  window chrome. Pause offscreen / when tab hidden.
- **Caption/transcript:** "You message the COO about a signup dip. It replies
  with a plan, delegates research to the analyst and a copy fix to the
  writer, and reports the first finding — with a todo already open."

---

### Section 2 — 01 Employees + `employees`

**Kicker:** `01 / Employees`
**Title:** `An engine wearing a role.`
**Body:** _Claude Code, Codex, and more — each with a persona, a rank, and a
seat in the org chart. They delegate, review, and escalate like a real team._

**Layout intent:** Pinned stage — the hero headline hands its slot to this
stage head; the same window remains. The ribbon's active icon slides from
chat to Org and the pane swaps to the org chart (COO node with amber stripe
over two department groups, per the app's node spec).

#### Scene `employees`

- **Claim:** Your employees are a real org — engine, role, rank, and
  reporting lines you can see.
- **Initial state:** org pane active but empty canvas; pane header
  `Org · 5 employees · 2 departments`.
- **Timeline:**

| t (ms) | dur | target        | action      | detail                                                     |
| ------ | --- | ------------- | ----------- | ---------------------------------------------------------- |
| 0      | 300 | ribbon.org    | `highlight` | active ribbon icon moves chat → org                        |
| 200    | 350 | pane.org      | `highlight` | pane swap (crossfade + 12px rise)                          |
| 500    | 350 | node.coo      | `enter`     | Jimbo · COO · `claude` pill, amber exec stripe             |
| 850    | 250 | org.branch    | `enter`     | connector stub + branch lines draw                         |
| 1100   | 300 | dept.platform | `enter`     | dept label + Dev, Designer nodes (80ms stagger)            |
| 1400   | 300 | dept.growth   | `enter`     | dept label + Analyst (`codex` pill), Writer (60ms stagger) |
| 2100   | 250 | node.analyst  | `set-state` | presence → `active` (green session dot enters)             |
| 2350   | 250 | node.writer   | `set-state` | presence → `active`                                        |

- **Checkpoints:** `initial` (0) · `seated` (1800) · `resolved` (2700).
- **Playback:** `once` per activation, retains resolved state; replays from
  `initial` when re-activated by reverse scroll.
- **Caption:** "The org chart settles: a COO on the Claude engine over
  Platform and Growth departments — and the two employees who just took the
  delegated work light up as active."

---

### Section 3 — 02 Todos + `todos`

**Kicker:** `02 / Todos`
**Title:** `The live work ledger.`
**Body:** _Everything the company touches — queued, executing, blocked, or
waiting on you. Shared memory for the whole company._

**Layout intent:** Same window; ribbon moves to Todos; pane shows the ledger
with the segmented filter (`Active / Needs you / Done`) and four cards with
tinted state discs, owner monogram chips, cost pill, execution-context line.

#### Scene `todos`

- **Claim:** Work has state, an owner, a cost, and a live execution context —
  and "done" means reviewed, not just finished.
- **Initial state:** four cards — #142 _Fix pricing anchor on mobile landing_
  (executing, blue spinner disc, owner Writer, `$0.42`, exec line
  `Session · landing-copy-pass · Open`); _Funnel investigation — signups dip_
  (assigned, Analyst); _Publish changelog for v0.24_ (blocked badge, Dev,
  "waiting on release notes"); _Rotate API keys_ (done, dimmed, Dev).
- **Timeline:**

| t (ms) | dur | target                                              | action         | detail                                                                                       |
| ------ | --- | --------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| 0      | 300 | ribbon.todos                                        | `highlight`    |                                                                                              |
| 200    | 350 | pane.todos                                          | `highlight`    | pane swap                                                                                    |
| 500    | 500 | card.142 / card.funnel / card.changelog / card.keys | `enter`        | 110ms stagger, rise + settle                                                                 |
| 1500   | 300 | card.142                                            | `highlight`    | soft fill lift — the eye lands on the executing card                                         |
| 2400   | 350 | card.142.disc                                       | `set-state`    | `executing → done` (blue spinner crossfades to green check disc)                             |
| 2750   | 300 | card.142.exec                                       | `replace-text` | exec line → `Done · reviewed by Jimbo`                                                       |
| 3100   | 250 | card.142                                            | `set-state`    | card settles to done treatment (title stays, card un-dims after 400ms hold — done-but-fresh) |

- **Checkpoints:** `initial` (0) · `ledger` (1400) · `completing` (2500) ·
  `resolved` (3600).
- **Playback:** `once`, retain resolved.
- **Caption:** "The ledger shows four todos in honest states. The writer's
  pricing fix finishes executing and flips to done — reviewed by the COO,
  with its session and cost on the card."

---

### Section 4 — 03 Workflows + `workflow-approval`

**Kicker:** `03 / Workflows`
**Title:** `How we do things, written down.`
**Body:** _Reusable SOPs. A run advances step by step — and parks for
approval when a human should look._

**Layout intent:** Same window; ribbon to Workflows; pane header
`Morning digest · Run #142 · round 1` with a blue `Running` badge. An amber
trigger chip (`⚡ Every morning · 09:00`) feeds a horizontal rail of four
step cards: Collect metrics / Draft digest / Approval gate / Post to Slack.

#### Scene `workflow-approval`

- **Claim:** A run advances on its own and parks at a human gate — it is
  never falsely complete.
- **Initial state:** step 1 _Collect metrics_ done (green check,
  `Completed · 12s`); step 2 _Draft digest_ running (blue spinner,
  `Writing summary…`); step 3 _Approval gate_ queued (clock); step 4
  _Post to Slack_ queued (clock). Rail fill reaches step 2.
- **Timeline:**

| t (ms) | dur | target                   | action         | detail                                      |
| ------ | --- | ------------------------ | -------------- | ------------------------------------------- |
| 0      | 300 | ribbon.flows             | `highlight`    |                                             |
| 200    | 350 | pane.flow                | `highlight`    | pane swap                                   |
| 500    | 400 | flow.trigger + flow.rail | `enter`        | chip, then step cards L→R 90ms stagger      |
| 1600   | 350 | step.draft               | `set-state`    | `running → done` (spinner → green check)    |
| 1950   | 250 | step.draft.status        | `replace-text` | → `Completed · 8s`                          |
| 2200   | 400 | rail                     | `set-progress` | fill advances to the gate                   |
| 2600   | 300 | step.gate                | `set-state`    | `queued → awaiting-approval` (clock → bell) |
| 2900   | 250 | step.gate.status         | `replace-text` | → **Waiting for your review**               |
| 3200   | 900 | step.gate                | `pulse`        | exactly two soft amber pulses, then still   |

- **Explicitly forbidden:** rail fill must stop AT the gate; step 4 stays
  queued; the run badge stays `Running`. The scene ends unresolved on
  purpose — the morning section resolves it.
- **Checkpoints:** `initial` (0) · `advancing` (1800) · `parked` (4100 =
  resolved).
- **Playback:** `once`, retain parked state.
- **Caption:** "The Morning digest workflow finishes drafting, and the run
  parks at an approval gate — waiting for your review. The final step stays
  queued until a human says so."

---

### Section 5 — 04 Triggers + `trigger-fire`

**Kicker:** `04 / Triggers`
**Title:** `How the company wakes up.`
**Body:** _Cron schedules, todo changes, webhooks from the outside world.
Work starts without you asking._

**Layout intent:** Same window; ribbon to Triggers; pane header
`Triggers · 3 bindings`. Three binding rows with mono kind labels: cron /
todo-status / webhook. This stage answers "who started run #142?" — the cron
did. Last pinned stage; the pin releases after it.

#### Scene `trigger-fire`

- **Claim:** The company starts its own work — a schedule fires and a real
  run exists.
- **Initial state:** three bindings — `Every morning · 09:00 → runs Morning
digest` (cron); `Todo → blocked → wakes the COO` (todo-status);
  `POST /hooks/stripe → starts Refund review` (webhook). No fired marker, no
  run row.
- **Timeline:**

| t (ms) | dur | target                                        | action      | detail                                                             |
| ------ | --- | --------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| 0      | 300 | ribbon.triggers                               | `highlight` |                                                                    |
| 200    | 350 | pane.triggers                                 | `highlight` | pane swap                                                          |
| 500    | 450 | binding.cron / binding.todo / binding.webhook | `enter`     | 120ms stagger                                                      |
| 1600   | 600 | binding.cron                                  | `pulse`     | one amber wash pulse — the firing                                  |
| 2000   | 250 | binding.cron                                  | `set-state` | → `fired` (disc goes amber; `fired · 09:00 today` label enters)    |
| 2450   | 350 | run.row                                       | `enter`     | `↳ run #142 started — Morning digest` slides in under the cron row |

- **Checkpoints:** `initial` (0) · `fired` (2300) · `resolved` (3000).
- **Playback:** `once`, retain resolved.
- **Caption:** "Three trigger bindings — a cron schedule, a todo-status
  watcher, a webhook. The 09:00 cron fires and starts run #142, the Morning
  digest you just watched."

---

### Section 6 — While you slept + `night-shift` (still dark)

**Kicker:** `While you were away`
**Headline:** `It ran while you slept.`
**Body:** _Triggers fire overnight. Workflows advance. Todos complete.
Nothing waits for morning — except the decisions that should._

**Layout intent:** Pin has released; this is a full-viewport, normal-flow
section — the darkest moment of the page (dim the stage glow, let the black
breathe). Centered headline; beneath it one narrow card
(`--bg-secondary` + `--shadow-card`, ~560px) holding a mono activity feed.
This is where the visitor learns the dark page has been "night" all along.

#### Scene `night-shift`

- **Claim:** The company kept working through the night, and left one
  decision at your door.
- **Surface:** overnight feed card. Mono timestamps, plain rows, one status
  glyph per row.
- **Initial state:** card empty except header `Overnight · 6 events`.
- **Timeline:**

| t (ms) | dur | target    | action      | detail                                                     |
| ------ | --- | --------- | ----------- | ---------------------------------------------------------- |
| 0      | 350 | feed.card | `enter`     | card rises                                                 |
| 500    | 300 | row.1     | `enter`     | `02:14 · cron fired — Nightly backup`                      |
| 900    | 300 | row.2     | `enter`     | `02:31 · run #139 completed — Nightly backup`              |
| 1300   | 300 | row.3     | `enter`     | `03:05 · webhook — refund request → Refund review started` |
| 1700   | 300 | row.4     | `enter`     | `03:22 · todo done — Rotate API keys · reviewed`           |
| 2100   | 300 | row.5     | `enter`     | `06:47 · analyst report filed — funnel investigation`      |
| 2500   | 300 | row.6     | `enter`     | `09:00 · Morning digest drafted — waiting for your review` |
| 3000   | 400 | row.6     | `highlight` | the waiting row lifts with a soft amber wash and holds     |

- **Checkpoints:** `initial` (0) · `feeding` (1900) · `resolved` (3400).
- **Playback:** `once`, retain resolved.
- **Caption:** "An overnight feed: a backup ran, a webhook opened a refund
  review, todos completed with review, the analyst filed a report — and the
  morning digest is drafted, waiting for you."

---

### Section 7 — Morning + `morning-approval` (THE INVERSION)

**Kicker:** `Morning`
**Headline:** `You approve what matters.`
**Body:** _The COO reviews everything and parks the important calls at your
door. One tap, and it ships._

**Layout intent:** The page's one theatrical move. As this section enters,
the entire site — background, text, nav, every token — floods from the dark
Ledger theme to the **light** theme (warm paper `--bg`, ochre accent) in one
continuous 900ms sweep. In daylight: a single approval card ("the COO gate"),
and beneath it a slim tail of the run #142 rail (gate + Post to Slack) so the
approval visibly completes the run we left parked in section 4.

#### Scene `morning-approval`

- **Claim:** Nothing important ships without you — and shipping takes one
  tap.
- **Surface:** approval card — header `Jimbo · COO`, title
  `Morning digest — run #142`, line `Draft ready. Numbers verified against
the ledger.`, buttons `Hold` (quiet) and `Approve` (amber). Below: mini
  rail — `Approval gate` (bell, waiting) → `Post to Slack` (queued).
- **Initial state:** dark theme still active at t=0; card not yet visible.
- **Timeline:**

| t (ms) | dur | target           | action         | detail                                              |
| ------ | --- | ---------------- | -------------- | --------------------------------------------------- |
| 0      | 900 | page             | `theme`        | dark → light Ledger tokens (the sunrise)            |
| 600    | 400 | approval.card    | `enter`        | card rises into the fresh light                     |
| 1000   | 350 | rail.tail        | `enter`        | gate + post steps beneath the card                  |
| 2200   | 250 | approval.approve | `pulse`        | one press pulse on the Approve button               |
| 2450   | 300 | gate             | `set-state`    | `awaiting-approval → approved` (bell → green check) |
| 2750   | 250 | gate.status      | `replace-text` | → `Approved by you · 09:02`                         |
| 3000   | 350 | rail.tail        | `set-progress` | fill crosses to Post to Slack                       |
| 3350   | 300 | step.post        | `set-state`    | `queued → running` (blue spinner — honest)          |
| 4050   | 300 | step.post        | `set-state`    | `running → done` (green check)                      |
| 4350   | 250 | step.post.status | `replace-text` | → `Posted · 09:02`                                  |
| 4600   | 250 | run.badge        | `set-state`    | `Running → Completed` (green badge)                 |

- **Checkpoints:** `initial` (0, dark) · `daylight` (1500) · `approved`
  (3100) · `resolved` (5000).
- **Playback:** `once`, retain resolved. The `theme` beat is scroll-entry
  triggered and does NOT reverse on scroll-up past a small hysteresis band —
  the sunrise happens once per visit (re-arms only on full reload). Reduced
  motion: sections ≥7 are statically light.
- **Caption:** "The page turns to morning. An approval card from the COO
  holds the digest; you approve, the gate clears, the post step runs and
  completes, and run #142 finishes — because you said so."

---

### Section 8 — MCP statement (light, pure type)

**Kicker:** `MCP is the hands`
**Headline:** `One tool interface.` / `The whole company.`
**Body:** _Every employee operates Jinn through the same MCP surface — org,
todos, workflows, sessions. A COO orchestrates, reviews, and gates approvals,
so you only see what matters._

**Layout intent:** No window. A breath after the theatre — big centered
type, generous whitespace, quiet-ember weight contrast on the two headline
lines (thin/bold). One mono detail row beneath the body, tertiary:
`create_work_item · delegate_task · start_workflow_run · decide_approval`.

---

### Section 9 — Three steps (light) — `id="install"`

**Kicker:** `From zero to company`
**Headline:** `Three steps. Then it runs.`

Three step cards (`--bg-secondary`, `--shadow-card`, no borders):

1. **01 · Install** — _One command. The gateway runs on your machine — your
   keys, your data, nothing leaves home._ + command pill
   `$ npm i -g jinn-cli` (copies the full `npm install -g jinn-cli`).
2. **02 · Hire your team** — _Describe a role in chat. Jinn drafts the
   persona, picks an engine — Claude Code, Codex, and more — and seats them
   in the org._
3. **03 · Let it run** — _Triggers wake the company. Workflows advance the
   work. The COO reports back — you approve what matters._

**Layout intent:** three equal columns at 1440; entrance = simple rise
stagger on viewport entry (no scene machinery).

---

### Section 10 — Final CTA (light)

**Headline:** `Your company is` / `one command away.` (amber period)
**CTA:** install command pill (`$ npm install -g jinn-cli` + copy) centered.
**Links row:** `GitHub →` · `npm →` (ghost links).

**Layout intent:** the quiet close. Nothing else competes; the command is
the object.

---

### Section 11 — Footer (light)

Single row: brand mark + `jinn` · note `Open source · local-first · your
keys, your machine` · spring · `GitHub` · `npm`. Text-quaternary, no
separator line above (whitespace does the job).

---

## 4. Hero spec

The quiet-ember type treatment carried onto the product-real staged
dashboard.

**Copy (final):**

- Eyebrow (IBM Plex Mono, 12px, letterspaced 0.14em, `--text-tertiary`):
  `Open source · Local-first · Multi-engine`
- H1 line 1: `Run your own` — Hanken Grotesk **wght 250** (thin), tracking
  −0.012em
- H1 line 2: `AI company` + amber period — Hanken Grotesk **wght 640**,
  tracking −0.042em (heavier weights take more negative tracking at display
  scale). The period is `--accent` and reads as the terminal block cursor —
  keep it inside the line-rise mask so it never floats alone.
- Sub (17–19px, `--text-secondary`, max-width 560px, centered): _Jinn is an
  open-source, local-first gateway. Hire AI employees, hand them real work,
  and step in only when it matters._
- CTA row: command pill + `View on GitHub →`.

**Type behavior (entrance, once, on load):**

1. Eyebrow fades in (250ms).
2. Both H1 lines rise from a line mask (600ms, `--ease-smooth`, 90ms
   stagger) — and line 2 plays a one-time **optical weight bloom**:
   `font-variation-settings` tweens wght 260 → 640 over ~850ms as it rises.
   The headline literally gains weight as it arrives. Never replay on
   scroll.
3. Sub + CTA rise/fade (400ms, +120ms stagger).
4. The dashboard window rises 24px + fades in (700ms), starting at ~500ms —
   the window arrives while the headline is still blooming, so page and
   product feel like one gesture.
5. `delegation` scene starts at ~1200ms (typing begins roughly when the
   visitor's eye finishes the sub).

**Sharing the viewport at 1440×900:** headline block (eyebrow + two H1
lines + sub + CTA) occupies the top ~470px, centered, max-width 980px. H1
size `clamp(42px, 6vw, 88px)`, line-height 1.02. The window (max-width
1180px, `--radius-2xl` 24px top corners, `--shadow-card` + a faint amber
stage glow behind at 7% alpha) starts at ~y 500 and is **cut by the fold** —
the visible crop shows the ribbon, sidebar, header pill, and the first
message landing. The crop is the scroll invitation; never letterbox the
whole window above the fold.

**At 390×844:** eyebrow 11px; H1 at the clamp floor (42–46px), two lines,
weight play intact; sub 16px; CTA stacks (command pill full-width, GitHub
link beneath). The window becomes **chat-pane only** — ribbon and sessions
sidebar are hidden (the proven mock pattern), full-bleed with 16px gutters,
~55vh tall, cut by the fold. The `delegation` scene plays identically inside
it. Safe-area padding respected; the command pill stays ≥44px tall.

---

## 5. Mobile adaptation (per section)

Global: **no pinning anywhere** below 900px. The persistent-window mechanic
becomes stacked scene windows in document flow, each activating once on
viewport entry (the l2-product-real proven pattern). Frame drift, stage
glow, and parallax are dropped. All tap targets ≥44px.

| Section      | Mobile treatment                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nav          | Brand + `Install` pill only; GitHub/npm live in the footer                                                                                                                                             |
| Hero         | See §4. Chat-pane-only window; sidebar/ribbon cut                                                                                                                                                      |
| 01–04 stages | Each becomes a stacked block: kicker + title + body, then a window showing ONLY that pane (no ribbon/sidebar). Scenes play on entry with identical scripts (ribbon `highlight` beats no-op gracefully) |
| Employees    | Departments stack vertically; nodes full-width (~min 244px); branch lines simplify to a single vertical stub                                                                                           |
| Todos        | Cards full-width; cost pill stays; exec line may truncate the session slug with ellipsis                                                                                                               |
| Workflows    | The rail rotates **vertical** (top→bottom), matching the real app's narrow layout; rail fill animates downward                                                                                         |
| Triggers     | Rows full-width; kind labels stay mono right-aligned                                                                                                                                                   |
| Night feed   | Card goes full-width (16px gutters); timestamps keep a hanging indent so wrapped rows stay aligned                                                                                                     |
| Morning      | Theme inversion identical (it's a token flip, zero layout cost). Approval card full-width; Hold/Approve buttons ≥44px; mini-rail vertical                                                              |
| MCP          | Headline drops to ~34–38px; mono tool row wraps to two lines, centered                                                                                                                                 |
| Three steps  | Columns stack; each card keeps its number + title on one row                                                                                                                                           |
| Final CTA    | Command pill full-width; links row beneath                                                                                                                                                             |
| Footer       | Two rows: brand+note, then links                                                                                                                                                                       |

**Cut on mobile:** sessions sidebar (everywhere), icon ribbon (everywhere),
stage glow, frame drift, the scroll cue. Nothing else — every scene and its
proof survives.

---

## 6. Copy deck (every string on the page)

**Meta**

- `<title>`: `Jinn — Run your own AI company`
- Meta description: `Jinn is an open-source, local-first platform for
running your own AI company. Hire AI employees, hand them real work, and
approve what matters.`

**Nav**: `jinn` · `GitHub` · `npm` · `Install`

**Hero**

- Eyebrow: `Open source · Local-first · Multi-engine`
- H1: `Run your own` / `AI company.`
- Sub: `Jinn is an open-source, local-first gateway. Hire AI employees, hand
them real work, and step in only when it matters.`
- Command: `$ npm install -g jinn-cli` (copy payload:
  `npm install -g jinn-cli`; copied feedback: `Copied`)
- Ghost link: `View on GitHub →`
- Scroll cue (desktop only): `Scroll`

**Stage heads**

- `01 / Employees` — `An engine wearing a role.` — `Claude Code, Codex, and
more — each with a persona, a rank, and a seat in the org chart. They
delegate, review, and escalate like a real team.`
- `02 / Todos` — `The live work ledger.` — `Everything the company touches —
queued, executing, blocked, or waiting on you. Shared memory for the whole
company.`
- `03 / Workflows` — `How we do things, written down.` — `Reusable SOPs. A
run advances step by step — and parks for approval when a human should
look.`
- `04 / Triggers` — `How the company wakes up.` — `Cron schedules, todo
changes, webhooks from the outside world. Work starts without you asking.`

**In-window strings** (verbatim, incl. scene content): sessions —
`Sessions`, `Search`, rows `Signups dip — investigation / Jimbo · COO`,
`Funnel research / Analyst · 2m`, `Landing copy pass / Writer · 5m`,
`Morning digest — run #142 / Workflow · 9h`, `Deploy checklist / Dev · 1d`.
Chat — pill `Jimbo · COO · claude`; composer `Message Jimbo…`; user msg
`Morning. Signups dipped 12% last week — find out why and fix what's
fixable.`; COO msgs `On it. I'll split this: funnel research to the analyst,
landing copy to the writer. I'll review both before anything ships.` and
`First signal: the pricing anchor slipped below the fold on mobile. Todo
#142 is open — the writer is on it.`; chips `↳ Delegated — analyst · funnel
investigation`, `↳ Delegated — writer · landing copy pass`. Org — header
`Org · 5 employees · 2 departments`; nodes `Jimbo / COO / claude`,
`Dev / Senior / claude`, `Designer / Senior / claude`,
`Analyst / Senior / codex`, `Writer / Junior / claude`; dept labels
`Platform`, `Growth`. Todos — header `Todos`, segments
`Active / Needs you / Done`; cards `Fix pricing anchor on mobile landing /
Writer / $0.42 / Session · landing-copy-pass / Open / Done · reviewed by
Jimbo`, `Funnel investigation — signups dip / Analyst / 12m`,
`Publish changelog for v0.24 / Blocked / Dev / waiting on release notes`,
`Rotate API keys / Dev / 2h`. Workflow — header `Morning digest · Run #142 ·
round 1`, badges `Running` / `Completed`; trigger chip `Every morning ·
09:00`; steps `Collect metrics / Completed · 12s`, `Draft digest / Writing
summary… / Completed · 8s`, `Approval gate / Queued / Waiting for your
review / Approved by you · 09:02`, `Post to Slack / Queued / Posted ·
09:02`. Triggers — header `Triggers · 3 bindings`; rows `Every morning ·
09:00 / runs Morning digest / cron / fired · 09:00 today`, `Todo → blocked /
wakes the COO / todo-status`, `POST /hooks/stripe / starts Refund review /
webhook`; run row `↳ run #142 started — Morning digest`.

**Night section**

- Kicker: `While you were away`
- H2: `It ran while you slept.`
- Body: `Triggers fire overnight. Workflows advance. Todos complete. Nothing
waits for morning — except the decisions that should.`
- Feed header: `Overnight · 6 events`
- Feed rows: `02:14 · cron fired — Nightly backup` / `02:31 · run #139
completed — Nightly backup` / `03:05 · webhook — refund request → Refund
review started` / `03:22 · todo done — Rotate API keys · reviewed` /
  `06:47 · analyst report filed — funnel investigation` / `09:00 · Morning
digest drafted — waiting for your review`

**Morning section**

- Kicker: `Morning`
- H2: `You approve what matters.`
- Body: `The COO reviews everything and parks the important calls at your
door. One tap, and it ships.`
- Approval card: `Jimbo · COO` / `Morning digest — run #142` / `Draft ready.
Numbers verified against the ledger.` / buttons `Hold`, `Approve` /
  approved line `Approved by you · 09:02`

**MCP section**

- Kicker: `MCP is the hands`
- H2: `One tool interface.` / `The whole company.`
- Body: `Every employee operates Jinn through the same MCP surface — org,
todos, workflows, sessions. A COO orchestrates, reviews, and gates
approvals, so you only see what matters.`
- Mono row: `create_work_item · delegate_task · start_workflow_run ·
decide_approval`

**Three steps** — kicker `From zero to company`; H2 `Three steps. Then it
runs.`; steps as written in §3/9 (01 Install / 02 Hire your team / 03 Let it
run, with the body copy above); step-1 pill `$ npm i -g jinn-cli`.

**Final CTA** — H2 `Your company is` / `one command away.`; command pill
`$ npm install -g jinn-cli`; links `GitHub →`, `npm →`.

**Footer** — `jinn` · `Open source · local-first · your keys, your machine`
· `GitHub` · `npm`.

**Links**: GitHub `https://github.com/hristo2612/jinn`; npm
`https://www.npmjs.com/package/jinn-cli`.

**A11y strings**: scene captions as written per scene in §3; pause control
label `Pause animation` / `Play animation`; copy buttons
`Copy install command`.

**404 page** (approved by Jimbo 2026-07-10) — title/meta:
`Page not found — Jinn`; H1: `Nothing here.` (amber period, same motif as
the page headlines); body: `The page you're looking for doesn't exist.`;
link: `Back home →` (to `/`).

No other text may appear on the page. If implementation needs a string not
listed here, it comes back to design first.

---

## 7. Taste guardrails (for the implementers)

1. **One thing moves at a time.** Inside a window, beats are sequential —
   staggered entrances are one gesture, not a fireworks show. Two scenes
   never animate simultaneously; the SceneController enforces it, your
   authoring must too.
2. **Amber is a salary, not a paint bucket.** At rest the dark page shows
   amber ONLY in: the brand mark, the nav Install pill, the H1 period, the
   send button, engine pills, the trigger chip, and accent-fill washes.
   Transient amber (pulses, fired states, the highlight in the night feed)
   must decay back within ~1.5s. If a frame has three amber elements
   competing, remove one.
3. **Honest states, always.** Running = blue + spinner. Done = green check.
   Waiting = bell/clock. Never green-before-done, never a gate that
   pre-resolves, never rail fill past the parked step. If a beat would lie
   about product state to look better, cut the beat.
4. **Typing feels human.** ~28ms/char with jitter, a beat of hesitation
   after punctuation. Assistant replies never type character-by-character —
   they arrive as composed blocks (that's how the real app feels).
5. **Easing discipline.** Only the token easings: `--ease-smooth` for
   entrances/fades, `--ease-spring` for small UI acknowledgments (button
   press, chip arrival), `--ease-snappy` for pane swaps. No bounce, no
   elastic, no overshoot on anything larger than a chip.
6. **The sunrise is one continuous sweep.** The theme inversion is a single
   900ms cross-tween of token values — never a section-boundary hard edge,
   never a flash of unstyled intermediate. Test scrolling INTO it slowly and
   fast; both must feel like dawn, not a light switch.
7. **Spacing rhythm is the layout.** Sections breathe on a consistent scale
   (~160px desktop / ~96px mobile vertical rhythm between sections; the
   night and morning sections get MORE, not less — silence before and after
   the theatrical move). Never tighten spacing to fit content; cut content.
8. **Pulses are bounded.** Every `pulse` beat is 1–2 cycles, then still.
   Nothing on the page blinks forever except the hero scene's loop (which
   has a pause control) and the app-faithful presence dots.
9. **The window is a product, not a prop.** Every surface must survive
   comparison with the real app component it mirrors (composer 22px radius,
   tonal staircase ribbon→sidebar→thread, state-glyph discs, node cards).
   When in doubt, open the real app source and match it.
10. **Dwell before reset.** A resolved state is the point of the scene —
    hold it. The hero loop dwells 5s; `once` scenes keep their resolved
    state permanently. Never reset a scene the visitor is still looking at.

---

## 8. Scene inventory refinement (vs TECH-PLAN)

| TECH-PLAN id        | Status here                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `delegation`        | Kept — hero, loops with pause control                                                                                                                                    |
| `employees`         | Kept — presence dots added as the micro-state                                                                                                                            |
| `todos`             | Kept — completion + "reviewed by Jimbo" payoff                                                                                                                           |
| `workflow-approval` | Kept — deliberately ends PARKED (resolution moved to morning)                                                                                                            |
| `trigger-fire`      | Kept — fires run #142 (same run, closes the loop backward)                                                                                                               |
| `night-shift`       | **Split**: `night-shift` (dark overnight feed, new surface: feed card) + `morning-approval` (owns the `theme` beat + approval payoff, reuses workflow gate/rail visuals) |

Net new surface work beyond the TECH-PLAN surface list: the overnight **feed
card** and the **approval card** — both are small compositions of existing
Ledger primitives (bg-secondary card, mono rows, state discs, two buttons),
not new dashboard panes.

Playback confirmations (PLAN §Orchestrator-decisions #5): `delegation` loops
with a visible pause control; all other scenes play `once` per activation
and retain their resolved state. Confirmed as designed above.

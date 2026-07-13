# jinn.run — Features Page Storyboard

**Phase B1 · Creative direction (jinn-designer, Fable 5) · 2026-07-11**

This is the single source of truth for the features page. Implementers build
exactly what is written here. Every scene is expressed in the approved
TECH-PLAN §3 action vocabulary (`type-text` / `replace-text` / `enter` /
`exit` / `set-state` / `set-progress` / `highlight` / `pulse` / `theme`).
**Vocabulary requests: none.** Machinery requests: none — the page compiles
to the shipped A-05/A-06/A-07 scene system (standalone looping windows, the
one page-wide motion channel, per-window pause controls). It needs **no
pin, no controller stages, no sunrise, no swap, no ambient followers.**

Reads with `STORYBOARD.md` (the landing — narrative + design language),
`STORYBOARD-AMENDMENT-1.md` (ambient laws, the 🧞 mark), and
`HANDOFF-A05.md` (scene machinery contract).

---

## 1. Page thesis

**The landing is a film; the features page is the same building toured in
daylight.** The landing proved "this is real" with one scripted day. The
features page answers the visitor's next question — _what exactly do I
get?_ — by opening every door of the same company: the engines, the org,
the ledger, the graph, the triggers, the hands, the rooms, the memory, and
the deed. Same window vocabulary, same fiction, same calm.

**Who comes here, and what they came to verify.** Three visitors: (1) the
landing scroller who clicked _Features_ wanting depth before installing;
(2) the GitHub/HN developer comparing against agent frameworks, asking "is
this deep or a demo?"; (3) the returning evaluator checking one specific
capability ("does it do webhooks? budgets? can I use Codex?"). The page
serves all three with one structure: a narrative section order for the
reader, and within each section a **fact rail** — spec-sheet-quiet rows of
verified, specific facts — for the scanner. Apple ships a product page
_and_ a tech-specs page; this page is both, composed.

**The composure trick.** A features page collapses into a checkbox grid
when every feature gets equal weight. Ours doesn't because it has a spine:
ten numbered sections in the order an operator _adopts_ the product
(engines → org → work → process → autonomy → hands → outside world →
the room → memory → ownership), each section one claim, one window, one
fact rail. Comprehensiveness lives in the rails; conviction lives in the
windows.

**The continuity thread (one fiction, whole page):** the landing's company
— Jimbo, the Dev, the Designer, the Analyst, the Writer — grows a support
desk today. You hire **Support** (§02, a new seat in the org). Support's
first refund parks at your door and you approve it at your desk (§03). The
_Support triage_ workflow that produced it is a visible graph whose run
parks at an approval gate (§04). A webhook from the ticket system starts
the next run (§05). The MCP calls that filed the work are on screen (§06).
And the day's second refund reaches you on Slack, where one ✅ reaction
resolves the parked run from §04 (§07) — the features page's quiet echo of
the landing's parked-gate → morning-approval structure. Two refunds, two
doors: one decided at the desk, one from your pocket.

**Relationship between the pages:** the landing persuades, features
verifies. The landing links here from the nav; this page links back and
forward (Docs, when Phase C ships). Nothing on this page re-tells the
landing's story; every vignette is a _new_ proof in the same world.

---

## 2. Feature inventory (verified 2026-07-11)

Every claim below was checked against the real repo before scripting.
Truth sources are files in `~/Projects/jinn`. Items marked ⚠️ are
**excluded or reworded** on the page — see §9 flags.

### A. Engines (§01)

| Fact                                                                                                                                                                           | Truth source                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Six engines: Claude Code, Codex, Grok, Antigravity, Pi, Hermes                                                                                                                 | `packages/jinn/src/shared/models.ts:53`; registered `gateway/server.ts:475-488` |
| Chat + raw-PTY (xterm) views per engine (Pi: chat only)                                                                                                                        | `server.ts:437-500`, `engines/*-interactive.ts`                                 |
| Effort levels per engine (claude low→max; codex low→xhigh; grok low→max)                                                                                                       | `models.ts:70-98`, `shared/effort.ts`                                           |
| Live model discovery from each CLI at boot                                                                                                                                     | `models.ts:150-215` + grok/hermes discovery                                     |
| Mid-session engine switching with context carry                                                                                                                                | `sessions/registry.ts:1234-1295` (`switchSessionEngine`, `engineSyncTarget`)    |
| Claude runs on your subscription: real `claude` in a node-pty, hooks for turn boundaries, per-session `ANTHROPIC_BASE_URL` SSE proxy, cost from the CLI's own transcript JSONL | `engines/claude-interactive.ts:160-168, 831-868`; `gateway/hook-registry.ts`    |
| Engine/Model/Effort picker in the composer, registry-driven                                                                                                                    | `web/src/components/chat/model-selector-row.tsx`                                |

### B. Employees & org (§02)

| Fact                                                                         | Truth source                                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Employees = YAML files in `~/.jinn/org/`; registry rebuilds on change        | `README.md` §org; `gateway/watcher.ts`                                                        |
| Ranks executive/manager/senior/employee; `reportsTo` any depth               | `README.md:171`; org resolution in gateway                                                    |
| Parent/child sessions; spawn with persona; parent notified on completion     | `mcp/session-tools.ts:156-188`; `sessions/callbacks.ts:31-64`                                 |
| Delegation completion contract with one automatic nudge for stalled children | `sessions/delegation-completion-contract.ts`                                                  |
| Lateral agent-to-agent messaging with hop caps                               | `mcp/session-tools.ts:197`; `gateway/session-comm-guards.ts`; `lateralMaxHops` `types.ts:722` |
| Spatial, zoomable org map (React Flow, d3-tree layout)                       | `web/src/components/org/org-map.tsx:1-68`                                                     |
| Session statuses idle/running/error/waiting/interrupted                      | `shared/types.ts:253`                                                                         |

### C. Todos (§03)

| Fact                                                                                                               | Truth source                                                                    |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Eight statuses: backlog, assigned, executing, in_review, done, blocked, escalated, cancelled                       | `work-items/store.ts:26-34`                                                     |
| Seven sources: human, delegation, cron, workflow, session, connector, goal                                         | `store.ts:35`                                                                   |
| Owner, department, acceptance criteria, budget cap per item                                                        | `store.ts:90-103`                                                               |
| Verify policy per item: trust / verify / thorough, bounded review rounds, auto-escalate at ceiling                 | `store.ts:47-71`                                                                |
| **Self-review ban** — the executing session cannot mark its own item done                                          | `work-items/transitions.ts:146-154`                                             |
| Approval flow: request → route (manager/COO default) → decide/escalate; approve at in_review ⇒ done, atomically    | `work-items/approvals.ts:23-32, 286-386`; `gateway/approval-authority.ts:66-79` |
| Needs-attention inbox (pending approvals routed to you + blocked/escalated) with real Approve / Send back controls | `store.ts:442-445`; `web/src/routes/todos/needs-you-view.tsx:165-190`           |
| Spend per item derived live from linked sessions, never stored                                                     | `store.ts:15-16, 547-555`                                                       |
| Append-only audit trail (status changes, notes, approval events)                                                   | `store.ts:224-315`                                                              |
| Workflow approval gates mirror into the todo approval queue                                                        | `approvals.ts:35, 334-373`                                                      |

### D. Workflows (§04)

| Fact                                                                                                                           | Truth source                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| A workflow is a node/edge graph — node types trigger, step, gate, switch, fail, wait                                           | `workflows/definition.ts:160-161`                                             |
| Gate kinds artifact / flag / approval; approval gates **park** the run until a person resolves — "nothing polls a human"       | `derive.ts:27-34`; `run-store.ts:169-187`; `run-reconciler.ts:75-76, 944-948` |
| Run lifecycle running / parked / dispatched / completed / failed; loop rounds bounded per run                                  | `run-store.ts:273-339`                                                        |
| Per-step retry policies (error / no-output / interrupted / timeout), timeouts stop the spend, error lanes                      | `definition.ts:62-96`                                                         |
| SOP authoring: plain steps + wake-up compile to the graph                                                                      | `workflows/sop.ts:49-57, 247-295`                                             |
| Edit a pending step's prompt mid-run; every edit versioned on the run                                                          | `run-store.ts:235-255`; MCP `edit_workflow_run_step_prompt`                   |
| Canvas UI: card list → per-workflow React Flow canvas, two lenses — Editor / **Executions replays runs on identical geometry** | `web/src/routes/workflow/page.tsx:10-18`, `canvas.tsx`                        |
| Plain-language node status vocabulary (`Up next`, `Running`, `Done`, `Waits for your approval`…)                               | `web/src/routes/workflow/status-line.ts`                                      |

### E. Triggers & cron (§05)

| Fact                                                                                                     | Truth source                                                           |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Five ways a workflow wakes: manual, schedule, todo-status-change, webhook, poll                          | `derive.ts:54-66`; `custom-triggers.ts:136`                            |
| Webhooks: per-binding secret tokens, sha256 at rest, timing-safe verify                                  | `custom-triggers.ts:165-166, 371-372, 494`; `gateway/api.ts:3542-3547` |
| Event payload filters: path + equals / notEquals / exists / matches (capped regex)                       | `custom-triggers.ts:138-144`                                           |
| Poll triggers are approval-gated before they may ever fire                                               | `custom-triggers.ts:685-695, 786-796`                                  |
| Todo-status triggers filter on source/department/assignee + from/to status                               | `todo-status-trigger.ts:56-60`                                         |
| Workflow schedules sync to managed cron jobs — "no LLM in the trigger path"                              | `shared/types.ts:287-305`; `cron/runner.ts:191-196`; `cron-sync.ts`    |
| Cron hot-reloads from `~/.jinn/cron/jobs.json`; run history kept; latency/failure alerts via a connector | `gateway/watcher.ts:93`; `cron/runner.ts:322-333`                      |

### F. MCP (§06)

| Fact                                                                                                                 | Truth source                                                    |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Built-in `jinn` MCP server; 40+ tools across todos, sessions, workflows, triggers, org, cron, knowledge, files, cost | `mcp/server.ts`, `mcp/*-tools.ts` (43 registered tools counted) |
| Per-employee MCP allow-lists (all / none / named servers)                                                            | `mcp/resolver.ts:30-82`                                         |
| External MCP servers over stdio or URL from one config block                                                         | `shared/types.ts:414-421`                                       |

### G. Connectors (§07)

| Fact                                                                                                                              | Truth source                                 |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Slack, Discord, Telegram, WhatsApp connectors                                                                                     | `connectors/*/index.ts`; `server.ts:504-517` |
| Slack threads map to sessions                                                                                                     | `connectors/slack/threads.ts`                |
| Reaction → action: an authorized user's reaction on a message becomes an agent instruction (⚠️ generic mechanism, worded as such) | `slack/index.ts:293-380`                     |
| Telegram voice/video notes transcribed by local Whisper                                                                           | `telegram/index.ts:186-250`; `stt/stt.ts`    |

### H. Dashboard (§08)

| Fact                                                                                                                                                | Truth source                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Chat-first home; streaming over WebSocket                                                                                                           | `web/src/main.tsx:45-46`; `hooks/use-live-session.ts`         |
| Chat ↔ CLI toggle — same session as rendered chat or live xterm                                                                                     | `routes/chat/page.tsx:533-586`; `components/cli-terminal.tsx` |
| Slash commands (+ skills as commands), @employee mentions, attachments, file viewer, markdown                                                       | `components/chat/chat-input.tsx:37-357`                       |
| Push-to-talk dictation (local Whisper) + local TTS voice (Kokoro)                                                                                   | `components/stt/*`, `talk/kokoro.ts`                          |
| Todos board (Active / Needs you / People), workflow canvas, spatial org map, cron page, skills catalog with in-app editing, activity logs, settings | `web/src/main.tsx:45-62`; `routes/*`                          |
| **Limits page: live per-engine quota meters** (Claude/Codex/Grok windows, % used, reset times)                                                      | `routes/limits/page.tsx:13-95`                                |
| Mobile-first: iOS-style bottom tab bar, ≥49px targets                                                                                               | `components/chat/mobile-tab-bar.tsx`                          |
| 🧞 emoji favicon (configurable portal emoji)                                                                                                        | `components/emoji-favicon.tsx:7-30`                           |

### I. Skills & knowledge (§09)

| Fact                                                                                                                                  | Truth source                                               |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Skills = `~/.jinn/skills/<name>/SKILL.md` with YAML frontmatter                                                                       | `gateway/skills.ts:5-67`; `shared/paths.ts:33`             |
| Auto-symlinked into each engine's native skills dir; watched, re-synced live                                                          | `gateway/watcher.ts:25-68, 117-126`                        |
| Find/add community skills: `jinn skills find` / `jinn skills add`                                                                     | `cli/skills.ts:121-196`                                    |
| Knowledge: deterministic (no-LLM) search + read over `~/.jinn/knowledge` + `docs`, scoped roots — secrets unreachable by construction | `knowledge/store.ts:6-49`; `mcp/knowledge-tools.ts:72-100` |

### J. Local-first & governance (§10)

| Fact                                                                             | Truth source                                                      |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Gateway binds 127.0.0.1 by default; strict host allow-list                       | `server.ts:111-121, 327`                                          |
| Remote dashboard access requires pairing — short-TTL codes, hashed device tokens | `gateway/auth.ts`                                                 |
| All state local: SQLite + plain files under `~/.jinn`                            | `shared/paths.ts:26-35`; `sessions/registry.ts:318`               |
| No telemetry, no analytics SDK, no phone-home (only model-weight downloads)      | repo-wide grep, verified                                          |
| Per-employee monthly budgets: warning at 80%, paused at 100%                     | `gateway/budgets.ts:5-21`; enforced `sessions/manager.ts:414-428` |
| `cost_report` tool: real spend by employee or day                                | `mcp/cost-tools.ts:50-88`                                         |
| MIT license, open source                                                         | `LICENSE`                                                         |

---

## 3. Page structure

| #   | Section               | Window / proof                            | Scene id        |
| --- | --------------------- | ----------------------------------------- | --------------- |
| 0   | Nav                   | —                                         | —               |
| 1   | Hero                  | — (pure type, fast to content)            | —               |
| 2   | 01 Engines            | chat pane (reuse)                         | `engine-switch` |
| 3   | 02 Employees          | org pane (reuse)                          | `org-hire`      |
| 4   | 03 Todos              | todos pane (reuse)                        | `todo-approval` |
| 5   | 04 Workflows          | **canvas-mini** (new surface)             | `triage-run`    |
| 6   | 05 Triggers           | triggers pane (reuse, dark-scoped window) | `webhook-fire`  |
| 7   | 06 MCP                | feed card (reuse, tool-call data)         | `mcp-hands`     |
| 8   | 07 Connectors         | **connector-card** (new surface)          | `slack-approve` |
| 9   | 08 Dashboard          | — (pure type + chip row)                  | —               |
| 10  | 09 Skills & knowledge | — (static SKILL.md file card)             | —               |
| 11  | 10 Local-first        | — (static `~/.jinn` tree card)            | —               |
| 12  | Final CTA             | —                                         | —               |
| 13  | Footer                | —                                         | —               |

No pinning at any breakpoint. Every window is a **stage-local standalone
window** (the landing's proven mobile pattern, promoted to all breakpoints
here): pane-only crops — no icon ribbon, no sessions sidebar — activating
once on viewport entry and looping. The full dashboard chrome belongs to
the landing's showcase; repeating it here would compete with it, and the
crops keep each section's proof singular.

**Section rhythm (desktop):** kicker → title → body (max-width 560px) →
window (max-width 720px for panes/cards; 860px for the canvas) → fact
rail (max-width 640px). Text block and window alternate sides on desktop
(text-left/window-right, then mirrored) every other section; the rail
always sits under the window, full column. ~160px vertical rhythm between
sections, per the landing's spacing law.

**Fact rail (new composition, not a scene surface):** 3–5 rows; each row =
mono label (11px, the kicker voice, `--text-secondary`) + one sentence
(15px, `--text-secondary`). No icons, no borders, no cards — row
separation is whitespace only (18px). It must read like a spec sheet
printed on the page, not like a component.

**Playback policy (all seven scenes):** `loop`. Activate on viewport
entry; claim the one page-wide motion channel (most recent visible claim
wins; the machinery already enforces single ownership). Dwell at resolved
6000–8000ms per scene as scripted, then the established 600ms whole-frame
quiet fade-reset. One ≥44px pause control per window (`Pause animation` /
`Play animation`). Pause offscreen and on `visibilitychange`. Reduced
motion / no-JS: the resolved state is server-rendered and static —
complete proof, zero timelines. No ambient followers anywhere on this page
(a loop already breathes; a follower would double the motion).

**Scene cycle budget (authoring envelope, enforced):** each cycle 10–16s
total (well inside 10–45s), beat starts ≥400ms apart, non-text motion
≤600ms, pulses 1–2 cycles then still, honest states without exception.

**Fiction ledger (features page).** Employees: the landing's five + the
new `Support / Employee / codex`. Run numbers introduced here: **#147**
(Support triage, parked at its refund gate) and **#148** (Support triage,
webhook-started). The landing's #142 Morning digest appears only as the
referenced cron binding row; #139/#140 are not referenced. Orders:
**#8841** ($49 refund, decided at the desk) and **#8867** ($129 refund,
decided from Slack — resolving run #147). Times are late morning →
afternoon of the day after the landing's story: 10:56 → 14:05. No other
run/order numbers may appear.

---

## 4. Section-by-section script

### Section 0 — Nav

The landing's frosted pill nav, shared verbatim (🧞 glyph + `jinn`
wordmark, GitHub, npm, amber `Install` pill) **plus a `Features` text
link** on both pages, sitting left of `GitHub`. The current page's link
renders `--text-primary`; the other page's `--text-secondary`. On the
features page the nav is statically light (it inherits the page theme; the
page is light — §5). `Install` anchors to this page's final CTA. A `Docs`
link joins the row when Phase C ships — do not render a dead link before
that.

*(Site-wide delta this implies for the landing: the same `Features` link
added to its nav and footer. Mobile nav on both pages: brand + `Features`

- `Install` — GitHub/npm stay in the footer.)*

---

### Section 1 — Hero (pure type)

**Eyebrow (mono, kicker voice):** `The full inventory`
**H1 line 1 (thin):** `All the`
**H1 line 2 (bold):** `moving parts.` (amber period)
**Sub:** _You've watched the company run. This is everything it runs on —
six engines, a real org, a work ledger, workflows with human gates, and
the triggers that wake them. Every window below shows the real interface
doing it._
**CTA row:** command pill `$ npm install -g jinn-cli` (copy) + ghost link
`View on GitHub →`.

**Layout intent:** the landing hero's type system at reduced scale — H1
`clamp(38px, 5vw, 72px)`, same weight contrast (thin 250 / bold 640), same
line-mask rise entrance, **no weight bloom** (that's the landing hero's
one-time signature; repeating it cheapens it) and **no window**. The hero
occupies ~70vh, not 100 — this page's job is to get you to the parts
quickly. Section 01's window crop should peek above the fold at 1440×900:
the scroll invitation.

---

### Section 2 — 01 Engines + `engine-switch`

**Kicker:** `01 / Engines`
**Title:** `The engines you already pay for.`
**Body:** _Claude Code, Codex, Grok, Antigravity, Pi, Hermes — whatever is
on your PATH becomes an engine. Pick engine, model, and effort per
employee or per session. Switch mid-conversation; the context comes
along._

**Engine row (static, under the body):** six text chips in the app's
engine-pill treatment — `Claude Code · Codex · Grok · Antigravity · Pi ·
Hermes`. Chips are text on `--fill-tertiary`, no borders, no logos (we
don't render third-party marks).

**Fact rail:**

- `subscription` — _The Claude engine drives the official CLI in a real
  terminal, so work bills to your flat-rate plan — not an API meter._
- `discovery` — _Models are discovered from each CLI at boot. New model in
  your CLI, new option in the picker._
- `effort` — _Effort dials from low to max, resolved per engine, per
  employee, per session._
- `honesty` — _Engines whose binary isn't installed are simply hidden.
  Nothing pretends to be available._

#### Scene `engine-switch`

- **Claim:** Engines are interchangeable mid-conversation — the same
  session, a different brain, context intact.
- **Surface:** chat pane (reuse). Header pill `Dev · Senior · claude`;
  composer placeholder `Message Dev…`.
- **Initial state:** thread holds one exchange — user msg `Review the
payments webhook diff before we ship it.` and Dev reply `Reviewed. One
concern — the retry handler swallows 4xx errors. Patch drafted.`
- **Timeline:**

| t (ms) | dur | target         | action         | detail                                                                                                             |
| ------ | --- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------ |
| 0      | 600 | pill.engine    | `highlight`    | soft lift on the header pill — the picker affordance                                                               |
| 700    | 350 | pill.engine    | `replace-text` | engine token `claude` → `codex` (crossfade)                                                                        |
| 1500   | 900 | composer.input | `type-text`    | `Fresh eyes — re-check it.` (~28ms/char, jitter)                                                                   |
| 2600   | 150 | composer.input | `exit`         | send                                                                                                               |
| 2600   | 350 | msg.user-2     | `enter`        | user bubble rises                                                                                                  |
| 3100   | 250 | thread.typing  | `enter`        |                                                                                                                    |
| 3900   | 150 | thread.typing  | `exit`         |                                                                                                                    |
| 3900   | 400 | msg.dev-2      | `enter`        | `Agree on the retry handler — and the signature check ignores the timestamp tolerance. Both patched, tests green.` |

- **Checkpoints:** `initial` (0) · `switched` (1200) · `sent` (3000) ·
  `resolved` (4400).
- **Playback:** loop · dwell 6000ms · quiet reset 600ms (cycle ≈ 11s).
- **Caption:** "Mid-review, the session's engine switches from Claude to
  Codex. The next reply is a second opinion from a different model — in
  the same conversation, with the same context."
- **Implementer note:** the pill swap is the entire depiction of the
  switch — the app performs it from the composer's engine picker; we do
  not script the menu, and no invented system line may appear.

---

### Section 3 — 02 Employees + `org-hire`

**Kicker:** `02 / Employees`
**Title:** `Employees are files.`
**Body:** _Personas, ranks, departments, and reporting lines of any depth
— each employee is one YAML file in ~/.jinn/org. Describe a role in chat
and the COO drafts it; edit the file and the org rebuilds live._

**Fact rail:**

- `ranks` — _Executive, manager, senior, employee — rank sets the default
  reporting line; reportsTo overrides it to any depth._
- `delegation` — _Any session spawns child sessions that report back on
  completion — with a contract that nudges stalled work exactly once._
- `lateral` — _Employees can message each other directly, hop-capped so a
  conversation loop can't run away._
- `map` — _The org chart is a live spatial map — pan it, zoom it, watch
  running sessions light up._

#### Scene `org-hire`

- **Claim:** Growing the org is one new file — a hire takes a seat the
  moment it exists.
- **Surface:** org pane (reuse). Initial state = the landing's resolved
  org: header `Org · 5 employees · 2 departments`; Jimbo/COO over
  Platform (Dev, Designer) and Growth (Analyst, Writer); analyst + writer
  presence dots active (canonical resolved data).
- **Timeline:**

| t (ms) | dur | target             | action         | detail                                       |
| ------ | --- | ------------------ | -------------- | -------------------------------------------- |
| 0      | 600 | node.coo           | `pulse`        | one soft amber wash — the COO files the hire |
| 800    | 300 | pane.header        | `replace-text` | → `Org · 6 employees · 3 departments`        |
| 1300   | 250 | org.branch-support | `enter`        | new connector stub draws                     |
| 1700   | 300 | dept.support       | `enter`        | dept label `Support`                         |
| 2200   | 350 | node.support       | `enter`        | `Support / Employee / codex` node rises      |
| 3000   | 250 | node.support       | `set-state`    | presence → `active` (green dot enters)       |

- **Checkpoints:** `initial` (0) · `seated` (2800) · `resolved` (3400).
- **Playback:** loop · dwell 6000ms · quiet reset 600ms (cycle ≈ 10s).
- **Caption:** "A support role described in chat becomes a YAML file — and
  a seat. The header recounts, the department appears, and the new
  employee's first session lights up."
- **Layout note:** the third department group grows the pane — use the
  established collapsed-hidden reveal (max-height + negative-margin
  transition) so the chart widens as one calm gesture; reserve the
  resolved footprint on the frame (`min-height`) per the CLS rule.

---

### Section 4 — 03 Todos + `todo-approval`

**Kicker:** `03 / Todos`
**Title:** `Done means reviewed.`
**Body:** _Every piece of work is a Todo with an owner, a status, and an
audit trail. A session can't mark its own work done — a reviewer does. And
when a call needs a human, it waits in Needs you until you decide._

**Fact rail:**

- `states` — _Eight honest states, backlog to done — including blocked and
  escalated. Nothing hides in "in progress."_
- `sources` — _Work arrives from you, delegation, cron, workflows,
  sessions, connectors — every item stamped with where it came from._
- `review` — _A verify policy per item — trust, verify, or thorough — with
  bounded review rounds that auto-escalate at the ceiling._
- `spend` — _Cost per item is summed live from its sessions. Never stored,
  never stale._
- `audit` — _Every transition, note, and decision appends to an immutable
  event log._

#### Scene `todo-approval`

- **Claim:** Risky work parks at your door — routed, decided, and recorded.
- **Surface:** todos pane (reuse). Tabs use the app's real segments:
  `Active` · `Needs you` · `People`. Initial: `Active` selected, count 3;
  three cards — `Refund order #8841 — $49` (Support, `In review` state
  glyph), `Triage: login loop on Android` (Support, executing, blue
  spinner), `Write the refund policy page` (Writer, assigned).
- **Timeline:**

| t (ms) | dur | target             | action         | detail                                                                                                                                                                                               |
| ------ | --- | ------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0      | 350 | card.refund        | `highlight`    | soft fill lift — the eye lands on the refund                                                                                                                                                         |
| 600    | 300 | card.refund        | `set-state`    | → approval-requested (badge `Approval requested` enters; amber wash decays)                                                                                                                          |
| 1100   | 300 | tab.needs          | `set-state`    | count → `1`, alert dot enters                                                                                                                                                                        |
| 1700   | 350 | pane.needs         | `highlight`    | segment moves to `Needs you`; view swaps to the approval row: request text `Card was double-charged — refund $49 to order #8841.` + buttons `Approve` (green tint, check icon) / `Send back` (quiet) |
| 2600   | 300 | row.refund.approve | `pulse`        | one press pulse on Approve                                                                                                                                                                           |
| 2900   | 300 | row.refund         | `set-state`    | → decided (buttons resolve out; green check disc)                                                                                                                                                    |
| 3300   | 300 | row.refund.status  | `replace-text` | → `Approved by you · 11:42 — Todo done`                                                                                                                                                              |

- **Checkpoints:** `initial` (0) · `requested` (1400) · `needs-you` (2300)
  · `resolved` (3600).
- **Playback:** loop · dwell 6500ms · quiet reset 600ms (cycle ≈ 11s).
- **Caption:** "Support requests approval on a $49 refund. It lands in
  Needs you, routed to you. One tap approves — the item completes, and the
  decision is on the record."
- **Honesty notes:** the Approve control is the app's real green-tinted
  pill with `Send back` beside it (not the landing card's amber Approve —
  different surface, both product-true). Approve at `in_review` completes
  the item atomically — that is the shipped consequence, so the status
  line may say so. The decided row holds through the dwell; it never
  vanishes mid-read.

---

### Section 5 — 04 Workflows + `triage-run`

**Kicker:** `04 / Workflows`
**Title:** `Process you can see.`
**Body:** _A workflow is a real graph — steps, branches, gates, waits —
drawn on a canvas and run by the gateway. The Executions lens replays
every run on the same geometry. When a gate needs a human, the run parks.
Nothing polls you; nothing fakes done._

**Fact rail:**

- `nodes` — _Six node types: trigger, step, gate, switch, fail, wait._
- `gates` — _Three gate kinds — artifact, flag, approval. An approval gate
  holds the run until a person decides._
- `resilience` — _Per-step retries with named causes, timeouts that stop
  the spend, and error lanes that route failure instead of hiding it._
- `sop` — _Or skip the canvas: write a plain SOP — steps and a wake-up —
  and Jinn compiles the graph._
- `mid-run` — _Edit a pending step's prompt while the run is live; every
  edit is versioned on the run record._

#### Scene `triage-run` (new surface: `canvas-mini` — see §7)

- **Claim:** A run advances through a visible graph — it branches on a
  switch and parks at a human gate.
- **Surface:** `canvas-mini`. Window title row: `Support triage` ·
  segmented lens control `Editor | Executions` (Executions active —
  static chrome, decorative) · run chip `Run #147 · Running now`. Fixed
  hand-authored geometry, six nodes, two lanes after the switch:

  `Ticket received` (trigger, glyph node, sub `event · ticket.created`) →
  `Triage ticket` (step) → `Route` (switch) → lane A `Reply to customer`
  (step) / lane B `Approval — refunds` (gate, bell) → `Send refund`
  (step). Node status lines use the app's exact vocabulary
  (`status-line.ts`): `Up next`, `Running`, `Done`,
  `Waits for your approval`.

- **Initial state:** all nodes present with wires? No — the cycle opens by
  drawing the graph (below); the SSR/reduced resolved state is the full
  graph at the parked checkpoint.
- **Timeline:**

| t (ms) | dur | target                      | action         | detail                                                                                  |
| ------ | --- | --------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| 0      | 500 | canvas.nodes + canvas.wires | `enter`        | nodes then wires, 80ms stagger — one gesture, L→R                                       |
| 900    | 500 | node.trigger                | `set-state`    | → fired: one amber disc pulse (decays), status `Done`, label `fired · 11:12`            |
| 1500   | 350 | node.triage                 | `set-state`    | `Up next → Running` (blue spinner)                                                      |
| 2600   | 350 | node.triage                 | `set-state`    | `Running → Done` (green check)                                                          |
| 3100   | 300 | node.route                  | `set-state`    | switch resolves → `Done`                                                                |
| 3500   | 400 | edge.route-refund           | `set-progress` | the refund lane's wire takes the fill — direction is meaning; lane A's wire stays quiet |
| 4600   | 350 | node.gate                   | `set-state`    | `Up next → awaiting-approval` (clock → bell), status `Waits for your approval`          |
| 5000   | 900 | node.gate                   | `pulse`        | exactly two soft amber pulses, then still                                               |
| 5900   | 250 | run.chip                    | `set-state`    | `Running now → Waiting for you`                                                         |

- **Explicitly forbidden:** fill past the gate; any state change on
  `Reply to customer` (the un-routed lane keeps its quiet `Up next` — the
  product has no "skipped" presentation, so we do not invent one); `Send
refund` stays `Up next`; the run chip never reads completed.
- **Checkpoints:** `initial` (0) · `routed` (4300) · `parked` (6200 =
  resolved).
- **Playback:** loop · dwell 8000ms (the parked state is the payoff) ·
  quiet reset 600ms (cycle ≈ 15s).
- **Caption:** "The Executions lens replays run #147 on the workflow's own
  canvas: the ticket event fires, triage completes, the switch routes down
  the refund lane — and the run parks at the approval gate, waiting for
  you. The refund step stays untouched until you say so."
- **Continuity:** this parked gate is the one a ✅ reaction resolves in
  §07's Slack scene. It stays parked here, permanently — same discipline
  as the landing's §4.

---

### Section 6 — 05 Triggers + `webhook-fire`

**Kicker:** `05 / Triggers`
**Title:** `Work starts without you.`
**Body:** _Five ways a workflow wakes: a schedule, a todo changing status,
a token-authenticated webhook from the outside world, a poll watching for
changes — or you. Schedules become managed cron jobs with no model in the
trigger path._

**Fact rail:**

- `webhooks` — _Every webhook binding carries its own secret token —
  hashed at rest, verified timing-safe._
- `filters` — _Event triggers filter on payload paths: equals, exists,
  match._
- `polls` — _A poll trigger must be approved before it may ever fire._
- `cron` — _Cron jobs hot-reload from a JSON file, keep run history, and
  alert you through a connector when they run slow or fail._

#### Scene `webhook-fire`

- **Claim:** The outside world can start real work — token-authenticated,
  filtered, and on the record.
- **Surface:** triggers pane (reuse), **dark-scoped window** — this window
  alone renders in the dark Ledger theme on the light page (§5: "the night
  window"). Header `Triggers · 4 bindings`. Initial rows (kind labels
  mono, right-aligned):
  1. `Every morning · 09:00 → runs Morning digest` · `cron`
  2. `Todo → blocked → wakes the COO` · `todo-status`
  3. `POST /hooks/tickets → starts Support triage` · `webhook` · token
     chip `tok_…9f2`
  4. `Poll · support inbox · 5m → starts Support triage` · `poll`
- **Timeline:**

| t (ms) | dur | target                                  | action      | detail                                                                |
| ------ | --- | --------------------------------------- | ----------- | --------------------------------------------------------------------- |
| 0      | 450 | binding.cron / .todo / .webhook / .poll | `enter`     | 120ms stagger                                                         |
| 1400   | 600 | binding.webhook                         | `pulse`     | one amber wash — the POST arrives                                     |
| 2000   | 250 | binding.webhook                         | `set-state` | → fired (disc amber; label `fired · 11:38 today` enters)              |
| 2450   | 350 | run.row                                 | `enter`     | `↳ run #148 started — Support triage` slides in under the webhook row |

- **Checkpoints:** `initial` (0) · `fired` (2300) · `resolved` (2800).
- **Playback:** loop · dwell 7000ms · quiet reset 600ms (cycle ≈ 10.5s).
- **Caption:** "Four bindings — a schedule, a todo watcher, a shared-secret
  webhook, a poll. The ticket system POSTs to /hooks/tickets with the
  binding's token and run #148 starts. The token chip is a shared-secret
  token preview."
- **Surface delta (data-level, not a new surface):** the pane gains a 4th
  row, the `poll` kind label, and a small mono token chip on the webhook
  row — canonical-data extensions of the shipped triggers surface, same
  row anatomy.

---

### Section 7 — 06 MCP + `mcp-hands`

**Kicker:** `06 / MCP`
**Title:** `Forty tools. Every hand.`
**Body:** _Jinn ships its own MCP server — one tool surface for todos,
workflows, sessions, org, knowledge, and cost. Every employee works the
company through the same hands, whatever engine they run on. Allow-list
servers per employee; bring any external MCP server you already use._

**Fact rail:**

- `surface` — _40+ tools: create_work_item, delegate_task,
  start_workflow_run, decide_work_item_approval, search_knowledge,
  cost_report…_
- `allow-lists` — _Per employee: all servers, none, or exactly the ones
  you name._
- `external` — _Attach outside MCP servers over stdio or URL from one
  config block._

#### Scene `mcp-hands`

- **Claim:** An employee runs the company through tool calls — filed,
  answered, and routed like anything else.
- **Surface:** feed card (reuse of the landing's overnight-feed card
  surface with tool-call canonical data — same mono rows, same card).
  Header `support · MCP · 4 calls`. Rows carry a call (mono) and a result
  that lands a beat later — the honest async texture.
- **Initial state:** card empty except the header.
- **Timeline:**

| t (ms) | dur | target    | action      | detail                                               |
| ------ | --- | --------- | ----------- | ---------------------------------------------------- |
| 0      | 350 | feed.card | `enter`     | card rises                                           |
| 500    | 300 | row.1     | `enter`     | `search_knowledge · "refund policy"` (pending glyph) |
| 1000   | 250 | row.1     | `set-state` | → ok · result `3 hits`                               |
| 1500   | 300 | row.2     | `enter`     | `create_work_item · Refund order #8841 — $49`        |
| 2000   | 250 | row.2     | `set-state` | → ok · result `wi_1058`                              |
| 2500   | 300 | row.3     | `enter`     | `update_work_item · wi_1058 → in_review`             |
| 3000   | 250 | row.3     | `set-state` | → ok                                                 |
| 3500   | 300 | row.4     | `enter`     | `request_work_item_approval · wi_1058`               |
| 4000   | 250 | row.4     | `set-state` | → ok · result `routed to COO`                        |
| 4400   | 400 | row.4     | `highlight` | soft amber wash on the routed approval — decays      |

- **Checkpoints:** `initial` (0) · `calling` (2200) · `resolved` (4800).
- **Playback:** loop · dwell 6000ms · quiet reset 600ms (cycle ≈ 11.4s).
- **Caption:** "The support employee checks the refund policy, files the
  todo, moves it to review, and requests approval — four MCP calls. These
  are the same tools every employee gets."
- **Continuity:** these calls are the §03 refund's origin story (wi_1058 =
  order #8841), timestamped before it: this card is 10:56–10:58.

---

### Section 8 — 07 Connectors + `slack-approve`

**Kicker:** `07 / Connectors`
**Title:** `The company, wherever you are.`
**Body:** _Slack, Discord, Telegram, WhatsApp. Threads become sessions, a
reaction on a decision card is enough to act — and a Telegram voice note
is transcribed on your machine before it reaches an employee._

**Fact rail:**

- `threads` — _A Slack thread maps to a session — the conversation and the
  work stay in one place._
- `reactions` — _React to a decision card and the agent acts on it.
  Approval from your pocket._
- `voice` — _Voice and video notes transcribed by local Whisper. Audio
  never leaves your machine._

#### Scene `slack-approve` (new surface: `connector-card` — see §7)

- **Claim:** A parked decision travels to where you are — and one reaction
  resolves it.
- **Surface:** `connector-card` — a generic messenger thread card (no
  third-party trade dress): channel line `#support · via Slack`, one
  message with sender line `Jimbo · COO · 14:04`, a reaction chip slot,
  one threaded reply row.
- **Initial state:** card shows the message: `Refund request — order
#8867, $129. Card charged twice; support recommends refunding. React ✅
to approve.` No reaction, no reply.
- **Timeline:**

| t (ms) | dur | target         | action  | detail                                                |
| ------ | --- | -------------- | ------- | ----------------------------------------------------- |
| 0      | 350 | connector.card | `enter` | card rises                                            |
| 1200   | 300 | reaction.check | `enter` | `✅ 1` chip arrives (spring — a small acknowledgment) |
| 2200   | 350 | reply.row      | `enter` | `↳ Approved — refund sent, run #147 resumed. · 14:05` |

- **Checkpoints:** `initial` (0) · `reacted` (1500) · `resolved` (2600).
- **Playback:** loop · dwell 7000ms · quiet reset 600ms (cycle ≈ 10.2s).
- **Caption:** "The COO brings the day's second refund to Slack. Your ✅
  reaction is the instruction — the agent acts on it, the refund goes out,
  and the run that was parked at the gate resumes."
- **Honesty note:** the mechanism is Jinn's authorized-user
  reaction-to-action path — the agent proposes the ✅ convention in its own
  message, which is exactly how it is used. We do not claim a dedicated
  approval-emoji primitive.
- **Continuity payoff:** `run #147 resumed` closes the gate left parked in
  §04 — the page's structural echo of the landing's morning approval.

---

### Section 9 — 08 Dashboard (pure type + chip row)

**Kicker:** `08 / Dashboard`
**Title:** `You've been looking at it.`
**Body:** _Every window on this page is the dashboard at localhost:7777 —
chat-first, streaming everywhere, with a raw terminal view one toggle
away. The org map, the todo board, the workflow canvas, cron, activity
logs, live engine-quota meters, a skills catalog. And it all fits your
phone._

**Surface chip row (static, under the body):** mono text chips —
`Chat · CLI · Org map · Todos · Canvas · Cron · Logs · Limits · Skills ·
Files · Settings`.

**Fact rail:**

- `terminal` — _Chat ↔ CLI: the same session rendered as chat or attached
  as a live terminal._
- `meters` — _The Limits page shows each engine's real quota windows —
  watch your rate limits, not an invoice._
- `input` — _Slash commands, @employee mentions, attachments, push-to-talk
  dictation — Whisper and the voice run locally._
- `mobile` — _A native-feeling phone layout with its own tab bar. Run the
  company from the sofa._

No scene. The section's proof is the page itself; a window here would be
redundant chrome. This is the page's one deliberate rest between vignettes
and the closing statics.

---

### Section 10 — 09 Skills & knowledge (static file card)

**Kicker:** `09 / Skills & knowledge`
**Title:** `Institutional memory.`
**Body:** _Skills are markdown playbooks every engine follows natively —
one folder, one SKILL.md, synced into each CLI automatically. Knowledge is
plain files every employee searches through the same two tools. Teach the
company once._

**Static composition:** a file card (QuietCard treatment, mono type) —
header `~/.jinn/skills/support-triage/SKILL.md`, body snippet:

```
---
name: support-triage
description: How we answer tickets — tone, refunds, escalation.
---
1. Read the ticket and the customer's history.
2. Refunds over $25 → request approval first.
…
```

**Fact rail:**

- `sync` — _Auto-symlinked into every engine's native skills directory —
  watched, re-synced the moment a file changes._
- `catalog` — _Browse and edit every skill in the dashboard._
- `community` — _Find and add community skills with one command._
- `knowledge` — _search_knowledge and read_knowledge: deterministic
  search, no model in the loop, scoped so secrets are unreachable by
  construction._

---

### Section 11 — 10 Local-first (static tree card)

**Kicker:** `10 / Local-first`
**Title:** `Yours. Actually yours.`
**Body:** _The gateway binds to 127.0.0.1. State is SQLite and plain files
under ~/.jinn — all of it readable, editable, committable. No telemetry,
no cloud dependency, MIT-licensed. Give an employee a monthly budget and
Jinn pauses them at the line._

**Static composition:** a mono tree card —

```
~/.jinn
├── config.yaml        # the gateway, hot-reloaded
├── org/               # employees, one YAML each
├── skills/            # playbooks, one folder each
├── cron/jobs.json     # schedules, hot-reloaded
├── knowledge/         # what the company knows
└── sessions/          # history, SQLite
```

**Fact rail:**

- `access` — _Remote dashboard access requires pairing — short-lived
  codes, hashed device tokens._
- `budgets` — _Per-employee monthly budgets: a warning at 80%, paused at
  100%._
- `cost` — _One cost_report tool sums real spend by employee or by day._
- `license` — _MIT. The whole company is open source._

---

### Section 12 — Final CTA

**H2 line 1 (thin):** `All of it.`
**H2 line 2 (bold):** `One command.` (amber period)
**CTA:** command pill `$ npm install -g jinn-cli` (copy) centered.
**Links row:** `GitHub →` · `npm →` (ghost).

Same quiet-close layout as the landing's §10 — the command is the object.

---

### Section 13 — Footer

The landing footer, shared, **plus a `Features` link** (and `Docs` when it
ships): 🧞 + `jinn` · `Open source · local-first · your keys, your
machine` · spring · `Features` · `GitHub` · `npm`.

---

## 5. Theme + nav arc

**The features page is light, end to end.** The landing owns the site's
one theatrical move — dark night, sunrise, light morning. This page is
what comes after morning: **the working day.** Inspection happens in
daylight; a page whose job is verification should feel like nothing is in
shadow. No page-level theme beat, no second sunrise, no dark mirror. The
type system, amber salary (light theme's ochre `--accent`), and spacing
rhythm carry over unchanged.

**The one dark surface: the night window (§05 Triggers).** The triggers
vignette's window alone is scoped `data-theme="dark"` — a window into the
part of the company that works while you sleep, on a daylight page. It is
honest (the app is fully theme-aware; a dark window is the real product in
its other coat), it is a callback to the landing's night, and it gives the
page's midpoint one moment of tonal depth without spending a theme move.
Rules: exactly one dark-scoped window on the page, ever; the window's
internal tokens flip completely (no mixed-theme surfaces); its pause
control and caption stay page-themed (they belong to the page, not the
window). If in implementation the dark window reads as a patch rather than
a view — screenshot both candidates and bring it back to design; the
fallback is a page-consistent light window, zero other changes.

**Nav:** shared component, statically light on this page; `Features` link
added site-wide (§4.0). **Cross-links:** landing nav/footer → `/features`;
features nav/footer → `/` (brand) and later `/docs`. The final CTA is
shared behavior with the landing (copy pill + ghost links).

**No-JS / reduced motion:** the page is statically light; every scene
window server-renders its resolved state (the parked canvas, the decided
approval, the fired webhook…), captions visible. The proof survives with
zero animation, exactly like the landing.

---

## 6. Mobile spec (per section)

Global: no pinning exists on this page at any breakpoint, so mobile is a
narrowing, not a re-architecture. Windows go full-width (16px gutters),
scenes play identically on viewport entry. All tap targets ≥44px.
Text-block/window side alternation collapses to a single column
(text → window → rail) everywhere.

| Section        | Mobile treatment                                                                                                                                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nav            | Brand + `Features` + `Install` pill; GitHub/npm in the footer                                                                                                                                                                                                                                                          |
| Hero           | H1 at clamp floor (~38–42px), sub 16px, command pill full-width, ~60vh                                                                                                                                                                                                                                                 |
| 01 Engines     | Chat window full-width (the landing's proven chat-pane crop); engine chip row wraps to two lines, centered                                                                                                                                                                                                             |
| 02 Employees   | Org pane: departments stack vertically, nodes full-width, single vertical stub (landing's mobile org pattern); the third dept extends the stack                                                                                                                                                                        |
| 03 Todos       | Cards full-width; segment tabs stay one row (three fit at 390); Approve/Send back ≥44px                                                                                                                                                                                                                                |
| 04 Workflows   | Canvas-mini rotates to a **vertical spine**: trigger at top, flow downward; the switch's two lanes render as two half-width columns under it (nodes ~min 150px, clamped 2-line titles); wires re-authored for the vertical geometry (fixed layout, so this is a second hand-authored arrangement, not a layout engine) |
| 05 Triggers    | Rows full-width; kind labels stay mono right-aligned; token chip wraps under the row text if needed; dark scope unchanged                                                                                                                                                                                              |
| 06 MCP         | Feed card full-width; call/result rows keep a hanging indent so wrapped rows stay aligned                                                                                                                                                                                                                              |
| 07 Connectors  | Card full-width; reaction chip ≥32px visual, message text 15px                                                                                                                                                                                                                                                         |
| 08 Dashboard   | Chip row wraps to 2–3 centered lines                                                                                                                                                                                                                                                                                   |
| 09 Skills      | File card full-width; snippet font 12px, no horizontal scroll (wrap)                                                                                                                                                                                                                                                   |
| 10 Local-first | Tree card full-width; comments may drop (`# …`) below 360px rather than wrap                                                                                                                                                                                                                                           |
| CTA            | Command pill full-width; links beneath                                                                                                                                                                                                                                                                                 |
| Footer         | Two rows: brand+note, then links                                                                                                                                                                                                                                                                                       |

Cut on mobile: the side-alternation, nothing else. Every scene and its
proof survives.

---

## 7. New-surface requests (exactly two)

Everything else on the page reuses shipped surfaces with new canonical
data (chat, org, todos, triggers panes; the feed card carries tool-call
rows exactly as the backup run carried different rail data). Two new
surfaces, both small compositions of Ledger primitives:

1. **`connector-card`** (§07) — a generic messenger thread card: channel
   caption row (mono), one message block (sender line 13px semibold +
   body 15px), a reaction chip (`--fill-secondary` pill, emoji + count),
   one threaded reply row (2px `--fill-primary` thread rail — the app's
   quote idiom). QuietCard base, no borders, no third-party branding.
   _Justification: connectors cannot be told with any of the five product
   panes, and reaction-approval is a flagship claim._

2. **`canvas-mini`** (§04) — a fixed-geometry miniature of the workflow
   canvas: six node cards + SVG wires + 8px port dots, styled by the
   established spatial-canvas rules (declared box = rendered box, visible
   ports centered on walls, left-in/right-out discipline, labels below
   glyph nodes, clamped text). **No React Flow, no pan/zoom, no layout
   engine** — two hand-authored arrangements (horizontal ≥900px, vertical
   below). Node chrome mirrors the app's node cards (glyph + label + one
   status line, `status-line.ts` vocabulary). _Justification: the graph is
   the product's flagship visual claim ("process you can see") and no
   existing surface depicts branching; the landing's linear rail
   deliberately undersells it._

Anything beyond these two comes back to design first.

---

## 8. QA checkpoints (per vignette)

All shot at 1440×900 and 390×844, **light page theme** (the §05 window
itself dark), plus one reduced-motion static per scene. Named states:

| Checkpoint                        | State                                                                   |
| --------------------------------- | ----------------------------------------------------------------------- |
| `hero.rest`                       | hero type settled, §01 window cropped by the fold (desktop)             |
| `engines.switched`                | pill reads `Dev · Senior · codex`, thread pre-send (t≈1400)             |
| `engines.resolved`                | second Dev reply present, dwell                                         |
| `org.seated`                      | Support node present, presence not yet active (t≈2800)                  |
| `org.resolved`                    | 6 employees · 3 departments, presence active                            |
| `todos.requested`                 | Active view, `Approval requested` badge on the refund (t≈1400)          |
| `todos.needs-you`                 | Needs you view, Approve/Send back visible (t≈2400)                      |
| `todos.resolved`                  | `Approved by you · 11:42 — Todo done`                                   |
| `flows.drawn`                     | full graph entered, all `Up next` (t≈800)                               |
| `flows.routed`                    | refund lane filled, reply lane quiet (t≈4300)                           |
| `flows.parked`                    | gate bell + `Waits for your approval`, chip `Waiting for you`           |
| `triggers.rest`                   | 4 bindings, dark window on light page — the money shot for §5           |
| `triggers.resolved`               | webhook fired + run #148 row                                            |
| `mcp.calling`                     | rows 1–2 landed, row 2 result pending (t≈1800)                          |
| `mcp.resolved`                    | 4 calls + routed highlight decayed                                      |
| `slack.reacted`                   | ✅ chip present, no reply yet (t≈1600)                                  |
| `slack.resolved`                  | reply row present                                                       |
| `statics.skills` / `statics.tree` | file card + tree card, both breakpoints                                 |
| `nav.features-link`               | nav with Features link, this page current, landing current (both pages) |
| `page.reduced`                    | full-page reduced-motion pass: every window at resolved, zero timelines |

Behavioral assertions (e2e): one page-wide motion channel (scrolling
between two visible windows freezes the first at a beat boundary); every
window has its own labeled pause control; reduced motion instantiates no
timelines; the §05 window's computed tokens are dark-theme values while
`<html>` stays light; copy deck strings are asserted verbatim.

---

## 9. Product-truth flags (decided during verification)

1. **Per-session cost/time caps — EXCLUDED.** `sessions.maxCostUsd` /
   `maxDurationMinutes` exist in config but no enforcement path was found.
   The page claims only the verified per-employee monthly budgets
   (80%/100% thresholds).
2. **Slack ✅ approvals — REWORDED.** The shipped mechanism is a generic
   authorized-user reaction→action path, not a ✅-specific primitive. The
   scene has the COO propose the ✅ convention in its own message (real
   usage) and the copy says "react to a decision card and the agent acts."
3. **"Reviewed by COO" — NOT UNIVERSALIZED.** The page claims the
   self-review ban (verified) and default routing to the COO — never that
   every completion is COO-signed (cron/workflow-sourced items default to
   trust).
4. **README drift — NOT CARRIED.** "Kanban boards" (retired for the todos
   board), a standalone "Talk mission control" page (voice is embedded in
   chat; no live route), "git-backed knowledge" (no git logic in the
   knowledge module — the page says "committable files" instead), and
   "session forking" (shipped as duplicate) do not appear.
5. **Canvas run replay — VERIFIED, no flag.** The Executions lens really
   replays runs on the definition's geometry; §04 is product-true,
   including its status strings.
6. **No "skipped" state invented.** The un-routed switch lane keeps the
   app's real `Up next` presentation and simply never advances.

---

## 10. Taste guardrails addendum (for the implementers)

The landing's §7 guardrails apply in full (one thing moves at a time;
amber is a salary; honest states; typing cadence; easing discipline;
spacing rhythm; bounded pulses; the window is a product; dwell before
reset). Additions for this page:

1. **Rhythm is the composure.** Section → window → rail, ten times, with
   the two pure-type rests (§08, and the hero). Never introduce a
   differently-shaped section to "break the monotony" — the repetition IS
   the spec-sheet calm. If a section feels heavy, cut a rail row, never
   the whitespace.
2. **Fact rails are print, not UI.** Mono label + sentence, text-secondary,
   no icons, no cards, no hover states. If a rail row needs a second
   sentence, it's copy for the body, not the rail.
3. **Pane-only windows.** No icon ribbon, no sessions sidebar anywhere on
   this page — window chrome is the frame + pane + pause control. The full
   dashboard belongs to the landing.
4. **One dark window.** §05 only. If any other surface goes dark, the
   page's daylight thesis is broken.
5. **Loops must read as patience.** Seven looping windows could feel like
   a wall of televisions; the one-channel law and the section rhythm
   prevent that. Never let two windows animate at once, and never shorten
   a dwell to "keep things moving."
6. **The canvas is hand-set type.** canvas-mini's geometry is authored,
   not computed — align node walls to a grid, keep wire bends horizontal/
   vertical + one radius, ports exactly on walls. If it looks like a
   diagram tool exported it, redo it.
7. **Strings are law.** Every string on the page is in this document
   (§4 copy + scene tables + statics). The app-vocabulary strings
   (`Waits for your approval`, `Up next`, `Running`, `Done`, `Approve`,
   `Send back`, `Active / Needs you / People`) must match the product
   verbatim — when the product changes, the page follows the product, via
   a deck amendment.
8. **Fiction ledger is law.** Runs #147/#148, orders #8841/#8867, times
   10:56→14:05, the Support hire — no other numbers, names, or times may
   appear. The landing's numbers stay on the landing (except the #142 cron
   row reference in §05).

---

## 11. Copy deck (every string on the page)

**Meta**

- `<title>`: `Features — Jinn`
- Meta description: `Everything Jinn ships: six agent engines, an AI org
in YAML, a reviewed work ledger, workflow graphs with human approval
gates, triggers, MCP tools, connectors — open source and local-first.`

**Nav**: `jinn` · `Features` · `GitHub` · `npm` · `Install`

**Hero**: eyebrow `The full inventory`; H1 `All the` / `moving parts.`;
sub as §4.1; pill `$ npm install -g jinn-cli` (payload
`npm install -g jinn-cli`, feedback `Copied`); ghost `View on GitHub →`.

**Section heads + bodies**: as written verbatim in §4 (01–10).

**Engine chips**: `Claude Code` · `Codex` · `Grok` · `Antigravity` · `Pi`
· `Hermes`.

**Fact rails**: as written verbatim in §4 (labels: subscription,
discovery, effort, honesty; ranks, delegation, lateral, map; states,
sources, review, spend, audit; nodes, gates, resilience, sop, mid-run;
webhooks, filters, polls, cron; surface, allow-lists, external; threads,
reactions, voice; terminal, meters, input, mobile; sync, catalog,
community, knowledge; access, budgets, cost, license).

**In-window strings** (verbatim): chat — pill `Dev · Senior · claude` /
`Dev · Senior · codex`; composer `Message Dev…`; msgs `Review the payments
webhook diff before we ship it.` / `Reviewed. One concern — the retry
handler swallows 4xx errors. Patch drafted.` / `Fresh eyes — re-check
it.` / `Agree on the retry handler — and the signature check ignores the
timestamp tolerance. Both patched, tests green.`
Org — headers `Org · 5 employees · 2 departments` → `Org · 6 employees ·
3 departments`; nodes as landing plus `Support / Employee / codex`; dept
labels `Platform`, `Growth`, `Support`.
Todos — tabs `Active` / `Needs you` / `People`; cards `Refund order #8841
— $49 / Support / In review`, `Triage: login loop on Android / Support /
Executing`, `Write the refund policy page / Writer / Assigned`; badge
`Approval requested`; request `Card was double-charged — refund $49 to
order #8841.`; buttons `Approve`, `Send back`; status `Approved by you ·
11:42 — Todo done`.
Canvas — title `Support triage`; lens control `Editor` / `Executions`;
chips `Run #147 · Running now` / `Run #147 · Waiting for you`; nodes
`Ticket received` (sub `event · ticket.created`, label `fired · 11:12`),
`Triage ticket`, `Route`, `Reply to customer`, `Approval — refunds`,
`Send refund`; statuses `Up next` / `Running` / `Done` /
`Waits for your approval`.
Triggers — header `Triggers · 4 bindings`; rows as §4.6 verbatim; token
chip `tok_…9f2`; fired label `fired · 11:38 today`; run row `↳ run #148
started — Support triage`.
MCP feed — header `support · MCP · 4 calls`; rows `search_knowledge ·
"refund policy"` → `3 hits`, `create_work_item · Refund order #8841 —
$49` → `wi_1058`, `update_work_item · wi_1058 → in_review`,
`request_work_item_approval · wi_1058` → `routed to COO`.
Connector — channel `#support · via Slack`; sender `Jimbo · COO · 14:04`;
message `Refund request — order #8867, $129. Card charged twice; support
recommends refunding. React ✅ to approve.`; reaction `✅ 1`; reply
`↳ Approved — refund sent, run #147 resumed. · 14:05`.

**Dashboard chips**: `Chat · CLI · Org map · Todos · Canvas · Cron · Logs
· Limits · Skills · Files · Settings`.

**Skills card**: path `~/.jinn/skills/support-triage/SKILL.md` + snippet
as §4.10 verbatim.

**Tree card**: as §4.11 verbatim.

**CTA**: H2 `All of it.` / `One command.`; pill as hero; links `GitHub →`,
`npm →`.

**Footer**: `jinn` · `Open source · local-first · your keys, your machine`
· `Features` · `GitHub` · `npm`.

**A11y**: scene captions as written per scene; pause controls
`Pause animation` / `Play animation`; copy buttons `Copy install command`.

**Links**: GitHub `https://github.com/hristo2612/jinn`; npm
`https://www.npmjs.com/package/jinn-cli`; landing `/`; this page
`/features`.

No other text may appear on the page. If implementation needs a string
not listed here, it comes back to design first.

---

## Addendum B2-1 (2026-07-11, design office) — product-truth and cadence corrections from the B2 adversarial review

Numbered deck amendments. Each entry replaces the cited original strings
everywhere they appear (§2 inventory, §4 scripts, §8 checkpoints, §11 deck).
No other strings change.

**B2-1.1 — The §05 webhook depiction shows the real ingress and token.**
Truth: Jinn's only workflow-event ingress is `POST /api/workflow-events`
(JSON body `{ event, payload }`, per-binding secret or gateway bearer;
`packages/jinn/src/gateway/api.ts` "Workflow CUSTOM TRIGGERS" route). A
generated webhook secret is `jinn_wh_<base64url>` and its stored preview is
`secret.slice(0, 4) + "..." + secret.slice(-4)`
(`packages/jinn/src/workflows/custom-triggers.ts` — `tokenPreview`,
webhook binding creation). Amended strings:

- Binding row 3 title: `POST /hooks/tickets` → `POST /api/workflow-events`
  (detail `starts Support triage` unchanged; the binding matches the
  `ticket.created` event already named by the §04 trigger node).
- Token chip: `tok_…9f2` → `jinn...c9f2` (the exact preview format the
  product stores for a generated secret).
- §05 caption sentence: "The ticket system POSTs to /hooks/tickets and run
  #148 starts." → "The ticket system POSTs ticket.created to
  /api/workflow-events and run #148 starts."

**B2-1.2 — The budgets rail claims only observable behavior.** Truth:
`checkBudget()` computes a `warning` tier at 80%, but the only production
enforcement path branches solely on `paused`
(`packages/jinn/src/gateway/budgets.ts`; `packages/jinn/src/sessions/
manager.ts` budget gate). Amended strings:

- §10 rail `budgets`: "Per-employee monthly budgets: a warning at 80%,
  paused at 100%." → "Per-employee monthly budgets — hit the line and Jinn
  pauses the employee."
- §2.J inventory row amended to match ("paused at 100%" only).

**B2-1.3 — The MCP work-item ID is product-shaped.** Truth: work-item IDs
are `wi_<12 hex>` (`packages/jinn/src/work-items/store.ts` —
`generateWorkItemId`). `wi_1058` → `wi_8841c47ef21a` in all three MCP feed
rows. The fiction ledger (§10.8) admits this ID (it encodes order #8841).

**B2-1.4 — The voice rail does not overclaim transport privacy.** Truth: a
Telegram voice note traverses Telegram before the connector downloads it and
invokes local Whisper (`packages/jinn/src/connectors/telegram/index.ts`).
§07 rail `voice`: "Voice and video notes transcribed by local Whisper. Audio
never leaves your machine." → "Voice and video notes transcribed by local
Whisper — no cloud transcription service ever hears them."

**B2-1.5 — Cadence law codified as authored (gesture chaining).** The §3
sentence "beat starts ≥400ms apart" contradicted this storyboard's own
approved beat tables (80–120ms entrance staggers in §4.5/§4.6; the 300ms
press→decide adjacency in §4.4). The law is restated to codify the approved
tables: consecutive beats chain into ONE authored gesture while inter-beat
start gaps are ≤120ms; gesture starts must be ≥300ms apart; the per-beat
motion cap (≤600ms non-text, pulses 1–2 cycles) is unchanged. The unit gate
enforces exactly this rule.

**B2-1.6 — §01 beat 1 realization note.** The scripted `highlight` on the
header pill is realized as a one-cycle `pulse` (same approved vocabulary):
the machinery presents `highlight` as a persistent selection state, and a
permanently lifted pill has no honest referent on this surface — the pulse
is the bounded acknowledgment the beat describes. Checkpoints unchanged.

**B2-1.8 — Tree-card comments drop below 430px (was 360px).** A tree wide
enough to scroll horizontally is a keyboard-unreachable scroll region (axe
`scrollable-region-focusable`); dropping the `# …` comments earlier keeps the
card static at every width. The §6 mobile note is amended accordingly.

**B2-1.7 — Todo card state labels are serialized text.** No string change —
`In review` / `Executing` / `Assigned` were always deck rows (§11) and match
the app's own labels (`packages/web/src/lib/todos.ts`). Recorded here
because the first implementation rendered them as glyphs only; they must
appear as visible card text.

---

## Addendum B2-2 (2026-07-11, design office) — webhook copy claims authentication, not signing

Truth: Jinn does not sign or HMAC webhook payloads. Webhook auth is a
bearer-style shared secret — the caller presents the binding's token in
`x-jinn-workflow-event-token` (or an Authorization bearer header), and the
gateway compares sha256 hashes timing-safe against the stored hash
(`packages/jinn/src/gateway/api.ts` — `workflowEventToken`;
`packages/jinn/src/workflows/custom-triggers.ts` — `hashSecret`,
`verifyAnyWorkflowTriggerBindingToken`). Signing language would imply a
payload signature the product does not ship. Amended strings:

- §05 body uses "a token-authenticated webhook from the outside world".
- §05 caption names a shared-secret webhook, the bearer token sent with the
  request, and the shared-secret token preview shown in the chip.
- §4.6 scene claim line uses "token-authenticated, filtered, and on the
  record".

Unchanged on purpose: the `webhooks` rail ("…secret token — hashed at rest,
verified timing-safe.") is verified accurate; and the §01 chat fiction about
"the signature check ignores the timestamp tolerance" describes the
company's OWN payments-webhook code under review, not Jinn's trigger
ingress — it makes no product claim.

---

## Addendum B2-3 (2026-07-11, design office) — the page describes jinn-cli@0.25.0, the product a visitor installs today

Site-wide truth policy (C2 docs review, F-01): every public claim describes
npm `latest` — `jinn-cli@0.25.0` (== source tag `v0.25.0`) — not the source
repo. All truth sources below are paths at the `v0.25.0` tag. Claims with no
released implementation are REMOVED, not softened.

### Structure: ten numbered sections become eight

| New | Section     | Window / proof                | Scene           |
| --- | ----------- | ----------------------------- | --------------- |
| 01  | Engines     | chat pane                     | `engine-switch` |
| 02  | Employees   | org pane                      | `org-hire`      |
| 03  | Cron        | jobs pane (dark night window) | `cron-fire`     |
| 04  | Connectors  | connector-card                | `slack-approve` |
| 05  | MCP         | static config card            | —               |
| 06  | Dashboard   | — (rest, chip row)            | —               |
| 07  | Skills      | static SKILL.md card          | —               |
| 08  | Local-first | static ~/.jinn tree card      | —               |

Hero, CTA, footer unchanged in role. The night window moves to §03 (cron is
the work that starts while you sleep). Alternation: 01 text-left, 02
mirrored, 03 text-left, 04 mirrored; statics 07/08 alternate.

### Removed sections (no 0.25.0 implementation; entire sections + scenes)

- **§03 Todos + `todo-approval`** — 0.25.0 has no work-item surface
  (`packages/jinn/src` at v0.25.0 has no `work-items/`; the stable release
  ships Kanban boards at `packages/web/src/routes/kanban`).
- **§04 Workflows + `triage-run` + the canvas-mini surface** — no
  `workflows/` module exists at v0.25.0.
- **§06 MCP feed + `mcp-hands`** — no built-in Jinn MCP server exists at
  v0.25.0 (`src/mcp/` contains only `resolver.ts`); the named tools
  (create_work_item, delegate_task, …) do not exist.
- **§05 webhook/todo-status/poll triggers + `webhook-fire`** — no trigger
  bindings or `/api/workflow-events` ingress exist at v0.25.0.

### Removed claims inside surviving sections

- Hero sub: "a work ledger, workflows with human gates, and the triggers
  that wake them" (unreleased).
- §02 rail `delegation` clause "with a contract that nudges stalled work
  exactly once" (no `delegation-completion-contract.ts` at v0.25.0).
- §02 rail `lateral` (no `session-comm-guards.ts` at v0.25.0).
- §02 rail `map` clause "watch running sessions light up" and ALL presence
  dots in the org window (`org/employee-node.tsx` at v0.25.0 renders no
  live-session indicator). The org-hire payoff is the seat itself.
- §01 rail `discovery` ("Models are discovered from each CLI at boot") —
  at v0.25.0 dynamic discovery covers pi/grok/hermes, not every engine.
- §01 rail `effort` clause "from low to max" — claude tops at `high` at
  v0.25.0 (`shared/models.ts` SYNTH_DEFAULTS).
- §09 knowledge tools (`search_knowledge`/`read_knowledge`) — no knowledge
  module at v0.25.0.
- §09 rail `catalog` clause "and edit" — the skills page browses; no editor
  at v0.25.0 (`routes/skills/page.tsx`).
- §10 rail `cost` (`cost_report` is an unreleased MCP tool).
- All run/order fiction tied to removed surfaces: runs #147/#148, order
  #8841, wi_8841c47ef21a, times 10:56–11:42.

### Retargeted / new sections (strings are the new deck; truth cited)

**Hero sub:** "You've watched the company run. This is everything it runs
on — six engines, a real org in files, work on a schedule, and the
connectors that bring it to you. Every window below shows the real
interface doing it."

**§01 Engines** — body unchanged. Rails now: `subscription` (unchanged),
`switching` — "Switch engine mid-session — the conversation carries over."
(`sessions/registry.ts` switchSessionEngine at v0.25.0), `effort` — "Effort
dials per engine, per employee, per session." (`shared/models.ts`,
`shared/effort.ts`), `honesty` (unchanged; `models.ts` availability
gating).

**§02 Employees** — body unchanged (`template/CLAUDE.md` org model +
management skill hire authority; `gateway/watcher.ts` live rebuild). Rails:
`ranks` (unchanged; `shared/types.ts:253`), `delegation` — "Any session
spawns child sessions that report back on completion." (`sessions/
callbacks.ts`), `map` — "The org chart is a live spatial map — pan it,
zoom it." (`components/org/org-map.tsx`, @xyflow + d3-tree at v0.25.0).
Scene `org-hire`: presence beats removed; beats end at the Support node
taking its seat (pulse COO 0 · header recount 800 · branch 1300 · dept
1700 · node 2200; checkpoints initial 0 / seated 2550 / resolved 2800;
loop dwell 7000 · reset 600). Caption: "A support role described in chat
becomes a YAML file — and a seat. The header recounts, the department
appears, and the new employee joins the chart."

**§03 Cron (new, replaces Triggers)** — kicker `03 / Cron`; title
unchanged: "Work starts without you." Body: "Schedules live in one JSON
file and run real employees — same persona, same engine, on the clock. The
gateway hot-reloads edits, keeps every run's history, and alerts you
through a connector when a job runs slow or fails." (`cron/runner.ts`
latency + failure alerts; `gateway/api.ts` /api/cron/:id/runs; jobs carry
employee/engine/model/effort per `cron` tests at v0.25.0.) Rails:

- `jobs` — "A cron job runs an employee session — persona, engine, model,
  and effort resolve like any other work."
- `hot-reload` — "Edit ~/.jinn/cron/jobs.json and the schedule updates
  live. No restart."
- `history` — "Every run is recorded — the Cron page shows each job's
  recent runs."
- `alerts` — "Slow or failed runs alert you through a connector."

Scene `cron-fire` (dark night window, same jobs-row anatomy; right mono
label = the job's employee): rows `Morning digest / Every morning · 09:00 /
jimbo`, `Nightly backup / Every night · 02:00 / dev`, `Support inbox sweep
/ Every 5 minutes / support`. Timeline: rows enter 0/120/240 (450ms);
1400/600 digest row pulses; 2000/250 set-state → fired (`fired · 09:00
today`); 2450/350 run row enters `↳ run started — Morning digest`.
Checkpoints initial 0 / fired 2300 / resolved 2900 (unique per page —
resolved doubles as the debug scrubber max); loop dwell 7000 · reset 600. Caption: "Three schedules — the morning digest, the nightly
backup, the support inbox sweep. The 09:00 job fires and an employee
session starts. Every run lands in the job's history."

**§04 Connectors** — body/rails unchanged (threads `connectors/slack/
threads.ts`; reaction→action `connectors/slack/index.ts` reaction_added +
allowed users; voice `connectors/telegram/index.ts` + `stt/`). Scene
`slack-approve`: reply string drops the workflow reference → `↳ Approved —
refund sent. · 14:05`. Caption: "The COO brings a refund decision to
Slack. Your ✅ reaction is the instruction — the agent acts on it and the
refund goes out."

**§05 MCP (retargeted, static)** — kicker `05 / MCP`; title: "Bring your
own hands." Body: "Attach the MCP servers you already use — over stdio or
URL, declared once in config.yaml — and allow-list them per employee: all,
none, or exactly the ones you name." (`shared/types.ts` McpServerConfig +
employee `mcp: boolean | string[]`; `mcp/resolver.ts`.) Rails:

- `servers` — "Any MCP server over stdio or URL — command, args, env, one
  config block."
- `allow-lists` — "Per employee: true for all, false for none, or the
  exact servers you name."

Static: a config file card (the SKILL.md card treatment), verbatim:

```
# config.yaml
mcp:
  mcpServers:
    search:
      command: npx
      args: ["-y", "mcp-search"]
    tracker:
      url: http://127.0.0.1:8808/mcp

# org/support/support.yaml
mcp: ["search"]
```

**§06 Dashboard (rest)** — body: "Every window on this page is the
dashboard at localhost:7777 — chat-first, streaming everywhere, with a raw
terminal view one toggle away. The org map, kanban boards, cron and its
run history, activity logs, live engine-quota meters, a skills catalog.
And it all fits your phone." Chips use the app's own nav labels
(`lib/nav.ts` at v0.25.0) plus the chat view toggle: `Chat · CLI · Talk ·
Organization · Kanban · Cron · Activity · Limits · Skills · Settings`.
Rails: `terminal` (unchanged; `routes/chat/page.tsx` cli/chat view modes),
`meters` (unchanged; `routes/limits/page.tsx`), `input` (unchanged;
`chat-input.tsx`, `components/stt/`, `talk/kokoro.ts`), `mobile`
(unchanged; `lib/nav.ts` MOBILE_TAB_ITEMS).

**§07 Skills** — kicker `07 / Skills`; title "Institutional memory."
Body: "Skills are markdown playbooks every engine follows natively — one
folder, one SKILL.md, synced into each CLI automatically. Knowledge stays
beside them: plain files the company's manual teaches every employee to
keep. Teach the company once." (`gateway/watcher.ts` symlink sync;
`cli/setup.ts` scaffolds knowledge/; `template/CLAUDE.md` knowledge
instructions.) Rails: `sync` (unchanged), `catalog` — "Browse every skill
in the dashboard.", `community` (unchanged; `cli/skills.ts` find/add),
`knowledge` — "A knowledge/ folder ships scaffolded — the operating manual
teaches every employee to read it and grow it."

**§08 Local-first** — body unchanged (127.0.0.1 `gateway/server.ts`;
pairing `gateway/auth.ts`; SQLite `better-sqlite3` in gateway/sessions;
no telemetry — v0.25.0 source grep clean; budgets pause
`sessions/manager.ts:377-378`; MIT LICENSE — all at the tag). Rails:
`access`, `budgets`, `license` (all unchanged); `cost` removed. Tree card
unchanged (every line is a directory `cli/setup.ts` scaffolds).

### Fiction ledger v3

Employees: the landing five + Support (🌊). Order **#8867** ($129 refund,
decided from Slack). Times: **09:00** (cron fire) → **14:04/14:05**
(Slack). Cron jobs: **Morning digest**, **Nightly backup**, **Support
inbox sweep**. No run numbers, no work-item IDs, no other orders or times.

### QA checkpoint matrix v2 (§8 replacement)

`hero.rest` · `engines.switched/resolved` · `org.seated/resolved` ·
`cron.rest` (dark window, three jobs) · `cron.resolved` (fired + run row) ·
`slack.reacted/resolved` · `statics.mcp/skills/tree` · `nav.features-link`
· per-scene reduced statics. Behavioral gates unchanged (one channel,
beat-boundary handoff, governance, overflow, contrast, no-JS).

## Addendum B2-4 (2026-07-11, design office) — the page describes the upcoming release; B2-3 superseded

Policy reversal by operator directive (docs/OPERATOR-NOTES.md note 3): the
site now targets the UPCOMING release — `src/data/release.json` pins
version **0.26.0** to source commit
**`b534e88de17b66f3e2c089cde8fcf8763ca3e069`**. Addendum B2-3's stable
retarget is SUPERSEDED in full: its eight-section structure, the §03 Cron
section with the `cron-fire` scene, the CronJobsSurface, and fiction
ledger v3 are retired. The deck is restored to the ten-section page as
closed by the original storyboard plus Addenda B2-1 and B2-2 — with the
two exceptions recorded below, which were retarget improvements that
remain TRUE at the pin and are kept.

### Restored sections and claims — every truth source re-verified at the pin

All paths below were re-checked at `b534e88` specifically (the source has
moved since the B2-1/B2-2 verifications):

- **§03 Todos + `todo-approval`** — `packages/jinn/src/work-items/`
  (store, transitions, approvals). IDs `wi_<12 hex>` (`work-items/
store.ts:213-215`). Status labels "Assigned / Executing / In review"
  (`packages/web/src/lib/todos.ts:33-35`). Needs-you Approve (green tint)
  - quiet Send back (`routes/todos/needs-you-view.tsx:174-175,225-226`).
    State glyphs: executing = accent spinner, review = purple
    (`routes/todos/state-glyph.tsx:46-50`).
- **§04 Workflows + `triage-run` + canvas-mini** — `packages/jinn/src/
workflows/`; status vocabulary "Up next / Running / Done / Waits for
  your approval" (`packages/web/src/routes/workflow/status-line.ts`
  nodeStatusLine).
- **§05 Triggers + `webhook-fire`** — `POST /api/workflow-events` +
  `x-jinn-workflow-event-token` (`gateway/api.ts`); secret
  `jinn_wh_<base64url>` and preview `slice(0,4)…slice(-4)`
  (`workflows/custom-triggers.ts:498,768`). B2-2's bearer-style-token
  wording carries over unchanged.
- **§06 MCP + `mcp-hands`** — built-in server registers 44 tools;
  `create_work_item`, `delegate_task`, `start_workflow_run`,
  `decide_work_item_approval`, `search_knowledge`, `cost_report` all
  registered in `packages/jinn/src/mcp/` (non-test) at the pin.
- **Hero sub** (work ledger / workflows with human gates / triggers) —
  the three modules above.
- **§02 rail `delegation`** nudge clause —
  `sessions/delegation-completion-contract.ts` exists at the pin.
- **§02 rail `lateral`** — `gateway/session-comm-guards.ts` exists.
- **§01 rail `discovery`** ("Models are discovered from each CLI at
  boot") — `shared/models.ts` at the pin discovers claude, codex, pi,
  antigravity, grok, and hermes models.
- **§01 rail `effort`** ("from low to max") — `shared/models.ts:81`
  claude effortLevels `["low","medium","high","xhigh","max"]`.
- **§09 knowledge tools** — `knowledge/store.ts` +
  `mcp/knowledge-tools.ts` exist; rail `catalog` "and edit" —
  `routes/skills/page.tsx` is a full view + edit page at the pin.
- **§10 rail `cost`** — `cost_report` registered (`mcp/`, non-test).
- **§07 chat↔CLI toggle** — `routes/chat/page.tsx` viewMode chat/cli.
- **§07 rail `meters`** — `routes/limits/page.tsx` quota windows.
- **Fiction ledger v2 restored** — runs #147/#148, orders #8841/#8867,
  `wi_8841c47ef21a`, times 10:56–11:42 + 14:04/14:05. Ledger v3 retired.
- **QA checkpoint matrix** — §8 original 16-state matrix restored
  verbatim (B2-3's matrix v2 retired with the cron section).

### Kept from the retarget (still true at the pin)

1. **No presence dots in the §02 org window, and the rail `map` clause
   ends at "pan it, zoom it."** — `packages/web/src/components/org/
employee-node.tsx` at `b534e88` still renders no live-session
   indicator; `org-map.tsx` (@xyflow) carries the pan/zoom claim. The
   org-hire payoff is the seat itself: the scene's presence beat
   (3000ms set-state) is removed, `node-support` is a plain element
   target, and the caption ends "…the new employee joins the chart."
   Checkpoints stay initial 0 / seated 2800 / resolved 3400.
2. **§07 dashboard chips use the app's own nav labels** — `packages/web/
src/lib/nav.ts` at the pin: `Chat · CLI · Todos · Workflows ·
Organization · Cron · Activity · Limits · Skills · Settings` (CLI is
   the chat view toggle, `routes/chat/page.tsx`).

The frozen oracle (`tests/e2e/fixtures/features-deck.ts`) is updated in
this same commit, per the deck-change law.

# B2 `/features/` adversarial code review

- **Date:** 2026-07-11
- **Branch:** `b2-features` at `0e9f4a6`
- **Base:** `main` at `5c0ff5e`
- **Reviewed commits:** `e45a3d2`, `cf7852d`, `a714aef`, `150597c`,
  `c59473e`, `03399df`, `0e9f4a6`
- **Verdict:** **BLOCK**
- **Open findings:** **5 high · 6 medium · 2 low**

The page has the right macro-structure: ten numbered sections in order, seven
registered scenes, a restrained pair of new surfaces, a clean light-page
composition, and technically sound responsive stacking. The required command
gates are green, the exact eager-JS claims reproduce, and the landing does not
eagerly import the features graph.

It is not mergeable yet. The flagship trigger proof shows an API route and
token shape Jinn does not ship, the budget rail advertises a warning that is
never delivered, and the closed Todo deck drops three required state labels.
The seven-loop wall also violates its central motion contract in two different
ways: new CSS keyframes run outside the shared channel (including with no JS),
while ordinary window handoff pauses the outgoing scene in the middle of an
authored beat rather than at a beat boundary. Several green gates are unable to
detect those failures.

## Required remediation before merge

1. Amend the storyboard and page to depict the real workflow-event endpoint,
   authentication/token shape, and real work-item IDs. Keep the marketing proof
   literal enough that every visible call/result can occur in the product.
2. Remove or implement the advertised 80% budget warning. The fact rail must
   describe an observable shipped behavior, not a dormant return enum.
3. Serialize the full closed Todo strings, including `In review`, `Executing`,
   and `Assigned`, and source the closed-deck test oracle independently from the
   implementation data module.
4. Move both bounded wash effects onto the scene player clock or explicitly
   govern them with every player pause/static state. No CSS animation may
   advance offscreen, after channel loss, under user pause, in reduced motion,
   or with JavaScript disabled.
5. Resolve the ordinary-loop handoff contract: the outgoing visible loop must
   yield at a defined authored beat boundary before the incoming loop advances,
   while still preserving exactly one advancing channel.
6. Correct the Telegram privacy wording, visible contrast failures, mobile
   horizontal overflow, and cadence enforcement described below.
7. Add falsification gates for CSS animations, exact contract-backed copy,
   semantic beat-boundary handoff, page overflow, and unexcluded visible
   contrast.

## Findings

### 1. HIGH — The flagship webhook vignette depicts a route and token format Jinn does not ship

The Trigger surface and its assistive caption show `POST /hooks/tickets` and
`tok_…9f2` (`src/lib/scenes/features.ts:723-729, 809-810`). Jinn's only shipped
workflow-event ingress is `POST /api/workflow-events`
(`packages/jinn/src/gateway/api.ts:3537-3580`). A generated per-binding secret
is `jinn_wh_<base64url>`, and its stored preview is the first four and last four
characters (`packages/jinn/src/workflows/custom-triggers.ts:497-499, 764-776`).

This is the page's primary proof for §05, not decorative flavor. A visitor
cannot make the depicted request or receive the depicted token from Jinn. The
storyboard itself carries the false literals, so the contract must be amended
before the page can become honest; copying the closed deck exactly is not a
defense against the product-truth requirement.

### 2. HIGH — The Local-first rail advertises an 80% budget warning that no production path emits

The page says `a warning at 80%, paused at 100%`
(`src/lib/scenes/features.ts:301-310`). `checkBudget()` does return the enum
value `warning` at 80% (`packages/jinn/src/gateway/budgets.ts:5-21`), but its
only production enforcement caller branches solely on `paused`
(`packages/jinn/src/sessions/manager.ts:412-435`). No warning is sent to a
connector, surfaced in the dashboard, persisted, or routed elsewhere.

The §9 flag correctly excludes unimplemented per-session caps, but it treats
the monthly 80% threshold as verified when only the 100% pause is observable.
That makes both the storyboard inventory citation and the shipped fact rail
false.

### 3. HIGH — The closed Todo deck omits all three card-state strings

The closed deck requires these literal card rows
(`docs/STORYBOARD-FEATURES.md:1041-1046`):

```text
Refund order #8841 — $49 / Support / In review
Triage: login loop on Android / Support / Executing
Write the refund policy page / Writer / Assigned
```

`TodoApprovalSurface.astro:61-95` renders each title and owner plus an
unlabelled state glyph. `In review`, `Executing`, and `Assigned` do not appear
in the shipped surface or page source. The E2E assertion checks only title and
owner (`tests/e2e/features-page.spec.ts:184-217`), so the missing serialization
stays green.

This is a direct failure of §10.7 “Strings are law” and the review brief's
closed-deck requirement, not an optional visual simplification.

### 4. HIGH — Bounded CSS washes escape the one shared motion channel and make no-JS non-static

Both new animated surfaces add a transition that is not owned by the scene
player:

- Canvas trigger completion starts `cmini-wash` for 1200ms whenever the node
  reaches `data-state="done"`
  (`CanvasMiniSurface.astro:382-386`).
- The routed MCP row starts `mfeed-wash` for 1200ms whenever `data-active` is
  present (`McpFeedSurface.astro:159-164`).

The components correctly pause their infinite spinners when their window is
not `playing` (`CanvasMiniSurface.astro:543-552`,
`McpFeedSurface.astro:123-132`), but do not govern these two washes.

Production browser falsification:

```text
triage-run loses the channel to webhook-fire
triage player: paused
page players marked playing: 1
cmini-wash: running; currentTime 66.7ms → 416.7ms

mcp-hands loses the channel to slack-approve
mcp player: paused
page players marked playing: 1
mfeed-wash: running; currentTime 83.3ms → 383.3ms
```

With `javaScriptEnabled: false`, the resolved trigger is server-rendered with
`data-state="done"`; `cmini-wash` still reports `running` and advances from
about 33ms to 333ms. That directly contradicts the contract's “no-JS: … static”
law (`STORYBOARD-FEATURES.md:228-236`).

The existing one-channel test counts only
`[data-scene-player-state='playing']` (`features-page.spec.ts:415-437`), and the
no-JS test only proves the absence of GSAP timeline attributes
(`features-page.spec.ts:382-393`). Both gates are vacuous with respect to CSS
animations.

### 5. HIGH — Ordinary window handoff hard-cuts the outgoing loop mid-beat

The contract explicitly requires that scrolling between visible windows
“freezes the first at a beat boundary”
(`docs/STORYBOARD-FEATURES.md:929-933`). The shared channel instead pauses the
current ordinary player synchronously on every new claim
(`src/lib/scenes/scene-motion-channel.ts:17-30`). Beat-boundary yield exists for
ambient ownership, but none of the seven features scenes is ambient.

Falsification while the Triage gate is pulsing:

```text
before scroll: triage-run time 5150ms, checkpoint routed, state playing
scroll to MCP; incoming scene claims channel
after handoff: triage-run time 5200ms, checkpoint routed, state paused
```

The authored pulse runs from 5000ms through 5900ms
(`triage-run.scene.ts:183-190`), so 5200ms is demonstrably inside a beat, not a
boundary. Rapid section hopping and a 1440×1800 two-window viewport preserved
the narrower “at most one GSAP player advances” invariant, but they reproduced
the same immediate-cut policy. The current E2E visits only four of seven
windows and asserts only one `playing` attribute; it never observes the
outgoing scene time or a semantic boundary.

This may require an explicit machinery amendment. Production machinery was
correctly kept frozen on this branch, so this review does not change it.

### 6. MEDIUM — The MCP proof returns and reuses an impossible work-item ID

The MCP feed shows `create_work_item` returning `wi_1058`, then passes that ID
to the following update and approval calls (`features.ts:753-780`). Production
IDs are always `wi_` followed by twelve hexadecimal characters
(`packages/jinn/src/work-items/store.ts:213-215, 329-333`).

The literal is in the storyboard's fiction ledger, but it fails honest-state
falsification for a surface presenting exact MCP request/result rows. Amend the
deck to a stable, product-shaped fictional ID.

### 7. MEDIUM — “Audio never leaves your machine” is an absolute privacy overclaim

The voice rail says `Voice and video notes transcribed by local Whisper. Audio
never leaves your machine.` (`features.ts:233-246`). Local transcription is
true, but a Telegram voice note has already traversed Telegram's service, and
the connector downloads it from Telegram before invoking local Whisper
(`packages/jinn/src/connectors/telegram/index.ts:186-250`).

`Transcription runs locally; no cloud STT provider receives it` would be
supportable. The current absolute sentence is not.

### 8. MEDIUM — Excluding the entire product frame from axe hides 22 serious contrast failures

The semantic pattern is reasonable: each product frame is `aria-hidden`, an
exact visually-hidden `figcaption` carries the proof for assistive technology,
and the playback control remains outside the hidden subtree
(`FeatureWindow.astro:39-56`). That does not make the visible miniature
irrelevant to sighted low-vision users.

The accessibility test excludes every `[data-scene-frame]`
(`features-page.spec.ts:396-411`). Removing that exclusion on the light,
reduced-motion page reports one serious `color-contrast` rule with **22
nodes**. Examples include engine/org text near 3.83–4.05:1, Todo segment and
status text near 3.69–3.84:1, trigger detail/token/run text near 2.97–3.06:1,
and the connector channel near 3.65:1. These are visible product names,
statuses, and results central to the page's proof.

The captions make the hidden-frame approach legitimate for screen readers;
the blanket axe exclusion still creates a real low-vision gap and a vacuous
contrast gate.

### 9. MEDIUM — The page horizontally overflows at the mobile contract width

At the required 390px viewport, the document reports `clientWidth=390` and
`scrollWidth=416`. The local-first tree is the rightmost culprit: its `pre`
keeps fixed columns and opts into local horizontal scrolling, but its grid item
does not shrink within the padded section (`StaticCards.astro:94-111`). At
320px the document grows to 374px; the fixed 326px narrow Canvas arrangement
plus its surrounding padding also contributes.

The visual suite takes locator screenshots, so it can crop the component and
remain green while the document itself pans horizontally. Add a page-level
`scrollWidth === clientWidth` assertion at 390px and a narrower stress width,
then contain each intentionally scrollable child with `min-width: 0`/bounded
width.

### 10. MEDIUM — The “verbatim copy deck” gate uses the implementation as its own oracle

`features-page.spec.ts:4-26` imports `FEATURES_SECTIONS`, surface data, and
captions from `src/lib/scenes/features.ts`, which is also the module the page
renders. Assertions at lines 42-129 therefore prove DOM equals implementation
data, but not that either equals `STORYBOARD-FEATURES.md`. Editing the constants
and page together leaves the gate green. Finding 3 is the concrete miss this
structure already allowed.

Keep the useful DOM==canonical-data tests, but add a closed fixture or exact
contract-derived oracle that does not share the production constants.

### 11. MEDIUM — Two scene definitions violate the enforced ≥400ms beat-start cadence, and the gate omits the law

The authoring envelope says every beat start is at least 400ms apart and calls
that rule enforced (`STORYBOARD-FEATURES.md:238-240`). `triage-run` expands its
initial draw into beats at 0/80/160/240/320/400/520ms
(`triage-run.scene.ts:81-132`), and `webhook-fire` starts rows at
0/120/240/360ms (`webhook-fire.scene.ts:45-74`). Comments describe each group
as one staggered gesture, which is aesthetically defensible, but the scene
schema still authors them as separate beats and the literal contract provides
no grouped-gesture exception.

The test titled `authoring envelope` checks cycle length, individual duration,
pulse count, and dwell, but never adjacent start times
(`tests/unit/features-scenes.test.ts:47-85`). Amend the contract/schema to
represent an allowed internal stagger or change the definitions; then make the
gate enforce the chosen rule.

### 12. LOW — The engine scene substitutes `pulse` for the storyboard's `highlight` action

The storyboard's first engine-switch beat is a `highlight` at t=0. The
definition uses a one-cycle `pulse` instead
(`src/scenes/features/engine-switch.scene.ts:35-43`) even though `highlight` is
a supported action. The visible effect is close and bounded, but it is not
beat-for-beat serialization.

### 13. LOW — The landing visual matrix carries sub-threshold nav diff debt

B2 intentionally adds `Features` to the shared nav and footer. Only three
existing landing PNGs were updated: desktop workflow-approval advancing dark,
plus mobile footer dark/light. The other landing screenshots pass under the
global `maxDiffPixelRatio: 0.001` and pixel threshold 0.2
(`playwright.visual.config.ts:17-24`) even when their fixed nav contains the
known pixel change.

Dedicated nav baselines and the full green landing visual suite keep immediate
functional risk low, but roughly forty landing snapshots now consume some of
their tolerance before a future regression. Refreshing all affected approved
baselines or adding a stricter nav crop would restore headroom.

## Product-truth citation audit

I spot-checked the storyboard's `file:line` rails against the actual Jinn repo,
not against landing fixtures. More than the requested six were sampled:

| Storyboard claim                                                    | Actual source checked                                                       | Result                  |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------- |
| Six registered engines and binary availability                      | `packages/jinn/src/shared/models.ts:54-66, 96-102`                          | Pass                    |
| Mid-session engine switch/context-sync marker                       | `sessions/registry.ts:1267-1326`; `sessions/manager.ts:405-410`             | Pass                    |
| Eight Todo states, seven sources, verification policy, item budget  | `work-items/store.ts:26-104`                                                | Pass                    |
| Self-review ban                                                     | `work-items/transitions.ts:146-153`                                         | Pass                    |
| Approval decision and status consequence are atomic                 | `work-items/approvals.ts:275-315`                                           | Pass                    |
| Workflow node kinds and retry/timeout/error-lane vocabulary         | `workflows/definition.ts:58-89, 156-161`                                    | Pass                    |
| Parked approval gates are not polled                                | `workflows/run-reconciler.ts:66-76, 943-955`                                | Pass                    |
| Per-employee MCP all/none/named allow-lists                         | `mcp/resolver.ts:30-82`                                                     | Pass                    |
| Knowledge search/read is deterministic and scoped away from secrets | `knowledge/store.ts:6-49`; `mcp/knowledge-tools.ts:70-101`                  | Pass                    |
| Workflow webhook route and token depiction                          | `gateway/api.ts:3537-3580`; `workflows/custom-triggers.ts:497-499, 764-776` | **Fail — finding 1**    |
| Monthly warning/pause behavior                                      | `gateway/budgets.ts:5-21`; `sessions/manager.ts:412-435`                    | **Fail — finding 2**    |
| Telegram local transcription/privacy                                | `connectors/telegram/index.ts:186-250`                                      | **Partial — finding 7** |

The citations have drifted by several lines since the storyboard was written,
but the passing claims still resolve to the named implementations. The three
failures are semantic, not merely line-number drift.

## §9 exclusion audit

The implemented page correctly avoids the explicit exclusions:

- no `sessions.maxCostUsd` or `maxDurationMinutes` enforcement claim;
- no claim that ✅ is a dedicated Slack primitive — the connector scene uses
  it as a message-level convention;
- no universal COO-signing claim;
- no retired Kanban claim;
- no standalone Talk mission-control page;
- no git-backed-knowledge claim;
- no session-forking claim;
- no invented `skipped` workflow state.

The monthly budget sentence permitted by flag 1 is nevertheless false at 80%,
as finding 2 explains.

## Storyboard, surfaces, and responsive judgment

### Structure and scene registration

- Exactly ten numbered sections render in the contract order.
- Exactly seven scene IDs are registered: `engine-switch`, `org-hire`,
  `todo-approval`, `triage-run`, `webhook-fire`, `mcp-hands`, and
  `slack-approve`.
- Section heads, bodies, rail labels/sentences, hero, CTA, statics, captions,
  and the rest of the in-window deck serialize in order. The exceptions are
  findings 1-3, 6-7, and 12.
- The fiction ledger otherwise stays closed: only the approved support hire,
  runs, orders, and times appear.

### New-surface budget

**CanvasMini passes §10.6's implementation budget.** It has six authored nodes,
hand-set absolute coordinates, fixed SVG orthogonal wires, and exactly two
authored arrangements (horizontal and narrow). There is no graph-layout
engine, React Flow, Dagre, runtime measurement loop, or computed node placement.

**ConnectorCard passes the Ledger budget.** It is a single local QuietCard-style
composition with restrained rows and chips. It adds no third-party trade dress,
layout system, or general-purpose messaging surface.

### Responsive deviations

Both implementer-reported deviations are technically acceptable under the
operator ruling:

- Stacking all split sections below 1280px avoids squeezing fixed-geometry
  proof windows and preserves the contract's text → window → rail order
  (`FeatureSection.astro:161-171`). At 900px the available frame still fits the
  horizontal Canvas arrangement.
- Keeping §04 stacked at every width is appropriate for the 860px authored
  canvas and preserves its singular, readable proof (`features.astro:84-98`).

Neither creates a third layout mode or a runtime layout engine. Finding 9 is a
separate containment bug inside the accepted mobile stack.

### Decorative frame and captions

The `aria-hidden` frame plus exact caption is a legitimate semantic treatment
for a non-interactive illustration, and all playback controls remain exposed.
It is not a license to ignore visible contrast. The accessibility disposition
is therefore: **screen-reader semantics pass; sighted low-vision contrast
fails** (finding 8).

## Machinery boundary audit

The production machinery freeze passes. There is no branch diff in
`scene-controller.ts`, `scene-player.ts`, `scene-motion-channel.ts`, scene DOM,
reducer, validator, installer, or fixture wiring. The only shared scene-type
change is adding `"purple"` to `OrgDepartment.tone` in
`src/lib/scenes/types.ts`, a data/registration seam. All other scene-system
changes are the new features registry, canonical data, and seven definitions.

Finding 5 is therefore a pre-existing controller/channel behavior exposed by
this page's explicit handoff contract, not an unauthorized machinery edit.

## Reported fixture flake diagnosis and permitted test-only change

**Diagnosis: fixture-only; no production controller race found.** The failing
test waited only for `data-scene-controller-mode`. That attribute is set
synchronously during controller construction, while ScrollTrigger is imported
and bound asynchronously. The test then called `activate("stage-todos")`,
swapped its surface, and reactivated it while the real viewport still belonged
to `stage-chat`. A late, legitimate ScrollTrigger refresh callback queued Chat
through `requestAnimationFrame` and restored the scroll-authoritative scene.

Evidence:

- the original target passed 50/50 isolated and 20/20 under CPU throttling;
- delaying the built ScrollTrigger chunk by 500ms reproduced the old failure
  10/10;
- the controller, fixture, and original test were byte-identical to `main`, so
  “passes on main” was timing, not a branch behavior difference;
- production activation correctly treats actual scroll position as authority.

The sole permitted change in this review scrolls the fixture to
`stage-todos` before swapping/reactivating it
(`tests/e2e/scene-controller.spec.ts:693-711`). It removes the contradictory
programmatic activation; it does not add a sleep or touch production machinery.
The stabilized test passed 50/50 with four workers, and both full E2E runs then
passed.

## Independent gate record

| Gate                                     | Result                                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                             | Pass — Astro check/build, 91 unit tests, safety and link gates; 0 errors (28 existing hints)                                                                              |
| `pnpm test:e2e` run 1                    | Pass — 152/152                                                                                                                                                            |
| `pnpm test:e2e` run 2                    | Pass — 152/152                                                                                                                                                            |
| fixture stabilization stress             | Pass — target test 50/50, 4 workers                                                                                                                                       |
| `pnpm test:visual`                       | Pass — 107 passed, 63 project-matrix skips                                                                                                                                |
| `pnpm test:lighthouse`                   | Pass — both `/` and `/features/`, 3 cold mobile runs each; aggregate median performance 98, accessibility 95, best practices 100, SEO 100, LCP 2122ms, CLS 0.001, TBT 0ms |
| `/features/` eager JS                    | Pass and exact — 57,806 gzip bytes, 56.451 KiB, below 90 KiB                                                                                                              |
| branch landing eager JS                  | Pass and exact — 71,799 gzip bytes, 70.116 KiB                                                                                                                            |
| clean `main` landing comparison          | 72,275 gzip bytes, 70.581 KiB; branch is 476 bytes smaller                                                                                                                |
| §9 excluded-copy grep against built HTML | Pass                                                                                                                                                                      |
| machinery diff                           | Pass — registration/data seams only                                                                                                                                       |

The green commands establish build health and broad regression safety. They do
not supersede the adversarial failures above: the motion, copy, accessibility,
and overflow assertions omit exactly the state needed to falsify their claims.

## Merge-risk read

**High.** The branch is mechanically stable and performance-safe, but merging
would publish false product instructions/claims and a seven-loop page that
breaks its defining one-channel/static-motion laws while all named gates remain
green. The fixture flake is low risk and closed by the test-only stabilization;
it is not the reason for the block.

---

## Final scoped re-verification — 2026-07-11

- **Final tree reviewed:** `1b9a403`
- **Remediation:** `1d84854`, `023d693`, `0d22105`, `11fa9eb`
- **Authorized machinery:** `7986713`
- **Semantic handoff gate:** `1b9a403`
- **Fixture stabilization in ancestry:** `811eeb7`
- **Final verdict:** **BLOCK**
- **Open blockers:** **2 high**
- **Non-blocking evidence/documentation debt:** **5 low nits**

Twelve original problems are materially closed, including the real ingress
literal, honest budget/voice/ID/state-label copy, player-governed washes,
independent deck oracle, codified cadence, full-frame contrast, mobile
containment, and the complete baseline refresh. Two adversarial failures remain:
the flagship proof still calls token authentication a signed webhook, and the
authorized motion generalization loses still-live claimants during rapid
handoffs.

### Original-finding disposition

| #   | Final disposition                                                   | Re-verification                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Reopened — HIGH**                                                 | The route, event, and token-preview literal are now product-shaped, but the visible body and caption still say `signed webhook`; the caption also calls a stored preview the binding's secret. See blocker A. |
| 2   | Closed                                                              | The rail now claims only the observable 100% pause behavior and cites the enforcing session-manager path.                                                                                                     |
| 3   | Closed                                                              | `In review`, `Executing`, and `Assigned` are visible serialized labels and are asserted by the independent deck gate.                                                                                         |
| 4   | Closed                                                              | Both washes require ancestor `data-scene-player-state="playing"`; live pause, channel-loss, reduced-motion, and no-JS falsification found no escaping CSS animation.                                          |
| 5   | Closed for the original A→B case; **new HIGH machinery regression** | The semantic E2E proves boundary parking for two ordinary loops. Rapid A→B→C claims expose a separate lost-claimant defect in the generalized channel. See blocker B.                                         |
| 6   | Closed                                                              | The MCP vignette consistently uses `wi_8841c47ef21a`, matching the shipped `wi_` plus 12-hex format.                                                                                                          |
| 7   | Closed                                                              | Voice copy now says transcription is local and no cloud transcription service receives the audio; it no longer overclaims transport privacy.                                                                  |
| 8   | Closed                                                              | Full-page Axe runs without frame exclusion and direct 1440px, 390px, and 320px checks found zero critical/serious violations.                                                                                 |
| 9   | Closed                                                              | Document and body widths equal the viewport at 390px and 320px; the gate checks both widths and the CSS fixes the shrinking/containment causes.                                                               |
| 10  | Closed                                                              | `tests/e2e/fixtures/features-deck.ts` is a frozen literal oracle and imports nothing from `src/`.                                                                                                             |
| 11  | Closed                                                              | Addendum B2-1.5 defines the authored chaining rule; the unit gate enforces ≤120ms within a chain and ≥300ms between gesture starts.                                                                           |
| 12  | Closed                                                              | Addendum B2-1.6 explicitly authorizes the one-cycle pulse realization for the first engine beat.                                                                                                              |
| 13  | Closed                                                              | `11fa9eb` refreshes exactly 106 PNGs: 55 landing and 51 features. All nav-bearing landing baselines now carry the approved Features item, and no baseline changed after that commit.                          |

### Blocker A — HIGH: the flagship still presents token authentication as request signing

The amended concrete proof is now correct:

- the surface shows `POST /api/workflow-events` and `ticket.created`;
- the displayed `jinn...c9f2` has the same first-four/last-four preview form as
  a generated `jinn_wh_<base64url>` binding token;
- the ingress exists and starts matching workflow events.

I rechecked those statements against the actual Jinn sources. The route reads
either `X-Jinn-Workflow-Event-Token` or a bearer token, validates the supplied
token against the stored binding-token hash with a timing-safe equality check,
then parses the JSON event (`packages/jinn/src/gateway/api.ts:1425-1438,
3555-3598`; `packages/jinn/src/workflows/custom-triggers.ts:491-499,
764-776, 873-880`). It does **not** verify a payload signature, timestamp, body
digest, or signing MAC.

The shipped page nevertheless says:

- `a signed webhook from the outside world`
  (`src/lib/scenes/features.ts:189`); and
- `a signed webhook` plus `The token chip is the binding's own secret`
  (`src/lib/scenes/features.ts:815`).

The frozen oracle repeats both literals
(`tests/e2e/fixtures/features-deck.ts:149,690`), so exact-deck tests preserve
rather than detect the product-truth error. “Signed webhook” materially implies
payload authenticity/integrity and usually replay defenses that this bearer
token endpoint does not supply. The chip is specifically a stored/rendered
**preview**; the full generated secret is returned only at creation. The honest
terms are “token-authenticated webhook” and “the binding's stored secret
preview.” This keeps original finding 1 open at high severity.

### Blocker B — HIGH: rapid claims can strand a visible loop permanently paused

The authorization requires rapid loop claims to coalesce to the latest
still-live claimant and preserve normal restoration
(`docs/HANDOFF-A05.md:70-87`). The implementation keeps only one
`pendingLoopClaim`. While A is yielding, B is paused and stored only as pending;
a C claim overwrites it without adding B to `claimHistory`
(`src/lib/scenes/scene-motion-channel.ts:32-35`).

Two direct channel probes reproduced the production defect:

1. A owns the channel; B and then C claim during A's deferred yield. If C is
   released before A reaches the boundary, A's release completes with no active
   owner while B remains `controller`-paused.
2. If C survives the boundary and becomes active, releasing C later also
   restores no owner; B is still absent from history and remains paused.

A still-intersecting standalone root does not reclaim automatically: the
controller claims on an IntersectionObserver transition
(`scene-controller.ts:538-563`), while owner-change notifications only
resynchronize ambient scheduling (`scene-controller.ts:169-176`). The result is
zero advancing owners despite a live visible claimant, violating both the
authorization and the page's motion law.

The new tests do not falsify this sequence. The channel unit test ends while C
is active and never releases it (`tests/unit/scene-motion-channel.test.ts:85-106`);
the semantic features E2E deliberately excludes a third claimant
(`tests/e2e/features-page.spec.ts:598-605`). The original two-window boundary
handoff is genuinely fixed, but the generalized production behavior is not.

### Machinery-scope judgment

`7986713` otherwise stays within the authorized surface: production changes are
confined to the shared motion channel plus `yieldAtBeatBoundary()`, and ambient,
non-looping, static/reduced, and ordinary synchronous paths retain their prior
branch behavior. No features or landing production source changed after
`7986713`; `1b9a403` adds only the semantic E2E.

There is one low test gap adjacent to blocker B: neither new test exercises the
500ms deadline. The direct controller test chooses a boundary about 283ms away,
and the semantic E2E records no claim-to-transfer elapsed time. Deadline polling
on the first animation frame after the deadline may also exceed a strict 500ms
wall-clock reading by scheduling latency. This is not separately merge-blocking
because the claimant-loss defect already requires machinery remediation, but
the repaired gate should cover the cap as well as A→B→C restoration.

### Addenda, exclusions, surfaces, accessibility, and responsive check

- Addendum B2-1's budget, ID, voice, cadence, pulse, containment, and Todo
  corrections match their cited implementation behavior. The webhook route and
  token-preview citations are also correct; only the retained “signed”/“secret”
  prose overreaches the cited mechanism.
- All §9 exclusions remain absent: no per-session cap, ✅-specific primitive,
  universal COO-signing, retired Kanban, standalone Talk page, git-backed
  knowledge, session forking, or invented `skipped` workflow-state claim.
- CanvasMini remains a hand-authored six-node surface with two fixed
  arrangements and no layout engine. ConnectorCard remains within the Ledger
  primitive budget.
- The accepted below-1280 stacking and all-width §04 stacking are technically
  sound after the 390px/320px containment fixes.
- Decorative `aria-hidden` frames plus exact captions are legitimate here
  because the visible frame now passes unexcluded contrast checks and controls
  remain exposed. The automated Axe test itself runs at the default 1280px;
  1440px and 390px passed independent unexcluded probes but are not both encoded
  in its viewport matrix. That is a low evidence nit, not a current a11y defect.
- Addendum B2-1 has two low editorial nits: B2-1.8 precedes B2-1.7, and the
  budget citation splits `packages/jinn/src/sessions/manager.ts` across a code
  span, making that rendered path non-copyable.

### Landing feel and baseline-risk recheck

The landing is unchanged after the authorized machinery commit except for the
shared handoff behavior under review. Both complete E2E runs include and pass
every landing spec. The 107 applicable visual checks pass; the landing matrix
includes all refreshed dark/light desktop states, mobile key states, and the
reduced-motion pair. A sample pre/post pixel audit localizes approved changes to
the new Features navigation item plus small ribbon rasterization differences,
not scene layout or content. The 106-image refresh therefore clears the prior
sub-threshold nav debt without shifting the established landing composition.

Landing Lighthouse passes three cold mobile runs: median performance 98,
accessibility 95, best practices 100, SEO 100, LCP 2129ms, CLS 0.001, and TBT
0ms. The corresponding `/features/` medians are performance 98, accessibility
96, best practices 100, SEO 100, LCP 2130ms, CLS 0, and TBT 0ms.

### Final-tree gate record

| Gate                   | Final result                                                                      |
| ---------------------- | --------------------------------------------------------------------------------- |
| `pnpm check`           | Pass — 0 Astro errors, 28 hints; 95/95 unit tests; build, safety, and links pass  |
| `pnpm test:e2e` run 1  | Pass — 157/157                                                                    |
| `pnpm test:e2e` run 2  | Pass — 157/157                                                                    |
| landing E2E suites     | Pass within both complete runs                                                    |
| `pnpm test:visual`     | Pass — 107 passed, 63 project-matrix skips                                        |
| `pnpm test:lighthouse` | Pass — `/` and `/features/`, three cold mobile runs each                          |
| `/features/` eager JS  | Budget pass — 58,056 gzip bytes, 56.695 KiB, below 90 KiB                         |
| landing eager JS       | Budget pass — 72,020 gzip bytes, 70.332 KiB                                       |
| full-page Axe          | Pass without frame exclusions — zero critical/serious at 1440px, 390px, and 320px |
| mobile overflow        | Pass — document/body width equals viewport at 390px and 320px                     |
| §9 exclusion audit     | Pass                                                                              |

The checked eager-JS report is a low documentation nit: it still states 56.5
KiB for `/features/` and 70.1 KiB for landing
(`docs/reports/b2-eager-js.md:7-21`). The deterministic final-tree measurements
round to 56.7 and 70.3 KiB respectively after the authorized machinery growth.
Both remain comfortably inside the gate; the issue is exact evidence freshness,
not performance.

### Final merge-risk read

**High.** The landing composition, performance, accessibility, responsive
containment, and broad regression gates are clean, but merge would still ship a
flagship security-mechanism overclaim and production channel logic that can
leave a visible looping scene permanently paused. The earlier machinery-fixture
flake remains fixture-only and stable in both complete suites; it is not part of
the remaining merge risk.

---

## Final clearance re-verification — 2026-07-11

- **Final tree reviewed:** `be06d7a`
- **Machinery remediation:** `5fe4f8b`
- **Copy/Addendum remediation:** `be06d7a`
- **Final verdict:** **SHIP-WITH-NITS**
- **Open blockers:** **0**

Both blockers from the preceding final review are closed. The known low
documentation/test-evidence nits recorded above remain non-blocking and did not
widen in these commits.

### Machinery clearance

`5fe4f8b` replaces the single pending claimant with a live LIFO eligibility
stack. Every claim registers immediately and de-duplicates itself
(`src/lib/scenes/scene-motion-channel.ts:18-32,122-125`); every release removes
that player's eligibility (`:100-109`); beat settlement reads the then-current
top claimant (`:127-145`). It therefore settles from live visibility state
rather than from a stale snapshot taken when the yield began.

I reran the previous direct stranding reproduction plus the two new edge cases:

- A→B→C with C leaving before settlement restores B as the sole active and
  advancing owner;
- A→B→C with C receiving ownership and later leaving restores B;
- rapid A→B→A leaves A as the sole owner at settlement, then restores B when A
  releases; and
- leave/re-enter during the deferred handoff retains the reclaimed A without a
  zero-owner or dual-owner interval.

An independent exhaustive probe also checked 7,776 five-operation
claim/release sequences during one pending yield; each final owner matched the
live LIFO stack and each state had exactly one advancing eligible player (or
zero when no claim remained). The four named regressions are encoded at
`tests/unit/scene-motion-channel.test.ts:108-201`; the channel unit suite passes
14/14. No claimant-loss or new ownership race was found.

### Webhook product-truth clearance

The shipped §05 body now says `token-authenticated webhook`; its caption says
the caller POSTs `ticket.created` with the binding token and correctly labels
the token chip as the secret's stored preview
(`src/lib/scenes/features.ts:189,815`). The scene claim now says
`authenticated, filtered, and on the record`. The frozen oracle mirrors the
body and caption without importing implementation data, and Addendum B2-2
records why authentication replaced signing.

The actual Jinn implementation matches those claims:

- `workflowEventToken()` reads the exact lowercase Node header key
  `x-jinn-workflow-event-token`, then falls back to an Authorization Bearer
  token (`packages/jinn/src/gateway/api.ts:1425-1438`);
- `POST /api/workflow-events` rejects requests without gateway or binding-token
  authentication before parsing and firing the event (`gateway/api.ts:3561-3598`);
- webhook bindings generate or accept a per-binding secret, persist only its
  SHA-256 hash and first-four/last-four preview, and compare hashes timing-safe
  (`packages/jinn/src/workflows/custom-triggers.ts:371-373,491-499,767-776,
873-880`).

A fresh grep of `dist/features/index.html` finds no `signed webhook`, signing,
HMAC, or payload-signature claim about Jinn ingress. It finds one occurrence of
`signature`: the §01 fictional payments-code-review sentence about timestamp
tolerance, explicitly retained by Addendum B2-2 because it describes the
fictional company's own code rather than Jinn webhook authentication. The built
page otherwise contains the amended `token-authenticated webhook` and `stored
preview` strings exactly.

`be06d7a` does not actually modify PNG baselines, despite the remediation brief
saying that it does. This is benign: the visible body is outside the
window-locator crops, while the caption is visually hidden and the scene claim
is metadata. The unchanged baseline suite passes in full, and exact deck E2E
coverage verifies the amended body and caption.

### Final gate record

| Gate                         | Result                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| direct handoff reproductions | Pass — both A→B→C variants, A→B→A, and leave/re-enter                                                                                                                 |
| `pnpm check`                 | Pass — 0 errors, 28 hints; 99/99 unit tests; build, safety, and links pass                                                                                            |
| `pnpm test:e2e`              | Pass — 157/157                                                                                                                                                        |
| `pnpm test:visual`           | Pass — 107 passed, 63 project-matrix skips                                                                                                                            |
| `pnpm test:lighthouse`       | Pass — `/` and `/features/`, three cold mobile runs each; aggregate medians 98 performance, 96 accessibility, 100 best practices, 100 SEO, LCP 2129ms, CLS 0, TBT 0ms |
| `/features/` eager JS        | Pass — 58,027 gzip bytes, 56.667 KiB, below 90 KiB                                                                                                                    |
| landing eager JS             | Pass — 71,976 gzip bytes, 70.289 KiB                                                                                                                                  |
| built webhook-copy grep      | Pass with the documented §01 non-product fiction exception                                                                                                            |

### Final merge-risk read

**Low.** The two remaining blockers are closed in code, direct adversarial
reproduction, contract copy, actual Jinn source, built output, and the complete
gate set. Residual risk is limited to the already-recorded low evidence/docs
nits; none affects product truth, one-channel ownership, landing feel, or the
merge path.

# A-04 hero review

- **Reviewed branch:** `a04-hero`
- **Reviewed commits:** `b97f779`, `94d3bf9`, `1570471`, `b970295`
- **Diff:** `main...a04-hero`
- **Contracts:** `docs/STORYBOARD.md` sections 1, 4, 5, 6, and 7; `docs/TECH-PLAN.md` sections 2, 3, and 8; `docs/HANDOFF-A04.md`
- **Verdict:** **BLOCK**
- **Finding count:** 3 high, 5 medium, 2 low

The branch lands a strong static composition: desktop geometry and entrance
timing are faithful, the resolved chat is real build-time HTML, no-JS and
reduced-motion output are byte-identical, the entrance is CSS-only, and the
delegation surface has seven unique local targets with no timing in the
surface. It is not safe to begin A-05 through A-07 on the stated handoff yet.
The mandatory check is red, the reusable shell does not expose the semantic
runtime contract later scenes require, and the handoff freezes a zero-focusable
invariant that conflicts with the required accessible pause control.

## Required remediation, in order

1. Restore the mandatory gate and make the handoff's verification claims true.
2. Define the actual runtime contract for the shared shell before A-05/A-07:
   canonical semantic state, stable shell targets for ribbon/pane transitions,
   and an ID-safe icon strategy for multiple windows.
3. Amend the focusability contract so fake controls remain inert while the real
   loop pause control is keyboard-accessible and at least 44px.
4. Close the mobile, exact-copy, and tap-target fidelity gaps.
5. Turn the A-04 QA claims into assertions that cover the full contract,
   including light screenshots, no-JS, full reduced motion, late entrance CLS,
   mobile geometry, and clipboard fallback.

## Findings

### 1. The mandatory `pnpm check` gate is red on the branch's own handoff

- **Severity:** HIGH
- **Location:** `docs/HANDOFF-A04.md:204-216`, `scripts/check-public-safety.ts:8-25`, `scripts/check-public-safety.ts:183-203`

`pnpm check` passes token validation, typechecking, lint/formatting, 14 unit
tests, and the static build, then fails in `safety:check` with one
`personal-identifier` violation in `docs/HANDOFF-A04.md`. A direct repeat of
`pnpm safety:check` fails identically. The root cause is not the sanctioned
absolute repository URL used by the nav and hero; the guard accepts that exact
URL. The handoff also spells the blocked owner identifier as standalone prose
while explaining the exception, and that standalone occurrence is correctly
rejected.

This also falsifies the handoff's explicit claim that `pnpm check` and the
privacy check are green. Because the safety gate is mandatory and was created
specifically to protect this public repository, this is a release blocker even
though `pnpm test:e2e` is green.

**Required invariant:** the complete `pnpm check` command must exit 0 from a
clean branch, and verification documentation must not create or conceal a
safety violation while claiming the guard passes.

### 2. The shared shell is not the semantic, runtime-targetable contract promised to A-05/A-07

- **Severity:** HIGH
- **Location:** `docs/TECH-PLAN.md:148-192`, `docs/STORYBOARD.md:170-186`, `docs/HANDOFF-A04.md:37-87`, `src/components/scenes/SceneWindow.astro:15-30`, `src/components/scenes/SceneWindow.astro:51-110`, `src/components/scenes/SceneWindow.astro:112-175`, `src/components/scenes/surfaces/ChatSurface.astro:1-79`

The delegation surface's seven `data-target` values are unique and scoped
correctly, and the surface contains no timing. That is useful but narrower than
the handoff claim.

The actual shell cannot express the next scene transitions without being
revised:

- `activePane` is an Astro build-time prop that only chooses an `--on` class.
- Ribbon items have neither `data-target` nor a semantic pane identity in the
  DOM, and the pane is one anonymous `<slot>`. The storyboard's next scene
  explicitly targets `ribbon.org` and `pane.org`.
- `ChatSurface` accepts no semantic state object; it hardcodes the resolved
  strings and visibility. The future reducer can compute an end state, but
  there is no canonical data path or assertion that mechanically guarantees it
  equals the shipped DOM as the handoff requires.
- Every `SceneWindow` inlines the same global SVG symbol IDs (`i-msg`,
  `i-users`, and so on). A-07's stacked mobile windows would therefore produce
  duplicate document IDs before A-08's later icon generalization.

The result is that A-05 would introduce a second manually synchronized source
of truth, while A-07/A-09 would need raw class/position queries, DOM replacement,
or a shell rewrite to implement pane continuity. All three contradict the
stated “add the rest around this markup without forking it” handoff.

**Required invariant:** render the resolved static view from the same canonical
semantic data the reducer validates, expose stable component-local shell
targets/identities for every scripted ribbon and pane transition, and make
multiple `SceneWindow` instances ID-safe. The handoff and validator tests must
describe and enforce that real contract.

### 3. The handoff's zero-focusable rule blocks the required loop pause control

- **Severity:** HIGH
- **Location:** `docs/STORYBOARD.md:152-156`, `docs/TECH-PLAN.md:194-202`, `docs/HANDOFF-A04.md:118-126`, `src/components/scenes/SceneWindow.astro:112-176`, `tests/e2e/hero.spec.ts:60-78`

The delegation scene loops for more than ten seconds including its resolved
dwell and reset. Both controlling contracts require a visible,
keyboard-accessible pause control of at least 44px docked to the window chrome.
The handoff instead instructs A-05/A-06 not to add any focusable element inside
`[data-scene-window]`, tells them to keep the zero-count assertion green, and
wraps all frame chrome in `aria-hidden="true"`.

The current E2E assertion does not distinguish fake illustration controls from
the real animation control A-06 must add. Following the handoff literally makes
the required pause inaccessible; following the storyboard makes the inherited
test fail or forces an awkward control outside the declared scene window.

**Required invariant:** keep duplicated ribbon/sidebar/composer controls inert,
but explicitly reserve an accessible, non-`aria-hidden`, at-least-44px control
slot for the real pause/play button and test that distinction.

### 4. The 390px window has double gutters and retains the forbidden mobile glow

- **Severity:** MEDIUM
- **Location:** `docs/STORYBOARD.md:520-525`, `docs/STORYBOARD.md:529-554`, `src/components/marketing/Hero.astro:63-73`, `src/components/marketing/Hero.astro:294-298`, `src/components/scenes/SceneWindow.astro:180-196`, `src/components/scenes/SceneWindow.astro:396-410`

At 390x844, a browser geometry probe measured the hero stage at `x=16` but the
actual frame at `x=32`, width `326`. The hero already supplies the 16px page
gutter; `.hero__stage` adds a second 16px padding layer. The contract calls for
the chat pane to be full-bleed with 16px gutters, which means the frame should
start at `x=16` and be 358px wide.

The `SceneWindow::before` amber radial glow is also still active below 900px.
The mobile contract explicitly drops stage glow. Ribbon/sidebar hiding and the
55svh frame height are correct.

**Required invariant:** at the 390px gate the pane has one 16px gutter per side,
and the stage-glow pseudo-element is disabled below 900px.

### 5. The final copy deck is not rendered verbatim

- **Severity:** MEDIUM
- **Location:** `docs/STORYBOARD.md:558-604`, `docs/HANDOFF-A04.md:187-200`, `src/components/scenes/SceneWindow.astro:32-48`, `src/components/scenes/SceneWindow.astro:149-167`, `src/components/scenes/surfaces/ChatSurface.astro:42-55`, `tests/e2e/hero.spec.ts:4-51`

The main hero, CTA, chat messages, placeholder, and caption match the deck.
Three deviations remain:

- The four timed session rows render `Analyst / 2m`, `Writer / 5m`,
  `Workflow / 9h`, and `Dev / 1d` without the specified middle-dot separator
  (`Analyst · 2m`, and so on).
- The delegation chips substitute a decorative SVG for the deck's literal
  leading `↳`; the required text is not present in build-time HTML.
- The desktop-only `Scroll` cue is absent. The handoff discloses this as an
  implementer design call, but the final copy deck has not been amended or
  approved to remove it.

The eyebrow's move from `--text-tertiary` to `--text-secondary` is acceptable:
it is disclosed and preserves AA contrast at 12px. The handoff's broader claim
that everything else is verbatim is not accurate.

**Required invariant:** render every final-deck string and separator exactly,
or land an explicit storyboard amendment before calling the deviation approved.

### 6. The real copy control is only 34x34px

- **Severity:** MEDIUM
- **Location:** `docs/STORYBOARD.md:520-525`, `docs/STORYBOARD.md:529-534`, `src/components/chrome/CommandPill.astro:59-70`, `src/components/chrome/CommandPill.astro:106-122`

The visual command pill is 44px high, but the only clickable element is its
34x34px copy button. Browser geometry confirms the same 34x34 target on desktop
and mobile. The 44px container does not enlarge the button's hit area.

Axe does not flag this, so the green accessibility audit is not evidence that
the storyboard's all-tap-targets requirement passes.

**Required invariant:** the actual interactive copy target, not merely its
container, must expose a non-overlapping hit area of at least 44x44px.

### 7. The five hero tests and screenshot script overclaim contract coverage

- **Severity:** MEDIUM
- **Location:** `tests/e2e/hero.spec.ts:3-114`, `tests/e2e/marketing-shell.spec.ts:175-199`, `scripts/shoot-a04.ts:15-32`, `docs/HANDOFF-A04.md:204-212`, `docs/TECH-PLAN.md:471-479`

All 16 E2E tests pass, and they do exercise real built HTML. The five hero tests
still leave material holes:

- The “copy-deck strings” test uses partial substring assertions and passes with
  the copy defects in finding 5.
- The focusability test freezes the contradictory zero-focusable invariant in
  finding 3.
- The copy test grants and exercises only the modern Clipboard API, not the
  implemented fallback or failure cleanup.
- The reduced-motion test checks only H1 opacity and final weight. It does not
  assert `data-motion="reduce"`, zero running hero/window animations, or the
  full resolved scene.
- No automated test covers JavaScript-disabled output, the pre-paint flag/no
  flash, entrance order/durations, mobile pane geometry/glow, shell target
  uniqueness, or the desktop scroll cue.
- The inherited CLS test reads 250ms after fonts are ready while the hero's last
  entrance ends at 1200ms. An independent 2200ms probe measured actual CLS as
  zero, so the implementation currently behaves well; the checked-in assertion
  would still miss a late entrance regression.

The shooter captures desktop dark, mobile dark, desktop reduced motion, and
desktop no-JS. It captures no light-theme result even though the A-04 gate names
dark/light and 390/1440 snapshots. The screenshots are evidence, not an
asserted visual gate.

**Required invariant:** assertions must fail for the defects they claim to
cover, and the A-04 screenshot matrix must include the named themes/viewports
or the gate must be explicitly narrowed.

### 8. The caption exists for screen readers but violates the visible-caption contract

- **Severity:** MEDIUM
- **Location:** `docs/TECH-PLAN.md:185-212`, `docs/HANDOFF-A04.md:44-49`, `src/components/scenes/SceneWindow.astro:112-115`, `src/styles/global.css:61-72`

The exact scene transcript is present in a `<figcaption>`, and hiding the fake
frame from assistive technology is sound. However, the technical plan twice
requires an adjacent visible caption, including for reduced motion. The branch
applies `.visually-hidden` unconditionally, and the handoff silently changes
“visible” to “visually hidden.”

This matters most when the resolved window is deliberately cut by the fold:
sighted no-JS/reduced-motion users do not receive the complete textual proof
outside the crop.

**Required invariant:** provide the contract's adjacent visible transcript (or
obtain an explicit accessibility-design amendment) while keeping decorative
window internals out of the accessibility tree.

### 9. Clipboard fallback failure leaks its scratch textarea

- **Severity:** LOW
- **Location:** `src/lib/command-pill.ts:10-33`, `tests/e2e/hero.spec.ts:80-95`

The modern clipboard path works, and a browser probe with
`navigator.clipboard` unavailable confirmed that a successful
`document.execCommand("copy")` fallback also reaches `Copied`. If the legacy
call throws, the textarea was declared inside the `try`, the catch cannot remove
it, and one invisible scratch textarea remains in the document. Failure is also
silent to the user.

**Required invariant:** remove temporary DOM in a `finally` path and cover both
fallback success and failure without stale nodes or false positive feedback.

### 10. Small CSS/performance/taste details miss named guardrails

- **Severity:** LOW
- **Location:** `docs/STORYBOARD.md:683-694`, `src/components/marketing/Hero.astro:104-107`, `src/components/scenes/SceneWindow.astro:186-210`, `src/components/scenes/SceneWindow.astro:241-244`

- The extra frame depth shadow hardcodes `rgba(0, 0, 0, 0.4)` instead of using
  or defining a token, despite the tokens-only quality requirement.
- `will-change: transform` remains permanently applied to both large headline
  lines after the one-shot entrance completes, retaining compositing hints when
  no animation remains.
- The active ribbon icon uses direct amber `--accent` even though the at-rest
  amber allow-list names brand marks, Install, the H1 period, send/engine/
  trigger treatments, and accent-fill washes—not a ribbon glyph.

There is no `transition: all`, no animation library/dependency was added, and
the hero entrance itself is CSS-only. These are polish issues, not structural
blockers.

**Required invariant:** use tokenized depth, keep compositing hints scoped to
actual animation need, and keep at-rest amber within the approved allow-list.

## Contract checks that passed

- Exact Hanken weights 250/640, tracking -0.012em/-0.042em, 12px/11px mono
  eyebrow sizing, amber period placement, and self-hosted variable-font preload.
- Entrance sequence and timings: 250ms eyebrow; 600ms masked lines with 90ms
  stagger; 850ms 260-to-640 bloom; 400ms sub/CTA with 120ms stagger; 700ms,
  24px window rise starting at 500ms. Seven CSS animations are present and
  settle without replay logic or added animation runtime.
- At 1440x900, measured copy block bottom `454.875`, frame `x=130`,
  `y=490.875`, width `1180`, and bottom below the 900px fold. This matches the
  intended top ~470px and window ~y500 composition.
- At 390x844, the H1 stays on two lines, CTA stacks, command pill is full width,
  frame height is 55svh, and ribbon/sidebar are hidden.
- Resolved messages/chips and the placeholder are build-time HTML; the transient
  typing indicator ships hidden. All seven delegation `data-target` values are
  unique under the scene root.
- The inline motion bootstrap appears in `<head>` before stylesheet links in
  the built artifact. `data-motion="ok"` opts into animation; no-JS leaves the
  settled defaults; initial reduced motion sets `data-motion="reduce"`.
- Committed no-JS and reduced-motion screenshots are byte-identical.
- One H1, logical current heading order, exact transcript in `figcaption`, fake
  illustration controls absent from the tab order, and no serious/critical axe
  violations after the entrance settles.
- Modern clipboard copy and the successful legacy fallback both write the exact
  payload and show `Copied`.
- Independent full-entrance probe reported CLS 0; all hero animations were
  finished after 2200ms.
- No new dependency or animation runtime. The only behavior added is the small
  command-copy enhancement plus the existing theme script.
- Screenshots and their reproduction script are in the intended docs/script
  locations. `git diff --check` is clean, and the four implementation commits
  are scoped coherently.

## Verification record

| Command/check                               | Result                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm check`                                | **FAIL** at `safety:check`; all preceding token/type/lint/unit/build stages pass |
| `pnpm safety:check` (repeat)                | **FAIL**, same single handoff violation                                          |
| `pnpm test:e2e`                             | Pass: 16 Chromium tests                                                          |
| `pnpm test:links:built`                     | Pass: 17 internal URLs                                                           |
| `git diff --check main...a04-hero`          | Pass                                                                             |
| No-JS vs reduced screenshot byte comparison | Pass: identical                                                                  |
| Browser geometry/motion/CLS probe           | Desktop composition and timing pass; mobile x=32 gutter defect reproduced; CLS 0 |
| Clipboard probes                            | Modern pass; legacy-success pass; legacy-throw leaves one textarea               |
| Branch leak scan                            | Expected sanctioned URL hits plus the blocking standalone handoff occurrence     |

Six untracked `variants/**/shoot.mjs` files were present before the review and
are outside `main...a04-hero`; they were preserved and are not part of this
branch's commits.

## Risk read for A-05 through A-07

**High.** A-05 can use the seven chat-local targets, but it cannot yet prove
that reducer output equals the separately hardcoded SSR state. A-06 inherits a
focusability rule that conflicts with its required pause control. A-07 inherits
a server-only `activePane`, no stable ribbon/pane targets, one anonymous pane
slot, and SVG IDs that will duplicate in stacked mobile windows. Fix or amend
these contracts before building the reducer/player/controller; otherwise the
next tasks will either ossify brittle selectors and duplicated state or rewrite
the foundation immediately after accepting its handoff.

---

## Re-review after remediation — 2026-07-10

- **Reviewed remediation commits:** `3ea8bc1`, `b3080e0`, `0b9ba8b`,
  `9e5bb18`
- **Verdict:** **SHIP-WITH-NITS**
- **Remaining finding count:** 0 high, 0 medium, 1 low
- **Original findings resolved:** 9 fully; finding 7 is materially resolved
  with one non-blocking assertion-rigor remainder

The load-bearing A-05 through A-07 contract is now real rather than prose-only.
The resolved static surface renders from canonical semantic data; every ribbon
item and mounted pane has a stable component-local target and semantic pane
identity; pane selection is a `data-active` move; stacked windows share one
page-level SVG sprite; and the future real pause control has a reserved slot
outside the aria-hidden illustration. The accepted hero-caption amendment is
implemented cleanly. Both mandatory gates are green.

### Finding disposition

| #   | Disposition                        | Re-review evidence                                                                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Resolved**                       | `pnpm check` exits 0, including `safety:check`; the handoff contains no blocked standalone owner identifier.                                                                                                                                                                                                                             |
| 2   | **Resolved**                       | `lib/scenes/dashboard.ts` and `lib/scenes/types.ts` are the canonical data path; `ChatSurface` renders from `delegationResolved`; all five ribbon and pane targets exist; a live `data-active` move switched chat to org; the single page-level sprite has 11 unique symbol IDs. No scene timing is baked into either surface.           |
| 3   | **Resolved**                       | `[data-scene-frame]` remains aria-hidden and contains zero focusables, while `[data-scene-controls]` is inside the scene figure, outside the hidden frame, and not aria-hidden. A-06 can mount its real pause button without violating the fake-control rule.                                                                            |
| 4   | **Resolved**                       | At 390x844 the rendered frame measured `x=16`, width `358`; ribbon and sidebar are hidden; the stage-glow pseudo-element computes to `display: none`.                                                                                                                                                                                    |
| 5   | **Resolved**                       | Rendered copy includes the middle-dot session subtitles, literal `↳` delegation leads, and desktop `Scroll`; direct comparison to the storyboard found no remaining A-04 string mismatch.                                                                                                                                                |
| 6   | **Resolved**                       | The actual copy button measures 44x44px at both 1440 and 390.                                                                                                                                                                                                                                                                            |
| 7   | **Mostly resolved**                | The suite now exercises canonical data, target uniqueness, sprite IDs, focus scoping, 44px geometry, modern/fallback/failure clipboard paths, reduced motion, no-JS content, mobile geometry/glow, and full-entrance CLS; the light screenshot pair is committed. One low-severity rigor gap remains below.                              |
| 8   | **Resolved by accepted amendment** | The hero window is a deliberately cropped decorative illustration: its frame is hidden from AT, the exact proof is supplied by a visually hidden `<figcaption>`, and the real-controls slot remains exposed. Jimbo accepted visible transcripts moving to the later primary scene sections; the handoff discloses that scope explicitly. |
| 9   | **Resolved**                       | Clipboard fallback cleanup is in `finally`; both false-result and throw paths return false, leave no scratch node, and never set `data-copied`.                                                                                                                                                                                          |
| 10  | **Resolved**                       | Frame depth uses `--shadow-overlay`, permanent `will-change` is gone, and the active ribbon uses `--accent-fill` plus primary text rather than direct amber. No new runtime dependency was added.                                                                                                                                        |

### Remaining low-severity finding

#### 7R. Two E2E names still overstate the exact guarantee they enforce

- **Severity:** LOW
- **Location:** `tests/e2e/hero.spec.ts:12-74`,
  `tests/e2e/hero.spec.ts:231-234`

The tests are substantive and all current output is correct, but “renders the
hero copy-deck strings verbatim” and “shipped DOM equals the canonical scene
data” use `toContainText` for several values. They would pass if extra text were
appended. Likewise, “opts into motion with the pre-paint flag” verifies the
attribute after navigation, not that it was set before first paint. Direct
source/build inspection closes those questions for this revision: the surface
contains no duplicate hardcoded scene copy, and the inline bootstrap appears in
`<head>` before stylesheet links. This is a regression-precision nit, not a
product or A-05 contract blocker; future test maintenance should use normalized
text equality and inspect bootstrap ordering explicitly.

### Accepted accessibility amendment

The accepted amendment is internally coherent: the hero's frame alone is
`aria-hidden`; the exact figcaption remains in the accessibility tree; the
page's visible headline and subcopy communicate the product without relying on
the cropped thread; and `[data-scene-controls]` is not swallowed by the hidden
frame. Later pinned/stacked scene sections still inherit the visible-transcript
requirement because their windows become primary content.

### Verification record

| Command/check                       | Re-review result                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm check`                        | **Pass**: tokens, typecheck, lint/format, 14 unit tests, build, public safety, and 17-link gate                          |
| `pnpm test:e2e`                     | **Pass**: 25/25 Chromium tests (14 hero + 11 shell)                                                                      |
| `git diff --check cdd0c22..9e5bb18` | Pass                                                                                                                     |
| Desktop render probe                | Frame `x=130`, `y=515.86`, width `1180`, bottom below fold; weights 250/640; desktop scroll cue visible; pane swap works |
| Mobile render probe                 | Frame `x=16`, width `358`, height `55svh`; pane-only; glow and scroll cue hidden                                         |
| Focus/ID probe                      | 0 focusables in decorative frame; controls slot exposed; all current local targets unique; 11/11 unique sprite IDs       |
| Screenshot matrix                   | Dark/light at 1440/390 present and visually inspected; no-JS and reduced-motion SHA-256 hashes are byte-identical        |
| Clipboard coverage                  | Modern path writes exact payload; legacy success cleans up; legacy throw leaves no node and shows no false feedback      |
| Branch safety scan                  | Only the sanctioned repository URL appears from the privacy pattern; `safety:check` passes                               |

Six pre-existing untracked `variants/**/shoot.mjs` files remain untouched. A
separate operator-authored commit, `c02418a`, landed on the branch during this
re-review and changes only `PLAN.md`; it is outside the four remediation
commits and outside this A-04 finding disposition.

### Updated risk read for A-05 through A-07

**Low.** A-05 has a canonical resolved-state shape and stable local targets to
validate and reduce against. A-06 has a non-hidden control slot that can host
the required real 44px pause button. A-07 can swap mounted panes by moving
`data-active` and can stack windows without duplicate SVG IDs. The remaining
test strictness nit does not require a markup rewrite or create runtime
ambiguity; the main integration risk is simply that later tests must scope
duplicate component-local targets to each `[data-scene-window]` when several
windows are mounted.

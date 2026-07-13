# A-04 → A-05+ Handoff

**Task A-04 · jinn.run hero (static composition + entrance choreography) · jinn-designer · 2026-07-10 (rev 2, post-review)**

This is the implementer handoff for everyone building on the hero: the scene
system (A-05 reducer, A-06 `ScenePlayer`, A-07 orchestration), the faithful
surfaces (A-08), and the scene authoring (A-09+). A-04 shipped the **static
layer + the one-time on-load entrance only** — no scene machinery, no GSAP, no
scroll-driven animation. It also establishes the **runtime contract** the scene
system drives, so A-05–A-07 build on this markup without forking it.

Read this alongside `docs/STORYBOARD.md` (§1/§4 hero, §Section 1 delegation
timeline, §5 mobile) and `docs/TECH-PLAN.md` (§2 structure, §3 scene system,
§8 A-04 row).

---

## 1. Component structure (where things live)

- **`components/marketing/Hero.astro`** — the hero section: quiet-ember type,
  entrance choreography, CTA row, and the page-level layout of the window. It
  imports the window + surface; it does not know about scene timing.
- **`components/scenes/SceneWindow.astro`** — the reusable dashboard frame:
  icon ribbon → sessions sidebar → content panes, plus a reserved control slot.
  Props: `activePane` (`PaneKey`) and `caption`. Renders the runtime contract
  (§3). Ribbon + sessions render from canonical data (§2).
- **`components/scenes/surfaces/`** — one component per dashboard pane. A-04
  shipped `ChatSurface.astro`; A-08 adds `org`, `todos`, `flows`, `triggers`
  here following ChatSurface's conventions (render from canonical state,
  `data-target` ids, no focusable fake controls).
- **`components/scenes/SceneIconSprite.astro`** — the shared SVG symbol sprite,
  rendered **once per page** (see §4).
- **`components/chrome/CommandPill.astro`** + **`lib/command-pill.ts`** — the
  reusable install pill (copy-to-clipboard, ≥44×44 hit area, fallback with
  finally-cleanup). Reused by the hero and later install/CTA sections.
- **`lib/scenes/types.ts`** + **`lib/scenes/dashboard.ts`** — the canonical
  semantic data contract (§2).

Layering (TECH-PLAN §3): **surface component (static view from canonical data)
→ scene definition (declarative story) → ScenePlayer (runtime) →
SceneController (orchestration)**. A-04 built the first layer plus the shared
shell/data contract.

---

## 2. Canonical data contract — the single source of truth

`lib/scenes/dashboard.ts` is the one place the dashboard copy and structure
live. Surfaces render **from** it; they hardcode nothing. The A-05 reducer must
compute end states in the **same** shapes (`lib/scenes/types.ts`), so its
resolved output can be asserted equal to this data.

- `RIBBON: RibbonItem[]` — the five panes in order, with icon symbol ids.
- `SESSIONS: SessionRow[]` — sidebar rows (copy deck §6 verbatim, middle-dot
  subtitles like `Analyst · 2m`).
- `delegationResolved: ChatSceneState` — the `delegation` scene at its RESOLVED
  checkpoint: `pill`, ordered `thread` (messages / typing / chip-group), and
  `composerPlaceholder`. Message/chip bodies are `TextSegment[]` (`strong`
  marks bold). Each thread item carries its own `target`.
- `segmentsToText(body)` — flattens segments to plain text (used by the
  DOM==data test).

**Mechanical guarantee:** `tests/e2e/hero.spec.ts` → "shipped DOM equals the
canonical scene data" iterates `delegationResolved` + `SESSIONS` and asserts
each string renders at its `data-target`. A-05 should add the reducer's
`resolved === delegationResolved` assertion in unit tests, closing the loop.

A-05 extends `types.ts` with the timeline/beat types and the **initial** state
variant (empty thread, composer placeholder, typing hidden); `dashboard.ts`
gains `delegationInitial` alongside `delegationResolved`.

---

## 3. Runtime shell + target contract

Targets are **component-local stable ids** on `data-target`, scoped to the
scene root. The player must fail loudly on a missing/duplicate target.

**Structural hooks (SceneWindow):**

| Hook                                          | What it is                                                    |
| --------------------------------------------- | ------------------------------------------------------------- |
| `[data-scene-window]`                         | the `<figure>` root (one per window)                          |
| `[data-scene-frame]`                          | the decorative chrome (aria-hidden; inert — see §5)           |
| `[data-scene-controls]`                       | reserved, NOT aria-hidden control slot for the pause button   |
| `[data-target="ribbon-<pane>"]` + `data-pane` | ribbon item per pane; active one has `data-active`            |
| `[data-target="pane-<pane>"]` + `data-pane`   | mounted pane container per pane; active one has `data-active` |

**Pane transitions (A-07):** all five panes (`chat`, `org`, `todos`, `flows`,
`triggers`) are mounted as `data-target="pane-<key>"` containers (a named slot
each: `<slot name="chat"/>` …). A-04 fills only `chat`; A-08 fills the rest.
The active pane/ribbon is marked with the boolean `data-active` attribute; CSS
shows only the active pane. **To swap panes the controller moves `data-active`**
between `ribbon-<from>`/`pane-<from>` and `ribbon-<to>`/`pane-<to>` — no class
juggling, no DOM replacement, no position queries. The storyboard's
`ribbon.org` / `pane.org` map to `ribbon-org` / `pane-org`.

**`delegation` scene targets (inside `pane-chat`):**

| `data-target`    | Element                     | Timeline role                           |
| ---------------- | --------------------------- | --------------------------------------- |
| `composer-input` | composer placeholder `<p>`  | `type-text` types the user message here |
| `msg-user-1`     | user bubble `<p>`           | `enter`                                 |
| `thread-typing`  | three-dot indicator `<div>` | `enter`/`exit` (toggle `hidden`)        |
| `msg-coo-1`      | COO reply `<p>`             | `enter`                                 |
| `chip-analyst`   | delegation chip `<span>`    | `enter`                                 |
| `chip-writer`    | delegation chip `<span>`    | `enter`                                 |
| `msg-coo-2`      | COO finding `<p>`           | `enter`                                 |

New surfaces follow the same naming (`node-coo`, `card-142`, `step-gate`,
`binding-cron`, …) matching the storyboard target column 1:1.

---

## 4. ID-safe icons

Icons are a single page-level `<SceneIconSprite/>` (rendered once in
`index.astro`), referenced by every window via `<use href="#i-*">`. This is
**id-safe for A-07's stacked mobile windows** — several `SceneWindow`s on one
page share the one sprite with no duplicate document ids (a hero test asserts
sprite count 1 and unique symbol ids). A-08 may swap the sprite for the Lucide
Astro package without changing the `#i-*` reference contract.

---

## 5. Focusability + the real pause control

The frame chrome (`[data-scene-frame]`) is a decorative illustration: its fake
ribbon/sidebar/composer controls are `<span>`/`<div>` (never
`<button>`/`<a>`/`<input>`) and the whole frame is `aria-hidden="true"`. The
hero test asserts **zero focusable elements inside `[data-scene-frame]`** — this
is scoped to the fake chrome only, NOT the whole window.

The looping hero scene (A-06) needs a visible, keyboard-accessible pause/play
control ≥44px docked to the window chrome (STORYBOARD §Section 1, TECH-PLAN §3).
SceneWindow reserves it: **`[data-scene-controls]`** — a non-aria-hidden slot
(`<slot name="controls"/>`) docked bottom-right of the window, empty at rest
(`:empty { display:none }`). A-06 mounts a real `<button>` there and adds its
own test that the control is focusable and ≥44×44. The zero-focusable rule for
the fake chrome and the real pause control therefore coexist.

---

## 6. The `html[data-motion]` pre-paint flag contract

`MarketingLayout.astro` sets, in an inline `<script is:inline>` in `<head>`
(before first paint):

```js
document.documentElement.dataset.motion = matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches
  ? "reduce"
  : "ok";
```

- **`data-motion="ok"`** — the hero entrance CSS is keyed on
  `html[data-motion="ok"]`; the player should also gate timelines on `"ok"`.
- **`data-motion="reduce"`** — no entrance, no timelines; the resolved DOM
  stands.
- **absent (no JS)** — same as `reduce`.

Because the flag is pre-paint and the entrance uses `animation … both` (the
`from` state is held through the delay), there is no flash and no CLS. "Settled
is the default; motion is opt-in." Re-evaluate the media query if the OS
preference changes at runtime.

---

## 7. Tokens, utilities

- **Site tokens** (`site-tokens.css`): `--site-hero-copy-max`,
  `--site-window-max`, `--site-window-height`, `--site-window-height-mobile`.
- **Utility** (`global.css`): `.visually-hidden`.
- The window frame uses `--shadow-overlay` (tokenized, theme-aware — no
  hardcoded rgba). The stage glow is `color-mix(in srgb, var(--accent) …)` and
  is dropped below 900px.

---

## 8. Deviations from the storyboard (disclosed)

1. **Eyebrow uses `--text-secondary`, not `--text-tertiary`** (§4). At 12px,
   tertiary is ~3.05:1 on `--bg` — below the 4.5:1 AA gate the axe audit
   enforces. Secondary passes and still reads as a quiet mono kicker.
2. **Accessibility-design amendment — the hero window caption is AT-only, not a
   visible transcript.** TECH-PLAN §3 asks for an adjacent _visible_ caption.
   For the hero specifically, the staged window is a **decorative product
   illustration** deliberately cropped by the fold; the page's human-readable
   message is the fully-visible headline + subcopy, and the scene transcript is
   provided to assistive tech via the window's `<figcaption>` (in the a11y
   tree, decorative chrome hidden). Standard practice for a hero screenshot.
   The _visible_ transcript requirement applies to the pinned/stacked scene
   sections (A-08+), where the window is the primary content and not
   fold-cropped. This is the explicit amendment TECH-PLAN's invariant permits;
   flagged here for review.

Everything else in §4/§6 for the hero is rendered verbatim: copy, Hanken
weights 250/640, tracking −0.012em/−0.042em, amber period, clamp sizing, the
`↳` chip lead, middle-dot session subtitles, the desktop `Scroll` cue, and the
mobile pane-only window with one 16px gutter.

---

## 9. Verify / reproduce

- Gate: `pnpm check` (tokens · typecheck · lint · unit · build · **safety** ·
  links) exits 0, and `pnpm test:e2e` (25 tests: 11 shell + 14 hero) is green.
- Screenshots: `pnpm exec tsx scripts/shoot-a04.ts` against a preview on :4330
  writes six PNGs to `docs/screens/a04/`: `hero-1440-dark`, `hero-390-dark`,
  `hero-1440-light`, `hero-390-light`, `hero-1440-reduced-motion`,
  `hero-1440-nojs`. The nojs and reduced-motion shots are byte-identical
  settled states — the static-first proof.
- Privacy: leak-grep the staged diff before every commit (jinn-design skill);
  `pnpm safety:check` is the enforced guard. The only sanctioned owner
  reference is the exact repository URL `https://github.com/hristo2612/jinn`
  used by the nav and hero (the guard allow-lists that exact string). Do not
  write the bare owner handle anywhere else — the guard rejects a standalone
  occurrence, and that is what makes `safety:check` red.

# l2-product-real — "The app IS the hero"

## Design intent
An Apple-product-page treatment where the actual Jinn dashboard is the star and
the marketing chrome is nearly invisible: type, space, one amber accent. The
hero stages a pixel-plausible recreation of the real web app (icon ribbon →
sessions sidebar → chat thread, the app's exact tonal staircase) under one huge
Hanken Grotesk headline. On scroll the page pins: the headline hands its slot
to a stage header while the SAME window persists and *navigates itself* — the
ribbon's active icon moves and the content pane swaps through the four
primitives, the way a user would actually click through the product:

1. **Employees** — org map: COO node (amber stripe, engine pill) over two
   department groups with per-dept hue stripes, exactly the app's node spec.
2. **Todos** — the ledger: tinted state discs (executing/assigned/blocked/done),
   owner monogram chips, cost pill, execution-context line with amber "Open".
3. **Workflows** — a run: amber trigger chip → step cards with honest states
   (green check, blue spinner, gate, queued clock).
4. **Triggers** — bindings list (cron / todo-status / webhook) with mono kind
   labels.

Each stage plays ONE honest micro-state-change ~1s after it becomes active:
the executing todo completes (spinner disc crossfades to green check, exec line
flips to "Done · reviewed by Jimbo"), the workflow's running step completes and
the approval gate starts pulsing its bell, the cron trigger fires (amber wash,
"fired · just now", a run-started line appears). Honest-state rules from the
app are preserved — a running step spins blue, never green.

## Ledger fidelity
- All colors/radii/shadows/easings are the REAL dark-theme token values from
  `packages/web/src/routes/globals.css`. No foreign values, no hairline borders
  at rest — separation is soft fills + the shadow scale (shadow-card /
  shadow-overlay carry their built-in 0.5px ring).
- Surfaces recreated from the actual components: composer card (22px,
  bg-secondary, shadow-card), user bubble (accent-fill, 14/14/6/14 radius),
  full-width assistant text, no avatars in message rows, frosted header pill,
  ribbon #232019 → sidebar #1C1A14 → thread #14130F staircase, todo cards and
  state-glyph discs per `state-glyph.tsx`, employee nodes per
  `employee-node.tsx`, workflow node cards per `node-card.tsx`.
- Amber is rationed: nav Install, brand mark, active ribbon icon, H1 period,
  send button, engine pills, the trigger chip, and the accent-fill washes.

## Type & motion
- Hanken Grotesk only (display 800 at clamp 40–72, tracking -0.035em) +
  IBM Plex Mono for commands, kickers, and data labels. Apple HIG scale for
  everything inside the frame.
- Motion: GSAP ScrollTrigger drives only discrete stage switching + a ±8px
  frame drift; all element motion is CSS transform/opacity with the app's
  spring/smooth easings. `prefers-reduced-motion` collapses everything to
  instant states.

## Responsive
- Desktop: 520vh pinned showcase (CSS sticky + ScrollTrigger progress).
- Mobile (<900px): no pinning — hero shows the chat frame full-width (ribbon +
  sidebar hidden), then the four stage panels are cloned into stacked blocks
  with IntersectionObserver-triggered entrances and the same micro-states.
  Workflow becomes the vertical rail, org stacks departments — matching how
  the real app adapts.

## Libraries
GSAP 3.12 + ScrollTrigger (CDN), Google Fonts (Hanken Grotesk, IBM Plex Mono).
Everything else hand-rolled; icons are inline lucide-derived SVG symbols.

## Files
- `index.html` — self-contained page.
- `shoot.mjs` — Playwright screenshot rig (desktop 1440 hero + 4 stages +
  below-fold, mobile 390 hero/todos/flow). `node_modules/` holds two symlinks
  into the jinn repo's pnpm store for playwright.
- `shots/final-*` — the verified set; `pass2-*`/`pass3-*` are iteration
  history.

## Iteration log (3+ passes)
1. **Pass 1 → 2**: sidebar/org/workflow/trigger label pairs rendered inline
   (span default) — stacked them; thread re-anchored to the composer
   (justify-end) so the conversation hugs the input like a real chat; frame
   given bottom breathing room; entrance delays tightened.
2. **Pass 2 → 3**: mobile frame rendered EMPTY — `display:none` on
   ribbon/sidebar made the pane the first grid child in a 0-width track;
   collapsed the grid to 1fr on mobile. Enlarged org nodes (244px) and
   workflow nodes (192px) to fill the pane confidently; brightened the amber
   stage glow; tightened mobile page-panel headers.
3. **Pass 3 → final**: `.thread{min-height:0}` so the composer can't be pushed
   out of the frame on mobile; theme-color meta.

## What I'd refine with more time
- Scrub-linked "handoff" beats between stages (e.g. the delegation chip in
  chat visually flying into the Todos ledger as you scroll) — the strongest
  version of "the same frame morphs" needs FLIP-style shared-element motion.
- A light-theme variant driven by `prefers-color-scheme` (tokens are already
  in place; it's a copy of the light block + swapping two staging shadows).
- Real screenshots-in-frame fallback for `<noscript>` / SEO.
- Live-typing the user message character-by-character on first load, and a
  second run of the trigger firing on re-entry (currently plays once per
  visit to stay calm).

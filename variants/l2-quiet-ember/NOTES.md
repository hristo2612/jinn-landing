# l2-quiet-ember — "The app language at cinema scale"

Round-2 rebuild of the round-1 `ember-ledger` composition, token-true. The
thesis: the Ledger design system needs no borrowed clothes. Everything the
Fraunces serif did in round 1 — gravity, warmth, editorial confidence — is
done here purely with the app's own voice.

## Design intent

One continuous brand from landing → app. The page uses the **exact Ledger
dark tokens verbatim** from `packages/web/src/routes/globals.css` (bg
`#14130F`, text `#E8E4D8`, accent `#E0A33C`, the real fill/shadow/radius/easing
scales). The MCP "hard cut" beat is literally the **Ledger light theme**
(`#F4F1E8` / `#211E16` / `#926516`) — the mid-page cut proves one system, two
themes.

## Type

Hanken Grotesk (variable, 100–900) + IBM Plex Mono ONLY. All display drama
comes from **weight contrast at identical size**: hero line 1 at wght 250,
line 2 at wght 640 with tighter tracking (-0.045em vs -0.022em — heavier
weights need more negative tracking at display scale). Display sizes derive
by continuing the HIG scale past 34: 48 → 68 → 96 → 136. Hanken's period at
wght 640 renders as a near-square — the amber full stop reads as a terminal
block cursor, which is kept deliberately (`jinn.run` reads as a command).
Mono carries every piece of metadata: eyebrow, kickers, primitive meta rows
(`org/scout.yaml · engine: claude · rank: senior`), ledger statuses, MCP tool
names, footer note.

## Amber budget (rationed to near-nothing)

At rest the page shows amber in exactly: the headline period, the `$` prompt,
the nav/footer wordmark dot, the LIVE pulse + executing dots in the todo
vignette. Transient only: the constellation's delegation spark, and a single
scroll-tick — the primitive row nearest the viewport center lights its mono
number. Kickers are text-tertiary, not amber.

## Signature element

DPR-scaled canvas constellation in the hero: 8 warm paper-white nodes
(breathing sine glow) arranged as a loose org chart hugging the edges, mono
role labels (coo, dev, scout, support) whispered at 11px. Rest links at 3.8%
alpha. Every ~4–7s one **delegation spark** travels an edge — the edge glows
amber while the spark runs, then the receiving node flares briefly. On mobile
(<640) rest links are dropped entirely; the spark draws its own edge as it
travels. Reduced motion = one static frame.

## Materials & depth

Install pill = frosted `--pill-bg` + blur(20px) saturate(180%) +
`--shadow-card` (its built-in 0.5px ring + inset shine — no border). Nav chips
are transparent at top and gain the frosted pill material only once scrolled.
Todo vignette card = `--bg-secondary` + `--radius-2xl` + `--shadow-card`,
row hover = `--fill-quaternary`. Zero hairline borders anywhere at rest.

## Motion

Lenis smooth scroll + GSAP/ScrollTrigger (CDN). Headline: masked line-rise +
a one-time **optical weight bloom** (line 2 tweens wght 260 → 640 via
font-variation-settings as it rises). Reveals use the app's authReveal voice:
rise + deblur (blur 5px → 0). Hero canvas parallax-dims on scroll.
`prefers-reduced-motion` kills everything and shows the resolved layout.

## Structure

Hero (constellation + weight-play headline + install pill) → four primitives
as a numbered editorial ledger, whitespace-separated, with product-real mono
meta rows and the nearest-center amber tick → MCP statement as the light-theme
hard cut with mono MCP tool names → how-it-works 3 steps → live todo-ledger
vignette (rotating feed) → closing statement (weight play again) → quiet
footer.

## Libraries

GSAP 3.13 + ScrollTrigger, Lenis 1.3 (CDN). Canvas is hand-rolled. Fonts via
Google Fonts variable axis.

## Iteration log

- p1: token skeleton; found constellation links slicing the eyebrow, broken
  mobile primitive grid (baseline alignment in 1-col grid), MCP "The" orphan.
- p2: asymmetric constellation arc (top edge above eyebrow), mobile
  edge-hugging layout with no rest links, primitives tightened + scroll tick,
  MCP bold on its own block line, mobile grid fixed.
- p3: MCP statement rebalanced to 2 lines + bold line (wider container,
  5.4vw), primitive active band narrowed.
- p4: nearest-viewport-center logic so exactly ONE primitive number carries
  amber at a time; leak-grep clean; final set.

# ember-ledger — "Quiet luxury, cinematic restraint"

## Design intent
Restraint as spectacle. A near-black warm-ink page where the product story is
told by one signature motion element: a slow ember field that resolves into a
faint, breathing **org-chart constellation** — the top node is the COO, and
whisper-quiet mono labels (`coo`, `dev`, `scout`, `support`) fade with each
node's breath. Delegation appears as brief amber link-lines that draw between
nodes and dissolve (tree edges only, never crossing the headline; disabled on
mobile). Everything else is enormous, confident typography and generous
darkness, under a fine animated film grain.

## Palette
- Ink `#0A0807` (page) → `#121009` (panel gradient)
- Bone `#F2EBDD` (light title-card beat + display text)
- Text warm grays `#EFE7D8 / #A99F8C / #6E6659`
- Amber `#E0A33C` (the app's Ledger accent, kept), ember highlight `#F2C069`,
  deep amber `#8A5A1B`
- Status: sage `#9BB27E`, rust `#C4744B` — desaturated, warm
- Amber is rationed: one period in the hero headline, kickers, status dots,
  node glows. Nothing else.

## Type
- Display: **Fraunces** variable, weight ~340–400, `opsz` up to 144 — the high
  optical size gives the hairline-contrast, fashion-editorial cut. Italic used
  as the emphasis voice ("AI company", "The hands are shared.").
- Body/UI: **Hanken Grotesk** (continuity with the Jinn app).
- Mono: **IBM Plex Mono** (commands, kickers, ledger, node labels).

## Structure
1. Hero — headline + install pill over the ember constellation.
2. "A company in four parts" — editorial numbered rows (Employees / Todos /
   Workflows / Triggers), gradient hairlines, amber-period hover.
3. MCP statement — full-bleed **bone title card**: the one light beat in the
   film, hard-cut both sides.
4. How it works — three steps + "The Ledger" live vignette (looping feed of
   employee rows: executing / done / needs-you).
5. Closing line + install pill over a breathing glow; minimal footer.

## Motion
- Canvas 2D (DPR-scaled): ember motes with flicker, 8 breathing org nodes,
  staggered link draw-in/out (~2 visible at once).
- GSAP + ScrollTrigger: masked line-rise for the H1, soft y+fade reveals,
  hero parallax/dim on scroll.
- Lenis smooth scroll; anchor glides. Nav hides on scroll down, returns on up.
- Film grain: SVG feTurbulence tile, stepped translate (3 fps shimmer).
- `prefers-reduced-motion`: all of it degrades to a static, fully-legible page.

## Libraries
GSAP 3.13 + ScrollTrigger, Lenis 1.3 (CDN); fonts via Google Fonts. No build
step — single self-contained `index.html`.

## Screenshots
`shots/p3-*` are the current state (p1/p2 kept to show the iteration passes):
desktop 1440 (hero, primitives, MCP card, ledger, closing) and mobile 390
(hero, primitives, ledger) — all deviceScaleFactor 2, via Playwright
(`shoot.mjs`, pass `PLAYWRIGHT_PKG` pointing at a playwright install).

## Iteration log
- **p1 → p2**: killed UA button border on command pills (worst defect); fixed
  H1 "y" descender clipped by the line mask (padding/negative-margin on the
  mask); recomposed constellation to tree-edges-only with ~2 links visible at
  once (was ~7 — read as accidental plexus); links off on mobile; nowrap
  eyebrow terms; ledger panel presence (gradient fill, inset top highlight,
  stronger glow); breathing glow behind closing.
- **p2 → p3**: whisper mono role labels on constellation nodes (desktop only,
  alpha tied to breath); amber-period hover on primitive names; Lenis anchor
  glide; trimmed dead space under the ledger.

## With more time
- Scroll-linked constellation hand-off: nodes drift apart and re-form as a
  mini org chart beside the "four parts" rows.
- A real WebGL volumetric glow (light shafts) behind the hero — kept 2D canvas
  for headless reliability and weight.
- Variable-font `opsz`/`wght` micro-animation on the H1 during entrance.
- OG image + real docs/GitHub hrefs; Safari `backdrop-filter` audit.

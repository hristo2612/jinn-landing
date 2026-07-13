# smoke-genie — "Otherworldly / the conjured jinn"

## Design intent
The page IS the summoning. A terminal chip types `$ jinn run` and a living
plume of shader smoke rises from it — the jinn conjured by a command. Scrolling
resolves the apparition into the four primitives (Employees / Todos /
Workflows / Triggers), each presented as a numbered rite with an alchemical
sigil. The narrative closes where it began: `$ jinn run` as a monumental
command line. Positioning line: **"Summon your company."**

## Palette
- Base: `#06070b` near-black indigo, `#0a0c13` raised
- Smoke: deep teal `#0b2b28` → jade `#5fc9a4` (the genie's body)
- Accent: gold-leaf `#d9a854` / highlight `#f0c87e` (embers, sigils, italics)
- Ink: warm parchment `#ece7da`, dimmed at .56/.32 for hierarchy

## Type
- **Zodiak** (Fontshare) — sharp editorial serif; italics carry the "magic
  words" (Summon, the hands, running itself) with a gold gradient
- **Switzer** (Fontshare) — clean grotesk body
- **IBM Plex Mono** — terminal voice: chips, feed, `$ jinn run` band

## Motion concept
- Hero: raw-WebGL fragment shader (fbm + domain warp, no three.js — ~150
  lines, zero dependency weight). Plume envelope shaped to rise from the
  typed caret; gold sparkles advect inside the smoke; mouse bends the column.
  Conjure ramp (0→1) fires after the command finishes typing.
- Lenis smooth scroll + GSAP ScrollTrigger. The four rites are a pinned
  320vh sequence with crossfading panels and roman-numeral progress.
- MCP orbit: JS-positioned dots on an ellipse with depth-faded labels and
  spokes — employees orbiting one tool interface.
- Feed vignette: staggered log lines, live-dot pulse.
- `prefers-reduced-motion`: typing/conjure/orbit/pin all degrade to static.

## Performance / responsiveness
- Shader exposure is aspect-aware (portrait damps ~40%) + CSS scrim keeps
  mobile text legible over the smoke. DPR clamped at 2, RAF paused offscreen.
- Mobile (390): pinned sequence flattens to stacked panels; nav auto-hides on
  scroll-down; page-wide film grain (4% SVG turbulence) unifies sections.

## Libraries
GSAP 3.12 + ScrollTrigger, Lenis 1.1 (both jsDelivr), Fontshare + Google
Fonts CDN. Everything else hand-rolled.

## Iteration log
1. **v1** — full build. Found: MCP orbit broken (GSAP transform-origin
   scattered the dots), mobile hero washed out, rite sigils too faint,
   Employees sigil clip-arty, scroll cue off-center (GSAP clobbers CSS
   translateX), rite panels bottom-heavy (zero-height abs container).
2. **v2** — orbit rewritten (ellipse math + depth fade), aspect-aware shader
   exposure + hero scrim, sigil redesign (org constellation) + glow,
   gold hairline card accents, band caret + glow, panel centering fix.
3. **v3/final** — page-wide grain, live-ledger header row on the feed,
   nav auto-hide on mobile, step-card hover, centered scroll cue verified.

# living-org — "The company comes alive on paper"

## Design intent
The opposite of dark-SaaS default: a beautifully printed annual report /
founding document that started breathing. The page is set like a Swiss
editorial broadsheet — visible rules, figure numbers ("Fig. 1 — The Org,
Live"), a table of contents, a rotating ink seal, a daily-close receipt, a
barcode colophon — and the company itself is the hero artifact: a live
orthogonal org chart where delegation tickets travel the reporting lines,
paired with an event ledger that prints new rows in sync with the chart's
pulses and a shared wall clock.

## Palette
- Paper `#F5F0E4` (warm cream, SVG-grain overlay at 4%)
- Ink `#1D1810` (warm near-black; alpha steps for rules/secondary text)
- One accent: electric ultramarine `#2418E8` (bright variant `#4B40FF` on ink)
Everything blue is *alive or actionable* — pulses, working nodes, triggers,
gates, links. The discipline is the brand.

## Type
- **Zodiak** (Fontshare) — display serif, 800/900 + italic 701; headline at
  clamp(46→148px), tight leading. Blue italic for the living words.
- **General Sans** (Fontshare) — body/UI.
- **IBM Plex Mono** (Google) — all data: ledger rows, node labels, figures,
  receipt, ticker.

## Motion concept (GSAP + ScrollTrigger + MotionPathPlugin)
Precise, diagrammatic, event-driven — no atmosphere:
- Hero: a scripted company day. Each ledger event fires the matching chart
  action — COO wake ring, blue "working" stroke on nodes, ticket-rects riding
  delegation paths down, report-dots riding back up, escalation to YOU. The
  Fig.-1 clock is derived from ledger timestamps.
- Org chart has **two hand-built layouts** (horizontal 860×470 desktop,
  vertical spine 420×720 mobile) — rebuilt on resize, never scaled-down text.
- Chapter vignettes: register-of-hires rubber-stamp loop; todo tickets flowing
  backlog→doing→done; workflow run advancing with an approval-gate pause;
  trigger zaps with comet trails. MCP band: radial "hands" diagram with pulses.
- Receipt numbers count up on scroll; seal ring text rotates 36s/turn.
- `prefers-reduced-motion` honored everywhere (static distributions instead).

## Libraries
GSAP 3.12.7 (core, ScrollTrigger, MotionPathPlugin) via jsdelivr; fonts via
Fontshare + Google Fonts CDN. No build step — single self-contained HTML.

## Iteration log
1. **v1** structure + palette + type; org chart too timid, viz boxes sparse.
2. **v2** org chart enlarged + responsive mobile layout, working-node states,
   ticket pulses, synced clock, TOC, single-line hire equation.
3. **v3** register-of-hires stamp table, MCP radial diagram, hero ink seal,
   receipt count-up + tilt, barcode.
4. **v4/final** seal repositioned as a document stamp (fold reclaimed), ledger
   pre-filled with history so it reads established at first paint.

## Would refine with more time
- A scripted "second act" for the hero loop (blocked todo → manager steps in)
  so long dwellers see a story arc, plus hover states on org nodes (persona
  card popovers).
- Draw-on animation for section rules + headline reveal on load (SplitText-
  style, but respecting the print stillness).
- A compact sticky masthead that appears after the hero with a live mini-ledger
  line, echoing a newspaper running head.

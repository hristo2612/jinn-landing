# Round 2 Addendum — Ledger-native constraint (READ AFTER BRIEF.md)

The operator's direction for round 2: the landing page must feel like the
**Jinn web app itself** — the Apple HIG / Anthropic Claude design language.
Landing → app must be one continuous brand. Do NOT stray from the Ledger
design system.

## Hard constraints (these override round 1's "not bound by app rules" note)

- **The `jinn-design` skill DOES apply here.** Load it and obey its Do/Don't.
- **Tokens are law.** Read the real system: `~/Projects/jinn/packages/web/src/routes/globals.css`.
  Use its colors (bg/material/fill/text/accent), radii, shadows, spacing, and
  easing. If you need a value that doesn't exist, derive it from the system
  (e.g. a larger display size on the same scale), don't import a foreign one.
- **Type:** Hanken Grotesk (UI + display) and IBM Plex Mono (code/data) ONLY.
  No external display serifs this round. Craft comes from scale, weight,
  optical spacing, and rhythm — the Apple way.
- **Accent:** the amber (`#E0A33C` dark / `#926516` light) and its washes.
  One accent, rationed. System colors only for status semantics.
- **No hairline borders at rest.** Separation = soft fills + shadow + whitespace.
- **Materials + depth:** use the frosted materials and the shadow scale for
  elevation, exactly like the app.
- **Motion:** crisp, transform/opacity or DPR-scaled canvas, spring/smooth
  easings from the tokens. Calm, never busy. `prefers-reduced-motion` respected.
- **Both themes are welcome but not required** — pick the theme that serves
  your concept best (the app defaults dark; light is equally first-class).
  Whichever you pick, use that theme's real token values.
- Mobile 390 first-class, as always.

## What "unique" means inside the constraint

Each variant differentiates by CONCEPT and COMPOSITION, not by palette/type
safari. Think: how does an Apple product page differ from another Apple
product page? Structure, choreography, and what's being showcased — never a
different design language.

## Product-real UI is encouraged

Faithful recreations of actual app surfaces (composer card, chat thread,
sessions sidebar, org chart, todo ledger) as marketing artifacts are strongly
encouraged — Apple shows the real UI. Recreate them WITH the tokens so they're
pixel-plausible. The real app is at `~/Projects/jinn/packages/web/src/` if you
need to check how a surface actually looks.

Everything else in BRIEF.md (deliverable paths, ≥3 iteration passes,
screenshot recipes, public-safe content) still applies. Round 2 slugs get a
`l2-` prefix.

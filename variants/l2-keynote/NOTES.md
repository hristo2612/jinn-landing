# l2-keynote — "The Apple keynote page"

## Design intent

An Apple-launch-page scroll story, skinned entirely in the **light Ledger
theme** (warm paper `#F4F1E8` + ochre `#926516`) to differentiate from round
1's all-dark field — Apple pages breathe in light. Each pinned viewport beat
resolves ONE product truth in enormous Hanken Grotesk, paired with one small,
token-true vignette built from real app primitives:

1. **Hero** — "Run your own AI company." + a faithful composer card that types
   real prompts on a loop. The app's own front door as the hero object.
2. **Hire employees.** — three employee cards (initial avatar, role, engine
   chip in IBM Plex Mono) + a ghost "Hire · any role · any engine" slot.
3. **They share a ledger.** — a todo card where the first row *completes on
   scroll*: checkbox fills green, check draws, title strikes, chip swaps
   In progress → Done.
4. **Teach it once.** — a workflow rail (research → draft → review); the amber
   fill advances and lights each node as you scroll.
5. **It runs while you sleep.** — the one theatrical move: the beat inverts to
   the **dark Ledger tokens** (night), with a mono cron/event feed and a
   pulsing amber dot. Landing→app brand continuity in both themes, on one page.
6. **You approve what matters.** — an approval card from "Jimbo · COO" with
   Hold / Approve buttons (the COO gate, the product's trust story).
7. **Ready when you are.** — the install command as the final beat, with a
   simulated `jinn start` boot readout, then a quiet footer.

A recurring motif rations the accent: every beat headline ends in an **amber
period** — the ledger dot. It is the only accent ink on most screens.

## Tokens & type

All colors, radii, shadows, easings are copied verbatim from
`packages/web/src/routes/globals.css` (light block on `:root`, dark block
scoped to `.night`). No hairline borders anywhere at rest — separation is
`--bg-secondary` fills + `--shadow-card` + whitespace. Nav pills use the app's
real `--pill-bg`/`--pill-border` frosted treatment. Type is Hanken Grotesk
(display scale derived from the HIG scale: clamp 46→116px, wght 700,
-0.033em) and IBM Plex Mono for anything machine-flavored.

## Motion

Lenis smooth scroll + GSAP ScrollTrigger scrub. Each 220vh beat pins a 100vh
stage; words rise per-word, the vignette settles, its micro-story plays, and
the final ~30% of the pin is a deliberate dwell on the resolved state (the
Apple hold). Transform/opacity only; `prefers-reduced-motion` renders the
whole page static (gsap.from = final states without JS/motion).

## Libraries

GSAP 3.12 + ScrollTrigger (cdnjs), Lenis 1.1 (unpkg), Google Fonts
(Hanken Grotesk variable, IBM Plex Mono).

## Iteration log

- **v1** — full structure. Found: screenshot rig overshot the sticky pins; the
  amber period wasn't in the word-reveal (floated alone as a stray square);
  todo strike spanned the whole row.
- **v2** — fixed the above. Found: the night beat's headline inherited the
  *light* computed color from `body` (var re-scoping doesn't re-evaluate
  inherited `color`) — charcoal on charcoal; chip swap caught mid-crossfade;
  mobile todo titles wrapped and broke the strike; feed lines wrapped with no
  hanging indent; rail endpoints misaligned with node centers.
- **v3** — fixed all of the above (`color: var(--text-primary)` on `.stage`,
  earlier resolution timings, nowrap+ellipsis titles, flex feed rows, rail
  margins to node centers, node lighting via tweens not class toggles).
  Found: timelines resolved too late in the pin (no dwell); ghost hire card
  wrapped to its own row.
- **v4 (final)** — 45% end-of-timeline dwell on every beat, employees vignette
  widened to fit 4 across, mobile badge separators hidden at wrap.

## With more time

- A scroll-linked crossfade INTO the night beat (bg color tween on entry)
  instead of the hard panel edge while scrolling between beats.
- The approval card could "get approved" at the end of its dwell (button press
  + state change) for one more storytelling payoff.
- A real org-chart vignette (the app's react-flow surface) as an extra beat.
- OG meta / favicon polish for share cards.

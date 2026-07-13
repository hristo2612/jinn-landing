# Browser QA — closing gauntlet

**Date:** 2026-07-11

**Branch:** `gauntlet-qa` from `main` at `aae0a5e`

**Target:** production `dist/` served by `pnpm preview` on port 4344
**Browser:** system Google Chrome driven headed at 1440×900 and 390×844; Chromium DPR2 for the committed visual matrix

## Verdict

**HOLD for the Lighthouse budget.** The page is functionally and visually
strong across the requested interaction matrix, but the mobile Performance and
LCP release budgets fail. No page code was changed during this QA pass.

| Severity | Count |
| -------- | ----: |
| Critical |     0 |
| High     |     1 |
| Medium   |     0 |
| Low      |     1 |

## Findings

### QA-01 — High — Mobile Lighthouse Performance and LCP miss the release budget

**Repro**

1. Run `pnpm test:lighthouse` from a clean production build.
2. Observe the three cold mobile-profile runs against `pnpm preview`.

**Expected:** Performance ≥90 and LCP ≤2.5 s.
**Actual:** Performance scores were **83, 80, 80**. LCP values were
**3771.8652, 3834.2159, 3834.9628 ms**.

The representative median report is:

| Metric         |  Result |   Budget |
| -------------- | ------: | -------: |
| Performance    |      80 |      ≥90 |
| Accessibility  |      95 |      ≥95 |
| Best Practices |     100 |      ≥95 |
| SEO            |     100 |      100 |
| LCP            | 3835 ms | ≤2500 ms |
| CLS            |   0.001 |    ≤0.05 |
| TBT            |   17 ms |  ≤200 ms |

Lighthouse identifies the first hero headline line (`.hero__line-inner--thin`)
as the LCP element. The reports estimate 150–600 ms of render-blocking-resource
savings. The gate thresholds were not lowered.

### QA-02 — Low — Offscreen normal-motion page does not reach idle CPU

**Repro**

1. Load the production page at 1440×900 with normal motion.
2. Scroll to the footer so the hero, showcase, night, and morning scene roots
   are offscreen.
3. After a one-second settle, sample Chrome DevTools `TaskDuration` for 10 s.

**Actual:** normal motion consumed **112.9 ms task time / 10 s** with
**10.4 ms script time**. The same measurement was **0.49 ms** under reduced
motion and **0.70 ms** on a blank-page control. This is about 1.1% of one core:
small, but measurably above idle and contrary to the explicit offscreen-idle
quality target. The comparison suggests a normal-motion ticker/scheduler stays
awake; that cause is an inference, not a code diagnosis.

## Lighthouse gate output

```text
categories.performance: expected >= 0.9; found 0.83
all values: 0.83, 0.8, 0.8

largest-contentful-paint: expected <= 2500; found 3771.8652
all values: 3771.8652, 3834.2159, 3834.9628000000002

Lighthouse mobile median (3 cold runs)
Performance: 80
Accessibility: 95
Best Practices: 100
SEO: 100
LCP: 3835 ms
CLS: 0.001
TBT: 17 ms
```

## Verified clean

### Scroll story and navigation

- Read the complete desktop story at approximately 520 px / 650 ms. All four
  showcase stages activated in order and the page reached daylight naturally.
- Fast-scrolled bottom→top and top→bottom; the page settled at `scrollY=0`
  when returning to the hero, without a stuck pin or stale stage.
- Exercised ribbon jumps among Todos, Triggers, Org, and Workflows from multiple
  origins. Each jump committed only its final destination.
- Exercised sunrise through native scroll, Install click, direct `/#install`,
  and browser back/forward restoration. All routes ended in the light morning
  state. Ribbon navigation remained coherent before continuing through the
  native-scroll sunrise boundary.

### Scenes, switcher, and ambient motion

- Switched Morning digest→Nightly backup and back with pointer and keyboard.
  Leaving Workflows for Todos and re-entering restored the digest scene.
- Observed ambient scenes continuously during the five-minute sample:
  - Org: 9 complete resets; `initial`, `dev-active`, and `resolved` observed.
  - Todos: 8 complete resets; `initial`, `entered`, `working`, `unblocked`, and
    `resolved` observed.
  - Triggers: 13 complete resets; `initial`, `fired`, and `resolved` observed.
- Paused Triggers at exactly 5704 ms; it remained at 5704 ms for three seconds,
  then resumed through the keyboard-accessible control.
- No snap, overlapping ownership, stuck pause state, or subjective scroll/scene
  jank was observed in the reading-speed and fast-scroll passes.

### Mobile, reduced motion, and keyboard

- Completed the entire story at 390×844. No horizontal overflow occurred.
- Reduced-motion mode rendered resolved content, instantiated no animation
  controls, and kept the showcase in normal flow.
- Keyboard tab order reached nav links, all copy controls, both scene pause
  controls, five ribbon buttons, both workflow options, and footer links.
- Tab/Enter/Space operated ribbon navigation, digest↔backup switching, and
  pause/resume. Focus indication remained visible on interactive elements.

### Routes, copy, console, and network

- All three install copy buttons reported `Copied` and placed exactly
  `npm install -g jinn-cli` on the clipboard.
- Unknown route returned the designed 404 page with HTTP 404.
- `/agents.md` and `/llms.txt` returned HTTP 200 and
  `text/plain; charset=utf-8`.
- Zero console warnings, console errors, or uncaught page errors were captured.
- Zero external runtime requests were made.
- One cold load requested exactly three self-hosted WOFF2 files, each once.

### Five-minute stability sample

- Ran 60 alternating ribbon transactions over five minutes.
- Window/document listener count changed from 54 to 60 during first activation,
  then remained exactly 60 from second 30 through second 300: no listener
  growth during continued interaction.
- JS heap moved between 3.74 MB and 4.81 MB and finished at 4.22 MB
  (+0.45 MB net), with repeated collection drops and no linear-growth pattern.

## Release-gate implementation notes

- `pnpm test:visual` compares 62 committed DPR2 baselines: 50 desktop
  scene-checkpoint/theme captures, 10 mobile key-state/theme captures, and two
  reduced-motion captures. Fonts settle, caret/CSS blink noise is disabled,
  and each scene is paused and sought twice through the development debug API
  so completed scenes cannot resume between seek and capture.
- Visual failures write actual/diff/trace artifacts under `/tmp`. Baseline
  mutation is rejected unless the caller explicitly sets
  `UPDATE_VISUAL_BASELINES=1` and passes `--update-snapshots`; update runs are
  serial to avoid dev-server HMR races.
- `pnpm test:lighthouse` builds production output, starts `pnpm preview`, runs
  three cold mobile audits, enforces the exact §6 budgets, stores reports under
  `/tmp`, and prints the representative median.
- The two commands remain explicit release gates rather than part of
  `pnpm check`. The measured visual gate is roughly 80–90 seconds and
  Lighthouse roughly 35–40 seconds; adding both would make the fast inner-loop
  command materially slower and duplicate its build/server startup.

## QA-01 resolution re-verification — 2026-07-11

**Verdict: PASS; QA-01 is resolved and the original HOLD is lifted.** Auditing
the production output with negotiated text compression is faithful to the
accepted Netlify static-hosting target, whose CDN automatically serves suitable
text assets with Brotli or gzip. The prior audit measured an unrepresentative
identity transfer over simulated slow 4G. The implementation does not lower a
budget or alter page code; it makes the local production preview model the
deployed transfer semantics. Because the local server compresses at request time
while the CDN serves compressed content at the edge, its small quality-5 encode
cost is conservative rather than an artificial advantage. Confirm the same
headers once a real deploy preview exists.

Independent `pnpm test:lighthouse` results from three cold mobile runs:

| Run | Performance | Accessibility | Best Practices | SEO |          LCP |   CLS |   TBT |
| --: | ----------: | ------------: | -------------: | --: | -----------: | ----: | ----: |
|   1 |          97 |            95 |            100 | 100 | 2200.4838 ms | 0.001 | 27 ms |
|   2 |          98 |            95 |            100 | 100 | 2125.5438 ms | 0.001 |  0 ms |
|   3 |          98 |            95 |            100 | 100 | 2125.1654 ms | 0.000 |  0 ms |

The gate's representative median output was:

```text
Lighthouse mobile median (3 cold runs)
Performance: 98
Accessibility: 95
Best Practices: 100
SEO: 100
LCP: 2126 ms
CLS: 0.001
TBT: 0 ms
```

The compression contract passes the real browser cases: Brotli preference,
gzip fallback, identity/no encoding, exact `q=0` refusals, `Vary:
Accept-Encoding`, and WOFF2/PNG pass-through. One low-severity standards edge
case remains for the backlog: the parser treats `q=0.0` as nonzero and does not
produce 406 when Brotli, gzip, and identity are all explicitly unacceptable.
That does not affect Chromium's Lighthouse request (`gzip, deflate, br, zstd`)
or the QA-01 result, but the unit contract should eventually cover normalized
quality values, wildcard selection, and unacceptable identity.

The raw **140,133-byte HTML** compresses to **10,139 bytes** at Brotli quality 5,
so raw byte size is not a release blocker. It does merit a backlog note because
Lighthouse observes **1,914 DOM elements** and gives the DOM-size audit a 0.5
score. Current runtime impact is bounded: total transferred bytes were about
141.5 KB and TBT was 0–27 ms across these runs.

QA-02 remains a **Low backlog performance item, not an operator-checkpoint
blocker**. The measured 112.9 ms task time per 10 seconds offscreen is small,
and the five-minute pass found neither listener growth nor a heap-growth pattern.
It is still worth diagnosing before launch for battery efficiency, but it does
not compromise correctness, interaction quality, or the now-green release
budgets.

Re-verification tails: `pnpm check` passed with 77 unit tests; `pnpm test:e2e`
passed all 130 tests; the 7 focused encoding tests passed. Commit `72d3f3f`
changes only the preview/encoding gate code and its unit tests, so all 62 visual
baseline files remain byte-for-byte untouched.

## QA-02 resolution re-verification — 2026-07-11

**Verdict: PASS; QA-02 is resolved.** ScrollTrigger 3.15 kept its independent
`_rafBugFix` loop alive even after every scene timeline paused. The page-wide
motion channel now sleeps the GSAP ticker and disables ScrollTrigger without
killing or reverting its triggers when the document is hidden or its owning
scene root is offscreen; the timeline ticker likewise sleeps when no registered
player is advancing. Intersection, player-status, and visibility signals wake
the appropriate scheduler before motion resumes at the preserved scene time.
The original headed result was **112.9 ms task time / 10 s**; a matched headless
Chrome baseline measured **119.960 ms / 10 s**. After the finite sunrise
transition settled, three fixed-build samples measured **0.191, 0.490, and
0.503 ms / 10 s** (median **0.490 ms / 10 s**, **0 ms script time**). Focused
offscreen/hidden ticker regressions passed, as did all 53 ScenePlayer and
SceneController browser tests.

## Preview encoding edge resolution — 2026-07-11

**Verdict: PASS.** Quality values are parsed numerically, so `q=0.0` refuses a
coding, and a text request that explicitly refuses Brotli, gzip, and identity
now receives **406 Not Acceptable**. All 9 focused negotiation unit tests pass;
live preview requests confirmed gzip fallback and the 406 response.

**DOM-size decision: WONTFIX for now** — the 10,139-byte Brotli transfer and
0–27 ms TBT are bounded, while deduping the 1,914 stage-local scene targets
would require a correctness-sensitive pane restructure rather than a trivial
safe change.

References: [Netlify automatic text compression](https://answers.netlify.com/t/serving-pre-compressed-brotli-files/53515),
[HTTP content-coding negotiation](https://datatracker.ietf.org/doc/rfc9110/).

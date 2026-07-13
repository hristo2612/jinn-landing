# A-08–A-11 Showcase Review Remediation Plan

**Goal:** Close findings 1–8 in the pinned-showcase review with reducer/DOM equality, retained skip-safe activation, mobile-safe surfaces, canonical per-root markup, explicit motion-channel lifecycle coverage, faithful nested staggers, reproducible evidence, and transform-only rail motion.

**Constraints:** Preserve the approved scene-system API where possible; isolate any machinery change; write each regression test first and observe the intended failure; do not touch the preview worktree or port 4321; exclude pre-existing `variants/*/shoot.mjs` files; leak-grep every staged commit.

## Task 1 — Semantic progress and transform rail (findings 1, 8)

- Add browser assertions for initial, mid-beat, resolved, reverse-seek, and teardown equality between `data-progress`, the visual transform value, and the reducer.
- Make the progress beat commit `data-progress` at the same ordered commit instant used by the reducer while animating only a compositor transform.
- Run the focused player/showcase tests RED then GREEN.

## Task 2 — Retained and skipped scene truth (finding 2)

- Add adversarial forward, reverse, seek-past-end, fast-skip, and later-entry DOM assertions.
- Change Todos, Workflow, and Triggers to retained `play` entry behavior; keep Employees `restart-on-enter`.
- On activation, materialize a recorded force-resolved scene at its resolved time without replaying intermediate beats.
- Run focused unit/controller/showcase tests RED then GREEN.

## Task 3 — Canonical surface contract and mobile Org (findings 3, 4)

- Extend pane data to carry authored initial and resolved semantic strings.
- Render all reusable surface state from canonical data; remove narrative literals from surface chrome.
- Serialize exact semantic DOM for the desktop root and each mobile root, including exact counts and targets.
- Add 390×844 inner-node overflow assertions and fix Org flex shrink.

## Task 4 — Motion ownership lifecycle matrix (finding 5)

- Add direct unit tests for LIFO restoration, inactive release, composed pause reasons, and bounded rapid churn.
- Add browser lifecycle cases for breakpoint rebuild, overlapping mobile visibility, and pagehide cleanup.
- Change production ownership code only if a new RED test exposes a real defect; isolate and document any such change.

## Task 5 — Storyboard nested staggers (finding 6)

- Add exact beat-fidelity assertions for Platform 80ms, Growth 60ms, and Workflow 90ms child offsets.
- Author individual child/card entrance beats using existing declarative targets/actions.
- Verify resolved and reduced-motion truth remain unchanged.

## Task 6 — Reproducible visual and bundle evidence (finding 7)

- Make screenshot capture use real desktop motion/checkpoint seeking for 1440px and stacked reduced/static truth only where labeled.
- Add a deterministic eager-JS measurement script/manifest and refresh the report from its output.
- Capture the required checkpoint screenshots without touching port 4321.

## Task 7 — Final gates and delivery

- Commit logical fixes with staged leak-grep before each commit.
- Run `pnpm check` and `pnpm test:e2e` twice; preserve verbatim tails.
- Report commits and every finding status to the reviewing session, including justified residuals and next-batch implications.

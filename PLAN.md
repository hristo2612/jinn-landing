# jinn.run — Master Product Plan

The public website of the Jinn platform: **landing page, features, docs.**
Orchestrated by Jimbo (COO). Every phase runs **Plan → Implement → Verify**
with back-and-forth until the bar is met. Sequential, one phase at a time.
Nothing half-baked.

## Locked decisions

- **Design base:** `l2-product-real` ("the app navigates itself") — one
  persistent, pixel-plausible dashboard window whose panes swap through the
  four primitives on scroll.
- **Grafts:** `l2-keynote`'s theme-inversion beat ("It runs while you sleep."
  → page inverts to dark/light Ledger tokens) + `l2-quiet-ember`'s hero type
  treatment (Hanken Grotesk thin/bold weight contrast).
- **The differentiator (operator directive):** the mock windows are NOT
  static screenshots — they are **live, animated, scripted interactions**
  ("look what you can do with Jinn"): typing, delegation chips appearing,
  todos completing, workflow runs advancing through approval gates, triggers
  firing. Motion inside the windows is the show.
- **Design language:** Ledger-native (real tokens from the app), Apple HIG /
  Claude calm. Hanken Grotesk + IBM Plex Mono. Rationed amber. No hairlines.
- **Reference material:** `BRIEF.md`, `BRIEF-LEDGER.md`, `variants/` (6
  explorations; round-2 `l2-*` are token-true).

## Team & model doctrine

| Role                                           | Employee      | Engine/Model      | Notes                                                                            |
| ---------------------------------------------- | ------------- | ----------------- | -------------------------------------------------------------------------------- |
| Creative direction, storyboards, taste reviews | jinn-designer | Fable 5 (high)    | The ideas guy; drives vision                                                     |
| ALL design + UI implementation                 | jinn-designer | Fable 5 (high)    | Operator rule 2026-07-10: every design/UI task runs on Fable — not Opus, not GPT |
| Technical planning, non-UI code, tests         | jinn-dev      | GPT-5.6-sol high  | Pragmatic workhorse                                                              |
| Deep code review, thorough passes              | jinn-dev      | GPT-5.6-sol xhigh | Most thorough                                                                    |
| QA (browser manual + automated)                | jinn-dev      | GPT-5.6-sol high  | Opens real browser, navigates, verifies                                          |

- Multiple concurrent child sessions per employee are fine, but **phases run
  sequentially** — no parallel phase-tackling.
- Separate roles per session: implementer ≠ reviewer ≠ QA. Fresh sessions for
  QA/refinement passes.
- Context hygiene: Opus/Fable sessions degrade past ~450–500k tokens →
  `/compact` or rotate to a fresh child session before that.
- Everything flows through Jimbo: review → filter → next instruction.

## Phase 0 — Foundation ✅ (2026-07-10)

- [ ] Technical plan: stack decision (recommendation: Astro + GSAP, pnpm,
      TypeScript; docs via Astro content collections or Starlight — planner
      to confirm), repo structure, build pipeline
- [ ] Architecture for the **scripted-window system**: one reusable "window
      player" component/pattern that runs timed interaction scenes (chat
      typing, chips, todo state changes, workflow rails, trigger pulses),
      pausable, scroll-aware, reduced-motion safe
- [ ] Port Ledger tokens (from app `globals.css`) into the site's shared CSS
- [ ] Dev/build/preview scripts + screenshot/QA tooling
- [ ] Deploy target proposal (Netlify / Cloudflare Pages / Vercel) — goes
      live ONLY with operator approval + DNS for jinn.run

## Phase A — Landing page (the showpiece) ✅ (2026-07-11 — Lighthouse 98/95/100/100, LCP 2126ms; taste-passed; 130 e2e)

- [ ] A1 Plan: Fable storyboard — section-by-section script of the page and
      of every animated window scene (what happens, in what order, what it
      proves about Jinn)
- [ ] A2 Implement: scaffold + hero (quiet-ember type treatment) + staged
      dashboard + scene system wired to scroll; theme-inversion beat;
      install/GitHub CTAs; footer
- [ ] A3 Verify loop (repeat until bar met):
  - Fable design review (taste pass, motion quality)
  - GPT-5.6 xhigh code review (perf, correctness, a11y)
  - GPT-5.6 high browser QA: manual navigation, scroll choreography,
    mobile 390, reduced-motion, Lighthouse/perf budget
- [ ] Operator checkpoint: screenshots + local preview to the operator

## Phase B — Features page ✅ (2026-07-11)

- [x] B1 Plan: feature inventory from the real product (employees, todos,
      workflows, triggers, MCP, engines, connectors, web dashboard, cron,
      approvals…), grouped into a narrative; per-feature vignette scripts
      reusing the window-player system
- [x] B2 Implement: features page(s) with animated vignettes
- [x] B3 Verify loop (same 3-role pattern) + operator checkpoint

## Phase C — Docs ✅ (2026-07-12 — 59/59 source contracts; Ledger skin design/code/QA SHIP)

- [x] C1 Plan: docs IA — Getting Started, Install, Core Concepts (the four
      blocks + MCP), Guides, Gateway API reference, CLI reference, FAQ;
      sidebar/nav/search; versioning approach tied to releases
- [x] C2 Implement: docs framework + seed content from the repo's real
      README/docs (accuracy > volume; no invented features)
- [x] C3 The agent-readable page: `/agents.md` (+ `/llms.txt` convention)
      served at jinn.run — a machine-readable guide for AI agents on how to
      talk to a Jinn gateway (endpoints, auth, session protocol)
- [x] C4 Verify loop: technical accuracy review against the actual codebase + browser QA + operator checkpoint

## Phase D — Automation & reusable skills ✅ (2026-07-11)

- [x] D1 Extend the `release` skill: every jinn-cli release updates the docs
      site (changelog page, version bumps, new-feature doc stubs) —
      docs-update becomes a standing release step
- [x] D2 New `~/.jinn/skills/jinn-website` skill: how to work on the site
      (structure, tokens, scene system, build, QA recipe, deploy) so any
      future session can maintain it
- [x] D3 Dry-run both skills to verify they work end-to-end

## Phase E — Ship ⬜

- [x] Full-site QA sweep: links, SEO meta, OG images, favicon, 404, sitemap,
      robots.txt, analytics decision
- [x] Performance + accessibility final pass (budgets met on mobile)
- [ ] **Release gate (policy 2026-07-11):** site deploy requires a jinn-cli
      release containing the documented four-block surface. Reviewer-verified
      gap list vs 0.25.0 (what the release must ship): native Todos ledger;
      Workflow runs/steps/gates; Todo-status + webhook triggers; durable
      approvals; built-in company MCP tools; the combined overnight
      four-block state machine. Flip the runtime-contract gate to npm-latest
      mode and verify green before deploy.
- [ ] Operator approval → deploy → jinn.run DNS cutover
- [ ] Post-ship verification on the live domain
- [ ] Close the loop: update memories/skills with what we learned

## Standing rules

1. One phase at a time; inside a phase, Plan → Implement → Verify.
2. Implementer, reviewer, and QA are always **different sessions**.
3. Max rounds per loop before escalating to the operator: 8 (medium effort default).
4. All public-facing content is generic (privacy firewall) and
   product-truthful (no invented features).
5. Deploys/DNS/money/public-visibility decisions → the operator. Everything else →
   Jimbo decides.
6. **Operator preview:** a persistent dev server runs at
   `http://127.0.0.1:4321` from the git worktree
   `~/Projects/.worktrees/jinn-landing-preview` (branch `preview`, pinned to
   reviewed main). After EVERY merge to main, Jimbo fast-forwards it:
   `git -C ~/Projects/.worktrees/jinn-landing-preview merge --ff-only main`
   (the dev server hot-reloads automatically); if the merge changed
   `package.json`/lockfile, ALSO run `pnpm install` in the worktree and
   restart the dev server, or imports of new deps fail (bitten once: gsap).
   Implementer sessions never
   touch this worktree or port. Also exposed tailnet-only via
   `tailscale serve --bg --https=4321 http://127.0.0.1:4321` at
   `https://<host>.ts.net:4321` for the operator. Astro 7 owns the background
   daemon; plain `pkill` is not the lifecycle control. From the protected
   worktree, use:

   ```sh
   cd ~/Projects/.worktrees/jinn-landing-preview
   pnpm exec astro dev stop
   pnpm exec astro dev --background --host 127.0.0.1 --port 4321 --allowed-hosts <tailnet-host>
   pnpm exec astro dev status
   pnpm exec astro dev logs
   pnpm exec astro dev stop
   ```

   The final `stop` is the explicit shutdown command, not part of an ordinary
   restart after the status/log verification.

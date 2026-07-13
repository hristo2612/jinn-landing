# jinn.run Technical Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task by task. Keep implementation, review, and browser QA in separate sessions as required by `PLAN.md`.

**Goal:** Build a static-first public site for Jinn with a cinematic landing page, a feature catalogue, maintainable Markdown documentation, and reusable scripted product scenes.

**Architecture:** Astro renders all meaningful content to static HTML. Starlight owns the documentation shell and Pagefind search, while small framework-free TypeScript modules progressively enhance the landing page with GSAP timelines. The site checks in a generated copy of the public Ledger token contract so production builds never depend on another repository.

**Tech stack:** Astro, Starlight, Markdown/MDX, TypeScript, GSAP with ScrollTrigger and TextPlugin, Ledger CSS tokens, pnpm, Vitest, Playwright, axe-core, Lighthouse CI, and Linkinator.

## Global constraints

- Static output only. No server runtime, database, CMS, authentication, or edge function in Phases A–C.
- Use pnpm and TypeScript for logic. Pin Node and pnpm in repository metadata; match the Jinn monorepo's supported toolchain when scaffolding.
- Render content and scene end states as HTML at build time. JavaScript enhances the page; it must not be required to understand it.
- Use Hanken Grotesk and IBM Plex Mono only, self-hosted as WOFF2 assets. Do not depend on Google Fonts at runtime.
- Ledger tokens are the visual source of truth. Marketing-only additions must be derived aliases in a separate file, never edits to generated Ledger tokens.
- No hairline borders on cards, buttons, chips, or product windows at rest. Use Ledger fills and shadows; reserve `--separator` for genuine dense-document structure and accessible focus treatment.
- Use native scrolling. Do not add Lenis or another smooth-scroll layer unless browser QA demonstrates a problem that GSAP cannot solve.
- Keep animations on `transform`, `opacity`, and narrowly justified `filter` changes. Do not animate layout in a scroll hot path.
- Mobile 390px, light theme, dark theme, and `prefers-reduced-motion` are first-class acceptance states.
- Public content and fixtures must remain generic and privacy-safe. Never commit personal names, client/project names, credentials, real Slack IDs, emails, or absolute user paths.
- `variants/` remains a read-only design reference. Production code must not import from it.
- Initial deploy, public domain attachment, DNS, paid services, and analytics require operator approval. This document proposes them only.

---

## 1. Stack decision

### Recommendation: Astro + Starlight + GSAP

Use one Astro project for the marketing site and documentation:

- Custom Astro pages at `/` and `/features/` provide total layout and animation control without requiring React hydration.
- Starlight provides the docs layout, sidebar, table of contents, accessible components, dark mode, SEO, and static Pagefind search. Documentation stays in ordinary `.md` files by default, with `.mdx` reserved for the few pages that need a component.
- Astro content collections validate frontmatter and make release metadata available to both docs and machine-readable routes.
- GSAP is imported from npm and used only on marketing routes. ScrollTrigger owns pinning/activation; TextPlugin owns typing. CSS owns simple interactive transitions and surface state styling.
- Astro emits a static `dist/` directory. No deployment adapter is required for the selected host.

This division keeps the landing page bespoke and the docs boring. It also avoids loading Starlight or Pagefind assets on the landing page and avoids loading GSAP on docs pages.

### Honest comparison

| Option                | What it does well                                                                                                                                         | Cost for this site                                                                                                                                                                                                                        | Decision   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Astro + Starlight     | Static HTML by default; framework-free client scripts; typed Markdown/MDX collections; docs nav/search/SEO already solved; custom pages coexist with docs | Requires a small Ledger theme layer for Starlight; the `src/content/docs/docs/` nesting is visually repetitive because the inner folder supplies the `/docs/` URL prefix                                                                  | **Choose** |
| Next.js static export | Familiar to the dashboard team; strong React ecosystem; animation libraries work well in client components                                                | React/App Router is unnecessary for mostly static pages; client boundaries and hydration add weight; docs still need another framework such as Fumadocs/Nextra; static-export constraints add concepts without buying a server capability | Reject     |
| Vite + vanilla        | Maximum control and the smallest conceptual core for the landing animation                                                                                | Routing, MDX, docs navigation, search, heading anchors, sitemap, and content validation would become custom infrastructure or a second docs stack                                                                                         | Reject     |

### Library policy

Use these libraries instead of rebuilding their jobs:

- Starlight for docs layout and Pagefind integration.
- GSAP core, ScrollTrigger, and TextPlugin for the scripted scene timelines.
- Fontsource packages for self-hosted Hanken Grotesk and IBM Plex Mono files.
- Lucide's Astro package for interface icons; use the same icon vocabulary as the real dashboard.
- Astro's content schema utilities for frontmatter validation.
- Playwright, axe-core, Lighthouse CI, and Linkinator for QA.

Do not add a UI framework, global state library, canvas renderer, smooth-scroll library, CMS, Algolia, Storybook, or animation abstraction package in Phase A. Add one only after a concrete requirement survives review.

### Decision evidence

- Astro documents build-time content collections as the appropriate default for static documentation and typed Markdown/MDX content: [Astro content collections](https://docs.astro.build/en/guides/content-collections/).
- Starlight supports custom Astro pages alongside its Markdown/MDX docs and includes Pagefind search without configuration: [Starlight pages](https://starlight.astro.build/guides/pages/) and [Starlight search](https://starlight.astro.build/guides/site-search/).
- ScrollTrigger already supports pinning, activation, pause/resume, scrubbing, responsive setup, and resize recalculation: [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

---

## 2. Repository structure

The target layout is intentionally one application, not a monorepo:

```text
jinn-landing/
├── PLAN.md, BRIEF.md, BRIEF-LEDGER.md
├── variants/                         # Design evidence; never imported
├── docs/
│   └── TECH-PLAN.md
├── public/
│   ├── fonts/                        # Self-hosted WOFF2 files
│   ├── icons/                        # Favicons and pinned-tab assets
│   └── social/                       # OG images generated/approved later
├── scripts/
│   ├── sync-ledger-tokens.ts         # Curated cross-repo token sync
│   ├── sync-release-docs.ts          # Idempotent release metadata/changelog sync
│   └── check-public-safety.ts        # Generic-content/leak guard
├── src/
│   ├── components/
│   │   ├── chrome/                   # Nav, footer, install command
│   │   ├── marketing/                # Hero and below-fold sections
│   │   └── scenes/
│   │       ├── SceneWindow.astro
│   │       └── surfaces/             # Dashboard, chat, org, todo, workflow, trigger
│   ├── content/
│   │   ├── docs/docs/                # Starlight collection; emits /docs/**
│   │   └── machine/                  # Source text for /agents.md and /llms.txt
│   ├── data/
│   │   └── release.json              # Current documented jinn-cli release
│   ├── layouts/
│   │   └── MarketingLayout.astro
│   ├── lib/
│   │   └── scenes/                   # Types, state reducer, player, controller
│   ├── pages/
│   │   ├── index.astro
│   │   ├── features.astro
│   │   ├── agents.md.ts
│   │   ├── llms.txt.ts
│   │   └── 404.astro
│   ├── scenes/landing/               # Declarative *.scene.ts definitions
│   ├── styles/
│   │   ├── generated/ledger-tokens.css
│   │   ├── site-tokens.css
│   │   ├── global.css
│   │   └── starlight.css
│   └── content.config.ts
├── tests/
│   ├── unit/scenes/
│   ├── e2e/
│   └── visual/
├── astro.config.mjs
├── eslint.config.js
├── netlify.toml
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vitest.config.ts
```

Responsibilities and boundaries:

- `components/scenes/surfaces/` renders pixel-plausible dashboard HTML. It knows visual states such as `executing`, `done`, and `waiting-for-approval`, but not timing.
- `scenes/landing/*.scene.ts` describes what changes and when. It contains no DOM queries or GSAP calls.
- `lib/scenes/` is the only place that understands playback, scrolling, visibility, and GSAP.
- `styles/generated/ledger-tokens.css` is generated and never hand-edited.
- `styles/site-tokens.css` contains marketing-scale aliases such as display type and section spacing. It may reference Ledger variables but may not redefine them.
- Most docs are Markdown. MDX is allowed only for a reusable interactive or generated reference component.

---

## 3. Scripted-window scene system

### Design objective

The persistent Jinn dashboard window is the site's signature. It must look like real product UI and play a small, truthful interaction that proves one concept at a time. The architecture should make a new scene closer to authoring a storyboard than programming a component.

### Four layers

| Layer              | Name                                 | Responsibility                                                                                                                                                                            |
| ------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static view        | `SceneWindow` and surface components | Render semantic, token-true dashboard HTML from a state object. Fake controls are not keyboard-focusable. Each scene has a readable external caption/transcript.                          |
| Declarative story  | `SceneDefinition`                    | Name the scene, initial state, timeline beats, playback policy, proof statement, and final state implied by the beats. No arbitrary callbacks.                                            |
| Timeline runtime   | `ScenePlayer`                        | Validate local targets, reduce the definition to states, compile actions into one GSAP timeline, expose play/pause/resume/restart/seek/destroy, and clean up all inline styles/listeners. |
| Page orchestration | `SceneController`                    | Activate the correct scene from scroll position, pause offscreen/background scenes, coordinate the persistent window and theme inversion, and select desktop versus mobile behavior.      |

### Scene definition contract

Definitions are typed TypeScript data files named `<purpose>.scene.ts`. TypeScript is preferable to JSON/YAML here because authors get autocomplete, union validation, comments, and build failures without adding a separate schema language.

Each definition contains:

- Identity: stable `id`, human title, surface kind, and one-sentence product claim.
- Accessibility copy: short transcript/caption describing the interaction without relying on motion.
- Initial semantic state: messages, employees, todo states, workflow steps, trigger bindings, and the active dashboard pane.
- Playback policy: `once` or `loop`, entry behavior, offscreen behavior, dwell duration, and optional quiet reset duration.
- Timeline beats: integer millisecond offsets, optional duration, target ID local to the scene, an action, and a Ledger easing token.
- End state: computed by applying all beats to the initial state; it is not separately hand-authored.
- QA anchors: named checkpoints such as `initial`, `delegated`, `approval`, and `resolved` for deterministic screenshots.

Keep the action vocabulary small and semantic:

| Action                       | Use                                                              |
| ---------------------------- | ---------------------------------------------------------------- |
| `type-text` / `replace-text` | Chat typing and final copy                                       |
| `enter` / `exit`             | Reveal or retire a message, chip, card, or row                   |
| `set-state`                  | Todo, workflow step, approval gate, or trigger status transition |
| `set-progress`               | Workflow rail/fill advancement                                   |
| `highlight`                  | Active pane, ribbon item, owner, or current step                 |
| `pulse`                      | Bounded trigger/gate attention pulse                             |
| `theme`                      | Switch a section between Ledger light and dark tokens            |

If an effect cannot be expressed with this set, add a named effect only after it appears in two approved scenes. Never place raw selector strings, GSAP calls, or inline functions in a definition.

### State and rendering rules

- Scene data uses product semantics, not CSS semantics: `status: executing`, not `className: blue-spinner`.
- Surface components map semantics to Ledger tokens and faithful dashboard presentation.
- Targets use component-local stable IDs. The player scopes every lookup to its scene root and fails loudly in development if a target is missing or duplicated.
- The pure scene reducer can resolve state at any checkpoint without a browser. Unit tests cover this reducer and guarantee that the final state is reachable.
- The DOM contains meaningful resolved content at build time. An early motion bootstrap marks motion-capable browsers before first paint, then the player primes the animated initial state. With JavaScript disabled or reduced motion requested, the resolved static state remains visible.
- Product-window internals are a marketing illustration, not an application. Mark duplicated/internal chrome appropriately and provide an adjacent visible caption so screen readers receive the proof without traversing fake controls.

### Playback behavior

- Desktop: one sticky window persists while ScrollTrigger maps page progress to discrete scene activation. A scene plays its short timeline after activation; scrolling is not hijacked.
- Only transitions that communicate continuity, such as a shared handoff or workflow rail, may scrub with scroll. Text typing and state changes play on a time-based timeline once activated.
- Mobile below 900px: do not pin the whole story. Render stacked scene windows in document flow and activate each with viewport entry. This follows the winning mock's proven mobile pattern.
- `ScenePlayer.pause()` runs when its root leaves the viewport, when `document.visibilityState` becomes hidden, or when the user pauses a looping scene. Resume continues from the same time unless the definition explicitly says `restart-on-enter`.
- A loop includes a deliberate resolved dwell and a quiet reset; it never snaps directly from the final state to the first. Long showcase scenes default to `once`; only ambient/hero demonstrations loop.
- Any motion lasting more than five seconds or looping has a visible, keyboard-accessible pause control with a minimum 44px hit area.
- On breakpoint changes, destroy and rebuild only the ScrollTrigger bindings. Preserve the semantic scene state and avoid duplicate timelines.

### Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Do not instantiate GSAP timelines or ScrollTrigger.
- Render every scene at its named resolved checkpoint with no typing, pulsing, pinning, parallax, or automatic theme transition.
- Keep the page in normal document flow, including desktop.
- Preserve the before/after story in the visible caption and resolved UI state.
- Re-evaluate the media query if the OS preference changes while the page is open.

### Designer/agent authoring workflow

1. Pick the nearest existing surface and scene; do not fork the dashboard shell.
2. Write the product claim and resolved state first. If the scene cannot prove one claim in roughly 3–6 seconds, split it.
3. Add semantic initial data and timed beats in a new `*.scene.ts` file.
4. Run the scene validator. Fix missing targets, invalid state transitions, overlapping text actions, and unbounded loops before visual work.
5. Preview the real page with the development-only scene debug overlay. The overlay shows current time, checkpoint, play/pause, restart, and a scrubber; it is tree-shaken from production.
6. Capture the named checkpoints at 1440×900 and 390×844 in both themes, plus the reduced-motion result.
7. Compare the scene with the real dashboard component/source noted in its file header, then submit it for design review.

This workflow intentionally avoids Storybook in Phase A. The real page plus a development-only overlay is sufficient until scene count or cross-page reuse proves otherwise.

### Initial landing scene inventory

| Scene ID            | Scripted proof                                                             | Required end state                                                    |
| ------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `delegation`        | User message types; COO response appears; two delegation chips arrive      | Two owned tasks exist and the handoff is understandable               |
| `employees`         | Ribbon moves to Org; employees settle into departments                     | Engine, role, rank, and reporting relationship are visible            |
| `todos`             | An executing todo progresses and completes after review                    | State, owner, execution context, and reviewed completion are visible  |
| `workflow-approval` | Trigger starts a run; rail advances; approval gate becomes active          | Work is parked at a human gate, never falsely shown as complete       |
| `trigger-fire`      | Cron binding pulses once and creates a run                                 | Trigger kind, fired time, and resulting run are visible               |
| `night-shift`       | Page enters the alternate Ledger theme for the “runs while you sleep” beat | The theme change supports the story without changing the token system |

---

## 4. Token strategy

### Recommendation: script-synced, checked-in subset

Do not copy the whole dashboard `globals.css` and do not import it across repositories at build time.

The full file includes Tailwind directives, app-only layout locks, React Flow/xterm overrides, and utility rules that a marketing site must not inherit. A cross-repo import would also make deploy builds depend on a sibling checkout.

Instead:

1. `scripts/sync-ledger-tokens.ts` parses the canonical dashboard CSS with PostCSS.
2. A fixed allow-list extracts theme-independent type/spacing tokens plus matching explicit light and dark values for surfaces, materials, fills, text, accent/status colors, radii, shadows, and easing. A tiny bootstrap resolves the user's system preference to one of those explicit themes instead of copying the duplicated upstream system-fallback blocks.
3. The script writes `src/styles/generated/ledger-tokens.css` with a source path, source commit, and content hash header.
4. The generated file is committed so local and deploy builds are deterministic.
5. `pnpm tokens:check` performs the same extraction without writing and fails if the checked-in output differs or if light/dark token keys are asymmetric.

Marketing extensions live in `site-tokens.css` and may only reference generated values. Examples include display sizes above the HIG large-title scale, section spacing, content widths, and scene-window dimensions. Name them `--site-*` so no one mistakes them for upstream Ledger tokens.

### Drift prevention

- The full maintainer release gate checks the Ledger snapshot byte for byte against the selected Jinn checkout with `pnpm tokens:check`.
- Public CI runs `pnpm tokens:validate` to validate the committed snapshot contract and provenance header when the matching Jinn token source has not reached the product repository's public `main` branch yet. It still checks out public Jinn source for the pinned documentation contract.
- The Jinn release skill runs token sync when the dashboard token source changed and includes the generated website diff in the release's website update.
- A unit test asserts that every extracted theme token exists in both explicit themes and that no disallowed app selector entered the generated file.
- Reviewers reject hand edits to `generated/ledger-tokens.css` and hardcoded theme colors in site components.
- If the upstream repository is unavailable, the site still builds from the checked-in file; only the drift check reports the missing source.

---

## 5. Documentation architecture

### Starlight routing and authoring

Use Starlight's standard collection root at `src/content/docs/`. Place public documentation beneath an inner `docs/` directory so file paths naturally emit `/docs/**` without custom route rewriting. Declare `src/content/machine/` as a separate collection for machine-route source content.

Use Markdown by default. Use MDX only for components such as an endpoint parameter table or a generated CLI command block. Extend Starlight's docs schema with these fields:

- `description`: required summary used in search and `llms.txt`.
- `since`: first jinn-cli version containing the behavior.
- `source`: relative path(s) in the Jinn repository used to verify accuracy.
- `audience`: `operator`, `agent`, `contributor`, or a combination.
- `generated`: whether release tooling owns the file.

The sidebar has explicit top-level groups and autogenerated entries within each group. This keeps the information architecture stable while allowing agents to add a page without editing navigation for routine cases.

### Information architecture

```text
/docs/
├── getting-started/
│   ├── install
│   ├── first-company
│   ├── configuration
│   └── update-and-migrate
├── core-concepts/
│   ├── gateway-and-local-first
│   ├── employees
│   ├── todos
│   ├── workflows
│   ├── triggers
│   ├── sessions-and-delegation
│   ├── approvals
│   └── mcp
├── guides/
│   ├── build-an-ai-team
│   ├── connect-slack
│   ├── schedule-work
│   ├── create-a-workflow
│   ├── add-and-manage-skills
│   └── pair-another-device
├── reference/
│   ├── gateway-api/
│   │   ├── authentication
│   │   ├── sessions-and-delegation
│   │   ├── todos
│   │   ├── workflows-and-triggers
│   │   ├── org-skills-and-knowledge
│   │   ├── cron-and-connectors
│   │   └── files-and-media
│   └── cli/
│       ├── lifecycle
│       ├── instances
│       ├── pairing-and-limits
│       ├── skills
│       └── migrations
└── changelog/
    ├── index
    └── <version>                  # One generated page per release
```

Reference docs must distinguish public/operator APIs from internal relay/proxy endpoints. A route existing in `api.ts` is not by itself permission to advertise it. Every API page covers method/path, authority/authentication, inputs, response shape, errors, side effects, and one minimal request example verified against the current release.

### Search

Use Starlight's built-in Pagefind integration. It is static, requires no account, and loads search assets on demand. Do not add Algolia in the initial build. Exclude changelog boilerplate and machine-route mirrors from the index when they create duplicate results.

### Release-time update flow for Phase D

The release workflow has deterministic work and agent-reviewed work; do not let a model invent reference prose from a version number.

Deterministic `sync-release-docs` responsibilities:

1. Read the released version from `packages/jinn/package.json` and its exact section from `CHANGELOG.md`.
2. Update `src/data/release.json` and create/update the versioned changelog Markdown file idempotently.
3. Capture the public CLI help output and compare it with the previous release snapshot.
4. Detect diffs in the gateway route handlers, auth policy, Commander definitions, config schema, templates/migrations, and Ledger token source.
5. Emit a machine-readable impact report naming the docs sections that require a technical review.
6. Run token sync when required, then format only files the script owns.

The release skill then assigns an agent to inspect the source diff and update impacted Markdown. The gate requires:

- Every changed CLI command to be reflected in CLI reference pages.
- Every changed documented public route/auth rule to be reflected in Gateway API pages and `/agents.md`.
- Installation, configuration, or migration changes to be reflected in Getting Started.
- Product-level features to update Core Concepts or Guides only when the behavior is real and released.
- `pnpm check`, unit tests, build, link check, and machine-route tests to pass.
- A website pull request and preview URL. Default policy is review/merge, not an automatic production write.

Do not parse the large gateway handler into generated prose. If route drift becomes too noisy, Phase D may add an explicit public API manifest in the Jinn repository, but that is not required to launch.

### `/agents.md` and `/llms.txt`

- Keep the canonical `/agents.md` source at `src/content/machine/agents.md`. It explains the gateway base URL, pairing/authentication, request identity, session create/resume/message protocol, delegation, approval boundaries, rate/error handling, and links to exact API reference pages.
- Generate `/llms.txt` at build time from documentation frontmatter plus `release.json`. It lists the product summary, current documented version, canonical docs sections, `/agents.md`, repository, package, and changelog URLs.
- Serve both with prerendered Astro file endpoints (`agents.md.ts`, `llms.txt.ts`) and an explicit `text/plain; charset=utf-8` response. This is host-independent and produces exact clean routes.
- Browser tests assert status 200, content type, current version, public-safe content, and absence of HTML wrappers.

### Versioning default

Document the latest stable release only, with a visible “Docs for jinn-cli vX.Y.Z” marker and versioned changelog pages. Do not duplicate the entire docs tree per pre-1.0 version. Add full versioned docs only after a supported older release materially differs and receives ongoing support.

---

## 6. QA and tooling

### Commands to provide

| Command                | Gate                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm dev`             | Astro/Starlight local development                             |
| `pnpm build`           | Static production build to `dist/`                            |
| `pnpm preview`         | Serve the exact production output                             |
| `pnpm typecheck`       | `astro check` plus TypeScript                                 |
| `pnpm lint`            | ESLint for Astro/TypeScript and formatting check              |
| `pnpm test`            | Vitest scene/token/content tests                              |
| `pnpm test:e2e`        | Playwright interaction, route, a11y, and reduced-motion tests |
| `pnpm test:visual`     | Deterministic screenshot comparisons                          |
| `pnpm test:links`      | Linkinator against `dist/`                                    |
| `pnpm test:lighthouse` | Lighthouse CI budgets against preview output                  |
| `pnpm check`           | Fast typecheck, lint, unit, build, safety, and link checks    |

`pnpm test:visual` and `pnpm test:lighthouse` remain explicit release gates,
not part of `pnpm check`: their browser/server startup plus 62 DPR2 captures
and three cold mobile audits make them intentionally slower than the fast
inner-loop gate. Baseline updates require
`UPDATE_VISUAL_BASELINES=1 pnpm test:visual --update-snapshots`; CI and ordinary
local runs can only compare against the approved files.

### Test layers

- Unit: scene definition validation, state reduction at checkpoints, loop/reset policy, token extraction symmetry, content schema, release-sync idempotence, and `llms.txt` generation.
- Browser: desktop sticky scene activation; offscreen/background pause; user pause; resize cleanup; mobile stacked scenes; copy command; navigation; theme inversion; JavaScript-disabled end state; machine routes; keyboard navigation.
- Accessibility: axe-core on landing, features, representative docs, and 404; semantic heading order; visible focus; 44px animated-scene controls; no fake dashboard control in the tab order.
- Visual: named scene checkpoints rather than timing guesses. Freeze GSAP at a checkpoint, disable caret/blink noise, wait for fonts, then compare.
- Browser matrix: Chromium is the full visual gate; WebKit covers mobile Safari scroll/sticky behavior; Firefox runs navigation and reduced-motion smoke tests.

### Screenshot matrix

Playwright owns screenshots; do not use hardcoded local browser paths.

Required baseline matrix:

- Desktop 1440×900 at device scale 2: hero plus every scene checkpoint, both themes.
- Mobile 390×844 at device scale 2: hero, todo, workflow approval, theme-inversion beat, and footer, both themes.
- Reduced motion at desktop and mobile: hero plus one representative resolved scene.
- Features and docs representative pages are added in their phases.

Store approved baselines under `tests/visual/` and upload the full current run as a CI artifact. Baseline changes require a design review; they are never auto-updated by CI.

### Performance budgets

Run Lighthouse against a production build with a cold mobile profile. Phase A is not complete unless:

- Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.
- LCP ≤ 2.5s, CLS ≤ 0.05, INP ≤ 200ms where measurable, and total blocking time ≤ 200ms in lab runs.
- Landing eager JavaScript ≤ 90KB gzip, including GSAP. Docs must not download GSAP.
- Landing initial transferred assets ≤ 500KB excluding an on-demand OG image; self-hosted font files are subset and preloaded only when used above the fold.
- No individual main-thread task exceeds 50ms during the scripted showcase on the reference mobile profile.
- Scroll animation holds 55–60fps in Chromium and WebKit traces with at most one active scene timeline.
- Pagefind search assets load only when search is opened.

If a budget fails, first remove work, pause more aggressively, reduce simultaneous layers/blur, and defer assets. Do not raise the budget to hide a regression.

### Link and content safety

- Linkinator checks all generated internal routes and a curated allow-list of external links. Flaky external hosts warn in PRs but fail the release gate only after a second verification.
- A privacy/leak script scans source and generated output for personal identifiers, credentials, absolute home paths, and unapproved domains.
- CI confirms that `/agents.md`, `/llms.txt`, sitemap, robots, canonical URLs, and 404 behavior survive the actual host preview.

---

## 7. Deploy pipeline proposal

### Recommendation: Netlify static hosting

Netlify is the least surprising fit:

- Static Astro needs no adapter; build is `pnpm build`, publish is `dist/`.
- Pull requests receive stable deploy-preview URLs and immutable deploy permalinks, which fits the mandatory operator screenshot/preview checkpoints.
- Exact static routes and custom headers are straightforward, while Astro file endpoints make `/agents.md` and `/llms.txt` portable.
- `netlify.toml` keeps build, headers, redirects, and preview no-index behavior in version control.
- There is no incentive to introduce a server or vendor runtime.

Official references: [Astro on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/astro/) and [Netlify Deploy Previews](https://docs.netlify.com/deploy/deploy-types/deploy-previews/).

### Alternatives

| Host             | Assessment                                                                                                                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Pages | Strong static CDN and previews, but Cloudflare now recommends Workers Static Assets for new projects. Choosing Pages today accepts a product-direction transition; choosing Workers adds Wrangler/runtime concepts this static site does not need. |
| Vercel           | Excellent Git previews and perfectly capable static hosting, but its Next.js strengths do not benefit this Astro-static site. It is a sound fallback if the operator already standardizes domains and billing there.                               |

Cloudflare's current guidance is explicit: new static projects should use Workers rather than Pages. See [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).

### Proposed pipeline

1. Pull request: run privacy scan, token drift check, typecheck, lint, unit tests, static build, internal links, Playwright, axe, visual comparisons, and Lighthouse CI.
2. Netlify creates a deploy preview with `X-Robots-Tag: noindex`; CI posts the preview and screenshot artifact for review.
3. Merge to `main`: production build is eligible, but initial site creation, production-domain attachment, and DNS remain disabled until operator approval.
4. After launch approval: attach `jinn.run`, verify TLS/canonical/redirects/machine routes, then perform DNS cutover.
5. Rollback: restore a known-good immutable deploy from Netlify; do not rebuild during an incident.

Recommended headers at launch include a restrictive Content Security Policy, HSTS only after the domain is verified, `X-Content-Type-Options: nosniff`, a strict referrer policy, long immutable caching for hashed assets, and short caching for HTML/machine routes.

---

## 8. Phase A implementation breakdown

Phase A starts only after the design storyboard names the section order, exact copy, and scene beats. The technical work below is ordered; each task ends in a reviewable, independently verifiable state.

| #    | Task                                               | Size        | Deliverable                                                                                                                                              | Independent verification                                                                                                                              |
| ---- | -------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | Scaffold the static Astro/Starlight project        | S, 0.5 day  | Pinned pnpm/Node metadata; Astro static config; Starlight mounted with docs content under `/docs/`; empty marketing layout; scripts for build/check/test | `pnpm build` succeeds; `/`, a seed `/docs/` page, `/agents.md`, and `/llms.txt` return static 200 responses; landing output contains no React runtime |
| A-02 | Establish fonts and token sync                     | S, 0.5 day  | Self-hosted Hanken/IBM fonts; token parser/allow-list; generated Ledger CSS; marketing aliases; token specimen used only in development                  | `pnpm tokens:check` passes; dark/light key sets match; screenshots show both themes; no Google Fonts requests or app-only selectors                   |
| A-03 | Build the marketing shell                          | S, 0.5 day  | Marketing layout, metadata, calm floating nav, install command, theme scopes, focus styles, 404                                                          | Keyboard-only nav works at 390 and 1440; axe has no serious violations; no layout shift after fonts settle                                            |
| A-04 | Implement the static hero composition              | M, 1 day    | Quiet-ember thin/bold Hanken hero treatment, product-real dashboard frame, install/GitHub CTAs, static resolved chat scene                               | JavaScript-disabled and reduced-motion screenshots still communicate the product; dark/light and 390/1440 snapshots approved                          |
| A-05 | Implement scene definitions and reducer with tests | M, 1 day    | Typed action/state contracts, validator, pure checkpoint reducer, first delegation definition                                                            | Tests first prove invalid targets/state transitions fail and final state resolves; no GSAP or DOM dependency in unit tests                            |
| A-06 | Implement `ScenePlayer` and lifecycle controls     | M, 1 day    | GSAP compiler, play/pause/resume/restart/seek/destroy, visibility pause, user pause, reduced-motion bypass                                               | Playwright proves one timeline, pause/resume continuity, cleanup after navigation/resize, static end state under reduced motion                       |
| A-07 | Implement desktop/mobile scene orchestration       | M, 1 day    | ScrollTrigger sticky desktop controller; stacked mobile controller; debug checkpoint overlay for development                                             | Desktop activates scenes in both scroll directions; mobile has no pinning; viewport resize does not duplicate listeners or timelines                  |
| A-08 | Build faithful dashboard surfaces                  | L, 1.5 days | Shared shell plus chat, org, todo, workflow, and trigger surface components using semantic states and Lucide icons                                       | Each surface matches its named real-app reference at 1440 and 390; both themes work; internal fake controls are absent from tab order                 |
| A-09 | Author and connect delegation + employee scenes    | M, 1 day    | Typing, COO response, delegation chips, pane navigation, org arrival                                                                                     | Named initial/delegated/resolved checkpoints pass visual review; transcript matches visible proof                                                     |
| A-10 | Author and connect todo + workflow approval scenes | M, 1 day    | Executing-to-reviewed todo transition; trigger-to-run workflow rail; active human approval gate                                                          | State colors remain truthful; workflow never marks the gate/post step complete early; reduced-motion shows the correct resolved state                 |
| A-11 | Author trigger and theme-inversion beats           | M, 1 day    | Cron firing, run creation, one calm pulse, and Ledger theme switch at the locked narrative beat                                                          | Only system status colors and rationed amber are used; scroll reversal/theme cleanup is correct; contrast passes in both themes                       |
| A-12 | Build the remaining landing sections               | M, 1 day    | MCP statement, three-step install/hire/run story, final install CTA, GitHub/npm links, footer                                                            | All copy is product-true and generic; headings form a logical outline; external links and copy command work                                           |
| A-13 | Responsive and accessibility polish                | M, 1 day    | 390-first layout fixes, safe-area handling, text wrapping, minimum hit areas, pause control, focus/reduced-motion polish                                 | Chromium/WebKit/Firefox smoke suite and axe pass; no horizontal overflow; no animation blocks reading or navigation                                   |
| A-14 | Performance and visual quality gate                | M, 1 day    | Final screenshot matrix, traces, Lighthouse report, bundle report, link report, privacy report                                                           | All budgets in section 6 pass; implementer hands off preview/screenshots to separate design review, code review, and QA sessions                      |

Commit after each task with only that task's files staged. Do not combine scene authoring, broad polish, and infrastructure into one unreviewable change.

---

## 9. Risks and open questions

### Risks and mitigations

| Risk                                                           | Mitigation                                                                                                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Animation jank on mobile                                       | Native scrolling; no Lenis; one active timeline; transform/opacity first; pause offscreen; stacked mobile layout; trace against WebKit and Chromium budgets |
| ScrollTrigger pinning edge cases in Safari                     | Keep the pinned region desktop-only; avoid transformed ancestors; test fast scroll, resize, browser chrome changes, and back navigation in WebKit           |
| Scene system becomes a miniature app framework                 | Keep the initial action vocabulary small and tied to current surfaces; add an effect only after two approved use cases; keep definitions local to routes    |
| Marketing mock drifts from the real dashboard                  | Script-sync tokens; record real component source paths in surface files; run visual fidelity review on Jinn UI releases that touch those surfaces           |
| Generated token copy drifts across repositories                | Checked-in generated output, source hash, cross-repo CI check, and release-skill sync                                                                       |
| Starlight styling looks like a separate brand                  | Override via supported `customCss` and Ledger variables; keep Starlight's accessible structure/components; do not fork its layout wholesale                 |
| Release automation hallucinates documentation                  | Mechanical script writes only release/version data; an agent updates prose from source diffs; technical review and preview remain gates                     |
| API reference exposes internal/control-plane routes carelessly | Curate a documented public surface and state authority/side effects per route; never publish every handler automatically                                    |
| Static machine routes receive the wrong MIME type              | Generate explicit Astro file endpoints with response headers and test both local production output and host preview                                         |
| Fonts or blur effects consume the performance budget           | Self-host/subset fonts, preload only above-fold face, ration backdrop blur, and remove layers before relaxing budgets                                       |
| Public repository leaks local context                          | Generic fixtures, scoped staging, generated-output scan, and a privacy grep before every commit                                                             |

### Decisions for Jimbo/operator

These do not block the plan; defaults are provided so implementation can proceed.

1. **Theme-inversion direction.** The keynote graft implies light daytime → dark “runs while you sleep,” while the winning product-real mock opens dark. Default: follow the narrative and open the marketing shell in Ledger light, then enter dark at the night beat; keep the product window themeable. Confirm before A-02/A-04 visual approval.
2. **Hosting/account.** Default: Netlify, with a new Git-connected site only after operator approval. Vercel is the fallback if existing account/domain operations make it materially simpler. The repository currently has no configured remote, so repository ownership/visibility must also be chosen before previews can be automated.
3. **Docs history.** Default: latest stable docs plus versioned changelog pages, no full version selector before 1.0. Confirm only if older versions need active support.
4. **Release-site merge policy.** Default: the release skill opens a website PR and waits for checks/review; it does not push directly to production. A later low-risk auto-merge policy can be considered after several clean releases.
5. **Scene replay.** Default: delegation may loop with pause controls; product primitive scenes play once per activation and retain their resolved state. Confirm in the Phase A storyboard.

Analytics, production DNS, final canonical redirect policy, and public launch date remain Phase E decisions and are intentionally not prerequisites for implementation.

---

## Orchestrator decisions (Jimbo, 2026-07-10) — plan APPROVED

1. **Theme arc:** the HERO STAYS DARK — that is the approved l2-product-real look the operator picked. The Fable storyboard (A1) owns the full theme arc, including where the light-theme beat lands (e.g. a "step in only when it matters" / morning-review moment) so the inversion still tells the "runs while you sleep" story from a dark opening. Light-open is rejected unless the storyboard makes an overwhelming case at the operator checkpoint.
2. **Hosting:** Netlify accepted as the proposal. Git remote/visibility + Netlify account = operator decisions, collected at the next operator checkpoint; not blocking Phase A.
3. **Docs history:** default accepted (latest stable + versioned changelog pages).
4. **Release→site merge policy:** default accepted (release skill opens a website PR; review gate; no direct production writes).
5. **Scene replay:** defaults accepted; storyboard confirms per scene.

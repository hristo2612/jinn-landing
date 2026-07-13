# C2 Documentation Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the complete verified jinn.run documentation tree, curated operator API/CLI reference, changelog, and machine-readable agent guides.

**Architecture:** Starlight continues to render Markdown from `src/content/docs/docs/`; explicit sidebar groups preserve the IA. A small pure generator combines required documentation frontmatter with `src/data/release.json` for `/llms.txt`, while `/agents.md` remains hand-authored, source-verified machine prose.

**Tech Stack:** Astro 7, Starlight, Markdown, TypeScript, Vitest, Playwright.

## Global Constraints

- Verify every product claim against `~/Projects/jinn/packages/jinn` or `packages/web`; source wins over README prose.
- Keep every public example generic and free of personal names, projects, credentials, IDs, emails, and absolute home paths.
- Document only curated public/operator routes, with authority, auth, inputs, outputs, errors, side effects, and one verified curl example.
- Preserve the landing, features page, scene machinery, visual baselines, preview worktree, and port 4321.
- Use Markdown unless MDX is required; every page carries `description`, `since`, `source`, `audience`, and `generated` frontmatter.
- Document latest stable only and leave deterministic release-sync ownership seams.

---

### Task 1: Documentation contract gates

**Files:**

- Create: `tests/unit/docs-content.test.ts`
- Create: `tests/e2e/docs.spec.ts`

- [ ] Add a unit oracle for the exact IA, required frontmatter, machine source completeness, and release metadata.
- [ ] Add browser assertions for all five sidebar groups and both machine routes.
- [ ] Run the focused tests and verify they fail because the content is absent/placeholder.

### Task 2: Getting Started and Core Concepts

**Files:**

- Create: `src/content/docs/docs/getting-started/*.md`
- Create: `src/content/docs/docs/core-concepts/*.md`

- [ ] Write four task-sequenced Getting Started pages from setup, onboarding, config, lifecycle, and migration source.
- [ ] Write eight Core Concepts pages from org, work-item, workflow, trigger, session, approval, and MCP implementations.
- [ ] Run the frontmatter/content gate, format, safety scan, and commit the section group.

### Task 3: Guides and curated reference

**Files:**

- Create: `src/content/docs/docs/guides/*.md`
- Create: `src/content/docs/docs/reference/gateway-api/*.md`
- Create: `src/content/docs/docs/reference/cli/*.md`
- Modify: `astro.config.mjs`

- [ ] Write six task-oriented guides with verified commands/config shapes.
- [ ] Write seven curated operator API pages and five Commander-derived CLI pages.
- [ ] Configure the explicit Starlight sidebar groups and run focused gates.
- [ ] Leak-grep and commit guides/reference separately where review boundaries are meaningful.

### Task 4: Changelog and machine routes

**Files:**

- Create: `src/content/docs/docs/changelog/index.md`
- Create: `src/content/docs/docs/changelog/0.25.0.md`
- Create: `src/data/release.json`
- Create: `src/lib/llms-txt.ts`
- Modify: `src/pages/llms.txt.ts`
- Replace: `src/content/machine/agents.md`
- Replace: `src/content/machine/llms.md`

- [ ] Add current stable release metadata and a generated changelog page with an explicit automation ownership seam.
- [ ] Implement the pure `llms.txt` generator and make its failing unit assertions pass.
- [ ] Write the standalone gateway protocol in `/agents.md`, including discovery, bearer/pair auth, session/delegation/Todo/workflow flows, approval boundaries, and errors.
- [ ] Run focused unit/E2E, safety, format, and commit.

### Task 5: Full verification

**Files:**

- Modify only files required to correct failures introduced by Tasks 1–4.

- [ ] Run `pnpm check`.
- [ ] Run `pnpm test:e2e` twice and retain both tails.
- [ ] Run `pnpm test:visual` and confirm no documentation baselines were created or changed.
- [ ] Leak-grep each staged diff and the full branch diff; inspect sitemap and internal links.
- [ ] Report commits, section counts, five hardest accuracy calls, machine-route coverage, and both E2E gate tails.

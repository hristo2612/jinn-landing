# Upcoming Docs Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the complete post-0.25.0 documentation and execute-verify it against a source package built from one pinned Jinn commit.

**Architecture:** `src/data/release.json` is the single target manifest. The contract runner selects either the pinned source artifact or npm latest from its `contractTarget`, installs it into an isolated home, and binds `/agents.md` response claims to live responses.

**Tech Stack:** Astro/Starlight Markdown, TypeScript, Vitest, npm pack, pnpm, isolated Jinn daemon.

## Global Constraints

- Pin Jinn main at `b534e88de17b66f3e2c089cde8fcf8763ca3e069`, version `0.26.0`.
- Never access port 7777 or the live `~/.jinn`.
- Do not modify `/features/`.
- Public examples remain generic and leak-scanned.

### Task 1: Target manifest and restored information architecture

**Files:** `src/data/release.json`, `src/content/docs/docs/**`, `src/content/machine/**`, `astro.config.mjs`, `tests/unit/docs-content.test.ts`, `tests/e2e/marketing-shell.spec.ts`.

- [ ] Add the source pin, upcoming version, and source/npm contract selector to the release manifest.
- [ ] Restore the removed concepts, guide, API reference, changelog, and machine protocols from the pre-retarget history.
- [ ] Correct every restored response envelope and source citation against the pin.
- [ ] Run focused content, frontmatter, sitemap, and machine-route tests.
- [ ] Commit the restored upcoming documentation.

### Task 2: Source-built runtime contract

**Files:** `scripts/check-docs-release-contract.ts`, `scripts/lib/machine-contract.ts`, `tests/unit/machine-contract.test.ts`.

- [ ] Write failing target-selection and restored-route contract tests.
- [ ] Build and `npm pack` the exact pinned Jinn source when `contractTarget` is `source`.
- [ ] Preserve one-field switching to npm latest and assert npm mode's version boundary.
- [ ] Execute Todo, delegation, Workflow, trigger, approval, knowledge, MCP, and existing stable contracts in the sandbox.
- [ ] Bind documented `/agents.md` envelopes to the live responses and clean up the exact daemon/temp home in `finally`.
- [ ] Commit the source-built gate.

### Task 3: Final verification

**Files:** no new production files.

- [ ] Run `pnpm check` twice.
- [ ] Run `pnpm test:e2e` twice and await all 162 tests each time.
- [ ] Run leak-grep per commit and confirm no sandbox/test server remains.
- [ ] Report commits, restored page/route counts, pin/version, and gate tails.

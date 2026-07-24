---
title: Update and Migrate
description: Update jinn-cli and safely merge versioned template migrations into a customized local instance.
since: "0.1.0"
source:
  - packages/jinn/src/cli/migrate.ts
  - packages/jinn/src/cli/migrate-prompt.ts
  - packages/jinn/src/cli/start.ts
  - packages/jinn/src/migrations/completion.ts
  - packages/jinn/template/skills/migrate/SKILL.md
  - packages/jinn/template/migrations/0.26.0/MIGRATION.md
  - packages/jinn/template/migrations/0.27.0/MIGRATION.md
  - packages/jinn/template/migrations/0.28.0/MIGRATION.md
  - packages/jinn/template/migrations/0.28.1/MIGRATION.md
  - packages/jinn/template/migrations/0.28.2/MIGRATION.md
audience: [operator]
generated: false
---

Update the global package, then migrate the user-owned instance separately:

```sh
npm install -g jinn-cli@latest
jinn migrate
```

The package and `~/.jinn/` have different ownership. Updating npm replaces the shipped code and template; it does not overwrite your customized instance files: `CLAUDE.md`/`AGENTS.md`, `org/`, `secrets/`, `cron/`, config values, and skills are all preserved. The migration merges new keys, docs, and skills into your files rather than replacing them. On start, Jinn compares the installed package version with `jinn.version` in `config.yaml` and prints a migration reminder when the instance is behind.

## Preview first

Plain `jinn migrate` is read-only. It scans versioned `MIGRATION.md` files in the installed template for the range `(instance version, package version]` and prints one composed prompt in ascending order. Releases without instance-surface changes carry explicit empty bridge bundles so the strict chain still reaches the installed package version without inventing file changes.

Review the prompt and your working copy before applying it. Migration instructions are designed to merge new keys, docs, and skills while preserving local changes.

## Apply the migration

There is no auto-apply flag. `jinn migrate --apply` is deprecated: it no longer launches an engine and never advances the marker on engine exit. It just prints the same composed prompt with a deprecation warning.

The composed prompt is meant to be handed to your COO (or the configured engine), either through the web migration handoff, which opens a COO session automatically, or by pasting the prompt into a session yourself. The agent merges the new keys, docs, and skills while preserving your customizations, then writes a completion receipt beside a verified migration snapshot that accounts for every manifest path.

Only after that verified receipt exists does the agent run the exact key-gated command supplied verbatim in the prompt:

```sh
jinn migrate --mark-done 0.28.2 --migration-key <migrationKey>
```

`--mark-done` requires the `--migration-key` from the canonical prompt and applies no files. It advances `jinn.version` only against a matching completion receipt and snapshot; the key must match the pending migration, and it refuses a malformed version or a `jinn` value that cannot hold `jinn.version`. A successful engine exit, on its own, never advances the marker.

## v0.28 Workflow upgrade

Drain active v1 Workflow runs before upgrading. The v0.28 runtime does not resume them. Compatible v1 definitions import once as disabled v2 drafts; definitions with schedules, conditions, loops, gates, or other behavior that cannot be preserved exactly stay untouched. Review `<JINN_HOME>/workflows/legacy-v1-import-report.json` before enabling an imported draft. Legacy definitions and run evidence remain under `<JINN_HOME>/workflow-evidence`.

The explicit empty v0.27, v0.28.1, and v0.28.2 migration bridges keep the strict chain valid. Both v0.26 and v0.27 instances can therefore apply the composed migration through v0.28.2 without inventing file changes.

## Restart safely

```sh
jinn restart
```

Use `restart`, not a separate stop/start sequence, when updating a live gateway. The restart path preserves the handoff and avoids a second instance taking the port. `jinn start` also becomes a restart request when it detects an existing gateway.

## Recovery rules

- Never replace `~/.jinn/` with the package template wholesale.
- Keep user changes when a migration and local file overlap.
- Back up content before a migration explicitly removes anything.
- Do not hand-edit `jinn.version`. Advance the marker only through the keyed `jinn migrate --mark-done` after a verified receipt; a failed or interrupted run must leave the marker unchanged.
- Run `jinn status` and one real employee turn after migration; a successful version stamp is not a runtime test.

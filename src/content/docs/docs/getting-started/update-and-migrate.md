---
title: Update and Migrate
description: Update jinn-cli and safely merge versioned template migrations into a customized local instance.
since: "0.1.0"
source:
  - packages/jinn/src/cli/migrate.ts
  - packages/jinn/src/cli/migrate-prompt.ts
  - packages/jinn/src/cli/start.ts
  - packages/jinn/template/migrations/0.26.0/MIGRATION.md
audience: [operator]
generated: false
---

Update the global package, then migrate the user-owned instance separately:

```sh
npm install -g jinn-cli@latest
jinn migrate
```

The package and `~/.jinn/` have different ownership. Updating npm replaces the shipped code and template; it does not overwrite your customized config, company manual, employees, or skills. On start, Jinn compares the installed package version with `jinn.version` in `config.yaml` and prints a migration reminder when the instance is behind.

## Preview first

Plain `jinn migrate` is read-only. It scans versioned `MIGRATION.md` files in the installed template for the range `(instance version, package version]` and prints one composed prompt in ascending order. A release without an instance-surface change has no migration prompt and is skipped.

Review the prompt and your working copy before applying it. Migration instructions are designed to merge new keys, docs, and skills while preserving local changes.

## Apply with an agent

```sh
jinn migrate --apply
```

This launches the configured engine with the composed migration prompt. The operator supervises the run. For Claude, it opens an interactive TUI; close it after reviewing the changes. When the agent exits successfully, Jinn advances the version marker using a format-preserving YAML edit.

If you applied the instructions manually, mark the migration only after verification:

```sh
jinn migrate --mark-done 0.26.0
```

`--mark-done` accepts a strict `X.Y.Z` version and does not apply files. It refuses malformed YAML or a `jinn` value that cannot hold `jinn.version`.

## Restart safely

```sh
jinn restart
```

Use `restart`, not a separate stop/start sequence, when updating a live gateway. The restart path preserves the handoff and avoids a second instance taking the port. `jinn start` also becomes a restart request when it detects an existing gateway.

## Recovery rules

- Never replace `~/.jinn/` with the package template wholesale.
- Keep user changes when a migration and local file overlap.
- Back up content before a migration explicitly removes anything.
- If the marker cannot be updated, correct `config.yaml` manually only after the actual migration is complete.
- Run `jinn status` and one real employee turn after migration; a successful version stamp is not a runtime test.

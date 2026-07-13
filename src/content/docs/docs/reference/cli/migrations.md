---
title: Migrations CLI
description: Preview or apply template migrations and manage the strict instance version marker safely.
since: "0.1.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/migrate.ts
  - packages/jinn/src/cli/migrate-prompt.ts
  - packages/jinn/src/shared/version.ts
audience: [operator, contributor]
generated: false
---

## `jinn migrate`

Reads the package version and `config.yaml` marker, scans strict-semver template migration directories in `(instance, package]`, composes their `MIGRATION.md` instructions in order, and prints the prompt. It writes nothing.

Malformed/prerelease-looking migration directories are named in a warning. Future migration directories above the package version are reported as staged but not applied.

## `jinn migrate --apply`

Launches the selected instance engine with the composed prompt. Claude uses an interactive TUI; Codex uses `codex exec`; Grok uses its prompt mode. If the engine exits with an error, the marker is not advanced. If migration succeeds but safe YAML stamping fails, the changes remain applied and the CLI asks for a manual marker update.

## `jinn migrate --mark-done [version]`

Updates only `jinn.version`. With no value, it uses the package version. The version must be plain `X.Y.Z`. The format-preserving YAML editor refuses invalid YAML, a non-mapping `jinn`, serialization errors, or a failed parse-back check.

```sh
jinn migrate
jinn migrate --apply
# Or, after a verified manual migration:
jinn migrate --mark-done 0.26.0
```

Marking done is an assertion, not an update mechanism. Never use it to suppress a migration you have not actually merged and verified.

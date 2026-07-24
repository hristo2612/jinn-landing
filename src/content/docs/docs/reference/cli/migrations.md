---
title: Migrations CLI
description: Print the canonical instance-migration prompt and advance the strict version marker only with a verified handoff key.
since: "0.1.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/migrate.ts
  - packages/jinn/src/cli/migrate-prompt.ts
  - packages/jinn/src/cli/migration-notice.ts
  - packages/jinn/src/migrations/completion.ts
  - packages/jinn/src/migrations/service.ts
  - packages/jinn/src/shared/version.ts
audience: [operator, contributor]
generated: false
---

## `jinn migrate`

Reads the package version and `config.yaml` marker, scans strict-semver template migration directories in `(instance, package]`, composes their `MIGRATION.md` instructions in order, and prints the canonical prompt. It writes nothing. When the marker already equals the package version it prints an up-to-date line and exits without a prompt.

Malformed/prerelease-looking migration directories are named in a warning. Future migration directories above the package version are reported as staged but not applied.

## `jinn migrate --apply`

Deprecated. It no longer launches an engine and no longer advances the marker. It prints a deprecation warning, then the same canonical prompt as bare `jinn migrate`. Hand that prompt to your COO or use the web migration handoff to actually run the migration; nothing is stamped automatically.

## `jinn migrate --mark-done [version] --migration-key <key>`

Advances only `jinn.version`, and only with proof. It requires `--migration-key`, the key from the canonical migration prompt/handoff, plus a verified completion receipt and snapshot; without the key it refuses. With no version value it uses the package version. The version must be plain `X.Y.Z`. The format-preserving YAML editor refuses invalid YAML, a non-mapping `jinn`, serialization errors, or a failed parse-back check.

`--migration-key <key>` supplies the expected key from the canonical automatic migration handoff. It is only meaningful together with `--mark-done`.

```sh
jinn migrate
# --apply now only re-prints the prompt (deprecated):
jinn migrate --apply
# After a verified migration, stamp the marker with the handoff key:
jinn migrate --mark-done 0.28.2 --migration-key <key>
```

Marking done is an assertion, not an update mechanism. Never use it to suppress a migration you have not actually merged and verified.

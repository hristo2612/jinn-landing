---
title: Pairing and Limits CLI
description: Pair and revoke remote browsers and inspect live/provider engine limit snapshots.
since: "0.23.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/pair.ts
  - packages/jinn/src/cli/limits.ts
  - packages/jinn/src/shared/engine-limits.ts
audience: [operator]
generated: false
---

## `jinn pair [--json]`

This command is present but unusable at the pinned source commit: it authenticates with the gateway bearer, while the gateway correctly restricts pairing-code minting to an authenticated browser session and returns HTTP 403. Use the Settings pairing panel in an authenticated browser. `--json` does not bypass the authority check.

## `jinn unpair [deviceId] [--json]`

Without an ID, lists paired browsers, IDs, and last-seen information. With an ID, revokes it. IDs beginning with `-` are handled safely by the printed command form. `--json` returns the raw device list/result.

```sh
jinn unpair
```

## `jinn limits [-e, --engine <name>] [--json]`

Collects current provider windows, credits, context, discovered models, and source/status where supported. `--engine` filters collection; `--json` emits an `EngineLimitsResponse` with `generatedAt`, default engine, and per-engine snapshots.

```sh
jinn limits --engine claude
jinn limits --json
```

Statuses distinguish live, cached snapshot, static, unsupported, and error data. A provider may expose no numeric quota; the command reports that honestly. Snapshots older than thirty minutes are marked stale.

This command reports provider/account limits and model capabilities. It does not enforce `sessions.maxCostUsd` or `maxDurationMinutes`; those current config fields have no runtime cap path.

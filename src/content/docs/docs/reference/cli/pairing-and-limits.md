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

Mints a single-use pairing code for the running gateway. It first requests a pairing challenge, writes the returned nonce to a proof file inside the instance home (proving local disk access to that home), then exchanges the challenge for a code, so no authenticated browser bearer is required and the earlier HTTP 403 limitation is gone. The printed instructions name the instance and port, show the code and its expiry (single-use, default five minutes), and explain entering it on the other device. On the default `jinn` instance, when other instances exist, it nudges you to target one explicitly with `jinn -i <instance> pair`. `--json` prints the raw code payload plus the instance name. You can still create a code from Settings > Pairing in an authenticated browser.

```sh
jinn pair
jinn -i studio pair --json
```

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

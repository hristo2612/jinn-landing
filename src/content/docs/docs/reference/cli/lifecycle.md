---
title: Lifecycle CLI
description: Initialize, start, stop, restart, and inspect a Jinn gateway using the actual Commander surface.
since: "0.1.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/setup.ts
  - packages/jinn/src/cli/start.ts
  - packages/jinn/src/cli/restart.ts
  - packages/jinn/src/cli/status.ts
audience: [operator]
generated: false
---

Global option: `-i, --instance <name>` selects an instance and maps its home to `~/.<name>`. Without it, commands target `~/.jinn`.

## `jinn setup [--force]`

Initializes the instance, checks engines and optional speech tools, writes missing workspace files, initializes SQLite, and seeds templates. Existing files are preserved. `--force` removes the entire home first and is destructive.

## `jinn start [--daemon] [-p, --port <port>] [--take-port]`

Starts foreground by default. `--daemon` detaches. `--port` overrides config for that start. If a gateway is already running, start requests a restart. Port ownership is verified; `--take-port` deliberately overrides a different Jinn instance's claim.

```sh
jinn start --daemon
jinn status
```

## `jinn stop [-p, --port <port>] [--take-port]`

Stops the selected instance after verifying ownership. The optional port targets a specific listener. Use `--take-port` only when intentionally stopping another Jinn-owned process.

## `jinn restart [--take-port]`

Performs a detached safe restart and can be invoked from inside a session. Prefer it over `stop` followed by `start`; the helper preserves the handoff and port ownership.

## `jinn status`

Reports process/gateway state for the selected instance. It is diagnostic and does not mutate the instance.

All lifecycle commands act on local process state. A successful process start does not prove an engine is installed and authenticated; verify with a real turn.

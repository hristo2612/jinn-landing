---
title: Instances CLI
description: Create and select isolated Jinn homes and ports, unregister them safely, or permanently delete one.
since: "0.1.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/create.ts
  - packages/jinn/src/cli/list.ts
  - packages/jinn/src/cli/remove.ts
  - packages/jinn/src/cli/nuke.ts
audience: [operator]
generated: false
---

An instance has its own home, config, sessions, employees, skills, files, and gateway port. The default `jinn` instance is special and cannot be removed or nuked through the instance commands.

## `jinn create <name> [-p, --port <port>]`

Names start with a lowercase letter and contain lowercase letters, numbers, or hyphens. Creation runs setup in a fresh subprocess, verifies `config.yaml` exists, assigns the requested or next available port starting at 7777, sets a display name, then registers the instance.

```sh
jinn create studio --port 7780
jinn -i studio start --daemon
```

## `jinn list`

Lists registered instances. The registry is separate from the instance homes.

## `jinn remove <name> [--force]`

Refuses a running instance. Without `--force`, it removes only the registry entry and leaves the home directory. With `--force`, it recursively deletes the home after unregistering.

## `jinn nuke [name]`

Permanently deletes a non-default instance and all data. When no name is given it prompts from the removable list. It stops a running process, waits for exit, displays the exact home, and requires typing the instance name. If shutdown does not finish within ten seconds, it aborts without deletion.

Use `remove` when preserving data for manual recovery; use `nuke` only when permanent deletion is intended.

---
title: Instances CLI
description: Create, start, select, unregister, or permanently delete isolated Jinn workspaces.
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

Each workspace has its own home, config, token, sessions, employees, skills, files, and gateway port. The default `jinn` workspace is special and cannot be removed or nuked through the instance commands. The dashboard launcher can also discover, create, start, and open registered workspaces.

## `jinn create <name> [-p, --port <port>]`

The name is normalized to a lowercase slug and must begin with a Latin letter. `Studio Ops`, for example, becomes registry name `jinn-studio-ops` with home `~/.jinn-studio-ops`. Creation runs setup, assigns the requested or next available port starting at 7777, writes an owner-only gateway token before startup, registers the workspace, and starts it.

```sh
jinn create "Studio Ops" --port 7780
jinn -i jinn-studio-ops status
```

## `jinn list`

Lists registered workspaces. The registry is separate from the workspace homes and can retain an offline workspace.

## `jinn remove <name> [--force]`

Refuses a running instance. Without `--force`, it removes only the registry entry and leaves the home directory. With `--force`, it recursively deletes the home after unregistering.

## `jinn nuke [name]`

Permanently deletes a non-default instance and all data. When no name is given it prompts from the removable list. It stops a running process, waits for exit, displays the exact home, and requires typing the instance name. If shutdown does not finish within ten seconds, it aborts without deletion.

Use `remove` when preserving data for manual recovery; use `nuke` only when permanent deletion is intended.

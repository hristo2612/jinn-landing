---
title: Install Jinn
description: Install jinn-cli, initialize the local workspace, and start the gateway for the first time.
since: "0.1.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/setup.ts
  - packages/jinn/src/cli/start.ts
  - packages/jinn/src/gateway/onboarding-policy.ts
audience: [operator]
generated: false
---

These docs track the current stable release. Install it globally:

```sh
npm install -g jinn-cli@0.28.2
```

Jinn requires Node.js 22 or newer; Node 22 or 24 LTS is recommended. Native SQLite/PTY dependencies may require Python plus a C/C++ toolchain when no matching prebuild exists. It does not include an AI engine; install and authenticate at least one supported CLI such as Claude Code, Codex, Grok, or Hermes first.

## Initialize and start

```sh
jinn setup
jinn start
```

`jinn setup` creates `~/.jinn/` without overwriting existing files. It checks the installed engines, writes an authenticated-by-default `config.yaml`, initializes the SQLite session registry, seeds the default general-purpose employee and bundled skills, creates cron/log/knowledge directories, and links the shared skills into the native Claude and Codex skill directories. `jinn setup --force` deletes the existing instance first; treat it as destructive.

On an interactive first setup, the CLI asks what to call the assistant and which detected engine to use by default. Non-interactive setup uses `Jinn` and `claude` defaults.

`jinn start` runs in the foreground and opens the dashboard when attached to a terminal. Use `jinn start --daemon` for a background process. The default address is `http://127.0.0.1:7777`.

If the gateway is already running, `jinn start` requests a clean restart; it does not launch a second process.

## What happens in the dashboard

On a fresh instance, the dashboard shows an onboarding wizard because `portal.onboarded` is not yet true. The wizard records the assistant/operator names and selected engine, marks setup complete, and starts the first conversation. It does not silently create a full organization: the seeded `assistant` employee already exists on disk, and you grow the company deliberately.

## Verify the install

```sh
jinn status
curl http://127.0.0.1:7777/api/status
```

`GET /api/status` is the public liveness route. Other API routes may require the bearer token stored with mode `0600` in `~/.jinn/gateway.json`; see [Gateway authentication](/docs/reference/gateway-api/authentication/).

If sessions fail while the dashboard is healthy, run the selected engine directly and confirm it is authenticated. Jinn can start with no usable engine, but it cannot execute a turn until one is available.

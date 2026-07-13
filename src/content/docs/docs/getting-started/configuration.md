---
title: Configuration
description: Configure the gateway, engines, connectors, MCP, sessions, cron, speech, Talk, and remotes using the real config schema.
since: "0.1.0"
source:
  - packages/jinn/src/shared/config.ts
  - packages/jinn/src/shared/types.ts
  - packages/jinn/src/cli/setup.ts
  - packages/jinn/src/gateway/server.ts
audience: [operator, contributor]
generated: false
---

Jinn reads `~/.jinn/config.yaml`. The gateway watches this file and reloads supported runtime configuration after an atomic save.

This minimal public-safe example follows the seeded schema:

```yaml
jinn:
  version: "0.26.0"

gateway:
  port: 7777
  host: "127.0.0.1"

engines:
  default: claude
  claude:
    bin: claude
    model: opus
    effortLevel: medium
  codex:
    bin: codex
    model: gpt-5.5

connectors: {}
portal: {}

logging:
  file: true
  stdout: true
  level: info
```

## Top-level blocks

- `jinn.version` is the instance migration marker. Change it through `jinn migrate`, not as an upgrade shortcut.
- `gateway` requires `port` and `host`. Optional fields include `streaming`, file-operation safety switches, authentication switches, and `userHeader` for a trusted auth proxy.
- `engines` requires `default` and a `claude` mapping. Claude and Codex accept `bin`, `model`, optional `effortLevel`, and optional child-effort overrides. Antigravity, Grok, Pi, and Hermes are optional engine mappings.
- `models` is an optional registry used by selectors and validation. Each engine entry can declare a default, effort mechanism, hidden models, and model capability records.
- `connectors` can contain Slack, Telegram, Discord, WhatsApp, or `instances` for multiple named connectors.
- `logging` selects file/stdout output and the log level.
- `mcp` configures built-in browser/search/fetch entries, the Jinn company toolset, and custom stdio or URL servers.
- `sessions` supports `interruptOnNewMessage`, lateral relay hop limits, and Claude rate-limit strategy. The schema also contains `maxDurationMinutes` and `maxCostUsd`, but current runtime code does not enforce those two fields; do not rely on them as caps.
- `cron` configures default delivery and slow/failure alert routing. Jobs themselves live in `cron/jobs.json`.
- `portal`, `context`, `stt`, `talk`, `notifications`, and `remotes` hold UI identity, prompt budget, local speech recognition, Talk voice settings, admin delivery, and remote gateway entries.

## Authentication safety

Loopback is the default. Binding a network address enables authentication unless explicitly overridden. Jinn refuses `authDisabled: true` on a network bind unless `insecureAllowUnauthenticatedNetwork: true` is also set.

```yaml
gateway:
  host: "0.0.0.0"
  port: 7777
  authRequired: true
```

Do not commit bearer tokens or connector credentials. The gateway token is generated into `gateway.json`; connector secrets may be stored in local config, and API reads redact configured secret fields.

## Validation limits

Startup validation is intentionally lightweight: it checks only shapes that would crash the gateway, such as the gateway mapping, numeric port, string host, and required engine mappings. A valid YAML file can still contain an unavailable engine or unusable credential. Confirm behavior with `jinn status`, the dashboard, and a real session.

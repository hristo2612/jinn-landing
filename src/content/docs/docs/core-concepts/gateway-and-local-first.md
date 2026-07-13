---
title: Gateway and Local-first
description: Understand the single local process, on-disk state, network boundary, and what local-first does and does not promise.
since: "0.1.0"
source:
  - packages/jinn/src/gateway/server.ts
  - packages/jinn/src/gateway/auth.ts
  - packages/jinn/src/shared/paths.ts
  - packages/jinn/src/sessions/registry.ts
audience: [operator, agent, contributor]
generated: false
---

Jinn is one Node.js gateway process. It serves the dashboard and REST/WebSocket APIs, schedules jobs, watches the workspace, stores session metadata, and launches installed agent CLIs as child processes.

The default network boundary is `127.0.0.1:7777`. State lives under the selected instance home: YAML and Markdown for configuration, employees, skills, and knowledge; JSON/JSONL for cron and run evidence; SQLite for sessions and Todos; managed upload directories for media.

“Local-first” means Jinn owns this state locally and can run without a hosted Jinn control plane. It does not mean every downstream model call is local. Claude, Codex, Grok, Hermes, connectors, and custom MCP servers follow their own network and data policies. Local Whisper transcription avoids a cloud speech-to-text provider, but a voice note received through a messaging platform has already traversed that platform.

## Exposure and authentication

Loopback routes do not require gateway auth by default, although a bearer token is still generated for agent/MCP access. A network bind requires authentication unless the operator sets an explicit unsafe override. The gateway rejects unauthenticated network exposure by default.

The token and live connection metadata are stored in `~/.jinn/gateway.json` with restrictive permissions. Spawned sessions also receive `JINN_GATEWAY_URL` and `JINN_GATEWAY_TOKEN`. Remote browsers pair with short-lived, single-use codes and receive device-scoped HttpOnly cookies.

## Operational limits

Jinn serializes turns within one session, but different sessions may run concurrently. Engine/provider quotas still apply. Provider-limit handling can wait or, when explicitly configured for Claude, fall back to Codex.

Configuration fields alone are not guarantees. In the current source, `sessions.maxDurationMinutes`, global `sessions.maxCostUsd`, and employee `maxCostUsd` are parsed but are not enforced in the execution path. Treat them as inactive schema, not safety barriers. The observable employee budget gate is separate: when configured through the budget subsystem and usage reaches 100%, the session manager blocks that employee's turn; the 80% status is not surfaced as a production warning.

---
title: Workspaces API
description: Discover, create, start, and open isolated Jinn workspaces through the authenticated operator control plane.
since: "0.28.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/instances/create.ts
  - packages/jinn/src/instances/start.ts
  - packages/jinn/src/instances/access.ts
audience: [operator, contributor]
generated: false
---

Workspace mutations are operator-only control-plane actions. Employee session capabilities cannot create or start another workspace.

| Method and path                 | Input / response / side effect                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/instances`            | Returns active, pinned, or current workspace rows with `id`, registry `name`, `displayName`, `port`, `running`, `current`, and a server-resolved `switchUrl`. |
| `POST /api/instances`           | `{name,port?}`; creates and starts an isolated workspace, provisions matching access when possible, and returns 201 `{instance,launchUrl,warning?}`.          |
| `POST /api/instances/:id/start` | Starts a registered offline workspace and returns its running row plus an optional warning.                                                                   |

The server resolves launch URLs from the current browser origin and known access mappings. The browser does not guess localhost, proxy, or Tailscale ports.

Creation inherits the current gateway's host/auth posture, writes a new owner-only token before startup, and returns a one-use pairing credential inside the `launchUrl` fragment so the operator can land in onboarding without exposing the gateway bearer token.

```sh
curl -sS "$JINN_GATEWAY_URL/api/instances" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

curl -sS -X POST "$JINN_GATEWAY_URL/api/instances" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Studio Ops","port":7780}'

curl -sS -X POST "$JINN_GATEWAY_URL/api/instances/$WORKSPACE_ID/start" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
```

The `launchUrl` contains a short-lived credential. Treat it as sensitive and do not log, persist, or send it to another service.

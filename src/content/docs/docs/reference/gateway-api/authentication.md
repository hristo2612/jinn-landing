---
title: Authentication
description: Discover the gateway, use bearer authentication, pair browsers, and understand operator versus session authority.
since: "0.23.0"
source:
  - packages/jinn/src/gateway/auth.ts
  - packages/jinn/src/gateway/gateway-info.ts
  - packages/jinn/src/gateway/api.ts
audience: [operator, agent, contributor]
generated: false
---

The live gateway writes `host`, `port`, `pid`, hook secret, and bearer `token` to `~/.jinn/gateway.json` with mode `0600`. Spawned agents receive the reachable URL and token as `JINN_GATEWAY_URL` and `JINN_GATEWAY_TOKEN`.

For operator scripts:

```sh
curl "$JINN_GATEWAY_URL/api/sessions?limit=0" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
```

Use the bearer scheme exactly. Invalid/missing auth returns JSON with 401 or 403, depending on whether authentication or operation authority failed.

## Auth policy

`GET /api/status` is public. Pair/bootstrap/logout and `POST /api/workflow-events` perform route-local auth. Other API and WebSocket routes require gateway authentication when configured or network-exposed. Command-line mutations should always send the bearer token, including on loopback.

Bearer auth is operator authority. Built-in MCP tools add a session identity and capability so the gateway can enforce descendant, Todo, approval, and control-plane boundaries. Do not teach an employee to strip those headers or fall back to an operator bearer call when a typed tool refuses it.

## Pairing routes

| Method and path                | Authority                    | Input              | Response and side effect                                                                                            |
| ------------------------------ | ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `GET /api/auth/state`          | Public                       | none               | Authentication/exposure state; no write.                                                                            |
| `POST /api/auth/pairing-codes` | Authenticated browser cookie | empty JSON         | `{status, code, expiresAt, ttlSeconds}`; creates a single-use five-minute code. Gateway bearer callers receive 403. |
| `POST /api/auth/pair`          | Public exchange              | `{code}`           | Sets device ID/secret HttpOnly cookies and returns the device. Invalid/expired codes return 401.                    |
| `GET /api/auth/devices`        | Operator                     | none               | `{devices:[…]}`.                                                                                                    |
| `DELETE /api/auth/devices/:id` | Operator                     | path ID            | Revokes the device; 404 if absent.                                                                                  |
| `POST /api/auth/logout`        | Current browser              | empty body allowed | Revokes current device and clears cookies.                                                                          |

Each curated route, with source-verified method and body:

```sh
# Public auth state
curl -sS "$JINN_GATEWAY_URL/api/auth/state"

# Mint from an already authenticated browser cookie, then exchange remotely
curl -sS -X POST "$JINN_GATEWAY_URL/api/auth/pairing-codes" -b operator-cookies.txt -H "Content-Type: application/json" -d '{}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/auth/pair" -H "Content-Type: application/json" -d '{"code":"PAIRING_CODE"}' -c device-cookies.txt

# Inspect or revoke a paired device
curl -sS "$JINN_GATEWAY_URL/api/auth/devices" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X DELETE "$JINN_GATEWAY_URL/api/auth/devices/$DEVICE_ID" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

# Revoke the current browser cookie credential
curl -sS -X POST "$JINN_GATEWAY_URL/api/auth/logout" -b device-cookies.txt
```

Pairing cookies are browser credentials, not API bearer tokens. The server stores hashed device secrets in `auth-devices.json`.

At the pinned source commit, `jinn pair` still sends the gateway bearer and is refused by this invariant. Use Settings in an authenticated browser until the CLI path is aligned.

---
title: Authentication
description: Discover the gateway, use bearer authentication, pair browsers, and understand operator versus session authority.
since: "0.23.0"
source:
  - packages/jinn/src/gateway/auth.ts
  - packages/jinn/src/gateway/pairing-challenge.ts
  - packages/jinn/src/gateway/gateway-info.ts
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/shared/home.ts
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

`GET /api/status` and `GET /api/auth/state` are public. The pairing and bootstrap routes (`/api/auth/pairing-challenges`, `/api/auth/pairing-codes`, `/api/auth/pair`, `/api/auth/logout`, plus the internal local-bootstrap handshake) and `POST /api/workflow-events` perform route-local auth. Other API and WebSocket routes require gateway authentication when configured or network-exposed. Command-line mutations should always send the bearer token, including on loopback.

Bearer auth is operator authority. Built-in MCP tools add a session identity and capability so the gateway can enforce descendant, Todo, approval, and control-plane boundaries. Do not teach an employee to strip those headers or fall back to an operator bearer call when a typed tool refuses it.

## Pairing routes

| Method and path                     | Authority                                        | Input                          | Response and side effect                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/auth/state`               | Public                                           | none                           | `{authRequired, authenticated, canBootstrapLocal, networkExposed, instance}`; no write. `instance` is the resolved instance name so a browser can show the exact pair command.                           |
| `POST /api/auth/pairing-challenges` | Loopback only                                    | empty JSON                     | `{challengeId, nonce, path, expiresAt, ttlSeconds}`; opens a 10-second filesystem-ownership challenge. The caller proves same-user control by writing `nonce` to `path` (mode `0600` under `JINN_HOME`). |
| `POST /api/auth/pairing-codes`      | Authenticated browser cookie, or challenge proof | empty JSON, or `{challengeId}` | `{status, code, expiresAt, ttlSeconds}`; creates a single-use five-minute code. Gateway bearer callers receive 403; without a `challengeId`, an authenticated browser cookie is required.                |
| `POST /api/auth/pair`               | Public exchange                                  | `{code}`                       | Sets namespaced device ID/secret HttpOnly cookies and returns the device. Invalid/expired codes return 401.                                                                                              |
| `GET /api/auth/devices`             | Operator                                         | none                           | `{devices:[…]}`.                                                                                                                                                                                         |
| `DELETE /api/auth/devices/:id`      | Operator                                         | path ID                        | Revokes the device; 404 if absent. Clears cookies when the current browser is removed.                                                                                                                   |
| `POST /api/auth/logout`             | Current browser                                  | empty body allowed             | Revokes current device and clears cookies.                                                                                                                                                               |

Each curated route, with source-verified method and body:

```sh
# Public auth state, including the instance name for the pairing hint
curl -sS "$JINN_GATEWAY_URL/api/auth/state"

# Mint from an already authenticated browser cookie, then exchange remotely
curl -sS -X POST "$JINN_GATEWAY_URL/api/auth/pairing-codes" -b operator-cookies.txt -H "Content-Type: application/json" -d '{}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/auth/pair" -H "Content-Type: application/json" -d '{"code":"PAIRING_CODE"}' -c device-cookies.txt

# The CLI mints without the bearer: open a local challenge, write the nonce, then redeem it.
# `jinn pair` (or `jinn -i <instance> pair`) performs these two calls plus the filesystem proof for you.

# Inspect or revoke a paired device
curl -sS "$JINN_GATEWAY_URL/api/auth/devices" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X DELETE "$JINN_GATEWAY_URL/api/auth/devices/$DEVICE_ID" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

# Revoke the current browser cookie credential
curl -sS -X POST "$JINN_GATEWAY_URL/api/auth/logout" -b device-cookies.txt
```

Pairing cookies are browser credentials, not API bearer tokens. The server stores hashed device secrets in `auth-devices.json`.

Session cookies are namespaced per instance. The default `jinn` home uses `jinn_auth` and `jinn_device`; a named instance under `~/.<name>` uses `jinn_auth_<name>` and `jinn_device_<name>`. Cookies are scoped by host but not by port (RFC 6265), so this keeps two gateways co-hosted on one machine from clobbering each other's session.

`jinn pair` now completes locally without the operator bearer: it opens a filesystem-ownership challenge, writes the returned nonce under the instance home, and redeems it for a pairing code. Pair a non-default instance with `jinn -i <instance> pair`; `GET /api/auth/state` reports the matching `instance` name so a browser can render the exact command.

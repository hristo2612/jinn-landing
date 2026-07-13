---
title: Pair Another Device
description: Expose Jinn deliberately, mint a short-lived code locally, pair a browser, and revoke it later.
since: "0.23.0"
source:
  - packages/jinn/src/gateway/auth.ts
  - packages/jinn/src/cli/pair.ts
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/gateway/server.ts
audience: [operator]
generated: false
---

Pairing authorizes a browser to a network-exposed Jinn gateway. It is not a tunnel: first provide a LAN or private-network route to the host.

## Bind safely

Set a reachable host and keep authentication enabled:

```yaml
gateway:
  host: "0.0.0.0"
  port: 7777
  authRequired: true
```

Restart Jinn. The gateway refuses unauthenticated network exposure unless you deliberately set the unsafe escape hatch.

## Mint a code from an authenticated browser

Open Settings on the gateway host in an already authenticated browser and use the pairing panel. Codes are single-use and expire after five minutes. The gateway deliberately refuses bearer-token attempts to mint browser credentials.

At the pinned source commit, `jinn pair` still sends that refused bearer credential and returns an error. Do not use it as the pairing path until the CLI and gateway authority model are aligned.

On the other device, open the gateway's private-network URL and enter the code. A successful exchange stores two HttpOnly, SameSite=Lax cookies: a device ID and a device-scoped secret. The server stores only the hashed device secret in `auth-devices.json`.

## Review and revoke

```sh
jinn unpair
jinn unpair DEVICE_ID
```

Without an ID, `unpair` lists paired browsers and their last-seen metadata. With an ID, it revokes that device. The Settings pairing panel uses the same API.

The long-lived gateway bearer token is operator-grade and is not the normal remote-browser credential. Do not copy `gateway.json` to another device. Use the one-time pairing exchange so each browser can be revoked independently.

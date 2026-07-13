---
title: Engines and Limits API
description: Discover valid engine, model, effort, and provider-limit values before creating a session.
since: "0.23.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/shared/models.ts
  - packages/jinn/src/shared/engine-limits.ts
audience: [operator, agent, contributor]
generated: false
---

Use these authenticated read routes before sending session overrides.

| Method and path                      | Response                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/engines`                   | `{default,engines}`. Each engine registry entry includes availability, default model, effort mechanism, and model capability records. |
| `GET /api/engine-limits?engine=name` | `{generatedAt,default,engines}`. The optional filter requests one engine snapshot.                                                    |

```sh
curl -sS "$JINN_GATEWAY_URL/api/engines" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/engine-limits?engine=claude" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
```

`GET /api/engines` returns `{default,engines}`. Registry `available` means the configured engine executable was discovered; it does not prove provider authentication. Model IDs and effort levels are exact strings. Omit overrides to use defaults, or select only a combination declared by the registry.

`GET /api/engine-limits` returns `{generatedAt,default,engines}`. Limits can be live, cached, static, unsupported, or error snapshots depending on the provider CLI. They are observations, not execution caps; configured session and employee budget fields are not runtime-enforced limits at this source pin.

The mutation/refresh routes are intentionally outside this curated discovery contract. Use the two read routes above whenever configuration may have changed.

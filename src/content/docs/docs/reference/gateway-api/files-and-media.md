---
title: Files and Media API
description: Upload managed files, attach outputs to sessions, read bounded content, and understand operator-only file authority.
since: "0.18.0"
source:
  - packages/jinn/src/gateway/files.ts
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/sessions/registry.ts
audience: [operator, agent, contributor]
generated: false
---

Jinn manages files under instance `files/` and date/session-bucketed `uploads/`. Paths and filenames are sanitized and served only from those roots.

| Method and path                      | Authority                           | Inputs / response / side effects                                                                                                                                                                                   |
| ------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/files`                    | operator or capability-bound upload | multipart file, or JSON containing exactly one of `content`, `url`, or `path`, plus optional metadata. Creates a managed file. URL fetch blocks private/loopback targets; custom paths/open require opt-in config. |
| `GET /api/files`                     | operator                            | Lists managed metadata.                                                                                                                                                                                            |
| `GET /api/files/:id/meta`            | operator                            | One metadata record.                                                                                                                                                                                               |
| `GET /api/files/:id`                 | operator                            | Streams the file; 404 absent.                                                                                                                                                                                      |
| `GET /api/files/read?path=…`         | operator                            | Reads bounded text or returns binary/too-large metadata; only managed roots.                                                                                                                                       |
| `POST /api/sessions/:id/attachments` | current session or operator         | multipart, or JSON containing one of `path`, `content`, or `url`, plus optional filename/text. Copies under the session upload root and inserts an assistant media message.                                        |

Source-verified invocations for every curated route:

```sh
# Upload caller-owned bytes and retain the managed ID
FILE_ID="$(
  curl -sS -X POST "$JINN_GATEWAY_URL/api/files" \
    -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
    -F "file=@./report.pdf" | jq -er '.id'
)"

# Attach that managed ID to a session follow-up
curl -sS -X POST "$JINN_GATEWAY_URL/api/sessions/$SESSION_ID/message" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @- <<JSON
{"message":"Review attachment.","attachments":["$FILE_ID"]}
JSON

# Or upload caller-owned bytes directly into the session
curl -sS -X POST "$JINN_GATEWAY_URL/api/sessions/$SESSION_ID/attachments" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
  -F "file=@./report.pdf" \
  -F "text=Verified report"

# Inspect the managed file
curl -sS "$JINN_GATEWAY_URL/api/files" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/files/$FILE_ID/meta" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/files/$FILE_ID" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -o report-copy.pdf
curl -sS --get "$JINN_GATEWAY_URL/api/files/read" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" --data-urlencode "path=files/notes.txt"
```

`POST /api/files` returns HTTP 201 `{id,filename,…}`. The managed-ID follow-up returns `{status,sessionId}`. Direct session multipart returns HTTP 201 `{id,media,message:{role}}`; the dashboard renders supported image/audio media inline and other files as attachments.

Caller-relative JSON paths are unsafe for external clients because `path` is resolved in the gateway daemon's working environment, not the curl caller's directory. Send caller-owned bytes as multipart or pass a managed file ID instead.

Capability-bound sessions cannot use operator file read, transfer, or delete routes to explore the local filesystem. They receive dedicated managed upload/attachment tools. `gateway.allowFileCustomPaths` and `allowFileOpen` default false; enabling them widens local side effects and should be deliberate.

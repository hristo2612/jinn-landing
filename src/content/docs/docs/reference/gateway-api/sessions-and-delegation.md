---
title: Sessions and Delegation API
description: Create, inspect, resume, message, stop, and delegate sessions through the curated public API.
since: "0.1.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/sessions/registry.ts
  - packages/jinn/src/sessions/queue.ts
audience: [operator, agent, contributor]
generated: false
---

All examples use operator bearer auth. Responses serialize the durable session record; fields include `id`, engine/model/effort, employee, parent, status, timestamps, cost/usage, and transport state.

| Method and path                  | Authority                             | Input                                                                                    | Response / errors / side effects                                                                                                                                                                 |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/sessions`              | authenticated read                    | `q`, or `group`, `offset`, `limit`; `limit=0` lists all                                  | Array for search/group/all modes; otherwise `{sessions,counts,perGroup}`. No write.                                                                                                              |
| `GET /api/sessions/:id`          | authenticated read                    | `messages=0`; `last=N` for bounded tail                                                  | Session plus messages; 404 if absent. May schedule Claude transcript backfill.                                                                                                                   |
| `GET /api/sessions/:id/messages` | authenticated read                    | `before`, `limit`                                                                        | Paged older messages.                                                                                                                                                                            |
| `POST /api/sessions`             | operator or capability-bound session  | `prompt` or `message`; optional employee/engine/model/effort/parent/attachments          | 201 session, synchronously `running` when engine exists. Unknown employee/selection returns 400; unavailable engine creates an error session. Dispatches asynchronously.                         |
| `POST /api/sessions/:id/message` | operator or identified agent          | `message` or `prompt`; optional attachments                                              | `{status:"queued",sessionId}`. Resumes interrupted sessions; may interrupt a running user turn; callbacks queue.                                                                                 |
| `GET /api/sessions/:id/children` | authenticated read                    | none                                                                                     | Child sessions.                                                                                                                                                                                  |
| `POST /api/sessions/:id/stop`    | operator; agents only for descendants | empty body                                                                               | `{status:"stopped",sessionId}` and interrupts engine/queue.                                                                                                                                      |
| `POST /api/delegations`          | operator or identified session        | `task` and either employee or engine; optional title/parent/Todo/attachments/idempotency | 201 `{workItemId,sessionId,employee,engine,model,effortLevel,status,title}`. Mints/reuses Todo, links session, dispatches. Conflicts return 409; unavailable engine 502 while preserving intent. |

Source-verified invocations for every curated route:

```sh
# List and inspect sessions with bounded message reads
curl -sS "$JINN_GATEWAY_URL/api/sessions?limit=0" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/sessions/$SESSION_ID?last=8" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/sessions/$SESSION_ID/messages?before=$MESSAGE_ID&limit=100" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/sessions/$SESSION_ID/children" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

# Create, continue, or stop a session
curl -X POST "$JINN_GATEWAY_URL/api/sessions" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employee":"assistant","prompt":"Inspect the release notes and summarize risks."}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/sessions/$SESSION_ID/message" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"message":"Report only newly verified evidence."}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/sessions/$SESSION_ID/stop" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

# Atomically mint/reuse a Todo, link a child session, and dispatch it
curl -sS -X POST "$JINN_GATEWAY_URL/api/delegations" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"task":"Verify the release artifact and retain evidence.","employee":"assistant","title":"Verify release artifact","idempotencyKey":"verify-release-v1"}'
```

The response is an acknowledgement, not the final answer. Poll `GET /api/sessions/:id?last=8` until status is `idle`, `error`, or `interrupted`, or subscribe to the authenticated WebSocket.

Operator-only destructive/metadata routes include delete, duplicate, reset, queue cancellation/pause, and engine/model patches. They are intentionally omitted from the agent protocol.

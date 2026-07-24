---
title: Workflows and Triggers API
description: Curated v2 definition, run, attempt, approval, recovery, and authenticated event endpoints.
since: "0.26.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/gateway/workflow-api.ts
  - packages/jinn/src/workflows/model.ts
  - packages/jinn/src/workflows/repository.ts
  - packages/jinn/src/workflows/service.ts
audience: [operator, agent, contributor]
generated: false
---

The v2 API is rooted at `/api/workflows`. Writes require gateway authentication; identified employee calls also retain their session capability. Definitions and run evidence live under the instance's `workflow-evidence/`.

## Definitions and runs

| Method and path                              | Input / response / side effect                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `GET /api/workflows`                         | Filters `cursor`, `limit`, `enabled`, and `retired`; returns `{items,nextCursor}` summaries. |
| `POST /api/workflows`                        | `{id,title,description?}`; creates a disabled draft and returns it with 201.                 |
| `GET /api/workflows/:id`                     | Returns one full definition; 404 when absent.                                                |
| `PUT /api/workflows/:id`                     | `{definition,expectedRevision}`; validates and replaces the graph. Stale revision is 409.    |
| `POST /api/workflows/:id/duplicate`          | `{id,title}`; copies a definition as a new draft.                                            |
| `POST /api/workflows/:id/enable`             | `{expectedRevision}`; validates and enables.                                                 |
| `POST /api/workflows/:id/disable`            | `{expectedRevision}`; prevents new runs.                                                     |
| `POST /api/workflows/:id/retire`             | `{expectedRevision}`; retires without deleting history.                                      |
| `GET /api/workflows/:id/runs`                | Cursor page; filters include status, trigger kind, time range, and text.                     |
| `POST /api/workflows/:id/runs`               | `{input,idempotencyKey?}`; starts the enabled manual trigger and returns a run with 201.     |
| `GET /api/workflows/:id/runs/:runId`         | Full durable run, nodes, attempts, and receipts.                                             |
| `POST /api/workflows/:id/runs/:runId/cancel` | Optional `{reason}`; requests cancellation and stops active attempts.                        |
| `POST /api/workflows/:id/runs/:runId/rerun`  | `{definition:"original"                                                                      | "current",idempotencyKey}`; creates a replay with 201. |

Source-verified definition/run invocations:

```sh
curl -sS "$JINN_GATEWAY_URL/api/workflows?enabled=true&limit=50" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/workflows/release-review" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X POST "$JINN_GATEWAY_URL/api/workflows/release-review/runs" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"input":{"candidate":"v0.28.2"},"idempotencyKey":"release-v0.28.2"}'
curl -sS "$JINN_GATEWAY_URL/api/workflows/release-review/runs/$RUN_ID" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
```

Use the dashboard editor or CLI for definition writes. The JSON schema is strict, capped at 256 KiB, and uses `expectedRevision` for optimistic locking.

## Approval, retry, and attempt routes

| Method and path                                                                 | Input / response / side effect                                                                                        |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `POST /api/workflows/:id/runs/:runId/nodes/:nodeId/approval`                    | `{decision:"approve"                                                                                                  | "reject",expectedRevision,reason?}`; resolves one parked approval. |
| `POST /api/workflows/:id/runs/:runId/nodes/:nodeId/retry`                       | `{idempotencyKey}`; retries an eligible failed node.                                                                  |
| `GET /api/workflows/:id/runs/:runId/nodes/:nodeId/attempts/:attempt/transcript` | Returns the bounded attempt transcript.                                                                               |
| `POST /api/workflows/attempts/submit`                                           | Session-capability only. `{outcome?,fields?,summary?}` completes the caller's active attempt after output validation. |
| `POST /api/workflows/attempts/extend`                                           | Session-capability only. Optional `{reason}` requests a bounded deadline extension.                                   |

Prefer the typed `workflow_submit_output` and `workflow_extend_deadline` MCP tools inside employee sessions. Ending a turn does not complete an employee node.

## Event ingress

```sh
curl -X POST "$JINN_GATEWAY_URL/api/workflows/events/ticket.created" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fireId":"ticket-1042","payload":{"priority":"high"}}'
```

`POST /api/workflows/events/:eventName` requires normal gateway authentication and returns HTTP 202 with an array of started runs. The array is empty when no enabled event trigger matches. The `fireId` is required and provides idempotent replay behavior; malformed bodies return 422.

---
title: Workflows and Triggers API
description: Curated definition, run, gate, binding, and authenticated event endpoints for Workflow operators.
since: "0.26.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/workflows/definition-store.ts
  - packages/jinn/src/workflows/custom-triggers.ts
  - packages/jinn/src/workflows/run-store.ts
audience: [operator, agent, contributor]
generated: false
---

Workflow routes require a configured evidence root. The default is the instance's `workflow-evidence/`; an invalid explicit override disables the subsystem and surfaces a reason.

## Definitions and runs

| Method and path                                               | Authority            | Inputs / response / side effects                                                                          |
| ------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /api/workflow-definitions`                               | read                 | `{definitions,evidenceConfigured,evidenceReason?}`. Treat false evidence state as unavailable, not empty. |
| `POST /api/workflow-definitions/plan`                         | authenticated author | Authoring input; returns a normalized plan without saving.                                                |
| `POST /api/workflow-definitions/mutate`                       | definition authority | Mutation request; validates and persists graph/version.                                                   |
| `GET /api/workflow-definitions/:id`                           | read                 | One definition; 404 absent.                                                                               |
| `POST /api/workflow-definitions/:id/run`                      | run authority        | optional `input` and `idempotencyKey`; creates run and starts ready nodes.                                |
| `POST /api/workflow-runs/by-name`                             | run authority        | `{name,input?,idempotencyKey?}`; returns the run record.                                                  |
| `GET /api/workflow-definitions/:id/runs/:runId`               | read                 | Durable run plus receipts.                                                                                |
| `POST /api/workflow-definitions/:id/runs/:runId/resolve-gate` | approval authority   | decision payload; resolves only a parked run.                                                             |

Source-verified definition/run invocations:

```sh
curl -sS "$JINN_GATEWAY_URL/api/workflow-definitions" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X POST "$JINN_GATEWAY_URL/api/workflow-definitions/plan" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" --data-binary @workflow-authoring-input.json
curl -sS -X POST "$JINN_GATEWAY_URL/api/workflow-definitions/mutate" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" --data-binary @workflow-mutation.json
curl -sS "$JINN_GATEWAY_URL/api/workflow-definitions/release-review" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X POST "$JINN_GATEWAY_URL/api/workflow-definitions/release-review/run" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"input":{"candidate":"v1"},"idempotencyKey":"release-v1-by-id"}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/workflow-runs/by-name" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"name":"release-review","input":{"candidate":"v1"},"idempotencyKey":"release-v1-by-name"}'
curl -sS "$JINN_GATEWAY_URL/api/workflow-definitions/$WORKFLOW_ID/runs/$RUN_ID" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X POST "$JINN_GATEWAY_URL/api/workflow-definitions/$WORKFLOW_ID/runs/$RUN_ID/resolve-gate" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"decision":"approve"}'
```

The plan file is free-form authoring input accepted by the planner. The mutation file must specify `operation:"create"` plus `definition`, or `operation:"update"` plus `workflowId` and `patch`; use `expectedVersion` for optimistic locking.

## Trigger bindings and ingress

| Method and path                       | Authority                                | Inputs / response / side effects                                                                                                         |
| ------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/workflow-triggers`          | authenticated read                       | `{triggers,evidenceConfigured,evidenceReason?}`; secret hashes are never returned.                                                       |
| `POST /api/workflow-triggers`         | target Workflow bind authority           | Binding body; creates one binding and returns a generated webhook secret once. Missing Workflow is 404; conflicts/invalid input are 4xx. |
| `DELETE /api/workflow-triggers/:name` | target Workflow bind authority           | Deletes the binding; 404 absent. Poll deletion also aborts its active executions.                                                        |
| `POST /api/workflow-events`           | gateway bearer or matching binding token | Event body; 202 outcomes and starts matching runs. Missing auth 401, no match 404, rate excess 429.                                      |

Source-verified trigger invocations:

```sh
curl -sS "$JINN_GATEWAY_URL/api/workflow-triggers" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X POST "$JINN_GATEWAY_URL/api/workflow-triggers" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"kind":"webhook","name":"ticket-created","event":"ticket.created","targetWorkflowId":"release-review"}'
curl -X POST "$JINN_GATEWAY_URL/api/workflow-events" \
  -H "x-jinn-workflow-event-token: $WORKFLOW_EVENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"ticket.created","payload":{"priority":"high"},"fireRef":"event-1042"}'
curl -sS -X DELETE "$JINN_GATEWAY_URL/api/workflow-triggers/ticket-created" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
```

Accepted events return 202 `{outcomes:[…]}`. Missing auth returns 401, rate excess 429 with `resetAt`, no matching binding 404, and malformed bodies 400. The endpoint authenticates a bearer-style secret; it does not verify payload signatures.

---
description: Machine-readable operating context for coding agents.
route: /agents.md
generated: false
---

# Jinn gateway protocol for agents - 0.26.0

This file is the compact, machine-readable contract for an agent or operator tool talking to the pinned Jinn `0.26.0` gateway. Jinn is local-first: the gateway, company files, session registry, Todo ledger, Workflow evidence, and managed uploads live on the operator's machine.

## 1. Discover the gateway

Inside a Jinn-spawned session, use the injected environment:

```sh
BASE_URL="$JINN_GATEWAY_URL"
TOKEN="$JINN_GATEWAY_TOKEN"
```

Outside a spawned session, read `~/.jinn/gateway.json` (or `~/.<instance>/gateway.json`). It is mode `0600` and contains the live `host`, `port`, and operator bearer `token`. Ignore its hook `secret`; that authenticates an internal engine hook, not the public API. When `host` is `0.0.0.0` or `::`, use `127.0.0.1` locally.

Default base URL: `http://127.0.0.1:7777`.

Liveness needs no auth:

```sh
curl -sS "$BASE_URL/api/status"
```

Success is HTTP 200 `{status:"ok",uptime,port,engines,sessions,connectors}`. Do not infer that an engine is authenticated merely because it is installed.

## 2. Authenticate and preserve caller authority

Operator scripts send:

```text
Authorization: Bearer <gateway token>
```

The bearer token is operator-grade. Never print, persist in a work product, send to another service, or place it in a prompt. Prefer the built-in Jinn MCP tools inside employee sessions: the MCP server adds a session-scoped capability and caller identity so the gateway can enforce descendant, Todo, Workflow, approval, and control-plane boundaries.

Do not remove MCP identity headers or retry a refused employee action with the raw operator bearer token. A lost/invalid tool identity fails closed with 403.

Remote browsers do not receive the bearer token. Mint a single-use five-minute code from an already authenticated browser in Settings, or run `jinn pair` (`jinn -i <instance> pair` for a named instance), which proves local `JINN_HOME` ownership through a filesystem challenge instead of sending the bearer; gateway bearer tokens are deliberately refused by `POST /api/auth/pairing-codes`. The remote browser exchanges `{ "code": "…" }` at `POST /api/auth/pair` and receives device-scoped HttpOnly cookies. Those cookies are namespaced per instance (`jinn_auth`/`jinn_device` for the default home, `jinn_auth_<name>`/`jinn_device_<name>` under `~/.<name>`), so co-hosted gateways do not clobber each other. `GET /api/auth/state` reports the resolved `instance` name for the pairing hint.

`GET /api/engines` returns `{default,engines}`. `GET /api/engine-limits` returns `{generatedAt,default,engines}`. `GET /api/org` returns `{departments,employees,hierarchy}`. Discover these before overriding employee defaults.

## 3. HTTP conventions and errors

- JSON requests: `Content-Type: application/json`.
- Success: 200; creation: 201; accepted asynchronous event: 202.
- 400: missing/invalid input or illegal lifecycle edge.
- 401: missing/invalid authentication, including Workflow event token. Missing/invalid required auth is HTTP 401 `{error:"Missing or invalid gateway auth token"}`.
- 403: authenticated caller lacks operation authority or an identified tool lost its capability.
- 404: record/binding/route not found; authenticated Workflow event with no matching binding also returns 404.
- 409: durable conflict, live attempt, terminal Todo, missing pending approval, or gate/run state mismatch.
- 413: request/file body exceeds a route limit.
- 429: Workflow event or agent-relay rate limit; inspect `resetAt` when returned and retry after it, with jitter.
- 500: server/storage failure. A delegation error may include preserved IDs and a recovery hint.
- 502: selected delegation engine unavailable; the minted backlog Todo remains.
- 503: required Workflow evidence/authority substrate unavailable.

Errors use `{ "error": "human-readable detail" }` and may include IDs, status, hints, outcomes, or unresolved attachments. Do not blind-retry 400/403/404/409. Use an idempotency key for retryable creation. Network failure after a write is ambiguous: look up the durable record before retrying.

Session execution is asynchronous. A 201/queued response acknowledges dispatch, not completion.

## 4. Create, inspect, resume, and message a session

Create:

```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "employee": "assistant",
  "prompt": "Inspect the release candidate and return evidence-backed risks.",
  "parentSessionId": "optional-parent-id",
  "model": "optional-registered-model",
  "effortLevel": "optional-valid-level",
  "attachments": ["optional-managed-file-id"]
}
```

`prompt` or `message` is required. `employee` must match `GET /api/org`; its engine/model/effort defaults apply unless a supplied override validates. Omit `employee` for a direct session and optionally send `engine`. A direct response has this stable shape (IDs/timestamps/title vary):

```json
{
  "id": "session-id",
  "engine": "claude",
  "model": "opus",
  "effortLevel": "medium",
  "employee": null,
  "parentSessionId": null,
  "status": "running",
  "createdAt": "ISO-8601",
  "lastActivity": "ISO-8601",
  "lastError": null
}
```

For a direct session, `employee:null` is stable. The example's engine, model, and effortLevel values vary by configuration; discover valid selections before relying on or overriding them.

The serialized record may include transport, queue, cost, token, source, engine-session, and Todo fields. Treat unknown additive fields as forward-compatible.

Read latest state and messages:

```sh
curl -sS "$BASE_URL/api/sessions/$SESSION_ID?last=8" \
  -H "Authorization: Bearer $TOKEN"
```

`GET /api/sessions/:id?messages=0` omits messages; bounded-tail reads also include `messagesPage:{hasOlder}`. `GET /api/sessions/:id/messages?before=<messageId>&limit=100` → `{messages,hasOlder}`. `GET /api/sessions/:id/children` lists children. `GET /api/sessions?limit=0` lists every session; default `GET /api/sessions` → `{sessions,counts,perGroup}`.

Continue or resume:

```http
POST /api/sessions/:id/message
Authorization: Bearer <token>
Content-Type: application/json

{ "message": "Re-check the failing item and report only new evidence." }
```

Success is HTTP 200 `{"status":"queued","sessionId":"…"}`. A message resumes an interrupted session. A genuine operator message can interrupt a currently running turn when configured; internal child notifications queue and never interrupt.

Completion states: `idle` means no active turn, `error` means failed, `interrupted` means stopped/resumable, `waiting` means provider-limit wait, and `running` means active/queued transport work. Read the final messages; `idle` is not quality approval.

## 5. Delegate tracked work

Use the atomic delegation route when work should exist in the Todo ledger:

```http
POST /api/delegations
Authorization: Bearer <token>
Content-Type: application/json

{
  "task": "Compare three deployment options. Cite primary evidence and recommend one.",
  "employee": "researcher",
  "title": "Compare deployment options",
  "parentSessionId": "optional-parent-id",
  "workItemId": "optional-existing-wi-id",
  "attachments": [],
  "idempotencyKey": "deployment-comparison-2026-07"
}
```

Supply `employee` or a bare `engine`. The route validates all input, creates or reuses the Todo, creates the child session, links the pair before dispatch, then starts the turn. HTTP 201:

```json
{
  "workItemId": "wi_0123abc456de",
  "sessionId": "session-id",
  "employee": "researcher",
  "engine": "claude",
  "model": "sonnet",
  "effortLevel": "medium",
  "status": "running",
  "title": "Compare deployment options"
}
```

Retrying the same caller-scoped `idempotencyKey` returns the original pair with `replayed:true`. If engine spawn fails, the Todo remains backlog. If linking fails, nothing is dispatched and both IDs are returned for recovery.

A child normally queues a completion callback to its parent. Callbacks are best-effort. If no callback arrives, poll `GET /api/sessions/:childId?last=N`. Send follow-up with the message route. Capability-bound agents may stop only their descendant sessions.

For quick untracked work, create a child with `POST /api/sessions` and `parentSessionId`. Do not create a duplicate Todo for temporary work already fully represented by the parent turn.

## 6. Work with Todos

List/search:

```sh
curl -sS "$BASE_URL/api/work-items?assignee=researcher&status=in_review" \
  -H "Authorization: Bearer $TOKEN"
```

The list envelope is `{workItems,total,totals,limit,offset,nextOffset}`.

Create intent without starting execution:

```http
POST /api/work-items

{
  "title": "Verify the release artifact",
  "body": "Run the documented checks and retain evidence.",
  "acceptance": "All checks pass and evidence is linked.",
  "assignee": "release-engineer",
  "department": "engineering",
  "verifyPolicy": { "mode": "verify", "maxRounds": 2 }
}
```

Response: HTTP 201 `{ "workItem": { … } }`. Creation cannot accept provenance or approval fields. Creating/assigning a Todo does not execute it; delegate with its `workItemId` to start an attempt.

Lifecycle values are `backlog`, `assigned`, `executing`, `in_review`, `done`, `blocked`, `escalated`, and `cancelled`. Identified agents update eligible owned work with:

```http
POST /api/work-items/:id/status

{ "status": "in_review", "note": "Verification evidence attached." }
```

Blocked/escalated require a note. Agents cannot cancel or self-review into done. `POST /api/work-items/:id/assign` takes `{ "assignee": "employee-name" }`. `GET /api/work-items/:id` returns `{workItem,spendUsd,events}`; `/sessions` returns linked attempts. Archive returns `{workItem,archived}` and is non-deleting: the Todo enters terminal `cancelled` state while its history remains.

## 7. Approval boundaries

Request approval only for a real decision boundary:

```http
POST /api/work-items/:id/approval/request

{
  "request": "Approve publishing the verified release.",
  "target": "optional-manager-or-root"
}
```

Do not attach approval-like keys to Todo create, assign, status, or archive calls. The gateway rejects them.

Decision:

```http
POST /api/work-items/:id/approval

{ "decision": "approve", "note": "Checks reviewed." }
```

Only the routed manager/root authority may decide through a session capability; an owner cannot decide their own approval. The authenticated operator can decide only when the approval is routed to the root/COO target or has been escalated to the operator/aCEO path. The routed authority opens that path with `POST /api/work-items/:id/approval/escalate` (optional `{reason}`). Native approval of reviewed work can complete the Todo; a mirrored Workflow approval resolves the parked run gate. A decision cannot undo an external side effect already performed: place gates before public, financial, irreversible, legal, or security-sensitive actions.

Operator-only control-plane actions are not ordinary approval requests. Employee sessions cannot mutate gateway config, auth devices, cron schedules, org files, connector reloads, skill deletion, destructive session state, or operator file reads merely because their prompt asks.

## 8. Run Workflows

Run a canonical name:

```http
POST /api/workflow-runs/by-name
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "release-review",
  "input": { "candidate": "v1" },
  "idempotencyKey": "release-review-v1"
}
```

Response is the durable run record containing at least `runId`, `workflowId`, and `status`. Use `jinn workflow run <name> --input '<json>' --idempotency-key <key> --json` when shell access is available.

Inspect `GET /api/workflow-definitions/:id/runs/:runId`. A parked run needs an authorized gate decision; do not edit evidence artifacts. Workflow definitions are validated graphs. Prefer typed MCP tools or the dashboard editor to raw mutation APIs.

Discovery envelopes are `GET /api/workflow-definitions` → `{definitions,evidenceConfigured,evidenceReason?}` and `GET /api/workflow-triggers` → `{triggers,evidenceConfigured,evidenceReason?}`.

## 9. Fire a Workflow event

The only public webhook ingress is:

```http
POST /api/workflow-events
Content-Type: application/json
x-jinn-workflow-event-token: <binding secret>

{
  "event": "ticket.created",
  "payload": { "priority": "high" },
  "fireRef": "ticket-1042"
}
```

The route also accepts the gateway bearer token. A binding token is a bearer-style shared secret, not a payload signature. Jinn does not verify HMAC, timestamp, or body digest. Generated secrets have a `jinn_wh_…` shape; storage retains only a SHA-256 hash and first-four/last-four preview. The full secret is returned once at binding creation.

Accepted: HTTP 202 `{ "outcomes": [ … ] }`. No matching binding: 404. Missing/invalid token: 401. Rate limit: 429. `payload` must be an object. Use a stable `fireRef` when the producer can retry.

## 10. Company MCP tools

The built-in `jinn` MCP server is attached per session on MCP-capable engines when enabled. Its capability identifies the calling session and fails closed when identity is absent. Discover tools with MCP `tools/list`; the pinned server includes `find_employees`, `list_employees`, `get_employee`, `delegate_task`, Todo tools such as `list_work_items`, Workflow tools such as `start_workflow_run`, `decide_work_item_approval`, knowledge search/read tools, and reference search. Tool names are the contract; use each returned input schema rather than guessing arguments.

Operator cron acknowledgements retain these shapes: `POST /api/cron/:id/trigger` → `{triggered:true,jobId,name,employee?,message}` and `DELETE /api/cron/:id` → `{deleted,name}`.

## 11. Files and attachments

Use managed file IDs in session/delegation `attachments`. To surface a produced file in chat:

Upload caller-owned bytes with `multipart/form-data` field `file` to `POST /api/files`, retain the returned managed `id`, and pass that ID in session/delegation `attachments`. To surface bytes directly in a session, send multipart `file` and optional `text` to `POST /api/sessions/:id/attachments`; it returns HTTP 201 managed metadata and inserts an assistant media message. Do not infer the daemon working directory or use caller-relative JSON paths. Capability-bound sessions must not use operator file-list/read/transfer/delete routes to inspect arbitrary local data.

## 12. Minimal reliable loop

1. Discover URL/token without logging them.
2. `GET /api/status`.
3. Discover employees with `GET /api/org`.
4. For tracked work, `POST /api/delegations` with an idempotency key.
5. Record returned Todo/session IDs.
6. End the parent turn and accept the callback; poll child latest messages only as fallback.
7. Read Todo/session evidence. Send focused follow-up if incomplete.
8. Move owned work to review; never self-approve.
9. Request the narrow approval before consequential external action.
10. Report final evidence and IDs, not secrets or raw internal logs.

Detailed reference:

- https://jinn.run/docs/reference/gateway-api/authentication/
- https://jinn.run/docs/reference/gateway-api/sessions-and-delegation/
- https://jinn.run/docs/reference/gateway-api/todos/
- https://jinn.run/docs/reference/gateway-api/workflows-and-triggers/
- https://jinn.run/docs/reference/gateway-api/files-and-media/

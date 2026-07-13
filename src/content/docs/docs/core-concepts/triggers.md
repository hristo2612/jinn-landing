---
title: Triggers
description: Start Workflows manually, on schedules, from Todo changes, authenticated webhooks, or polling bindings.
since: "0.26.0"
source:
  - packages/jinn/src/workflows/custom-triggers.ts
  - packages/jinn/src/workflows/cron-sync.ts
  - packages/jinn/src/workflows/todo-status-trigger.ts
  - packages/jinn/src/gateway/api.ts
audience: [operator, agent, contributor]
generated: false
---

Triggers convert an external or local event into a uniform Workflow run request. Jinn supports manual starts, Workflow-owned cron schedules, Todo-status bindings, webhook event bindings, and polling bindings.

Bindings are stored separately from the Workflow definition. This keeps one Workflow reusable with different event sources and lets trigger credentials be managed without embedding them in the graph.

## Webhook ingress

The only public event ingress is:

```text
POST /api/workflow-events
```

It accepts gateway bearer auth or a binding token in `x-jinn-workflow-event-token` (an Authorization bearer token is also accepted by the route). The mechanism is shared-secret authentication, not payload signing: Jinn does not verify an HMAC, timestamp, or body digest.

Webhook binding secrets use a `jinn_wh_…` shape. Jinn stores a SHA-256 hash and a first-four/last-four preview, verifies hashes with timing-safe comparison, and returns the full generated secret only when the binding is created.

The JSON body requires `event`; optional `payload` must be an object, and `fireRef` can identify a fire for deduplication. Matching filters decide which bindings start. An authenticated event with no matching binding returns 404; a valid accepted event returns 202 with outcomes.

## Schedule, Todo, and poll limits

Workflow cron jobs are managed desired state. Manual edits to their generated cron entries may be overwritten on the next definition sync. Todo triggers observe guarded status transitions. Poll triggers depend on their configured source and retained artifacts; they are not a general arbitrary-code scheduler.

Trigger acceptance means the event was routed, not that every downstream step succeeded. Follow the returned run IDs and inspect run evidence.

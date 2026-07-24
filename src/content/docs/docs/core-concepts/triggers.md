---
title: Triggers
description: Start v2 Workflows manually, on schedules, from Todo changes, authenticated events, or another Workflow.
since: "0.26.0"
source:
  - packages/jinn/src/workflows/model.ts
  - packages/jinn/src/workflows/trigger-service.ts
  - packages/jinn/src/gateway/workflow-api.ts
audience: [operator, agent, contributor]
generated: false
---

Triggers convert an external or local event into a durable Workflow run. v2 supports manual, schedule, event, Todo-status, and Workflow-call trigger nodes.

Trigger configuration is part of the versioned definition. Enabling a definition activates its triggers; disabling or retiring it prevents new runs while preserving history.

## Webhook ingress

The only public event ingress is:

```text
POST /api/workflows/events/:eventName
```

It requires normal gateway authentication. The JSON body contains a required stable `fireId` and an object `payload`. Every enabled event trigger whose `eventName` matches starts a run; a successful request returns HTTP 202 with an array of run records, which can be empty when nothing matches.

```sh
jinn workflow event ticket.created \
  --fire-id ticket-1042 \
  --payload '{"priority":"high"}' \
  --json
```

The event name is part of the URL and must match the definition exactly. The fire ID provides replay protection; reuse it when retrying the same producer event.

## Schedule, Todo, and Workflow-call limits

Schedule triggers use a cron expression and timezone. Todo-status triggers observe the durable Todo event stream. Workflow-call triggers accept only a validated caller identity and idempotency key from another running Workflow.

Trigger acceptance means a run was created, not that every downstream node succeeded. Follow the returned run IDs and inspect run evidence.

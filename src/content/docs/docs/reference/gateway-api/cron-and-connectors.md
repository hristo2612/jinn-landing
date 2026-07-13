---
title: Cron and Connectors API
description: Manage operator-owned schedules, inspect terminal run records, reload connector instances, and send connector messages.
since: "0.1.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/cron/jobs.ts
  - packages/jinn/src/cron/validation.ts
  - packages/jinn/src/shared/types.ts
audience: [operator, contributor]
generated: false
---

Cron mutations and connector reload are operator control-plane actions.

| Method and path                   | Inputs                   | Response / errors / side effects                                                                 |
| --------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `GET /api/cron`                   | none                     | Jobs enriched with latest run summary.                                                           |
| `POST /api/cron`                  | Cron job object          | 201 job; validates ID collision, schedule/timezone, persists atomically, reloads scheduler.      |
| `PUT /api/cron/:id`               | partial job object       | Updated job; preserves path ID and reloads scheduler.                                            |
| `DELETE /api/cron/:id`            | none                     | `{deleted,name}`; removes schedule, not historical run file.                                     |
| `POST /api/cron/:id/trigger`      | none                     | Immediate acknowledgement; background run starts.                                                |
| `GET /api/cron/:id/runs?limit=N`  | limit 1–500              | Newest terminal JSONL summaries; corrupt lines skipped.                                          |
| `GET /api/connectors`             | none                     | Connector health/capabilities.                                                                   |
| `POST /api/connectors/reload`     | empty                    | Restarts named connector instances from current config; returns started/stopped/errors.          |
| `POST /api/connectors/:name/send` | `{channel,text,thread?}` | Sends through configured connector; error if unknown/unhealthy. This is an external side effect. |

Source-verified invocations for every curated route:

```sh
# Inspect schedules and one job's terminal history
curl -sS "$JINN_GATEWAY_URL/api/cron" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/cron/weekly-review/runs?limit=20" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

# Create, patch, trigger, and remove an operator-authored job
curl -X POST "$JINN_GATEWAY_URL/api/cron" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"weekly-review","name":"Weekly review","enabled":true,"schedule":"0 10 * * 1","timezone":"UTC","employee":"assistant","prompt":"Review open Todos and report blockers."}'
curl -sS -X PUT "$JINN_GATEWAY_URL/api/cron/weekly-review" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"enabled":false}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/cron/weekly-review/trigger" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X DELETE "$JINN_GATEWAY_URL/api/cron/weekly-review" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

# Inspect, reload, and use a configured connector
curl -sS "$JINN_GATEWAY_URL/api/connectors" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X POST "$JINN_GATEWAY_URL/api/connectors/reload" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X POST "$JINN_GATEWAY_URL/api/connectors/slack/send" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"channel":"team-updates","text":"The approved release is live."}'
```

User-authored jobs require a useful prompt. Workflow-managed jobs use `managedBy:"workflow"` plus `workflowId`, are synchronized from definition desired state, and should not be edited through this surface.

Sending a connector message is public communication when the target is external. Obtain the required approval before invoking it; the API does not infer consent from the message text.

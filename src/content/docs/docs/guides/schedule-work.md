---
title: Schedule Work
description: Create a validated cron job, route reviewed delivery, trigger it manually, and inspect append-only run evidence.
since: "0.1.0"
source:
  - packages/jinn/src/cron/validation.ts
  - packages/jinn/src/cron/jobs.ts
  - packages/jinn/src/cron/scheduler.ts
  - packages/jinn/src/gateway/api.ts
audience: [operator, agent]
generated: false
---

Use cron for time-based starts. User-authored jobs live in `~/.jinn/cron/jobs.json`; the dashboard and Gateway API write the same store atomically.

Create a weekday review job:

```sh
curl -X POST "$JINN_GATEWAY_URL/api/cron" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "weekday-review",
    "name": "Weekday review",
    "enabled": true,
    "schedule": "0 9 * * 1-5",
    "timezone": "Europe/London",
    "employee": "assistant",
    "prompt": "Review open Todos, summarize blockers, and propose next actions."
  }'
```

Schedules use the parser provided by `node-cron`; timezone values must be valid IANA names. Duplicate job IDs are rejected using normalized, case-insensitive identity because IDs also name run-log files on case-insensitive filesystems.

For analytical or consequential output, schedule the COO/root employee and have it delegate, review, then deliver. Direct employee delivery is appropriate only when no review is needed.

Optional delivery is `{ "connector": "slack", "channel": "#operations" }`. Configure `cron.alertConnector`, `alertChannel`, and optional `alertThresholdMs` to route failed or slow-job warnings.

## Test and inspect

Trigger without waiting for the schedule:

```sh
curl -X POST "$JINN_GATEWAY_URL/api/cron/weekday-review/trigger" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
```

The response acknowledges the fire immediately; execution continues in the background. Inspect recent terminal run records:

```sh
curl "$JINN_GATEWAY_URL/api/cron/weekday-review/runs?limit=10" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
```

Run history is append-only JSONL. Corrupt partial lines are skipped rather than turning the entire history into a 500.

Do not hand-edit cron jobs with `managedBy: workflow`. Workflow definition sync owns those entries and will restore desired state.

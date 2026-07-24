---
title: Workflow CLI
description: Create, operate, inspect, and recover v2 Workflow definitions and runs from the command line.
since: "0.26.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/workflow.ts
audience: [operator, agent]
generated: false
---

`jinn workflow` drives v2 Workflow definitions and runs through the local gateway HTTP API. Every subcommand needs a set-up instance and running gateway. The CLI reads the gateway token from `gateway.json`; use the global `--instance` option to target another workspace.

Every command accepts `--json` for raw output.

## Definitions

| Command                                                              | Purpose                                           |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| `list [--cursor <cursor>] [--limit <number>]`                        | Page through definitions.                         |
| `get <workflowId>`                                                   | Read one definition.                              |
| `create --file <jsonFile>`                                           | Create from a JSON file.                          |
| `update <workflowId> --file <jsonFile> --expected-revision <number>` | Replace a definition with optimistic concurrency. |
| `duplicate <sourceId> --id <targetId> --title <title>`               | Copy a definition under a new identity.           |
| `retire <workflowId> --expected-revision <number>`                   | Permanently retire a definition.                  |
| `enable <workflowId> --expected-revision <number>`                   | Enable a validated definition.                    |
| `disable <workflowId> --expected-revision <number>`                  | Prevent new runs without deleting history.        |

Create a draft in the dashboard when possible; its editor produces the strict v2 schema.

## Runs

| Command                                                                               | Purpose                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `run <workflowId> [--input <json>] [--idempotency-key <key>]`                         | Start the enabled manual trigger.                |
| `runs <workflowId> [--cursor <cursor>] [--limit <number>] [--status <status>]`        | Page through run summaries.                      |
| `show-run <workflowId> <runId>`                                                       | Read one durable run with attempts and receipts. |
| `cancel <workflowId> <runId> [--reason <reason>]`                                     | Request cancellation and stop active attempts.   |
| `rerun <workflowId> <runId> --definition <original\|current> --idempotency-key <key>` | Replay against the frozen or current definition. |

`--input` and event payloads must be JSON objects. Idempotency keys make retries safe.

```sh
jinn workflow run release-review \
  --input '{"candidate":"v0.28.2"}' \
  --idempotency-key release-v0.28.2 \
  --json
jinn workflow show-run release-review <runId> --json
```

## Approvals and recovery

| Command                                                                                  | Purpose                         |
| ---------------------------------------------------------------------------------------- | ------------------------------- |
| `approve <workflowId> <runId> <nodeId> --expected-revision <number> [--reason <reason>]` | Approve a parked approval node. |
| `reject <workflowId> <runId> <nodeId> --expected-revision <number> [--reason <reason>]`  | Reject a parked approval node.  |
| `retry <workflowId> <runId> <nodeId> --idempotency-key <key>`                            | Retry an eligible failed node.  |

The expected revision prevents two operators from deciding the same stale run view.

## Events

`event <eventName> --fire-id <id> --payload <json>` sends an authenticated event to `POST /api/workflows/events/:eventName`. The fire ID is required for deduplication.

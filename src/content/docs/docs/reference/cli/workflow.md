---
title: Workflow CLI
description: Run and cancel canonical Workflow definitions against the local gateway from the command line.
since: "0.26.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/workflow.ts
audience: [operator, agent]
generated: false
---

`jinn workflow` drives Workflow runs through the local gateway HTTP API. Both subcommands need a set-up instance and a running gateway: they read the gateway auth token from `gateway.json` and, if it is missing, fail with a clear message telling you to start Jinn first.

## `jinn workflow run <name> [--input <json>] [--idempotency-key <key>] [--json]`

Starts a run of the canonical workflow named `<name>`. `--input` is a JSON object and is rejected if it is not valid JSON or not an object. `--idempotency-key` deduplicates repeated invocations so a retry does not double-start the same run. On success it prints `Started <runId> for <workflowId> (<status>).`; `--json` prints the full run record instead.

```sh
jinn workflow run daily-digest
jinn workflow run outreach --input '{"segment":"trial"}' --idempotency-key 2026-07-18
```

## `jinn workflow cancel <workflowId> <runId> [--reason <reason>] [--json]`

Cancels a live run and stops its run-owned phase sessions. `--reason` records why the run was cancelled. It prints `Cancelled <runId> ...` when the run is now cancelled, or `Cancellation requested ...` when the gateway accepted the request but the run is not yet in a cancelled state; `--json` prints the full run record.

```sh
jinn workflow cancel wf_abc run_123 --reason "superseded"
```

`workflowId` and `runId` are the identifiers from the run record (the output of `jinn workflow run --json`, or the web Workflows view).

---
title: Workflows
description: Understand editable Workflow graphs, durable run evidence, node execution, gates, and honest run states.
since: "0.26.0"
source:
  - packages/jinn/src/workflows/model.ts
  - packages/jinn/src/workflows/repository.ts
  - packages/jinn/src/workflows/runner.ts
  - packages/jinn/src/workflows/validation.ts
audience: [operator, agent, contributor]
generated: false
---

A Workflow is a reusable graph describing how work should run. It is not a long prompt and not a Todo. v2 definitions and runs live in the Workflow repository under the evidence root; runs retain immutable definition snapshots, attempts, receipts, and linked sessions.

The strict schema supports `trigger`, `employee`, `condition`, `merge`, `approval`, `wait`, and `end` nodes. Edges connect named source ports to a node's single input. Inputs and prior node outputs flow through explicit bindings, and the validator rejects dangling references, cycles, invalid ports, unsafe paths, and unknown configuration.

## Execution

A run activates ready nodes from a frozen definition revision. Employee nodes start sessions and remain active until the employee submits schema-validated output with `workflow_submit_output`; ending a turn alone does not complete the node. An employee waiting on delegated child work may end the turn and continue after the callback.

Employee nodes can bind employee, engine, model, and effort; declare bounded outputs; configure up to five retry attempts; and set a timeout. Active attempts receive escalating reminders and may request bounded deadline extensions. Independent ready branches run in parallel and merge nodes wait for all incoming branches.

Runs can be pending, running, waiting, completed, failed, or cancelled based on durable evidence. An approval node never appears complete before its decision. Operators can inspect attempt transcripts, send a message into an active attempt, cancel, retry an eligible node, or rerun against the original or current definition without rewriting history.

## Evidence root

The default evidence root is `<JINN_HOME>/workflow-evidence`. Startup creates the v2 repository there and imports only provably compatible v1 definitions as disabled drafts. Unsupported legacy definitions and historical runs stay untouched and are listed in `workflows/legacy-v1-import-report.json`.

## Limits

Workflow execution is local orchestration over agent sessions, not a transactional distributed system. External side effects performed by an employee cannot be rolled back by Jinn. Use idempotency keys and explicit approval gates around consequential steps.

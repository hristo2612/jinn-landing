---
title: Workflows
description: Understand editable Workflow graphs, durable run evidence, node execution, gates, and honest run states.
since: "0.26.0"
source:
  - packages/jinn/src/workflows/definition.ts
  - packages/jinn/src/workflows/run-store.ts
  - packages/jinn/src/workflows/advance.ts
  - packages/jinn/src/workflows/run-reconciler.ts
audience: [operator, agent, contributor]
generated: false
---

A Workflow is a reusable graph describing how work should run. It is not a long prompt and not a Todo. Definitions live as validated JSON artifacts under the configured Workflow evidence root; runs produce durable receipts and linked sessions.

The editable schema supports `trigger`, `step`, `gate`, `switch`, `fail`, and `wait` nodes connected by sequence, handoff, loop, conditional, and error-lane edges. Actor-bearing steps can target an employee or a raw engine. The validator rejects unknown or inert configuration instead of silently ignoring it.

## Execution

A run activates ready nodes from a frozen definition version. Engine steps create or reuse sessions according to their session mode, collect a bounded handoff/output, and settle receipts. Independent ready steps may fan out up to the definition's concurrency limit, capped at eight.

Step options include model/effort overrides, output mode, bounded retries, timeout, error behavior, and session mode. Options that cannot be honored together are rejected at authoring time. For example, follow-up session modes refuse per-step model overrides and fire-and-forget output.

Runs can be `running`, parked at a gate, completed, or failed based on evidence. A gate never appears complete before its decision. Editing a definition does not rewrite historical run receipts.

## Evidence root

Workflow APIs report `evidenceConfigured: false` or `503` where appropriate when the evidence root is absent. An existing route is not proof that a Workflow store is configured.

## Limits

Workflow execution is local orchestration over agent sessions, not a transactional distributed system. External side effects performed by an employee cannot be rolled back by Jinn. Use idempotency keys and explicit approval gates around consequential steps.

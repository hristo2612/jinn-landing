---
title: Todos
description: Use Jinn's durable work ledger, guarded lifecycle, linked attempts, and review boundary correctly.
since: "0.26.0"
source:
  - packages/jinn/src/work-items/store.ts
  - packages/jinn/src/work-items/transitions.ts
  - packages/jinn/src/work-items/reconcile.ts
  - packages/jinn/src/gateway/api.ts
audience: [operator, agent]
generated: false
---

Todos are the durable ledger of work that should remain visible across turns and restarts. A Todo records intent, assignment, lifecycle state, provenance, verification policy, approvals, events, and linked execution sessions.

The lifecycle is a guarded state machine: `backlog`, `assigned`, `executing`, `in_review`, `done`, `blocked`, `escalated`, and `cancelled`. Not every transition is legal for every caller. Agents can keep work current, but they cannot cancel through the agent surface or mark their own reviewed work done. Review remains separate from execution.

## Todos are not Workflows

A Todo answers “what live work exists?” A Workflow answers “how should a repeatable process run?” A Workflow run may create or mirror a Todo, but the definition and ledger remain separate records.

## Attempts and reconciliation

Delegation links the child session to the Todo before dispatch. Cron and Workflow bridges also create provenance-aware records. The reconciler derives live status from linked attempts, avoiding a second hand-maintained truth about whether work is active.

Deleting a session linked as execution evidence is refused. The attempt is durable evidence, including error or interruption state.

## Verification and approvals

`verifyPolicy` can express how work should be reviewed. Approval fields cannot be smuggled into create, assign, archive, or ordinary status requests; approval has its own request/decision authority surface. This prevents every Todo from becoming an approval bottleneck while preserving explicit human gates.

Blocked or escalated updates require a note. Archive is non-deleting: it preserves the row and event history while using the terminal cancelled state internally.

## Limits

Todos do not execute themselves. Creating or assigning one records intent; `POST /api/delegations` or a Workflow/cron bridge starts work. A Todo can also remain backlog with no session, which is deliberate and recoverable.

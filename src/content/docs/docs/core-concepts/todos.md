---
title: Todos
description: Use Jinn's collaborative Todo hierarchy, guarded lifecycle, evidence, comments, relations, labels, and review boundary.
since: "0.26.0"
source:
  - packages/jinn/src/work-items/store.ts
  - packages/jinn/src/work-items/transitions.ts
  - packages/jinn/src/work-items/reconcile.ts
  - packages/jinn/src/work-items/comments.ts
  - packages/jinn/src/work-items/relations.ts
  - packages/jinn/src/gateway/api.ts
audience: [operator, agent]
generated: false
---

Todos are the durable ledger of work that should remain visible across turns and restarts. A Todo records intent, assignment, department, lifecycle state, provenance, verification policy, approvals, events, collaboration, and linked execution sessions.

The lifecycle is a guarded state machine: `backlog`, `assigned`, `executing`, `in_review`, `done`, `blocked`, `escalated`, and `cancelled`. Not every transition is legal for every caller. Agents can keep work current, but they cannot cancel through the agent surface or mark their own reviewed work done. Review remains separate from execution.

## Hierarchy and collaboration

A Todo may have children up to three levels deep. Children inherit the parent's department when none is supplied. Parent completion is roll-up gated: open children keep the parent from closing as if the whole body of work were finished.

Department-scoped prefixes make ownership visible while IDs remain stable. A Todo can carry threaded comments, shared labels, due dates, content-addressed attachments, and typed `blocks`, `relates`, or `duplicates` links. Blocking links are cycle-checked. These records are durable collaboration state, not chat decoration.

Field authority is narrower than read access. The operator and creator can edit the title; the operator, creator, assignee, or assignee's manager can edit work details; reassignment, department, and rank stay operator-owned. Optimistic versions and idempotency keys protect conflict-safe edits.

## Todos are not Workflows

A Todo answers “what live work exists?” A Workflow answers “how should a repeatable process run?” A Workflow run may create or mirror a Todo, but the definition and ledger remain separate records.

## Attempts and reconciliation

Delegation links the child session to the Todo before dispatch. Cron and Workflow bridges also create provenance-aware records. The reconciler derives live status from linked attempts, avoiding a second hand-maintained truth about whether work is active.

Deleting a session linked as execution evidence is refused. The attempt is durable evidence, including error or interruption state.

## Verification and approvals

`verifyPolicy` can express how work should be reviewed. Approval history remains durable even after the row changes state. Approval fields cannot be smuggled into create, assign, archive, or ordinary status requests; approval has its own request/decision authority surface. This prevents every Todo from becoming an approval bottleneck while preserving explicit human gates.

Blocked or escalated updates require a note. Archive is non-deleting: it preserves the row and event history while using the terminal cancelled state internally.

## Limits

Todos do not execute themselves. Creating or assigning one records intent; `POST /api/delegations` or a Workflow/cron bridge starts work. A Todo can also remain backlog with no session, which is deliberate and recoverable.

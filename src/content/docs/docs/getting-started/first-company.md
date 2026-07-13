---
title: Your First Company
description: Hire a specialist, delegate tracked work, and review an approval without inventing hidden automation.
since: "0.26.0"
source:
  - packages/jinn/src/gateway/org.ts
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/work-items/approvals.ts
  - packages/jinn/src/work-items/store.ts
audience: [operator]
generated: false
---

A Jinn company is a local roster of employee persona files plus durable Todos, sessions, and optional Workflows. Start with one specialist and one concrete assignment.

## 1. Hire an employee

In the dashboard, open **Org**, add an employee, and save. The same operation can be performed by creating `~/.jinn/org/research/researcher.yaml`:

```yaml
name: researcher
displayName: Researcher
department: research
rank: senior
engine: claude
model: sonnet
persona: |
  You investigate product questions, cite primary sources, and report concise findings.
  Escalate decisions that require spending money or publishing externally.
```

Employee filenames and `name` values use kebab-case. The gateway watches `org/` and rebuilds the roster when files change. `reportsTo` is optional; the hierarchy resolver applies defaults when it is absent and reports broken references or cycles as warnings rather than pretending the tree is valid.

## 2. Delegate tracked work

Ask your COO in chat:

> Delegate a source-backed comparison of three deployment options to Researcher. Track it as a Todo and bring me the recommendation for review.

With the built-in Jinn MCP tools enabled, the COO can use the typed delegation tool. Over HTTP, the equivalent transaction is `POST /api/delegations`. It creates or reuses a Todo, creates a child session, links the two before dispatch, and returns both IDs. That ordering matters: a crash cannot leave running work with no durable intent record.

The child session inherits the employee's engine, model, effort, and persona unless the request supplies a valid override. When it finishes, Jinn normally queues a callback to the parent. Callbacks are best-effort, so polling `GET /api/sessions/{childId}?last=N` remains the recovery path.

## 3. Review and approve

Employees do not mark their own reviewed work `done`. They move eligible work to `in_review` and a separate authority decides it. If the work requests approval, it appears in the Todo's approval state and in **Needs you** for the routed approver.

Approve or reject from the Todo detail panel. Approval of a native Todo that is in review completes it; rejection records the decision and follows the guarded transition rules. A Workflow gate uses the same Todo approval surface but also resolves the parked Workflow run.

Approval is not universal confirmation. Ordinary analysis, edits, and reversible work should continue under employee authority. Use approval gates for decisions that genuinely need a manager, the root/COO, or the operator.

## Check the evidence

The Todo retains status history and linked session attempts. The session retains the conversation. If execution fails, the intent record remains visible for retry or reassignment instead of disappearing with the process.

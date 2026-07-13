---
title: Approvals
description: Route consequential decisions to the right authority without turning every action into a human gate.
since: "0.26.0"
source:
  - packages/jinn/src/work-items/approvals.ts
  - packages/jinn/src/gateway/approval-authority.ts
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/workflows/run-reconciler.ts
audience: [operator, agent]
generated: false
---

Approvals are explicit pending decisions attached to Todos. They are separate from ordinary status updates and from engine CLI permission prompts.

An authorized session requests approval with a description and optional target. Jinn resolves the default route through the work owner/manager/root chain. The pending approval appears in the Todo ledger. A routed manager or root can decide through a capability-bound session; the authenticated operator can decide when the authority rules expose the decision to that surface.

The decision is `approve` or `reject`, with an optional note. Native Todo consequences are fixed rather than prompt-defined: approval of reviewed work can complete it, while rejection records the decision and follows the guarded bounce/escalation behavior. When the Todo mirrors a parked Workflow gate, the same decision resolves that gate and advances or rejects the run.

## Boundaries

- Agents cannot attach hidden approval fields during Todo creation, assignment, archive, or status updates.
- A worker cannot self-review work into `done`.
- Operator-only gateway configuration, auth, cron, org, and destructive session mutations are control-plane authority, not ordinary approvals.
- Public, financial, irreversible, legal, and security-sensitive actions should be gated before the external side effect.
- Reversible research and internal drafting do not need approval merely because an agent performs them.

Approval does not roll back an already executed external action. Put the gate before the action and make the post-gate step idempotent.

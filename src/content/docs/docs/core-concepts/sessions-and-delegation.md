---
title: Sessions and Delegation
description: Understand serialized conversations, engine-native resume state, parent-child links, callbacks, and tracked delegation.
since: "0.1.0"
source:
  - packages/jinn/src/sessions/manager.ts
  - packages/jinn/src/sessions/queue.ts
  - packages/jinn/src/sessions/registry.ts
  - packages/jinn/src/gateway/api.ts
audience: [operator, agent, contributor]
generated: false
---

A session is one durable Jinn conversation. It records the selected engine/model/effort, messages, status, engine-native session references, source/connector metadata, parent link, costs, and optional Todo link.

Turns within a session are serialized by a durable queue. A new operator message normally interrupts a running turn when `sessions.interruptOnNewMessage` is true; internal notifications and child callbacks queue without interrupting.

Jinn can resume an interrupted session by posting another message. Existing chats can switch engines only when they are not running, waiting, or queued. The gateway preserves per-engine native references and bridges recent context when moving to a different engine.

## Parent and child sessions

Creating a session with `parentSessionId` forms a delegation tree. Calls made through the built-in MCP carry a capability-bound caller identity; spawned children are auto-linked when the caller omits an explicit parent. A child completion normally notifies and wakes its parent. Because callback delivery is best-effort, the parent should poll the child's latest messages if no callback arrives.

Lateral agent messages carry caller identity, cannot target the same session, are rate-limited, and consume a relay-hop budget. The default hop limit is 12 and is clamped to 1–64. This prevents unbounded agent-to-agent loops; it is not a permission model for an untrusted party holding the shared operator token.

## Delegation transaction

`POST /api/delegations` is the tracked path. It validates the employee/engine, creates or reuses a Todo, creates the child session, links both records, then dispatches. Optional idempotency keys return the original pair on retry. A spawn failure preserves backlog intent; a link failure halts before dispatch.

For quick untracked work, create a child session directly. Use delegation when the task should live in the Todo ledger.

## Limits

Session status is process state, not proof of quality. `idle` means no turn is running; it does not mean the requested work passed review. Use the final messages, Todo state, and Workflow receipts as evidence.

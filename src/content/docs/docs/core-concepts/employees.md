---
title: Employees
description: Learn how persona files, departments, reporting lines, engine defaults, and live roster reload work.
since: "0.1.0"
source:
  - packages/jinn/src/shared/types.ts
  - packages/jinn/src/gateway/org.ts
  - packages/jinn/src/gateway/org-hierarchy.ts
  - packages/jinn/src/gateway/watcher.ts
audience: [operator, agent]
generated: false
---

An employee is a YAML persona in `~/.jinn/org/<department>/<name>.yaml`. The file supplies identity and execution defaults; the session supplies the actual task.

Required runtime fields are `name`, `displayName`, `department`, `rank`, `engine`, `model`, and `persona`. Optional fields include `emoji`, CLI flags, MCP selection, a Jinn-MCP override, effort, callback preference, `reportsTo`, and declared services.

```yaml
name: release-engineer
displayName: Release Engineer
department: engineering
rank: senior
engine: codex
model: gpt-5.5
reportsTo: engineering-lead
jinnMcp: true
persona: |
  You prepare releases, verify artifacts, and report evidence to the engineering lead.
```

Ranks are `executive`, `manager`, `senior`, and `employee`. Reporting structure is resolved independently from file order. Explicit `reportsTo` wins; absent links use hierarchy defaults. Same-rank employees do not implicitly report to one another. Broken references, self-links, and cycles produce warnings in the resolved org response.

The gateway watches the org directory. Saving a valid file rebuilds the in-memory registry and updates the dashboard without a restart.

## What employees control

When a session names an employee, Jinn validates that employee exists and applies its engine/model/effort defaults. The persona and chain-of-command context are injected into the engine turn. The employee does not become a separate daemon or account; each assignment is still a session.

Authority is enforced at operation boundaries, not merely inferred from rank text. Todo assignment, approval, Workflow mutation, session stopping, and operator control-plane writes each have route-specific checks. Do not assume that editing a persona sentence grants a capability.

## Limits

The roster is file-backed and local. There is no distributed employee identity service, payroll model, or automatic hiring marketplace. `reportsTo` currently resolves one primary parent; array/dotted-line support is represented in types but primary hierarchy behavior remains the operative path.

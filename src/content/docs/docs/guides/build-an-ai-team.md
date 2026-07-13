---
title: Build an AI Team
description: Design departments, hire focused employees, connect reporting lines, and delegate with review proportional to risk.
since: "0.1.0"
source:
  - packages/jinn/src/gateway/org.ts
  - packages/jinn/src/gateway/org-hierarchy.ts
  - packages/jinn/src/shared/types.ts
  - packages/jinn/src/gateway/api.ts
audience: [operator]
generated: false
---

Build the smallest roster that creates a useful division of responsibility. Start with the seeded generalist, then add specialists only when work has a stable owner.

## Create a department and lead

Create `~/.jinn/org/engineering/department.yaml`:

```yaml
name: engineering
displayName: Engineering
description: Builds and verifies the product.
```

Then create `engineering-lead.yaml`:

```yaml
name: engineering-lead
displayName: Engineering Lead
department: engineering
rank: manager
engine: claude
model: opus
persona: |
  You own engineering outcomes. Delegate implementation, review evidence,
  and escalate security, public release, and irreversible decisions.
```

Add a report with `reportsTo: engineering-lead`. Use `manager` only when the employee will actually coordinate reports. The hierarchy resolver warns about unknown parents and cycles; check the Org view after every structural edit.

## Give each employee a bounded job

A strong persona states scope, quality bar, available tools, escalation rules, and reporting format. Avoid a second global operating manual inside every persona; the gateway already injects shared company context.

Choose the engine/model for the work. Add MCP selectively: `mcp: false`, a list of servers, or `jinnMcp: true` for the built-in company tools. Verify attachment in a real session.

## Delegate through the lead

Ask the COO or manager to use tracked delegation for owned work. `POST /api/delegations` creates the Todo and child attempt atomically enough to preserve intent across failure. A manager can then synthesize report output rather than forwarding raw transcripts.

Use three review levels:

- Trust for reversible lookups and routine status checks.
- Verify for ordinary code/content changes: inspect key evidence.
- Thorough review for architecture, security, money, legal, release, or public actions.

## Grow from evidence

Promote a reliable senior when a department has several reports and coordination becomes recurring. Do not add hierarchy for appearance: employees are session defaults plus authority context, and every extra layer costs turns.

After changes, confirm `GET /api/org` has the expected root, parent names, direct reports, and no unresolved warnings.

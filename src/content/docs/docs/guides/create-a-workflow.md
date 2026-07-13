---
title: Create a Workflow
description: Author a validated graph in the dashboard, add a gate, run it by name, and inspect durable evidence.
since: "0.26.0"
source:
  - packages/jinn/src/workflows/definition.ts
  - packages/jinn/src/workflows/authoring.ts
  - packages/jinn/src/gateway/api.ts
  - packages/web/src/routes/workflow/edit.tsx
audience: [operator, agent]
generated: false
---

The dashboard Workflow editor is the safest authoring path because it writes the editable graph schema, validates every save, and keeps run history separate.

## Build the graph

1. Open **Workflows** and create a definition with a kebab-case name.
2. Add a trigger node.
3. Add actor-bearing step nodes. Choose an existing employee or raw engine and write explicit instructions.
4. Connect nodes with sequence/handoff edges.
5. Add a gate before any public, financial, irreversible, legal, or security-sensitive step.
6. Save. The gateway rejects dangling edges, duplicate IDs, invalid actor/options combinations, unbounded loops, and unsupported fields.

A compact graph document has this shape:

```json
{
  "schemaVersion": 1,
  "id": "release-review",
  "name": "release-review",
  "title": "Release review",
  "version": 1,
  "status": "active",
  "concurrency": 1,
  "nodes": [
    {
      "id": "start",
      "type": "trigger",
      "label": "Manual",
      "position": { "x": 0, "y": 0 },
      "trigger": { "kind": "manual" }
    },
    {
      "id": "verify",
      "type": "step",
      "label": "Verify",
      "position": { "x": 240, "y": 0 },
      "actor": { "kind": "employee", "ref": "assistant" },
      "instructions": "Run the release checks and summarize evidence."
    }
  ],
  "edges": [
    {
      "id": "start-verify",
      "from": "start",
      "to": "verify",
      "kind": "sequence"
    }
  ]
}
```

The exact schema evolves; prefer the editor or `POST /api/workflow-definitions/plan` plus mutation endpoints over copying this minimal example blindly.

## Run and follow

```sh
jinn workflow run release-review \
  --input '{"candidate":"v1"}' \
  --idempotency-key release-review-v1 \
  --json
```

The command discovers the gateway token from `gateway.json` and calls `POST /api/workflow-runs/by-name`. Reusing an idempotency key avoids a duplicate start. Follow the returned `workflowId` and `runId` through the Workflow run endpoint or dashboard.

When a run parks, decide the mirrored Todo approval. Do not bypass the gate by editing evidence files.

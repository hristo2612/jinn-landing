---
title: Create a Workflow
description: Author a validated v2 graph, require explicit employee output, add an approval, and inspect durable evidence.
since: "0.26.0"
source:
  - packages/jinn/src/workflows/model.ts
  - packages/jinn/src/workflows/validation.ts
  - packages/jinn/src/gateway/workflow-api.ts
  - packages/web/src/routes/workflow/editor/editor.tsx
audience: [operator, agent]
generated: false
---

The dashboard Workflow editor is the safest authoring path because it writes the editable graph schema, validates every save, and keeps run history separate.

## Build the graph

1. Open **Workflows** and create a definition with a kebab-case ID.
2. Add a manual, schedule, event, Todo-status, or Workflow-call trigger.
3. Add employee nodes. Bind an existing employee, write explicit instructions, and declare the output fields downstream nodes need.
4. Connect each source port to the next node's input. Use conditions and a wait-all merge for branches.
5. Add an approval node before any public, financial, irreversible, legal, or security-sensitive step.
6. End each terminal path with an `end` node, then save and enable. The gateway rejects cycles, dangling edges, duplicate IDs, invalid bindings, unreachable nodes, and unsupported fields.

A compact graph document has this shape:

```json
{
  "schemaVersion": 1,
  "id": "release-review",
  "title": "Release review",
  "description": "Verify a release candidate.",
  "revision": 1,
  "enabled": true,
  "createdAt": "2026-07-24T00:00:00.000Z",
  "updatedAt": "2026-07-24T00:00:00.000Z",
  "nodes": [
    {
      "id": "start",
      "type": "trigger",
      "name": "Manual",
      "config": { "kind": "manual" }
    },
    {
      "id": "verify",
      "type": "employee",
      "name": "Verify",
      "config": {
        "employee": { "source": "fixed", "value": "assistant" },
        "prompt": "Run the release checks and submit the result.",
        "output": {
          "fields": {
            "summary": { "type": "string", "required": true }
          },
          "allowAdditionalFields": false
        }
      }
    },
    {
      "id": "done",
      "type": "end",
      "name": "Done",
      "config": { "result": "success" }
    }
  ],
  "edges": [
    {
      "id": "start-verify",
      "from": { "nodeId": "start", "port": "success" },
      "to": { "nodeId": "verify", "port": "input" }
    },
    {
      "id": "verify-done",
      "from": { "nodeId": "verify", "port": "success" },
      "to": { "nodeId": "done", "port": "input" }
    }
  ],
  "ui": {
    "positions": {
      "start": { "x": 0, "y": 0 },
      "verify": { "x": 240, "y": 0 },
      "done": { "x": 480, "y": 0 }
    }
  }
}
```

The editor supplies timestamps and revisions. Prefer it over copying this minimal definition blindly.

## Run and follow

```sh
jinn workflow run release-review \
  --input '{"candidate":"v1"}' \
  --idempotency-key release-review-v1 \
  --json
```

The command discovers the gateway token from `gateway.json` and calls `POST /api/workflows/release-review/runs`. Reusing an idempotency key avoids a duplicate start. Follow the returned run ID with `jinn workflow show-run release-review <runId> --json` or in the dashboard.

The employee node completes only after `workflow_submit_output` validates its declared fields. When a run parks at an approval node, decide it from the dashboard, typed MCP tool, or `jinn workflow approve`/`reject`. Do not bypass the gate by editing evidence files.

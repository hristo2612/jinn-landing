---
title: Todos API
description: Query the work ledger, create and assign intent, update guarded status, and route approvals.
since: "0.26.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/work-items/store.ts
  - packages/jinn/src/work-items/transitions.ts
  - packages/jinn/src/work-items/approvals.ts
audience: [operator, agent, contributor]
generated: false
---

Todo writes use caller-aware authority. Operator bearer calls act as the operator; built-in MCP calls act as the current session.

| Method and path                             | Inputs                                                                                              | Response and behavior                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/work-items`                       | filters: `status`, `source`, `assignee`, `department`, time bounds, `needsAttentionFor`, pagination | `{workItems,total,totals,limit,offset,nextOffset}` compact page.                                                               |
| `GET /api/work-items/:id`                   | path ID                                                                                             | `{workItem,spendUsd,workflowRun,events}`; 404 if absent.                                                                       |
| `POST /api/work-items`                      | `title`; optional `body`, `acceptance`, `assignee`, `department`, `verifyPolicy`                    | 201 `{workItem}`. Public callers cannot forge provenance or attach approvals. Records intent only.                             |
| `POST /api/work-items/:id/assign`           | `{assignee}`                                                                                        | `{workItem}`. Validates roster and caller authority; terminal conflicts return 409.                                            |
| `POST /api/work-items/:id/status`           | `{status,note?}`                                                                                    | `{workItem,escalated}`. Agent targets are guarded; blocked/escalated require notes; self-review/cancel are refused.            |
| `POST /api/work-items/:id/archive`          | optional `{note}`                                                                                   | `{workItem,archived:true}`. Preserves evidence.                                                                                |
| `GET /api/work-items/:id/sessions`          | none                                                                                                | Linked attempt sessions.                                                                                                       |
| `POST /api/work-items/:id/approval/request` | `{request,target?}`                                                                                 | `{workItem}` with pending approval.                                                                                            |
| `POST /api/work-items/:id/approval`         | `decision` is `approve` or `reject`; optional `note`                                                | Updated Todo and mirrored Workflow status where relevant. Authority failures return 403; no pending/gate mismatch returns 409. |

Source-verified invocations for every curated route:

```sh
# Query and inspect durable work
curl -sS "$JINN_GATEWAY_URL/api/work-items?status=in_review&limit=50" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID/sessions" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

# Create, assign, and progress intent
curl -X POST "$JINN_GATEWAY_URL/api/work-items" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Verify the release artifact","acceptance":"Checks pass and evidence is attached","assignee":"assistant","verifyPolicy":{"mode":"verify","maxRounds":2}}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID/assign" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"assignee":"assistant"}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID/status" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"status":"in_review","note":"Evidence attached."}'
# Request and decide an explicit approval
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID/approval/request" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"request":"Approve publishing the verified artifact."}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID/approval" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"decision":"approve","note":"Evidence reviewed."}'

# Archive a separate Todo; archive maps to terminal cancellation
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$ARCHIVE_WORK_ITEM_ID/archive" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"note":"Intent withdrawn."}'
```

Creating a Todo does not spawn a session. Use `POST /api/delegations` to start tracked execution immediately, optionally passing the existing `workItemId`.

Metadata editing (`PATCH /api/work-items/:id`) is operator-only and excludes status. Status changes use the guarded route so lifecycle evidence cannot be bypassed.

---
title: Todos API
description: Query and collaboratively edit the Todo hierarchy, evidence, comments, attachments, relations, labels, lifecycle, and approvals.
since: "0.26.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/work-items/store.ts
  - packages/jinn/src/work-items/transitions.ts
  - packages/jinn/src/work-items/approvals.ts
  - packages/jinn/src/work-items/comments.ts
  - packages/jinn/src/work-items/attachments.ts
  - packages/jinn/src/work-items/relations.ts
audience: [operator, agent, contributor]
generated: false
---

Todo writes use caller-aware authority. Operator bearer calls act as the operator; built-in MCP calls act as the current session.

| Method and path                              | Inputs                                                                                                            | Response and behavior                                                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/work-items`                        | filters: `status`, `source`, `assignee`, `department`, time bounds, `needsAttentionFor`, pagination               | `{workItems,total,totals,limit,offset,nextOffset}` compact page.                                                                                   |
| `GET /api/work-items/:id`                    | path ID                                                                                                           | `{workItem,spendUsd,events}`; 404 if absent.                                                                                                       |
| `POST /api/work-items`                       | `title`; optional `body`, `acceptance`, `assignee`, `department`, `parentId`, `priority`, `dueAt`, `verifyPolicy` | 201 `{workItem}`. Public callers cannot forge provenance or attach approvals. Records intent only.                                                 |
| `PATCH /api/work-items/:id`                  | editable metadata plus `expectedVersion`/`If-Match` and optional `idempotencyKey`                                 | `{workItem,replayed}`. Per-field authority; stale versions and key reuse conflicts return 409.                                                     |
| `POST /api/work-items/:id/assign`            | `{assignee}`                                                                                                      | `{workItem}`. Validates roster and caller authority; terminal conflicts return 409.                                                                |
| `POST` or `PUT /api/work-items/:id/status`   | `{status,note?}`                                                                                                  | `{workItem,escalated}`. POST is the guarded agent lane; PUT is the operator lifecycle lane.                                                        |
| `POST /api/work-items/:id/archive`           | optional `{note,cascade?}`                                                                                        | `{workItem,archived:true}`. Cascade is operator-only and preserves evidence.                                                                       |
| `GET /api/work-items/:id/sessions`           | none                                                                                                              | Linked attempt sessions.                                                                                                                           |
| `GET /api/work-items/:id/tree`               | none                                                                                                              | `{tree}` with descendants, status totals, and derived spend.                                                                                       |
| `POST /api/work-items/:id/approval/request`  | `{request,target?}`                                                                                               | `{workItem}` with pending approval.                                                                                                                |
| `POST /api/work-items/:id/approval/escalate` | optional `{reason}`                                                                                               | `{workItem}`. The routed manager/root authority deliberately exposes the pending approval to the operator/aCEO path. 409 with no pending approval. |
| `POST /api/work-items/:id/approval`          | `decision` is `approve` or `reject`; optional `note`                                                              | Updated Todo and mirrored Workflow status where relevant. Authority failures return 403; no pending/gate mismatch returns 409.                     |

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
# Request, optionally escalate, and decide an explicit approval
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID/approval/request" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"request":"Approve publishing the verified artifact."}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID/approval/escalate" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"reason":"Needs operator sign-off."}'
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$WORK_ITEM_ID/approval" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"decision":"approve","note":"Evidence reviewed."}'

# Archive a separate Todo; archive maps to terminal cancellation
curl -sS -X POST "$JINN_GATEWAY_URL/api/work-items/$ARCHIVE_WORK_ITEM_ID/archive" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"note":"Intent withdrawn."}'
```

Approval decisions are routed. A session capability may decide only when it is the routed manager, the org root/COO, or (after escalation) an executive. An owner cannot decide their own approval. The authenticated operator can decide only when the approval is routed to the root/COO target or has been escalated to the operator/aCEO path via `approval/escalate`.

Creating a Todo does not spawn a session. Use `POST /api/delegations` to start tracked execution immediately, optionally passing the existing `workItemId`.

Metadata editing excludes status and enforces authority per field. Status changes use the guarded route so lifecycle evidence cannot be bypassed.

## Comments, attachments, relations, and labels

| Method and path                                        | Input / response / authority                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/work-items/:id/comments`                     | `limit`/`offset`; chronological single-level thread page.                                                                       |
| `POST /api/work-items/:id/comments`                    | `{body,parentCommentId?}`; author identity is stamped from the caller.                                                          |
| `PATCH /api/work-items/:id/comments/:commentId`        | `{body}`; comment author or operator.                                                                                           |
| `DELETE /api/work-items/:id/comments/:commentId`       | Tombstones content while preserving thread shape; author or operator.                                                           |
| `GET /api/work-items/:id/attachments`                  | Lists item- and comment-level attachment metadata.                                                                              |
| `POST /api/work-items/:id/attachments`                 | Multipart `file` plus optional `commentId`, or local `{path,filename?,commentId?}` subject to file-read policy; 25 MB per file. |
| `GET /api/work-items/:id/attachments/:attachmentId`    | Downloads only after SHA-256 integrity verification.                                                                            |
| `DELETE /api/work-items/:id/attachments/:attachmentId` | Uploader or operator; shared content survives while another row references its hash.                                            |
| `POST` or `DELETE /api/work-items/:id/relations`       | `{dstId,kind}` where kind is `blocks`, `relates`, or `duplicates`; blocking cycles are rejected.                                |
| `PUT /api/work-items/:id/labels`                       | `{labels:[…]}` replaces the set with existing label IDs or names.                                                               |
| `GET /api/labels`                                      | Lists the shared label registry.                                                                                                |
| `POST /api/labels`                                     | `{name,color?,department?}`; operator or manager.                                                                               |
| `GET /api/departments`                                 | Lists department slugs, immutable ID prefixes, and live Todo counts.                                                            |

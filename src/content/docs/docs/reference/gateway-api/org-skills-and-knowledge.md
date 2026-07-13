---
title: Org, Skills, and Knowledge API
description: Read the resolved roster, manage employee and skill files through curated routes, and search scoped Markdown knowledge.
since: "0.1.0"
source:
  - packages/jinn/src/gateway/api.ts
  - packages/jinn/src/gateway/org.ts
  - packages/jinn/src/gateway/skills.ts
  - packages/jinn/src/knowledge/store.ts
audience: [operator, agent, contributor]
generated: false
---

| Method and path                  | Authority              | Response / side effect                                                                                                              |
| -------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/org`                   | read                   | `{departments,employees,hierarchy}`. Employee list omits full persona and adds compact role plus resolved parent/report data.       |
| `GET /api/org/employees/:name`   | read                   | Full employee persona and hierarchy fields; 404 absent.                                                                             |
| `PATCH /api/org/employees/:name` | operator control plane | Whitelisted validated fields; rewrites YAML, reloads roster, emits update.                                                          |
| `GET /api/skills`                | read                   | Skill names/descriptions.                                                                                                           |
| `GET /api/skills/:name`          | read                   | `{name,content}`.                                                                                                                   |
| `PUT /api/skills/:name`          | operator control plane | Replaces existing `SKILL.md`; validates size/content and emits update.                                                              |
| `DELETE /api/skills/:name`       | operator control plane | Removes skill directory and manifest entry.                                                                                         |
| `GET /api/knowledge/search?q=…`  | read                   | Token-AND snippets from Markdown under `knowledge/` and `docs/`.                                                                    |
| `GET /api/knowledge/read?path=…` | read                   | Reads one relative path returned by search. Traversal, absolute paths, control bytes, other roots, and symlink escapes are refused. |

Source-verified invocations for every curated route:

```sh
# Resolve and update the roster
curl "$JINN_GATEWAY_URL/api/org" \
  -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/org/employees/assistant" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X PATCH "$JINN_GATEWAY_URL/api/org/employees/assistant" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" -d '{"displayName":"Assistant"}'

# Read, replace, or remove an existing skill
curl -sS "$JINN_GATEWAY_URL/api/skills" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS "$JINN_GATEWAY_URL/api/skills/release-check" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"
curl -sS -X PUT "$JINN_GATEWAY_URL/api/skills/release-check" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" -H "Content-Type: application/json" --data-binary @skill-update.json
curl -sS -X DELETE "$JINN_GATEWAY_URL/api/skills/release-check" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN"

# Search first; read only a returned relative path
curl -sS --get "$JINN_GATEWAY_URL/api/knowledge/search" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" --data-urlencode "q=release policy"
curl -sS --get "$JINN_GATEWAY_URL/api/knowledge/read" -H "Authorization: Bearer $JINN_GATEWAY_TOKEN" --data-urlencode "path=knowledge/release-policy.md"
```

For the skill update, `skill-update.json` is `{ "content": "<complete SKILL.md text>" }`; the route replaces the file, so preserve required frontmatter.

Knowledge search is deterministic and scoped; it is not semantic search and cannot access `secrets/`, config, arbitrary home files, or binary attachments. Read only paths returned from the search surface.

The legacy department `board.json` route exists for compatibility but is not the documented Todo ledger. Use `/api/work-items` for live work.

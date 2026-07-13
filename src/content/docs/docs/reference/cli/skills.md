---
title: Skills CLI
description: Search, install, list, update, remove, and restore instance-local skill playbooks.
since: "0.1.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/cli/skills.ts
  - packages/jinn/src/shared/skill-commands.ts
audience: [operator, agent]
generated: false
---

| Command                     | Behavior                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `jinn skills find [query]`  | Runs `npx skills find`, optionally with the query. Read-only discovery.                                                |
| `jinn skills add <package>` | Runs global non-interactive installation, copies the discovered skill into this instance, and records source metadata. |
| `jinn skills list`          | Lists directories, frontmatter descriptions, and manifest source or `local`.                                           |
| `jinn skills update`        | Reinstalls every manifest source and refreshes instance copies.                                                        |
| `jinn skills remove <name>` | Deletes the instance skill and its manifest entry.                                                                     |
| `jinn skills restore`       | Reinstalls/restores entries recorded by the instance manifest/bundled set.                                             |

```sh
jinn skills find "release automation"
jinn skills add owner/repository@release-check
jinn skills list
```

Installation invokes external package tooling and copies executable/instruction content. Inspect the source before adding it. Removing a skill does not undo external changes that the skill previously instructed an agent to make.

Local skills can be authored directly under `~/.jinn/skills/<name>/SKILL.md`; they appear as `local` when not represented in `skills.json`. The watcher keeps engine-native links synchronized.

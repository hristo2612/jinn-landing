---
title: Add and Manage Skills
description: Create local SKILL.md playbooks, discover community skills, track their source, and understand live engine links.
since: "0.1.0"
source:
  - packages/jinn/src/cli/skills.ts
  - packages/jinn/src/gateway/skills.ts
  - packages/jinn/src/gateway/watcher.ts
  - packages/jinn/src/shared/skill-commands.ts
audience: [operator, agent]
generated: false
---

A skill is a directory under `~/.jinn/skills/` with a `SKILL.md` playbook. The file needs YAML frontmatter with `name` and `description` so engines can discover it.

```md
---
name: incident-summary
description: Summarize an incident timeline from supplied evidence.
---

# Incident Summary

1. Read the supplied logs.
2. Separate observed facts from inference.
3. Return impact, timeline, cause, and follow-up actions.
```

Saving the directory triggers skill synchronization. Jinn links it into `.claude/skills/` and `.agents/skills/` inside the instance so different engines see one canonical source.

## Discover and install

```sh
jinn skills find "postgres backup"
jinn skills add owner/repository@skill-name
jinn skills list
```

The CLI delegates marketplace discovery/installation to the `skills` tool, copies the installed directory into this instance, and records its source in `~/.jinn/skills.json`. Installation executes external package tooling; review the source and adoption before adding an untrusted skill.

## Update, remove, restore

```sh
jinn skills update
jinn skills remove skill-name
jinn skills restore
```

`update` reinstalls entries recorded in the manifest. `remove` deletes the instance copy and manifest entry. `restore` repopulates bundled defaults without replacing unrelated local skills.

Skills are instructions, not an authority bypass. A skill can tell an employee to request a tool, but MCP attachment, gateway capabilities, API identity, and operator control-plane checks still decide what it can do.

Keep reusable operating knowledge in skills; keep company facts in `knowledge/` or `docs/`. A playbook that embeds changing secrets or customer data becomes difficult to audit and unsafe to share.

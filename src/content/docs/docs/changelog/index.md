---
title: Changelog
description: Browse the pinned upcoming release notes and stable jinn-cli history.
since: "0.1.0"
source: CHANGELOG.md
audience: [operator, contributor]
generated: false
---

The documentation tree currently targets pinned upcoming source. Deployment waits until that version becomes npm latest; stable release notes remain versioned.

- [0.26.0 - upcoming](/docs/changelog/0.26.0/): Todos, tracked delegation, Workflows, triggers, approvals, and typed company MCP tools.
- [0.25.0 - 2026-07-07](/docs/changelog/0.25.0/): in-place engine switching, restart replay protection, live web-asset rebuild safety, and recovery from errored chats.

## Release automation seam

The release sync owns `src/data/release.json` and version pages with `generated: true`. It reads the exact release section from Jinn's `CHANGELOG.md`, updates the stable marker idempotently, and emits a source-impact report. An agent then reviews changed CLI, API, auth, config, migration, and product source before updating explanatory prose. Generated release notes never infer features from a version number.

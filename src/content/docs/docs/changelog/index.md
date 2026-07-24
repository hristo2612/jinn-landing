---
title: Changelog
description: Browse stable jinn-cli release notes.
since: "0.1.0"
source: CHANGELOG.md
audience: [operator, contributor]
generated: false
---

The documentation tree tracks the current stable npm release. Release notes remain versioned.

- [0.28.2 - 2026-07-24](/docs/changelog/0.28.2/): restores migration checks after patch upgrades and removes the release CI dependency on a globally installed engine CLI.
- [0.28.1 - 2026-07-24](/docs/changelog/0.28.1/): restores the npm-installed CLI entrypoint for the v0.28 release.
- [0.26.0 - 2026-07-18](/docs/changelog/0.26.0/): Todos, tracked delegation, Workflows, triggers, approvals, and typed company MCP tools.
- [0.25.0 - 2026-07-07](/docs/changelog/0.25.0/): in-place engine switching, restart replay protection, live web-asset rebuild safety, and recovery from errored chats.

## Release automation seam

The release sync owns `src/data/release.json` and version pages with `generated: true`. It reads the exact release section from Jinn's `CHANGELOG.md`, updates the stable marker idempotently, and emits a source-impact report. An agent then reviews changed CLI, API, auth, config, migration, and product source before updating explanatory prose. Generated release notes never infer features from a version number.

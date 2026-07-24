---
title: Documentation
description: Install, configure, and operate Jinn from source-backed guides and reference pages.
since: "0.1.0"
source:
  - packages/jinn/bin/jinn.ts
  - packages/jinn/src/gateway/api.ts
audience: [operator, agent, contributor]
generated: false
---

Jinn turns installed agent CLIs into a local, file-backed AI company. These docs describe the current behavior of the gateway, dashboard, employees, Todos, Workflows, triggers, connectors, and machine API.

Start with [Install Jinn](/docs/getting-started/install/), then build [your first company](/docs/getting-started/first-company/). Agents integrating directly with a gateway should read the compact [`/agents.md`](/agents.md) protocol and the detailed [Gateway API reference](/docs/reference/gateway-api/authentication/).

Documentation currently tracks stable `jinn-cli 0.28.2`, the version published under npm's `latest` tag. Older behavior remains in the [changelog](/docs/changelog/); the full tree is not duplicated per pre-1.0 release.

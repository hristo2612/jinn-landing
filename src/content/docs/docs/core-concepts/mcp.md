---
title: MCP
description: Give employees typed company tools and selected external tools through per-session MCP configuration.
since: "0.1.0"
source:
  - packages/jinn/src/mcp/resolver.ts
  - packages/jinn/src/mcp/attachment.ts
  - packages/jinn/src/mcp/server.ts
  - packages/jinn/src/shared/types.ts
audience: [operator, agent, contributor]
generated: false
---

Model Context Protocol (MCP) is how Jinn supplies typed tools to compatible agent engines. For each session, the resolver combines global configuration, engine capability, employee selection, and Jinn-specific overrides into a temporary MCP config.

The built-in `jinn` server exposes company primitives such as roster discovery, sessions, delegation, Todos, Workflows, cron reads, knowledge, costs, and managed files. It wraps the same gateway authority boundaries documented in the API; a typed tool does not grant operator powers to an employee session.

```yaml
mcp:
  gateway:
    enabled: true
    engines:
      grok: false
  custom:
    internal-search:
      enabled: true
      command: node
      args: ["server.mjs"]
      env:
        SEARCH_TOKEN: ${SEARCH_TOKEN}
```

The gateway master switch, per-engine opt-out, authenticated smoke check, engine MCP capability, and employee overrides all participate. `mcp.gateway.enabled: false` is a kill switch. `jinnMcp: true` can pilot the company toolset for one employee when the global setting is absent, but it cannot override the global kill switch or an engine opt-out.

Employee `mcp` can be `false`, `true`, or a list of named servers. Custom servers may be stdio (`command`, `args`, `env`) or URL-based (`url`, optional headers).

## Security and limits

Environment references are expanded into the session config; do not write literal secrets into public persona or skill files. The spawned built-in server receives a session-scoped capability and caller identity. If that identity is lost, sensitive mutation routes fail closed rather than becoming operator calls.

MCP availability is engine-dependent. A configured tool can still be absent when the engine lacks a per-session MCP mechanism or the startup auth smoke test fails. Check the session context and gateway logs instead of assuming config implies attachment.

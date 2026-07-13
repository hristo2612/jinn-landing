---
title: Connect Slack
description: Configure a Socket Mode Slack app, restrict senders, bind an employee, and verify threaded routing.
since: "0.1.0"
source:
  - packages/jinn/src/connectors/slack/index.ts
  - packages/jinn/src/connectors/slack/threads.ts
  - packages/jinn/src/gateway/server.ts
  - packages/jinn/src/shared/types.ts
audience: [operator]
generated: false
---

Jinn's Slack connector uses Slack Bolt in Socket Mode. You need an app-level token for Socket Mode and a bot token for Web API/events.

## Configure the Slack app

In Slack, create an app for your workspace, enable Socket Mode, subscribe to message and `app_mention` events, and install it. Grant the bot permissions required for the features you use: reading/posting messages, thread replies, reactions, edits, channel lookup, and file access.

Copy the app token (`xapp-…`) and bot token (`xoxb-…`) into the local dashboard under **Settings → Connectors**, or edit `config.yaml`:

```yaml
connectors:
  slack:
    appToken: "replace-locally"
    botToken: "replace-locally"
    employee: assistant
    allowFrom:
      - "<slack-user-id>"
    ignoreOldMessagesOnBoot: true
```

Keep the real values only in the private instance. `allowFrom` accepts one comma-separated string or a list of Slack user IDs. When it is absent or empty, the connector does not filter by user. `ignoreOldMessagesOnBoot` defaults to true.

Save the config and use the dashboard's connector reload control, or restart the gateway. The top-level connector is registered as `slack`; named `connectors.instances` can run multiple Slack apps, each with a unique `id` and optional employee binding.

## Test routing

1. Direct-message the bot. A DM maps to a stable Slack session key.
2. In a channel, mention the bot in a root message. Ordinary unmentioned root messages are ignored.
3. Continue in the thread. Thread replies reuse the thread session and include the parent message as context.
4. Check `GET /api/connectors` and the dashboard session list.

Slack supports threading, message edits, reactions, and attachments. Reaction events are accepted based on the reaction event time, so a new approval reaction on an older message is not discarded merely because the gateway restarted.

If nothing happens, confirm the app is installed, both tokens are correct, Socket Mode is enabled, the sender is in `allowFrom`, and the message is a DM, mention, or thread reply.

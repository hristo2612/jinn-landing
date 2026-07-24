/**
 * FROZEN copy-deck oracle - transcribed from STORYBOARD-FEATURES.md §4/§11
 * as amended by Addendum B2-1 (B2 review finding 10). This file is the
 * independent serialization oracle for /features: it must NOT import from
 * src/. It changes ONLY with a numbered deck addendum; if an assertion
 * against it fails, either the page drifted from the deck (fix the page) or
 * the deck was amended (update this transcription in the same commit as the
 * addendum).
 */

export const DECK = {
  FEATURES_META: {
    title: "Features - Jinn",
    description:
      "Everything Jinn ships: six agent engines, an AI org in YAML, a reviewed work ledger, workflow graphs with human approval gates, triggers, MCP tools, connectors - open source and local-first.",
  },
  FEATURES_HERO: {
    eyebrow: "The full inventory",
    h1Thin: "All the",
    h1Bold: "moving parts",
    sub: "You've watched the company run. This is everything it runs on - six engines, a real org, a work ledger, workflows with human gates, and the triggers that wake them. Every window below shows the real interface doing it.",
    command: "npm install -g jinn-cli",
    ghost: "View on GitHub",
  },
  FEATURES_CTA: {
    h2Thin: "All of it.",
    h2Bold: "One command",
    command: "npm install -g jinn-cli",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/hristo2612/jinn",
      },
      {
        label: "npm",
        href: "https://www.npmjs.com/package/jinn-cli",
      },
    ],
  },
  FEATURES_SECTIONS: {
    engines: {
      id: "engines",
      kicker: "01 / Engines",
      title: "The models behind your team.",
      body: "Opus 4.8, GPT-5.6 Sol, Fable 5, Gemini 3 Pro, and more. Jinn discovers them through the model CLIs already on your PATH. Pick engine, model, and effort per employee or per session. Switch mid-conversation; the context comes along.",
      rail: [
        {
          label: "subscription",
          text: "Opus 4.8 can run through the Claude Code CLI in a real terminal, so work bills to your flat-rate plan - not an API meter.",
        },
        {
          label: "discovery",
          text: "Models are discovered from each CLI at boot. New model in your CLI, new option in the picker.",
        },
        {
          label: "effort",
          text: "Effort dials from low to max, resolved per engine, per employee, per session.",
        },
        {
          label: "honesty",
          text: "Engines whose binary isn't installed are simply hidden. Nothing pretends to be available.",
        },
      ],
    },
    employees: {
      id: "employees",
      kicker: "02 / Employees",
      title: "Employees are files.",
      body: "Personas, ranks, departments, and reporting lines of any depth - each employee is one YAML file in ~/.jinn/org. Describe a role in chat and the COO drafts it; edit the file and the org rebuilds live.",
      rail: [
        {
          label: "ranks",
          text: "Executive, manager, senior, employee - rank sets the default reporting line; reportsTo overrides it to any depth.",
        },
        {
          label: "delegation",
          text: "Any session spawns child sessions that report back on completion - with a contract that nudges stalled work exactly once.",
        },
        {
          label: "lateral",
          text: "Employees can message each other directly, hop-capped so a conversation loop can't run away.",
        },
        {
          label: "map",
          text: "The org chart is a live spatial map - pan it, zoom it.",
        },
      ],
    },
    todos: {
      id: "todos",
      kicker: "03 / Todos",
      title: "Done means reviewed.",
      body: "Every piece of work is a Todo with an owner, a status, and an audit trail. A session can't mark its own work done - a reviewer does. And when a call needs a human, it waits in Needs you until you decide.",
      rail: [
        {
          label: "states",
          text: 'Eight honest states, backlog to done - including blocked and escalated. Nothing hides in "in progress."',
        },
        {
          label: "sources",
          text: "Work arrives from you, delegation, cron, workflows, sessions, connectors - every item stamped with where it came from.",
        },
        {
          label: "review",
          text: "A verify policy per item - trust, verify, or thorough - with bounded review rounds that auto-escalate at the ceiling.",
        },
        {
          label: "spend",
          text: "Cost per item is summed live from its sessions. Never stored, never stale.",
        },
        {
          label: "audit",
          text: "Every transition, note, and decision appends to an immutable event log.",
        },
      ],
    },
    workflows: {
      id: "workflows",
      kicker: "04 / Workflows",
      title: "Process you can see.",
      body: "A workflow is a strict graph - employees, branches, approvals, merges, waits - drawn on a canvas and run by the gateway. The Executions lens replays every run on the same geometry. Employee work finishes only with validated output. Nothing fakes done.",
      rail: [
        {
          label: "nodes",
          text: "Seven node types: trigger, employee, condition, merge, approval, wait, end.",
        },
        {
          label: "gates",
          text: "Approval nodes hold the run until the routed authority approves or rejects.",
        },
        {
          label: "resilience",
          text: "Bounded retries, timeouts, reminder ladders, and deadline extensions keep long work honest.",
        },
        {
          label: "sop",
          text: "Typed inputs and validated outputs carry evidence between nodes without prompt scraping.",
        },
        {
          label: "mid-run",
          text: "Message an active attempt without cancelling it; every interaction remains attached to the run.",
        },
      ],
    },
    triggers: {
      id: "triggers",
      kicker: "05 / Triggers",
      title: "Work starts without you.",
      body: "Five ways a workflow wakes: manually, on a schedule, from a Todo status, through an authenticated event, or from another Workflow. Every trigger is part of the versioned definition and starts a durable run.",
      rail: [
        {
          label: "events",
          text: "Authenticated event ingress uses a stable fire ID so producer retries do not double-start work.",
        },
        {
          label: "todos",
          text: "Todo-status triggers consume durable ledger events and recover cleanly after restart.",
        },
        {
          label: "calls",
          text: "Workflow-call triggers accept only a validated parent-run identity and idempotency key.",
        },
        {
          label: "cron",
          text: "Schedule triggers bind a cron expression and timezone directly to the enabled definition.",
        },
      ],
    },
    mcp: {
      id: "mcp",
      kicker: "06 / MCP",
      title: "Forty tools. Every hand.",
      body: "Jinn ships its own MCP server - one tool surface for todos, workflows, sessions, org, knowledge, and cost. Every employee works the company through the same hands, whatever engine they run on. Allow-list servers per employee; bring any external MCP server you already use.",
      rail: [
        {
          label: "surface",
          text: "40+ tools: create_work_item, delegate_task, start_workflow_run, decide_work_item_approval, search_knowledge, cost_report…",
        },
        {
          label: "allow-lists",
          text: "Per employee: all servers, none, or exactly the ones you name.",
        },
        {
          label: "external",
          text: "Attach outside MCP servers over stdio or URL from one config block.",
        },
      ],
    },
    connectors: {
      id: "connectors",
      kicker: "07 / Connectors",
      title: "The company, wherever you are.",
      body: "Slack, Discord, Telegram, WhatsApp. Threads become sessions, a reaction on a decision card is enough to act - and a Telegram voice note is transcribed on your machine before it reaches an employee.",
      rail: [
        {
          label: "threads",
          text: "A Slack thread maps to a session - the conversation and the work stay in one place.",
        },
        {
          label: "reactions",
          text: "React to a decision card and the agent acts on it. Approval from your pocket.",
        },
        {
          label: "voice",
          text: "Voice and video notes transcribed by local Whisper - no cloud transcription service ever hears them.",
        },
      ],
    },
    dashboard: {
      id: "dashboard",
      kicker: "08 / Dashboard",
      title: "You've been looking at it.",
      body: "Every window on this page is the dashboard at localhost:7777 - chat-first, streaming everywhere, with a raw terminal view one toggle away. The org map, the todo board, the workflow canvas, cron, activity logs, live engine-quota meters, a skills catalog. And it all fits your phone.",
      rail: [
        {
          label: "terminal",
          text: "Chat ↔ CLI: the same session rendered as chat or attached as a live terminal.",
        },
        {
          label: "meters",
          text: "The Limits page shows each engine's real quota windows - watch your rate limits, not an invoice.",
        },
        {
          label: "input",
          text: "Slash commands, @employee mentions, attachments, push-to-talk dictation - Whisper and the voice run locally.",
        },
        {
          label: "mobile",
          text: "A native-feeling phone layout with its own tab bar. Run the company from the sofa.",
        },
      ],
    },
    skills: {
      id: "skills",
      kicker: "09 / Skills & knowledge",
      title: "Institutional memory.",
      body: "Skills are markdown playbooks every engine follows natively - one folder, one SKILL.md, synced into each CLI automatically. Knowledge is plain files every employee searches through the same two tools. Teach the company once.",
      rail: [
        {
          label: "sync",
          text: "Auto-symlinked into every engine's native skills directory - watched, re-synced the moment a file changes.",
        },
        {
          label: "catalog",
          text: "Browse and edit every skill in the dashboard.",
        },
        {
          label: "community",
          text: "Find and add community skills with one command.",
        },
        {
          label: "knowledge",
          text: "search_knowledge and read_knowledge: deterministic search, no model in the loop, scoped so secrets are unreachable by construction.",
        },
      ],
    },
    local: {
      id: "local",
      kicker: "10 / Local-first",
      title: "Yours. Actually yours.",
      body: "The gateway binds to 127.0.0.1. State is SQLite and plain files under ~/.jinn - all of it readable, editable, committable. No telemetry, no cloud dependency, MIT-licensed. Give an employee a monthly budget and Jinn pauses them at the line.",
      rail: [
        {
          label: "access",
          text: "Remote dashboard access requires pairing - short-lived codes, hashed device tokens.",
        },
        {
          label: "budgets",
          text: "Per-employee monthly budgets - hit the line and Jinn pauses the employee.",
        },
        {
          label: "cost",
          text: "One cost_report tool sums real spend by employee or by day.",
        },
        {
          label: "license",
          text: "MIT. The whole company is open source.",
        },
      ],
    },
  },
  ENGINE_CHIPS: [
    "Opus 4.8",
    "GPT-5.6 Sol",
    "Fable 5",
    "Gemini 3 Pro",
    "Grok 4",
    "Gemma 3",
  ],
  DASHBOARD_CHIPS: [
    "Chat",
    "CLI",
    "Todos",
    "Workflows",
    "Organization",
    "Cron",
    "Activity",
    "Limits",
    "Skills",
    "Settings",
  ],
  SKILL_CARD: {
    path: "~/.jinn/skills/support-triage/SKILL.md",
    snippet: [
      "---",
      "name: support-triage",
      "description: How we answer tickets - tone, refunds, escalation.",
      "---",
      "1. Read the ticket and the customer's history.",
      "2. Refunds over $25 → request approval first.",
      "…",
    ],
  },
  TREE_CARD: {
    root: "~/.jinn",
    rows: [
      {
        branch: "├──",
        name: "config.yaml",
        comment: "# the gateway, hot-reloaded",
      },
      {
        branch: "├──",
        name: "org/",
        comment: "# employees, one YAML each",
      },
      {
        branch: "├──",
        name: "skills/",
        comment: "# playbooks, one folder each",
      },
      {
        branch: "├──",
        name: "cron/jobs.json",
        comment: "# schedules, hot-reloaded",
      },
      {
        branch: "├──",
        name: "knowledge/",
        comment: "# what the company knows",
      },
      {
        branch: "└──",
        name: "sessions/",
        comment: "# history, SQLite",
      },
    ],
  },
  ENGINE_PILL: {
    name: "Dev",
    role: "· Senior ·",
    initialEngine: "Opus 4.8",
    engine: "GPT-5.6 Sol",
    presence: "active",
  },
  ENGINE_THREAD: [
    {
      kind: "message",
      id: "eng-user-1",
      target: "msg-user-1",
      role: "user",
      body: [
        {
          text: "Review the payments webhook diff before we ship it.",
        },
      ],
    },
    {
      kind: "message",
      id: "eng-dev-1",
      target: "msg-dev-1",
      role: "assistant",
      body: [
        {
          text: "Reviewed. One concern - the retry handler swallows 4xx errors. Patch drafted.",
        },
      ],
    },
    {
      kind: "message",
      id: "eng-user-2",
      target: "msg-user-2",
      role: "user",
      body: [
        {
          text: "Fresh eyes - re-check it.",
        },
      ],
    },
    {
      kind: "typing",
      target: "thread-typing",
      hidden: true,
    },
    {
      kind: "message",
      id: "eng-dev-2",
      target: "msg-dev-2",
      role: "assistant",
      body: [
        {
          text: "Agree on the retry handler - and the signature check ignores the timestamp tolerance. Both patched, tests green.",
        },
      ],
    },
  ],
  ENGINE_COMPOSER: "Message Dev…",
  ORG_HIRE_PANE: {
    header: "Org · 6 employees · 3 departments",
    initialHeader: "Org · 5 employees · 2 departments",
    employees: [
      {
        target: "node-coo",
        emoji: "🌈",
        name: "Jimbo",
        role: "COO",
        engine: "Opus 4.8",
        executive: true,
      },
      {
        target: "node-dev",
        emoji: "🦞",
        name: "Dev",
        role: "Senior",
        engine: "GPT-5.6 Sol",
      },
      {
        target: "node-designer",
        emoji: "⚔️",
        name: "Designer",
        role: "Senior",
        engine: "Fable 5",
      },
      {
        target: "node-analyst",
        emoji: "🎪",
        name: "Analyst",
        role: "Senior",
        engine: "GPT-5.6 Sol",
      },
      {
        target: "node-writer",
        emoji: "🪐",
        name: "Writer",
        role: "Junior",
        engine: "Opus 4.8",
      },
      {
        target: "node-support",
        emoji: "🌊",
        name: "Support",
        role: "Employee",
        engine: "GPT-5.6 Sol",
      },
    ],
    departments: [
      {
        target: "dept-platform",
        label: "Platform",
        employeeTargets: ["node-dev", "node-designer"],
        tone: "blue",
      },
      {
        target: "dept-growth",
        label: "Growth",
        employeeTargets: ["node-analyst", "node-writer"],
        tone: "green",
      },
      {
        target: "dept-support",
        label: "Support",
        employeeTargets: ["node-support"],
        tone: "purple",
      },
    ],
  },
  TODO_APPROVAL_PANE: {
    header: "Todos",
    segments: [
      {
        target: "tab-active",
        label: "Active",
        count: "3",
      },
      {
        target: "tab-needs",
        label: "Needs you",
        count: "1",
      },
      {
        target: "tab-people",
        label: "People",
      },
    ],
    cards: [
      {
        target: "card-refund",
        emoji: "🌊",
        title: "Refund order #8841 - $49",
        owner: "Support",
        status: "in-review",
        statusLabel: "In review",
      },
      {
        target: "card-triage",
        emoji: "🌊",
        title: "Triage: login loop on Android",
        owner: "Support",
        status: "executing",
        statusLabel: "Executing",
      },
      {
        target: "card-policy",
        emoji: "🪐",
        title: "Write the refund policy page",
        owner: "Writer",
        status: "assigned",
        statusLabel: "Assigned",
      },
    ],
    badge: "Approval requested",
    request: "Card was double-charged - refund $49 to order #8841.",
    requester: {
      emoji: "🌊",
      name: "Support",
    },
    approveLabel: "Approve",
    sendBackLabel: "Send back",
    decidedStatus: "Approved by you · 11:42 - Todo done",
  },
  TRIAGE_RUN_PANE: {
    title: "Support triage",
    lenses: ["Editor", "Executions"],
    activeLens: "Executions",
    chip: {
      run: "Run #147",
      running: "Running now",
      waiting: "Waiting for you",
    },
    nodes: [
      {
        target: "node-trigger",
        kind: "trigger",
        title: "Ticket received",
        sub: "event · ticket.created",
        fired: "fired · 11:12",
        status: "done",
        initialStatus: "pending",
      },
      {
        target: "node-triage",
        kind: "step",
        title: "Triage ticket",
        status: "done",
        initialStatus: "pending",
      },
      {
        target: "node-route",
        kind: "switch",
        title: "Route",
        status: "done",
        initialStatus: "pending",
      },
      {
        target: "node-reply",
        kind: "step",
        title: "Reply to customer",
        status: "pending",
        initialStatus: "pending",
      },
      {
        target: "node-gate",
        kind: "gate",
        title: "Approval - refunds",
        status: "awaiting-approval",
        initialStatus: "pending",
      },
      {
        target: "node-refund",
        kind: "step",
        title: "Send refund",
        status: "pending",
        initialStatus: "pending",
      },
    ],
  },
  CANVAS_STATUS_LINES: {
    pending: "Up next",
    running: "Running",
    done: "Done",
    "awaiting-approval": "Waits for your approval",
  },
  WEBHOOK_FIRE_PANE: {
    header: "Triggers · 4 bindings",
    bindings: [
      {
        target: "binding-cron",
        title: "Every morning · 09:00",
        detail: "runs Morning digest",
        kind: "cron",
        status: "idle",
        initialStatus: "idle",
      },
      {
        target: "binding-todo",
        title: "Todo → blocked",
        detail: "wakes the COO",
        kind: "todo-status",
        status: "idle",
        initialStatus: "idle",
      },
      {
        target: "binding-webhook",
        title: "POST /api/workflows/events",
        detail: "starts Support triage",
        kind: "webhook",
        status: "fired",
        initialStatus: "idle",
        fired: "fired · 11:38 today",
      },
      {
        target: "binding-poll",
        title: "Called by Inbox monitor",
        detail: "workflow-to-workflow",
        kind: "workflow-call",
        status: "idle",
        initialStatus: "idle",
      },
    ],
    run: "↳ run #148 started - Support triage",
  },
  MCP_HANDS_CARD: {
    header: "support · MCP · 4 calls",
    rows: [
      {
        target: "row-1",
        call: 'search_knowledge · "refund policy"',
        result: "3 hits",
        status: "ok",
        initialStatus: "pending",
      },
      {
        target: "row-2",
        call: "create_work_item · Refund order #8841 - $49",
        result: "wi_8841c47ef21a",
        status: "ok",
        initialStatus: "pending",
      },
      {
        target: "row-3",
        call: "update_work_item · wi_8841c47ef21a → in_review",
        status: "ok",
        initialStatus: "pending",
      },
      {
        target: "row-4",
        call: "request_work_item_approval · wi_8841c47ef21a",
        result: "routed to COO",
        status: "ok",
        initialStatus: "pending",
      },
    ],
  },
  SLACK_APPROVE_CARD: {
    channel: "#support · via Slack",
    sender: "Jimbo · COO · 14:04",
    senderEmoji: "🌈",
    message:
      "Refund request - order #8867, $129. Card charged twice; support recommends refunding. React ✅ to approve.",
    reaction: "✅ 1",
    reply: "↳ Approved - refund sent, run #147 resumed. · 14:05",
  },
  FEATURES_CAPTIONS: {
    "engine-switch":
      "Mid-review, the session switches from Opus 4.8 to GPT-5.6 Sol. The next reply is a second opinion from a different model in the same conversation, with the same context.",
    "org-hire":
      "A support role described in chat becomes a YAML file - and a seat. The header recounts, the department appears, and the new employee joins the chart.",
    "todo-approval":
      "Support requests approval on a $49 refund. It lands in Needs you, routed to you. One tap approves - the item completes, and the decision is on the record.",
    "triage-run":
      "The Executions lens replays run #147 on the workflow's own canvas: the ticket event fires, triage completes, the switch routes down the refund lane - and the run parks at the approval gate, waiting for you. The refund step stays untouched until you say so.",
    "webhook-fire":
      "Four trigger nodes - a schedule, a Todo watcher, an authenticated event, and a Workflow call. The ticket system POSTs ticket.created to /api/workflows/events/ticket.created and run #148 starts.",
    "mcp-hands":
      "The support employee checks the refund policy, files the todo, moves it to review, and requests approval - four MCP calls. These are the same tools every employee gets.",
    "slack-approve":
      "The COO brings the day's second refund to Slack. Your ✅ reaction is the instruction - the agent acts on it, the refund goes out, and the run that was parked at the gate resumes.",
  },
} as const;

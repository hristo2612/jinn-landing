/**
 * Canonical dashboard/scene data - the single source of truth for the shared
 * window shell and the delegation surface. Every string here comes from
 * STORYBOARD.md §6 (copy deck); the surfaces render from this data and never
 * hardcode copy. A `tests/e2e` assertion proves the shipped DOM equals this
 * data, so the A-05 reducer can validate its end state against the same shapes.
 */
import type {
  ChatMessage,
  ChatSceneState,
  ChipGroup,
  MorningPaneData,
  NightFeedData,
  RibbonItem,
  SessionRow,
  TypingIndicator,
  OrgPaneData,
  TodoCardData,
  TodosPaneData,
  TriggersPaneData,
  WorkflowPaneData,
} from "./types";

/** Ribbon = the five showcase panes, in order, plus their icon symbol ids. */
export const RIBBON: RibbonItem[] = [
  { pane: "chat", icon: "i-msg" },
  { pane: "org", icon: "i-users" },
  { pane: "todos", icon: "i-todo" },
  { pane: "flows", icon: "i-flow" },
  { pane: "triggers", icon: "i-zap" },
];

/** A11y labels for the real ribbon navigation buttons (amendment §4 deck). */
export const RIBBON_NAV_LABELS: Record<RibbonItem["pane"], string> = {
  chat: "View Chat",
  org: "View Org",
  todos: "View Todos",
  flows: "View Workflows",
  triggers: "View Triggers",
};

/** Sessions sidebar rows (copy deck §6, verbatim incl. middle-dot subtitles). */
export const SESSIONS: SessionRow[] = [
  {
    emoji: "🌈",
    title: "Signups dip - investigation",
    sub: "Jimbo · COO",
    active: true,
  },
  { emoji: "🎪", title: "Funnel research", sub: "Analyst · 2m" },
  { emoji: "🪐", title: "Landing copy pass", sub: "Writer · 5m" },
  { emoji: "🌈", title: "Morning digest - run #142", sub: "Workflow · 9h" },
  { emoji: "🦞", title: "Deploy checklist", sub: "Dev · 1d" },
];

export const delegationUserMessage: ChatMessage = {
  kind: "message",
  id: "user-1",
  target: "msg-user-1",
  role: "user",
  body: [
    {
      text: "Morning. Signups dipped 12% last week - find out why and fix what's fixable.",
    },
  ],
};

export const delegationTyping: TypingIndicator = {
  kind: "typing",
  target: "thread-typing",
  hidden: true,
};

export const delegationCooPlan: ChatMessage = {
  kind: "message",
  id: "coo-1",
  target: "msg-coo-1",
  role: "assistant",
  body: [
    {
      text: "On it. I'll split this: funnel research to the analyst, landing copy to the writer. I'll review both before anything ships.",
    },
  ],
};

export const delegationChips: ChipGroup = {
  kind: "chips",
  id: "delegations",
  chips: [
    {
      target: "chip-analyst",
      lead: "↳",
      body: [
        { text: "Delegated - " },
        { text: "analyst", strong: true },
        { text: " · funnel investigation" },
      ],
    },
    {
      target: "chip-writer",
      lead: "↳",
      body: [
        { text: "Delegated - " },
        { text: "writer", strong: true },
        { text: " · landing copy pass" },
      ],
    },
  ],
};

export const delegationCooFinding: ChatMessage = {
  kind: "message",
  id: "coo-2",
  target: "msg-coo-2",
  role: "assistant",
  body: [
    {
      text: "First signal: the pricing anchor slipped below the fold on mobile. Todo ",
    },
    { text: "#142", strong: true },
    { text: " is open - the writer is on it." },
  ],
};

const delegationPill = {
  name: "Jimbo",
  meta: "· COO · Opus 4.8",
  presence: "active" as const,
};

/** Motion-capable browsers prime this semantic state before playback. */
export const delegationInitial: ChatSceneState = {
  pane: "chat",
  pill: delegationPill,
  composerPlaceholder: "Message Jimbo…",
  thread: [delegationTyping],
};

/** The `delegation` scene at its RESOLVED checkpoint (the shipped hero state). */
export const delegationResolved: ChatSceneState = {
  pane: "chat",
  pill: delegationPill,
  composerPlaceholder: "Message Jimbo…",
  thread: [
    delegationUserMessage,
    delegationTyping,
    delegationCooPlan,
    delegationChips,
    delegationCooFinding,
  ],
};

/** Org pane at the employees scene's resolved checkpoint. */
export const ORG_PANE = {
  header: "Org · 5 employees · 2 departments",
  employees: [
    {
      target: "node-coo",
      emoji: "🌈",
      name: "Jimbo",
      role: "COO",
      engine: "Opus 4.8",
      presence: "idle",
      initialPresence: "idle",
      executive: true,
    },
    {
      target: "node-dev",
      emoji: "🦞",
      name: "Dev",
      role: "Senior",
      engine: "GPT-5.6 Sol",
      presence: "idle",
      initialPresence: "idle",
    },
    {
      target: "node-designer",
      emoji: "⚔️",
      name: "Designer",
      role: "Senior",
      engine: "Fable 5",
      presence: "idle",
      initialPresence: "idle",
    },
    {
      target: "node-analyst",
      emoji: "🎪",
      name: "Analyst",
      role: "Senior",
      engine: "GPT-5.6 Sol",
      presence: "active",
      initialPresence: "idle",
    },
    {
      target: "node-writer",
      emoji: "🪐",
      name: "Writer",
      role: "Junior",
      engine: "Opus 4.8",
      presence: "active",
      initialPresence: "idle",
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
  ],
} satisfies OrgPaneData;

export const TODO_142 = {
  target: "card-142",
  emoji: "🪐",
  title: "Fix pricing anchor on mobile landing",
  owner: "Writer",
  status: "done",
  initialStatus: "executing",
  cost: "$0.42",
  exec: "Done · reviewed by Jimbo",
  initialExec: "Session · landing-copy-pass · Open",
} satisfies TodoCardData;

/**
 * Ambient-only card (amendment §2.3/§4) - ships mounted but hidden; the
 * todos-ambient loop raises it, runs it, and completes it. Its `initialExec`/
 * `exec` strings are the loop's two replace-text payloads.
 */
export const TODO_RELNOTES = {
  target: "card-relnotes",
  emoji: "🦞",
  title: "Draft release notes for v0.24",
  owner: "Dev",
  status: "done",
  initialStatus: "assigned",
  exec: "Done · reviewed by Jimbo",
  initialExec: "Session · release-notes · Open",
} satisfies TodoCardData;

/** Todo pane at the todos scene's resolved checkpoint. */
export const TODOS_PANE: TodosPaneData = {
  header: "Todos",
  segments: ["Active", "Needs you", "Done"],
  cards: [
    TODO_142,
    {
      target: "card-funnel",
      emoji: "🎪",
      title: "Funnel investigation - signups dip",
      owner: "Analyst",
      status: "assigned",
      initialStatus: "assigned",
      age: "12m",
    },
    {
      target: "card-changelog",
      emoji: "🦞",
      title: "Publish changelog for v0.24",
      owner: "Dev",
      status: "blocked",
      initialStatus: "blocked",
      badge: "Blocked",
      age: "waiting on release notes",
    },
    {
      target: "card-keys",
      emoji: "🦞",
      title: "Rotate API keys",
      owner: "Dev",
      status: "done",
      initialStatus: "done",
      age: "2h",
    },
  ],
};

/** Workflow pane parked at its human approval gate. */
export const WORKFLOW_PANE = {
  header: "Morning digest · Run #142 · round 1",
  badge: "Running",
  trigger: "Every morning · 09:00",
  progress: 2 / 3,
  initialProgress: 1 / 3,
  steps: [
    {
      target: "step-collect",
      title: "Collect metrics",
      detail: "Completed · 12s",
      status: "done",
      initialStatus: "done",
      initialDetail: "Completed · 12s",
    },
    {
      target: "step-draft",
      title: "Draft digest",
      detail: "Completed · 8s",
      status: "done",
      initialDetail: "Writing summary…",
      initialStatus: "running",
    },
    {
      target: "step-gate",
      title: "Approval gate",
      detail: "Waiting for your review",
      status: "awaiting-approval",
      initialDetail: "Queued",
      initialStatus: "queued",
    },
    {
      target: "step-post",
      title: "Post to Slack",
      detail: "Queued",
      status: "queued",
      initialStatus: "queued",
      initialDetail: "Queued",
    },
  ],
} satisfies WorkflowPaneData;

/**
 * The gate-less overnight run (amendment §2.4) - the fiction's own run #139,
 * which the overnight feed reports completed at 02:31. The workflows switcher
 * lets the visitor replay it; it loops as the pane's aliveness channel.
 * Step details use the real app's status-line vocabulary (Running / Queued /
 * Completed · Ns).
 */
export const BACKUP_PANE = {
  header: "Nightly backup · Run #139 · round 1",
  badge: "Completed",
  initialBadge: "Running",
  trigger: "Every night · 02:00",
  progress: 1,
  initialProgress: 0,
  steps: [
    {
      target: "step-snapshot",
      title: "Snapshot database",
      detail: "Completed · 4s",
      status: "done",
      initialStatus: "running",
      initialDetail: "Running",
    },
    {
      target: "step-prune",
      title: "Prune old snapshots",
      detail: "Completed · 3s",
      status: "done",
      initialStatus: "queued",
      initialDetail: "Queued",
    },
    {
      target: "step-verify",
      title: "Verify integrity",
      detail: "Completed · 2s",
      status: "done",
      initialStatus: "queued",
      initialDetail: "Queued",
    },
  ],
} satisfies WorkflowPaneData;

/** The real segmented control that swaps the workflows surface (§2.4/§4). */
export const WORKFLOW_SWITCHER = {
  label: "Choose workflow",
  options: [
    { sceneId: "workflow-approval", label: "Morning digest" },
    { sceneId: "nightly-backup", label: "Nightly backup" },
  ],
} as const;

/** Trigger pane after the 09:00 cron has created Morning digest run #142. */
export const TRIGGERS_PANE = {
  header: "Triggers · 3 bindings",
  bindings: [
    {
      target: "binding-cron",
      title: "Every morning · 09:00",
      detail: "runs Morning digest",
      kind: "cron",
      status: "fired",
      initialStatus: "idle",
      fired: "fired · 09:00 today",
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
      title: "POST /hooks/stripe",
      detail: "starts Refund review",
      kind: "webhook",
      status: "idle",
      initialStatus: "idle",
      fired: "fired · 03:05 today",
    },
  ],
  run: "↳ run #142 started - Morning digest",
  runRefund: "↳ run #140 started - Refund review",
} satisfies TriggersPaneData;

/** Overnight feed at the night-shift scene's resolved checkpoint. */
export const NIGHT_FEED = {
  header: "Overnight · 6 events",
  rows: [
    {
      target: "row-1",
      time: "02:14",
      text: "cron fired - Nightly backup",
      icon: "i-zap",
      tone: "neutral",
    },
    {
      target: "row-2",
      time: "02:31",
      text: "run #139 completed - Nightly backup",
      icon: "i-check",
      tone: "green",
    },
    {
      target: "row-3",
      time: "03:05",
      text: "webhook - refund request → Refund review started",
      icon: "i-plug",
      tone: "neutral",
    },
    {
      target: "row-4",
      time: "03:22",
      text: "todo done - Rotate API keys · reviewed",
      icon: "i-check",
      tone: "green",
    },
    {
      target: "row-5",
      time: "06:47",
      text: "analyst report filed - funnel investigation",
      icon: "i-list",
      tone: "neutral",
    },
    {
      target: "row-6",
      time: "09:00",
      text: "Morning digest drafted - waiting for your review",
      icon: "i-bell",
      tone: "amber",
    },
  ],
} satisfies NightFeedData;

/** Morning approval card + run #142 rail tail at the resolved checkpoint. */
export const MORNING_PANE = {
  header: "Jimbo · COO",
  title: "Morning digest - run #142",
  line: "Draft ready. Numbers verified against the ledger.",
  holdLabel: "Hold",
  approveLabel: "Approve",
  run: "run #142",
  badge: "Completed",
  initialBadge: "Running",
  progress: 1,
  initialProgress: 0,
  steps: [
    {
      target: "step-gate",
      title: "Approval gate",
      detail: "Approved by you · 09:02",
      status: "approved",
      initialStatus: "awaiting-approval",
      initialDetail: "Waiting for your review",
    },
    {
      target: "step-post",
      title: "Post to Slack",
      detail: "Posted · 09:02",
      status: "done",
      initialStatus: "queued",
      initialDetail: "Queued",
    },
  ],
} satisfies MorningPaneData;

/** Flattened plain text of a thread item's body - used by DOM/data tests. */
export function segmentsToText(body: { text: string }[]): string {
  return body.map((segment) => segment.text).join("");
}

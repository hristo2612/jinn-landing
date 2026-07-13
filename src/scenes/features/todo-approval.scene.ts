import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import {
  FEATURES_CAPTIONS,
  TODO_APPROVAL_PANE,
} from "../../lib/scenes/features";

const initialState: ChatSceneState = {
  pane: "none",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "card-refund": "in-review",
    "tab-needs": "quiet",
    "row-refund": "waiting",
  },
  highlights: { "view-active": true },
};

export const todoApprovalScene = {
  id: "todo-approval",
  title: "Todo approval",
  surface: "todos",
  claim: "Risky work parks at your door - routed, decided, and recorded.",
  transcript: FEATURES_CAPTIONS["todo-approval"],
  initialState,
  targets: [
    {
      id: "card-refund",
      kind: "state",
      initialState: "in-review",
      transitions: [{ from: "in-review", to: "approval-requested" }],
    },
    { id: "card-triage", kind: "element" },
    { id: "card-policy", kind: "element" },
    {
      id: "tab-needs",
      kind: "state",
      initialState: "quiet",
      transitions: [{ from: "quiet", to: "alert" }],
    },
    { id: "view-active", kind: "element" },
    { id: "view-needs", kind: "element" },
    {
      id: "row-refund",
      kind: "state",
      initialState: "waiting",
      transitions: [{ from: "waiting", to: "decided" }],
    },
    { id: "row-approve", kind: "element" },
    { id: "row-status", kind: "text" },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 1000,
    quietResetMs: 600,
  },
  beats: [
    {
      at: 0,
      duration: 350,
      target: "card-refund",
      action: { type: "highlight" },
      easing: "smooth",
      detail: "Soft fill lift - the eye lands on the refund.",
    },
    {
      at: 600,
      duration: 300,
      target: "card-refund",
      action: {
        type: "set-state",
        from: "in-review",
        to: "approval-requested",
      },
      easing: "smooth",
      detail: "Badge Approval requested enters; the lift wash decays.",
    },
    {
      at: 1100,
      duration: 300,
      target: "tab-needs",
      action: { type: "set-state", from: "quiet", to: "alert" },
      easing: "smooth",
      detail: "Needs you count → 1, alert dot enters.",
    },
    {
      at: 1700,
      duration: 350,
      target: "view-needs",
      action: { type: "highlight" },
      easing: "snappy",
      detail: "Segment moves to Needs you; the view swaps to the approval row.",
    },
    {
      at: 2600,
      duration: 300,
      target: "row-approve",
      action: { type: "pulse", cycles: 1 },
      easing: "spring",
      detail: "One press pulse on Approve.",
    },
    {
      at: 2900,
      duration: 300,
      target: "row-refund",
      action: { type: "set-state", from: "waiting", to: "decided" },
      easing: "smooth",
      detail: "Buttons resolve out; green check disc.",
    },
    {
      at: 3300,
      duration: 300,
      target: "row-status",
      action: {
        type: "replace-text",
        text: TODO_APPROVAL_PANE.decidedStatus,
      },
      easing: "smooth",
      detail: "Approved by you · 11:42 - Todo done.",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "requested", at: 1400 },
    { name: "needs-you", at: 2300 },
    { name: "resolved", at: 3600 },
  ],
} satisfies SceneDefinition;

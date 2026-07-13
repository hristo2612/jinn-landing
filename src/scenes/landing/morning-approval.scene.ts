import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { MORNING_PANE } from "../../lib/scenes/dashboard";

/**
 * The only human act on the page. The approve pulse clears run #142's gate,
 * the rail crosses, the post step runs honestly and completes, and the run
 * badge turns Completed. The page theme remains stable throughout.
 */
const gate = MORNING_PANE.steps[0];
const post = MORNING_PANE.steps[1];

const initialState: ChatSceneState = {
  pane: "none",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "step-gate": gate.initialStatus,
    "step-post": post.initialStatus,
    "run-badge": "running",
  },
  progress: { "rail-tail": MORNING_PANE.initialProgress },
  highlights: {},
};

export const morningApprovalScene = {
  id: "morning-approval",
  title: "Morning approval",
  surface: "morning",
  claim: "Nothing important ships without you - and shipping takes one tap.",
  transcript:
    "An approval card from the COO holds the digest. You approve, the gate clears, the post step runs and completes, and run #142 finishes because you said so.",
  initialState,
  targets: [
    { id: "approval-card", kind: "element" },
    { id: "rail-tail", kind: "progress" },
    { id: "approve", kind: "element" },
    {
      id: "step-gate",
      kind: "state",
      initialState: gate.initialStatus,
      transitions: [{ from: "awaiting-approval", to: "approved" }],
    },
    { id: "step-gate-status", kind: "text" },
    {
      id: "step-post",
      kind: "state",
      initialState: post.initialStatus,
      transitions: [
        { from: "queued", to: "running" },
        { from: "running", to: "done" },
      ],
    },
    { id: "step-post-status", kind: "text" },
    {
      id: "run-badge",
      kind: "state",
      initialState: "running",
      transitions: [{ from: "running", to: "completed" }],
    },
  ],
  playback: {
    mode: "once",
    entry: "play",
    offscreen: "pause",
    startDelayMs: 0,
  },
  beats: [
    {
      at: 0,
      duration: 400,
      target: "approval-card",
      action: { type: "enter" },
      easing: "smooth",
      detail: "approval card enters",
    },
    {
      at: 400,
      duration: 350,
      target: "rail-tail",
      action: { type: "enter" },
      easing: "smooth",
      detail: "gate + post steps beneath the card",
    },
    {
      at: 1600,
      duration: 250,
      target: "approve",
      action: { type: "pulse", cycles: 1 },
      easing: "spring",
      detail: "one press pulse on the Approve button",
    },
    {
      at: 1850,
      duration: 300,
      target: "step-gate",
      action: { type: "set-state", from: "awaiting-approval", to: "approved" },
      easing: "smooth",
    },
    {
      at: 2150,
      duration: 250,
      target: "step-gate-status",
      action: { type: "replace-text", text: gate.detail },
      easing: "smooth",
    },
    {
      at: 2400,
      duration: 350,
      target: "rail-tail",
      action: { type: "set-progress", value: MORNING_PANE.progress },
      easing: "smooth",
      detail: "fill crosses to Post to Slack",
    },
    {
      at: 2750,
      duration: 300,
      target: "step-post",
      action: { type: "set-state", from: "queued", to: "running" },
      easing: "smooth",
      detail: "blue spinner - honest",
    },
    {
      at: 3450,
      duration: 300,
      target: "step-post",
      action: { type: "set-state", from: "running", to: "done" },
      easing: "smooth",
    },
    {
      at: 3750,
      duration: 250,
      target: "step-post-status",
      action: { type: "replace-text", text: post.detail },
      easing: "smooth",
    },
    {
      at: 4000,
      duration: 250,
      target: "run-badge",
      action: { type: "set-state", from: "running", to: "completed" },
      easing: "smooth",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "visible", at: 750 },
    { name: "approved", at: 2500 },
    { name: "resolved", at: 4400 },
  ],
} satisfies SceneDefinition;

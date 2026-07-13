import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { WORKFLOW_PANE } from "../../lib/scenes/dashboard";

const draftStep = WORKFLOW_PANE.steps[1];
const gateStep = WORKFLOW_PANE.steps[2];

const initialState: ChatSceneState = {
  pane: "flows",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "run-badge": "running",
    "step-draft": draftStep.initialStatus,
    "step-gate": gateStep.initialStatus,
    "step-post": "queued",
  },
  progress: { rail: WORKFLOW_PANE.initialProgress },
  highlights: {},
};

export const workflowApprovalScene = {
  id: "workflow-approval",
  title: "Workflow approval",
  surface: "flows",
  claim:
    "A run advances on its own and parks at a human gate - it is never falsely complete.",
  transcript:
    "The Morning digest workflow finishes drafting, and the run parks at an approval gate - waiting for your review. The final step stays queued until a human says so.",
  initialState,
  targets: [
    { id: "flow-trigger", kind: "element" },
    { id: "flow-rail", kind: "element" },
    { id: "step-collect", kind: "element" },
    { id: "run-badge", kind: "state", initialState: "running" },
    {
      id: "step-draft",
      kind: "state",
      initialState: "running",
      transitions: [{ from: "running", to: "done" }],
    },
    { id: "step-draft-status", kind: "text" },
    { id: "rail", kind: "progress" },
    {
      id: "step-gate",
      kind: "state",
      initialState: "queued",
      transitions: [{ from: "queued", to: "awaiting-approval" }],
    },
    { id: "step-gate-status", kind: "text" },
    { id: "step-post", kind: "state", initialState: "queued" },
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
      duration: 400,
      target: "flow-trigger",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 90,
      duration: 400,
      target: "flow-rail",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 90,
      duration: 400,
      target: "step-collect",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 180,
      duration: 400,
      target: "step-draft",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 270,
      duration: 400,
      target: "step-gate",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 360,
      duration: 400,
      target: "step-post",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 1100,
      duration: 350,
      target: "step-draft",
      action: { type: "set-state", from: "running", to: "done" },
      easing: "smooth",
    },
    {
      at: 1450,
      duration: 250,
      target: "step-draft-status",
      action: { type: "replace-text", text: draftStep.detail },
      easing: "smooth",
    },
    {
      at: 1700,
      duration: 400,
      target: "rail",
      action: { type: "set-progress", value: WORKFLOW_PANE.progress },
      easing: "smooth",
    },
    {
      at: 2100,
      duration: 300,
      target: "step-gate",
      action: { type: "set-state", from: "queued", to: "awaiting-approval" },
      easing: "smooth",
    },
    {
      at: 2400,
      duration: 250,
      target: "step-gate-status",
      action: { type: "replace-text", text: gateStep.detail },
      easing: "smooth",
    },
    {
      at: 2700,
      duration: 900,
      target: "step-gate",
      action: { type: "pulse", cycles: 2 },
      easing: "spring",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "advancing", at: 1300 },
    { name: "parked", at: 3600 },
    { name: "resolved", at: 3600 },
  ],
} satisfies SceneDefinition;

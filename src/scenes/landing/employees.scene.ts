import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { ORG_PANE } from "../../lib/scenes/dashboard";

const analyst = ORG_PANE.employees.find(
  ({ target }) => target === "node-analyst",
)!;
const writer = ORG_PANE.employees.find(
  ({ target }) => target === "node-writer",
)!;

const initialState: ChatSceneState = {
  pane: "org",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "node-analyst": analyst.initialPresence,
    "node-writer": writer.initialPresence,
  },
  highlights: {},
};

export const employeesScene = {
  id: "employees",
  title: "Employees",
  surface: "org",
  claim:
    "Your employees are a real org - engine, role, rank, and reporting lines you can see.",
  transcript:
    "The org chart settles: a COO running Opus 4.8 over Platform and Growth departments, while the two employees who took delegated work light up as active.",
  initialState,
  targets: [
    { id: "node-coo", kind: "element" },
    { id: "org-branch", kind: "element" },
    { id: "dept-platform", kind: "element" },
    { id: "dept-growth", kind: "element" },
    { id: "node-dev", kind: "element" },
    { id: "node-designer", kind: "element" },
    {
      id: "node-analyst",
      kind: "state",
      initialState: "idle",
      transitions: [{ from: "idle", to: "active" }],
    },
    {
      id: "node-writer",
      kind: "state",
      initialState: "idle",
      transitions: [{ from: "idle", to: "active" }],
    },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 1200,
    quietResetMs: 600,
  },
  beats: [
    {
      at: 0,
      duration: 350,
      target: "node-coo",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 350,
      duration: 250,
      target: "org-branch",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 600,
      duration: 300,
      target: "dept-platform",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 600,
      duration: 300,
      target: "node-dev",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 680,
      duration: 300,
      target: "node-designer",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 900,
      duration: 300,
      target: "dept-growth",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 900,
      duration: 300,
      target: "node-analyst",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 960,
      duration: 300,
      target: "node-writer",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 1600,
      duration: 250,
      target: "node-analyst",
      action: { type: "set-state", from: "idle", to: "active" },
      easing: "smooth",
    },
    {
      at: 1850,
      duration: 250,
      target: "node-writer",
      action: { type: "set-state", from: "idle", to: "active" },
      easing: "smooth",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "seated", at: 1300 },
    { name: "resolved", at: 2200 },
  ],
} satisfies SceneDefinition;

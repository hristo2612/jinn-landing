import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { ORG_PANE } from "../../lib/scenes/dashboard";

const dev = ORG_PANE.employees.find(({ target }) => target === "node-dev")!;

/**
 * Org ambient loop (STORYBOARD-AMENDMENT-1 §2.2) - presence is the chart's
 * heartbeat. The Dev's session (visible in the sidebar: Deploy checklist ·
 * Dev) comes alive, the COO checks in once, and the Dev goes quiet again.
 * Three beats, long silences - a quiet office, not a switchboard.
 */
const initialState: ChatSceneState = {
  pane: "org",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: { "node-dev": dev.initialPresence },
  highlights: {},
};

export const orgAmbientScene = {
  id: "org-ambient",
  title: "Org ambient",
  surface: "org",
  claim: "The org chart breathes - sessions come alive and go quiet.",
  transcript:
    "The org chart settles: a COO running Opus 4.8 over Platform and Growth departments, while the two employees who just took the delegated work light up as active.",
  initialState,
  targets: [
    {
      id: "node-dev",
      kind: "state",
      initialState: "idle",
      transitions: [
        { from: "idle", to: "active" },
        { from: "active", to: "idle" },
      ],
    },
    { id: "node-coo", kind: "element" },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 6000,
    quietResetMs: 600,
  },
  ambient: { follows: "employees", startDelay: 2000 },
  beats: [
    {
      at: 6000,
      duration: 300,
      target: "node-dev",
      action: { type: "set-state", from: "idle", to: "active" },
      easing: "smooth",
      detail: "presence → active (green dot enters)",
    },
    {
      at: 13000,
      duration: 600,
      target: "node-coo",
      action: { type: "pulse", cycles: 1 },
      easing: "spring",
      detail: "one soft breathe - the COO checks in",
    },
    {
      at: 20000,
      duration: 300,
      target: "node-dev",
      action: { type: "set-state", from: "active", to: "idle" },
      easing: "smooth",
      detail: "presence → idle (dot exits)",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "dev-active", at: 14000 },
    { name: "resolved", at: 26000 },
  ],
} satisfies SceneDefinition;

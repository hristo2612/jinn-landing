import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { FEATURES_CAPTIONS, ORG_HIRE_PANE } from "../../lib/scenes/features";

const initialState: ChatSceneState = {
  pane: "none",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {},
  highlights: {},
};

export const orgHireScene = {
  id: "org-hire",
  title: "Org hire",
  surface: "org",
  claim:
    "Growing the org is one new file - a hire takes a seat the moment it exists.",
  transcript: FEATURES_CAPTIONS["org-hire"],
  initialState,
  targets: [
    { id: "node-coo", kind: "element" },
    { id: "org-header", kind: "text" },
    { id: "org-branch-support", kind: "element" },
    { id: "dept-support", kind: "element" },
    { id: "node-support", kind: "element" },
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
      duration: 600,
      target: "node-coo",
      action: { type: "pulse", cycles: 1 },
      easing: "spring",
      detail: "The COO files the hire.",
    },
    {
      at: 800,
      duration: 300,
      target: "org-header",
      action: { type: "replace-text", text: ORG_HIRE_PANE.header },
      easing: "smooth",
      detail: "Header recounts → Org · 6 employees · 3 departments.",
    },
    {
      at: 1300,
      duration: 250,
      target: "org-branch-support",
      action: { type: "enter" },
      easing: "smooth",
      detail: "New connector stub draws.",
    },
    {
      at: 1700,
      duration: 300,
      target: "dept-support",
      action: { type: "enter" },
      easing: "smooth",
      detail: "Department label Support appears; the chart widens.",
    },
    {
      at: 2200,
      duration: 350,
      target: "node-support",
      action: { type: "enter" },
      easing: "smooth",
      detail: "Support / Employee / GPT-5.6 Sol node rises and takes its seat.",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "seated", at: 2800 },
    { name: "resolved", at: 3400 },
  ],
} satisfies SceneDefinition;

import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { TODO_142 } from "../../lib/scenes/dashboard";

const initialState: ChatSceneState = {
  pane: "todos",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "card-142": TODO_142.initialStatus,
    "card-142-disc": TODO_142.initialStatus,
  },
  highlights: {},
};

export const todosScene = {
  id: "todos",
  title: "Todos",
  surface: "todos",
  claim:
    "Work has state, an owner, a cost, and a live execution context - and done means reviewed, not just finished.",
  transcript:
    "The ledger shows four todos in honest states. The writer's pricing fix finishes executing and flips to done - reviewed by the COO, with its session and cost on the card.",
  initialState,
  targets: [
    { id: "card-funnel", kind: "element" },
    { id: "card-changelog", kind: "element" },
    { id: "card-keys", kind: "element" },
    {
      id: "card-142",
      kind: "state",
      initialState: "executing",
      transitions: [{ from: "executing", to: "done" }],
    },
    {
      id: "card-142-disc",
      kind: "state",
      initialState: "executing",
      transitions: [{ from: "executing", to: "done" }],
    },
    { id: "card-142-exec", kind: "text" },
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
      duration: 500,
      target: "card-142",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 110,
      duration: 500,
      target: "card-funnel",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 220,
      duration: 500,
      target: "card-changelog",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 330,
      duration: 500,
      target: "card-keys",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 1000,
      duration: 300,
      target: "card-142",
      action: { type: "highlight" },
      easing: "smooth",
    },
    {
      at: 1900,
      duration: 350,
      target: "card-142-disc",
      action: { type: "set-state", from: "executing", to: "done" },
      easing: "smooth",
    },
    {
      at: 2250,
      duration: 300,
      target: "card-142-exec",
      action: { type: "replace-text", text: TODO_142.exec },
      easing: "smooth",
    },
    {
      at: 2600,
      duration: 250,
      target: "card-142",
      action: { type: "set-state", from: "executing", to: "done" },
      easing: "smooth",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "ledger", at: 900 },
    { name: "completing", at: 2000 },
    { name: "resolved", at: 3100 },
  ],
} satisfies SceneDefinition;

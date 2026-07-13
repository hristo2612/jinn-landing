import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { TRIGGERS_PANE } from "../../lib/scenes/dashboard";

const cronBinding = TRIGGERS_PANE.bindings[0];

const initialState: ChatSceneState = {
  pane: "triggers",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: { "binding-cron": cronBinding.initialStatus },
  highlights: {},
};

export const triggerFireScene = {
  id: "trigger-fire",
  title: "Trigger fire",
  surface: "triggers",
  claim:
    "The company starts its own work - a schedule fires and a real run exists.",
  transcript:
    "Three trigger bindings - a cron schedule, a todo-status watcher, a webhook. The 09:00 cron fires and starts run #142, the Morning digest you just watched.",
  initialState,
  targets: [
    {
      id: "binding-cron",
      kind: "state",
      initialState: "idle",
      transitions: [{ from: "idle", to: "fired" }],
    },
    { id: "binding-todo", kind: "element" },
    { id: "binding-webhook", kind: "element" },
    { id: "run-row", kind: "element" },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 900,
    quietResetMs: 600,
  },
  beats: [
    {
      at: 0,
      duration: 450,
      target: "binding-cron",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 120,
      duration: 450,
      target: "binding-todo",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 240,
      duration: 450,
      target: "binding-webhook",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 1100,
      duration: 600,
      target: "binding-cron",
      action: { type: "pulse", cycles: 1 },
      easing: "spring",
    },
    {
      at: 1500,
      duration: 250,
      target: "binding-cron",
      action: { type: "set-state", from: "idle", to: "fired" },
      easing: "smooth",
    },
    {
      at: 1950,
      duration: 350,
      target: "run-row",
      action: { type: "enter" },
      easing: "smooth",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "fired", at: 1800 },
    { name: "resolved", at: 2500 },
  ],
} satisfies SceneDefinition;

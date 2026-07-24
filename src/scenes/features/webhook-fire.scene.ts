import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { FEATURES_CAPTIONS } from "../../lib/scenes/features";

/**
 * §05 webhook-fire - the night window. This scene plays inside the page's ONE
 * dark-scoped window (the frame carries data-theme="dark"); the scene itself
 * owns no theme beat - the scope is static window chrome, not a theme move.
 */
const initialState: ChatSceneState = {
  pane: "none",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: { "binding-webhook": "idle" },
  highlights: {},
};

export const webhookFireScene = {
  id: "webhook-fire",
  title: "Webhook fire",
  surface: "triggers",
  claim:
    "The outside world can start real work - authenticated, idempotent, and on the record.",
  transcript: FEATURES_CAPTIONS["webhook-fire"],
  initialState,
  targets: [
    { id: "binding-cron", kind: "element" },
    { id: "binding-todo", kind: "element" },
    {
      id: "binding-webhook",
      kind: "state",
      initialState: "idle",
      transitions: [{ from: "idle", to: "fired" }],
    },
    { id: "binding-poll", kind: "element" },
    { id: "run-row", kind: "element" },
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
      duration: 450,
      target: "binding-cron",
      action: { type: "enter" },
      easing: "smooth",
      detail: "Bindings enter, 120ms stagger.",
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
      at: 360,
      duration: 450,
      target: "binding-poll",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 1400,
      duration: 600,
      target: "binding-webhook",
      action: { type: "pulse", cycles: 1 },
      easing: "spring",
      detail: "The POST arrives.",
    },
    {
      at: 2000,
      duration: 250,
      target: "binding-webhook",
      action: { type: "set-state", from: "idle", to: "fired" },
      easing: "smooth",
      detail: "Disc amber; fired · 11:38 today enters.",
    },
    {
      at: 2450,
      duration: 350,
      target: "run-row",
      action: { type: "enter" },
      easing: "smooth",
      detail: "↳ run #148 started - Support triage.",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "fired", at: 2300 },
    { name: "resolved", at: 2800 },
  ],
} satisfies SceneDefinition;

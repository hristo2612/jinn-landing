import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { TRIGGERS_PANE } from "../../lib/scenes/dashboard";

const webhookBinding = TRIGGERS_PANE.bindings[2];

/**
 * Triggers ambient loop (STORYBOARD-AMENDMENT-1 §2.5) - the scripted scene
 * proved the cron; the ambient proves the webhook. One firing, exactly the way
 * the overnight feed reports it (run #140, Refund review). The cron's fired
 * state persists through every reset; only the webhook beats reprime.
 */
const initialState: ChatSceneState = {
  pane: "triggers",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: { "binding-webhook": webhookBinding.initialStatus },
  highlights: {},
};

export const triggersAmbientScene = {
  id: "triggers-ambient",
  title: "Triggers ambient",
  surface: "triggers",
  claim:
    "The company keeps waking itself - the webhook binding fires while you watch.",
  transcript:
    "Three trigger bindings - a cron schedule, a todo-status watcher, a webhook. The 09:00 cron fires and starts run #142, the Morning digest you just watched.",
  initialState,
  targets: [
    {
      id: "binding-webhook",
      kind: "state",
      initialState: "idle",
      transitions: [{ from: "idle", to: "fired" }],
    },
    { id: "run-row-refund", kind: "element" },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 8000,
    quietResetMs: 600,
  },
  ambient: { follows: "trigger-fire", startDelay: 2000 },
  beats: [
    {
      at: 7000,
      duration: 600,
      target: "binding-webhook",
      action: { type: "pulse", cycles: 1 },
      easing: "spring",
      detail: "one amber wash - the firing",
    },
    {
      at: 7600,
      duration: 250,
      target: "binding-webhook",
      action: { type: "set-state", from: "idle", to: "fired" },
      easing: "smooth",
      detail: "disc amber; label `fired · 03:05 today` enters",
    },
    {
      at: 8000,
      duration: 350,
      target: "run-row-refund",
      action: { type: "enter" },
      easing: "smooth",
      detail: "`↳ run #140 started - Refund review` slides in beneath",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "fired", at: 8400 },
    { name: "resolved", at: 14000 },
  ],
} satisfies SceneDefinition;

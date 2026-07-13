import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { FEATURES_CAPTIONS } from "../../lib/scenes/features";

/**
 * §07 slack-approve - the connector card. Continuity payoff: the reply's
 * "run #147 resumed" closes the gate left parked in §04.
 */
const initialState: ChatSceneState = {
  pane: "none",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {},
  highlights: {},
};

export const slackApproveScene = {
  id: "slack-approve",
  title: "Slack approve",
  surface: "night",
  claim:
    "A parked decision travels to where you are - and one reaction resolves it.",
  transcript: FEATURES_CAPTIONS["slack-approve"],
  initialState,
  targets: [
    { id: "connector-card", kind: "element" },
    { id: "reaction-check", kind: "element" },
    { id: "reply-row", kind: "element" },
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
      target: "connector-card",
      action: { type: "enter" },
      easing: "smooth",
      detail: "Card rises.",
    },
    {
      at: 1200,
      duration: 300,
      target: "reaction-check",
      action: { type: "enter" },
      easing: "spring",
      detail: "✅ 1 chip arrives - a small acknowledgment.",
    },
    {
      at: 2200,
      duration: 350,
      target: "reply-row",
      action: { type: "enter" },
      easing: "smooth",
      detail: "↳ Approved - refund sent, run #147 resumed. · 14:05",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "reacted", at: 1500 },
    { name: "resolved", at: 2600 },
  ],
} satisfies SceneDefinition;

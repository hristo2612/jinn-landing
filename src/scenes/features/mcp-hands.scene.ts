import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { FEATURES_CAPTIONS, MCP_HANDS_CARD } from "../../lib/scenes/features";

/**
 * §06 mcp-hands - the feed card carries tool calls; each result lands a beat
 * after its call (the honest async texture). Continuity: these four calls are
 * the §03 refund's origin story (wi_8841c47ef21a = order #8841), 10:56–10:58.
 */
const initialState: ChatSceneState = {
  pane: "none",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "row-1": "pending",
    "row-2": "pending",
    "row-3": "pending",
    "row-4": "pending",
  },
  highlights: {},
};

const rowTransitions = [{ from: "pending", to: "ok" }] as const;

export const mcpHandsScene = {
  id: "mcp-hands",
  title: "MCP hands",
  surface: "night",
  claim:
    "An employee runs the company through tool calls - filed, answered, and routed like anything else.",
  transcript: FEATURES_CAPTIONS["mcp-hands"],
  initialState,
  targets: [
    { id: "feed-card", kind: "element" },
    {
      id: "row-1",
      kind: "state",
      initialState: "pending",
      transitions: rowTransitions,
    },
    {
      id: "row-2",
      kind: "state",
      initialState: "pending",
      transitions: rowTransitions,
    },
    {
      id: "row-3",
      kind: "state",
      initialState: "pending",
      transitions: rowTransitions,
    },
    {
      id: "row-4",
      kind: "state",
      initialState: "pending",
      transitions: rowTransitions,
    },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 600,
    quietResetMs: 600,
  },
  beats: [
    {
      at: 0,
      duration: 350,
      target: "feed-card",
      action: { type: "enter" },
      easing: "smooth",
      detail: "Card rises.",
    },
    {
      at: 500,
      duration: 300,
      target: "row-1",
      action: { type: "enter" },
      easing: "smooth",
      detail: MCP_HANDS_CARD.rows[0].call,
    },
    {
      at: 1000,
      duration: 250,
      target: "row-1",
      action: { type: "set-state", from: "pending", to: "ok" },
      easing: "smooth",
      detail: "→ 3 hits.",
    },
    {
      at: 1500,
      duration: 300,
      target: "row-2",
      action: { type: "enter" },
      easing: "smooth",
      detail: MCP_HANDS_CARD.rows[1].call,
    },
    {
      at: 2000,
      duration: 250,
      target: "row-2",
      action: { type: "set-state", from: "pending", to: "ok" },
      easing: "smooth",
      detail: "→ wi_8841c47ef21a.",
    },
    {
      at: 2500,
      duration: 300,
      target: "row-3",
      action: { type: "enter" },
      easing: "smooth",
      detail: MCP_HANDS_CARD.rows[2].call,
    },
    {
      at: 3000,
      duration: 250,
      target: "row-3",
      action: { type: "set-state", from: "pending", to: "ok" },
      easing: "smooth",
    },
    {
      at: 3500,
      duration: 300,
      target: "row-4",
      action: { type: "enter" },
      easing: "smooth",
      detail: MCP_HANDS_CARD.rows[3].call,
    },
    {
      at: 4000,
      duration: 250,
      target: "row-4",
      action: { type: "set-state", from: "pending", to: "ok" },
      easing: "smooth",
      detail: "→ routed to COO.",
    },
    {
      at: 4400,
      duration: 400,
      target: "row-4",
      action: { type: "highlight" },
      easing: "smooth",
      detail: "Soft amber wash on the routed approval - decays.",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "calling", at: 2200 },
    { name: "resolved", at: 4800 },
  ],
} satisfies SceneDefinition;

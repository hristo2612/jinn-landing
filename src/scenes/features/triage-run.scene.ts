import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { FEATURES_CAPTIONS } from "../../lib/scenes/features";

/**
 * §04 triage-run - the canvas-mini replay of run #147. The cycle opens by
 * drawing the graph (nodes then wires, one L→R gesture), fires the trigger,
 * advances triage, routes down the refund lane, and PARKS at the approval
 * gate. Explicitly forbidden (STORYBOARD-FEATURES §4.5): fill past the gate,
 * any state change on Reply to customer or Send refund, a completed run chip.
 */
const initialState: ChatSceneState = {
  pane: "none",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "node-trigger": "pending",
    "node-triage": "pending",
    "node-route": "pending",
    "node-gate": "pending",
    "chip-run": "running",
  },
  progress: { "edge-route-refund": 0 },
  highlights: {},
};

export const triageRunScene = {
  id: "triage-run",
  title: "Triage run",
  surface: "flows",
  claim:
    "A run advances through a visible graph - it branches on a switch and parks at a human gate.",
  transcript: FEATURES_CAPTIONS["triage-run"],
  initialState,
  targets: [
    {
      id: "node-trigger",
      kind: "state",
      initialState: "pending",
      transitions: [{ from: "pending", to: "done" }],
    },
    {
      id: "node-triage",
      kind: "state",
      initialState: "pending",
      transitions: [
        { from: "pending", to: "running" },
        { from: "running", to: "done" },
      ],
    },
    {
      id: "node-route",
      kind: "state",
      initialState: "pending",
      transitions: [{ from: "pending", to: "done" }],
    },
    { id: "node-reply", kind: "element" },
    {
      id: "node-gate",
      kind: "state",
      initialState: "pending",
      transitions: [{ from: "pending", to: "awaiting-approval" }],
    },
    { id: "node-refund", kind: "element" },
    { id: "edge-route-refund", kind: "progress" },
    { id: "canvas-wires", kind: "element" },
    {
      id: "chip-run",
      kind: "state",
      initialState: "running",
      transitions: [{ from: "running", to: "waiting" }],
    },
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
      target: "node-trigger",
      action: { type: "enter" },
      easing: "smooth",
      detail: "Nodes draw L→R, 80ms stagger - one gesture.",
    },
    {
      at: 80,
      duration: 400,
      target: "node-triage",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 160,
      duration: 400,
      target: "node-route",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 240,
      duration: 400,
      target: "node-reply",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 320,
      duration: 400,
      target: "node-gate",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 400,
      duration: 400,
      target: "node-refund",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 520,
      duration: 380,
      target: "canvas-wires",
      action: { type: "enter" },
      easing: "smooth",
      detail: "Then the wires.",
    },
    {
      at: 800,
      duration: 500,
      target: "node-trigger",
      action: { type: "set-state", from: "pending", to: "done" },
      easing: "smooth",
      detail:
        "Fired: one amber disc wash (decays), status Done, fired · 11:12.",
    },
    {
      at: 1200,
      duration: 350,
      target: "node-triage",
      action: { type: "set-state", from: "pending", to: "running" },
      easing: "smooth",
      detail: "Up next → Running (blue spinner).",
    },
    {
      at: 2200,
      duration: 350,
      target: "node-triage",
      action: { type: "set-state", from: "running", to: "done" },
      easing: "smooth",
      detail: "Running → Done (green check).",
    },
    {
      at: 2500,
      duration: 300,
      target: "node-route",
      action: { type: "set-state", from: "pending", to: "done" },
      easing: "smooth",
      detail: "The switch resolves.",
    },
    {
      at: 2800,
      duration: 400,
      target: "edge-route-refund",
      action: { type: "set-progress", value: 1 },
      easing: "smooth",
      detail:
        "The refund lane's wire takes the fill - direction is meaning; lane A stays quiet.",
    },
    {
      at: 3300,
      duration: 350,
      target: "node-gate",
      action: { type: "set-state", from: "pending", to: "awaiting-approval" },
      easing: "smooth",
      detail: "Clock → bell; Waits for your approval.",
    },
    {
      at: 3600,
      duration: 400,
      target: "node-gate",
      action: { type: "pulse", cycles: 2 },
      easing: "spring",
      detail: "Exactly two soft pulses, then still.",
    },
    {
      at: 3950,
      duration: 250,
      target: "chip-run",
      action: { type: "set-state", from: "running", to: "waiting" },
      easing: "smooth",
      detail: "Running now → Waiting for you.",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "drawn", at: 800 },
    { name: "routed", at: 3200 },
    { name: "parked", at: 4200 },
    { name: "resolved", at: 4200 },
  ],
} satisfies SceneDefinition;

import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { TODOS_PANE, TODO_RELNOTES } from "../../lib/scenes/dashboard";

const changelog = TODOS_PANE.cards.find(
  ({ target }) => target === "card-changelog",
)!;

/**
 * Todos ambient loop (STORYBOARD-AMENDMENT-1 §2.3, verbatim) - status-driven
 * movement, the honest version: a new card rises into the ledger, executes,
 * completes reviewed - and the changelog card it was blocking quietly
 * unblocks. One set-state per semantic moment, exactly the approved six rows;
 * every card-level visual (session line, badge, waiting-reason, disc) is the
 * surface's DERIVED presentation of that single state. The whole-pane quiet
 * reset means no card ever visibly "un-completes".
 */
const initialState: ChatSceneState = {
  pane: "todos",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "card-relnotes-disc": TODO_RELNOTES.initialStatus,
    "card-changelog": changelog.status,
  },
  highlights: {},
};

export const todosAmbientScene = {
  id: "todos-ambient",
  title: "Todos ambient",
  surface: "todos",
  claim:
    "The ledger keeps moving - new work arrives, runs, completes reviewed, and unblocks what waited on it.",
  transcript:
    "The ledger shows four todos in honest states. The writer's pricing fix finishes executing and flips to done - reviewed by the COO, with its session and cost on the card.",
  initialState,
  targets: [
    { id: "card-relnotes", kind: "element" },
    {
      id: "card-relnotes-disc",
      kind: "state",
      initialState: "assigned",
      transitions: [
        { from: "assigned", to: "executing" },
        { from: "executing", to: "done" },
      ],
    },
    { id: "card-relnotes-exec", kind: "text" },
    {
      id: "card-changelog",
      kind: "state",
      initialState: "blocked",
      transitions: [{ from: "blocked", to: "assigned" }],
    },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 6000,
    quietResetMs: 600,
  },
  ambient: { follows: "todos", startDelay: 2000 },
  beats: [
    {
      at: 5000,
      duration: 400,
      target: "card-relnotes",
      action: { type: "enter" },
      easing: "smooth",
      detail: "new card rises in at top - existing cards slide down one slot",
    },
    {
      at: 11000,
      duration: 350,
      target: "card-relnotes-disc",
      action: { type: "set-state", from: "assigned", to: "executing" },
      easing: "smooth",
      detail: "assigned → executing - blue spinner enters, honest running blue",
    },
    {
      at: 12000,
      duration: 300,
      target: "card-relnotes-exec",
      action: { type: "replace-text", text: TODO_RELNOTES.initialExec },
      easing: "smooth",
      detail: "exec line → Session · release-notes · Open (row grows open)",
    },
    {
      at: 19000,
      duration: 350,
      target: "card-relnotes-disc",
      action: { type: "set-state", from: "executing", to: "done" },
      easing: "smooth",
      detail: "executing → done - spinner → green check",
    },
    {
      at: 20000,
      duration: 300,
      target: "card-relnotes-exec",
      action: { type: "replace-text", text: TODO_RELNOTES.exec },
      easing: "smooth",
      detail: "→ Done · reviewed by Jimbo",
    },
    {
      at: 26000,
      duration: 350,
      target: "card-changelog",
      action: { type: "set-state", from: "blocked", to: "assigned" },
      easing: "smooth",
      detail:
        "blocked badge clears → assigned - the block is resolved, cause and effect on screen",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "entered", at: 6000 },
    { name: "working", at: 12600 },
    { name: "unblocked", at: 27000 },
    { name: "resolved", at: 32000 },
  ],
} satisfies SceneDefinition;

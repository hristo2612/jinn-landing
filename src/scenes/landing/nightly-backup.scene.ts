import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { BACKUP_PANE } from "../../lib/scenes/dashboard";

const [snapshot, prune, verify] = BACKUP_PANE.steps;

/**
 * Nightly backup - run #139 (STORYBOARD-AMENDMENT-1 §2.4, approved cadence
 * verbatim: entrance at 0ms with the 90ms L→R stagger; transitions at
 * 1200/1800/2400/6400/7000/7600/12600/13100ms; resolved ~13.5s). Status-line
 * text beats are co-timed with their state rows - they ARE the table's
 * "status →" annotations, the same serialization the approved
 * workflow-approval scene uses. Selected only through ScenePlayer.swap from
 * the real segmented control; scroll activation always restores the parked
 * Morning digest narrative.
 */
const initialState: ChatSceneState = {
  pane: "flows",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  targetStates: {
    "flow-variant": "backup",
    "bk-badge": "running",
    "step-snapshot": snapshot.initialStatus,
    "step-prune": prune.initialStatus,
    "step-verify": verify.initialStatus,
  },
  progress: { "bk-fill": BACKUP_PANE.initialProgress },
  highlights: {},
};

export const nightlyBackupScene = {
  id: "nightly-backup",
  title: "Nightly backup",
  surface: "flows",
  claim:
    "A gate-less run completes on its own - snapshot, prune, verify, done.",
  transcript:
    "The Nightly backup workflow replays run #139: the 02:00 trigger fires and three steps - snapshot database, prune old snapshots, verify integrity - run to completion. No gate; the run finishes on its own.",
  initialState,
  targets: [
    { id: "flow-variant", kind: "state", initialState: "backup" },
    {
      id: "bk-badge",
      kind: "state",
      initialState: "running",
      transitions: [{ from: "running", to: "completed" }],
    },
    { id: "bk-trigger", kind: "element" },
    { id: "bk-rail", kind: "element" },
    { id: "bk-fill", kind: "progress" },
    {
      id: "step-snapshot",
      kind: "state",
      initialState: "running",
      transitions: [{ from: "running", to: "done" }],
    },
    { id: "step-snapshot-status", kind: "text" },
    {
      id: "step-prune",
      kind: "state",
      initialState: "queued",
      transitions: [
        { from: "queued", to: "running" },
        { from: "running", to: "done" },
      ],
    },
    { id: "step-prune-status", kind: "text" },
    {
      id: "step-verify",
      kind: "state",
      initialState: "queued",
      transitions: [
        { from: "queued", to: "running" },
        { from: "running", to: "done" },
      ],
    },
    { id: "step-verify-status", kind: "text" },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 8000,
    quietResetMs: 600,
  },
  beats: [
    {
      at: 0,
      duration: 400,
      target: "bk-trigger",
      action: { type: "enter" },
      easing: "smooth",
      detail: "the 02:00 chip arrives",
    },
    {
      at: 90,
      duration: 400,
      target: "bk-rail",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 90,
      duration: 400,
      target: "step-snapshot",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 180,
      duration: 400,
      target: "step-prune",
      action: { type: "enter" },
      easing: "smooth",
    },
    {
      at: 270,
      duration: 400,
      target: "step-verify",
      action: { type: "enter" },
      easing: "smooth",
      detail: "steps L→R, 90ms stagger - one gesture",
    },
    {
      at: 1200,
      duration: 350,
      target: "step-snapshot",
      action: { type: "set-state", from: "running", to: "done" },
      easing: "smooth",
    },
    {
      at: 1200,
      duration: 250,
      target: "step-snapshot-status",
      action: { type: "replace-text", text: snapshot.detail },
      easing: "smooth",
      detail: "status → Completed · 4s",
    },
    {
      at: 1800,
      duration: 400,
      target: "bk-fill",
      action: { type: "set-progress", value: 0.5 },
      easing: "smooth",
      detail: "rail fills to step 2",
    },
    {
      at: 2400,
      duration: 350,
      target: "step-prune",
      action: { type: "set-state", from: "queued", to: "running" },
      easing: "smooth",
    },
    {
      at: 2400,
      duration: 250,
      target: "step-prune-status",
      action: { type: "replace-text", text: "Running" },
      easing: "smooth",
    },
    {
      at: 6400,
      duration: 350,
      target: "step-prune",
      action: { type: "set-state", from: "running", to: "done" },
      easing: "smooth",
    },
    {
      at: 6400,
      duration: 250,
      target: "step-prune-status",
      action: { type: "replace-text", text: prune.detail },
      easing: "smooth",
      detail: "status → Completed · 3s",
    },
    {
      at: 7000,
      duration: 400,
      target: "bk-fill",
      action: { type: "set-progress", value: 1 },
      easing: "smooth",
      detail: "rail fills to step 3",
    },
    {
      at: 7600,
      duration: 350,
      target: "step-verify",
      action: { type: "set-state", from: "queued", to: "running" },
      easing: "smooth",
    },
    {
      at: 7600,
      duration: 250,
      target: "step-verify-status",
      action: { type: "replace-text", text: "Running" },
      easing: "smooth",
    },
    {
      at: 12600,
      duration: 350,
      target: "step-verify",
      action: { type: "set-state", from: "running", to: "done" },
      easing: "smooth",
    },
    {
      at: 12600,
      duration: 250,
      target: "step-verify-status",
      action: { type: "replace-text", text: verify.detail },
      easing: "smooth",
      detail: "status → Completed · 2s",
    },
    {
      at: 13100,
      duration: 250,
      target: "bk-badge",
      action: { type: "set-state", from: "running", to: "completed" },
      easing: "smooth",
      detail: "Running → Completed (green)",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "backup-running", at: 3200 },
    { name: "backup-complete", at: 13500 },
    { name: "resolved", at: 13500 },
  ],
} satisfies SceneDefinition;

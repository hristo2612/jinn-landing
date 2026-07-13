import type { ChatSceneState, SceneDefinition } from "../../lib/scenes/types";
import { NIGHT_FEED } from "../../lib/scenes/dashboard";

/**
 * STORYBOARD §Section 6 - the overnight feed. The card rises, six events
 * enter in order, and the one decision waiting for you lifts on an amber
 * wash and holds. Deliberately NOT alive (AMENDMENT §2.6): once, retained,
 * zero ambient. The startDelay preserves the resolved SSR proof through
 * activation and keeps the scene still until its window is actually seen.
 */
const initialState: ChatSceneState = {
  pane: "none",
  pill: { name: "Jimbo", meta: "· COO · Opus 4.8", presence: "idle" },
  thread: [],
  composerPlaceholder: "Message Jimbo…",
  highlights: {},
};

export const nightShiftScene = {
  id: "night-shift",
  title: "While you slept",
  surface: "night",
  claim:
    "The company kept working through the night, and left one decision at your door.",
  transcript:
    "An overnight feed: a backup ran, a webhook opened a refund review, todos completed with review, the analyst filed a report - and the morning digest is drafted, waiting for you.",
  initialState,
  targets: [
    { id: "feed-card", kind: "element" },
    ...NIGHT_FEED.rows.map(({ target }) => ({
      id: target,
      kind: "element" as const,
    })),
  ],
  playback: {
    mode: "once",
    entry: "play",
    offscreen: "pause",
    startDelayMs: 350,
  },
  beats: [
    {
      at: 0,
      duration: 350,
      target: "feed-card",
      action: { type: "enter" },
      easing: "smooth",
    },
    ...NIGHT_FEED.rows.map((row, index) => ({
      at: 500 + index * 400,
      duration: 300,
      target: row.target,
      action: { type: "enter" as const },
      easing: "smooth" as const,
    })),
    {
      at: 3000,
      duration: 400,
      target: "row-6",
      action: { type: "highlight" },
      easing: "smooth",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "feeding", at: 1900 },
    { name: "resolved", at: 3400 },
  ],
} satisfies SceneDefinition;

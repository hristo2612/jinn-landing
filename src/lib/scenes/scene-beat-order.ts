import type { SceneBeat } from "./types";

// One microsecond keeps t=0 as the authored pre-timeline boundary while
// remaining effectively immediate once playback advances.
const AFTER_INITIAL_BOUNDARY_MS = 0.001;

/**
 * Canonical semantic commit time shared by the reducer and browser player.
 * State changes commit at beat start; all other actions retain their existing
 * completed-beat reducer semantics.
 */
export function sceneBeatCommitAt(beat: SceneBeat): number {
  if (beat.action.type === "set-state") {
    return beat.at === 0 ? AFTER_INITIAL_BOUNDARY_MS : beat.at;
  }
  return beat.at + (beat.duration ?? 0);
}

export function orderSceneBeatsByCommit(
  beats: readonly SceneBeat[],
): Array<{ beat: SceneBeat; index: number }> {
  return beats
    .map((beat, index) => ({ beat, index }))
    .sort(
      (left, right) =>
        sceneBeatCommitAt(left.beat) - sceneBeatCommitAt(right.beat) ||
        left.index - right.index,
    );
}

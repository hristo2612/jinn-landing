import { describe, expect, it } from "vitest";

import { nightShiftScene } from "../../src/scenes/landing/night-shift.scene";
import { morningApprovalScene } from "../../src/scenes/landing/morning-approval.scene";
import { workflowApprovalScene } from "../../src/scenes/landing/workflow-approval.scene";
import { MORNING_PANE, NIGHT_FEED } from "../../src/lib/scenes/dashboard";
import {
  resolveSceneCheckpoint,
  resolveSceneEndState,
} from "../../src/lib/scenes/scene-reducer";
import { validateSceneDefinition } from "../../src/lib/scenes/scene-validator";

describe("night-shift", () => {
  it("authors the overnight feed storyboard verbatim", () => {
    expect(() => validateSceneDefinition(nightShiftScene)).not.toThrow();
    expect(nightShiftScene.playback).toEqual({
      mode: "once",
      entry: "play",
      offscreen: "pause",
      startDelayMs: 350,
    });
    expect(nightShiftScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "feeding", at: 1900 },
      { name: "resolved", at: 3400 },
    ]);
    expect(
      nightShiftScene.beats.map(({ at, duration, target, action }) => [
        at,
        duration,
        target,
        action.type,
      ]),
    ).toEqual([
      [0, 350, "feed-card", "enter"],
      [500, 300, "row-1", "enter"],
      [900, 300, "row-2", "enter"],
      [1300, 300, "row-3", "enter"],
      [1700, 300, "row-4", "enter"],
      [2100, 300, "row-5", "enter"],
      [2500, 300, "row-6", "enter"],
      [3000, 400, "row-6", "highlight"],
    ]);
  });

  it("resolves to the retained feed with only the waiting row lifted", () => {
    expect(resolveSceneCheckpoint(nightShiftScene, "initial")).toEqual(
      nightShiftScene.initialState,
    );
    expect(resolveSceneEndState(nightShiftScene)).toEqual({
      ...nightShiftScene.initialState,
      highlights: { "row-6": true },
    });
  });

  it("keeps one scene row per canonical feed row", () => {
    expect(NIGHT_FEED.rows).toHaveLength(6);
    const rowTargets = nightShiftScene.targets
      .map(({ id }) => id)
      .filter((id) => id.startsWith("row-"));
    expect(rowTargets).toEqual(NIGHT_FEED.rows.map(({ target }) => target));
  });
});

describe("morning-approval", () => {
  it("authors the stable-theme approval storyboard verbatim", () => {
    expect(() => validateSceneDefinition(morningApprovalScene)).not.toThrow();
    expect(morningApprovalScene.playback).toEqual({
      mode: "once",
      entry: "play",
      offscreen: "pause",
      startDelayMs: 0,
    });
    expect(morningApprovalScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "visible", at: 750 },
      { name: "approved", at: 2500 },
      { name: "resolved", at: 4400 },
    ]);
    expect(
      morningApprovalScene.beats.map(({ at, duration, target, action }) => [
        at,
        duration,
        target,
        action.type,
      ]),
    ).toEqual([
      [0, 400, "approval-card", "enter"],
      [400, 350, "rail-tail", "enter"],
      [1600, 250, "approve", "pulse"],
      [1850, 300, "step-gate", "set-state"],
      [2150, 250, "step-gate-status", "replace-text"],
      [2400, 350, "rail-tail", "set-progress"],
      [2750, 300, "step-post", "set-state"],
      [3450, 300, "step-post", "set-state"],
      [3750, 250, "step-post-status", "replace-text"],
      [4000, 250, "run-badge", "set-state"],
    ]);
  });

  it("never owns or mutates the page theme", () => {
    expect(morningApprovalScene.initialState.theme).toBeUndefined();
    expect(JSON.stringify(morningApprovalScene.beats)).not.toContain(
      '"type":"theme"',
    );
    expect(JSON.stringify(morningApprovalScene.targets)).not.toContain(
      '"kind":"theme"',
    );
  });

  it("resolves run #142 honestly - approve, cross, run, complete", () => {
    expect(resolveSceneCheckpoint(morningApprovalScene, "initial")).toEqual(
      morningApprovalScene.initialState,
    );
    const approved = resolveSceneCheckpoint(morningApprovalScene, "approved");
    expect(approved.targetStates).toEqual({
      "step-gate": "approved",
      "step-post": "queued",
      "run-badge": "running",
    });
    expect(resolveSceneEndState(morningApprovalScene)).toEqual({
      ...morningApprovalScene.initialState,
      targetStates: {
        "step-gate": "approved",
        "step-post": "done",
        "run-badge": "completed",
      },
      progress: { "rail-tail": MORNING_PANE.progress },
    });
  });

  it("is the only scene that may resolve the gate", () => {
    const touchesGate = (definition: {
      beats: readonly { target: string; action: { type: string } }[];
    }) =>
      definition.beats.some(
        ({ target, action }) =>
          target === "step-gate" && action.type === "set-state",
      );
    expect(touchesGate(morningApprovalScene)).toBe(true);
    expect(
      workflowApprovalScene.beats.some(
        ({ target, action }) =>
          target === "step-gate" &&
          action.type === "set-state" &&
          "to" in action &&
          action.to !== "awaiting-approval",
      ),
    ).toBe(false);
  });
});

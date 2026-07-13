import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { delegationScene } from "../../src/scenes/landing/delegation.scene";
import { employeesScene } from "../../src/scenes/landing/employees.scene";
import { todosScene } from "../../src/scenes/landing/todos.scene";
import { workflowApprovalScene } from "../../src/scenes/landing/workflow-approval.scene";
import { triggerFireScene } from "../../src/scenes/landing/trigger-fire.scene";
import {
  resolveSceneCheckpoint,
  resolveSceneEndState,
} from "../../src/lib/scenes/scene-reducer";
import { validateSceneDefinition } from "../../src/lib/scenes/scene-validator";

const productStoryScenes = [
  delegationScene,
  employeesScene,
  todosScene,
  workflowApprovalScene,
  triggerFireScene,
];

const cycleMs = (scene: (typeof productStoryScenes)[number]): number =>
  scene.checkpoints.find(({ name }) => name === "resolved")!.at +
  (scene.playback.dwellMs ?? 0) +
  (scene.playback.quietResetMs ?? 0);

describe("product story scenes", () => {
  it("loops each truthful proof in the calm 3–6 second envelope", () => {
    for (const scene of productStoryScenes) {
      expect(scene.playback.mode, scene.id).toBe("loop");
      expect(cycleMs(scene), scene.id).toBeGreaterThanOrEqual(3_000);
      expect(cycleMs(scene), scene.id).toBeLessThanOrEqual(6_000);
      expect(scene.playback.dwellMs, scene.id).toBeGreaterThanOrEqual(800);
      expect(scene.playback.quietResetMs, scene.id).toBe(600);
    }
  });

  it("keeps authored initial narrative copy out of reusable surface chrome", () => {
    const todosSurface = readFileSync(
      new URL(
        "../../src/components/scenes/surfaces/TodosSurface.astro",
        import.meta.url,
      ),
      "utf8",
    );
    const workflowSurface = readFileSync(
      new URL(
        "../../src/components/scenes/surfaces/WorkflowSurface.astro",
        import.meta.url,
      ),
      "utf8",
    );

    expect(todosSurface).not.toContain("Session · landing-copy-pass · Open");
    expect(workflowSurface).not.toContain("Writing summary…");
    expect(workflowSurface).not.toContain(">\n                      Queued\n");
  });

  it("authors the employees storyboard verbatim", () => {
    expect(() => validateSceneDefinition(employeesScene)).not.toThrow();
    expect(employeesScene.playback).toEqual({
      mode: "loop",
      entry: "play",
      offscreen: "pause",
      dwellMs: 1200,
      quietResetMs: 600,
    });
    expect(employeesScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "seated", at: 1300 },
      { name: "resolved", at: 2200 },
    ]);
    expect(
      employeesScene.beats.map(({ at, duration, target, action }) => [
        at,
        duration,
        target,
        action.type,
      ]),
    ).toEqual([
      [0, 350, "node-coo", "enter"],
      [350, 250, "org-branch", "enter"],
      [600, 300, "dept-platform", "enter"],
      [600, 300, "node-dev", "enter"],
      [680, 300, "node-designer", "enter"],
      [900, 300, "dept-growth", "enter"],
      [900, 300, "node-analyst", "enter"],
      [960, 300, "node-writer", "enter"],
      [1600, 250, "node-analyst", "set-state"],
      [1850, 250, "node-writer", "set-state"],
    ]);

    expect(resolveSceneCheckpoint(employeesScene, "initial")).toEqual(
      employeesScene.initialState,
    );
    expect(resolveSceneEndState(employeesScene)).toEqual({
      ...employeesScene.initialState,
      targetStates: { "node-analyst": "active", "node-writer": "active" },
      highlights: {},
    });
  });

  it("authors the todos timeline and reviewed-done truth verbatim", () => {
    expect(() => validateSceneDefinition(todosScene)).not.toThrow();
    expect(todosScene.playback.entry).toBe("play");
    expect(todosScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "ledger", at: 900 },
      { name: "completing", at: 2000 },
      { name: "resolved", at: 3100 },
    ]);
    expect(
      todosScene.beats.map(({ at, duration, target, action }) => [
        at,
        duration,
        target,
        action.type,
      ]),
    ).toEqual([
      [0, 500, "card-142", "enter"],
      [110, 500, "card-funnel", "enter"],
      [220, 500, "card-changelog", "enter"],
      [330, 500, "card-keys", "enter"],
      [1000, 300, "card-142", "highlight"],
      [1900, 350, "card-142-disc", "set-state"],
      [2250, 300, "card-142-exec", "replace-text"],
      [2600, 250, "card-142", "set-state"],
    ]);
    expect(resolveSceneEndState(todosScene)).toEqual({
      ...todosScene.initialState,
      targetStates: { "card-142-disc": "done", "card-142": "done" },
      highlights: {
        "card-142": true,
      },
    });
  });

  it("parks workflow #142 honestly at its approval gate", () => {
    expect(() => validateSceneDefinition(workflowApprovalScene)).not.toThrow();
    expect(workflowApprovalScene.playback.entry).toBe("play");
    expect(workflowApprovalScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "advancing", at: 1300 },
      { name: "parked", at: 3600 },
      { name: "resolved", at: 3600 },
    ]);
    expect(
      workflowApprovalScene.beats
        .filter(({ action }) => action.type === "enter")
        .map(({ at, duration, target }) => [at, duration, target]),
    ).toEqual([
      [0, 400, "flow-trigger"],
      [90, 400, "flow-rail"],
      [90, 400, "step-collect"],
      [180, 400, "step-draft"],
      [270, 400, "step-gate"],
      [360, 400, "step-post"],
    ]);
    const parked = resolveSceneEndState(workflowApprovalScene);
    expect(parked).toEqual({
      ...workflowApprovalScene.initialState,
      targetStates: {
        "run-badge": "running",
        "step-draft": "done",
        "step-gate": "awaiting-approval",
        "step-post": "queued",
      },
      progress: { rail: 2 / 3 },
      highlights: {},
    });
    expect(
      workflowApprovalScene.beats.some(
        (beat) => beat.target === "step-post" && beat.action.type !== "enter",
      ),
    ).toBe(false);
    expect(
      workflowApprovalScene.beats.some((beat) => beat.target === "run-badge"),
    ).toBe(false);
  });

  it("fires the 09:00 binding and creates run #142", () => {
    expect(() => validateSceneDefinition(triggerFireScene)).not.toThrow();
    expect(triggerFireScene.playback.entry).toBe("play");
    expect(triggerFireScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "fired", at: 1800 },
      { name: "resolved", at: 2500 },
    ]);
    expect(
      triggerFireScene.beats.map(({ at, duration, target, action }) => [
        at,
        duration,
        target,
        action.type,
      ]),
    ).toEqual([
      [0, 450, "binding-cron", "enter"],
      [120, 450, "binding-todo", "enter"],
      [240, 450, "binding-webhook", "enter"],
      [1100, 600, "binding-cron", "pulse"],
      [1500, 250, "binding-cron", "set-state"],
      [1950, 350, "run-row", "enter"],
    ]);
    expect(resolveSceneEndState(triggerFireScene)).toEqual({
      ...triggerFireScene.initialState,
      targetStates: { "binding-cron": "fired" },
      highlights: {},
    });
  });
});

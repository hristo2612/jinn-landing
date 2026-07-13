import { describe, expect, it } from "vitest";

import { landingSceneDefinitions } from "../../src/lib/scenes/install-scene-system";
import { nightlyBackupScene } from "../../src/scenes/landing/nightly-backup.scene";
import { orgAmbientScene } from "../../src/scenes/landing/org-ambient.scene";
import { todosAmbientScene } from "../../src/scenes/landing/todos-ambient.scene";
import { triggersAmbientScene } from "../../src/scenes/landing/triggers-ambient.scene";
import {
  BACKUP_PANE,
  TODO_RELNOTES,
  WORKFLOW_SWITCHER,
} from "../../src/lib/scenes/dashboard";
import { resolveSceneEndState } from "../../src/lib/scenes/scene-reducer";
import {
  validateSceneDefinition,
  validateSceneRegistry,
} from "../../src/lib/scenes/scene-validator";

describe("amendment ambient scenes", () => {
  it("keeps historical ambient definitions out of the independent page registry", () => {
    expect(() => validateSceneRegistry(landingSceneDefinitions)).not.toThrow();
    expect([...landingSceneDefinitions.keys()]).toEqual([
      "delegation",
      "employees",
      "todos",
      "workflow-approval",
      "trigger-fire",
      "night-shift",
      "morning-approval",
    ]);
  });

  it("authors the todos ambient storyboard verbatim (§2.3 - the approved six rows)", () => {
    expect(() => validateSceneDefinition(todosAmbientScene)).not.toThrow();
    expect(todosAmbientScene.playback).toEqual({
      mode: "loop",
      entry: "play",
      offscreen: "pause",
      dwellMs: 6000,
      quietResetMs: 600,
    });
    expect(todosAmbientScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "entered", at: 6000 },
      { name: "working", at: 12600 },
      { name: "unblocked", at: 27000 },
      { name: "resolved", at: 32000 },
    ]);
    // The amendment §2.3 table, row for row: one action per semantic moment.
    expect(
      todosAmbientScene.beats.map(({ at, duration, target, action }) => [
        at,
        duration,
        target,
        action.type,
      ]),
    ).toEqual([
      [5000, 400, "card-relnotes", "enter"],
      [11000, 350, "card-relnotes-disc", "set-state"],
      [12000, 300, "card-relnotes-exec", "replace-text"],
      [19000, 350, "card-relnotes-disc", "set-state"],
      [20000, 300, "card-relnotes-exec", "replace-text"],
      [26000, 350, "card-changelog", "set-state"],
    ]);
    // Cause and effect: the release notes complete reviewed, the changelog
    // card they were blocking reads assigned - single-owner states only.
    expect(resolveSceneEndState(todosAmbientScene)).toEqual({
      ...todosAmbientScene.initialState,
      targetStates: {
        "card-relnotes-disc": "done",
        "card-changelog": "assigned",
      },
    });
    // The exec line's two payloads are the canonical card's own strings.
    const execTexts = todosAmbientScene.beats
      .filter(({ action }) => action.type === "replace-text")
      .map(({ action }) => (action.type === "replace-text" ? action.text : ""));
    expect(execTexts).toEqual([TODO_RELNOTES.initialExec, TODO_RELNOTES.exec]);
  });

  it("authors the org ambient storyboard verbatim (§2.2)", () => {
    expect(() => validateSceneDefinition(orgAmbientScene)).not.toThrow();
    expect(orgAmbientScene.playback).toEqual({
      mode: "loop",
      entry: "play",
      offscreen: "pause",
      dwellMs: 6000,
      quietResetMs: 600,
    });
    expect(orgAmbientScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "dev-active", at: 14000 },
      { name: "resolved", at: 26000 },
    ]);
    expect(
      orgAmbientScene.beats.map(({ at, duration, target, action }) => [
        at,
        duration,
        target,
        action.type,
      ]),
    ).toEqual([
      [6000, 300, "node-dev", "set-state"],
      [13000, 600, "node-coo", "pulse"],
      [20000, 300, "node-dev", "set-state"],
    ]);
    // The loop ends where it began: the office goes quiet again.
    expect(resolveSceneEndState(orgAmbientScene)).toEqual(
      orgAmbientScene.initialState,
    );
  });

  it("authors the triggers ambient storyboard verbatim (§2.5)", () => {
    expect(() => validateSceneDefinition(triggersAmbientScene)).not.toThrow();
    expect(triggersAmbientScene.playback).toEqual({
      mode: "loop",
      entry: "play",
      offscreen: "pause",
      dwellMs: 8000,
      quietResetMs: 600,
    });
    expect(triggersAmbientScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "fired", at: 8400 },
      { name: "resolved", at: 14000 },
    ]);
    expect(
      triggersAmbientScene.beats.map(({ at, duration, target, action }) => [
        at,
        duration,
        target,
        action.type,
      ]),
    ).toEqual([
      [7000, 600, "binding-webhook", "pulse"],
      [7600, 250, "binding-webhook", "set-state"],
      [8000, 350, "run-row-refund", "enter"],
    ]);
    expect(resolveSceneEndState(triggersAmbientScene)).toEqual({
      ...triggersAmbientScene.initialState,
      targetStates: { "binding-webhook": "fired" },
    });
  });

  it("authors the gate-less nightly backup run at the approved §2.4 cadence", () => {
    expect(() => validateSceneDefinition(nightlyBackupScene)).not.toThrow();
    // Swap-selected, never scheduler-selected: a loop scene WITHOUT ambient.
    expect(
      landingSceneDefinitions.get("nightly-backup")?.ambient,
    ).toBeUndefined();
    expect(nightlyBackupScene.playback).toEqual({
      mode: "loop",
      entry: "play",
      offscreen: "pause",
      dwellMs: 8000,
      quietResetMs: 600,
    });
    expect(nightlyBackupScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "backup-running", at: 3200 },
      { name: "backup-complete", at: 13500 },
      { name: "resolved", at: 13500 },
    ]);
    // The amendment §2.4 table verbatim: entrance at 0 with the 90ms L→R
    // stagger; semantic transitions at 1200/1800/2400/6400/7000/7600/12600/
    // 13100ms. Status-line replace-text beats are co-timed with their state
    // rows (the table's "status →" annotations). Pane continuity across the
    // swap is machinery-owned - no compensating highlight beats exist.
    expect(
      nightlyBackupScene.beats.map(({ at, target, action }) => [
        at,
        target,
        action.type,
      ]),
    ).toEqual([
      [0, "bk-trigger", "enter"],
      [90, "bk-rail", "enter"],
      [90, "step-snapshot", "enter"],
      [180, "step-prune", "enter"],
      [270, "step-verify", "enter"],
      [1200, "step-snapshot", "set-state"],
      [1200, "step-snapshot-status", "replace-text"],
      [1800, "bk-fill", "set-progress"],
      [2400, "step-prune", "set-state"],
      [2400, "step-prune-status", "replace-text"],
      [6400, "step-prune", "set-state"],
      [6400, "step-prune-status", "replace-text"],
      [7000, "bk-fill", "set-progress"],
      [7600, "step-verify", "set-state"],
      [7600, "step-verify-status", "replace-text"],
      [12600, "step-verify", "set-state"],
      [12600, "step-verify-status", "replace-text"],
      [13100, "bk-badge", "set-state"],
    ]);
    expect(resolveSceneEndState(nightlyBackupScene)).toEqual({
      ...nightlyBackupScene.initialState,
      targetStates: {
        "flow-variant": "backup",
        "bk-badge": "completed",
        "step-snapshot": "done",
        "step-prune": "done",
        "step-verify": "done",
      },
      progress: { "bk-fill": 1 },
    });
    // The switcher's canonical options map exactly to the two flows scenes.
    expect(WORKFLOW_SWITCHER.label).toBe("Choose workflow");
    expect(WORKFLOW_SWITCHER.options.map(({ sceneId }) => sceneId)).toEqual([
      "workflow-approval",
      "nightly-backup",
    ]);
    expect(WORKFLOW_SWITCHER.options.map(({ label }) => label)).toEqual([
      "Morning digest",
      "Nightly backup",
    ]);
    // Fiction consistency: the completed run reads exactly as the overnight
    // feed reported it; interim details use only sanctioned strings.
    expect(BACKUP_PANE.header).toBe("Nightly backup · Run #139 · round 1");
    expect(BACKUP_PANE.steps.map(({ initialDetail }) => initialDetail)).toEqual(
      ["Running", "Queued", "Queued"],
    );
  });
});

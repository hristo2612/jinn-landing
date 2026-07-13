import { describe, expect, it } from "vitest";

import {
  delegationInitial,
  delegationResolved,
} from "../../src/lib/scenes/dashboard";
import { resolveSceneCheckpoint } from "../../src/lib/scenes/scene-reducer";
import type { SceneDefinition } from "../../src/lib/scenes/types";
import { delegationScene } from "../../src/scenes/landing/delegation.scene";

const transcript =
  "You message the COO about a signup dip. It replies with a plan, delegates research to the analyst and a copy fix to the writer, and reports the first finding - with a todo already open.";

describe("delegation scene definition", () => {
  it("authors the storyboard identity, transcript, checkpoints, and loop policy exactly", () => {
    expect(delegationScene.id).toBe("delegation");
    expect(delegationScene.title).toBe("Delegation");
    expect(delegationScene.surface).toBe("chat");
    expect(delegationScene.claim).toBe(
      "You run the company by talking to it - one message becomes delegated, owned work.",
    );
    expect(delegationScene.transcript).toBe(transcript);
    expect(delegationScene.checkpoints).toEqual([
      { name: "initial", at: 0 },
      { name: "sent", at: 1500 },
      { name: "delegated", at: 3500 },
      { name: "resolved", at: 4200 },
    ]);
    expect(delegationScene.playback).toEqual({
      mode: "loop",
      entry: "play",
      offscreen: "pause",
      startDelayMs: 0,
      dwellMs: 1000,
      quietResetMs: 600,
    });
  });

  it("authors the storyboard timing, target, action, and duration sequence exactly", () => {
    expect(
      delegationScene.beats.map(({ at, duration, target, action }) => ({
        at,
        duration,
        target,
        action: action.type,
      })),
    ).toEqual([
      {
        at: 0,
        duration: 1100,
        target: "composer-input",
        action: "type-text",
      },
      {
        at: 1200,
        duration: 150,
        target: "composer-input",
        action: "exit",
      },
      {
        at: 1200,
        duration: 350,
        target: "msg-user-1",
        action: "enter",
      },
      {
        at: 1500,
        duration: 250,
        target: "thread-typing",
        action: "enter",
      },
      {
        at: 1900,
        duration: 150,
        target: "thread-typing",
        action: "exit",
      },
      {
        at: 1900,
        duration: 400,
        target: "msg-coo-1",
        action: "enter",
      },
      {
        at: 2800,
        duration: 300,
        target: "chip-analyst",
        action: "enter",
      },
      {
        at: 3150,
        duration: 300,
        target: "chip-writer",
        action: "enter",
      },
      {
        at: 3700,
        duration: 400,
        target: "msg-coo-2",
        action: "enter",
      },
    ]);
  });
});

describe("resolveSceneCheckpoint", () => {
  it("returns an immutable copy of the initial semantic state without a browser", () => {
    expect(resolveSceneCheckpoint(delegationScene, "initial")).toEqual(
      delegationInitial,
    );
    expect(globalThis.document).toBeUndefined();
  });

  it("resolves the delegated checkpoint deterministically", () => {
    const state = resolveSceneCheckpoint(delegationScene, "delegated");

    expect(
      state.thread.flatMap((item) =>
        item.kind === "chips"
          ? item.chips.map((chip) => chip.target)
          : [item.target],
      ),
    ).toEqual([
      "msg-user-1",
      "thread-typing",
      "msg-coo-1",
      "chip-analyst",
      "chip-writer",
    ]);
  });

  it("resolves the final state to the canonical SSR dashboard state exactly", () => {
    expect(resolveSceneCheckpoint(delegationScene, "resolved")).toEqual(
      delegationResolved,
    );
  });

  it("fails loudly for an unknown checkpoint", () => {
    expect(() =>
      resolveSceneCheckpoint(delegationScene, "unknown"),
    ).toThrowError('Scene "delegation": unknown checkpoint "unknown"');
  });

  it("commits overlapping state transitions in canonical start order", () => {
    const definition = {
      id: "overlapping-state",
      title: "Overlapping state",
      surface: "chat",
      claim: "State transitions share one ordering rule.",
      transcript: "A state advances from queued to executing to done.",
      initialState: {
        pane: "chat",
        pill: { name: "COO", meta: "· COO · engine", presence: "active" },
        thread: [],
        composerPlaceholder: "Message the COO…",
        targetStates: { status: "queued" },
      },
      targets: [
        {
          id: "status",
          kind: "state",
          initialState: "queued",
          transitions: [
            { from: "queued", to: "executing" },
            { from: "executing", to: "done" },
          ],
        },
      ],
      playback: { mode: "once", entry: "play", offscreen: "pause" },
      beats: [
        {
          at: 0,
          duration: 1000,
          target: "status",
          action: {
            type: "set-state",
            from: "queued",
            to: "executing",
          },
          easing: "smooth",
        },
        {
          at: 500,
          duration: 100,
          target: "status",
          action: {
            type: "set-state",
            from: "executing",
            to: "done",
          },
          easing: "smooth",
        },
      ],
      checkpoints: [
        { name: "initial", at: 0 },
        { name: "executing", at: 100 },
        { name: "resolved", at: 1000 },
      ],
    } satisfies SceneDefinition;

    expect(resolveSceneCheckpoint(definition, "initial").targetStates).toEqual({
      status: "queued",
    });
    expect(
      resolveSceneCheckpoint(definition, "executing").targetStates,
    ).toEqual({ status: "executing" });
    expect(resolveSceneCheckpoint(definition, "resolved").targetStates).toEqual(
      { status: "done" },
    );
  });
});

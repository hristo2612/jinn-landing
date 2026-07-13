import { describe, expect, it } from "vitest";

import type {
  ChatSceneState,
  SceneDefinition,
  SceneTargetDefinition,
} from "../../src/lib/scenes/types";
import {
  validateSceneDefinition,
  validateSceneRegistry,
} from "../../src/lib/scenes/scene-validator";

const baseTargets: SceneTargetDefinition[] = [
  { id: "copy", kind: "text" },
  {
    id: "status",
    kind: "state",
    initialState: "queued",
    transitions: [{ from: "queued", to: "executing" }],
  },
];

function makeDefinition(
  overrides: Partial<SceneDefinition<ChatSceneState>> = {},
): SceneDefinition<ChatSceneState> {
  return {
    id: "invalid",
    title: "Invalid fixture",
    surface: "chat",
    claim: "A validator fixture.",
    transcript: "A validator fixture transcript.",
    initialState: {
      pane: "chat",
      pill: { name: "COO", meta: "· COO · engine", presence: "active" },
      thread: [],
      composerPlaceholder: "Message the COO…",
    },
    targets: baseTargets,
    playback: {
      mode: "once",
      entry: "play",
      offscreen: "pause",
    },
    beats: [],
    checkpoints: [
      { name: "initial", at: 0 },
      { name: "resolved", at: 1000 },
    ],
    ...overrides,
  };
}

function makeAmbientDefinition(
  overrides: Partial<SceneDefinition<ChatSceneState>> = {},
): SceneDefinition<ChatSceneState> {
  return makeDefinition({
    id: "ambient",
    playback: {
      mode: "loop",
      entry: "play",
      offscreen: "pause",
      dwellMs: 6000,
      quietResetMs: 600,
    },
    ambient: { follows: "host", startDelay: 2000 },
    beats: [0, 6000, 12000, 18000].map((at) => ({
      at,
      duration: 400,
      target: "status",
      action: { type: "pulse" as const, cycles: 1 as const },
      easing: "smooth" as const,
    })),
    checkpoints: [
      { name: "initial", at: 0 },
      { name: "resolved", at: 18400 },
    ],
    ...overrides,
  });
}

function approvedAmbientDefinitions(): SceneDefinition<ChatSceneState>[] {
  const initialState = makeDefinition().initialState;
  return [
    {
      ...makeAmbientDefinition(),
      id: "org-ambient",
      surface: "org",
      initialState: { ...initialState, pane: "org" },
      targets: [
        {
          id: "node.dev",
          kind: "state",
          initialState: "idle",
          transitions: [
            { from: "idle", to: "active" },
            { from: "active", to: "idle" },
          ],
        },
        { id: "node.coo", kind: "element" },
      ],
      beats: [
        {
          at: 6000,
          duration: 300,
          target: "node.dev",
          action: { type: "set-state", from: "idle", to: "active" },
          easing: "smooth",
        },
        {
          at: 13000,
          duration: 600,
          target: "node.coo",
          action: { type: "pulse", cycles: 1 },
          easing: "smooth",
        },
        {
          at: 20000,
          duration: 300,
          target: "node.dev",
          action: { type: "set-state", from: "active", to: "idle" },
          easing: "smooth",
        },
      ],
      checkpoints: [
        { name: "initial", at: 0 },
        { name: "resolved", at: 20300 },
      ],
    },
    {
      ...makeAmbientDefinition(),
      id: "todos-ambient",
      surface: "todos",
      initialState: { ...initialState, pane: "todos" },
      targets: [
        { id: "card.relnotes", kind: "element" },
        {
          id: "card.relnotes.disc",
          kind: "state",
          initialState: "assigned",
          transitions: [
            { from: "assigned", to: "executing" },
            { from: "executing", to: "done" },
          ],
        },
        { id: "card.relnotes.exec", kind: "text" },
        {
          id: "card.changelog",
          kind: "state",
          initialState: "blocked",
          transitions: [{ from: "blocked", to: "assigned" }],
        },
      ],
      beats: [
        {
          at: 5000,
          duration: 400,
          target: "card.relnotes",
          action: { type: "enter" },
          easing: "smooth",
        },
        {
          at: 11000,
          duration: 350,
          target: "card.relnotes.disc",
          action: { type: "set-state", from: "assigned", to: "executing" },
          easing: "smooth",
        },
        {
          at: 12000,
          duration: 300,
          target: "card.relnotes.exec",
          action: {
            type: "replace-text",
            text: "Session · release-notes · Open",
          },
          easing: "smooth",
        },
        {
          at: 19000,
          duration: 350,
          target: "card.relnotes.disc",
          action: { type: "set-state", from: "executing", to: "done" },
          easing: "smooth",
        },
        {
          at: 20000,
          duration: 300,
          target: "card.relnotes.exec",
          action: { type: "replace-text", text: "Done · reviewed by Jimbo" },
          easing: "smooth",
        },
        {
          at: 26000,
          duration: 350,
          target: "card.changelog",
          action: { type: "set-state", from: "blocked", to: "assigned" },
          easing: "smooth",
        },
      ],
      checkpoints: [
        { name: "initial", at: 0 },
        { name: "resolved", at: 26350 },
      ],
    },
    {
      ...makeAmbientDefinition(),
      id: "triggers-ambient",
      surface: "triggers",
      initialState: { ...initialState, pane: "triggers" },
      playback: {
        mode: "loop",
        entry: "play",
        offscreen: "pause",
        dwellMs: 8000,
        quietResetMs: 600,
      },
      targets: [
        {
          id: "binding.webhook",
          kind: "state",
          initialState: "idle",
          transitions: [{ from: "idle", to: "fired" }],
        },
        { id: "run.row-refund", kind: "element" },
      ],
      beats: [
        {
          at: 7000,
          duration: 600,
          target: "binding.webhook",
          action: { type: "pulse", cycles: 1 },
          easing: "smooth",
        },
        {
          at: 7600,
          duration: 250,
          target: "binding.webhook",
          action: { type: "set-state", from: "idle", to: "fired" },
          easing: "smooth",
        },
        {
          at: 8000,
          duration: 350,
          target: "run.row-refund",
          action: { type: "enter" },
          easing: "smooth",
        },
      ],
      checkpoints: [
        { name: "initial", at: 0 },
        { name: "resolved", at: 13500 },
      ],
    },
  ];
}

describe("validateSceneDefinition", () => {
  it("accepts the three approved storyboard ambient scripts verbatim", () => {
    for (const definition of approvedAmbientDefinitions()) {
      expect(() => validateSceneDefinition(definition)).not.toThrow();
    }
  });
  it("enforces the ambient hold and approved cycle envelope", () => {
    expect(() =>
      validateSceneDefinition(
        makeAmbientDefinition({
          ambient: { follows: "host", startDelay: 0 },
        }),
      ),
    ).toThrowError(
      'Scene "ambient": ambient startDelay must be exactly 2000ms',
    );

    expect(() =>
      validateSceneDefinition(
        makeAmbientDefinition({
          playback: {
            mode: "loop",
            entry: "play",
            offscreen: "pause",
            dwellMs: 0,
            quietResetMs: 600,
          },
        }),
      ),
    ).toThrowError(
      'Scene "ambient": loop playback requires positive dwellMs and quietResetMs',
    );

    expect(() =>
      validateSceneDefinition(
        makeAmbientDefinition({
          checkpoints: [
            { name: "initial", at: 0 },
            { name: "resolved", at: 45000 },
          ],
        }),
      ),
    ).toThrowError(
      'Scene "ambient": ambient full cycle must be between 10000ms and 45000ms',
    );
  });

  it("enforces serial ambient beats with a 400ms start-spacing floor", () => {
    expect(() =>
      validateSceneDefinition(
        makeAmbientDefinition({
          beats: [
            {
              at: 0,
              duration: 400,
              target: "status",
              action: { type: "pulse", cycles: 1 },
              easing: "smooth",
            },
            {
              at: 200,
              duration: 400,
              target: "copy",
              action: { type: "replace-text", text: "Overlap" },
              easing: "smooth",
            },
          ],
        }),
      ),
    ).toThrowError('Scene "ambient": ambient beats must not overlap');

    expect(() =>
      validateSceneDefinition(
        makeAmbientDefinition({
          beats: [0, 300, 6000, 12000].map((at) => ({
            at,
            duration: 100,
            target: "status",
            action: { type: "pulse" as const, cycles: 1 as const },
            easing: "smooth" as const,
          })),
        }),
      ),
    ).toThrowError(
      'Scene "ambient": ambient beat starts must be at least 400ms apart',
    );
  });

  it("requires an ambient follower to share a pane with a non-ambient scripted host", () => {
    const host = makeDefinition({ id: "host", surface: "todos" });
    const ambient = makeAmbientDefinition({ surface: "todos" });
    expect(() =>
      validateSceneRegistry(new Map([[ambient.id, ambient]])),
    ).toThrowError(
      'Scene registry: ambient scene "ambient" follows missing scene "host"',
    );

    const wrongPane = makeDefinition({
      id: "host",
      surface: "todos",
      initialState: { ...host.initialState, pane: "org" },
    });
    expect(() =>
      validateSceneRegistry(
        new Map([
          [wrongPane.id, wrongPane],
          [ambient.id, ambient],
        ]),
      ),
    ).toThrowError(
      'Scene registry: ambient scene "ambient" must follow a scripted host on the same surface and pane',
    );

    const scripted = makeDefinition({ id: "scripted" });
    const ambientHost = makeAmbientDefinition({
      id: "host",
      ambient: { follows: "scripted", startDelay: 2000 },
    });
    expect(() =>
      validateSceneRegistry(
        new Map([
          [scripted.id, scripted],
          [ambientHost.id, ambientHost],
          [ambient.id, ambient],
        ]),
      ),
    ).toThrowError(
      'Scene registry: ambient scene "ambient" must follow a scripted host on the same surface and pane',
    );
  });
  it("rejects ambient policies that are not loop playback", () => {
    const definition = {
      ...makeDefinition(),
      ambient: { follows: "host", startDelay: 2000 },
    } as SceneDefinition<ChatSceneState>;

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": ambient scenes require loop playback',
    );
  });

  it("rejects ambient beats beyond the approved motion envelope", () => {
    const definition = {
      ...makeDefinition({
        playback: {
          mode: "loop",
          entry: "play",
          offscreen: "pause",
          dwellMs: 5000,
          quietResetMs: 200,
        },
        beats: [
          {
            at: 0,
            duration: 601,
            target: "status",
            action: { type: "pulse", cycles: 1 },
            easing: "smooth",
          },
        ],
      }),
      ambient: { follows: "host", startDelay: 2000 },
    } as SceneDefinition<ChatSceneState>;

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": ambient beat at 0ms exceeds the approved 600ms motion envelope',
    );
  });

  it("rejects ambient policies on Night and Morning surfaces", () => {
    for (const surface of ["night", "morning"] as const) {
      const definition = {
        ...makeDefinition({
          surface,
          playback: {
            mode: "loop",
            entry: "play",
            offscreen: "pause",
            dwellMs: 5000,
            quietResetMs: 200,
          },
        }),
        ambient: { follows: "host", startDelay: 2000 },
      } as SceneDefinition<ChatSceneState>;

      expect(() => validateSceneDefinition(definition)).toThrowError(
        `Scene "invalid": ambient scheduling is forbidden on ${surface} surfaces`,
      );
    }
  });

  it("fails loudly when a beat names a missing local target", () => {
    const definition = makeDefinition({
      beats: [
        {
          at: 0,
          duration: 100,
          target: "missing",
          action: { type: "enter" },
          easing: "smooth",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": beat at 0ms targets missing target "missing"',
    );
  });

  it("fails loudly when a target id is duplicated", () => {
    const definition = makeDefinition({
      targets: [...baseTargets, { id: "copy", kind: "element" }],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": duplicate target "copy"',
    );
  });

  it("rejects a semantic transition that is not declared by the target", () => {
    const definition = makeDefinition({
      beats: [
        {
          at: 100,
          duration: 100,
          target: "status",
          action: {
            type: "set-state",
            from: "queued",
            to: "done",
          },
          easing: "smooth",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": invalid transition for "status": queued → done',
    );
  });

  it("rejects overlapping text actions on the same target", () => {
    const definition = makeDefinition({
      beats: [
        {
          at: 0,
          duration: 1000,
          target: "copy",
          action: { type: "type-text", text: "First" },
          easing: "smooth",
        },
        {
          at: 500,
          duration: 100,
          target: "copy",
          action: { type: "replace-text", text: "Second" },
          easing: "smooth",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": overlapping text actions for "copy" at 0ms and 500ms',
    );
  });

  it("rejects loops without both a resolved dwell and quiet reset", () => {
    const definition = makeDefinition({
      playback: {
        mode: "loop",
        entry: "play",
        offscreen: "pause",
        dwellMs: 5000,
      },
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": loop playback requires positive dwellMs and quietResetMs',
    );
  });

  it("rejects unbounded pulse counts at runtime even if input bypasses TypeScript", () => {
    const definition = makeDefinition({
      beats: [
        {
          at: 0,
          duration: 300,
          target: "status",
          action: { type: "pulse", cycles: 3 } as never,
          easing: "spring",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": pulse at 0ms must use 1 or 2 cycles',
    );
  });

  it("rejects easing names outside the Ledger token vocabulary", () => {
    const definition = makeDefinition({
      beats: [
        {
          at: 0,
          duration: 300,
          target: "status",
          action: { type: "enter" },
          easing: "bounce" as never,
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": beat at 0ms uses invalid easing "bounce"',
    );
  });

  it("requires every state target to declare its semantic origin", () => {
    const definition = makeDefinition({
      targets: [
        { id: "copy", kind: "text" },
        {
          id: "status",
          kind: "state",
          transitions: [{ from: "queued", to: "done" }],
        },
      ],
      beats: [
        {
          at: 0,
          duration: 100,
          target: "status",
          action: { type: "set-state", from: "queued", to: "done" },
          easing: "smooth",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": state target "status" requires initialState',
    );
  });

  it("rejects actions that are incompatible with the target kind", () => {
    const definition = makeDefinition({
      beats: [
        {
          at: 0,
          duration: 100,
          target: "status",
          action: { type: "type-text", text: "Invalid" },
          easing: "smooth",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": action "type-text" at 0ms is incompatible with target "status" of kind "state"',
    );
  });

  it("requires enter content to identify the animated target exactly", () => {
    const definition = makeDefinition({
      targets: [
        ...baseTargets,
        { id: "msg-a", kind: "element" },
        { id: "msg-b", kind: "element" },
      ],
      beats: [
        {
          at: 0,
          duration: 100,
          target: "msg-a",
          action: {
            type: "enter",
            content: {
              kind: "message",
              item: {
                kind: "message",
                id: "message-b",
                target: "msg-b",
                role: "assistant",
                body: [{ text: "Mismatch" }],
              },
            },
          },
          easing: "smooth",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": enter at 0ms targets "msg-a" but embeds "msg-b"',
    );
  });

  it("rejects ambiguous enter placement", () => {
    const definition = makeDefinition({
      targets: [...baseTargets, { id: "msg-a", kind: "element" }],
      beats: [
        {
          at: 0,
          duration: 100,
          target: "msg-a",
          action: {
            type: "enter",
            content: {
              kind: "message",
              item: {
                kind: "message",
                id: "message-a",
                target: "msg-a",
                role: "assistant",
                body: [{ text: "Placed" }],
              },
            },
            placement: { before: "copy", after: "status" },
          },
          easing: "smooth",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": enter at 0ms has ambiguous placement: use before or after, not both',
    );
  });

  it("rejects a placement anchor outside the declared target set", () => {
    const definition = makeDefinition({
      targets: [...baseTargets, { id: "msg-a", kind: "element" }],
      beats: [
        {
          at: 0,
          duration: 100,
          target: "msg-a",
          action: {
            type: "enter",
            content: {
              kind: "message",
              item: {
                kind: "message",
                id: "message-a",
                target: "msg-a",
                role: "assistant",
                body: [{ text: "Placed" }],
              },
            },
            placement: { after: "missing" },
          },
          easing: "smooth",
        },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": enter at 0ms uses missing placement anchor "missing"',
    );
  });

  it("requires the resolved checkpoint to cover every completed beat", () => {
    const definition = makeDefinition({
      beats: [
        {
          at: 200,
          duration: 100,
          target: "copy",
          action: { type: "replace-text", text: "Late" },
          easing: "smooth",
        },
      ],
      checkpoints: [
        { name: "initial", at: 0 },
        { name: "resolved", at: 100 },
      ],
    });

    expect(() => validateSceneDefinition(definition)).toThrowError(
      'Scene "invalid": resolved checkpoint at 100ms precedes final beat completion at 300ms',
    );
  });
});

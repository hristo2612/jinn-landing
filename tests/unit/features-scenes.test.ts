import fs from "node:fs";

import { describe, expect, test } from "vitest";

import { featuresSceneDefinitions } from "../../src/lib/scenes/features-scene-registry";
import {
  engineSwitchResolved,
  ORG_HIRE_PANE,
  TODO_APPROVAL_PANE,
  TRIAGE_RUN_PANE,
  WEBHOOK_FIRE_PANE,
  MCP_HANDS_CARD,
} from "../../src/lib/scenes/features";
import {
  resolveSceneCheckpoint,
  resolveSceneEndState,
} from "../../src/lib/scenes/scene-reducer";
import { validateSceneRegistry } from "../../src/lib/scenes/scene-validator";

const scenes = Array.from(featuresSceneDefinitions.values());

describe("features scene registry", () => {
  test("describes webhook ingress as token-authenticated, never signed", () => {
    const authCopyFiles = [
      "src/lib/scenes/features.ts",
      "src/scenes/features/webhook-fire.scene.ts",
      "tests/e2e/fixtures/features-deck.ts",
      "docs/STORYBOARD-FEATURES.md",
    ];
    const authCopy = authCopyFiles
      .map((file) => fs.readFileSync(file, "utf8"))
      .join("\n");

    expect(authCopy).not.toMatch(/signed webhook|start real work - signed/iu);
    expect(authCopy).toContain("token-authenticated webhook");
    expect(authCopy).toMatch(/shared-secret token preview/iu);
  });

  test("registers exactly the storyboard's seven scenes", () => {
    expect(Array.from(featuresSceneDefinitions.keys())).toEqual([
      "engine-switch",
      "org-hire",
      "todo-approval",
      "triage-run",
      "webhook-fire",
      "mcp-hands",
      "slack-approve",
    ]);
  });

  test("every definition passes registry validation", () => {
    expect(() => validateSceneRegistry(featuresSceneDefinitions)).not.toThrow();
  });

  test("every scene loops with the quiet 600ms reset and no ambient", () => {
    for (const scene of scenes) {
      expect(scene.playback.mode, scene.id).toBe("loop");
      expect(scene.playback.entry, scene.id).toBe("play");
      expect(scene.playback.quietResetMs, scene.id).toBe(600);
      expect(scene.ambient, scene.id).toBeUndefined();
    }
  });
});

describe("authoring envelope", () => {
  test("each cycle is a calm 3–6 seconds", () => {
    for (const scene of scenes) {
      const resolved = scene.checkpoints.find(
        ({ name }) => name === "resolved",
      )!;
      const cycle =
        resolved.at +
        (scene.playback.dwellMs ?? 0) +
        (scene.playback.quietResetMs ?? 0);
      expect(cycle, scene.id).toBeGreaterThanOrEqual(3_000);
      expect(cycle, scene.id).toBeLessThanOrEqual(6_000);
    }
  });

  test("non-text motion stays ≤600ms; pulses are 1–2 bounded cycles", () => {
    for (const scene of scenes) {
      for (const beat of scene.beats) {
        if (beat.action.type === "type-text") continue;
        if (beat.action.type === "pulse") {
          expect([1, 2], `${scene.id}@${beat.at}`).toContain(
            beat.action.cycles,
          );
          continue;
        }
        expect(
          beat.duration ?? 0,
          `${scene.id}@${beat.at}`,
        ).toBeLessThanOrEqual(600);
      }
    }
  });

  test("gesture cadence (Addendum B2-1.5): beats chain at ≤120ms; gesture starts ≥300ms apart", () => {
    for (const scene of scenes) {
      const starts = [...new Set(scene.beats.map(({ at }) => at))].sort(
        (left, right) => left - right,
      );
      const gestureStarts: number[] = [];
      let previousBeat = Number.NEGATIVE_INFINITY;
      for (const at of starts) {
        if (at - previousBeat > 120) gestureStarts.push(at);
        previousBeat = at;
      }
      for (let index = 1; index < gestureStarts.length; index += 1) {
        expect(
          gestureStarts[index] - gestureStarts[index - 1],
          `${scene.id}: gesture@${gestureStarts[index]}`,
        ).toBeGreaterThanOrEqual(300);
      }
    }
  });

  test("dwells keep every resolved proof legible", () => {
    for (const scene of scenes) {
      const minimum = scene.id === "mcp-hands" ? 600 : 800;
      expect(scene.playback.dwellMs, scene.id).toBeGreaterThanOrEqual(minimum);
    }
  });
});

describe("reducer resolved states equal the canonical data", () => {
  test("engine-switch resolves to the full four-message thread", () => {
    const end = resolveSceneEndState(
      featuresSceneDefinitions.get("engine-switch")!,
    );
    expect(end.thread).toEqual(engineSwitchResolved.thread);
    expect(end.composerText).toBeUndefined();
  });

  test("engine-switch pre-send checkpoint has the recheck in the composer", () => {
    const sent = resolveSceneCheckpoint(
      featuresSceneDefinitions.get("engine-switch")!,
      "sent",
    );
    expect(
      sent.thread.some(
        (item) => item.kind === "message" && item.target === "msg-user-2",
      ),
    ).toBe(true);
  });

  test("org-hire seats Support with the recounted header (no presence - B2-4)", () => {
    const definition = featuresSceneDefinitions.get("org-hire")!;
    const enterTargets = definition.beats
      .filter((beat) => beat.action.type === "enter")
      .map((beat) => beat.target);
    expect(enterTargets).toEqual([
      "org-branch-support",
      "dept-support",
      "node-support",
    ]);
    const recount = definition.beats.find(
      (beat) => beat.action.type === "replace-text",
    )!;
    expect(recount.action).toMatchObject({ text: ORG_HIRE_PANE.header });
    // The app's org map renders no live-session indicator, so neither does
    // the vignette: no set-state beats at all in this scene.
    expect(
      definition.beats.some((beat) => beat.action.type === "set-state"),
    ).toBe(false);
  });

  test("todo-approval ends decided with the alert routed", () => {
    const end = resolveSceneEndState(
      featuresSceneDefinitions.get("todo-approval")!,
    );
    expect(end.targetStates).toMatchObject({
      "card-refund": "approval-requested",
      "tab-needs": "alert",
      "row-refund": "decided",
    });
    expect(end.highlights?.["view-needs"]).toBe(true);
  });

  test("triage-run parks at the gate and never advances past it", () => {
    const definition = featuresSceneDefinitions.get("triage-run")!;
    const end = resolveSceneEndState(definition);
    expect(end.targetStates).toMatchObject({
      "node-trigger": "done",
      "node-triage": "done",
      "node-route": "done",
      "node-gate": "awaiting-approval",
      "chip-run": "waiting",
    });
    expect(end.progress?.["edge-route-refund"]).toBe(1);
    // The forbidden list (§4.5): the un-routed lane and the refund step have
    // no state transitions at all, and the chip never reads completed.
    expect(end.targetStates?.["node-reply"]).toBeUndefined();
    expect(end.targetStates?.["node-refund"]).toBeUndefined();
    for (const beat of definition.beats) {
      expect(["node-reply", "node-refund"], `beat@${beat.at}`).not.toContain(
        beat.action.type === "set-state" ? beat.target : "",
      );
    }
    expect(
      TRIAGE_RUN_PANE.nodes.find(({ kind }) => kind === "gate")!.status,
    ).toBe("awaiting-approval");
  });

  test("webhook-fire ends with the webhook fired and run #148 revealed", () => {
    const end = resolveSceneEndState(
      featuresSceneDefinitions.get("webhook-fire")!,
    );
    expect(end.targetStates?.["binding-webhook"]).toBe("fired");
    expect(WEBHOOK_FIRE_PANE.run).toBe("↳ run #148 started - Support triage");
  });

  test("mcp-hands lands all four calls ok", () => {
    const end = resolveSceneEndState(
      featuresSceneDefinitions.get("mcp-hands")!,
    );
    for (const row of MCP_HANDS_CARD.rows) {
      expect(end.targetStates?.[row.target]).toBe("ok");
    }
    expect(end.highlights?.["row-4"]).toBe(true);
  });
});

describe("fiction ledger (STORYBOARD-FEATURES §10.8)", () => {
  test("only the authorized run, order, and todo numbers appear", () => {
    const corpus = JSON.stringify({
      scenes,
      ORG_HIRE_PANE,
      TODO_APPROVAL_PANE,
      TRIAGE_RUN_PANE,
      WEBHOOK_FIRE_PANE,
      MCP_HANDS_CARD,
    });
    const runs = new Set(corpus.match(/run #\d+|Run #\d+/gu) ?? []);
    for (const run of runs) {
      expect(["run #147", "Run #147", "run #148"]).toContain(run);
    }
    const orders = new Set(corpus.match(/#\d{4}/gu) ?? []);
    for (const order of orders) {
      expect(["#8841", "#8867"]).toContain(order);
    }
    // The one MCP work-item ID is the product-shaped fictional
    // wi_8841c47ef21a (Addendum B2-1.3) - nothing else wi_-shaped appears.
    const ids = new Set(corpus.match(/wi_[0-9a-z]+/gu) ?? []);
    expect([...ids]).toEqual(["wi_8841c47ef21a"]);
  });
});

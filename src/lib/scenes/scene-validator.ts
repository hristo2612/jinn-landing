import type {
  ChatSceneState,
  SceneAction,
  SceneBeat,
  SceneDefinition,
  SceneEasing,
  SceneTargetKind,
  SceneTargetDefinition,
  ValidatedSceneDefinition,
} from "./types";
import { orderSceneBeatsByCommit } from "./scene-beat-order";

const EASINGS = new Set<SceneEasing>(["smooth", "spring", "snappy"]);
const TEXT_ACTIONS = new Set(["type-text", "replace-text"]);
const ACTION_TARGET_KINDS: Record<SceneAction["type"], Set<SceneTargetKind>> = {
  "type-text": new Set(["text"]),
  "replace-text": new Set(["text"]),
  enter: new Set(["text", "element", "state", "progress"]),
  exit: new Set(["text", "element", "state", "progress"]),
  "set-state": new Set(["state"]),
  "set-progress": new Set(["progress"]),
  highlight: new Set(["text", "element", "state", "progress", "pane"]),
  pulse: new Set(["element", "state", "progress", "pane"]),
  theme: new Set(["theme"]),
};

function fail(sceneId: string, message: string): never {
  throw new Error(`Scene "${sceneId}": ${message}`);
}

function validateTargets<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
): Map<string, SceneTargetDefinition> {
  const targets = new Map<string, SceneTargetDefinition>();

  for (const target of definition.targets) {
    if (targets.has(target.id)) {
      fail(definition.id, `duplicate target "${target.id}"`);
    }
    if (target.kind === "state" && target.initialState === undefined) {
      fail(definition.id, `state target "${target.id}" requires initialState`);
    }
    targets.set(target.id, target);
  }

  return targets;
}

function embeddedTarget(beat: SceneBeat): string | undefined {
  if (beat.action.type !== "enter" || !beat.action.content) return undefined;
  return beat.action.content.item.target;
}

function validateBeatRelationships<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
  targets: Map<string, SceneTargetDefinition>,
): void {
  for (const beat of definition.beats) {
    const target = targets.get(beat.target)!;
    if (!ACTION_TARGET_KINDS[beat.action.type].has(target.kind)) {
      fail(
        definition.id,
        `action "${beat.action.type}" at ${beat.at}ms is incompatible with target "${beat.target}" of kind "${target.kind}"`,
      );
    }
    if (beat.action.type !== "enter") continue;

    const contentTarget = embeddedTarget(beat);
    if (contentTarget !== undefined && contentTarget !== beat.target) {
      fail(
        definition.id,
        `enter at ${beat.at}ms targets "${beat.target}" but embeds "${contentTarget}"`,
      );
    }

    const { placement } = beat.action;
    if (placement?.before && placement.after) {
      fail(
        definition.id,
        `enter at ${beat.at}ms has ambiguous placement: use before or after, not both`,
      );
    }
    const anchor = placement?.before ?? placement?.after;
    if (anchor && !targets.has(anchor)) {
      fail(
        definition.id,
        `enter at ${beat.at}ms uses missing placement anchor "${anchor}"`,
      );
    }
  }
}

function validateBeatBasics<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
  targets: Map<string, SceneTargetDefinition>,
): void {
  for (const beat of definition.beats) {
    if (!Number.isInteger(beat.at) || beat.at < 0) {
      fail(definition.id, `beat time must be a non-negative integer`);
    }
    if (
      beat.duration !== undefined &&
      (!Number.isInteger(beat.duration) || beat.duration < 0)
    ) {
      fail(definition.id, `beat at ${beat.at}ms has invalid duration`);
    }
    if (!targets.has(beat.target)) {
      fail(
        definition.id,
        `beat at ${beat.at}ms targets missing target "${beat.target}"`,
      );
    }
    if (!EASINGS.has(beat.easing)) {
      fail(
        definition.id,
        `beat at ${beat.at}ms uses invalid easing "${String(beat.easing)}"`,
      );
    }
    if (
      beat.action.type === "pulse" &&
      beat.action.cycles !== 1 &&
      beat.action.cycles !== 2
    ) {
      fail(definition.id, `pulse at ${beat.at}ms must use 1 or 2 cycles`);
    }
  }
}

function validateTransitions<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
  targets: Map<string, SceneTargetDefinition>,
): void {
  const current = new Map(
    definition.targets
      .filter((target) => target.initialState !== undefined)
      .map((target) => [target.id, target.initialState as string]),
  );

  for (const { beat } of orderSceneBeatsByCommit(definition.beats)) {
    if (beat.action.type !== "set-state") continue;
    const { from: nextFrom, to: nextTo } = beat.action;
    const target = targets.get(beat.target)!;
    const declared = target.transitions?.some(
      ({ from, to }) => from === nextFrom && to === nextTo,
    );
    const stateMatches =
      current.get(beat.target) === undefined ||
      current.get(beat.target) === nextFrom;

    if (!declared || !stateMatches) {
      fail(
        definition.id,
        `invalid transition for "${beat.target}": ${nextFrom} → ${nextTo}`,
      );
    }
    current.set(beat.target, nextTo);
  }
}

function validateTextOverlap<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
): void {
  const byTarget = new Map<string, SceneBeat[]>();
  for (const beat of definition.beats) {
    if (!TEXT_ACTIONS.has(beat.action.type)) continue;
    const beats = byTarget.get(beat.target) ?? [];
    beats.push(beat);
    byTarget.set(beat.target, beats);
  }

  for (const [target, beats] of byTarget) {
    const sorted = beats.sort((a, b) => a.at - b.at);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const next = sorted[index];
      if (next.at < previous.at + (previous.duration ?? 0)) {
        fail(
          definition.id,
          `overlapping text actions for "${target}" at ${previous.at}ms and ${next.at}ms`,
        );
      }
    }
  }
}

function validatePlayback<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
): void {
  if (
    definition.playback.startDelayMs !== undefined &&
    (!Number.isInteger(definition.playback.startDelayMs) ||
      definition.playback.startDelayMs < 0)
  ) {
    fail(definition.id, "playback startDelayMs must be a non-negative integer");
  }
  if (
    definition.playback.mode === "loop" &&
    (!(definition.playback.dwellMs && definition.playback.dwellMs > 0) ||
      !(
        definition.playback.quietResetMs && definition.playback.quietResetMs > 0
      ))
  ) {
    fail(
      definition.id,
      "loop playback requires positive dwellMs and quietResetMs",
    );
  }
  if (!definition.ambient) return;
  if (definition.playback.mode !== "loop") {
    fail(definition.id, "ambient scenes require loop playback");
  }
  if (
    !definition.ambient.follows ||
    definition.ambient.follows === definition.id
  ) {
    fail(definition.id, "ambient follows must name a different scripted scene");
  }
  if (
    !Number.isInteger(definition.ambient.startDelay) ||
    definition.ambient.startDelay !== 2000
  ) {
    fail(definition.id, "ambient startDelay must be exactly 2000ms");
  }
  if (definition.surface === "night" || definition.surface === "morning") {
    fail(
      definition.id,
      `ambient scheduling is forbidden on ${definition.surface} surfaces`,
    );
  }
  const longBeat = definition.beats.find(({ duration, action }) => {
    if (action.type === "type-text" || action.type === "theme") return false;
    // The approved Org/Triggers pulse vocabulary is authored at 600ms. The
    // runtime's yield deadline still bounds a scripted handoff to 500ms.
    return (duration ?? 0) > 600;
  });
  if (longBeat) {
    fail(
      definition.id,
      `ambient beat at ${longBeat.at}ms exceeds the approved 600ms motion envelope`,
    );
  }

  const resolvedAt = definition.checkpoints.find(
    ({ name }) => name === "resolved",
  )?.at;
  if (resolvedAt !== undefined) {
    const cycle =
      resolvedAt +
      (definition.playback.dwellMs ?? 0) +
      (definition.playback.quietResetMs ?? 0);
    if (cycle < 10000 || cycle > 45000) {
      fail(
        definition.id,
        "ambient full cycle must be between 10000ms and 45000ms",
      );
    }

    const beats = [...definition.beats].sort(
      (left, right) => left.at - right.at,
    );
    for (let index = 1; index < beats.length; index += 1) {
      const previous = beats[index - 1];
      const current = beats[index];
      if (
        current.at === previous.at ||
        current.at < previous.at + (previous.duration ?? 0)
      ) {
        fail(definition.id, "ambient beats must not overlap");
      }
    }
    const cadence = beats
      .slice(1)
      .map((beat, index) => beat.at - beats[index].at);
    if (cadence.length > 0 && cadence.some((gap) => gap < 400)) {
      fail(definition.id, "ambient beat starts must be at least 400ms apart");
    }
  }
}

export function validateSceneRegistry<TState extends ChatSceneState>(
  definitions: ReadonlyMap<string, SceneDefinition<TState>>,
): void {
  const ambientByHost = new Map<string, string>();
  for (const definition of definitions.values()) {
    validateSceneDefinition(definition);
    if (!definition.ambient) continue;
    const host = definitions.get(definition.ambient.follows);
    if (!host) {
      throw new Error(
        `Scene registry: ambient scene "${definition.id}" follows missing scene "${definition.ambient.follows}"`,
      );
    }
    if (
      host.ambient ||
      host.surface !== definition.surface ||
      host.initialState.pane !== definition.initialState.pane
    ) {
      throw new Error(
        `Scene registry: ambient scene "${definition.id}" must follow a scripted host on the same surface and pane`,
      );
    }
    if (ambientByHost.has(host.id)) {
      throw new Error(
        `Scene registry: scripted host "${host.id}" has more than one ambient follower`,
      );
    }
    ambientByHost.set(host.id, definition.id);
  }
}

function validateCheckpoints<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
): void {
  const names = new Set<string>();
  let initialAt: number | undefined;
  let resolvedAt: number | undefined;
  for (const checkpoint of definition.checkpoints) {
    if (names.has(checkpoint.name)) {
      fail(definition.id, `duplicate checkpoint "${checkpoint.name}"`);
    }
    if (!Number.isInteger(checkpoint.at) || checkpoint.at < 0) {
      fail(definition.id, `checkpoint "${checkpoint.name}" has invalid time`);
    }
    names.add(checkpoint.name);
    if (checkpoint.name === "initial") initialAt = checkpoint.at;
    if (checkpoint.name === "resolved") resolvedAt = checkpoint.at;
  }
  if (!names.has("initial") || !names.has("resolved")) {
    fail(definition.id, 'checkpoints must include "initial" and "resolved"');
  }
  if (initialAt !== 0) {
    fail(definition.id, 'checkpoint "initial" must be at 0ms');
  }

  const finalBeatAt = definition.beats.reduce(
    (latest, beat) => Math.max(latest, beat.at + (beat.duration ?? 0)),
    0,
  );
  if (resolvedAt! < finalBeatAt) {
    fail(
      definition.id,
      `resolved checkpoint at ${resolvedAt}ms precedes final beat completion at ${finalBeatAt}ms`,
    );
  }
  const afterResolved = definition.checkpoints.find(
    ({ at }) => at > resolvedAt!,
  );
  if (afterResolved) {
    fail(
      definition.id,
      `checkpoint "${afterResolved.name}" at ${afterResolved.at}ms exceeds resolved checkpoint at ${resolvedAt}ms`,
    );
  }
}

export function validateSceneDefinition<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
): ValidatedSceneDefinition<TState> {
  const targets = validateTargets(definition);
  validateBeatBasics(definition, targets);
  validateBeatRelationships(definition, targets);
  validateTransitions(definition, targets);
  validateTextOverlap(definition);
  validatePlayback(definition);
  validateCheckpoints(definition);
  return definition;
}

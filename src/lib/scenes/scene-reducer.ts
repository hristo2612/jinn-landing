import { validateSceneDefinition } from "./scene-validator";
import { orderSceneBeatsByCommit, sceneBeatCommitAt } from "./scene-beat-order";
import type {
  ChatSceneState,
  SceneAction,
  SceneDefinition,
  SceneEnterContent,
  ScenePlacement,
  TextSegment,
  ThreadItem,
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function itemTargets(item: ThreadItem): string[] {
  return item.kind === "chips"
    ? item.chips.map((chip) => chip.target)
    : [item.target];
}

function findThreadIndex(state: ChatSceneState, target: string): number {
  return state.thread.findIndex((item) => itemTargets(item).includes(target));
}

function insertThreadItem(
  state: ChatSceneState,
  item: ThreadItem,
  placement?: ScenePlacement,
): void {
  if (findThreadIndex(state, itemTargets(item)[0]) >= 0) return;

  const anchor = placement?.before ?? placement?.after;
  if (!anchor) {
    state.thread.push(item);
    return;
  }

  const anchorIndex = findThreadIndex(state, anchor);
  if (anchorIndex < 0) {
    state.thread.push(item);
    return;
  }

  const index = placement?.before ? anchorIndex : anchorIndex + 1;
  state.thread.splice(index, 0, item);
}

function enterContent(
  state: ChatSceneState,
  content: SceneEnterContent | undefined,
  placement?: ScenePlacement,
): void {
  if (!content) return;

  if (content.kind === "message") {
    insertThreadItem(state, clone(content.item), placement);
    return;
  }

  if (content.kind === "typing") {
    const index = findThreadIndex(state, content.item.target);
    if (index < 0) {
      insertThreadItem(
        state,
        { ...clone(content.item), hidden: false },
        placement,
      );
    } else {
      const item = state.thread[index];
      if (item.kind === "typing") item.hidden = false;
    }
    return;
  }

  const existing = state.thread.find(
    (item) => item.kind === "chips" && item.id === content.groupId,
  );
  if (existing?.kind === "chips") {
    if (!existing.chips.some((chip) => chip.target === content.item.target)) {
      existing.chips.push(clone(content.item));
    }
    return;
  }

  insertThreadItem(
    state,
    { kind: "chips", id: content.groupId, chips: [clone(content.item)] },
    placement,
  );
}

function replaceTargetText(
  state: ChatSceneState,
  target: string,
  text: string,
): void {
  if (target === "composer-input") {
    state.composerText = text;
    return;
  }

  const item = state.thread.find((candidate) =>
    itemTargets(candidate).includes(target),
  );
  if (!item || item.kind === "typing") return;
  const body: TextSegment[] = [{ text }];
  if (item.kind === "message") item.body = body;
  else {
    const chip = item.chips.find((candidate) => candidate.target === target);
    if (chip) chip.body = body;
  }
}

function exitTarget(state: ChatSceneState, target: string): void {
  if (target === "composer-input") {
    delete state.composerText;
    return;
  }

  const index = findThreadIndex(state, target);
  if (index < 0) return;
  const item = state.thread[index];
  if (item.kind === "typing") {
    item.hidden = true;
    return;
  }
  if (item.kind === "chips") {
    item.chips = item.chips.filter((chip) => chip.target !== target);
    if (item.chips.length === 0) state.thread.splice(index, 1);
    return;
  }
  state.thread.splice(index, 1);
}

function reduceAction(
  state: ChatSceneState,
  target: string,
  action: SceneAction,
): void {
  switch (action.type) {
    case "type-text":
    case "replace-text":
      replaceTargetText(state, target, action.text);
      return;
    case "enter":
      enterContent(state, action.content, action.placement);
      return;
    case "exit":
      exitTarget(state, target);
      return;
    case "set-state":
      state.targetStates = { ...state.targetStates, [target]: action.to };
      return;
    case "set-progress":
      state.progress = { ...state.progress, [target]: action.value };
      return;
    case "highlight":
      state.highlights = {
        ...state.highlights,
        [target]: action.active ?? true,
      };
      return;
    case "theme":
      state.theme = action.theme;
      return;
    case "pulse":
      return;
  }
}

export function resolveSceneCheckpoint<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
  checkpointName: string,
): TState {
  const validated = validateSceneDefinition(definition);
  const checkpoint = validated.checkpoints.find(
    ({ name }) => name === checkpointName,
  );
  if (!checkpoint) {
    throw new Error(
      `Scene "${definition.id}": unknown checkpoint "${checkpointName}"`,
    );
  }

  const state = clone(validated.initialState);
  const beats = orderSceneBeatsByCommit(validated.beats);

  for (const { beat } of beats) {
    if (sceneBeatCommitAt(beat) > checkpoint.at) continue;
    reduceAction(state, beat.target, beat.action);
  }

  return state;
}

export function resolveSceneEndState<TState extends ChatSceneState>(
  definition: SceneDefinition<TState>,
): TState {
  return resolveSceneCheckpoint(definition, "resolved");
}

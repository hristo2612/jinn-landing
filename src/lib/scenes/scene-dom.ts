import type {
  ChatSceneState,
  SceneDefinition,
  SceneTargetDefinition,
} from "./types";

export interface SceneDomSnapshot {
  element: HTMLElement;
  attributes: Map<string, string | null>;
  textContent?: string;
}

const MUTATED_ATTRIBUTES = [
  "style",
  "hidden",
  "data-active",
  "data-state",
  "data-progress",
] as const;

function targetMatches(root: HTMLElement, target: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-target]")).filter(
    (element) => element.dataset.target === target,
  );
}

export function resolveSceneTargets<TState extends ChatSceneState>(
  root: HTMLElement,
  definition: SceneDefinition<TState>,
): Map<string, HTMLElement> {
  const targets = new Map<string, HTMLElement>();

  for (const target of definition.targets) {
    const matches = targetMatches(root, target.id);
    if (matches.length === 0) {
      throw new Error(
        `Scene "${definition.id}": DOM target "${target.id}" is missing inside its scene root`,
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `Scene "${definition.id}": DOM target "${target.id}" is duplicated inside its scene root`,
      );
    }
    targets.set(target.id, matches[0]);
  }

  return targets;
}

export function captureSceneDom(
  targetDefinitions: readonly SceneTargetDefinition[],
  targets: Map<string, HTMLElement>,
  extraElements: readonly HTMLElement[] = [],
): SceneDomSnapshot[] {
  const textTargets = new Set(
    targetDefinitions.filter(({ kind }) => kind === "text").map(({ id }) => id),
  );
  const elements = [
    ...targets.entries(),
    ...extraElements.map(
      (element, index) => [`__extra-${index}`, element] as const,
    ),
  ];

  return elements.map(([id, element]) => ({
    element,
    attributes: new Map(
      MUTATED_ATTRIBUTES.map((attribute) => [
        attribute,
        element.getAttribute(attribute),
      ]),
    ),
    textContent: textTargets.has(id) ? (element.textContent ?? "") : undefined,
  }));
}

export function restoreSceneDom(snapshots: readonly SceneDomSnapshot[]): void {
  for (const snapshot of snapshots) {
    for (const [attribute, value] of snapshot.attributes) {
      if (value === null) snapshot.element.removeAttribute(attribute);
      else snapshot.element.setAttribute(attribute, value);
    }
    if (snapshot.textContent !== undefined) {
      snapshot.element.textContent = snapshot.textContent;
    }
  }
}

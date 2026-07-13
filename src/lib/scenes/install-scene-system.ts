import { delegationScene } from "../../scenes/landing/delegation.scene";
import { employeesScene } from "../../scenes/landing/employees.scene";
import { todosScene } from "../../scenes/landing/todos.scene";
import { workflowApprovalScene } from "../../scenes/landing/workflow-approval.scene";
import { triggerFireScene } from "../../scenes/landing/trigger-fire.scene";
import { nightShiftScene } from "../../scenes/landing/night-shift.scene";
import { morningApprovalScene } from "../../scenes/landing/morning-approval.scene";
import { SceneController } from "./scene-controller";
import { SceneMotionChannel } from "./scene-motion-channel";
import type { ChatSceneState, SceneDefinition } from "./types";

/** The landing page's full scene registry (also consumed by unit tests). */
export const landingSceneDefinitions = new Map<
  string,
  SceneDefinition<ChatSceneState>
>([
  [delegationScene.id, delegationScene],
  [employeesScene.id, employeesScene],
  [todosScene.id, todosScene],
  [workflowApprovalScene.id, workflowApprovalScene],
  [triggerFireScene.id, triggerFireScene],
  [nightShiftScene.id, nightShiftScene],
  [morningApprovalScene.id, morningApprovalScene],
]);

export async function installSceneSystem(
  definitions: ReadonlyMap<
    string,
    SceneDefinition<ChatSceneState>
  > = landingSceneDefinitions,
): Promise<SceneController[]> {
  const roots = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[data-scene-window][data-scene-id]",
    ),
  );
  if (import.meta.env.DEV) {
    const nestedRoot = roots.find((root) =>
      root.parentElement?.closest("[data-scene-window][data-scene-id]"),
    );
    if (nestedRoot) {
      throw new Error(
        `Scene root "${nestedRoot.dataset.sceneId}" is nested inside another scene root`,
      );
    }
  }
  const motionChannel = new SceneMotionChannel();

  const controllers = roots.map(
    (root) => new SceneController(root, definitions, motionChannel),
  );
  await Promise.all(controllers.map((controller) => controller.start()));
  return controllers;
}

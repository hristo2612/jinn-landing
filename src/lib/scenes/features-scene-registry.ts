import { engineSwitchScene } from "../../scenes/features/engine-switch.scene";
import { orgHireScene } from "../../scenes/features/org-hire.scene";
import { todoApprovalScene } from "../../scenes/features/todo-approval.scene";
import { triageRunScene } from "../../scenes/features/triage-run.scene";
import { webhookFireScene } from "../../scenes/features/webhook-fire.scene";
import { mcpHandsScene } from "../../scenes/features/mcp-hands.scene";
import { slackApproveScene } from "../../scenes/features/slack-approve.scene";
import type { ChatSceneState, SceneDefinition } from "./types";

/**
 * The features page's scene registry (also consumed by unit and visual
 * tests). Passed to the one page installer - `installSceneSystem` discovers
 * the seven standalone windows and gives every player the one shared
 * page-wide motion channel (HANDOFF-A05 §1), so the one-channel law holds
 * across all seven loops by construction.
 */
export const featuresSceneDefinitions = new Map<
  string,
  SceneDefinition<ChatSceneState>
>([
  [engineSwitchScene.id, engineSwitchScene],
  [orgHireScene.id, orgHireScene],
  [todoApprovalScene.id, todoApprovalScene],
  [triageRunScene.id, triageRunScene],
  [webhookFireScene.id, webhookFireScene],
  [mcpHandsScene.id, mcpHandsScene],
  [slackApproveScene.id, slackApproveScene],
]);

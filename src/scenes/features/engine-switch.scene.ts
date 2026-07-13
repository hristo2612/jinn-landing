import type { SceneDefinition } from "../../lib/scenes/types";
import { segmentsToText } from "../../lib/scenes/dashboard";
import {
  engineSwitchInitial,
  engineTyping,
  engineUserRecheck,
  engineDevSecond,
  ENGINE_PILL,
  FEATURES_CAPTIONS,
} from "../../lib/scenes/features";

export const engineSwitchScene = {
  id: "engine-switch",
  title: "Engine switch",
  surface: "chat",
  claim:
    "Engines are interchangeable mid-conversation - the same session, a different brain, context intact.",
  transcript: FEATURES_CAPTIONS["engine-switch"],
  initialState: engineSwitchInitial,
  targets: [
    { id: "pill-box", kind: "element" },
    { id: "pill-engine", kind: "text" },
    { id: "composer-input", kind: "text" },
    { id: "msg-user-2", kind: "element" },
    { id: "thread-typing", kind: "element" },
    { id: "msg-dev-2", kind: "element" },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    dwellMs: 800,
    quietResetMs: 600,
  },
  beats: [
    {
      at: 0,
      duration: 600,
      target: "pill-box",
      action: { type: "pulse", cycles: 1 },
      easing: "spring",
      detail: "Soft lift on the header pill - the picker affordance.",
    },
    {
      at: 700,
      duration: 350,
      target: "pill-engine",
      action: { type: "replace-text", text: ENGINE_PILL.engine },
      easing: "smooth",
      detail: "Model token Opus 4.8 → GPT-5.6 Sol (crossfade).",
    },
    {
      at: 1500,
      duration: 900,
      target: "composer-input",
      action: {
        type: "type-text",
        text: segmentsToText(engineUserRecheck.body),
      },
      easing: "smooth",
      detail: "Fresh eyes - re-check it. (~28ms/char, jitter)",
    },
    {
      at: 2600,
      duration: 150,
      target: "composer-input",
      action: { type: "exit" },
      easing: "smooth",
      detail: "Send.",
    },
    {
      at: 2600,
      duration: 350,
      target: "msg-user-2",
      action: {
        type: "enter",
        content: { kind: "message", item: engineUserRecheck },
        placement: { before: "thread-typing" },
      },
      easing: "smooth",
      detail: "User bubble rises.",
    },
    {
      at: 3100,
      duration: 250,
      target: "thread-typing",
      action: {
        type: "enter",
        content: { kind: "typing", item: engineTyping },
      },
      easing: "smooth",
    },
    {
      at: 3900,
      duration: 150,
      target: "thread-typing",
      action: { type: "exit" },
      easing: "smooth",
    },
    {
      at: 3900,
      duration: 400,
      target: "msg-dev-2",
      action: {
        type: "enter",
        content: { kind: "message", item: engineDevSecond },
      },
      easing: "smooth",
      detail: "The second opinion arrives as a composed block.",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "switched", at: 1200 },
    { name: "sent", at: 3000 },
    { name: "resolved", at: 4400 },
  ],
} satisfies SceneDefinition;

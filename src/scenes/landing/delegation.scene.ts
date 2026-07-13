import {
  delegationChips,
  delegationCooFinding,
  delegationCooPlan,
  delegationInitial,
  delegationTyping,
  delegationUserMessage,
  segmentsToText,
} from "../../lib/scenes/dashboard";
import type { SceneDefinition } from "../../lib/scenes/types";

export const delegationScene = {
  id: "delegation",
  title: "Delegation",
  surface: "chat",
  claim:
    "You run the company by talking to it - one message becomes delegated, owned work.",
  transcript:
    "You message the COO about a signup dip. It replies with a plan, delegates research to the analyst and a copy fix to the writer, and reports the first finding - with a todo already open.",
  initialState: delegationInitial,
  targets: [
    { id: "composer-input", kind: "text" },
    { id: "msg-user-1", kind: "element" },
    { id: "thread-typing", kind: "element" },
    { id: "msg-coo-1", kind: "element" },
    { id: "chip-analyst", kind: "element" },
    { id: "chip-writer", kind: "element" },
    { id: "msg-coo-2", kind: "element" },
  ],
  playback: {
    mode: "loop",
    entry: "play",
    offscreen: "pause",
    startDelayMs: 0,
    dwellMs: 1000,
    quietResetMs: 600,
  },
  beats: [
    {
      at: 0,
      duration: 1100,
      target: "composer-input",
      action: {
        type: "type-text",
        text: segmentsToText(delegationUserMessage.body),
      },
      easing: "smooth",
      detail:
        "User message types at roughly 28ms per character with natural jitter.",
    },
    {
      at: 1200,
      duration: 150,
      target: "composer-input",
      action: { type: "exit" },
      easing: "smooth",
      detail: "Text clears on send.",
    },
    {
      at: 1200,
      duration: 350,
      target: "msg-user-1",
      action: {
        type: "enter",
        content: { kind: "message", item: delegationUserMessage },
        placement: { before: "thread-typing" },
      },
      easing: "smooth",
      detail: "User bubble rises into the thread.",
    },
    {
      at: 1500,
      duration: 250,
      target: "thread-typing",
      action: {
        type: "enter",
        content: { kind: "typing", item: delegationTyping },
      },
      easing: "smooth",
      detail: "Three-dot typing indicator enters.",
    },
    {
      at: 1900,
      duration: 150,
      target: "thread-typing",
      action: { type: "exit" },
      easing: "smooth",
    },
    {
      at: 1900,
      duration: 400,
      target: "msg-coo-1",
      action: {
        type: "enter",
        content: { kind: "message", item: delegationCooPlan },
      },
      easing: "smooth",
      detail: "The COO plan arrives as a composed block.",
    },
    {
      at: 2800,
      duration: 300,
      target: "chip-analyst",
      action: {
        type: "enter",
        content: {
          kind: "chip",
          groupId: delegationChips.id,
          item: delegationChips.chips[0],
        },
        placement: { after: "msg-coo-1" },
      },
      easing: "spring",
      detail: "↳ Delegated - analyst · funnel investigation",
    },
    {
      at: 3150,
      duration: 300,
      target: "chip-writer",
      action: {
        type: "enter",
        content: {
          kind: "chip",
          groupId: delegationChips.id,
          item: delegationChips.chips[1],
        },
      },
      easing: "spring",
      detail: "↳ Delegated - writer · landing copy pass",
    },
    {
      at: 3700,
      duration: 400,
      target: "msg-coo-2",
      action: {
        type: "enter",
        content: { kind: "message", item: delegationCooFinding },
      },
      easing: "smooth",
      detail: "The first finding arrives as a composed block.",
    },
  ],
  checkpoints: [
    { name: "initial", at: 0 },
    { name: "sent", at: 1500 },
    { name: "delegated", at: 3500 },
    { name: "resolved", at: 4200 },
  ],
} satisfies SceneDefinition;

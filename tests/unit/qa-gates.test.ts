import { describe, expect, test } from "vitest";

import {
  desktopSceneCheckpoints,
  mobileVisualStates,
  reducedMotionStates,
} from "../../scripts/qa-gates";

describe("visual release gate matrix", () => {
  test("covers every authored checkpoint for each user-visible narrative scene", () => {
    expect(desktopSceneCheckpoints).toEqual({
      delegation: ["initial", "sent", "delegated", "resolved"],
      employees: ["initial", "seated", "resolved"],
      todos: ["initial", "ledger", "completing", "resolved"],
      "workflow-approval": ["initial", "advancing", "parked", "resolved"],
      "trigger-fire": ["initial", "fired", "resolved"],
      "night-shift": ["initial", "feeding", "resolved"],
      "morning-approval": ["initial", "approved", "resolved"],
    });
  });

  test("covers the required mobile and reduced-motion states", () => {
    expect(mobileVisualStates.map(({ id }) => id)).toEqual([
      "hero",
      "todos",
      "workflow-approval",
      "morning-approval",
      "footer",
    ]);
    expect(reducedMotionStates.map(({ id }) => id)).toEqual([
      "desktop-hero-resolved",
      "mobile-todos-resolved",
    ]);
  });
});

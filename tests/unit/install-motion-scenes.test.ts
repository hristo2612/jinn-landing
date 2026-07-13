import { afterEach, describe, expect, test, vi } from "vitest";

import { installMotionScenes } from "../../src/lib/scenes/install-motion-scenes";

class MutableMotionPreference {
  matches: boolean;
  private listener?: () => void;

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_type: "change", listener: () => void): void {
    this.listener = listener;
  }

  removeEventListener(_type: "change", listener: () => void): void {
    if (this.listener === listener) this.listener = undefined;
  }

  set(matches: boolean): void {
    this.matches = matches;
    this.listener?.();
  }
}

describe("installMotionScenes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("keeps the motion flag synchronized across live preference changes", async () => {
    const preference = new MutableMotionPreference(true);
    const dataset: DOMStringMap = { motion: "reduce" };
    const controller = { destroy: vi.fn() };
    const load = vi.fn(async () => async () => [controller]);

    vi.stubGlobal("document", { documentElement: { dataset } });
    vi.stubGlobal("matchMedia", () => preference);

    const cleanup = installMotionScenes({ load });
    expect(dataset.sceneRuntime).toBe("reduced");
    expect(load).not.toHaveBeenCalled();

    preference.set(false);
    await vi.waitFor(() => expect(dataset.sceneRuntime).toBe("motion"));
    expect(dataset.motion).toBe("ok");

    preference.set(true);
    expect(dataset.sceneRuntime).toBe("reduced");
    expect(dataset.motion).toBe("reduce");
    expect(controller.destroy).toHaveBeenCalledOnce();

    cleanup();
  });

  test("settles on a visible static runtime when the motion bundle fails", async () => {
    const preference = new MutableMotionPreference(false);
    const dataset: DOMStringMap = {};
    const load = vi.fn(async () => {
      throw new Error("bundle unavailable");
    });

    vi.stubGlobal("document", { documentElement: { dataset } });
    vi.stubGlobal("matchMedia", () => preference);

    const cleanup = installMotionScenes({ load });
    expect(dataset.sceneRuntime).toBe("loading");
    await vi.waitFor(() => expect(dataset.sceneRuntime).toBe("static"));
    expect(dataset.motion).toBe("ok");

    cleanup();
  });
});

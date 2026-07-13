import { expect, test, type Page } from "@playwright/test";

import { delegationResolved } from "../../src/lib/scenes/dashboard";

const sceneWindow = (page: Page) => page.locator("[data-scene-window]").first();

test.describe("ScenePlayer", () => {
  test("swaps during playback, rejects unknown ids atomically, and restarts restart-on-enter definitions", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const root = page.locator("[data-scene-window]");
    await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: { restart(): void; swap(id: string): void };
        }
      ).__sceneFixturePlayer;
      player.restart();
      player.swap("fixture-restart");
    });
    await expect(root).toHaveAttribute("data-scene-player-state", "playing");
    await expect
      .poll(async () => Number(await root.getAttribute("data-scene-time")))
      .toBeLessThan(700);

    await expect
      .poll(async () => root.getAttribute("data-scene-player-state"))
      .toBe("completed");
    await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: { swap(id: string): void };
        }
      ).__sceneFixturePlayer;
      player.swap("fixture-loop");
      player.swap("fixture-restart");
    });
    await expect(root).toHaveAttribute("data-scene-player-state", "playing");

    const error = await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: {
            definition: { id: string };
            swap(id: string): void;
          };
        }
      ).__sceneFixturePlayer;
      try {
        player.swap("missing-scene");
        return null;
      } catch (cause) {
        return {
          message: cause instanceof Error ? cause.message : String(cause),
          active: player.definition.id,
        };
      }
    });
    expect(error).toEqual({
      message: 'ScenePlayer: swap target "missing-scene" is not registered',
      active: "fixture-restart",
    });
  });

  test("rejects every invalid swap destination before touching the live runtime", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const failures = await page.evaluate(() => {
      const fixtureWindow = window as typeof window & {
        __sceneFixturePlayer: {
          currentTime: number;
          definition: { id: string };
          restart(): void;
          swap(id: string): void;
        };
      };
      const player = fixtureWindow.__sceneFixturePlayer;
      player.restart();
      const errors: string[] = [];
      const attempt = (sceneId: string): void => {
        try {
          player.swap(sceneId);
        } catch (cause) {
          errors.push(cause instanceof Error ? cause.message : String(cause));
        }
      };

      attempt("fixture-invalid-loop");
      attempt("fixture-missing-target");
      const copy = document.querySelector<HTMLElement>("[data-target='copy']")!;
      const duplicate = copy.cloneNode(true) as HTMLElement;
      copy.parentElement!.append(duplicate);
      attempt("no-theme");
      duplicate.remove();
      const controls = document.querySelector<HTMLElement>(
        "[data-scene-controls]",
      )!;
      const controlsParent = controls.parentElement!;
      controls.remove();
      attempt("fixture-loop");
      controlsParent.append(controls);

      const before = player.currentTime;
      return new Promise<{
        errors: string[];
        definition: string;
        advanced: boolean;
      }>((resolve) => {
        const probe = (): void => {
          if (player.currentTime <= before) {
            requestAnimationFrame(probe);
            return;
          }
          resolve({
            errors,
            definition: player.definition.id,
            advanced: true,
          });
        };
        requestAnimationFrame(probe);
      });
    });

    expect(failures).toEqual({
      errors: [
        'Scene "fixture-invalid-loop": loop playback requires positive dwellMs and quietResetMs',
        'Scene "fixture-missing-target": DOM target "absent" is missing inside its scene root',
        'Scene "no-theme": DOM target "copy" is duplicated inside its scene root',
        'Scene "fixture-loop": looping scenes require [data-scene-controls] inside their scene root',
      ],
      definition: "fixture",
      advanced: true,
    });
  });

  test("swaps definitions without motion while keeping the resolved static DOM", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const root = page.locator("[data-scene-window]");
    await page.evaluate(() => {
      (
        window as typeof window & {
          __sceneFixturePlayer: { swap(id: string): void };
        }
      ).__sceneFixturePlayer.swap("fixture-loop");
    });

    await expect(root).toHaveAttribute("data-scene-player-state", "static");
    await expect(root).toHaveAttribute("data-scene-timeline-count", "0");
    await expect(root.locator("[data-scene-playback-control]")).toHaveCount(0);
    await expect(root.locator("[data-target='copy']")).toHaveText("Looping");
  });

  test("preserves the window user-pause reason across a swap", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const root = page.locator("[data-scene-window]");
    await page.evaluate(() => {
      (
        window as typeof window & {
          __sceneFixturePlayer: { swap(id: string): void };
        }
      ).__sceneFixturePlayer.swap("fixture-loop");
    });
    await root.getByRole("button", { name: "Pause animation" }).click();
    await page.evaluate(() => {
      (
        window as typeof window & {
          __sceneFixturePlayer: { swap(id: string): void };
        }
      ).__sceneFixturePlayer.swap("fixture");
    });

    await expect(root).toHaveAttribute("data-scene-player-state", "paused");
    await expect(root).toHaveAttribute("data-scene-time", "0");
    await page.evaluate(() => {
      (
        window as typeof window & {
          __sceneFixturePlayer: { resume(reason: "user"): void };
        }
      ).__sceneFixturePlayer.resume("user");
    });
    await expect(root).toHaveAttribute("data-scene-player-state", "playing");
  });

  test("fully tears down and reinitializes one surface across repeated swaps", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const root = page.locator("[data-scene-window]");
    await expect(root).toHaveAttribute("data-scene-player-state", "completed");

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await page.evaluate(() => {
        (
          window as typeof window & {
            __sceneFixturePlayer: { swap(id: string): void };
          }
        ).__sceneFixturePlayer.swap("fixture-loop");
      });
      await expect(root.locator("[data-scene-playback-control]")).toHaveCount(
        1,
      );
      await expect(root).toHaveAttribute("data-scene-timeline-count", "1");
      await expect(root.locator("[data-target='copy']")).toHaveText("Looping");

      await page.evaluate(() => {
        (
          window as typeof window & {
            __sceneFixturePlayer: { swap(id: string): void };
          }
        ).__sceneFixturePlayer.swap("fixture");
      });
      await expect(root.locator("[data-scene-playback-control]")).toHaveCount(
        0,
      );
      await expect(root).toHaveAttribute(
        "data-scene-player-state",
        "completed",
      );
      await expect(root).toHaveAttribute("data-scene-time", "1000");
      await expect(root.locator("[data-target='copy']")).toHaveText("Animated");
    }

    const lifecycleBalance = () =>
      page.evaluate(() => {
        const counts = (
          window as typeof window & {
            __sceneFixtureLifecycle: Record<string, number>;
          }
        ).__sceneFixtureLifecycle;
        return {
          visibility: counts.visibilityAdds - counts.visibilityRemoves,
          pagehide: counts.pagehideAdds - counts.pagehideRemoves,
          observers: counts.observers - counts.observerDisconnects,
        };
      });
    expect(await lifecycleBalance()).toEqual({
      visibility: 1,
      pagehide: 1,
      observers: 1,
    });

    await page.evaluate(() => {
      (
        window as typeof window & { __sceneFixturePlayer: { destroy(): void } }
      ).__sceneFixturePlayer.destroy();
    });
    expect(await lifecycleBalance()).toEqual({
      visibility: 0,
      pagehide: 0,
      observers: 0,
    });
    await expect(root).not.toHaveAttribute("style", /.+/);
    await expect(root.locator("[data-target='copy']")).toHaveText("Resolved");
  });

  test("fails loudly for missing and duplicate targets inside the scene root", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=missing");
    await expect(page.locator("html")).toHaveAttribute(
      "data-fixture-error",
      'Scene "fixture": DOM target "copy" is missing inside its scene root',
    );

    await page.goto("/test-fixtures/scene-player/?mode=duplicate");
    await expect(page.locator("html")).toHaveAttribute(
      "data-fixture-error",
      'Scene "fixture": DOM target "copy" is duplicated inside its scene root',
    );
  });

  test("scopes targets to one root and exposes seek, restart, and destroy", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const root = page.locator("[data-scene-window]");

    await expect(root).toHaveAttribute("data-scene-player-state", "playing");
    await expect(root).toHaveAttribute("data-scene-timeline-count", "1");
    await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: {
            pause(): void;
            seek(milliseconds: number): void;
          };
        }
      ).__sceneFixturePlayer;
      player.pause();
      player.seek(750);
    });
    await expect(root).toHaveAttribute("data-scene-time", "750");

    await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: { restart(): void };
        }
      ).__sceneFixturePlayer;
      player.restart();
    });
    await expect
      .poll(async () => Number(await root.getAttribute("data-scene-time")))
      .toBeLessThan(300);

    await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: { destroy(): void };
        }
      ).__sceneFixturePlayer;
      player.destroy();
    });
    await expect(root).not.toHaveAttribute("data-scene-player-state", /.+/);
    await expect(root.locator("[data-target='copy']")).toHaveText("Resolved");
  });

  test("reconstructs exact semantic DOM state when seeking forward and backward", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const root = page.locator("[data-scene-window]");
    const player = () =>
      page.evaluate((milliseconds) => {
        const fixturePlayer = (
          window as typeof window & {
            __sceneFixturePlayer: {
              pause(): void;
              seek(milliseconds: number): void;
            };
          }
        ).__sceneFixturePlayer;
        fixturePlayer.pause();
        fixturePlayer.seek(milliseconds);
      }, 0);

    await page.evaluate(() => {
      const fixturePlayer = (
        window as typeof window & {
          __sceneFixturePlayer: {
            pause(): void;
            seek(milliseconds: number): void;
          };
        }
      ).__sceneFixturePlayer;
      fixturePlayer.pause();
      fixturePlayer.seek(1000);
    });
    await expect(root).toHaveAttribute("data-scene-checkpoint", "resolved");
    await expect(root.locator("[data-target='copy']")).toHaveText("Animated");
    await expect(root.locator("[data-target='entered']")).toBeVisible();
    await expect(root.locator("[data-target='departing']")).toBeHidden();
    await expect(root.locator("[data-target='status']")).toHaveAttribute(
      "data-state",
      "done",
    );
    await expect(root.locator("[data-target='ribbon-org']")).toHaveAttribute(
      "data-active",
      "",
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await player();
    await expect(root).toHaveAttribute("data-scene-time", "0");
    await expect(root).toHaveAttribute("data-scene-checkpoint", "initial");
    await expect(root.locator("[data-target='copy']")).toHaveText("Resolved");
    await expect(root.locator("[data-target='entered']")).toBeHidden();
    await expect(root.locator("[data-target='departing']")).toBeVisible();
    await expect(root.locator("[data-target='status']")).toHaveAttribute(
      "data-state",
      "queued",
    );
    await expect(root.locator("[data-target='ribbon-chat']")).toHaveAttribute(
      "data-active",
      "",
    );
    await expect(
      root.locator("[data-target='ribbon-org']"),
    ).not.toHaveAttribute("data-active", /.+/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("does not let a non-theme scene overwrite document theme on seek or destroy", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=no-theme");

    const lifecycleTheme = await page.evaluate(() => {
      const root = document.documentElement;
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: {
            pause(): void;
            seek(milliseconds: number): void;
            destroy(): void;
          };
        }
      ).__sceneFixturePlayer;
      const readTheme = () => ({
        theme: root.dataset.theme,
        transition: root.dataset.themeTransition,
        target: root.dataset.themeTarget,
      });

      player.pause();
      root.dataset.theme = "light";
      root.dataset.themeTransition = "active";
      root.dataset.themeTarget = "light";
      player.seek(0);
      const afterSeek = readTheme();
      player.destroy();

      return { afterSeek, afterDestroy: readTheme() };
    });

    expect(lifecycleTheme).toEqual({
      afterSeek: { theme: "light", transition: "active", target: "light" },
      afterDestroy: {
        theme: "light",
        transition: "active",
        target: "light",
      },
    });
  });

  test("restores theme for initial-state ownership without a theme beat", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=initial-theme-only");

    await page.evaluate(() => {
      const root = document.documentElement;
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: {
            pause(): void;
            seek(milliseconds: number): void;
          };
        }
      ).__sceneFixturePlayer;
      player.pause();
      root.dataset.theme = "light";
      player.seek(0);
    });

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("keeps a theme-at-zero scene dark at seek zero and light after its first tick", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=theme-at-zero");

    const playerAction = (action: "seek-zero" | "seek-forward" | "destroy") =>
      page.evaluate((nextAction) => {
        const player = (
          window as typeof window & {
            __sceneFixturePlayer: {
              pause(): void;
              seek(milliseconds: number): void;
              destroy(): void;
            };
          }
        ).__sceneFixturePlayer;
        player.pause();
        if (nextAction === "seek-zero") player.seek(0);
        else if (nextAction === "seek-forward") player.seek(1);
        else player.destroy();
      }, action);

    await playerAction("seek-zero");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await playerAction("seek-forward");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await playerAction("destroy");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("settles overlapping state transitions to the same value as the reducer", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=overlapping-state");
    const root = page.locator("[data-scene-window]");
    const status = root.locator("[data-target='status']");

    await expect(root).toHaveAttribute("data-scene-player-state", "completed");
    expect(
      await page.evaluate(() => ({
        dom: document
          .querySelector<HTMLElement>("[data-target='status']")
          ?.getAttribute("data-state"),
        reducer: (
          window as typeof window & {
            __sceneFixtureResolvedState: {
              targetStates?: Record<string, string>;
            };
          }
        ).__sceneFixtureResolvedState.targetStates?.status,
      })),
    ).toEqual({ dom: "done", reducer: "done" });
    await expect(status).toHaveAttribute("data-state", "done");
  });

  test("keeps semantic and visual progress ordered with the reducer across seek and teardown", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const root = page.locator("[data-scene-window]");
    const progress = root.locator("[data-target='progress']");
    const visualProgress = () =>
      progress.evaluate((node) =>
        Number(getComputedStyle(node).getPropertyValue("--scene-progress")),
      );

    const seek = async (milliseconds: number) => {
      await page.evaluate((time) => {
        const player = (
          window as typeof window & {
            __sceneFixturePlayer: {
              pause(): void;
              seek(milliseconds: number): void;
            };
          }
        ).__sceneFixturePlayer;
        player.pause();
        player.seek(time);
      }, milliseconds);
    };

    await seek(0);
    await expect(progress).toHaveAttribute("data-progress", String(1 / 3));
    expect(await visualProgress()).toBeCloseTo(1 / 3, 5);

    await seek(600);
    await expect(progress).toHaveAttribute("data-progress", String(1 / 3));
    expect(await visualProgress()).toBeGreaterThan(1 / 3);

    await seek(800);
    await expect(progress).toHaveAttribute("data-progress", String(2 / 3));
    expect(await visualProgress()).toBeCloseTo(2 / 3, 5);

    await seek(200);
    await expect(progress).toHaveAttribute("data-progress", String(1 / 3));
    expect(await visualProgress()).toBeCloseTo(1 / 3, 5);

    await page.evaluate(() => {
      (
        window as typeof window & {
          __sceneFixturePlayer: { destroy(): void };
        }
      ).__sceneFixturePlayer.destroy();
    });
    await expect(progress).toHaveAttribute("data-progress", String(2 / 3));
    expect(await visualProgress()).toBeCloseTo(2 / 3, 5);
  });

  test("keeps the authored initial state at seek zero when a state beat starts at zero", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=overlapping-state");
    const root = page.locator("[data-scene-window]");

    const state = await page.evaluate(() => {
      const fixture = window as typeof window & {
        __sceneFixtureInitialState: {
          targetStates?: Record<string, string>;
        };
        __sceneFixturePlayer: {
          pause(): void;
          seek(milliseconds: number): void;
        };
      };
      fixture.__sceneFixturePlayer.pause();
      fixture.__sceneFixturePlayer.seek(0);
      return fixture.__sceneFixtureInitialState.targetStates?.status;
    });

    expect(state).toBe("queued");
    await expect(root).toHaveAttribute("data-scene-time", "0");
    await expect(root.locator("[data-target='status']")).toHaveAttribute(
      "data-state",
      "queued",
    );
  });

  test("reports once-scene completion honestly and emits a lifecycle signal", async ({
    page,
  }) => {
    await page.goto("/test-fixtures/scene-player/?mode=scoped");
    const root = page.locator("[data-scene-window]");
    const supportsLifecycle = await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixturePlayer: object;
          __sceneStatuses?: string[];
        }
      ).__sceneFixturePlayer as {
        onStatusChange?: (listener: (status: string) => void) => () => void;
      };
      if (!player.onStatusChange) return false;
      const statuses: string[] = [];
      (
        window as typeof window & { __sceneStatuses?: string[] }
      ).__sceneStatuses = statuses;
      player.onStatusChange((status) => statuses.push(status));
      return true;
    });

    expect(supportsLifecycle).toBe(true);
    await expect(root).toHaveAttribute("data-scene-player-state", "completed");
    expect(
      await page.evaluate(() => {
        const player = (
          window as typeof window & {
            __sceneFixturePlayer: {
              status: string;
              isPlaying: boolean;
              isCompleted: boolean;
            };
          }
        ).__sceneFixturePlayer;
        return {
          status: player.status,
          isPlaying: player.isPlaying,
          isCompleted: player.isCompleted,
          statuses: (window as typeof window & { __sceneStatuses: string[] })
            .__sceneStatuses,
        };
      }),
    ).toEqual({
      status: "completed",
      isPlaying: false,
      isCompleted: true,
      statuses: ["playing", "completed"],
    });
  });

  test("starts the hero loop promptly without a long entrance hold", async ({
    page,
  }) => {
    await page.goto("/");
    const root = sceneWindow(page);

    await expect(root).toHaveAttribute("data-scene-player-state", "playing");
    await expect
      .poll(async () => Number(await root.getAttribute("data-scene-time")))
      .toBeGreaterThan(50);
  });

  test("compiles the hero into one timeline with one accessible 44px control", async ({
    page,
  }) => {
    await page.goto("/");

    const root = sceneWindow(page);
    await expect(root).toHaveAttribute("data-scene-player-state", "playing");
    await expect(root).toHaveAttribute("data-scene-timeline-count", "1");

    const control = root.getByRole("button", { name: "Pause animation" });
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("pauses and resumes from the same timeline time", async ({ page }) => {
    await page.goto("/");

    const root = sceneWindow(page);
    const pause = root.getByRole("button", { name: "Pause animation" });
    await expect(pause).toBeVisible();
    await expect
      .poll(async () => Number(await root.getAttribute("data-scene-time")))
      .toBeGreaterThan(50);

    await pause.click();
    await expect(root).toHaveAttribute("data-scene-player-state", "paused");
    const pausedAt = Number(await root.getAttribute("data-scene-time"));
    await page.waitForTimeout(350);
    const stillPausedAt = Number(await root.getAttribute("data-scene-time"));
    expect(Math.abs(stillPausedAt - pausedAt)).toBeLessThan(20);

    await root.getByRole("button", { name: "Play animation" }).click();
    await expect(root).toHaveAttribute("data-scene-player-state", "playing");
    await expect
      .poll(async () => Number(await root.getAttribute("data-scene-time")))
      .toBeGreaterThan(pausedAt + 100);
  });

  test("preserves a user pause across visibility changes", async ({ page }) => {
    await page.goto("/");

    const root = sceneWindow(page);
    await root.getByRole("button", { name: "Pause animation" }).click();
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await expect(root).toHaveAttribute("data-scene-player-state", "paused");
    await expect(
      root.getByRole("button", { name: "Play animation" }),
    ).toBeVisible();
  });

  test("pauses offscreen and resumes on viewport re-entry", async ({
    page,
  }) => {
    await page.goto("/");

    const root = sceneWindow(page);
    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.style.height = "200vh";
      document.body.append(spacer);
    });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(root).toHaveAttribute("data-scene-player-state", "paused");

    await root.evaluate((node) =>
      node.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await expect(root).toHaveAttribute("data-scene-player-state", "playing");
  });

  test("destroys cleanly and restores the resolved SSR snapshot", async ({
    page,
  }) => {
    await page.goto("/");

    const root = sceneWindow(page);
    await expect(root).toHaveAttribute("data-scene-timeline-count", "1");
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent("pagehide")),
    );

    await expect(root).not.toHaveAttribute("data-scene-player-state", /.+/);
    await expect(root).not.toHaveAttribute("data-scene-timeline-count", /.+/);
    await expect(root.getByRole("button", { name: /animation/ })).toHaveCount(
      0,
    );
    await expect(root.locator("[data-target='composer-input']")).toHaveText(
      delegationResolved.composerPlaceholder,
    );
    await expect(root.locator("[data-target='thread-typing']")).toBeHidden();
    await expect(root.locator("[data-target='msg-coo-2']")).toBeVisible();
    await expect(root.locator("[style]")).toHaveCount(0);
  });

  test("instantiates no scene runtime and leaves resolved SSR under reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const root = sceneWindow(page);
    await expect(root).not.toHaveAttribute("data-scene-player-state", /.+/);
    await expect(root).not.toHaveAttribute("data-scene-timeline-count", /.+/);
    await expect(root.getByRole("button", { name: /animation/ })).toHaveCount(
      0,
    );
    await expect(root.locator("[data-target='msg-coo-2']")).toBeVisible();
    await expect(root.locator("[style]")).toHaveCount(0);
  });
});

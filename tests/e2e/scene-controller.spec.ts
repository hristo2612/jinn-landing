import { expect, test, type Locator, type Page } from "@playwright/test";

const fixture = "/test-fixtures/scene-controller/";

function controller(page: Page): Locator {
  return page.locator("[data-scene-controller]");
}

function sharedWindow(page: Page): Locator {
  return controller(page).locator("[data-scene-shared-window]");
}

function stage(page: Page, id: string): Locator {
  return controller(page).locator(`[data-scene-stage][data-scene-id='${id}']`);
}

async function scrollToStage(
  page: Page,
  root: Locator,
  id: string,
): Promise<void> {
  await stage(page, id).evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await expect(root).toHaveAttribute("data-active-scene", id);
}

async function center(locator: Locator): Promise<void> {
  await locator.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
}

test.describe("SceneController desktop", () => {
  test("a direct loop claim waits for the current beat boundary within 500ms", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    await scrollToStage(page, root, "stage-todos");

    const result = await page.evaluate(async () => {
      const fixtureWindow = window as typeof window & {
        __sceneFixtureController: {
          getActivePlayer(): {
            currentTime: number;
            seek(milliseconds: number): void;
            swap(id: string): void;
          } | null;
        };
        __sceneFixtureMorningController: {
          getActivePlayer(): object | null;
        };
        __sceneFixtureMotionChannel: {
          claim(player: object): void;
          isActive(player: object): boolean;
          release(player: object): void;
          setAmbientRole(player: object, ambient: boolean): boolean;
        };
      };
      const controller = fixtureWindow.__sceneFixtureController;
      controller.getActivePlayer()!.swap("stage-todos-selected-loop");
      const outgoing = controller.getActivePlayer()!;
      outgoing.seek(2467);
      fixtureWindow.__sceneFixtureMotionChannel.setAmbientRole(outgoing, false);
      const incoming =
        fixtureWindow.__sceneFixtureMorningController.getActivePlayer()!;
      const startedAt = performance.now();
      fixtureWindow.__sceneFixtureMotionChannel.claim(incoming);
      // Match the standalone-window scroll handoff: the outgoing root leaves
      // after the incoming root claims, but its active beat remains atomic.
      fixtureWindow.__sceneFixtureMotionChannel.release(outgoing);

      return new Promise<{
        elapsed: number;
        outgoingTime: number;
      }>((resolve) => {
        const probe = (): void => {
          if (fixtureWindow.__sceneFixtureMotionChannel.isActive(incoming)) {
            resolve({
              elapsed: performance.now() - startedAt,
              outgoingTime: outgoing.currentTime,
            });
            return;
          }
          requestAnimationFrame(probe);
        };
        requestAnimationFrame(probe);
      });
    });

    expect(result.elapsed).toBeGreaterThanOrEqual(250);
    expect(result.elapsed).toBeLessThanOrEqual(500);
    expect(result.outgoingTime).toBeGreaterThanOrEqual(2750);
    expect(result.outgoingTime).toBeLessThanOrEqual(2800);
  });

  test("an offscreen-idled ticker still settles the real RAF-driven loop yield", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    await scrollToStage(page, root, "stage-todos");

    const result = await page.evaluate(() => {
      const fixtureWindow = window as typeof window & {
        __sceneFixtureController: {
          getActivePlayer(): {
            currentTime: number;
            seek(milliseconds: number): void;
            swap(id: string): void;
          } | null;
        };
        __sceneFixtureMorningController: {
          getActivePlayer(): object | null;
        };
        __sceneFixtureMotionChannel: {
          claim(player: object): void;
          isActive(player: object): boolean;
          setAmbientRole(player: object, ambient: boolean): boolean;
        };
        __sceneFixtureTickerProbe: {
          read(): number;
          start(): void;
          stop(): void;
        };
      };
      const sceneController = fixtureWindow.__sceneFixtureController;
      sceneController.getActivePlayer()!.swap("stage-todos-selected-loop");
      const outgoing = sceneController.getActivePlayer()!;
      outgoing.seek(2467);
      fixtureWindow.__sceneFixtureMotionChannel.setAmbientRole(outgoing, false);
      const incoming =
        fixtureWindow.__sceneFixtureMorningController.getActivePlayer()!;
      const scene = document.querySelector<HTMLElement>(
        "[data-scene-controller] [data-scene-shared-window]",
      )!;
      const sceneRoot = document.querySelector<HTMLElement>(
        "[data-scene-controller]",
      )!;

      fixtureWindow.__sceneFixtureTickerProbe.start();
      fixtureWindow.__sceneFixtureMotionChannel.claim(incoming);
      sceneRoot.style.transform = "translateY(-10000px)";

      return new Promise<{
        idleFrames: number;
        outgoingTime: number;
        stableFrames: number;
        tickerTicks: number;
      }>((resolve) => {
        let idleFrames = 0;
        let stableFrames = 0;
        let idleTime = Number.NaN;
        let idleTicks = 0;
        const probe = (): void => {
          const outgoingOwns =
            fixtureWindow.__sceneFixtureMotionChannel.isActive(outgoing);
          if (outgoingOwns && scene.dataset.scenePlayerState === "paused") {
            const currentTime = outgoing.currentTime;
            const currentTicks = fixtureWindow.__sceneFixtureTickerProbe.read();
            if (idleFrames === 0) {
              idleTime = currentTime;
              idleTicks = currentTicks;
            } else if (currentTime === idleTime && currentTicks === idleTicks) {
              stableFrames += 1;
            }
            idleFrames += 1;
          }

          if (fixtureWindow.__sceneFixtureMotionChannel.isActive(incoming)) {
            const tickerTicks =
              fixtureWindow.__sceneFixtureTickerProbe.read() - idleTicks;
            fixtureWindow.__sceneFixtureTickerProbe.stop();
            sceneRoot.style.transform = "";
            resolve({
              idleFrames,
              outgoingTime: outgoing.currentTime,
              stableFrames,
              tickerTicks,
            });
            return;
          }
          requestAnimationFrame(probe);
        };
        requestAnimationFrame(probe);
      });
    });

    expect(result.idleFrames).toBeGreaterThanOrEqual(3);
    expect(result.stableFrames).toBeGreaterThanOrEqual(2);
    expect(result.tickerTicks).toBeLessThanOrEqual(1);
    expect(result.outgoingTime).toBeGreaterThanOrEqual(2750);
    expect(result.outgoingTime).toBeLessThanOrEqual(2800);
  });

  test("sunrise releases ten live Morning replacements at fire time", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (let iteration = 0; iteration < 10; iteration += 1) {
      await page.goto(fixture);
      const morning = page.locator(
        "[data-scene-window][data-scene-id='morning-approval']",
      );
      await expect(morning).toHaveAttribute(
        "data-scene-player-state",
        "paused",
      );

      const result = await page.evaluate(async () => {
        const fixtureWindow = window as typeof window & {
          __sceneFixtureMorningController: {
            getActivePlayer(): {
              definition: { id: string };
              pause(reason: "api"): void;
              resume(reason: "api"): void;
              status: string;
            } | null;
            rebuild(preserveState: boolean): Promise<void>;
          };
        };
        const controller = fixtureWindow.__sceneFixtureMorningController;
        const installedPlayer = controller.getActivePlayer();
        const morningRoot = document.querySelector<HTMLElement>(
          "[data-scene-window][data-scene-id='morning-approval']",
        )!;
        morningRoot.hidden = false;

        // Deterministically model the mobile re-entry race from the taste
        // probe: installSunrise has already gated one player, then controller
        // lifecycle replaces it before the position rule fires.
        await controller.rebuild(false);
        const livePlayer = controller.getActivePlayer()!;
        livePlayer.pause("api");
        const replaced = installedPlayer !== livePlayer;
        let liveApiResumes = 0;
        const resume = livePlayer.resume.bind(livePlayer);
        livePlayer.resume = (reason: "api") => {
          if (reason === "api") liveApiResumes += 1;
          resume(reason);
        };

        morningRoot.scrollIntoView({ block: "center", behavior: "instant" });

        return new Promise<{
          liveApiResumes: number;
          replaced: boolean;
        }>((resolve) => {
          const probe = (): void => {
            if (
              document.documentElement.dataset.theme === "light" &&
              liveApiResumes > 0
            ) {
              resolve({ liveApiResumes, replaced });
              return;
            }
            requestAnimationFrame(probe);
          };
          requestAnimationFrame(probe);
        });
      });

      expect(result.replaced).toBe(true);
      expect(result.liveApiResumes).toBe(1);
    }
  });

  test("a swap-selected loop commits its t=2467 beat before scripted activation", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    await scrollToStage(page, root, "stage-todos");

    const result = await page.evaluate(async () => {
      const controller = (
        window as typeof window & {
          __sceneFixtureController: {
            activate(id: string): void;
            getActivePlayer(): {
              currentTime: number;
              definition: { id: string };
              seek(milliseconds: number): void;
              swap(id: string): void;
              yieldAtBeatBoundary(): Promise<void>;
            } | null;
          };
        }
      ).__sceneFixtureController;
      controller.getActivePlayer()!.swap("stage-todos-selected-loop");
      const loop = controller.getActivePlayer()!;
      loop.seek(2467);
      let yieldedAt = 0;
      const yieldAtBeatBoundary = loop.yieldAtBeatBoundary.bind(loop);
      loop.yieldAtBeatBoundary = async () => {
        await yieldAtBeatBoundary();
        yieldedAt = loop.currentTime;
      };
      const startedAt = performance.now();
      controller.activate("stage-flows");
      await new Promise<void>((resolve) => {
        const probe = () => {
          if (controller.getActivePlayer()?.definition.id === "stage-flows") {
            resolve();
            return;
          }
          requestAnimationFrame(probe);
        };
        requestAnimationFrame(probe);
      });
      const elapsed = performance.now() - startedAt;
      return { elapsed, yieldedAt };
    });

    expect(result.elapsed).toBeGreaterThanOrEqual(250);
    expect(result.elapsed).toBeLessThanOrEqual(500);
    expect(result.yieldedAt).toBeGreaterThanOrEqual(2750);
    expect(result.yieldedAt).toBeLessThanOrEqual(2800);
  });

  test("starts ambient after its retained host resolves, yields at a beat boundary, and re-arms", async ({
    page,
  }) => {
    await page.goto(`${fixture}?ambient=1`);
    const root = controller(page);
    const scene = sharedWindow(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");

    await scrollToStage(page, root, "stage-todos");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos-ambient");
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as typeof window & {
              __sceneFixtureController: {
                getSceneState(id: string): object | null;
              };
            }
          ).__sceneFixtureController.getSceneState("stage-todos"),
        ),
      )
      .not.toBeNull();

    await expect
      .poll(async () => Number(await scene.getAttribute("data-scene-time")))
      .toBeGreaterThan(50);
    const yielded = await page.evaluate(async () => {
      const player = (
        window as typeof window & {
          __sceneFixtureController: {
            getActivePlayer(): {
              currentTime: number;
              status: string;
              seek(milliseconds: number): void;
              yieldAtBeatBoundary(): Promise<void>;
            } | null;
          };
        }
      ).__sceneFixtureController.getActivePlayer()!;
      player.seek(100);
      await player.yieldAtBeatBoundary();
      return {
        time: player.currentTime,
        status: player.status,
      };
    });
    expect(yielded.time).toBeGreaterThanOrEqual(395);
    expect(yielded.time).toBeLessThanOrEqual(405);
    expect(yielded.status).toBe("paused");

    await scrollToStage(page, root, "stage-flows");
    await expect(scene.locator("[data-target='pane-flows']")).toHaveAttribute(
      "data-active",
      "",
    );

    await scrollToStage(page, root, "stage-todos");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos-ambient");
    await expect(scene.locator("[data-target='pane-todos']")).toHaveAttribute(
      "data-active",
      "",
    );
  });

  test("governs ambient with the shared pause control and visibility reason", async ({
    page,
  }) => {
    await page.goto(`${fixture}?ambient=1`);
    const scene = sharedWindow(page);
    const root = controller(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    const pause = scene.getByRole("button", { name: "Pause animation" });
    await expect(pause).toBeVisible();
    await page.evaluate(() => {
      Object.assign(window, {
        __sceneFixturePauseControl: document.querySelector(
          "[data-scene-shared-window] [data-scene-playback-control]",
        ),
      });
    });
    await scrollToStage(page, root, "stage-todos");
    await pause.click();
    await expect(scene).toHaveAttribute("data-scene-player-state", "paused");

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
    await expect(scene).toHaveAttribute("data-scene-player-state", "paused");
    await scene.getByRole("button", { name: "Play animation" }).click();
    await expect(scene).toHaveAttribute("data-scene-player-state", "playing");
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as typeof window & {
              __sceneFixtureController: {
                getSceneState(id: string): object | null;
              };
            }
          ).__sceneFixtureController.getSceneState("stage-todos"),
        ),
      )
      .not.toBeNull();
    await pause.click();
    await page.evaluate(() => {
      const startedAt = performance.now();
      return new Promise<void>((resolve) => {
        const probe = (now: number): void => {
          if (now - startedAt >= 2200) resolve();
          else requestAnimationFrame(probe);
        };
        requestAnimationFrame(probe);
      });
    });
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __sceneFixtureController: {
                getActivePlayer(): { definition: { id: string } } | null;
              };
            }
          ).__sceneFixtureController.getActivePlayer()?.definition.id,
      ),
    ).toBe("stage-todos");
    await scene.getByRole("button", { name: "Play animation" }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos-ambient");
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __sceneFixturePauseControl: Element;
            }
          ).__sceneFixturePauseControl ===
          document.querySelector(
            "[data-scene-shared-window] [data-scene-playback-control]",
          ),
      ),
    ).toBe(true);
  });

  test("pauses the ambient hold while offscreen or displaced from the shared channel", async ({
    page,
  }) => {
    await page.goto(`${fixture}?ambient=1`);
    const root = controller(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await scrollToStage(page, root, "stage-todos");
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as typeof window & {
              __sceneFixtureController: {
                getSceneState(id: string): object | null;
              };
            }
          ).__sceneFixtureController.getSceneState("stage-todos"),
        ),
      )
      .not.toBeNull();

    const displaced = await page.evaluate(() => {
      const fixtureWindow = window as typeof window & {
        __sceneFixtureController: {
          getActivePlayer(): { definition: { id: string } } | null;
        };
        __sceneFixtureMorningController: {
          getActivePlayer(): object | null;
        };
        __sceneFixtureMotionChannel: {
          claim(player: object): void;
          release(player: object): void;
        };
      };
      const other =
        fixtureWindow.__sceneFixtureMorningController.getActivePlayer()!;
      fixtureWindow.__sceneFixtureMotionChannel.claim(other);
      const startedAt = performance.now();
      return new Promise<{ definition?: string }>((resolve) => {
        const probe = (now: number): void => {
          if (now - startedAt < 2200) {
            requestAnimationFrame(probe);
            return;
          }
          resolve({
            definition:
              fixtureWindow.__sceneFixtureController.getActivePlayer()
                ?.definition.id,
          });
          fixtureWindow.__sceneFixtureMotionChannel.release(other);
        };
        requestAnimationFrame(probe);
      });
    });
    expect(displaced.definition).toBe("stage-todos");

    const offscreen = await page.evaluate(() => {
      const fixtureWindow = window as typeof window & {
        __sceneFixtureController: {
          getActivePlayer(): { definition: { id: string } } | null;
        };
        __sceneFixtureMotionChannel: {
          isActive(player: object): boolean;
        };
      };
      const sceneRoot = document.querySelector<HTMLElement>(
        "[data-scene-controller]",
      )!;
      const host = fixtureWindow.__sceneFixtureController.getActivePlayer()!;
      sceneRoot.style.transform = "translateY(-10000px)";
      return new Promise<{ definition?: string }>((resolve) => {
        const waitUntilReleased = (): void => {
          if (fixtureWindow.__sceneFixtureMotionChannel.isActive(host)) {
            requestAnimationFrame(waitUntilReleased);
            return;
          }
          const startedAt = performance.now();
          const probeHold = (now: number): void => {
            if (now - startedAt < 2200) {
              requestAnimationFrame(probeHold);
              return;
            }
            resolve({
              definition:
                fixtureWindow.__sceneFixtureController.getActivePlayer()
                  ?.definition.id,
            });
          };
          requestAnimationFrame(probeHold);
        };
        requestAnimationFrame(waitUntilReleased);
      });
    });
    expect(offscreen.definition).toBe("stage-todos");
    await page.evaluate(() => {
      document.querySelector<HTMLElement>(
        "[data-scene-controller]",
      )!.style.transform = "";
    });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos-ambient");
  });

  test("sleeps the shared ticker offscreen and resumes at the preserved scene time", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    const scene = sharedWindow(page);
    await scrollToStage(page, root, "stage-todos");
    await expect(scene).toHaveAttribute("data-scene-player-state", "playing");

    await root.evaluate((element) => {
      element.style.transform = "translateY(-10000px)";
    });
    await expect(scene).toHaveAttribute("data-scene-player-state", "paused");
    const pausedAt = Number(await scene.getAttribute("data-scene-time"));
    await page.waitForTimeout(250);
    const sleepingFrames = await page.evaluate(async () => {
      const fixtureWindow = window as typeof window & {
        __sceneFixtureRafCallbacks: number;
      };
      const before = fixtureWindow.__sceneFixtureRafCallbacks;
      await new Promise((resolve) => setTimeout(resolve, 300));
      return fixtureWindow.__sceneFixtureRafCallbacks - before;
    });
    expect(sleepingFrames).toBeLessThanOrEqual(1);
    expect(Number(await scene.getAttribute("data-scene-time"))).toBe(pausedAt);

    await root.evaluate((element) => {
      element.style.transform = "";
    });
    await expect(scene).toHaveAttribute("data-scene-player-state", "playing");
    await expect
      .poll(async () => Number(await scene.getAttribute("data-scene-time")))
      .toBeGreaterThan(pausedAt + 100);
    await scrollToStage(page, root, "stage-flows");
  });

  test("sleeps the shared ticker while hidden and resumes when visible", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    const scene = sharedWindow(page);
    await scrollToStage(page, root, "stage-todos");
    await expect(scene).toHaveAttribute("data-scene-player-state", "playing");

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(scene).toHaveAttribute("data-scene-player-state", "paused");
    const pausedAt = Number(await scene.getAttribute("data-scene-time"));
    await page.waitForTimeout(250);
    const sleepingFrames = await page.evaluate(async () => {
      const fixtureWindow = window as typeof window & {
        __sceneFixtureRafCallbacks: number;
      };
      const before = fixtureWindow.__sceneFixtureRafCallbacks;
      await new Promise((resolve) => setTimeout(resolve, 300));
      return fixtureWindow.__sceneFixtureRafCallbacks - before;
    });
    expect(sleepingFrames).toBeLessThanOrEqual(1);
    expect(Number(await scene.getAttribute("data-scene-time"))).toBe(pausedAt);

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(scene).toHaveAttribute("data-scene-player-state", "playing");
    await expect
      .poll(async () => Number(await scene.getAttribute("data-scene-time")))
      .toBeGreaterThan(pausedAt + 100);
  });

  test("does not advance the ambient hold or instantiate ambient while hidden", async ({
    page,
  }) => {
    await page.goto(`${fixture}?ambient=1`);
    const root = controller(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await stage(page, "stage-todos").evaluate((element) =>
      element.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as typeof window & {
              __sceneFixtureController: {
                getSceneState(id: string): object | null;
              };
            }
          ).__sceneFixtureController.getSceneState("stage-todos"),
        ),
      )
      .not.toBeNull();

    const hiddenResult = await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
      const startedAt = performance.now();
      return new Promise<{ definition?: string; ambient?: string }>(
        (resolve) => {
          const probe = (now: number): void => {
            if (now - startedAt < 2200) {
              requestAnimationFrame(probe);
              return;
            }
            const fixtureController = (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController;
            resolve({
              definition: fixtureController.getActivePlayer()?.definition.id,
              ambient: document.querySelector<HTMLElement>(
                "[data-scene-controller]",
              )!.dataset.activeAmbientScene,
            });
          };
          requestAnimationFrame(probe);
        },
      );
    });
    expect(hiddenResult).toEqual({
      definition: "stage-todos",
      ambient: undefined,
    });

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos-ambient");
  });

  test("finishes the active ambient beat before a controller-owned swap and re-arms", async ({
    page,
  }) => {
    await page.goto(`${fixture}?ambient=1`);
    const root = controller(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await stage(page, "stage-todos").evaluate((element) =>
      element.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos-ambient");

    const handoff = await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixtureController: {
            getActivePlayer(): {
              currentTime: number;
              definition: { id: string };
              status: string;
              seek(milliseconds: number): void;
              swap(id: string): void;
            } | null;
          };
        }
      ).__sceneFixtureController.getActivePlayer()!;
      player.seek(100);
      let lastAmbientTime = player.currentTime;
      player.swap("stage-todos");
      return new Promise<{
        lastAmbientTime: number;
        definition: string;
        ambient?: string;
        time: number;
        status: string;
      }>((resolve) => {
        const probe = (): void => {
          if (player.definition.id === "stage-todos-ambient") {
            lastAmbientTime = Math.max(lastAmbientTime, player.currentTime);
            requestAnimationFrame(probe);
            return;
          }
          resolve({
            lastAmbientTime,
            definition: player.definition.id,
            ambient: document.querySelector<HTMLElement>(
              "[data-scene-controller]",
            )!.dataset.activeAmbientScene,
            time: player.currentTime,
            status: player.status,
          });
        };
        requestAnimationFrame(probe);
      });
    });
    expect(handoff).toMatchObject({
      definition: "stage-todos",
      ambient: undefined,
      time: 1000,
      status: "completed",
    });
    // The commit occurs on the first frame at/after 400ms. The probe observes
    // the preceding frame, so allow one 60Hz frame of sampling distance.
    expect(handoff.lastAmbientTime).toBeGreaterThanOrEqual(375);
    expect(handoff.lastAmbientTime).toBeLessThanOrEqual(405);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos-ambient");
  });

  test("cancels an ambient hold when scripted activation wins the channel", async ({
    page,
  }) => {
    await page.goto(`${fixture}?ambient=1`);
    const root = controller(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await scrollToStage(page, root, "stage-todos");
    await expect
      .poll(() =>
        page.evaluate(() =>
          (
            window as typeof window & {
              __sceneFixtureController: {
                getSceneState(id: string): object | null;
              };
            }
          ).__sceneFixtureController.getSceneState("stage-todos"),
        ),
      )
      .not.toBeNull();
    await scrollToStage(page, root, "stage-flows");
    await page.evaluate(() => {
      const startedAt = performance.now();
      return new Promise<void>((resolve) => {
        const probe = (now: number): void => {
          if (now - startedAt >= 2200) resolve();
          else requestAnimationFrame(probe);
        };
        requestAnimationFrame(probe);
      });
    });

    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __sceneFixtureController: {
                getActivePlayer(): { definition: { id: string } } | null;
              };
            }
          ).__sceneFixtureController.getActivePlayer()?.definition.id,
      ),
    ).toBe("stage-flows");
  });

  test("resets a swapped surface to its narrative definition on stage activation", async ({
    page,
  }) => {
    await page.goto(fixture + "?ambient=1");
    const root = controller(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await scrollToStage(page, root, "stage-todos");
    await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: {
            activate(id: string): void;
            getActivePlayer(): { swap(id: string): void } | null;
          };
        }
      ).__sceneFixtureController;
      fixtureController.getActivePlayer()?.swap("stage-todos-alternate");
      fixtureController.activate("stage-todos");
    });

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos");
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
  });

  test("preserves the active pane selection when swap restores its outgoing snapshot", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    await scrollToStage(page, root, "stage-todos");
    await expect(
      sharedWindow(page).locator("[data-target='pane-todos']"),
    ).toHaveAttribute("data-active", "");
    await page.evaluate(() => {
      (
        window as typeof window & {
          __sceneFixtureController: {
            getActivePlayer(): { swap(id: string): void } | null;
          };
        }
      ).__sceneFixtureController
        .getActivePlayer()
        ?.swap("stage-todos-alternate");
    });

    const scene = sharedWindow(page);
    await expect(scene.locator("[data-target='pane-todos']")).toHaveAttribute(
      "data-active",
      "",
    );
    await expect(scene.locator("[data-target='ribbon-todos']")).toHaveAttribute(
      "data-active",
      "",
    );
    await expect(
      scene.locator("[data-target='pane-chat']"),
    ).not.toHaveAttribute("data-active", "");
  });

  test("smooth-scrolls to a requested stage and suppresses intermediate activation", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);

    await page.evaluate(() => {
      (
        window as typeof window & {
          __sceneFixtureController: { navigateToStage(id: string): void };
        }
      ).__sceneFixtureController.navigateToStage("flows");
    });

    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    await expect(stage(page, "stage-org")).toHaveAttribute(
      "data-scene-resolve-count",
      "1",
    );
    await expect(stage(page, "stage-todos")).toHaveAttribute(
      "data-scene-resolve-count",
      "1",
    );
    await expect
      .poll(() =>
        page.evaluate(() => {
          const target = document.querySelector<HTMLElement>(
            "[data-scene-stage][data-scene-id='stage-flows']",
          )!;
          return Math.abs(
            target.getBoundingClientRect().top - window.innerHeight / 2,
          );
        }),
      )
      .toBeLessThan(3);
  });

  test("fires the single sunrise owner when navigation crosses its boundary", async ({
    page,
  }) => {
    await page.goto(fixture);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const lightTransitions = await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { navigateToStage(id: string): void };
        }
      ).__sceneFixtureController;
      let transitions = 0;
      const observer = new MutationObserver(() => {
        if (document.documentElement.dataset.theme === "light") transitions++;
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      fixtureController.navigateToStage("org");
      fixtureController.navigateToStage("flows");
      return new Promise<number>((resolve) => {
        const probe = (): void => {
          if (document.documentElement.dataset.theme !== "light") {
            requestAnimationFrame(probe);
            return;
          }
          document.dispatchEvent(new PointerEvent("pointerdown"));
          fixtureController.navigateToStage("flows");
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              observer.disconnect();
              resolve(transitions);
            }),
          );
        };
        requestAnimationFrame(probe);
      });
    });

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(lightTransitions).toBe(1);
  });

  test("coalesces rapid and in-flight navigation to the latest destination", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);

    await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { navigateToStage(id: string): void };
        }
      ).__sceneFixtureController;
      fixtureController.navigateToStage("org");
      fixtureController.navigateToStage("flows");
    });
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");

    await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { navigateToStage(id: string): void };
        }
      ).__sceneFixtureController;
      fixtureController.navigateToStage("chat");
      const replaceWhenMoving = (): void => {
        if (scrollY > 2) fixtureController.navigateToStage("todos");
        else requestAnimationFrame(replaceWhenMoving);
      };
      requestAnimationFrame(replaceWhenMoving);
    });
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
  });

  test("replaces rapid keyboard Todos navigation with Chat above the pinned range", async ({
    page,
  }) => {
    await page.goto(`${fixture}?heroDestination=1`);
    const root = controller(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await scrollToStage(page, root, "stage-org");
    await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { navigateToStage(id: string): void };
        }
      ).__sceneFixtureController;
      for (const pane of ["todos", "chat"] as const) {
        const button = document.createElement("button");
        button.textContent = `View ${pane}`;
        button.dataset.fixtureNav = pane;
        button.addEventListener("click", () =>
          fixtureController.navigateToStage(pane),
        );
        document.body.append(button);
      }
    });

    await page.locator("[data-fixture-nav='todos']").press("Enter");
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    await page.locator("[data-fixture-nav='chat']").press("Enter");

    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(3);
    await expect(root).not.toHaveAttribute("data-active-scene", "stage-todos");
    await expect(sharedWindow(page)).not.toHaveAttribute(
      "data-scene-player-state",
      "playing",
    );
  });

  test("does not rebuild the current stage and yields an in-flight jump to manual scroll", async ({
    page,
  }) => {
    await page.goto(fixture);
    const scene = sharedWindow(page);
    const initialActivations = await scene.getAttribute(
      "data-scene-activation-count",
    );

    await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { navigateToStage(id: string): void };
        }
      ).__sceneFixtureController;
      fixtureController.navigateToStage("chat");
    });
    await expect(scene).toHaveAttribute(
      "data-scene-activation-count",
      initialActivations ?? "",
    );

    const viewportTruth = await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { navigateToStage(id: string): void };
        }
      ).__sceneFixtureController;
      fixtureController.navigateToStage("flows");
      return new Promise<{ centered?: string; active?: string; y: number }>(
        (resolve) => {
          const cancelAfterCrossing = (): void => {
            const centered = Array.from(
              document.querySelectorAll<HTMLElement>("[data-scene-stage]"),
            ).find((candidate) => {
              const rect = candidate.getBoundingClientRect();
              return (
                rect.top <= innerHeight / 2 && rect.bottom >= innerHeight / 2
              );
            });
            if (centered?.dataset.sceneId === "stage-org") {
              dispatchEvent(new PointerEvent("pointerdown"));
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  const committed = Array.from(
                    document.querySelectorAll<HTMLElement>(
                      "[data-scene-stage]",
                    ),
                  ).find((candidate) => {
                    const rect = candidate.getBoundingClientRect();
                    return (
                      rect.top <= innerHeight / 2 &&
                      rect.bottom >= innerHeight / 2
                    );
                  });
                  resolve({
                    centered: committed?.dataset.sceneId,
                    active: document.querySelector<HTMLElement>(
                      "[data-scene-controller]",
                    )!.dataset.activeScene,
                    y: scrollY,
                  });
                }),
              );
            } else requestAnimationFrame(cancelAfterCrossing);
          };
          requestAnimationFrame(cancelAfterCrossing);
        },
      );
    });

    expect(viewportTruth).toMatchObject({
      centered: "stage-org",
      active: "stage-org",
    });
  });

  test("pins one shared window and activates stages in both scroll directions", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    const scene = sharedWindow(page);

    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await expect(root.locator(".pin-spacer")).toHaveCount(1);
    await expect(root).toHaveAttribute("data-active-scene", "stage-chat");
    await expect(scene).toHaveAttribute("data-scene-timeline-count", "1");
    await expect(
      root.locator("[data-scene-player-state='playing']"),
    ).toHaveCount(1);

    await center(stage(page, "stage-org"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-org");
    await expect(scene.locator("[data-target='ribbon-org']")).toHaveAttribute(
      "data-active",
      "",
    );
    await expect(scene.locator("[data-target='pane-org']")).toHaveAttribute(
      "data-active",
      "",
    );

    await center(stage(page, "stage-flows"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    await center(stage(page, "stage-chat"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-chat");
    await expect(scene.locator("[data-target='pane-chat']")).toHaveAttribute(
      "data-active",
      "",
    );
  });

  test("coalesces crossed stages and force-resolves every skipped semantic state", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    const scene = sharedWindow(page);
    const initialActivations = Number(
      await scene.getAttribute("data-scene-activation-count"),
    );

    await center(stage(page, "stage-flows"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    await expect(scene).toHaveAttribute(
      "data-scene-activation-count",
      String(initialActivations + 1),
    );
    await expect(stage(page, "stage-todos")).toHaveAttribute(
      "data-scene-checkpoint",
      "resolved",
    );
    await expect(stage(page, "stage-org")).toHaveAttribute(
      "data-scene-resolve-count",
      "1",
    );
    await expect(stage(page, "stage-todos")).toHaveAttribute(
      "data-scene-checkpoint",
      "resolved",
    );
    await expect
      .poll(() =>
        page.evaluate(() => {
          const controller = (
            window as typeof window & {
              __sceneFixtureController: {
                getSceneState(id: string): {
                  highlights?: Record<string, boolean>;
                } | null;
              };
            }
          ).__sceneFixtureController;
          return {
            org: controller.getSceneState("stage-org")?.highlights,
            todos: controller.getSceneState("stage-todos")?.highlights,
          };
        }),
      )
      .toEqual({
        org: { "ribbon-org": true, "pane-org": true },
        todos: { "ribbon-todos": true, "pane-todos": true },
      });

    await center(stage(page, "stage-chat"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-chat");
    await expect(scene).toHaveAttribute(
      "data-scene-activation-count",
      String(initialActivations + 2),
    );
    await expect(stage(page, "stage-org")).toHaveAttribute(
      "data-scene-resolve-count",
      "2",
    );
    await expect(stage(page, "stage-todos")).toHaveAttribute(
      "data-scene-resolve-count",
      "2",
    );
  });

  test("materializes a force-resolved skipped stage when it is later entered", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    await center(stage(page, "stage-flows"));
    await expect(stage(page, "stage-org")).toHaveAttribute(
      "data-scene-checkpoint",
      "resolved",
    );

    const activation = await page.evaluate(() => {
      const controller = (
        window as typeof window & {
          __sceneFixtureController: { activate(id: string): void };
        }
      ).__sceneFixtureController;
      controller.activate("stage-todos");
      const scene = document.querySelector<HTMLElement>(
        "[data-scene-shared-window]",
      )!;
      return {
        state: scene.dataset.scenePlayerState,
        time: scene.dataset.sceneTime,
        paneActive: scene
          .querySelector<HTMLElement>("[data-target='pane-todos']")!
          .hasAttribute("data-active"),
      };
    });

    expect(activation).toEqual({
      state: "completed",
      time: "1000",
      paneActive: true,
    });
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
  });

  test("rebuilds breakpoint bindings without duplicating timelines or losing the active scene", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);

    await center(stage(page, "stage-todos"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
    const desktopWindow = sharedWindow(page);
    await expect(desktopWindow).toHaveAttribute(
      "data-scene-checkpoint",
      "resolved",
    );
    const desktopActivationCount = await desktopWindow.getAttribute(
      "data-scene-activation-count",
    );
    const firstGeneration = Number(
      await root.getAttribute("data-scene-binding-generation"),
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(root).toHaveAttribute("data-scene-controller-mode", "mobile");
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
    await expect(root.locator(".pin-spacer")).toHaveCount(0);
    await expect(root.locator("[data-scene-timeline-count='1']")).toHaveCount(
      2,
    );
    await expect(
      root.locator("[data-scene-player-state='playing']"),
    ).toHaveCount(0);
    await expect(
      stage(page, "stage-todos").locator("[data-scene-mobile-window]"),
    ).toHaveAttribute("data-scene-player-state", "completed");

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
    await expect(root.locator("[data-scene-timeline-count='1']")).toHaveCount(
      2,
    );
    await expect(desktopWindow).toHaveAttribute(
      "data-scene-activation-count",
      desktopActivationCount ?? "",
    );
    await expect(desktopWindow).toHaveAttribute(
      "data-scene-checkpoint",
      "resolved",
    );
    await expect(
      root.locator("[data-scene-player-state='playing']"),
    ).toHaveCount(0);
    await expect(desktopWindow).toHaveAttribute(
      "data-scene-player-state",
      "completed",
    );
    await expect
      .poll(async () =>
        Number(await root.getAttribute("data-scene-binding-generation")),
      )
      .toBeGreaterThan(firstGeneration + 1);
  });
});

test.describe("SceneController mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps one player per root across five selected-loop leave and re-entry cycles", async ({
    page,
  }) => {
    await page.goto(fixture);
    const todosStage = stage(page, "stage-todos");
    const todosWindow = todosStage.locator("[data-scene-mobile-window]");
    await center(todosStage);

    for (let cycle = 0; cycle < 5; cycle += 1) {
      await page.evaluate(() => {
        const controller = (
          window as typeof window & {
            __sceneFixtureController: {
              getActivePlayer(): {
                definition: { id: string };
                seek(milliseconds: number): void;
                swap(id: string): void;
              } | null;
            };
          }
        ).__sceneFixtureController;
        controller.getActivePlayer()!.swap("stage-todos-selected-loop");
        controller.getActivePlayer()!.seek(2467);
      });
      await center(stage(page, "stage-flows"));
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (
                window as typeof window & {
                  __sceneFixtureController: {
                    getActivePlayer(): { definition: { id: string } } | null;
                  };
                }
              ).__sceneFixtureController.getActivePlayer()?.definition.id,
          ),
        )
        .toBe("stage-flows");
      await center(todosStage);
      await expect(todosWindow).toHaveAttribute(
        "data-scene-root-player-count",
        "1",
      );
      await expect(todosWindow).toHaveAttribute(
        "data-scene-timeline-count",
        "1",
      );
      await expect(
        todosWindow.locator("[data-scene-playback-control]"),
      ).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (
                window as typeof window & {
                  __sceneFixtureController: {
                    getActivePlayer(): { definition: { id: string } } | null;
                  };
                }
              ).__sceneFixtureController.getActivePlayer()?.definition.id,
          ),
        )
        .toBe("stage-todos");
    }
  });

  test("schedules ambient in the active mobile pane and yields when it leaves", async ({
    page,
  }) => {
    await page.goto(fixture + "?ambient=1");
    const root = controller(page);
    await expect(root).toHaveAttribute("data-scene-controller-mode", "mobile");
    await center(stage(page, "stage-todos"));
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-todos-ambient");

    await center(stage(page, "stage-flows"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __sceneFixtureController: {
                  getActivePlayer(): { definition: { id: string } } | null;
                };
              }
            ).__sceneFixtureController.getActivePlayer()?.definition.id,
        ),
      )
      .toBe("stage-flows");
  });

  test("treats pointer stage navigation as a no-op below 900px", async ({
    page,
  }) => {
    await page.goto(fixture);
    const before = await page.evaluate(() => ({
      y: scrollY,
      active: document.querySelector<HTMLElement>("[data-scene-controller]")!
        .dataset.activeScene,
    }));

    await page.evaluate(() => {
      (
        window as typeof window & {
          __sceneFixtureController: { navigateToStage(id: string): void };
        }
      ).__sceneFixtureController.navigateToStage("flows");
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );

    expect(
      await page.evaluate(() => ({
        y: scrollY,
        active: document.querySelector<HTMLElement>("[data-scene-controller]")!
          .dataset.activeScene,
      })),
    ).toEqual(before);
  });

  test("keeps windows in normal flow, scopes duplicate targets, and activates each once", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);

    await expect(root).toHaveAttribute("data-scene-controller-mode", "mobile");
    await expect(root.locator(".pin-spacer")).toHaveCount(0);

    const orgStage = stage(page, "stage-org");
    const orgWindow = orgStage.locator("[data-scene-mobile-window]");
    await center(orgStage);
    await expect(root).toHaveAttribute("data-active-scene", "stage-org");
    await expect(orgWindow).toHaveAttribute("data-scene-activation-count", "1");
    await expect(orgWindow.locator("[data-target='pane-org']")).toHaveCount(1);
    await expect(orgWindow.locator("[data-target='pane-org']")).toHaveAttribute(
      "data-active",
      "",
    );
    expect(
      await root.locator("[data-target='pane-org']").count(),
    ).toBeGreaterThan(1);
    await expect(
      root.locator("[data-scene-player-state='playing']"),
    ).toHaveCount(1);

    await center(stage(page, "stage-flows"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    await center(orgStage);
    await expect(root).toHaveAttribute("data-active-scene", "stage-org");
    await expect(orgWindow).toHaveAttribute("data-scene-activation-count", "1");
    await expect(
      root.locator("[data-scene-player-state='playing']"),
    ).toHaveCount(1);
  });

  test("honors restart-on-enter while play retains a completed scene", async ({
    page,
  }) => {
    await page.goto(fixture);
    const orgStage = stage(page, "stage-org");
    const orgWindow = orgStage.locator("[data-scene-mobile-window]");
    const flowsStage = stage(page, "stage-flows");
    const flowsWindow = flowsStage.locator("[data-scene-mobile-window]");

    await center(orgStage);
    await expect(orgWindow).toHaveAttribute(
      "data-scene-player-state",
      "completed",
    );
    await center(flowsStage);
    await expect(flowsWindow).toHaveAttribute(
      "data-scene-player-state",
      "completed",
    );

    await center(orgStage);
    await expect(orgWindow).toHaveAttribute(
      "data-scene-player-state",
      "playing",
    );
    expect(
      Number(await orgWindow.getAttribute("data-scene-time")),
    ).toBeLessThan(500);

    await center(flowsStage);
    await expect(flowsWindow).toHaveAttribute(
      "data-scene-player-state",
      "completed",
    );
    await expect(flowsWindow).toHaveAttribute("data-scene-time", "1000");
  });

  test("records retained completion across mobile-root yields and both breakpoint recreations", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    const todosStage = stage(page, "stage-todos");
    const todosWindow = todosStage.locator("[data-scene-mobile-window]");

    await center(todosStage);
    await expect(todosWindow).toHaveAttribute(
      "data-scene-player-state",
      "completed",
    );
    await center(stage(page, "stage-flows"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const fixtureController = (
            window as typeof window & {
              __sceneFixtureController: {
                getSceneState(id: string): {
                  highlights?: Record<string, boolean>;
                } | null;
              };
            }
          ).__sceneFixtureController;
          return fixtureController.getSceneState("stage-todos")?.highlights;
        }),
      )
      .toEqual({ "ribbon-todos": true, "pane-todos": true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    const desktopReentry = await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { activate(id: string): void };
        }
      ).__sceneFixtureController;
      fixtureController.activate("stage-todos");
      const scene = document.querySelector<HTMLElement>(
        "[data-scene-shared-window]",
      )!;
      return {
        state: scene.dataset.scenePlayerState,
        time: scene.dataset.sceneTime,
      };
    });
    expect(desktopReentry).toEqual({ state: "completed", time: "1000" });

    await page.reload();
    await expect(root).toHaveAttribute("data-scene-controller-mode", "desktop");
    await center(stage(page, "stage-todos"));
    await expect(sharedWindow(page)).toHaveAttribute(
      "data-scene-player-state",
      "completed",
    );
    await center(stage(page, "stage-flows"));
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(root).toHaveAttribute("data-scene-controller-mode", "mobile");
    await expect(root).toHaveAttribute("data-active-scene", "stage-flows");
    const mobileReentry = await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { activate(id: string): void };
        }
      ).__sceneFixtureController;
      fixtureController.activate("stage-todos");
      const scene = document.querySelector<HTMLElement>(
        "[data-scene-id='stage-todos'] [data-scene-mobile-window]",
      )!;
      return {
        state: scene.dataset.scenePlayerState,
        time: scene.dataset.sceneTime,
      };
    });
    expect(mobileReentry).toEqual({ state: "completed", time: "1000" });

    await page.evaluate(() => {
      const fixtureController = (
        window as typeof window & {
          __sceneFixtureController: { activate(id: string): void };
        }
      ).__sceneFixtureController;
      fixtureController.activate("stage-flows");
      fixtureController.activate("stage-todos");
    });
    await expect(root).toHaveAttribute("data-active-scene", "stage-todos");
    await expect(todosWindow).toHaveAttribute(
      "data-scene-player-state",
      "completed",
    );
    await expect(todosWindow).toHaveAttribute("data-scene-time", "1000");
  });

  test("selects one owner when adjacent mobile stages overlap", async ({
    page,
  }) => {
    await page.goto(fixture);
    const root = controller(page);
    const org = stage(page, "stage-org");
    const todos = stage(page, "stage-todos");
    await page.evaluate(() => {
      for (const stage of document.querySelectorAll<HTMLElement>(
        "[data-scene-stage]",
      )) {
        stage.style.minHeight = "60vh";
      }
    });
    await todos.evaluate((node) =>
      node.scrollIntoView({ block: "start", behavior: "instant" }),
    );

    await expect(root).toHaveAttribute(
      "data-active-scene",
      /stage-(org|todos)/u,
    );
    await expect(
      root.locator("[data-scene-player-state='playing']"),
    ).toHaveCount(1);
    await expect(org.locator("[data-scene-mobile-window]")).toHaveCount(1);
    await expect(todos.locator("[data-scene-mobile-window]")).toHaveCount(1);
  });
});

test.describe("SceneController reduced motion", () => {
  test("instantiates no timelines, pinning, or ScrollTrigger state", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${fixture}?ambient=1`);
    const root = controller(page);

    await expect(root).toHaveAttribute("data-scene-controller-mode", "reduced");
    await expect(root.locator(".pin-spacer")).toHaveCount(0);
    await expect(root.locator("[data-scene-timeline-count='1']")).toHaveCount(
      0,
    );
    await expect(root).toHaveAttribute("data-scene-scroll-trigger-count", "0");
    await expect(root.locator("[data-scene-playback-control]")).toHaveCount(0);
    const reducedSwap = await page.evaluate(() => {
      const player = (
        window as typeof window & {
          __sceneFixtureController: {
            getActivePlayer(): {
              definition: { id: string };
              swap(id: string): void;
            } | null;
          };
        }
      ).__sceneFixtureController.getActivePlayer();
      player?.swap("stage-todos-alternate");
      return {
        hadPlayer: Boolean(player),
        definition: player?.definition.id,
        text: document.querySelector<HTMLElement>(
          "[data-scene-shared-window] [data-target='todos-mode']",
        )?.textContent,
      };
    });
    expect(reducedSwap).toEqual({
      hadPlayer: true,
      definition: "stage-todos-alternate",
      text: "Alternate resolved",
    });
    await expect(root.locator("[data-scene-timeline-count='1']")).toHaveCount(
      0,
    );
  });

  test("swaps exact resolved DOM in the visible stage-local window", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(fixture);
    const root = controller(page);
    const localWindow = stage(page, "stage-todos").locator(
      "[data-scene-mobile-window]",
    );
    const result = await page.evaluate(() => {
      const windowRoot = document.querySelector<HTMLElement>(
        "[data-scene-stage][data-scene-id='stage-todos'] [data-scene-mobile-window]",
      )!;
      const localPlayer = (
        window as typeof window & {
          __sceneFixtureController: {
            getPlayerForRoot(root: HTMLElement): {
              definition: { id: string };
              swap(id: string): void;
            } | null;
          };
        }
      ).__sceneFixtureController.getPlayerForRoot(windowRoot);
      localPlayer?.swap("stage-todos-alternate");
      return {
        hadPlayer: Boolean(localPlayer),
        definition: localPlayer?.definition.id,
      };
    });

    expect(result).toEqual({
      hadPlayer: true,
      definition: "stage-todos-alternate",
    });
    await expect(localWindow.locator("[data-target='todos-mode']")).toHaveText(
      "Alternate resolved",
    );
    await expect(localWindow).toHaveAttribute(
      "data-scene-player-state",
      "static",
    );
    await expect(localWindow).toHaveAttribute("data-scene-timeline-count", "0");
    await expect(
      localWindow.locator("[data-scene-playback-control]"),
    ).toHaveCount(0);
    await expect(
      sharedWindow(page).locator("[data-target='todos-mode']"),
    ).toHaveText("Primary");
    await expect(root.locator("[data-scene-timeline-count='1']")).toHaveCount(
      0,
    );
  });
});

test("does not ship the development debug overlay in production", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-scene-debug]")).toHaveCount(0);
});

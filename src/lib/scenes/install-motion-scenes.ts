export interface DestroyableSceneController {
  destroy(): void;
}

export interface InstallMotionScenesOptions<
  TController extends DestroyableSceneController,
> {
  load(): Promise<() => Promise<TController[]>>;
  ready?(controllers: readonly TController[]): void;
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Leaves the resolved server-rendered scenes untouched when motion is reduced,
 * and loads the GSAP-backed runtime only after motion is explicitly allowed.
 */
export function installMotionScenes<
  TController extends DestroyableSceneController,
>(options: InstallMotionScenesOptions<TController>): () => void {
  const root = document.documentElement;
  const reduced = matchMedia(REDUCED_QUERY);
  let controllers: TController[] = [];
  let generation = 0;
  let disposed = false;

  const destroyControllers = (): void => {
    for (const controller of controllers) controller.destroy();
    controllers = [];
  };

  const install = async (installGeneration: number): Promise<void> => {
    try {
      const createControllers = await options.load();
      if (disposed || reduced.matches || installGeneration !== generation)
        return;

      const installed = await createControllers();
      if (disposed || reduced.matches || installGeneration !== generation) {
        for (const controller of installed) controller.destroy();
        return;
      }

      controllers = installed;
      root.dataset.sceneRuntime = "motion";
      options.ready?.(controllers);
    } catch {
      if (disposed || reduced.matches || installGeneration !== generation)
        return;
      root.dataset.sceneRuntime = "static";
    }
  };

  const sync = (): void => {
    generation += 1;
    destroyControllers();

    if (reduced.matches) {
      root.dataset.motion = "reduce";
      root.dataset.sceneRuntime = "reduced";
      return;
    }

    root.dataset.motion = "ok";
    root.dataset.sceneRuntime = "loading";
    void install(generation);
  };

  reduced.addEventListener("change", sync);
  sync();

  return () => {
    if (disposed) return;
    disposed = true;
    generation += 1;
    reduced.removeEventListener("change", sync);
    destroyControllers();
    delete root.dataset.sceneRuntime;
  };
}

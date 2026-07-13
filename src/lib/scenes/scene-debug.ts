import type { SceneController } from "./scene-controller";

import "../../styles/scene-debug.css";

export function mountSceneDebugOverlay(
  controller: SceneController,
): () => void {
  const overlay = document.createElement("aside");
  overlay.className = "scene-debug";
  overlay.dataset.sceneDebug = "";
  overlay.setAttribute("aria-label", "Scene debug controls");
  overlay.innerHTML = `
    <output data-scene-debug-time>0ms</output>
    <output data-scene-debug-checkpoint>initial</output>
    <button type="button" data-scene-debug-toggle>Pause</button>
    <button type="button" data-scene-debug-restart>Restart</button>
    <input data-scene-debug-scrubber type="range" min="0" max="6000" step="10" value="0" aria-label="Scene time" />
  `;
  document.body.append(overlay);

  const time = overlay.querySelector<HTMLOutputElement>(
    "[data-scene-debug-time]",
  )!;
  const checkpoint = overlay.querySelector<HTMLOutputElement>(
    "[data-scene-debug-checkpoint]",
  )!;
  const toggle = overlay.querySelector<HTMLButtonElement>(
    "[data-scene-debug-toggle]",
  )!;
  const restart = overlay.querySelector<HTMLButtonElement>(
    "[data-scene-debug-restart]",
  )!;
  const scrubber = overlay.querySelector<HTMLInputElement>(
    "[data-scene-debug-scrubber]",
  )!;
  let frame = 0;

  const render = (): void => {
    const player = controller.getActivePlayer();
    if (player) {
      const currentTime = player.currentTime;
      time.value = `${currentTime}ms`;
      checkpoint.value = player.currentCheckpoint;
      toggle.textContent = player.isPlaying ? "Pause" : "Play";
      scrubber.value = String(currentTime);
      const resolved = player.definition.checkpoints.find(
        ({ name }) => name === "resolved",
      );
      scrubber.max = String(resolved?.at ?? 6000);
    }
    frame = requestAnimationFrame(render);
  };

  toggle.addEventListener("click", () => {
    const player = controller.getActivePlayer();
    if (!player) return;
    if (player.isPlaying) player.pause();
    else if (player.isCompleted) player.restart();
    else player.resume();
  });
  restart.addEventListener("click", () =>
    controller.getActivePlayer()?.restart(),
  );
  scrubber.addEventListener("input", () =>
    controller.getActivePlayer()?.seek(Number(scrubber.value)),
  );
  frame = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frame);
    overlay.remove();
  };
}

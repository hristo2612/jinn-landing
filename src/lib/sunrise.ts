/**
 * The sunrise position rule - SUNRISE MONOTONICITY.
 *
 * One page-level, one-way transition rule owns when the site turns to
 * morning (STORYBOARD §2/§7, a12 review finding 1). Scroll position is the
 * single source of truth:
 *
 * - **Narrative entry:** the morning window held on stage for one
 *   CONTINUOUS 350ms dwell fires the sunrise. Leaving before the dwell
 *   completes resets it - peeks never bank.
 * - **Passed by any route** (same-page anchor click, fast scroll, deep
 *   link, scroll restoration, bfcache return): the Morning section
 *   entirely above the viewport fires the sunrise immediately - the page
 *   is light everywhere at or below the boundary. (Fresh loads at
 *   `/#install` are already resolved pre-paint by the daylight scope's
 *   inline script; this module then observes the light theme and treats
 *   the sunrise as fired.)
 * - **One-way, once per visit:** after firing, every listener is removed;
 *   only a full load re-arms it. The theme sweep itself is the existing
 *   900ms page-level cross-tween.
 *
 * The morning scene's playback is gated on the same rule through the
 * player's public composable pause-reason API (`api`): until the sunrise
 * fires, the timeline cannot advance, so run #142's approval can never
 * commit from a peek that didn't genuinely activate the scene. After the
 * fire, the player's own offscreen/visibility/controller reasons govern
 * playback as usual. No scene-system machinery is involved.
 */
import { transitionTheme } from "./theme-transition";
interface SunriseController {
  readonly root: HTMLElement;
  getActivePlayer(): {
    pause(reason: "api"): void;
    resume(reason: "api"): void;
  } | null;
}

const DWELL_MS = 350;
const MORNING_ID = "morning-approval";

export function installSunrise(
  controllers: readonly SunriseController[],
): void {
  const root = document.documentElement;
  if (root.dataset.motion !== "ok") return;

  const boundary = document.querySelector<HTMLElement>(
    "[data-sunrise-boundary]",
  );
  const stage = document.querySelector<HTMLElement>(
    `[data-scene-window][data-scene-id='${MORNING_ID}']`,
  );
  if (!boundary || !stage) return;

  const morningController = controllers.find(
    (controller) => controller.root === stage,
  );
  const getMorningPlayer = () => morningController?.getActivePlayer();

  let fired = root.dataset.theme === "light";
  let dwellTimer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;

  if (!fired) getMorningPlayer()?.pause("api");

  const onPageShow = (event: PageTransitionEvent): void => {
    if (event.persisted) evaluate();
  };

  const teardown = (): void => {
    removeEventListener("scroll", onViewportChange);
    removeEventListener("resize", onViewportChange);
    removeEventListener("hashchange", onViewportChange);
    removeEventListener("pageshow", onPageShow);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const fire = (): void => {
    if (fired) return;
    fired = true;
    clearTimeout(dwellTimer);
    dwellTimer = undefined;
    void transitionTheme("light");
    // Resolve the current owner at fire time so visibility changes cannot
    // leave the Morning scene gated after the one-way transition.
    getMorningPlayer()?.resume("api");
    teardown();
  };

  const evaluate = (): void => {
    if (fired) return;

    // Passed: the whole Morning section sits above the viewport - the
    // visitor is at or below the boundary, however they got there.
    if (boundary.getBoundingClientRect().bottom <= 0) {
      fire();
      return;
    }

    // On stage: the morning window meaningfully in view starts the
    // continuous dwell; leaving resets it (never banks).
    const viewportHeight = window.innerHeight;
    const rect = stage.getBoundingClientRect();
    const onStage =
      rect.top < viewportHeight * 0.85 && rect.bottom > viewportHeight * 0.15;
    if (onStage) {
      dwellTimer ??= setTimeout(fire, DWELL_MS);
    } else if (dwellTimer !== undefined) {
      clearTimeout(dwellTimer);
      dwellTimer = undefined;
    }
  };

  const onViewportChange = (): void => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      evaluate();
    });
  };

  if (fired) {
    // Pre-paint hash path: theme already resolved; nothing to gate.
    return;
  }

  addEventListener("scroll", onViewportChange, { passive: true });
  addEventListener("resize", onViewportChange, { passive: true });
  addEventListener("hashchange", onViewportChange);
  addEventListener("pageshow", onPageShow);
  // Covers load-time scroll restoration and anchored loads the pre-paint
  // script didn't recognize.
  evaluate();
}

export type SiteTheme = "dark" | "light";

const THEME_EVENT = "jinn:theme-change";
const THEME_DURATION_MS = 900;

let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
let activeCompletion:
  { promise: Promise<void>; resolve: () => void } | undefined;
let transitionGeneration = 0;

interface ThemeChangeDetail {
  theme: SiteTheme;
}

function isTheme(value: unknown): value is SiteTheme {
  return value === "dark" || value === "light";
}

export function setThemeImmediately(theme: SiteTheme): void {
  const root = document.documentElement;
  transitionGeneration += 1;
  clearTimeout(cleanupTimer);
  activeCompletion?.resolve();
  activeCompletion = undefined;
  delete root.dataset.themeTransition;
  delete root.dataset.themeTarget;
  root.dataset.theme = theme;
}

export async function transitionTheme(theme: SiteTheme): Promise<void> {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion) {
    setThemeImmediately(theme);
    return;
  }

  if (root.dataset.theme === theme) {
    return activeCompletion?.promise;
  }

  activeCompletion?.resolve();
  let resolveCompletion = () => {};
  const promise = new Promise<void>((resolve) => {
    resolveCompletion = resolve;
  });
  activeCompletion = { promise, resolve: resolveCompletion };

  const generation = ++transitionGeneration;
  const wasActive = root.dataset.themeTransition === "active";
  clearTimeout(cleanupTimer);
  root.dataset.themeTransition = "active";
  root.dataset.themeTarget = theme;

  if (!wasActive) {
    // Commit the transition contract before changing token values so the
    // browser has a before-change style to interpolate from.
    void root.offsetWidth;
  }
  root.dataset.theme = theme;

  cleanupTimer = setTimeout(() => {
    if (generation !== transitionGeneration) return;
    delete root.dataset.themeTransition;
    delete root.dataset.themeTarget;
    activeCompletion?.resolve();
    activeCompletion = undefined;
  }, THEME_DURATION_MS);

  return promise;
}

export function installThemeTransition(): void {
  document.addEventListener(THEME_EVENT, (event) => {
    const detail = (event as CustomEvent<ThemeChangeDetail>).detail;
    if (isTheme(detail?.theme)) void transitionTheme(detail.theme);
  });
}

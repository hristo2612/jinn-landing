export const desktopSceneCheckpoints = {
  delegation: ["initial", "sent", "delegated", "resolved"],
  employees: ["initial", "seated", "resolved"],
  todos: ["initial", "ledger", "completing", "resolved"],
  "workflow-approval": ["initial", "advancing", "parked", "resolved"],
  "trigger-fire": ["initial", "fired", "resolved"],
  "night-shift": ["initial", "feeding", "resolved"],
  "morning-approval": ["initial", "approved", "resolved"],
} as const;

export const visualGatePort = 4342;

export const mobileVisualStates = [
  { id: "hero", sceneId: "delegation", checkpoint: "resolved" },
  { id: "todos", sceneId: "todos", checkpoint: "resolved" },
  {
    id: "workflow-approval",
    sceneId: "workflow-approval",
    checkpoint: "parked",
  },
  {
    id: "morning-approval",
    sceneId: "morning-approval",
    checkpoint: "approved",
  },
  { id: "footer", sceneId: null, checkpoint: null },
] as const;

export const reducedMotionStates = [
  { id: "desktop-hero-resolved", viewport: "desktop", target: ".hero" },
  {
    id: "mobile-todos-resolved",
    viewport: "mobile",
    target: "[data-scene-id='todos']",
  },
] as const;

/**
 * Features-page QA checkpoint matrix (STORYBOARD-FEATURES §8). Each state is
 * a scene window seeked to its named moment, shot at both breakpoints on the
 * light page (the §05 window itself dark). Times are the storyboard's.
 */
export const featuresVisualStates = [
  { id: "engines-switched", sceneId: "engine-switch", at: 1400 },
  { id: "engines-resolved", sceneId: "engine-switch", at: 4400 },
  { id: "org-seated", sceneId: "org-hire", at: 2800 },
  { id: "org-resolved", sceneId: "org-hire", at: 3400 },
  { id: "todos-requested", sceneId: "todo-approval", at: 1400 },
  { id: "todos-needs-you", sceneId: "todo-approval", at: 2400 },
  { id: "todos-resolved", sceneId: "todo-approval", at: 3600 },
  { id: "flows-drawn", sceneId: "triage-run", at: 800 },
  { id: "flows-routed", sceneId: "triage-run", at: 3200 },
  { id: "flows-parked", sceneId: "triage-run", at: 4200 },
  { id: "triggers-rest", sceneId: "webhook-fire", at: 1200 },
  { id: "triggers-resolved", sceneId: "webhook-fire", at: 2800 },
  { id: "mcp-calling", sceneId: "mcp-hands", at: 1800 },
  { id: "mcp-resolved", sceneId: "mcp-hands", at: 4800 },
  { id: "slack-reacted", sceneId: "slack-approve", at: 1600 },
  { id: "slack-resolved", sceneId: "slack-approve", at: 2600 },
] as const;

export const featuresStaticShots = [
  { id: "statics-skills", target: "[data-static='skill']" },
  { id: "statics-tree", target: "[data-static='tree']" },
  { id: "nav-features-link", target: ".site-nav" },
] as const;

export const lighthouseBudgets = {
  performance: 0.9,
  accessibility: 0.95,
  bestPractices: 0.95,
  seo: 1,
  largestContentfulPaintMs: 2500,
  cumulativeLayoutShift: 0.05,
  totalBlockingTimeMs: 200,
} as const;

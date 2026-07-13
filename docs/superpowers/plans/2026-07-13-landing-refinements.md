# Landing Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Jinn landing page render one complete hero dashboard, four feature-focused windows, stable dark theming, immediate loop playback, exact model labels, and a Docs navigation entry without any em dash characters.

**Architecture:** Extend the existing `SceneWindow` with a focused presentation mode rather than creating a second scene runtime. Keep scene definitions and surfaces canonical, but remove the landing's separate sunrise owner and delayed page entrance so the first painted motion state is stable. Add regression coverage at the DOM, geometry, runtime, and built-output boundaries.

**Tech Stack:** Astro 7, TypeScript 5.9, GSAP 3, Vitest 4, Playwright 1.58, Ledger design tokens.

---

## File map

- `src/components/scenes/SceneWindow.astro`: full versus focused window chrome.
- `src/components/marketing/Hero.astro`: full-window geometry and stable load presentation.
- `src/components/marketing/ProductStories.astro`: opt four story windows into focused mode.
- `src/pages/index.astro`: stable dark landing and direct scene installation.
- `src/layouts/MarketingLayout.astro`: pre-paint scene-runtime marker and Docs-aware shared nav state.
- `src/components/chrome/SiteNav.astro`: shared Docs navigation link.
- `src/lib/scenes/dashboard.ts`: exact model labels shown in landing scene UI.
- `src/lib/scenes/features.ts`: exact model labels shown in feature scenes.
- `src/scenes/landing/*.scene.ts`: zero-delay loop start where needed.
- `src/**/*.astro|ts|md` and `public/*`: remove em dash characters from public source.
- `tests/e2e/landing-refinements.spec.ts`: new operator-feedback regression suite.
- Existing landing and theme tests: replace obsolete sunrise and delayed-entrance expectations.

### Task 1: Lock the operator feedback in RED tests

**Files:**

- Create: `tests/e2e/landing-refinements.spec.ts`
- Modify: `tests/unit/public-safety.test.ts`

- [ ] **Step 1: Add the failing browser contract**

```ts
test("renders the complete hero window and focused story windows", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const hero = page.locator(".hero [data-scene-window]");
  const heroBox = await hero.boundingBox();
  const heroSection = await page.locator(".hero").boundingBox();
  expect(heroBox!.y + heroBox!.height).toBeLessThanOrEqual(
    heroSection!.y + heroSection!.height + 1,
  );
  await expect(
    page.locator("[data-product-story] .scene-window__sidebar"),
  ).toHaveCount(0);
  await expect(
    page.locator("[data-product-story] .scene-window__ribbon"),
  ).toHaveCount(0);
});
```

- [ ] **Step 2: Add failing navigation, model, theme, and boot contracts**

```ts
test("keeps one dark theme and starts the hero scene without a second entrance", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Docs" })).toHaveAttribute(
    "href",
    "/docs/",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1200);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".hero [data-scene-window]")).toHaveAttribute(
    "data-scene-player-state",
    "playing",
  );
  expect(
    await page
      .locator(".hero__stage")
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
});
```

- [ ] **Step 3: Add a public-source em dash guard**

```ts
expect(publicTextFilesWithEmDash).toEqual([]);
```

- [ ] **Step 4: Run the focused tests and record the expected failures**

Run: `pnpm exec playwright test tests/e2e/landing-refinements.spec.ts && pnpm test -- tests/unit/public-safety.test.ts`

Expected: FAIL for clipped hero geometry, repeated story chrome, missing Docs, light theme at the bottom, delayed entrance, engine-only labels, and em dash characters.

### Task 2: Build full and focused scene windows

**Files:**

- Modify: `src/components/scenes/SceneWindow.astro`
- Modify: `src/components/marketing/ProductStories.astro`
- Modify: `src/components/marketing/Hero.astro`
- Test: `tests/e2e/landing-refinements.spec.ts`

- [ ] **Step 1: Add a focused prop to SceneWindow**

```ts
interface Props {
  activePane?: PaneKey;
  caption: string;
  sceneId?: string;
  chrome?: "full" | "focused";
}
```

Render ribbon and Sessions only for `chrome === "full"`, and set a `data-window-chrome` attribute for stable tests.

- [ ] **Step 2: Use focused mode for all four product stories**

```astro
<SceneWindow
  chrome="focused"
  caption={story.caption}
  activePane={story.pane}
  sceneId={story.id}
/>
```

- [ ] **Step 3: Make the hero section grow around the full dashboard**

Use `min-height: 100svh`, remove fixed-height clipping, and give the complete frame bottom breathing room. The hero must not crop the 628px frame at 1440x900 or 390x844.

- [ ] **Step 4: Run the focused geometry tests**

Run: `pnpm exec playwright test tests/e2e/landing-refinements.spec.ts -g "complete hero|focused story"`

Expected: PASS.

### Task 3: Stabilize first paint and immediate playback

**Files:**

- Modify: `src/layouts/MarketingLayout.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/components/marketing/Hero.astro`
- Modify: `src/scenes/landing/delegation.scene.ts`
- Modify: `src/lib/scenes/install-motion-scenes.ts` only if the direct import does not close the measured gap.
- Test: `tests/e2e/landing-refinements.spec.ts`
- Test: `tests/unit/install-motion-scenes.test.ts`

- [ ] **Step 1: Mark motion scene loading before first paint**

```js
document.documentElement.dataset.sceneRuntime =
  document.documentElement.dataset.motion === "ok" ? "loading" : "reduced";
```

- [ ] **Step 2: Remove delayed page-level hero entrance animations**

Delete the `hero-*` animation rules. The page shell renders settled while only the product scene animates.

- [ ] **Step 3: Install the landing scene system without a runtime dynamic import**

```ts
import { installSceneSystem } from "../lib/scenes/install-scene-system";
installMotionScenes({ load: async () => () => installSceneSystem() });
```

- [ ] **Step 4: Set the hero scene start delay to zero**

```ts
startDelayMs: 0,
```

- [ ] **Step 5: Verify first-paint stability and scene progress**

Run: `pnpm exec playwright test tests/e2e/landing-refinements.spec.ts -g "starts|first paint|second entrance"`

Expected: PASS with no hero-stage animation and scene time advancing promptly.

### Task 4: Keep the landing theme stable and add Docs navigation

**Files:**

- Modify: `src/pages/index.astro`
- Modify: `src/components/chrome/SiteNav.astro`
- Modify: `src/layouts/MarketingLayout.astro`
- Modify: obsolete sunrise assertions in `tests/e2e/theatre.spec.ts`
- Modify: navigation assertions in `tests/e2e/marketing-shell.spec.ts`

- [ ] **Step 1: Remove the light theme scope and sunrise installation**

Render the final landing sections directly under `.marketing-main`, do not import or install `installSunrise`, and keep `MorningApproval` as a dark-scene interaction.

- [ ] **Step 2: Make the morning scene stop owning the root theme**

Remove the theme beat from `morning-approval.scene.ts` and keep approval state animation intact.

- [ ] **Step 3: Add Docs to the shared nav**

```astro
<a class="site-nav__text-link site-nav__text-link--docs" href="/docs/">Docs</a>
```

Keep Docs reachable on mobile while preserving 44px targets.

- [ ] **Step 4: Replace sunrise tests with stable-theme coverage**

Assert dark theme at load, Morning, final CTA, hash navigation, reduced motion, and no JavaScript.

- [ ] **Step 5: Run focused navigation and theatre tests**

Run: `pnpm exec playwright test tests/e2e/landing-refinements.spec.ts tests/e2e/theatre.spec.ts tests/e2e/marketing-shell.spec.ts`

Expected: PASS.

### Task 5: Show concrete model names and remove every em dash

**Files:**

- Modify: `src/lib/scenes/dashboard.ts`
- Modify: `src/lib/scenes/features.ts`
- Modify: `tests/e2e/fixtures/features-deck.ts`
- Modify: all public `src` and `public` text files containing U+2014.
- Test: `tests/e2e/dashboard-surfaces.spec.ts`
- Test: `tests/e2e/features-page.spec.ts`
- Test: `tests/unit/public-safety.test.ts`

- [ ] **Step 1: Replace engine-only UI chips with concrete model labels**

Use current product labels such as `Fable 5`, `Opus 4.8`, `GPT-5.6 Sol`, `Gemini 3.5 Flash`, `Grok Code Fast 1`, and `Gemma 3 12B`. Preserve engine names only where prose is explicitly explaining engines.

- [ ] **Step 2: Update landing employee cards and chat pills**

```ts
meta: "· COO · Opus 4.8";
engine: "GPT-5.6 Sol";
```

- [ ] **Step 3: Replace all U+2014 characters in public source**

Use punctuation that preserves sentence meaning. The mechanical fallback is a standard hyphen only in comments or code samples, never an em dash.

- [ ] **Step 4: Run copy and public-safety tests**

Run: `pnpm test -- tests/unit/public-safety.test.ts && pnpm exec playwright test tests/e2e/dashboard-surfaces.spec.ts tests/e2e/features-page.spec.ts`

Expected: PASS with zero em dash findings and exact model labels.

### Task 6: Review, verify, and land

**Files:**

- Modify only files required by findings.

- [ ] **Step 1: Run formatting on touched files**

Run: `pnpm exec prettier --write <touched-files>`

- [ ] **Step 2: Run the full quality gate under Node 24.13.0**

Run: `pnpm check`

Expected: PASS.

- [ ] **Step 3: Run browser, visual, and performance gates**

Run: `pnpm test:e2e && pnpm test:visual && pnpm test:lighthouse`

Expected: PASS without unrelated baseline churn.

- [ ] **Step 4: Request an independent Codex review**

Reviewer checks the eight operator requirements, mobile/desktop geometry, reduced motion, no JavaScript, public copy, and exact diff scope. No Fable session is used.

- [ ] **Step 5: Commit exact scope, merge to local main, and refresh protected preview**

Stage explicit files only, preserve the six untracked variant scripts, merge after review, then update the protected preview and confirm the Tailscale URL.

## Self-review

- Spec coverage: all eight operator requirements map to Tasks 1 through 5.
- Scope: only `jinn-landing` changes. The Jinn product repository is read-only evidence.
- Model routing: no Fable employee session is used; implementation and review use Codex.
- Placeholder scan: no TBD, TODO, or unspecified implementation steps remain.

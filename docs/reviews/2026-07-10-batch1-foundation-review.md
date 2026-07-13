# Phase A batch 1 foundation review

- **Reviewed commits:** `b7efcfa`, `d87c5d4`, `fd03c9d`
- **Scope:** A-01 scaffold, A-02 fonts and tokens, A-03 marketing shell
- **Contract:** `PLAN.md`, `docs/TECH-PLAN.md`, and `docs/STORYBOARD.md`
- **Verdict:** **BLOCK**

The foundation gets the static architecture, current token snapshot, typography assets, dark-first shell, and core navigation right. It is not safe to build A-05+ on yet because one required browser gate is broken, several named QA gates can pass without testing anything, and the current theme switch produces an incoherent and temporarily illegible sunrise.

## Required remediation, in order

1. Restore trustworthy gates: make the public E2E command run only Playwright tests, make link checking crawl real built routes, and make visual/Lighthouse commands fail until they execute real assertions.
2. Establish one authoritative theme-transition mechanism whose complete dark-to-light state changes over the storyboard's single 900 ms sweep.
3. Make token extraction assert the entire fixed contract, not merely symmetry among whatever keys happen to remain.
4. Make the built `/agents.md` response satisfy the promised MIME contract and test the production artifact.
5. Add the public-safety guard before scene fixtures and product copy expand the repository's leak surface.

## Findings

### 1. Required E2E command crashes before browser tests run

- **Severity:** HIGH
- **Location:** `playwright.config.ts:4`, `tests/unit/ledger-tokens.test.ts:1`, `package.json:18`

**Evidence:** `playwright.config.ts` sets `testDir: "./tests"`. Playwright's default discovery therefore includes the Vitest unit file `tests/unit/ledger-tokens.test.ts`. Running `pnpm test:e2e` consistently aborts with `Cannot redefine property: Symbol($$jest-matchers-object)` when the Vitest matcher package is loaded into the Playwright process. Running only `tests/e2e/marketing-shell.spec.ts` passes all five browser tests, isolating discovery—not the shell tests or environment—as the failure.

**Required remediation/invariant:** `pnpm test:e2e` must discover only E2E/Playwright specs and must execute at least one test. Unit, E2E, visual, and Lighthouse suites must have non-overlapping discovery roots or explicit match patterns. Remove the permissive no-test escape from this release gate.

### 2. The internal-link gate is a green no-op

- **Severity:** HIGH
- **Location:** `package.json:20`, `package.json:24`

**Evidence:** `pnpm check` completes successfully, but its final `test:links` stage reports `Successfully scanned 0 links`. Passing `dist` as the crawl target does not produce a crawl, and the skip expression `^(https?://)` also excludes normalized HTTP URLs—including the preview root if the command is pointed at a server. A control run against the production preview without that skip found the HTML, local CSS/JS/font assets, the root link, and the repository link.

**Required remediation/invariant:** `pnpm test:links` must start from the served production root or another Linkinator-supported seed, scan a non-zero number of URLs, recurse through internal routes/assets, and apply external-host policy without skipping the crawl seed. `pnpm check` must fail if link discovery is zero or any required internal URL fails.

### 3. Visual and Lighthouse commands claim gates while executing zero tests

- **Severity:** HIGH
- **Location:** `package.json:19`, `package.json:21`, `vitest.config.ts:4-6`

**Evidence:** `pnpm test:visual` exits successfully with no visual tests. `pnpm test:lighthouse` reports `No test files found, exiting with code 0`; Vitest is configured to include only `tests/unit/**/*.test.ts`, so the explicit Lighthouse path cannot match even if a file is later added without changing configuration. No Lighthouse package/configuration implements the budgets in TECH-PLAN section 6.

**Required remediation/invariant:** A named QA command may not report success unless its intended tool ran real assertions. Until baselines and Lighthouse are intentionally introduced, the commands should fail clearly or be absent from the claimed gate table; before Phase A completion they must enforce the documented screenshot matrix and performance budgets without `--pass-with-no-tests`/`--passWithNoTests`.

### 4. The dark-to-light sunrise is temporally inconsistent

- **Severity:** HIGH
- **Location:** `src/styles/global.css:29-38`, `src/components/chrome/SiteNav.astro:37-39`, `src/components/chrome/SiteNav.astro:60-67`, `src/components/chrome/SiteNav.astro:73-84`

**Evidence:** The page and nav surfaces transition color/background over 900 ms, nav links use 180 ms, and the brand text, brand mark, nav shadow, and backdrop have no matching theme transition. In Chromium, 50 ms after changing the root from dark to light, the brand text had already changed to the light theme's dark ink while the nav and page were still near their dark starting surfaces; the wordmark was almost invisible. The mark and shadow switched immediately, the Install fill completed in roughly 180 ms, and the main surfaces continued for 900 ms.

The server-rendered `data-theme="dark"` is a good dark-first default and prevents initial theme FOUC. The failure is specifically the approved sunrise choreography.

**Required remediation/invariant:** One mechanism must own the complete page-wide transition. Every visible theme-dependent property—including text, fills, shadows/materials, accent surfaces, and fixed navigation—must progress coherently for the same 900 ms interval, remain contrast-safe at intermediate frames, reverse cleanly, and honor reduced motion. Add a browser assertion at an intermediate checkpoint, not only dark and light endpoints.

### 5. Token validation permits symmetric deletion of the contract

- **Severity:** MEDIUM
- **Location:** `scripts/sync-ledger-tokens.ts:123-160`, `scripts/sync-ledger-tokens.ts:189-200`, `tests/unit/ledger-tokens.test.ts:34-54`

**Evidence:** The extractor filters declarations through fixed allow-lists, but validation compares only the key sets that were found. A source containing only `--bg` in both theme blocks returns successfully with empty independent tokens and one symmetric theme token. The unit fixture intentionally expects a small subset rather than proving that every allow-listed key is mandatory.

The checked-in snapshot itself is good: all current categories needed by the storyboard are present—materials, fills, four text tiers, accent/status colors, radii, shadows, easings, and pill/code/chrome tokens—and dark/light keys are currently symmetric.

**Required remediation/invariant:** Extraction must fail when any fixed independent token or any fixed theme token is absent, even if it is absent from both themes. Tests must cover missing-independent, missing-dark, missing-light, extra/disallowed, duplicate/ambiguous theme-block, deterministic-render, and idempotent-write behavior.

### 6. `/agents.md` does not preserve its promised production MIME type

- **Severity:** MEDIUM
- **Location:** `src/pages/agents.md.ts:3-8`, `tests/e2e/marketing-shell.spec.ts:17-93`

**Evidence:** Source code returns `text/plain; charset=utf-8`, but `astro preview` serves the generated `/agents.md` file as `text/markdown` without the promised charset. `/llms.txt` is served as `text/plain`. No browser test covers either machine route's status, content type, body shape, or absence of HTML wrappers.

**Required remediation/invariant:** The actual production-host artifact—not only the endpoint source—must return `/agents.md` and `/llms.txt` as `text/plain; charset=utf-8`, with status 200 and no HTML wrapper. If static hosting needs an explicit headers file/configuration, check it in and exercise it with the same preview mechanism used by CI/deployment.

### 7. The required public-safety guard is absent

- **Severity:** MEDIUM
- **Location:** `package.json:11-24`; planned `scripts/check-public-safety.ts` is absent

**Evidence:** TECH-PLAN sections 2 and 6 require a leak guard over source and generated output, but no script or package command implements it and `pnpm check` does not scan privacy-sensitive content. The manual full-tree grep for the specified personal/project identifiers was clean except for the explicitly sanctioned repository URL, and the generated token header uses a generic relative source path rather than an absolute home path.

**Required remediation/invariant:** A deterministic safety command must scan tracked source plus generated `dist/`, allow only narrowly documented exceptions, fail on personal identifiers, credentials, real IDs/emails, absolute home paths, and unapproved domains, and run from `pnpm check`/CI before commits containing scene fixtures or copy can pass.

### 8. The custom 404 is technically correct but functionally blank

- **Severity:** MEDIUM
- **Location:** `src/pages/404.astro:5-6`, `src/layouts/MarketingLayout.astro:12-14`

**Evidence:** Production preview correctly returns status 404 and the marketing shell, but the page contains an empty `<main>`, reuses the landing title/description, and provides no heading, explanation, or recovery link beyond the global nav. The E2E test proves status and shell presence only.

**Required remediation/invariant:** The 404 must have approved, generic copy, a descriptive title/metadata policy, one semantic `<h1>`, and an obvious route back to useful content while retaining a real 404 response. The copy deck should explicitly authorize these strings before implementation.

### 9. Machine content is not represented by the planned collection/schema

- **Severity:** LOW
- **Location:** `src/content.config.ts:1-7`

**Evidence:** Only the Starlight docs collection is declared. TECH-PLAN section 5 calls for a separate machine collection and an extended docs schema with `description`, `since`, `source`, `audience`, and `generated` metadata. Machine files currently work only because route modules import them as raw strings.

**Required remediation/invariant:** Before Phase C/release synchronization, declare the machine collection and extend the docs schema so generation and release tooling consume validated content rather than untyped raw files. This does not independently block A-05, but it is a contract gap in the claimed repository foundation.

### 10. Formatting coverage excludes repository documentation

- **Severity:** LOW
- **Location:** `package.json:16`, `.prettierignore:1`

**Evidence:** `pnpm lint` checks formatting under `src/`, `scripts/`, `tests/`, and selected root configuration extensions. It does not check `PLAN.md`, briefs, or `docs/**/*.md`, even though those documents are contract and public-content sources. Generated tokens are appropriately excluded from Prettier because they are script-owned.

**Required remediation/invariant:** The formatting gate should include all authored Markdown and other maintained project files while continuing to exclude generated/reference artifacts intentionally. A successful lint command must mean all authored source and public documentation is formatted.

### 11. E2E execution assumes a pre-existing production build

- **Severity:** LOW
- **Location:** `playwright.config.ts:20-24`, `package.json:18`

**Evidence:** Playwright starts `pnpm preview`, which serves `dist/`, but the public `test:e2e` command does not build first. It happened to reach the discovery failure in this review because `pnpm build` had already run. A fresh checkout invoking the named command alone has no guaranteed preview artifact.

**Required remediation/invariant:** Either make `test:e2e` self-contained by producing the exact production build or document and encode the dependency in a single CI gate. The standalone command in the TECH-PLAN table must work from a clean checkout.

## Contract checks that passed

- Astro output is static and no deployment adapter/server runtime is configured.
- The marketing artifact contains no React runtime or hydrated React islands. Its small client module is Astro's prefetch helper.
- Starlight content under `src/content/docs/docs/` emits the intended `/docs/` route without loading Starlight/Pagefind assets on the marketing page.
- `/`, `/docs/`, `/agents.md`, `/llms.txt`, and `404.html` are emitted at build time.
- `pnpm tokens:check` passes against the canonical dashboard source. The generated header's source commit and SHA-256 match that source, contains no absolute path, and no React Flow/xterm/app selector leaked.
- Current light/dark token key sets are symmetric and values match the explicit upstream theme blocks.
- Nav visible strings, install anchor, repository link, and package link match the approved storyboard/copy deck.
- The shell is server-rendered dark-first, has no explicit hairline border, uses the approved pill material/shadow tokens, supplies 44 px navigation targets, and hides the text links at the required mobile breakpoint.
- Hanken Grotesk and IBM Plex Mono are self-hosted. Browser requests on the marketing route were local only. The loaded Hanken face exposes the `100 900` weight range and accepts the planned 250 and 640 values.
- TypeScript uses Astro strict mode; `pnpm typecheck`, ESLint, Prettier over its configured scope, the two unit tests, and `pnpm build` pass.
- Node 24 and pnpm 10.6.4 metadata align with the Jinn monorepo; project dependencies are pinned.
- `.gitignore` covers `node_modules`, `dist`, `.astro`, `.playwright`, Playwright reports/results, screenshots, and macOS metadata.
- No committed junk was found. Six untracked `variants/*/shoot.mjs` files pre-existed outside the reviewed commits and were not touched.

## Reported deviation judgments

### `eslint-plugin-astro` pinned to 1.5.0

**Judgment: ACCEPTABLE.** The exact pin is reproducible, its declared Node range includes Node 24, and lint/typecheck pass under the repository's pinned `pnpm exec node` v24.13.0. Keep the reason documented in dependency maintenance notes and retest before upgrading; this is not a release blocker.

### Fontsource assets emitted as hashed `/_astro/*.woff2`

**Judgment: ACCEPTABLE.** The contract's real invariant is self-hosted WOFF2 with no runtime CDN dependency. Astro fingerprinting gives immutable asset names, the preload resolves to the same local Hanken artifact, only the Latin variable face is eagerly requested, and the face exposes the required continuous weight axis. Requiring literal `public/fonts/` placement would trade away bundler integrity without user value.

### Preview serves `/agents.md` as `text/markdown`

**Judgment: MUST FIX NOW.** TECH-PLAN explicitly requires host-independent `text/plain; charset=utf-8` and an artifact-level browser assertion. Deferring headers to an unspecified deployment host makes local preview differ from the production contract and leaves the machine endpoint unverified.

## Verification record

| Command/check                   | Result                                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm tokens:check`             | Pass; current snapshot/hash/commit match and current theme keys are symmetric                                                                   |
| `pnpm test`                     | Pass; 1 file, 2 tests                                                                                                                           |
| `pnpm check`                    | Exit 0, but invalid as a release signal because the link stage scanned 0 links                                                                  |
| `pnpm build`                    | Pass; static routes emitted for root, docs, machine endpoints, and 404                                                                          |
| `pnpm test:e2e`                 | Fail before tests because Playwright discovers the Vitest unit suite                                                                            |
| Direct marketing-shell E2E spec | Pass; 5 Chromium tests                                                                                                                          |
| `pnpm test:visual`              | Exit 0 with zero tests                                                                                                                          |
| `pnpm test:lighthouse`          | Exit 0 with zero tests                                                                                                                          |
| Preview spot checks             | `/` 200 HTML; `/docs/` 200 HTML; `/agents.md` 200 `text/markdown`; `/llms.txt` 200 `text/plain`; missing route 404 HTML; Hanken asset 200 WOFF2 |
| Marketing network inspection    | Only local HTML, CSS, prefetch JS, and Hanken WOFF2 requested                                                                                   |
| Privacy/leak grep               | Clean except for the sanctioned repository URL                                                                                                  |

## Risk read for A-05+

**High:** starting the scene system now would encode behavior against QA gates that can be red or vacuously green and against a sunrise contract whose intermediate frames are already inconsistent; repair the gates, theme sweep, token completeness, MIME contract, and safety guard before A-05 begins.

---

## Re-review after remediation commits — 2026-07-10

- **Reviewed commits:** `3b6812d`, `24d526f`, `1ff8987`, `fdbc41f`, `0b98166`, `37bcb7e`, `af553e7`, `92e5e76`, `27584d4`
- **Verdict:** **BLOCK**
- **Resolution count:** 10 of 11 original findings fixed; finding 4 remains open

The remediation batch substantially improves the foundation. The required check and E2E commands are now trustworthy and green, token and safety contracts fail loudly, production machine-route MIME is verified, the 404 has approved content, and the documentation/schema gaps are closed. The remaining blocker is narrow but material: the replacement sunrise is a circular snapshot wipe rather than the approved token cross-tween, and it cannot reverse cleanly while in flight.

### Original finding disposition

| #   | Disposition              | Re-verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **FIXED**                | `playwright.config.ts:4` scopes discovery to `tests/e2e`; `pnpm test:e2e` built from a clean command path and ran 9 Playwright tests successfully.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2   | **FIXED**                | `scripts/check-links.ts:15-59` requires four canonical routes, rejects zero/missing/broken internal results, and the real built crawl scanned 16 internal URLs.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3   | **FIXED FOR THIS PHASE** | `package.json:19,22` now routes visual and Lighthouse commands through `scripts/not-implemented.ts`; both exit 1 with an explicit NOT IMPLEMENTED error and are correctly absent from the section-6 `pnpm check` aggregate until their scheduled tasks land.                                                                                                                                                                                                                                                                                                                                                               |
| 4   | **NOT FIXED — HIGH**     | `src/styles/global.css:61-91` performs a hard-edged circular `clip-path` reveal of an endpoint snapshot, not the `docs/STORYBOARD.md:706-709` single 900 ms cross-tween of token values. `src/lib/theme-transition.ts:20-29` also hard-switches when View Transitions are unavailable. A rapid light→dark reversal at 150 ms visibly snapped from a small light circle over dark to a fully light page before starting a new dark circle; the test at `tests/e2e/marketing-shell.spec.ts:117-190` reverses only after the first 900 ms transition finishes and therefore misses the required mid-flight reversal behavior. |
| 5   | **FIXED**                | `scripts/sync-ledger-tokens.ts:163-224` requires every independent/dark/light allow-listed key and exactly one top-level explicit block per theme. Unit tests cover missing keys, ambiguous blocks, deterministic rendering, and idempotent writing; `pnpm tokens:sync` left the output hash unchanged.                                                                                                                                                                                                                                                                                                                    |
| 6   | **FIXED**                | The custom static preview and `public/_headers` both enforce `text/plain; charset=utf-8`; production-artifact E2E checks pass for `/agents.md` and `/llms.txt` with status 200 and no HTML wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 7   | **FIXED**                | `scripts/check-public-safety.ts` scans tracked/untracked source plus first-party generated artifacts, and `pnpm check` runs it after build. Unit tests cover personal identifiers, email, representative credentials/IDs, home paths, unapproved domains, and generated-artifact scope; the real scan covered 57 files.                                                                                                                                                                                                                                                                                                    |
| 8   | **FIXED**                | `src/pages/404.astro` uses the approved copy from `docs/STORYBOARD.md:673-676`, dedicated metadata, one H1, a 44 px recovery link, and a real 404 response; the page and its serious/critical axe result are exercised in E2E.                                                                                                                                                                                                                                                                                                                                                                                             |
| 9   | **FIXED**                | `src/content.config.ts:7-30` declares the machine collection and extends the docs schema with the planned metadata; both machine endpoints consume validated collection entries.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 10  | **FIXED**                | `package.json:16` includes authored `docs/**/*.md`, `PLAN.md`, and briefs in the formatting gate while preserving the generated-token exclusion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 11  | **FIXED**                | `package.json:18` builds before Playwright starts the production preview, so the public E2E command works without a pre-existing `dist/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Judgment on the new deviations

#### Static-artifact preview server plus deploy headers

**Judgment: ACCEPTABLE FOR THE MIME CONTRACT, WITH ONE LOW-SEVERITY ROBUSTNESS NIT.** Replacing `astro preview` with a small server is reasonable because it serves only checked-in build semantics from `dist/`, makes local E2E exercise the required MIME behavior, and leaves Astro's build output unchanged. `public/_headers` carries the same contract to the selected static host.

The server should still contain request parsing failures: `scripts/preview.ts:28` calls `decodeURIComponent()` without handling malformed percent encoding. A request for `/%` throws `URIError`, terminates the preview process, and returns an empty reply. The invariant is that malformed paths receive a 400/404 response without killing the test server. This is a new nit, not a reopening of original finding 6.

#### Safety exclusions for variants and generated vendor output

**Judgment: ACCEPTABLE WITH THE DOCUMENTED SCOPE.** `variants/**` is the explicitly excluded, read-only design-reference tree and production code must never import from it. `dist/pagefind/**` and the hashed `ui-core` chunk are third-party generated runtimes with upstream license/contributor metadata; first-party HTML, CSS, scripts, machine routes, and other hashed bundles remain in scope. `tests/unit/public-safety.test.ts:50-56` locks that distinction. The exclusion list must remain narrow and path-specific as bundle names evolve.

#### Visual and Lighthouse commands fail as NOT IMPLEMENTED

**Judgment: ACCEPTABLE FOR BATCH 1.** Failing explicitly is honest and satisfies the original remediation requirement; excluding these future gates from `pnpm check` matches TECH-PLAN section 6, whose aggregate check is typecheck, lint, unit tests, build, safety, and links. Both commands must be replaced with real assertions before their scheduled visual/performance task and before Phase A can be declared complete.

### Re-verification record

| Command/check               | Result                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm check`                | Pass: complete token contract; strict typecheck; authored-source/docs formatting; 3 unit files/14 tests; static build; 57-file safety scan; 16 internal URLs crawled     |
| `pnpm test:e2e`             | Pass: self-contained build plus 9 Chromium tests                                                                                                                         |
| `pnpm test:visual`          | Expected exit 1 with explicit NOT IMPLEMENTED message                                                                                                                    |
| `pnpm test:lighthouse`      | Expected exit 1 with explicit NOT IMPLEMENTED message                                                                                                                    |
| `pnpm tokens:sync`          | Idempotent; generated token SHA-256 unchanged                                                                                                                            |
| Preview artifact            | `/`, `/docs/`, machine routes, and 404 return expected statuses; both machine routes return exact `text/plain; charset=utf-8`; `dist/_headers` matches `public/_headers` |
| Theme forward transition    | One 900 ms View Transition animation is present and endpoint axe check passes                                                                                            |
| Theme reversal at 150 ms    | Fail: visible partial reveal snaps to the full target theme before the reverse wipe begins                                                                               |
| No-View-Transition fallback | Fail: theme attribute changes in one frame with zero animation                                                                                                           |
| Privacy grep                | Clean outside the sanctioned repository URL and excluded reference/docs scope                                                                                            |

### Remaining remediation

1. **Finding 4:** implement the approved 900 ms token-value cross-tween (or obtain an explicit storyboard amendment for a different visual), keep every intermediate frame coherent, and add a test that reverses direction before completion without a snap. The non-reduced-motion fallback must preserve the same continuous behavior rather than hard-switching.
2. **New preview nit:** catch malformed URL decoding and return a controlled client error without terminating the server.

### Risk read for starting A-05 through A-07

**Medium:** the reducer/player/orchestration gates are now reliable, but A-06/A-07 lifecycle work could ossify a non-reversible theme API; correct finding 4 before the scene controller or scroll orchestration takes a dependency on it.

---

## Final finding 4 re-verification — 2026-07-10

- **Reviewed commit:** `761fc6a`
- **Verdict:** **BLOCK**
- **Implementation disposition:** finding 4's runtime defect is fixed; its required E2E acceptance gate is not deterministic

### Required remediation

1. **MEDIUM — Make the mid-flight reversal assertion deterministic before A-05 begins.** `tests/e2e/marketing-shell.spec.ts:264-283` reads the pre-reversal frame, dispatches the reverse in a separate browser evaluation, reads another frame in a third evaluation, and requires the RGB distance between those two wall-clock samples to remain below 12. The transition legitimately advances while those cross-process calls execute, so the assertion intermittently reports a snap that did not occur. My first clean `pnpm test:e2e` run failed this assertion with a distance of 14 and completed 10 of 11 tests; a focused 20-repeat run failed 6 times with distances from 14 to 17. Keep the no-snap invariant, but measure the before/after relationship atomically in the browser or assert the CSS transition's continuity without a scheduler-sensitive RGB threshold. The required invariant is that repeated clean `pnpm test:e2e` runs are green while still failing for a real endpoint snap.

### Implementation judgment

The replacement mechanism itself satisfies finding 4. `src/lib/theme-transition.ts:19-68` installs the transition scope before switching token endpoints, preserves that scope across a reversal, resets its cleanup generation, and makes reduced motion instantaneous. `src/styles/global.css:61-71` applies the same 900 ms property-transition contract to the root and every descendant surface for color, background color, borders/outlines, shadows, SVG fill/stroke, caret, filter, and backdrop filter. No runtime code depends on the View Transitions API.

An independent in-page `requestAnimationFrame` probe confirmed that a reversal requested around 150 ms continues from the current computed frame and returns toward the dark endpoint without jumping to either full endpoint. Chromium applies its native reverse-shortening behavior to the returning CSS transitions; that preserves continuity and is acceptable under the storyboard's no-snap requirement.

### Final verification record

| Command/check                             | Result                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                              | Pass: token contract, strict typecheck, lint/format, 14 unit tests, static build, safety scan, and link crawl                       |
| `pnpm test:e2e`                           | Fail: 10 of 11 passed; the 150 ms reversal assertion failed with RGB distance 14 against a `<12` threshold                          |
| Focused reversal test, `--repeat-each=20` | Fail: 14 passed and 6 failed, reproducing scheduler sensitivity                                                                     |
| In-page animation-frame probe             | Pass: endpoint attributes reverse immediately while rendered colors remain continuous and travel back from the current visual frame |
| No-View-Transitions path                  | Pass in the full run                                                                                                                |
| Reduced-motion path                       | Pass in the full run                                                                                                                |

### Risk read for starting A-05 through A-07

**Medium:** the runtime theme API is now safe to build on, but the only regression test for rapid scroll reversal is flaky; stabilize that gate before scene-controller and scroll-lifecycle work begins, or later regressions will be indistinguishable from test noise.

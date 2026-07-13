# A-12 Theatre Code Review

- **Date:** 2026-07-10
- **Branch:** `a12-theatre`
- **Reviewed range:** `main...a12-theatre`
- **Implementation commits:** `a4cdd6f`, `c11b0d2`, `a0712b8`, `a324f2d`,
  `c987642`, `ce462fb`, `4981ac1`, `f632c12`, `de0ca69`
- **Verdict:** **BLOCK**
- **Findings:** 1 high · 4 medium · 1 low

The theatre is visually cohesive, the morning timeline itself preserves the
honest-state sequence, the static dark/light split is FOUC-free, and the
authorized theme-ownership fix in `de0ca69` is correct for the current scene
system. The brand raster is byte-identical to the historical Apache-licensed
Noto source rather than Apple artwork, and the shipped asset dimensions and
metadata are correct.

The branch is not shippable. The sunrise entry mechanism is not a monotonic
page-position state machine: the required Install anchor can bypass it and
leave the entire back half dark, while repeated sub-hysteresis peeks accumulate
until the sunrise, approval, and post run offscreen at the hero. The night
feed also violates exact scene state by shipping row 6 pre-highlighted, the
page violates the closed copy deck, the Noto redistribution is missing a
pinned provenance/license payload, and the required `pnpm check` gate is red
against the current canonical token source.

## Required remediation before merge

1. Replace the sunrise's pauseable scene start delay with a page-position
   transition rule that handles normal scroll, hash navigation, same-page
   anchor clicks, mobile, reload, and rapid direction flips. Crossing to any
   section below Morning must resolve the one-way sunrise; leaving Morning
   before a continuous hysteresis dwell must reset the dwell rather than bank
   it. Add exact tests for all of those paths.
2. Prime the night scene from its authored semantic initial state, including
   no active highlight, then apply row 6's amber wash only at the 3000ms beat.
   Compare animated DOM with the reducer before, during, and after the beat.
3. Restore the exact step-label strings, including `·`, and remove or obtain
   design approval for the extra visible avatar initials. Make the copy gate
   serialize all visible text instead of testing selected fragments.
4. Pin the exact Noto source revision and SHA-256 and include the applicable
   license text with the redistributed source and derivatives. Do not point a
   historical Apache provenance claim at a moving branch that now presents a
   different license.
5. Refresh the generated Ledger token provenance from the current canonical
   source and rerun the complete `pnpm check` gate. The token values did not
   change, but the strict full-file source hash did.
6. Regenerate the eager-JS report after `de0ca69`; retain the deterministic
   measurement manifest alongside the corrected 64,625-byte total.

## Findings

### 1. HIGH — The sunrise can be bypassed or banked until approval runs offscreen

- **Location:** `src/components/chrome/SiteNav.astro:15`,
  `src/lib/scenes/scene-player.ts:167-172`,
  `src/lib/scenes/scene-player.ts:310-320`,
  `src/lib/scenes/scene-player.ts:637-675`,
  `src/scenes/landing/morning-approval.scene.ts:13-18`,
  `tests/e2e/theatre.spec.ts:161-183`,
  `docs/reports/a12-report.md:137-143`
- **Contract:** STORYBOARD §2 and §3/7 require one scroll-entry sunrise, a
  small hysteresis band, light sections 8–11, no reverse on scroll-up, and
  re-arming only on full reload. The Morning scene is the only place run
  #142's gate may resolve.

There are two opposite failures in the same entry mechanism.

First, the required nav Install link targets `/#install`, below Morning. A
fresh direct load at that URL or clicking Install at the top never intersects
the Morning scene. On both 1440px and 390px viewports the result was:

```json
{
  "hash": "#install",
  "theme": "dark",
  "morningTime": "0",
  "morningState": "paused",
  "bodyBackground": "rgb(20, 19, 15)"
}
```

Sections 9–11 therefore render dark even though the canonical theme table
requires them to be light. The implementation report discloses this as an
“anchor-jump caveat,” but no contract amendment authorizes it. It is also not
an obscure deep-link edge case: it is the primary nav CTA.

Second, the advertised 350ms hysteresis is implemented as a pauseable
`startDelayRemaining`. `pauseScheduledStart()` subtracts elapsed visible time
and preserves the remainder. Separate brief visits therefore accumulate;
they do not require one continuous 350ms dwell. The committed test covers only
an enter-and-exit within one JavaScript frame, so it cannot detect this.

An adversarial sequence of 120ms Morning visits, returning to `scrollY=0`
after each, produced:

```text
visit  5: t=253ms  · light · gate awaiting · post queued  · paused at hero
visit 20: t=2230ms · light · gate awaiting · post queued  · paused at hero
visit 25: t=2871ms · light · gate approved · post queued  · paused at hero
visit 30: t=3457ms · light · gate approved · post running · paused at hero
```

The visitor never remained in Morning for the hysteresis interval, yet the
page turned light, the gate approved, and the post began while the browser was
back at the hero. This breaks both the theatrical boundary and the honest
temporal story. With more flips, the same banked timeline can finish the run.

The once/retain half works after a legitimate completion: reverse-scrolling
through Night, every pinned stage, and the hero stays light, and a full reload
re-arms. Those green paths do not compensate for a trigger that is neither
position-complete nor continuous-dwell safe.

### 2. MEDIUM — Night row 6 is highlighted 500ms before its authored beat

- **Location:** `src/components/scenes/surfaces/NightFeedSurface.astro:11-25`,
  `src/lib/scenes/scene-player.ts:585-635`,
  `src/scenes/landing/night-shift.scene.ts:49-63`,
  `tests/e2e/theatre.spec.ts:28-68`
- **Contract:** STORYBOARD §3/6 enters row 6 at 2500–2800ms, then starts its
  amber highlight at 3000ms and holds it. The inherited review standard is
  exact semantic and visual serialization: `DOM(t) === reducer(scene, t)`.

The resolved SSR surface puts `data-active` on row 6. Scene construction
captures that attribute, and `primeInitialDom()` restores snapshot attributes
but does not apply the definition's empty `initialState.highlights` map. Row 6
is consequently amber from the instant it enters, before its separate
highlight beat.

A production probe at scene time 2750ms, halfway between row entry and the
highlight beat, returned:

```json
{
  "time": "2750",
  "row6Active": true,
  "row6Hidden": false,
  "background": "rgba(224, 163, 60, 0.14)"
}
```

At the same time the reducer's highlight map remains empty. The 3000ms beat
cannot introduce the wash because it is already present; it only runs the
opacity tween. Existing tests assert the final resolved highlight but never
assert its absence before 3000ms.

### 3. MEDIUM — The closed copy deck is not serialized verbatim

- **Location:** `src/components/marketing/ThreeSteps.astro:12-28`,
  `src/components/marketing/ThreeSteps.astro:37-45`,
  `src/components/scenes/surfaces/MorningSurface.astro:34-40`,
  `tests/e2e/theatre.spec.ts:225-260`,
  `tests/e2e/theatre.spec.ts:329-360`
- **Contract:** STORYBOARD §3/9 specifies `01 · Install`,
  `02 · Hire your team`, and `03 · Let it run`; §6 says no other visible text
  may appear without returning to design.

The three cards render the number and title as separate nodes with a CSS gap,
but no middot node. Browser `textContent` is therefore `01Install`,
`02Hire your team`, and `03Let it run`, not the authored strings. The tests
look for title fragments and never serialize the complete label.

The Morning card also adds visible avatar initials `JB`, which are absent from
the closed deck and are not among the report's disclosed deviations. The
report does disclose the extra `run #142` label and badge; that does not grant
an exception for unrelated additional text. All other section 8–11 strings
and the pre-existing 404 strings matched, and the heading sequence has no
level skips.

### 4. MEDIUM — The raster is genuinely Noto, but redistribution provenance is incomplete

- **Location:** `scripts/brand/NOTICE.md:1-11`,
  `scripts/brand/noto-genie-1f9de.png`, `public/favicon-32.png`,
  `public/favicon-64.png`, `public/apple-touch-icon.png`, `public/og.png`
- **Contract:** STORYBOARD-AMENDMENT-1 §3 prohibits Apple emoji artwork in the
  public repository and requires the PNG fallbacks, touch icon, and OG genie
  to derive from redistributable Noto artwork.

The critical identity check passes. The committed 512px source has SHA-256
`a6f989324e9a74d10e907e7e4166640c4b1db45eaa8f36412671d1fd197c2693`,
exactly matching Noto Emoji's `png/512/emoji_u1f9de.png` at revision
`de7f127a26f7044e5647490af9e3b187d9532703`. That revision's repository
license is Apache-2.0. Visual inspection and the build script also agree that
the four derivatives come from that source, not from platform-captured Apple
artwork.

The compliance package is nevertheless incomplete:

- the repository contains no copy of the Apache-2.0 license applicable to the
  redistributed source and derivatives;
- `NOTICE.md` links the moving Noto `main` branch rather than the verified
  revision and does not record the source hash; and
- current Noto `main` presents the OFL-1.1 license, so following the note today
  does not substantiate its historical Apache-2.0 claim.

This is not an Apple-artwork finding. It is a provenance and license-delivery
finding on otherwise correctly sourced Noto assets.

The mechanical brand checks pass: the SVG uses a raw `<text>` emoji glyph;
the PNGs are 32×32 and 64×64; the touch icon is 180×180; the OG is 1200×630;
nav/footer use the raw transparent glyph; the genie appears only on those two
brand marks and metadata surfaces; the amber-square mark is gone; and the
favicon, Open Graph, and Twitter metadata resolve correctly.

### 5. MEDIUM — The required `pnpm check` gate is red against the canonical source

- **Location:** `scripts/sync-ledger-tokens.ts:10-14`,
  `scripts/sync-ledger-tokens.ts:270-308`,
  `src/styles/generated/ledger-tokens.css:1-7`
- **Contract:** the branch must pass `pnpm check`; the generated Ledger token
  snapshot must describe the current canonical Jinn stylesheet.

Both required review runs stopped immediately with:

```text
Error: Ledger token snapshot drifted. Run `pnpm tokens:sync` and commit the result.
```

This is cross-repository provenance drift, not a theatre token regression.
The branch and `main` contain the same snapshot, sourced from Jinn commit
`2478ab832fecaef46f67bbcf37229d2b5bf4af2c` with content hash
`0eb162e2e05e882fa9dcda14b89216d5f6af0938c4febdd78621e0b193c0f4d1`.
The current canonical stylesheet resolves to commit
`16bd03696b2ec5935a94eb8a91a2f17d3580fcf7` and content hash
`3fa31f1a17245288186f73fb512f1dc7f2fe3c9f94c6b4aca826564e62dffbf9`.
Its intervening change adds unrelated keyframes; the allowlisted token values
are unchanged, but the generator deliberately hashes the full source file.

Running the remaining gates individually produced green typecheck, lint,
50/50 unit tests, build, public-safety scan, and 22-URL link/sitemap scan.
That isolates the failure but does not turn the required aggregate gate green.

### 6. LOW — The exact eager-JS claim predates the machinery commit

- **Location:** `docs/reports/a12-eager-js.md:15-32`,
  `docs/reports/a12-report.md:43-48`
- **Contract:** the implementer report's exact 64,589-byte claim must be
  reproducible on the reviewed branch, including `de0ca69`.

The committed deterministic command now reports **64,625 gzip bytes
(63.110 KiB)**, 36 bytes above the documented total. The changed scene-player
bundle hashes and reducer size reflect the later machinery commit. The branch
still passes the 90 KiB budget by a wide margin, and the favicon/OG assets are
static requests that do not enter the eager JavaScript closure. This is stale
evidence, not a performance regression.

## Authorized machinery audit — `de0ca69`

The ownership change itself is sound for the current architecture.

- Ownership detection correctly includes either an authored
  `initialState.theme` or any `theme` beat. That covers initial-theme-only
  definitions as well as Morning's t=0 beat.
- Non-owning players carry no document snapshot, so `seek()` reconstruction,
  retained-state hydration, `destroy()`, controller churn, and motion-channel
  ownership transfer cannot overwrite the page theme.
- Owning players snapshot all three document theme attributes and restore
  them on seek/destroy. During forward reconstruction, the theme beat applies
  its target immediately instead of starting a second animated clock.
- The reverse-scroll theatre test was strengthened from a disabled fixme to a
  live traversal of every pinned stage and the hero. No pre-existing test was
  weakened to make the commit pass.
- New fixture tests directly cover non-owner seek/destroy, initial-theme-only
  ownership, and a theme-at-zero definition at seek 0, seek forward, and
  teardown.

Targeted browser checks agreed: after a legitimate sunrise, reversing through
Night, Triggers, Workflow, Todos, Employees, and Hero never returned to dark;
the showcase's run #142 surface stayed parked (`awaiting-approval`, post
`queued`, badge `Running`, progress `2/3`) after the separate Morning surface
completed. The machinery commit closes the authorized bug without coupling
the two surfaces.

One rollout caution remains: a future theme-owning definition constructed
while a transition attribute is active would snapshot that transient marker.
No current path does this, so it is not a branch finding, but later theme
owners should not be added casually.

## Scene fidelity and honest-state audit

Apart from finding 2, both scene definitions match the storyboard's authored
offsets, durations, target order, action types, checkpoints, once/retain
policy, and zero-ambient requirement. The 900ms sunrise uses the shared root
theme transition rather than per-element delays; intermediate computed-color
tests verify the page, nav, cards, text, shadows, and accent surfaces all move
on that one clock. Reduced motion and no-JS keep Night dark and scope Morning
through Footer light exactly at the Morning wrapper boundary, while the
pre-paint motion flag removes that static scope before a motion render.

Direct Morning samples confirmed the honest sequence:

```text
t=2114/2417: gate awaiting · post queued  · badge running   · progress 0
t=2750:      gate approved · old gate text still present    · post queued
t=3118:      approved text committed                         · post queued
t=3719:      gate approved · post running · badge running   · progress 1
t=4319:      gate approved · post done    · badge running
t=4812:      gate approved · post done    · badge completed · posted text
```

The running step's authored blue spinner is visible during the running state;
completion does not appear before the beat commit. Normal seek, retained
hydration, reverse traversal, and mobile duplication do not leak Morning's
approval into the showcase pane. The rapid-flip failure in finding 1 advances
the Morning surface offscreen; it still does not mutate the separate showcase
surface.

## Sections, accessibility, spacing, and hygiene audit

- Sections 8–11 use no scene machinery. The Three Steps reveal is one
  motion-gated, one-shot IntersectionObserver plus CSS rise stagger, as the
  storyboard permits.
- Theatre sections use the enlarged theatrical spacing token, including
  128px mobile silence, and exceed the ordinary section rhythm. MCP also gets
  the larger breath after the theatre. The night/morning frame min-heights
  preserve layout before their enter targets become visible.
- Heading levels run from the page H1 to section H2s with no level skips.
  Existing full-page axe audits cover the initial dark page and resolved light
  page and report no serious or critical violations.
- The 13 claimed checkpoint screenshots exist under `docs/screens/a12/` at
  the documented desktop/mobile/theme checkpoints. The visual checks agree
  with the intended dark Night, mid-sunrise, light Morning, light back half,
  nav glyph, favicon set, and OG card.
- The 404 copy and shell are unchanged. Sitemap generation publishes only the
  intended public routes, and the built-link gate passes all 22 internal URLs.
- `git diff --check main...HEAD` is clean. Commit boundaries are coherent:
  data/definitions, the two theatre sections, simple sections, brand, page
  assembly/tests, evidence/report, and the single authorized machinery fix.
- The six pre-existing untracked variant shoot scripts were left untouched
  and are excluded from this review commit.
- The old report's “1 skipped” was the pre-`de0ca69` theme-ownership fixme.
  At reviewed HEAD it is enabled. Both current E2E runs report 84 passed and
  **zero skipped**; the browser-specific `test.skip` guards select one intended
  cross-browser test per project and do not create a skipped result.

## Verification record

| Check                   | Run 1                    | Run 2                    | Review result                                             |
| ----------------------- | ------------------------ | ------------------------ | --------------------------------------------------------- |
| `pnpm check`            | failed at `tokens:check` | failed at `tokens:check` | MEDIUM finding 5; remaining sub-gates passed individually |
| `pnpm test:e2e`         | 84 passed                | 84 passed                | green, zero skipped both times                            |
| `pnpm typecheck`        | 0 errors                 | —                        | pass (17 pre-existing deprecation hints)                  |
| `pnpm lint`             | pass                     | —                        | pass                                                      |
| `pnpm test`             | 50 passed                | —                        | pass                                                      |
| `pnpm build`            | pass in both E2E runs    | —                        | pass                                                      |
| `pnpm safety:check`     | 152 files                | —                        | pass                                                      |
| `pnpm test:links:built` | 22 URLs                  | —                        | pass                                                      |
| eager-JS measurement    | 64,625 B gzip            | —                        | budget pass; exact report stale                           |

Additional adversarial probes covered direct `/#install`, the Install click at
1440px and 390px, repeated 120ms direction flips, pre-highlight row 6,
pre-approval/approved/running/done Morning frames, reverse traversal to the
hero, reduced motion, no JS, raster hashes/dimensions, heading text, and exact
visible step-label serialization.

## Amendment rollout risk read

**Risk: HIGH until finding 1 is fixed and regression-gated.** Ribbon
navigation multiplies programmatic jumps across the same page-position seam,
so shipping it on top of the current visibility-only sunrise would make the
primary failure easier to reach. Ambient scenes add more claims and pauses to
the shared motion channel, increasing the value of the otherwise-correct
`de0ca69` ownership boundary. The Workflow switcher must preserve two isolated
truths: Morning digest remains parked and motionless, while Nightly backup may
loop without sharing semantic targets or retained state with run #142.

Before that rollout, land a monotonic sunrise controller and an adversarial
matrix for hash/deep links, ribbon jumps, mobile ratios, rapid flips, full
reverse-to-hero, reduced motion, and reload. Then keep the theatre scenes
silent, keep Morning as the only theme owner, and add exact per-surface state
serialization around the Workflow switcher.

---

## Final re-verification after remediation

- **Remediation commits:** `89db37b`, `ffda0b3`, `691a0f6`, `235e3a1`,
  `05faaed`, `33ae4ae`
- **Final verdict:** **BLOCK**
- **Original findings:** 5 fixed · 1 partially fixed
- **Remaining split:** 2 must-fix · 2 notes

The functional remediation is strong. The sunrise now behaves monotonically
on the tested user routes, repeated peeks do not bank time, the Morning scene
stays honest and isolated, row 6 lights at its authored beat, the closed copy
deck serializes exactly, the token gate is current, and the 65,088-byte
eager-JS measurement is reproducible. The authorized scene machinery was not
changed.

The branch is still not merge-clean. One of the two mandated full E2E runs
failed, and the affected one-clock test fails reliably when stressed in
parallel. The Noto remediation also ships the correct historical license but
does not retain the upstream copyright attribution file from the pinned
revision.

### Must-fix 1 — The E2E gate is nondeterministic and did not pass twice

- **Location:** `tests/e2e/marketing-shell.spec.ts:274-330`
- **Result:** full run 1: 89 passed, 1 failed; full run 2: 90 passed; zero
  skipped in both runs.

The failing test is the inherited “cross-tweens every themed surface on one
900ms clock” gate. The first full run reached its post-transition axe audit
while the hero scroll cue still had a light-on-light intermediate color,
reporting a serious 1.06:1 contrast violation. A five-repeat isolated stress
run then failed 5/5 at the 450ms intermediate-color assertion because the
fixed `waitForTimeout(450)` callback ran after the compositor had already
reached the light endpoint.

This is a timing-test defect, not evidence that the new runtime starts two
theme clocks. Direct instrumentation of the real Morning path observed one
root theme mutation at fire, one cleanup at ~900ms, no restart when the
scene's t=0 theme beat ran, and intermediate body colors on the same sweep.
The test nevertheless cannot establish that contract deterministically under
the suite's five-worker load. Replace wall-clock sampling with a controlled or
condition-based transition probe, and run the axe audit only after the root
transition contract has settled. The required “E2E twice green” gate remains
unsatisfied until then.

### Must-fix 2 — The pinned Noto package still omits a copyright attribution notice

- **Location:** `scripts/brand/NOTICE.md`,
  `scripts/brand/LICENSE-noto-emoji`
- **Upstream pinned file:**
  [`AUTHORS` at `de7f127a…`](https://github.com/googlefonts/noto-emoji/blob/de7f127a26f7044e5647490af9e3b187d9532703/AUTHORS)

The committed genie source and license are both byte-identical to the pinned
Noto revision:

```text
image:   a6f989324e9a74d10e907e7e4166640c4b1db45eaa8f36412671d1fd197c2693
license: c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4
```

The historical Apache-2.0 grant is valid and remains usable despite current
Noto `main` being OFL-1.1. The pinned revision also contains an `AUTHORS` file
that identifies itself as the official list “for copyright purposes” and
names the copyright authors. Apache-2.0 §4(c) requires redistribution to
retain applicable copyright and attribution notices. The remediation copied
`LICENSE` but neither copies `AUTHORS` nor carries its attribution in the
local notice. Add that pinned attribution payload (or its complete applicable
contents) beside the license. Until then the public redistribution package is
not airtight.

### Note 1 — The remediation report names stale token provenance

`docs/reports/a12-report.md` says the refreshed snapshot points at canonical
commit `16bd0369…`. The generated snapshot and current canonical source
actually match commit `c55ccc5ea37f0b446a9865229200c573916200a6` with SHA-256
`37c2b33c647048781a8b719cc0a4a44da7b7a0a238bffa3daee13fa72842d33f`.
Both `pnpm check` runs passed, so this is stale prose rather than stale build
input.

### Note 2 — Restored scroll position fires after first paint, unlike `/#install`

The fresh `/#install` path is genuinely pre-paint: instrumentation observed
`data-theme="light"` before the first animation frame at both desktop and
mobile widths, with the Morning timeline still at 0 and its gate awaiting.

A full reload at a browser-restored below-Morning scroll position begins with
the server-authored dark root for two animation frames; the position rule then
fires at ~40ms and runs the 900ms sunrise. This satisfies “restoration fires
the sunrise” and a full reload is allowed to re-arm, so it is not a current
contract blocker. If the amendment rollout intends every restored back-half
visit to arrive light without any dark frame, it needs a separate pre-paint
restoration strategy and regression test.

## Per-finding closure evidence

### Finding 1 — Fixed

- Fifteen cold top loads stayed dark with Morning at `t=0`, gate awaiting.
- Thirty 120ms Morning peeks, each returning to the hero, ended dark at
  `t=0`, gate awaiting, post queued. A genuine continuous dwell still fired.
- Nav Install, direct `/#install`, instant bottom jump, history back/forward,
  and normal scroll all turned the page light. Anchor/jump paths left the
  unseen Morning story at `t=0` rather than resolving it offscreen.
- Normal entry produced one 900ms root transition. Reversing through every
  pinned stage to the hero stayed light; reload re-armed.
- Removing `initialState.theme` does not remove theme ownership:
  `de0ca69` also detects `beats.some(action.type === "theme")`. A normal
  player snapshots dark; a pre-paint `/#install` player snapshots light; seek
  and destroy therefore restore the correct visit state without forcing a
  deep-linked page dark.
- The sunrise gate uses the existing composable pause set. Its generic `api`
  reason is safe for the current Morning player because there is no second
  API-pausing consumer; future controls should use a distinct reason rather
  than sharing that key.

### Finding 2 — Fixed

At 2750ms row 6 was visible, `data-active` was absent, and its background was
transparent. At 3000ms the highlight commit added `data-active`; the authored
400ms wash then reached `rgba(224, 163, 60, 0.14)` at resolution. Reduced
motion and no-JS still render the final amber row statically without claiming
animated playback state.

### Finding 3 — Fixed

The step labels now serialize as `01 · Install`, `02 · Hire your team`, and
`03 · Let it run`; the Morning-only `JB` text and avatar styles are removed.
The revised test compares complete rendered section text, including every CTA
and footer string, rather than selected fragments.

### Finding 4 — Partially fixed

The Apple-artwork firewall passes, source revision and image hash are pinned,
the correct historical Apache text is shipped, and the moving-license warning
is accurate. Must-fix 2 is the remaining attribution-compliance gap.

### Finding 5 — Fixed

The generated snapshot is byte-current with the canonical stylesheet and
both aggregate checks pass. Note 1 is documentation-only.

### Finding 6 — Fixed

The committed manifest exactly matches a fresh production trace:
**65,088 gzip bytes (63.5625 KiB)**, comfortably below 90 KiB. Brand assets
remain outside the eager JavaScript closure.

## Final verification record

| Check                | Run 1                       | Run 2     | Final result                                                           |
| -------------------- | --------------------------- | --------- | ---------------------------------------------------------------------- |
| `pnpm check`         | pass                        | pass      | green: 50 unit tests, build, lint, typecheck, safety, 22-URL link gate |
| `pnpm test:e2e`      | **1 failed, 89 passed**     | 90 passed | **red: did not pass twice**                                            |
| one-clock stress     | 5/5 failed                  | —         | fixed-time sampling is not deterministic under contention              |
| eager-JS measurement | 65,088 B gzip               | —         | exact report match; budget pass                                        |
| leak/diff hygiene    | pending final review commit | —         | implementation commits contain no scene-machinery diff                 |

The historical “1 skipped” in the implementation report was the
pre-`de0ca69` `test.fixme`. That fixme was converted into the live
reverse-to-hero test by the authorized machinery commit. The remaining
conditional `test.skip` calls in the cross-browser file are project guards;
project grep selects the intended browser case, so current full runs report
**zero skipped**.

## Final amendment-rollout risk

**Risk: HIGH if merged now; MEDIUM after the two must-fixes.** The original
ribbon-navigation blocker is functionally closed: anchor, jump, deep-link,
continuous-dwell, reverse, and retained-state probes now preserve the one-way
sunrise and keep run #142 isolated. That materially lowers the next batch's
architecture risk.

Do not start the ribbon/ambient/switcher rollout on a branch whose timing gate
cannot reproduce two green runs or whose public brand attribution is
incomplete. After those are closed, retain the single page-position owner,
give any new playback gate a distinct pause reason, keep Night and Morning
ambient-free, and exact-serialize the Morning-digest parked state across every
Workflow switcher transition.

---

## Terminal scoped re-verification — superseding verdict

**Verdict: SHIP-CLEAN.** The final three closing commits resolve both remaining
must-fixes and the documentation note. Final open counts are **0 high, 0 medium,
0 low**; there are **0 must-fixes and 0 notes**.

### Closing commit verification

- `f441a6f` replaces the contention-sensitive fixed-delay assertion with an
  in-page `requestAnimationFrame` probe. The probe observes body background,
  root foreground, and Install accent on the same intermediate frame, confirms
  their live 900ms transition contract, waits for the root transition owner to
  settle, and only then runs the final-state and axe assertions. It passed all
  20 repeats with four workers in this review, as well as the full suite.
- `6107cac` ships the pinned Noto `AUTHORS` payload and references it from
  `scripts/brand/NOTICE.md`. The committed file is byte-identical to upstream
  revision `de7f127a26f7044e5647490af9e3b187d9532703`, with SHA-256
  `451de3fcfd07574e43cb5131f7a6cc688372fa8b1d4f52c26d1a3f7ce03aff32`.
  Together with the already verified pinned image and Apache-2.0 license, this
  closes the attribution gap without relying on Noto's current branch license.
- `624e8e4` corrects the canonical token provenance to
  `c55ccc5ea37f0b446a9865229200c573916200a6` and accurately documents the
  scroll-restoration behavior. The two dark frames on a full reload at a
  restored back-half position are accepted recovery behavior, not a defect:
  the storyboard explicitly re-arms the sunrise on full reload, so persisting
  a prior light visit pre-paint would violate that law. Once layout restores
  the below-Morning position, the page-level owner performs the authored
  one-way sweep.

No closing commit changes scene machinery, authored scene data, or production
theme ownership. The historical fixme remains a live test, and the full run
reports zero skipped tests.

### Terminal verification record

| Check                    | Result                                                                     |
| ------------------------ | -------------------------------------------------------------------------- |
| `pnpm check`             | pass: 50 unit tests, typecheck, lint, build, token/safety/link gates       |
| `pnpm test:e2e`          | pass: 90/90, zero skipped                                                  |
| one-clock focused repeat | pass: 20/20, four workers                                                  |
| pinned Noto `AUTHORS`    | exact upstream bytes and SHA-256 match                                     |
| closing-commit scope     | docs, provenance payload, and deterministic test only; no machinery change |

## Terminal amendment-rollout risk

**Risk: MEDIUM.** The theatre's shared-clock, position-owner, honest-state, and
brand-provenance seams are now gated. The next ribbon/ambient/switcher batch
should preserve the single sunrise owner, allocate distinct composable pause
reasons, keep Night and Morning ambient-free, and prevent Workflow switcher
state from hydrating Morning's approval backward into the parked showcase.

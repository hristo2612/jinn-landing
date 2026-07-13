# Amendment "alive" batch — landing eager JavaScript budget

Deterministic production-browser measurement after `pnpm build`:

```sh
pnpm exec tsx scripts/measure-eager-js.ts
```

Same method as the A-11/A-12 reports (static preview on 4333, `/` at
1440×900, desktop ScrollTrigger binding complete, gzip level 9 per
same-origin JS response). Measured at the `amend-alive` batch HEAD —
includes the four amendment scene definitions (org/todos/triggers ambient +
nightly-backup), the ribbon-nav + switcher wiring
(`wire-showcase-controls.ts`), and the controller's shipped ambient
scheduling paths.

| Requested production input                                         | gzip bytes |
| ------------------------------------------------------------------ | ---------: |
| `gsap.BpeSQfbS.js`                                                 |     27,056 |
| `gsap.CK_fvoJn.js`                                                 |        287 |
| `Hero.astro_astro_type_script_index_0_lang.BtoxsYqT.js`            |        903 |
| `install-scene-system.lplhF4q8.js`                                 |      6,640 |
| `MarketingLayout.astro_astro_type_script_index_0_lang.C5YSi2NX.js` |         75 |
| `page.B2uBVZjk.js`                                                 |      1,114 |
| `preload-helper.CxFQXtKk.js`                                       |        729 |
| `scene-controller.ChLodN1u.js`                                     |      5,106 |
| `scene-reducer.CRWtZfwa.js`                                        |     10,759 |
| `ScrollTrigger.D7MWR7hw.js`                                        |     17,405 |
| `sunrise.Cj_VUmMg.js`                                              |        588 |
| `theme-transition.AOiyO6ri.js`                                     |        432 |
| **Total**                                                          | **71,643** |

Result: **PASS** at **71,643 bytes (69.96 KiB)** against the 90 KiB gzip
budget — **+6,006 bytes** over the A-12 baseline (65,088) for the entire
aliveness batch: three ambient loops, the replayable nightly-backup run, the
two-variant flows surface, the real ribbon navigation, the workflow
switcher, and their wiring.

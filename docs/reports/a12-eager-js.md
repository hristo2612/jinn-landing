# A-12 landing eager JavaScript budget

Deterministic production-browser measurement after `pnpm build`:

```sh
pnpm exec tsx scripts/measure-eager-js.ts
```

Same method as the A-11 report (static preview on 4333, `/` at 1440×900,
desktop ScrollTrigger binding complete, gzip level 9 per same-origin JS
response). Measured at review-remediation HEAD — includes the two theatre
scene definitions, the theme-ownership machinery guard (`de0ca69`), the
sunrise position rule (`src/lib/sunrise.ts`), and the step-card reveal.

| Requested production input                                         | gzip bytes |
| ------------------------------------------------------------------ | ---------: |
| `gsap.BpeSQfbS.js`                                                 |     27,056 |
| `gsap.CK_fvoJn.js`                                                 |        287 |
| `Hero.astro_astro_type_script_index_0_lang.Bf01PUW8.js`            |        962 |
| `install-scene-system.DJLn_ZqJ.js`                                 |      4,959 |
| `MarketingLayout.astro_astro_type_script_index_0_lang.C5YSi2NX.js` |         75 |
| `page.B2uBVZjk.js`                                                 |      1,114 |
| `preload-helper.CxFQXtKk.js`                                       |        729 |
| `scene-controller.DqZQmFmf.js`                                     |      2,761 |
| `scene-reducer.esrqjIY_.js`                                        |      9,308 |
| `ScrollTrigger.D7MWR7hw.js`                                        |     17,405 |
| `theme-transition.AOiyO6ri.js`                                     |        432 |
| **Total**                                                          | **65,088** |

Result: **PASS** at **65,088 bytes (63.56 KiB)** against the 90 KiB gzip
budget — **+1,636 bytes** over the A-11 baseline (63,452) for the entire
theatre including the sunrise position rule and the machinery guard.

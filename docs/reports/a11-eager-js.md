# A-11 landing eager JavaScript budget

Deterministic production-browser measurement after `pnpm build`:

```sh
pnpm exec tsx scripts/measure-eager-js.ts
```

The script starts the checked-in static preview on port 4333, opens `/` at
1440×900, waits until desktop ScrollTrigger binding is complete, records every
same-origin JavaScript response once, and sums Node `gzipSync(..., { level: 9 })`
sizes. This includes GSAP and ScrollTrigger because the desktop showcase loads
them eagerly.

| Requested production input                                         | gzip bytes |
| ------------------------------------------------------------------ | ---------: |
| `gsap.BpeSQfbS.js`                                                 |     27,056 |
| `gsap.CK_fvoJn.js`                                                 |        287 |
| `Hero.astro_astro_type_script_index_0_lang.CxGaXz5I.js`            |        495 |
| `install-scene-system.CovZES3w.js`                                 |      3,825 |
| `MarketingLayout.astro_astro_type_script_index_0_lang.C5YSi2NX.js` |         75 |
| `page.B2uBVZjk.js`                                                 |      1,114 |
| `preload-helper.CxFQXtKk.js`                                       |        729 |
| `scene-controller.CKUoV7NA.js`                                     |      2,762 |
| `scene-reducer.w2Bl1DNq.js`                                        |      9,272 |
| `ScrollTrigger.D7MWR7hw.js`                                        |     17,405 |
| `theme-transition.AOiyO6ri.js`                                     |        432 |
| **Total**                                                          | **63,452** |

Result: **PASS** at **63,452 bytes (61.96 KiB)** against the 90 KiB gzip
ceiling, with 28,708 bytes (28.04 KiB) headroom. Hashed filenames are the
manifest emitted by the current production build; rerun the command after any
bundle change to regenerate both names and sizes.

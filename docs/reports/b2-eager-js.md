# B2 — /features/ eager-JS budget report

**Gate:** eager JavaScript ≤ 90 KB gzip (TECH-PLAN budget, applied to the new
page per the B2 brief). Measured with `EAGER_JS_PATH=/features/ pnpm exec tsx
scripts/measure-eager-js.ts` against the production preview.

## /features/ — 56.5 KiB gzip total ✅

| Chunk                                       | gzip KiB |
| ------------------------------------------- | -------- |
| gsap                                        | 26.4     |
| scene-reducer (validator + reducer + dom)   | 10.7     |
| install-scene-system (+ landing scene data) | 6.4      |
| scene-controller                            | 5.4      |
| features page script (+ features scenes)    | 4.8      |
| page shell, preload helper, command-pill    | 2.2      |

## Landing (unchanged path) — 70.1 KiB gzip total ✅

The features scene registry is a separate module graph passed to the shared
installer, so the landing bundle does not grow with B2: 70.1 KiB on this
branch vs 70.6 KiB measured on main (chunk-split noise, slightly smaller).
ScrollTrigger accounts for the landing's extra weight; the features page never
loads it — no pin, no stages.

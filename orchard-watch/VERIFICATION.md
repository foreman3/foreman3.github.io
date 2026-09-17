# Orchard Watch verification

Verified September 17, 2026, in local Edge through Playwright. This is a whack-a-mole reaction game, with direct touch/click input and QWE / ASD / ZXC keyboard mapping. Canvas artwork and audio are generated locally; the nine burrows are semantic HTML buttons.

## Challenge curve

| Round | Quota | Seconds | Target exposure | Spawn interval | Gardeners | Baskets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 12 | 35 | 1.80 s | 1.12 s | 0% | 6 |
| 2 | 15 | 38 | 1.70 s | 1.06 s | 10% | 6 |
| 3 | 18 | 42 | 1.55 s | 1.00 s | 14% | 6 |
| 4 | 22 | 45 | 1.35 s | 0.90 s | 18% | 6 |
| 5 | 30 | 42 | 0.90 s | 0.65 s | 27% | 3 |

The opening has no friendly targets. Round 2 introduces recognition with only a small speed increase; round 3 modestly narrows the window. Round 4 permits five lost baskets before failure and refills at the next round. Round 5 combines faster recognition, higher density, and a smaller reserve as the first mastery benchmark.

Browser simulation benchmarks with a 450 ms reaction and 220 ms gap cleared rounds 1–5 in 13.68 / 17.38 / 21.28 / 25.56 / 29.50 simulated seconds. Round 4 deliberately allowed two escapes and still finished with four baskets. A 950 ms response cleared round 4 but failed round 5. These deterministic controller tests establish mechanical timing and recovery margins; they are not human difficulty-study results.

## Checks

- First-load instructions freeze actors and time; session return skips them. Returning mobile launch and rejected fullscreen requests recover correctly.
- All nine keyboard positions, pointer/touch hits, friendly-target penalty, escape penalty, help pause, explicit pause/resume, sound, reset, and shared mobile reset.
- Quota progression, round 4→5, final victory restart, lost-basket game over, and timeout restart.
- 1440×900 desktop, 667×375 / 740×390 / 844×390 landscape, and 390×844 portrait visually inspected. No control/playfield overlap or horizontal overflow. Minimum mobile target dimension: 57 px.
- Desktop frame interval averaged 16.67 ms, p95 16.90 ms; 667×375 mobile emulation averaged 16.66 ms, p95 16.90 ms. Hardware-device performance may differ.
- Game console and arcade JavaScript errors: none. Existing root arcade page reports a blocked external network resource in this environment; its unrelated resource definitions were preserved.
- Registration links and card navigation work. JavaScript syntax and Git whitespace checks pass. Existing game files remain untouched.

## Two post-build refinement passes

1. Replayed opening, later rounds, endings, and mobile layouts. Fixed desktop footer clipping and reset's pause label; made keyboard focus compact; added hit rings and a 240 ms recovery delay after empty swings to discourage indiscriminate tapping. Re-ran the complete browser suite.
2. Re-reviewed the updated experience. Added a cached illustrated orchard sign, moved small-screen callouts away from its title, surfaced score streaks and low-resource warnings, and respected reduced-motion preferences. Re-ran the complete browser suite and visually inspected every required viewport.

## Reproduce

With Playwright available, run `node orchard-watch/verify.cjs` from the repository root. `BROWSER_EXE` can select a Chromium executable; `SHOT_DIR` chooses the screenshot/report output directory. The default output goes to the system temporary directory. The `?test&seed=42` query exposes bounded diagnostics for later-round verification; normal play has no debug controls.

# Orchard Watch verification

Updated September 18, 2026, in local Edge through Playwright. The board is now four columns by three rows, with direct touch/click input and QWER / ASDF / ZXCV keyboard mapping. Backspace resets; M toggles sound. All twelve burrows are semantic HTML buttons. Mobile landscape fills the available width and height below the compact HUD; the renderer repositions the columns without stretching characters, holes, or signage.

## Challenge curve

Per the requested faster escalation, successive rounds introduce groups of one, two, three, four, and five overlapping actors. The first group in every round was measured in-browser and matches those counts.

| Round | Quota | Seconds | Exposure | Group size | Within-group gap | After-group gap | Gardeners | Baskets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 12 | 35 | 1.80 s | 1 | — | 1.95 s | 0% | 6 |
| 2 | 18 | 38 | 1.75 s | 2 | 0.34 s | 1.40 s | 10% | 6 |
| 3 | 24 | 42 | 1.55 s | 3 | 0.25 s | 1.10 s | 14% | 6 |
| 4 | 32 | 45 | 1.35 s | 4 | 0.18 s | 0.75 s | 18% | 6 |
| 5 | 45 | 42 | 0.90 s | 5 | 0.12 s | 0.40 s | 27% | 3 |

The after-group gap varies by ±7%. Round 1 provides isolated targets; round 2 introduces overlapping pairs; round 3 introduces triples; round 4 is a rapid four-target scramble; round 5 sends near-continuous five-target groups. Baskets refill each round.

Browser simulation benchmarks with a 450 ms reaction and 220 ms action gap cleared rounds 1–4 in 22.86 / 17.46 / 16.02 / 14.90 simulated seconds. Round 4 deliberately allowed two escapes and still finished with four baskets. The same controller failed round 5 after 26 hits. A faster 250 ms reaction / 130 ms action-gap controller cleared its 45-hit quota in 10.82 seconds with three baskets. A 950 ms response also cleared round 4 but failed round 5. These establish mechanical timing and recovery margins, not human play-time estimates.

## Checks

- First-load instructions freeze actors and time; session return skips them. Returning mobile launch and rejected fullscreen requests recover correctly.
- All twelve keyboard positions, pointer/touch hits, friendly-target penalty, escape penalty, help pause, explicit pause/resume, sound, reset, and shared mobile reset.
- Quota progression, round 4→5, final victory restart, lost-basket game over, and timeout restart.
- 1440×900 desktop, 667×375 / 740×390 / 844×390 landscape, and 390×844 portrait visually inspected. No control/playfield overlap or horizontal overflow. Landscape now fills the viewport width, with 667x290 / 740x305 / 844x305 playfields. Minimum landscape target height: 66 px; portrait: 48 px. All twelve positions pass touch input after orientation changes.
- Desktop frame interval averaged 16.67 ms, p95 16.90 ms. Hardware-device performance may differ.
- Game console and arcade JavaScript errors: none. Existing root arcade page reports a blocked external network resource in this environment; its unrelated resource definitions were preserved.
- Registration links and card navigation work. JavaScript syntax and Git whitespace checks pass. Existing game files remain untouched.

## Two post-build refinement passes

1. Replayed opening, later rounds, endings, and mobile layouts. Fixed desktop footer clipping and reset's pause label; made keyboard focus compact; added hit rings and a 240 ms recovery delay after empty swings to discourage indiscriminate tapping. Re-ran the complete browser suite.
2. Re-reviewed the updated experience. Added a cached illustrated orchard sign, moved small-screen callouts away from its title, surfaced score streaks and low-resource warnings, and respected reduced-motion preferences. Re-ran the complete browser suite and visually inspected every required viewport.

## Reproduce

With Playwright available, run `node orchard-watch/verify.cjs` from the repository root. `BROWSER_EXE` can select a Chromium executable; `SHOT_DIR` chooses the screenshot/report output directory. The default output goes to the system temporary directory. The `?test&seed=42` query exposes bounded diagnostics for later-round verification; normal play has no debug controls.

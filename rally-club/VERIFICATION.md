# Rally Club verification

Classic Pong/table-tennis concept, absent from the arcade inventory. Self-contained Canvas game with keyboard movement and a direct touch strip. Registered under In Work. No existing game or shared assets modified.

## Final five-court curve

| Court | Ball speed | Opponent speed | Aim error | Player width | Match |
| --- | ---: | ---: | ---: | ---: | --- |
| Warm-up | 310 | 175 | 95 | 165 | First to 3 |
| Steady hand | 335 | 215 | 75 | 165 | First to 5 |
| Angle artist | 350 | 230 | 65 | 165 | First to 5 |
| Counterpuncher | 385 | 275 | 48 | 165 | First to 5 |
| Club champion | 530 | 395 | 18 | 125 | First to 5 |

Court 2 primarily improves return coverage. Court 3 introduces wide randomized angles with only a small speed increase. Court 4 deliberately attacks the open side, retaining the full paddle and four lost-point allowance. Court 5 combines much faster play, tighter paddle coverage, accurate returns and wider attacks. Rally speed rises gradually and caps at 1.65 times starting speed.

A predictive placement controller cleared courts 1–5 in 36/102/68/103/133 simulated seconds. Court 4 started with two deliberately lost points and won 5–2. A reactive controller sampling current ball position every 320 ms won 3–0, 5–0, 5–1, 5–2, then lost 1–5. These are reproducible mechanical benchmarks, not human enjoyment or difficulty studies; angled shots can shorten rallies, so match length is not expected to rise monotonically.

## Iteration

Initial complete build: instruction gating, desktop/touch controls, scoring, spin, five matches, win/loss/retry and registration. Fixed test jumps retaining result overlays and allowed fullscreen layout changes to settle before touch tests.

Whole-game pass 1: reviewed opening and all later matches, endings and desktop/mobile screenshots. Added explicit point-winner feedback and a capped ball trail respecting reduced motion. Moved portrait controls adjacent to the table.

Whole-game pass 2: fresh full review found countershots too central and mastery insufficiently differentiated. Corrected open-side aiming and tuned the champion. Added paddle zone markers, disabled-serve styling and appropriate keyboard focus on final/lost matches. Replayed all five courts and repeated layout/control checks.

## Browser coverage

Run `node rally-club/verify.cjs` with Playwright on NODE_PATH; set SHOT_DIR for outputs. Local HTTP server and installed Edge are used. Diagnostic hooks exist only with `?test`; `?court=1` through `?court=5` allow direct normal-play trials.

Suite checks first-load freeze, keyboard movement/serve/help/pause/reset/sound, real touch hold/slide/release, shared restart, graceful fullscreen refusal, returning sessions, actual paddle collision/miss scoring, all five opponents, fourth-to-fifth progression, loss retry, responsive 1440×900 / 667×375 / 740×390 / 844×390 / 390×844 layouts, no control overlap or horizontal overflow, arcade card navigation, and clean game console. Existing root-page external resource console messages are excluded; root script errors are still checked. Desktop frame p95 was approximately 16.9 ms in local headless testing, not a physical mobile-device benchmark.

Gameplay screenshot and measured report are saved in the automation artifact directory; no generated screenshots are committed.

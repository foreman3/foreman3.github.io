# Alpine Line timed racing verification

Revised 2026-10-01 in response to human feedback: the initial gate-quota game felt slow and its terrain/riders did not create useful racing pressure. The game now qualifies by adjusted race time, with acceleration and braking controlled during play. This user request supersedes the original gate-perfect final-course contract.

## Race rules and controls

Cross the finish with elapsed time plus missed-gate penalties at or below the qualifying time. Every missed gate adds exactly 2 seconds. There is no gate quota, heart elimination, brake reserve, pre-race speed selection, or crossing skier. Rough snow, moguls and on-course obstacles were removed; trees remain scenery outside the piste.

Hold Up/W to accelerate and Down/S/Space to brake. Left/right or A/D steer simultaneously. Mobile retains the shared horizontal precision joystick or direction buttons and adds separate held ACCELERATE/BRAKE actions. Releasing speed controls settles toward normal cruise. Brake takes priority if both are held. Acceleration is +190 logical units/second², braking -310, and neutral cruise recovery 75. Speed ranges from 58% to 152% of each race's cruise speed.

The skier has a heading rather than speed-independent sideways sliding. Turn rate is `2.8 * (260 / speed)^1.25` radians/second, limited to ±0.78 radians. Lateral and downhill velocity come from sine/cosine of heading. Faster turns have wider radii and slower direction changes; braking tightens a turn and buys reaction time, but costs race time. Gate crossing interpolates skier position at the actual crossing to avoid frame-boundary misses. Timing stops at the actual finish line.

## Final courses

| Race | Gates | Cruise → maximum km/h | Gate width | Nominal spacing | Qualify |
| --- | --- | --- | --- | --- | --- |
| 1 — Sunrise qualifier | 12 | 40 → 61 | 230 | 310 | 21.0 s |
| 2 — Club sprint | 18 | 46 → 70 | 220 | 300 | 21.0 s |
| 3 — Ridge challenge | 24 | 51 → 77 | 210 | 285 | 25.0 s |
| 4 — Valley grand prix | 30 | 56 → 85 | 205 | 275 | 28.5 s |
| 5 — Summit cup | 36 | 61 → 92 | 200 | 265 | 38.0 s |
| 6 — Black diamond final | 42 | 67 → 101 | 195 | 255 | 43.0 s |
| 7 — Alpine championship | 48 | 73 → 110 | 190 | 245 | 60.0 s |

Speed, gate width and spacing use logical Canvas coordinates; km/h is the consistent game display conversion. Alternating turns are interspersed with straighter acceleration windows. Linked turns begin in race 3 and use 88% spacing. Later races combine larger lateral transitions, shorter gaps and more gates; widths stay generous enough that challenge comes from speed/turn timing and the clock. Compared with the original build, cruise speed is 50% higher on race 1, and gate count grows to 48 instead of 30 on race 7.

The HUD shows adjusted time, qualification target, speed and gate progress. A pace estimate projects finish time from the current downhill speed; it is an estimate, not a promise about the remaining turns. Miss feedback shows the added penalty. Timeout and finish results break out raw time, penalties and adjusted time. Retry restores the current race's entry score; full reset starts race 1.

## Observed browser curve

All seven real courses were exercised in Chrome using the production simulation and query-gated test hooks. The adaptive controller reads exact state, biases lines toward the next gate, and accelerates/brakes from turn geometry. These are optimistic mechanical benchmarks, not human reaction-time requirements or proof of enjoyment.

| Race | 160 ms adaptive adjusted time | Result | 80 ms adaptive adjusted time | Misses at 80 ms |
| --- | --- | --- | --- | --- |
| 1 | 12.78 s | Qualified | 12.79 s | 0 |
| 2 | 15.54 s | Qualified | 15.53 s | 0 |
| 3 | 20.16 s | Qualified | 19.17 s | 0 |
| 4 | 26.43 s | Qualified | 25.26 s | 0 |
| 5 | 31.48 s | Qualified | 30.33 s | 0 |
| 6 | 38.72 s | Qualified | 37.19 s | 0 |
| 7 | Timed out at 60.02 s, 94% distance | Failed | 57.10 s (47.10 racing + 10 penalty) | 5 |

- Constant cruise with the same 160 ms steering controller qualified only in race 1; it failed 2–7, including clean-gate failures in 2–4. That demonstrates a meaningful reason to accelerate.
- Constant acceleration with the same steering qualified 1–2 but failed 3–7 from accumulated gate penalties. That demonstrates a reason to brake rather than hold maximum speed throughout.
- A slower 420 ms adaptive controller qualified 1–2 and failed 3–7. The 160 ms controller qualified 1–6; the 80 ms controller also qualified 7 with five misses. Controller performance reflects its policy and exact-state access; it is not a human difficulty rating.
- Race 5 deliberately steered outside the first two gate windows, then qualified at 36.64 s against 38.0 s (32.64 racing + 4 penalty), 34/36 gates. No geometry, elapsed time, or penalties were bypassed during this recovery route.
- Race 7's successful five-miss trace proves it does not require perfect gate collection. More gates, faster approach speeds, repeated speed changes and accumulated time pressure provide its challenge.

## Checks completed

- Node parsing for game.js, art.js and verify.cjs; Git whitespace check. Scope limited to alpine-line/ and its Games.md/index.html descriptions.
- Initial instructions freeze timers and input; R preserves the gate; focused Space starts. Session key advanced to v2 so existing players receive the new controls. Returning desktop and mobile fullscreen gates verified, including fullscreen refusal.
- Real keyboard simultaneous steering and acceleration, braking and release, help/pause freeze, sound, reset and paused-help reset.
- Real Chrome CDP multi-touch steering plus acceleration at the same time, brake hold, neutral steering, release/cancel, context-menu suppression, shared Options/button mode and persisted preference, blur input clearing, mobile pause/sound/shared reset.
- Speed/turn coupling: after equal turn input, accelerated race-4 skis had radius 421.33 units and angle .24 rad; braking skis had radius 48.22 and angle .78. Continuous braking reaches minimum speed without any resource limit; neutral release returns to cruise.
- Actual missed-gate penalty, qualifying with a penalty, failing due to penalty, time-out, next-race progression, championship victory, current-race retry with score rollback and full reset.
- Desktop 1440×900, mobile 667×375 / 740×390 / 844×390, portrait 390×844. No overflow or playfield clipping; all four mobile actions stack inside the right rail without covering the slope. Portrait actions remain below the playfield. HUD and pace labels are readable HTML.
- New game console and page errors empty. Arcade card resolves correctly. Existing arcade root blocked Fonts/missing favicon resource warnings preserved; no arcade script errors.
- Cached scenery, native mobile backing resolution/double desktop backing, capped particles and tracks, 60 Hz simulation with 100 ms catch-up cap, blocked-overlay simulation/draw pause, reduced-motion support retained. Final headless active frames: desktop mean/p95 17.61/18.3 ms; touch mobile 17.92/18.5 ms. These are emulated-browser timings, not physical-phone measurements.
- Desktop, all required mobile layouts and active race-5 art visually inspected after the gameplay revision.

## Reproduce and artifacts

Serve the repository on port 8765, configure bundled Playwright in NODE_PATH, and run `node alpine-line/verify.cjs`. ALPINE_BASE_URL and ALPINE_REPORT_DIR override server and output directory. ALPINE_PROBE runs controller traces without the complete verification suite. Production test hooks require `?test=1`; `?level=5` offers an ordinary instruction-gated direct race trial.

Artifacts: `C:/Users/forem/.codex/visualizations/2026/10/01/01a0f60d-3d50-7101-b656-37990e60463a/timed-racing/`. Active screenshot alpine-line-timed-gameplay.png shows race 5, 11.0 seconds adjusted time, 13/36 gates and 61 km/h. verification.json, five viewport captures and the actual-touch screenshot are alongside it. Earlier release artifacts are preserved in the parent directory.

The next useful evidence is human feedback on the speed/turn tradeoff and qualifying times, especially races 3–7. Successful automated controllers do not establish fun.

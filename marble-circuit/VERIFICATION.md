# Marble Circuit — verification, 2026-10-15

Marble Madness-style rolling-ball arcade: accelerate and coast along suspended miniature plaster courses, brake into bends, light three numbered checkpoint beacons in order, and reach a physical checkered finish. A fall retains beacons, costs one marble and three seconds, and respawns at the last checkpoint. Retry restores the course's starting score. Seven distinct routes include diagonals, bumpers, moving sweepers and directional tailwinds. Canvas scenery is cached; HTML provides readable HUD, instructions and semantic controls. No external game assets or libraries.

The user's seven-level difficulty contract supersedes the older level-5 mastery wording in the repository standards and builder skill. All major elements appear by 5; 6 is the first mastery course, and 7 demands nearly perfect routing. No existing game or shared file changed. The only registration changes are one In Work entry in Games.md and one matching card in index.html.

## Observed curve

| Course | Width | Seconds | Marbles | Added demand | Braking / avoidance controller clear |
| --- | ---: | ---: | ---: | --- | ---: |
| 1 First Light | 94 | 65 | 5 | Broad bends; braking and checkpoint introduction | 13.32s |
| 2 Dogleg | 82 | 55 | 5 | Diagonals and more linked bends | 16.71s |
| 3 Pinwheel | 74 | 55 | 5 | Two offset bumpers; choose the open side | 22.10s |
| 4 Pendulum | 68 | 50 | 5 | A moving cross-lane sweeper plus bumper | 20.27s |
| 5 Slipstream | 64 | 49 | 5 | Diagonals, bumper pair, sweeper, two tailwinds | 20.27s |
| 6 Knife Edge | 52 | 35 | 4 | Three bumpers, two faster sweepers, narrow lanes | 27.41s |
| 7 Grand Circuit | 44 | 33 | 3 | Three sweepers, three bumpers, tight time budget | ordinary controller failed; expert cleared in 30.21s |

The ordinary controller makes steering decisions every 220ms and targets 145 units/s. It uses the same acceleration, braking, support checks, hazards and scoring as production. The faster 70ms/160-unit controller cleared every course; course 7 retained 2.79 seconds and no falls, despite five recoverable bumper contacts. Course 7's pressure comes from lanes, timing and clock as well as reduced reserves. An unbraked 320ms controller cleared 1–2, failed 3, cleared 4 with one fall, and failed 5–7. Different geometry and controller weaknesses make clear times and outcomes non-monotonic; these traces do not establish a monotonic human difficulty curve.

Explicit course-5 recovery trial: two deliberate test-hook fall penalties after earned beacons, plus one natural bumper contact; cleared after 21.40 rolling seconds + 6 penalty seconds with three marbles and 21.60 seconds left. Actual physical edge-fall and checkpoint recovery were separately verified. A controller delivering real Chrome keyboard events cleared the whole opening course, including all three beacons and physical finish, in 14.06 simulated seconds without falling.

These are exact-state automated mechanical feasibility checks, not human reaction-time studies or proof of enjoyment. The scripted controllers can read geometry that a human must interpret visually. Human feedback on steering feel and courses 3–7 is the next useful balance evidence.

## Initial version and two fresh improvement passes

The initial complete version cleared all seven courses and passed the whole desktop/mobile suite. Routine baseline work fixed an oversized cached start/finish rim and tightened clocks from excessive early margins while retaining the tested recovery room.

Pass 1 replayed the opening, later courses, endings and required responsive layouts. It added diagonal geometry in courses 2 and 5 for distinct steering, inlaid track joints and studs, a capped motion trail, and a near-edge warning. Repeated all seven course trials, two-fall recovery, touch controls, endings, layouts and console checks.

Pass 2 freshly reviewed that result across the same full experience. It doubled desktop backing resolution, added a speed/brake instrument, suppressed the decorative hit flash for reduced motion, paused simulation in mobile Options, added Review Controls to results with correct return state, and restored canvas keyboard focus on Retry/Next. The expanded suite caught an unreachable test click behind the result modal; the accessible results button replaced it. A real-keyboard opening clear was added to cover the discovered focus problem. Final full suite passed after these fixes. No additional material graphics or gameplay issue was observed in the final visual review.

## Controls, layout and behavior

- First-load session instructions freeze simulation and audio. Keyboard Space dismisses the focused semantic start button. Returning desktop sessions skip instructions; returning touch sessions use the shared fullscreen launch gate. Fullscreen rejection is graceful.
- Arrows/WASD steering, held Space braking, coasting, pause/resume, sound, help freeze, blur release, session reload and in-place reset passed. Results retry, score rollback, Next, timeout, last-marble defeat and final victory/restart passed. Review Controls returns to the result screen; reset cannot bypass initial instructions.
- Chrome CDP touch verified hold, slide, diagonal motion, neutral, release, cancel, simultaneous steering/braking, normalized diagonal direction buttons, context-menu suppression, saved Joystick/Buttons preference, sound, pause and shared restart. Options freezes physics and resumes appropriately.
- Verified every segment's centerline support and all seven layouts; real edge falls, retained checkpoint beacons, collision impulse/invulnerability, tailwind force, braking resistance, deceleration, order-based scoring and physical finish all passed.
- Visually inspected 1440×900 desktop; 667×375, 740×390 and 844×390 touch landscape; and 390×844 portrait rotation prompt. No horizontal overflow, aspect distortion, control/track overlap or out-of-viewport controls. Actions stack vertically in the right rail. Instructions scroll on short screens, with the start button reachable.
- Game console/page errors: none. Root arcade script errors: none. Exactly one matching card under In Work navigates correctly. Existing root font/favicon resources were not changed.
- Measured active course-5 requestAnimationFrame intervals are recorded in verification.json. These are desktop Chrome and touch emulation measurements, not a physical-device performance claim. Simulation uses <=1/120-second substeps and capped catch-up; cached scenery, capped effects and stationary overlay rendering limit cost. Mobile backing stays at logical resolution.

## Reproduction and artifacts

Serve the repository over HTTP on port 8771, make Playwright available through NODE_PATH, then run `node marble-circuit/verify.cjs`. Override MARBLE_BASE_URL, MARBLE_REPORT_DIR and CHROME_PATH as needed. Only `?test=1` exposes simulation hooks; normal pages expose none. `?course=1` through `?course=7` permit ordinary gated later-course trials. The verifier does not teleport the marble during controller clears; deliberate fault injection and isolated mechanics assertions are explicitly separate.

Artifacts: `C:/Users/forem/.codex/visualizations/2026/10/15/01a13e28-0aeb-7bc1-929b-89d3934a20df/` contains verification.json, the active marble-circuit-gameplay.png, seven course captures, three mobile landscape captures and portrait.png. JavaScript syntax checks and `git diff --check` passed. Final fetch matched origin/main before staging. Release proceeds by scoped commit and ordinary push; external notification follows only a successful push.

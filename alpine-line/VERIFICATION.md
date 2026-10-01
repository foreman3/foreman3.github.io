# Alpine Line release verification

Run: 2026-10-01. Classic downhill slalom skiing, new `alpine-line/` directory. Registered under In Work. No existing game or shared file edited; outside the new directory only Games.md and the arcade index were changed.

The user's scheduled seven-course contract supersedes the older five-level mastery wording in the builder skill and game standards. Courses 1–5 teach and combine all mechanics with recovery margin. Course 6 starts mastery; course 7 requires near-perfect gate accuracy.

## Final challenge curve

| Run | Course | Gates needed / total | Speed | Gate width | Nominal spacing | Hearts | New pressure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Sunrise nursery | 6 / 10 | 160 | 230 | 310 | 5 | Wide, readable flag pairs; trees and rocks beside the line |
| 2 | Blue traverse | 9 / 13 | 185 | 210 | 305 | 5 | Blue rough snow reduces steering grip |
| 3 | Mogul meadow | 12 / 16 | 210 | 190 | 300 | 5 | Moguls slow the skier without costing a heart |
| 4 | Club crossing | 16 / 21 | 235 | 175 | 290 | 5 | Moving riders with visible direction arrows |
| 5 | Summit switchbacks | 20 / 26 | 260 | 160 | 280 | 5 | Linked turns use 80% spacing; all mechanics combined |
| 6 | Black diamond | 25 / 28 | 320 | 130 | 245 | 4 | Faster transitions and tighter recovery planning |
| 7 | Perfect descent | 29 / 30 | 360 | 112 | 230 | 3 | Only one gate miss allowed; precise, brake-aware routing |

Coordinates and speeds are logical pixels and pixels/second. The brake reduces downhill speed to 57%, spends 19% reserve/second and restores 10%/second after release. An exhausted held brake does not recharge or pulse. Trees, rocks and riders have forgiving trunk/body hit boxes. A collision grants 1.7 seconds of protection and 1.1 seconds of slower recovery. Each course refills hearts and brake; failure supports retry at the course's entry score. Missing too many gates ends an unwinnable attempt immediately.

## Browser route observations

All seven actual courses were exercised in Chrome through the production simulation using query-gated test hooks. No geometry, movement, collision or gate scoring was bypassed during route clears. The faster controller reads exact state, selects safe lines every 180 ms, predicts crossing riders, and brakes when needed. It is an optimistic mechanical benchmark, not a human play study.

| Run | Faster controller gates | Hearts left | Time, simulated seconds | Brake decisions |
| --- | --- | --- | --- | --- |
| 1 | 10 / 10 | 5 | 23.5 | 0 |
| 2 | 13 / 13 | 5 | 25.0 | 0 |
| 3 | 16 / 16 | 5 | 26.0 | 0 |
| 4 | 21 / 21 | 4 | 30.0 | 0 |
| 5 | 26 / 26 | 4 | 31.8 | 9 |
| 6 | 28 / 28 | 1 | 27.9 | 43 |
| 7 | 29 / 30 | 3 | 25.6 | 60 |

A simpler 420 ms gate-following controller, with no avoidance or braking, cleared 1–5 with 5/4/2/5/2 hearts. It failed 6 after four missed gates and failed 7 after two misses. Its different collision counts across the seeded courses do not establish monotonically increasing human difficulty. Increasing speed, narrowing gates, terrain, crossing traffic and linked turns establish the designed progression; human feedback remains the best evidence for fun and perceived difficulty.

The explicit course-5 recovery test physically steered outside its first three gates, applied two test-hook collision penalties before the route, then cleared 23/26 gates with three hearts in 32.7 seconds. This confirms gate and heart recovery margin rather than requiring perfection. Level 7's successful trace used its one permitted gate miss.

## Implementation and two additional reviews

The initial functional build passed the complete browser suite after fixing a portrait touch-control overlap caused by the shared helper's stronger inset rule.

1. First whole-game improvement pass reviewed opening, all later courses, endings, restart, keyboard, touch and every required layout. Added current-course retry with score rollback, release-to-recharge behavior for exhausted brakes, early feedback when gate quota is no longer achievable, larger mobile gate numbers and hazard labels, and visible double chevrons for linked turns. Re-ran all checks and reviewed screenshots.
2. Fresh second whole-game improvement pass reviewed the first pass's result. Fixed resolution/label redraw on rotation while paused or test-frozen, added an accessible finish-progress strip, direction arrows for crossing riders and carving snow spray, allowed native keyboard scrolling/Space activation in dialogs, and enabled sound on returning-session keyboard/joystick gestures. Replayed all courses and endings, retested controls and responsive layouts, and reviewed final desktop/mobile images.

## Verification performed

- Node parsing for game.js, art.js and verify.cjs; Git whitespace check.
- First-session instruction freeze; resetting while instructions are open preserves the gate; keyboard Space starts from the focused instruction button; returning desktop and mobile sessions.
- Desktop Arrow/Space steering and braking, help freeze and return, P pause, R reset, M sound; restart from paused help and failure/finish overlays. Keyboard alternatives are mapped alongside arrow controls.
- Actual Chrome CDP touch joystick hold, slide right-to-left, neutral return, release and cancel; context-menu suppression; horizontal button mode through shared Options and persistence after reload.
- Actual touch brake hold/cancel, pause/resume, sound, and shared mobile restart. Blur clears inputs and pauses. Fullscreen refusal still launches correctly after viewport settling.
- Rough-snow steering response, mogul slowdown, moving rider behavior, linked gates, forgiving tree collision, protection, gate scoring, reserve regeneration, exhaustion and release recovery.
- Course progression, seven-course victory, zero-heart failure, quota failure, retry score rollback and all-run reset.
- 1440×900 desktop; 667×375, 740×390 and 844×390 mobile landscape; 390×844 portrait. No horizontal overflow, playfield clipping, or control overlap. Landscape actions stack vertically in the right rail; portrait controls sit below the playfield. Mobile HUD text is HTML and stays readable independently of Canvas scale.
- Clean new-game console and page-error logs. Arcade card resolves to the game. Existing root Google Fonts denied by the test environment and missing root favicon resource warnings were observed and preserved; no arcade script errors.
- Fixed 60 Hz simulation with 100 ms catch-up cap, cached background, capped particles/tracks, native mobile backing size and double-resolution desktop. Blocked overlays stop simulation and repeated scene drawing. Reduced-motion users omit tracks, spray and particles, and flags remain static.
- Final active-play frame measurements in headless desktop Chrome: desktop mean 17.56 ms / p95 18.3 ms; touch mobile mean 17.92 ms / p95 18.6 ms. Emulated browser timing is not a physical-phone benchmark.

## Reproduce and artifacts

Serve the repository on port 8765. With the bundled Playwright dependencies in NODE_PATH, run `node alpine-line/verify.cjs`. ALPINE_BASE_URL and ALPINE_REPORT_DIR can override the local server and artifact destination. Test hooks exist only with `?test=1`; `?level=5` allows an ordinary instruction-gated direct course trial.

Artifacts are in `C:/Users/forem/.codex/visualizations/2026/10/01/01a0f60d-3d50-7101-b656-37990e60463a/`: verification.json, desktop active course-5 screenshot alpine-line-gameplay.png (10 gates scored, five hearts, approaching gate 11), all five viewport captures, and an actual-touch capture.

Before publication: fetch origin, check safe branch alignment, stage only this directory and the two registration files, and push without history rewriting. Email notification follows a successful push and includes the active-gameplay screenshot.

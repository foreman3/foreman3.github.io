# Pocket Lanes — ten-frame rebuild

Agent Yoda, 2026-11-19 (local). This rebuild replaces the former seven-league game.

## What changed

One complete ten-frame game, standard ten-pin scoring and the usual tenth-frame bonus balls. There are no league targets, unlocks or progression levels. A new game selects Easy, Medium or Hard lane complexity and an initial ball. Players may change balls between rolls, adjust starting position, aim and speed, and choose left/right-handed hook.

The four balls are Straight (plastic), Gentle Curve (smooth arc), Strong Hook (strong continuous reaction), and Late Snap (delayed, sharp back-end reaction). Their friction responses are separate physical profiles. Speed changes the time available to grip and turn. Pins use bounded arcade impulse/carry physics with animated three-dimensional falls; this is not a full rigid-body bowling simulator.

## Hidden lane conditions

Every new game uses a fresh random seed to generate one oil distribution. That distribution stays unchanged throughout all ten frames. Easy uses forgiving center-heavy house conditions; Medium broadens length, crown and offset variation; Hard includes flatter sport-style conditions, greater asymmetry, longer/shorter patterns and stronger local variation.

Oil controls sliding versus grip at the ball's current lane position. No oil tint, heat map, breakpoint, boundary, pattern name or predicted hook path is shown. The brass ring marks the fixed aim focus; a smaller bright ring and a timing bar show the live release angle around that focus. The bowling hall itself is identical across random patterns. A browser check compares two seeded lanes at the same initial launched-ball position and confirms identical canvas images before any travel. The moving aim may have a different phase, but it reveals no oil information.

## Blender assets and rendering

All visible scene meshes and ball portraits were authored/exported in Blender 5.2.3 LTS: three lanes, UV-mapped maple surfaces, concave gutters, approach marks, pinsetter hoods, brass rails, felt walls, benches, lights, text signage, the ball-return rack, ten lathed striped pins, four pearl-swirled balls with boolean finger wells, and the aiming ring. HTML provides the scorecard and accessible controls.

Editable source: `assets/pocket-lanes.blend`. Rebuild with:

    "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python pocket-lanes/assets/build_scene.py

The script produces packed maple artwork, the full GLB, a self-contained `scene.json` containing the same GLB bytes, and four transparent rendered ball portraits. Runtime loads the JSON envelope so the existing offline collector can discover the model data without a shared script change. The GLB and .blend remain editable/downloadable sources. Three.js 0.180.0 and its GLTFLoader/BufferGeometryUtils are vendored locally with their MIT license; gameplay has no CDN dependency.

A live perspective camera follows the ball toward the pin deck and returns to the approach for the next shot. Reduced-motion preference keeps the camera stationary. Shadows, physically based materials and warm/cool lighting provide depth. Static scene meshes are merged by material. The active scene uses about 39 render calls, 103,000 triangles and 20 geometries; the mobile profile caps pixel ratio at 1 and uses smaller shadow maps.

## Verification

`engine.test.cjs` covers perfect 300, all-five-pin-spare 150, nine/miss 90, gutters 0, tenth-frame 0/10/10 = 20, and X/X/7 = 27. Each fixture checks both scoring and actual frame/rack transitions. It also checks pending strike bonuses, spare/strike marks, 40 random patterns per complexity, bounds and determinism, four distinct measured trajectories, seed-dependent hook differences and 90 seeded random complete games with finite physics and scores within 0–300.

`verify.cjs` bowls three complete physical games through browser controls using one unchanged coarse policy: Easy 181, Medium 158 and Hard 185 for seed 23. All four ball types, strikes, spare recovery and tenth-frame fills are exercised. Across 24 further seeds per complexity, the same policy averages 204 / 205 / 192, with ranges 164–264 / 141–264 / 146–243. These are mechanical regression results, not human difficulty or enjoyment measurements; a favorable random Medium pattern can be easier for a particular line than an Easy pattern.

The browser suite also checks instruction/setup gates, actual equipment/difficulty selection, hidden oil, keyboard controls, exact help freeze, sound, hand reversal, scorecard review, new-game/reset/cancel, touch aiming/capture/slide/cancel, native speed sliders, captured Roll activation, fullscreen refusal, returning mobile launch, ten score cells, no horizontal overflow or control overlap, and a normal-page realtime roll without test hooks.

Reviewed sizes: 1440×900, 667×375, 740×390, 844×390 and 390×844. Mobile controls keep 44-pixel targets outside the lane and scorecard. Portrait uses a natural grid so controls cannot cover the status strip; small portrait screens can scroll. Short landscape rails fit without scrolling the header away.

`focused.cjs` checks range-key shortcuts, preserving a game when cancelling setup, 3D ray-based mouse aiming, blur/input release, modal focus loop, desktop flyout, realtime mouse-only opening, camera freeze while paused, pointer cancellation/outside release on Roll, mobile sound, storage denial and canonical arcade-card navigation. All console/page-error checks pass. The normal page exposes no test API; deterministic hooks exist only on `?test` and omit oil distribution data.

Fresh isolated Chrome checks measured 17.68 ms mean / 18.3 ms p95 / 18.5 ms maximum during fast aim animation and 17.62 / 18.4 / 18.6 ms while rolling. The full multi-context suite also observed one 477 ms scheduling stall (p95 remained 18.3 ms). This is a desktop/headless emulation measurement; physical-phone performance and human bowling feel remain unmeasured.

## Reproduce

Run `node pocket-lanes/engine.test.cjs`. Serve the repository with `node pocket-lanes/serve.cjs` (localhost port 8784). Put an installed Playwright package on `NODE_PATH`, then run `node pocket-lanes/verify.cjs <absolute evidence directory>` and `node pocket-lanes/focused.cjs <absolute evidence directory>`. `release-check.cjs` measures isolated ready/rolling timing and captures the release guide. `LANES_URL` can select the published origin. `pilot.cjs` prints the physical full-game routes; `layout.cjs` captures the five responsive layouts.

Unrelated Flappy changes and existing offline inventory edits are preserved. For the size revision, the updated repository standard is satisfied by regenerating sidebar/offline outputs from a clean release snapshot containing only the intended Pocket Lanes changes. The generated release inventory is checked in that snapshot; unrelated worktree edits are not included or overwritten.


## Wider rack and timed release follow-up

The pin-center spacing is now 76 lane units instead of 35, with a 33-unit row pitch. The outside edges of the back-row pin bodies occupy about 85% of the usable lane, leaving clearance to both gutters. The Blender source/export and simulation agree. Fallen-pin contact reach grows from 28 to 36 units as a pin tips, preserving physical strike carry across the wider rack without enlarging the standing-pin hit boxes or changing ball mass. A measured strike remains possible.

FOCUS sets a fixed center direction. The visible release cursor oscillates around that focus with a smooth speed trade-off: at minimum speed, ±0.34° over a 4.55-second cycle; at maximum speed, ±4.35° over a 1.06-second cycle. The sweep phase runs continuously through unpaused play and is never reset by a new rack. ROLL captures the displayed angle on pointer release or Space keydown; it does not steer the ball after launch. Help, setup and hidden-page pause freeze both phase and marker. The timing bar remains visible under reduced-motion preference because this motion is gameplay information.

New tests check stable focus, speed-dependent sweep width/rate, exact mouse/touch/keyboard capture, latched ball direction, pause gating, gutter clearance, strike feasibility and timing-dependent pinfall. Twelve otherwise identical fast shots released at 0.1-second intervals knock down 9/9/4/4/9/6/4/1/2/2/2/6 pins. The same preset no longer guarantees repeated strikes. Full ten-frame scoring and hidden oil are preserved.


## 30% larger actors follow-up

All ten pin centers retain their 76-unit horizontal and 33-unit row pitch. Every Blender pin and all four bowling-ball models are uniformly scaled to 1.3. Lane geometry, camera, aim focus/sweep, oil and ball reaction profiles are unchanged. Standing pins remain clear of the gutters. The ball stays seated on the lane and fallen-pin contact height follows its larger geometry. Collision radii and ball rotation radius use the same 1.3 scale; no mass, launch-speed or timing changes were introduced. The ball-rack centers retain their horizontal spacing, with a small height correction for the larger radius. Ball-selection portraits remain unchanged.

Verified all exported pin translations are byte-identical in value to the previous release, and all actor scale vectors are 1.3. Standard scoring fixtures, 90 random games, release capture and complete browser games pass. The same preset no longer has the earlier pinfall values because the contact surfaces are now larger; the current timing sample yields 10/10/6/6/10/10/6/9/3/6/6/10 pins.


## Compact opening, handedness and stronger timing penalty

Agent Yoda, 2026-11-20 (UTC). Intro copy is reduced to two short paragraphs and a compact keyboard reference, with its primary button above the instructions. Setup places Start beside the heading, keeps lane options in one row, and exposes ball and bowling hand together. Both opening cards fit without scrolling at 1440×900, 667×375, 740×390, 844×390 and 390×844. Same-session returns skip the intro after the existing mobile fullscreen launch gate; new games still require an intentional Start.

The explicit Right handed / Left handed setup selector reverses every ball's hook. Right hooks left, Left hooks right. The in-game hand button and H shortcut continue to switch between rolls. The chosen hand is remembered locally and reused for the next game; unavailable browser storage remains a supported fallback.

Meter width, sweep frequency, focus, lane geometry and the 1.3 actor scale are unchanged. The captured release angle is now focus plus twice the meter's timing offset. The bright lane ring previews that actual launch direction. A centered release keeps the chosen line; timing errors grow continuously without a hidden random penalty or forced gutter threshold. Maximum-speed release-angle deviation is now ±8.71°, and minimum-speed deviation is ±0.69°.

The engine suite checks all four mirrored reactions on symmetric oil, doubled release steering, exact center capture, scoring and 90 complete random games. On one fixed Easy line at maximum speed, centered timing knocked down 10 pins, a small timing miss knocked down 6 without a gutter, and the wide miss guttered before the rack for 0. Twelve otherwise identical fast releases now produce 10/6/3/1/6/10/9/1/0/1/6/10. These supersede prior release-timing samples.

`opening.cjs` captures both opening cards at all five sizes, bowls actual setup-selected left and right hooks, checks hand persistence, cancel behavior, paused repeat launch and clean console. Run alongside `engine.test.cjs`, `focused.cjs`, `verify.cjs` and `release-check.cjs` using the documented local server and Playwright environment.


All browser suites passed with no console/page errors. The unchanged coarse shot policy now scores 123 / 143 / 155 on seed 23 for Easy / Medium / Hard respectively; these are the current full-game regression values after doubling timing impact. Isolated Chrome timing measured 17.68 ms mean / 18.3 ms p95 during maximum-speed ready animation and 17.67 / 18.3 ms while rolling. The multi-context suite recorded one 463 ms scheduling stall with p95 18.4 ms. Physical-phone performance remains unmeasured. The refreshed `gameplay.png` shows an actual rolling shot at pin impact.

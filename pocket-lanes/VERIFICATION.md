# Pocket Lanes — ten-frame rebuild

Agent Yoda, 2026-11-19 (local). This rebuild replaces the former seven-league game.

## What changed

One complete ten-frame game, standard ten-pin scoring and the usual tenth-frame bonus balls. There are no league targets, unlocks, timed releases or progression levels. A new game selects Easy, Medium or Hard lane complexity and an initial ball. Players may change balls between rolls, adjust starting position, aim and speed, and choose left/right-handed hook.

The four balls are Straight (plastic), Gentle Curve (smooth arc), Strong Hook (strong continuous reaction), and Late Snap (delayed, sharp back-end reaction). Their friction responses are separate physical profiles. Speed changes the time available to grip and turn. Pins use bounded arcade impulse/carry physics with animated three-dimensional falls; this is not a full rigid-body bowling simulator.

## Hidden lane conditions

Every new game uses a fresh random seed to generate one oil distribution. That distribution stays unchanged throughout all ten frames. Easy uses forgiving center-heavy house conditions; Medium broadens length, crown and offset variation; Hard includes flatter sport-style conditions, greater asymmetry, longer/shorter patterns and stronger local variation.

Oil controls sliding versus grip at the ball's current lane position. No oil tint, heat map, breakpoint, boundary, pattern name or predicted hook path is shown. The brass aiming ring shows only the initial direction. The bowling hall itself is identical across random patterns. A browser check compares the actual canvas images for two different seeds and confirms exact equality before the shot.

## Blender assets and rendering

All visible scene meshes and ball portraits were authored/exported in Blender 5.2.3 LTS: three lanes, UV-mapped maple surfaces, concave gutters, approach marks, pinsetter hoods, brass rails, felt walls, benches, lights, text signage, the ball-return rack, ten lathed striped pins, four pearl-swirled balls with boolean finger wells, and the aiming ring. HTML provides the scorecard and accessible controls.

Editable source: `assets/pocket-lanes.blend`. Rebuild with:

    "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python pocket-lanes/assets/build_scene.py

The script produces packed maple artwork, the full GLB, a self-contained `scene.json` containing the same GLB bytes, and four transparent rendered ball portraits. Runtime loads the JSON envelope so the existing offline collector can discover the model data without a shared script change. The GLB and .blend remain editable/downloadable sources. Three.js 0.180.0 and its GLTFLoader/BufferGeometryUtils are vendored locally with their MIT license; gameplay has no CDN dependency.

A live perspective camera follows the ball toward the pin deck and returns to the approach for the next shot. Reduced-motion preference keeps the camera stationary. Shadows, physically based materials and warm/cool lighting provide depth. Static scene meshes are merged by material. The active scene uses about 38 render calls, 103,000 triangles and 20 geometries; the mobile profile caps pixel ratio at 1 and uses smaller shadow maps.

## Verification

`engine.test.cjs` covers perfect 300, all-five-pin-spare 150, nine/miss 90, gutters 0, tenth-frame 0/10/10 = 20, and X/X/7 = 27. Each fixture checks both scoring and actual frame/rack transitions. It also checks pending strike bonuses, spare/strike marks, 40 random patterns per complexity, bounds and determinism, four distinct measured trajectories, seed-dependent hook differences and 90 seeded random complete games with finite physics and scores within 0–300.

`verify.cjs` bowls three complete physical games through browser controls using one unchanged coarse policy: Easy 258, Medium 300 and Hard 246 for seed 23. All four ball types, strikes, spare recovery and tenth-frame fills are exercised. Across 24 further seeds per complexity, the same policy averages 270 / 259 / 240, with ranges 208–300 / 228–300 / 190–300. These are mechanical regression results, not human difficulty or enjoyment measurements; a favorable random Medium pattern can be easier for a particular line than an Easy pattern.

The browser suite also checks instruction/setup gates, actual equipment/difficulty selection, hidden oil, keyboard controls, exact help freeze, sound, hand reversal, scorecard review, new-game/reset/cancel, touch aiming/capture/slide/cancel, native speed sliders, captured Roll activation, fullscreen refusal, returning mobile launch, ten score cells, no horizontal overflow or control overlap, and a normal-page realtime roll without test hooks.

Reviewed sizes: 1440×900, 667×375, 740×390, 844×390 and 390×844. Mobile controls keep 44-pixel targets outside the lane and scorecard. Portrait uses a natural grid so controls cannot cover the status strip; small portrait screens can scroll. Short landscape rails fit without scrolling the header away.

`focused.cjs` checks range-key shortcuts, preserving a game when cancelling setup, 3D ray-based mouse aiming, blur/input release, modal focus loop, desktop flyout, realtime mouse-only opening, camera freeze while paused, pointer cancellation/outside release on Roll, mobile sound, storage denial and canonical arcade-card navigation. All console/page-error checks pass. The normal page exposes no test API; deterministic hooks exist only on `?test` and omit oil distribution data.

Final local Chrome timing is approximately 18 ms per frame (p95 about 18.5 ms) during active play. This is a desktop/headless emulation measurement; physical-phone performance and human bowling feel remain unmeasured.

## Reproduce

Run `node pocket-lanes/engine.test.cjs`. Serve the repository with `node pocket-lanes/serve.cjs` (localhost port 8784). Put an installed Playwright package on `NODE_PATH`, then run `node pocket-lanes/verify.cjs <absolute evidence directory>` and `node pocket-lanes/focused.cjs <absolute evidence directory>`. `LANES_URL` can select the published origin. `pilot.cjs` prints the physical full-game routes; `layout.cjs` captures the five responsive layouts.

The rebuild preserved unrelated Flappy changes, their QA files and existing offline inventory edits. Only Pocket Lanes and its own canonical registration descriptions belong to this change. Shared offline/sidebar refresh remains outside the explicitly retained scope; the online game loads its own local runtime and scene assets normally.

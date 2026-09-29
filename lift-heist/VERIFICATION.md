# Lift Heist verification — 2026-09-29

Lift Heist is an Elevator Action–style office escape. Walk to the two lifts, change floors, collect every red file, stun guards or intercept close shots, crouch under bullets, and reach the ground exit. It uses a self-contained Canvas scene and the shared VibeCade flyout, fullscreen, and cardinal joystick helpers.

## Seven-shift curve

| Shift | Files | Guards | Cameras | Armored guards | Hearts | Seconds | Route result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 2 | 1 | 0 | 0 | 5 | 110 | Cleared in 12.1s, no hits |
| 2 | 2 | 2 | 0 | 0 | 5 | 105 | Cleared in 12.1s, no hits |
| 3 | 3 | 3 | 1 | 0 | 5 | 100 | Cleared in 11.6s, one hit |
| 4 | 3 | 4 | 1 | 1 | 5 | 96 | Cleared in 11.6s, one hit |
| 5 | 4 | 5 | 2 | 2 | 5 | 92 | Cleared in 19.0s, three hearts left |
| 6 | 4 | 6 | 2 | 3 | 4 | 83 | Cleared in 19.0s, one heart left |
| 7 | 5 | 7 | 3 | 4 | 3 | 76 | Simple held-fire route lost after three hits; timed crouch route cleared in 19.6s with one heart left |

All threats are introduced by shift 5. A separate shift-5 run began after two forced hits and still cleared with three hearts. Shift 6 is the first route in which the basic controller finished on its final heart. Shift 7 requires reacting to bullets; its three hearts allow two errors. These deterministic browser routes establish mechanical clearability and relative pressure, not human difficulty or enjoyment ratings.

## Browser checks

- `node --check` passed for both JavaScript files; `node lift-heist/verify.cjs` passed against a local HTTP server.
- First-session instructions froze gameplay. Returning in the same browser tab skipped the instructions. Help, pause, sound, reset, result progression, final restart, and the arcade card link passed.
- Keyboard movement and actual touch joystick, button mode, stun, crouch, and shared mobile restart passed. The first mobile fullscreen handoff completed before touch play.
- Checked 1440×900 desktop, 667×375, 740×390, 844×390 mobile landscape, and 390×844 portrait. No playfield clipping, horizontal overflow, or landscape rail overlap was observed.
- Game page console had no errors. The pre-existing arcade page requested blocked external Google Fonts and a missing `/favicon.ico` from the local server; its new card and game link loaded.
- Active desktop frame timing: 17.67ms mean, 18.2ms p95 over 120 frames. This is a local headless Chrome measurement.

Active shift-5 screenshot: `C:/Users/forem/.codex/visualizations/2026/09/29/01a0ebc0-bfc3-7332-af64-7f522a3654b6/lift-heist-gameplay.png`. Mobile capture: `C:/Users/forem/.codex/visualizations/2026/09/29/01a0ebc0-bfc3-7332-af64-7f522a3654b6/lift-heist-mobile.png`.

## Graphics revision — 2026-09-29

- Replaced the primitive renderer with a cached office cutaway: furnished departments, city windows, overhead lighting, paneled walls, brass lifts and animated doors. New outlined agents, guards, armor, walking poses, crouching, stun stars, dossiers, pulse effects and camera lighting make actors and objectives distinct.
- Added a brass and glass HUD, smaller footer status messages, and compact landscape instructions. Desktop uses a double-resolution canvas; mobile uses native resolution. The static scene is cached, blocked gameplay stops redraw work, and decorative motion respects reduced-motion preferences.
- Full browser suite passed after the renderer change with unchanged seven-shift outcomes, controls, restart, layout checks and clean game console. Active frame p95 was 16.8ms desktop and 16.9ms at 667x375 touch mobile. Immediate mobile Start click passed after compacting the instruction card. Desktop and mobile screenshots were visually reviewed.

# Prism Panic

A self-contained Pang/Buster Bros.-style bubble splitter in a stained-glass conservatory. Move with Left/Right or A/D, hold Space to fire up to two ceiling threads, R to restart, M for sound, and ? or Escape for paused instructions. Touch uses the shared precision horizontal joystick (or its saved Buttons mode), Thread, sound, and Reset. Portrait requests landscape.

Every large orb splits into two medium orbs, each of which splits into two small orbs. Small orbs disappear on a hit. Each room refills hearts; damage grants three seconds of shielding and pushes nearby danger upward. Consecutive pops within 2.2 seconds earn a multiplier capped at five. Clear bonuses reward remaining time and hearts.

| Room | Initial orbs | Horizontal speed | Time | Hearts | Total splits |
| --- | --- | --- | --- | --- | --- |
| 1: Morning light | 1 large | 100 | 85 s | 4 | 7 |
| 2: Rose gallery | 1 large, 1 medium | 108 | 90 s | 4 | 10 |
| 3: Fern arcade | 2 large | 116 | 95 s | 4 | 14 |
| 4: Crystal hall | 2 large, 1 medium | 130 | 100 s | 4 | 17 |
| 5: The crown room | 4 large | 168 | 75 s | 2 | 28 |

Small orbs move 10% faster. Bounce heights, collision forgiveness, player speed, thread timing, and damage shielding remain consistent across rooms. Rooms 2 and 3 add modest speed and split workload, with extra time. Room 5 is the first combined density, speed, and resource test.

## Verification

Run `node prism-panic/verify.cjs` with Playwright available in `NODE_PATH` and Microsoft Edge installed. Set `PRISM_SCREENSHOTS` to the desired screenshot directory. The script serves the repository over loopback and closes its server and browser afterward. Add `?test` to expose bounded test diagnostics; `?level=1` through `?level=5` chooses an opening room without skipping instructions.

The September 10, 2026 release was checked with desktop keyboard and mobile pointer input, instruction freeze, help/resume, sound, shared restart and control preference, fullscreen-refusal fallback, all five rooms, collisions, scoring, room transitions, victory and loss restarts, arcade registration, and 1440×900, 667×375, 740×390, 844×390, and portrait 390×844 layouts.

Deterministic browser movement benchmarks cleared rooms 1, 2, and 3 in approximately 22, 28, and 27 seconds with three hearts left. Room 4 cleared in approximately 17 seconds with three hearts left after an injected mistake. Standing still failed rooms 2 and 4, so movement remains necessary. Room 5 defeated the same simple reactive controller; a more predictive controller cleared its 28 splits in approximately 18 seconds with one heart remaining. These exercise real simulation and input paths; they are automated balance checks rather than human completion-time estimates.

Two improvement passes followed the functional build. Pass one added a readable HTML mobile HUD, reduced backdrop competition, and strengthened room 5 after it proved too similar to room 4. Pass two added glass rosettes and stronger landing/player shadows, stopped repeated drawing behind blocking overlays, and guarded against a same-frame collision overriding game over. Both passes rechecked desktop/mobile presentation and full progression/restart flows.

The new game is dependency-free beyond existing shared arcade scripts and has a clean browser console. Arcade-card navigation passes; the existing root page emits a sandbox-blocked Google Fonts request and a missing favicon response, which this game's verification records separately. No existing game or shared file was changed.

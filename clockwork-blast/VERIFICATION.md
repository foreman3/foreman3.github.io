# Clockwork Blast verification

Verified 2026-09-30 in Chrome through Playwright, served from the repository at http://127.0.0.1:8765. Exactly one new game directory, `clockwork-blast/`; registration changes only in Games.md and index.html. No existing game or shared file changed.

## Game and difficulty

Bomberman-style tactical maze action with winding cross-blast charges, destructible crates, collectible score gears, chain reactions, automatic charge kicking, fast robots, two-hit armor, limited shields, and a physical exit after all robots are disabled. Cached illustrated Canvas scenery and painted tin-toy actors; HTML HUD and modal controls. One-hit damage grants 2.5 seconds of cover and briefly stuns adjacent robots. Rooms refill hearts and shields. Player movement is one cell per 135 ms; at most two charges are active. All major elements appear by room 5.

The user's seven-room curve overrides the older documents' level-5 mastery wording.

| Room | Robots | Normal seconds/cell | Chase chance | Express / armored | Fuse | Hearts / shields | Clock | Main addition |
| --- | ---: | ---: | ---: | --- | ---: | --- | ---: | --- |
| 1 | 2 | .95 | .20 | 0 / 0 | 2.20 s | 5 / 2 | 110 s | Learn a short cross and retreat behind pillars |
| 2 | 3 | .82 | .23 | 0 / 0 | 2.20 s | 5 / 2 | 110 s | Range increases from 2 to 3; chain timing |
| 3 | 4 | .73 | .28 | 0 / 0 | 2.20 s | 5 / 2 | 110 s | Kick charges down open lanes |
| 4 | 5 | .66 | .34 | 1 / 0 | 2.20 s | 5 / 2 | 105 s | Express robot, 30% faster |
| 5 | 6 | .59 | .40 | 1 / 2 | 2.20 s | 5 / 2 | 100 s | Two-hit armor, with recovery resources intact |
| 6 | 8 | .40 | .62 | 3 / 3 | 1.85 s | 4 / 1 | 85 s | First combined mastery benchmark |
| 7 | 9 | .38 | .75 | 3 / 4 | 1.60 s | 3 / 0 | 72 s | Near-perfection routing and charge placement |

## Observed browser curve

The reproducible controller uses real game simulation and directional input, with exact test-only enemy/bomb state. It does not grant immunity, teleport, remove enemies, or bypass collisions to clear rooms. These are optimistic mechanical benchmarks, not human enjoyment, reaction-time, or difficulty-study results. Enemy routes depend on timing; faster decision intervals do not guarantee better outcomes.

An ordinary greedy planner deciding every 350 ms cleared rooms 1–5 in 9.5 / 17.2 / 19.9 / 27.5 / 26.1 simulated seconds, with 4 / 4 / 4 / 2 / 2 hearts. The same policy failed 6 and 7. A faster greedy policy cleared 1–4 but failed 5, showing that careless pursuit is not sufficient merely because input is fast. Room 5 has a stronger armor/timing challenge than 4, but retains five hearts and two shields.

A retreat-aware policy deciding every 150 ms cleared room 6 in 32.6 seconds with two hearts and room 7 in 27.4 seconds with one heart, no shield. The same retreat-aware policy at 350 ms cleared room 5 after two intentionally deducted hearts: 42.4 seconds, one heart remaining, after two additional natural collisions. That verifies a four-miss recovery margin on room 5 rather than requiring perfect execution. Room 7 allows two hits across nine robots, four of which require two blasts, and is substantially less forgiving.

## Build and two whole-game improvement passes

Initial functional build included all seven rooms, complete clear/failure/restart loops, desktop and mobile controls, and the workshop artwork. Browser review covered the opening, all later rooms, both endings, and every required viewport.

Pass 1 independently examined gameplay and graphics across that experience. Shortened the apprentice room from three robots to two and tuned the intermediate ramp; added useful adjacent-robot stun on damage; separated cosmetic randomness from enemy routing; fixed portrait controls overlapping the board. Improved blast art into bursting stars, express robots with a lightning insignia, and stun feedback. Replayed the curve and reviewed desktop, landscape, and portrait captures.

Pass 2 freshly reviewed the first pass's result, including later challenge and both restart paths. Prevented robot tile stacking so threats remain individually readable; tuned room 7's patrol speed alongside the added density and armor; corrected reset from paused help; respected reduced-motion preferences for particles and actor bobbing; preserved native Space/Enter activation on semantic buttons. Actual touch tests uncovered and corrected joystick initialization. Reviewed countdowns, armor/express distinctions, wood/metal contrast, portrait spacing, mobile HUD, and full-screen refusal. Further decoration would not materially improve readable tactical play. Re-ran relevant mechanics, all seven room trials, actual touch input, endings, and visual/layout checks after these changes.

## Checks

- Node syntax checks for game.js, art.js, verify.cjs; git diff --check.
- First-session modal freezes timers/enemies; R does not bypass it. Returning desktop session starts correctly. Returning mobile session uses shared fullscreen launch gating.
- Arrow and WASD movement, Space charge, X shield, R reset, P pause, M sound, desktop help freeze/resume, restart while paused help, in-place reset from both victory and timeout.
- Chain reactions, kicking and rolling charge motion, two distinct hits to armor, crate destruction and blast occlusion, shield protection and depletion, actual damage, scoring, physical exit, next-room transition, seven-room completion.
- Chrome CDP touch events: joystick hold, slide to a second cardinal direction, neutral without lifting, release, and context-menu suppression. Shared Options switches to direction buttons; actual touch hold/cancel clears movement. Charge/shield/sound touch buttons and shared restart work. Blur clears input and pauses. Preference persists across reloads. Fullscreen rejection is graceful.
- Inspected 1440×900, 667×375, 740×390, 844×390, and 390×844. No horizontal overflow, board clipping, or control overlap. Landscape actions stack vertically in the right rail; portrait controls sit below the board. Short-screen instruction dismissal was exercised through touch.
- Active desktop frames averaged 16.67 ms, p95 16.9 ms. Mobile frame measurements were around 16.67 ms, p95 17 ms. Cached static scene, capped 100 particles, smaller mobile bursts, native mobile backing resolution, and no repeated blocked-game drawing. Measurements reflect Chrome emulation on this machine, not physical handset profiling.
- New game page has no browser errors. Arcade card is unique under In Work and navigates correctly. Existing arcade root emits blocked external Google Fonts and missing favicon resource errors; its scripts and the new card navigation pass. Those pre-existing resources were preserved under the registration-only scope.

## Evidence and reproduction

Active room-5 screenshot: `C:/Users/forem/.codex/visualizations/2026/09/30/01a0f1be-c3f1-7c33-b90a-5dccfafc0acb/clockwork-blast-gameplay.png` (four robots remain, three hearts, a winding charge, score 450). Required viewport captures, actual-touch capture, and verification.json are beside it.

Run `node clockwork-blast/verify.cjs` with Playwright resolvable through NODE_PATH, Chrome installed at the executable path in the suite, and a repository HTTP server on port 8765. The test-only API is available solely with `?test=1`; `?room=1` through `?room=7` allow normal gated room trials without debug UI.

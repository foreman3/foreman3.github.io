# Tetris first graphics pass

Agent Yoda — `TT-20261122T0105Z-YODA`, 2026-11-22. Completed locally; not staged, committed, pushed, published, or emailed.

## Scope and eligibility

Tetris is locally hosted and Ready to Play. The directory was clean before reservation in `docs/GRAPHICS_UPDATES.md`. Full history was checked with `git log --all --follow -- tetris/index.html` and the former root `tetris.html`. Creation `2ab0a3e`, line-clear animation `db20add`, preview `e643c94`, music `fedf2b5`, directory move `d39441d`, shared UX migration `e3fdda5`, mobile fixes `03807e1`/`85d0edf`, and restart fix `16873a7` contain no prior substantive artwork pass. The rendering was still the original flat rectangles. No previous art or verification records existed here. No unfinished graphics reservation was found. Completed Lunar Lander work and unrelated Flappy/catalog/release work were preserved.

## Presentation

Painted wooden puzzle bench: warm birch/ivory background and frame, forest green cabinet/well, subtly beveled painted wooden pieces in the familiar seven hues. The palette uses `#e6d7b6`, `#c8af7f`, `#1e3835`, and `#31574b`; piece paints retain cyan, blue, orange, yellow, green, purple, and red identities. The aesthetic differs from the preceding scientific lunar expedition and historical neon, clockwork, rainforest, and rendered miniature themes.

Fixed the featureless well with a quiet alignment grid; replaced flat cells with light/shadow bevels and restrained grain; centered each next-piece shape; removed rounded-corner clipping of bottom cells; improved board edge clearance; kept the portrait well clear of touch controls; moved the desktop score panel clear of the arcade menu. HUD, help, instructions, and button finishes match the cabinet. The existing shared runtime already contains touch buttons; no input fixes were needed.

Canvas and CSS are the reproducible artwork sources. Tile sprites are cached by color and size; the static well is cached by backing dimensions. No per-frame gradients, random calls, animated decoration, external assets, or Blender pipeline were needed.

## Gameplay preservation

`tests/graphics-check.cjs` compares the final source against Git baseline `90c920e`. After normalizing CRLF/LF only, all JavaScript outside the drawing block is byte-identical: board/shapes/colors, movement, rotation, collision, gravity, hard/soft drop, line-clear timing, scores, next-piece randomness, top-out, restart, audio, instructions, resize/backing dimensions, input bindings and touch handlers. Body DOM, instruction text and control markup are identical. Tile images occupy the same `BLOCK-1` square at the same grid coordinates. CSS changes display spacing and finishes only.

The original endless run, constant 1000 ms drop interval, all seven shapes, four rotations, 300 ms line-clear rule and 100 points per row remain unchanged. No levels or difficulty changes were introduced. No production test hooks were added. Test interception exposes existing lexical state solely inside browser test responses.

Nineteen deterministic baseline-parity/regression scenarios pass: initial gating, gravity, all five keyboard actions, help pause, one through four simultaneous line clears and scores, top-out, and full restart. The legacy restart expectations `[score,lines] === [0,0]` and five resets scheduling zero additional animation loops both pass. A twentieth scenario follows the real arcade card to the uninstrumented page, starts it, and plays with keyboard controls.

## Browser inspection and checks

- Locally served Chrome, 1440×900, 667×375, 740×390, 844×390, and portrait 390×844. All screenshot views visually inspected, including instructions, occupied board, line-clear flash and game-over state. Desktop menu no longer covers score text. Controls and HUD stay outside the playfield; all tested buttons and the board are onscreen.
- Real CDP touch presses/releases exercise left/right, soft drop, rotation, and hard drop at every mobile size; shared Restart button resets score/lines. Desktop help holds the board still; launch resumes it. Original 37-note, 120 BPM music enters the running AudioContext state from a user gesture. No mute control exists in this game and none was added. Physical-device/audio listening tests were not performed.
- No game resource, console, or runtime errors in the final five-size runs. Initial sandbox-only network denials were resolved by rerunning the localhost checks with approved browser access. Screenshots wait for the shared mobile settling overlay to disappear.
- Cached rendering observations: median frame intervals 17.6–17.7 ms, p95 18.1–18.5 ms on this headless host; these are not physical-device benchmarks.
- Inline script parsed by `vm.Script`; `node --check tetris/tests/graphics-check.cjs` and `git diff --check` pass.
- `node scripts/build-offline.cjs` and `node scripts/build-offline.cjs --check` pass: 60 games, 372 files. All 371 preexisting offline paths remain; only `tetris/presentation.css` was added. `sidebar.html` regeneration has no content change. The generated manifest retains the existing working-tree content for unrelated games.
- `node docs/restart-check.cjs tetris` was run unchanged. Its preexisting whole-catalog assertion fails before the game case because newer games are absent from its case table. Output is retained in `tests/restart-output.txt`; its Tetris-specific expectations pass in the focused test above. No legacy rules were edited.

Reproduce the focused test with Playwright available on `NODE_PATH`: `node tetris/tests/graphics-check.cjs`. It starts/stops its own local server on port 8767. `before` captures the original Git baseline. Results are in `tests/graphics-results.json`; inventory preservation is recorded in `tests/offline-results.json`.

## Screenshots

All paths below are relative to `tetris/screenshots/`.

- Before: `before-1440x900.jpg`, `before-667x375.jpg`.
- After occupied-board views: `after-1440x900.jpg`, `after-667x375.jpg`, `after-740x390.jpg`, `after-844x390.jpg`, `after-390x844.jpg`.
- First-load modal: `instructions-1440x900.jpg`, `instructions-667x375.jpg`, `instructions-740x390.jpg`, `instructions-844x390.jpg`, `instructions-390x844.jpg`.
- Later visual states: `line-clear-1440x900.jpg`, `line-clear-844x390.jpg`, `top-out-1440x900.jpg`, `top-out-844x390.jpg`.
- Uninstrumented play: `live-opening-1440x900.jpg`.

Occupied-board before/after shots use the same test-only representative stack with score 1200 / 12 lines, rather than claiming a naturally played progression. Line-clear screenshots briefly freeze the existing state to capture the original flash. Tetris has no campaign stages to jump through.

## Delivery

Changed scope: `tetris/index.html`, `tetris/presentation.css`, this verification file, `tetris/tests/`, `tetris/screenshots/`, `docs/GRAPHICS_UPDATES.md`, and generated `offline-assets.js`. No shared runtime, catalog, other game, simulation, or control changes were made. Local verified working-tree delivery only. No blocker to this graphics pass; the unrelated legacy suite limitation is documented above. Tetris must be skipped in future first-pass runs.


## Authorized release follow-up

Agent Yoda, 2026-11-22T22:44:52.312Z: owner authorized committing and pushing this pass. Isolated release against c6d6a23 retains all 372 existing offline paths and adds only presentation.css (373 total). Build/freshness, unchanged-gameplay source assertions, and fresh uninstrumented desktop/mobile browser smoke pass. Unrelated working-tree changes excluded and preserved. See tests/release-results.json and screenshots/release-*.jpg. Git delivery is confirmed in the release task result.

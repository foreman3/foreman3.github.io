# Marble Circuit — elevation redesign, 2026-10-25

The seven-course plan was written in DESIGN.md before implementation. This revises Marble Circuit in place into an angled, scrolling marble adventure. It retains the original identity, unlimited braking, three ordered checkpoint beacons, retry score rollback, session instructions and shared desktop/touch conventions.

## What changed

- Orthographic 3D projection, close follow camera and velocity lead. The camera briefly widens and frames the marble plus its flagged target during cannon flight. Keyboard and touch steering follow screen directions despite the angled world. A route minimap and next-beacon bearing preserve orientation.
- Separate wide scenic roads and shorter express routes in every world. Routes use real heights, downhill gravity, elevated crossings and lower catch decks; matching screen positions do not join roads at different elevations.
- Actual moving rival marbles with physical bump impulses and recovery grace; acid exposure warns before dissolving the marble and cools after escape.
- Guided silver rails, a multi-turn spiral descent, automatic cannon loading followed by a ballistic flight, and landing mats that reduce landing speed. Later cannon routes lead into substantial guarded sections instead of ending beside the finish.
- Conveyors alter momentum; crushers visibly warn before closing. Optional express gems reward route risk. Five marbles through course 5, four in 6 and three in 7; falls preserve checkpoints and cost three seconds.
- Cached terrain artwork with correctly facing cliff sides, terrazzo flecks, directional signs, distinct course palettes, rail sleepers/runners, cannon sockets/landing flags, acid bubbles and enemy marbles. Mobile renders at logical resolution; effects stop behind blocking overlays.

## Seven-course browser observations

The user's seven-level contract retains level 6 as the first mastery course and 7 as the intended near-perfection benchmark, superseding the older five-level wording in GAME_STANDARDS.md.

| Course | Identity | Clock / marbles | Scenic clear | Express clear |
| --- | --- | --- | ---: | ---: |
| 1 Sunlit Steps | Broad descending terraces and optional narrow bridges | 100s / 5 | 24.50s | 13.79s |
| 2 Verdigris Foundry | Acid basins, dry ridges and moving rivals | 100s / 5 | 31.62s | 16.54s |
| 3 Ribbon Railway | Elevated rail ribbons and spiral above a walking route | 105s / 5 | 34.16s | 20.96s |
| 4 Sky Cannon | Three optional cannon hops between flagged islands | 110s / 5 | 40.68s | 13.37s |
| 5 Clockwork Cascades | Belts, crushers, rail, cannon, acid and guarded landing turns | 100s / 5 | 38.10s | 20.88s |
| 6 The Undercut | Stacked roads, catch decks, high bridge and rail/cannon transfers | 68s / 4 | 36.39s | 23.07s |
| 7 Marble Citadel | Narrow inner routes, timed landing sections and outer balconies | 56s / 3 | 43.27s | 26.46s |

Both route families cleared every course in Chrome through the actual production simulation. Scenic controller: 160-unit target pace and 160ms steering decisions. Express controller: 160-unit target pace and 100ms decisions. Course 3 used three distinct rails; course 4 used all three cannons; course 7 used one rail and both cannons. Scenic runs retained all marbles; express 6/7 sustained two/one recoverable rival contacts without falling. Different route geometry makes times non-monotonic. Express times intentionally reward taking the harder route rather than enforcing scenic-route duration.

Course 5 recovered two deliberately injected fall penalties after earned checkpoints and cleared the scenic route in 38.29 rolling seconds + 6 penalty seconds with three marbles and 55.71 seconds remaining. Actual off-world fall/respawn and retained checkpoint progress were also tested separately. A run delivering real Chrome keyboard events cleared the entire opening scenic route, all beacons and physical finish in 30.95 simulated seconds without a fall.

These controllers read exact geometry and hazard state, and are mechanical feasibility checks, not human reaction-time studies or proof of enjoyment. Human mastery/near-perfection difficulty remains an intended design target; the optimistic express controller clears are not evidence that a human will experience that curve. Human feedback on forks, steering, rail exits and courses 5–7 is the next useful balance evidence.

## Mechanisms verified

- Every sampled edge centerline has a supporting surface; scenic and express route links are physical edges or declared cannon connections. Ordered beacons prevent skipping required progress.
- Overlapping course-7 decks selected independently at heights 516.67 and 390. A falling marble placed over the lower deck landed at 390 without losing a life. Airborne descent collides with a supporting surface, rather than teleporting to a checkpoint.
- Every cannon in courses 4–7 captured, wound up, flew above both endpoints and physically landed within 20 units of its flagged target at the correct height. Apex heights and landings are in verification.json. Landing mats slow momentum; no completion hook was used for route clears.
- Acid warning exposure, escape/cooling and sustained dissolution; moving rival position/impulse/recovery grace; physical downhill coasting; conveyor acceleration against the same terrain without a belt; crusher warning/open/closed timing and actual closed collision; fall penalties and checkpoint recovery all passed.
- All route clears continuously recorded camera bounds. The marble remained inside the 960×600 logical viewport with margin, including every flight. Terrain/camera work pauses with help, Options, pause and result overlays.

## UX, layout and performance

First-session instruction freeze and keyboard Space launch passed, as did returning-session behavior, fullscreen rejection, help pause, sound, restart, blur input release, pause/resume, retry score rollback, Next, defeat/final victory restart and Review Controls returning to the results screen. Normal pages expose no debug hooks. Arrow Right moved the marble right on screen without vertical drift; camera followed actual motion.

Chrome CDP touch checks passed joystick hold/slide/diagonal/neutral/release/cancel, simultaneous steering and brake, context-menu suppression, normalized diagonal direction buttons, saved preference, Options pause/resume, sound/pause and shared reset. Desktop 1440×900 and touch 667×375, 740×390 and 844×390 were inspected with no control overlap, overflow or aspect distortion. The 390×844 portrait rotation prompt pauses simulation. Instructions scroll on short screens. The HUD minimap explicitly overrides the shared helper's generic canvas sizing so it does not stretch into the playfield.

Final active Chrome frame intervals: desktop mean 17.08ms / p95 16.90ms; touch emulation mean 16.94ms / p95 16.80ms. These are local emulation measurements, not physical-device performance claims. Game console/page errors and arcade script errors were empty. The existing arcade card navigated correctly. JavaScript parsing and whitespace checks passed.

## Iteration and artifacts

Browser review fixed an elevated rail entrance conflicting with a nearby lower road, unintentional scenic-to-rail captures, incorrectly facing/interior cliff caps, excessive early clock margins, undersized target guidance, landing momentum, and flight framing. Late cannon landing sections were expanded with turns, acid, rivals and timed crushers. A controller waypoint issue at an acid-covered corner was corrected in the test controller; the route was not made artificially easier to satisfy that controller. Every final route and mechanism was then rerun.

Reproduce with a repository HTTP server on port 8772, Playwright available in NODE_PATH, and `node marble-circuit/verify.cjs`. MARBLE_BASE_URL, MARBLE_REPORT_DIR and CHROME_PATH are configurable. `node marble-circuit/bench.cjs` runs the same engine/input-only route controller without rendering. Only `?test=1` exposes debug state. Ordinary `?course=1` through `?course=7` links preserve instruction gating.

Screenshots, verification.json and development trials are under `C:/Users/forem/.codex/visualizations/2026/10/15/01a13e28-0aeb-7bc1-929b-89d3934a20df/madness-revision/`. The active rail screenshot is marble-circuit-gameplay.png; course-4.png shows ballistic flight with its landing island. Original October 15 artifacts remain intact.

Scope is Marble Circuit, its two arcade descriptions, and the repository-required generated offline inventory. Concurrent Steamline edits are preserved and excluded. Offline release validation must use the intended release snapshot so unpublished Steamline runtime files are not accidentally listed in the deployed inventory.

`node scripts/build-offline.cjs` and its `--check` both passed in the exported staged release snapshot: 52 games, 286 runtime assets, 15.3 MiB. The new physics.js is included. The regenerated inventory also picks up the already committed Steamline and Bramble Guard entries missing from the previous stale inventory; it excludes the concurrently edited/unpublished Steamline art.js and save.js. The full working tree can remain stale relative to that release inventory while unrelated Steamline development continues.

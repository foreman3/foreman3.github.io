# Cloudlift verification

Cloudlift is a Choplifter-style side-scrolling rescue game, absent from the arcade inventory, cards and directories before this run. Fly a four-seat helicopter, collect hikers from marked landing pads, return them to base, and dodge or disable flak and patrol drones. Cached Canvas alpine scenery, a detailed yellow rescue aircraft, lilac peaks, dawn skies and muted pine woods distinguish it from the preceding Ribbon Racers, Pearl Pop and Echo Pavilion releases. All art is local code; there are no new network dependencies.

## Difficulty contract and observed curve

The user's seven-valley requirement overrides the older level-5 mastery wording in the standards and skill. All mechanics appear by 5. Valleys 1–5 have four hull points (three recoverable hits); 6 has two and 7 has one. A hit preserves passengers and grants two seconds of protection. Marked pads cushion descent, and releasing the controls brakes to a hover. Retry refills the current valley and preserves earlier score.

| Valley | Pressure introduced | Hikers | Flak / drones | Time limit | Observed browser clear |
| --- | --- | ---: | --- | ---: | --- |
| 1 | Forgiving landing, capacity and return trips | 6 | 0 / 0 | 160 s | 33.86 s, no hits |
| 2 | One telegraphed flak gun | 8 | 1 / 0 | 165 s | 35.62 s, no hits |
| 3 | Third rescue pad and a moving patrol | 10 | 1 / 1 | 185 s | 60.17 s, no hits |
| 4 | Crosswind and a second gun | 10 | 2 / 1 | 180 s | 59.89 s, no hits |
| 5 | Full rescue, reinforced flak and second patrol | 12 | 3 / 2 | 175 s | 61.57 s, no hits |
| 6 | Faster shots; mastery with one recoverable hit | 12 | 3 / 2 | 100 s | 61.50 s, one hit, one hull left |
| 7 | Fastest shots, 78-second window, clean flight required | 12 | 3 / 2 | 78 s | 64.48 s, no hits, 13.52 s left |

Each level was cleared in installed Chrome with actual keyboard events and fixed-step simulation. Valleys 1–5 also each cleared after two deliberately induced rough-ground collisions: 35.19 / 36.96 / 61.51 / 61.40 / 63.22 seconds, with two hull points remaining. The common 235-pixel cruise route clears 1–6 and fails 7; a 190-pixel route clears 7 without damage. These exact-state controller results demonstrate mechanical feasibility and recovery margin, not human difficulty, enjoyment or reaction-time performance. Valley 3 adds a longer third trip while providing more time; its longer completion does not indicate an abrupt speed wall. Human feedback on the later rescue flights remains useful.

## Browser and static coverage

- First-load instructions freeze simulation and audio. Session return, graceful fullscreen refusal, short-screen instruction scrolling and reachable dismissal pass.
- Arrow/WASD flight, normalized diagonals, held/released Space fire, actual touch hold/slide/diagonal/neutral/cancel, fire cancellation, shared Options directional buttons, preference persistence, mobile Reset, pause/help, sound and context-menu suppression pass.
- A complete opening was cleared using only actual CDP touch gestures; Next advanced to valley 2. A normal page with no test API separately rescued all six hikers in real time (34.28 seconds).
- All seven clears, all Next transitions, final victory, time-out, retry, earlier-score banking, new run, R on results and help, exact pause, blur input release, focus looping, storage denial and passenger/protection invariants pass. Shared desktop flyout and the one In Work card resolve correctly.
- Reviewed 1440×900 desktop; 667×375, 740×390 and 844×390 landscape; 390×844 portrait. Later-valley captures show live boarding, shots and patrols. Cabinet aspect ratio is 5:3, HUD fits, controls stay outside the scene, actions stack vertically, and portrait uses a lower dock.
- Console and page-error logs are empty. Syntax and whitespace checks pass. No existing game or shared runtime file changed.
- Canvas uses a modest fixed 1000×600 backing, a cached static 2440×600 landscape, delta time capped at 50 ms, at most 60 particles and reduced-motion handling. Paused scenes stop drawing. Final opening frame sample: mean 16.60 ms, p95 16.80 ms, max 17.00 ms. Active valley-5 samples: desktop mean 16.62 / p95 17.00 / max 17.30 ms; emulated touch mean 16.63 / p95 16.90 / max 17.10 ms. Physical-phone performance is unmeasured.

## Two independent improvement passes

The complete baseline passed seven clears, endings, desktop/mobile controls and all layouts before the passes. Pass 1 reviewed the entire loop and added cushioned pad descent, landing/transfer guidance, base guidance, aircraft details, crag lines and high clouds; tightened the late mastery timers; corrected projectile single-hit handling; then repeated every level, ending, layout and two-hit recovery. The test pilot was adjusted to descend through the assist zone rather than stopping just above the pad.

Pass 2 freshly reviewed that result from opening through final rescue, failure, retry and all layouts. It increased small-screen pad/route type and projectile visibility, added objective direction/distance, and enabled R while help is open while preserving the instruction gate. Repeated the full suite, actual touch-only opening, normal real-time rescue and focused edge cases. A focused-suite flyout assertion was corrected to the shared is-open class; no shared file was edited. No further material change was found without human flight feedback.

## Evidence and reproduction

Run `node cloudlift/serve.cjs` (port 8781). With installed Playwright on NODE_PATH, run `node cloudlift/verify.cjs`, `node cloudlift/focused.cjs` and `node cloudlift/smoke.cjs`. An optional first argument specifies the evidence directory; CLOUD_URL changes the origin for the smoke check. Test hooks exist only with `?test`, allow manual stepping and level selection, and do not appear in normal UI. pilot.cjs supplies reproducible physical input routes.

Evidence is in `C:/Users/forem/.codex/visualizations/2026/11/12/01a1ce90-8dbe-71e3-9963-43fcbac66e1e/`, separated into baseline, pass1 and final reports, all seven clear screenshots, active mobile layouts and normal-opening proof. final/cloudlift-gameplay.png is a genuine active valley-5 flight (152,417 bytes, SHA256 6aa147c957950a65000f3f08882e95b155b6679fdc52cf449eefb11db7f17e2f). final/cloudlift-rescue.png shows active boarding and incoming flak.

## Scope and offline limitation

Only cloudlift/, Games.md and index.html are intended for this release. The explicit strict scope overrides offline-inventory regeneration. Read-only `node scripts/build-offline.cjs --check` reports the stale inventory: 58 games, 330 runtime files, 17.6 MiB. offline-assets.js and sidebar.html remain untouched. Online registration works; installed offline clients and the new shared-flyout entry require a separately scoped refresh.

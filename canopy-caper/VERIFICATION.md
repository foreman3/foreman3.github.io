# Canopy Caper release verification

Verified 2026-10-13 in local Chrome, served over loopback HTTP. Exactly one new Lode Runner-style game, `canopy-caper/`, registered under In Work in `Games.md` and the root `index.html`. No existing game or shared file changed. Initial and pre-release successful fetches matched `origin/main`; no integration was needed.

## Play and presentation

Collect every golden seed pod, climb vines, traverse ropes, dig five-second soil traps, lure pursuing beetles into them, and reach a physical upper-right exit. Stone cannot be dug; striped beetles are faster. A limited local whistle gives recovery options. Hits keep seeds and return the gardener to the entrance with protection. An open exit creates a visible three-tile pollen refuge, preventing an unfair final ladder bottleneck. Traps, seed collection, retained hearts and remaining time reward scoring and route choices.

Cached Canvas rainforest/conservatory scenery, organic leaf veins, hanging orchids, soil strata, vine ladders, ropes, a gardener with backpack and shovel, and contrasting beetle shells. Mobile uses the shared cardinal joystick or persistent Options button preference, with vertically stacked dig-left, dig-right, whistle, pause and sound actions. Portrait provides a rotation prompt. Production has no external asset/library dependency.

## Challenge curve

The user's explicit seven-garden contract supersedes the older level-5-mastery wording in repository standards and skills. Movement is 0.16 seconds per tile; falling is 0.12. Normal beetles take the listed time per tile; striped beetles take 80% of that. Whistles reach five tiles and stun for 2.5 seconds; trapped beetles rest for 2.8 seconds, then warn for 1.2 before returning.

| Garden | Seeds | Beetles | Seconds/tile | Time limit | Hearts / whistles | Distinct demand |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 | 4 | 1 | .65 | 130 | 5 / 2 | Forgiving collection and vine climbing |
| 2 | 5 | 2 | .59 | 125 | 5 / 2 | Two patrol routes and changed vine positions |
| 3 | 6 | 2 | .53 | 120 | 5 / 2 | Rope bridge and voluntary safe drops |
| 4 | 7 | 3 | .47 | 115 | 5 / 2 | Undiggable stone and a third pursuer |
| 5 | 8 | 4 | .41 | 110 | 5 / 2 | Striped beetles and a second rope route; all mechanics present |
| 6 | 9 | 5 | .30 | 90 | 3 / 1 | First mastery benchmark |
| 7 | 10 | 5 | .28 | 60 | 2 / 0 | One recoverable hit, no whistle; near-perfect trap routing |

The browser route policy used legal movement, dig and whistle actions against actual simulated actors. A 250 ms movement-decision policy cleared gardens 1–5 in 14.07 / 30.30 / 26.83 / 23.40 / 37.33 simulated seconds, with 5 / 4 / 4 / 4 / 2 hearts remaining. It failed 6 and 7. The different routes mean durations are not monotonic; increased pursuit, stone, ropes and recovery use establish the rising demands. A 350 ms greedy policy ignoring traps and whistles cleared 1 and failed 2–7.

Garden 5 also cleared after two deliberate test-hook damage penalties plus one natural beetle collision, with two hearts and one whistle remaining, in 28 seconds. A 160 ms expert policy cleared 6 with two hearts and 7 with one heart, one hit, seven successful traps and no whistle. These exact-state mechanical checks demonstrate feasibility and recovery; they are not human enjoyment ratings or measured human reaction requirements.

## Iteration and checks

After the complete functional baseline passed, two additional whole-game reviews were completed:

1. Replayed opening/later routes, endings, controls and all layouts. Fixed soil refilling during a pending fall so protected or unprotected actors cannot become buried in solid terrain. Added a visible trap-expiry exclamation, more soil depth, gardener backpack/shovel and a clear foot silhouette. Full regression and protected/unprotected pending-landing checks passed.
2. Fresh review of the resulting opening, challenge, ending/restart and desktop/mobile visuals. Replaced ambiguous floating petals with attached orchids, added curved botanical leaves and veins, made low hearts/time explicit, and clarified pollen-refuge feedback. Full regression passed; no further material change was identified.

Final checks passed:

- JS parsing and Git whitespace checks; both canonical registration links and the root card resolve.
- First-load instruction freeze; native Space button dismissal; returning-tab behavior and mobile launch gate; fullscreen refusal remains playable.
- Actual keyboard movement/climbing, sound, reset, help pause, pause/resume and blur input release. Normal production page collected seeds using real keyboard events without hooks.
- Real Chrome CDP touch hold, slide from horizontal to vertical, neutral, release, cancellation, simultaneous steering/dig, direct dig/whistle taps, Options/buttons preference and persistence, context-menu suppression, pause/sound and shared reset.
- Actual digging, falling beetle traps, trap scoring, soil restoration, player pit escape, stone rejection, rope hold/drop, whistle locality and empty-charge preservation, beetle collision/protection, seed retention, physical exit/pollen refuge, timeout, progression, retry score rollback, victory and full restart.
- 1440×900 desktop and 667×375, 740×390, 844×390 mobile landscape; 390×844 portrait prompt. No horizontal overflow or control overlap. Canvas aspect ratio remains 5:3; HUD/footer reserve physical room outside the board.
- No new-game console errors or page exceptions. Root script exceptions were also empty; existing root external resources are outside this task's scope.
- Final active frame intervals: desktop mean 17.77 ms / p95 18.20 ms; touch emulation mean 17.84 ms / p95 18.20 ms. Scenery is cached, effects capped, delta capped, and blocked overlays stop simulation/redrawing. Decorative bobbing honors reduced motion.

## Reproduction and screenshot

Serve the repository root over HTTP and run `node canopy-caper/verify.cjs` with Playwright available on `NODE_PATH`. Set `CANOPY_BASE_URL` for the server and `CANOPY_REPORT_DIR` for artifacts. The suite launches installed Chrome on Windows. `?garden=1` through `?garden=7` offer gated direct trials; `?test=1` exposes diagnostic hooks only for verification.

Active garden-5 screenshot, viewport captures and machine-readable report are saved at:

`C:/Users/forem/.codex/visualizations/2026/10/13/01a133d4-adb6-7b01-aeac-cfcfd93777db/canopy-caper-gameplay.png`

`C:/Users/forem/.codex/visualizations/2026/10/13/01a133d4-adb6-7b01-aeac-cfcfd93777db/verification.json`

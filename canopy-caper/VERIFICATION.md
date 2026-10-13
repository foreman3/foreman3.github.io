# Canopy Caper expedition revision verification

Verified 2026-10-13 in Chrome over local HTTP. This revision addresses the reported two-button digging, repeated falls into one's own hole, small repeated terrace shape, easily trailed beetles, and rudimentary artwork. Only `canopy-caper/` changed; no other game or shared file changed.

## Revised play

- One DIG button and one keyboard action (X, with Z as an equivalent alias) dig diagonally down in the gardener's current facing direction. The shovel, target bracket and touch-button arrow show that direction. Keyboard and touch activate the same action.
- Eight-second soil holes grow a visible rescue vine. After 0.8 seconds, Up or DIG can hoist the gardener onto a supported adjacent ledge. After two seconds, this happens automatically. If adjacent holes or beetles leave no safe ledge, a temporary vine supports the gardener until the ground refills. Soil closing during a pending fall also rescues them without costing a heart. This fixes the actual old loop: a straight vertical climb ended over unsupported air and gravity immediately dropped the gardener back in.
- Seven distinct larger terrace plans include staggered heights/extents, side rooms, broken soil islands, rope connections and multiple vine routes. An extra upper rope gives Orchid Islands a second approach to its guarded side room. A smooth scrolling camera preserves the original 20x12-tile view, keeping touch targets and actors readable. The minimap identifies the visible area, gardener, seeds, beetles and exit.
- Coral chasers pursue nearby movement. Green shield wardens patrol around seeds and restrict pursuit to their home terrace. Purple interceptors target forward vine junctions. Gold striped scouts aim ahead of the gardener. Different silhouettes and markings distinguish roles as well as color. Roles avoid occupied cells, and late patrol homes stay away from the entrance.
- Cached illustrated tree crowns, buttress roots, sunlight/mist layers, ferns, soil strata and roots, cracked/mossy stone, twisted vine ladders and braided ropes replace the sparse scenery. Cached character animation adds a woven hat, face, coat, backpack, gloves, boots and shovel; beetles have shaded shells, legs, antennae and role emblems. Seed artwork is cached too. Garden palettes vary.

## Maps and challenge

| Garden | World tiles | Seeds | Beetles | Normal seconds/tile | Hearts / whistles |
| --- | --- | ---: | ---: | ---: | --- |
| Fern Hollow | 26x15 | 4 | 1 | .60 | 5 / 2 |
| Forked Atrium | 30x17 | 6 | 2 | .53 | 5 / 2 |
| Orchid Islands | 32x19 | 8 | 3 | .48 | 5 / 2 |
| Rootstone Ruins | 34x21 | 10 | 4 | .43 | 5 / 2 |
| Split Canopy | 36x22 | 12 | 5 | .39 | 5 / 2 |
| Monsoon Galleries | 38x24 | 14 | 6 | .33 | 3 / 1 |
| Crown Garden | 40x25 | 16 | 7 | .31 | 3 / 0 |

All four patrol roles appear by garden 5. Garden 6 is the first mastery benchmark. Garden 7 is intended as the near-perfect route benchmark; its expanded sixteen-pod journey allows two recoverable hits but no whistle. Player movement remains .16 seconds/tile, falling .12. Scouts take 1/1.18 of the listed beetle movement time. Whistle range is five tiles and stun is 2.8 seconds. Beetles rest in a pit for 3.2 seconds, then warn for 1.5 seconds before respawning.

A 250 ms adaptive browser route policy cleared gardens 1-5 in 16.20 / 61.97 / 57.17 / 66.07 / 84.12 simulated seconds with 5 / 3 / 1 / 2 / 3 hearts remaining. Garden 4 recovered three real collisions, trapped seven beetles, and retained one whistle. Garden 5 recovered two real collisions and retained three hearts. This provides meaningful recovery margin. Terrain and route differences mean durations and hit counts are not monotonic.

A 160 ms policy cleared 1-4, but its different route/timing failed 5: moving faster alone is not sufficient. A deliberate 160 ms policy checking crossing paths and digging then retreating cleared garden 6 in 66.52 seconds with one heart, five traps and no whistle remaining. Greedy policies ignoring traps and whistles failed the sampled gardens 2, 4 and 5, so the original simple trailing strategy no longer reliably wins.

**Testing limit:** the sampled route policies did not fully clear garden 7; the best sampled progress reached thirteen of sixteen seeds. All sixteen sites and the exit are reachable in its normal movement graph, and its layouts, mechanics and failure/restart flow passed. Its complete expert clear and human balance remain unverified. An additional garden-5 stress run with two injected penalties plus natural collisions also failed; the recovery claim above is based on the observed natural two-hit clear, not that stress run. These exact-state mechanical policies are feasibility/pressure checks, not human enjoyment or reaction-time studies. The user's original boredom report supersedes confidence from the old successful controller benchmarks.

## Passed regression

- JavaScript parsing and Git whitespace checks.
- Seven distinct map shapes, expected seed counts, and every seed/exit reachable from the entrance with normal movement; cached terrain and camera inspected across all seven gardens.
- Actual facing-based digging and falling in both directions; automatic rescue to solid support; additional settled frames proving no repeat fall; manual early Up escape; adjacent-hole fallback through refill; no damage from one's own closing pit; pending-landing closure does not bury the gardener.
- Distinct warden, interceptor and scout targets; actual pursuing actors, soil traps, scoring, patrol pressure, and observed clears/recovery through garden 6.
- Actual keyboard movement, turning and X digging; first-load instruction freeze, native Space launch, updated instruction session key, returning session, help/pause, sound, input clearing on blur, reset, retry score rollback, progression, final result restart and timeout.
- Real Chrome CDP touch hold/slide/neutral/release/cancel, independent steering plus DIG, one visible dig action, facing-sensitive touch digging, Options/buttons preference/persistence, pause/sound/shared reset, fullscreen refusal fallback and returning launch gate.
- 1440x900 desktop; 667x375, 740x390, 844x390 landscape touch; 390x844 portrait prompt. No control overlap or horizontal overflow. Canvas stays 5:3; HUD/minimap/footer fit outside the world view. Four actions stack in the right rail.
- Production page without hooks collected a seed using actual keyboard input; help paused its timer. New-game console/page error logs are empty.
- Final active frame intervals: desktop mean21.38 ms / p95 18.50 ms; touch emulation mean18.27 ms / p95 18.80 ms. The desktop mean includes a long outlier after accelerated repeated world generation; ordinary frame p95 stayed below19 ms. Actors/seeds and terrain are cached, only the camera crop is copied, offscreen actors are skipped, effects and delta are capped, and blocking overlays stop simulation/redrawing.

## Reproduction and artifacts

Serve the repository root and run `node canopy-caper/verify.cjs` with Playwright on `NODE_PATH`. Configure `CANOPY_BASE_URL` and `CANOPY_REPORT_DIR` as needed. The suite launches installed Windows Chrome. Normal `?garden=1` through `?garden=7` links retain instruction gating; `?test=1` alone exposes verification hooks.

Active gameplay screenshot and report:

`C:/Users/forem/.codex/visualizations/2026/10/13/01a133d4-adb6-7b01-aeac-cfcfd93777db/revision/canopy-caper-gameplay.png`

`C:/Users/forem/.codex/visualizations/2026/10/13/01a133d4-adb6-7b01-aeac-cfcfd93777db/revision/verification.json`

Required mobile captures, portrait prompt and seven garden captures are beside these artifacts. The previous scheduled-release artifacts remain preserved outside the revision directory.

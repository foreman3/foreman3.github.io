# Harbor Bastion persistent-castle revision

Verified 2026-10-06 in local Chrome over HTTP. This approved follow-up replaces the seven independent rounds with one castle carried through thirteen sieges. It changes only harbor-bastion/ and its Games.md/index.html descriptions. No new game directory or registration entry was created. The initial and pre-release origin fetches matched main.

## Player contract

- Level 1 starts with a 2 × 2 keep, ten health, one gun and no walls. Building begins after victory.
- Walls, rubble, building positions, health, supplies and score carry forward. Construction is untimed and spends a finite bank. Victory guarantees 26 + twice the fleet size in supplies, with six extra for keeping at least 70% health.
- Every wall-piece square must be empty and inside buildable land. Pieces join an existing wall/building by an edge. Three selectable pieces, four rotations, limited single-square patches, paid exchanges, partial-refund salvage and free preparation undo support different layouts.
- Every upgrade square must lie inside a closed wall area. Expanding the keep must contain its old footprint; it grows physically to 3 × 3 without restoring existing health. Buildings continue working through a breach and stop only when direct damage disables them.
- Repair is a construction tool, costs two supplies per health, and works on disabled upgrades. There is no MEND button, E shortcut, emergency repair or player ability that clears incoming fire.
- Enemy shells collide with the first wall or live building along their actual path. Destroying a wall leaves a visible breach and rubble. Only a real keep hit lowers keep health; missed shots and open walls alone do not. A timed failure explicitly reports remaining raiders. Once all ships are sunk, remaining shells resolve before victory.
- Retry restores the current level's initial preparation checkpoint, including its bank, damage and buildings. Earlier progress is retained. New Campaign resets everything.
- Local storage saves construction and victories; a battle reload starts from the prepared castle. A completed-campaign reload preserves the ending without issuing another reward. Instructions still gate first-session play.

## Five upgrades

| Plan | Unlock | Cost | Effect |
| --- | ---: | ---: | --- |
| Cannon tower | 3 | 14 | Extra independently reloading manual cannon; at most two towers |
| Keep expansion | 5 | 20 | Physical 3 × 3 footprint and sixteen-health capacity; repair health separately |
| Magician's tower | 7 | 20 | Automatically stops one shell within 190 logical units, then cools down for five seconds |
| Captain's quarters | 9 | 18 | Aims/fires one cannon; the other guns remain manual |
| Workshop | 11 | 22 | Manual reload falls from 1.0 to 0.8 seconds; three additional patch stones each preparation |

Captain reload remains 1.25 seconds and its prediction is deliberately imperfect. All player plans arrive by 11; the thirteen-level progression requested by the user supersedes the earlier seven-level contract.

## Observed curve

All thirteen levels were exercised as one continuous browser simulation using real placement, salvage, repair, fire and collision functions at 60 Hz. Castle/resource persistence was checked before each preparation. The planner constructed an eighteen-stone enclosure at 2, expanded it to thirty-six stones at 5, added the second tower at 6, and reinforced the perimeter to sixty-eight stones at 10. It used only earned resources and legal fitting.

These exact-state controllers are mechanical benchmarks, not human reaction-time requirements or evidence that the game is fun.

| Level | Fleet | Base speed | Leading-controller clear | Keep at finish | New pressure or plan |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 | 3 | 0 | 9.30 s | 10/10 | Bare keep; stationary aiming introduction |
| 2 | 6 | 22 | 16.62 s | 10/10 | First enclosure; moving ships |
| 3 | 8 | 32 | 18.28 s | 10/10 | Tower; increasingly useful leading |
| 4 | 10 | 40 | 17.40 s | 10/10 | Two-hit armor; earlier fire |
| 5 | 12 | 48 | 19.42 s | 16/16 | Keep expansion and tighter fleet spacing |
| 6 | 14 | 55 | 20.57 s | 16/16 | Three-hit galleons and staggered double volleys |
| 7 | 16 | 60 | 20.72 s | 16/16 | Magician and heavier pressure |
| 8 | 18 | 66 | 21.98 s | 16/16 | Fast cutters |
| 9 | 20 | 70 | 22.70 s | 16/16 | Captain; manual/automatic gun coordination |
| 10 | 22 | 76 | 22.03 s | 16/16 | Reinforced perimeter becomes useful |
| 11 | 24 | 82 | 23.60 s | 16/16 | Workshop |
| 12 | 27 | 89 | 24.82 s | 16/16 | Ships also drift horizontally |
| 13 | 30 | 96 | 28.25 s | 15/16 | Combined fleet; thirty ships and sustained fire |

- A 600 ms controller aiming at current positions cleared 1–3. At 3 it missed four shots. At 4 it barely recovered, finishing with 2/10 health after 33 misses. It failed 5–7 and 13. Leading becomes a meaningful requirement rather than an abrupt opening hurdle.
- Level 5 cleared with six forced opening misses plus repeated off-target shots: eleven total misses in 27 shots, 16/16 health and one wall lost. It has meaningful error margin.
- Level 13 cleared after six deliberately missed opening shots: 13 total misses, seven visible keep hits, two magician interceptions, 22 captain shots and 9/16 health remaining. Nine forced opening misses failed. Repeated additional misses also failed. The final siege rewards sustained recovery and upgrades.
- Separately, an actual mouse-played level 1 on the normal page waited for enemy fire, took two visible keep hits, sank all three ships, advanced with 8/10 health, placed a wall stone and reloaded. Level 2, 8/10 health, one wall stone and 52 supplies survived unchanged. This path used no test hooks.

## Iteration and verification

The first draft was too gentle after extra guns arrived. Increased fleet size, speed, arrival pressure and firing pressure progressively. Added late defensive reinforcement to the legal construction benchmark. Tested stranded gaps by salvaging adjacent stones and fitting a complete replacement rather than allowing overlap. Added that recovery advice to Plans.

Full suite passes:

- Opening instruction freeze, native Space launch, help freeze, pause/resume, session return, modal focus handling, sound and graceful fullscreen refusal.
- Real keyboard cursor/rotation/placement/fire/undo/plans/retry; real mouse aiming and placement; real touch selection/placement/rotation/undo/shared reset.
- Chrome CDP touch hold, slide, release and cancellation; repeated firing while held; blur pauses and clears held input. No keyboard is required on mobile.
- Rejected overlap, out-of-enclosure upgrades and locked plans without state mutation; exact undo; expanded keep retaining damaged health; expansion undo; repair charges; disabled captain repair restoring automation.
- Real wall collision, tower damage, shell travel through a breach to hit the keep, no gap-only damage, local single-shell magician behavior and cooldown, one captain-assigned gun, independent manual guns, workshop reload/patch grant, timeout and current-level retry.
- Real storage writes/reload plus completed-campaign reload without duplicated rewards; campaign victory and New Campaign flow.
- Visually inspected desktop 1440 × 900, mobile 667 × 375, 740 × 390 and 844 × 390, and portrait 390 × 844. Actions stack outside the playfield; no horizontal overflow or clipped controls. Portrait pauses play and gives a rotation prompt. Short modals scroll to their controls.
- Final sampled active desktop mean/p95 frame interval: 17.62/18.2 ms; touch emulation: 17.74/18.5 ms. These are local Chrome measurements, not physical-device certification. Static shore and fort layers are cached, HUD updates at 10 Hz, simulation remains 60 Hz, particles are capped at ninety, catch-up is capped at 100 ms, and mobile uses a 1000 × 640 backing canvas.
- JS parsing and whitespace checks pass. Game console/page errors are empty. Arcade card loads the correct game; the pre-existing root favicon 404 remains outside scope.

## Reproduce and evidence

Serve the repo root over HTTP and run node harbor-bastion/verify.cjs with Playwright and local Chrome available. HARBOR_BASE_URL overrides the default http://127.0.0.1:8766; HARBOR_REPORT_DIR chooses an output directory; HARBOR_CURVE_ONLY=1 runs the campaign benchmarks.

Active level-13 screenshot, viewport captures and verification.json:
C:/Users/forem/.codex/visualizations/2026/10/06/01a10fcd-3510-78c0-a111-5c284d643a73/campaign/

The next useful evidence is the user's judgment of construction choices and combat pressure, especially after the first tower and in the last three sieges. Automated clears establish feasibility, not enjoyment.

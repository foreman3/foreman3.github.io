# Copper Glide release verification

Agent Yoda · 2026-11-19 · scheduled new-game release

## Implementation and scope

Classic air hockey: a teal home striker, ivory puck, copper opponent, physical paddle reflections, rail banks, serves, seven opponents, bank-shot points, banked tour score, current-table retry, and a final cup. Mouse, captured touch drag, arrows/WASD, and Shift for fine keyboard control. No match timer. Canvas suits the continuously moving table; the wooden surround, perforated surface and striker artwork are cached. Fixed 120 Hz simulation, capped frame catch-up, nine-point trail, bounded impact effect, and idle rendering behind blocking dialogs. No external asset dependency.

Read AGENTS.md, complete GAME_STANDARDS.md, installed/supplied/repository builder skills, Games.md, arcade cards, directories, Git history, and automation memory. Air hockey was absent. The copper/ivory table-sports club differs from the prior alpine helicopter, light-cycle grids, and marine bubble shooter.

Only copper-glide/, Games.md, and index.html belong to this change. Existing untracked pocket-lanes/ is unrelated and preserved. The explicit user scope overrides the standards' offline-inventory write requirement. Read-only `node scripts/build-offline.cjs --check` reports stale inventory (59 games, 355 files, 18.3 MiB). offline-assets.js and sidebar.html remain unchanged; installed/offline inventory and the shared flyout need a separately scoped refresh. Online main-page and Games.md links work.

## Difficulty contract and observed curve

The user's seven-table contract overrides older level-5-mastery wording in the skill/standards. All mechanics appear by table 5. A developing player faces deliberately inaccurate, slower returns first; speed, anticipation, precision and offensive pursuit then rise gradually. Tables 1–5 allow four conceded goals, table 6 allows two, and table 7 requires a shutout.

| Table | Player target / rival limit | Rival speed | Reaction | Return cap | Interpretation |
| --- | --- | --- | --- | --- | --- |
| 1 | 3 / 5 | 225 | .34 s | 350 | Forgiving, defense-only introduction |
| 2 | 4 / 5 | 265 | .29 s | 400 | Light pursuit, better rail reading |
| 3 | 4 / 5 | 305 | .25 s | 450 | More consistent counterattacks |
| 4 | 5 / 5 | 345 | .21 s | 500 | Stronger combined returns, recovery margin |
| 5 | 5 / 5 | 385 | .18 s | 550 | Full club opponent, still recoverable |
| 6 | 5 / 3 | 455 | .14 s | 650 | First mastery benchmark |
| 7 | 5 / 1 | 525 | .10 s | 740 | Near perfection: no conceded goals |

Full browser matches use pointer events through the game's input handlers and manual fixed-step time. Selected physical policies cleared all seven in 26.28 / 24.10 / 36.74 / 94.08 / 54.02 / 184.63 / 368.99 simulated seconds, conceding 0 / 0 / 0 / 4 / 2 / 0 / 0. Different policies are selected per table; these times are not a monotonic human difficulty measure. One unchanged 20 Hz reactive policy cleared 1–5 (conceding 1 / 0 / 0 / 3 / 1) and failed 6 and 7. A separate test drove two real puck crossings into the home goal before playing each early table: all five still cleared; tables 4 and 5 finished with only those two concessions and three further goal slots available. These are mechanical feasibility/recovery benchmarks, not human play studies.

The normal page, with no debug API, also cleared the opening 3–0 in 78.879 real seconds. smoke.cjs located the puck and paddle by Canvas pixels and used actual Playwright mouse movement, then exercised Next, restart and help freeze. Physical-phone performance and human judgment of later opponents remain unmeasured.

## Iteration

Baseline: built a complete tour, then fixed over-accurate AI forecasts/stalemates, paddle-to-rail trapping space, mobile header placement, native touch cancellation, context-menu suppression, and winning-gesture click-through. Full seven-table suite passed before improvement passes.

Pass 1: reviewed the complete opening/late play, endings/retries and all viewports. Added visible bank-shot values, impact rings, a calmer 620-unit keyboard speed with 330-unit Shift precision, scoring instructions and portrait guidance. Replayed all seven matches, all recovery checks, and all five layouts; console clean.

Pass 2: independently reviewed the result of pass 1 across the whole tour. Added goal net detail and an outlined incoming-goal warning; grouped portrait guidance next to the table. Preserved native Space activation and arrow scrolling in dialogs. Repeated the full suite, added focused edge checks, and completed the normal-page real-time opening. No further material issue was found in the final visual review.

## Checks and evidence

- JavaScript syntax and Git whitespace checks pass.
- First-session instructions freeze play; session return, mobile returning launch, fullscreen refusal, pause/help, blur, sound and in-place reset pass.
- Mouse, keyboard, Shift precision, normalized diagonals, captured touch hold/slide/cancel/release, context-menu suppression, touch-only opening/Next, and ghost-click prevention pass.
- All seven matches and all five recovery checks pass. Goal-mouth vs solid end-rail collisions, scoring, bank preservation on retry, win/loss/cup/restart, result-help restoration, Space activation and flyout pass. Storage denial remains playable. Random sustained inputs retain finite, bounded actor states.
- Inspected 1440×900, 667×375, 740×390, 844×390, and 390×844. Aspect ratio preserved; no overflow or controls/title/table overlap. Touch buttons at least 44 px except shared Reset's 42 px width. Instructions scroll on short screens. Portrait remains playable with a landscape suggestion.
- Final sampled desktop frame intervals: mean 17.82 ms, p95 18.40 ms, max 18.50 ms, in headless Chrome on this computer. No physical-device performance claim.
- Game and canonical arcade card load with empty console/page-error collections.

Evidence directory:
`C:/Users/forem/.codex/visualizations/2026/11/19/01a1f298-fdfe-7261-94fe-0ca81dd74173/`

baseline/, pass1/, and final/ contain complete reports and all table/layout captures. final/copper-glide-gameplay.png shows active table-5 play, a rail rebound threatening the home goal, a 4–0 score, and both strikers. final/normal-gameplay.png and final/normal-opening-clear.png document the real-time normal-page match. Final verification.json, focused.json and smoke.json pass.

## Reproduction

Run `node copper-glide/serve.cjs` (localhost port 8783). With installed Playwright on NODE_PATH, from the repository root run `node copper-glide/verify.cjs`, `node copper-glide/focused.cjs` and `node copper-glide/smoke.cjs`, passing an absolute evidence directory as the first argument. COPPER_URL can select a different origin for live checks. Tests use installed Chrome at its usual Windows path. Deterministic hooks exist only on `?test`, and are absent from normal play. pilot.cjs supplies physical control routes, not automatic wins or altered opponent state.

Publishing uses a fresh fetch and normal fast-forward-only push to origin/main. No shared history rewriting and no unrelated files staged. Notification is sent only after successful publication.

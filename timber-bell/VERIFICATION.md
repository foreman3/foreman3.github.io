# Timber Bell release verification

Verified 2026-10-29 in desktop Chrome and emulated Chrome touch sessions. This is one new Timberman-style arcade concept; the existing inventory has no tree-chopping game. No existing game's files or shared runtime were changed. Registration is under **In Work** in Games.md and the arcade page.

## Design and challenge

Read the lowest framed log and chop from its branch-free side. Left/A and Right/D act immediately, repeat while held, and buffer a quick tap during the 180 ms stroke cooldown. Touch uses two thumb buttons in opposite side rails, with portrait controls below the playfield. Knots need two strokes; bell-stamped logs add one second and 150 points. Successful cuts grow a capped score chain. A branch costs one heart, one second, and discards its log without quota credit. Recovery protection lasts 700 ms through heat 5 and 400 ms in heat 6. The last heat has none. Every heat restores its heart allowance. Retry restores its starting score.

The user's requested seven-heat curve overrides the older level-5-mastery wording in the standards and skills. All mechanics appear by heat 3; the first five heats combine them gradually. Seeded sequences make retries learnable.

| Heat | Logs | Initial clock | Branch probability | Knot probability | Hearts |
|---|---:|---:|---:|---:|---:|
| 1 | 24 | 38 s | 30% | 0% | 4 |
| 2 | 32 | 39 s | 37% | 10% | 4 |
| 3 | 40 | 40 s | 44% | 14% | 4 |
| 4 | 48 | 39 s | 54% | 18% | 4 |
| 5 | 56 | 38 s | 62% | 22% | 4 |
| 6 | 72 | 28 s | 72% | 28% | 2 |
| 7 | 84 | 18.5 s | 80% | 32% | 1 |

The first three logs are branch-free in every heat. Bell logs arrive every tenth generated log from index 7 in heats 3–7, so actual clock budgets can exceed the initial clock.

Browser tests jumped to and exercised all seven heats through the opt-in `?test=1` API. A 420 ms exact-state decision policy cleared heats 1–5 in **9.78 / 14.02 / 19.55 / 25.07 / 28.90 simulated seconds**, with no hits. It failed heat 6 at 62/72 logs and heat 7 at 37/84. A slower 650 ms policy cleared 1–4 and timed out at 54/56 in heat 5. A 195 ms expert policy cleared all seven; heat 6 took 18.80 s, heat 7 took 22.80 s with 3.70 s remaining after earned bell bonuses. Heat 7's single heart and tight stroke budget demand near-perfect execution.

Heat 5 explicitly recovered a three-second idle opening and **two actual wrong-side branch collisions**, then cleared 56 logs with **two hearts and 8.83 seconds remaining** in 33.17 s. These input-policy traces demonstrate mechanical feasibility and recovery margin; they are not human reaction-time, enjoyment, or difficulty studies. Human feedback on heats 4–7 remains useful.

## Iteration

- Baseline: complete playable campaign, authored forest/hut/bell/worker artwork, cached Canvas scenery, scoring, sound, controls and responsive layout. First browser checks fixed dropped short taps and results/help dialog stacking. Full baseline regression passed.
- Whole-game review 1: replayed opening, later heats, recovery/game over/retry, desktop and all mobile layouts. Added a brief damage recovery ring, persistent cracked-knot art, and reduced heat 7's initial clock from 25 to 18.5 seconds. Full regression passed.
- Fresh whole-game review 2: rechecked the entire result independently. Removed redundant safe-side checkmarks to let branch silhouettes carry the reading mechanic; clarified target brackets and bell-log stamps; added engraved ground detail, flowers and worker hardware. Fixed stale knot feedback after clean cuts, avoided unchanged HUD text writes and per-step held-input sorting, and added desktop device-pixel backing support. Full regression and normal-page keyboard opening passed.

## Browser and static checks

- Instructions gate timers, input, simulation and sound; session return and returning mobile fullscreen launch work. Fullscreen rejection does not block play.
- Actual Chrome keyboard events cleared the opening 24 logs with zero hits. A separate normal page with no debug API cleared it using real-time key presses, advanced through native Enter activation, froze behind help, and reset without reload.
- Actual Chrome touch down/hold/slide/release/cancel, opposite-side strokes, context-menu suppression, Pause/Resume, Sound and shared mobile Reset passed. Input clears on blur, visibility loss, pause, help and restart. No joystick is needed for this discrete two-action concept.
- Two-hit knots, actual branch penalties/no quota credit, clock/score bell rewards, timeout, last-heart failure, score-bank retry, next heat and final restart passed.
- Desktop 1440×900; mobile landscape 667×375, 740×390, 844×390; portrait 390×844 inspected. No horizontal overflow, aspect distortion, clipped arena, or touch/playfield overlap. Buttons are 110×100 px. Instructions scroll on short displays and the dismiss action remains reachable.
- Game console/page errors: none. Arcade card appears exactly once under In Work and navigates correctly; root script errors: none. Canonical Markdown link resolves to the same game directory.
- Final active-game frame intervals: desktop mean 17.74 ms / p95 18.60 / max 19.10; touch emulation mean 17.71 / p95 18.50 / max 19.00. Static scenery cached; particles capped at 36; fixed 120 Hz simulation with 100 ms catch-up cap; no repeated scene drawing behind blocking states. Physical-phone performance is not established.
- JavaScript syntax checks and `git diff --check` pass. UTF-8 source decoding passes.

## Reproduction and artifacts

Use `node timber-bell/serve.cjs`, then run `node timber-bell/verify.cjs` with `NODE_PATH` pointing at a Playwright installation. `node timber-bell/smoke.cjs` exercises normal real-time play; set `TIMBER_URL` for production. `TIMBER_PHASE` labels verification snapshots and `TIMBER_OUT` selects the artifact directory. Debug controls are exposed only with `?test=1`.

Artifact directory: `C:/Users/forem/.codex/visualizations/2026/10/29/01a1863c-6fa1-7740-a3ac-ba222254f8ea/`. It contains baseline/pass1/final traces, seven heat captures, all required viewport captures, normal-page and live smoke reports, and the active heat-5 `timber-bell-gameplay.png`.

## Blender sprite upgrade — 2026-10-29

The configured Blender MCP server was initialized and used against an isolated factory-startup Blender 5.2.3 instance. Authored an editable 168-object lumberjack, articulated axe, bark, knots, bell, fir bough and stump; reopened the saved `.blend` and rendered it with no missing external files. Eleven transparent 256×256 renders were packed into a lossless WebP atlas, with nonempty alpha, no clipping, and exact lossless decode verified. The renderer uses five 3D axe poses, mirrored branch sprites and separate knot/cracked/bell variants. Runtime Canvas drawing and the original procedural fallback remain local and self-contained.

Focused browser tests passed atlas decoding, visibly distinct branch directions, knot/cracked/bell variants and five axe poses; delayed image delivery preserved exact simulation state, and an aborted image request left the fallback playable. The complete seven-heat regression, real keyboard/touch controls, sessions, pause/help, restart and desktop/landscape/portrait layouts passed again. Controller curve results match the original release, since no gameplay logic changed. New desktop/mobile active-game captures, source round-trip render and verification JSON are in `C:/Users/forem/.codex/visualizations/2026/10/29/01a1863c-6fa1-7740-a3ac-ba222254f8ea/timber-3d/`. Physical-phone performance and human visual/readability feedback remain unmeasured.

## Mobile progression and saved-menu fix — 2026-10-29

Reproduced the user's missing LEFT/RIGHT controls immediately after clearing heat 1 and tapping Next. The hidden results dialog retained `.is-visible`, which matched the mobile control-hiding CSS rule. Results visibility now synchronizes its HTML hidden state and CSS class on start, finish, help and return. The touch rule also ignores hidden dialogs. The regression uses actual mobile taps after each of all seven heat transitions, Retry, results/help/return and shared Reset at 667×375, 740×390, 844×390 and 390×844. Both controls remain visible and register strokes; the pre-fix version failed the same test. Run `node timber-bell/verify-mobile-flow.cjs` with the local server.

The canonical Games.md entry and one In Work start-page card already existed. Added the missing shared flyout link. The user's request to restore start-menu availability authorizes refreshing the previously stale offline inventory; this supersedes the earlier creation-only scope exception. Regenerated inventory contains 54 games and 309 runtime files, including Timber Bell, its Blender sheet, the current start page and flyout. `node scripts/build-offline.cjs --check` passes.

`node timber-bell/verify-menu-update.cjs` recreates an actual pre-Timber saved menu and older inventory, confirms the missing card, installs the current release and closes the old controlled window. After activation it verifies the single In Work card, retained browser data, offline menu/game/sprite loading, working level-two touch controls and the desktop flyout link. The initial test caught the expected immediate-reopen activation race; it now waits for old-cache removal. Existing installed clients should let the update download, close all VibeCade tabs and app windows, wait about five seconds, then reopen. No saves or browser data need deletion.

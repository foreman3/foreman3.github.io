# Pocket Lanes verification

Agent Yoda — scheduled creation resumed 2026-11-19.

Pocket Lanes is an arcade ten-pin bowling game, with three racks and two rolls per rack. Knock down the league's pin quota; strikes and spares add score bonuses. Starting position, release direction, release timing and optional hook matter. The physics uses a fixed 120 Hz step, capped catch-up work, cached Canvas scenery/ball art, ten bounded pin actors and no external runtime assets.

## Difficulty contract

The user's seven-level contract overrides the older level-5-mastery language in the skill and standards.

| League | Target of 30 | Release sway | Period | Hook factor | Collision assist | Recovery |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 House shoes | 16 | 0 | 4.0 s | 0 | 8 | Bumpers, 14 pins may remain |
| 2 Find the pocket | 18 | .006 | 3.8 s | .35 | 7 | 12 pins may remain |
| 3 Read the oil | 20 | .012 | 3.6 s | .55 | 6 | 10 pins may remain |
| 4 League night | 22 | .022 | 3.3 s | .75 | 5 | 8 pins may remain |
| 5 The house final | 24 | .030 | 3.1 s | 1.0 | 4 | 6 pins may remain |
| 6 Scratch league | 27 | .065 | 2.7 s | 1.2 | 2 | Mastery; 3 pins may remain |
| 7 Almost perfect | 29 | .090 | 2.3 s | 1.4 | 0 | Near perfection; 1 pin may remain |

Bumpers teach the opening. Hook and a visible, gently swaying release line start at 2; long/short/medium oil lengths start at 3. Every major element is present before 5. There is no deadline; the player may wait for a good release. The dotted guide displays the exact current initial direction, rather than hiding release error.

All seven leagues were cleared through browser input controls using deterministic physical shot routes: 30 pins and three strikes each. The solver searches actual starting positions/aim/hook; it does not move pins or award wins. Leagues 1–5 also cleared after an intentionally poor first shot followed by spare recovery. Each cleared a stronger open-rack recovery case: six pins banked in the first rack and four permanently missed, then two strikes for 26/30. League 5 still has two further pins of margin in that case.

A single coarse policy waits .4 seconds, rounds aim to .02, aims at the mean remaining pin position and never changes starting position or hook. It scores 30/30 through 1–5 but fails 6 and 7. This is a mechanical benchmark, not a human difficulty or enjoyment study. Physical-phone feel and performance remain unmeasured.

## Build and review passes

- Initial functional version: complete loops, registration, desktop and mobile rails/portrait dock. Baseline review reduced excessive pin carry, introduced visible release sway, fixed the simulation step, and verified all leagues, recovery, layouts and overlays.
- Independent improvement pass 1: readable numeric shot settings, standing-pin/roll counters, a spare map, ball-path feedback, and stronger mastery-league sway. Replayed all seven leagues and early recovery cases; reviewed all five viewports, failure/retry, final victory, help and new run.
- Independent improvement pass 2: enlarged the mobile lane/pins and adapted direct aiming to it; removed peripheral mobile decoration, corrected the medium-oil label, contained flying pins at the rear pit and made Space/R/M work while a native range input has focus. Repeated the whole suite, added permanently missed-pin recovery, and inspected all mobile layouts and late results afresh. Focused touch review added a higher-specificity touch-action rule to protect long captured drags from the shared helper's generic canvas styling. A full touch-only opening exposed Chrome suppressing the synthetic click after a long drag. Roll now uses captured pointer release, cancels cleanly, and preserves keyboard/native button activation without double-launching the next rack. The touch test awaits the actual launched state before advancing its manual simulation.

## Verification

`verify.cjs` checks session instruction gating, all seven clears, 1–5 spare/open-rack recovery, actual keyboard controls, native range input events, score banking, loss/review/retry/new-run flows, mobile captured touch/slide/cancel, reset/sound/pause, returning launch and fullscreen refusal, arcade links and console errors. Required viewports: 1440×900, 667×375, 740×390, 844×390 and 390×844. Controls stay outside the 3:2 playfield; mobile actions stack vertically. The active final desktop screenshot shows league 5, rack 2, a live collision and a prior strike.

`focused.cjs` checks native sliders and global shortcuts, mouse drag/release, blur/focus loop/flyout, realtime pointer-only normal-page opening, touch-only opening, native hook slider, storage denial, and 140 seeded random full leagues for finite physics and bounded pin totals. The normal page has no test API. Test hooks are available only with `?test`.

Final general headless Chrome frame timing: mean 17.74 ms, p95 18.40 ms, maximum 18.70 ms. Cached scenery and a small actor count avoid expensive per-frame art creation. This is desktop browser emulation, not physical-phone profiling.

## Reproduce

Run `node pocket-lanes/serve.cjs` (localhost port 8784). Put an installed Playwright package on `NODE_PATH`, then run `node pocket-lanes/verify.cjs <absolute evidence directory>` and `node pocket-lanes/focused.cjs <absolute evidence directory>`. `LANES_URL` overrides the origin. `node pocket-lanes/pilot.cjs` prints physical clear/recovery routes. `layout.cjs` captures the five layouts for review. Browser scripts use installed Chrome. Run syntax checks on all JavaScript files and `git diff --check`.

## Scope and release limitation

Only pocket-lanes/ and Pocket Lanes registration hunks in Games.md/index.html belong to this release. Preexisting Flappy changes, its QA files, registration wording and offline-assets.js remain untouched and unstaged. The explicit two-file outside-directory scope overrides shared offline regeneration. The read-only offline check reports stale inventory; a separately authorized shared offline/sidebar refresh is needed for installed arcade inventory and a new flyout menu entry. Online registration and the game itself work through the canonical root page.

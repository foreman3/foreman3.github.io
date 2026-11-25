# Mushroom Moon first graphics pass

Agent Yoda — `MM-20261124T0112Z-YODA`. Reserved 2026-11-24T01:09:50.759Z. Verified 2026-11-24T01:20:22.899Z. Local working-tree delivery; no staging, commit, push, publication or email authorized by this timer.

Mushroom Moon was a clean, locally hosted **Ready to Play** entry in the sole worktree. The complete all-branch directory and followed-index histories, including former `mushroom-moon.html`, `mushroommoon.html` and `centipede.html` paths, were reviewed. All 12 index revisions have the same complete renderer hash: the artwork originated in `1d9026f`, and later revisions only changed controls/lifecycle. No earlier art assets, verification record or unfinished reservation existed. See `tests/history.txt` and `history-art.json`. No new historical exclusions were discovered.

The art retains the violet lunar garden, lime healthy/amber damaged/magenta poisoned mushroom identities, green/gold worms, white armor rings, cyan spider/defender and pink scorpion. The direction is painted lunar botany: stippled soil, low quiet ridge, side-margin botanical filigree, cratered moon, cap highlights and gills, stem shading, chitin bands, tiny carapace plates and defender canopy/seams. This preserves the original luminous identity without imposing the preceding toy-workshop, printmaking or geology themes. No new animation or random calls were added. Canvas/CSS are reproducible sources; Blender would add unnecessary assets to this small vector scene.

Presentation defects corrected:

- Desktop menu/help no longer cover the outer HUD cards; labels grow from 9 to 10px.
- Mobile labels grow from 6 to 8px, with compact card padding that clears the first active row.
- Mobile board is vertically centered using the existing body grid; logical canvas, world and control dimensions remain unchanged.
- Mobile charge meter sits below the board, outside the defender's original movement area. Portrait overflow is allowed for this noninteractive meter only; no controls overlap the field.
- Cached cap/body detail and restrained bloom improve material separation; the moon gains craters and shading rather than two flat circles.

One `1280 × H` backdrop, three 48px mushroom caches and at most four 64px worm caches replace repeated static paths and gradients. Original special-enemy paths, player outer path, cap/circle dimensions, armor outline, bullet/Pulse artwork, flash/shake, blinking and pulsation remain. Detail fits inside the original actor shapes. No runtime dependency or runtime file was introduced.

`tests/apply-art.cjs` rebuilds the presentation from the retained `baseline.html` snapshot of `a7d61ec`. All source outside CSS and background/actor drawing is identical after CRLF normalization, including the complete DOM/instructions, adaptive canvas sizing, simulation, timers, collision tests, hitboxes, resources, enemy logic, scoring, audio, controls, touch handlers and endless progression. No production test hooks were added.

`tests/graphics-check.cjs` serves the repository over local HTTP and exposes lexical state only in diagnostic responses. Original and updated pages receive the same seeded randomness, game clock and simulation ticks. Thirty parity scenarios pass: first-load gate, countdown, nine movement/fire keys, help pause, waves 1/2/3/5/10/25, mushroom damage, segment and special kills, charged Pulse, life loss, game over, wave advance, poison, Shift, mute/unmute and restart. Repeated rendering leaves simulation state unchanged. Original indefinite waves remain intact; later-wave fixtures are diagnostic, not claimed natural completion.

Chrome checks cover 1440×900, 667×375, 740×390, 844×390 and supported 390×844 portrait. Actual CDP touch exercises joystick hold, diagonal slide, neutral, release, held Fire, Pulse, Reset, Options/button preference, context-menu prevention and blur cleanup. Keyboard/help, session reload, the current Ready to Play arcade link and normal pages without hooks are checked separately. Sound toggles and a running AudioContext are confirmed. This is browser emulation, not a physical-phone or speaker-listening claim. No page, console or failed game-resource errors were observed. Geometry assertions confirm controls are onscreen, outside the field and the charge meter remains below the board.

The unchanged `docs/restart-check.cjs mushroom-moon` was attempted. Its obsolete whole-catalog coverage assertion fails before reaching any game. The test was not rewritten; output is in `tests/existing-restart-output.txt`. Focused parity and real keyboard/touch Reset independently verify its original `[wave, score, lives] = [1, 0, 3]` expectation. This legacy coverage limitation does not block the local graphics pass.

Screenshots are in `screenshots/`: `before-*` at desktop/667/portrait; `after-*`, `instructions-*` and uninstrumented `live-*` at all five sizes. `wave-2-*`, `wave-5-*` and `wave-25-*` cover desktop and 844×390. Before/after and later captures use matching diagnostic fixtures; live captures use the ordinary frame loop. Short-screen instructions were scrolled to show the reachable launch button.

Node syntax, inline-script parsing, scoped whitespace checks, `node scripts/build-offline.cjs` and its `--check` pass. Offline inventory remains 60 games/373 paths with no additions or removals; sidebar content is unchanged. Version `092c8cc0f984cc66` → `d6eb3eb501f017da`. SHA256 checks preserve all 182 unrelated dirty/untracked paths, including the existing deletion. See `tests/offline-check.cjs`, `offline-results.json`, `offline-before.txt` and `unrelated-before.json`.

Changed scope: `mushroom-moon/index.html`, this evidence document, local tests/screenshots, `docs/GRAPHICS_UPDATES.md`, generated `offline-assets.js` and automation memory. No other game, catalog, shared control or original regression rules changed. No blocker to local completion; release remains unpublished.

Final performance: uninstrumented frame medians 17.4–17.7ms, p95 18.0–18.4ms across all five viewports. Matched synchronous Canvas submission median improves 0.3→0.2ms desktop and 0.2→0.1ms at 667×375. These are headless-host observations, not GPU presentation or physical-device benchmarks. See tests/graphics-results.json and performance-results.json.

## Owner-authorized release

Agent Yoda, 2026-11-25T19:54:01.450Z: owner authorized committing and pushing this pass. Fresh isolated desktop/mobile smoke and source-preservation checks pass; see tests/release-results.json and screenshots/release-*.jpg. Final inventory generated against 68af8ab retains all378paths/61games. Other pending graphics/catalog work is excluded. Remote delivery is confirmed in the task result and memory after push.

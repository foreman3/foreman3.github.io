# Lunar Lander first graphics pass

Agent Yoda · `LL-20261121T1905Z-YODA` · 2026-11-21 19:05:28–19:18:19 UTC.

Completed locally, unpublished. Baseline: `90c920e`. Original game creation `bf8b077`; subsequent history contains only restart fix `16873a7`, with no former root version or earlier artwork pass.

Release follow-up, 2026-11-21, Agent Yoda: the owner subsequently authorized committing and pushing this pass. The release package includes the game, verification evidence and graphics register. Its offline inventory is generated from the release contents, excluding unrelated uncommitted Flappy/catalog changes. The release task result records the confirmed remote delivery.

## Appearance

Scientific lunar field expedition: chalk-gray cratered regolith, slate shadows, a subdued distant ridge, blue Earth and a faceted silver survey module with foil insulation. The existing amber guidance computer, terrain outline, module silhouette, feet and landing coordinates remain recognizable. Larger telemetry and landing labels address the original mobile readability defect. Decorative geology stays below the exact collision surface; distant geology is much darker. The reproducible artwork is Canvas code inside `index.html`, cached once per terrain change. Blender was unnecessary for this procedural scene.

| View | Before | After |
| --- | --- | --- |
| Desktop 1440×900 | [Before](screenshots/before-1440x900.jpg) | [After](screenshots/after-1440x900.jpg) |
| Landscape 667×375 | [Before](screenshots/before-667x375.jpg) | [After](screenshots/after-667x375.jpg) |
| Landscape 740×390 | — | [After](screenshots/after-740x390.jpg) |
| Landscape 844×390 | — | [After](screenshots/after-844x390.jpg) |
| Portrait 390×844 | — | [After](screenshots/after-390x844.jpg) |
| Mission 3 desktop | — | [After](screenshots/after-1440x900-mission-3.jpg) |
| Mission 5 desktop | — | [After](screenshots/after-1440x900-mission-5.jpg) |
| Mission 3 mobile | — | [After](screenshots/after-844x390-mission-3.jpg) |
| Mission 5 mobile | — | [After](screenshots/after-844x390-mission-5.jpg) |

## Behavior preservation

`tests/graphics-check.cjs` parses the inline script and proves the simulation/audio/constants prefix, frame/input/test-hook/startup suffix and DOM/CSS/instruction contents are byte-identical to baseline. The only production edits are within the rendering region. The same random-call stream is retained, including the original engine flame call.

Two isolated browser contexts then run baseline and edited code with identical frame ticks and seeded randomness, comparing complete gameplay/control state across 27 scenarios. Opening gating, keyboard bindings, help/pause, restart, five missions' safe landings/scoring and crashes/hull loss, pointer hold/release and sound toggles passed. Mission count, terrain, collision geometry, physics, fuel, timers, scores, progression, persistence and controls are unchanged. See `tests/graphics-results.json`.

`tests/visual-check.cjs` loads the locally served game in Chrome 157 at all five dimensions, checks control bounds/non-overlap and exercises actual touch events through Chrome's input protocol. Instructions finish their existing mobile fullscreen settling flow before screenshots. Sound toggles and restart pass. Existing hooks inspect missions 3 and 5; production progression is unchanged. All final screenshots were visually reviewed, with clear surface/pad boundaries and no HUD collisions. Median frame interval 17.5–17.8 ms; p95 18.2–18.4 ms on this headless host. See `tests/visual-results.json`. The minimal test server's unrelated root favicon request is answered with 204 by the fixture; no game asset or JavaScript errors occurred.

## Checks and delivery

- Inline JavaScript parsing, deterministic preservation checks and responsive browser checks passed.
- `node scripts/build-offline.cjs` and `node scripts/build-offline.cjs --check` passed: 60 games, 371 files; all preexisting offline asset paths retained.
- `git diff --check` passed.
- Unmodified `node docs/restart-check.cjs lunar-lander` stops before its selected case because its existing whole-catalog assertion lacks newer games. No regression rules were weakened. The focused test independently executes its Lunar Lander mutation/restart expectation `[level,score,hull] === [1,0,3]`, passing.

Run from the repository root with Playwright available through normal resolution or `NODE_PATH`, and a localhost server on 8766:

```text
node lunar-lander/tests/graphics-check.cjs
node lunar-lander/tests/visual-check.cjs
node scripts/build-offline.cjs --check
```

Changed: this game’s `index.html`, verification document, tests/results, before/after screenshots, shared graphics register and generated `offline-assets.js`. `sidebar.html` was regenerated without changing content. Existing dirty catalog and Flappy files were preserved. Nothing staged, committed, published or emailed. No blocker to completion of the local graphics pass.

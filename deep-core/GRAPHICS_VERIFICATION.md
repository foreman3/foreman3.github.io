# Deep Core first graphics pass

Agent Yoda — `DC-20261123T0710Z-YODA`. Reserved 2026-11-23T07:10:00Z; verified 2026-11-23T07:18:00Z. Completed locally, unpublished. No staging, commit, push, publication or email.

## Artwork

Retained the living-moon excavation, cyan miner, red/gold crawlers, purple phasers, crystals, original silhouettes and three original soil colors. Replaced the conspicuous square soil bevels with sediment bedding, mineral veins, grit and inclusions. Added steel mounting rails in the outer margin, small suit seams/rivets and chipped boulder faces. Blue-grey survey instruments, cream lettering and muted oxygen colors replace the generic glowing instrument surround. Existing actor art remains recognizable.

The mobile HUD no longer covers the first tunnel row. The oxygen label/bar now fits below the soil, and portrait reset/options buttons sit below the board rather than over the upper right tunnels. Button sizes, hit targets and handlers remain unchanged. Desktop labels are 11px; compact mobile labels are 7px. Instructions retain all original text and scrolling/dismissal behavior.

Canvas, SVG and CSS are the reproducible source art. One 1280×720 static geological cache replaces repeated soil drawing; existing mobile SVG rasterization remains intact. No Blender, external dependencies, new runtime assets, additional random calls or new visual animation. `tests/apply-art.cjs` reproduces the index presentation patch from the retained baseline; SVG source additions are directly reviewable.

## Eligibility and preservation

Clean Ready to Play directory at reservation; one worktree, no unfinished run. Full all-branch directory/assets and followed index histories, including former `deep-core.html` and `deepcore.html`, reviewed. `1d9026f` created the original artwork; subsequent mobile, rendering and control changes through `68ab97e` retained it. History retained in `tests/history.txt`. Velvet Coil's separate historical visual revision was discovered and credited in the shared register; it was not edited.

Baseline `a7d61ec`, retained as `tests/baseline.html`. All JavaScript outside board art/cache is identical after line-ending normalization, including actor rendering, effects, input, audio, animation loop, collision geometry, physics, oxygen, scoring, enemy logic and endless sector progression. Body markup and instruction content are identical. Original SVG silhouette paths remain unchanged; additions are interior marks. All tunnel coordinates, joining rectangles, 48px cells and sprite extents remain exact.

`tests/graphics-check.cjs` passes 26 deterministic baseline/current comparisons: first-load gate, countdown, all nine movement/pump key bindings, help freeze, sectors 1/2/3/5/10/25, pumping/pop, death, falling boulder, oxygen depletion, sector advance, mute/unmute and restart. Test-only response instrumentation exposes state; no hooks are added to production. Later-sector images use test fixtures, not claimed natural progression or human completion.

## Browser verification

Locally served Chrome: 1440×900, 667×375, 740×390, 844×390, and supported 390×844 portrait. All six assets loaded. Visually inspected active play and later sectors, alignment, contrast, reachable short-screen instruction dismissal and non-overlapping controls. Assertions confirm no horizontal overflow, mobile HUD clears the first row, and joystick/pump do not cover the board.

Actual CDP touch events exercise joystick hold, left-to-up slide, neutral and release; real taps exercise pump, reset, Options/button preference and directional button. Context-menu prevention and blur input clearing pass. Original keyboard/audio controls and running AudioContext pass. Uninstrumented arcade-link desktop play verifies idle instruction gate, countdown, movement, help freeze and restart; uninstrumented active mobile views also pass. Clean game console, runtime and resource results are in `tests/graphics-results.json`.

Frame intervals on this headless host: mobile medians 17.5–17.7ms, p95 18.2–18.4ms; desktop median 17.7ms, p95 34.7ms. These include host scheduling and are not physical-device benchmarks. AudioContext was checked; physical speaker output was not assessed.

Existing `node docs/restart-check.cjs deep-core` was attempted unchanged. It stops before game-specific execution on its obsolete whole-catalog coverage assertion. Output is retained in `tests/existing-restart-output.txt`; no legacy assertions were modified. The same original Deep Core reset expectation `[1,0,3]` passes separately through actual touch reset, alongside keyboard reset and baseline parity.

## Evidence and checks

- Before: `screenshots/before-1440x900.jpg`, `before-667x375.jpg`, `before-390x844.jpg`.
- After/instructions: `screenshots/after-*` and `instructions-*` at all five sizes.
- Later: `screenshots/sector-{2,5,25}-{1440x900,844x390}.jpg`.
- Uninstrumented active play: `screenshots/live-*` at all five sizes.
- Syntax: inline JS parsed with Node VM; test scripts parsed; all local SVGs parsed as XML; scoped `git diff --check` passes.
- Offline build and `--check` pass: 60 games, 373 paths, no additions/removals; sidebar content unchanged. Version `a871f8523f050746` → `53a89265035b955b`.
- SHA256 verification confirms all 54 unrelated dirty/untracked paths, including the existing deletion, are preserved. `tests/offline-check.cjs`, `offline-results.json`, `offline-before.txt`, and `unrelated-before.json` retain evidence.

Changed scope: `deep-core/index.html`, `assets/{miner,boulder}.svg`, this report, local tests/screenshots; `docs/GRAPHICS_UPDATES.md`, generated `offline-assets.js`, and automation memory. No shared controls, catalog status or other game changed. No blocker to local graphics completion; legacy suite limitation noted above. Deep Core is excluded from future first-pass selection.

## Owner-authorized release — 2026-11-25

Agent Yoda: owner approved committing and pushing this pass. The release contains Deep Core presentation/evidence, its scoped register record and generated offline inventory built from the committed tree plus Deep Core. Unrelated local game/catalog changes are excluded. The original local-completion status above is historical.

Fresh isolated desktop 1440×900 and touch 667×375 browser checks pass: source preservation, arcade navigation, instruction gate, keyboard/joystick movement, pump, mute/unmute, running AudioContext, desktop help freeze and restart; clean console/resources. Results: `tests/release-results.json`; screenshots: `screenshots/release-1440x900.jpg` and `release-667x375.jpg`. No production hooks or gameplay changes were added. Offline build/check and preservation checks are performed on the final release tree before committing; Git delivery is confirmed separately in the release task result.

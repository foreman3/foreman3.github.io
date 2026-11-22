# Galactic Wing graphics verification

Agent Yoda — run `GW-20261122T0708Z-YODA`. Reserved 2026-11-22T07:08:00Z; verified 2026-11-22T07:17:54Z. Completed locally, unpublished.

## Eligibility and direction

Ready to Play, locally hosted, clean directory at reservation, sole worktree. Full `git log --all --follow -- galactic-wing/index.html` contains creation `4191704`, mobile/restart `173db3b`, restart `16873a7`. Full directory and former root paths were checked, along with `drop-game/index.html` history. Creation explicitly deleted the unrelated fruit-drop implementation and added this shooter from scratch. Fruit artwork revisions such as `fd72d0c` therefore do not establish an earlier Galactic Wing pass. No previous art/evidence files or active graphics reservation existed here.

Illustrated interstellar flight poster: midnight navy `#172b43`, ivory `#ede2c8`, vermilion `#b9503e`, muted teal `#387b83`, lavender scouts. Enamel panels and directional ink shading enrich the existing silhouettes. A quiet banded planet, orbit, grain and instrument frame replace the nearly empty backdrop. Background Canvas artwork is cached once, replacing repeated dust gradients. Inline Canvas code and local CSS are the reproducible sources; Blender and bitmap assets would add unnecessary complexity for this vector-shaped formation shooter.

Fixed flat hull surfaces, indistinct panel details, undersized HUD labels (12 → 20 logical pixels; values 23 → 30), and portrait FIRE/playfield overlap. Portrait controls now sit in existing empty space below the field, retaining their dimensions and handlers. The original player/enemy outer paths, rotations, scale pulse, projectile drawing and hit geometry remain intact. Leaders retain their red/gold identification, teal second row and lavender scouts; leader lamps now show remaining armor.

## Preservation evidence

`tests/graphics-check.cjs` compares against Git baseline `cc2ed77`. All JavaScript outside the contiguous renderer section is byte-identical after CRLF normalization, including constants, wave configurations, RNG initialization, physics, collision tests, scoring, all timers, recovery, input, audio, startup and production hooks. Body DOM, instructions and buttons are identical. Assertions retain the four outer actor paths and the number of random calls. No extra rendering randomness; original render-time hit-flash decrement retained unchanged.

Twenty deterministic scenarios compare complete actor/projectile/particle state, counters, clocks, keys and progression using identical RNG streams, animation ticks and queued timers: instructions, entry, arrows/A/D/Space, help, waves 2/3/4/5/8, diving leader score, death/relaunch, mute/resume, restart, wave-clear transition, game over. All pass in `tests/graphics-results.json`. Original five wave configurations and continuing waves beyond five remain unchanged; no campaign normalization or difficulty tuning.

## Browser and regression checks

Served over localhost with installed Chrome/Playwright. Required viewport checks passed at 1440×900, 667×375, 740×390, 844×390, plus supported portrait 390×844. Each checks first-load gating, reachable instruction dismissal, live gameplay and resource/runtime errors. Touch CDP input exercises joystick hold, right-to-left slide, neutral and release, FIRE hold/release, and actual shared restart. Desktop exercises movement, help/pause/resume, restart and sound toggles. Controls are measured onscreen and outside the field in every mobile layout. Later-wave screenshots use the existing `__galacticWing.setWave` hook; this is a jump for inspection, not a claim of natural progression.

No game console, runtime, HTTP or asset errors. Existing AudioContext reaches `running` at all sizes; no claim of physical-device testing or audible listening. Headless frame interval median 17.6–17.7 ms, p95 18.2–18.5 ms on this host. Star motion, actor pulse, invulnerability blink, flame timing and visual hit flashes retain their original behavior. Projectiles remain bright against the low-contrast planet.

`tests/graphics-check.cjs smoke` separately follows the actual root arcade link, launches the uninstrumented game, steers/fires and captures `live-1440x900.jpg`; `window.__audit` is absent and no console/runtime errors occur. See `tests/smoke-results.json`.

Inline script parsing, Node syntax and `git diff --check` pass. Offline build and `--check` pass: 60 games / 373 files; all 372 preexisting paths retained, only `galactic-wing/presentation.css` added. `sidebar.html` regenerates without a content change; see `tests/offline-results.json`.

Existing `node docs/restart-check.cjs galactic-wing` was attempted unchanged. It stops before game execution at its obsolete whole-catalog assertion, `Every local canonical game is covered`; output retained in `tests/restart-output.txt`. Its Galactic Wing expectation `[wave,score,lives] === [1,0,3]` passes independently in the deterministic test, and actual mobile restart passes at every mobile size. No legacy rules were changed.

## Screenshots and reproduction

All screenshots are in `galactic-wing/screenshots/`:

- Before active gameplay: `before-1440x900.jpg`, `before-667x375.jpg` (original wave 3).
- Final active gameplay: `after-1440x900.jpg`, `after-667x375.jpg`, `after-740x390.jpg`, `after-844x390.jpg`, `after-390x844.jpg`.
- First-load instructions: matching five `instructions-WIDTHxHEIGHT.jpg` files; short-screen cards scroll to the launch button, exercised by the actual click flow.
- Later states: `wave-3-*`, `wave-5-*`, `wave-8-*` at 1440×900 and 844×390.
- Uninstrumented final gameplay: `live-1440x900.jpg`.

Run `node galactic-wing/tests/graphics-check.cjs`, then `node galactic-wing/tests/graphics-check.cjs smoke` with Playwright resolvable through NODE_PATH and Chrome installed. The harness serves the repository itself. `before` mode captures the pre-edit layout and should only be used before editing; retained screenshots are the original evidence. Browser requires localhost access outside the restricted network sandbox on this host.

## Delivery

Changed scope: `galactic-wing/index.html`, `presentation.css`, this file, `tests/`, `screenshots/`, `docs/GRAPHICS_UPDATES.md`, generated `offline-assets.js`, and automation memory. Existing dirty Flappy/catalog/Tetris work was preserved. No shared runtime or other game changes. Nothing staged, committed, pushed, published or emailed. No blocker to this pass; skip Galactic Wing for the rest of the first-pass effort.

Release follow-up — 2026-11-22, Agent Yoda: the owner subsequently authorized commit and push. Fresh source-preservation assertions and uninstrumented arcade-link/keyboard smoke pass. The release packages only Galactic Wing and its evidence, its register entry and an offline inventory generated from HEAD plus Galactic Wing. Other pending games and catalog changes remain local. Git delivery is confirmed in the release task result; no email requested.

Release inventory: 60 games / 372 paths, retaining all 371 baseline paths and adding only this game's stylesheet. Isolated release build and `--check` pass; sidebar is unchanged. See `tests/release-inventory-results.json`. The larger working-tree inventory includes unrelated unpublished work and is preserved separately.

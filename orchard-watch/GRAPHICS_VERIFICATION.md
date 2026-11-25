# Orchard Watch first graphics pass

Agent Yoda · OW-20261123T0114Z-YODA · 2026-11-23. Reserved 01:14Z; completed 01:16Z. Verified local changes only; unpublished. Nothing staged, committed, pushed or emailed.

The original autumn co-operative design remains recognizable. Russet/ochre foliage, sage hills, chestnut fur, straw hats, earthen furrows and cream stationery gain painted shading and material detail. The marmots retain their stripe/apple; gardeners retain the broad hat/flower. The original character paths, clipping, emergence animation, twelve burrows and input regions remain in place. Keyboard labels now have high-contrast keycaps; HUD labels increase from 9→10px desktop and 8→9px touch.

Canvas/CSS are the reproducible art sources. The existing resize-only backdrop now includes leaf marks, tree grain, apple stems/highlights, furrows, pebbles, grass and a textured sign. Two 202×215 Canvas portrait caches add shading, fur, whiskers, woven straw and jacket seams. No gradients or texture generation run inside animation; no random calls, external assets, dependencies or Blender pipeline were added.

## Eligibility and preservation

Full all-branch/follow history and former `orchard-watch.html`/`orchardwatch.html` paths were checked. Creation `ddc63b8` supplies the original illustrations. `d16fbf4` expanded/reflowed the grid and pacing while retaining the original artwork. Original verification's internal creation refinements are not a subsequent artwork rebuild. No game edits or active reservation existed. Unrelated Flappy, catalog, Kiln Cascade and earlier register changes were preserved.

Compared with `a7d61ec`, all JavaScript outside static/actor artwork and all HTML/instructions are identical after line-ending normalization. Resize/target geometry, frame loop, effects, life bars, input, audio and every simulation rule remain unchanged. All five harvests, quotas, timing, burst sizes, penalties, scoring, saved session gating and restart behavior are intact. The actor cache uses the original path coordinates and rise/fall/clip wrapper.

`tests/graphics-check.cjs` passes 28 deterministic baseline/final comparisons: gate; twelve keys; help/pause; five seeded harvests; friendly penalty; escape; empty-hit recovery; timeout; final victory; victory restart; sound; reset. Results: `tests/graphics-results.json`.

## Browser evidence

Locally served Chrome checks at 1440×900, 667×375, 740×390, 844×390 and portrait 390×844 pass. All twelve actual touch taps and desktop key mappings, instruction gating, reachable dismissal, pause, help, reset and sound controls work. AudioContext runs after a hit. No game resource, console or runtime errors. Existing target geometry is unchanged, onscreen and non-overlapping; minimum target 48.58px portrait and 66.69px landscape. Median frame intervals 17.4–17.8ms, p95 18.2–18.4ms on this headless host; this is not physical-device or listening verification. See `tests/live-check.cjs` and `tests/live-results.json`.

The existing `verify.cjs` was run without changing any assertions. Its gameplay, touch, orientation changes, session reload, fullscreen refusal, progression, recovery, endings and timing checks pass. It stops at its final obsolete catalog assertion requiring an **In Work** card; Orchard Watch is currently **Ready to Play**. `tests/run-existing.cjs` preserves every assertion and saves the report before that failure, adjusting only root/output plumbing. See `tests/existing-output.txt`, `tests/existing-regression.cjs` and `tests/existing-regression/pre-catalog-results.json`. A separate live check verifies the current Ready to Play card and uninstrumented arcade navigation.

The original five simulated clear times remain 22.86 / 17.46 / 16.02 / 14.90 / 10.82 seconds, with 6 / 6 / 6 / 4 / 3 baskets. Opening burst overlap remains 1 / 2 / 3 / 4 / 5. These match the earlier VERIFICATION.md and are mechanical benchmarks, not human ratings. No rules were adjusted to satisfy the obsolete assertion.

## Screenshots

All paths below are within `orchard-watch/screenshots/`:

- Before: `before-1440x900.jpg`, `before-667x375.jpg`, `before-390x844.jpg`.
- After: `after-1440x900.jpg`, `after-667x375.jpg`, `after-740x390.jpg`, `after-844x390.jpg`, `after-390x844.jpg`.
- Instructions: matching `instructions-*` and `instructions-start-*` for all five sizes; latter capture reachable dismissal.
- Later states: `harvest-2-1440x900.jpg`, `harvest-5-1440x900.jpg`, `harvest-2-844x390.jpg`, `harvest-5-844x390.jpg`.
- Actual uninstrumented play: `live-1440x900.jpg`.

Before/after use identical frozen fixtures. Later states use existing diagnostics; natural progression is not claimed. All five after layouts, representative later harvests and short-screen instructions were visually inspected.

## Final checks and scope

Node parsing and scoped `git diff --check` pass. `node scripts/build-offline.cjs` and `node scripts/build-offline.cjs --check` pass: 60 games / 373 paths; every prior path retained, none added; sidebar unchanged. `tests/offline-check.cjs` verifies SHA256 preservation of all 12 unrelated dirty paths, including an existing deletion, before/after rebuilding. Results and starting inventory are saved beside the script.

Changed: this game's `game.js`, `style.css`, this evidence, `tests/`, `screenshots/`, `docs/GRAPHICS_UPDATES.md`, generated `offline-assets.js` and automation memory. No other game/shared/catalog files changed. No blocker to the local pass; the legacy catalog assertion is documented above. Orchard Watch is completed and excluded from future automatic first passes.

Reproduce with Playwright available through NODE_PATH: `node orchard-watch/tests/graphics-check.cjs`, `node orchard-watch/tests/live-check.cjs`, `node orchard-watch/tests/run-existing.cjs` (expected legacy assertion), `node orchard-watch/tests/offline-check.cjs`. Browser verification needs localhost access in this environment.

## Owner-authorized release follow-up

Agent Yoda, 2026-11-25T19:50:28.180Z: owner authorized commit and push. Fresh isolated browser checks at all five sizes pass, including keyboard/touch, gate, sound, help/pause, reset and current arcade navigation. Source preservation, syntax and generated offline checks pass against committed 66d2bde plus Orchard Watch: 61 games / 378 paths, none added/removed. Other local work is excluded and preserved. See tests/release-results.json and screenshots/release-live-1440x900.jpg. Remote delivery is confirmed in the release task result.

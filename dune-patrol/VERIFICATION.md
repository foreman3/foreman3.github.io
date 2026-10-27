# Dune Patrol verification — 2026-10-27

Exactly one new game: a Moon Patrol-style automatic rover crossing, variable-height jumps, forward/upward guns, destroyable rocks, bomb-dropping aircraft, linked fissures, armored aircraft and optional high-jump survey samples. Canvas with a cached sky, parallax etched mesas, capped effects, HTML HUD/dialogs and direct two-finger touch controls. No external assets or libraries in the runtime.

## Difficulty observed in Chrome

The user's seven-route contract supersedes older level-5-mastery wording in the skill and standards. All major mechanics appear by route 5. Hull refills each route; retry restores the route's starting score. Protection lasts 2.1 seconds through route 6 and 0.8 seconds on 7. Fissure collisions rescue the rover, retain progress, break the chain and cost one hull section.

| Route | Speed | Length | Regular spacing | Base fissure width | Hull | New demand |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 Apricot Flats | 195 | 5100 | 680 | 78 | 4 | Forgiving five-gap introduction |
| 2 The Broken Road | 210 | 6000 | 650 | 86 | 4 | Shoot rocks; optional high-arc samples |
| 3 Kite Mesa | 225 | 6700 | 620 | 92 | 4 | Aircraft and interceptable bombs |
| 4 Twin Fissures | 240 | 7500 | 575 | 102 | 4 | Linked jumps and landing rhythm |
| 5 Iron Sky | 255 | 8300 | 540 | 112 | 4 | Two-hit armored aircraft; combined mechanics |
| 6 Redline Pass | 325 | 10600 | 425 | 126 | 3 | First mastery: tighter landing cadence, denser raids |
| 7 The Last Horizon | 370 | 12900 | 380 | 136 | 2 | Near-perfect timing across 21 jumps; one recovery |

An input-only, exact-state controller making decisions every 200 ms cleared all seven in 26.16 / 28.57 / 29.78 / 31.25 / 32.55 / 32.62 / 34.87 simulated seconds with no hits. A slower 400 ms controller cleared 1–5 with 3 / 4 / 3 / 1 / 2 hull left, then failed 6 at 42% and 7 at 14%. A 50 ms controller cleared every route; its final route recovered one hit and finished with one hull. Different timing policies do not produce monotonic hit counts, and faster decisions alone do not guarantee better scoring.

Route 5 recovered a deliberate ten-second no-input opening, took two actual collisions, then cleared at 32.55 seconds with two hull sections. Route 4's slower run recovered three hits. These demonstrate meaningful recovery margin through 5. Full route 1 also cleared using actual Chrome keyboard events, five jumps and zero hits. These are optimistic mechanical feasibility benchmarks with exact test state, not human reaction-time studies or evidence that the game is fun. Human feedback on the combined demands of 3–7 remains useful.

## Iteration

Baseline browser verification found a forward-shot/rock hitbox mismatch, which was fixed before the full baseline passed. First additional whole-game review covered every route, results/retry, desktop, portrait and all required landscapes. Added optional high-arc samples, etched terrain strata, cacti, roadside stakes, bomb trails and damage feedback; tightened routes 6–7. The full suite passed again.

Second independent review covered the same full experience. Added aircraft propeller/metal details and rover luggage rack/aerial/vents/lamps, explicitly labeled rescue protection, and prevented a rock destroyed at contact from still damaging the rover. Expanded verification with an actual-keyboard full opening and a fresh normal-page smoke. Final full suite and normal smoke passed.

## Verified

- First-load instructions freeze simulation and audio; session return; initial/shared reset preserves gating; short-screen instructions scroll. Desktop help freezes play and returns to the proper playing/result state. Pause/resume, sound, blur and visibility input clearing.
- Keyboard jump/variable height/fire and full opening, touch simultaneous jump/fire, held input, sliding off the button under capture, release/cancel, context-menu suppression, shared mobile reset, returning mobile launch and graceful fullscreen refusal.
- Real fissure, rock, bomb and shot collisions; bomb interception, two-hit armor, protection/expiry, scoring, current-route retry/score rollback, native Enter progression, final victory/new run and failure restart.
- 1440×900 desktop, 667×375 / 740×390 / 844×390 mobile landscape and 390×844 portrait. Controls remain beside or below the canvas; no overlap, horizontal overflow, clipping or aspect distortion. Direct action buttons suit this automatic runner; no joystick is necessary.
- Local new-game console/page errors empty. Arcade card exists once under In Work and navigates correctly. Games.md registration matches. Normal page exposes no test API; `?test=1` enables bounded verification hooks.
- Final active frames: desktop mean 17.66 ms / p95 18.5 / max 18.8; touch emulation mean 17.83 / p95 18.5 / max 19.0. Physical-phone performance is unmeasured. Paused/modal rendering is idle; reduced-motion disables decorative bobbing, propeller motion and screen flash.
- Node syntax checks passed for runtime and verification scripts; `git diff --check` passed. No existing game/shared file changed.

## Reproduction and artifacts

With Playwright on NODE_PATH: `node dune-patrol/serve.cjs`, then `node dune-patrol/verify.cjs` and `node dune-patrol/smoke.cjs`. Set DUNE_PHASE for separate reports, DUNE_OUT for artifacts, DUNE_URL for a different server. Test Chrome is installed at `C:/Program Files/Google/Chrome/Application/chrome.exe`. The localhost server and Chrome require environment network permission here.

Artifacts: `C:/Users/forem/.codex/visualizations/2026/10/27/01a17bf1-646e-7ce2-b5ac-00d5f4c8b039/`. Includes baseline/pass1/final reports, all seven route captures, required viewport captures, normal-page screenshot and active `dune-patrol-gameplay.png`.

## Strict-scope offline exception

The user explicitly allows only Games.md and index.html outside the new game directory. Therefore offline-assets.js is intentionally unchanged. The read-only offline check reports stale inventory (53 games / 303 runtime files); installed offline clients do not receive this new game in their offline cache through this release. Online direct play is the release target. Existing games, saves and service worker code are untouched.

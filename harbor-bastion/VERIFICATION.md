# Harbor Bastion release verification

Verified 2026-10-06 in local Chrome over HTTP. Harbor Bastion is a Rampart-style fortress arcade: fit wall polyominoes around the keep, then lead cannon shots against raiders and intercept their shells. Cached Canvas illustration uses a sandstone fortress, a painted green coastal headland, rigged sailing ships, and a turquoise sound. Direct pointer/touch manipulation fits the concept; no joystick is needed.

## Scope and contract

- Read AGENTS.md, all GAME_STANDARDS.md, both installed and repository builder skills, Games.md, arcade registration, directory inventory, recent history and supplied automation memory.
- User's explicit seven-coast curve supersedes the older level-5-mastery wording: all major mechanics by 5, first mastery at 6, near perfection at 7.
- Exactly one new directory. Only Games.md and index.html changed outside harbor-bastion/. Initial and pre-release origin fetches matched main; no integration was necessary. No existing game/shared files changed.
- Registered one card and canonical list entry under In Work. Local root card navigated to the correct title without script errors.

## Final challenge profiles

| Coast | Missing stones | Repair seconds | Fleet | Ship speed | Arrival seconds | Keep health | Mends | Distinct demand |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 4 | 45 | 3 | 0 | 3.5 | 5 | 2 | Forgiving wall overlap and stationary targets |
| 2 | 6 | 42 | 4 | 24 | 3.2 | 5 | 2 | Moving targets and leading shots |
| 3 | 8 | 39 | 5 | 29 | 2.8 | 5 | 2 | Two-hit armored ships |
| 4 | 10 | 36 | 6 | 34 | 2.4 | 5 | 2 | Elbow pieces and denser armored traffic |
| 5 | 12 | 33 | 8 | 39 | 1.85 | 5 | 2 | Three-hit galleons and staggered double volleys |
| 6 | 14 | 24 | 10 | 54 | 1.5 | 3 | 1 | Faster fire and fleet pressure; first mastery |
| 7 | 16 | 19 | 12 | 67 | 1.25 | 2 | 0 | Precise target priority and shell interception |

Cannons reload in 0.42 seconds; shots travel at 600 logical units/second. Enemy repeat firing intervals are 9/8.5/8/7/6.3/4.1/3 seconds. First shots begin after 6/4/3.5/2.5/1.9/1.25/0.8 seconds, with a small per-ship stagger. Shells travel for 2.4 seconds through coast 5 and 1.65 thereafter. Repairs refill walls and remove incoming shells, but never restore keep health. Retry rolls back the current coast's score.

## Browser observations

All seven coasts were jumped to and exercised in Chrome. Deterministic controllers use exact state exposed only with `?test=1`, fixed 60 Hz simulation and real gameplay functions. These are reproducible mechanical benchmarks, not human reaction-time requirements or evidence of enjoyment.

| Coast | 350 ms leading controller | Battle seconds | Remaining health | Missed shots |
| --- | --- | ---: | ---: | ---: |
| 1 | Clear | 8.28 | 5 | 0 |
| 2 | Clear | 10.48 | 5 | 1 |
| 3 | Clear | 12.10 | 5 | 1 |
| 4 | Clear | 13.78 | 5 | 1 |
| 5 | Clear | 15.43 | 4 | 2 |
| 6 | Clear, one repair used | 14.88 | 3 | 1 |
| 7 | Failed at 8 of 12 ships | 12.85 | 0 | 0 |

- A simpler 450 ms controller aimed at current positions, cleared 1–5, and failed 6–7. It has exact target positions and is more accurate than an unaided human, despite omitting leading and deliberate interception.
- Coast 5 with five deliberately off-target shots cleared in 15.77 seconds after seven total misses and two keep hits, ending with three health and both repairs spent. A separate recovery test applied two real damage-function hits and still cleared with three health after nine missed shots.
- A predictive controller that tracks pending shots and prioritizes damaging shells cleared 6 in 16.48 seconds with one miss and five interceptions. It cleared 7 in 24.45 seconds with 44 shots, no misses and 25 interceptions. The ordinary leading controller's zero-miss failure on 7 shows that shooting ships alone is insufficient there.
- Opening repairs took 3/4/5/5/5/5/7 placements in the greedy planner. Repair clocks leave generous learning time through 5; 6–7 shorten the decision budget. Overlapping pieces can form alternative valid enclosures.

## Two additional improvement passes

After the complete functional build and its initial full browser review:

1. Replayed all seven coasts and reviewed desktop, three mobile landscape sizes, portrait, help, failure and restart. Shortened the opening, brought first enemy fire forward progressively, added visible firing countdowns and low-time/health warnings, fixed keyboard shortcuts after button focus, added modal focus wrapping, corrected repair-time scoring, and detailed the shore, docks, settlement, keep and ship rigging. Re-ran the complete suite and reviewed screenshots.
2. Freshly reviewed the result from pass 1. Corrected damage to respect actual alternate wall enclosures; added breach counts and sealed feedback; sharpened moving desktop art; reduced downtime by tightening fleet spacing; enabled shell interception over land as well as sea; verified an accurate coast-7 clear; restored banner/window contrast after masonry details; respected reduced-motion preference for decorative bobbing. Active combat profiling then exposed a mobile slowdown. Cached the fort layer, reduced HUD refresh to 10 Hz while retaining 60 Hz simulation, and paused the unrelated desktop test page during mobile profiling. Final full suite, screenshots and performance checks passed.

## Verification coverage and performance

- JS syntax checks for game.js, art.js and verify.cjs; whitespace and staged-scope checks.
- Instructions freeze all gameplay, timers and audio before launch; native Space activates the launch button. Session return and mobile returning-fullscreen gate work. A rejected fullscreen promise does not block play.
- Actual keyboard cursor movement, rotation, placement, fire, pause/resume, help freeze, sound and reset. Pointer aiming/fire and rapid current-coast retry. Actual touch placement, rotate, pause, sound, repair and shared reset.
- Chrome CDP touch hold, slide, release and cancel; held firing repeats, aim follows movement, cancellation clears firing. Blur pauses and releases input. Canvas suppresses scrolling/context menus and captures pointers.
- Actual wall removal, damage through a structural breach, repair and shell interception; score and hull changes; time-out, progression and victory/failure restart paths exercised.
- Visually reviewed 1440×900, 667×375, 740×390, 844×390, and 390×844. Landscape actions stack outside the playfield, HUD is separate, no overflow/clipping. Portrait gives a purposeful rotation prompt and pauses simulation. Short instruction dialogs scroll with a reachable launch button.
- Active desktop mean/p95 frames: 17.47/18.3 ms. Active touch-mobile coast-5 combat: 17.55/18.3 ms. Fixed-step catch-up capped at 100 ms; background/fort cached, particles capped at 100, blocking overlays skip redraw work, mobile backing resolution 1000×600.
- New game console/page errors: none. Arcade page script errors: none. Its existing favicon HTTP 404 is preserved under the strict registration-only scope.

## Reproduce

Serve the repository root over HTTP. Install/use Playwright and local Chrome, then run `node harbor-bastion/verify.cjs`. Set `HARBOR_BASE_URL` to the server origin and `HARBOR_REPORT_DIR` to the output directory. `HARBOR_CURVE_ONLY=1` runs only the level benchmarks. The default Chrome path is the standard Windows installation.

Final active coast-5 screenshot: `C:/Users/forem/.codex/visualizations/2026/10/06/01a10fcd-3510-78c0-a111-5c284d643a73/harbor-bastion-gameplay.png` (407,836 bytes). It shows two naturally sunk ships, three remaining ships, three incoming shells and five keep health. Required mobile/portrait captures and verification.json are beside it.

The next useful tuning evidence is human judgment of repair decisions and combat pressure, especially coasts 4–7. Controller clears do not establish that those coasts are fun.

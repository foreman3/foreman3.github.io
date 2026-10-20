# Steamline verification — 2026-10-20

Steamline is a Pipe Dream-style timed routing arcade: fit and rotate straight or elbow pipes, connect every service ring, meet the run-length target, and carry steam from the boiler to the receiver. Dry fittings can be lifted or turned; wet fittings are immutable. Opening the boiler early earns a bonus; optional reversible fast flow reduces waiting after planning. Leaks spend a seal and give five seconds to repair the route. Steam holds buy four seconds each. Retry restores the current contract's starting score.

## Scope and contract

Read AGENTS.md, the complete GAME_STANDARDS.md, installed and version-controlled builder skills, Games.md, root registration, directories, history and all supplied automation memory. The concept is absent from the existing inventory. DOM/SVG suits its small, structured board. Local SVG art, semantic HTML controls, 60 Hz delta-time simulation capped after stalls, visual updates around 30 Hz, cached tile artwork, no per-frame SVG reconstruction, and no external game assets. Desktop flyout/shared mobile fullscreen behavior; direct touch board controls need no joystick. Portrait is supported.

Only steamline/, Games.md and index.html are changed. The new card is under In Work. Initial and pre-release fetches matched origin/main; no merge or discarded work was required. No existing game's files changed.

The user's seven-level difficulty contract overrides the older level-5-mastery wording in the standards and skills. Their explicit restriction on files outside steamline/ also overrides the newer instruction to regenerate offline-assets.js. `node scripts/build-offline.cjs --check` reports a stale inventory (51 games / 281 files); the generated file is deliberately unchanged. This release requires the online direct link. Existing installed/offline arcade inventories will not include Steamline until a separately authorized inventory regeneration. This is the one explicit release-check exception.

## Observed challenge curve

Each contract has a different obstruction/ring/valve layout. All mechanics appear by contract 4 and combine in 5. Minimum pipes count source, receiver and fixed valves.

| Contract | Boiler delay | Seconds/pipe | Minimum pipes | Rings | Arrow valves | Seals / holds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 Apprentice | 24 | 1.80 | 8 | 0 | 0 | 3 / 2 |
| 2 Laundry | 21 | 1.65 | 12 | 1 | 0 | 3 / 2 |
| 3 Bathhouse | 18 | 1.50 | 14 | 2 | 0 | 3 / 2 |
| 4 Glassworks | 16 | 1.35 | 15 | 2 | 1 | 3 / 2 |
| 5 Night Shift | 14 | 1.20 | 17 | 2 | 1 | 3 / 2 |
| 6 Chief Engineer | 8 | .86 | 22 | 3 | 2 | 1 / 1 |
| 7 City Never Sleeps | 4 | .64 | 23 | 3 | 2 | 0 / 0 |

The browser controller uses the known example route and ordinary shape/rotation/fitting actions. It advances the real simulation between fittings; it never teleports steam, injects completed tiles, changes scores or triggers wins. Orientation changes are instantaneous within each fitting decision, so these are optimistic mechanical feasibility checks, not human reaction-time, route-discovery or enjoyment studies.

- A 1.8-second-per-fitting policy cleared 1–5 in 38.41 / 40.81 / 40.52 / 36.26 / 33.22 simulated seconds, with all three seals. It failed 6 and 7. Different lengths make completion time non-monotonic.
- A slower 2.8-second policy cleared 1–5 with 0 / 0 / 1 / 1 / 2 repaired leaks respectively. It failed 6–7. Thus the opening has substantial time margin, middle contracts introduce greater route constraints, and 5 permits multiple recoverable mistakes.
- Contract 5 with an additional deliberate 18-second construction delay cleared in 45.62 seconds after two actual open-end leaks, retaining one seal and both holds. Steam/progress was never repositioned for this recovery test.
- A .85-second policy cleared mastery contract 6 in 26.92 seconds and contract 7 in 18.09 seconds with no leaks. Adding a 2.5-second stall to that final-contract policy failed at pipe 12, establishing its narrow timing margin. Human judgment of fun, planning pressure and late-contract fairness remains the next useful evidence.

## Iteration and verification

The first functional version passed all seven example routes before two fresh whole-game improvement passes. Baseline fixes restored keyboard focus after restart and compacted the smallest mobile layout. Pass 1 reviewed the opening, all late contracts, failure/retry, endings and every required viewport; it fixed desktop clipping and added boiler/receiver hardware, numbered service medallions, a pressure dial, warming skyline, route-readiness feedback and optional fast flow. Pass 2 freshly reviewed the same experience; it added a visible touch lift tool, meaningful pre-flow fitted length, cached control labels and SVG interiors, and reduced per-frame DOM allocation. Final real-keyboard completion found and fixed Enter's unwanted native cell-button activation. A later performance investigation added per-tile artwork caching and guarded endpoint ornaments against duplication; the full suite passed again afterward.

Checks passed:

- JavaScript parsing for all game and verification scripts; Git whitespace and allowed-file scope.
- First-session instructions freeze simulation, keyboard/native Space dismissal, session return, desktop help with paused simulation, pause/resume, blur, sound, reset and shared mobile reset.
- Real Chrome keyboard events place/turn/remove pipes, select shapes, move the cursor, hold steam and launch. A normal page without test hooks cleared the entire opening using keyboard controls, fast flow and the physical receiver, then advanced to contract 2 through native Enter activation of Next.
- Actual touch taps select/rotate/place/lift, hold, pause, sound and restart. Chrome CDP touch cancellation produces no placement; context menus are suppressed. Returning mobile launch remains paused until the shared fullscreen gesture gate settles; deliberate fullscreen refusal is graceful.
- Wet/source/blocked fittings reject changes. Repair reserves cannot go negative. Actual leaks exhaust seals into failure. Unserved rings, reverse arrow entry and off-board routing fail or recover as specified. The minimum-length failure guard is exercised with a temporarily raised test-only target and restored immediately afterward. Fast flow is reversible. Current-contract retry restores banked score; progression and final campaign restart work; result Help restores the result on return.
- Visual inspection and geometry at 1440×900, 667×375, 740×390, 844×390 and 390×844. Square board cells and 4:3 board aspect are preserved, no horizontal overflow, rack and board do not overlap. Smallest landscape cells are 40.03 px; portrait cells are 43.88 px. Desktop footer ends at y896.78 in a 900px viewport. Short instructions scroll and their launch button is reachable. Mobile instructions hide the rack; navigation/help are hidden by shared behavior.
- New arcade card appears exactly once under In Work, links to the game, and both local pages load without script errors. Game console and page errors are empty.

## Performance limits

Final full-suite active contract-5 measurements: desktop mean20.64ms/p9518.6ms/max424.4ms; mobile emulation mean20.46ms/p9518.5ms/max414.9ms. Separate fresh-browser samples also recorded occasional 400–540ms gaps, even with service workers blocked or offline caching settled. A frozen-board control was mean17.90ms/p9518.6ms/max19.1ms; a later blank-page control also had a 334.7ms gap without a reported JavaScript long task. Therefore these emulated tests verify typical frame cost, but do not establish consistently smooth physical-device performance or isolate every outlier. Tile caching removes redundant SVG parsing; it did not eliminate all observed gaps. Simulation caps catch-up at .1 seconds, so a stall does not consume a large surprise portion of the player's planning window. Shared runtime files were not modified.

## Reproduce and artifacts

With Playwright on NODE_PATH and Chrome installed, run `node steamline/serve.cjs`, then `node steamline/verify.cjs`. `STEAM_PHASE` names each output set. `node steamline/profile.cjs` compares startup/cached/isolated rendering; `STEAM_CONTROL=1` runs only active/frozen/blank desktop controls. Hooks exist only with `?test=1`; normal play has no test API.

Artifacts: `C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/`. This contains baseline/pass1/pass2/final reports and seven-contract captures, required mobile/portrait captures, fresh performance reports, and the active `steamline-gameplay.png`: contract5, seventeen fitted pipes, ten wet pipes, one serviced ring, the moving steam front, a one-way valve and an unserved ring. No score, steam position or service completion was injected for this screenshot.

Publication SHA, live verification and requested email outcome are recorded by the scheduled release result and automation memory after the final safe push.

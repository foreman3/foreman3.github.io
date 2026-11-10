# Ribbon Racers verification

Verified on 2026-11-10 in installed Chrome over local HTTP. Ribbon Racers is a classic light-cycle arena race: leave a persistent trail, cut off opponents, brake to control spacing, and outlast the grid. It is distinct from the existing growing-tail Snake game, driving courses, and the preceding Pearl Pop and Echo Pavilion releases. The warm screen-printed motorsport arena uses cached Canvas scenery and trails, illustrated numbered racers, and HTML HUD/dialogs. No external art, font, or runtime dependency is required beyond existing shared arcade facilities.

## Seven-heat curve

The automation's explicit instructions override the older level-5 mastery wording in the standards and skill. Heat 5 retains recovery room; 6 is the first mastery test; 7 requires a collision-free heat. All features appear by 5.

| Heat | New pressure | Cells/second | Rivals | Crash patches | Observed Chrome clear |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | Open arena; steering, brake and cut-offs | 6.0 | 1 | 3 | 25.00 s, no crashes |
| 2 | Central island splits routes | 6.6 | 1 | 3 | 35.16 s, no crashes |
| 3 | Second rival creates crossing routes | 7.1 | 2 | 3 | 34.65 s, no crashes |
| 4 | Two offset islands form a chicane; stronger rivals | 7.7 | 2 | 3 | 32.47 s, no crashes |
| 5 | Full four-racer grid combines all features | 8.2 | 3 | 3 | 27.07 s, no crashes |
| 6 | Faster pace and deeper rival planning | 10.0 | 3 | 1 | 52.71 s, no crashes |
| 7 | Fastest pace, strongest planning, no collision forgiveness | 12.0 | 3 | 0 | 25.50 s, no crashes |

The five introductory steps increase geometry, traffic and pace separately. Heat 5 also cleared after 500 simulation ticks of deliberately uncontrolled straight driving caused two genuine collisions: recovery finished at 23.78 seconds with one patch remaining. Each patch clears a local 7×7 pocket of ribbon and grants five protected moves; barriers remain solid. Retry refills the current heat and preserves points earned in earlier heats.

Every table entry was replayed in Chrome using actual arrow-key events, with the board, ticks and outcome checked against the deterministic route. Routes use different exact-state planning profiles, so their clear times are not a human difficulty comparison. A separate common 100 ms, 400-cell-lookahead controller cleared heats 1–5 with 0/0/1/0/1 crashes, then failed 6 at 32.41 seconds and 7 at 27.67 seconds. These are optimistic mechanical feasibility and recovery checks, not human reaction-time, enjoyment, or difficulty studies. Human feedback on traffic and route reading is the next useful evidence.

## Functional checks

- First-load instructions freeze simulation and audio; session return skips instructions on desktop and uses the shared mobile Play gate. Fullscreen refusal remains playable. Instructions begin at the top and scroll to a reachable dismiss button on short displays.
- Actual arrows/WASD, non-reversing right-angle turns, two-turn buffering, held/released Space brake, P/help, R restart, and M sound work. Exhausting the brake requires releasing it; holding an empty gauge cannot produce indefinite slowing.
- Actual touch joystick hold, slide, neutral, release/cancellation, brake hold/cancellation, sound, pause and shared Reset work. Shared Options changes to directional buttons and saves the preference. A full opening was separately cleared exclusively with actual directional-button taps, then Next advanced to heat 2.
- Pause freezes the exact game state and rendered frame. Blur releases held brake and pauses. Result review restores the result when dismissed. Failure/retry, all Next transitions, final victory, new Grand Prix, R on results, earlier-score banking, blocked storage and modal focus loops pass.
- The shared desktop flyout opens/closes. Games.md has exactly one entry; the arcade has exactly one matching In Work card, and navigation resolves correctly. No existing game or shared runtime file was changed.
- Game console/page error logs are empty in full and focused suites. Root script errors are empty. Normal pages expose no debug API. Normal-page real-time movement, help, restart, initial frame freeze and mobile launch pass independently of manual stepping.

## Visual and performance checks

Reviewed 1440×900 desktop; 667×375, 740×390 and 844×390 mobile landscape; and 390×844 portrait. The full cabinet and footer fit, the 52:34 arena ratio is preserved, touch rails never cover the board, and actions stack vertically. Portrait uses a separate lower control dock. Also inspected active heat-5 views at every mobile size, plus heat endings and the final victory.

The scene and ribbon layers are cached, simulation uses bounded delta time, particles are capped at 64, decorative bursts respect reduced motion, and blocked scenes stop drawing. Live status text updates only when changed. The final general frame sample was mean 17.65 ms / p95 18.2 ms. Separate active heat-5 measurements were desktop mean 17.49 / p95 18.2 / maximum 18.6 ms and touch emulation mean 19.54 / p95 18.3 / maximum 264 ms. An initial headless/mobile scheduling stall was observed; physical-phone performance is unmeasured.

## Iterations

The initial complete baseline included all seven physical clears, actual two-collision recovery, endings and desktop/mobile controls. Baseline testing corrected the shared joystick marker, landscape action hit targets, cabinet proportions, portrait dock specificity and desktop footer fit. Test harness fixes awaited captured touch events and the shared asynchronous fullscreen gate instead of asserting before events arrived.

First independent whole-game improvement pass: added cut-off scoring (1,000 rather than 400), empty-brake feedback, changed-only live-region updates, larger numbered racer markers, additional chassis detail, painted infield lettering and corner pavers. Reduced decorative screen texture and guarded long mobile messages against HUD overlap. Replayed every heat and recovery, endings/controls, and all five layouts successfully.

Second fresh whole-game pass: added blocked-cell warning brackets, clearer scoring/brake instructions, instruction focus at the top on short screens, and verified R on endings. Re-examined opening, later pressure, failure/retry/victory and every layout; reran full and focused suites, including touch-only completion, storage denial, banking and active performance. No further safe material change was identified without human steering and difficulty feedback.

## Evidence and reproduction

Run `node ribbon-racers/serve.cjs` (localhost port 8780). With installed Playwright on NODE_PATH, run `node ribbon-racers/verify.cjs`, `node ribbon-racers/focused.cjs`, and `node ribbon-racers/live.cjs`. Their optional first argument sets the evidence directory; RIBBON_URL changes the origin. Debug/manual stepping is available only through `?test`.

Evidence lives at `C:/Users/forem/.codex/visualizations/2026/11/10/01a1c443-dc4d-7070-a44d-f51a4f78dd26/`, with separate baseline, pass1 and final reports, seven heat captures, required layouts, later-heat mobile views and normal-page smoke evidence. The active final screenshot is `final/ribbon-racers-gameplay.png` (187,295 bytes, SHA256 `d8a304f8d860dad65289a07f3f70087c46de7c6f6b5fed811962d08a5fe449fa`). It shows live heat 5 with two racers still moving among four trails.

## Scope and offline limitation

Only ribbon-racers/, Games.md and index.html are in this release. The user's strict outside-directory scope overrides the standard's shared offline-inventory regeneration instruction. Read-only `node scripts/build-offline.cjs --check` reports a stale inventory (57 games, 325 runtime files, 17.5 MiB). offline-assets.js and sidebar.html remain unchanged: the canonical online arcade card works, but installed offline clients and a new shared-flyout entry need a separately scoped inventory/navigation refresh. No cache, save, service-worker or existing-game changes were made.

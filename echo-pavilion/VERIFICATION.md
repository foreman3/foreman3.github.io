# Echo Pavilion

A Simon-style musical memory arcade, rendered with a small DOM/CSS scene. Four enamel pads have distinct names, shapes, notes and keyboard positions. No external art, font, audio or library dependency. Direct taps are the natural mobile input, so no joystick or action rail is needed. Portrait is supported.

## Challenge

Each act contains three independently generated phrases. Correct notes need no musical rhythm. The deadline resets on every correct note. A mistake costs a chance and automatically replays the same phrase; it does not regenerate the answer or award points. Hear again spends a listen and restarts the current phrase. Chances/listens refill each act. Retrying an act restores its starting score. All rules are introduced in act 1.

| Act | Phrase lengths | Note interval | Seconds per response | Chances | Extra listens |
| --- | --- | --- | --- | --- | --- |
| 1 | 3 / 4 / 5 | .76 | 6 | 4 | 3 |
| 2 | 4 / 5 / 6 | .70 | 5.5 | 4 | 3 |
| 3 | 5 / 6 / 7 | .64 | 5 | 4 | 3 |
| 4 | 6 / 7 / 8 | .58 | 4.5 | 3 | 2 |
| 5 | 7 / 8 / 9 | .52 | 4 | 3 | 2 |
| 6 | 9 / 10 / 11 | .43 | 2.8 | 2 | 1 |
| 7 | 12 / 13 / 14 | .35 | 1.8 | 1 | 0 |

The explicit scheduled-task curve supersedes the older repository wording that puts mastery at level 5: act 5 permits two mistakes and two requested replays, act 6 starts mastery, and act 7 demands a flawless encore.

## Browser verification, 2026-11-03

Run `node echo-pavilion/serve.cjs`, then `node echo-pavilion/verify.cjs` and `node echo-pavilion/focused.cjs` with installed Playwright on `NODE_PATH`. Chrome is configured at its standard Windows location. `ECHO_OUT` overrides the screenshot/report directory, `ECHO_PASS` labels the full regression, and `ECHO_URL` overrides the full suite's origin. Test hooks exist only with `?test`; ordinary pages have no test API. Manual stepping is opt-in and does not alter normal simulation.

- Initial functional build plus **two additional whole-game passes**, each followed by the full Chrome suite and visual review of desktop, all required landscape sizes, portrait, opening, later acts, game-over and restart. Baseline fixes corrected missing flyout classes and the shared returning-mobile help hook.
- Pass 1: added enamel highlights, brass machining and cabinet lighting; fit the entire desktop cabinet/footer; styled the flyout; preserved earlier-act points on retry. Reviewed all seven acts, outcomes, controls and all layouts.
- Pass 2: added a current-note marker during playback and distinct recovery/success readout styling; improved portrait action sizing; trapped modal keyboard focus; made result/help/return restore the result correctly. Fresh review found the four-pad scene already readable and visually coherent; no extra moving decoration was needed. Repeated all seven acts, complete controls, restart/results and layouts.
- Real keyboard events solved every phrase in acts 1–7 after jumping to each act. Acts 1–4 and 6 cleared after an intentional mistake. Act 5 cleared after **two wrong notes and both extra listens**, with one chance remaining. Act 7 immediately failed after one wrong note, then cleared all three phrases on retry. Score and next-act progression were checked.
- These are mechanical feasibility and recovery tests with access to the sequence, **not a human memory, enjoyment or difficulty study**. Human feedback should focus on the longer phrases in acts 4–7.
- A separate ordinary page observed visible playback lights in real time and reproduced the opening using real keyboard input, without hooks. First-load instructions froze simulation. Help, blur, pause/resume, sound toggle, timeout, loss, final victory, same-act retry, banked score, new run and restart were exercised. Numeric keys, Q/W/A/S and native Enter on a pad were covered. Keyboard focus cycles inside the modal.
- Touch emulation: three opening phrases, actual Next and act-2 tapping; CDP touch down, movement beyond the pad, cancellation and release; context-menu suppression; shared reset; returning-session Play; rejected fullscreen fallback. Pads are the playfield itself, so controls cover no separate game scene. Desktop-only help/navigation are hidden on touch layouts.
- Visually inspected 1440×900, 667×375, 740×390, 844×390 and 390×844. No horizontal overflow; all pads remain visible, over 44px and separate from the readout/actions. Short-screen instructions scroll and their launch button is reachable. Desktop cabinet/footer fit on screen.
- Arcade card is unique, under In Work, and opens the game. Games.md uses the same valid directory link. Flyout opens and its home link is visible. Game and arcade console/page errors: **none**.
- Final desktop frame sampling: mean 16.67ms, p95 17ms in headless Chrome. This is desktop emulation, not measured physical-phone performance. Scene has four actors, capped note audio, delta-time simulation, no growing effects, no external resources and reduced-motion support.
- Syntax and whitespace checks passed. Only this directory, Games.md and index.html belong to this release. No existing game or shared runtime changed.

Evidence: `C:/Users/forem/.codex/visualizations/2026/11/03/01a1a07a-b34c-7070-b244-ee8c59e17797/`. Baseline/pass1/final JSON reports, all-act and all-layout screenshots, focused report, and `echo-pavilion-gameplay.png` (active act 5, four of seven notes entered).

## Scope exception

The user's explicit outside-directory restriction permits only Games.md and index.html. It overrides the standard's offline-inventory regeneration requirement. `node scripts/build-offline.cjs --check` correctly reports a stale inventory (55 games, 313 runtime files, 17.3 MiB). `offline-assets.js` is intentionally unchanged: new online sessions can load this game, but installed offline clients require a separately authorized inventory refresh. Shared flyout entries also remain unchanged under the same restriction; the canonical start-page card and Games.md entry are present.

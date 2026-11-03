# Echo Pavilion — endless memory

## Rules

Start with one note. After each complete, correct response, append exactly one randomly chosen note to the end of the existing sequence. Replay the entire sequence from the beginning at a constant 700ms per note. There are no acts, fixed endpoint, extra listens, response countdowns or speed increases. Players may wait indefinitely before or between input taps. One wrong tap ends the run. The score is the length of the longest fully completed sequence, excluding any partial final response. New game starts a fresh one-note sequence. A guarded local-storage record preserves the device's best completed length.

The user's requested endless/untimed rules supersede the original scheduled task's seven-act difficulty requirement. Memory length is the only growing challenge. The four pads retain names, shapes, optional tones and keyboard positions. Direct touch is the natural input; no joystick is needed. All assets are local DOM/CSS.

## Verification

Start the repository server with `node echo-pavilion/serve.cjs`. Set `NODE_PATH` to installed Playwright, then run `node echo-pavilion/verify.cjs` and `node echo-pavilion/focused.cjs`. `ECHO_URL` overrides the origin and `ECHO_OUT` selects the evidence directory. Chrome uses its standard Windows executable path. Test state and manual stepping exist only with `?test`; ordinary pages have no test API.

- Full suite naturally advances through 32 completed lengths using real keyboard events. Each new sequence is exactly one note longer and its entire prefix equals the prior sequence. No act transitions or sequence resets occur. Length 33 remains playable after completing 32.
- At every tested length, a simulated 24-hour wait in input changes no gameplay state, including before and between notes. Playback/celebration clocks animate presentation only; input does not consume time. First-load instructions and help freeze simulation.
- Wrong input ends the run and reports the last fully completed length. New game, R and shared mobile Reset all return to one note and zero completed, preserving the personal best. Best persists across reload. Blocked storage still permits normal play. Partial responses never earn completion credit.
- Keyboard Q/W/A/S and number keys, direct pointer/touch, pointer capture/cancel/release, context-menu suppression, pause/help/return, mute/unmute, modal keyboard focus, returning mobile launch and fullscreen refusal are covered. Gameplay ignores taps during playback and celebration.
- Real-time normal-page test observes lights visually, reproduces five growing sequences with real keyboard events, and verifies exact prefixes without debug hooks. It waits 6.5 seconds in input, then completes the phrase. Help freezes presentation, restart resets the run and best remains five.
- Touch emulation completes lengths 1–6 in each viewport and checks prefix growth. Layout checks cover 1440×900 desktop, 667×375, 740×390, 844×390 landscape and 390×844 portrait. All pads and Pause remain visible, thumb-sized and separate from the readout. Desktop-only menu/help are hidden on touch. Long sequences use at most 24 progress dots with a moving window, so the display does not overflow.
- Canonical start-page card is unique, loads this directory and describes the endless sequence. Games.md matches. Game and arcade console/page errors are checked. Syntax and whitespace checks apply to all changed files.

Evidence is saved under `C:/Users/forem/.codex/visualizations/2026/11/03/01a1a07a-b34c-7070-b244-ee8c59e17797/endless/`: full verification JSON, normal/live smoke JSON, active gameplay and all viewport screenshots. These are mechanical browser tests, not human memory or enjoyment studies. Physical-phone performance is not measured.

## Release scope

Only Echo Pavilion and its Games.md/index.html descriptions are changed. The original explicit outside-directory scope still excludes offline-assets.js and sidebar.html. The shared offline inventory remains stale from initial creation; installed offline clients need a separately authorized inventory refresh. Online canonical start-page and Games.md links remain available. No cache, service-worker, saved-game or other game's files are changed.

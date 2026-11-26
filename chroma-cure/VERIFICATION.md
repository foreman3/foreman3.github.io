# Chroma Cure release verification

Agent Yoda · 2026-11-26

Dr. Mario-style paired-capsule puzzler, absent from the existing catalog and
directories. Canvas is used for the small tile world and cached actor artwork;
HTML supplies readable HUD, reserve/queue, controls and session-scoped dialogs.
Cream laboratory paper, cobalt glasswork and coral/honey specimens deliberately
vary the previous run's automatic circus jumping and navy/red/gold poster art.

## Curve observed in Chrome

The owner's scheduled instruction supersedes the older mastery-at-5 wording in
the skill and standards. Lab 5 retains recovery; 6 is mastery; 7 is precision.

| Lab | Microbes | Seconds per falling row | Lock grace | Rewinds | Keyboard controller doses |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 6 | 1.15 | .62 | 3 | 4 |
| 2 | 10 | 1.02 | .60 | 3 | 10 |
| 3 | 14 | .90 | .58 | 3 | 20 |
| 4 | 18 | .78 | .56 | 3 | 21 |
| 5 | 22 | .68 | .54 | 3 | 38 |
| 6 | 26 | .43 | .36 | 1 | 48 |
| 7 | 30 | .27 | .24 | 0 | 66 |

Opening trios teach a match and falling halves. Lab 2 adds denser arrangements;
3 introduces the third symbol; 4 combines higher cultures and chain routes;
5 combines all mechanics with three full-dose rewinds and generous lock grace.
Reserve swapping, ghost landings, three-capsule preview and chains are available
from the opening. No new mechanic is withheld beyond lab 5. Starting microbes
occupy at most 3/4/5/6/7/8/9 bottom rows, respectively.

All seven were cleared using actual keyboard input through the browser, without
editing cells, skipping objectives, invincibility or directly awarding wins.
The test-only query flag freezes real-time advancement and exposes level jumps
and clock stepping, so these tests are repeatable. The controller searches two
doses ahead and knows exact geometry. It is feasibility evidence, not a human
rating of difficulty or enjoyment.

Timed browser runs gave the controller 1.2 seconds of thinking plus .09 seconds
between inputs: labs 1–5 cleared in 4/10/20/21/38 doses, with zero automatic locks.
Lab 6 cleared with .7/.06 second delays in 48 doses. Lab 7 cleared with .15/.03
second delays in 66 doses, but 1.6/.1 second delays caused overflow after five
doses and two automatic locks. Queue preview permits planning ahead in real play.
The intended near-perfection feel of lab 7 still benefits from human feedback.

Lab 5 cleared after three deliberately misplaced doses were individually rewound,
using all three recovery charges. A separate overflow test recovered with one
rewind and hid the loss overlay. Retrying restores the current lab, its charges,
and the score banked in previous labs. Restart begins a new prescription.

## Iteration

The complete functional baseline passed the full browser suite, then two separate
whole-game reviews improved it:

1. Added distinct microbe silhouettes, three upcoming capsules on touch, a
   treatment-progress strip and bottle-full warning. Fixed short-screen cue
   clipping and keyboard Space activation of dialog buttons. Rechecked opening,
   all seven labs, failure/retry, desktop and every mobile size.
2. Fresh review caught focus remaining on Resume: Space could re-pause instead of
   dropping. Loading, resuming and capsule actions now return focus to the bottle.
   Added visible mobile reserve contents, strong matched-group outlines, chain
   labels and the brief opening coach. Landscape results now open across the
   center play area so their actions are comfortably readable. Repeated full play/layout checks; added
   explicit active-screenshot assertions, timed curve tests and overflow recovery.

## Checks

- JS syntax and deterministic rules: four-matches in both axes, paired support,
  split-half gravity, fixed microbes, scoring, side-wall rotation kicks, reserve
  once per dose, snapshot rewind, all seven complete objective clears.
- First-load instructions freeze gameplay and audio. Help freezes pixels/state.
  Normal-session reload skips instructions; the shared mobile launch gate waits
  for a user gesture and handles fullscreen refusal.
- Real keyboard move/rotate/soft drop/hard drop/reserve/rewind, repeat, pause,
  sound and restart; blur clears input. Space activates the intro and Resume
  returns focus correctly. Normal clock opening cleared without the test API.
- Native Chrome touch: absolute bottle aim, slide across, captured drag outside,
  cancellation, rotate, drop, reserve, rewind, pause, sound and shared restart.
  Shared wrapper uses pointer-events:none so it cannot intercept the playfield.
- 1440×900 desktop; 667×375, 740×390, 844×390 landscape; 390×844 portrait.
  Controls fit and do not overlap the bottle. Multiple actions stack vertically
  in landscape; portrait has a separate bottom control deck. Cues fit onscreen.
- Storage-denial fallback and reduced-motion setting pass. Symbol glyphs and
  distinct microbe body shapes supplement colors. No runtime network assets.
- Final frame sampling: desktop mean 17.75 ms / p95 18.30 / max 18.80; emulated
  touch mean 17.70 / p95 18.40 / max 18.70. Cached sprites/background and a capped
  delta avoid expensive scene rebuilding. Physical phones were not measured.
- Browser game/arcade consoles clean; catalog link under In Work resolves.
  Final screenshot is active lab 5 after five doses: 18 microbes remaining,
  score 880, a falling capsule and projected landing visible.

## Reproduce

Use Node with Playwright available in NODE_PATH and installed Chrome:

    node chroma-cure/tests/rules.cjs
    node chroma-cure/tests/verify.cjs
    node chroma-cure/tests/focused.cjs
    node chroma-cure/tests/release.cjs

The browser scripts own an ephemeral local server and close it and their browsers.
ARTIFACT_DIR selects screenshot/report output. REGISTERED=1 also asserts the root
In Work card. BASE_URL can direct the main suite to the deployed arcade.

Reports are in tests/verification.json and tests/focused.json. Screenshot:
screenshots/gameplay.png. Normal play exposes no test API or debugging UI.

## Scope and release

Only chroma-cure/ and the two new Games.md/index.html registration hunks belong
to this release. Existing worktree changes, including Flappy catalog wording and
other games' graphics, are preserved and excluded from the commit.

The explicit owner restriction permits no other files. Accordingly, the shared
sidebar.html/offline-assets.js are not regenerated. Read-only
`node scripts/build-offline.cjs --check` reports both stale (62 games, 383 runtime
files, about 25 MiB at verification). The home-page card/direct online link work;
the shared flyout and installed offline catalog need a separately scoped refresh.

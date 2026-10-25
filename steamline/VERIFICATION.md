# Steamline puzzle campaign verification — 2026-10-25

The player's feedback supersedes the original seven-stage speed-controller claims. Steamline is now fifty untimed puzzles. No level starts steam automatically, removes lives, awards speed points or requires fast editing. Plan, test, keep the board, revise. Stars reward clean/economical construction; thinking time and failed tests never reduce them.

## Campaign design

Ten five-level districts progressively introduce route length/anchors (1), service rings (6), one-way valves (11), fitting stock (16), independent bridge lanes (21), paired underground ports (26), switch-operated gates (31), heater/range (36), heat-consuming radiators (41), and ordered deliveries (46). Each introduction reduces the combination burden before combining familiar ideas. Late puzzles combine the mechanics rather than increasing a countdown. The design rationale is in DESIGN.md.

Fifty deterministic boards vary endpoints, paths, obstructions, anchored fittings and obligations. Generation uses an explicit seeded shuffle for consistency across browser engines. All routes may be solved differently from the construction witness. Bridges must be crossed on both independent axes and count as one distinct square; tunnels are actual nonadjacent graph edges. Switches must precede gates. Travel consumes one heat per square after reheating, radiators consume three more, and the receiver must remain hot.

The known construction witnesses clear all 50 through ordinary shape/rotation/placement inputs and the actual flow demonstration. This proves mechanical solvability, not human route discovery, enjoyment or a measured monotonic difficulty curve. New-mechanic introductions deliberately vary route length and loosen other constraints.

## Saving and usability

The versioned local save contains unlocked level, stars/best fitting counts, separate unfinished boards, current tools, settings and recent undo history. Edits autosave after 120ms, with immediate saving on completion, manual Save and leaving. Reload returns to untimed planning with the complete layout intact. Fixed machinery is reconstructed from rules; imports cannot inject fixed machinery or arbitrary rotations.

The level ledger allows replay and resuming saved drafts. Download/import moves a campaign between browsers. Import previews its completion count/current level, requires explicit confirmation, and attempts a recovery copy of the previous campaign. Invalid versions/files are rejected; unreadable stored JSON receives a recovery-copy attempt; storage failure is reported with downloadable backup guidance. These saves are local to the browser/device, not cloud synchronized.

Reset clears only the current workbench, can be undone, and preserves campaign progress. Failed flow tests retain every fitting and identify the first problem. Stock is refunded on lifting. Undo/redo are free. Ctrl/Cmd refresh shortcuts do not accidentally reset the puzzle. Full rules remain accessible from the ledger on touch devices. Shared flyout/fullscreen behavior is retained.

## Verification

- 167 Node rule checks pass: all 50 witness completions, all 50 distinct boards, complete goal coverage, clean witnesses, bridge axis separation, reverse valves, fitting caps, tunnel direction, gate order, cold receivers, radiator heat costs, ordered rings, minimum length, save validation/round trip/corruption recovery and storage failure.
- Full Chrome suite clears all fifty with three stars, unlocks all fifty ledger entries, checks final ledger flow, and validates keyboard selection/rotation/placement, free undo/redo, score/progress retention and undoable reset.
- A normal page without test hooks completes the opening entirely with real keyboard events, earns three stars, advances through native Enter, and retains contract2 after reload. Automatic draft saving, browser refresh-shortcut safety and normal reload are exercised in that same flow.
- Real browser save/restore preserves a partial board and undo history. A downloaded save imports after preview/confirmation, makes a recovery copy, restores level6, and invalid imports preserve the campaign. Nested ledger → rules → ledger navigation works.
- Actual touch taps place/turn/lift, refund stock, undo, save, and restore after reload. Chrome CDP touch cancellation creates no fitting. Shared returning-mobile launch/fullscreen refusal is graceful. Help pauses flow, and ordinary untimed planning remains unchanged after a simulated hour.
- Visual/geometry checks pass at1440×900,667×375,740×390,844×390 and390×844. Rack/board do not overlap, board keeps4:3 aspect, cells stay square, all controls/cabinet fit and no horizontal overflow occurs. Smallest landscape cells37.41px; portrait44.13px. Short instructions/ledger scroll, with reachable buttons. Mobile hides desktop navigation/help and instruction-time rack.
- Game console/page errors are empty. Syntax checks and Git whitespace checks pass. The arcade descriptions now advertise fifty untimed puzzles and saves.
- Final main-suite active-flow sample mean20.58ms/p9518.5ms/max424.7ms; an earlier sample was mean17.0/p9516.9/max33.5ms. Occasional host/browser long-frame outliers remain. Flow is an optional demonstration and planning has no clock; smooth physical-device performance is not established by desktop emulation.

## Scope and release

Only Steamline runtime/art/save/design/verification files, Games.md, index.html and the required generated offline-assets.js are included. Initial unrelated Marble Circuit changes were left untouched; their separate commit2c6004d appeared and was already synchronized to origin/main during this work. No Marble Circuit file is part of this change.

The offline inventory is regenerated and its check passes:52 games,288 files,15.3MiB. This supersedes the previous scheduled-release offline-inventory exception. Fetch/compare, explicit scoped staging, safe commit/push and production smoke verification are recorded in the chat and automation memory. No follow-up email was requested for this revision.

## Reproduce

Set NODE_PATH to Playwright, run node steamline/serve.cjs, then node steamline/verify.cjs. Rules alone: node steamline/verify.cjs --rules. Active performance: node steamline/profile.cjs. Published normal-keyboard/save smoke check: node steamline/live-smoke.cjs. Test hooks exist only with ?test=1.

Artifacts are in C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/puzzle-campaign/: chapter/late-level and mobile captures, verification.json/latest.json, exported campaign, active steamline-puzzle-gameplay.png and the subsequent live report. Screenshot construction uses ordinary fitting inputs and the real flow simulation; it does not inject a win or steam position.

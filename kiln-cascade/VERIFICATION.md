# Kiln Cascade release verification

Verified September 22, 2026 in local HTTP-served Microsoft Edge through Playwright. The user-requested seven-stage curve supersedes the older five-stage mastery wording in the repository standards.

## Curve

| Firing | Tile quota | Seconds per row | Glazes | Emergency clears |
| --- | ---: | ---: | ---: | ---: |
| 1 | 18 | 1.05 | 4 | 3 |
| 2 | 27 | .88 | 4 | 3 |
| 3 | 33 | .78 | 5 | 3 |
| 4 | 42 | .64 | 5 | 3 |
| 5 | 48 | .54 | 6 | 3 |
| 6 | 60 | .37 | 6 | 1 |
| 7 | 75 | .23 | 6 | 0 |

An action-based placement planner with 1.2 seconds of decision delay and 80–120 ms per control action cleared levels 1–6 in 19/23/26/32/41/43 simulated seconds. Level 5 included three deliberately poor placements and finished with two clears remaining. That controller failed 7 at 37/75 tiles; a 650 ms decision controller cleared 7 at 77 tiles in 38 seconds without emergency clears. A slower 2.6-second controller cleared 1–5 and failed 6–7. These are mechanical benchmarks, not human play times or enjoyment ratings. Fixed per-level tile seeds make retries learnable and results reproducible.

## Browser coverage

- Instructions freeze simulation; session return and shared mobile launch work, including fullscreen refusal.
- Keyboard movement/cycling/drop, sound toggle, pause/help, in-place reset, progression, failure retry, and final victory restart.
- Horizontal, vertical and both diagonal matches; cascading gravity and score multiplier; emergency clears remove three rows without quota credit.
- Real touch taps, held directional input, cancellation, blur pause, cycle/drop/clear, and shared restart.
- Visual inspection at 1440×900, 667×375, 740×390, 844×390, and 390×844. Controls stay outside the playfield; portrait retains next-column preview. Landscape actions stack vertically.
- Arcade card navigates to the game; both canonical registrations match. No game console errors or page exceptions. Root-page external Google Fonts requests were excluded; its scripts and card navigation passed.
- Desktop animation frame p95 approximately 18 ms. Small bounded Canvas scene, no particles or decorative animations, capped delta time, suspended gameplay rendering behind overlays.
- Active level-5 screenshot captured at 23/48 naturally matched tiles.

## Refinement passes

The initial full suite caught a shared CSS collision in touch controls and an insufficient wait for the returning fullscreen gate. Both were resolved before refinement.

1. Reviewed opening, all later stages, endings, and all layouts. Spawned all three falling tiles visibly, retained next preview in portrait, improved workshop background, and moved feedback toward the frame. Re-ran the full suite and inspected desktop, landscape, and portrait captures. The visible spawn tightened level 7's timing; verified it remains clearable with faster planning.
2. Fresh review found that crowded boards lacked explicit warnings, exhausted clears looked usable, and feedback could cover tiles. Added a danger outline/text, disabled exhausted clears, moved callouts into the unused bottom frame, and normalized uppercase key release. Rechecked the full experience, added cascade and held-touch cancellation assertions, and recaptured final screenshots.

## Reproduce

Install or expose Playwright in `NODE_PATH`, then run `node kiln-cascade/verify.cjs` from the repository. The suite uses the standard Windows Edge executable path. Set `SHOT_DIR` to an artifact directory outside the repository; otherwise it writes to `kiln-cascade/qa`. Add `?level=5` for a normal instruction-gated trial. Diagnostic state/actions exist only with `?test`.

Scope: one new directory plus Games.md and index.html. No existing game or shared file was changed.

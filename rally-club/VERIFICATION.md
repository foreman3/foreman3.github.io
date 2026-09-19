# Rally Club — curved-spin revision

## Rules and controls

Ball spin applies continuous sideways acceleration. No side-wall reflection remains. Crossing a sideline awards the point to the opponent of the last striker; missing the receiving paddle awards the striker the point.

Move with arrows/A-D or the mobile drag strip. Hold Q/E for a left/right brush, or select the left/flat/right touch buttons. Touch choices latch deliberately; keyboard brushes release on key-up. All input clears on pause, blur, reset and hidden-page transitions.

The incoming spin indicator describes curvature, not current travel direction. Opposite brush cancels incoming spin and earns 25 points. Flat contact preserves it; matching-direction brush doubles it. Residual spin causes a sideways kick on contact and continued curvature, so incorrect compensation can send a return out. Edge contact aims the intended shot. Brush strength is assisted to match incoming spin magnitude; this is an accessible arcade model rather than a full table-tennis simulator.

## Five courts

| Court | Ball speed | AI speed | Spin | Paddle width | Goal | Character |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 310 | 145 | .35 | 165 | 3 | Short opening; always right spin |
| 2 | 335 | 175 | .50 | 165 | 5 | Alternates spin predictably |
| 3 | 350 | 200 | .65 | 165 | 5 | Varied spin and wider placement |
| 4 | 385 | 225 | .80 | 165 | 5 | Attacks the open side; four-point mistake margin |
| 5 | 450 | 285 | 1.00 | 125 | 5 | Faster, stronger spin and narrower contact |

Rally speed grows by 14 per return, capped at 1.3 times starting speed. Opponent recovery gradually slows after four player returns to prevent endless defensive exchanges. AI predicts curved trajectories and uses the same sideline fault rule.

## Verification

Run `node rally-club/verify.cjs` with Playwright on NODE_PATH. SHOT_DIR selects the screenshot/report destination. The suite uses installed Edge and a local HTTP server. Diagnostic hooks require `?test`; public `?court=1` through `?court=5` links retain normal instruction gating. A new session key forces returning players to see the changed rules.

Passed browser checks:

- Continuous curvature: spin .8 moves a stationary lateral shot 16 units sideways and increases lateral velocity by 80 over 0.4 seconds.
- Mirrored counterspin cancellation; correct brush removes spin and awards the bonus. Flat contact preserves .8 spin; wrong-way contact produces 1.6. Both uncancelled test returns went wide.
- Both player and club sideline faults credit the correct receiver, without bouncing.
- A predictive positioning/counterspin controller cleared courts 1–5 in approximately 14/48/60/74/55 simulated seconds. Court 4 began with two deliberate lost points and won 5–2. The same placement approach without counterspin lost each match. These mechanical benchmarks do not measure human enjoyment or prove perceived difficulty.
- Keyboard movement, Q/E press/release, serve, help freeze, pause, reset, sound; real mobile drag hold/slide/release and touch brush selection; progression, loss retry and shared reset.
- Fullscreen refusal, returning mobile launch, session instructions, arcade link, clean game console and root script-error checks. External root-page font loading is excluded.
- 1440×900 desktop; 667×375, 740×390, 844×390 mobile landscape; 390×844 portrait. Spin buttons and drag strip stay outside the table. Landscape spin buttons stack in the left rail. Desktop frame p95 approximately 16.9 ms in headless testing, not physical-device profiling.

Active curved-shot screenshot: automation artifact folder `spin/rally-club-spin-gameplay.png`; mobile captures and verification.json alongside. Only rally-club files changed in this revision.

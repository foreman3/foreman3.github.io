# Kiln Cascade — endless-run verification

Verified September 22, 2026 using locally served Microsoft Edge with Playwright.

The user's continuous-play revision replaces the original seven-stage campaign. One board and one score persist until overflow. No quota completion, intermission, victory screen, or automatic board reset remains.

- Falling interval is `max(0.16, 1.05 / (1 + matchedTiles / 90))` seconds per row: 1.05 at the opening, .70 at 45 tiles, .45 at 120, .30 at 225, and a .16-second safety floor. Acceleration depends on matching, so idle time and pauses never raise difficulty.
- Four opening glazes expand to five after 45 matches and six after 120. The existing preview stays authoritative as new columns enter. Three emergency clears last the entire run; they remove tiles without score or speed credit.
- Speed multiplier and cumulative matched tiles replace level and quota labels. Restart restores the empty board, zero score/matches, opening speed and three clears. Instructions use a new session key so returning players see the changed rules.

## Checks

The browser suite verifies matching in all four directions, cascading gravity/scoring, rescue behavior, keyboard and actual touch controls (including hold/cancel/blur), pause/help, sound, shared reset, first-load and returning-session gates, fullscreen refusal, game-over restart, and arcade navigation. No game console errors or page exceptions; root external Google Fonts requests are excluded.

Continuity assertions cross the former quotas and new glaze thresholds from 17 through 1,003 matched tiles. Each clear preserves a sentinel board tile, accumulates score, retains the spent-clear count, keeps play active, and monotonically increases or caps speed. No next-stage button remains.

An action-driven planner with 1.2-second decisions reached 212 tiles over 140 simulated seconds; a faster 650 ms planner reached 476 tiles over 224 seconds and used all three rescues. These are mechanical benchmarks, not human play-time or enjoyment ratings. Active screenshot captures 134 matches at 2.49× speed.

Responsive checks: 1440×900 desktop, 667×375 / 740×390 / 844×390 landscape, and 390×844 portrait. Controls do not overlap the board; portrait keeps the next preview. Desktop frame p95 was 16.9 ms.

## Reproduce

Expose Playwright through NODE_PATH and run `node kiln-cascade/verify.cjs`. Set SHOT_DIR to an artifact directory outside the repository. The suite uses the standard Windows Edge executable path. Diagnostic state/actions are only present with `?test`; old `?level=` links now start the ordinary endless run.

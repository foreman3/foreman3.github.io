# Ink Claim verification

Ink Claim is a Qix-style territory game. Move on printed land, arm DRAW, then reconnect a line to claim regions that contain no moth. The September 23 difficulty update raises the opening target to 60%, adds numbered registration marks from poster 2, and applies the same movement timing to taps and held input.

## Challenge curve

| Poster | Target | Marks | Moths | Line time | Pens | Observation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 60% | 0 | 1 | 10 s | 5 | Browser: a broad cut stopped at 55% without clearing; a second cut reached 64% with four pens left. |
| 2 | 64% | 1 | 1 | 9.5 s | 5 | Browser: first cut reached 55% and printed the mark without clearing; second cut reached 86% with five pens. |
| 3 | 68% | 2 | 2 | 8.5 s | 5 | Browser: two attempted broad cuts were intercepted, leaving three pens; both marks remained visible. |
| 4 | 72% | 3 | 2 | 7.8 s | 5 | Browser: direct-stage load showed three marks and the 72% target. A deterministic opening route claimed only 3% with both moths in the remaining regions. |
| 5 | 76% | 4 | 3 | 7 s | 5 | Browser: the first attempted broad cut was intercepted; all four marks stayed unprinted and four pens remained. |
| 6 | 80% | 4 | 3 | 6.3 s | 2 | Browser: direct-stage load showed two pens, four marks, and the 80% target. |
| 7 | 84% | 4 | 4 | 5.5 s | 1 | Browser: direct-stage load showed one pen, four marks, and the 84% target. |

These are observed play-test traces, not human difficulty ratings. Posters 3–7 were loaded or played directly with `?poster=N`; their full completion under the revised curve is not yet established. Poster 5 retains four recoverable misses; poster 6 is the first two-pen mastery stage, and poster 7 allows none.

## Browser checks

- First-load instructions explain the new target and mark rule. Session-scoped dismissal, help pause/resume, keyboard pause, and restart to poster 1 worked.
- Repeated direction taps no longer bypass movement timing. A 31-tap burst moved only a few cells; paced input advanced the pen.
- At 667×375, 740×390, 844×390, and 1440×900, the game had no horizontal or vertical overflow. The 667×375 screenshot showed the board, HUD, marks, and mobile direction/DRAW controls together.
- Direct links for posters 1–7 loaded the expected targets. The local browser console had no JavaScript errors after the revised gameplay checks.

Active poster-five screenshot: `C:/Users/forem/.codex/visualizations/2026/09/23/01a0cda8-94b7-7e32-a1b9-dfe2e30c41af/ink-claim-harder-poster-5.png`.

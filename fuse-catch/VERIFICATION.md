# Fuse Catch routing revision — 2026-09-24

The original game let players follow a slow rooftop dropper through shifts 1–6. The revised dropper moves faster and throws bombs sideways. Landing arrows and dashed flight guides make trajectories readable. From shift 2, side hatches create staggered double drops, forcing the player to choose an interception route. Quick fuses start in shift 4, and blue bombs reverse direction midway in shift 5. Water sweeps now clear only nearby low bombs, making position and timing matter.

## Seven-shift curve

| Shift | Catch quota | Primary drop interval (s) | Fall speed | Cart width | Buckets | Water | New pressure |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 10 | 1.40 | 205 | 140 | 5 | 2 | Sideways throws; large catch rim and landing cues |
| 2 | 15 | 1.22 | 220 | 132 | 5 | 2 | Staggered double drops every fourth throw |
| 3 | 19 | 1.10 | 235 | 128 | 5 | 2 | Longer arcs and shorter response windows |
| 4 | 24 | 1.00 | 250 | 123 | 5 | 2 | Quick fuses and doubles every third throw |
| 5 | 29 | 0.92 | 270 | 118 | 5 | 2 | Midair reversing bombs; all major elements present |
| 6 | 32 | 0.80 | 290 | 112 | 4 | 1 | First mastery test, with faster routing and less rescue |
| 7 | 42 | 0.68 | 320 | 105 | 5 | 0 | Doubles every other throw, no water, near-perfect routing |

Double drops delay the next primary throw so their landing times remain ordered. The cart gains some top speed in shifts 5–7 to keep long routes physically reachable. Five buckets in shift 7 allow four misses across 42 catches; the challenge comes from denser overlapping trajectories, rather than a single-life rule.

`verify.cjs` is the reproducible local browser suite. A predictive keyboard controller cleared shifts 1–7 in 15.0 / 17.8 / 20.3 / 23.0 / 26.8 / 24.4 / 28.9 simulated seconds, with 0 / 0 / 0 / 1 / 3 / 1 / 4 misses. A slower reactive controller cleared shift 5 with one bucket and failed shift 6 after six catches. A controller that only followed the dropper failed every tested shift. A separate shift-5 run deliberately missed a bomb and still cleared with three buckets. These are mechanical input benchmarks, not human difficulty ratings.

Browser checks passed: instruction freeze and refreshed session gate, keyboard movement, nearby and out-of-range water sweep, help/pause, sound, next shift, game-over and victory flows, restart, actual touch joystick and button mode, mobile water and sound, shared mobile restart, all seven shift profiles, arcade card link, and clean game console. Desktop 1440×900, landscape 667×375 / 740×390 / 844×390, and portrait 390×844 fit without board clipping, control overlap, or horizontal overflow. First-stage throws project over 130 logical pixels from their source; shift-2 pairs land about 196 pixels apart in the deterministic check. Quick and reversing bombs appear by shift 5.

Active shift-5 gameplay screenshot: `C:\Users\forem\.codex\visualizations\2026\09\24\01a0d201-bdee-7d62-b88c-ecc3808a13c9\fuse-catch-routing-gameplay.png`.

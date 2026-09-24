# Fuse Catch verification — 2026-09-24

Fuse Catch is a Kaboom-style rooftop bomb catcher. Move the safety cart under falling bombs and use limited water sweeps to catch low threats. The canvas uses a cream, brick red, and deep blue firehouse poster direction.

## Seven-shift curve

| Shift | Catch quota | Drop interval (s) | Base fall speed | Cart width | Buckets | Water | New pressure |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 8 | 1.58 | 172 | 142 | 5 | 2 | Forgiving introduction |
| 2 | 12 | 1.42 | 189 | 137 | 5 | 2 | Modest speed and volume rise |
| 3 | 16 | 1.26 | 210 | 132 | 5 | 2 | Drifting bombs |
| 4 | 21 | 1.12 | 231 | 126 | 5 | 2 | Occasional quick fuse |
| 5 | 27 | 0.99 | 251 | 120 | 4 | 2 | Zigzag bombs; all major elements present |
| 6 | 35 | 0.77 | 286 | 107 | 2 | 1 | First mastery benchmark |
| 7 | 43 | 0.61 | 318 | 96 | 1 | 0 | Near-perfect run required |

`verify.cjs` serves as the reproducible browser check. A predictive keyboard controller cleared shifts 1–7 in 14.1, 18.7, 21.5, 24.8, 28.2, 28.2, and 27.2 simulated seconds with no misses. A slower reactive controller cleared 5 with four buckets, cleared 6 with one bucket, and failed 7 at 20/43 catches. A separate shift-5 test deliberately missed once, then cleared with two buckets left. These are input-controller benchmarks, not human difficulty ratings.

Browser checks passed: first-session instruction freeze, blocked reset behind instructions, returning session, keyboard movement, water sweep including empty-sweep protection, help/pause, sound, shift progression, game-over and victory flow, restart, actual touch joystick and button mode, mobile water and sound, shared mobile restart, arcade card link, and clean game console. Desktop 1440×900, landscape 667×375 / 740×390 / 844×390, and portrait 390×844 fit without board clipping, overlap, or horizontal overflow.

Active shift-5 gameplay screenshot: `C:\Users\forem\.codex\visualizations\2026\09\24\01a0d201-bdee-7d62-b88c-ecc3808a13c9\fuse-catch-gameplay.png`.

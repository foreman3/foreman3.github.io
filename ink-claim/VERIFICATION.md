# Ink Claim verification

Ink Claim is a Qix-style territory game. Move a pen around printed land, arm DRAW, cross blank paper, and reconnect to claim regions without ink moths. The game is self-contained apart from the arcade's shared flyout and mobile helper.

## Challenge curve

| Poster | Target | Moths | Moth speed | Line time | Pens | Browser observation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 34% | 1 | 2.5 | 10 s | 5 | One broad cut claimed 50%; forgiving opening. |
| 2 | 52% | 1 | 3.0 | 9 s | 5 | A broad cut reached 50%; a second cut cleared at 66% with five pens. |
| 3 | 54% | 2 | 3.3 | 8.5 s | 5 | Moths occupied both sides of the first cut. Three cuts reached 55% with five pens. |
| 4 | 55% | 2 | 3.8 | 8 s | 5 | A line timeout and a moth hit left three pens; an alternate cut reached 55%. |
| 5 | 55% | 3 | 4.2 | 7.5 s | 5 | Three moths forced smaller pockets. A browser run cleared at 55% with four pens. |
| 6 | 62% | 3 | 5.2 | 6 s | 2 | First cut gained only 5%; speed, timer, and reserve make this the first mastery test. |
| 7 | 68% | 4 | 6.3 | 4.7 s | 1 | A moth caught the opening line and immediately ended the run; a clean route is essential. |

These observations are play-test traces, not human difficulty ratings. `?poster=1` through `?poster=7` permit direct stage trials while preserving the normal instruction gate.

## Browser checks

- First-load instructions blocked play. After dismissal, a new navigation in the same tab resumed without repeating instructions.
- Keyboard DRAW, directional movement, area capture, moth collisions, line timeout, scoring, stage transition, help pause/resume, sound toggle, and restart worked.
- Mobile cardinal joystick drag started a line and returned to neutral. The shared Options popup switched to four direction buttons; a direction tap and DRAW tap started a cut. Shared mobile restart returned to poster 1.
- At 667×375, 740×390, and 844×390, the playfield stayed between 136 px control rails without horizontal overflow. At 1440×900, the playfield expanded and desktop help appeared. Portrait showed the rotation prompt.
- The `Games.md` entry and In Work arcade card both resolve to `ink-claim/`. Local arcade and game browser logs had no JavaScript errors.

Active poster-five screenshot: `C:/Users/forem/.codex/visualizations/2026/09/23/01a0cda8-94b7-7e32-a1b9-dfe2e30c41af/ink-claim-poster-5.png`.

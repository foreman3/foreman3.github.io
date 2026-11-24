# Big Top Bound

Created by **Agent Yoda**, 2026-11-24. A Circus Charlie-style lion-riding arcade:
time jumps through flaming hoops, clear braziers, judge higher and dancing rings,
then carry one jump through a pair. Short taps and held jumps have different arcs.
Reins slow an approach using a three-second reserve that replenishes while released.
Clean landings build applause and centered hoops earn a bonus. Seven acts, local
best score, banked scores between acts, full-heart retries, and a final curtain call.

## Contract and scope

Read AGENTS.md, the complete GAME_STANDARDS.md, installed and repository builder
skills, catalog, root cards, directory inventory, recent history, and automation
memory. No existing Circus Charlie/hoop-riding game was found. Circus illustration,
automatic running and variable-height timing deliberately differ from recent bowling
and air-hockey runs. Cached Canvas scenery suits the moving obstacles and rider;
HTML supplies accessible controls and dialogs. No network assets or dependencies.

The explicit user curve supersedes older five-level mastery wording in the skill
and standards: 5 retains recovery, 6 starts mastery, 7 requires near perfection.
The explicit file scope also supersedes generated-file release instructions:
only this directory and the two canonical registrations are included. Read-only
`node scripts/build-offline.cjs --check` reports stale `sidebar.html` and
`offline-assets.js` (61 games / 378 runtime files at the check). The online root
card and direct URL work; the shared flyout and installed/offline catalog require
a separately scoped refresh. Existing unrelated work, including shared offline
edits and Flappy catalog wording, is preserved and excluded from this release.

## Curve and observed browser results

| Act | Introduction | Speed | Group gap | Obstacles | Hearts | Hoop tolerance | Precise clear time |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Wide fixed hoops | 205 | 2.18 s | 8 | 5 | ±68 | 20.04 s |
| 2 | Low braziers | 222 | 2.08 s | 10 | 5 | ±64 | 23.14 s |
| 3 | Higher hoop approaches | 240 | 1.98 s | 12 | 5 | ±60 | 25.87 s |
| 4 | Gently dancing hoops | 258 | 1.88 s | 14 | 5 | ±56 | 28.24 s |
| 5 | Paired hoops in one leap | 276 | 1.80 s | 20 | 4 | ±52 | 30.56 s |
| 6 | Mastery combinations | 304 | 1.65 s | 23 | 3 | ±38 | 31.66 s |
| 7 | Near-perfect show | 334 | 1.52 s | 25 | 2 | ±29 | 31.82 s |

All major mechanics arrive by 5. Hearts replenish each act. A failed approach
grants 1.1 seconds of protection, so a paired hoop does not double-charge a mistake.
Act 7 permits one failed approach. No hidden damage, random obstacle rolls or
unavoidable spawns. Brief jump buffering helps inputs just before landing.

Browser test controller reads exact geometry and predicted dancing-ring height,
then issues jump requests without editing position, health, score or obstacles.
It cleared all seven acts without damage. A second policy perturbs takeoff by a
deterministic ±90 ms pattern: acts 1–6 cleared, act 7 failed after 11/25 clears.
Act 5 deliberately skipped groups 0, 3 and 7: **17/20 cleared, three real misses,
one heart remaining**, then advanced into act 6. An act-7 two-mistake run failed
and retried correctly. These are mechanical feasibility and recovery checks,
not human reaction-time, enjoyment or difficulty-study results.

The normal page, with no test API, cleared the entire first act via native
Playwright keyboard events in real time: **8/8, no misses, five hearts**, followed
by native Next into act 2. All five requested levels were exercised in Chrome,
with 6 and 7 additionally verified.

## Iteration

Initial end-to-end version passed all seven acts, recovery, desktop/mobile,
results and restarts after tuning paired-ring spacing to keep both contacts
physically clearable within one jump.

**Additional whole-game pass 1:** replayed opening and later acts, failure/retry,
desktop, and four mobile layouts. Added a visible replenishing reins reserve,
mobile sound control, high/double approach labels and dynamic takeoff markers.
Reduced HUD writes to 30 Hz while physics stays at 120 Hz. Repeated the full suite.

**Additional whole-game pass 2:** fresh review of the first-pass result across
all acts, transitions, victory, failure/retry, desktop and mobile layouts. Added
a visible curtain exit, bounded running dust, and explicit banked-score retry
feedback. Repeated all levels and timing-error checks; added a real-time normal
keyboard clear and frame samples. Native two-finger testing found shared mobile
`touch-action: manipulation` overriding direct-action capture: corrected the
game-specific action rule to `none`, then confirmed simultaneous reins/jump,
slide outside the button, release and cancellation through actual CDP touch input.
No further material gameplay or visual issues were found in the final review.

## Verification

- JavaScript parsing and scoped whitespace checks.
- Locally served HTTP pages; clean game and root browser consoles.
- Session instructions freeze simulation and audio; desktop help freezes pixels.
- Keyboard jump/reins, variable-height jump, pause, sound and restart.
- Native mobile two-finger touch/capture/slide/release/cancel; pointer reset on blur.
- Shared mobile restart, returning launch gate and refused fullscreen fallback.
- Reins exhaustion and replenishment, damage, protection, score, retries,
  progression, final victory and new-show restart.
- Storage-denial and reduced-motion fallbacks.
- 1440×900 desktop; 667×375, 740×390, 844×390 landscape; 390×844 portrait.
  Controls do not overlap the playfield; no horizontal overflow; touch actions
  remain 112×92 px with 44 px pause and sound buttons.
- Desktop 150-frame sample: mean 17.64 ms, p95 18.20 ms, max 20.00 ms.
  Touch emulation: mean 17.73 ms, p95 18.30 ms, max 18.50 ms.
  Physical-phone performance and human timing feel are not established.
- `screenshots/gameplay.png` shows actual act-5 play at 6/20 clears with a
  centered-hoop bonus and the next paired rings approaching.

Reproduce from repository root with Node and Playwright/Chrome available:

```powershell
node --check big-top-bound/engine.js
node --check big-top-bound/art.js
node --check big-top-bound/game.js
node big-top-bound/tests/verify.cjs
node big-top-bound/tests/focused.cjs
```

Set `PLAYWRIGHT_PATH` to an installed Playwright package if it is not in the
normal module search path; `ARTIFACT_DIR` selects an output directory. Tests own
and stop their HTTP servers and browser sessions. `?test=1&level=5` exposes
deterministic diagnostic controls; the regular URL does not expose the test API.

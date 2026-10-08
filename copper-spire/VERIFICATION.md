# Copper Spire verification

Tempest-style radial tunnel shooter, built October 8, 2026. Canvas with a cached copper observatory instrument, small vector actors, HTML HUD and semantic touch controls. Twelve spokes, inward shots, warned lane changes, growing needles, two-hit armor and warned surges. The user's seven-depth requirement overrides the older level-5-mastery wording in repository standards and builder skills.

## Scope and iteration

Only `copper-spire/`, `Games.md`, and the arcade registration in `index.html` were authored. Four existing unstaged Harbor Bastion changes were preserved. Initial and pre-release fetches matched `origin/main`; no integration was needed.

The complete initial implementation passed keyboard, instruction, session, restart, result, touch, layout, console and performance checks after routine hidden-button and focus corrections. Two separate whole-game reviews followed:

1. Revisited opening, every depth, failures/retries, desktop and all mobile views. Shortened the opening, increased approach and arrival pressure, separated visual particles from deterministic spawn randomness, reduced depth-7 recovery protection, and added etched constellations, copper fasteners, ring seats and actor joints. Replayed the full suite. Slower input could no longer clear depth 7, but the expert policy also failed it, requiring another balance review.
2. Fresh review of gameplay and art from pass 1. Adjusted late-depth arrival/speed balance so an expert clear is feasible; retained greater depth-5 pressure and the first mastery step at 6. Reduced rim radius to keep the ship fully below the mobile HUD, enlarged machine silhouettes, clarified depth-7 protection in instructions, and checked real machine warning/plate behavior. Replayed the entire suite, inspected all required views, tested actual shield-loss recovery, normal keyboard play without hooks, returning mobile sessions, and passive survival. Idle play fails all depths. No further material presentation or control defects were found in this review.

## Final curve

| Depth | Machines | Arrival interval | Base progress / second | Shields | Pulses | New pressure |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 12 | 1.05 s | .115 | 5 | 2 | Straight climbers, forgiving opening |
| 2 | 17 | .90 s | .140 | 5 | 2 | Warned one-spoke lane switching |
| 3 | 22 | .78 s | .170 | 5 | 2 | Needle heads and growing spines |
| 4 | 27 | .61 s | .240 | 5 | 2 | Two-hit plated machines |
| 5 | 32 | .50 s | .300 | 5 | 2 | Warned speed surges; all mechanics present |
| 6 | 38 | .40 s | .360 | 3 | 1 | First combined mastery benchmark |
| 7 | 44 | .35 s | .380 | 2 | 0 | Near-perfect routing and shot timing |

Held fire emits every .17 seconds; rim movement repeats every .13 seconds at full input. Precision joystick scales repeat rate continuously; keyboard taps move one spoke immediately. Pulses destroy machines beyond the inner quarter, with a three-second cooldown. Shield damage clears approaching outer-rim machines and grants two seconds of protection through 6; depth 7 has .45 seconds and no outer-rim clearance. Shields and pulses refill each depth. Retry rolls score back to the start of the current depth.

### Observed browser benchmarks

The reproducible controller uses test-only exact actor state, ordinary held directional input, fixed 60 Hz updates, and delayed target selection. It prioritizes approaching machines and uses a pulse when two machines reach the outer quarter. These are optimistic mechanical feasibility checks, not human reaction-time requirements, enjoyment ratings, or play-time estimates.

| Depth | 350 ms policy | 650 ms policy |
| --- | --- | --- |
| 1 | Clear 13.45 s, 5 shields | Clear 13.45 s, 5 shields |
| 2 | Clear 15.85 s, 5 shields | Clear 16.03 s, 5 shields |
| 3 | Clear 18.70 s, 5 shields | Clear 19.20 s, 5 shields |
| 4 | Clear 18.12 s, 5 shields | Clear 18.78 s, 5 shields, one pulse used |
| 5 | Clear 17.53 s, 5 shields | Clear 17.18 s, 4 shields, one pulse used |
| 6 | Clear 17.42 s, 3 shields, pulse used | Fail at 16.67 s, 34 kills |
| 7 | Fail at 11.28 s, 26 kills | Fail at 6.73 s, 11 kills |

120 ms policy cleared depth 6 in 16.95 s and depth 7 in 17.25 s, with zero breaches. Depth 5 deliberately withheld all shooting until two real shield losses, then recovered to clear in 17.37 s with three shields, one pulse, 25 kills and seven total breaches (including rim clearance). A separate two-injected-hit case also cleared with three shields. Idle input failed every depth. Strong play can recover in 5; 6 requires quicker prioritization; 7 rewards near-perfect routing. Human feedback on depths 4–7 remains the most useful next tuning evidence.

## Browser and responsive checks

Chrome/Playwright on Windows, served over local HTTP. `verify.cjs` is self-contained except for the Playwright package and installed Chrome. Set `NODE_PATH` to the bundled runtime packages; `SPIRE_BASE_URL` and `SPIRE_REPORT_DIR` can override the local server and output directory.

- First-session instructions freeze simulation; Space activates the launch button. R while viewing instructions preserves the gate. Desktop returning session bypasses the first-load instructions.
- Actual arrow input and Space shooting; help freezes simulation and resumes correctly; P pauses/resumes; M toggles sound; R resets in place. Current-depth retry restores score; next-depth progression, victory and defeat buttons work.
- Actual Chrome CDP touch: joystick hold, slide across directions, neutral return, release, cancel and independent simultaneous fire. Options/button mode, held direction buttons, saved preference across reload, context-menu suppression, shared Reset, sound and pause pass. Fullscreen refusal is graceful; returning mobile launch stays paused until the shared launch gate completes.
- Real shot damage, two-hit armor, pulse reach and charge use, collision damage and protection, lane-change warning/switch, surge warning/speed, needles, scoring, result and failure behavior verified.
- Normal page with no diagnostic hooks: keyboard fire earns score; held rim travel and help work. All depth controllers run in the browser, including 1–5 and both later benchmarks.
- Visually inspected 1440×900 desktop, 667×375, 740×390 and 844×390 touch landscape, plus 390×844 portrait rotation prompt. Geometry assertions show no playfield/control overlap, stacked actions and no horizontal overflow. Ship and HUD have clear separation after pass 2. Short instructions scroll; launch remains reachable.
- Cached static background; capped particles; delta capped at .04 seconds; no repeated redraw behind blocking overlays. Reduced-motion mode cuts particles and disables pulse-ring decoration. Final active-play desktop mean/p95: 17.69/18.4 ms; touch emulation: 17.87/18.6 ms. These are browser measurements on this host, not physical-phone performance measurements.
- Game console and page errors empty. Root arcade has no script errors; existing root favicon/resource behavior is outside this task's scope. The In Work card resolves to the new game; both canonical links match. JavaScript parsing and intended-file whitespace checks pass.

## Captures

Active depth-5 screenshot: `C:/Users/forem/.codex/visualizations/2026/10/08/01a11a19-2994-7df3-9a5d-e1a1a1e7ae2c/copper-spire-gameplay.png`. It shows natural spawned threats, shots, score 450, three shields and two pulses. Mobile captures, portrait prompt and `verification.json` are beside it. The screenshot uses diagnostic frame stepping, with ordinary simulation and naturally spawned actors; it is not a fabricated game state.

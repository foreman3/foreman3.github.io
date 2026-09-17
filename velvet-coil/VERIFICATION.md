# Velvet Coil verification — 2026-09-17

A classic Snake arcade with a living gold necklace and Art Deco jewel vaults. Canvas was chosen for the tile board, moving chain, and short collection effects. All art and sound are local or generated; there are no game asset network dependencies.

## Five-vault curve

| Vault | Rubies | Seconds per cell | Growth per ruby | Lives | Time limit |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1: Foyer | 6 | .240 | 2 | 4 | 95s |
| 2: Silk Gallery | 8 | .220 | 2 | 4 | 105s |
| 3: Ruby Salon | 10 | .200 | 2 | 4 | 115s |
| 4: Crown Treasury | 12 | .180 | 3 | 4 | 125s |
| 5: Midnight Vault | 16 | .115 | 4 | 2 | 115s |

The first three vaults retain the same obstacles, growth rate, and lives; quotas and speed increase gradually, with more time to compensate for the larger quota. Vault 4 adds tail pressure while retaining four lives. A collision preserves every collected ruby, resets the tail to six segments, restores at least two seconds of slow charge, and allows a 1.6-second route-planning pause. The timer also pauses during recovery. Vault 5 combines higher speed, more tail growth, a larger quota, and fewer lives as the first mastery benchmark. Slow motion halves movement speed; four seconds of charge are available and each gem restores one second.

## Browser observations

The reproducible Playwright suite serves the repository over HTTP and uses diagnostic hooks enabled only by `?test` to advance simulation and inspect state. A shortest-route controller completed vaults 1–5 in 20.78 / 21.12 / 32.50 / 32.02 / 26.63 simulated seconds. Vault 4 included two actual wall collisions after gems 4 and 8, retained its progress, and cleared with two lives. A separate controller delaying each decision by 160 ms cleared vaults 1–4 (vault 4 with the same two mistakes) but failed vault 5; the immediate planner cleared vault 5 with both lives. Neither controller used slow motion. These are mechanical timing and recovery benchmarks, not human difficulty-study results.

Verified keyboard directions and reversal rejection, modal keyboard activation and focus wrap, instruction/session gate, help freeze, pause/resume, reset, sound toggles, slow press/release, shared joystick hold/slide/neutral/release, button preference persistence, direct swipe, blur reset, context-menu suppression, mobile reset, returning fullscreen launch, graceful fullscreen refusal, wall/pillar/self collision, moving-tail-cell fairness, gem collection and growth, level 4-to-5 transition, victory, loss, timeout, and in-place restart.

Visually inspected 1440×900 desktop, 667×375 / 740×390 / 844×390 mobile landscape, and the 390×844 portrait rotation prompt. Mobile controls use the shared side rails, actions stack vertically, and no controls overlap the board. Portrait deliberately pauses simulation and requests landscape. Short-screen instructions scroll to their launch button. Game desktop/mobile console errors and arcade script errors: none. The arcade's existing external assets are outside this game's scope. Registration card count and navigation passed; both canonical registrations point to `velvet-coil/`.

Measured animation-frame intervals on this machine: desktop mean 17.63 ms / p95 18.40 ms; mobile emulation mean 17.51 ms / p95 18.30 ms. This is browser emulation, not physical-phone profiling. The static vault is cached, transient effects are capped at eight, frame delta is capped, and blocked overlays stop drawing. Decorative gem pulsing and expanding effects respect reduced motion.

## Two improvement passes after the functional build

1. Reviewed all five vaults, opening, end states, restart, and required layouts. Added connected gold necklace links and gem inlays, a next-step danger marker, and footer spacing; corrected the per-vault scoring timer and allowed normal keyboard activation of modal buttons. Repeated the full browser suite and visual review.
2. Fresh review of the same complete experience. Added chain shadows, more distinct pillar bases, a numeric slow-charge readout, last-life and low-time emphasis, an explicit recovery countdown, clearer post-recovery text, and modal focus wrapping. Repeated the full suite, added swipe/button/blur/collision edge cases and the delayed-decision benchmark, then visually inspected the final artifacts. No further material changes were identified.

## Reproduction and artifacts

With Playwright on `NODE_PATH`, run `node velvet-coil/verify.cjs`. Optional `BROWSER_EXE` selects Chromium and `SHOT_DIR` selects screenshot/report output. `verification.json` records the final measured run. The release screenshot shows naturally generated active vault-4 play at 8 / 12 rubies; actors were not arranged for that shot.

Only `velvet-coil/`, `Games.md`, and `index.html` are part of this release. No existing game or shared file was modified.

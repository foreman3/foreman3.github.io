# Velvet Coil: heist revision — 2026-09-18

User feedback drove this revision: the original numeric difficulty ramp felt slow and vaults 3–4 did not feel distinct. This replaces repeated collection quotas with five routing problems, an explicit getaway, optional bonus theft, and a score-for-survival tail-shedding action.

## Five distinct vaults

| Vault | Required rubies | Step interval | Lives | Time | New decision |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 — Grab & Go | 3 | .19 s | 4 | 50 s | Short open-board introduction; physically reach the exit. |
| 2 — Split Decision | 4 | .18 s | 4 | 65 s | Alternate thefts between chambers through two passages. |
| 3 — Watch the Sweep | 5 | .18 s | 4 | 75 s | Aimed beams force turns and timed crossings. Speed stays unchanged. |
| 4 — Changing Routes | 6 | .17 s | 4 | 85 s | Alternating shutters require circulation, commitment, and escape planning. |
| 5 — The Perfect Heist | 8 | .14 s | 2 | 85 s | Combine beams and shutters, with shorter warnings and more tail growth. |

Collecting the quota opens a physical exit at the right edge instead of immediately ending the level. Up to three optional bonus jewels then offer 500 / 600 / 700 points, each costing four seconds and raising alarm pressure. Bonus jewels have a plus marking as well as a different color. Alarm gradually accelerates security cycles, not the snake's movement.

X or the mobile SHED button removes every tail link beyond the first six, deducts 25 points per removed link (never below zero), keeps collected rubies, and provides 1.4 seconds of beam protection. It has a six-second cooldown. Space / SLOW still halves movement speed with rechargeable charge. Four lives through vault 4, collected-gem preservation, short post-crash tails, and recovery pauses remain intact.

Beams telegraph the row or column before firing and only damage the head. Vault 3 starts with a 2.4-second warning; vault 5 starts with 1.5 seconds. Warning duration is affected by alarm pressure. Shutters warn before switching and defer closing if either the head or tail occupies the doorway, so they cannot crush a passing coil. Vault 4's base passage cycle is 7.5 seconds; vault 5's is 5.6 seconds.

## Verification and limits

`verify.cjs` serves the repository over HTTP in Chromium. Diagnostic hooks are present only with `?test`; adding `&manual` freezes automatic simulation advancement for reproducible step-by-step browser tests. Production links `?vault=3` and `?vault=4` start directly at the named vault while preserving the normal instruction gate.

A controller that replans around the visible board and impending security states cleared all five vaults in 13.01 / 14.94 / 18.54 / 37.71 / 46.74 simulated seconds. Vault 4 cleared with one life after two deliberate recovery-test mistakes plus one naturally incurred collision. Vault 5 used one tail shed and handled eleven beam warnings. These are mechanical feasibility observations, not estimates of human enjoyment or completion times.

Matched-seed comparisons: accounting for beams preserved all four lives in vault 3, while ignoring them lost one; both cleared that introductory security vault. Accounting for shutters cleared vault 4 with two lives, while ignoring them failed after two rubies. In vault 5, accounting for combined security cleared with two lives and one shed; ignoring security failed after three rubies. An earlier overly conservative controller stalled by treating every warning as an already-active wall; the final controller allows safe crossing during the early warning window. No gameplay rule was relaxed to accommodate that controller.

Verified instruction and session gates, help/pause freeze, keyboard directions and reverse rejection, slow hold/release, shed keyboard/touch/cooldown/cost, quota-to-exit behavior, bonus scoring/time cost, actual exit contact and progression, warning versus active beam damage, occupied-doorway grace, closed-shutter collision, game over, timeout, restart, joystick hold/slide/neutral, button preference, swipes, blur release, context-menu prevention, fullscreen refusal and returning mobile launch. Fresh desktop/browser-console checks passed without errors.

Visually inspected 1440×900 desktop, 667×375 / 740×390 / 844×390 landscape, and 390×844 portrait rotation guidance. Four touch actions stack in the right rail; each is at least 44 pixels high. Controls and board do not overlap. A measured mobile HUD/security-label overlap was fixed and is now explicitly asserted in the browser suite. The smaller screen omits the decorative vault subtitle to preserve status readability.

Final timings and detailed observations are in `verification.json`. The active screenshots show naturally generated play in the beam and shutter vaults, with no arranged actors. Physics, hazards, and timers freeze behind blocking overlays. Static art remains cached, effects capped, and reduced-motion preferences respected.

## Scope

Only `velvet-coil/` was modified. Unrelated Orchard Watch edits encountered at the start of the revision were preserved; their separate commit is not part of this game's change.

## Scanner clarification — 2026-09-18

Replaced the lethal-laser presentation with a security inspection strip and paired optical readers. The masked living head is the thief; the trailing links are inert stolen jewelry. A warning reticle targets only the head inside the strip, while jewelry inside an active scan gets a harmless glint. Head detection produces an alarm chirp, HEAD DETECTED recovery message, and a retained-position reticle instead of a red damage flash. HUD, vault briefs, instructions, and shed copy now describe scanning and head detection. Timing, head-only collision, and all five difficulty profiles remain unchanged. The instruction-session key is versioned so returning players see the clarified rule once.

Added explicit browser assertions that an active scan through the body preserves lives and tail length, and that head detection creates the correct feedback. Diagnostic screenshots cover both cases; the natural vault-3 screenshot shows normal scanner gameplay. Re-ran the five-vault browser suite, desktop/mobile layouts and controls, session return, and clean-console checks.

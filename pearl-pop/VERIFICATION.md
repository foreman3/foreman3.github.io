# Pearl Pop release verification

Verified 2026-11-05 in installed Chrome, served over local HTTP. Puzzle Bobble-style hex-grid bubble shooting is absent from the prior canonical game list, arcade cards, and root directories. It differs from Prism Panic's bouncing-orb splitting and Kiln Cascade's gravity-driven falling columns. Canvas suits the moving projectile, match bursts, falling clusters, and hex-grid scenery. Background and five pearl illustrations are cached; the simulation uses capped delta time, bounded effects, and skips rendering while idle or blocked. No external assets or libraries are needed to play.

## Challenge curve

The scheduled request explicitly puts mastery at 6 and near perfection at 7, superseding the older level-5 wording in the standards and skills. Every mechanic is present by 5. Nothing moves while the player thinks; shot economy, color choices, shot windows, banks, and attachment routes supply the challenge.

| Reef | Starting pearls | Colors | Shots | Consecutive non-matches per tide rise | Observed efficient clear |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 | 30 | 3 | 12 | 6 | 5 shots; 7 left |
| 2 | 40 | 3 | 14 | 6 | 5 shots; 9 left |
| 3 | 50 | 4 | 19 | 5 | 10 shots; 9 left |
| 4 | 60 | 4 | 21 | 5 | 11 shots; 10 left |
| 5 | 70 | 5 | 19 | 5 | 11 shots; 8 left |
| 6 | 80 | 5 | 17 | 4 | 15 shots; 2 left |
| 7 | 90 | 5 | 16 | 3 | 15 shots; 1 left |

Reef 1 has broad three-pearl shoals; 2 adds deeper, smaller pockets and hanging releases. Reef 3 adds a fourth color and offset connections. Reef 4 combines depth with narrow pockets. Reef 5 adds the final fifth color and substantial banking/queue choices while retaining recovery room. The same controller needed six swaps in reef 3, five in 4, and multiple banks in 5. A match resets the non-match counter; a tide rise shifts the ceiling by one row, retaining shot choices.

Actual deliberately non-matching browser shots followed by an efficient controller cleared reefs 1–4 with 4/7/9/3 shots left after two opening mistakes. Reef 5 cleared after four opening non-matches with five shots remaining. No state or resource penalties were injected for these recovery traces.

The naive greedy controller exceeds reef 7's final allowance. An expert route starts with two deliberate setup attachments at the left bank, then releases hanging roots; it cleared in 15/16 shots with 77 matched and 28 falling pearls. These two setup shots are useful preparation, not wasted shots. This shorter route exposed an overly generous earlier allowance, which was reduced from 19 to 16. Reef 6's separate two-poor-shot trace exhausted its supply with eight pearls left. All seven were cleared in Chrome with actual mouse shots; a full opening was separately cleared with actual arrow/Space keys. The normal page also cleared the opening using real mouse input and real-time projectile travel, without debug hooks.

These are optimistic, deterministic mechanical feasibility checks using exact board state, not human difficulty or enjoyment studies. Different routes can beat a sampled controller. Reef 2 and 1 taking equal optimized shots does not establish equal human difficulty. Human aiming, queue strategy, and late-reef feedback remain valuable.

## Functional and visual checks

- First-session instructions freeze all simulation and audio. Session return skips those instructions on desktop; shared mobile Play gates returning sessions. Storage denial remains playable.
- Mouse, arrow/A/D steering, Space firing, Q swap, P/help pause, R restart, M sound, and native Enter on dialog buttons work. Session modal and result dialog focus wrap correctly.
- Pausing during flight freezes the exact projectile and resumes it; window blur releases held steering. Retry preserves earlier banked score and refills only the current reef. New expedition resets everything.
- Real matching, floating-cluster release, bank scoring, non-match feedback, an actual six-shot tide rise, danger-line/supply failure, retry, all Next transitions, and final victory passed.
- Touch drag holds/slides aim, release/cancellation retains aim, FIRE and SWAP work, context menus are suppressed, and shared Reset works. A complete touch opening advanced to reef 2 with the controls still visible and usable. Fullscreen refusal and returning Play both passed.
- Reviewed screenshots at 1440x900, 667x375, 740x390, 844x390, and 390x844. Canvas aspect ratio is preserved; no overflow or control overlap. Landscape actions stack in the right rail; portrait uses a bottom row. Minimum actions are 76x44 in landscape. Short instruction dialogs scroll to their dismiss button. Desktop navigation/help hide on mobile.
- Root arcade has exactly one Pearl Pop card under In Work; it navigates correctly. Games.md has one matching local link. Shared flyout loads and opens. Game console/page errors and arcade script errors are empty.
- JavaScript parsing and Git whitespace checks passed. No existing game file changed.

## Iteration record

The functional baseline was followed by two additional whole-game reviews and regressions. Baseline testing corrected the touch pause/backdrop interaction and fixed mobile canvas proportions by sizing the board independently of fixed-height HUD rows. The test planner was changed to choose the centers of valid shot windows instead of their edges.

Pass 1 re-examined all reefs, endings, controls, and five layouts. It narrowed reef 4's pockets, tuned allowances, added visible pop/drop callouts and low-shot markings, and explained the tide countdown after misses. All seven clears and all five recovery checks passed again.

Pass 2 freshly reviewed the result, including opening, later reefs, failure/retry, victory, desktop, and each mobile size. It replaced the placeholder shell with a chambered illustration, added a landscape aiming reminder and accessible low-supply text, and found/tuned the more efficient reef-7 route. The full suite passed on the final version. Focused checks additionally verified keyboard-only completion, exact in-flight pause, earlier-score retention, true tide movement, storage denial, flyout, and active rendering performance. Further safe changes would need human aiming/balance feedback rather than cosmetic churn.

## Performance and evidence

Final full-suite frame sampling: mean 17.64 ms, p95 18.5 ms. Separate active reef-5 samples including projectile travel and aiming: desktop mean 18.88/p95 18.5/max 229.4 ms; 667x375 touch emulation mean 18.59/p95 18.5/max 176.3 ms. Earlier concurrent-browser measurement had a 529 ms gap. Headless timing outliers were observed; smooth physical-phone performance is not established. No browser errors accompanied the final active sample.

Evidence directory: `C:/Users/forem/.codex/visualizations/2026/11/05/01a1aa84-6863-74d1-b41a-1776fc792a24/`. It contains baseline.json, pass1/verification.json, final/verification.json, final/focused.json, seven reef captures and all viewport captures. `final/pearl-pop-gameplay.png` captures active reef 5 with a physical pearl in flight after two successful shots. Final live evidence is written to final/live.json and final/live-gameplay.png after publication.

## Reproduction and scope

Run `node pearl-pop/serve.cjs` (localhost port 8776). With installed Playwright on NODE_PATH, run `node pearl-pop/verify.cjs` and `node pearl-pop/focused.cjs`. PEARL_OUT overrides the evidence directory and PEARL_URL overrides the origin. layout.cjs regenerates layout inspections; live.cjs checks published bytes and normal real-time play. Debug state/manual stepping is available only with `?test`, never on ordinary pages.

Changes are restricted to pearl-pop/, Games.md, and index.html. The user's explicit strict scope overrides the standards' newer offline-assets.js regeneration requirement. Read-only `node scripts/build-offline.cjs --check` reports stale inventory (56 games/318 runtime files/17.3 MiB computed); the shared inventory and sidebar were deliberately left untouched. Online canonical registration and direct play work; installed/offline inventory and a new shared-flyout entry need a separately scoped update. No save, service worker, or browser cache was changed.

Initial and final successful fetches matched origin/main (0/0); safe fast-forward integration was a no-op. Release uses an ordinary commit and push, with only the intended paths staged. Requested Gmail notification is sent only after a successful push and live verification.

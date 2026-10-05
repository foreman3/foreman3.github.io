# Iron Meridian

An original, self-contained action platformer with illustrated robot characters, five selectable sectors, guardian weapons and a weakness chain. All artwork, sound and game assets are local.

## Play

Run `node iron-meridian/serve.cjs` from the repository root, then open http://127.0.0.1:4173/iron-meridian/. The game is registered in the main arcade and shared navigation.

- Move: arrows or A/D. Hold Down/S to crouch on the ground.
- Jump: Space or Z. Release early for a short jump. Release and press again against a wall to climb.
- Aim: hold Up/W for overhead shots; move left/right while aiming for diagonal shots.
- Fire: tap X/J for one shot; hold to charge without shooting, then release after 0.65 seconds for a charged blast.
- Dash: Shift/C/K. One air dash per jump, with a brief dodge window.
- Weapons: Q/E cycles acquired cores; 1–6 selects directly.
- R restarts the sector; M toggles sound; Escape or the desktop question mark pauses.
- Touch: shared analog joystick or direction buttons; up aims, diagonals aim while moving, and down crouches, plus Fire, Jump, Dash, Crouch, Weapon and Sectors. Sound is available in mission control.

The first four sectors are selectable; the reactor requires their four cores. Defeating guardians gives Tidal Disc, Arc Lance, Thorn Fan, Frost Shard and finally Nova Core for replay. Cores persist locally. New Campaign requires a second click before clearing them. Instructions gate first-session gameplay and reopen from desktop help.

## Long-sector redesign — October 4, 2026

The detailed sector-by-sector design was written in [STAGE-REDESIGN.md](STAGE-REDESIGN.md) before implementation. Approaches are roughly three times their former length, with four defended encounters, a larger midpoint sentry, five span crossings, climbable machinery, terraces and two optional supply routes in every sector.

| Sector | Length | Midpoint | Landscape and recommended core |
| --- | ---: | --- | --- |
| Copper Harbor | 12,000 | Dockbreaker | Cargo tunnels, crane decks and broken wharves; charged Buster works on the first visit |
| Tempest Spire | 13,200 | Coil Marshal | Wind, turbine lifts, storm bridges and announced lightning; Tidal Disc |
| Glass Garden | 14,000 | Glass Scythe | Glass domes, roots, canopy terraces, crouch passages and thorns; Arc Lance |
| Frost Foundry | 14,800 | Cryo Ram | Icy machinery, moving press decks, conveyors and announced ice falls; Thorn Fan |
| The Meridian | 15,600 | Prism Sentinel | Reactor arches, maintenance tunnels, conveyors, lifts and discharge columns; mixed cores, Frost for the guardian |

Defended fields release only when their marked enemies are defeated. Plated enemies display a weapon recommendation and expose a vent after attacks. Matching cores deal much more damage and interrupt fire. Charged Buster at a vent is the fallback for players entering a sector without its preferred core; ordinary pellets are poor against closed armor. Meridian formations mix several armor classes.

There is one checkpoint, immediately after the midpoint sentry. It restores armor and energy once. Boss entry provides no refill or additional checkpoint. Death/Continue return to the retained checkpoint, preserving cleared fields and collected caches within the current sector attempt. Restart resets that progress. Falling costs 5 armor and returns to safe footing; it can consume an attempt if armor runs out. Three attempts lead to unlimited Continue.

Each sector has just two optional caches: +5 armor and +25 energy, both on upper routes. Routine enemy drops and ledge supplies were removed. Special energy regenerates at 5/sec. Charged special shots spend 75% of the ordinary shot cost, rewarding deliberate firing. Frost has a heavier charged hit, intercepts hostile projectiles, and briefly slows guardians with a cooldown.

Guardian armor is 120 / 200 / 240 / 280 / 400. Brass Crab retains its six shuffled roaming patterns in a wider arena. The other four guardians have five shuffled, multi-part attacks: reversals, double vaults, orbits, marked drops and high/low crossfire, with distinct sector presentation. They travel broadly across both sides and upper airspace. Overdrive speeds attacks; Sovereign Zero chains a second attack before recovery, with an extra warning. Matching weaknesses substantially shorten the fight.

New illustrated foreground landmarks add suspended containers, animated turbines, glass conservatories, ice-covered furnaces and reactor rings. Marked volleys, vents, weapon labels, sentry health bars and encounter names make the increased challenge readable. The curved character artwork, crouch/charge controls and existing save format remain.

## Verification

Tests use the local server, Playwright and installed Edge. Set NODE_PATH to the bundled Node dependencies if Playwright is outside the usual search path. Tests explicitly enable `?test`; those hooks are absent during ordinary play.

| Command | Coverage |
| --- | --- |
| `node iron-meridian/verify.cjs` | Instruction gate, controls, jumps/dashes, all gaps, checkpoints, guardian rewards, saves, death/Continue/restart, arcade links, desktop and touch regressions |
| `node iron-meridian/aim-check.cjs` | Overhead/diagonal tap and charge shots, every core, actual drone collision, airborne aiming, four touch sizes, direction buttons and cancellation |
| `node iron-meridian/controls-combat.cjs` | Exclusive charging, release/tap handling, energy, crouch hitbox/muzzle, ceiling clearance and all six Crab patterns |
| `node iron-meridian/traverse.cjs` | Five full approaches through all four fields using actual inputs and progression-appropriate cores; no movement or armor cheats |
| `node iron-meridian/campaign-check.cjs` | Full approaches followed immediately by normal guardian fights, including a real checkpoint retry; no warps or refills |
| `node iron-meridian/balance.cjs` | Arena-started fights at normal armor, identical defensive controller, matched cores versus Buster, and charging without evasive actions |
| `node iron-meridian/weapon-routes.cjs` | Buster-only approaches compared with matching-core approaches |
| `node iron-meridian/redesign-check.cjs` | Geometry, tunnel/spike separation, sparse caches, armor/vent damage, field releases, one-time checkpoint heal, retry persistence, no boss refill, Frost interception and conveyor collisions |
| `node iron-meridian/landscape-check.cjs` | Five midpoint scenes and local art/error checks |
| `node iron-meridian/live-check.cjs` | Real-time keyboard play, pause/restart, console/resources and frame timing |

The combined approach-and-guardian probe cleared all five sectors using normal damage and keyboard inputs. Copper Harbor required one checkpoint retry; the final reactor cleared with 2 armor remaining. The fast route controller already knows the terrain and skips optional caches: approaches took roughly 57–101 seconds, followed by approximately 28–39 seconds of guardian combat. This is automated play evidence, not a guarantee of human completion time; deliberate exploration takes longer.

In the Buster-only comparison, Tempest and Foundry took substantially longer, Garden consumed two attempts and took nearly three times as long; Meridian exhausted all three attempts. The arena comparison verifies that the opening guardian remains beatable with defensive Buster play, while charging without evasive actions loses. The final Buster strategy loses while Frost succeeds. Focused fixture tests isolate later phases without claiming normal traversal; full-route and combined checks separately verify progression without those shortcuts.

Verified at 1440×900 desktop; 667×375, 740×390 and 844×390 landscape; and 390×844 portrait. Touch checks include fullscreen refusal, joystick hold/slide/neutral/release, direction-button preference, pointer cancellation/lost capture, charge release, crouch and action controls. No page errors or failed game resources were observed. The real-time desktop sample measured a 17.8 ms median and 18.5 ms 95th-percentile frame, approximately 56 FPS in headless Edge on this machine.

JSON evidence and PNG captures are saved beside the scripts. The implementation separates authored route geometry (stages.js), route illustration (route-art.js), guardian patterns (guardian-fights.js and crab-boss.js), existing character artwork (art.js), and simulation/UI (game.js).

## Upward aiming — October 4, 2026

Up/W now aims while Space/Z jumps. Aiming with movement fires a normalized diagonal; aiming without movement fires straight overhead even while sliding. The analog touch joystick provides the same directions, with down also crouching. Direction-button mode supports simultaneous Up + Left/Right. Cannon poses and directional projectiles follow the aim, including crouched/airborne poses and Thorn spread. Fire release captures its direction so a quick aim/fire tap between frames remains correct. Options, pause, pointer cancellation and blur clear aim and held charge.

Focused aim tests and the existing desktop/mobile, charge/crouch and complete-sector probes passed again before release.

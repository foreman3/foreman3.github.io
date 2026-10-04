# Hollow Signal

An original exploration adventure. Ari Venn follows a signal from a missing sister into Nacre, a colony whose residents survive within a living mineral archive. Discoveries explain its history while opening the physical world.

The original expedition was planned in [STORY.md](STORY.md) and [DESIGN.md](DESIGN.md). The current room layouts, encounter rules and pacing were planned **for all thirty chambers before gameplay edits** in [CHAMBER-REDESIGN.md](CHAMBER-REDESIGN.md).

## Play

From the repository root, run `node hollow-signal/serve.cjs` and visit `http://127.0.0.1:4173/hollow-signal/`. An existing VibeCade server on port 4173 also serves the game. Set `HOLLOW_PORT` to use another port.

- Thirty large chambers in five regions. Horizontal fields span roughly eight–ten screens; shafts add multi-screen vertical climbs.
- Most chambers contain three encounter sectors with permanent clearances, terrain challenges and separated branch entrances.
- Carapace keepers resist small pulses but expose firing vents; charge or mines break their armor. Mineral-crust defenders require mines. Phase defenders require the Phase beam.
- Eight recovered abilities, five guardians, eight witnesses, eight health tanks and five sanctuary anchors.
- Rolling passages, broken spans, moving lifts, elevated caches, optional bomb columns and a cross-region shortcut.
- Two ending choices, a twelve-minute playable escape, and continued exploration after the ending.
- Local saves, synthesized music/effects, original illustrated artwork and touch controls.

Move with arrows/A/D, jump with Space/Z, and aim upward with Up/W. Tap X/J to shoot; after Lens, hold and release to charge. Down/S toggles Spindle. After discovering mines, tap Fire while folded for precise placement, or **hold Fire while folded to chain bomb jumps**. Stay above the explosions and steer onto a ledge; unfolding stops launches. Mines use no ammunition and do not consume Wing's second jump.

E interacts, Q cycles weapons, 1–4 selects acquired weapons, Tab opens the atlas, R returns to the checkpoint, M toggles sound, and Escape opens help. After Wing, release and press Jump again in the air. Local relays save checkpoint position and refill weapon energy; sanctuaries also heal. Completed encounter fields remain open through death, travel and reload. Existing saves preserve discoveries, guardians, opened doors, witnesses and tanks.

Touch uses the shared analog joystick: left/right moves, Up aims and unfolds, and Down folds. Fire, Jump, Use/Weapon and Atlas remain as action buttons. Diagonal Up supports moving fire. Holding Down keeps Spindle folded; holding Up unfolds only where clearance permits. Sound is available inside the atlas. Options offers the shared directional-button alternative. Portrait is playable; landscape provides the larger field.

## Pacing and iteration

The original creation included two gameplay/art reviews. This redesign preserves its story and illustrated style while substantially expanding the fields and making encounters matter within a room.

The first-clear design target is roughly 50–80 seconds for a normal chamber, with shorter sanctuary rests and longer guardian approaches plus fights. An automated pilot that knows every target and route cleared normal non-boss combat chambers in **35.5–63.5 simulation seconds**, excluding journal reading and most optional caches. This is a fast-route measurement, not a claim that every human clear lasts exactly a minute. Cleared return journeys are deliberately faster.

Testing prompted further corrections: mine-only enemies stay on reachable ledges; cool ledges support the pre-Thermal Ash route; ceilings prevent flight outside the room; elevated relays preserve checkpoint height; folded relay saves respawn a standing body above the floor; the Matron branch and relay have distinct interaction space. Bomb chains were tuned and checked with both keyboard and touch input. Decoration tiles and drawing culling preserve performance in the larger world.

## Verification

Tests use Playwright with installed Edge. `?test` enables stepping and scenario setup; normal play has no debug controls. `pilot.js` is a test-only controller and is never loaded by the game. In this workspace:

```powershell
$env:NODE_PATH='C:\Users\forem\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node hollow-signal/verify.cjs
node hollow-signal/redesign-check.cjs
node hollow-signal/pacing-check.cjs
node hollow-signal/approach-check.cjs
node hollow-signal/combat.cjs
node hollow-signal/mobile-chain.cjs
node hollow-signal/mobile-direction.cjs
node hollow-signal/escape.cjs
node hollow-signal/live-check.cjs
```

Run `verify.cjs` before `escape.cjs`; it writes the completed-campaign fixture used to start that scenario. `traverse.cjs` delegates to the expanded pacing check.

| Check | Result and scope |
| --- | --- |
| All chamber routes | All twenty-five non-boss chambers and all five guardian approaches cleared through actual keyboard movement, jumps, shots, mining and equipment changes, with zero deaths. Independent room setup supplies progression-appropriate abilities, guardian bonuses and up to two tanks. No movement warps or health changes during the routes. |
| Guardian fights | Separate arena-started scenarios use actual inputs, normal damage and normal boss HP. All five won with zero recoveries. Fourth guardian minimum integrity: 92/190; fifth: 58/190. Approach and fight scenarios are separate, not an uninterrupted campaign. |
| Encounter mechanics | Real projectiles verify vent recovery, charged armor damage, beam-resistant mineral crust, mine kills and Phase-only targets. Real kills release a field; its clearance survives save/reload and death. Folded relay save/reload regression passed. |
| Bomb chains | Six consecutive keyboard-driven launches gained 1,176.9 pixels. Four touch-driven launches gained 812.1 pixels at every required viewport. Standing explosions do not launch; touch cancellation stops new mines. Scenario placement isolates the climb. |
| Progression and UI | All thirty rooms, ability seals, pickups, guardian rewards, low tunnels, Wing, optional weapons, Frost, Thermal, records/tanks/pods, map/travel, saves, death/restart and both endings passed. Placement hooks isolate these checks; one-HP guardians test reward events only. |
| Save compatibility | A version-one save retains discoveries, recordings and guardian progress. An active old escape receives proportional extra time. Current saves also preserve encounter clearances and relay elevation. |
| Escape | Loaded completed-campaign state; ordinary movement and interaction traversed eleven connected rooms and reopened the Phase shortcut. Launch completed in 274.53 of 720 simulation seconds with 190 integrity and zero deaths; no route movement warps. |
| Joystick directions | Up aim/unfold, Down fold, diagonals, held-Fire form changes, low ceilings, four-direction button preference and reset/cancel/blur passed at all four mobile sizes. Aim and Fold action buttons have been removed. |
| Touch | 667×375, 740×390, 844×390 and 390×844 passed reachable instructions, clear control rails, joystick neutral/release, charge/release, jump cancellation, Fold, atlas/sound, lost capture, restart, blur and graceful fullscreen refusal. Browser emulation, not handset hardware testing. |
| Live rendering | Real-time keyboard movement/jump/fire and sound controls passed. Opening, final guardian, Engine shaft and mobile guardian samples measured median 16.7 ms frame intervals and 95th percentiles 16.8–16.9 ms on this machine, with 119 intervals per scene. |
| Menu and resources | Main arcade card loads the game. No game script errors or failed local resources. The existing arcade's external Google Fonts request was denied by the test environment; its fallback fonts and game link worked. |

Reports include `verification.json`, `redesign-check.json`, `pacing-check.json`, `approach-check.json`, `combat.json`, `mobile-chain.json`, `mobile-direction.json`, `escape.json` and `live-check.json`. Screenshots cover active combat, all guardians, all regions, story, atlas, ending and mobile layouts. Coverage comes from separate input-driven and focused scenarios, not a single uninterrupted human playthrough.

## Files

`world.js` defines the room graph and abilities; `chambers.js` builds the current fields and encounters; `story.js` holds dialogue; `game.js` owns physics, progression and UI; `art.js` illustrates the world and actors. Static backgrounds, a bounded four-tile decoration cache, drawing culling, capped particles and reduced mobile backing resolution keep the expanded world inexpensive. Overlays pause simulation. The game remains registered under **In Work** in the arcade.
# Hollow Signal — gameplay and world plan

This is the original creation plan. The subsequent thirty-chamber layout and encounter redesign is specified in [CHAMBER-REDESIGN.md](CHAMBER-REDESIGN.md), which is authoritative for current dimensions, pacing, defenders, relays and bomb ascent.

## One connected expedition

Thirty authored chambers span five regions. Rooms scroll horizontally and vertically, have persistent collected objects and opened seals, and connect through bidirectional doors and lifts. This is an exploration campaign, with branching rooms, return routes and sanctuaries, rather than a level-select shooter. The full connected world contains more than forty screen widths of traversable space.

## Ability evolution

| Discovery | Combat change | Exploration change | Story meaning |
| --- | --- | --- | --- |
| Resonance lens, Tideglass Vault | Holding Fire charges a larger pulse | Charged pulses release resonance seals | Lio's voice travels through the same mineral network |
| Spindle shell, Shellkeeper | Compact evasive body | Roll through physical low tunnels and shell gates | Lio designed a suit for moving inside the organism |
| Pulse mine, Underworks cache | Fire while folded drops a timed explosive | Blast brittle partitions and floor seals | The roots can be separated safely rather than burned |
| Wing coil, Root Matron | Second jump, better aerial positioning | Reach high ledges and ascend the Archive route | The colony used the organism's buoyant filaments |
| Phase beam, Archive Ray | Piercing beam and stronger charged shot | Open phase seals and a shortcut to the original ruins | The player can now read the preserved voices |
| Thermal mantle, Furnace Eel | Protects against environmental heat | Survive hot passages into the Living Heart | Ari completes the repair path Lio could not finish |
| Optional Seeker/Frost weapons | Homing bolts / freezing enemies | Freezing provides another way to control platform threats | Reward deliberate exploration of side chambers |

Abilities combine: a folded mine opens a return route; a second jump reaches a weapon above an earlier room; the phase beam creates a cross-region loop; the mantle makes the final descent and return safe. Health tanks and witness records reward revisiting branches. Previously inaccessible seals are marked on the map.

## World fields and critical route

| Region | Six rooms | Main route and return opportunity |
| --- | --- | --- |
| Tideglass Ruins | Surface Beacon, Broken Causeway, Drowned Gallery, Resonance Vault, Shellkeeper Crypt, Drainworks | Beacon → Causeway → Lens → return to Causeway → Crypt → folded Drainworks. Drowned Gallery is an optional early branch. |
| Verdant Underworks | Root Sanctuary, Spore Canopy, Pulse Nursery, Underroot, Matron Nest, Seeker Grotto | Sanctuary → Canopy → mine cache → return to Canopy → bomb seal → Matron. Underroot and Seeker Grotto add rewards. |
| Choir Archives | Choir Sanctuary, Frozen Stacks, Observatory, Memory Well, Ray Reliquary, Echo Chamber | Wing lift → sanctuary → Memory Well → Ray. Frozen Stacks gives Frost; Echo Chamber reconnects to Drowned Gallery after Phase. |
| Cinder Engine | Engine Sanctuary, Cooling Spine, Ash Conduit, Pressure Gallery, Furnace Crown, Thermal Sump | Phase seal → spine → pressure gallery → Furnace Eel → protected sump. Ash Conduit becomes a return loop after the mantle. |
| Living Heart | Heart Sanctuary, Witness Garden, Nerve Bridge, Chorus Vestibule, Custodian Chamber, Severance Console | Protected descent → bridge/vestibule → final guardian → console → playable escape via opened return routes to Surface Beacon. |

The world map uses room locations and explicit connections. Unknown neighboring rooms appear as silhouettes. Activated sanctuaries become travel anchors; travel is disabled during the escape. The Phase shortcut gives a much shorter return to the surface than reversing the entire expedition.

## Controls and feel

Move with Left/Right or A/D; jump with Space/Z, press again in the air after Wing; hold Up/W to aim upward; tap X/J to fire, hold then release for a charged shot after Lens; Down/S toggles Spindle, Fire in Spindle drops a mine after acquisition. E interacts with a nearby pod, lift, record or relic; Q cycles acquired weapons. Tab opens map/journal. R returns to the sanctuary; M toggles sound; Escape/? pauses.

Mobile now uses the shared analog joystick: left/right moves, Up aims and unfolds, and Down folds. Four actions stack vertically: Fire, Jump, context-sensitive Use/Weapon, Map. All abilities are usable without a keyboard. The current interaction label describes what Use will do.

Fixed-step physics includes acceleration, coyote time, buffered jumps, variable jump height, one-way ledges, solid ceilings, safe form changes and forgiving contact boxes. Damage grants a brief recovery window. Death keeps discoveries and resumes at a sanctuary. Fall recovery subtracts health and returns to safe footing. Four weapon styles and their energy costs support different approaches; basic pulses and mines remain available without exhausting a mandatory progression resource.

## Challenge and enemies

The first region teaches through low-risk patrols and readable guardian tells. The Underworks introduces spores and low passages. Archives add aerial patterns and vertical navigation. Cinder combines heat, aiming and positioning without narrow precision jumps. The Heart combines the learned mechanics. Five distinct guardians have attacks, warnings, recovery windows and stronger low-health phases. Exploration upgrades provide recovery margin; no optional collectible is required for the ending.

## Implementation and verification plan

Use a self-contained Canvas simulation with separate authored world, story and art modules, HTML overlays, local saves and synthesized sound. Build the complete route and ending first. Verify every gate before/after its ability, movement through authored rooms, all five guardian fights using real projectile damage, secrets, saves, death/restart, map/travel and both ending choices. Play-test desktop and required mobile sizes, including capture/cancel and fullscreen refusal. Then complete two fresh improvement passes over gameplay and presentation. The final art pass emphasizes curved diver armor, distinct creatures, layered caverns, living machinery, animated water and readable lighting, with cached artwork and measured performance.

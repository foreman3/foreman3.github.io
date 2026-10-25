# Marble Circuit: the seven-course elevation redesign

Planned before implementation, 2026-10-25. This revises the existing game, preserving its glass-marble identity, checkpoint recovery, unlimited brake, keyboard/touch controls and seven-course progression.

## Shared play language

An angled orthographic view shows the tops and sides of terrain. A close, smooth follow camera scrolls through a larger world and leads motion slightly. Screen-relative steering makes Up move toward the top of the screen on flat ground. Ramps accelerate the marble downhill; braking controls the descent. Surfaces have actual height: overpasses do not join lower roads, and falling onto a lower deck can save the marble.

Each section offers a wide, longer scenic route and a more demanding express route. Both visit the same three checkpoint islands. Signs distinguish routes; a minimap preserves orientation while the camera scrolls. Shortcuts save distance/time through thinner bridges, elevated rails, timed hazards or launchers. Checkpoints retain progress after a fall, acid loss or crusher hit. Levels 1–5 keep five marbles; level 6 is mastery, 7 near perfection, as requested in the original seven-level contract.

Enemies are moving rival marbles with physical bump impulses, rather than stationary dots. Acid bubbles and hatching make its footprint visible; brief contact warns before dissolving the marble. Rails guide lateral motion but retain speed/braking and require a controlled exit. Cannons automatically capture a marble rolled into their marked loading socket, wind up, then fire a real ballistic arc toward a marked landing island. Conveyors change momentum; crushers telegraph before occupying their lane. All major mechanics appear by course 5.

## The seven designs

| Course | Spatial idea | Wide route | Express choice | New demand |
| --- | --- | --- | --- | --- |
| 1 Sunlit Steps | Warm plaster terraces descend toward a finish pavilion | Broad landings and gentle ramps | Direct bridges across the terrace courtyards | Momentum, downhill braking, choosing a fork; forgiving opening |
| 2 Verdigris Foundry | Mint-and-copper basins with raised dry ridges | Balconies around acid and rival patrols | Narrow central ridges with shorter approaches | Acid exposure and moving rivals; modest escalation |
| 3 Ribbon Railway | Blue railway ribbons curl above lower plazas | Connected lower stair ramps | Guided elevated rails and a spiral descent | Carrying speed through rails and braking before exits |
| 4 Sky Cannon | Honey-colored islands separated by deep open space | Long connecting ramp bridges | Clearly marked cannon hops between islands | Loading, flight, landing and choosing a shortcut |
| 5 Clockwork Cascades | Rose-and-slate machine terraces descend in successive folds | Room to avoid acid and time machinery | Rail/cannon lines with awkward exit hazards | Directional conveyors and warned crushers; all systems combined with recovery margin |
| 6 The Undercut | Elevated roads cross lower recovery decks | Lower decks can catch some missed upper turns | Faster high routes, rail transfers and cannons | Sustained placement and timing; first mastery benchmark |
| 7 Marble Citadel | Lavender fortress falls through several height bands | Multiple outer routes remain physically traversable | Inner rails, guarded bridges and cannon connections | Near-perfect routing and momentum management across the complete vocabulary |

## Verification intent

Exercise every course and both route families in the browser, including actual ramp forces, height-separated crossings, lower-deck landings, acid exposure/cooling, moving enemy collisions, rail riding, cannon capture/flight/landing, conveyor resistance and crusher warnings. Test a course-5 recovery run and later mastery routes. Record failures and limits instead of equating an exact-state controller with human enjoyment. Inspect close camera framing, objective guidance, desktop and all required touch viewports. Keep shared files and other games intact; regenerate the repository-required offline inventory after gameplay changes.

# Bramble Guard — release verification, 2026-10-22

Bramble Guard is an original Pooyan-style balloon archery game: steer a fox's
cable lift vertically, lead falling wolf balloons, intercept thrown stones, and
use a limited horn to freeze the raid and open shields. Watch goals, the finite
raid, pantry baskets, incoming count, and fast retries make success and failure
explicit. One self-contained game directory; registered under In Work.

## Curve

The scheduled request supersedes the older level-5 mastery language in the
repository: 5 must retain recovery margin; 6 is the first mastery test; 7 asks
for near perfection. Every major mechanic is introduced by 5.

| Watch | Raid / pop goal | Descent speed | Base arrival interval | Baskets / horns | New pressure |
|---|---:|---:|---:|---:|---|
| 1 | 8 / 5 | 38 | 1.65 s | 6 / 2 | Varied launch heights; no hostile stones |
| 2 | 12 / 8 | 43 | 1.40 s | 6 / 2 | Warned, interceptable aimed stones |
| 3 | 16 / 11 | 48 | 1.20 s | 6 / 2 | Every third balloon has a timed shield |
| 4 | 20 / 15 | 54 | 1.04 s | 6 / 2 | Alternating vertical wind bends arrows; lateral drift |
| 5 | 26 / 21 | 60 | .91 s | 6 / 2 | Patched two-hit balloons; staggered double arrivals |
| 6 | 30 / 27 | 78 | .72 s | 4 / 1 | More shields, patches and stones; shorter recovery budget |
| 7 | 36 / 35 | 86 | .70 s | 3 / 0 | Faster combined raid, stronger wind, one allowed escape |

Speeds are logical units per second. A staggered arrival uses .31 seconds in
place of the normal interval after each fourth arrival in 5, third in 6/7.
Patched balloons are every fourth in 5 and every third in 6/7 unless that
arrival is shielded. The deterministic pattern creates repeatable practice.
All arrivals have a .65-second warning/hold before descent. Player speed is
345 units/s; arrows travel at 760 units/s with .28-second reload. Balloons have
a forgiving 29-unit vertical hit window. Two seconds of stone protection
follows damage; escapes still cost baskets. Horns hold visible wolves for three
seconds and clear stones. Pantry and horns refill between watches. Retry rolls
score back to the watch-entry bank.

## Observed play traces

Chrome ran the real simulation at 120 Hz under input-only policies using
test-only exact state. These are optimistic mechanical feasibility checks,
not human reaction-time, enjoyment, or physical-device measurements.

The ordinary .22-second decision policy cleared 1–5 in 13.07 / 17.12 / 19.81 /
21.38 / 21.88 simulated seconds with 6 / 6 / 5 / 6 / 6 baskets. It failed 6 and
7. The slower .45-second policy cleared 1–3 (watch 3 retained two baskets) and
failed 4–7. The faster .065-second policy cleared all seven; 6 took 19.17 seconds
with four baskets and its horn spent; 7 took 23.32 seconds with 36/36 pops, three
baskets and no horn. Timing is not monotonic because target selection, shield
cycles and arrow interception differ between deterministic watches.

Watch 5's recovery trial deliberately withheld all movement, shots and horns
for eight seconds. Two wolves actually escaped and a thrown stone actually hit
the lift. Normal play actions then cleared 24/26 balloons in 22.25 simulated
seconds with three baskets remaining, both horns used, and one stone
intercepted. No hits, damage, enemies or score were injected in this trial.

A separate normal-page check replayed real Chrome keyboard events through
browser virtual time without any game test API. The complete opening cleared
8/8, no escapes, six baskets and score 1400; native Enter advanced to watch 2.
Human feedback on aiming feel, pressure and later watches remains useful.

## Iteration

The functional baseline covered all seven configurations and an initial art
review. First additional review addressed top camping with varied launch
heights and arrival warnings, tuned an achievable final watch, and fixed a
shared-style conflict that put portrait controls over the game. Full desktop,
mobile, endings and gameplay tests then passed.

The second independent review sharpened desktop actors, added cached meadow
flowers/contour detail and low-balloon warning chevrons, enlarged mobile text,
added a goal-secured message, and ended mathematically unwinnable raids promptly
with a reason. Pop goals now match the available escape margin. Reduced-motion
users receive smaller decorative bursts. Final review added result-dialog Tab
wrapping and live slider accessibility values. Both full regression and the
normal-page opening were repeated after these changes.

## Coverage and reproduction

Set `NODE_PATH` to an installation containing Playwright, then:

```powershell
node bramble-guard/serve.cjs
# In another terminal:
$env:BRAMBLE_PHASE='final'
node bramble-guard/verify.cjs
node bramble-guard/normal.cjs
```

Chrome is expected at `C:/Program Files/Google/Chrome/Application/chrome.exe`.
`BRAMBLE_OUT` overrides the output directory; `BRAMBLE_URL` selects another
origin (the normal-page check rehearses against the local test server).
`tune.cjs` retains comparative final-watch/recovery probes. Test hooks exist
only when explicitly loading `?test=1`; the ordinary URL exposes none.

Verified first-session instruction freeze, session return and mobile launch,
fullscreen refusal, actual keyboard movement and held shooting, two-finger CDP
touch sliding plus shooting, upward slide, release/cancel, context-menu
suppression, horn, pause/resume, help freeze, sound, blur, shared mobile Reset,
scoring and stone interception, real stone collisions and escapes, shield horn
opening, two-hit patches, wind, progression, retry bank, result controls, loss
and final-victory restart. Short instructions scroll and their start button is
reachable. Active canvases keep their 8:5 aspect; controls stay outside them.

Visually inspected 1440×900 desktop, 667×375, 740×390, 844×390 mobile landscape,
and 390×844 portrait. Required layout geometry assertions passed without
horizontal overflow or playfield/control overlap. Game console/page error logs
were empty. The In Work card appears once, navigates correctly, and the arcade
page has no script errors. External root-page font resources are outside the
new game's self-contained assets.

Pass-two active-play frame samples (180 frames after warmup) averaged 16.66 ms
on desktop and 16.67 ms on touch emulation, both p95 17.0 ms. Static scenery is
cached once; desktop backing is 2×, touch backing 1×; particles are capped at
100; delta-time catch-up is capped; blocked scenes do not redraw. These browser
measurements do not establish physical-phone performance.

Final reports, viewport captures and the active watch-5 screenshot are at
`C:/Users/forem/.codex/visualizations/2026/10/22/01a16234-a586-75d1-8927-15ad0393ee66/`.
The screenshot is `bramble-guard-gameplay.png` and shows ordinary simulated
play after the recovery delay, rather than a fabricated scene.

## Scope and offline inventory exception

Only `bramble-guard/`, `Games.md` and `index.html` are intended release files.
No existing game or shared runtime was changed. Initial fetch matched main;
fetch/compare is repeated before committing and publishing without force.

The explicit user scope forbids modifying `offline-assets.js`, overriding the
newer standards' regeneration instruction. The read-only offline check reports
the inventory stale (52 games, 285 files); it was intentionally left untouched.
This release is available online but is not guaranteed in an already installed
arcade's offline cache until a separately authorized inventory regeneration.

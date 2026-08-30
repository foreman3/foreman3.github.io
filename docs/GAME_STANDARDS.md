# VibeCade Game Standards

This document is the authoritative implementation and release standard for VibeCade games. `AGENTS.md` contains repository-level guardrails; this document contains the detailed game requirements. If a user gives an explicit conflicting instruction, follow the user while preserving repository safety.

## 1. Product Goal

Create polished, recognizable arcade experiences that are immediately understandable, visually distinctive, responsive, and fun to replay. Each game should feel designed for its source concept rather than reskinned from a generic neon template.

A new game should:

- teach through its opening play rather than several slow tutorial levels;
- become meaningfully demanding by level, wave, stage, or phase 3 or 4;
- reward mastery through scoring, timing, positioning, routes, combos, resources, or risk;
- provide clear feedback for success, danger, damage, scoring, transitions, and game over;
- restart quickly without requiring a page reload unless the game architecture genuinely needs one.

## 2. Repository and Scope

- A game lives in one root directory named with a lowercase kebab-case slug: `/<game-slug>/index.html`.
- Keep its JavaScript, styles, SVG, raster artwork, audio, and other assets inside that directory unless an existing shared facility is the correct home.
- `Games.md` is the canonical list of games and links.
- `index.html` is the main arcade menu. New games enter the **In Work** section unless the user specifies another status.
- A one-game creation task creates exactly one game directory.
- Do not modify another game's files or directory during a new-game task.
- Outside the new directory, change only the registration files required by the task—normally `Games.md` and `index.html`.
- Preserve unrelated working-tree changes and stage only intended files.
- Standalone root demos are not arcade entries.

Before selecting a concept, inspect `Games.md`, `index.html`, root game directories, recent Git history, and automation memory when supplied. The concept must not duplicate an existing game under another name. Across runs, vary genre, control model, pacing, and art direction.

## 3. Architecture Choice

Choose the rendering model from the game rather than habit.

### Canvas

Prefer Canvas when the game has many moving actors, tile or terrain rendering, particles, projectiles, screen shake, dynamic lighting, or frequent full-scene changes. Canvas usually gives the simplest stable frame budget for dense action.

Good reference: `deep-core/` uses a Canvas world and rasterizes reusable SVG actor artwork on mobile.

### DOM and SVG

Prefer DOM-SVG when the scene is structured, illustration-heavy, and composed of a modest number of independently positioned actors. It is useful for crisp lanes, signs, characters, and UI-like stage layouts.

Good reference: `soda-shift/` uses an SVG diner and independent patrons, glasses, and feedback elements.

DOM-SVG is not free. Avoid updating many attributes every display frame, using filters on numerous moving elements, or creating large quantities of short-lived nodes.

### Hybrid

Use a hybrid when static illustration benefits from SVG authoring but repeated rendering is performance-sensitive. Pre-render static or reusable SVG layers into bitmap canvases or sprites, keep gameplay in Canvas, and use HTML for HUD and modal UI.

Prefer inline or local assets. Do not introduce a network dependency when a self-contained implementation is practical.

## 4. Desktop Arcade UX

- Use the shared flyout navigation conventions; do not add a fixed desktop sidebar.
- Maximize the playfield while preserving its intended aspect ratio and readable HUD.
- Provide keyboard controls appropriate to the concept. Arrow keys and familiar alternates such as WASD or Space are preferred when they fit.
- Prevent browser scrolling for gameplay keys.
- Give the playfield an accessible label and useful focus behavior.
- If instructions exist, show a session-scoped modal on the first load in that browser tab session.
- Gameplay, timers, enemies, and audio must remain paused until instructions are dismissed.
- Provide a translucent desktop-only `?` button that pauses and reopens instructions.
- Restart and sound controls should follow existing conventions, normally `R` and `M` when applicable.

## 5. Mobile UX and Controls

Mobile play must never require a keyboard.

### Shared behavior

- Load the shared flyout and `mobile-fullscreen.js` behavior instead of recreating device detection, fullscreen entry, context-menu suppression, and joystick mechanics.
- Touch UI is conditional on viewport size and must not appear or reserve space on desktop.
- Hide desktop navigation and the desktop `?` button on mobile.
- Enter fullscreen after an eligible user gesture when the browser supports it; handle refusal without blocking play.
- Prevent touch callouts, selection, unintended dragging, and browser gestures on gameplay controls.
- Hide gameplay controls while the instructions modal is visible.

### Joysticks

Use `window.VibeCadeJoystick` for continuous directional input:

- `analog` for free angular movement;
- `cardinal` for four-way maze, digging, and grid movement;
- `horizontal` for paddle, ship, racing, or balance movement.

The shared joystick is currently 126 px with a minimum 24% neutral dead zone. A player must be able to hold, slide to a new direction, slide diagonally in analog games, and return to neutral without lifting the thumb. Pointer capture must prevent context menus or dropped movement when the thumb drifts.

In mobile landscape, the shared layout reserves a 136–150 px rail on each side and fits the playfield proportionally between them. The joystick belongs in the left rail. Actions belong in the right rail and stack vertically when there is more than one. Controls must not cover the playfield.

Reference implementations:

| Need | Reference |
| --- | --- |
| Cardinal digging movement | `deep-core/` |
| Free analog movement | `mushroom-moon/` |
| Horizontal movement plus one action | `space-invaders/` |
| Horizontal steering plus several actions | `pole/` |
| Analog movement plus several actions | `ultra-tanks/` |

### Buttons and direct manipulation

- Use pointer events and call `preventDefault()` where browser behavior would interfere.
- Provide a clear pressed state and an accessible label.
- Release held actions on `pointerup`, `pointercancel`, lost capture, and window blur.
- Size actions for thumbs without allowing them to consume the center playfield.
- If direct drag or tap-on-playfield control is more natural than a joystick, use it, but preserve the same non-overlap, callout suppression, and keyboard-free requirements.

## 6. Responsive Layout

- Design for desktop and mobile landscape deliberately; do not depend on incidental CSS shrinking.
- Preserve the playfield's logical aspect ratio unless the game intentionally uses a fluid world.
- Keep HUD text readable without covering hazards or objectives.
- Account for safe-area insets where controls touch screen edges.
- Portrait may use a purposeful layout or an orientation prompt, but it must not leave the user with an unusable keyboard-only state.
- Verify that instructions can scroll on short screens and that their dismiss button remains reachable.

Required visual test sizes for joystick games:

- 667 × 375 mobile landscape;
- 740 × 390 mobile landscape;
- 844 × 390 mobile landscape;
- 1440 × 900 desktop.

Add portrait coverage when the game claims portrait support.

## 7. Performance Standards

Gameplay state and visual presentation may run at different rates. Preserve responsive simulation even when reducing visual cost.

### General

- Use delta time or a fixed simulation step; cap accumulated catch-up work after a stalled frame.
- Avoid allocating large arrays, gradients, paths, or DOM nodes every frame.
- Pool or cap particles and transient effects.
- Preload and cache art before it is needed.
- Pause expensive work while instructions, help, or game-over overlays block play.
- Respect `prefers-reduced-motion` where animation is decorative.

### Canvas mobile profile

For graphically dense Canvas games, consider:

- a reduced backing resolution, commonly around 0.75 scale, while retaining logical coordinates;
- rasterized caches for repeatedly drawn SVG actors;
- smaller particle bursts;
- reduced shadow blur, glow, trail nodes, and layered gradients;
- cached static backgrounds when profiling shows they dominate rendering.

### DOM-SVG mobile profile

For DOM-SVG games, consider:

- keeping simulation at 60 Hz while applying visual DOM updates at 30 Hz;
- disabling expensive filters and backdrop filters on moving elements;
- hiding decorative glows that do not affect play;
- reducing particles and short-lived DOM elements;
- pre-rendering static scenery or repeated characters into bitmap layers.

Do not assume SVG is slow merely because it is SVG. The expensive cases are usually large node counts, repeated attribute writes, filters, blur, and layered compositing. Measure the actual game.

## 8. Gameplay Quality

The first segment should be easy enough to learn controls through play, but it must still contain meaningful decisions. Increase challenge quickly through enemy behavior, speed, density, timing windows, resource pressure, terrain, or combined mechanics.

Before release, tune:

- movement acceleration, turning, and stopping;
- hit boxes and collision forgiveness;
- fire rate, cooldowns, resource recovery, and invulnerability windows;
- scoring values, bonuses, combos, and risk/reward;
- wave length and transition timing;
- lives, checkpoints, and game-over flow;
- restart speed and clarity;
- audio and visual feedback without sensory overload.

Use deterministic query parameters or debug hooks when they make later-phase testing practical, but do not expose intrusive debug UI in normal play.

## 9. Accessibility

- Use semantic buttons for controls and modal actions.
- Give icon-only controls useful `aria-label` text.
- Ensure keyboard focus is visible on desktop and not trapped incorrectly.
- Maintain readable contrast for critical HUD and instructions.
- Do not communicate essential state through color alone.
- Keep instructions concise and state both desktop and mobile controls.
- Avoid autoplaying gameplay or audio before the user dismisses instructions.

## 10. Iterative Verification

Do not stop at the first functional draft. Repeat implementation, static checks, browser play, and visual inspection until another change would not materially improve playability, responsiveness, challenge, accessibility, or presentation.

At minimum:

1. Run syntax or parsing checks appropriate to the files changed.
2. Serve the repository locally rather than opening files directly.
3. Verify the first-load modal and that gameplay remains paused behind it.
4. Play the opening segment and confirm controls teach themselves.
5. Reach or jump to phase 3 or 4 and verify the intended challenge ramp.
6. Test keyboard controls, mobile controls, restart, pause/help, and sound behavior.
7. For joysticks, test hold, slide, diagonal input when applicable, return-to-neutral, release, and context-menu suppression.
8. Inspect desktop and required mobile viewport sizes.
9. Confirm mobile controls do not overlap the playfield and multi-action controls stack vertically.
10. Confirm the game and arcade link load without browser console errors.
11. Capture a clear active-gameplay screenshot for the completion report.

## 11. Registration and Release

- Add the new entry to `Games.md` in the correct section.
- Add one matching card to the **In Work** section of `index.html` unless instructed otherwise.
- Verify both links resolve to the new game.
- Before committing, fetch the configured remote and confirm the branch can be synchronized safely.
- Do not discard unrelated changes, rewrite history, or force-push.
- Stage only the new directory and intended registration files.
- Use a descriptive commit message and push only when the user or automation explicitly requests publishing.
- If synchronization or push is unsafe, stop and report the exact divergence or conflict.
- When the task requests email or another external notification, perform it only after a successful push. If the connection is unavailable, preserve the pushed work and report what permission or connector is needed.

## 12. Completion Checklist

- Exactly one new game concept, directory, and registration entry.
- No existing game files changed.
- Recognizable concept not already present.
- Distinct, concept-appropriate visual direction.
- Instructions gate the first play session.
- Desktop `?` help pauses and reopens instructions.
- Desktop keyboard play works.
- Mobile play needs no keyboard.
- Touch controls appear only on mobile and never cover the playfield.
- Fullscreen attempt is graceful.
- Early play is approachable; phase 3 or 4 is challenging.
- Scoring, collisions, restart, audio, and feedback are tuned.
- Mobile performance profile is appropriate to the renderer.
- Desktop and mobile browser checks pass without console errors.
- Active-gameplay screenshot captured.
- Only intended files staged, committed, and pushed when requested.

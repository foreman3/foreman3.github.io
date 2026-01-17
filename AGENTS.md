# Repository Guidance for Agents
This repository contains a collection of small arcade games. All ambiguous instructions should be interpreted as referring to these games and the arcade overall.

## Structure Overview
- `index.html` is the main arcade menu page.
- Each game lives in its own folder at the repo root, using `/<game-slug>/index.html`.
- Shared navigation is stored in `sidebar.html` and loaded by game pages.
- Shared art assets live in `images/`.
- Pinball assets (Phaser entry + scenes) live under `pinball/` alongside the pinball page.
- The canonical list of games and links is maintained in `Games.md`.

## UX Overhaul Status
- Goal: Desktop uses a flyout arcade menu (no fixed sidebar) and maximized playfields; mobile hides all menus and uses translucent thumb controls.
- Completed (first 6): `arkanoid/`, `asteroids/`, `drop-game/`, `burger/`, `flappy/`, `missile-command/`.
- Remaining: all other game folders still need the same desktop flyout + mobile thumb controls treatment.

## UI Standards
- Games with instructions should show a session-scoped modal the first time the game loads; gameplay starts only after dismiss.
- Desktop-only translucent `?` button pauses gameplay and reopens the instructions modal.

## Non-game Pages
- Standalone demos (such as `embedding.html` and `simple.html`) remain at the repo root and are not part of the arcade menu.



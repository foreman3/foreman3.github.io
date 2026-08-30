# Repository Guidance for Agents

This repository is the VibeCade collection of small browser arcade games. Interpret ambiguous repository requests as referring to the games and arcade unless the user says otherwise.

## Required References

- For any work that creates a game or changes arcade gameplay, controls, layout, registration, testing, or release behavior, read [`docs/GAME_STANDARDS.md`](docs/GAME_STANDARDS.md) completely before editing.
- For end-to-end creation of a new game, use the `vibecade-game-builder` skill when it is available. Its version-controlled source is [`skills/vibecade-game-builder/SKILL.md`](skills/vibecade-game-builder/SKILL.md).
- `Games.md` is the canonical game list. `index.html` is the main arcade page.

## Repository Structure

- Each game lives at `/<game-slug>/index.html`; local assets stay inside that game directory.
- Shared navigation is in `sidebar.html`, `sidebar.css`, `flyout.js`, and `flyout.css`.
- Shared mobile behavior is in `mobile-fullscreen.js`.
- Shared arcade artwork is in `images/`.
- Pinball keeps its Phaser entry, scenes, and assets under `pinball/`.
- Root files such as `embedding.html` and `simple.html` are standalone demos, not arcade games.

## Guardrails

- Preserve unrelated user changes and never discard or overwrite work merely to simplify a task.
- Do not change an existing game's files while creating a new game unless the user explicitly expands the scope.
- Outside a new game directory, game-creation work may change only the canonical registration files required by the task.
- `boxing/` and `scorched-earth/` are intentionally held for separate overhaul work.
- Do not force-push, rewrite shared history, or commit unrelated files.

## Current UX Direction

- Desktop uses the flyout arcade menu and maximized playfields rather than a fixed sidebar.
- Mobile hides arcade navigation and desktop help controls, enters fullscreen from a user gesture when supported, and provides touch-native controls that do not require a keyboard.
- Instructions are session-scoped. Gameplay must not begin until the first-load instructions are dismissed.
- A translucent desktop-only `?` button pauses gameplay and reopens instructions.


---
name: vibecade-game-builder
description: Create exactly one new classic arcade-style game in the VibeCade repository, including concept selection, implementation, responsive controls, browser play-testing, registration, and requested release steps. Use for new VibeCade games, not ordinary fixes to existing games.
---

# VibeCade Game Builder

Build one polished game while protecting the existing arcade.

## Load the Repository Contract

From the VibeCade repository root, read these files completely before choosing or editing:

1. `AGENTS.md`
2. `docs/GAME_STANDARDS.md`
3. `Games.md`
4. the relevant sections of `index.html`

Inspect existing root game directories and recent Git history. When automation memory is provided, use it to avoid repeating the last run's genre, mechanic, and visual theme. Treat the repository standards as authoritative for implementation details and testing; do not duplicate or weaken them here.

If the current workspace is not the VibeCade repository or the standards file is missing, stop and identify the missing prerequisite rather than inventing a different project structure.

## Select One Game

- Choose exactly one recognizable classic arcade concept that is absent from `Games.md`, `index.html`, and existing directories.
- Vary genre, pacing, control model, and art direction across runs.
- Choose a concept-appropriate theme. Do not default to neon presentation.
- Decide Canvas, DOM-SVG, or a hybrid from the scene and performance characteristics described in the standards.

## Preserve Scope

- Create one new game directory and keep its implementation and assets self-contained.
- Do not edit any existing game's files or directory.
- Outside the new directory, change only the canonical registration files required by the task.
- Preserve unrelated worktree changes and never stage them.
- Treat publishing, email, and other external actions as authorized only when the user or automation explicitly requests them.

## Build and Improve

Implement a complete playable loop, not a visual prototype. Make the opening teach through play and tune a five-step mastery curve: level 1 is a forgiving introduction; levels 2 and 3 become progressively harder but remain reasonably accomplishable; level 4 is demanding but clearable by a strong player without near-perfect execution; and level 5 is the first mastery or perfection benchmark. Do not stack several major speed, density, precision, or mechanic jumps into levels 2 or 3. Challenge may continue escalating after level 5.

Follow `docs/GAME_STANDARDS.md` for:

- desktop flyout, instruction modal, help, restart, and sound behavior;
- touch-only mobile UI, fullscreen, joystick modes, side rails, and vertical action stacks;
- renderer selection and mobile performance profiles;
- artwork, feedback, accessibility, difficulty, and responsive layout;
- registration, screenshots, Git safety, and release verification.

Treat the first complete, functional version as the starting point, not the finish. Iterate through implementation, the smallest relevant static checks, local browser play, and desktop/mobile visual inspection. Fix observed defects and retest. Exercise both the easy opening and later challenge rather than validating only the title screen.

After that initial version works end to end, complete two additional whole-game improvement passes before release. Do not collapse routine implementation fixes into these passes or count the initial build as one of them. In each pass:

1. Replay or inspect the entire experience, including the opening, later challenge, game-over and restart flow, desktop presentation, and required mobile layouts.
2. Look independently for further improvements to both graphics and gameplay: artwork, animation, effects, readability, feedback, layout, controls, feel, balance, pacing, collision fairness, scoring, and progression as applicable.
3. Implement every safe, material improvement found within the task scope, then repeat the relevant static, browser-play, and visual checks.

The second pass must be a fresh review of the result from the first pass, not merely confirmation that the first pass worked. If a pass finds no worthwhile change in either graphics or gameplay, document what was examined and why another change would not materially improve the game; do not invent churn to satisfy the pass count.

## Verify Scope and Release

Before publishing, confirm:

- no existing game file changed;
- the new game and arcade card load without console errors;
- instructions gate gameplay;
- keyboard and touch controls, pause/help, restart, and progression work;
- mobile controls do not overlap the playfield or require a keyboard;
- levels 2 and 3 rise progressively without an abrupt difficulty wall;
- level 4 leaves a strong player meaningful miss or recovery margin;
- level 5 reaches the intended mastery-grade challenge;
- an active-gameplay screenshot is saved for the report.

Fetch and compare the remote before committing. If synchronization is safe and publishing was requested, stage only the new directory and registration files, commit descriptively, and push without rewriting history. If it is unsafe, stop with the exact blocker.

Perform requested notifications only after a successful push. Report the game name, gameplay loop, difficulty ramp, commit or branch, verification performed, screenshot, and any notification failure.

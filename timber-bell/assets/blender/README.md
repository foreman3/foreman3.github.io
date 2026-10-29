# Timber Bell miniature models and sprites

The lumberjack, plaid coat, hands, boots, beard, cap, articulated axe, bark segments, knots, bell emblem, fir branch and stump are editable Blender geometry. They were authored through the configured Blender MCP server in a separate factory-startup Blender 5.2.3 LTS process. The scene uses local procedural materials, an orthographic camera and studio lights; it has no external image dependencies. The `.blend` opens with the lumberjack visible; enable the other named collections in the Outliner to inspect the individual models.

The game uses a single `../timber-sprites.webp` lossless transparent atlas, not a browser 3D engine. It contains five consistent-camera axe-swing frames, plain/knot/cracked/bell logs, a right-facing branch (mirrored at runtime), and the stump. Canvas-drawn target brackets, knot labels, particles and HUD stay crisp above the sprites. The original procedural art remains a fallback if the atlas cannot load; loading it never restarts or advances the simulation.

## Files

- `timber-bell-miniatures.blend`: editable 168-object source scene, materials, camera, lights and axe pivot.
- `build_models.py`: repeatable Blender scene and model authoring script. It clears the **current scene**, so execute it only in an isolated Blender instance.
- `render_sprites.py`: reproducible transparent Cycles render script. It works in the saved Blender file or after the build script and restores collection render visibility after exporting. Set `TIMBER_RENDER_DIR` in Blender's environment to choose an output directory.
- `pack_sprites.py`: Pillow atlas packer; checks all eleven 256×256 RGBA renders for nonempty, unclipped alpha and verifies an exact lossless decode. Pass the rendered image directory as its first argument. `atlas.json` records source cells and alpha bounds; if those bounds change, update the matching constants in `../../art.js`.
- `bridge.py` and `mcp_client.py`: local MCP helpers for this installation. Start the bridge in a separate background Blender, then run the client with either build, render or inspect script as its argument. `TIMBER_MCP_RUNTIME` may point at a Python environment containing the official MCP client; the configured server source is at `C:/mcp/blender_mcp/mcp`. These helpers do not enable an add-on globally or change user preferences.
- `inspect_source.py`: opens the saved file in the isolated scene, checks the models and missing dependencies, and renders a source round trip.

`../../verify-sprites.cjs` checks actual browser atlas decoding, distinct branch/knot/bell/axe frames, delayed image loading without state changes and the procedural fallback. `../../verify.cjs` runs the full game regression.

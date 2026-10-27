# Marble Circuit miniatures

Authored using the configured local **Blender MCP** server: actual MCP initialization, tool discovery, scene inspection and `execute_blender_code` calls into an isolated background Blender 5.2.3 LTS instance. The separate localhost bridge leaves other Blender scenes and global preferences intact.

The style is a small mechanical toy world: aquamarine glass with an ivory/cobalt cat-eye core, riveted gunmetal rivals, copper and brass cannons, porcelain checkpoint lanterns, chartreuse acid basins and cut citrine bonuses. Studio reflections stay fixed while the marble's interior turns.

## Files

- `marble-miniatures.blend`: editable meshes, curves, materials, rigs, orthographic camera and studio lights. Opens on the cannon; enable another named model collection in the Outliner to inspect it. There are 58 model parts in the asset scene.
- `miniatures.webp`: one lossless RGBA runtime sheet containing 22 views, packed without rescaling: eight marble frames, one rival, eight cannon headings, three beacon states, acid and gem.
- `atlas.json`: source rectangles, measured contact anchors and beacon label positions. Cannon heading vectors are checked against the game's projection.
- `build_assets.py`: reproducible Blender authoring and Cycles export recipe. Execute through Blender MCP, then call `bpy.app.driver_namespace['marble_asset_workshop']['render_batch'](0,22)` through MCP. Override `ASSET_OUTPUT` and `RENDER_OUTPUT` before executing to choose output folders.
- `pack_assets.py`: Pillow packing and verification; takes the render folder and optional output folder. Checks alpha, image dimensions, clipping, cannon direction and exact lossless decode. It also writes an asset review sheet beside the temporary renders.
- `verify-assets.json`: measured export results, excluded from the arcade's offline runtime inventory by its verification-file convention.

The sprite camera matches the terrain's horizontal projection ratio. Cannon export swaps the model's X/Y heading because Blender's camera-right vector faces the opposite way from the game's X axis; rotating a flat image would give incorrect barrels and lighting. All eight exported ground direction vectors must agree with `MarbleRules.project` to a normalized dot product above 0.999.

Only the sheet and its small metadata file load in the browser. Rendering remains Canvas 2D, with cached terrain and the existing physics, collisions, routes and controls. A single cached preload updates the artwork without resetting the camera or simulation. The original procedural artwork remains available if an asset cannot load. Beacon numbers/checkmarks, acid warnings and landing targets remain drawn sharply by the game. The editable source and authoring tools are not loaded during play.

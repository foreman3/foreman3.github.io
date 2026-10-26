# Steamline Municipal Boiler

Created through the configured **Blender MCP server**, using actual MCP initialization, tool discovery, scene inspection and execute_blender_code calls. Blender 5.2.3 LTS, Cycles CPU renders. The approved asset is now the workshop's live flow/heat instrument.

## Deliverables

- `steamline-boiler.blend`: compressed editable source with106 mesh/text/curve parts, materials, studio/camera, and separately named valve-wheel/pressure-needle animation controls. Frame1 is idle; frame40 is active.
- `steamline-boiler.glb`: self-contained optimized glTF2 binary,26,833 triangles,3 meshes,12 material primitives, approximately1.03MiB. Contains **Open valve** and **Raise pressure** clips. No external textures, default cube, lights or camera.
- `boiler.png`:512×512 transparent active sprite, approximately195KiB.
- `boiler-idle.png`:512×512 transparent idle sprite with low gauge and dimmed lights.
- `ui-body.png`, `ui-hot.png`, `ui-wheel.png`, `ui-needle.png`: four aligned 512×512 transparent front-camera layers used by the game, 530,669 bytes total. Only these four images load during gameplay. The body light crossfades, the wheel rotates and the needle follows the real visited square's remaining heat. No WebGL or glTF runtime is loaded.
- `export_ui.py`: reproducible Blender MCP layer export from the editable source, with a front orthographic camera so CSS rotation matches the original 3D pivots. Does not overwrite the source scene. `ui-layers.json` records measured pivot positions, gauge range and file sizes.
- `asset-info.json` and `verification.json`: measured export metadata and GLB round-trip validation.
- `create_boiler.py`, `finish_boiler.py`, `verify_boiler.py`: reproducible authoring, optimization/rigging and round-trip inspection, executed through Blender MCP in that order.

The burgundy enamel vessel, satin brass bands, porcelain gauge, five-spoke wheel, two flanged pipe connections, mint ready lamp and amber heat window match Steamline's workshop palette. The prop lives in the desktop rack, moves into the side margin on short/wide screens, and sits beneath the portrait controls. Existing tiny puzzle icons retain their simpler artwork for legibility.

The boiler is feedback, not an additional pressure or timing rule. Idle closes the valve; testing turns the wheel, lights the body and emits three small steam puffs. Help, the ledger, blur and pause freeze the animation; failed tests drop the gauge to idle while preserving the board. Successful delivery holds the warm boiler. For contracts 36–50 the gauge and numeric caption track remaining heat, including heater refills and radiator consumption; earlier contracts label it as a flow indicator. Reduced motion removes rotation, steam and needle transitions while retaining state and heat text.

## Validation and scope

The first export exposed a selected default cube from Blender's other scene and an incorrect parent pivot. The final exporter restricts itself to the asset scene. Source wheel centre is asserted stationary at both animation extremes, and export meshes bake rest transforms before independently keyed pivots. Text/curve detail is simplified only in export copies; editable source and rendered sprites retain their detail.

Validation checks GLB headers/length, three meshes, two animation clips, embedded buffers, no external image references, finite/bounded vertices and nonempty geometry. The GLB is imported into a fresh Blender scene and rendered for visual inspection. Both sprite states are visually inspected and their dimensions/alpha verified.

Product render: `C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/steamline-boiler-preview.png`.

The configured `uv` launcher was absent from this session's PATH. The existing server source at `C:/mcp/blender_mcp/mcp` was launched using an official Python MCP client and isolated dependencies in the task's visualization directory. A separate background Blender ran the repository's own MCP bridge. No global add-on/preferences/configuration or unrelated scene was changed. Game integration and its responsive/heat/animation checks are documented in `../../VERIFICATION.md` and exercised by `../../verify-boiler.cjs` (paths relative to this directory).

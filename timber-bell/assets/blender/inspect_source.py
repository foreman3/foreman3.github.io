"""Reopen and render the delivered .blend in the isolated Blender MCP scene."""
import bpy
from pathlib import Path
source=Path('C:/Users/forem/Documents/Codex/vibe-cade/timber-bell/assets/blender/timber-bell-miniatures.blend')
bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.context.scene
collections=[c.name for c in bpy.data.collections if c.name[:2] in ('01','02','03','04')]
assert len(collections)==4 and 'Axe swing pivot' in bpy.data.objects
assert len(bpy.data.objects)==168
missing=[image.filepath for image in bpy.data.images if image.source=='FILE' and image.filepath and not Path(bpy.path.abspath(image.filepath)).exists()]
assert not missing,missing
target='C:/Users/forem/.codex/visualizations/2026/10/29/01a1863c-6fa1-7740-a3ac-ba222254f8ea/timber-3d/source-roundtrip.png'
Path(target).parent.mkdir(parents=True,exist_ok=True);scene.render.filepath=target;bpy.ops.render.render(write_still=True)
result={'source':str(source),'objects':len(bpy.data.objects),'collections':collections,'missing_files':missing,'render':target}

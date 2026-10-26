"""Blender MCP round-trip check of the actual exported GLB, in a fresh scene."""
import bpy, json, struct
from pathlib import Path
OUT=Path('C:/Users/forem/Documents/Codex/vibe-cade/steamline/assets/boiler')
source=bpy.data.scenes['Steamline · Municipal Boiler']
blob=(OUT/'steamline-boiler.glb').read_bytes()
assert blob[:4]==b'glTF' and struct.unpack_from('<I',blob,4)[0]==2
assert struct.unpack_from('<I',blob,8)[0]==len(blob)
size=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+size])
assert len(gltf['meshes'])==3 and len(gltf['animations'])==2
assert all('uri' not in buffer for buffer in gltf['buffers'])
assert not gltf.get('images')
scene=bpy.data.scenes.new('Boiler · exported GLB check')
bpy.context.window.scene=scene
bpy.ops.import_scene.gltf(filepath=str(OUT/'steamline-boiler.glb'))
meshes=[o for o in scene.objects if o.type=='MESH']
assert len(meshes)==3
for obj in meshes:
    assert len(obj.data.polygons)>0
    assert all(all(abs(v)<100 for v in vert.co) for vert in obj.data.vertices)
# Copies of the same studio lights/camera provide a meaningful visual comparison.
for original in source.objects:
    if original.type in {'LIGHT','CAMERA'} or original.name.startswith('Studio ground'):
        duplicate=original.copy()
        duplicate.data=original.data.copy()
        scene.collection.objects.link(duplicate)
        duplicate.matrix_world=original.matrix_world.copy()
        if duplicate.type=='CAMERA':scene.camera=duplicate
scene.world=source.world
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.view_settings.view_transform='AgX'
scene.render.resolution_x=768;scene.render.resolution_y=768;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath='C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/steamline-boiler-glb-check.png'
bpy.ops.render.render(write_still=True,scene=scene.name)
result={'round_trip_meshes':len(meshes),'mesh_names':[o.name for o in meshes],'animation_clips':[a['name'] for a in gltf['animations']],'self_contained':True,'preview':scene.render.filepath}
(OUT/'verification.json').write_text(json.dumps(result,indent=2),encoding='utf8')
bpy.context.window.scene=source

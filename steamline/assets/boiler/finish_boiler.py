"""Final Blender MCP pass: correct pivots, compact glTF, two verified sprite states."""
import bpy, math, json, struct
from pathlib import Path
from mathutils import Vector, Matrix
OUT=Path('C:/Users/forem/Documents/Codex/vibe-cade/steamline/assets/boiler')
PREVIEW='C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/steamline-boiler-preview.png'
scene=bpy.data.scenes.get('Steamline · Municipal Boiler')
assert scene is not None
bpy.context.window.scene=scene
model=bpy.data.collections.get('BOILER · editable parts')
parts=[o for o in model.objects if o.type in {'MESH','CURVE','FONT'}]
wheel=bpy.data.objects.get('Valve Wheel Rig')
if wheel is None:
    wheel=bpy.data.objects.new('Valve Wheel Rig',None)
    model.objects.link(wheel)
wheel.animation_data_clear()
wheel.location=(0,-1.23,1.02)
wheel.rotation_mode='XYZ'
wheel.rotation_euler=(0,0,0)
wheel.scale=(1,1,1)
needle=bpy.data.objects.get('Pressure Needle · adjustable')
needle.animation_data_clear()
scene.frame_set(1)
# Reconstruct the known source rest transforms before binding the common wheel pivot.
wheel_parts=[o for o in parts if o.name.startswith('Valve Wheel') or o.name=='Valve hub nut']
for obj in wheel_parts:
    obj.parent=None
    obj.rotation_mode='XYZ'
    obj.scale=(1,1,1)
rim=next(o for o in wheel_parts if 'hand rim' in o.name)
rim.location=(0,-1.23,1.02)
rim.rotation_euler=Vector((0,-1,0)).to_track_quat('Z','Y').to_euler()
spokes=sorted([o for o in wheel_parts if 'spoke' in o.name],key=lambda o:o.name)
for j,obj in enumerate(spokes):
    a=math.tau*j/5+math.pi/2
    start=Vector((0,-1.23,1.02))
    end=Vector((.264*math.cos(a),-1.23,1.02+.264*math.sin(a)))
    obj.location=(start+end)/2
    obj.rotation_euler=(end-start).to_track_quat('Z','Y').to_euler()
hub=next(o for o in wheel_parts if o.name=='Valve hub nut')
hub.location=(0,-1.273,1.02)
hub.rotation_euler=Vector((0,-1,0)).to_track_quat('Z','Y').to_euler()
bpy.context.view_layer.update()
for obj in wheel_parts:
    world=obj.matrix_world.copy()
    obj.parent=wheel
    obj.matrix_parent_inverse=wheel.matrix_world.inverted()
    obj.matrix_world=world
wheel.keyframe_insert(data_path='rotation_euler',frame=1)
wheel.rotation_euler[1]=math.radians(80)
wheel.keyframe_insert(data_path='rotation_euler',frame=40)
needle.rotation_euler[1]=math.radians(-50)
needle.keyframe_insert(data_path='rotation_euler',frame=1)
needle.rotation_euler[1]=math.radians(37)
needle.keyframe_insert(data_path='rotation_euler',frame=40)
scene.frame_start=1;scene.frame_end=40
scene.frame_set(1)
bpy.context.view_layer.update()
# Check that rotation changes spoke positions but not the centre of the hand rim.
assert (rim.matrix_world.translation-Vector((0,-1.23,1.02))).length<.001
scene.frame_set(40);bpy.context.view_layer.update()
assert (rim.matrix_world.translation-Vector((0,-1.23,1.02))).length<.001
scene.frame_set(1)
bpy.context.view_layer.update()
export_coll=bpy.data.collections.new('EXPORT · temporary')
scene.collection.children.link(export_coll)
groups={'body':[],'wheel':[],'needle':[]}
for original in parts:
    # Text bevels dominate an unnecessarily dense glTF. Simplify only copied source data.
    temp=None
    if original.type in {'CURVE','FONT'}:
        temp=original.copy()
        temp.data=original.data.copy()
        temp.animation_data_clear()
        temp.parent=None
        temp.matrix_world=original.matrix_world.copy()
        export_coll.objects.link(temp)
        temp.data.resolution_u=3
        if original.type=='FONT':
            temp.data.bevel_depth=0
            temp.data.extrude=.0008
        else:
            temp.data.bevel_resolution=2
        bpy.context.view_layer.update()
        source=temp
    else:source=original
    deps=bpy.context.evaluated_depsgraph_get()
    mesh=bpy.data.meshes.new_from_object(source.evaluated_get(deps),depsgraph=deps)
    mesh.transform(original.matrix_world)
    obj=bpy.data.objects.new('LOD · '+original.name,mesh)
    export_coll.objects.link(obj)
    if temp:
        temp_data=temp.data
        bpy.data.objects.remove(temp,do_unlink=True)
        bpy.data.curves.remove(temp_data)
    mesh.calc_loop_triangles()
    if original.type=='MESH' and len(mesh.loop_triangles)>300:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True);bpy.context.view_layer.objects.active=obj
        dec=obj.modifiers.new('Web geometry reduction','DECIMATE')
        dec.ratio=.4;dec.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier=dec.name)
    group='needle' if original==needle else 'wheel' if original in wheel_parts else 'body'
    groups[group].append(obj)
def combine(objects,name,pivot):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    obj=bpy.context.view_layer.objects.active
    obj.name=name
    obj.data.transform(Matrix.Translation(-Vector(pivot)))
    obj.location=pivot
    obj.rotation_mode='XYZ';obj.rotation_euler=(0,0,0);obj.scale=(1,1,1)
    return obj
body=combine(groups['body'],'Boiler static body',(0,0,0))
rotor=combine(groups['wheel'],'Valve handwheel',(0,-1.23,1.02))
pointer=combine(groups['needle'],'Pressure needle',tuple(needle.location))
root=bpy.data.objects.new('Steamline Municipal Boiler',None)
export_coll.objects.link(root)
for obj in [body,rotor,pointer]:obj.parent=root
for obj,angle,name in [(rotor,80,'Open valve'),(pointer,87,'Raise pressure')]:
    obj.rotation_euler=(0,0,0)
    obj.keyframe_insert(data_path='rotation_euler',frame=1)
    obj.rotation_euler[1]=math.radians(angle)
    obj.keyframe_insert(data_path='rotation_euler',frame=40)
    obj.animation_data.action.name=name
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for obj in [body,rotor,pointer]:obj.select_set(True)
bpy.context.view_layer.objects.active=body
scene.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(OUT/'steamline-boiler.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_cameras=False,export_lights=False)
data=(OUT/'steamline-boiler.glb').read_bytes()
chunk_len=struct.unpack_from('<I',data,12)[0]
gltf=json.loads(data[20:20+chunk_len])
triangles=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
assert len(gltf['meshes'])==3
assert not any(n.get('name')=='Cube' for n in gltf['nodes'])
assert len(gltf.get('animations',[]))==2
for obj in list(export_coll.objects):bpy.data.objects.remove(obj,do_unlink=True)
bpy.data.collections.remove(export_coll)
ground=bpy.data.objects.get('Studio ground · preview only')
# Render both source animation extremes with all parts on their correct pivots.
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
for active in [False,True]:
    scene.frame_set(40 if active else 1)
    bpy.context.view_layer.update()
    bpy.data.materials['Firebox · amber glass'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=2.5 if active else 0
    bpy.data.materials['Steam · mint pilot light'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=2 if active else 0
    ground.hide_render=True;scene.render.film_transparent=True
    scene.render.resolution_x=512;scene.render.resolution_y=512;scene.cycles.samples=32
    scene.render.filepath=str(OUT/('boiler.png' if active else 'boiler-idle.png'))
    bpy.ops.render.render(write_still=True,scene=scene.name)
scene.frame_set(40)
ground.hide_render=False;scene.render.film_transparent=False
scene.render.resolution_x=1024;scene.render.resolution_y=1024;scene.cycles.samples=48
scene.render.filepath=PREVIEW
bpy.ops.render.render(write_still=True,scene=scene.name)
bpy.context.preferences.filepaths.save_version=0
scene.cursor.location=(0,0,0)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'steamline-boiler.blend'),compress=True)
metadata={'name':'Steamline Municipal Boiler','blender_version':bpy.app.version_string,'authored_via':'Blender MCP over stdio',
 'editable_parts':len(parts),'triangles':triangles,'export_meshes':len(gltf['meshes']),
 'material_primitives':sum(len(m['primitives']) for m in gltf['meshes']),'animations':[a['name'] for a in gltf['animations']],
 'wheel_pivot_verified':True,'source':'steamline-boiler.blend','model':'steamline-boiler.glb','sprite':'boiler.png','idle_sprite':'boiler-idle.png',
 'glb_bytes':len(data),'sprite_bytes':(OUT/'boiler.png').stat().st_size,'preview':PREVIEW}
(OUT/'asset-info.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
result=metadata

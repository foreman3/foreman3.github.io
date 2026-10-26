"""Execute through Blender MCP's execute_blender_code tool.
Creates a new scene and self-contained Steamline boiler assets.
No existing scene/object or user preference is overwritten.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

OUT = Path('C:/Users/forem/Documents/Codex/vibe-cade/steamline/assets/boiler')
PREVIEW = Path('C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/steamline-boiler-preview.png')
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes.new('Steamline · Municipal Boiler')
bpy.context.window.scene = scene
model = bpy.data.collections.new('BOILER · editable parts')
scene.collection.children.link(model)
studio = bpy.data.collections.new('STUDIO · preview only')
scene.collection.children.link(studio)

def material(name, color, metal=0, rough=.35, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = rough
    if emission:
        node.inputs['Emission Color'].default_value = (*color, 1)
        node.inputs['Emission Strength'].default_value = emission
    return mat

wine = material('Enamel · oxblood', (.24, .035, .055), .42, .26)
brass = material('Brass · warm satin', (.66, .36, .10), .82, .27)
edge = material('Brass · polished edge', (.9, .6, .23), .78, .19)
iron = material('Cast iron · blue black', (.032, .045, .054), .65, .38)
red = material('Valve · vermilion enamel', (.6, .075, .038), .35, .25)
cream = material('Gauge · porcelain', (.88, .79, .57), .05, .44)
ink = material('Gauge · ink', (.055, .038, .029), .05, .5)
teal = material('Steam · mint pilot light', (.18, .8, .62), .2, .22, 2)
amber = material('Firebox · amber glass', (1, .24, .035), .1, .26, 2.5)
floor_mat = material('Studio · mulberry', (.09, .055, .073), .1, .62)
parts = []

def finish(obj, name, mat, smooth=True, bevel=0):
    obj.name = name
    for coll in list(obj.users_collection):
        coll.objects.unlink(obj)
    model.objects.link(obj)
    obj.data.materials.append(mat)
    if obj.type == 'MESH':
        if smooth:
            for face in obj.data.polygons:
                face.use_smooth = True
        if bevel:
            mod = obj.modifiers.new('Machined soft edge', 'BEVEL')
            mod.width = bevel
            mod.segments = 3
    parts.append(obj)
    return obj

def cylinder(name, loc, radius, depth, mat, axis=(0, 0, 1), vertices=48, bevel=.015):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.rotation_euler = Vector(axis).to_track_quat('Z', 'Y').to_euler()
    return finish(obj, name, mat, True, bevel)

def box(name, loc, size, mat, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, False, bevel)

def torus(name, loc, radius, minor, mat, axis=(0,0,1)):
    bpy.ops.mesh.primitive_torus_add(major_segments=48, minor_segments=10, location=loc, major_radius=radius, minor_radius=minor)
    obj = bpy.context.object
    obj.rotation_euler = Vector(axis).to_track_quat('Z','Y').to_euler()
    return finish(obj, name, mat)

def rod(name, a, b, radius, mat, vertices=16):
    delta = Vector(b) - Vector(a)
    return cylinder(name, (Vector(a)+Vector(b))/2, radius, delta.length, mat, delta, vertices, .004)

def label(name, text, loc, size, mat):
    data = bpy.data.curves.new(name, 'FONT')
    data.body = text
    data.align_x = 'CENTER'
    data.align_y = 'CENTER'
    data.size = size
    data.extrude = .0008
    data.bevel_depth = .0003
    obj = bpy.data.objects.new(name, data)
    model.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (math.pi/2, 0, 0)
    data.materials.append(mat)
    parts.append(obj)
    return obj

def tube(name, points, radius, mat):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 12
    data.bevel_depth = radius
    data.bevel_resolution = 4
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for p,co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = p.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, data)
    model.objects.link(obj)
    data.materials.append(mat)
    parts.append(obj)
    return obj

def flange(name, center, axis, radius=.24):
    n = Vector(axis).normalized()
    center = Vector(center)
    cylinder(name+' · flange', center, radius, .09, brass, n)
    torus(name+' · rolled lip', center+n*.055, radius*.86, .025, edge, n)
    cylinder(name+' · dark bore', center+n*.057, radius*.54, .012, iron, n, bevel=0)
    u = n.cross(Vector((0,0,1))).normalized()
    if u.length < .1:
        u = n.cross(Vector((0,1,0))).normalized()
    v = n.cross(u).normalized()
    for j in range(4):
        angle = math.pi/4+j*math.pi/2
        pos = center+n*.07+(u*math.cos(angle)+v*math.sin(angle))*radius*.76
        cylinder(name+' · bolt '+str(j+1), pos, .036, .035, iron, n, 6, .003)

# Broad, readable silhouette with a narrow cast-iron footing.
box('Cast iron plinth', (0,0,.16), (1.6,1.25,.24), iron, .075)
for x in [-.57,.57]:
    box('Splayed foot', (x,-.1,.11), (.33,1.3,.2), iron, .045)
cylinder('Enamel pressure vessel', (0,0,1.48), .78, 1.8, wine, bevel=.07)
for z in [.59,2.37]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=16, location=(0,0,z))
    dome = bpy.context.object
    dome.scale = (.78,.78,.31)
    finish(dome, 'Spun enamel end dome', wine)
for z in [.64,2.31]:
    torus('Brass pressure seam', (0,0,z), .785, .052, brass)
    for j in range(12):
        a = j*math.tau/12
        cylinder('Pressure seam hex stud', (.79*math.cos(a),.79*math.sin(a),z), .035, .04, edge, (math.cos(a),math.sin(a),0), 6, .003)

# Rear pipe riser and a front-facing pilot heat window.
tube('Copper hot riser', [(.58,.10,1.62),(1.02,.10,1.62),(1.2,.10,1.81),(1.2,.10,2.52),(1.37,.10,2.7),(1.64,.10,2.7)], .125, brass)
flange('Hot outlet', (1.68,.1,2.7), (1,0,0))
rod('Cold inlet pipe', (-.67,0,1.08), (-1.43,0,1.08), .14, brass)
flange('Cold inlet', (-1.48,0,1.08), (-1,0,0))
box('Firebox frame', (0,-.78,.53), (.8,.16,.36), iron, .065)
box('Amber heat window', (0,-.876,.53), (.64,.018,.23), amber, .035)
for x in [-.24,-.12,0,.12,.24]:
    box('Firebox grate', (x,-.898,.53), (.026,.025,.25), iron, .005)

# Gauge, graduations and a separately named needle for later animation.
cylinder('Gauge mounting boss', (0,-.72,1.98), .22, .3, iron, (0,-1,0))
cylinder('Gauge brass bezel', (0,-.91,1.98), .34, .16, brass, (0,-1,0))
torus('Gauge polished rim', (0,-1.004,1.98), .305, .026, edge, (0,-1,0))
cylinder('Porcelain gauge face', (0,-1.001,1.98), .287, .018, cream, (0,-1,0), bevel=.005)
for j in range(21):
    a = math.radians(210-j*12)
    tick = box('Gauge graduation', (.235*math.cos(a),-1.018,1.98+.235*math.sin(a)), (.012,.008,.036 if j%4 else .052), ink, .001)
    tick.rotation_euler[1] = math.pi/2-a
    if j%4==0:
        label('Gauge number', str(j//2), (.181*math.cos(a),-1.027,1.98+.181*math.sin(a)), .042, ink)
label('Gauge unit', 'BAR', (0,-1.03,1.87), .045, ink)
mesh = bpy.data.meshes.new('Pressure needle profile')
mesh.from_pydata([(-.012,0,-.045),(.012,0,-.045),(.008,0,.16),(0,0,.224),(-.008,0,.16)],[],[(0,1,2,3,4)])
needle = bpy.data.objects.new('Pressure Needle · adjustable',mesh)
model.objects.link(needle)
needle.location = (0,-1.043,1.98)
needle.rotation_euler[1] = math.radians(37)
mesh.materials.append(red)
parts.append(needle)
cylinder('Gauge needle pin', (0,-1.052,1.98), .03, .024, brass, (0,-1,0), 20, .004)

# A five-spoke valve wheel, with its axle and handwheel named independently.
rod('Valve axle', (0,-.73,1.02), (0,-1.20,1.02), .075, brass)
wheel_parts = [torus('Valve Wheel · hand rim', (0,-1.23,1.02), .28, .043, red, (0,-1,0))]
for j in range(5):
    a = math.tau*j/5+math.pi/2
    wheel_parts.append(rod('Valve Wheel · spoke', (0,-1.23,1.02), (.264*math.cos(a),-1.23,1.02+.264*math.sin(a)), .023, red))
cylinder('Valve hub nut', (0,-1.273,1.02), .085, .075, edge, (0,-1,0), 6, .008)

# Restrained signage and a mint-green ready lamp.
box('Maker plaque', (0,-.799,1.47), (.61,.04,.18), brass, .025)
label('Maker name', 'STEAMLINE', (0,-.826,1.48), .068, ink)
label('Maker year', 'MUNICIPAL HEAT  1896', (0,-.828,1.43), .023, ink)
cylinder('Pilot light brass seat', (.43,-.665,1.47), .08, .09, brass, (0,-1,0), 24)
cylinder('Pilot ready light', (.43,-.724,1.47), .055, .018, teal, (0,-1,0), 24, .005)
cylinder('Safety valve stem', (0,0,2.76), .105, .3, brass)
torus('Safety valve collar', (0,0,2.69), .16, .045, brass)
box('Safety valve lever', (.13,0,2.92), (.46,.09,.055), iron, .02)
box('Safety lever enamel tip', (.34,0,2.92), (.14,.13,.08), red, .03)

# Studio fixtures belong to a separate collection and never enter the GLB.
def studio_link(obj):
    for coll in list(obj.users_collection):coll.objects.unlink(obj)
    studio.objects.link(obj)

bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.015))
ground=bpy.context.object
ground.name='Studio ground · preview only'
ground.data.materials.append(floor_mat)
studio_link(ground)

def aim(obj,point):obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
def light(name,loc,power,color,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);studio.objects.link(obj);obj.location=loc;aim(obj,(0,0,1.4))
light('Warm key softbox',(-3.5,-4.5,6),650,(1,.83,.62),4)
light('Cool rim softbox',(4,2.5,4.8),850,(.55,.8,1),3)
light('Face fill',(1,-5,2.8),220,(1,.95,.83),3)
world=bpy.data.worlds.new('Quiet studio world');world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.06,.075,.1,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
scene.world=world
cam_data=bpy.data.cameras.new('Boiler product camera')
cam=bpy.data.objects.new('Boiler product camera',cam_data);studio.objects.link(cam)
cam.location=(4.8,-8,4.8);aim(cam,(.08,0,1.44));cam_data.type='ORTHO';cam_data.ortho_scale=4.5
scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1024;scene.render.resolution_y=1024;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX'
scene.render.film_transparent=False
scene.render.filepath=str(PREVIEW)
scene['asset_purpose']='Steamline boiler source / prop, made with Blender MCP'
scene['connection_left']=(-1.48,0,1.08)
scene['connection_right']=(1.68,.1,2.7)
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'steamline-boiler.blend'),compress=True)
bpy.ops.render.render(write_still=True,scene=scene.name)

# Browser sprite: transparent background, model only, same camera.
ground.hide_render=True
scene.render.film_transparent=True
scene.render.resolution_x=512;scene.render.resolution_y=512
scene.cycles.samples=32
scene.render.filepath=str(OUT/'boiler.png')
bpy.ops.render.render(write_still=True,scene=scene.name)

# Export evaluated mesh copies so editable curves/text/modifiers remain in source.
bpy.ops.object.select_all(action='DESELECT')
deps=bpy.context.evaluated_depsgraph_get()
exports=[]
triangles=0
for obj in parts:
    if obj.type not in {'MESH','CURVE','FONT'}:continue
    mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(deps),depsgraph=deps)
    duplicate=bpy.data.objects.new('Export · '+obj.name,mesh)
    scene.collection.objects.link(duplicate)
    duplicate.matrix_world=obj.matrix_world.copy()
    duplicate.select_set(True)
    mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles)
    exports.append(duplicate)
bpy.context.view_layer.objects.active=exports[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'steamline-boiler.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
for obj in exports:bpy.data.objects.remove(obj,do_unlink=True)
ground.hide_render=False
scene.render.film_transparent=False;scene.render.resolution_x=1024;scene.render.resolution_y=1024;scene.cycles.samples=48
scene.render.filepath=str(PREVIEW)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'steamline-boiler.blend'),compress=True)
metadata={'name':'Steamline Municipal Boiler','blender_version':bpy.app.version_string,'editable_parts':len(parts),'triangles':triangles,'source':str(OUT/'steamline-boiler.blend'),'model':str(OUT/'steamline-boiler.glb'),'sprite':str(OUT/'boiler.png'),'preview':str(PREVIEW),'authored_via':'Blender MCP execute_blender_code'}
(OUT/'asset-info.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
result=metadata

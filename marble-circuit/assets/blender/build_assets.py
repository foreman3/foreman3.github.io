"""Author Marble Circuit's miniatures through Blender MCP execute_blender_code.

Override ASSET_OUTPUT / RENDER_OUTPUT before execution to choose destinations.
Run render_batch(first, last) in subsequent MCP calls to export the sprite views.
This creates its own scene; it never removes objects from another scene.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

OUT = Path(globals().get('ASSET_OUTPUT', 'C:/Users/forem/Documents/Codex/vibe-cade/marble-circuit/assets/blender'))
RENDERS = Path(globals().get('RENDER_OUTPUT', 'C:/Users/forem/AppData/Local/Temp/marble-blender-assets/renders'))
OUT.mkdir(parents=True, exist_ok=True)
RENDERS.mkdir(parents=True, exist_ok=True)
previous=bpy.data.scenes.get('Marble Circuit · miniature workshop')
scene = bpy.data.scenes.new('Marble Circuit · miniature workshop · building')
bpy.context.window.scene = scene
if previous:
    owned=list(previous.objects)
    bpy.data.scenes.remove(previous)
    for obj in owned:
        if obj.users==0:
            bpy.data.objects.remove(obj)
scene.name='Marble Circuit · miniature workshop'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 8
scene.cycles.transmission_bounces = 6
scene.render.resolution_x = scene.render.resolution_y = 192
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('Workshop reflection environment')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.55, .65, .76, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .55
groups = {}
parts = []
current = None

def group(name):
    global current
    current = bpy.data.collections.new(name)
    scene.collection.children.link(current)
    groups[name] = current
    return current

def finish(obj, name, mat=None):
    obj.name = name
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    current.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    if obj.type == 'MESH':
        for face in obj.data.polygons:
            face.use_smooth = True
    parts.append(obj)
    return obj

def material(name, color, metal=0, rough=.25, emission=0, transmission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    n = m.node_tree.nodes['Principled BSDF']
    n.inputs['Base Color'].default_value = (*color, 1)
    n.inputs['Metallic'].default_value = metal
    n.inputs['Roughness'].default_value = rough
    n.inputs['Transmission Weight'].default_value = transmission
    n.inputs['IOR'].default_value = 1.43
    n.inputs['Coat Weight'].default_value = .35
    if emission:
        n.inputs['Emission Color'].default_value = (*color, 1)
        n.inputs['Emission Strength'].default_value = emission
    return m

glass = material('Player · clear aquamarine glass', (.33, .85, .94), rough=.08, transmission=.82)
ivory = material('Player · ivory cat-eye ribbon', (.99, .85, .48), rough=.2)
blue = material('Player · cobalt cat-eye ribbon', (.018, .27, .5), metal=.25)
copper = material('Cannon · burnished copper', (.57, .22, .08), metal=.78, rough=.26)
brass = material('Machinery · warm brass', (.86, .55, .16), metal=.78, rough=.22)
dark = material('Machinery · blue graphite enamel', (.025, .075, .11), metal=.55, rough=.3)
black = material('Bores · deep shadow', (.006, .012, .018), rough=.75)
cream = material('Plinth · glazed ivory ceramic', (.85, .81, .67), rough=.22)
steel = material('Rival · gunmetal shell', (.07, .13, .18), metal=.75, rough=.24)
red = material('Rival · amber danger stripe', (.95, .24, .035), metal=.35, emission=.15)
acid = material('Acid · luminous chartreuse', (.12, .45, .005), rough=.18, emission=.15)
gold = material('Bonus · citrine crystal', (.94, .47, .025), metal=.25, rough=.12, transmission=.22)
lamps = [material('Beacon · '+name, color, metal=.22, emission=.45) for name,color in [
    ('waiting slate', (.21,.32,.4)), ('next coral', (.95,.24,.065)), ('lit turquoise', (.025,.66,.58))]]

def sphere(name, position, radius, mat, scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, radius=radius, location=position)
    o = finish(bpy.context.object,name,mat)
    if scale:
        o.scale = scale
    return o

def cylinder(name, position, radius, depth, mat, vertices=48, direction=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=position)
    o = finish(bpy.context.object,name,mat)
    if direction:
        o.rotation_euler = Vector(direction).to_track_quat('Z','Y').to_euler()
    b = o.modifiers.new('Machined edge radius','BEVEL')
    b.width = min(radius*.075,depth*.13)
    b.segments = 3
    o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o

def torus(name, position, major, minor, mat, direction=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=48, minor_segments=10, location=position, major_radius=major, minor_radius=minor)
    o=finish(bpy.context.object,name,mat)
    if direction:
        o.rotation_euler = Vector(direction).to_track_quat('Z','Y').to_euler()
    return o

def tube(name, points, radius, mat):
    curve=bpy.data.curves.new(name,'CURVE')
    curve.dimensions='3D'
    curve.resolution_u=16
    curve.bevel_depth=radius
    curve.bevel_resolution=3
    spline=curve.splines.new('POLY')
    spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):
        p.co=(*co,1)
    o=bpy.data.objects.new(name,curve)
    current.objects.link(o)
    o.data.materials.append(mat)
    parts.append(o)
    return o

group('PLAYER · glass and rotating cat-eye core')
sphere('Handmade glass shell',(0,0,1),1,glass)
core=[]
for j,mat in enumerate([ivory,blue,ivory]):
    points=[]
    for i in range(49):
        t=i/48*math.pi
        a=j*math.tau/3+t*1.3
        points.append((math.sin(t)*math.cos(a)*.67,math.sin(t)*math.sin(a)*.67,1+math.cos(t)*.76))
    core.append(tube('Suspended cat-eye ribbon '+str(j+1),points,.095,mat))
core_rig=bpy.data.objects.new('Cat-eye rolling pivot',None)
current.objects.link(core_rig)
core_rig.location=(0,0,1)
for o in core:
    o.parent=core_rig
    o.location.z=-1

group('RIVAL · armored rolling sentinel')
sphere('Rival graphite shell',(0,0,1),1,steel)
torus('Amber equator',(0,0,1),.991,.052,red,direction=(0,1,1))
for i in range(8):
    a=i*math.tau/8
    sphere('Brass shell rivet '+str(i),(math.cos(a)*.84,math.sin(a)*.84,1.52),.075,brass)
# Forward inset reads as a pair of eyes even when the sprite is very small.
for x in [-.27,.27]:
    sphere('Amber eye',(x,.85,1.37),.16,red,scale=(1,.42,.7))

group('CANNON · pivoting copper launcher')
cylinder('Octagonal ceramic socket',(0,0,.08),1.06,.16,cream,vertices=8)
cylinder('Turntable',(0,0,.23),.79,.24,dark)
torus('Turntable brass ring',(0,0,.37),.72,.045,brass)
for i in range(8):
    a=i*math.tau/8
    cylinder('Socket bolt '+str(i),(math.cos(a)*.86,math.sin(a)*.86,.19),.065,.07,brass,vertices=6)
barrel=[]
before=len(parts)
for side in [-1,1]:
    cylinder('Barrel trunnion',(-.16,side*.42,.66),.23,.25,brass,direction=(0,1,0))
direction=Vector((1,0,.27)).normalized()
center=Vector((.22,0,.83))
cylinder('Copper barrel',center,.38,1.45,copper,direction=direction)
for d in [-.49,.42,.69]:
    p=center+direction*d
    torus('Rolled brass barrel band',p,.385,.058,brass,direction=direction)
mouth=center+direction*.737
cylinder('Recessed black muzzle',mouth,.30,.013,black,direction=direction)
torus('Inner muzzle glint',mouth+direction*.01,.31,.022,copper,direction=direction)
cylinder('Rear breech cap',center-direction*.74,.41,.09,dark,direction=direction)
sphere('Breech ignition lamp',(-.65,0,1.02),.095,red)
barrel=parts[before:]
# Parent the complete launcher, so all directional views retain correct lighting.
cannon_rig=bpy.data.objects.new('Cannon heading control',None)
current.objects.link(cannon_rig)
for o in list(current.objects):
    if o!=cannon_rig:
        o.parent=cannon_rig

group('BEACON · porcelain checkpoint lantern')
cylinder('Octagonal beacon foot',(0,0,.07),1,.14,cream,vertices=8)
cylinder('Foot inset',(0,0,.16),.65,.08,dark)
torus('Beacon foot brass trim',(0,0,.205),.64,.025,brass)
cylinder('Tapered lantern mast',(0,0,.74),.075,1.14,brass)
cylinder('Lantern bottom',(0,0,1.39),.4,.10,dark)
beacon_lens=sphere('Colored lantern lens',(0,0,1.66),.36,lamps[0],scale=(1,1,1.03))
cylinder('Lantern roof',(0,0,2.02),.43,.09,dark)
sphere('Lantern finial',(0,0,2.12),.09,brass)

group('ACID · inset ceramic basin')
cylinder('Acid black catchment',(0,0,.02),1,.035,dark)
torus('Glazed basin lip',(0,0,.035),.98,.045,cream)
cylinder('Acid surface',(0,0,.055),.925,.03,acid)
for i in range(9):
    a=i*2.39996
    r=.27+(i%3)*.19
    sphere('Acid blister '+str(i),(math.cos(a)*r,math.sin(a)*r,.095),.065+i%3*.02,acid,scale=(1,1,.5))

group('BONUS · cut citrine')
verts=[(0,0,.8)]+[(math.cos(i*math.tau/6)*.48,math.sin(i*math.tau/6)*.48,0) for i in range(6)]+[(0,0,-.65)]
faces=[]
for i in range(6):
    faces.append((0,1+i,1+(i+1)%6))
    faces.append((7,1+(i+1)%6,1+i))
mesh=bpy.data.meshes.new('Citrine facets')
mesh.from_pydata(verts,[],faces)
o=bpy.data.objects.new('Citrine gem',mesh)
current.objects.link(o)
o.data.materials.append(gold)
parts.append(o)

group('STUDIO · orthographic sprite camera')
def light(name,location,power,size,color):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.shape='DISK'
    data.size=size
    data.color=color
    o=bpy.data.objects.new(name,data)
    current.objects.link(o)
    o.location=location
    o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
light('Large warm key',(-3,1,7),650,5,(1,.91,.76))
light('Cool edge softbox',(2,-4,4),500,3,(.61,.83,1))
light('Front reflection',(4,5,6),450,3,(1,1,1))
camera_data=bpy.data.cameras.new('Game angle · 34.125 degrees')
camera=bpy.data.objects.new('Game sprite camera',camera_data)
current.objects.link(camera)
camera_data.type='ORTHO'
scene.camera=camera
elevation=math.asin(.46/.82)
def camera_at(target,span):
    camera.location=Vector(target)+Vector((math.cos(elevation)/math.sqrt(2),math.cos(elevation)/math.sqrt(2),math.sin(elevation)))*12
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    camera_data.ortho_scale=span
    bpy.context.view_layer.update()

exports=[]
for i in range(8):
    exports.append({'name':'marble-'+str(i),'group':'PLAYER · glass and rotating cat-eye core','span':2.36,'target':(0,0,1),'anchor':(0,0,1),'width':30.68,'frame':i})
exports.append({'name':'rival','group':'RIVAL · armored rolling sentinel','span':2.36,'target':(0,0,1),'anchor':(0,0,1),'width':37.76})
for i in range(8):
    exports.append({'name':'cannon-'+str(i),'group':'CANNON · pivoting copper launcher','span':3.35,'target':(0,0,.6),'anchor':(0,0,0),'width':107,'heading':i})
for i,name in enumerate(['waiting','next','lit']):
    exports.append({'name':'beacon-'+name,'group':'BEACON · porcelain checkpoint lantern','span':3.25,'target':(0,0,.9),'anchor':(0,0,0),'width':110,'lamp':i})
exports += [
    {'name':'acid','group':'ACID · inset ceramic basin','span':2.28,'target':(0,0,0),'anchor':(0,0,0),'width':2.28},
    {'name':'gem','group':'BONUS · cut citrine','span':1.8,'target':(0,0,0),'anchor':(0,0,0),'width':21.6}]
metadata={}
def render_batch(first,last):
    for spec in exports[first:last]:
        for name,col in groups.items():
            col.hide_render=name not in [spec['group'],'STUDIO · orthographic sprite camera']
        if 'frame' in spec:
            # Rotate only the enclosed cat-eye geometry; highlights stay in world space.
            a=spec['frame']*math.tau/8
            core_rig.rotation_euler=(math.sin(a)*.35,a,0)
        if 'heading' in spec:
            # Blender's camera right vector is (-X,+Y); the game's is (+X,-Y).
            # Swap world X/Y for the exported heading, rather than mirroring pixels.
            cannon_rig.rotation_euler[2]=math.pi/2-spec['heading']*math.tau/8
        if 'lamp' in spec:
            beacon_lens.data.materials[0]=lamps[spec['lamp']]
        camera_at(spec['target'],spec['span'])
        scene.render.filepath=str(RENDERS/(spec['name']+'.png'))
        bpy.ops.render.render(write_still=True)
        point=world_to_camera_view(scene,camera,Vector(spec['anchor']))
        entry={'anchor':[round(point.x,6),round(1-point.y,6)],'width':spec['width']}
        if 'heading' in spec:
            a=cannon_rig.rotation_euler[2]
            aim=world_to_camera_view(scene,camera,Vector((math.cos(a),math.sin(a),0)))
            entry['heading']=spec['heading']
            entry['aim']=[round(aim.x-point.x,6),round(point.y-aim.y,6)]
        if 'lamp' in spec:
            lens=world_to_camera_view(scene,camera,Vector((0,0,1.66)))
            entry['label']=[round(lens.x,6),round(1-lens.y,6)]
        metadata[spec['name']]=entry
        (RENDERS/'frames.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
    return {'rendered':[e['name'] for e in exports[first:last]],'total':len(metadata)}

# Open on a readable cannon preview; other editable models have named collections.
for name,col in groups.items():
    col.hide_render=name not in ['CANNON · pivoting copper launcher','STUDIO · orthographic sprite camera']
    col.hide_viewport=col.hide_render
cannon_rig.rotation_euler[2]=math.pi/4
camera_at((0,0,.6),3.35)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'marble-miniatures.blend'),compress=True)
bpy.app.driver_namespace['marble_asset_workshop']={'render_batch':render_batch}
result={'scene':scene.name,'parts':len(parts),'views':len(exports),'source':str(OUT/'marble-miniatures.blend')}

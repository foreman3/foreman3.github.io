"""Rebuild the clockwork scenery and transparent game pieces with Blender."""
import math
from pathlib import Path
import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parents[1] / "art"
TAU = math.tau

def mat(name, hexcolor, metal=0, rough=.34):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    rgb = [int(hexcolor[i:i+2], 16)/255 for i in (0,2,4)]
    rgb = [((v+.055)/1.055)**2.4 if v>.04045 else v/12.92 for v in rgb]
    node = m.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*rgb,1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = rough
    return m

def setup(transparent, width, height):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 12
    scene.cycles.use_denoising = True
    scene.world = bpy.data.worlds.new("Softbox reflections")
    scene.world.color = (.33,.38,.43)
    scene.render.film_transparent = transparent
    scene.render.resolution_x, scene.render.resolution_y = width,height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    scene.render.image_settings.quality = 90
    scene.view_settings.view_transform = 'AgX'
    return scene

def finish(ob, material, bevel=0):
    ob.data.materials.append(material)
    if bevel:
        mod = ob.modifiers.new("Rolled edges",'BEVEL')
        mod.width,mod.segments = bevel,3
        ob.modifiers.new("Face normals",'WEIGHTED_NORMAL')
    return ob

def egg(loc,scale,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=loc)
    ob=bpy.context.object;ob.scale=scale
    for face in ob.data.polygons: face.use_smooth=True
    return finish(ob,material)

def box(loc,scale,material,bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    ob=bpy.context.object;ob.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(ob,material,bevel)

def cyl(loc,radius,depth,material,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth,location=loc,rotation=rotation)
    return finish(bpy.context.object,material,min(depth*.13,.035))

def ring(loc,major,minor,material,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=10,location=loc,major_radius=major,minor_radius=minor,rotation=rotation)
    ob=bpy.context.object
    for face in ob.data.polygons: face.use_smooth=True
    return finish(ob,material)

def lamp(loc,energy,size,color,target):
    bpy.ops.object.light_add(type='AREA',location=loc)
    ob=bpy.context.object;ob.data.energy=energy;ob.data.shape='DISK';ob.data.size=size;ob.data.color=color
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

def camera(loc,target,scale):
    bpy.ops.object.camera_add(location=loc)
    ob=bpy.context.object;ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    ob.data.type='ORTHO';ob.data.ortho_scale=scale;bpy.context.scene.camera=ob

def render(name):
    bpy.context.scene.render.filepath=str(OUT/(name+'.webp'))
    bpy.ops.render.render(write_still=True)

def actor(name):
    setup(True,440,440)
    enemy = name != 'hopper'
    brass=mat('Turned brass','d6a352',.78)
    bright=mat('Polished brass','f7d787',.65)
    shell=mat('Baked enamel',{'hopper':'e96c25','winder':'85396c','bell':'885589','chaser':'72345a'}[name],.33,.25)
    boot=mat('Deep petrol','153b42',.46)
    dark=mat('Ebonite','191b27',.22)
    porcelain=mat('Porcelain','fff0c5',.12,.21)
    for y in [-.29,.29]:
        cyl((-.03,y,.48),.106,.38,brass)
        ring((-.03,y,.54),.118,.037,dark)
        egg((.09,y,.25),(.35,.20,.15),boot)
        egg((.23,y-.025,.27),(.16,.17,.092),brass)
    egg((-.02,0,1.05),(.70,.53,.67),shell)
    ring((-.02,0,1.00),.586,.025,brass).scale.y=.88
    for y in [-.31,.31]:
        egg((.28,y,1.51),(.22,.19,.26),brass)
        egg((.37,y-.025,1.54),(.178,.156,.20),porcelain)
        egg((.439,y-.119,1.56),(.092,.077,.107),dark)
        egg((.456,y-.176,1.608),(.032,.026,.031),porcelain)
    if enemy:
        for side in [-1,1]:
            horn=box((.4,.29*side,1.69),(.38,.16,.092),boot);horn.rotation_euler.y=.29
        if name=='bell':
            for side in [-1,1]:
                bell=egg((-.02,side*.34,1.78),(.26,.21,.17),bright)
                bell.rotation_euler.x=side*.42
            cyl((-.04,0,1.79),.045,.28,brass)
            egg((-.04,0,1.95),(.09,.09,.09),boot)
        elif name=='chaser':
            for side in [-1,1]:
                bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.16,radius2=.025,depth=.39,location=(-.14,side*.30,1.76),rotation=(side*-.38,-.28,0))
                finish(bpy.context.object,bright,.018)
        else:
            cyl((0,0,1.76),.12,.14,bright)
            egg((0,0,1.90),(.17,.17,.14),shell)
        for side in [-1,1]:
            egg((.52,side*.21,1.05),(.27,.11,.12),bright)
    else:
        # A turned, hollow bell rather than a solid cone.
        profile=[(.40,.15),(.58,.14),(.76,.17),(.90,.235),(.96,.242),(.96,.196),(.82,.157),(.62,.096)]
        verts=[(x,r*math.cos(i*TAU/48),1.22+r*math.sin(i*TAU/48)) for x,r in profile for i in range(48)]
        faces=[(j*48+i,j*48+(i+1)%48,(j+1)*48+(i+1)%48,(j+1)*48+i) for j in range(len(profile)-1) for i in range(48)]
        mesh=bpy.data.meshes.new('Bell');mesh.from_pydata(verts,[],faces);mesh.update()
        ob=bpy.data.objects.new('Bell',mesh);bpy.context.collection.objects.link(ob);finish(ob,brass)
        for f in mesh.polygons:f.use_smooth=True
        cyl((.63,0,1.22),.103,.018,dark,(0,math.pi/2,0))
        ring((.956,0,1.22),.222,.025,bright,(0,math.pi/2,0))
    cyl((-.82,0,1.12),.08,.48,brass,(0,math.pi/2,0))
    for z in [.99,1.29]:ring((-1.04,0,z),.14,.056,bright,(math.pi/2,0,0))
    for y in [-.51,.51]:
        cyl((-.10,y,1.04),.16,.06,brass,(math.pi/2,0,0))
        screw=box((-.10,y*1.075,1.04),(.17,.018,.022),dark,.006);screw.rotation_euler.y=.7
    camera((4,-7,3.7),(-.07,0,.99),2.40)
    lamp((-3,-4,6),540,4,(1,.87,.68),(0,0,1))
    lamp((3,-3,2.8),215,3,(.66,.85,1),(0,0,1))
    lamp((-.2,3,4),620,2.6,(1,.76,.41),(0,0,1))
    render(name)

def cog(x,y,r,n,metal,base,phase=0):
    points=[]
    for i in range(n):
        for rel,size in [(0,.87),(.15,1),(.58,1),(.76,.87)]:
            a=(i+rel)*TAU/n+phase;points.append((x+r*size*math.cos(a),y+r*size*math.sin(a)))
    k=len(points);verts=[(a,b,z) for z in [base,base+.15] for a,b in points]
    faces=[tuple(reversed(range(k))),tuple(range(k,k*2))]+[(i,(i+1)%k,(i+1)%k+k,i+k) for i in range(k)]
    mesh=bpy.data.meshes.new("Cut gear");mesh.from_pydata(verts,[],faces);mesh.update()
    ob=bpy.data.objects.new("Wheel",mesh);bpy.context.collection.objects.link(ob);finish(ob,metal,.025)

def wheel_asset():
    setup(True,440,440)
    brass=mat('Wheel brass','b48b51',.8,.35)
    hub=mat('Bearing','43656a',.76)
    rim=mat('Rim','e1be80',.8)
    cog(0,0,1.95,30,brass,0)
    cyl((0,0,.18),1.48,.12,mat('Recess','243d42',.68))
    ring((0,0,.27),1.30,.035,rim)
    for j in range(6):
        a=j*TAU/6
        ob=box((.78*math.cos(a),.78*math.sin(a),.26),(1.6,.22,.09),brass)
        ob.rotation_euler.z=a
    cyl((0,0,.35),.37,.19,hub);cyl((0,0,.47),.19,.08,rim)
    camera((0,-.001,9),(0,0,0),4)
    lamp((-3,3,6),630,5,(1,.82,.6),(0,0,0));lamp((4,-2,5),390,5,(.6,.85,1),(0,0,0))
    render('wheel')

def backplate():
    setup(False,1440,880)
    steel=mat('Blue steel','23444e',.78,.36); brass=mat('Old brass','9d7940',.82,.38)
    bright=mat('Satin gold','c6a36c',.8,.32); black=mat('Blackened steel','162d34',.64)
    bed=mat('Midnight enamel','173d47',.33,.46)
    box((0,0,-.51),(20,13,.55),black)
    for x,y,r,n in [(-6.2,2.7,2.8,31),(-5.9,-1.8,2.1,25),(6.2,-2.8,3.1,38),(5.7,2.25,2.3,26),(-3.9,-4,1.55,21),(3.3,4.2,1.85,24)]:
        cog(x,y,r,n,brass,0)
        cyl((x,y,.14),r*.76,.16,black)
        ring((x,y,.25),r*.66,.04,bright)
        for j in range(6):
            a=j*TAU/6
            spoke=box((x+r*.39*math.cos(a),y+r*.39*math.sin(a),.24),(r*.8,r*.12,.10),brass);spoke.rotation_euler.z=a
        cyl((x,y,.35),r*.19,.19,steel);cyl((x,y,.46),r*.09,.08,bright)
    cyl((0,0,.32),4.92,.25,steel)
    cyl((0,0,.48),4.70,.19,bed)
    ring((0,0,.58),4.83,.068,brass);ring((0,0,.60),4.36,.025,brass)
    for i in range(60):
        a=i*TAU/60;r=4.56
        tick=box((r*math.cos(a),r*math.sin(a),.616),(.21 if i%5==0 else .08,.035,.017),bright,.004)
        tick.rotation_euler.z=a
    camera((0,-.01,15),(0,0,0),15)
    lamp((-5,3,8),1200,6,(1,.78,.46),(0,0,0))
    lamp((4,-3,7),670,7,(.42,.77,1),(1,0,0))
    render('movement')

for piece in ('hopper','winder','chaser','bell'):
    actor(piece)
wheel_asset()
backplate()

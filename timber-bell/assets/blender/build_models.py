"""Build Timber Bell's editable miniature models through Blender MCP.

Run in an isolated Blender MCP scene, then run render_sprites.py through the
same connection. All geometry and materials are local; no external textures.
"""
import bpy, math, random
from mathutils import Vector
from pathlib import Path
random.seed(241)
OUT=Path('C:/Users/forem/Documents/Codex/vibe-cade/timber-bell/assets/blender')
OUT.mkdir(parents=True,exist_ok=True)
for existing in list(bpy.data.objects): bpy.data.objects.remove(existing,do_unlink=True)
for existing in list(bpy.data.collections): bpy.data.collections.remove(existing)
for d in bpy.data.materials: bpy.data.materials.remove(d)

def material(name,color,metal=0,rough=.65):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
red=material('Wool · cranberry',(.46,.045,.035));darkred=material('Wool · oxblood checks',(.19,.024,.022));cream=material('Wool · cream stitching',(.88,.69,.42))
skin=material('Warm skin',(.72,.38,.20));beard=material('Walnut beard',(.17,.066,.027));hair=material('Hair highlights',(.34,.13,.047));eye=material('Eyes',(.022,.028,.021))
trouser=material('Forest canvas trousers',(.085,.17,.12));boot=material('Oiled leather boots',(.10,.055,.030));leather=material('Leather belt and grip',(.24,.10,.045));gold=material('Brass',(.72,.44,.10),.68,.28)
steel=material('Forged steel',(.48,.57,.56),.75,.25);edge=material('Honed axe edge',(.79,.84,.79),.88,.18);wood=material('Axe handle',(.45,.23,.09));bark=material('Tree · ridged bark',(.28,.12,.052));barklight=material('Bark ridges',(.39,.19,.075));barkdark=material('Bark crevices',(.105,.043,.018));cut=material('Fresh cut wood',(.70,.46,.22));ring=material('Growth rings',(.39,.19,.075));leaf=material('Fir needles',(.085,.25,.115));leaflight=material('Needle tips',(.23,.40,.17))
# Procedural, object-space relief on bark and axe handle.
for mat,scale,strength in [(bark,7.5,.24),(wood,12,.12)]:
    n=mat.node_tree.nodes;ln=mat.node_tree.links;p=n.get('Principled BSDF');tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale;tex.inputs['Detail'].default_value=4;tex.inputs['Roughness'].default_value=.72
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=strength;bump.inputs['Distance'].default_value=.12;ln.new(tex.outputs['Fac'],bump.inputs['Height']);ln.new(bump.outputs['Normal'],p.inputs['Normal'])

def put(o,name,mat,coll):
    o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    coll.objects.link(o)
    if mat:o.data.materials.append(mat)
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
    return o
def coll(name):
    c=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(c);return c
worker=coll('01 · Lumberjack and axe');tree=coll('02 · Tree segment');branches=coll('03 · Fir branch');stump=coll('04 · Cut stump')
def sphere(name,loc,scale,mat,collection):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc);o=bpy.context.object;o.scale=scale;return put(o,name,mat,collection)
def cube(name,loc,scale,mat,collection,bevel=.08):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Soft carved edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return put(o,name,mat,collection)
def rod(name,a,b,r,mat,collection,r2=None):
    a,b=Vector(a),Vector(b);v=b-a;bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=r,radius2=r if r2 is None else r2,depth=v.length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return put(o,name,mat,collection)
def torus(name,loc,major,minor,mat,collection,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=36,minor_segments=8,location=loc,major_radius=major,minor_radius=minor);o=bpy.context.object;o.rotation_euler=rotation;return put(o,name,mat,collection)
def parent_keep(o,p):
    m=o.matrix_world.copy();o.parent=p;o.matrix_world=m

# A robust, legible miniature figure in plaid wool, with modeled hands and boots.
for x in [-.20,.20]:
    cube('Canvas trouser leg',(x,0,.40),(.32,.35,.70),trouser,worker,.06)
    cube('Leather boot',(x,-.08,.10),(.36,.50,.20),boot,worker,.06)
    cube('Boot sole',(x,-.10,.035),(.38,.52,.055),barkdark,worker,.015)
    for z in [.15,.19]:rod('Boot lace',(x-.08,-.335,z),(x+.08,-.335,z),.013,cream,worker)
cube('Quilted wool jacket',(0,0,1.15),(.92,.48,.92),red,worker,.14)
for x in [-.30,-.10,.10,.30]:cube('Vertical plaid stripe',(x,-.249,1.15),(.062,.018,.75),darkred,worker,.01)
for z in [.83,1.03,1.23,1.43]:cube('Horizontal plaid stripe',(0,-.259,z),(.78,.018,.055),darkred,worker,.01)
for x in [-.19,.19]:cube('Fine cream plaid stitch',(x,-.271,1.15),(.012,.014,.74),cream,worker,.005)
cube('Leather belt',(0,-.015,.80),(.91,.52,.13),leather,worker,.03)
cube('Brass buckle',(0,-.295,.80),(.17,.035,.12),gold,worker,.015)
cube('Jacket collar',(0,-.02,1.57),(.83,.47,.16),darkred,worker,.04)
sphere('Head',(0,-.01,1.91),(.36,.31,.39),skin,worker)
sphere('Nose',(0,-.316,1.89),(.105,.10,.105),skin,worker)
for x in [-.14,.14]:
    sphere('Eye',(x,-.304,1.99),(.033,.028,.039),eye,worker)
    rod('Eyebrow',(x-.06,-.311,2.065),(x+.05,-.313,2.075),.025,beard,worker)
sphere('Full beard',(0,-.20,1.70),(.34,.20,.24),beard,worker)
for x in [-.20,-.10,0,.10,.20]:rod('Beard carving',(x,-.379,1.74),(x*.8,-.345,1.56),.018,hair,worker)
sphere('Left moustache',(-.09,-.36,1.82),(.13,.06,.06),beard,worker);sphere('Right moustache',(.09,-.36,1.82),(.13,.06,.06),beard,worker)
sphere('Wool cap',(0,.005,2.205),(.38,.33,.22),red,worker);cube('Cap brim',(0,-.07,2.13),(.77,.57,.12),darkred,worker,.05)
for i in range(8):
    a=i*math.pi/4;sphere('Cap stitching',(math.cos(a)*.27,math.sin(a)*.23-.02,2.18),(.018,.018,.018),cream,worker)
rod('Left upper sleeve',(-.42,0,1.46),(-.57,-.10,1.15),.18,red,worker);rod('Left forearm',(-.57,-.10,1.15),(-.28,-.35,1.13),.14,red,worker)
sphere('Left mitten',(-.28,-.36,1.13),(.13,.12,.12),skin,worker)
# Pivot holds the axe and right arm as a unit; each rendered pose is a true 3D rotation.
rig=bpy.data.objects.new('Axe swing pivot',None);worker.objects.link(rig);rig.location=(.38,-.05,1.45)
parts=[]
parts.append(rod('Right sleeve',(.38,-.05,1.45),(.65,-.25,1.32),.16,red,worker))
parts.append(rod('Axe hickory handle',(.49,-.31,1.18),(1.25,-.31,2.04),.052,wood,worker,r2=.036))
parts.append(sphere('Right hand',(.61,-.31,1.33),(.13,.12,.12),skin,worker))
parts.append(sphere('Grip hand',(.80,-.31,1.55),(.10,.10,.10),skin,worker))
# Forged wedge blade projects distinctly to the right of the head.
verts=[(1.15,-.39,1.97),(1.26,-.39,2.12),(1.56,-.39,2.24),(1.58,-.39,1.92),(1.15,-.21,1.97),(1.26,-.21,2.12),(1.56,-.21,2.24),(1.58,-.21,1.92)]
faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
mesh=bpy.data.meshes.new('Forged axe blade mesh');mesh.from_pydata(verts,[],faces);mesh.update();blade=bpy.data.objects.new('Forged axe blade',mesh);worker.objects.link(blade);blade.data.materials.append(steel);bev=blade.modifiers.new('Forged edge','BEVEL');bev.width=.035;bev.segments=3;blade.modifiers.new('Blade normals','WEIGHTED_NORMAL');parts.append(blade)
parts.append(rod('Bright sharpened edge',(1.57,-.40,1.92),(1.56,-.40,2.24),.021,edge,worker))
for o in parts:parent_keep(o,rig)

# Cylindrical segment, ridged bark and crisp end-caps. Rings/marks are separate
# objects so the renderer can select plain, knotted, cracked or bell log states.
rod('Tree segment',(0,0,-.38),(0,0,.38),.65,bark,tree)
for i in range(34):
    a=2*math.pi*i/34;x=.64*math.cos(a);y=.64*math.sin(a);z=(i%5-2)*.025
    rod('Raised bark furrow',(x,y,-.36+z),(x*.99,y*.99,.36-z),.018 if i%3 else .026,barklight if i%3 else barkdark,tree)
rod('Upper growth ring',(0,0,.38),(0,0,.40),.65,cut,tree)
rod('Lower growth ring',(0,0,-.40),(0,0,-.38),.65,cut,tree)
knots=[]
for i,(major,minor,mat) in enumerate([(.23,.035,barkdark),(.15,.026,cut),(.075,.023,barkdark)]):knots.append(torus('Knot ring '+str(i),(0,-.656,0),major,minor,mat,tree,(math.pi/2,0,0)))
cracks=[]
for a,b in [((-.09,-.70,.16),(.02,-.70,.04)),((.02,-.70,.04),(-.025,-.70,-.03)),((-.025,-.70,-.03),(.10,-.70,-.15))]:cracks.append(rod('Cracked knot',a,b,.022,cream,tree))
bellparts=[]
bellparts.append(cube('Bell plaque',(0,-.67,0),(.50,.07,.48),leather,tree,.04))
bellparts.append(rod('Bell crown',(0,-.73,.04),(0,-.73,.16),.11,gold,tree,r2=.07))
bellparts.append(cube('Bell rim',(0,-.73,.02),(.27,.06,.07),gold,tree,.02))
bellparts.append(sphere('Bell clapper',(0,-.76,-.045),(.045,.035,.045),gold,tree))

# Sloped bough and clusters are a separate sprite, mirrored by the 2D renderer.
rod('Main bough',(0,0,0),(1.45,0,.20),.16,bark,branches,r2=.055)
for i in range(8):
    x=.55+i*.13;z=.06+i*.018
    rod('Twig',(x,0,z),(x+.26,0,z+.26),.037,barklight,branches,r2=.012)
    sphere('Needle cluster',(x+.25,-.03,z+.25),(.22,.12,.095),leaf if i%2 else leaflight,branches)
for i in range(4):
    x=.70+i*.22;rod('Underside twig',(x,0,.10),(x+.25,0,-.05),.028,bark,branches,r2=.01)
    sphere('Underside needles',(x+.24,-.02,-.045),(.17,.10,.07),leaf,branches)

rod('Stump bark',(0,0,-.14),(0,0,.13),.83,bark,stump)
rod('Stump fresh cut',(0,0,.13),(0,0,.15),.83,cut,stump)
for r in [.20,.38,.57,.72]:torus('Stump annual ring',(0,0,.156),r,.012,ring,stump)
for i in range(28):
    a=2*math.pi*i/28;rod('Stump bark crack',(.82*math.cos(a),.82*math.sin(a),-.13),(.82*math.cos(a),.82*math.sin(a),.12),.015,barkdark,stump)

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True;scene.render.resolution_x=256;scene.render.resolution_y=256;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.world.color=(.22,.22,.22)
def area(name,loc,energy,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
area('Softbox upper left',(-4,-6,7),650,5);area('Fill upper right',(4,-3,4),360,4);area('Warm rim',(2,4,6),520,3)
camdata=bpy.data.cameras.new('Sprite orthographic camera');camera=bpy.data.objects.new('Sprite orthographic camera',camdata);scene.collection.objects.link(camera);scene.camera=camera;camdata.type='ORTHO'
camera.location=(.35,-9,3.15);camera.rotation_euler=(Vector((.35,0,1.30))-camera.location).to_track_quat('-Z','Y').to_euler();camdata.ortho_scale=3.5
for collection in (tree,branches,stump):collection.hide_viewport=True;collection.hide_render=True
scene.render.image_settings.color_mode='RGBA';bpy.context.preferences.filepaths.save_version=0
scene['purpose']='Editable Timber Bell miniature models and sprite rendering source'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'timber-bell-miniatures.blend'))
bpy.app.driver_namespace['timber_models']={'worker':worker,'tree':tree,'branches':branches,'stump':stump,'knots':knots,'cracks':cracks,'bellparts':bellparts,'rig':rig,'camera':camera}
result={'blender':bpy.app.version_string,'objects':len(bpy.data.objects),'source':str(OUT/'timber-bell-miniatures.blend'),'collections':[x.name for x in (worker,tree,branches,stump)]}

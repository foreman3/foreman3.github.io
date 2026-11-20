"""Pocket Lanes — Blender-authored scene and ball portraits. Agent Yoda.
Run: blender --background --factory-startup --python pocket-lanes/assets/build_scene.py
"""
import bpy, math, random, os, json, base64
import numpy as np
from mathutils import Vector
from pathlib import Path
OUT=Path(__file__).resolve().parent
random.seed(1964)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
bpy.context.preferences.filepaths.save_version=0

def mat(name,color,rough=.4,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
wood=[mat('Maple %02d'%i,(.42+i*.025,.24+i*.019,.095+i*.012),.22) for i in range(8)]
walnut=mat('Smoked walnut',(.075,.032,.026),.34);rubber=mat('Pit rubber',(.014,.021,.026),.76);brass=mat('Brushed champagne',(.57,.36,.14),.28,.65);wall=mat('Burgundy felt',(.12,.027,.045),.9);cream=mat('Porcelain',(.91,.86,.71),.21);red=mat('Pin red bands',(.54,.018,.028),.25);steel=mat('Gutter graphite',(.035,.05,.06),.23,.62);light=mat('Warm opal',(.98,.68,.32),.28,0,2.5);ink=mat('Lane markers',(.085,.052,.035),.6)
# Blender-authored, packed maple image: long grain, board joints and restrained varnish.
w,h=768,2048
xx,yy=np.meshgrid(np.arange(w),np.arange(h));board=np.floor(xx*39/w).astype(int);within=(xx*39/w)%1
rng=np.random.default_rng(1964);variation=rng.uniform(-.045,.045,39)[board]
grain=np.sin(xx*.7+np.sin(yy*.009+board)*2.2)*.018+np.sin(xx*2.8+yy*.002)*.007
joint=(within<.035)|(((yy+(board%4)*127)%512)<2)
image=bpy.data.images.new('Long-grain maple',width=w,height=h,alpha=True);pixels=np.ones((h,w,4),dtype=np.float32)
for c,base in enumerate([.64,.43,.215]):pixels[:,:,c]=np.clip(base+variation+grain-joint*.08,0,1)
image.pixels.foreach_set(pixels.ravel());image.filepath_raw=str(OUT/'maple.png');image.file_format='PNG';image.save();image.pack()
maple=mat('Varnished long-grain maple',(.64,.43,.215),.23);nodes=maple.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=image;maple.node_tree.links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])

static=[]
def cube(name,loc,size,material,bevel=0,collect=True):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:mod=o.modifiers.new('Soft machined edges','BEVEL');mod.width=bevel;mod.segments=3;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 if collect:static.append(o)
 return o

def sphere(name,loc,r,material,collect=False):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,radius=r,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 if collect:static.append(o)
 return o

def text(name,body,loc,size,material):
 bpy.ops.object.text_add(location=loc,rotation=(math.pi/2,0,0));o=bpy.context.object;o.name=name;o.data.body=body;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.006;o.data.bevel_depth=.002;o.data.materials.append(material);bpy.ops.object.convert(target='MESH');static.append(o)

cube('Floor',(0,8,-.25),(18,34,.25),walnut)
for lane,cx in enumerate([-4.1,0,4.1]):
 cube('Lane foundation',(cx,9.7,-.13),(3.78,23,.22),rubber)
 # A single UV surface avoids sub-pixel seams between hundreds of planks.
 mesh=bpy.data.meshes.new('Continuous maple surface');mesh.from_pydata([(cx-1.48,0,.011),(cx+1.48,0,.011),(cx+1.48,20,.011),(cx-1.48,20,.011)],[],[(0,1,2,3)]);mesh.materials.append(maple);uv=mesh.uv_layers.new(name='Board grain')
 for loop,co in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=co
 o=bpy.data.objects.new('Maple lane surface',mesh);scene.collection.objects.link(o);static.append(o)
 for side in [-1,1]:
  # Concave, modeled metal gutters rather than flat decorative strips.
  verts=[];faces=[]
  for y in [-2,20.4]:
   for j in range(17):
    a=j/16*math.pi;verts.append((cx+side*1.69+.20*math.cos(a),y,-.035-.17*math.sin(a)))
  for j in range(16):faces.append((j,j+1,j+18,j+17))
  mesh=bpy.data.meshes.new('Concave gutter');mesh.from_pydata(verts,[],faces);mesh.materials.append(steel);o=bpy.data.objects.new('Gutter',mesh);scene.collection.objects.link(o);static.append(o)
  cube('Walnut cap',(cx+side*1.96,9.2,.02),(.12,22.5,.14),walnut,.035)
  cube('Brass cap inlay',(cx+side*1.96,9.2,.098),(.018,22.5,.012),brass)
 cube('Foul line',(cx,.25,.024),(2.96,.085,.013),ink)
 cube('Pin pit',(cx,20.5,-.09),(3.72,2,.22),rubber)
 cube('Pit rear cushion',(cx,21.35,.35),(3.7,.3,.8),rubber,.07)
 for a in range(-3,4):
  x=cx+a*.28;y=5.8-abs(a)*.24
  mesh=bpy.data.meshes.new('Arrow');mesh.from_pydata([(x-.035,y-.1,.026),(x+.035,y-.1,.009),(x,y+.1,.026)],[],[(0,1,2)]);mesh.materials.append(ink);o=bpy.data.objects.new('Lane arrow',mesh);scene.collection.objects.link(o);static.append(o)
 for x in [-1,-.5,0,.5,1]:sphere('Approach dot',(cx+x,-.65,-.015),.025,ink,True)

cube('Rear wall',(0,22,2.4),(18,.3,5.5),wall)
for x in [-8,-6,-4,-2,0,2,4,6,8]:cube('Wall fluting',(x,21.78,2.3),(.055,.08,4.5),walnut,.012)
cube('Marquee shadow',(0,21.65,3.25),(9,.16,1.5),walnut,.15)
text('Pocket Lanes marquee','POCKET  LANES',(0,21.53,3.3),.72,cream)
text('Marquee small','TEN FRAMES. YOUR GAME.',(0,21.53,2.83),.18,brass)
for i,x in enumerate([-4.1,0,4.1]):
 cube('Pinsetter hood',(x,19.7,1.28),(3.65,1.8,.25),walnut,.09)
 cube('Pinsetter light',(x,18.82,1.23),(3.15,.04,.07),light,.02)
 text('Lane number '+str(i+1),str(i+1).zfill(2),(x,18.77,1.4),.18,brass)
for x in [-7.8,7.8]:
 cube('Side wall',(x,8.5,2.4),(.3,30,5.5),wall)
 for y in [0,6,12,18]:
  cube('Sconce brass',(x-math.copysign(.17,x),y,2.4),(.12,.28,.9),brass,.05)
  cube('Sconce opal',(x-math.copysign(.24,x),y,2.4),(.06,.2,.65),light,.025)
for y in [1,8,15]:
 for x in [-4.1,0,4.1]:
  cube('Ceiling pendant',(x,y,5.1),(2.7,.28,.13),walnut,.05)
  cube('Pendant diffuser',(x,y,5.025),(2.5,.19,.035),light,.012)
# Benches, return cabinet and balls are part of the Blender scene.
for x in [-5.9,5.9]:
 cube('Leather bench',(x,-1.8,.52),(1.5,3,.25),wall,.12)
 cube('Bench base',(x,-1.8,.22),(1.15,2.5,.4),walnut,.06)
 cube('Bench back',(x+math.copysign(.65,x),-1.8,.9),(.16,3,.8),wall,.08)
cube('Ball return cabinet',(2.65,-1.05,.38),(1.15,2.4,.8),walnut,.18)
for x in [2.35,2.95]:cube('Ball return rail',(x,-.9,.87),(.07,2,.07),brass,.03)

# Lathed ten-pin mesh with bands built into the same geometry/material slots.
profile=[(.07,0),(.095,.025),(.114,.10),(.108,.19),(.08,.27),(.049,.34),(.035,.39),(.034,.43),(.043,.47),(.066,.50),(.074,.55),(.066,.60),(.04,.635),(0,.646)]
verts=[];faces=[];segments=40
for r,z in profile:
 for k in range(segments):a=k/segments*math.tau;verts.append((r*math.cos(a),r*math.sin(a),z))
for j in range(len(profile)-1):
 for k in range(segments):faces.append((j*segments+k,j*segments+(k+1)%segments,(j+1)*segments+(k+1)%segments,(j+1)*segments+k))
mesh=bpy.data.meshes.new('Tournament ten-pin');mesh.from_pydata(verts,[],faces);mesh.materials.append(cream);mesh.materials.append(red)
for p in mesh.polygons:p.use_smooth=True;z=sum(mesh.vertices[i].co.z for i in p.vertices)/4;p.material_index=1 if .375<z<.415 or .43<z<.46 else 0
pid=1
for row in range(4):
 for j in range(row+1):
  o=bpy.data.objects.new('Pin_%02d'%pid,mesh);scene.collection.objects.link(o);o.location=((j-row/2)*.76,16.5+row*.66,.012);pid+=1

palette=[('straight',(.055,.27,.30),(.15,.54,.55)),('gentle',(.12,.22,.52),(.35,.57,.88)),('hook',(.55,.12,.045),(.94,.46,.095)),('snap',(.30,.065,.37),(.75,.24,.65))]
ball_objects=[]
for idx,(name,col,accent) in enumerate(palette):
 material=mat('Ball '+name,col,.16,.18);accentmat=mat('Ball pearl '+name,accent,.14,.18)
 o=sphere('Ball_'+name,(0,0,.16),.16,material);o.data.materials.append(accentmat)
 # Surface pearl swirls are modeled as alternating material regions on the real mesh.
 for p in o.data.polygons:
  a=p.center.x if p.center.length else sum(o.data.vertices[v].co.x for v in p.vertices)/len(p.vertices)
  z=sum(o.data.vertices[v].co.z for v in p.vertices)/len(p.vertices);x=sum(o.data.vertices[v].co.x for v in p.vertices)/len(p.vertices);y=sum(o.data.vertices[v].co.y for v in p.vertices)/len(p.vertices)
  if math.sin(math.atan2(y,x)*3+z*36+idx)> .48:p.material_index=1
 # Actual finger wells, not painted dots.
 for dx,dz in [(-.035,.075),(.035,.075),(0,.008)]:
  direction=Vector((dx,-.12,dz)).normalized();loc=o.location+direction*.153
  bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=.018,depth=.09,location=loc);cut=bpy.context.object;cut.rotation_euler=direction.to_track_quat('Z','Y').to_euler();bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Finger well','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cut;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cut,do_unlink=True)
 ball_objects.append(o)
 # Separate static rack ball, sharing the actual authored mesh.
 rack=bpy.data.objects.new('Return_'+name,o.data);scene.collection.objects.link(rack);rack.location=(2.65,-1.65+idx*.43,1.0);static.append(rack)
# Aiming markers are also Blender geometry, moved by the game.
bpy.ops.mesh.primitive_torus_add(major_radius=.205,minor_radius=.009,major_segments=48,minor_segments=8,location=(0,1,.025));target=bpy.context.object;target.name='Aim_target';target.data.materials.append(brass)
# Merge static objects by material to keep draw calls bounded on phones.
for o in static:
 o.select_set(False)
by_mat={}
for o in static:
 if o.type=='MESH' and len(o.data.materials)==1:by_mat.setdefault(o.data.materials[0].name,[]).append(o)
for name,objects in by_mat.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='Hall_'+name.replace(' ','_')
bpy.ops.object.select_all(action='DESELECT')
# Studio lighting and perspective camera are included in the editable .blend.
world=bpy.data.worlds.new('Pocket Lanes atmosphere');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.19,.23,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4
for loc,energy,size,color in [((0,8,7),1800,10,(1,.79,.56)),((-4,-3,5),900,7,(.6,.77,1)),((4,17,5),1300,8,(1,.86,.65))]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=energy;l.data.shape='DISK';l.data.size=size;l.data.color=color;l.rotation_euler=(Vector((0,10,0))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(1.3,-4.8,4.2));cam=bpy.context.object;cam.name='Bowler perspective';cam.rotation_euler=(Vector((0,9,.25))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=31;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'pocket-lanes.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'scene.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_materials='EXPORT',export_animations=False)
data=(OUT/'scene.glb').read_bytes();(OUT/'scene.json').write_text(json.dumps({'generator':'Blender '+bpy.app.version_string,'source':'pocket-lanes.blend','glb':base64.b64encode(data).decode('ascii')},separators=(',',':')))
# Portraits of all four authored balls: same geometry as live gameplay.
for obj in scene.objects:obj.hide_render=obj not in ball_objects and obj.type not in {'LIGHT','CAMERA'}
cam.location=(.44,-.66,.45);cam.rotation_euler=(Vector((0,0,.16))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=.44
scene.render.resolution_x=scene.render.resolution_y=192;scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.cycles.samples=24
for o,(name,_,_) in zip(ball_objects,palette):
 for p in ball_objects:p.hide_render=p!=o
 scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
print('POCKET_LANES_EXPORT_COMPLETE',len(data))

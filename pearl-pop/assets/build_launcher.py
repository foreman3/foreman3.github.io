import bpy, math, os
from mathutils import Vector

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def material(name, color, metallic=0.0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metallic; p.inputs['Roughness'].default_value=.31
    return m
shell=material('Iridescent lavender shell',(.42,.28,.48),.25)
rim=material('Pale shell ridges',(.85,.62,.72),.18)
base=material('Deep sea mount',(.08,.24,.29),.55)
def sphere(name,loc,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o
sphere('Shell body',(0,0,0), (1.65,.72,.26),shell)
sphere('Mounting hinge',(0,-.36,.24),(.38,.32,.15),base)
for i in range(-5,6):
    x=i*.26
    curve=bpy.data.curves.new('Raised shell flute','CURVE');curve.dimensions='3D';curve.bevel_depth=.027;curve.bevel_resolution=3
    spline=curve.splines.new('BEZIER');spline.bezier_points.add(2)
    for p,co in zip(spline.bezier_points,[(0,-.58,.18),(x*.58,-.05,.26),(x,.48*math.sqrt(max(0,1-(x/1.65)**2)),.12)]):
        p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    obj=bpy.data.objects.new('Shell rib %02d'%i,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(rim)
for x in [-1.22,1.22]: sphere('Pearl rivet',(x,-.25,.18),(.075,.075,.055),rim)
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.18,depth=1.05,location=(0,.47,.27),rotation=(math.pi/2,0,0))
barrel=bpy.context.object;barrel.name='Rotating launcher barrel';barrel.data.materials.append(base);bpy.ops.object.shade_smooth();barrel.hide_render=True
bpy.ops.mesh.primitive_torus_add(major_radius=.18,minor_radius=.035,location=(0,.98,.27),rotation=(math.pi/2,0,0))
barrel_rim=bpy.context.object;barrel_rim.name='Barrel mouth rim';barrel_rim.data.materials.append(rim);barrel_rim.hide_render=True
bpy.ops.object.camera_add(location=(0,0,8));cam=bpy.context.object;cam.name='Sprite camera';cam.data.type='ORTHO';cam.data.ortho_scale=3.8;bpy.context.scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(-3,4,6));bpy.context.object.data.energy=700;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.light_add(type='AREA',location=(3,-2,5));bpy.context.object.data.energy=350;bpy.context.object.data.color=(.55,.78,1)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.render.film_transparent=True
scene.render.resolution_x=512;scene.render.resolution_y=278;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
root=os.path.dirname(os.path.abspath(__file__));bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'launcher.blend'))
scene.render.filepath=os.path.join(root,'launcher.png');bpy.ops.render.render(write_still=True)
for obj in scene.objects:
    if obj.type in {'MESH','CURVE'}: obj.hide_render=obj not in (barrel,barrel_rim)
scene.render.filepath=os.path.join(root,'barrel.png');bpy.ops.render.render(write_still=True)

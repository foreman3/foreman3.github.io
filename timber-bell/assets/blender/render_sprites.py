"""Render eleven transparent sprites from the editable Timber Bell scene.

Execute via Blender MCP after build_models.py, or in Blender with the .blend
open. TIMBER_RENDER_DIR can be supplied in Blender's environment.
"""
import bpy, math, os
from pathlib import Path
from mathutils import Vector
out=Path(os.environ.get('TIMBER_RENDER_DIR','C:/Users/forem/.codex/visualizations/2026/10/29/01a1863c-6fa1-7740-a3ac-ba222254f8ea/timber-blender-renders'))
out.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene
collections={n:next(c for c in bpy.data.collections if c.name.startswith(n)) for n in ('01','02','03','04')}
camera=bpy.data.objects['Sprite orthographic camera'];scene.camera=camera
rig=bpy.data.objects['Axe swing pivot']
knots=[o for o in collections['02'].objects if o.name.startswith('Knot ring')]
cracks=[o for o in collections['02'].objects if o.name.startswith('Cracked knot')]
bellparts=[o for o in collections['02'].objects if o.name.startswith(('Bell plaque','Bell crown','Bell rim','Bell clapper'))]
def select(group):
    for name,collection in collections.items():collection.hide_render=name!=group
def view(loc,target,scale):
    camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
def visible(objects,yes):
    for obj in objects:obj.hide_render=not yes
def render(name):
    scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
select('01');view((.35,-9,3.15),(.35,0,1.30),3.5)
for i,angle in enumerate([0,.22,.44,.66,.88]):
    rig.rotation_euler[1]=angle;render('worker-'+str(i))
select('02');view((0,-9,0),(0,0,0),2.15)
endcaps=[o for o in collections['02'].objects if o.name.startswith(('Upper growth ring','Lower growth ring'))]
visible(endcaps,False)
for name,knot,crack,bell in [('log-plain',False,False,False),('log-knot',True,False,False),('log-cracked',True,True,False),('log-bell',False,False,True)]:
    visible(knots,knot);visible(cracks,crack);visible(bellparts,bell);render(name)
visible(endcaps,True)
select('03');view((.75,-9,1.8),(.75,0,.10),2.6);render('branch-right')
select('04');view((0,-8,4.8),(0,0,0),2.2);render('stump')
for collection in collections.values():collection.hide_render=False
result={'output':str(out),'files':sorted(p.name for p in out.glob('*.png')),'count':len(list(out.glob('*.png')))}

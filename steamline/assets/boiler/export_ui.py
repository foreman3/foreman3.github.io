"""Blender MCP: export aligned, front-facing layers for the live puzzle HUD.

Open steamline-boiler.blend first. Does not overwrite the editable source.
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

out = Path('C:/Users/forem/Documents/Codex/vibe-cade/steamline/assets/boiler')
scene = bpy.data.scenes['Steamline · Municipal Boiler']
bpy.context.window.scene = scene
model = bpy.data.collections['BOILER · editable parts']
parts = [o for o in model.objects if o.type in {'MESH', 'CURVE', 'FONT'}]
wheel = bpy.data.objects['Valve Wheel Rig']
wheel_parts = [o for o in parts if o.parent == wheel]
needle = bpy.data.objects['Pressure Needle · adjustable']
scene.frame_set(1)
wheel.animation_data_clear()
needle.animation_data_clear()
wheel.rotation_euler[1] = 0
needle.rotation_euler[1] = 0
cam_data = bpy.data.cameras.new('UI orthographic camera')
cam = bpy.data.objects.new('UI orthographic camera', cam_data)
scene.collection.objects.link(cam)
cam.location = (0, -9, 1.5)
cam.rotation_euler = (Vector((0, 0, 1.5))-cam.location).to_track_quat('-Z','Y').to_euler()
cam_data.type = 'ORTHO'
cam_data.ortho_scale = 4.1
scene.camera = cam
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
bpy.data.objects['Studio ground · preview only'].hide_render = True
bpy.context.view_layer.update()

def render(name, visible, active=False):
    for obj in parts:
        obj.hide_render = obj not in visible
    for mat_name, strength in [('Steam · mint pilot light', 2), ('Firebox · amber glass', 2.5)]:
        shader = bpy.data.materials[mat_name].node_tree.nodes.get('Principled BSDF')
        shader.inputs['Emission Strength'].default_value = strength if active else 0
    scene.render.filepath = str(out/name)
    bpy.ops.render.render(write_still=True)

body = [o for o in parts if o not in wheel_parts and o != needle]
render('ui-body.png', body)
render('ui-hot.png', body, True)
render('ui-wheel.png', wheel_parts)
render('ui-needle.png', [needle])

def pivot(v):
    p = world_to_camera_view(scene,cam,Vector(v))
    return [round(p.x*100,5),round((1-p.y)*100,5)]

result = {'dimensions':[512,512], 'wheelPivotPercent':pivot((0,-1.23,1.02)),
          'needlePivotPercent':pivot((0,-1.043,1.98)),
          'needleRangeDegrees':[-50,37], 'runtimeLayers':4,
          'files':{name:(out/name).stat().st_size for name in ['ui-body.png','ui-hot.png','ui-wheel.png','ui-needle.png']}}
(out/'ui-layers.json').write_text(json.dumps(result,indent=2),encoding='utf8')

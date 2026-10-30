"""Render Harbor Bastion's 2D sprite sheet from original Blender models.

Run from the game directory with:
  blender --background --python assets/build_sprites.py
"""
import bpy
import math
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "harbor-bastion-sprites.png")
WORK = os.path.join(ROOT, "_sprite-renders")
TILE = 256
COLS = 4
ROWS = 4


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def material(name, color, metallic=0.0, roughness=0.45, emission=None):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    node = m.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*color, 1)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    if emission:
        node.inputs["Emission Color"].default_value = (*emission, 1)
        node.inputs["Emission Strength"].default_value = 2.5
    return m


SAND = material("sunlit sandstone", (0.67, 0.43, 0.22), 0, 0.7)
LIME = material("warm limestone", (0.86, 0.68, 0.42), 0, 0.65)
MORTAR = material("mortar", (0.31, 0.22, 0.16), 0, 0.9)
OAK = material("aged oak", (0.17, 0.055, 0.025), 0, 0.5)
DECK = material("weathered deck", (0.42, 0.16, 0.05), 0, 0.55)
IRON = material("black iron", (0.035, 0.075, 0.09), 0.88, 0.25)
BRASS = material("brass", (0.78, 0.40, 0.07), 0.75, 0.25)
TEAL = material("harbor teal", (0.025, 0.29, 0.28), 0.15, 0.32)
CREAM = material("canvas cream", (0.96, 0.72, 0.38), 0, 0.78)
RED = material("signal red", (0.55, 0.035, 0.018), 0.05, 0.45)
BLUE = material("navy sail", (0.025, 0.10, 0.18), 0.05, 0.55)
STEEL = material("armor steel", (0.20, 0.35, 0.37), 0.75, 0.25)
MINT = material("arcane glass", (0.19, 0.86, 0.70), 0.15, 0.18, (0.15, 0.85, 0.63))
SLATE = material("slate roof", (0.06, 0.16, 0.18), 0.05, 0.65)
SHADOW = material("graphic shadow", (0.015, 0.04, 0.045), 0, 1)


def apply_mat(obj, mat):
    obj.data.materials.append(mat)
    return obj


def cube(name, loc, size, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_mat(obj, mat)
    if bevel:
        mod = obj.modifiers.new("soft edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def cylinder(name, loc, radius, depth, mat, vertices=16, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation or (0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    apply_mat(obj, mat)
    return obj


def cone(name, loc, r1, r2, depth, mat, vertices=16):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    apply_mat(obj, mat)
    return obj


def sphere(name, loc, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    apply_mat(obj, mat)
    return obj


def torus(name, loc, major, minor, mat, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=24, minor_segments=8, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    apply_mat(obj, mat)
    return obj


def roof(loc, width, depth, height, mat=RED):
    cone("roof", (loc[0], loc[1], loc[2] + height / 2), width * .78, 0, height, mat, 4)


def shadow(width=3.6, depth=2.3):
    sphere("soft contact shadow", (0, 0, -0.14), 1, SHADOW).scale = (width / 2, depth / 2, .035)


def plank_lines(z, width=2.8, length=2.1):
    for y in (-.7, -.2, .3, .8):
        cube("deck seam", (0, y, z), (width, .028, .025), MORTAR)


def mast(x, z=1.3, height=3.2, sail=CREAM, flag=RED, offset=0):
    cylinder("mast", (x, offset, z), .07, height, OAK, 12)
    cube("yard", (x, offset, z + height * .18), (1.35, .06, .06), OAK, .025)
    cube("main sail", (x + .32, offset + .025, z + height * .08), (1.18, .035, 1.55), sail, .04)
    cube("signal pennant", (x + .35, offset, z + height / 2 - .08), (.62, .035, .35), flag, .025)


def deck_sail(x, y, z, sail, trim):
    """A broad canvas panel visible from the dedicated top-down ship render."""
    cube("billowing deck sail", (x, y, z), (1.15, .92, .06), sail, .09)
    cube("sail seam", (x, y, z + .04), (1.05, .055, .035), trim, .01)
    cube("sail seam", (x, y + .27, z + .04), (1.05, .055, .035), trim, .01)


def ship(kind):
    if kind == "cutter":
        hull = cube("fast cutter hull", (0, 0, .35), (3.8, 1.05, .66), TEAL, .32)
        bow = cone("cutter pointed bow", (2.15, 0, .43), .58, 0, 1.15, TEAL);bow.rotation_euler[1] = math.pi / 2
        cube("cutter copper stripe", (0, -.55, .47), (3.3, .055, .12), BRASS)
        cube("raised deck", (-.15, 0, .7), (2.9, .82, .24), DECK, .08)
        mast(-.2, 1.35, 3.0, RED, CREAM);deck_sail(-.18, 0, 1.02, RED, CREAM)
        spar = cone("sharp bowsprit", (2.15, 0, .65), .18, 0, 1.5, OAK);spar.rotation_euler[1] = math.pi / 2
        return
    if kind == "galleon":
        cube("galleon hull", (0, 0, .42), (3.45, 1.7, .95), OAK, .38)
        bow = cone("galleon carved bow", (1.98, 0, .5), .84, 0, 1.2, OAK);bow.rotation_euler[1] = math.pi / 2
        cube("gold gun deck", (0, 0, .84), (3.0, 1.38, .34), DECK, .1)
        cube("stern castle", (-1.12, 0, 1.25), (.75, 1.35, .8), SAND, .1)
        roof((-1.12, 0, 1.6), .72, 1, .55, RED)
        mast(-.5, 1.6, 3.3, CREAM, RED);deck_sail(-.5, 0, 1.25, CREAM, RED)
        mast(.75, 1.5, 3.0, RED, CREAM);deck_sail(.75, 0, 1.18, RED, CREAM)
        for x in (-1.1, -.45, .25, .95):
            cylinder("broadside", (x, -.88, .75), .12, .35, IRON, 12, (math.pi / 2, 0, 0))
        return
    if kind == "armor":
        cube("armored hull", (0, 0, .4), (3.3, 1.55, .88), STEEL, .28)
        bow = cone("armored ram bow", (1.88, 0, .47), .78, 0, 1.15, STEEL);bow.rotation_euler[1] = math.pi / 2
        cube("steel deck", (0, 0, .82), (2.9, 1.28, .32), IRON, .08)
        for x in (-1.1, -.55, 0, .55, 1.1):
            plate = cube("riveted armor plate", (x, -.82, .56), (.44, .06, .48), STEEL, .04)
            sphere("rivet", (x, -.87, .68), .055, BRASS)
        mast(0, 1.45, 2.7, BLUE, RED);deck_sail(0, 0, 1.14, BLUE, RED)
        return
    cube("sloop hull", (0, 0, .35), (3.25, 1.35, .8), OAK, .34)
    bow = cone("sloop curved bow", (1.88, 0, .42), .68, 0, 1.08, OAK);bow.rotation_euler[1] = math.pi / 2
    cube("sloop deck", (0, 0, .76), (2.8, 1.1, .28), DECK, .08)
    cube("painted stripe", (0, -.69, .5), (2.85, .04, .15), TEAL)
    mast(0, 1.45, 3.05, CREAM, RED);deck_sail(0, 0, 1.14, CREAM, RED)
    cylinder("bow lantern", (1.55, -.4, 1.05), .11, .14, BRASS, 12)


def cannon(auto=False):
    shadow(3.4, 2.4)
    cylinder("carriage wheel", (-.72, .42, .3), .48, .16, OAK, 16, (math.pi / 2, 0, 0))
    cylinder("carriage wheel", (-.72, -.42, .3), .48, .16, OAK, 16, (math.pi / 2, 0, 0))
    cube("cannon carriage", (-.25, 0, .47), (1.6, 1.1, .35), BRASS if auto else OAK, .14)
    tube = cylinder("cannon barrel", (.42, 0, .95), .27, 2.35, IRON, 20, (0, math.pi / 2, 0))
    cylinder("muzzle", (1.58, 0, .95), .34, .22, IRON, 20, (0, math.pi / 2, 0))
    torus("barrel band", (.12, 0, .95), .29, .04, BRASS, (0, math.pi / 2, 0))
    if auto:
        sphere("captain command beacon", (-.3, 0, 1.15), .2, MINT)
        torus("command ring", (-.3, 0, 1.15), .29, .035, BRASS, (math.pi / 2, 0, 0))


def wall(rubble=False):
    if rubble:
        shadow(3.5, 2.5)
        for i, (x, y, z, angle) in enumerate(((-.9, -.1, .16, .2), (-.35, .35, .2, -.55), (.2, -.2, .16, .4), (.82, .2, .24, -.3), (1.2, -.25, .14, .6))):
            block = cube("fallen stone", (x, y, z), (.7, .55, .32), LIME if i % 2 else SAND, .08)
            block.rotation_euler[2] = angle
        return
    # This is a true tile, not a freestanding prop: its base fills the entire
    # render frame and staggered stones run beyond each edge for seamless joins.
    cube("continuous mortar bed", (0, 0, .10), (6.08, 6.08, .24), MORTAR)
    for row in range(5):
        offset = -.48 if row % 2 else 0
        for col in range(5):
            cube("edge-to-edge masonry", (-2.4 + col * 1.2 + offset, -2.4 + row * 1.2, .30), (1.16, 1.16, .23), LIME if (row + col) % 3 else SAND, .045)


def keep():
    shadow(4.1, 3.2)
    cube("keep hall", (0, 0, .8), (3.1, 2.45, 1.65), SAND, .12)
    for x in (-1.25, 1.25):
        cube("keep tower", (x, 0, 1.35), (.72, .86, 2.7), LIME, .09)
        for dx in (-.22, .22): cube("keep merlon", (x + dx, 0, 2.82), (.23, .86, .34), LIME, .04)
    cube("gate arch", (0, -1.27, .63), (.7, .05, .92), OAK, .2)
    roof((0, 0, 1.85), 1.0, 1.1, .75, RED)
    cylinder("flag pole", (1.25, 0, 3.4), .035, 1.15, OAK, 10)
    cube("keep pennant", (1.55, 0, 3.73), (.55, .04, .32), RED, .02)


def tower():
    shadow(3.6, 2.8)
    cube("battery stonework", (0, 0, .8), (2.7, 2.05, 1.65), LIME, .12)
    for x in (-.95, -.32, .32, .95): cube("battery merlon", (x, 0, 1.82), (.34, 2.05, .42), SAND, .05)
    cannon(False)


def mage():
    shadow(3.4, 2.8)
    cube("mage tower", (0, 0, .9), (2.05, 1.95, 2.05), SLATE, .12)
    cone("mage roof", (0, 0, 2.33), 1.35, 0, 1.45, TEAL, 4)
    sphere("levitating crystal", (0, -1.0, 2.7), .35, MINT)
    for radius in (.5, .72): torus("arcane halo", (0, -1.0, 2.7), radius, .035, BRASS, (math.pi / 2.3, 0, 0))
    cube("mage door", (0, -1.0, .52), (.48, .05, .72), MINT, .04)


def captain():
    shadow(3.4, 2.8)
    cube("captain quarters", (0, 0, .68), (2.65, 2.0, 1.35), SAND, .11)
    roof((0, 0, 1.42), 1.15, 1.15, .9, RED)
    cube("chart table", (0, -1.05, 1.16), (1.05, .14, .44), OAK, .04)
    torus("brass compass", (0, -1.14, 1.22), .22, .055, BRASS, (math.pi / 2, 0, 0))
    cylinder("signal mast", (1.04, 0, 2.45), .045, 1.15, OAK, 10)
    cube("captain flag", (1.3, 0, 2.8), (.5, .04, .3), RED, .02)


def workshop():
    shadow(3.6, 2.8)
    cube("workshop", (0, 0, .72), (2.75, 2.1, 1.45), OAK, .12)
    roof((0, 0, 1.55), 1.22, 1.18, .85, SLATE)
    cube("smokestack", (.88, .15, 2.42), (.36, .42, 1.45), SAND, .06)
    cylinder("forge glow", (-.35, -1.08, .72), .32, .1, BRASS, 16, (math.pi / 2, 0, 0))
    for z in (.8, 1.22): torus("forge gear", (.65, -1.08, z), .32, .08, BRASS, (math.pi / 2, 0, 0))


FACTORIES = [lambda: ship("sloop"), lambda: ship("armor"), lambda: ship("cutter"), lambda: ship("galleon"), lambda: cannon(False), lambda: cannon(True), lambda: wall(False), lambda: wall(True), keep, tower, mage, captain, workshop, lambda: None, lambda: None, lambda: None]


def set_view(camera, location, target, scale):
    camera.location = location
    camera.data.ortho_scale = scale
    track(camera, target)


def setup_renderer():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = TILE
    scene.render.resolution_y = TILE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.render.image_settings.color_depth = "8"
    scene.world.color = (0.02, 0.035, 0.04)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.object.camera_add(location=(6.7, -8.7, 6.2))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    scene.camera = camera
    set_view(camera, (6.7, -8.7, 6.2), (0, 0, 1.15), 6.0)
    for loc, energy, color, size in (((4, -5, 8), 1200, (1.0, .62, .31), 5), ((-5, -3, 5), 900, (.26, .58, .80), 4), ((0, 0, 11), 1100, (1.0, .84, .56), 5)):
        bpy.ops.object.light_add(type="AREA", location=loc)
        light = bpy.context.object
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        track(light, (0, 0, .8))
    return camera


def track(obj, point):
    direction = mathutils.Vector(point) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def wipe_models():
    for obj in list(bpy.context.scene.objects):
        if obj.type not in {"CAMERA", "LIGHT"}:
            bpy.data.objects.remove(obj, do_unlink=True)


def compose_sheet(paths):
    width, height = TILE * COLS, TILE * ROWS
    result = [0.0] * (width * height * 4)
    for index, path in enumerate(paths):
        if not path:
            continue
        image = bpy.data.images.load(path, check_existing=False)
        pixels = list(image.pixels[:])
        col, row = index % COLS, index // COLS
        for y in range(TILE):
            src = y * TILE * 4
            dst_y = (ROWS - 1 - row) * TILE + y
            dst = (dst_y * width + col * TILE) * 4
            result[dst:dst + TILE * 4] = pixels[src:src + TILE * 4]
        bpy.data.images.remove(image)
    sheet = bpy.data.images.new("Harbor Bastion Blender Sprite Sheet", width=width, height=height, alpha=True)
    sheet.pixels = result
    sheet.filepath_raw = OUT
    sheet.file_format = "PNG"
    sheet.save()


def main():
    import shutil
    import mathutils
    globals()["mathutils"] = mathutils
    shutil.rmtree(WORK, ignore_errors=True)
    os.makedirs(WORK, exist_ok=True)
    clear_scene()
    camera = setup_renderer()
    paths = []
    for index, factory in enumerate(FACTORIES):
        wipe_models()
        if index < 4:
            # Nearly top-down produces a rotation-neutral silhouette: bow is +X.
            set_view(camera, (0, -0.75, 10.6), (0, 0, .55), 6.3)
        elif index in (6, 7):
            set_view(camera, (0, 0, 10.4), (0, 0, .20), 6.0)
        else:
            set_view(camera, (6.7, -8.7, 6.2), (0, 0, 1.15), 6.0)
        factory()
        if index > 12:
            paths.append(None)
            continue
        path = os.path.join(WORK, f"sprite-{index:02}.png")
        bpy.context.scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        paths.append(path)
    compose_sheet(paths)
    print(f"Rendered {OUT}")


if __name__ == "__main__":
    main()

"""Pack Blender's RGBA exports into one lossless WebP sheet. Requires Pillow.

python pack_assets.py RENDER_DIRECTORY [OUTPUT_DIRECTORY]
Images are never rescaled, recolored, or synthesized during packing.
"""
import sys
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

source=Path(sys.argv[1])
out=Path(sys.argv[2]) if len(sys.argv)>2 else Path(__file__).resolve().parent
frames=json.loads((source/'frames.json').read_text(encoding='utf8'))
size=192
columns=8
atlas=Image.new('RGBA',(size*columns,size*3))
summary={}
for i,(name,entry) in enumerate(frames.items()):
    image=Image.open(source/(name+'.png')).convert('RGBA')
    assert image.size==(size,size),name
    alpha=image.getchannel('A')
    bounds=alpha.getbbox()
    assert alpha.getextrema()==(0,255) and bounds,name
    assert bounds[0]>1 and bounds[1]>1 and bounds[2]<size-1 and bounds[3]<size-1,('clipped',name,bounds)
    if 'heading' in entry:
        a=entry['heading']*math.tau/8
        expected=((math.cos(a)-math.sin(a))*.82,(math.cos(a)+math.sin(a))*.46)
        aim=entry['aim']
        dot=sum(p*q for p,q in zip(expected,aim))/(math.hypot(*expected)*math.hypot(*aim))
        assert dot>.999,('wrong cannon heading',name,dot)
    x=i%columns*size
    y=i//columns*size
    atlas.paste(image,(x,y))
    entry.update({'rect':[x,y,size,size],'bounds':list(bounds)})
    summary[name]={'alpha':list(alpha.getextrema()),'bounds':list(bounds)}
atlas.save(out/'miniatures.webp',lossless=True,exact=True,method=6)
decoded=Image.open(out/'miniatures.webp').convert('RGBA')
assert decoded.tobytes()==atlas.tobytes(),'Lossless sheet differs from rendered PNGs'
(out/'atlas.json').write_text(json.dumps({'version':1,'tile':size,'size':list(atlas.size),'sprites':frames},indent=2)+'\n',encoding='utf8')
(out/'verify-assets.json').write_text(json.dumps({'sprites':summary,'dimensions':list(atlas.size),'bytes':(out/'miniatures.webp').stat().st_size,'losslessRoundTrip':True},indent=2)+'\n',encoding='utf8')
# Review sheet belongs with test artifacts rather than the shipped runtime.
sheet=Image.new('RGB',(size*columns,(size+26)*3),(171,189,199))
draw=ImageDraw.Draw(sheet)
for i,(name,entry) in enumerate(frames.items()):
    tile=atlas.crop((entry['rect'][0],entry['rect'][1],entry['rect'][0]+size,entry['rect'][1]+size))
    x=i%columns*size
    y=i//columns*(size+26)
    sheet.paste(tile,(x,y),tile)
    draw.text((x+9,y+size+4),name,fill=(20,42,57))
sheet.save(source/'asset-review.png')
print(json.dumps({'sprites':len(frames),'bytes':(out/'miniatures.webp').stat().st_size,'sheet':str(source/'asset-review.png')}))

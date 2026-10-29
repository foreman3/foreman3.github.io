"""Pack transparent Blender renders into one verified lossless WebP atlas."""
from PIL import Image
from pathlib import Path
import json, sys
source=Path(sys.argv[1] if len(sys.argv)>1 else 'C:/Users/forem/.codex/visualizations/2026/10/29/01a1863c-6fa1-7740-a3ac-ba222254f8ea/timber-blender-renders')
out=Path(__file__).resolve().parent.parent
names=[f'worker-{i}' for i in range(5)]+['log-plain','log-knot','log-cracked','log-bell','branch-right','stump']
sheet=Image.new('RGBA',(1024,768),(0,0,0,0));meta={}
for i,name in enumerate(names):
    image=Image.open(source/(name+'.png')).convert('RGBA')
    assert image.size==(256,256),(name,image.size)
    alpha=image.getchannel('A');bbox=alpha.getbbox()
    assert bbox and min(bbox[:2])>0 and max(bbox[2:])<256,(name,bbox)
    x=(i%4)*256;y=(i//4)*256;sheet.paste(image,(x,y))
    meta[name]={'cell':[x,y,256,256],'bounds':[x+bbox[0],y+bbox[1],bbox[2]-bbox[0],bbox[3]-bbox[1]]}
    # Transparent source and a nontrivial opaque center are required.
    assert alpha.getextrema()==(0,255),(name,alpha.getextrema())
target=out/'timber-sprites.webp';sheet.save(target,format='WEBP',lossless=True,method=6,exact=True)
decoded=Image.open(target).convert('RGBA');assert decoded.tobytes()==sheet.tobytes(),'atlas must round-trip losslessly'
(out/'blender'/'atlas.json').write_text(json.dumps({'sheet':'../timber-sprites.webp','width':1024,'height':768,'sprites':meta},indent=2)+'\n',encoding='utf8')
print(json.dumps({'path':str(target),'bytes':target.stat().st_size,'sprites':meta},indent=2))

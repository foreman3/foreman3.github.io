import {HEIGHT,GATE_WIDTH,gateY} from './flight.js';

const palettes = {
  dawn:['#f6c99b','#729ca2',null], day:['#bfdedf','#6096a1','#76d2ed22'],
  mist:['#d0d5ca','#648d91','#d6e6dc60'], amber:['#e8aa77','#797686','#e97f3e42'],
  squall:['#839ca6','#415f72','#2d526b88'], blue:['#7584a0','#3b526f','#253d70aa'],
  night:['#444761','#243f58','#17264ccc']
};
const image = new Image();
image.src = new URL('./coast.webp',import.meta.url).href;
export const sceneryReady = image.decode().catch(()=>{});
const skies=new Map();
function background(kind) {
  if(!image.naturalWidth) return null;
  if(skies.has(kind)) return skies.get(kind);
  const layer=document.createElement('canvas');
  layer.height=HEIGHT; layer.width=Math.round(image.naturalWidth*HEIGHT/image.naturalHeight);
  const p=layer.getContext('2d');p.drawImage(image,0,0,layer.width,HEIGHT);
  const wash=palettes[kind][2];
  if(wash){p.fillStyle=wash;p.fillRect(0,0,layer.width,HEIGHT);}
  if(['blue','night'].includes(kind)){
    for(let i=0;i<65;i++){
      const x=(i*223.7)%layer.width,y=(i*i*13.5+17)%154;
      p.fillStyle=i%4?'#fff1d299':'#fff4d9';p.fillRect(x,y,i%4?1:2,i%4?1:2);
    }
  }
  skies.set(kind,layer);return layer;
}

function polygon(p,points,fill,stroke) {
  p.beginPath();p.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)p.lineTo(points[i],points[i+1]);
  p.closePath();p.fillStyle=fill;p.fill();
  if(stroke){p.strokeStyle=stroke;p.stroke();}
}
function oval(p,x,y,rx,ry,fill) {
  p.beginPath();p.ellipse(x,y,rx,ry,0,0,Math.PI*2);p.fillStyle=fill;p.fill();
}

function bird(p,x,y,f) {
  p.save();p.translate(x,y);p.rotate(Math.max(-.32,Math.min(.58,f.vy/770)));
  if(f.shield || f.grace){
    p.beginPath();p.arc(0,0,24,0,Math.PI*2);
    p.fillStyle='#f3ffd926';p.fill();p.strokeStyle=f.grace?'#fff7dd':'#e0ffea';p.lineWidth=2;p.stroke();
    p.beginPath();p.arc(0,0,27,3.4,4.7);p.stroke();
  }
  const lift=Math.sin(Math.min(1,f.flapAge/.28)*Math.PI)*15;
  p.lineWidth=1.5;
  polygon(p,[-11,-1,-28,-9,-23,1,-28,6,-10,5],'#173849','#f3dcaf');
  oval(p,-1,1,16,11,'#19394a');oval(p,2,5,13,7,'#f4e3be');
  polygon(p,[-9,1,-24,5-lift,-20,-2-lift,-13,-5-lift,2,-4],'#336575','#163449');
  polygon(p,[-12,-1,-20,-1-lift,-16,-1-lift],'#8da69a');
  oval(p,10,-6,9,9,'#273f49');oval(p,12,-4,6.7,6,'#fff1d2');
  polygon(p,[16,-7,24,-2,17,0],'#eb962f','#563d32');
  oval(p,13,-6,2.6,2.6,'#203640');oval(p,13.8,-6.7,.9,.9,'#fff9dc');
  polygon(p,[0,-1,7,1,8,4,-2,3,-15,8,-21,6,-10,2],'#ca523e','#823c34');
  polygon(p,[-6,6,2,7,1,13,-7,12],'#e2b260','#593f31');
  p.restore();
}

export function postalPortrait(canvas) {
  const p=canvas.getContext('2d');
  p.scale(4.5,4.5);
  bird(p,34,24,{vy:-48,flapAge:.12});
}

function beacon(p,x,tip,upper,number,night){
  const length=upper?tip:HEIGHT-tip;
  p.save();p.translate(x,tip);if(upper)p.scale(1,-1);
  const half=GATE_WIDTH/2;
  p.fillStyle='#183847';p.fillRect(-half+3,10,GATE_WIDTH-6,length);
  p.fillStyle='#32616c';p.fillRect(-half+6,11,10,length);
  p.fillStyle='#264957';p.fillRect(2,11,9,length);
  p.fillStyle='#c7bb91';p.fillRect(-half+5,15,2,length);
  // Enamel bands and riveted seams make the full collision column readable.
  for(let y=35;y<length;y+=51){
    polygon(p,[-half+4,y+6,half-4,y-6,half-4,y+4,-half+4,y+16],'#d8c49e');
    polygon(p,[-half+4,y+11,half-4,y-1,half-4,y+3,-half+4,y+15],'#bb5946');
    p.fillStyle='#142e3c';p.fillRect(-half+3,y+28,GATE_WIDTH-6,2);
  }
  p.fillStyle='#142f3b';p.fillRect(-half,2,GATE_WIDTH,12);
  p.fillStyle='#e5c080';p.fillRect(-half+2,0,GATE_WIDTH-4,4);
  p.fillStyle='#dd7950';p.fillRect(-half+3,6,GATE_WIDTH-6,4);
  p.fillStyle=night?'#fff4ae':'#ffe6a0';for(let k=-1;k<=1;k++)p.fillRect(k*10-3,5,6,4);
  if(!upper && length>80){
    p.fillStyle='#f1deaf';p.fillRect(-12,17,24,13);p.fillStyle='#233c49';
    p.font='bold 10px monospace';p.textAlign='center';p.fillText(String(number+1).padStart(2,'0'),0,27);
  }
  p.restore();
}

function stamp(p,x,y,t) {
  p.save();p.translate(x,y);p.rotate(.12*Math.sin(t*2));
  p.fillStyle='#233f49';p.fillRect(-13,-13,26,28);
  p.fillStyle='#fff2cf';p.fillRect(-12,-14,24,26);
  p.strokeStyle='#fff2cf';p.lineWidth=3;p.setLineDash([2.4,2.6]);p.strokeRect(-12.5,-14,25,26);p.setLineDash([]);
  p.fillStyle='#bd4e37';p.fillRect(-9,-11,18,20);
  polygon(p,[-7,4,-2,0,-7,-5,-1,-3,6,-7,2,-1,7,0,1,2,-3,6],'#fff0c6');
  p.restore();
}

export function paint(p,f,width,fx,reduced){
  const sky=f.route.sky, colors=palettes[sky];
  p.fillStyle=colors[0];p.fillRect(0,0,width,HEIGHT);
  const bg=background(sky);
  if(bg){
    const w=Math.max(width*1.12,bg.width),offset=reduced ? 0 : Math.min(w-width,f.distance*.065);
    p.drawImage(bg,-offset,0,w,HEIGHT);
  }else{p.fillStyle=colors[1];p.fillRect(0,HEIGHT*.73,width,HEIGHT*.27);}
  const night=['blue','night','squall'].includes(sky);
  if(!reduced && (sky==='mist'||sky==='squall')){
    p.lineWidth=1;p.strokeStyle=sky==='mist'?'#f7f1dc65':'#dde8ec60';p.beginPath();
    for(let i=0;i<28;i++){
      const x=width-((i*97+f.distance*(sky==='mist'?.3:1.8))%(width+50));
      const y=sky==='mist'?115+i*41%280:(i*67+f.time*220)%HEIGHT;
      p.moveTo(x,y);p.lineTo(x+(sky==='mist'?29:-6),y+(sky==='mist'?0:7));
    }
    p.stroke();
  }
  const birdX=width*.23;
  for(const g of f.gates){
    const x=birdX+g.at-f.distance;if(x < -35 || x>width+35)continue;
    const cy=gateY(f,g),top=cy-f.route.gap/2,bottom=cy+f.route.gap/2;
    if(night){polygon(p,[x-16,bottom,x+16,bottom,x+49,bottom-25,x-48,bottom-25],'#ffe4a324');}
    beacon(p,x,top,true,g.i,night);beacon(p,x,bottom,false,g.i,night);
    if(!g.stamp && !g.passed)stamp(p,x,cy+g.offset,f.time+g.i);
  }
  for(const e of fx){
    const t=e.age/e.life;
    p.globalAlpha=1-t; p.fillStyle=e.color;
    p.fillRect(birdX+e.x+e.dx*t,e.y+e.dy*t+18*t*t,e.size,e.size*.6);
  }
  p.globalAlpha=1;
  bird(p,birdX,f.y,f);
  p.fillStyle='#183a4c88';p.fillRect(0,HEIGHT-3,width,3);
}

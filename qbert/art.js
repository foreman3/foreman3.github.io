import {position,numberAt,forecast,adjacent,steps} from './movement.js';
const sprites = {};
export const artwork = Promise.all(['hopper','winder','chaser','bell','wheel','movement'].map(async name=>{
  const img=new Image();img.src=new URL('./art/'+name+'.webp',import.meta.url);await img.decode();sprites[name]=img;
}));
export function layout(s,w,h){
  const n=s.spec.rows;
  const tile=Math.min(w*.89/(n+.55),h*.88/(n*.57+1.0),h*.255);
  const height=(n-1)*.57*tile;
  return {tile,cx:w/2,top:(h-height)/2+.12*tile};
}
function pos(id,l){
  const {r,c}=position(id);
  return {x:l.cx+(c-r/2)*l.tile,y:l.top+r*l.tile*.57};
}
function liftPos(side,s,l){
  const r=s.spec.rows-2,base=pos(numberAt(r,side?r:0),l);
  return {x:base.x+(side?.5:-.5)*l.tile,y:base.y-.57*l.tile};
}
function poly(p,pts,fill,stroke){
  p.beginPath();p.moveTo(pts[0],pts[1]);
  for(let i=2;i<pts.length;i+=2)p.lineTo(pts[i],pts[i+1]);
  p.closePath();p.fillStyle=fill;p.fill();
  if(stroke){p.strokeStyle=stroke;p.stroke();}
}
function ellipse(p,x,y,rx,ry,color){
  p.beginPath();p.ellipse(x,y,rx,ry,0,0,Math.PI*2);p.fillStyle=color;p.fill();
}
function diamond(p,x,y,w,h,fill,stroke){poly(p,[x,y-h,x+w,y,x,y+h,x-w,y],fill,stroke);}
function block(p,tile,warning,neighbor,flash){
  const lit=tile.charge===tile.need;
  p.lineWidth=.012;
  poly(p,[-.49,0,0,.215,0,.55,-.49,.33],lit?'#916135':'#304c54','#193438');
  poly(p,[0,.215,.49,0,.49,.33,0,.55],lit?'#784629':'#1b333d','#122832');
  poly(p,[-.48,.24,0,.45,0,.49,-.48,.28],lit?'#cf9750':'#53727a');
  poly(p,[0,.45,.48,.24,.48,.28,0,.49],lit?'#ac7335':'#43595f');
  diamond(p,0,0,.49,.218,lit?'#efba6a':'#89958b','#292e2c');
  diamond(p,0,-.014,.43,.178,lit?'#f6cf87':tile.charge?'#78a5a0':'#486b70',lit?'#fff1aa':'#acb6a5');
  if(flash>0)diamond(p,0,-.014,.42,.17,'rgba(255,245,179,'+flash*.65+')');
  for(let k=0;k<tile.need;k++){
    const x=(k-(tile.need-1)/2)*.135;
    ellipse(p,x,-.016,.059,.033,lit?'#9e743e':'#25444c');
    ellipse(p,x,-.023,.041,.021,k<tile.charge?'#fff5b9':'#a1b0a3');
  }
  if(tile.ratchet)poly(p,[-.072,.084,.072,.084,0,.034],'#843c30');
  if(neighbor)diamond(p,0,.135,.031,.014,'#f6e4ad');
  if(warning){
    diamond(p,0,-.02,.38,.15,'#9e40513f','#ff97a2');p.strokeStyle='#ffe2da';p.lineWidth=.024;
    p.beginPath();p.moveTo(-.09,-.07);p.lineTo(.09,.02);p.moveTo(.09,-.07);p.lineTo(-.09,.02);p.stroke();
  }
}
function actor(p,name,x,y,t,face=1,scale=1){
  const size=t*.84*scale,im=sprites[name];
  ellipse(p,x,y,t*.19*scale,t*.054*scale,'#0c1b2580');
  if(!im){ellipse(p,x,y-size*.33,size*.34,size*.33,name==='hopper'?'#ff963f':'#c95c9e');return;}
  p.save();p.translate(x,y);p.scale(face,1);p.drawImage(im,-size*.5,-size*.894,size,size);p.restore();
}
// The orthographic backplate is 15 Blender units wide. The dial masks the
// inner half of each wheel, just as it does in the assembled mechanism.
const wheels=[[-6.2,2.7,2.8,1],[-5.9,-1.8,2.1,-1],[6.2,-2.8,3.1,1],[5.7,2.25,2.3,-1],[-3.9,-4,1.55,1],[3.3,4.2,1.85,1]];
function mechanism(p,w,h,tick){
  if(!sprites.wheel||!sprites.movement)return;
  const unit=Math.max(w/15,h/(15*880/1440));
  p.save();p.fillStyle='#15292e';p.fillRect(0,0,w,h);p.translate(w/2,h/2);p.scale(unit,unit);
  for(const [x,y,r,dir] of wheels){
    p.save();p.translate(x,-y);p.rotate(dir*tick*.18/r);
    const size=r*4/1.95;p.drawImage(sprites.wheel,-size/2,-size/2,size,size);p.restore();
  }
  p.beginPath();p.arc(0,0,4.92,0,Math.PI*2);p.clip();
  const depth=15*880/1440;p.drawImage(sprites.movement,-7.5,-depth/2,15,depth);p.restore();
}
function lift(p,side,s,l){
  const a=liftPos(side,s,l),t=l.tile;
  ellipse(p,a.x,a.y+.035*t,t*.32,t*.142,'#392d2a');
  ellipse(p,a.x,a.y,t*.32,t*.142,'#e0ab5d');ellipse(p,a.x,a.y-.022*t,t*.25,t*.096,'#6a4336');
  ellipse(p,a.x,a.y-.022*t,t*.21,t*.071,'#ffe5a0');
  p.fillStyle='#604425';p.textAlign='center';p.textBaseline='middle';p.font='bold '+t*.11+'px monospace';p.fillText('LIFT',a.x,a.y-.023*t);
}
export function pick(s,l,x,y){
  for(const [i,available] of s.lifts.entries())if(available){
    const a=liftPos(i,s,l);
    if(Math.hypot((x-a.x)/(.35*l.tile),(y-a.y)/(.17*l.tile))<1)return {lift:i};
  }
  for(let id=s.tiles.length-1;id>=0;id--){
    const a=pos(id,l);
    if(Math.abs(x-a.x)/(.5*l.tile)+Math.abs(y-a.y)/(.245*l.tile)<1.03)return {id};
  }
  return null;
}
export function paint(p,s,w,h,l,anim,face){
  p.clearRect(0,0,w,h);
  const t=l.tile, u=anim?Math.min(1,anim.elapsed/anim.duration):1,curve=Math.sin(Math.PI*u);
  // The hand advances one division per input, including the return stroke of a rewind.
  const tick=s.hops+(anim?(anim.kind==='rewind'?1:-1)*(1-u):0);
  mechanism(p,w,h,tick);
  p.save();p.translate(w/2,h/2);p.rotate(tick*Math.PI/30);
  poly(p,[-2,0,-3,-h*.31,0,-h*.40,3,-h*.31,2,0],'#c6a47550');p.restore();
  const danger=forecast(s), imminent=s.beat===s.spec.beat-1;
  const nearby=Object.keys(steps).map(d=>adjacent(s,s.at,d));
  s.tiles.forEach((tile,id)=>{
    const a=pos(id,l);p.save();p.translate(a.x,a.y);p.scale(t,t);
    block(p,tile,imminent&&danger.includes(id),nearby.includes(id),anim?.to===id?curve:0);p.restore();
  });
  s.lifts.forEach((available,i)=>{if(available)lift(p,i,s,l);});
  s.enemies.forEach((e,i)=>{
    const a=pos(e.at,l),old=anim?.patrol?.[i]??e.at,b=pos(old,l);
    const moving=e.at!==old;
    actor(p,e.type==='rim'?'winder':e.type,b.x+(a.x-b.x)*u,b.y+(a.y-b.y)*u-(moving?curve*t*.30:0),t,-1,e.type==='chaser'?.86:.72);
  });
  let a=pos(s.at,l),scale=1;
  if(anim){
    const b=pos(anim.from,l);
    if(anim.kind==='lift'){
      const mid=liftPos(anim.direction==='ne'?1:0,s,l);
      const v=Math.min(1,u/.38),z=Math.max(0,(u-.38)/.62);
      a={x:b.x+(mid.x-b.x)*v+(a.x-mid.x)*z,y:b.y+(mid.y-b.y)*v+(a.y-mid.y)*z-t*.38*curve};
    }else if(anim.kind==='fall'||anim.kind==='hit'){
      if(u<.72){
        const v=u/.72,delta=steps[anim.direction];
        a={x:b.x+(delta[1]-delta[0]/2)*t*v,y:b.y+delta[0]*t*.57*v+(anim.kind==='fall'?v*v*t*.82:0)-Math.sin(v*Math.PI)*t*.32};
        scale=1-v*.74;
      }else scale=(u-.72)/.28;
    }else{
      a={x:b.x+(a.x-b.x)*u,y:b.y+(a.y-b.y)*u-curve*t*.40};
    }
  }
  actor(p,'hopper',a.x,a.y,t,face,scale);
}

/* Cached brass instrument scenery; all moving actors use small, unfiltered paths. */
(() => {
 'use strict';
 const TAU=Math.PI*2,CX=480,CY=386,R=246,INNER=44,N=12;
 const point=(lane,p)=>{const a=(lane/N)*TAU-Math.PI/2,r=INNER+(R-INNER)*p;return{x:CX+Math.cos(a)*r,y:CY+Math.sin(a)*r,a};};
 function path(ctx,points,fill,stroke,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
 function circle(ctx,x,y,r,fill,stroke,width=1){ctx.beginPath();ctx.arc(x,y,r,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
 function background(level){const c=document.createElement('canvas');c.width=960;c.height=720;const g=c.getContext('2d');const grad=g.createRadialGradient(CX,CY,30,CX,CY,520);grad.addColorStop(0,'#120f1e');grad.addColorStop(.6,level%2?'#332232':'#302439');grad.addColorStop(1,'#211724');g.fillStyle=grad;g.fillRect(0,0,960,720);
  // Observatory panelling and engraved corners.
  g.strokeStyle='#765044';g.lineWidth=1;g.strokeRect(18,78,924,612);g.strokeRect(27,87,906,594);
  // Etched constellations and machined ring seats, cached once per depth.
  for(let i=0;i<80;i++){const x=40+(i*137%880),y=118+(i*83%525);if(Math.hypot(x-CX,y-CY)<R+12)continue;g.fillStyle=i%3?'#b18b6a55':'#eac9a580';g.fillRect(x,y,i%3?1:2,2);}
  for(let i=0;i<12;i++){const p=point(i+.5,1.12);circle(g,p.x,p.y,7,'#2e1d2c','#8e604c',2);circle(g,p.x,p.y,3,'#d6a576','#efcba5');}
  for(const radius of [R+45,R+49])circle(g,CX,CY,radius,null,'#9b6c4b44');
  for(const x of [44,916])for(const y of [104,660]){circle(g,x,y,6,'#a96d51','#efc49a');circle(g,x,y,2,'#342132');}
  g.fillStyle='#d3a382';g.font='12px Georgia';g.textAlign='center';g.fillText('THE COPPER OBSERVATORY',CX,98);
  for(let i=0;i<48;i++){const a=i/48*TAU,p=point(i/4,1.13),q=point(i/4,i%4===0?1.18:1.15);g.strokeStyle=i%4===0?'#cf9a74':'#72554f';g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke();}
  for(let lane=0;lane<N;lane++){const a=point(lane-.5,1),b=point(lane+.5,1),c=point(lane+.5,0),d=point(lane-.5,0);path(g,[[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],lane%2?'#42283677':'#261d31aa','#947164',1);const p=point(lane,1.07);g.fillStyle='#d7aa88';g.font='12px monospace';g.fillText(String(lane+1).padStart(2,'0'),p.x,p.y+4);}
  for(const t of [0,.18,.38,.63,1]){g.beginPath();for(let i=0;i<=N;i++){const p=point(i-.5,t);i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);}g.strokeStyle=t===1?'#e5a76f':'#9a73665e';g.lineWidth=t===1?5:1;g.stroke();}
  circle(g,CX,CY,28,'#10101a','#bb7956',2);circle(g,CX,CY,16,'#422937','#dfa779',1);path(g,[[CX,CY-13],[CX+10,CY],[CX,CY+13],[CX-10,CY]],'#ca8861','#f4cb9d');
  for(const [x,name]of [[102,'WEST'],[858,'EAST']]){g.save();g.translate(x,CY);g.fillStyle='#422936';g.strokeStyle='#8f6554';g.lineWidth=2;g.fillRect(-43,-93,86,186);g.strokeRect(-43,-93,86,186);g.fillStyle='#d6a581';g.textAlign='center';g.font='11px Georgia';g.fillText(name,0,-66);circle(g,0,-14,30,'#251d2a','#b07d5d',2);for(let i=0;i<12;i++){const a=i/12*TAU;g.beginPath();g.moveTo(Math.cos(a)*25,-14+Math.sin(a)*25);g.lineTo(Math.cos(a)*29,-14+Math.sin(a)*29);g.stroke();}g.beginPath();g.moveTo(0,-14);g.lineTo(-12,-32);g.strokeStyle='#f2c997';g.stroke();g.fillStyle='#b98665';g.font='10px monospace';g.fillText('DEPTH '+level,0,62);g.restore();}
  return c;
 }
 function actor(g,e,time){const p=point(e.lane,e.p);g.save();g.translate(p.x,p.y);g.rotate(p.a+Math.PI/2);const s=13+e.p*12;g.lineJoin='round';
  if(e.type==='needle'){g.restore();const a=point(e.lane,.04);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(p.x,p.y);g.strokeStyle='#bd8f68';g.lineWidth=4;g.stroke();g.save();g.translate(p.x,p.y);g.rotate(p.a+Math.PI/2);path(g,[[0,-s],[s*.65,s],[0,s*.5],[-s*.65,s]],'#ecd5a6','#fff0cb',2);}
  else if(e.type==='armor'){path(g,[[0,-s],[s,-s*.45],[s,s*.45],[0,s],[-s,s*.45],[-s,-s*.45]],e.hp===2?'#487d85':'#815c4f','#c8f0e9',2);g.fillStyle='#e4f5e7';g.fillRect(-3,-8,6,5);if(e.hp===2)g.fillRect(-3,3,6,5);}
  else if(e.type==='flip'){path(g,[[-s,-s],[s,s],[s,-s],[-s,s]],'#c76065','#ffccba',2);circle(g,0,0,4,'#fff0d7');}
  else if(e.type==='surge'){path(g,[[-s,-s*.65],[0,-s],[s,-s*.65],[s*.5,s],[0,s*.5],[-s*.5,s]],'#be813f','#ffe2a1',2);path(g,[[-s*.3,-s*.4],[0,s*.25],[s*.3,-s*.4]],null,'#fff2d2',2);}
  else {path(g,[[0,-s],[s,0],[0,s],[-s,0]],'#df6d57','#ffd2a4',2);path(g,[[0,-s*.5],[s*.5,0],[0,s*.5],[-s*.5,0]],'#743a40','#f3ab75',1);}
  // Copper pin joints and a dark socket give tiny actors readable mechanical depth.
  circle(g,-s*.55,0,2,'#fae0b3');circle(g,s*.55,0,2,'#fae0b3');
  if(e.warning>0){circle(g,0,0,s+6,null,'#fff4df',2);}
  g.restore();
 }
 window.SpireArt={point,path,circle,background,actor,N,CX,CY,R};
})();

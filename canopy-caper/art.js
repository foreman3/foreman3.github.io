(() => {
 'use strict';
 const {T}=CanopyRules, sprites=new Map();
 const palettes=[['#e4e9be','#85b8a0','#265f59'],['#f4dba9','#81b294','#244f49'],['#ead8e1','#9fadb6','#535a78'],['#d6e1ca','#789c91','#38575a'],['#f7d9af','#7fae93','#28564f'],['#c5dbe0','#5f9291','#244d5e'],['#e7d9a4','#83a59a','#273f53']];
 function ellipse(g,x,y,rx,ry,color,angle=0){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.fill();}
 function path(g,points,fill,stroke='#163f3b',width=2){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
 function rounded(g,x,y,w,h,r,fill,stroke=null,line=1){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=line;g.stroke();}}
 function leaf(g,x,y,size,angle,color,veins=true){g.save();g.translate(x,y);g.rotate(angle);g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-size*.15,-size*.5,size*.42,-size*.95,size,-size*.78);g.bezierCurveTo(size*.78,-size*.2,size*.4,size*.19,0,0);g.fillStyle=color;g.fill();if(veins){g.strokeStyle='#e5eac44a';g.lineWidth=Math.max(.7,size*.016);g.beginPath();g.moveTo(0,0);g.lineTo(size*.88,-size*.69);for(const t of [.25,.4,.55,.7]){g.moveTo(size*t,-size*t*.78);g.lineTo(size*t-size*.09,-size*t*.78-size*.18);g.moveTo(size*t,-size*t*.78);g.lineTo(size*t+size*.16,-size*t*.78+size*.09);}g.stroke();}g.restore();}
 function fern(g,x,y,size,angle,color){g.save();g.translate(x,y);g.rotate(angle);g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-size*.3,-size*.5,0,-size);g.stroke();for(let i=1;i<8;i++){const yy=-size*i/8,ss=size*(1-i/9)*.45;leaf(g,-size*.12,yy,ss,3.2,color,false);leaf(g,-size*.12,yy,ss,-.3,color,false);}g.restore();}
 function scenery(s){
  const c=document.createElement('canvas');c.width=s.width*T;c.height=s.height*T;const g=c.getContext('2d'),w=c.width,h=c.height,p=palettes[s.level-1];
  const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,p[0]);sky.addColorStop(.55,p[1]);sky.addColorStop(1,p[2]);g.fillStyle=sky;g.fillRect(0,0,w,h);
  // Painted depth layers: broad distant crowns, buttress roots, and slanting sunlight.
  ellipse(g,w*.73,100,75,75,'#fff4cb66');
  for(let layer=0;layer<3;layer++)for(let i=0;i<10;i++){
   const x=(i*.123+.05+layer*.028)*w,y=110+layer*h*.18+(i*79)%170,size=75+layer*25,col=[p[1]+'66',p[2]+'29',p[2]+'45'][layer];
   g.fillStyle=col;g.beginPath();g.moveTo(x-size*.12,h);g.bezierCurveTo(x-size*.22,y+size,x-size*.1,y,x,y);g.bezierCurveTo(x+size*.18,y,x+size*.19,y+size,x+size*.22,h);g.fill();
   for(let k=0;k<7;k++)ellipse(g,x+Math.cos(k)*size*.7,y+Math.sin(k)*size*.32,size*.6,size*.43,col,k*.3);
   for(let k=0;k<5;k++)leaf(g,x,y+size*.5+k*size*.7,size*(.8-k*.1),k%2?-.1:3.15,col);
  }
  g.fillStyle='#fff0c710';for(let i=0;i<5;i++)path(g,[[w*.65+i*55,0],[w*.65+50+i*55,0],[w*.3+120+i*120,h],[w*.3+i*120,h]],'#fff7d319',null);
  for(let i=0;i<22;i++){const x=(i*131+41)%w,y=h-70-(i*29)%190;fern(g,x,y,75+(i%3)*18,(i%4-2)*.3,p[2]+'77');}
  g.strokeStyle='#eef4d81c';g.lineWidth=3;for(let x=100;x<w;x+=260){g.beginPath();g.moveTo(x,0);g.lineTo(x+35,h);g.stroke();}
  g.font='bold 20px Georgia';g.fillStyle=p[2]+'aa';g.fillText(s.level===1?'FERN HOLLOW CONSERVATORY':s.level===4?'THE ROOTSTONE ARCHIVES':'CANOPY BOTANICAL RESERVE',72,60);
  g.font='12px Trebuchet MS';g.fillText('GOLDEN SEED RECOVERY / '+String(s.level).padStart(2,'0'),74,82);
  return c;
 }
 function terrain(s,scene){
  const c=document.createElement('canvas');c.width=scene.width;c.height=scene.height;const g=c.getContext('2d');g.drawImage(scene,0,0);
  const dirt=g.createLinearGradient(0,0,0,T);dirt.addColorStop(0,'#b08255');dirt.addColorStop(.2,'#81593e');dirt.addColorStop(1,'#40372d');
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
   const v=s.tiles[y][x],px=x*T,py=y*T,seed=x*31+y*17;
   if(v==='#'){
    g.save();g.translate(px,py);g.fillStyle='#133b3b55';g.fillRect(-3,9,54,46);rounded(g,-1,0,50,48,3,dirt);g.fillStyle='#c09b6650';g.fillRect(0,9,48,2);
    for(let i=0;i<12;i++){const xx=(seed+i*17)%46,yy=13+(seed+i*13)%30;ellipse(g,xx,yy,1.2+(i%3),.7+i%2,i%2?'#cea77766':'#242f2b66',i);}
    g.strokeStyle='#d2b58d4a';g.lineWidth=1;g.beginPath();g.moveTo(0,21+(seed%8));g.quadraticCurveTo(22,11,48,32);g.stroke();g.strokeStyle='#323a2c88';g.beginPath();g.moveTo(7,5);g.bezierCurveTo(14,16,6,29,22,46);g.moveTo(11,24);g.lineTo(23,27);g.stroke();
    if(!CanopyRules.solid(s,x,y-1)){
     g.fillStyle='#397b54';g.beginPath();g.moveTo(-1,5);g.bezierCurveTo(10,-5,19,6,26,1);g.bezierCurveTo(37,-6,43,5,49,0);g.lineTo(49,9);g.lineTo(-1,10);g.fill();
     for(let i=0;i<3;i++)leaf(g,5+i*16,3,13+(seed+i)%7,i%2?-.7:3.9,['#93bc6c','#68a25f','#bad18a'][i]);
     if(seed%5===0){g.strokeStyle='#2d624788';g.lineWidth=2;g.beginPath();g.moveTo(40,5);g.quadraticCurveTo(48,30,42,58);g.stroke();leaf(g,44,39,12,1.8,'#81ad6f');leaf(g,44,50,10,-.8,'#81ad6f');}
    }g.restore();
   }else if(v==='='){
    const stone=g.createLinearGradient(px,py,px+48,py+48);stone.addColorStop(0,'#d6d4ba');stone.addColorStop(.4,'#a8b3a0');stone.addColorStop(1,'#687c74');rounded(g,px,py,48,48,5,stone,'#435f5777',1);
    g.strokeStyle='#f2efd18a';g.lineWidth=2;g.beginPath();g.moveTo(px+7,py+7);g.lineTo(px+38,py+5);g.stroke();g.strokeStyle='#4c6b5d66';g.lineWidth=1;g.beginPath();g.moveTo(px+17,py+10);g.lineTo(px+25,py+21);g.lineTo(px+20,py+32);g.lineTo(px+33,py+41);g.moveTo(px+25,py+21);g.lineTo(px+35,py+18);g.stroke();
    if(seed%3===0){ellipse(g,px+7,py+40,13,5,'#54856577');leaf(g,px+3,py+42,13,-.5,'#799b60');}
   }else if(v==='H') vine(g,px,py,seed);
   else if(v==='-'){
    g.strokeStyle='#31494266';g.lineWidth=7;g.beginPath();g.moveTo(px,py+15);g.quadraticCurveTo(px+24,py+19,px+48,py+15);g.stroke();g.strokeStyle='#e5c19b';g.lineWidth=4;g.beginPath();g.moveTo(px,py+12);g.quadraticCurveTo(px+24,py+16,px+48,py+12);g.stroke();g.strokeStyle='#957352';g.lineWidth=1;for(let xx=3;xx<48;xx+=7){g.beginPath();g.moveTo(px+xx,py+10);g.lineTo(px+xx+4,py+16);g.stroke();}
   }
  }
  return c;
 }
 function vine(g,px,py,seed=0){g.lineCap='round';g.strokeStyle='#264e37';g.lineWidth=8;for(const offset of [15,33]){g.beginPath();g.moveTo(px+offset,py-2);g.bezierCurveTo(px+offset-5,py+16,px+offset+4,py+30,px+offset,py+50);g.stroke();}g.strokeStyle='#94ad65';g.lineWidth=2;for(const offset of [13,31]){g.beginPath();g.moveTo(px+offset,py);g.lineTo(px+offset+2,py+48);g.stroke();}g.strokeStyle='#c7bd86';g.lineWidth=5;for(let yy=9;yy<48;yy+=16){g.beginPath();g.moveTo(px+14,py+yy);g.quadraticCurveTo(px+24,py+yy+3,px+34,py+yy);g.stroke();}leaf(g,px+13,py+10,18,3.7,'#6a9a54');leaf(g,px+34,py+35,19,-.55,'#abc97a');if(seed%11===0){ellipse(g,px+10,py+18,4,6,'#e9baac',.5);ellipse(g,px+7,py+18,4,6,'#f4cbbc',-.7);ellipse(g,px+9,py+20,2,2,'#ffe0a1');}}
 function position(a){if(!a.move)return{x:a.x,y:a.y};const m=a.move,k=Math.min(1,m.elapsed/m.duration);return{x:a.x+(m.x-a.x)*k,y:a.y+(m.y-a.y)*k};}
 function sprite(role,frame){
  const id=role+frame;if(sprites.has(id))return sprites.get(id);const c=document.createElement('canvas');c.width=192;c.height=192;const g=c.getContext('2d');g.scale(2,2);g.translate(48,82);const stride=Math.sin(frame/6*Math.PI*2),ink='#243e38';
  if(role==='player'){
   rounded(g,-17,-36,14,29,5,'#ac794a',ink,1.5);rounded(g,-16,-34,12,13,3,'#e6c181');g.strokeStyle='#705037';g.lineWidth=1;g.strokeRect(-14,-30,7,7);
   g.strokeStyle='#284841';g.lineWidth=8;g.lineCap='round';g.beginPath();g.moveTo(-6,-18);g.lineTo(-8-stride*5,-5);g.moveTo(6,-18);g.lineTo(8+stride*5,-5);g.stroke();rounded(g,-14-stride*5,-7,12,7,3,'#6f4a37',ink);rounded(g,3+stride*5,-7,13,7,3,'#6f4a37',ink);
   const coat=g.createLinearGradient(-10,-37,12,-12);coat.addColorStop(0,'#80ae9b');coat.addColorStop(.5,'#377766');coat.addColorStop(1,'#1c554b');g.beginPath();g.moveTo(-10,-37);g.quadraticCurveTo(0,-42,12,-35);g.lineTo(15,-16);g.quadraticCurveTo(0,-10,-13,-16);g.closePath();g.fillStyle=coat;g.fill();g.strokeStyle=ink;g.lineWidth=1.5;g.stroke();
   g.strokeStyle='#adc9a9';g.lineWidth=2;g.beginPath();g.moveTo(-5,-34);g.lineTo(-3,-17);g.moveTo(5,-34);g.lineTo(7,-17);g.stroke();rounded(g,-5,-25,12,8,2,'#d9d9a5','#31564a');
   g.strokeStyle='#538e75';g.lineWidth=8;g.beginPath();g.moveTo(9,-33);g.lineTo(17,-22+stride*2);g.moveTo(-9,-33);g.lineTo(-15,-24-stride*2);g.stroke();ellipse(g,18,-20+stride*2,5,5,'#eed4a6');ellipse(g,-15,-23-stride*2,4,4,'#e6c996');
   g.strokeStyle='#8c6545';g.lineWidth=3;g.beginPath();g.moveTo(18,-27);g.lineTo(23,-4);g.stroke();const blade=g.createLinearGradient(19,-8,29,1);blade.addColorStop(0,'#eff0d7');blade.addColorStop(1,'#7e9a8b');path(g,[[18,-7],[27,-9],[28,0],[23,5],[20,0]],blade,ink,1);
   ellipse(g,1,-43,11,12,'#e4bd8a');ellipse(g,6,-41,8,9,'#f4d6a4');ellipse(g,8,-44,1.5,2,'#203d34');g.strokeStyle='#6c5741';g.lineWidth=1.4;g.beginPath();g.moveTo(5,-48);g.lineTo(10,-49);g.moveTo(5,-37);g.quadraticCurveTo(8,-35,10,-38);g.stroke();ellipse(g,2,-39,3,2,'#d9927666');
   path(g,[[-8,-36],[10,-36],[20+stride*2,-29],[6,-29],[-7,-32]],'#e79a72','#956047',1);
   const hat=g.createLinearGradient(0,-62,0,-48);hat.addColorStop(0,'#ead599');hat.addColorStop(1,'#b18854');g.beginPath();g.moveTo(-13,-49);g.lineTo(-9,-60);g.quadraticCurveTo(0,-66,9,-60);g.lineTo(14,-49);g.closePath();g.fillStyle=hat;g.fill();g.strokeStyle='#765a3f';g.lineWidth=1.3;g.stroke();ellipse(g,0,-49,20,5,'#ddbb7c');g.strokeStyle='#6b8060';g.lineWidth=3;g.beginPath();g.moveTo(-10,-53);g.lineTo(10,-53);g.stroke();leaf(g,8,-54,9,-.7,'#5e8954');
  }else{
   const colors={chaser:['#efa184','#a34040'],warden:['#b6cd83','#48775a'],interceptor:['#c4b1d5','#6b548d'],scout:['#f1d581','#a88640']},p=colors[role]||colors.chaser,wide=role==='warden'?18:role==='scout'?12:15;
   g.strokeStyle='#263f37';g.lineWidth=3;g.lineCap='round';for(const sign of [-1,1])for(let i=0;i<3;i++){g.beginPath();g.moveTo(sign*8,-12-i*7);g.lineTo(sign*(20+stride*(i%2?2:-2)),-7-i*9);g.lineTo(sign*(24+stride*3),-2-i*10);g.stroke();}
   const shell=g.createLinearGradient(-15,-40,15,-8);shell.addColorStop(0,'#fff4cc');shell.addColorStop(.25,p[0]);shell.addColorStop(1,p[1]);ellipse(g,0,-24,wide,21,shell);g.strokeStyle=ink;g.lineWidth=1.8;g.beginPath();g.ellipse(0,-24,wide,21,0,0,Math.PI*2);g.stroke();g.strokeStyle=p[1];g.lineWidth=2;g.beginPath();g.moveTo(0,-43);g.quadraticCurveTo(-3,-22,0,-5);g.stroke();ellipse(g,-6,-31,3,7,'#fff4ce55',.2);
   if(role==='chaser'){for(const sign of [-1,1])for(const yy of [-30,-18])ellipse(g,sign*8,yy,3,3,'#683f39');}
   if(role==='warden'){path(g,[[0,-34],[9,-25],[6,-15],[0,-10],[-6,-15],[-9,-25]],'#dae0a1','#60825c',1);leaf(g,-3,-19,9,-.4,'#638158');}
   if(role==='interceptor'){g.strokeStyle='#ede1f5';g.lineWidth=2;g.beginPath();g.moveTo(-9,-16);g.lineTo(-9,-29);g.lineTo(0,-34);g.lineTo(9,-29);g.lineTo(9,-16);g.stroke();}
   if(role==='scout'){for(const yy of [-30,-19]){g.fillStyle='#615541';g.fillRect(-11,yy,22,4);}path(g,[[0,-15],[4,-10],[0,-5],[-4,-10]],'#faeab0',null);}
   ellipse(g,0,-45,10,8,'#2c4c3e');g.strokeStyle='#35563f';g.lineWidth=2;for(const sign of [-1,1]){g.beginPath();g.moveTo(sign*5,-50);g.quadraticCurveTo(sign*13,-62,sign*17,-55);g.stroke();ellipse(g,sign*17,-55,2,2,p[0]);ellipse(g,sign*5,-47,4,4,'#f7f0d3');ellipse(g,sign*6,-48,1.7,2,'#27453a');}
  }
  sprites.set(id,c);return c;
 }
 function actor(g,a,time,player=false){const p=position(a),frame=a.move?Math.floor(time*14)%6:0,role=player?'player':a.role||'chaser';g.save();g.translate((p.x+.5)*T,(p.y+1)*T-2);ellipse(g,0,0,player?18:20,4,'#143f3c55');if(a.facing<0)g.scale(-1,1);g.drawImage(sprite(role,frame),-48,-82,96,96);g.restore();if(a.stun>0||a.trap>0){g.fillStyle='#fff0b5';g.strokeStyle='#385e44';g.lineWidth=3;g.font='bold 15px Trebuchet MS';g.textAlign='center';const text=a.trap>0?'TRAPPED':'✦';g.strokeText(text,(p.x+.5)*T,p.y*T-13);g.fillText(text,(p.x+.5)*T,p.y*T-13);}else if(a.alert&&a.role!=='chaser'){g.fillStyle=role==='interceptor'?'#e8cef8':'#fff2be';g.font='bold 14px Trebuchet MS';g.textAlign='center';g.fillText(role==='warden'?'◆':'↗',(p.x+.5)*T,p.y*T-12);}}
 function paintPod(g,p,time,reduced){const x=(p.x+.5)*T,y=(p.y+.5)*T+(reduced?0:Math.sin(time*2.6+p.x)*1.5);ellipse(g,x,y+16,13,3,'#153e3a44');g.save();g.translate(x,y);const gold=g.createLinearGradient(-13,-15,13,15);gold.addColorStop(0,'#fff5bb');gold.addColorStop(.3,'#e8c15e');gold.addColorStop(1,'#ad813f');g.beginPath();g.moveTo(0,-16);g.bezierCurveTo(18,-9,15,9,0,18);g.bezierCurveTo(-16,8,-17,-9,0,-16);g.fillStyle=gold;g.fill();g.strokeStyle='#735536';g.lineWidth=1.8;g.stroke();g.strokeStyle='#9f743f';g.lineWidth=1.2;g.beginPath();g.moveTo(0,-13);g.quadraticCurveTo(-2,0,0,13);for(let y=-8;y<=8;y+=7){g.moveTo(0,y);g.lineTo(8,y+4);g.moveTo(0,y);g.lineTo(-7,y+4);}g.stroke();ellipse(g,-5,-5,2,6,'#fff7cb99',.2);leaf(g,0,-14,15,-.5,'#668a4e');g.restore();}
 let podImage;function pod(g,p,time,reduced){if(!podImage){podImage=document.createElement('canvas');podImage.width=podImage.height=192;const ctx=podImage.getContext('2d');ctx.scale(2,2);paintPod(ctx,{x:.5,y:.5},0,true);}const x=(p.x+.5)*T,y=(p.y+.5)*T+(reduced?0:Math.sin(time*2.6+p.x)*1.5);g.drawImage(podImage,x-48,y-48,96,96);}
 function gate(g,s,open){const x=(s.exit.x+.5)*T,y=(s.exit.y+1)*T;rounded(g,x-26,y-68,52,68,20,'#233f38','#b6c494',3);rounded(g,x-19,y-54,38,50,15,open?'#abc788':'#587462');for(let i=0;i<4;i++){g.fillStyle=i%2?'#e7cda0':'#b06c50';g.fillRect(x-16+i*8,y-42,7,39);}g.strokeStyle='#d9d2a6';g.lineWidth=3;g.beginPath();g.moveTo(x-25,y-2);g.lineTo(x+25,y-2);g.stroke();leaf(g,x-23,y-51,24,3.8,'#91b16a');leaf(g,x+22,y-63,28,-.3,'#a5bc79');g.fillStyle='#f8edc6';g.font='bold 10px Trebuchet MS';g.textAlign='center';g.fillText(open?'EXIT ↑':'SEED GATE',x,y-55);if(open){ellipse(g,x,y-28,144,144,'#c7df821b');g.strokeStyle='#e7edaa66';g.lineWidth=2;g.setLineDash([4,10]);g.beginPath();g.arc(x,y-28,144,0,Math.PI*2);g.stroke();g.setLineDash([]);}}
 // Warm caches avoid creating actor gradients or paths during the animation loop.
 for(const role of ['player','chaser','warden','interceptor','scout'])for(let frame=0;frame<6;frame++)sprite(role,frame);
 window.CanopyArt={scenery,terrain,actor,pod,position,ellipse,path,vine,gate};
})();

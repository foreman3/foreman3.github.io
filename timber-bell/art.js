/* Authored Canvas illustration. Static scenery is cached once, moving effects capped. */
(() => {
  'use strict';
  const W=960,H=600,bg=document.createElement('canvas');bg.width=W;bg.height=H;
  const c=bg.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  // One lossless atlas contains actual Blender renders. Procedural artwork
  // remains available while it loads or if the file cannot be decoded.
  const atlas=new Image();let spritesReady=false;
  atlas.onload=()=>{spritesReady=true;window.dispatchEvent(new Event('timber:art-ready'));};
  atlas.src='assets/timber-sprites.webp';
  const sprites={plain:[304,334,160,100],knot:[560,334,160,100],cracked:[816,334,160,100],bell:[48,590,160,100],branch:[307,598,194,68],stump:[542,574,197,131]};
  function sprite(g,rect,x,y,w,h){g.drawImage(atlas,...rect,x,y,w,h);}
  function shape(g,pts,fill,stroke){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.stroke();}}
  function ellipse(g,x,y,rx,ry,fill){g.fillStyle=fill;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
  function line(g,x,y,x2,y2,color,width=2){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();}
  function text(g,t,x,y,size=18,color='#f7edcf',font='Georgia'){g.fillStyle=color;g.font=`${size}px ${font}`;g.textAlign='center';g.fillText(t,x,y);}
  function pine(g,x,y,h,color){line(g,x,y,x,y-h,color,7);for(let i=0;i<4;i++){const yy=y-h+i*h*.19,ww=h*(.19+i*.043);shape(g,[[x,yy],[x+ww,yy+h*.43],[x+ww*.2,yy+h*.37],[x-ww,yy+h*.43]],color);}}
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#c9d4b7');sky.addColorStop(.65,'#e4d9ae');sky.addColorStop(1,'#697a54');c.fillStyle=sky;c.fillRect(0,0,W,H);
  ellipse(c,760,105,54,54,'#f7e9bc');for(let j=0;j<3;j++){shape(c,[[0,320+j*50],[0,260+j*40],[130,175+j*38],[270,260+j*30],[410,205+j*35],[630,280+j*30],[790,190+j*35],[960,245+j*40],[960,490]],['#a9b99c','#829c80','#547b65'][j]);}
  for(let i=0;i<22;i++){const x=(i*137)%1000-20,h=90+(i*31)%130;pine(c,x,425+(i%3)*8,h,i%2?'#315f4d':'#406d55');}
  shape(c,[[0,450],[190,425],[390,456],[560,438],[790,427],[960,453],[960,600],[0,600]],'#708250');
  shape(c,[[0,516],[260,489],[456,513],[650,492],[960,508],[960,600],[0,600]],'#aaa472');
  // Festival hut, shingled roof and hand-painted sign.
  c.fillStyle='#a56c4b';c.fillRect(65,338,174,120);shape(c,[[45,347],[150,268],[258,347]],'#683f35','#e6c991');
  for(let y=354;y<452;y+=16)line(c,68,y,236,y,'#805039',2);for(let y=300;y<341;y+=12)line(c,100-(y-300)*.6,y,200+(y-300)*.6,y,'#9e6050',2);
  c.fillStyle='#354d3a';c.fillRect(132,382,38,76);c.fillStyle='#ebcb7d';c.fillRect(85,374,29,30);c.fillRect(190,374,29,30);line(c,99,374,99,404,'#704a38');line(c,85,389,114,389,'#704a38');line(c,204,374,204,404,'#704a38');
  c.fillStyle='#eee1b9';c.fillRect(81,343,142,23);text(c,'B E L L W O O D',152,359,12,'#6b4234','serif');
  for(let i=0;i<9;i++){const x=35+i*116,y=54+Math.sin(i/8*Math.PI)*40;line(c,x-58,y-8,x+58,y+10,'#455c42');shape(c,[[x-15,y],[x+15,y+4],[x-2,y+31]],i%2?'#9d493f':'#d9b46a');}
  // Bell pavilion on the right.
  line(c,734,455,734,294,'#6d4c35',9);line(c,855,455,855,294,'#6d4c35',9);line(c,724,300,864,300,'#6d4c35',13);shape(c,[[712,300],[794,257],[876,300]],'#99483d');line(c,795,300,795,325,'#554d32',3);
  shape(c,[[777,325],[813,325],[817,359],[825,367],[765,367],[773,359]],'#d2a857','#675431');ellipse(c,795,370,8,6,'#6c5634');line(c,817,358,832,410,'#7c6940',2);
  for(let i=0;i<28;i++){const x=(i*73)%960,y=528+(i*41)%70;line(c,x,y,x+11,y-4,'#7a8150');}
  for(let i=0;i<8;i++){const x=51+i*28;ellipse(c,x,482,24,10,'#684d37');ellipse(c,x,476,24,11,'#be9863');ellipse(c,x,476,15,6,'#98794f');ellipse(c,x,476,6,3,'#cdb17e');}
  text(c,'THE BELLWOOD',790,473,13,'#203e36');text(c,'CHOPPING FESTIVAL',790,492,12,'#203e36');
  // Fine engraved detail is baked into the scenery rather than redrawn each frame.
  for(let i=0;i<180;i++){const x=(i*163+47)%960,y=440+(i*67)%160;line(c,x,y,x+3+(i%5),y-2,'#4d674633',1);}
  for(let i=0;i<15;i++){const x=34+(i*193)%890,y=468+(i*31)%62;line(c,x,y,x-3,y-13,'#466746',2);ellipse(c,x-3,y-15,3,4,'#d3ba7e');ellipse(c,x-6,y-12,3,3,'#d3ba7e');}
  for(let i=0;i<4;i++){const x=710+i*27;line(c,x,411,x+17,411,'#cfb47c',2);line(c,x+3,415,x+20,415,'#cfb47c',1);}
  function bell(g,x,y){g.save();g.translate(x,y);shape(g,[[-6,-8],[6,-8],[8,3],[12,7],[-12,7],[-8,3]],'#e2c16a','#644e30');ellipse(g,0,9,3,3,'#644e30');g.restore();}
  function wood(g,a,y,index){const x=427,w=106,h=65;
    if(spritesReady){
      if(a.branch){g.save();g.translate(a.branch<0?x+7:x+w-7,y+9);g.scale(a.branch,1);sprite(g,sprites.branch,0,0,124,44);g.restore();}
      const key=a.knot>1?'knot':a.originalKnot?'cracked':a.bell?'bell':'plain';sprite(g,sprites[key],x,y,w,h);
      if(a.knot>1)text(g,'II',480,y+43,13,'#fff3ce','system-ui');
      if(a.bell&&(a.knot>1||a.originalKnot)){g.save();g.translate(25,-14);bell(g,480,y+31);g.restore();}
      return;
    }
    g.fillStyle=index%2?'#a57649':'#af8050';g.fillRect(x,y,w,h);g.fillStyle='#6b4a31';g.fillRect(x,y,8,h);g.fillRect(x+w-8,y,8,h);line(g,x+8,y,x+w-8,y,'#d9b27a',3);line(g,x+6,y+h-2,x+w-6,y+h-2,'#624630',3);
    for(let i=0;i<5;i++){const xx=x+17+i*17+Math.sin(a.id+i)*5;line(g,xx,y+8,xx+Math.sin(a.id+i*2)*7,y+53,'#805734',1);line(g,xx+3,y+18,xx+5,y+42,'#c39861',1);}
    if(a.branch){g.save();g.translate(a.branch<0?x+6:x+w-6,y+24);g.scale(a.branch,1);shape(g,[[0,-4],[72,-18],[115,-49],[123,-40],[88,-8],[125,1],[124,14],[64,9],[0,17]],'#765333','#523f2c');line(g,20,0,80,-7,'#ba955d',3);for(let i=0;i<3;i++){ellipse(g,86+i*12,-32-i*6,18,8,'#3d6042');}g.restore();}
    if(a.knot>1){ellipse(g,480,y+32,22,16,'#61412e');ellipse(g,480,y+32,16,11,'#d7b47a');ellipse(g,480,y+32,9,6,'#815232');text(g,'II',480,y+37,13,'#f8ebc7','system-ui');}
    else if(a.originalKnot){ellipse(g,480,y+32,22,16,'#61412e');ellipse(g,480,y+32,16,11,'#b89563');line(g,473,y+20,482,y+30,'#f6dd9d',3);line(g,482,y+30,476,y+37,'#f6dd9d',3);line(g,476,y+37,488,y+44,'#f6dd9d',3);}
    if(a.bell){g.strokeStyle='#e6cc83';g.lineWidth=2;g.strokeRect(459,y+12,42,39);bell(g,480,y+31);}
  }
  function worker(g,s){const side=s.side,x=480+side*109,y=511;g.save();g.translate(x,y);g.scale(-side,1);const swing=reduced?0:Math.sin(s.swing/.18*Math.PI);ellipse(g,0,28,39,9,'#46543b55');
    if(spritesReady){const frame=Math.max(0,Math.min(4,Math.round(swing*4)));sprite(g,[(frame%4)*256,Math.floor(frame/4)*256,256,256],-69,-123,175,175);g.restore();return;}
    shape(g,[[-21,3],[-2,3],[-4,25],[-23,25]],'#394d44');shape(g,[[3,3],[21,3],[25,25],[7,25]],'#394d44');g.fillStyle='#382f2a';g.fillRect(-26,21,24,9);g.fillRect(6,21,25,9);
    shape(g,[[-23,-42],[18,-42],[27,3],[-26,3]],'#b84f43','#713a31');for(let i=0;i<4;i++){line(g,-20,-34+i*10,22,-34+i*10,'#803f35',2);}line(g,-10,-40,-10,2,'#e5b482',3);line(g,12,-40,12,2,'#e5b482',3);g.fillStyle='#d4b77d';g.fillRect(-25,-4,51,6);g.fillStyle='#f4ddb0';g.fillRect(-14,-29,7,4);g.fillRect(9,-29,7,4);
    ellipse(g,-1,-59,18,20,'#e9bd8c');shape(g,[[-17,-54],[-7,-45],[13,-52],[9,-34],[-9,-36]],'#694736');ellipse(g,8,-61,2,2,'#243c31');g.fillStyle='#a43e36';g.fillRect(-21,-78,41,15);ellipse(g,-1,-78,19,8,'#b84f43');g.fillStyle='#d3ae7d';g.fillRect(-22,-67,46,6);
    g.save();g.translate(5,-32);g.rotate(-.45+swing*1.25);line(g,0,0,58,-44,'#d8bd86',8);shape(g,[[46,-58],[67,-71],[79,-46],[60,-34]],'#c9d3bd','#435646');line(g,3,1,25,-13,'#e5b482',13);g.restore();g.restore();
  }
  function draw(g,s,p){g.drawImage(bg,0,0);if(!s.logs)return;const off=reduced?0:s.drop*65;
    // Stack clipped above the target lane; labels stay fixed for legibility.
    g.save();g.beginPath();g.rect(272,0,416,494);g.clip();if(spritesReady){g.fillStyle='#392416';g.fillRect(429,-65,102,558-off);}for(let i=8;i>=0;i--){const a=s.logs[i];if(a)wood(g,a,428-i*65-off,i);}g.restore();
    ellipse(g,480,518,76,17,'#4b4b30');if(spritesReady)sprite(g,sprites.stump,412,478,136,59);else{g.fillStyle='#7b5838';g.fillRect(416,490,128,24);ellipse(g,480,492,64,16,'#d2ad72');ellipse(g,480,492,46,10,'#a58151');ellipse(g,480,492,27,6,'#c49c63');}
    // The frame identifies exactly which segment an input acts on.
    g.strokeStyle='#f7edcf';g.lineWidth=3;g.strokeRect(420,425,120,66);for(let side of[-1,1]){line(g,480+side*68,432,480+side*78,432,'#f7edcf',3);line(g,480+side*78,432,480+side*78,485,'#f7edcf',3);}
    worker(g,s);if(s.guard>0){g.strokeStyle='#f7df9d';g.lineWidth=3;g.beginPath();g.ellipse(480+s.side*109,500,40,51,0,0,Math.PI*2);g.stroke();}if(!reduced)for(const q of s.particles){g.fillStyle='#e6c388';g.fillRect(q.x,q.y,8,4);}
    // Carved scoreboard in the left clearing.
    g.fillStyle='#264b3e';g.fillRect(40,125,225,115);g.strokeStyle='#b8bd8e';g.lineWidth=2;g.strokeRect(46,131,213,103);text(g,'HEAT '+s.level+' · '+p.name.toUpperCase(),152,156,13);text(g,s.chain+' CLEAN CUTS',152,185,22,'#e6c388');text(g,s.logs[0].knot>1?'KNOT · TWO STROKES':'LOWEST LOG · OPEN SIDE',152,216,12);
    const ratio=Math.max(0,Math.min(1,s.left/p.time));g.fillStyle='#2d493d';g.fillRect(30,568,900,12);g.fillStyle=s.left<8?'#bb5445':'#e3c17c';g.fillRect(30,568,900*ratio,12);text(g,'FESTIVAL CLOCK',480,561,10,'#263e32','system-ui');
    if(s.flash>0){g.fillStyle=`rgba(157,55,42,${s.flash*.35})`;g.fillRect(0,0,W,H);}if(s.bonus>0)text(g,'+1 SECOND',650,405,24,'#fff2c4');
    if(s.mode==='paused'){g.fillStyle='#142d28b8';g.fillRect(0,0,W,H);text(g,'THE WOOD CAN WAIT',480,278,37);text(g,'P / Resume to continue',480,319,19);}
  }
  window.TimberArt={draw,get spritesReady(){return spritesReady;}};
})();

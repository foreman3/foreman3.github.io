(() => {
  'use strict';
  const W=1100,H=600,G=475,ink='#173b50',paper='#fff0cd',gold='#efbc5c',red='#ae3d4c';
  const scenery=document.createElement('canvas');scenery.width=W;scenery.height=H;
  const b=scenery.getContext('2d');
  function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function path(c,pts,fill,stroke=ink,width=3){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}}
  function star(c,x,y,r,color){const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5;pts.push([x+Math.cos(a)*(i%2?r*.43:r),y+Math.sin(a)*(i%2?r*.43:r)]);}path(c,pts,color,null);}
  function background(){
    b.fillStyle='#274c60';b.fillRect(0,0,W,H);
    for(let i=0;i<14;i++)path(b,[[550,-130],[i*95-160,325],[(i+1)*95-160,325]],i%2?'#31596a':'#3b6070',null);
    b.strokeStyle='#e7ba6b';b.lineWidth=3;b.beginPath();b.moveTo(0,96);b.quadraticCurveTo(550,225,1100,96);b.stroke();
    for(let i=0;i<18;i++){const x=i*66,y=99+Math.sin(Math.PI*x/1100)*65;path(b,[[x,y],[x+29,y+5],[x+16,y+41]],i%3===0?red:i%3===1?gold:paper,null);}
    for(let i=0;i<6;i++){const x=i*220-15;path(b,[[x,0],[x+65,0],[x+30,340],[x-30,340]],'#943b4a',null);path(b,[[x,0],[x+16,0],[x-16,340],[x-30,340]],'#b54e58',null);ellipse(b,x+8,300,28,12,gold);}
    b.fillStyle='#15374b';b.fillRect(0,295,W,135);
    for(let row=0;row<3;row++){
      b.strokeStyle='#65808a';b.lineWidth=3;b.beginPath();b.moveTo(0,335+row*30);b.lineTo(W,335+row*30);b.stroke();
      for(let i=0;i<35;i++){let x=i*33+(row%2)*16,y=320+row*30;ellipse(b,x,y+15,12,14,['#546b75','#756e71','#466b77'][i%3]);ellipse(b,x,y,7,8,['#d3aa80','#c48b70','#e2b99a'][i%3]);if(i%6===0){b.fillStyle=gold;b.fillRect(x-10,y-7,20,3);b.fillRect(x-5,y-14,10,7);}}
    }
    b.fillStyle='#b54852';b.fillRect(0,407,W,48);b.fillStyle='#7f3544';b.fillRect(0,449,W,8);
    for(let i=0;i<16;i++){b.strokeStyle='#f1c36f';b.lineWidth=2;b.strokeRect(i*74+5,414,61,31);star(b,i*74+35,429,9,gold);}
    b.fillStyle='#e7c589';b.fillRect(0,457,W,143);b.fillStyle='#f8dda4';b.fillRect(0,472,W,8);
    b.strokeStyle='#ae8c5b';b.lineWidth=1;for(let i=0;i<250;i++){let x=(i*137.7)%W,y=490+(i*31.3)%110;b.beginPath();b.moveTo(x,y);b.lineTo(x+5,y-1);b.stroke();}
    b.fillStyle='#183c50';b.fillRect(0,575,W,25);for(let i=0;i<40;i++)star(b,i*29+7,587,3,gold);
    b.save();b.translate(550,239);b.fillStyle='#16384a';b.strokeStyle=gold;b.lineWidth=2;b.beginPath();b.roundRect(-163,-49,326,85,12);b.fill();b.stroke();b.fillStyle=gold;b.textAlign='center';b.font='bold 12px Trebuchet MS';b.fillText('THE TRAVELLING CIRCUS',0,-22);b.font='bold 31px Georgia';b.fillStyle=paper;b.fillText('BIG TOP BOUND',0,11);star(b,-140,-5,9,gold);star(b,140,-5,9,gold);b.restore();
    // Fine stipple stays in the cached backdrop, never rebuilt per frame.
    b.fillStyle='#fff3';for(let i=0;i<1700;i++){const x=(i*163.31)%W,y=(i*59.73)%H;b.fillRect(x,y,1,1);}
  }
  background();
  function flame(c,x,y,t,size=1){c.save();c.translate(x,y);c.scale(size,size);const f=Math.sin(t*11+x)*3;path(c,[[-8,8],[-12,-5],[-5,-17],[f-2,-29],[7,-14],[12,-8],[8,8]],'#e97845',null);path(c,[[-4,8],[-6,-2],[1,-17],[5,-2],[4,8]],'#ffe29a',null);c.restore();}
  function hoop(c,x,y,t,front){
    c.save();c.translate(x,y);
    if(!front){c.strokeStyle='#15384c';c.lineWidth=7;c.beginPath();c.moveTo(0,110);c.lineTo(0,G-y-5);c.stroke();ellipse(c,0,G-y-3,28,5,'#aa8a58');c.strokeStyle=gold;c.lineWidth=2;c.beginPath();c.moveTo(-3,111);c.lineTo(-3,G-y-7);c.stroke();}
    c.strokeStyle=front?'#ffd78a':'#963e43';c.lineWidth=front?6:10;c.beginPath();c.ellipse(0,0,34,108,0,front?-Math.PI/2:Math.PI/2,front?Math.PI/2:Math.PI*1.5);c.stroke();
    for(let i=0;i<9;i++){const a=-Math.PI/2+i*Math.PI/8+(front?0:Math.PI);flame(c,Math.cos(a)*35,Math.sin(a)*109,t+i,.55);}
    if(!front){c.fillStyle='#ffe7ad';c.font='bold 13px Trebuchet MS';c.textAlign='center';c.fillText('THROUGH',0,140);}
    c.restore();
  }
  function lion(c,h,time,held,shield){
    const x=252,y=G-h,bob=h>0?0:Math.sin(time*18)*2,leg=h>0?.5:Math.sin(time*17);
    ellipse(c,x,G+4,Math.max(15,53-h*.15),7,'#856d4944');
    c.save();c.translate(x,y+bob);if(shield)c.globalAlpha=.6+.4*Math.sin(time*22)**2;
    c.strokeStyle='#a95c31';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-44,-35);c.quadraticCurveTo(-86,-72,-78,-28);c.stroke();ellipse(c,-78,-26,8,11,'#6f3a31');
    for(let k=0;k<4;k++){const lx=-36+k*22,ly=-15;path(c,[[lx,ly],[lx+13,ly],[lx+14+leg*(k%2?10:-10),-1],[lx+4+leg*(k%2?10:-10),0]],k%2?'#bd783b':'#dfa751',ink,2);}
    ellipse(c,-1,-33,57,24,'#e7b454');ellipse(c,5,-41,42,15,'#f6cc71');
    c.save();c.translate(46,-51);for(let i=0;i<12;i++){let a=i*Math.PI/6;ellipse(c,Math.cos(a)*23,Math.sin(a)*25,12,13,i%2?'#8f4b32':'#a55b34');}ellipse(c,5,0,24,26,'#efbc5c');ellipse(c,18,8,20,12,'#ffe2a1');ellipse(c,25,2,6,4,ink);ellipse(c,11,-10,3,4,ink);ellipse(c,-2,-21,7,7,'#e8a24b');c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.moveTo(17,13);c.quadraticCurveTo(22,20,30,12);c.stroke();c.restore();
    // Saddle, boots and the acrobat's cropped show jacket.
    path(c,[[-25,-57],[16,-57],[18,-38],[-26,-40]],red,ink,2);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(-19,-54,27,14);
    path(c,[[-7,-84],[8,-81],[22,-59],[7,-57],[-2,-70],[-18,-54],[-29,-58]],'#e5b85b',ink,2);
    path(c,[[-5,-119],[13,-118],[20,-85],[-9,-85]],red,ink,2);path(c,[[3,-116],[8,-116],[5,-90]],paper,null);star(c,13,-103,3,gold);
    c.strokeStyle=paper;c.lineWidth=7;c.beginPath();c.moveTo(-2,-113);c.lineTo(-24,held?-127:-105);c.lineTo(-37,held?-146:-111);c.moveTo(14,-113);c.lineTo(34,-124);c.lineTo(42,held?-149:-132);c.stroke();
    ellipse(c,4,-134,11,13,'#e6ae88');ellipse(c,9,-135,2,2,ink);path(c,[[-7,-146],[16,-146],[10,-161]],'#e5b85b',ink,2);ellipse(c,10,-161,4,4,paper);
    c.restore();
  }
  function draw(c,s,fx,reduced){
    c.clearRect(0,0,W,H);c.drawImage(scenery,0,0);
    const t=reduced?0:s.time;
    // Passing floor marks communicate speed while the illustrated tent stays calm.
    c.strokeStyle='#ac885c55';c.lineWidth=2;for(let i=0;i<10;i++){const x=(i*145-s.distance*.85)%1450;c.beginPath();c.moveTo(x,513);c.lineTo(x+36,513);c.stroke();}
    const exit=252+s.finish-s.distance;
    if(exit<1200){c.fillStyle=ink;c.fillRect(exit-55,242,110,233);path(c,[[exit-65,236],[exit+65,236],[exit+73,265],[exit-73,265]],gold,ink,3);c.fillStyle=ink;c.textAlign='center';c.font='bold 17px Georgia';c.fillText('CURTAIN',exit,257);path(c,[[exit-52,269],[exit-10,269],[exit-35,470],[exit-52,470]],red,null);path(c,[[exit+10,269],[exit+52,269],[exit+52,470],[exit+35,470]],red,null);for(let i=0;i<5;i++)star(c,exit,287+i*29,5,gold);}
    for(const o of s.obstacles){const x=252+o.x-s.distance;if(x<-90||x>1190)continue;
      const y=G-48-window.BigTopEngine.target(s,o);
      if(o.type==='hoop')hoop(c,x,y,t,false);
      else{ellipse(c,x,G+5,30,6,'#8f704955');path(c,[[x-25,G-18],[x+25,G-18],[x+17,G],[x-17,G]],ink,gold,2);flame(c,x,G-23,t,o.target>50?1.6:1.15);c.fillStyle=ink;c.textAlign='center';c.font='bold 13px Trebuchet MS';c.fillText('OVER',x,G+29);}
      if(!o.done&&o.type==='hoop'){const mx=x-s.cfg.speed*(s.slowing?.62:1)*.32;c.fillStyle='#95683b88';c.beginPath();c.moveTo(mx-12,493);c.lineTo(mx+12,493);c.lineTo(mx,482);c.fill();
        if(x>335&&x<720){c.fillStyle=ink;c.font='bold 14px Trebuchet MS';c.textAlign='center';c.fillText(o.high?'HIGH HOOP':s.cfg.pairs&&o.group%4===1?'DOUBLE LEAP':'FIRE HOOP',x,G+55);}}
    }
    if(!reduced&&s.h<2&&s.state==='playing'){
      c.fillStyle='#f8e4b388';for(let i=0;i<3;i++){const phase=(s.time*3+i*.31)%1;ellipse(c,194-phase*45,G-3-phase*12,3+phase*5,2+phase*3,'#f8e4b388');}
    }
    lion(c,s.h,t,s.hold,s.invuln>0);
    for(const o of s.obstacles){const x=252+o.x-s.distance;if(o.type==='hoop'&&x>-90&&x<1190)hoop(c,x,G-48-window.BigTopEngine.target(s,o),t,true);}
    if(s.streak>=3){c.textAlign='left';c.fillStyle=ink;c.font='bold 16px Trebuchet MS';c.fillText('APPLAUSE ×'+Math.min(s.streak,5),32,548);}
    c.fillStyle='#ac885c';c.fillRect(34,520,116,5);c.fillStyle=ink;c.fillRect(34,520,116*s.reinReserve/3,5);c.textAlign='left';c.font='bold 12px Trebuchet MS';c.fillText(s.slowing?'REINS · SLOWING':s.reinReserve<.1?'REINS · RELEASE TO REFILL':'REINS',34,510);
    c.fillStyle='#a17a4b';c.fillRect(826,535,220,5);c.fillStyle=red;c.fillRect(826,535,220*Math.min(1,s.distance/s.finish),5);c.fillStyle=ink;c.font='bold 13px Trebuchet MS';c.textAlign='right';c.fillText(s.cfg.name.toUpperCase(),1047,526);
    for(const p of fx){c.globalAlpha=Math.max(0,p.life);c.fillStyle=p.color;c.font='bold 20px Georgia';c.textAlign='center';c.fillText(p.text,p.x,p.y);}c.globalAlpha=1;
  }
  window.BigTopArt={draw};
})();

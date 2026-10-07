(() => {
  'use strict';
  const W=1000,H=640,C=40,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,background=document.createElement('canvas');
  background.width=W;background.height=H;const b=background.getContext('2d');
  function polygon(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  const sea=b.createLinearGradient(600,0,1000,H);sea.addColorStop(0,'#368886');sea.addColorStop(1,'#154f65');b.fillStyle=sea;b.fillRect(0,0,W,H);
  for(let y=10;y<H;y+=27)for(let x=605+(y%3)*14;x<W;x+=64){b.strokeStyle='#9fd8bf25';b.lineWidth=2;b.beginPath();b.moveTo(x,y);b.quadraticCurveTo(x+13,y+8,x+26,y);b.stroke();}
  polygon(b,[[0,0],[590,0],[599,72],[585,139],[602,211],[588,283],[605,358],[590,432],[603,511],[591,H],[0,H]],'#d6c794','#eee0ad');
  b.fillStyle='#a9ad77';b.fillRect(0,0,578,H);
  for(let i=0;i<240;i++){const x=i*173%570,y=i*97%H;b.fillStyle=i%3?'#8f9a6850':'#e0d4a44a';b.fillRect(x,y,3,2);}
  b.strokeStyle='#213e3920';b.lineWidth=1;
  for(let x=0;x<=15;x++){b.beginPath();b.moveTo(x*C,0);b.lineTo(x*C,H);b.stroke();}
  for(let y=0;y<=16;y++){b.beginPath();b.moveTo(0,y*C);b.lineTo(600,y*C);b.stroke();}
  // Reserve the border for scenery; every buildable square remains unobscured.
  for(let i=0;i<10;i++){const x=14+i*57;b.fillStyle='#58774d';b.beginPath();b.arc(x,19,10,0,Math.PI*2);b.fill();b.fillStyle='#879663';b.beginPath();b.arc(x-3,16,5,0,Math.PI*2);b.fill();}
  b.fillStyle='#dddbc0';b.fillRect(566,7,18,26);polygon(b,[[562,8],[575,0],[588,8]],'#ad5c43');b.fillStyle='#e7b459';b.fillRect(572,12,6,8);
  b.strokeStyle='#d8ecd1aa';b.lineWidth=3;b.beginPath();for(let y=0;y<=640;y+=20){const x=610+Math.sin(y*.042)*7;y?b.lineTo(x,y):b.moveTo(x,y);}b.stroke();
  b.fillStyle='#926e4e';b.fillRect(583,608,75,13);b.strokeStyle='#d2ad7d';b.lineWidth=2;for(let x=590;x<650;x+=12){b.beginPath();b.moveTo(x,609);b.lineTo(x,619);b.stroke();}
  for(let i=0;i<5;i++){const x=20+i*99;b.fillStyle='#e6d4a6';b.fillRect(x,615,40,23);polygon(b,[[x-4,615],[x+20,601],[x+44,615]],'#a55c44','#724738');b.fillStyle='#4c665b';b.fillRect(x+17,623,8,15);}
  b.save();b.translate(949,592);b.strokeStyle='#add5ba55';b.lineWidth=2;b.beginPath();b.arc(0,0,25,0,Math.PI*2);b.stroke();for(let i=0;i<8;i++){b.save();b.rotate(i*Math.PI/4);polygon(b,[[0,-29],[-5,0],[0,-6],[5,0]],i%2?'#86b7ae50':'#d9e1bd90');b.restore();}b.restore();
  b.fillStyle='#ebe7c66a';b.font='italic 18px Georgia';b.fillText('The Outer Sound',742,625);
  function stone(c,x,y){const px=x*C,py=y*C;c.fillStyle='#5e6150';c.fillRect(px+3,py+6,36,33);c.fillStyle='#d3bf91';c.fillRect(px+1,py+1,36,32);c.strokeStyle='#8e8969';c.lineWidth=1.5;c.strokeRect(px+1,py+1,36,32);c.beginPath();c.moveTo(px+2,py+17);c.lineTo(px+36,py+17);c.moveTo(px+20,py+1);c.lineTo(px+20,py+17);c.moveTo(px+10,py+17);c.lineTo(px+10,py+32);c.moveTo(px+29,py+17);c.lineTo(px+29,py+32);c.stroke();c.fillStyle='#eddbad';for(let j=0;j<3;j++)c.fillRect(px+3+j*12,py+2,8,6);c.fillRect(px+2,py+10,34,2);}
  function rubble(c,x,y){const px=x*C,py=y*C;for(let i=0;i<5;i++){c.fillStyle=i%2?'#bda878':'#847e60';c.fillRect(px+4+i*6,py+13+(i*7%16),7,5);}c.strokeStyle='#746b5360';c.beginPath();c.moveTo(px+4,py+30);c.lineTo(px+35,py+7);c.stroke();}
  function building(c,v){
    const x=v.x*C,y=v.y*C,w=v.w*C,h=v.h*C,type=v.type;
    if(v.hp<=0){for(let a=0;a<v.w;a++)for(let d=0;d<v.h;d++)rubble(c,v.x+a,v.y+d);c.fillStyle='#542e29';c.font='bold 11px system-ui';c.textAlign='center';c.fillText('DISABLED',x+w/2,y+h/2);c.textAlign='left';return;}
    c.fillStyle='#183f3840';c.fillRect(x+8,y+10,w-5,h-4);c.fillStyle='#9d9676';c.fillRect(x+4,y+7,w-9,h-9);c.fillStyle=type==='mage'?'#c7ccba':'#e0cfa1';c.fillRect(x+2,y+2,w-10,h-11);
    c.strokeStyle='#746e54';c.lineWidth=2;c.strokeRect(x+2,y+2,w-10,h-11);
    c.strokeStyle='#aa9c78';c.lineWidth=1;for(let a=y+18;a<y+h-10;a+=16){c.beginPath();c.moveTo(x+3,a);c.lineTo(x+w-9,a);c.stroke();for(let z=x+10+(a%3)*3;z<x+w-10;z+=20){c.beginPath();c.moveTo(z,a);c.lineTo(z,a+14);c.stroke();}}
    c.fillStyle='#eee0b2';for(let a=x+1;a<x+w-10;a+=15)c.fillRect(a,y+1,10,8);
    const cx=x+w/2,cy=y+h/2;
    if(type==='keep'){
      for(const tx of [x+4,x+w-23]){c.fillStyle='#b2a17a';c.fillRect(tx,y+8,15,h-20);c.fillStyle='#edd8a7';c.fillRect(tx-2,y+1,19,14);}
      c.fillStyle='#695c48';c.beginPath();c.roundRect(cx-10,y+h-34,20,25,[10,10,0,0]);c.fill();
      c.fillStyle='#a8573d';c.fillRect(cx-9,y+14,18,22);polygon(c,[[cx-9,y+36],[cx+9,y+36],[cx,y+45]],'#a8573d');
      c.strokeStyle='#544f3c';c.beginPath();c.moveTo(x+w-20,y+2);c.lineTo(x+w-20,y-16);c.stroke();polygon(c,[[x+w-20,y-16],[x+w+2,y-12],[x+w-20,y-4]],v.hp>3?'#f6ce7d':'#dd714d');
    }else if(type==='mage'){
      polygon(c,[[cx-25,cy-10],[cx,cy-40],[cx+25,cy-10]],'#597d81','#35555c');c.fillStyle='#b3e4d5';c.beginPath();c.arc(cx,cy-15,8,0,Math.PI*2);c.fill();c.fillStyle='#3f6268';c.fillRect(cx-9,cy+2,18,17);
    }else if(type==='captain'){
      polygon(c,[[x-1,y+13],[cx,y-6],[x+w-7,y+13]],'#a75b41','#6f4a39');c.fillStyle='#a8573d';c.fillRect(cx-12,cy-10,24,20);c.fillStyle='#edc680';c.beginPath();c.arc(cx,cy,7,0,Math.PI*2);c.fill();c.strokeStyle='#a8573d';c.lineWidth=2;c.beginPath();c.moveTo(cx,cy-6);c.lineTo(cx,cy+6);c.moveTo(cx-6,cy);c.lineTo(cx+6,cy);c.stroke();
    }else if(type==='workshop'){
      polygon(c,[[x-1,y+17],[cx,y-5],[x+w-7,y+17]],'#697765','#394e43');c.fillStyle='#614a38';c.fillRect(cx-19,cy+3,38,15);c.fillStyle='#a4b8a5';c.fillRect(cx-13,cy-2,26,8);c.fillStyle='#615744';c.fillRect(x+w-24,y-8,10,28);
      c.strokeStyle='#edc680';c.lineWidth=4;c.beginPath();c.moveTo(cx-7,cy-13);c.lineTo(cx+10,cy+4);c.stroke();c.fillStyle='#edc680';c.fillRect(cx-13,cy-20,18,8);
    }
    if(v.hp<v.maxHp){c.strokeStyle='#705849';c.lineWidth=2;c.beginPath();c.moveTo(x+w-14,y+18);c.lineTo(x+w-29,y+29);c.lineTo(x+w-19,y+40);c.lineTo(x+w-30,y+52);c.stroke();}
    const barY=y+h-8;c.fillStyle='#596351';c.fillRect(x+5,barY,w-15,5);c.fillStyle=v.hp<=v.maxHp*.3?'#d86f52':'#edcf88';c.fillRect(x+5,barY,(w-15)*v.hp/v.maxHp,5);
    c.fillStyle='#203f38';c.font='bold 10px system-ui';c.textAlign='center';c.fillText(type==='keep'?'KEEP '+v.hp+'/'+v.maxHp:type==='tower'?'BATTERY':type==='mage'?'MAGICIAN':type==='captain'?'CAPTAIN':'WORKSHOP',cx,y+h+10);c.textAlign='left';
  }
  function cannon(c,x,y,angle,ready,auto){c.save();c.translate(x,y);c.fillStyle='#1c353a66';c.beginPath();c.ellipse(3,8,20,12,0,0,Math.PI*2);c.fill();c.fillStyle=auto?'#9eb5a0':'#caab75';c.beginPath();c.arc(0,0,18,0,Math.PI*2);c.fill();c.rotate(angle);c.fillStyle='#172f34';c.fillRect(-7,-8,34,16);c.fillStyle=ready?'#8ab5ad':'#bb8060';c.fillRect(-5,-5,30,4);c.fillStyle='#091f26';c.fillRect(23,-7,6,14);c.restore();}
  function ship(c,s,time){
    c.save();c.translate(s.x,s.y+(reduced?0:Math.sin(time*2+s.id)*2));c.scale(s.type==='galleon'?1.12:s.type==='cutter'?.8:.92,1);
    c.fillStyle='#a8e1c133';c.beginPath();c.ellipse(4,16,39,53,0,0,Math.PI*2);c.fill();polygon(c,[[-26,35],[-30,-24],[-14,-43],[14,-43],[30,-24],[26,35],[0,44]],s.type==='armor'?'#455c58':'#654737','#182f30');
    c.fillStyle='#b78657';c.fillRect(-21,-25,42,55);c.strokeStyle='#402f29';c.lineWidth=3;c.beginPath();c.moveTo(0,-56);c.lineTo(0,32);c.stroke();
    polygon(c,[[-25,-28],[24,-34],[22,6],[-23,12]],s.type==='armor'?'#a9c6ba':s.type==='cutter'?'#d3dfc6':'#f7e4bc','#b3ad8a');
    c.fillStyle=s.type==='galleon'?'#a44e3c':'#234f54';c.fillRect(-4,-25,8,28);c.fillRect(-12,-16,24,8);polygon(c,[[0,-56],[25,-50],[0,-44]],'#ca654a');
    if(s.type==='galleon')polygon(c,[[-19,12],[20,9],[17,30],[-17,32]],'#e0c89b');
    if(s.type==='armor'){c.strokeStyle='#bdd7cb';c.lineWidth=3;c.strokeRect(-27,-19,54,51);}
    c.strokeStyle='#dfcbb3';c.lineWidth=1;for(const x of [-18,18]){c.beginPath();c.moveTo(0,-48);c.lineTo(x,32);c.stroke();}
    c.fillStyle='#273c3b';for(const x of [-18,18])c.fillRect(x-3,17,6,7);c.fillStyle='#fff2ca';for(let i=0;i<s.hp;i++)c.fillRect(-10+i*9,50,6,5);c.restore();
  }
  window.HarborArt={background,stone,rubble,building,ship,cannon,polygon};
})();

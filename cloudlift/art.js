(() => {
 'use strict';const E=CloudEngine,cache=document.createElement('canvas');cache.width=E.W;cache.height=600;const b=cache.getContext('2d');
 const C={ink:'#283e4a',gold:'#efbb4e',cream:'#fff3d3',red:'#bc493e',pine:'#506a68'};
 function poly(g,pts,color){g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
 function line(g,x,y,xx,yy,color,width=2){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();}
 const sky=b.createLinearGradient(0,0,0,530);sky.addColorStop(0,'#9dacca');sky.addColorStop(.65,'#edd2bc');sky.addColorStop(1,'#f5d9b8');b.fillStyle=sky;b.fillRect(0,0,E.W,600);
 b.fillStyle='#fff0ca';b.beginPath();b.arc(1890,110,62,0,Math.PI*2);b.fill();
 for(let i=0;i<8;i++){const x=i*390-150,peak=75+(i%3)*30;poly(b,[[x,440],[x+185,peak],[x+410,440]],'#9297ad');poly(b,[[x+105,232],[x+185,peak],[x+268,210],[x+215,192],[x+180,224],[x+160,193]],'#ebdfd8');poly(b,[[x+185,peak],[x+410,440],[x+260,440],[x+196,193]],'#818c9e');line(b,x+193,peak+75,x+229,273,'#9aa2b3',2);line(b,x+229,273,x+285,333,'#9aa2b3',2);line(b,x+158,250,x+126,330,'#acacbb',2);line(b,x+139,288,x+174,280,'#acacbb',2);}
 b.fillStyle='#ffefd733';for(let i=0;i<10;i++){const x=i*280+60,y=95+(i%3)*34;b.beginPath();b.ellipse(x,y,75,8,0,0,7);b.ellipse(x+45,y+4,68,6,0,0,7);b.fill();}
 poly(b,[[0,390],[200,350],[420,416],[690,310],[900,402],[1180,325],[1470,390],[1770,290],[1980,420],[2230,345],[2440,390],[2440,530],[0,530]],'#738c8b');
 for(let i=0;i<110;i++){const x=i*24+Math.sin(i*9)*10,y=450+Math.sin(i*2)*18,h=22+(i*13)%38;line(b,x,y,x,y+h,'#485f60',3);poly(b,[[x-12,y+h*.6],[x,y-h],[x+12,y+h*.6]],i%2?'#5c7774':'#637f7a');}
 b.fillStyle='#89947d';b.fillRect(0,510,E.W,90);b.fillStyle='#4f6b66';b.fillRect(0,510,E.W,5);for(let i=0;i<220;i++){const x=i*12,y=526+(i*19)%24;line(b,x,y,x+4,y+2,'#b7b296',1);}
 // A little mountain airfield, painted into the scenery once.
 b.fillStyle='#d8c9aa';b.fillRect(63,421,103,65);poly(b,[[51,423],[115,385],[181,423]],'#5e7378');b.fillStyle='#516979';b.fillRect(82,442,20,25);b.fillRect(125,442,22,44);b.fillStyle='#fff1d1';b.fillRect(108,399,17,17);b.fillStyle='#bf554a';b.fillRect(114,402,5,11);b.fillRect(111,405,11,5);
 line(b,243,395,243,510,'#f6dfbd',4);poly(b,[[245,398],[290,408],[245,420]],'#bd5946');line(b,252,407,271,411,'#ffdfbe',4);
 function person(g,x,y,n){g.fillStyle='#f5d1a3';g.beginPath();g.arc(x,y-16,4,0,7);g.fill();g.fillStyle=n%2?'#a24747':'#e2ad4f';g.fillRect(x-4,y-12,8,11);line(g,x-2,y-2,x-4,y+6,C.ink,2);line(g,x+2,y-2,x+4,y+6,C.ink,2);line(g,x-4,y-9,x-9,y-15,C.ink,2);}
 function heli(g,s){g.save();g.translate(s.x,s.y);if(s.inv>0&&Math.floor(s.time*14)%2)g.globalAlpha=.45;g.scale(s.face,1);g.rotate(s.vx*.0004*s.face);
  g.fillStyle='#253e4a';g.fillRect(-23,20,50,3);line(g,-15,9,-18,20,C.ink,3);line(g,17,9,20,20,C.ink,3);
  poly(g,[[-22,-5],[-76,-12],[-80,-22],[-88,-22],[-82,2],[-20,8]],'#d59b36');line(g,-80,-28,-80,-3,C.ink,3);line(g,-88,-16,-72,-16,C.ink,2);
  g.fillStyle=C.gold;g.beginPath();g.ellipse(1,0,34,18,0,0,7);g.fill();g.strokeStyle='#7e643d';g.lineWidth=2;g.stroke();line(g,-20,14,22,14,'#c18c36',3);line(g,-53,-5,-33,-2,'#f6d17c',2);g.fillStyle='#fff1ca';g.beginPath();g.arc(30,3,2,0,7);g.fill();
  poly(g,[[10,-14],[24,-10],[33,0],[9,0]],'#426a7b');poly(g,[[13,-12],[20,-10],[27,-3],[13,-3]],'#b6d3d4');g.fillStyle='#f4ce72';g.fillRect(-20,-9,22,21);g.strokeStyle='#9e7f44';g.strokeRect(-20,-9,22,21);g.fillStyle=C.cream;g.fillRect(-13,-5,9,3);g.fillRect(-10,-8,3,9);
  g.fillStyle=C.ink;g.fillRect(-11,-24,22,9);line(g,0,-25,0,-33,C.ink,3);const rotor=Math.sin(s.time*60)*14;line(g,-57-rotor,-33,57+rotor,-33,'#334b58',3);line(g,-50+rotor,-36,50-rotor,-36,'#ecddc1',1);
  for(let i=0;i<4;i++){g.fillStyle=i<s.aboard?'#fff5d3':'#ac8438';g.beginPath();g.arc(-17+i*8,8,2,0,7);g.fill();}g.restore();
 }
 function render(g,s,effects=[]){const legible=Math.min(2,Math.max(1,1000/Math.max(1,g.canvas.clientWidth)));g.clearRect(0,0,1000,600);g.save();g.translate(-s.cam,0);g.drawImage(cache,0,0);
  for(const p of s.pads){if(!p.id||E.levels[s.level-1].people[p.id-1]){g.fillStyle=p.id?'#f0dbc0':'#dce8cd';g.fillRect(p.x-67,508,134,5);g.fillStyle=C.ink;g.font='bold '+Math.round(13*legible)+'px monospace';g.textAlign='center';g.fillText(p.id?'RESCUE '+p.id:'BASE',p.x,542);line(g,p.x-60,500,p.x-60,484,C.cream,3);line(g,p.x+60,500,p.x+60,484,C.cream,3);
    if(p.id){poly(g,[[p.x+32,487],[p.x+49,452],[p.x+69,487]],'#ce9274');poly(g,[[p.x+49,452],[p.x+54,487],[p.x+69,487]],'#a96d60');for(let i=0;i<p.left;i++)person(g,p.x-40+i*18,498,i);}
    if(Math.abs(s.x-p.x)<67&&s.y>390){g.strokeStyle=Math.abs(s.vx)<55?'#d4f4bf':'#f9d27b';g.lineWidth=2;g.setLineDash([6,5]);g.strokeRect(p.x-55,475,110,30);g.setLineDash([]);g.fillStyle=C.ink;g.font='bold '+Math.round(12*legible)+'px monospace';g.fillText(s.landed===p.id?'HOLD STILL':'LANDING ASSIST',p.x,451);}
   }}
  for(const t of s.guns){if(t.hp<=0){g.fillStyle='#6d7066';g.fillRect(t.x-19,t.y+8,38,12);continue;}g.fillStyle=C.red;g.fillRect(t.x-22,t.y-5,44,18);g.fillStyle=C.ink;g.fillRect(t.x-25,t.y+12,50,5);const a=t.aim?Math.atan2(t.aim.y-t.y,t.aim.x-t.x):-Math.PI/2;line(g,t.x,t.y,t.x+Math.cos(a)*31,t.y+Math.sin(a)*31,C.ink,8);g.fillStyle='#f6d1a0';g.fillRect(t.x-5,t.y-9,10,9);
   if(t.aim){const p=t.aim;g.strokeStyle=C.red;g.lineWidth=2;g.setLineDash([5,6]);g.beginPath();g.arc(p.x,p.y,25,0,7);g.stroke();g.setLineDash([]);line(g,p.x-34,p.y,p.x+34,p.y,C.red,1);line(g,p.x,p.y-34,p.x,p.y+34,C.red,1);}
  }
  for(const d of s.drones)if(d.hp>0){g.save();g.translate(d.x,d.y);poly(g,[[-29,0],[0,-12],[29,0],[5,12],[-5,12]],'#955458');line(g,-38,-6,38,-6,C.ink,3);g.fillStyle='#f0d1bb';g.fillRect(-6,-5,12,6);g.restore();}
  for(const a of s.shots)line(g,a.x-a.vx*.018,a.y,a.x,a.y,'#fff9df',5);
  for(const a of s.bullets){g.fillStyle=C.cream;g.beginPath();g.arc(a.x,a.y,legible>1?9:7,0,7);g.fill();g.fillStyle=C.red;g.beginPath();g.arc(a.x,a.y,legible>1?5:4,0,7);g.fill();}
  heli(g,s);
  for(const p of effects){g.globalAlpha=Math.min(1,p.life*2);g.fillStyle=p.color;g.fillRect(p.x,p.y,4,4);}g.globalAlpha=1;g.restore();
  // Route strip stays readable regardless of camera position.
  g.fillStyle='#293f4bea';g.fillRect(20,555,960,35);line(g,115,574,938,574,'#8dabb1',2);g.fillStyle='#eee2c9';g.font='bold '+Math.round(11*legible)+'px monospace';g.textAlign='left';g.fillText('ROUTE',32,578);
  for(const p of s.pads){if(p.id&&!E.levels[s.level-1].people[p.id-1])continue;const x=115+p.x/E.W*823;g.fillStyle=p.id?(p.left?'#efbb4e':'#8bada4'):'#d5e9cd';g.fillRect(x-5,568,10,10);g.fillText(p.id?p.left+'':'B',x+9,578);}
  g.fillStyle='#fff7dd';g.beginPath();const xx=115+s.x/E.W*823;g.moveTo(xx,559);g.lineTo(xx-5,565);g.lineTo(xx+5,565);g.fill();
  const dest=s.aboard===4||s.aboard&&s.pads.every(p=>!p.left)?s.pads[0]:s.pads.filter(p=>p.left).sort((a,b)=>Math.abs(a.x-s.x)-Math.abs(b.x-s.x))[0]||s.pads[0];
  const text=(dest.id?'RESCUE '+dest.id:'BASE')+' '+(dest.x<s.x?'←':'→')+' '+Math.round(Math.abs(dest.x-s.x)/10)*10+' m';g.font='bold '+Math.round(13*legible)+'px monospace';const tw=g.measureText(text).width;g.fillStyle='#293f4be0';g.fillRect(20,18,tw+24,23*legible);g.fillStyle='#fff0c9';g.fillText(text,32,18+16*legible);
 }
 window.CloudArt={render};
})();

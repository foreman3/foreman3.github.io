(() => {
 'use strict';const W=900,H=600,E=PocketEngine,cream='#f6e6c4',wine='#481f31',gold='#efbb65',zoom=matchMedia('(max-width:900px),(pointer:coarse)').matches?1.65:1;
 const project=(x,y)=>({x:450+x*(1.18-y*.0005)*zoom,y:554-y*.425,k:1.18-y*.0005});
 function poly(g,points,fill,stroke){g.beginPath();for(let i=0;i<points.length;i++)g[i?'lineTo':'moveTo'](...points[i]);g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.stroke();}}
 function text(g,t,x,y,size=15,color=cream,font='monospace'){g.fillStyle=color;g.font=`bold ${size}px ${font}`;g.fillText(t,x,y);}
 const bg=document.createElement('canvas');bg.width=W;bg.height=H;const b=bg.getContext('2d');
 b.fillStyle='#381d2b';b.fillRect(0,0,W,H);
 for(let i=0;i<15;i++){b.fillStyle=i%2?'#592d3d':'#522737';b.fillRect(i*64,0,52,190);b.fillStyle='#7e4850';b.fillRect(i*64+4,0,2,180);}
 b.fillStyle='#ddb78a';b.fillRect(0,167,900,8);b.fillStyle='#a06852';b.fillRect(0,175,900,6);
 // Rounded marquee, turned brass lights, and the pin-deck hood.
 b.fillStyle='#f0d8ad';b.beginPath();b.roundRect(255,16,390,95,45);b.fill();b.strokeStyle='#b56b54';b.lineWidth=3;b.stroke();b.textAlign='center';text(b,'Pocket Lanes',450,70,40,wine,'Georgia');text(b,'TEN PINS • ONE GOOD LINE',450,93,10,'#85503e');
 for(const x of[222,678]){b.strokeStyle='#b78d62';b.lineWidth=3;b.beginPath();b.moveTo(x,0);b.lineTo(x,50);b.stroke();poly(b,[[x-30,64],[x-19,46],[x+19,46],[x+30,64]],'#be794d');b.fillStyle='#f8d69c';b.beginPath();b.ellipse(x,65,27,5,0,0,7);b.fill();}
 // Side lanes suggest a whole club, with subdued contrast.
 for(const side of[-1,1]){poly(b,[[450+side*116,180],[450+side*212,180],[450+side*410,600],[450+side*205,600]],'#7c5747');for(let i=0;i<8;i++){b.strokeStyle='#996d4e';b.lineWidth=1;b.beginPath();b.moveTo(450+side*(122+i*11),180);b.lineTo(450+side*(215+i*25),600);b.stroke();}}
 poly(b,[project(-170,0),project(170,0),project(170,1050),project(-170,1050)].map(p=>[p.x,p.y]),'#211d26','#9c775d');
 const corners=[project(-150,0),project(150,0),project(150,1050),project(-150,1050)];poly(b,corners.map(p=>[p.x,p.y]),'#dbb47a','#f1d29e');
 for(let i=0;i<25;i++){const x=-150+i*12,p1=project(x,0),p2=project(x,1050),p3=project(x+12,1050),p4=project(x+12,0);poly(b,[[p1.x,p1.y],[p2.x,p2.y],[p3.x,p3.y],[p4.x,p4.y]],i%3===0?'#d3a66b':i%3===1?'#e7c28a':'#dfb67a');for(let j=0;j<5;j++){const y=50+j*220+(i%3)*50,q1=project(x,y),q2=project(x+11,y);b.strokeStyle='#bd915d66';b.lineWidth=1;b.beginPath();b.moveTo(q1.x,q1.y);b.lineTo(q2.x,q2.y);b.stroke();}}
 for(let i=0;i<42;i++){const p=project(-146+(i*47)%292,20+(i*97)%990);b.strokeStyle='#a6774940';b.beginPath();b.moveTo(p.x,p.y);b.lineTo(p.x+1,p.y+12+i%16);b.stroke();}
 const foul=project(0,80);b.strokeStyle='#7a3e3c';b.lineWidth=5;b.beginPath();b.moveTo(project(-150,80).x,foul.y);b.lineTo(project(150,80).x,foul.y);b.stroke();
 for(let i=-3;i<=3;i++){const p=project(i*32,390-Math.abs(i)*22);poly(b,[[p.x,p.y-6],[p.x-4,p.y+4],[p.x+4,p.y+4]],'#71503a');}
 b.fillStyle='#34272e';b.fillRect(334,112,232,12);b.fillStyle='#dda165';for(let i=0;i<10;i++)b.fillRect(342+i*23,116,10,2);
 // Ball-return furniture and floor terrazzo.
 poly(b,[[0,568],[246,540],[654,540],[900,568],[900,600],[0,600]],'#a46a65');for(let i=0;i<90;i++){b.fillStyle=['#d7ada0','#7e4c51','#ecc7a5'][i%3];b.fillRect((i*137)%900,572+(i*17)%28,2+i%3,2);}
 if(zoom===1){b.fillStyle='#643346';b.beginPath();b.roundRect(18,220,195,178,10);b.fill();b.strokeStyle='#b5806b';b.lineWidth=2;b.stroke();
 b.fillStyle='#2f2730';b.beginPath();b.roundRect(698,295,180,80,25);b.fill();b.fillStyle='#c88660';b.fillRect(706,346,164,10);
 for(let i=0;i<3;i++){const x=736+i*48;b.fillStyle=['#547b7d','#c17b50','#98617c'][i];b.beginPath();b.arc(x,331,20,0,7);b.fill();b.fillStyle='#2f2730';for(let j=0;j<3;j++){b.beginPath();b.arc(x+(j-1)*5,325+(j%2)*5,2,0,7);b.fill();}}
 b.textAlign='center';text(b,'HOUSE RULE',789,208,11,gold);text(b,'Spare a thought.',789,232,18,cream,'Georgia');text(b,'Then pick it up.',789,253,18,cream,'Georgia');text(b,'BALL RETURN',788,390,10,'#d9b6ad');text(b,'SHOES / 75¢',790,478,12,gold);text(b,'PLEASE RETURN',790,496,10,cream);text(b,'WITH A SMILE',790,511,10,cream);
 }
 // Ball is cached; avoid per-frame gradient allocation.
 const sprite=document.createElement('canvas');sprite.width=sprite.height=100;const c=sprite.getContext('2d'),gr=c.createRadialGradient(36,27,4,50,50,44);gr.addColorStop(0,'#e3b8bd');gr.addColorStop(.4,'#af5c7c');gr.addColorStop(1,'#481e48');c.fillStyle=gr;c.beginPath();c.arc(50,50,43,0,7);c.fill();c.save();c.clip();c.strokeStyle='#efc0b155';c.lineWidth=6;for(let i=0;i<5;i++){c.beginPath();c.ellipse(43,50,17+i*13,40+i*4,-.5,0,7);c.stroke();}c.restore();c.fillStyle='#34152b';for(const [x,y]of[[45,30],[57,31],[51,43]]){c.beginPath();c.arc(x,y,3,0,7);c.fill();}
 function pin(g,p){if(p.removed)return;const q=project(p.x,p.y);g.save();g.translate(q.x,q.y);g.scale(q.k*(zoom>1?1.2:1),q.k*(zoom>1?1.2:1));g.fillStyle='#43293b55';g.beginPath();g.ellipse(3,4,p.down?16:11,4,0,0,7);g.fill();if(p.down)g.rotate(p.angle-Math.PI/2);g.fillStyle='#fff4d9';g.beginPath();g.moveTo(-7,0);g.bezierCurveTo(-13,-7,-7,-14,-4,-18);g.lineTo(-4,-25);g.bezierCurveTo(-10,-33,10,-33,4,-25);g.lineTo(4,-18);g.bezierCurveTo(7,-14,13,-7,7,0);g.closePath();g.fill();g.strokeStyle='#d0ac8f';g.lineWidth=1;g.stroke();g.fillStyle='#b44c4d';g.fillRect(-4,-23,8,3);g.fillRect(-4,-18,8,2);g.restore();}
 function render(g,s){g.drawImage(bg,0,0);g.textAlign='center';if(zoom===1){text(g,'YOUR CARD',115,246,13,gold);for(let i=0;i<3;i++){const y=275+i*35;g.strokeStyle='#b5806b66';g.beginPath();g.moveTo(34,y+12);g.lineTo(197,y+12);g.stroke();text(g,String(i+1),49,y,13,'#ca9d92');text(g,s.history[i]?.mark??(i+1===s.rack?'•':'—'),113,y,25);text(g,s.history[i]?s.history[i].pins+' / 10':'',172,y,10,'#ca9d92');}text(g,E.levels[s.level-1].name.toUpperCase(),115,432,11,gold);text(g,'TARGET '+E.levels[s.level-1].target+' / 30',115,452,14);text(g,E.levels[s.level-1].bumpers?'BUMPERS ON':'OPEN GUTTERS',115,473,10,'#d9b6ad');
 }
 const o=E.oil(s),dry=project(0,o.dry);g.fillStyle='#5a93a51b';poly(g,[[project(-149,80).x,520],[project(149,80).x,520],[project(149,o.dry).x,dry.y],[project(-149,o.dry).x,dry.y]],'#5a93a51b');g.setLineDash([4,5]);g.lineWidth=1;g.strokeStyle='#8d6e5140';g.beginPath();g.moveTo(project(-150,o.dry).x,dry.y);g.lineTo(project(150,o.dry).x,dry.y);g.stroke();g.setLineDash([]);
 if(s.phase==='ready'){g.strokeStyle='#743a4ca0';g.lineWidth=3;g.setLineDash([3,10]);g.lineCap='round';g.beginPath();let end=E.levels[s.level-1].bumpers?760:510;for(let y=38;y<=end;y+=15){const p=project(s.pos+E.release(s)*(y-38),y);if(y===38)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);}g.stroke();g.setLineDash([]);}
 for(let i=s.pins.length-1;i>=0;i--)pin(g,s.pins[i]);
 if(s.ball&&!s.gutter){g.lineWidth=3;g.strokeStyle='#784b7e50';g.beginPath();for(let i=0;i<8;i++){const back=i*10,p=project(s.ball.x-s.ball.vx/Math.max(1,s.ball.vy)*back,s.ball.y-back);if(!i)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);}g.stroke();}
 const ball=s.ball??(s.phase==='ready'?{x:s.pos,y:38}:null);if(ball){const p=project(ball.x,ball.y);g.fillStyle='#43293b55';g.beginPath();g.ellipse(p.x+4,p.y+4,19*p.k,8*p.k,0,0,7);g.fill();g.save();g.translate(p.x,p.y-8*p.k);g.rotate(s.ball?s.ball.y*.007:0);g.drawImage(sprite,-20*p.k,-20*p.k,40*p.k,40*p.k);g.restore();}
 text(g,'ROLL '+s.shot+' OF 2  /  '+s.pins.filter(p=>!p.removed&&!p.down).length+' STANDING',450,589,11,'#f9dec1');
 if(s.phase==='ready'&&s.shot===2){g.fillStyle='#351c2be0';g.beginPath();g.roundRect(33,112,164,91,8);g.fill();text(g,'SPARE MAP',115,130,10,gold);for(const p of s.pins){const row=Math.floor((p.id===1?0:p.id<4?1:p.id<7?2:3));g.fillStyle=p.removed?'#755461':cream;g.beginPath();g.arc(115+p.x*.85,151+row*12,4,0,7);g.fill();}}
 if(s.phase==='between'){g.fillStyle='#351c2be8';g.beginPath();g.roundRect(275,280,350,110,10);g.fill();text(g,s.last.startsWith('STRIKE')?'STRIKE':s.last.startsWith('SPARE')?'SPARE':'RACK BANKED',450,325,30,gold,'Georgia');text(g,'Press NEXT RACK to keep bowling',450,356,13);}
 g.textAlign='left';
 }
 window.PocketArt={render,project,zoom};
})();

/* Cached storybook scenery; all actors use logical coordinates. No remote art. */
window.BrambleArt=(()=>{
 const bg=document.createElement('canvas');bg.width=960;bg.height=600;const c=bg.getContext('2d');
 function ellipse(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
 function path(g,p,fill,stroke,width=2){g.beginPath();for(const v of p){if(v[0]==='M')g.moveTo(v[1],v[2]);else if(v[0]==='L')g.lineTo(v[1],v[2]);else if(v[0]==='Q')g.quadraticCurveTo(...v.slice(1));else if(v[0]==='C')g.bezierCurveTo(...v.slice(1));else g.closePath();}if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
 function line(g,x,y,X,Y,color,w=2){g.strokeStyle=color;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.stroke();}
 const sky=c.createLinearGradient(0,0,0,540);sky.addColorStop(0,'#b9a7c7');sky.addColorStop(.65,'#edc0ad');sky.addColorStop(1,'#f8d5a7');c.fillStyle=sky;c.fillRect(0,0,960,600);
 ellipse(c,735,141,69,69,'#ffe2b0');ellipse(c,715,131,62,62,'#ffe7bd');
 for(let j=0;j<5;j++){const y=125+j*70;path(c,[['M',180,y+140],['Q',380,y-70,610,y+95],['Q',800,y+15,960,y+85],['L',960,600],['L',180,600],['Z']],['#b3a2bc','#a998b2','#978daa','#8b839e','#777d94'][j]);}
 // Distant evergreen silhouettes, field stitchwork, and the blackberry thicket.
 for(let i=0;i<23;i++){let x=200+i*36,y=430+Math.sin(i*2)*23;path(c,[['M',x,y-83],['L',x-18,y-33],['L',x-9,y-33],['L',x-29,y],['L',x+28,y],['L',x+9,y-33],['L',x+17,y-33],['Z']],'#666e88');}
 path(c,[['M',170,510],['Q',410,470,620,520],['Q',830,470,960,490],['L',960,600],['L',170,600],['Z']],'#696b82');
 for(let i=0;i<80;i++){const x=220+(i*139)%730,y=530+(i*71)%70;line(c,x,y,x+12,y-9,'#96918e',1);if(i%4===0)ellipse(c,x,y,3,3,'#e0a5a4');}
 // Fine contour hatching and meadow blooms stay in the cached background.
 for(let k=0;k<35;k++){const x=235+(k*137)%710,y=365+(k*37)%137;line(c,x,y,x+14,y+2,'#ada2b555',1);}
 for(let j=0;j<12;j++){const x=220+j*59,y=524+(j*17)%29;path(c,[['M',x,y+18],['Q',x+6,y,x,y-10]],null,'#b3aa9a',1.5);ellipse(c,x,y-10,4,3,'#e6b5aa');ellipse(c,x-4,y-7,3,3,'#d5a3ab');ellipse(c,x+4,y-7,3,3,'#e6b5aa');ellipse(c,x,y-5,2,2,'#f8d29b');}
 // Great tree and built-in pantry, with visible baskets.
 path(c,[['M',0,0],['L',114,0],['Q',100,180,95,250],['Q',124,420,108,550],['L',195,600],['L',0,600],['Z']],'#51435d');
 for(let i=0;i<10;i++)path(c,[['M',15+i*9,20],['Q',20+i*6,250,18+i*9,510]],null,'#6f5368',2);
 path(c,[['M',50,85],['Q',150,10,295,42],['L',320,10],['Q',185,-30,44,35],['Z']],'#51435d');
 for(let i=0;i<21;i++)ellipse(c,(i*79)%330-40,(i*43)%80-10,55,25,['#68617b','#7b6d83','#5c5672'][i%3]);
 c.fillStyle='#39364e';c.fillRect(15,432,77,111);path(c,[['M',10,435],['L',53,405],['L',98,435],['Z']],'#ae7380');line(c,14,543,97,543,'#cbad94',5);
 for(let i=0;i<3;i++){c.fillStyle='#b0867d';c.fillRect(24+i*21,495,17,27);for(let j=0;j<6;j++)ellipse(c,27+i*21+(j%3)*5,493-Math.floor(j/3)*5,4,4,'#7d486d');line(c,24+i*21,508,40+i*21,508,'#e0b89c',2);}
 c.save();c.translate(54,457);c.rotate(-.05);c.fillStyle='#efcf9e';c.fillRect(-40,-12,80,24);c.fillStyle='#5b425a';c.font='bold 11px Georgia';c.textAlign='center';c.fillText('THE PANTRY',0,4);c.restore();
 line(c,146,27,146,530,'#423d56',5);line(c,151,27,151,530,'#d1a391',2);line(c,116,31,183,31,'#e7ba95',6);ellipse(c,149,31,11,11,'#6e5269');ellipse(c,149,31,5,5,'#d0b39c');
 // Foreground berries and carved watch marker.
 for(let i=0;i<14;i++){const x=330+i*48,y=590+(i%2)*8;ellipse(c,x,y,35,24,'#4f536c');for(let j=0;j<3;j++)ellipse(c,x+j*10-8,y-10-j%2*5,5,5,'#a46b8c');}
 c.fillStyle='#e8c9a7';c.fillRect(794,550,129,31);line(c,850,580,850,600,'#614c63',8);c.font='bold 13px Georgia';c.textAlign='center';c.fillStyle='#654e63';c.fillText('BLACKBERRY HILL',859,570);
 function wolf(g,e,t){const x=e.x,y=e.y;const open=e.open;
  g.save();g.translate(x,y);g.rotate(Math.sin(t*2+e.id)*.035);
  if(e.arrival>0){g.strokeStyle='#fff0ce';g.setLineDash([4,6]);g.lineWidth=2;g.beginPath();g.ellipse(0,12,43,66,0,0,Math.PI*2);g.stroke();g.setLineDash([]);}
  // Balloon outline, central silk panel, seam, neck and suspension ropes.
  ellipse(g,0,0,27,33,'#513c5a');ellipse(g,-1,-2,24,30,e.hp===2?'#e6ba70':e.type==='shield'?'#979bc2':'#d97e94');ellipse(g,-6,-7,9,20,e.hp===2?'#f5d799':e.type==='shield'?'#b7b9d6':'#eea3ad');
  path(g,[['M',0,-31],['C',14,-14,15,13,0,29]],null,'#ffffff40',1.5);path(g,[['M',-2,28],['L',-5,35],['L',5,35],['Z']],'#654b69');line(g,-5,34,-15,58,'#63536a',1.5);line(g,5,34,14,58,'#63536a',1.5);
  if(e.hp===2){g.fillStyle='#795775';g.fillRect(0,-11,16,18);for(let n=0;n<4;n++){line(g,-3,-10+n*5,3,-10+n*5,'#f5ddae',1);line(g,13,-10+n*5,19,-10+n*5,'#f5ddae',1);}}
  if(e.type==='shield'){g.save();g.translate(-25,6);g.rotate(open?-.95:0);path(g,[['M',-10,-26],['L',7,-30],['L',13,15],['Q',3,26,-7,17],['Z']],open?'#6d6a8b':'#4d526e','#d7d0c5',2);line(g,-4,-15,6,11,'#c3b5af',2);g.restore();}
  // Wolf face with ears, muzzle, brows and paws in a wicker gondola.
  path(g,[['M',-16,53],['L',-20,36],['L',-4,45],['L',8,44],['L',19,35],['L',18,62],['Q',1,77,-16,61],['Z']],'#62627a','#45445d',2);
  path(g,[['M',-15,49],['L',-16,42],['L',-8,47],['Z']],'#bd91a5');path(g,[['M',12,46],['L',17,40],['L',16,51],['Z']],'#bd91a5');
  ellipse(g,-3,61,13,9,'#d2c3c4');ellipse(g,-9,57,4,3,'#33334b');ellipse(g,-9,54,1,1,'#fff4d9');line(g,-4,51,3,49,'#34324b',2);ellipse(g,0,54,2,2,'#fff2d0');ellipse(g,0,54,1,1,'#34324b');
  path(g,[['M',-22,67],['L',22,67],['L',18,87],['L',-17,87],['Z']],'#ab7b83','#654d68',2);for(let j=-12;j<20;j+=7)line(g,j,69,j-2,85,'#d2a596',1);line(g,-20,76,20,76,'#d2a596',2);ellipse(g,-15,67,6,4,'#77738b');ellipse(g,14,67,6,4,'#77738b');
  if(e.stun>0){g.strokeStyle='#f8e5ad';g.lineWidth=2;g.beginPath();g.ellipse(0,-45,22,5,0,0,Math.PI*2);g.stroke();ellipse(g,Math.cos(t*4)*22,-45,3,3,'#fff2bb');}
  if(e.throwIn<.65&&e.canThrow){ellipse(g,24,58,5,5,'#eac8b2');g.fillStyle='#513b57';g.font='bold 22px Georgia';g.fillText('!',27,46);}
  if(e.y>370){path(g,[['M',-7,96],['L',0,104],['L',7,96]],null,'#fff0ce',3);}
  g.restore();
 }
 function fox(g,s){const y=s.y;g.save();g.translate(148,y+20);
  line(g,-24,-48,-24,27,'#f5d2a2',2);line(g,24,-48,24,27,'#f5d2a2',2);line(g,-24,-48,24,-48,'#e8c5a0',3);
  // Curled tail behind coat, fur, cap and a drawn bow.
  path(g,[['M',-8,9],['C',-67,30,-65,-20,-40,-12],['Q',-58,0,-22,-2],['Z']],'#ce8979');path(g,[['M',-45,-11],['Q',-61,-5,-51,7],['L',-36,0],['Z']],'#f5dfbc');
  path(g,[['M',-14,-6],['Q',-4,-23,12,-10],['L',21,19],['L',-17,19],['Z']],'#73858c','#424a63',2);line(g,-13,4,16,4,'#e4c7a3',2);
  path(g,[['M',-11,-18],['L',-16,-44],['L',-1,-36],['L',11,-42],['L',13,-25],['L',30,-17],['L',15,-8],['L',-6,-9],['Z']],'#df947e','#69506a',2);path(g,[['M',-4,-23],['L',27,-17],['L',14,-10],['L',-5,-13],['Z']],'#f7dfb9');ellipse(g,28,-18,3,3,'#3e3b55');ellipse(g,9,-26,2,2,'#35344e');line(g,5,-31,13,-32,'#7c5267',2);
  path(g,[['M',-18,-37],['Q',-2,-56,17,-40],['L',27,-37],['Z']],'#677c85');line(g,-16,-38,26,-37,'#e3bf9a',3);ellipse(g,2,-45,3,3,'#edbb75');
  line(g,12,-4,38,-9,'#e7b495',7);ellipse(g,38,-9,5,5,'#efc6a3');
  path(g,[['M',37,-34],['Q',63,-8,37,18]],null,'#5e435b',4);line(g,37,-34,45,-8,'#f5dfba',1);line(g,45,-8,37,18,'#f5dfba',1);line(g,29,-8,s.cool>.16?57:71,-8,'#e8d4b4',2);
  g.fillStyle='#9c7380';g.fillRect(-28,18,56,20);for(let n=-22;n<25;n+=8)line(g,n,20,n,36,'#d1a390',2);line(g,-29,18,29,18,'#efc89e',4);ellipse(g,-24,42,5,5,'#393a53');ellipse(g,24,42,5,5,'#393a53');
  if(s.inv>0){g.strokeStyle='#ffe3a5';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.ellipse(0,-4,53,62,0,0,Math.PI*2);g.stroke();g.setLineDash([]);}g.restore();
 }
 function render(g,s,R){g.drawImage(bg,0,0);g.save();
  // Diegetic pennant shows the changing wind; no projected target aid.
  line(g,908,18,908,108,'#63536d',3);path(g,[['M',908,21],['L',908+(s.wind>=0?-1:1)*48,30+Math.sin(s.time*3)*5],['L',908,44],['Z']],'#f4d099');g.fillStyle='#4f465f';g.font='bold 12px system-ui';g.textAlign='right';g.fillText(s.wind?`WIND ${s.wind>0?'↓':'↑'}`:'CALM AIR',891,77);
  g.font='italic 17px Georgia';g.textAlign='left';g.fillStyle='#54475f';g.fillText(R.name,224,38);
  if(s.pulse>0){g.globalAlpha=s.pulse/.7*.55;g.strokeStyle='#ffe4ac';g.lineWidth=8;g.beginPath();g.arc(170,s.y+8,(.7-s.pulse)*860,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
  for(const e of s.enemies)wolf(g,e,s.time);
  for(const rock of s.rocks){g.save();g.translate(rock.x,rock.y);g.rotate(rock.spin);path(g,[['M',-8,-4],['L',1,-8],['L',9,-1],['L',4,7],['L',-7,6],['Z']],'#67617b','#ead2bc',2);g.restore();}
  for(const a of s.arrows){line(g,a.x-25,a.y-4,a.x-13,a.y,'#fff0cc',2);line(g,a.x-25,a.y+4,a.x-13,a.y,'#fff0cc',2);line(g,a.x-25,a.y,a.x+2,a.y,'#65465e',3);path(g,[['M',a.x+7,a.y],['L',a.x-3,a.y-4],['L',a.x-3,a.y+4],['Z']],'#faf1d4');}
  fox(g,s);
  for(const p of s.fx){g.globalAlpha=Math.min(1,p.life*2);if(p.text){g.fillStyle='#fff0c2';g.strokeStyle='#5a4564';g.lineWidth=3;g.font='bold 19px Georgia';g.textAlign='center';g.strokeText(p.text,p.x,p.y);g.fillText(p.text,p.x,p.y);}else ellipse(g,p.x,p.y,p.r,p.r,p.color);}g.globalAlpha=1;
  // Arrival pips make the raid length readable without hiding targets.
  g.fillStyle='#3e3f5d';g.fillRect(220,556,530,4);g.fillStyle='#edc48e';g.fillRect(220,556,530*s.resolved/R.total,4);g.font='10px system-ui';g.textAlign='left';g.fillStyle='#e8d0bb';g.fillText('RAID PROGRESS',220,579);
  g.restore();
 }
 return{render};
})();

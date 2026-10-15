window.MarbleArt=(()=>{
 'use strict';
 const R=window.MarbleRules,W=960,H=600,palettes=[['#dfeaf0','#e4b49a'],['#e8e6ef','#c8b9d4'],['#dce6ef','#9dbac9'],['#e9e2dc','#d4b997'],['#e1e6ed','#acbccc'],['#e4dfeb','#c1afd0'],['#dbe4ed','#b6cbd8']];
 const circle=(ctx,x,y,r,fill,stroke)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}};
 function line(ctx,c,width,color,dy=0){ctx.beginPath();ctx.moveTo(c.points[0][0],c.points[0][1]+dy);for(const p of c.points.slice(1))ctx.lineTo(p[0],p[1]+dy);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
 function make(c,level,scale){
  const bg=document.createElement('canvas');bg.width=W*scale;bg.height=H*scale;const g=bg.getContext('2d');g.scale(scale,scale);
  const palette=palettes[level-1],sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#f6f2e9');sky.addColorStop(1,palette[0]);g.fillStyle=sky;g.fillRect(0,0,W,H);
  // Drawn once: soft islands, architectural grid, piers and the cast track shadow.
  for(let n=0;n<8;n++){g.fillStyle=n%2?'#ffffff38':'#8ca9b517';g.beginPath();g.ellipse((n*163+93)%1000,60+(n*97)%530,75+n*3,17,0,0,Math.PI*2);g.fill();}
  g.strokeStyle='#516e8220';g.lineWidth=.7;for(let x=0;x<W;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}for(let y=0;y<H;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  g.fillStyle='#3e5c6d';g.font='bold 11px Trebuchet MS';g.textAlign='left';g.fillText('M / C     PRECISION PLAYWORKS',34,31);g.textAlign='right';g.fillText(`NO. 0${level}     /     ${c.name.toUpperCase()}`,926,31);
  for(let i=0;i<c.points.length;i+=2){const[x,y]=c.points[i];g.fillStyle='#9aafbc38';g.beginPath();g.ellipse(x+18,y+40,c.width*.5,12,0,0,Math.PI*2);g.fill();const grd=g.createLinearGradient(x-10,0,x+12,0);grd.addColorStop(0,'#829aaa');grd.addColorStop(.5,'#c9d5dc');grd.addColorStop(1,'#96adba');g.fillStyle=grd;g.fillRect(x-9,y+8,18,26);}
  line(g,c,c.width+14,'#68869a20',23);line(g,c,c.width+4,'#526e82',13);line(g,c,c.width+4,'#92a8b4',5);line(g,c,c.width+3,'#748c9b');line(g,c,c.width,'#fffaf0');line(g,c,c.width-9,'#e9e2d5');line(g,c,c.width-13,'#f3eee4');
  // Inlaid expansion joints and inset brass corner studs give the track a built scale.
  g.lineWidth=1;for(let i=0;i<c.points.length-1;i++){const a=c.points[i],b=c.points[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let j=80;j<len-30;j+=80){const p=R.point(c,i,j/len);g.strokeStyle='#9a9d9130';g.beginPath();g.moveTo(p.x-p.uy*c.width*.41,p.y+p.ux*c.width*.41);g.lineTo(p.x+p.uy*c.width*.41,p.y-p.ux*c.width*.41);g.stroke();}const p=R.point(c,i,.18);circle(g,p.x-p.uy*(c.width*.43),p.y+p.ux*(c.width*.43),2.2,'#ae8f5b');circle(g,p.x+p.uy*(c.width*.43),p.y-p.ux*(c.width*.43),2.2,'#ae8f5b');}
  // Fine aggregate makes the miniature plaster feel tactile without frame-time noise.
  let seed=level*1237;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};g.fillStyle='#4a5b6d18';for(let i=0;i<2100;i++){const x=rand()*W,y=rand()*H;if(R.supported(c,x,y))g.fillRect(x,y,.7+rand(),.7+rand());}
  g.save();g.setLineDash([3,9]);line(g,c,1.3,'#9ea9a244');g.restore();
  // Embedded direction arrows indicate travel without projecting a solution.
  for(let i=0;i<c.points.length-1;i++){const p=R.point(c,i,.52);g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.uy,p.ux));g.strokeStyle='#8f9c9b77';g.lineWidth=2;g.beginPath();g.moveTo(-7,-5);g.lineTo(0,0);g.lineTo(-7,5);g.stroke();g.restore();}
  for(const h of c.sweep){const p=R.point(c,h.seg,h.t);g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.uy,p.ux));g.fillStyle='#49677e22';g.fillRect(-18,-c.width*.6,36,c.width*1.2);g.setLineDash([2,4]);g.strokeStyle='#b8423090';g.lineWidth=2;g.beginPath();g.moveTo(0,-c.width*.62);g.lineTo(0,c.width*.62);g.stroke();g.restore();}
  for(const h of c.boost){const p=R.point(c,h.seg,h.t);g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.uy,p.ux));g.fillStyle='#c29b4b44';g.fillRect(-32,-c.width*.42,64,c.width*.84);g.strokeStyle='#9a6c20';g.lineWidth=4;for(let x=-22;x<=22;x+=15){g.beginPath();g.moveTo(x-4,-13);g.lineTo(x+4,0);g.lineTo(x-4,13);g.stroke();}g.restore();}
  g.lineWidth=1.5;const start=c.points[0];circle(g,start[0],start[1],22,palette[1]);circle(g,start[0],start[1],16,'#f4eadc','#b19b89');g.fillStyle='#435a6c';g.font='bold 9px Trebuchet MS';g.textAlign='center';g.fillText('START',start[0],start[1]+36);
  const end=c.points.at(-1);g.save();g.beginPath();g.arc(end[0],end[1],23,0,Math.PI*2);g.clip();for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++){g.fillStyle=(x+y)%2?'#40566b':'#fffaf0';g.fillRect(end[0]+x*9,end[1]+y*9,9,9);}g.restore();circle(g,end[0],end[1],25,null,'#8396a0');g.fillStyle='#435a6c';g.fillText('FINISH',end[0],end[1]-34);
  g.textAlign='left';g.font='10px Trebuchet MS';g.fillStyle='#5c7382';g.fillText('SUSPENDED PLASTER / GLASS / A LITTLE COURAGE',34,576);g.textAlign='right';g.fillText(level<6?'FIND A RHYTHM. KEEP YOUR LINE.':level===6?'MASTERY SERIES':'THE GRAND CIRCUIT',926,552);
  return bg;
 }
 function render(g,s,bg,reduced){
  const c=s.course;g.drawImage(bg,0,0,W,H);
  for(let i=0;i<3;i++){const p=c.points[c.marks[i]],lit=i<s.collected,next=i===s.collected;circle(g,p[0],p[1],25,lit?'#2f748544':'#f1e8d6','#879aa0');circle(g,p[0],p[1],19,lit?'#367f8b':next?'#ba4c36':'#9aa7aa');circle(g,p[0]-4,p[1]-5,6,lit?'#ffffff55':'#ffffff33');g.fillStyle='#fffaf1';g.textAlign='center';g.font='bold 17px Trebuchet MS';g.fillText(lit?'✓':String(i+1),p[0],p[1]+6);if(next){g.strokeStyle='#b84230';g.lineWidth=2;g.beginPath();g.arc(p[0],p[1],30+(reduced?0:Math.sin(s.elapsed*3)*2),0,Math.PI*2);g.stroke();}}
  for(const h of R.hazards(c,s.elapsed)){
   circle(g,h.x+3,h.y+7,h.r+2,'#243b5250');
   if(h.kind==='sweeper'){const p=R.point(c,h.sweep.seg,h.sweep.t),x=p.x-p.uy*c.width*.68,y=p.y+p.ux*c.width*.68;g.strokeStyle='#a67a6044';g.lineWidth=5;g.beginPath();g.moveTo(x,y);g.lineTo(h.x,h.y);g.stroke();circle(g,x,y,5,'#40566b');}
   const grd=g.createRadialGradient(h.x-5,h.y-5,1,h.x,h.y,h.r);grd.addColorStop(0,h.kind==='bumper'?'#f39b7b':'#82b5cd');grd.addColorStop(1,h.kind==='bumper'?'#a9442f':'#315b7c');circle(g,h.x,h.y,h.r,grd,'#fff5dd');g.strokeStyle='#ffedc9';g.lineWidth=3;g.beginPath();g.moveTo(h.x-h.r*.7,h.y-2);g.lineTo(h.x+h.r*.5,h.y+5);g.stroke();circle(g,h.x-4,h.y-5,3,'#fff6');
  }
  if(s.collected===3){const p=c.points.at(-1);circle(g,p[0],p[1],29,null,'#b84230');}
  const p=s.player,fall=s.falling?Math.max(0,1-s.falling/.65):1;
  if(!reduced&&!s.falling&&Math.hypot(p.vx,p.vy)>35)for(let i=0;i<s.trail.length;i++){const q=s.trail[(s.trailIndex+1+i)%s.trail.length];g.globalAlpha=i/s.trail.length*.23;circle(g,q.x,q.y,2+i*.35,s.braking?'#b84230':'#347f9b');}g.globalAlpha=1;
  if(fall>0){
   g.save();g.translate(p.x,p.y+(1-fall)*42);g.scale(fall,fall);g.globalAlpha=fall;circle(g,4,8,12,'#2b536450');if(p.shield>0){circle(g,0,0,17,null,'#3d99a9');}
   const a=g.createRadialGradient(-4,-5,1,0,0,12);a.addColorStop(0,'#d9f7ff');a.addColorStop(.35,'#73bdd4');a.addColorStop(.73,'#247a9d');a.addColorStop(1,'#173e61');circle(g,0,0,12,a,'#f9feff');
   g.save();g.beginPath();g.arc(0,0,10,0,Math.PI*2);g.clip();g.rotate(p.roll);g.strokeStyle='#ebf6e8cc';g.lineWidth=4;g.beginPath();g.ellipse(0,0,5,14,.4,0,Math.PI*2);g.stroke();g.strokeStyle='#ccddbd77';g.lineWidth=2;g.beginPath();g.ellipse(0,0,14,5,-.4,0,Math.PI*2);g.stroke();g.restore();circle(g,-4,-5,3.4,'#fff');circle(g,4,5,1.5,'#b0e6f6');
   if(s.braking){g.strokeStyle='#b84230';g.lineWidth=2;g.setLineDash([4,4]);circle(g,0,0,17,null,'#b84230');g.setLineDash([]);}if(s.edge){g.fillStyle='#fff9ed';g.beginPath();g.moveTo(-7,-24);g.lineTo(7,-24);g.lineTo(0,-14);g.closePath();g.fill();g.fillStyle='#873225';g.font='bold 13px Trebuchet MS';g.textAlign='center';g.fillText('!',0,-25);}g.restore();
  }
  for(const fx of s.effects){g.globalAlpha=fx.left;g.strokeStyle=fx.color;g.lineWidth=2;circle(g,fx.x,fx.y,12+(1-fx.left)*38,null,fx.color);g.globalAlpha=1;}
  // A small speed instrument makes coasting and braking visible, even without sound.
  const speed=Math.hypot(p.vx,p.vy);g.fillStyle='#b9c8cf';g.fillRect(794,568,132,6);g.fillStyle=s.braking?'#b84230':'#327c96';g.fillRect(794,568,Math.min(132,speed/230*132),6);g.font='bold 10px Trebuchet MS';g.textAlign='right';g.fillStyle='#3d5668';g.fillText(s.braking?'BRAKING':s.edge?'! EDGE · BRAKE':`ROLL ${Math.round(speed)}`,926,591);
  if(s.flash>0&&!reduced){g.fillStyle='#c7513530';g.fillRect(0,0,W,H);}
  if(s.mode==='paused'){g.fillStyle='#243d55bb';g.fillRect(0,0,W,H);g.fillStyle='#fff8e8';g.textAlign='center';g.font='36px Georgia';g.fillText('Take a breath.',W/2,H/2-8);g.font='14px Trebuchet MS';g.fillText('Press P or tap RESUME',W/2,H/2+26);}
 }
 return{make,render};
})();

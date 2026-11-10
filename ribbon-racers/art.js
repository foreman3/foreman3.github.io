(function(){
 'use strict';
 const E=RibbonEngine,C=20,colors=['','#f3e8c9','#ef7649','#82b9aa','#c3a5ce'];
 const bg=document.createElement('canvas'),trail=document.createElement('canvas');bg.width=trail.width=1040;bg.height=trail.height=680;
 const b=bg.getContext('2d'),t=trail.getContext('2d');let lastTick=-1,lastState=null;
 function track(s){
  b.fillStyle='#bfc3a5';b.fillRect(0,0,1040,680);
  b.fillStyle='#83977c';b.fillRect(12,12,1016,656);
  b.fillStyle='#334c3c';b.beginPath();b.roundRect(20,20,1000,640,10);b.fill();
  b.strokeStyle='#afbd9550';b.lineWidth=1;
  for(let x=30;x<1040;x+=20){b.beginPath();b.moveTo(x,20);b.lineTo(x,660);b.stroke();}
  for(let y=30;y<680;y+=20){b.beginPath();b.moveTo(20,y);b.lineTo(1020,y);b.stroke();}
  b.lineWidth=3;b.strokeStyle='#d2d0ab70';b.beginPath();b.roundRect(42,42,956,596,70);b.stroke();
  b.setLineDash([6,10]);b.lineWidth=1;b.beginPath();b.roundRect(70,70,900,540,55);b.stroke();b.setLineDash([]);
  b.save();b.translate(520,340);b.rotate(-.2);b.textAlign='center';b.fillStyle='#b7c29c14';b.font='900 110px Arial Black, sans-serif';b.fillText('RIBBON',0,0);b.font='900 22px monospace';b.fillText('INTERNATIONAL GRAND PRIX',0,40);b.restore();
  for(let i=0;i<13;i++){b.fillStyle=i%2?'#f3e8c9':'#2c3a2c';b.fillRect(3+i*80,3,40,10);b.fillRect(3+i*80,667,40,10);}
  /* Painted infield lettering and hand-laid corner pavers, all cached. */
  b.fillStyle='#bac8a227';b.font='900 14px monospace';b.textAlign='left';b.fillText('R.R. / CIRCUIT '+String(s.level).padStart(2,'0'),94,610);b.textAlign='right';b.fillText('THE LONG WAY IS THE SMART WAY',942,90);
  for(const [cx,cy]of[[25,25],[1015,25],[25,655],[1015,655]]){b.fillStyle='#ef7649';b.beginPath();b.arc(cx,cy,5,0,Math.PI*2);b.fill();b.strokeStyle='#fff4cbaa';b.lineWidth=1;b.stroke();}
  for(let y=1;y<E.H-1;y++)for(let x=1;x<E.W-1;x++)if(s.board[E.at(x,y)]===9){
   b.fillStyle='#182e25';b.fillRect(x*C+3,y*C+5,C,C);b.fillStyle='#b4b89a';b.fillRect(x*C,y*C,C,C);b.fillStyle='#dde0bd';b.fillRect(x*C,y*C,C,4);
   b.strokeStyle='#7c896c';b.lineWidth=1;b.strokeRect(x*C+.5,y*C+.5,C-1,C-1);
   if((x+y)%2===0){b.fillStyle='#9c6541';b.beginPath();b.moveTo(x*C+3,y*C+15);b.lineTo(x*C+15,y*C+3);b.lineTo(x*C+18,y*C+3);b.lineTo(x*C+6,y*C+15);b.fill();}
  }
 }
 function ribbons(s){
  t.clearRect(0,0,1040,680);t.lineJoin='round';t.lineCap='round';
  for(let y=1;y<E.H-1;y++)for(let x=1;x<E.W-1;x++){const id=s.board[E.at(x,y)];if(id<1||id>4)continue;const cx=x*C+10,cy=y*C+10;
   t.fillStyle='#10271b66';t.fillRect(cx-5,cy-1,11,9);t.strokeStyle=colors[id];t.lineWidth=7;
   t.beginPath();t.moveTo(cx,cy);let linked=false;if(s.board[E.at(x+1,y)]===id){t.lineTo(cx+C,cy);linked=true;}t.moveTo(cx,cy);if(s.board[E.at(x,y+1)]===id){t.lineTo(cx,cy+C);linked=true;}if(!linked)t.lineTo(cx+.1,cy);t.stroke();
   t.fillStyle='#fff5';if((x+y)%4===0)t.fillRect(cx-1,cy-1,2,2);
  }
 }
 function rider(g,r,s){
  if(!r.alive)return;let u=Math.min(1,s.acc*E.levels[s.level-1].speed);
  const x=(r.px+(r.x-r.px)*u)*C+10,y=(r.py+(r.y-r.py)*u)*C+10;
  g.save();g.translate(x,y);g.rotate(r.d*Math.PI/2);
  if(r.grace){g.strokeStyle='#ffe9a9';g.lineWidth=2;g.setLineDash([3,3]);g.beginPath();g.arc(0,0,20,0,Math.PI*2);g.stroke();g.setLineDash([]);}
  g.fillStyle='#101f1bcc';g.beginPath();g.ellipse(-1,5,16,8,0,0,Math.PI*2);g.fill();
  g.fillStyle='#17221e';for(const [tx,ty]of[[-8,-9],[-8,6],[7,-9],[7,6]])g.fillRect(tx,ty,6,4);
  g.fillStyle=colors[r.id];g.beginPath();g.moveTo(-14,-6);g.lineTo(8,-6);g.quadraticCurveTo(18,-5,18,0);g.quadraticCurveTo(18,5,8,6);g.lineTo(-14,6);g.closePath();g.fill();
  g.fillStyle='#fff6';g.fillRect(-11,-5,18,2);g.fillStyle='#2b3d35';g.fillRect(-2,-4,7,8);g.fillStyle='#c2c5ab';g.fillRect(0,-3,3,6);g.fillStyle='#17251d';g.fillRect(-16,-9,3,18);
  g.fillStyle='#ef7649';g.fillRect(9,-4,3,8);g.fillStyle='#f3e8c9';g.fillRect(-8,-2,4,4);g.fillStyle='#e2e4c9';g.fillRect(-6,-10,3,2);g.fillRect(-6,8,3,2);
  g.restore();g.fillStyle='#152b21';g.beginPath();g.arc(x,y-22,r.id===1?12:10,0,Math.PI*2);g.fill();g.strokeStyle=colors[r.id];g.lineWidth=1.5;g.stroke();g.fillStyle=r.id===1?'#fcf4dc':colors[r.id];g.textAlign='center';g.font='bold 16px monospace';g.fillText(r.id,x,y-17);
 }
 function render(g,s,effects){
  if(lastState!==s){track(s);lastTick=-1;lastState=s;}if(lastTick!==s.tick){ribbons(s);lastTick=s.tick;}
  g.drawImage(bg,0,0);g.drawImage(trail,0,0);
  const lead=s.riders[0];if(lead.alive&&lead.grace===0){const [dx,dy]=E.D[lead.d],nx=lead.x+dx,ny=lead.y+dy;if(s.board[E.at(nx,ny)]){g.strokeStyle='#ffb767';g.lineWidth=2.5;const x=nx*C+2,y=ny*C+2;g.beginPath();g.moveTo(x,y+6);g.lineTo(x,y);g.lineTo(x+6,y);g.moveTo(x+10,y+16);g.lineTo(x+16,y+16);g.lineTo(x+16,y+10);g.stroke();}}
  for(const r of s.riders)rider(g,r,s);
  for(const p of effects){g.globalAlpha=Math.max(0,p.life);g.fillStyle=colors[p.id]||'#efbd6c';g.fillRect(p.x,p.y,4,4);}g.globalAlpha=1;
  if(s.time<3.2){g.fillStyle='#12251cdd';g.beginPath();g.roundRect(330,285,380,98,9);g.fill();g.textAlign='center';g.fillStyle='#f3e8c9';g.font='900 23px monospace';g.fillText(E.levels[s.level-1].name.toUpperCase(),520,323);g.font='15px monospace';g.fillText('YOU ARE No. 1 · OUTLAST THE GRID',520,354);}
 }
 window.RibbonArt={render};
})();

// Static terrain and tank sprites are cached to keep mobile drawing inexpensive.
const battlefield = document.createElement('canvas'); battlefield.width=800; battlefield.height=600;
const terrain = battlefield.getContext('2d');
const tankArt = new Map();
function paintBattlefield(){
 const c=terrain, industrial=document.body.classList.contains('ultra');
 c.fillStyle=industrial?'#303f43':'#877c58';
 c.fillRect(0,0,800,600);
 let seed=1947; const rand=()=>{seed=(seed*16807)%2147483647;
 return seed/2147483647};
 for(let i=0;
 i<6500;
 i++){c.fillStyle=i%2?'#ffffff08':'#00000012';
 c.fillRect(rand()*800,rand()*600,1+rand()*3,1+rand()*2)}
 c.strokeStyle=industrial?'#8da6a414':'#d9d1a516';
 c.lineWidth=1;
 for(let x=0;
 x<800;
 x+=50){c.beginPath();
 c.moveTo(x,0);
 c.lineTo(x,600);
 c.stroke()}
 for(let y=0;
 y<600;
 y+=50){c.beginPath();
 c.moveTo(0,y);
 c.lineTo(800,y);
 c.stroke()}
 // Weathered parallel tread marks, baked into the terrain only once per operation.
 c.save();
 c.strokeStyle='#101b1815';
 c.lineWidth=2;
 c.setLineDash([3,4]);
 for(let i=0;
 i<12;
 i++){
   c.save();
 c.translate(rand()*800,rand()*600);
 c.rotate(rand()*6);
   for(const offset of [-8,8]){
     c.beginPath();
 c.moveTo(-35,offset);
 c.quadraticCurveTo(0,offset+10,40,offset-4);
 c.stroke();
   }
   c.restore();
 }
 c.restore();
 c.strokeStyle=industrial?'#9eb4ae':'#bfb58b';
 c.lineWidth=4;
 c.strokeRect(5,5,790,590);
 c.setLineDash([12,9]);
 c.strokeStyle='#14242155';
 c.lineWidth=5;
 c.strokeRect(12,12,776,576);
 c.setLineDash([]);
 c.font='bold 12px monospace';
 c.fillStyle='#e6ead34a';
 c.fillText(industrial?'SECTOR 07 / LIVE FIRE':'RANGE 01 / LIVE FIRE',26,36);
 for(const o of obstacles){c.fillStyle='#07141155';
 c.fillRect(o.x+6,o.y+8,o.w,o.h);
 c.fillStyle=industrial?'#596b69':'#b7aa7c';
 c.fillRect(o.x,o.y,o.w,o.h);
 c.fillStyle=industrial?'#91a5a0':'#d8ca9d';
 c.fillRect(o.x,o.y,o.w,4);
 c.fillStyle='#24333066';
 c.fillRect(o.x,o.y+o.h-6,o.w,6);
 c.strokeStyle='#263a3755';
 c.lineWidth=1;
 c.strokeRect(o.x+7,o.y+9,o.w-14,o.h-18);
 for(let y=o.y+24;
 y<o.y+o.h-8;
 y+=22){c.beginPath();
 c.moveTo(o.x+2,y);
 c.lineTo(o.x+o.w-2,y);
 c.stroke()}for(const x of [o.x+6,o.x+o.w-6]){c.fillStyle='#283832';
 c.fillRect(x,o.y+6,2,2);
 c.fillRect(x,o.y+o.h-8,2,2)}}
}
function drawTank(t){
 const friendly=t===player, key=friendly?'player':t.type==='smart'?'smart':t.turretColor==='#ff0'?'heavy':'enemy';
 if(!tankArt.has(key)){
 const s=document.createElement('canvas');
 s.width=100;
 s.height=80;
 const c=s.getContext('2d');
 c.scale(2,2);
 c.translate(22,20);
 const color=friendly?'#91bda0':key==='smart'?'#9daebd':key==='heavy'?'#d6ad62':'#c47b66';
 c.fillStyle='#0005';
 c.fillRect(-15,-12,34,29);
 c.fillStyle='#162320';
 c.fillRect(-17,-13,34,8);
 c.fillRect(-17,5,34,8);
 for(let x=-16;
 x<17;
 x+=4){c.fillStyle='#55645a';
 c.fillRect(x,-12,2,6);
 c.fillRect(x,6,2,6)}
 c.fillStyle=color;
 c.beginPath();
 c.moveTo(-15,-8);
 c.lineTo(11,-8);
 c.lineTo(17,-4);
 c.lineTo(17,4);
 c.lineTo(11,8);
 c.lineTo(-15,8);
 c.closePath();
 c.fill();
 c.fillStyle='#fff4';
 c.fillRect(-13,-8,23,2);
 c.fillStyle='#0004';
 c.fillRect(-13,6,24,2);
 c.fillStyle='#253c34';
 for(let x=-12;
 x<-4;
 x+=3)c.fillRect(x,-4,1,8);
 c.fillStyle='#142d28';
 c.beginPath();
 c.arc(1,1,8,0,7);
 c.fill();
 c.fillStyle=color;
 c.fillRect(-4,-6,12,11);
 c.fillStyle='#e8ead780';
 c.fillRect(-3,-6,10,2);
 c.fillStyle='#40594c';
 c.fillRect(4,-2,21,4);
 c.fillStyle='#d0d8be';
 c.fillRect(6,-2,18,1);
 c.fillStyle='#142b26';
 c.fillRect(22,-3,5,6);
 c.fillStyle='#e4eacf';
 c.fillRect(-1,-3,3,5);
 c.fillRect(-2,-2,5,2);
 tankArt.set(key,s);
 }
 ctx.save();
 ctx.translate(t.x,t.y);
 if(friendly){ctx.strokeStyle=t.invuln>0?'#fff1b0':'#b8e9ca88';
 ctx.lineWidth=1.5;
 ctx.beginPath();
 ctx.arc(0,0,21,0,Math.PI*2);
 ctx.stroke()}ctx.rotate(t.angle);
 ctx.drawImage(tankArt.get(key),-22,-20,50,40);
 ctx.restore();
}
function drawExplosion(t){const progress=(30-t.explosion)/30;
 ctx.save();
 ctx.globalAlpha=1-progress;
 ctx.strokeStyle='#ffe5a2';
 ctx.lineWidth=3*(1-progress);
 ctx.beginPath();
 ctx.arc(t.x,t.y,8+progress*33,0,7);
 ctx.stroke();
 for(let i=0;
 i<9;
 i++){const a=i*2.4,r=progress*(18+i*3);
 ctx.fillStyle=i%2?'#ffbd59':'#fff1c7';
 ctx.fillRect(t.x+Math.cos(a)*r-2,t.y+Math.sin(a)*r-2,4*(1-progress)+1,4*(1-progress)+1)}ctx.restore()}

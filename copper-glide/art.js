(function(){'use strict';
const bg=document.createElement('canvas');bg.width=1000;bg.height=560;const c=bg.getContext('2d');
function rect(x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
const wood=c.createLinearGradient(0,0,1000,560);wood.addColorStop(0,'#a56742');wood.addColorStop(.45,'#deb78b');wood.addColorStop(1,'#80452f');rect(0,0,1000,560,0,wood);
for(let y=3;y<560;y+=5){c.strokeStyle=y%3?'#4d2d2311':'#fff4d91c';c.beginPath();c.moveTo(0,y);c.bezierCurveTo(320,y+10,580,y-6,1000,y+3);c.stroke();}
rect(13,13,974,534,31,'#4b352e','#ebbe88');rect(25,25,950,510,23,'#f1e5cb','#c28f63');
const cloth=c.createLinearGradient(0,38,0,522);cloth.addColorStop(0,'#efe6ce');cloth.addColorStop(.5,'#fcf3dc');cloth.addColorStop(1,'#e2d2b2');rect(38,38,924,484,14,cloth);
for(let y=51;y<522;y+=15)for(let x=51;x<960;x+=15){c.fillStyle='#7c665d24';c.beginPath();c.arc(x,y,.8,0,Math.PI*2);c.fill();}
c.strokeStyle='#ac75644d';c.lineWidth=3;c.beginPath();c.moveTo(500,40);c.lineTo(500,520);c.stroke();
for(const [x,col]of[[140,'#3d807e'],[860,'#a14f41']]){c.strokeStyle=col+'62';c.lineWidth=3;c.beginPath();c.arc(x,280,94,-Math.PI/2,Math.PI/2,x>500);c.stroke();c.beginPath();c.arc(x,280,8,0,7);c.stroke();}
c.strokeStyle='#ab706257';c.lineWidth=3;c.beginPath();c.arc(500,280,92,0,7);c.stroke();c.beginPath();c.arc(500,280,83,0,7);c.stroke();
c.fillStyle='#ad7f6538';c.textAlign='center';c.font='900 20px Georgia';c.fillText('TABLE SPORTS',500,253);c.font='italic 40px Georgia';c.fillText('CG',500,298);c.font='bold 10px monospace';c.fillText('S O C I E T Y  ·  1 9 7 8',500,320);
for(const x of[14,970]){rect(x,176,16,208,7,'#342c29','#d89a67');rect(x+4,190,8,180,3,'#111e20');}
for(const x of[18,974]){c.strokeStyle='#d0ac7740';c.lineWidth=1;for(let y=194;y<370;y+=11){c.beginPath();c.moveTo(x,y);c.lineTo(x+7,y+5);c.stroke();}c.beginPath();c.moveTo(x+3,190);c.lineTo(x+3,370);c.stroke();}
for(const x of[38,962])for(const y of[181,379]){c.fillStyle='#8d5a3a';c.beginPath();c.arc(x,y,7,0,7);c.fill();c.fillStyle='#f7d49c';c.beginPath();c.arc(x-1,y-2,3,0,7);c.fill();}
for(const x of[20,980])for(const y of[28,98,462,532]){c.fillStyle='#472e22';c.beginPath();c.arc(x,y,3,0,7);c.fill();c.fillStyle='#edc992';c.fillRect(x-2,y-1,4,1);}
c.font='bold 11px monospace';c.fillStyle='#357b76';c.textAlign='left';c.fillText('01 / HOME',65,63);c.fillStyle='#a25d47';c.textAlign='right';c.fillText('VISITOR / 02',935,63);
function sprite(color,dark){const cv=document.createElement('canvas');cv.width=112;cv.height=112;const g=cv.getContext('2d');g.fillStyle='#2d231b38';g.beginPath();g.ellipse(58,63,32,30,0,0,7);g.fill();const grad=g.createLinearGradient(32,24,75,80);grad.addColorStop(0,'#fbdbad');grad.addColorStop(.3,color);grad.addColorStop(1,dark);g.fillStyle=grad;g.beginPath();g.arc(56,56,29,0,7);g.fill();g.strokeStyle=dark;g.lineWidth=2;g.stroke();g.strokeStyle='#ffe9bd9e';g.beginPath();g.arc(56,53,25,3.7,5.9);g.stroke();g.fillStyle=dark;g.beginPath();g.arc(56,56,18,0,7);g.fill();g.fillStyle=color;g.beginPath();g.arc(56,53,17,0,7);g.fill();g.fillStyle='#f6e3ba';g.globalAlpha=.35;g.beginPath();g.ellipse(51,46,8,4,-.5,0,7);g.fill();g.globalAlpha=1;g.strokeStyle='#fff1c733';g.beginPath();g.arc(56,53,13,0,7);g.stroke();return cv;}
const player=sprite('#438e85','#174d4b'),rival=sprite('#c77c57','#773b30');
const puck=document.createElement('canvas');puck.width=48;puck.height=48;const p=puck.getContext('2d');p.fillStyle='#3b292b44';p.beginPath();p.ellipse(25,28,14,12,0,0,7);p.fill();p.fillStyle='#4c3f40';p.beginPath();p.arc(24,24,12,0,7);p.fill();p.fillStyle='#fff9e7';p.beginPath();p.arc(24,21,11,0,7);p.fill();p.strokeStyle='#b99b74';p.lineWidth=2;p.stroke();p.fillStyle='#786958';p.beginPath();p.arc(24,21,3,0,7);p.fill();
let lastTrail=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function draw(ctx,s,paused){ctx.drawImage(bg,0,0);const q=s.q;
 if(s.serve<=0&&q.vx<0&&q.x<300&&s.status==='playing'){const landing=CopperEngine.reflect(q.y+(38-q.x)/q.vx*q.vy);if(landing>186&&landing<374){ctx.strokeStyle='#a2513d';ctx.lineWidth=4;ctx.setLineDash([6,5]);ctx.strokeRect(9,174,23,212);ctx.setLineDash([]);}}
 if(!reduced&&!paused&&s.time-lastTrail>.025&&s.serve<=0){s.trail.push({x:q.x,y:q.y});if(s.trail.length>9)s.trail.shift();lastTrail=s.time;}if(s.time<lastTrail)lastTrail=0;
 if(!reduced){for(let i=0;i<s.trail.length;i++){const t=s.trail[i];ctx.fillStyle='#704f3c';ctx.globalAlpha=i/s.trail.length*.16;ctx.beginPath();ctx.arc(t.x,t.y,5+i*.5,0,7);ctx.fill();}ctx.globalAlpha=1;}
 ctx.drawImage(player,s.p.x-56,s.p.y-56);ctx.drawImage(rival,s.a.x-56,s.a.y-56);ctx.drawImage(puck,q.x-24,q.y-24);
 if(s.flash>0&&!reduced){ctx.globalAlpha=s.flash/.18;ctx.strokeStyle=s.flashKind==='strike'?'#28766c':s.flashKind==='return'?'#a76142':'#a4855c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.flashX,s.flashY,16+(1-s.flash/.18)*20,0,7);ctx.stroke();ctx.globalAlpha=1;}
 if(s.serve>0){ctx.fillStyle='#f5e9d4ef';ctx.beginPath();ctx.roundRect(373,396,254,76,12);ctx.fill();ctx.strokeStyle='#bd8e69';ctx.lineWidth=1;ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#573c33';ctx.font='800 13px monospace';ctx.fillText(s.server?'RIVAL SERVES':'YOUR SERVE',500,422);ctx.font='900 26px Georgia';ctx.fillText(String(Math.ceil(s.serve)),500,453);}
 if(s.goalFlash>0&&s.serve>0){ctx.fillStyle=s.server?'#206b63':'#9e5040';ctx.textAlign='center';ctx.font='900 31px Georgia';ctx.fillText(s.server?(s.goalValue>100?'BANK SHOT +'+s.goalValue:'GOAL +100'):'ANOTHER SERVE. ANOTHER CHANCE.',500,138);}
}
window.CopperArt={draw};
})();

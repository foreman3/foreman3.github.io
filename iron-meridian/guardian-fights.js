/* Shuffled, telegraphed multi-part guardian attacks. */
window.createIronGuardianFight=function({stage,ground,arena,right,shot,damage,announce,burst,sound,color}){
 const left=arena+65,edge=right-150,floor=ground-100,mid=(left+edge)/2,span=edge-left;
 const labels=[[],['STORM PASS','DOUBLE DIVE','TURBINE ORBIT','THUNDER COLUMNS','WING CROSSFIRE'],['SICKLE REVERSAL','CANOPY VAULT','SEED ORBIT','FALLING SEEDS','HIGH / LOW SCYTHES'],['TWO-SPEED SLIDE','FROZEN VAULT','ICE ORBIT','ICICLE STAIRCASE','PAIRED SHOCKWAVES'],['MIRRORED REACTOR DASH','MARKED DOUBLE VAULT','CONTAINMENT ORBIT','DELAYED CORE COLUMNS','HIGH / LOW CROSSFIRE']][stage];
 const hints=['Jump the low return; crouch under the high pass','Leave the mark, then read the second leap','Dodge through the gap; fire at the landing','Move off the marked columns','Crouch high shots; jump the low wave'];
 function random(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed/4294967296;}
 function next(b){if(!b.deck.length){b.deck=[0,1,2,3,4];for(let i=4;i>0;i--){const j=Math.floor(random(b)*(i+1));[b.deck[i],b.deck[j]]=[b.deck[j],b.deck[i]];}if(b.deck[0]===b.pattern)[b.deck[0],b.deck[1]]=[b.deck[1],b.deck[0]];}return b.deck.shift();}
 function move(b,x,y,dt,speed=600){const dx=x-b.x,dy=y-b.y,len=Math.hypot(dx,dy);if(len<=dt*speed){b.x=x;b.y=y;}else{b.x+=dx/len*dt*speed;b.y+=dy/len*dt*speed;}}
 function aim(b,p,speed=270,spread=0){const a=Math.atan2(p.y+p.h*.5-b.y-45,p.x+13-b.x-39);for(let n=-spread;n<=spread;n++)shot(b.x+39,b.y+45,Math.cos(a+n*.26)*speed,Math.sin(a+n*.26)*speed,color,12);}
 function tell(b,p,chain=false){b.pattern=next(b);b.phase='tell';b.timer=chain?1.05:b.enraged?.65:.85;b.mark=Math.max(left+35,Math.min(edge-35,p.x-25));b.attackName=labels[b.pattern];b.marks=b.pattern===3?Array.from({length:stage===4?5:4},(_,n)=>left+35+n*(span-20)/(stage===4?5:4)+(b.cycle%2)*25):[];announce(b.attackName+' / '+hints[b.pattern],2.5);sound(410,.06,'triangle');}
 function update(b,p,dt,t){
  if(b.hp<b.max*.4&&!b.enraged){b.enraged=true;announce(labels.length?'GUARDIAN / OVERDRIVE':'OVERDRIVE',2);burst(b.x+39,b.y+45,color,28);}
  b.inv=Math.max(0,b.inv-dt);b.slow=Math.max(0,b.slow-dt);b.slowCooldown=Math.max(0,(b.slowCooldown||0)-dt);const step=dt*(b.slow>0?.7:1);b.timer-=step;
  if(b.phase==='wait'){move(b,b.x,floor,step,350);if(b.timer<=0)tell(b,p);}
  else if(b.phase==='tell'){if(b.timer<=0){b.phase='attack';b.elapsed=0;b.duration=[3.0,3.3,3.7,3.0,3.2][b.pattern]*(b.enraged?.91:1);b.originX=b.x;b.destination=b.x>mid?left:edge;b.shotClock=.45;b.sub=0;b.cycle++;}}
  else if(b.phase==='attack'){
   b.elapsed+=step;const u=Math.min(1,b.elapsed/b.duration),ox=b.x,oy=b.y,fast=b.enraged?1.12:1;
   if(b.pattern===0){const local=u<.48?u/.48:(u-.52)/.48,target=u<.48?b.destination:b.originX;
    move(b,target,floor-(stage===1?100:stage===4?65:0),step,(stage===3?570:510)*fast);
    if(u>.48&&b.sub<1){b.sub=1;for(const d of [-1,1])shot(b.x+39,ground-17,d*300,0,color,14);}
    if(local>.7&&u<.48&&stage>=2&&b.sub===0){shot(b.x+39,ground-44,b.destination===left?-310:310,0,color,12);b.sub=-1;}
   }else if(b.pattern===1){const first=u<.5,local=(first?u:u-.5)*2,from=first?b.originX:b.destination,to=first?b.destination:b.originX;
    move(b,from+(to-from)*local,floor-Math.sin(local*Math.PI)*(stage===4?230:200),step,740*fast);
    if(!first&&!b.sub){b.sub=1;for(const d of [-1,1])shot(b.x+39,ground-16,d*275,0,color,13);}
   }else if(b.pattern===2){const a=(b.originX>mid?0:Math.PI)+u*Math.PI*2;move(b,mid+Math.cos(a)*span*.48,235+Math.sin(a)*100,step,680*fast);}
   else if(b.pattern===3){move(b,b.destination,stage===1?160:floor-35,step,420);if(u>.3&&!b.sub){b.sub=1;for(let n=0;n<b.marks.length;n++)shot(b.marks[n],85-n*18,0,stage===3?305:330,color,16);}}
   else{const first=u<.5,local=(first?u:u-.5)*2,from=first?b.originX:b.destination,to=first?b.destination:b.originX;move(b,from+(to-from)*local,floor-(first?85:0),step,600*fast);if(u>.22&&!b.sub){b.sub=1;for(const d of [-1,1])shot(b.x+39,ground-44,d*310,0,color,12);}if(u>.61&&b.sub===1){b.sub=2;for(const d of [-1,1])shot(b.x+39,ground-17,d*320,0,color,14);}}
   b.vx=(b.x-ox)/dt;b.vy=(b.y-oy)/dt;b.x=Math.max(left,Math.min(edge,b.x));b.y=Math.max(120,Math.min(floor,b.y));
   b.shotClock-=step;if(b.shotClock<=0){b.shotClock=b.enraged?.76:1.0;if(b.pattern===2)aim(b,p,stage===4?295:250,stage>=3?1:0);else if(b.pattern===1&&stage!==3)aim(b,p,255);}
   if(u>=1){if(stage===4&&b.enraged&&!b.chained){b.chained=true;tell(b,p,true);}else{b.chained=false;b.phase='recover';b.timer=b.enraged?.9:1.3;b.vx=b.vy=0;}}
  }else if(b.phase==='recover'){move(b,b.x,floor,step,340);if(b.timer<=0){b.phase='wait';b.timer=b.enraged?.2:.4;}}
  if(p.x<b.x+b.w-9&&p.x+p.w>b.x+9&&p.y<b.y+b.h&&p.y+p.h>b.y+10)damage(stage===4?5:4,p.x<b.x?-1:1);
 }
 return{update,warnings:b=>({name:labels[b.pattern]||'',hint:hints[b.pattern]||'',marks:b.pattern===1?[b.mark+39]:b.marks||[]})};
};

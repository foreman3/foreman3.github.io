/* Test-only keyboard pilot. Never loaded by the game. No movement/health warps. */
window.runHollowRoute=function(limit=180){
 const h=__hollow,pressed=new Set(),key=(code,on)=>{if(pressed.has(code)===on)return;dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?pressed.add(code):pressed.delete(code);};
 let age=0,fireAge=0,mineWait=0,lastMine=0,jumps=0,shots=0,relays=0,lastX=0,stuck=0;const start=h.snapshot();let r=h.world(),lastDeaths=start.deaths;const startDeaths=start.deaths,health=[];
 const release=()=>{if(pressed.has('KeyX')){key('KeyX',false);shots++;}fireAge=0;};
 function navigation(r,p,x,y,wing){
  const floors=r.platforms.filter(a=>!a.ceiling&&!a.tunnel),maxRise=wing?275:142;
  let from=floors.findIndex(a=>Math.abs(a.y-p.y-p.h)<5&&p.x+p.w>a.x&&p.x<a.x+a.w);
  if(from<0){if(!p.ground&&r.pilotFrom!==undefined)from=r.pilotFrom;else from=floors.reduce((best,a,i)=>Math.abs(a.y-p.y-p.h)+(p.x<a.x?a.x-p.x:p.x>a.x+a.w?p.x-a.x-a.w:0)<best.cost?{index:i,cost:Math.abs(a.y-p.y-p.h)+(p.x<a.x?a.x-p.x:p.x>a.x+a.w?p.x-a.x-a.w:0)}:best,{index:0,cost:Infinity}).index;}
  if(p.ground)r.pilotFrom=from;
  const target=floors.reduce((best,a,i)=>Math.abs(a.y-y)*4+(x<a.x?a.x-x:x>a.x+a.w?x-a.x-a.w:0)<best.cost?{index:i,cost:Math.abs(a.y-y)*4+(x<a.x?a.x-x:x>a.x+a.w?x-a.x-a.w:0)}:best,{index:0,cost:Infinity}).index;
  if(from===target)return null;const queue=[[from]],seen=new Set([from]);
  while(queue.length){const route=queue.shift(),i=route[route.length-1];if(i===target)return floors[route[1]];const a=floors[i];
   for(let j=0;j<floors.length;j++){if(seen.has(j))continue;const b=floors[j],rise=a.y-b.y,gap=Math.max(0,b.x-a.x-a.w,a.x-b.x-b.w);if(rise>maxRise||gap>(wing?340:rise>75?155:220)||rise<-700)continue;seen.add(j);queue.push([...route,j]);}
  }return null;
 }
 window.hollowNavigate=navigation;
 for(;age<limit*60;age++){
  let s=h.snapshot(),p=s.p;if(s.mode==='story'){pressed.clear();fireAge=0;document.getElementById('story-close').click();s=h.snapshot();}if(s.deaths!==lastDeaths){pressed.clear();fireAge=0;mineWait=0;lastDeaths=s.deaths;}if(s.room!==r.id)break;r=h.world();health.push(p.hp);
  const far=r.portals.reduce((a,b)=>a.x>b.x?a:b),exitFloor=far.y+far.h;
  if(p.x>(r.arena?r.arena.x+120:r.w-200)&&r.zones.every(z=>z.open)&&(r.kind!=='shaft'||Math.abs(p.y+p.h-exitFloor)<75))break;
  const relic=r.objects.find(o=>o.type==='power'&&!s.powers.includes(o.power)),z=r.zones.find(z=>!z.open),guard=z&&r.enemies.filter(e=>!e.dead&&e.zone===z.id).sort((a,b)=>a.x-b.x)[0];
  const target=guard||null;
  let goal=r.arena?r.arena.x+150:r.w-170,needJump=false,up=false,fire=false,descend=false,blastClimb=false;
  const feet=p.y+p.h;
  if(relic&&Math.abs(relic.x-p.x)<65&&Math.abs(relic.y-p.y)<105){key('KeyE',true);key('KeyE',false);}
  // Relays are picked up while crossing their landing, without healing cheats.
  const relay=r.objects.find(o=>o.type==='relay'&&Math.abs(o.x-p.x)<30&&Math.abs(o.y-p.y)<85);if(relay&&!relay.testUsed){relay.testUsed=true;key('KeyE',true);key('KeyE',false);relays++;}
  const mineTarget=target&&(target.armor==='crust'||target.armor!=='phase'&&s.powers.includes('bomb')&&target.groundY>feet+65&&target.groundY<feet+135);
  if(target){const dy=p.y+20-(target.y+target.h*.5),high=dy>55;
   if(mineTarget){
    h.select(0);const close=Math.abs(target.x-p.x)<65&&Math.abs(target.groundY-feet)<135;
    if(close&&mineWait<=0&&age-lastMine>45){release();if(!p.fold){key('KeyS',true);key('KeyS',false);}key('KeyX',true);key('KeyX',false);mineWait=43;lastMine=age;}
    goal=mineWait>0?target.x-180:target.x-43;
    if(mineWait===40&&h.snapshot().p.fold){key('KeyS',true);key('KeyS',false);}mineWait=Math.max(0,mineWait-1);
   }else{
    if(p.fold){key('KeyS',true);key('KeyS',false);}
    h.select(target.armor==='phase'?2:0);goal=high?target.x+target.w*.5-14:target.x-210;
    up=high&&Math.abs(target.x+target.w*.5-p.x-14)<25;fire=up||Math.abs(dy)<28;
    if(high&&Math.abs(goal-p.x)<80)needJump=true;
   }
   // Descend off a ledge rather than firing into a lower platform edge.
   if(target.groundY>feet+70&&(!mineTarget||target.groundY>feet+135)){descend=true;const support=r.platforms.find(a=>!a.ground&&Math.abs(a.y-feet)<4&&p.x+p.w>a.x&&p.x<a.x+a.w);if(support)goal=support.x+support.w+40;}
   // Climb the authored shaft route before addressing an upper guard.
   if(r.kind==='shaft'&&target.groundY<feet-165){const next=r.waypoints.find(a=>a.y<feet-30&&a.x>p.x-130);if(next){goal=next.x;needJump=true;}}
  }else{if(p.fold&&r.kind!=='tunnel'){key('KeyS',true);key('KeyS',false);}release();}
  if(r.kind==='shaft'){const next=navigation(r,p,target?target.x:far.x,target?target.groundY:exitFloor,s.powers.includes('jump'));if(next){goal=next.x+next.w*.5;descend=next.y>feet+40;needJump=!descend&&p.x+170>next.x&&p.x<next.x+next.w+120;}}
  if(relic&&Math.abs(relic.x-p.x)<350&&(!target||target.x>relic.x)&&relic.y+p.h<feet-55){goal=relic.x;needJump=true;}
  if(relic&&Math.abs(relic.x-p.x)<80&&(!target||target.x>relic.x)&&relic.y+65<feet-120&&s.powers.includes('bomb')){goal=relic.x;needJump=false;blastClimb=true;}
  const tunnel=r.platforms.find(a=>a.tunnel&&p.x+p.w>a.x-35&&p.x<a.x+a.w+10&&p.y>a.y+a.h-50);if(tunnel&&s.powers.includes('fold')){release();if(!h.snapshot().p.fold){key('KeyS',true);key('KeyS',false);}goal=tunnel.x+tunnel.w+250;fire=false;}
  const ahead=r.hazards.some(a=>(a.pit||a.type==='spikes'||a.type==='heat'&&!s.powers.includes('heat'))&&a.x-p.x<95&&a.x-p.x>-20);
  const incoming=h.bullets().some(b=>b.owner==='enemy'&&Math.abs(b.x-p.x)<150&&Math.abs(b.y-p.y)<70&&b.vx*(p.x-b.x)>0);
  needJump=!descend&&(needJump||ahead||incoming);
  if(p.ground&&needJump&&!p.fold){key('Space',true);jumps++;}else if(!p.ground&&needJump&&p.vy>-10&&!p.airJump&&s.powers.includes('jump')&&!p.fold){key('Space',true);jumps++;}else if(!p.ground&&p.vy<-50&&pressed.has('Space'))key('Space',true);else key('Space',false);
  key('ArrowRight',p.x<goal-12);key('ArrowLeft',p.x>goal+12);key('ArrowUp',up);
  if(target&&!mineTarget&&!tunnel){
   if(s.powers.includes('lens')){if(!pressed.has('KeyX'))key('KeyX',true);fireAge++;if(fire&&fireAge>=42){if(!up){key('ArrowRight',target.x>p.x);key('ArrowLeft',target.x<=p.x);}release();}}
   else{key('KeyX',age%20<10);if(age%20===10){if(!up){key('ArrowRight',target.x>p.x);key('ArrowLeft',target.x<=p.x);}shots++;}}
  }
  if(blastClimb){if(!h.snapshot().p.fold){release();key('KeyS',true);key('KeyS',false);}key('KeyX',true);fireAge=0;}
  if(Math.abs(p.x-lastX)<.3)stuck++;else stuck=0;lastX=p.x;
  if(stuck>90&&!p.fold){key('Space',age%90<45);}
  h.step(1,false);
 }
 for(const code of [...pressed])key(code,false);h.step(0);const end=h.snapshot(),far=r.portals.reduce((a,b)=>a.x>b.x?a:b);return{room:r.id,name:r.name,seconds:age/60,cleared:r.zones.every(z=>z.open),crossed:end.room===r.id&&end.p.x>(r.arena?r.arena.x+120:r.w-200)&&(r.kind!=='shaft'||Math.abs(end.p.y+end.p.h-far.y-far.h)<75),fields:r.zones.filter(z=>z.open).length,totalFields:r.zones.length,integrity:end.p.hp,minIntegrity:Math.min(...health),deaths:end.deaths-startDeaths,jumps,shots,relays,x:end.p.x,y:end.p.y,fold:end.p.fold,remaining:r.enemies.filter(e=>e.zone&&!e.dead).map(e=>({id:e.id,type:e.type,armor:e.armor,x:e.x,y:e.y,hp:e.hp}))};
};

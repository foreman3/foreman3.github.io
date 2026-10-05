/* Test-only controller: normal keyboard movement, charge, dash and weapon selection. */
window.runIronRoute=function(limit=360,useCores=true){
 const h=__iron,pressed=new Set(),key=(code,on)=>{if(pressed.has(code)===on)return;dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?pressed.add(code):pressed.delete(code);},tap=code=>{key(code,true);key(code,false);};
 let frames=0,fireAge=0,rest=0,jumps=0,shots=0,dashes=0,minHP=28,lastLives=h.snapshot().lives,damage=0;const world=h.world(),initial=h.snapshot(),damageTrace=[];let priorHP=initial.player.hp;
 for(;frames<limit*60;frames++){
  const s=h.snapshot(),p=s.player;if(s.mode!=='play'||s.bossActive)break;if(s.lives!==lastLives){pressed.clear();fireAge=0;rest=0;lastLives=s.lives;}if(p.hp<priorHP)damageTrace.push({seconds:frames/60,hp:p.hp,x:p.x,y:p.y,vx:p.vx,vy:p.vy});priorHP=p.hp;minHP=Math.min(minHP,p.hp);
  const z=world.encounters.find(z=>!z.open),targets=z?h.enemies().filter(e=>!e.dead&&e.group===z.id).sort((a,b)=>a.x-b.x):[],e=targets[0];let goal=e?e.x-190:world.arena+100;
  if(e&&e.type==='turret'&&e.groundY<444)goal=e.x-65;
  if(e&&e.groundY===444&&e.type!=='drone'&&e.type!=='warden')for(const a of world.platforms)if(a.oneway&&goal>a.x-35&&goal<a.x+a.w+35&&a.y<400)goal=e.x+150;
  if(e&&e.type==='warden')goal=e.home-330;
  if(e&&e.type==='warden'&&e.pattern===1&&['tell','attack'].includes(e.state))goal=e.home-380;
  if(e)for(const a of world.platforms)if(a.tunnel&&e.x>a.x+a.w&&e.x<a.x+a.w+400)goal=Math.max(goal,a.x+a.w+75);
  const tunnel=world.platforms.find(a=>a.tunnel&&p.x+p.w>a.x-45&&p.x<a.x+a.w+15&&p.y>a.y+a.h-55),duck=e&&e.type==='warden'&&h.bullets().some(a=>a.owner==='enemy'&&Math.abs(a.x-p.x)<220&&Math.abs(a.vy)<5&&a.y>=392&&a.y+a.h<=417);key('ArrowDown',Boolean(tunnel||duck));if(tunnel)goal=Math.max(goal,tunnel.x+tunnel.w+75);
  const elevated=e&&p.y+18>e.y+e.h-5,low=e&&p.y+18<e.y-12;
  if(low){const support=world.platforms.find(a=>a.oneway&&!a.lift&&Math.abs(a.y-p.y-p.h)<3&&p.x+p.w>a.x&&p.x<a.x+a.w);if(support)goal=z&&support.x+support.w>=z.x?support.x-70:support.x+support.w+55;}
  const aligned=e&&p.y+(p.crouch?9:18)>e.y-15&&p.y+18<e.y+e.h+5;
  const incoming=h.bullets().some(a=>a.owner==='enemy'&&Math.abs(a.x-p.x)<140&&Math.abs(a.y-p.y)<65&&a.vx*(p.x-a.x)>0);
  const obstacle=world.hazards.some(a=>a.x-p.x<85&&a.x-p.x>-25&&(a.pit||!a.period)),column=world.hazards.find(a=>a.period&&a.warning&&a.x-p.x<90&&a.x+a.w>p.x-20);
  if(column)goal=column.x-95;
  key('ArrowRight',p.x<goal-12);key('ArrowLeft',p.x>goal+12);
  const jump=!tunnel&&!duck&&(p.ground&&(obstacle||incoming||p.wall||elevated&&Math.abs(p.x-goal)<65)||p.wall&&p.vy>0||pressed.has('Space')&&p.vy<-40);
  if(p.wall&&p.vy>=0&&pressed.has('Space')){key('Space',false);h.step(1,false);continue;}if(jump&&!pressed.has('Space'))jumps++;key('Space',jump);
  const bigGap=world.hazards.some(a=>a.pit&&p.x>a.x-25&&p.x<a.x+a.w&&!p.ground&&p.vy>-80),dash=bigGap&&!p.airDash&&!tunnel&&!pressed.has('ShiftLeft');key('ShiftLeft',dash);if(dash)dashes++;
  if(e){const preferred=useCores&&e.weak&&s.cleared.includes(e.weak-1)&&s.energy>16?e.weak:0;if(preferred!==s.weapon)tap('Digit'+(preferred+1));
   if(rest>0){key('KeyX',false);rest--;}else{key('KeyX',true);fireAge++;if(aligned&&fireAge>42&&(!e.armor||preferred>0||e.exposed>0)){if(!tunnel){key('ArrowRight',e.x>p.x);key('ArrowLeft',e.x<=p.x);}key('KeyX',false);shots++;fireAge=0;rest=17;}}
  }else{key('KeyX',false);fireAge=0;}
  h.step(1,false);
 }
 for(const code of [...pressed])key(code,false);h.step(0);const end=h.snapshot();return{stage:end.stage+1,matched:useCores,reachedBoss:end.bossActive,seconds:frames/60,fields:end.encounters.length,checkpoint:end.checkpoint,armor:end.player.hp,minArmor:minHP,lostAttempts:3-end.lives,mode:end.mode,x:end.player.x,jumps,shots,dashes,damageTrace,remaining:h.enemies().filter(e=>e.group!==undefined&&!e.dead).map(e=>({id:e.id,type:e.type,hp:e.hp,x:e.x,y:e.y,state:e.state}))};
};

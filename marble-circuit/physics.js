(function(root) {
  'use strict';
  const R=root.MarbleRules||require('./rules.js');
  function create(course,level=1,score=0) {
    const n=course.nodes.S;
    return{course,level,mode:'playing',score,baseScore:score,elapsed:0,penalty:0,lives:course.lives,collected:0,checkpoint:n,falls:0,bumps:0,heat:0,flight:null,ride:null,loading:null,rideLock:0,launchLock:0,respawn:0,fallReason:'',railRides:0,launches:0,lowerLandings:0,effects:[],events:[],gems:new Set(),braking:false,surface:null,
      player:{x:n.x,y:n.y,z:n.z,vx:0,vy:0,vz:0,grounded:true,shield:1.5,roll:0,airTime:0},enemies:course.enemies.map(h=>({...h,x:h.a[0],y:h.a[1],z:h.a[2]}))};
  }
  const remaining=s=>Math.max(0,s.course.time-s.elapsed-s.penalty);
  function emit(s,type,text=''){s.events.push({type,text});}
  function lose(s,reason){if(s.mode!=='playing'||s.respawn)return;s.lives--;s.falls++;s.penalty+=3;s.respawn=.72;s.fallReason=reason;s.ride=null;s.loading=null;s.flight=null;s.heat=0;emit(s,'fall',`${reason} · −1 marble, +3s. Returning to ${s.collected?'beacon '+s.collected:'the start'}.`);}
  function finish(s,won,reason=''){if(s.mode!=='playing')return;s.mode=won?'cleared':'lost';if(won){s.bonus=Math.floor(remaining(s)*10)+s.lives*100;s.score+=s.bonus;}emit(s,won?'clear':'lost',reason);}
  function locateEnemy(e,time){const dx=e.b[0]-e.a[0],dy=e.b[1]-e.a[1],len=Math.hypot(dx,dy),distance=(time*e.speed)%(len*2),t=distance>len?2-distance/len:distance/len;e.x=R.mix(e.a[0],e.b[0],t);e.y=R.mix(e.a[1],e.b[1],t);e.z=R.mix(e.a[2],e.b[2],t);}
  function gateState(g,time){const phase=(time+(g.phase||0))%g.period;return phase<.75?'warning':phase<1.65?'closed':'open';}
  function attachRail(s){
    if(s.rideLock>0)return;const p=s.player;
    // A deliberate entry beyond the fork pad prevents nearby walking routes
    // from snapping into rails, including rails ascending above a lower deck.
    for(const path of s.course.rails){const e=path.edges[0],q=R.onEdge(e,p.x,p.y),along=q.t*e.length;
      if(along<76||along>Math.min(190,e.length)||q.d>e.width*.45||Math.abs(p.z-q.z)>36||p.vx*e.ux+p.vy*e.uy<15)continue;
      s.ride={path,distance:along,dir:1,speed:Math.max(95,Math.hypot(p.vx,p.vy))};s.railRides++;emit(s,'rail','ON THE RAIL · Hold BRAKE to slow. Prepare for the exit island.');return;
    }
  }
  function advanceRide(s,dt,input){const r=s.ride,p=s.player,pos=R.pointAlong(r.path,r.distance),acceleration=75-pos.slope*400*r.dir;r.speed=R.clamp((r.speed+acceleration*dt)*Math.exp(-(input.brake?3.4:.1)*dt),input.brake?38:95,input.brake?100:300);r.distance+=r.speed*r.dir*dt;const next=R.pointAlong(r.path,r.distance);p.x=next.x;p.y=next.y;p.z=next.z;p.vx=next.ux*r.speed*r.dir;p.vy=next.uy*r.speed*r.dir;p.roll+=r.speed*dt/15;if(r.distance<0||r.distance>r.path.length){s.ride=null;s.rideLock=.8;p.grounded=true;emit(s,'exit','RAIL EXIT · You have the steering. Brake for the next turn.');}}
  function checkObjectives(s){const p=s.player;if(!p.grounded||s.respawn)return;if(s.collected<3){const n=s.course.checkpoints[s.collected];if(Math.hypot(p.x-n.x,p.y-n.y)<n.r*.67&&Math.abs(p.z-n.z)<22){s.collected++;s.checkpoint=n;s.score+=250;p.shield=Math.max(p.shield,.5);emit(s,'beacon',s.collected===3?'ALL BEACONS LIT · Reach the finish pavilion.':`BEACON ${s.collected} · Checkpoint saved. Choose a route to ${s.collected+1}.`);}}for(const n of s.course.gems)if(!s.gems.has(n.id)&&Math.hypot(p.x-n.x,p.y-n.y)<30&&Math.abs(p.z-n.z)<22){s.gems.add(n.id);s.score+=150;emit(s,'gem','EXPRESS GEM · +150');}const end=s.course.nodes.F;if(s.collected===3&&Math.hypot(p.x-end.x,p.y-end.y)<42&&Math.abs(p.z-end.z)<22)finish(s,true);}
  function simulate(s,input,dt){
    const p=s.player,c=s.course;s.elapsed+=dt;p.shield=Math.max(0,p.shield-dt);s.rideLock=Math.max(0,s.rideLock-dt);s.launchLock=Math.max(0,s.launchLock-dt);for(const e of s.enemies){locateEnemy(e,s.elapsed);const floor=R.ground(c,e.x,e.y,e.z,50);if(floor)e.z=floor.z;}
    if(remaining(s)<=0){finish(s,false,'The clock ran out.');return;}
    if(s.respawn){s.respawn-=dt;p.z-=140*dt;if(s.respawn<=0){if(s.lives<=0){finish(s,false,s.fallReason);return;}const n=s.checkpoint;Object.assign(p,{x:n.x,y:n.y,z:n.z,vx:0,vy:0,vz:0,airTime:0,grounded:true,shield:2});s.respawn=0;s.rideLock=.8;s.launchLock=.8;emit(s,'respawn');}return;}
    s.braking=!!input.brake;
    if(s.loading){s.loading.time+=dt;if(s.loading.time>=.48){const l=s.loading.launcher,T=l.duration;p.vx=(l.to.x-p.x)/T;p.vy=(l.to.y-p.y)/T;p.vz=(l.to.z-p.z+340*T*T)/T;p.grounded=false;p.airTime=0;s.flight={launcher:l};s.loading=null;s.launchLock=2;s.launches++;emit(s,'launch','AIRBORNE · The cannon sets the arc. Prepare to brake on the landing mat.');}return;}
    if(s.ride){advanceRide(s,dt,input);checkObjectives(s);return;}
    const desired=R.screenVector(input.x||0,input.y||0);let surface=p.grounded?R.ground(c,p.x,p.y,p.z):null;if(p.grounded&&!surface){p.grounded=false;p.vz=0;p.airTime=0;}
    const brake=p.grounded&&input.brake,acceleration=p.grounded?(brake?350:610):s.flight?0:110,drag=p.grounded?(brake?7:1.85):s.flight?0:.08,decay=Math.exp(-drag*dt);
    p.vx=(p.vx+desired.x*acceleration*dt-(surface?.gx||0)*420*dt)*decay;p.vy=(p.vy+desired.y*acceleration*dt-(surface?.gy||0)*420*dt)*decay;
    for(const b of c.belts)if(p.grounded){const dx=b.b[0]-b.a[0],dy=b.b[1]-b.a[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,along=(p.x-b.a[0])*ux+(p.y-b.a[1])*uy,cross=(p.x-b.a[0])*(-uy)+(p.y-b.a[1])*ux;if(along>=0&&along<=len&&Math.abs(cross)<b.width/2&&Math.abs(p.z-R.mix(b.a[2],b.b[2],along/len))<35){p.vx+=ux*b.force*dt;p.vy+=uy*b.force*dt;}}
    const speed=Math.hypot(p.vx,p.vy),cap=brake?100:285;if(p.grounded&&speed>cap){p.vx*=cap/speed;p.vy*=cap/speed;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.roll+=(p.vx+p.vy)*dt/18;
    if(p.grounded){surface=R.ground(c,p.x,p.y,p.z);s.surface=surface;if(surface){p.z=surface.z;attachRail(s,surface);}else{p.grounded=false;p.vz=0;p.airTime=0;}}
    else{const old=p.z;p.vz-=680*dt;p.z+=p.vz*dt;p.airTime+=dt;if(p.vz<0){const deck=R.landing(c,p.x,p.y,old,p.z);if(deck){if(!s.flight&&p.airTime>.16){s.lowerLandings++;emit(s,'land','SAVED BY A LOWER DECK · Keep rolling.');}if(s.flight){p.vx*=.45;p.vy*=.45;p.shield=Math.max(p.shield,1);emit(s,'land','TOUCHDOWN · The landing mat slows you. Brake for the next turn.');}p.z=deck.z;p.vz=0;p.grounded=true;s.flight=null;s.rideLock=.3;}}if(p.z< -180||p.airTime>3)lose(s,'OFF THE EDGE');}
    if(!p.grounded||s.respawn)return;
    let acid=false;for(const a of c.acid)if(Math.hypot(p.x-a.x,p.y-a.y)<a.r+7&&Math.abs(p.z-a.z)<35){acid=true;break;}const wasHot=s.heat>.05;s.heat=R.clamp(s.heat+(acid?dt:-dt*1.7),0,.72);if(!wasHot&&acid)emit(s,'acid','ACID · Roll out of the bubbling patch before the marble dissolves.');if(s.heat>=.7){lose(s,'DISSOLVED IN ACID');return;}
    for(const gate of c.gates)if(gateState(gate,s.elapsed)==='closed'&&Math.abs(p.z-gate.z)<35&&Math.hypot(p.x-gate.x,p.y-gate.y)<gate.r+9){lose(s,'CAUGHT BY A CRUSHER');return;}
    for(const e of s.enemies)if(p.shield<=0&&Math.abs(p.z-e.z)<32){let dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);if(d<e.r+12){if(d<.01){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d;p.x=e.x+nx*(e.r+13);p.y=e.y+ny*(e.r+13);const into=p.vx*nx+p.vy*ny;if(into<0){p.vx-=into*nx;p.vy-=into*ny;}p.vx+=nx*125;p.vy+=ny*125;p.shield=1;s.bumps++;emit(s,'bump','RIVAL BUMP · Brake, settle, and take the open side.');}}
    for(const l of c.launchers)if(s.launchLock<=0&&Math.hypot(p.x-l.from.x,p.y-l.from.y)<26&&Math.abs(p.z-l.from.z)<22){p.x=l.from.x;p.y=l.from.y;p.z=l.from.z;p.vx=0;p.vy=0;s.loading={launcher:l,time:0};s.ride=null;emit(s,'load','CANNON LOADED · Firing toward the flagged landing island…');break;}
    checkObjectives(s);
  }
  function step(s,input,dt){if(s.mode!=='playing')return;const duration=Math.min(.1,Math.max(0,dt)),count=Math.max(1,Math.ceil(duration*120));for(let i=0;i<count&&s.mode==='playing';i++)simulate(s,input,duration/count);}
  const api={create,step,remaining,lose,finish,gateState};root.MarblePhysics=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

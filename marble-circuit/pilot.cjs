/* Input-only route controller for the browser and Node feasibility checks. */
function marblePilot(level,options={}) {
  const t=globalThis.__marbleTest,R=t.rules,P=t.physics;
  t.start(level,0);const s=t.state,c=s.course,route=(options.route==='fast'?c.fastRoute:c.safeRoute);
  const delay=options.delay||.16,pace=options.pace||160,dt=1/60;
  let goal=1,think=0,elapsed=0,lastRideEnd=null,lastLanding=null,forced=options.forced||0,minZ=s.player.z,maxZ=s.player.z,airFrames=0;const framing={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
  function setWorld(x,y,brake){const v=R.screenInput(x,y);t.input.touchX=v.x;t.input.touchY=v.y;t.input.brake=brake;}
  while(s.mode==='playing'&&elapsed<c.time+1&&elapsed<(options.stop||Infinity)) {
    const p=s.player;minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);if(!p.grounded)airFrames++;if(t.camera&&!s.respawn){const q=R.project(p.x,p.y,p.z),x=(q.x-t.camera.x)*t.camera.zoom+480,y=(q.y-t.camera.y)*t.camera.zoom+276;framing.minX=Math.min(framing.minX,x);framing.maxX=Math.max(framing.maxX,x);framing.minY=Math.min(framing.minY,y);framing.maxY=Math.max(framing.maxY,y);}
    if(forced&&s.collected>=(options.forced-forced+1)&&!s.respawn){P.lose(s,'RECOVERY TRIAL');forced--;}
    if(s.respawn){goal=Math.max(1,route.indexOf(s.checkpoint.id)+1);think=0;lastRideEnd=null;lastLanding=null;setWorld(0,0,false);t.step(dt);elapsed+=dt;continue;}
    if(s.ride){lastRideEnd=s.ride.dir>0?s.ride.path.edges.at(-1).b.id:s.ride.path.edges[0].a.id;const left=s.ride.dir>0?s.ride.path.length-s.ride.distance:s.ride.distance;setWorld(0,0,left<150);t.step(dt);elapsed+=dt;continue;}
    if(lastRideEnd){goal=Math.min(route.length-1,Math.max(goal,route.indexOf(lastRideEnd)+1));lastRideEnd=null;think=0;}
    if(s.loading){lastLanding=s.loading.launcher.to.id;setWorld(0,0,true);t.step(dt);elapsed+=dt;continue;}
    if(s.flight){setWorld(0,0,true);t.step(dt);elapsed+=dt;continue;}
    if(lastLanding&&p.grounded){goal=Math.min(route.length-1,Math.max(goal,route.indexOf(lastLanding)+1));lastLanding=null;think=0;}
    let n=c.nodes[route[goal]],distance=Math.hypot(p.x-n.x,p.y-n.y),radius=n.kind==='checkpoint'?32:Math.min(38,n.r*.95);
    if(distance<radius&&Math.abs(p.z-n.z)<28&&goal<route.length-1){goal++;n=c.nodes[route[goal]];think=0;}
    think-=dt;
    if(think<=0&&p.grounded){
      think=delay;const prior=c.nodes[route[Math.max(0,goal-1)]],dx=n.x-p.x,dy=n.y-p.y,d=Math.hypot(dx,dy)||1;
      const segX=n.x-prior.x,segY=n.y-prior.y,len=Math.hypot(segX,segY)||1,ux=segX/len,uy=segY/len;
      const edge=c.edges.find(e=>(e.a===prior&&e.b===n)||(e.b===prior&&e.a===n)),width=edge?.width||120;
      let aimX=n.x,aimY=n.y,desired=Math.min(pace,Math.sqrt(Math.max(0,d-7)*280)),waiting=false;
      if(options.aware!==false){
        const obstacles=[...c.acid.map(a=>({...a,kind:'acid'})),...s.enemies.map(e=>({...e,kind:'enemy'})),...c.gates.map(g=>({...g,kind:'gate'}))];
        for(const h of obstacles){if(Math.abs(h.z-p.z)>42)continue;const along=(h.x-p.x)*ux+(h.y-p.y)*uy,cross=(h.x-prior.x)*(-uy)+(h.y-prior.y)*ux;
          if(along< -40||along>150||along>d+25||Math.abs(cross)>width*.7)continue;
          if(h.kind==='gate'&&width<2*(h.r+23)&&P.gateState(h,s.elapsed)!=='open'){
            aimX=h.x-ux*(h.r+55);aimY=h.y-uy*(h.r+55);desired=Math.min(100,Math.hypot(aimX-p.x,aimY-p.y)*2);waiting=true;break;
          }
          if(h.kind==='gate'&&width<2*(h.r+23))continue;
          const side=cross>=0?-1:1,offset=side*Math.min(width/2-6,h.r+25),currentCross=(p.x-prior.x)*(-uy)+(p.y-prior.y)*ux;
          aimX=p.x+ux*Math.max(50,along)-uy*(offset-currentCross);aimY=p.y+uy*Math.max(50,along)+ux*(offset-currentCross);if(d<90){aimX=n.x-uy*offset;aimY=n.y+ux*offset;}desired=Math.min(desired,105);break;
        }
      }
      const adx=aimX-p.x,ady=aimY-p.y,ad=Math.hypot(adx,ady)||1,vx=adx/ad*desired,vy=ady/ad*desired,speed=Math.hypot(p.vx,p.vy),lateral=Math.abs(p.vx*(-uy)+p.vy*ux);
      const brake=options.aware!==false&&(speed>desired+30||(d<75&&speed>90)||lateral>70||waiting&&speed>desired+5);
      const drag=brake?7:1.85,acc=brake?350:610,surface=R.ground(c,p.x,p.y,p.z);
      let ix=(vx*drag+(vx-p.vx)*5+(surface?.gx||0)*420)/acc,iy=(vy*drag+(vy-p.vy)*5+(surface?.gy||0)*420)/acc,m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m;}setWorld(ix,iy,brake);
    }
    t.step(dt);elapsed+=dt;
  }
  t.draw?.();return{level,route:options.route||'safe',mode:s.mode,seconds:+s.elapsed.toFixed(2),penalty:s.penalty,left:+P.remaining(s).toFixed(2),beacons:s.collected,lives:s.lives,falls:s.falls,bumps:s.bumps,rails:s.railRides,launches:s.launches,lowerLandings:s.lowerLandings,minZ:+minZ.toFixed(1),maxZ:+maxZ.toFixed(1),airFrames,framing:t.camera?framing:undefined,goal:route[goal],position:{x:+s.player.x.toFixed(1),y:+s.player.y.toFixed(1),z:+s.player.z.toFixed(1)}};
}
if(typeof module!=='undefined')module.exports=marblePilot;

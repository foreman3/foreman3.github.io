/* Geometry and formations follow STAGE-REDESIGN.md. No game input lives here. */
window.IronStages=(()=>{
 const ends=[[2150,4500,5900,9650],[2350,4950,6450,10700],[2600,5250,6800,11350],[2850,5600,7150,12000],[3100,5900,7550,12700]],checkpoints=[6100,6700,7050,7450,7850];
 const titles=[['SALT PIER','SHIPYARD CUT','BREAKWATER BATTERY','DRYDOCK RUN'],['TURBINE PROMENADE','BROKEN SKYWAY','STORM RELAY','LIGHTNING CAUSEWAY'],['CONSERVATORY','CANOPY WALK','POLLINATION ENGINE','ROOTWORKS'],['COLD ASSEMBLY','SMELTER RUINS','PRESSURE LOCK','GLACIER CONVEYOR'],['REACTOR RING','CORE TRANSIT','MERIDIAN SENTINEL','CONTAINMENT GAUNTLET']];
 const names=['DOCKBREAKER','COIL MARSHAL','GLASS SCYTHE','CRYO RAM','PRISM SENTINEL'],weak=[3,1,2,3,4];
 const gaps=[[[2650,150],[3350,170],[7450,180],[8700,180],[10250,190]],[[2800,180],[3750,200],[7700,190],[9150,210],[11250,190]],[[3200,170],[4100,180],[8100,190],[9650,200],[11950,195]],[[3450,180],[4350,190],[8450,210],[10150,220],[12500,200]],[[3650,190],[4600,220],[8800,220],[10350,230],[13300,225]]];
 function build(i,s,ground=444){
  const platforms=[],lifts=[],hazards=[],enemies=[],encounters=[],landmarks=[],areas=[],caches=[],wind=[];let cursor=0;
  const slab=(x,y,w=240,h=22,more={})=>platforms.push({x,y,w,h,oneway:true,...more});
  for(const [x,w] of gaps[i]){platforms.push({x:cursor,y:ground,w:x-cursor,h:150,ground:true});hazards.push({x,y:510,w,h:40,pit:true});cursor=x+w;slab(x-95,ground-70,w+190);if(i===1||i>=3)lifts.push({x:x-25,y:ground-95,w:w+50,h:20,oneway:true,lift:true,base:ground-95,phase:x*.01});}
  platforms.push({x:cursor,y:ground,w:s.length-cursor,h:150,ground:true});
  // Low terraces, tall climbable machinery, and real low maintenance passages.
  for(let n=0,x=520;x<s.length-1150;x+=630,n++){const rise=[85,135,100,160][(n+i)%4];slab(x,ground-rise,285);if(rise>120)slab(x-160,ground-70,180);}
  for(const x of [i===1?3150:3000,checkpointX(i)+(i===0?1050:1350)]){platforms.push({x,y:ground-118,w:34,h:118,wall:true});slab(x-15,ground-190,240);slab(x+220,ground-245,240);}
  if(i===0||i===2||i===4)for(const x of [1200,checkpointX(i)+350])platforms.push({x,y:ground-145,w:370,h:112,tunnel:true});
  if(i>=2)for(const x of [1750,3800,checkpointX(i)+800,checkpointX(i)+2300]){hazards.push({x,y:ground-14,w:i===4?115:95,h:14,type:'spikes'});slab(x-90,ground-75,280);}
  if(i===1||i===4)for(const x of [checkpointX(i)+1150,checkpointX(i)+2100,checkpointX(i)+3300])hazards.push({x,y:100,w:48,h:ground-100,type:'column',period:i===4?4.8:5.6,phase:x*.002});
  if(i===3)for(const x of [checkpointX(i)+1100,checkpointX(i)+2700])hazards.push({x,y:110,w:62,h:ground-110,type:'icefall',period:5.3,phase:x*.003});
  if(i===1)wind.push({x:2600,w:1700,force:32},{x:7600,w:1800,force:-38});
  if(i>=3)for(const a of platforms)if(a.ground&&a.x>checkpointX(i))a.conveyor=(Math.floor(a.x/1000)%2?1:-1)*(i===4?48:38);
  const safeEnemyX=x=>{for(const [a,w] of gaps[i])if(x>a-80&&x<a+w+60)x=a+w+120;for(const a of platforms)if(a.tunnel&&x>a.x-70&&x<a.x+a.w+80)x=a.x+a.w+110;return x;};
  ends[i].forEach((end,k)=>{
   const encounter={id:k,x:end,y:30,w:18,h:ground-30,open:false,title:titles[i][k],midpoint:k===2,from:end-(k===2?950:1450),guards:[]};encounters.push(encounter);areas.push({x:k===0?0:ends[i][k-1]+80,end,name:titles[i][k]});
   const count=k===2?1:k===0?2:i===4&&k===3?4:3;
   for(let n=0;n<count;n++){
    const x=k===2?end-480:safeEnemyX(end-1100+n*310),type=k===2?'warden':['walker','turret','drone'][(n+k+i)%3],w=type==='warden'?78:type==='drone'?38:34,h=type==='warden'?100:type==='turret'?30:38;
    let preferred=i===0?0:weak[i];if(i===4&&k!==2)preferred=[1,2,3,4][(n+k)%4];if(k===3&&i===2&&n===2)preferred=3;
    const plated=type==='warden'||i>0||k>0&&n<2,hp=type==='warden'?[45,60,72,85,105][i]:plated?10+i*3:6+i;
    const e={id:`${i}:${k}:${n}`,group:k,type,x,y:ground-h-(type==='drone'?125:0),w,h,home:x,groundY:ground,dir:-1,timer:1.1+n*.4,hp,maxHP:hp,weak:type==='warden'?weak[i]:preferred,armor:plated,exposed:0,stun:0,phase:n+k*3,dead:false,state:'wait',cycle:0,shotClock:0,title:type==='warden'?names[i]:''};
    if(type==='turret'&&n===1){e.y=ground-100-h;e.groundY=ground-100;slab(x-100,ground-100,250);}
    enemies.push(e);encounter.guards.push(e.id);
   }
  });
  // A few optional patrols are spaced away from the required formations.
  for(let n=0;n<5;n++){const x=safeEnemyX(850+n*1950);if(x>s.length-1300)continue;const type=n%2?'drone':'walker';enemies.push({id:`ambient-${i}-${n}`,type,x,y:ground-38-(type==='drone'?145:0),w:38,h:38,home:x,groundY:ground,dir:1,timer:2.3,hp:4+i,maxHP:4+i,weak:0,armor:false,exposed:0,stun:0,phase:30+n,dead:false});}
  caches.push({id:'armor',kind:'armor',x:3250,y:ground-245-25,w:18,h:18,life:999,cache:true,base:ground-245-25},{id:'energy',kind:'energy',x:checkpointX(i)+1600,y:ground-245-25,w:18,h:18,life:999,cache:true,base:ground-245-25});
  for(const a of caches)slab(a.x-80,a.base+25,240);
  for(let n=0;n<12;n++)landmarks.push({x:750+n*1050,kind:i,variant:n%3});
  platforms.push({x:0,y:0,w:s.length,h:30,ceiling:true});areas.push({x:ends[i][3]+80,end:s.length,name:'GUARDIAN APPROACH'});
  return{platforms,lifts,hazards,enemies,encounters,landmarks,areas,caches,wind,length:s.length,arena:s.length-960,cp:checkpointX(i)};
 }
 function checkpointX(i){return checkpoints[i];}
 return{build,titles};
})();

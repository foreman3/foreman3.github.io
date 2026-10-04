/* The thirty chamber plans are authored in CHAMBER-REDESIGN.md. */
(() => {
 const world=HollowWorld;
 // width, height, sector far edges, defender armor by sector, obstacle character
 const specs=[
 [7800,700,[3450,6650],['plain','plain'],'street'],
 [9000,800,[2900,5200,7950],['plain','plain','carapace'],'spans'],
 [8400,900,[3000,5500,7650],['plain','carapace','plain'],'flood'],
 [8400,800,[3000,5300,7850],['plain','plain','carapace'],'vault'],
 [6600,800,[2850,4800],['carapace','carapace'],'ribs'],
 [8600,850,[2900,5200,7850],['plain','plain','carapace'],'drain'],
 [7000,850,[4400],['plain'],'garden'],
 [9200,1000,[3100,5550,8150],['plain','plain','carapace'],'canopy'],
 [8200,1100,[2900,5450,7550],['plain','plain','crust'],'nursery'],
 [6200,1900,[2050,3900,5550],['plain','carapace','crust'],'root-shaft'],
 [6900,1000,[3050,5100],['crust','carapace'],'roots'],
 [8600,1200,[3000,5300,7950],['carapace','crust','plain'],'grotto'],
 [7200,1100,[4550],['plain'],'wing-garden'],
 [6000,2300,[2000,3900,5500],['plain','carapace','plain'],'stacks'],
 [9200,1300,[3050,5550,8200],['carapace','plain','crust'],'observatory'],
 [6200,2000,[2050,3950,5650],['plain','carapace','plain'],'well'],
 [7000,1100,[3100,5200],['carapace','crust'],'ray'],
 [8600,1300,[3000,5400,7950],['carapace','plain','phase'],'echo'],
 [7200,1000,[4500],['phase'],'engine-rest'],
 [6200,2200,[2050,4000,5550],['plain','phase','carapace'],'cooling'],
 [9600,1200,[3200,5750,8500],['phase','crust','mixed'],'ash'],
 [9000,1300,[3050,5550,8150],['carapace','phase','crust'],'pistons'],
 [7200,1100,[3300,5550],['phase','crust'],'furnace'],
 [9200,1200,[3100,5650,8350],['carapace','crust','phase'],'sump'],
 [7600,1100,[4700],['mixed'],'heart-rest'],
 [9000,1500,[3050,5500,8150],['carapace','mixed-crust','carapace'],'witness'],
 [6400,2100,[2100,4250,5800],['phase','carapace','crust'],'nerve'],
 [9400,1300,[3200,5800,8650],['phase','crust','mixed'],'vestibule'],
 [7600,1300,[3450,5950],['mixed','crust'],'custodian'],
 [8200,1300,[3100,5650],['plain','mixed'],'console']
 ];
 const titles={plain:'PATROL ARRAY',carapace:'CARAPACE KEEPERS',crust:'MINERAL CRUST',phase:'PHASE DEFENDERS',mixed:'SPLIT SIGNAL', 'mixed-crust':'MINERAL / PHASE'};
 const shaftIds=[9,13,15,19,26];
 const branch={
 0:{2:[5650,0]},1:{4:[7250,0]},2:{17:[6650,0]},3:{5:[7900,0]},5:{3:[2250,0]},6:{9:[5250,0]},7:{10:[7100,0]},8:{11:[7900,0]},9:{10:[5800,1200]},10:{11:[5150,0],12:[6720,290]},11:{8:[2250,0]},12:{13:[4950,300],14:[5700,0]},13:{17:[5800,1400]},14:{16:[9000,0]},15:{17:[4700,700]},17:{2:[8350,0],13:[3000,1100]},18:{20:[5550,0]},19:{21:[6000,1400]},20:{23:[7350,0]},21:{20:[2350,0]},23:{20:[2300,0]},24:{25:[5050,0],26:[6100,0]},25:{29:[8800,0]},26:{28:[6200,1300]},27:{29:[7150,0]},29:{27:[7950,0]}
 };
 const primary={0:1,1:3,2:4,3:5,4:5,5:6,6:7,7:8,8:11,9:10,10:12,11:-1,12:15,13:17,14:16,15:16,16:18,17:2,18:19,19:21,20:21,21:22,22:23,23:24,24:27,25:29,26:28,27:28,28:-1,29:27};
 const relicSpots={3:[6250,140],8:[3750,0],11:[6700,390],13:[3900,1400]};
 const bombColumns={8:[4200,320],9:[4350,600],11:[6550,390],17:[6200,450],25:[6900,650],26:[4850,650]};
 world.rooms.forEach((r,id)=>{const [w,h,ends,armor,style]=specs[id];Object.assign(r,{w,h,kind:shaftIds.includes(id)?'shaft':['drain','nursery'].includes(style)?'tunnel':'hall',spec:{ends,armor,style},arena:r.boss===undefined?null:{x:w-1380,w:1380}});});
 world.chamberSpecs=specs;
 world.build=id=>{
  const r=world.rooms[id],floor=r.h-76,platforms=[{x:0,y:floor,w:r.w,h:180,ground:true}],hazards=[],objects=[],enemies=[],zones=[],waypoints=[];
  const slab=(x,y,w=250,h=24,extras={})=>{const a={x,y,w,h,oneway:true,...extras};platforms.push(a);return a;};
  const plateau=(x,rise,w=250,extras={})=>slab(x,floor-rise,w,24,extras);
  // Route terraces are explicit, with broad landings. The primary shaft route
  // rises across the room; the bottom remains a recoverable alternative.
  const shaft=shaftIds.includes(id),rise=shaft?Math.min(1400,floor-320):0;
  if(shaft){for(let n=0;n<15;n++){const x=300+n*350,high=100+n*(rise/14);plateau(x,high,300);waypoints.push({x:x+150,y:floor-high});}plateau(r.w-620,rise,450);}
  else for(let n=0;n<Math.floor((r.w-700)/650);n++){const x=400+n*650,high=[95,150,210,100][(n+id)%4];plateau(x,high,300);if(high>160)plateau(x-180,95,220);}
  // A safe broken-span route. Shafts keep their lower recovery floor intact.
  const pitRooms=[0,1,2,7,14,20,21,23,27,29];
  if(pitRooms.includes(id)){
   const gaps=id===0?[[4150,130]]:id===1?[[3300,165],[6100,180]]:[[r.w*.36,180],[r.w*.64,190]];
   platforms.shift();let x=0;for(const [start,w] of gaps){platforms.push({x,y:floor,w:start-x,h:180,ground:true});hazards.push({x:start,y:floor+42,w,h:150,pit:true,type:'pit'});plateau(start-90,80,w+180);x=start+w;}platforms.push({x,y:floor,w:r.w-x,h:180,ground:true});
  }
  if(['drain','nursery'].includes(r.spec.style))for(const x of [1150,3400,6100])platforms.push({x,y:floor-165,w:470,h:134,tunnel:true});
  if([7,11,14,21,25,27].includes(id))for(const x of [r.w*.25,r.w*.58])hazards.push({x,y:floor-11,w:120,h:11,type:'spikes'});
  if([20,23,24,26].includes(id))for(const x of [r.w*.28,r.w*.55,r.w*.78]){hazards.push({x,y:floor-20,w:260,h:20,type:'heat'});plateau(x-70,110,400);plateau(x-230,65,210);}
  if([13,19,26].includes(id))for(let n=0;n<3;n++){const x=1700+n*1300,high=shaft?Math.min(rise,300+n*400):220;plateau(x,high,220);platforms[platforms.length-1].moving=true;platforms[platforms.length-1].base=floor-high;platforms[platforms.length-1].phase=id*.9+n;}
  const supportY=x=>{if(!shaft)return floor;const n=Math.max(0,Math.min(14,Math.round((x-450)/350)));return floor-(100+n*rise/14);};
  r.spec.ends.forEach((end,k)=>{
   const start=end-(r.hub?1450:1600),armor=r.spec.armor[k],z={id:`${id}:sector:${k}`,x:end,y:0,w:22,h:floor,from:start,title:titles[armor],armor,guards:[]};zones.push(z);
   const count=r.hub?2:3;
   for(let n=0;n<count;n++){
    let x=start+250+n*400;for(const a of platforms)if(a.tunnel&&x>a.x-100&&x<a.x+a.w+100)x=a.x+a.w+150;const ground=supportY(x),type=['sentry','moth','leaper','crawler'][(n+k+id)%4];
    let shell=n===count-1?'plain':armor;if(shell==='mixed')shell=n===0?'phase':'carapace';if(shell==='mixed-crust')shell=n===0?'crust':'phase';
    const hp=(r.region?28+r.region*8:24)+(shell==='plain'?0:10),e={id:`${z.id}:${n}`,zone:z.id,type:shell==='crust'&&type==='moth'?'sentry':type,armor:shell,x,y:ground-(type==='moth'?150:38),home:x,groundY:ground,w:shell==='plain'?38:46,h:shell==='plain'?38:46,hp,maxHP:hp,vx:0,vy:0,dir:-1,timer:1.4+n*.65,frozen:0,dead:false,phase:n,exposed:0,hint:0};
    if(e.type!=='moth')e.y=ground-e.h;enemies.push(e);z.guards.push(e.id);
    if(shaft)plateau(x-130,floor-ground,300);
   }
   // Ground relay and a shelf relay for shafts: both are safe and useful.
   objects.push({type:'relay',id:`relay-${id}-${k}`,x:end+95,y:floor-55,w:36,h:55});
   if(shaft){const high=Math.max(100,Math.min(rise, floor-supportY(end)));plateau(end+50,high,250);objects.push({type:'relay',id:`relay-high-${id}-${k}`,x:end+120,y:floor-high-55,w:36,h:55});}
  });
  // Ambient pairs between sectors make terrain matter after a sector is open.
  if(!r.hub)for(let n=0;n<2;n++){const x=900+n*(r.w*.49),ground=supportY(x);enemies.push({id:`ambient-${id}-${n}`,type:n?'moth':'crawler',armor:'plain',x,y:ground-(n?170:38),home:x,groundY:ground,w:38,h:38,hp:20+r.region*4,maxHP:20+r.region*4,vx:0,vy:0,dir:1,timer:2+n,frozen:0,dead:false,phase:n});}
  let westIndex=0;
  const portals=r.portals.map(e=>{
   let x=e.to===primary[id]?r.w-150:120+westIndex++*165,height=0;
   if(branch[id]?.[e.to]) [x,height]=branch[id][e.to];
   if(e.high)height=Math.max(height,290);
   if(shaft&&e.to===primary[id])height=Math.max(height,rise);
   const h=e.req==='fold'?58:84,y=floor-height-h;
   if(height){plateau(x-100,height,250);for(let step=1;step<=Math.ceil(height/115);step++){const xx=Math.max(170,x-180-step*125),hh=Math.max(0,height-step*115);if(hh>0)plateau(xx,hh,220);}}
   return{...e,x,y,w:52,h,side:x<200?'left':height?'up':x>r.w-300?'right':e.side};
  });
  if(r.hub)objects.push({type:'pod',id:`pod-${id}`,x:155,y:floor-66,w:50,h:66});
  if(id===0)objects.push({type:'ship',id:'ship',x:300,y:floor-94,w:110,h:94});
  if(r.relic){const [x,height]=relicSpots[id];if(height)plateau(x-70,height,260);objects.push({type:'power',id:r.relic,power:r.relic,x,y:floor-height-35,w:30,h:30});}
  if(bombColumns[id]){const [x,height]=bombColumns[id];plateau(x-85,height,240,{bombPerch:true});objects.push({type:'sign',id:`bomb-sign-${id}`,x:x-90,y:floor-48,w:60,h:48,text:id===8?'FOLD + HOLD FIRE / BLAST ASCENT':'BLAST COLUMN / KEEP ABOVE YOUR MINES'});if(id===8){for(let n=0;n<4;n++)plateau(x+280+n*100,80+n*80,240);}}
  if(id===11){for(let n=0;n<5;n++)plateau(5950+n*140,80+n*80,250);}
  if(r.tank){const x=id===9?4350:id===25?6900:r.w-1200,height=id===9?600:id===25?650:shaft?rise:220;plateau(x-85,height,260);if(![9,25].includes(id))for(let n=1;n<=Math.ceil(height/120);n++){const h=height-n*110;if(h>0)plateau(x-n*145-130,h,250);}objects.push({type:'tank',id:`tank-${id}`,x,y:floor-height-33,w:26,h:30});}
  if(r.witness!==undefined){const x=id===25?6900:r.w*.59,height=id===25?650:shaft?Math.min(rise,700):110;plateau(x-90,height,260);objects.push({type:'record',id:`record-${r.witness}`,record:r.witness,x,y:floor-height-53,w:30,h:53});}
  if(id===29){plateau(6550,100,550);objects.push({type:'console',id:'console',x:6800,y:floor-190,w:64,h:90});}
  if(r.arena){objects.push({type:'relay',id:`arena-relay-${id}`,x:r.arena.x+70,y:floor-55,w:36,h:55});}
  // Keep checkpoint interactions distinct from nearby branch entrances.
  for(const o of objects)if(o.type==='relay')for(const e of portals)if(Math.abs(o.x-e.x)<140&&Math.abs(o.y+o.h-e.y-e.h)<60)o.x=Math.min(r.w-100,e.x+180);
  platforms.push({x:0,y:0,w:r.w,h:30,ceiling:true});
  return{...r,floor,platforms,hazards,objects,portals,enemies,zones,waypoints,bombColumn:bombColumns[id]};
 };
})();

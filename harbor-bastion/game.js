(() => {
  'use strict';
  const R=window.HarborRules,A=window.HarborArt,$=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
  const params=new URLSearchParams(location.search),testing=params.has('test'),saveKey='harbor-bastion-campaign-v3',introKey='harbor-bastion-instructions-v3';
  const names=['Bare Headland','First Ramparts','The Battery','Iron on the Tide','A Greater Keep','Heavy Sails','The Watchful Magician','Crossing Currents','A Captain’s Command','The Broadside','The Workshop','The Gathering Armada','The Last Siege'];
  const speeds=[0,22,32,40,48,55,60,66,70,76,82,89,96],counts=[3,6,8,10,12,14,16,18,20,22,24,27,30];
  const profiles=names.map((name,i)=>({name,ships:counts[i],speed:speeds[i],interval:[4,3,2.4,1.8,1.6,1.45,1.3,1.2,1.1,1,.95,.85,.75][i],first:[7,6,4.8,3.8,3.4,3.2,3,2.8,2.7,2.6,2.5,2.4,2.3][i],fire:[9,8,7,5.5,5,4.8,4.5,4.3,4.1,3.9,3.7,3.5,3.3][i],shellSpeed:145+i*8,time:60+i*3}));
  const s={level:1,phase:'battle',mode:'intro',supplies:16,score:0,walls:new Set(),rubble:new Set(),buildings:[],hand:[0,1,2],deck:3,patches:3,tool:'wall',slot:0,rotation:0,cursor:{x:2,y:6},aim:{x:760,y:300},muted:false,ships:[],shots:[],shells:[],fx:[]};
  let checkpoint=null,history=[],manual=false,held=new Set(),pointerFire=false,keyFire=false,last=0,acc=0,dirty=true,fortDirty=true,hudWait=0,inputWait=0,toastTime=0,fireGap=0,exposedUntil=0,previousMode='playing',audio=null;
  const fort=document.createElement('canvas');fort.width=1000;fort.height=640;const fc=fort.getContext('2d');
  const keep=()=>s.buildings.find(b=>b.type==='keep'),alive=type=>s.buildings.find(b=>b.type===type&&b.hp>0);
  const center=b=>({x:(b.x+b.w/2)*R.C,y:(b.y+b.h/2)*R.C});
  const touch=()=>document.body.classList.contains('touch-device'),portrait=()=>touch()&&matchMedia('(orientation:portrait)').matches;
  const active=()=>s.mode==='playing'&&!portrait(),cfg=()=>profiles[s.level-1];
  const resetInput=()=>{held.clear();pointerFire=false;keyFire=false;inputWait=0;};
  function text(id,value){const node=$(id),v=String(value);if(node.textContent!==v)node.textContent=v;}
  function tone(f,d=.09){if(!audio||s.muted)return;const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
  function unlockAudio(){try{audio ||=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){}}
  function message(value,time=3){text('toast',value);toastTime=time;dirty=true;}
  function changed(){fortDirty=true;dirty=true;exposedUntil=0;sync();}
  function closeModals(){for(const id of ['plans-modal','result-modal'])$(id).classList.remove('is-visible');}
  function persist(phase=s.phase){if(testing)return;try{localStorage.setItem(saveKey,JSON.stringify({version:3,phase,castle:R.snapshot(s),checkpoint}));}catch(_){}}
  function fresh(){
    closeModals();R.restore(s,{level:1,supplies:16,score:0,walls:[],rubble:[],buildings:[{id:0,type:'keep',x:3,y:6,w:2,h:2,hp:10,maxHp:10,cooldown:0}],hand:[0,1,2],deck:3,patches:3});
    checkpoint=R.snapshot(s);history=[];s.tool='wall';s.slot=0;s.rotation=0;s.cursor={x:2,y:6};startBattle();message('Bare keep · hold on the sea to fire. Red shells can be shot down.',5);
  }
  function prepare(nextLevel){
    closeModals();resetInput();s.level=nextLevel;s.phase='build';s.mode='playing';s.time=0;s.elapsed=0;s.ships=[];s.shots=[];s.shells=[];s.fx=[];s.patches=3+(alive('workshop')?3:0);s.tool='wall';s.rotation=0;s.slot=0;
    history=[];checkpoint=R.snapshot(s);changed();persist();
    const unlock=Object.values(R.upgrades).find(u=>u.level===nextLevel);
    message(unlock?'NEW PLAN: '+unlock.name+' · open PLANS':cfg().name+' · repair or expand your surviving castle.',5);
  }
  function startBattle(){
    closeModals();resetInput();s.phase='battle';s.mode='playing';s.time=cfg().time;s.elapsed=0;s.spawnTime=0;s.spawned=0;s.kills=0;s.shotsFired=0;s.misses=0;s.keepHits=0;s.mageBlocks=0;s.captainShots=0;s.playerBlocks=0;
    s.ships=[];s.shots=[];s.shells=[];s.fx=[];fireGap=0;hudWait=0;
    for(const b of s.buildings)b.cooldown=0;
    changed();persist('battle');
  }
  function launch(){
    if(!active()||s.phase!=='build')return;
    if(!R.enclosure(s).sealed&&performance.now()>exposedUntil){exposedUntil=performance.now()+5000;message('KEEP EXPOSED · close the walls, or press BATTLE again to risk it.',5);return;}
    startBattle();message(cfg().name+' · protect the castle you built.',3);
  }
  function retry(){
    const gated=s.mode==='intro'||s.mode==='help';
    if(!checkpoint)return;
    closeModals();R.restore(s,checkpoint);history=[];s.mode='playing';s.tool='wall';s.slot=0;s.rotation=0;
    if(s.level===1)startBattle();else{s.phase='build';s.time=0;s.elapsed=0;s.ships=[];s.shots=[];s.shells=[];s.fx=[];changed();persist();}
    resetInput();if(gated){s.mode='intro';$('instruction-modal').classList.add('is-visible');}message('Level checkpoint restored. Earlier campaign progress is safe.',3);
  }
  function remember(){history.push(R.snapshot(s));if(history.length>120)history.shift();}
  function select(tool,slot=0){s.tool=tool;s.slot=slot;s.rotation=0;dirty=true;sync();if($('plans-modal').classList.contains('is-visible'))closePlans();}
  function place(){
    if(!active()||s.phase!=='build')return false;
    const p=R.placement(s);if(!p.ok){message(p.reason,3);tone(140);return false;}
    remember();s.supplies-=p.cost;
    if(s.tool==='repair'){const b=R.buildingAt(s,s.cursor.x,s.cursor.y);b.hp++;message((b.type==='keep'?'KEEP':R.upgrades[b.type].name)+' repaired: '+b.hp+'/'+b.maxHp,2);}
    else if(s.tool==='salvage'){
      const n=R.id(s.cursor.x,s.cursor.y),b=R.buildingAt(s,s.cursor.x,s.cursor.y);
      if(s.walls.has(n)){s.walls.delete(n);s.rubble.delete(n);s.supplies++;}
      else if(b){s.buildings=s.buildings.filter(v=>v!==b);s.supplies+=Math.floor(R.upgrades[b.type].cost/3);}
      message('Salvaged. Close the new perimeter before adding buildings.',2);
    }else if(R.upgrades[s.tool]){
      const u=R.upgrades[s.tool];
      if(s.tool==='keep'){const b=keep();b.x=s.cursor.x;b.y=s.cursor.y;b.w=3;b.h=3;b.maxHp=16;message('Keep expanded. Existing health stays '+b.hp+'; repair it to fill the new capacity.',4);}
      else{s.buildings.push({id:Math.max(...s.buildings.map(b=>b.id))+1,type:s.tool,x:s.cursor.x,y:s.cursor.y,w:u.w,h:u.h,hp:u.hp,maxHp:u.hp,cooldown:0});if(s.tool==='workshop')s.patches+=3;message(u.name+' built. '+u.description,4);}
    }else{
      for(const [x,y]of p.points){const n=R.id(x,y);s.walls.add(n);s.rubble.delete(n);}
      if(s.tool==='patch')s.patches--;else{s.hand[s.slot]=s.deck++%4;s.rotation=0;}
      message(R.enclosure(s).sealed?'KEEP PROTECTED · enclosed empty land can hold upgrades.':'Wall fitted. Continue the enclosure.',2);
    }
    tone(430);changed();persist();return true;
  }
  function undo(){if(!active()||s.phase!=='build'||!history.length)return;R.restore(s,history.pop());changed();persist();message('Construction undone. Supplies returned.',1.5);}
  function exchange(){if(s.mode!=='plans'||s.supplies<2)return;remember();s.supplies-=2;s.hand[s.slot]=s.deck++%4;s.rotation=0;changed();persist();populatePlans();}
  function rotate(){if(!active()||s.phase!=='build'||s.tool!=='wall')return;s.rotation=(s.rotation+1)%4;dirty=true;tone(260,.03);}
  function pieceIcon(index){return '<span class="piece-icon" aria-hidden="true">'+R.pieces[index].map(([x,y])=>'<i style="grid-column:'+(x+1)+';grid-row:'+(y+1)+'"></i>').join('')+'</span>';}
  function populatePlans(){
    text('plan-summary','Level '+s.level+' · '+s.supplies+' supplies · '+s.patches+' patch stones · '+R.enclosure(s).free+' protected empty squares');
    text('plan-detail','Stones cost 2 supplies each; repairs cost 2 per health. Salvage returns 1 per stone. Out of patches? Salvage a neighboring stone to reshape the gap, then fit a complete piece.');
    $('wall-choices').innerHTML=s.hand.map((p,i)=>'<button type="button" data-slot="'+i+'" class="'+(s.tool==='wall'&&s.slot===i?'selected':'')+'">'+pieceIcon(p)+(i+1)+' · '+R.pieceNames[p]+'<span>'+R.pieces[p].length*2+' supplies · rotate with X</span></button>').join('');
    $('wall-choices').querySelectorAll('button').forEach(b=>b.onclick=()=>select('wall',Number(b.dataset.slot)));
    $('upgrade-choices').innerHTML=Object.entries(R.upgrades).map(([type,u])=>{
      const count=s.buildings.filter(b=>b.type===type).length,maxed=type==='keep'?keep().w===3:count>=u.cap,locked=s.level<u.level;
      return '<button type="button" data-upgrade="'+type+'" '+(locked||maxed?'disabled':'')+'>'+u.name+' · '+u.cost+'<span>'+(locked?'Unlocks at '+u.level:maxed?'Built · repair or salvage on the board':u.w+' × '+u.h+' · '+u.description)+'</span></button>';
    }).join('');
    $('upgrade-choices').querySelectorAll('button').forEach(b=>b.onclick=()=>select(b.dataset.upgrade));
    $('exchange').disabled=s.supplies<2;
  }
  function openPlans(){if(!active()||s.phase!=='build')return;resetInput();s.mode='plans';populatePlans();$('plans-modal').classList.add('is-visible');$('plans-close').focus();}
  function closePlans(){s.mode='playing';$('plans-modal').classList.remove('is-visible');canvas.focus({preventScroll:true});sync();dirty=true;}
  function guns(){
    const gunBuildings=s.buildings.filter(b=>b.hp>0&&(b.type==='keep'||b.type==='tower')),captain=alive('captain'),assigned=captain?(gunBuildings.find(b=>b.type==='tower')||gunBuildings[0]):null;
    return gunBuildings.map(b=>({...center(b),b,auto:b===assigned}));
  }
  function shoot(g,aim,automatic=false){
    const dx=aim.x-g.x,dy=aim.y-g.y,distance=Math.max(1,Math.hypot(dx,dy));
    s.shots.push({x:g.x,y:g.y,sx:g.x,sy:g.y,tx:aim.x,ty:aim.y,t:0,duration:distance/620,automatic,targetId:aim.targetId});
    g.b.cooldown=automatic?1.25:(alive('workshop')?.8:1);s.shotsFired++;if(automatic)s.captainShots++;
    burst(g.x+15,g.y,'#ffe5af',3);tone(110,.07);dirty=true;
  }
  function fire(){if(!active()||s.phase!=='battle'||fireGap>0)return false;const g=guns().filter(g=>!g.auto&&g.b.cooldown<=0)[0];if(!g)return false;shoot(g,s.aim);fireGap=.14;return true;}
  function spawn(){
    const id=s.spawned++,type=s.level>=6&&id%5===4?'galleon':s.level>=4&&id%3===2?'armor':s.level>=8&&id%4===1?'cutter':'sloop';
    const baseX=680+(id%3)*115,y=90+(id*137%450);
    s.ships.push({id,type,baseX,x:baseX,y,dir:id%2?1:-1,hp:type==='galleon'?3:type==='armor'?2:1,speed:cfg().speed*(type==='cutter'?1.25:type==='galleon'?.8:1),fire:cfg().first+(id%3)*.25,vx:0});
  }
  function enemyFire(ship){
    const targets=s.buildings.filter(b=>b.hp>0&&b.type==='tower'),target=ship.type==='armor'&&targets.length?targets[ship.id%targets.length]:keep(),end=center(target);
    for(let n=0;n<(ship.type==='galleon'?2:1);n++){
      const d=Math.hypot(end.x-ship.x,end.y-ship.y),speed=cfg().shellSpeed;
      s.shells.push({x:ship.x,y:ship.y,tx:end.x,ty:end.y,vx:(end.x-ship.x)/d*speed,vy:(end.y-ship.y)/d*speed,delay:n*.6});
    }
    tone(180,.04);
  }
  function burst(x,y,color,count=9){for(let i=0;i<count&&s.fx.length<90;i++)s.fx.push({kind:'particle',x,y,vx:Math.cos(i*2.4)*(20+i%3*20),vy:Math.sin(i*2.4)*55,life:.6,max:.6,color});}
  function label(x,y,value,color='#ffe0ad'){s.fx.push({kind:'label',x,y,value,color,life:1.5,max:1.5});}
  function hitAt(x,y){
    const a=Math.floor(x/R.C),b=Math.floor(y/R.C);if(a<0||a>=R.COLS||b<0||b>=R.ROWS)return null;
    const n=R.id(a,b);if(s.walls.has(n))return{wall:n};
    const building=R.buildingAt(s,a,b);return building&&building.hp>0?{building}:null;
  }
  function impact(hit,x,y){
    if(hit.wall!==undefined){s.walls.delete(hit.wall);s.rubble.add(hit.wall);label(x,y,'BREACH');message('WALL BREACHED · shells can travel through the opening.',2);}
    else{
      const b=hit.building;b.hp--;
      if(b.type==='keep'){s.keepHits++;label(x,y,'KEEP −1','#ff997e');message('KEEP HIT · '+b.hp+'/'+b.maxHp+' health. Retry restores this level’s checkpoint.',3);tone(70,.16);}
      else{label(x,y,(b.hp<=0?'DISABLED: ':'HIT: ')+R.upgrades[b.type].name);message(b.hp<=0?R.upgrades[b.type].name+' disabled. Repair it between battles.':R.upgrades[b.type].name+' hit · '+b.hp+'/'+b.maxHp,2);}
    }
    burst(x,y,'#eaa078',12);fortDirty=true;dirty=true;
    if(keep().hp<=0)finish(false,'The keep took its final visible hit. Retry this level to revise your castle and defenses.');
  }
  function moveShell(q,dt){
    if(q.delay>0){q.delay-=dt;return false;}
    const steps=Math.max(1,Math.ceil(Math.hypot(q.vx,q.vy)*dt/4));
    for(let i=0;i<steps;i++){q.x+=q.vx*dt/steps;q.y+=q.vy*dt/steps;const hit=hitAt(q.x,q.y);if(hit){impact(hit,q.x,q.y);return true;}}
    return q.x<-10||q.x>1010||q.y<-10||q.y>650;
  }
  function finish(win,reason,restored=false){
    if(s.mode!=='playing')return;resetInput();s.mode=win?'won':'lost';
    const reward=win?26+cfg().ships*2+(keep().hp>=keep().maxHp*.7?6:0):0;
    if(win&&!restored){s.supplies+=reward;s.score+=s.kills*100+Math.ceil(s.time)*10;persist('won');}
    text('result-title',win?(s.level===13?'Your bastion endures.':'Siege survived.'):'The keep has fallen.');
    text('result-text',reason||(cfg().name+' · '+s.kills+' ships sunk · '+keep().hp+'/'+keep().maxHp+' keep health. '+reward+' supplies earned. Your damaged castle carries forward.'));
    $('next').hidden=!win||s.level===13;$('retry').hidden=win;$('result-modal').classList.add('is-visible');
    (win&&s.level<13?$('next'):win?$('again'):$('retry')).focus();tone(win?750:130,.25);sync();dirty=true;
  }
  function tick(dt){
    if(!active())return;
    if(toastTime>0){toastTime-=dt;if(toastTime<=0)text('toast','');}
    if(held.size){inputWait-=dt;if(inputWait<=0){inputWait=s.phase==='build'?.13:1/60;const dx=(held.has('ArrowRight')||held.has('d')?1:0)-(held.has('ArrowLeft')||held.has('a')?1:0),dy=(held.has('ArrowDown')||held.has('s')?1:0)-(held.has('ArrowUp')||held.has('w')?1:0);move(dx,dy,s.phase==='build'?1:7);}}
    if(s.phase==='build'){hudWait-=dt;if(hudWait<=0){sync();hudWait=.12;}return;}
    s.time-=dt;s.elapsed+=dt;fireGap=Math.max(0,fireGap-dt);
    if(s.time<=0&&s.kills<cfg().ships){finish(false,'Battle time expired with '+(cfg().ships-s.kills)+' raiders afloat. Your castle can be redesigned at the level checkpoint.');return;}
    for(const b of s.buildings)b.cooldown=Math.max(0,(b.cooldown||0)-dt);
    if(pointerFire||keyFire)fire();
    s.spawnTime-=dt;if(s.spawned<cfg().ships&&s.spawnTime<=0){spawn();s.spawnTime=cfg().interval;}
    for(const ship of s.ships){
      const oldX=ship.x;ship.y+=ship.dir*ship.speed*dt;if(ship.y>555){ship.y=555;ship.dir=-1;}if(ship.y<85){ship.y=85;ship.dir=1;}
      if(s.level>=12)ship.x=ship.baseX+Math.sin(s.elapsed*.65+ship.id)*20;ship.vx=(ship.x-oldX)/dt;
      ship.fire-=dt;if(ship.fire<=0){enemyFire(ship);ship.fire=cfg().fire;}
    }
    const auto=guns().find(g=>g.auto&&g.b.cooldown<=0);
    if(auto&&s.ships.length){
      const target=[...s.ships].sort((a,b)=>a.fire-b.fire)[0],travel=Math.hypot(target.x-auto.x,target.y-auto.y)/620;
      let y=target.y+target.dir*target.speed*travel*.88;if(y>555)y=1110-y;if(y<85)y=170-y;
      shoot(auto,{x:target.x,y:y+Math.sin(s.elapsed*1.3)*9,targetId:target.id},true);
    }
    const mage=alive('mage');
    if(mage&&mage.cooldown<=0){const c=center(mage),q=s.shells.filter(q=>q.delay<=0&&Math.hypot(q.x-c.x,q.y-c.y)<=190).sort((a,b)=>a.x-b.x)[0];
      if(q){s.shells.splice(s.shells.indexOf(q),1);mage.cooldown=5;s.mageBlocks++;s.fx.push({kind:'beam',x:c.x,y:c.y,tx:q.x,ty:q.y,color:'#b2dfd9',life:.35,max:.35});burst(q.x,q.y,'#beeedb',7);tone(700,.08);}}
    for(let i=s.shots.length-1;i>=0;i--){
      const shot=s.shots[i];shot.t+=dt;const a=Math.min(1,shot.t/shot.duration);shot.x=shot.sx+(shot.tx-shot.sx)*a;shot.y=shot.sy+(shot.ty-shot.sy)*a;
      if(a<1)continue;let hit=false;
      for(let j=s.ships.length-1;j>=0;j--){const ship=s.ships[j];if(Math.hypot((shot.tx-ship.x)*1.1,shot.ty-ship.y)<(ship.type==='galleon'?48:38)){ship.hp--;hit=true;burst(ship.x,ship.y,'#ffe1a5');if(ship.hp<=0){s.ships.splice(j,1);s.kills++;s.score+=100;tone(510,.08);}break;}}
      for(let j=s.shells.length-1;j>=0;j--){const q=s.shells[j];if(q.delay<=0&&Math.hypot(shot.tx-q.x,shot.ty-q.y)<55){s.shells.splice(j,1);s.playerBlocks++;hit=true;burst(q.x,q.y,'#ffc2a0',6);}}
      if(!hit){s.misses++;burst(shot.tx,shot.ty,'#b5ddd2',4);}s.shots.splice(i,1);
    }
    for(let i=s.shells.length-1;i>=0;i--){if(moveShell(s.shells[i],dt))s.shells.splice(i,1);if(s.mode!=='playing')return;}
    // Finish incoming fire before handing the castle to its next construction phase.
    if(s.kills===cfg().ships&&!s.shells.length){finish(true);return;}
    for(let i=s.fx.length-1;i>=0;i--){const f=s.fx[i];f.life-=dt;if(f.kind==='particle'){f.x+=f.vx*dt;f.y+=f.vy*dt;}if(f.life<=0)s.fx.splice(i,1);}
    hudWait-=dt;if(hudWait<=0){sync();hudWait=.1;}dirty=true;
  }
  function sync(){
    text('level',s.level+' / 13');text('phase',s.phase==='build'?'BUILD':(s.kills||0)+' / '+cfg().ships+' SUNK');text('clock',s.phase==='build'?'UNTIMED':Math.max(0,Math.ceil(s.time))+'s');
    text('health',keep().hp+' / '+keep().maxHp);text('supplies',s.supplies);$('health').classList.toggle('danger',keep().hp<=3);$('clock').classList.toggle('danger',s.phase==='battle'&&s.time<12);
    const build=s.phase==='build';for(const id of ['place','rotate','plans','undo','launch'])$(id).hidden=!build;
    $('undo').disabled=!history.length;$('rotate').disabled=s.tool!=='wall';
    text('order',build?toolName()+' · '+(s.tool==='wall'?R.pieces[s.hand[s.slot]].length*2+' supplies':s.tool==='patch'?s.patches+' left':'select a footprint'):'Aim ahead. Shoot red shells to protect your castle.');
    $('hand').hidden=!build;const handKey=s.hand.join(',')+':'+s.slot+':'+s.tool;
    if($('hand').dataset.key!==handKey){$('hand').dataset.key=handKey;$('hand').innerHTML=s.hand.map((p,i)=>'<button type="button" data-slot="'+i+'" class="'+(s.tool==='wall'&&s.slot===i?'selected':'')+'">'+pieceIcon(p)+(i+1)+' '+R.pieceNames[p]+'</button>').join('');$('hand').querySelectorAll('button').forEach(b=>b.onclick=()=>select('wall',Number(b.dataset.slot)));}
    if(build){const e=R.enclosure(s);text('status',toolName()+' · '+(e.sealed?'KEEP PROTECTED':'KEEP EXPOSED')+' · '+e.free+' empty squares · '+s.patches+' patches');}
    else{const g=guns(),mage=alive('mage');text('status',g.filter(v=>!v.auto).length+' manual gun'+(g.filter(v=>!v.auto).length===1?'':'s')+(alive('captain')?' · CAPTAIN ACTIVE':'')+(mage?' · MAGICIAN '+(mage.cooldown>0?mage.cooldown.toFixed(1)+'s':'READY'):'')+(alive('workshop')?' · WORKSHOP ACTIVE':''));}
    text('pause',s.mode==='paused'?'Resume':'Pause');
  }
  function toolName(){return s.tool==='wall'?R.pieceNames[s.hand[s.slot]]:s.tool==='patch'?'Patch stone':s.tool==='repair'?'Repair building':s.tool==='salvage'?'Salvage':R.upgrades[s.tool].name;}
  function draw(){
    ctx.clearRect(0,0,1000,640);ctx.drawImage(A.background,0,0);
    if(fortDirty){fc.clearRect(0,0,1000,640);if(s.phase==='build'){const e=R.enclosure(s);fc.fillStyle='#fff0b130';for(const n of e.protectedCells){const [x,y]=R.xy(n);fc.fillRect(x*R.C,y*R.C,R.C,R.C);}}
      for(const n of s.rubble){const [x,y]=R.xy(n);A.rubble(fc,x,y);}for(const n of s.walls){const [x,y]=R.xy(n);A.stone(fc,x,y);}for(const b of s.buildings)A.building(fc,b);fortDirty=false;}
    ctx.drawImage(fort,0,0);
    if(s.phase==='build'){const p=R.placement(s);ctx.fillStyle=p.ok?'#fff0ab70':'#c2584d70';ctx.strokeStyle=p.ok?'#fff6b5':'#ffad94';ctx.lineWidth=2;for(const [x,y]of p.points){ctx.fillRect(x*R.C+2,y*R.C+2,R.C-4,R.C-4);ctx.strokeRect(x*R.C+2,y*R.C+2,R.C-4,R.C-4);}if(s.tool==='mage'){const c={x:(s.cursor.x+1)*R.C,y:(s.cursor.y+1)*R.C};ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(c.x,c.y,190,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}}
    for(const g of guns()){A.cannon(ctx,g.x,g.y,Math.atan2(s.aim.y-g.y,s.aim.x-g.x),g.b.cooldown<=0,g.auto);if(g.auto){ctx.fillStyle='#ffdeb2';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('CAPTAIN',g.x,g.y+29);ctx.textAlign='left';}}
    const mage=alive('mage');if(mage&&s.phase==='battle'){const c=center(mage);ctx.strokeStyle='#b2e9dc60';ctx.lineWidth=2;ctx.beginPath();ctx.arc(c.x,c.y,190,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#f4e5bd';ctx.beginPath();ctx.arc(c.x,c.y-18,16,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-mage.cooldown/5));ctx.stroke();}
    for(const ship of s.ships){A.ship(ctx,ship,s.elapsed);if(ship.fire<1){ctx.strokeStyle='#ffbd78';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ship.x,ship.y,49,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-ship.fire));ctx.stroke();}}
    for(const q of s.shells){if(q.delay>0)continue;ctx.strokeStyle='#f9ae8050';ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.tx,q.ty);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ff805c';ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#692d26';ctx.lineWidth=2;ctx.stroke();}
    for(const q of s.shots){ctx.fillStyle=q.automatic?'#d9e8cf':'#fff4cc';ctx.beginPath();ctx.arc(q.x,q.y-Math.sin(q.t/q.duration*Math.PI)*18,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#1b3a3e';ctx.stroke();}
    if(s.phase==='battle'){ctx.strokeStyle='#fff0b2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.aim.x,s.aim.y,15,0,Math.PI*2);ctx.moveTo(s.aim.x-23,s.aim.y);ctx.lineTo(s.aim.x+23,s.aim.y);ctx.moveTo(s.aim.x,s.aim.y-23);ctx.lineTo(s.aim.x,s.aim.y+23);ctx.stroke();}
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;for(const f of s.fx){ctx.globalAlpha=Math.min(1,Math.max(0,f.life/f.max));ctx.fillStyle=f.color;if(f.kind==='label'){ctx.font='bold 15px system-ui';ctx.fillText(f.value,f.x-25,f.y-20);}else if(f.kind==='beam'){ctx.strokeStyle=f.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.tx,f.ty);ctx.stroke();}else if(!reduced)ctx.fillRect(f.x,f.y,4,4);}ctx.globalAlpha=1;
    if(s.mode==='paused'){ctx.fillStyle='#123e45aa';ctx.fillRect(0,0,1000,640);ctx.fillStyle='#fff1cb';ctx.font='bold 40px Georgia';ctx.textAlign='center';ctx.fillText('Command paused',500,320);ctx.textAlign='left';}
    dirty=false;
  }
  function move(dx,dy,amount){if(!active())return;if(s.phase==='build'){s.cursor.x=Math.max(1,Math.min(13,s.cursor.x+dx*amount));s.cursor.y=Math.max(1,Math.min(14,s.cursor.y+dy*amount));}else{s.aim.x=Math.max(15,Math.min(985,s.aim.x+dx*amount));s.aim.y=Math.max(20,Math.min(620,s.aim.y+dy*amount));}dirty=true;}
  function locate(e){const b=canvas.getBoundingClientRect(),x=(e.clientX-b.x)/b.width*1000,y=(e.clientY-b.y)/b.height*640;if(s.phase==='build')s.cursor={x:Math.max(1,Math.min(13,Math.floor(x/R.C))),y:Math.max(1,Math.min(14,Math.floor(y/R.C)))};else s.aim={x:Math.max(15,Math.min(985,x)),y:Math.max(20,Math.min(620,y))};dirty=true;}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(!active())return;unlockAudio();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);locate(e);if(s.phase==='build'){if(e.pointerType==='mouse')place();}else{pointerFire=true;fire();}});
  canvas.addEventListener('pointermove',e=>{if(active()&&(e.pointerType==='mouse'||canvas.hasPointerCapture(e.pointerId)))locate(e);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{pointerFire=false;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  function pause(){if(s.mode==='playing'){s.mode='paused';resetInput();}else if(s.mode==='paused')s.mode='playing';dirty=true;sync();}
  function help(){if(s.mode==='intro')return;previousMode=s.mode;resetInput();s.mode='help';$('instruction-modal').classList.add('is-visible');$('instruction-close').textContent='RETURN TO COMMAND';$('instruction-close').focus();dirty=true;}
  function closeInstructions(){unlockAudio();$('instruction-modal').classList.remove('is-visible');try{sessionStorage.setItem(introKey,'seen');}catch(_){}s.mode=previousMode;canvas.focus({preventScroll:true});sync();dirty=true;}
  function sound(){s.muted=!s.muted;unlockAudio();text('sound',s.muted?'Sound off':'Sound on');$('sound').setAttribute('aria-pressed',String(!s.muted));}
  window.addEventListener('keydown',e=>{
    const k=e.key.length===1?e.key.toLowerCase():e.key,modal=document.querySelector('.modal.is-visible');
    if(modal){if(k==='Escape'){if(s.mode==='plans')closePlans();else if(s.mode==='help')closeInstructions();}if(k==='Tab'){const buttons=[...modal.querySelectorAll('button:not([hidden]):not(:disabled)')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}return;}
    if(e.target.closest('button')&&(k===' '||k==='Enter'))return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','w','a','s','d','x','b','z','r','p','m','1','2','3','4'].includes(k))e.preventDefault();
    if(k==='r'){retry();return;}if(k==='p'){pause();return;}if(k==='m'){sound();return;}if(!active())return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'].includes(k)){if(!held.has(k)){move(k==='ArrowRight'||k==='d'?1:k==='ArrowLeft'||k==='a'?-1:0,k==='ArrowDown'||k==='s'?1:k==='ArrowUp'||k==='w'?-1:0,s.phase==='build'?1:14);inputWait=.18;}held.add(k);}
    if(k===' '){if(s.phase==='build'){if(!e.repeat)place();}else{keyFire=true;fire();}}
    if(s.phase==='build'&&!e.repeat){if(k==='x')rotate();if(k==='b')openPlans();if(k==='z')undo();if(['1','2','3'].includes(k))select('wall',Number(k)-1);if(k==='4')select('patch');}
  });
  window.addEventListener('keyup',e=>{held.delete(e.key.length===1?e.key.toLowerCase():e.key);if(e.key===' ')keyFire=false;});
  window.addEventListener('blur',()=>{resetInput();if(s.mode==='playing')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();if(s.mode==='playing')pause();}});
  window.addEventListener('vibecade:reset-input',resetInput);
  window.addEventListener('vibecade:restart',e=>{e.preventDefault();retry();});
  function fit(){const scale=touch()?1:2;canvas.width=1000*scale;canvas.height=640*scale;ctx.setTransform(scale,0,0,scale,0,0);dirty=true;}
  window.addEventListener('resize',()=>{resetInput();fit();});
  $('sound').onclick=sound;$('pause').onclick=pause;$('help-button').onclick=help;$('instruction-close').onclick=closeInstructions;$('restart-button').onclick=retry;$('place').onclick=place;$('rotate').onclick=rotate;$('plans').onclick=openPlans;$('plans-close').onclick=closePlans;$('undo').onclick=undo;$('launch').onclick=launch;$('exchange').onclick=exchange;
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>select(b.dataset.tool));
  $('next').onclick=()=>prepare(s.level+1);$('retry').onclick=retry;$('again').onclick=()=>{fresh();persist();canvas.focus({preventScroll:true});};
  let loaded=false;
  if(!testing){try{
    const saved=JSON.parse(localStorage.getItem(saveKey)||'null');
    if(saved&&saved.version===3&&Number.isInteger(saved.castle.level)&&saved.castle.level>=1&&saved.castle.level<=13&&saved.castle.buildings.some(b=>b.type==='keep'&&b.hp>0)&&saved.castle.walls.every(n=>Number.isInteger(n)&&n>=0&&n<240)&&saved.castle.supplies>=0&&saved.castle.hand.length===3&&saved.castle.hand.every(n=>Number.isInteger(n)&&n>=0&&n<4)){
      R.restore(s,saved.castle);checkpoint=saved.checkpoint;loaded=true;
      if(saved.phase==='won'&&s.level<13)prepare(s.level+1);
      else if(saved.phase==='won'){s.mode='playing';s.kills=cfg().ships;s.time=0;finish(true,'The thirteen-siege campaign is complete. Your victorious castle is saved.',true);}
      else if(saved.phase==='battle')startBattle();
      else{s.phase='build';s.mode='playing';s.time=0;s.elapsed=0;changed();}
    }
  }catch(_){loaded=false;}}
  if(!loaded)fresh();
  let seen=false;try{seen=sessionStorage.getItem(introKey)==='seen';}catch(_){}
  if(!seen){previousMode=s.mode;s.mode='intro';$('instruction-close').textContent=loaded?'CONTINUE YOUR CASTLE':'TAKE COMMAND';$('instruction-close').focus();}else $('instruction-modal').classList.remove('is-visible');
  if(testing)window.__harborTest={state:s,rules:R,profiles,fresh,prepare,launch,startBattle,place,undo,exchange,rotate,select,fire,guns,center,hitAt,impact,moveShell,finish,retry,checkpoint:()=>checkpoint,manual(v){manual=v;},render(){changed();draw();},save:persist,inputs:()=>({pointerFire,keyFire,held:[...held]}),setCursor(x,y){s.cursor={x,y};dirty=true;},aim(x,y){s.aim={x,y};},tick};
  function animate(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;if(!manual&&active()){acc=Math.min(.1,acc+dt);while(acc>=1/60){tick(1/60);acc-=1/60;}}else acc=0;if(dirty)draw();requestAnimationFrame(animate);}
  fit();sync();requestAnimationFrame(animate);
})();

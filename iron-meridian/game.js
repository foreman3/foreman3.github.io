(() => {
'use strict';
const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const W=960,H=540,GROUND=444,STEP=1/60,SAVE='iron-meridian-v1';
const renderScale=matchMedia('(max-width:900px)').matches?1:2;canvas.width=W*renderScale;canvas.height=H*renderScale;
const artwork=window.createIronArtwork(ctx,renderScale),routeArt=window.createIronRouteArtwork(ctx),artView={};
const stages=[
 {name:'COPPER HARBOR',boss:'BRASS CRAB',power:'TIDAL DISC',color:'#7de6dd',sky:['#243c59','#de927a'],dark:'#243746',light:'#628592',length:12000,hp:120,weak:3,description:'Cargo lanes · charge at open vents',hint:'Jump the rushes, duck high shots, and dodge the marked dives.'},
 {name:'TEMPEST SPIRE',boss:'VOLT KESTREL',power:'ARC LANCE',color:'#e9dd7a',sky:['#182541','#677da0'],dark:'#24364e',light:'#668399',length:13200,hp:200,weak:1,description:'Storm lifts · Tidal Disc recommended',hint:'Watch the targeting line. Keep moving when it flashes.'},
 {name:'GLASS GARDEN',boss:'THORN MANTIS',power:'THORN FAN',color:'#98dd8a',sky:['#233e4a','#a1bea3'],dark:'#274745',light:'#628f74',length:14000,hp:240,weak:2,description:'Canopy laboratories · Arc Lance recommended',hint:'Jump the ground charge. Shoot during its recovery.'},
 {name:'FROST FOUNDRY',boss:'RIME WARDEN',power:'FROST SHARD',color:'#a3d9ff',sky:['#1c304c','#849eb2'],dark:'#304359',light:'#6c96ab',length:14800,hp:280,weak:3,description:'Ice conveyors · Thorn Fan recommended',hint:'The icicles mark their landing spots before they fall.'},
 {name:'THE MERIDIAN',boss:'SOVEREIGN ZERO',power:'MERIDIAN CORE',color:'#ffac92',sky:['#251b35','#b36865'],dark:'#3f334d',light:'#8e7285',length:15600,hp:400,weak:4,description:'Mixed plating · Frost for the reactor',hint:'Read the cycle: volley, dive, then reactor burst.'}
];
// Small local portraits reuse the same guardian artwork shown in combat.
const guardianPortraits=stages.map((s,stage)=>{const c=document.createElement('canvas');c.width=240;c.height=195;const g=c.getContext('2d');g.scale(1.5,1.5);const art=window.createIronArtwork(g,1);art.boss({x:41,y:18,hp:1,phase:'wait',inv:0},{stage,s,camera:0,t:.1});return c.toDataURL();});
const weapons=[{name:'BUSTER',color:'#94ffe2',cost:0},{name:'TIDAL DISC',color:'#7de6dd',cost:8},{name:'ARC LANCE',color:'#ffec8a',cost:11},{name:'THORN FAN',color:'#a6ed89',cost:13},{name:'FROST SHARD',color:'#b2eaff',cost:10},{name:'NOVA CORE',color:'#ffac92',cost:28}];
let cleared=[],best=0;try{const s=JSON.parse(localStorage.getItem(SAVE)||'{}');cleared=Array.isArray(s.cleared)?s.cleared.filter(n=>Number.isInteger(n)&&n>=0&&n<5):[];best=Number(s.best)||0;}catch{}
let stage=0,world,player,camera=0,t=0,score=0,lives=3,weapon=0,energy=100,mode='instructions',checkpoint=90,boss=null,bossActive=false,shake=0,flash=0,announcement='',announceTime=0,combo=0,comboTimer=0,hasMission=false,manual=false;
let bullets=[],enemies=[],particles=[],pickups=[],trails=[];let keys=new Set(),held={fire:false,jump:false,dash:false,crouch:false},joy=0,joyY=0,previous={fire:false,jump:false,dash:false},charge=0,jumpBuffer=0,coyote=0,dashCooldown=0,fireCooldown=0;
let firingStarted=null,fireRelease=null,fireReleaseAim=null,crabFight=null,guardianFight=null,clearedEncounters=new Set(),collectedCaches=new Set();
let audio=null,muted=false,musicClock=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function save(){try{localStorage.setItem(SAVE,JSON.stringify({cleared,best:Math.max(best,score)}));}catch{}}
function sound(freq=440,duration=.08,type='square',volume=.045){if(muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.65),audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
function activateAudio(){if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)audio=new A();}audio?.resume();}
function clearInput(resetJoystick=true){keys.clear();joy=joyY=0;if(player){player.aim=false;player.aimX=player.dir;player.aimY=0;}Object.keys(held).forEach(k=>held[k]=false);document.querySelectorAll('[data-action].pressed').forEach(b=>b.classList.remove('pressed'));previous={fire:false,jump:false,dash:false};firingStarted=null;fireRelease=null;fireReleaseAim=null;charge=0;jumpBuffer=0;if(resetJoystick)window.dispatchEvent(new Event('vibecade:reset-input'));}
function announce(text,duration=2.6){announcement=text;announceTime=duration;}
function burst(x,y,color,n=16){for(let i=0;i<n&&particles.length<220;i++)particles.push({x,y,vx:Math.cos(i*2.4)* (50+i*7),vy:Math.sin(i*2.4)*(55+i*5),life:.35+(i%5)*.09,color,size:2+i%3});}
function buildWorld(i){return IronStages.build(i,stages[i],GROUND);}
function createEnemies(){return world.enemies.map(e=>({...e})).filter(e=>e.group===undefined||!clearedEncounters.has(e.group));}
function spawn(x=checkpoint){player={x,y:GROUND-46,w:26,h:44,vx:0,vy:0,dir:1,hp:28,inv:1.5,ground:false,wall:0,dash:0,airDash:false,lock:0,safeX:x,safeY:GROUND-44,crouch:false,aim:false,aimX:1,aimY:0};charge=0;coyote=0;dashCooldown=0;fireCooldown=0;energy=100;bullets=[];trails=[];}
function startStage(i){hasMission=true;clearInput();stage=i;world=buildWorld(i);checkpoint=90;clearedEncounters=new Set();collectedCaches=new Set();spawn(90);enemies=createEnemies();pickups=world.caches.map(a=>({...a}));particles=[];camera=0;t=0;combo=0;boss=null;bossActive=false;lives=3;mode='play';weapon=0;document.querySelectorAll('.modal').forEach(m=>m.classList.remove('is-visible'));announce(`SECTOR ${i+1} / ${stages[i].name}`,3);canvas.focus({preventScroll:true});}
function unlocked(w){return w===0||cleared.includes(w-1);}
function cycleWeapon(){for(let n=1;n<=weapons.length;n++){const w=(weapon+n)%weapons.length;if(unlocked(w)){weapon=w;charge=0;if(firingStarted!==null)firingStarted=t;sound(650,.06);announce(weapons[w].name,1.2);return;}}}
function showMap(){clearInput();mode='map';const list=document.getElementById('sector-list');list.replaceChildren();stages.forEach((s,i)=>{const b=document.createElement('button');b.className='sector';b.style.setProperty('--sector',s.color);b.disabled=i===4&&![0,1,2,3].every(v=>cleared.includes(v));b.innerHTML=`<span class="sector-portrait"><img src="${guardianPortraits[i]}" alt=""><span class="number">0${i+1}</span></span><span><b>${s.name}</b><small>${s.description}</small></span><span class="state">${cleared.includes(i)?'CLEARED ✓':b.disabled?'4 CORES NEEDED':s.boss}</span>`;b.onclick=()=>{activateAudio();startStage(i);};list.append(b);});document.getElementById('resume-button').disabled=!hasMission||Boolean(boss&&boss.hp<=0);document.getElementById('sector-modal').classList.add('is-visible');list.querySelector('button:not(:disabled)')?.focus();}
function result(victory){clearInput();mode='result';const s=stages[stage];document.getElementById('result-tag').textContent=victory?'GUARDIAN CORE RECOVERED':'SIGNAL LOST / CHECKPOINT RETAINED';document.getElementById('result-title').textContent=victory?(stage===4?'The city wakes again.':s.power+' ACQUIRED'):'Reboot your armor';document.getElementById('result-copy').textContent=victory?(stage===4?`All five guardians restored. Score ${score.toLocaleString()}. Return to any sector with your full arsenal.`:`${stage===0?'A piercing disc that cuts through enemies.':stage===1?'A fast lance that arcs through armor.':stage===2?'A three-way spread that controls the air.':'A heavy shard that slows enemies.'} Your arsenal is saved. ${stage===0?'Try it against Volt Kestrel.':stage===1?'Thorn Mantis is vulnerable to electricity.':stage===2?'The fan shreds Brass Crab and Rime Warden.':'Sovereign Zero’s reactor is vulnerable to frost.'}`):'Continue with three fresh attempts and full health. Your checkpoint and collected weapon cores stay with you.';document.getElementById('result-button').textContent=victory?'MISSION CONTROL →':'CONTINUE AT CHECKPOINT →';document.getElementById('result-button').onclick=()=>{document.getElementById('result-modal').classList.remove('is-visible');if(victory)showMap();else{lives=3;respawn();mode='play';canvas.focus();}};document.getElementById('result-modal').classList.add('is-visible');document.getElementById('result-button').focus();}
function respawn(){clearInput();spawn();enemies=createEnemies().filter(e=>e.x>checkpoint-100);pickups=world.caches.filter(a=>!collectedCaches.has(a.id)).map(a=>({...a}));boss=null;bossActive=false;camera=clamp(checkpoint-180,0,world.length-W);announce('ARMOR REBOOTED / MIDWAY PROGRESS RETAINED',2);}
function hurt(amount,knock=0){if(player.inv>0||mode!=='play')return;player.hp-=amount;player.inv=1.15;player.vx=knock*190;player.vy=-210;player.lock=.18;combo=0;shake=reduced?0:8;flash=.12;sound(100,.18,'sawtooth');burst(player.x+13,player.y+22,'#ffd19e',10);if(player.hp<=0){lives--;burst(player.x,player.y,'#94ffe2',35);if(lives<=0)result(false);else respawn();}}
function movementAxis(){return keys.has('ArrowLeft')||keys.has('KeyA')?-1:keys.has('ArrowRight')||keys.has('KeyD')?1:joy;}
function shotDirection(){const up=joyY<-.35||keys.has('ArrowUp')||keys.has('KeyW'),axis=movementAxis();return up?Math.abs(axis)>.12?{dx:Math.sign(axis)*Math.SQRT1_2,dy:-Math.SQRT1_2}:{dx:0,dy:-1}:{dx:player.dir,dy:0};}
function fire(charged=false,direction=shotDirection()){
 if(fireCooldown>0)return;const w=weapons[weapon];if(weapon&&energy<w.cost*(charged?.75:1)){fireCooldown=.3;announce('ENERGY RECHARGING / Q FOR BUSTER',.6);return;}energy-=w.cost*(charged?.75:1);
 const {dx,dy}=direction,aim=dy<0,speed=weapon===2?960:650,drawW=weapon===5?42:charged?28:weapon===1?22:14,drawH=weapon===5?36:charged?22:weapon===1?22:8;
 const width=Math.abs(dx)*drawW+Math.abs(dy)*drawH,height=Math.abs(dy)*drawW+Math.abs(dx)*drawH;
 const x=aim?player.x+13+player.dir*9+dx*22-width/2:player.x+13+player.dir*21,y=aim?player.y+(player.crouch?9:18)+dy*22-height/2:player.y+(player.crouch?9:18);
 const damage=weapon===5?9:weapon===4&&charged?7:charged?5:weapon?3:1;
 const base={x,y,vx:dx*speed,vy:dy*speed,w:width,h:height,drawW,drawH,life:1.5,damage,weapon,owner:'player',color:w.color,pierce:weapon===1||weapon===2||weapon===5,hits:[],charged};
 if(weapon===3){for(const spread of [-190,0,190])bullets.push({...base,vx:dx*speed-dy*spread,vy:dy*speed+dx*spread,hits:[]});}else bullets.push(base);
 fireCooldown=charged?.28:weapon?.3:.16;shake=charged&&!reduced?3:shake;sound(charged?160:weapon===2?850:500,charged?.2:.065,weapon===2?'sawtooth':'square');burst(x+width/2,y+height/2,w.color,charged?10:3);
}
// Fire is resolved on release, so a tap between simulation frames is still a shot.
function beginFire(){if(mode!=='play'||firingStarted!==null)return;firingStarted=t;fireRelease=null;fireReleaseAim=null;charge=0;}
function endFire(cancel=false){if(firingStarted===null)return;if(!cancel){fireRelease=Math.max(charge,t-firingStarted);fireReleaseAim=shotDirection();if(fireReleaseAim.dy===0)fireReleaseAim=null;}firingStarted=null;charge=0;}
function stance(p,crouch){const h=crouch?26:44;if(p.h===h){p.crouch=crouch;return true;}const candidate={x:p.x,y:p.y+p.h-h,w:p.w,h};if(!crouch&&world.platforms.some(a=>!a.oneway&&overlap(candidate,a)))return false;p.y=candidate.y;p.h=h;p.crouch=crouch;return true;}
function enemyShot(x,y,vx,vy,color='#ffac92',size=12){bullets.push({x,y,vx,vy,w:size,h:size,life:5,damage:stage<2?2:3,owner:'enemy',color});}
function makeBoss(){const s=stages[stage];boss={x:world.length-200,y:GROUND-100,w:78,h:100,hp:s.hp,max:s.hp,phase:'wait',timer:1.1,cycle:0,seed:(Math.random()*0x100000000)>>>0,deck:[],pattern:-1,vx:0,vy:0,inv:0,target:0,slow:0};const hooks={stage,ground:GROUND,arena:world.arena,right:world.length,shot:enemyShot,damage:hurt,announce,burst,sound,color:s.color};if(stage===0)crabFight=window.createCrabFight(hooks);else guardianFight=window.createIronGuardianFight(hooks);bossActive=true;bullets=[];announce(`${s.boss} / ${s.hint}`,4);sound(100,.3,'sawtooth');}
function updateBoss(dt){if(!boss||boss.hp<=0)return;(stage===0?crabFight:guardianFight).update(boss,player,dt,t);}
function damageEnemy(e,b){
 const matched=e.weak>0&&b.weapon===e.weak,vent=e.exposed>0;let factor=1;
 if(e.armor)factor=matched?2.4:vent?(b.charged?1.4:1):b.charged?.35:.15;
 e.hp-=b.damage*factor;if(matched){e.stun=Math.max(e.stun,.28);e.exposed=Math.max(e.exposed,.55);if(b.weapon===4)e.stun=1.0;}
 burst(e.x+e.w*.5,e.y+e.h*.5,factor<.4?'#a0b4c7':b.color,7);
 if(factor<.4&&!e.hint){e.hint=3;announce(`PLATED / ${e.weak?weapons[e.weak].name+' OR ':''}CHARGE AT OPEN VENT`,2);}
 if(e.hp<=0){e.dead=true;combo++;comboTimer=3;score+=e.type==='warden'?750:100+Math.min(combo,10)*20;burst(e.x+e.w*.5,e.y+e.h*.5,stages[stage].color,22);sound(130,.13,'sawtooth');
  if(e.group!==undefined&&!enemies.some(a=>a.group===e.group&&!a.dead)){clearedEncounters.add(e.group);const z=world.encounters[e.group];z.open=true;announce(z.midpoint?'MIDPOINT SENTINEL DOWN / CHECKPOINT AHEAD':'FORMATION CLEARED / FIELD RELEASED',2.6);}
 }
}
function updateWarden(e,dt){
 e.timer-=dt;if(e.state==='wait'){if(e.timer<=0){e.state='tell';e.timer=.85;e.mark=player.x;e.pattern=e.cycle%3;announce(e.title+' / '+['DUCK HIGH, JUMP LOW','LEAVE THE MARK','DODGE THE FAN'][e.pattern],2);}}
 else if(e.state==='tell'){if(e.timer<=0){e.state='attack';e.timer=2.3;e.elapsed=0;e.origin=e.x;e.target=clamp(e.mark,e.home-260,e.home+120);e.shotClock=.1;e.cycle++;}}
 else if(e.state==='attack'){
  e.elapsed+=dt;const u=Math.min(1,e.elapsed/2.3);if(e.pattern===1){e.x=e.origin+(e.target-e.origin)*u;e.y=GROUND-e.h-Math.sin(u*Math.PI)*130;}else if(e.pattern===0){e.x=e.home+Math.sin(u*Math.PI*2)*190;}
  e.shotClock-=dt;if(e.shotClock<=0){e.shotClock=e.pattern===2?.95:.8;const dir=player.x<e.x?-1:1;if(e.pattern===0)enemyShot(e.x+39,GROUND-(u<.55?44:17),dir*255,0,stages[stage].color,13);else if(e.pattern===2)for(const v of [-75,0,75])enemyShot(e.x+39,e.y+55,dir*240,v,stages[stage].color,12);}
  if(e.timer<=0){e.state='vent';e.timer=1.4;e.exposed=1.4;e.y=GROUND-e.h;}
 }else{e.exposed=e.timer;e.x+=clamp(e.home-e.x,-180*dt,180*dt);if(e.timer<=0){e.state='wait';e.timer=.6;e.y=GROUND-e.h;}}
}
function update(dt){if(mode!=='play')return;t+=dt;musicClock+=dt;announceTime=Math.max(0,announceTime-dt);shake=Math.max(0,shake-dt*30);flash=Math.max(0,flash-dt);comboTimer-=dt;if(comboTimer<=0)combo=0;
 if(musicClock>.22){musicClock=0;const notes=[110,165,220,165,130.81,196,261.63,196];sound(notes[Math.floor(t/.22)%8]* (stage%2?1.12:1),.1,'triangle',.018);}
 const p=player;p.inv=Math.max(0,p.inv-dt);p.lock=Math.max(0,p.lock-dt);dashCooldown=Math.max(0,dashCooldown-dt);fireCooldown=Math.max(0,fireCooldown-dt);energy=Math.min(100,energy+dt*5);
 const input={jump:held.jump||keys.has('Space')||keys.has('KeyZ'),fire:held.fire||keys.has('KeyX')||keys.has('KeyJ'),crouch:held.crouch||joyY>.35||keys.has('ArrowDown')||keys.has('KeyS'),dash:held.dash||keys.has('ShiftLeft')||keys.has('ShiftRight')||keys.has('KeyC')||keys.has('KeyK')};
 stance(p,input.crouch&&p.ground&&!input.jump&&p.dash<=0);
 const axis=movementAxis(),aim=shotDirection();p.aim=aim.dy<0;p.aimX=aim.dx;p.aimY=aim.dy;
 if(input.jump&&!previous.jump)jumpBuffer=.12;else jumpBuffer=Math.max(0,jumpBuffer-dt);if(p.ground)coyote=.11;else coyote=Math.max(0,coyote-dt);
 if(jumpBuffer>0&&(coyote>0||p.wall)){p.vy=-575;p.ground=false;coyote=0;jumpBuffer=0;if(p.wall){p.vx=-p.wall*320;p.dir=-p.wall;p.lock=.17;}sound(320,.085);burst(p.x+13,p.y+44,'#b0d5d7',6);}
 if(!input.jump&&previous.jump&&p.vy<-190)p.vy=-190;
 if(input.dash&&!previous.dash&&dashCooldown<=0&&(p.ground||!p.airDash)){p.dash=.19;p.inv=Math.max(p.inv,.14);dashCooldown=.52;if(!p.ground)p.airDash=true;p.vy=0;sound(190,.12,'sawtooth');}
 if(p.dash>0){p.dash-=dt;p.vx=p.dir*660;p.vy=0;trails.push({x:p.x,y:p.y,dir:p.dir,life:.16});}else{if(p.lock<=0){const target=axis*(p.crouch?90:255);const traction=stage===3&&p.ground?6:p.ground?22:12;p.vx+=(target-p.vx)*Math.min(1,dt*traction);if(Math.abs(axis)>.12)p.dir=axis>0?1:-1;}p.vy=Math.min(740,p.vy+1450*dt);if(p.wall&&p.vy>0&&axis*p.wall>0)p.vy=Math.min(p.vy,100);}
 const fields=world.encounters.filter(e=>!e.open),platforms=[...world.platforms,...world.lifts,...fields];world.lifts.forEach(l=>{const old=l.y;l.y=l.base+Math.sin(t*1.6+l.phase)*38;if(p.ground&&p.x+p.w>l.x&&p.x<l.x+l.w&&Math.abs(p.y+p.h-old)<3)p.y+=l.y-old;});
 const belt=p.ground&&!bossActive?world.platforms.find(a=>a.conveyor&&Math.abs(p.y+p.h-a.y)<2&&p.x+p.w>a.x&&p.x<a.x+a.w):null,motionX=p.vx+(belt?.conveyor||0);
 p.x+=motionX*dt;p.wall=0;for(const a of [...world.platforms,...fields]){if(a.oneway||!overlap(p,a))continue;if(motionX>0){p.x=a.x-p.w;p.wall=1;}else if(motionX<0){p.x=a.x+a.w;p.wall=-1;}p.vx=0;}
 const oldBottom=p.y+p.h;p.y+=p.vy*dt;p.ground=false;for(const a of platforms){if(!overlap(p,a))continue;if(p.vy>=0&&oldBottom<=a.y+8){p.y=a.y-p.h;p.vy=0;p.ground=true;p.airDash=false;}else if(!a.oneway&&p.vy<0){p.y=a.y+a.h;p.vy=0;}}
 p.x=clamp(p.x,bossActive?world.arena+20:0,world.length-p.w-20);
 if(p.ground&&!world.hazards.some(h=>p.x+p.w>h.x-20&&p.x<h.x+h.w+20)){p.safeX=p.x;p.safeY=p.y+p.h-44;}
 if(p.y>H+70){p.inv=0;hurt(5);if(player!==p)return;if(mode==='play'){p.x=p.safeX;stance(p,false);p.y=p.safeY;p.vx=0;p.vy=0;p.inv=1.5;announce('FALL RECOVERY / −5 ARMOR',1.8);}}
 for(const h of world.hazards){const phase=h.period?(t+h.phase)%h.period:0;h.warning=Boolean(h.period&&phase>h.period-1.5);h.active=!h.period||phase>h.period-.42;if(!h.pit&&h.active&&overlap(p,h))hurt(4,p.dir*-1);}
 if(p.wall&&!world.wallHint){world.wallHint=true;announce('WALL CLIMB / RELEASE AND PRESS JUMP AGAIN',3);}if(!bossActive&&p.x>=world.cp&&checkpoint<world.cp&&clearedEncounters.has(2)){checkpoint=world.cp;p.hp=28;energy=100;score+=250;announce('CHECKPOINT / ARMOR RESTORED');sound(740,.2,'triangle');burst(p.x,p.y,'#94ffe2',24);}
 if(!bossActive&&p.x>world.arena+70)makeBoss();
 if(input.fire){if(firingStarted===null)beginFire();const oldCharge=charge;charge=Math.min(1.3,charge+dt);if(oldCharge<.65&&charge>=.65)sound(720,.08,'triangle');}else if(fireRelease!==null&&fireCooldown<=0){fire(fireRelease>=.65,fireReleaseAim||shotDirection());fireRelease=null;fireReleaseAim=null;}previous=input;
 for(const e of enemies){if(e.dead||Math.abs(e.x-p.x)>1100||bossActive)continue;e.exposed=Math.max(0,e.exposed-dt);e.stun=Math.max(0,e.stun-dt);e.hint=Math.max(0,(e.hint||0)-dt);if(e.stun>0)continue;const difficulty=1+stage*.1;
 if(e.type==='warden')updateWarden(e,dt);else{e.timer-=dt;
 if(e.type==='walker'){const nx=e.x+e.dir*(45+stage*8)*dt;if(world.hazards.some(h=>h.pit&&nx+e.w>h.x&&nx<h.x+h.w))e.dir*=-1;else e.x=nx;if(Math.abs(e.x-e.home)>100)e.dir*=-1;}
 if(e.type==='drone'){e.y=e.groundY-165+Math.sin(t*2+e.phase)*55;e.x=e.home+Math.sin(t*.7+e.phase)*80;}
 if(e.timer<=0&&Math.abs(e.x-p.x)<740){e.timer=(e.type==='turret'?2.4:3.0)/difficulty;e.exposed=1.1;const dx=p.x-e.x,dy=p.y+15-e.y,len=Math.max(1,Math.hypot(dx,dy)),speed=180+stage*13;enemyShot(e.x+15,e.y+12,dx/len*speed,dy/len*speed);if(stage>=3&&e.type==='turret')enemyShot(e.x+15,e.y+12,dx/len*speed,dy/len*speed-55);}
 }
 if(overlap(p,{x:e.x+4,y:e.y+4,w:e.w-8,h:e.h-8}))hurt(e.type==='warden'?4:3,p.x<e.x?-1:1);
 }
 updateBoss(dt);
 for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.owner==='player'){if(b.weapon===4){for(const a of bullets)if(a.owner==='enemy'&&a.life>0&&overlap(a,b)){a.life=0;burst(a.x,a.y,'#c4edff',6);if(!b.charged)b.life=0;}}for(const e of enemies){if(e.dead||b.hits.includes(e)||!overlap(b,e))continue;damageEnemy(e,b);b.hits.push(e);if(!b.pierce)b.life=0;if(b.life<=0)break;}
 if(boss&&boss.hp>0&&boss.inv<=0&&overlap(b,boss)){boss.hp-=b.damage*(b.weapon===stages[stage].weak?(stage===4?3.2:2.4):stage===0?1:b.weapon===0?(b.charged?1:.5):.45);boss.inv=.075;if(b.weapon===4&&!(boss.slowCooldown>0)){boss.slow=1.1;boss.slowCooldown=3;}b.life=0;burst(b.x,b.y,b.color,9);sound(160,.06);if(boss.hp<=0){score+=1500+player.hp*50;if(!cleared.includes(stage))cleared.push(stage);save();burst(boss.x+40,boss.y+45,stages[stage].color,60);shake=reduced?0:15;announce('GUARDIAN DEFEATED');mode='clear';setTimeout(()=>{if(mode==='clear')result(true);},1600);}}}else if(overlap(b,{x:p.x+3,y:p.y+4,w:p.w-6,h:p.h-6})){hurt(b.damage,b.vx>0?1:-1);b.life=0;}}
 bullets=bullets.filter(b=>b.life>0&&b.x>camera-500&&b.x<camera+W+600&&b.y<600);
 pickups.forEach(a=>{a.y=a.base+Math.sin(t*3+a.x)*3;if(overlap(p,a)){if(a.kind==='armor')p.hp=Math.min(28,p.hp+5);else energy=Math.min(100,energy+25);collectedCaches.add(a.id);score+=200;a.life=0;sound(900,.1,'triangle');announce(a.kind==='armor'?'OPTIONAL RESERVE / ARMOR +5':'OPTIONAL CAPACITOR / ENERGY +25',1.5);}});pickups=pickups.filter(a=>a.life>0);
 if(!bossActive)for(const gust of world.wind)if(p.x>gust.x&&p.x<gust.x+gust.w)p.vx+=gust.force*dt;
 const desired=bossActive?world.length-W:clamp(p.x-W*.34+p.vx*.15,0,world.length-W);camera+=(desired-camera)*Math.min(1,dt*6);
}
function updateEffects(dt){particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=320*dt;});particles=particles.filter(p=>p.life>0);trails.forEach(a=>a.life-=dt);trails=trails.filter(a=>a.life>0);}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function line(x,y,xx,yy,c,width=1){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}
function text(s,x,y,size=12,color='#e7f4f5',align='left'){ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,Math.round(x),Math.round(y));ctx.textAlign='left';}
function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
// Illustrated artwork is cached and rendered independently of simulation.
function backdrop(){artwork.backdrop(artView);}
function scenery(){routeArt.scenery(world,artView);}
function platform(a){artwork.platform(a,artView);}
function hero(x,y,dir=1,alpha=1){artwork.hero(x,y,dir,alpha,artView);}
function enemyArt(e){if(e.type==='warden')artwork.boss(e,artView);else artwork.enemy(e,artView);routeArt.enemy(e,artView);}
function bossArt(){artwork.boss(boss,artView);}
function hud(){rect(0,0,W,67,'#071624ee');rect(0,66,W,1,stages[stage].color+'77');text('IM / ARMOR',22,21,11,'#9fbac6');for(let n=0;n<28;n++)rect(22+n*6,29,4,16,n<player.hp?weapons[weapon].color:'#263a48');text(`${player.hp}/28`,200,42,12);text('ENERGY',268,21,11,'#9fbac6');rect(268,31,108,10,'#293b4d');rect(268,31,energy*1.08,10,'#e9cc87');text(`0${stage+1} / ${stages[stage].name}`,W/2+25,24,13,stages[stage].color,'center');text(weapons[weapon].name,W/2+25,46,11,'#e7f1f2','center');text(String(score).padStart(7,'0'),W-24,24,19,'#ffdc96','right');text(`ATTEMPTS ${lives}   CORES ${cleared.length}/5`,W-24,47,11,'#b4cbd1','right');if(boss&&boss.hp>0){rect(234,78,492,34,'#081522df');text(stages[stage].boss,480,92,11,stages[stage].color,'center');rect(244,99,472,5,'#3c3547');rect(244,99,472*boss.hp/boss.max,5,stages[stage].color);}else{const fraction=player.x/world.length;rect(22,76,140,3,'#142a3b');rect(22,76,fraction*140,3,stages[stage].color);text('GUARDIAN →',172,81,9,'#c2d1da');}if(combo>1&&comboTimer>0)text(`CHAIN ×${combo}`,24,112,14,'#ffda90');
 if(announceTime>0){ctx.globalAlpha=Math.min(1,announceTime*2);rect(100,478,760,36,'#071421df');text(announcement,480,501,announcement.length>62?11:14,'#e6fff2','center');ctx.globalAlpha=1;}else if(t<14){text('MOVE ← →   JUMP SPACE   FIRE X   DASH SHIFT',480,511,12,'#e1ede7','center');}}
function mobileHud(){
 const s=stages[stage];rect(0,0,W,67,'#071624');rect(0,66,W,1,s.color);
 text(`ARMOR ${player.hp}/28`,22,22,18,'#e7f6ef');for(let n=0;n<28;n++)rect(22+n*7,32,5,18,n<player.hp?weapons[weapon].color:'#263a48');
 text(`0${stage+1} / ${s.name}`,480,23,18,s.color,'center');text(weapons[weapon].name,480,50,18,weapons[weapon].color,'center');
 text(`×${lives}  ${String(score).padStart(6,'0')}`,W-22,24,20,'#ffdc96','right');text('ENERGY',W-210,50,15,'#b4cbd1');rect(W-138,37,115,13,'#293b4d');rect(W-138,37,energy*1.15,13,'#e9cc87');
 if(boss&&boss.hp>0){rect(208,74,544,51,'#081522');text(s.boss,480,96,20,s.color,'center');rect(223,106,514,9,'#3c3547');rect(223,106,514*boss.hp/boss.max,9,s.color);}
 if(announceTime>0){rect(75,477,810,50,'#071421ee');const words=announcement.split(' / ');if(announcement.length>45&&words.length>1){text(words[0],480,498,18,'#e6fff2','center');text(words.slice(1).join(' / '),480,519,15,'#e6fff2','center');}else text(announcement,480,508,announcement.length>48?15:19,'#e6fff2','center');}
}
function attackWarnings(){
 if(!boss||boss.phase!=='tell')return;const s=stages[stage],b=boss,next=(b.cycle+1)%3;
 if(stage===0){const w=crabFight.warnings(b);text(w.name,b.x-camera+39,b.y-40,15,'#fff1b7','center');if(w.mark!==null){line(w.mark+39-camera,132,w.mark+39-camera,GROUND,'#ffe2a577',2);text('▼',w.mark+39-camera,GROUND-12,20,'#ffe2a5','center');}return;}
 const info=guardianFight.warnings(b);text(info.name,b.x-camera+39,b.y-40,14,'#fff1b7','center');for(const x of info.marks){line(x-camera,134,x-camera,GROUND,'#ffdf9977',2);rect(x-camera-11,GROUND-5,38,5,'#ffe0a3');text('▼',x-camera+8,GROUND-16,18,'#ffe1a5','center');}
}
function draw(){ctx.setTransform(renderScale,0,0,renderScale,0,0);ctx.imageSmoothingEnabled=true;ctx.lineJoin='round';Object.assign(artView,{stage,s:stages[stage],camera,t,reduced,player,weapon:weapons[weapon],charge});ctx.save();if(shake&&!reduced)ctx.translate(Math.sin(t*61)*shake*.4,Math.cos(t*53)*shake*.3);backdrop();scenery();
 for(const a of world.platforms)platform(a);for(const a of world.lifts)platform(a);
 for(const h of world.hazards)if(!routeArt.hazard(h,artView))artwork.hazards(h,artView);
 for(const z of world.encounters)routeArt.field(z,artView);
 artwork.checkpoint(world.cp-camera,GROUND,checkpoint>=world.cp);artwork.gate(world.arena-camera,GROUND,bossActive,stages[stage].color);
 pickups.forEach(a=>artwork.pickup(a,artView));enemies.filter(e=>!e.dead&&e.x-camera>-70&&e.x-camera<W+70&&!bossActive).forEach(enemyArt);bossArt();
 attackWarnings();
 trails.forEach(a=>hero(a.x-camera,a.y,a.dir,a.life*2));if(!(player.inv>0&&Math.floor(t*18)%2))hero(player.x-camera,player.y,player.dir);
 for(const b of bullets)artwork.projectile(b,artView);
 const active=world.encounters.find(z=>!z.open&&player.x>z.from-200&&player.x<z.x+40);if(active&&!bossActive){const survivors=enemies.filter(e=>!e.dead&&e.group===active.id);rect(228,82,505,45,'#071a2cdf');text(active.title+' / '+survivors.length+(survivors.length===1?' DEFENDER':' DEFENDERS'),480,100,document.body.classList.contains('touch-device')?18:13,'#ffe2a3','center');text(active.midpoint?'MIDPOINT SENTINEL / STRIKE THE VENT':'WEAPON MATCH · CHARGE AT VENTS · CLEAR THE FIELD',480,118,document.body.classList.contains('touch-device')?15:10,'#b9e1e8','center');}
 particles.forEach(p=>artwork.particle(p,camera));ctx.globalAlpha=1;ctx.restore();hud();if(document.body.classList.contains('touch-device'))mobileHud();if(flash>0)rect(0,67,W,H-67,'#ffbe8a22');
}
function help(){if(mode==='instructions')return;clearInput();mode='instructions';document.getElementById('instruction-modal').classList.add('is-visible');document.getElementById('instruction-close').textContent=hasMission?'RESUME MISSION →':'ENTER THE MERIDIAN →';document.getElementById('instruction-close').focus();}
document.getElementById('instruction-close').onclick=()=>{activateAudio();try{sessionStorage.setItem('iron-meridian-instructions','seen');}catch{}document.getElementById('instruction-modal').classList.remove('is-visible');if(!hasMission)showMap();else{mode='play';canvas.focus();}};
document.getElementById('help-button').onclick=help;document.getElementById('map-button').onclick=showMap;document.getElementById('sound-button').onclick=()=>{muted=!muted;document.getElementById('sound-button').textContent=muted?'SOUND OFF':'SOUND ON';document.getElementById('map-sound-button').textContent=muted?'SOUND OFF':'SOUND ON';};document.getElementById('map-sound-button').onclick=()=>document.getElementById('sound-button').click();document.getElementById('resume-button').onclick=()=>{document.getElementById('sector-modal').classList.remove('is-visible');mode='play';clearInput();canvas.focus();};let eraseArmed=false;document.getElementById('erase-button').onclick=()=>{if(!eraseArmed){eraseArmed=true;document.getElementById('erase-button').textContent='CONFIRM NEW CAMPAIGN';return;}cleared=[];score=0;save();eraseArmed=false;document.getElementById('erase-button').textContent='NEW CAMPAIGN';startStage(0);};
addEventListener('keydown',e=>{if(mode==='play'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Escape'){if(mode==='play')help();else if(mode==='instructions'&&hasMission)document.getElementById('instruction-close').click();return;}if(mode!=='play')return;keys.add(e.code);if(['KeyX','KeyJ'].includes(e.code))beginFire();if(['KeyQ','KeyE'].includes(e.code))cycleWeapon();if(/^Digit[1-6]$/.test(e.code)){const n=Number(e.code.slice(5))-1;if(unlocked(n))weapon=n;}if(e.code==='KeyR')startStage(stage);if(e.code==='KeyM')document.getElementById('sound-button').click();});addEventListener('keyup',e=>{keys.delete(e.code);if(['KeyX','KeyJ'].includes(e.code)&&!keys.has('KeyX')&&!keys.has('KeyJ')&&!held.fire)endFire();});addEventListener('blur',()=>{clearInput();if(mode==='play')help();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')help();});addEventListener('vibecade:restart',e=>{e.preventDefault();startStage(stage);});
document.querySelectorAll('[data-action]').forEach(button=>{const action=button.dataset.action;button.addEventListener('pointerdown',e=>{e.preventDefault();if(mode!=='play')return;try{button.setPointerCapture(e.pointerId);}catch{}button.classList.add('pressed');if(action==='weapon')cycleWeapon();else if(action==='map')showMap();else{held[action]=true;if(action==='fire')beginFire();}});const release=e=>{e.preventDefault();held[action]=false;if(action==='fire'&&!keys.has('KeyX')&&!keys.has('KeyJ'))endFire(e.type!=='pointerup');button.classList.remove('pressed');};['pointerup','pointercancel','lostpointercapture'].forEach(type=>button.addEventListener(type,release));});
function bindJoystick(){window.VibeCadeJoystick(document.querySelector('[data-joystick]'),{mode:'analog',profile:'precision',onChange:(x,y)=>{joy=x;joyY=y;}});}if(window.VibeCadeJoystick)bindJoystick();else addEventListener('vibecade-controls-ready',bindJoystick,{once:true});
addEventListener('vibecade:reset-input',()=>clearInput(false));
// Opt-in deterministic hooks support collision, progression and later-boss regression tests.
if(new URLSearchParams(location.search).has('test'))window.__iron={manual:v=>manual=v,snapshot:()=>({stage,mode,t,score,lives,weapon,energy,charge,firingStarted,fireRelease,cleared:[...cleared],checkpoint,bossActive,player:{...player},boss:boss?{...boss}:null,enemyCount:enemies.filter(e=>!e.dead).length,bullets:bullets.length,held:{...held},joy,joyY,camera,encounters:[...clearedEncounters],collectedCaches:[...collectedCaches]}),start:startStage,step:(n,render=true)=>{for(let i=0;i<n;i++){update(STEP);updateEffects(STEP);}if(render)draw();},warp:(x,y=GROUND-44)=>{player.x=x;player.y=y;player.vx=player.vy=0;camera=clamp(x-300,0,world.length-W);},setPlayer:values=>Object.assign(player,values),setBoss:values=>boss&&Object.assign(boss,values),grant:n=>{cleared=Array.from({length:n},(_,i)=>i);save();},select:n=>weapon=n,shoot:fire,damage:hurt,world:()=>world,enemies:()=>enemies,bullets:()=>bullets,pause:()=>mode='test-pause',resume:()=>mode='play'};
if(window.__iron)__iron.clearEncounters=()=>{for(const z of world.encounters){z.open=true;clearedEncounters.add(z.id);}for(const e of enemies)if(e.group!==undefined)e.dead=true;};
world=buildWorld(0);spawn(90);enemies=createEnemies();let last=performance.now(),acc=0,drawnMode=null;function frame(now){const delta=Math.min(.08,(now-last)/1000);last=now;if(mode==='play'&&!manual){acc+=delta;while(acc>=STEP){update(STEP);updateEffects(STEP);acc-=STEP;}}else if(mode==='clear')updateEffects(delta);else acc=0;if(mode!==drawnMode||mode==='play'||mode==='clear'){draw();drawnMode=mode;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
// The first visit is always gated; a returning tab can review or resume with a gesture.
try{if(sessionStorage.getItem('iron-meridian-instructions')==='seen'){document.getElementById('instruction-modal').classList.remove('is-visible');showMap();}}catch{}
})();

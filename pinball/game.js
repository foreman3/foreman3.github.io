const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('instruction-modal');
const startButton = document.getElementById('start-button');
const helpButton = document.getElementById('help-button');

const W = 800, H = 1080, TAU = Math.PI * 2;
const sessionKey = 'vibecade-instructions-pinball-v3';
const controls = { left: false, right: false, launch: false };
const colors = { cyan:'#61f6ff', pink:'#ff55c8', gold:'#ffe171', violet:'#9d7aff' };
let paused = true, last = performance.now(), accumulator = 0, audio;

const state = {
  score:0, high:Number(localStorage.getItem('neon-nova-high') || 0), lives:3,
  multiplier:1, combo:0, gameOver:false, launchCharge:0, ballSave:0, reactorLevel:1, stage:0, bumperHits:0, bumperGoal:8, spinnerHits:0, spinnerGoal:3, jackpotValue:10000,
  message:'HOLD SPACE TO CHARGE', messageTimer:99,
  nova:[false,false,false,false], targets:[false,false,false], flashes:[], particles:[], shake:0
};
const ball = { x:728, y:918, vx:0, vy:0, r:12, ready:true, active:true, skillShotAwarded:false, launcherExited:false, warping:false, warpTimer:0, warpAssist:0, trail:[], sensorTimes:{} };

const walls = [
  [48,980,48,170],[748,170,748,980],[684,145,684,938]
];
const crownRails = [
  [48,170,52,140],[52,140,62,112],[62,112,80,88],[80,88,105,69],[105,69,135,56],[135,56,175,49],
  [175,49,620,49],[620,49,660,53],[660,53,695,65],[695,65,721,84],[721,84,739,110],[739,110,748,142],[748,142,748,170]
];
const topNub = {x:82,y:122,r:10,color:colors.gold};
const oneWayGate = {x:684,y1:56,y2:145};
const bumpers = [
  {x:246,y:400,r:32,value:250,color:colors.cyan},
  {x:371,y:325,r:32,value:250,color:colors.pink},
  {x:482,y:425,r:32,value:250,color:colors.gold}
];
const novaPosts = [
  {x:212,y:246,r:8},{x:329,y:235,r:8},{x:450,y:248,r:8}
];
const slings = [
  {points:[[180,690],[220,790],[180,750]],active:[180,690,220,790],color:colors.pink,pulse:0,lastHit:0},
  {points:[[552,690],[512,790],[552,750]],active:[552,690,512,790],color:colors.cyan,pulse:0,lastHit:0}
];
const laneGuides = [
  {side:'left',points:[[108,665],[118,725],[138,785],[178,852],[210,885],[226,908]],color:colors.pink},
  {side:'right',points:[[624,665],[614,725],[594,785],[554,852],[522,885],[506,908]],color:colors.cyan}
];
const sideKickers = [
  {points:[[48,520],[48,612],[92,594]],active:[48,520,92,594],color:colors.pink,pulse:0,lastHit:0},
  {points:[[684,520],[684,612],[640,594]],active:[684,520,640,594],color:colors.cyan,pulse:0,lastHit:0}
];
const lanes = [
  {x:155,y:258,r:21,letter:'N'},{x:268,y:235,r:21,letter:'O'},
  {x:390,y:235,r:21,letter:'V'},{x:510,y:262,r:21,letter:'A'}
];
const warpHole = {x:360,y:568,r:27,open:false};
const warpTargets = [
  {x:312,y:612,r:11,label:'W',dropped:false},
  {x:344,y:612,r:11,label:'A',dropped:false},
  {x:376,y:612,r:11,label:'R',dropped:false},
  {x:408,y:612,r:11,label:'P',dropped:false}
];
const warpOutlet = {x:104,y:151,r:17};
const targets = [
  {x:66,y:400,r:14,label:'1'},{x:66,y:445,r:14,label:'2'},{x:66,y:490,r:14,label:'3'}
];
const jackpot = {x:520,y:555,r:31};
const skillShot = {x:718,y:302,r:24};
const spinner = {x:625,y:395,length:70,angle:Math.PI/2,velocity:0,lastHit:0,color:colors.cyan};
const flippers = [
  {pivot:{x:235,y:920},length:90,radius:13,rest:.32,active:-.48,angle:.32,prev:.32,side:'left'},
  {pivot:{x:485,y:920},length:90,radius:13,rest:Math.PI-.32,active:Math.PI+.48,angle:Math.PI-.32,prev:Math.PI-.32,side:'right'}
];

function resizeCanvas(){
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function tone(freq=440,duration=.05,volume=.035,slide=0){
  try{
    audio ||= new (window.AudioContext||window.webkitAudioContext)();
    const osc=audio.createOscillator(), gain=audio.createGain();
    osc.type='triangle'; osc.frequency.setValueAtTime(freq,audio.currentTime);
    osc.frequency.linearRampToValueAtTime(freq+slide,audio.currentTime+duration);
    gain.gain.setValueAtTime(volume,audio.currentTime); gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);
    osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime+duration);
  }catch{}
}
function say(message,seconds=1.6){state.message=message;state.messageTimer=seconds;}
function objectiveText(){
  if(state.stage===0)return '1 · LIGHT N-O-V-A';
  if(state.stage===1)return '2 · CLEAR TARGET BANK';
  if(state.stage===2)return `3 · CHARGE BUMPERS ${state.bumperHits}/${state.bumperGoal}`;
  if(state.stage===3)return `4 · RIP ION SPINNER ${state.spinnerHits}/${state.spinnerGoal}`;
  return `5 · SHOOT JACKPOT ${state.jackpotValue.toLocaleString()}`;
}
function advanceStage(next,message){state.stage=next;say(message,2.4);tone(520,.2,.05,380);}
function addScore(value,x=ball.x,y=ball.y){
  const points=value*state.multiplier; state.score+=points; state.combo++; state.high=Math.max(state.high,state.score);
  state.flashes.push({text:`+${points}`,x,y,life:1});
  if(state.combo>0&&state.combo%8===0&&state.multiplier<5){state.multiplier++;say(`${state.multiplier}X MULTIPLIER!`,2);tone(720,.18,.05,400);}
}
function burst(x,y,color,count=12){
  for(let i=0;i<count;i++){const a=Math.random()*TAU,speed=40+Math.random()*150;state.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.5+Math.random()*.5,color});}
}
function resetBall(){
  Object.assign(ball,{x:728,y:918,vx:0,vy:0,ready:true,active:true,skillShotAwarded:false,launcherExited:false,warping:false,warpTimer:0,warpAssist:0,sensorTimes:{}});ball.trail.length=0;
  state.launchCharge=0;state.ballSave=0;state.combo=0;say('HOLD SPACE TO CHARGE',99);
}
function restart(){
  Object.assign(state,{score:0,lives:3,multiplier:1,combo:0,gameOver:false,launchCharge:0,ballSave:0,reactorLevel:1,stage:0,bumperHits:0,bumperGoal:8,spinnerHits:0,spinnerGoal:3,jackpotValue:10000});
  state.nova.fill(false);state.targets.fill(false);warpHole.open=false;warpTargets.forEach(t=>t.dropped=false);resetBall();
}
function launchBall(){
  if(!ball.ready||state.gameOver)return;
  const power=.78+state.launchCharge*.22;ball.ready=false;ball.vx=-35*power;ball.vy=-1300*power;
  say(power>.9?'FULL POWER!':'BALL IN PLAY',1.2);tone(150,.14,.055,360);state.launchCharge=0;state.ballSave=5;
}
function drainBall(){
  if(!ball.active)return;ball.active=false;if(state.ballSave>0){state.ballSave=0;say('BALL SAVED!',1.4);tone(420,.18,.05,280);setTimeout(()=>{if(!state.gameOver)resetBall();},500);return;}state.lives--;state.shake=10;tone(190,.35,.055,-120);
  if(state.lives<=0){state.gameOver=true;localStorage.setItem('neon-nova-high',String(state.high));say('GAME OVER — PRESS R OR TAP ↻',99);}
  else{say(`BALL ${4-state.lives} READY`,1.4);setTimeout(()=>{if(!state.gameOver)resetBall();},900);}
}
function closestPoint(px,py,ax,ay,bx,by){
  const abx=bx-ax,aby=by-ay,t=Math.max(0,Math.min(1,((px-ax)*abx+(py-ay)*aby)/(abx*abx+aby*aby||1)));
  return{x:ax+abx*t,y:ay+aby*t,t};
}
function collideSegment(ax,ay,bx,by,radius=0,boost=1,flipper=null){
  const p=closestPoint(ball.x,ball.y,ax,ay,bx,by);let dx=ball.x-p.x,dy=ball.y-p.y,d=Math.hypot(dx,dy),min=ball.r+radius;
  if(d>=min)return false;if(d<.001){dx=0;dy=-1;d=1;}
  const nx=dx/d,ny=dy/d,overlap=min-d;ball.x+=nx*overlap;ball.y+=ny*overlap;
  let surfaceVx=0,surfaceVy=0,motionUp=0,restitution=boost;
  if(flipper){const rawOmega=(flipper.angle-flipper.prev)*120,omega=Math.max(-12,Math.min(12,rawOmega)),rx=p.x-flipper.pivot.x,ry=p.y-flipper.pivot.y;motionUp=flipper.side==='left'?-omega:omega;restitution=motionUp>.5?1.08:(motionUp<-.5?.28:.68);surfaceVx=-omega*ry;surfaceVy=omega*rx;}
  const rel=(ball.vx-surfaceVx)*nx+(ball.vy-surfaceVy)*ny;
  if(rel<0){ball.vx-=(1+restitution)*rel*nx;ball.vy-=(1+restitution)*rel*ny;if(flipper){if(motionUp>.5){const kick=Math.min(105,motionUp*7);ball.vx+=nx*kick;ball.vy+=ny*kick;}else if(motionUp<-.5){ball.vx*=.82;ball.vy*=.82;}else{ball.vx*=.96;ball.vy*=.96;}}}
  return true;
}
function collideCircle(obj,boost=1.2,score=0){
  let dx=ball.x-obj.x,dy=ball.y-obj.y,d=Math.hypot(dx,dy),min=ball.r+obj.r;if(d>=min)return false;if(d<.001){dx=0;dy=-1;d=1;}
  const nx=dx/d,ny=dy/d;ball.x=obj.x+nx*min;ball.y=obj.y+ny*min;
  const rel=ball.vx*nx+ball.vy*ny;if(rel<0){ball.vx-=(1+boost)*rel*nx;ball.vy-=(1+boost)*rel*ny;}
  const now=performance.now();if(score&&now-(obj.lastHit||0)>90){obj.lastHit=now;obj.hitCount=(obj.hitCount||0)+1;addScore(score,obj.x,obj.y);burst(obj.x,obj.y,obj.color||colors.cyan);state.shake=3;tone(300+score/2,.055,.035,120);}return true;
}
function sensorHit(obj,key,callback){
  const inside=Math.hypot(ball.x-obj.x,ball.y-obj.y)<ball.r+obj.r,now=performance.now();
  if(inside&&now-(ball.sensorTimes[key]||0)>900){ball.sensorTimes[key]=now;callback();}
}
function collideSlingshot(sling){
  const [a,b,c]=sling.points;
  collideSegment(a[0],a[1],c[0],c[1],5,.9);
  if(collideSegment(...sling.active,7,1.5)){
    const now=performance.now();
    if(now-sling.lastHit>120){sling.lastHit=now;sling.pulse=1;addScore(100,(sling.active[0]+sling.active[2])/2,(sling.active[1]+sling.active[3])/2);burst(ball.x,ball.y,sling.color,14);tone(250,.06,.04,190);}
  }
}
function collideSideKicker(kicker){
  const [,b,c]=kicker.points;
  collideSegment(b[0],b[1],c[0],c[1],5,.9);
  if(collideSegment(...kicker.active,5,1.05)){
    const now=performance.now();
    if(now-kicker.lastHit>140){kicker.lastHit=now;kicker.pulse=1;}
  }
}
function collideSpinner(){
  const dx=Math.cos(spinner.angle)*spinner.length/2,dy=Math.sin(spinner.angle)*spinner.length/2;
  if(!collideSegment(spinner.x-dx,spinner.y-dy,spinner.x+dx,spinner.y+dy,5,.92))return;
  const now=performance.now();if(now-spinner.lastHit<160)return;spinner.lastHit=now;spinner.velocity+=(ball.vx+ball.vy>=0?10:-10);addScore(state.stage===3?350:150,spinner.x,spinner.y);burst(spinner.x,spinner.y,spinner.color,12);tone(360,.06,.035,260);
  if(state.stage===3){state.spinnerHits++;if(state.spinnerHits>=state.spinnerGoal)advanceStage(4,'ION SPINNER COMPLETE — JACKPOT LIT!');else say(`ION SPINNER ${state.spinnerHits}/${state.spinnerGoal}`,1.2);}
}
function collideWarpTarget(target){
  if(target.dropped||!collideCircle(target,.72,0))return;
  target.dropped=true;addScore(250,target.x,target.y);burst(target.x,target.y,colors.violet,14);tone(280,.07,.04,180);
  if(warpTargets.every(t=>t.dropped)){warpHole.open=true;say('WARP HOLE OPEN!',2);burst(warpHole.x,warpHole.y,colors.cyan,28);tone(260,.28,.05,520);}
  else say(`WARP LOCK ${warpTargets.filter(t=>t.dropped).length}/4`,1);
}
function enterWarp(){
  if(ball.warping||!warpHole.open)return;
  ball.warping=true;ball.warpTimer=.7;ball.vx=0;ball.vy=0;ball.x=warpHole.x;ball.y=warpHole.y;ball.trail.length=0;
  addScore(1500,warpHole.x,warpHole.y);burst(warpHole.x,warpHole.y,colors.pink,38);tone(180,.5,.055,720);say('WARP ENGAGED!',1.5);
}
function exitWarp(){
  const unlit=state.nova.map((lit,i)=>lit?-1:i).filter(i=>i>=0),choices=unlit.length?unlit:[0,1,2,3],lane=lanes[choices[Math.floor(Math.random()*choices.length)]];
  const dx=lane.x-warpOutlet.x,dy=lane.y-warpOutlet.y,flight=Math.max(.22,Math.abs(dx)/680),vx=dx/flight,vy=(dy-.5*590*flight*flight)/flight;
  Object.assign(ball,{warping:false,warpTimer:0,warpAssist:flight+.1,x:warpOutlet.x,y:warpOutlet.y,vx,vy,launcherExited:true});
  warpHole.open=false;warpTargets.forEach(t=>t.dropped=false);burst(warpOutlet.x,warpOutlet.y,colors.cyan,30);tone(760,.18,.045,-260);say(`WARP EXIT — ${lane.letter} LANE`,1.8);
}
function update(dt){
  state.messageTimer=Math.max(0,state.messageTimer-dt);state.ballSave=Math.max(0,state.ballSave-dt);state.shake*=.86;
  state.flashes.forEach(f=>{f.life-=dt;f.y-=25*dt;});state.flashes=state.flashes.filter(f=>f.life>0);
  state.particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;});state.particles=state.particles.filter(p=>p.life>0);slings.forEach(s=>s.pulse=Math.max(0,s.pulse-dt*4));sideKickers.forEach(k=>k.pulse=Math.max(0,k.pulse-dt*5));
  flippers.forEach(f=>{f.prev=f.angle;const pressed=f.side==='left'?controls.left:controls.right,target=pressed?f.active:f.rest;f.angle+=(target-f.angle)*Math.min(1,dt*(pressed?32:18));});spinner.angle+=spinner.velocity*dt;spinner.velocity*=Math.pow(.975,dt*120);
  if(controls.launch&&ball.ready)state.launchCharge=Math.min(1,state.launchCharge+dt*.8);
  if(ball.warping){ball.warpTimer-=dt;if(ball.warpTimer<=0)exitWarp();return;}
  if(!ball.active||ball.ready)return;
  ball.warpAssist=Math.max(0,ball.warpAssist-dt);
  ball.vy+=590*dt;ball.vx*=.9995;ball.vy*=.9995;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
  if(!ball.launcherExited&&ball.x>oneWayGate.x&&ball.y<135&&ball.vy<0){ball.vx=Math.min(ball.vx,-420);ball.launcherExited=true;}
  ball.trail.unshift({x:ball.x,y:ball.y});if(ball.trail.length>12)ball.trail.pop();
  for(const w of walls)collideSegment(...w,3,.82);for(const rail of crownRails)collideSegment(...rail,4,.38);if(ball.vx>0&&ball.x<oneWayGate.x+ball.r)collideSegment(oneWayGate.x,oneWayGate.y1,oneWayGate.x,oneWayGate.y2,3,.32);collideCircle(topNub,.92,0);for(const kicker of sideKickers)collideSideKicker(kicker);for(const guide of laneGuides){for(let i=0;i<guide.points.length-1;i++)collideSegment(...guide.points[i],...guide.points[i+1],4,.88);}if(ball.warpAssist<=0)for(const p of novaPosts)collideCircle(p,.82,0);for(const s of slings)collideSlingshot(s);collideSpinner();warpTargets.forEach(collideWarpTarget);if(warpHole.open)sensorHit(warpHole,'warp',enterWarp);else collideCircle(warpHole,.45,0);for(const b of bumpers){const before=b.hitCount||0;collideCircle(b,1.45,b.value);if((b.hitCount||0)>before&&state.stage===2){state.bumperHits++;if(state.bumperHits>=state.bumperGoal)advanceStage(3,'RIP THE ION SPINNER — 3 HITS');else say(`REACTOR CHARGE ${state.bumperHits}/${state.bumperGoal}`,1);}}
  for(const f of flippers){const ex=f.pivot.x+Math.cos(f.angle)*f.length,ey=f.pivot.y+Math.sin(f.angle)*f.length;if(collideSegment(f.pivot.x,f.pivot.y,ex,ey,f.radius,.9,f))tone(185,.035,.02,70);}
  targets.forEach((t,i)=>{
    const before=t.hitCount||0;collideCircle(t,1.05,state.stage===1?(state.targets[i]?40:400):75);if((t.hitCount||0)>before&&state.stage===1&&!state.targets[i]){state.targets[i]=true;burst(t.x,t.y,colors.pink,18);if(state.targets.every(Boolean)){state.multiplier=Math.min(5,state.multiplier+1);advanceStage(2,`CHARGE THE BUMPERS — ${state.bumperGoal} HITS`);}}
  });
  lanes.forEach((lane,i)=>sensorHit(lane,`lane${i}`,()=>{
    if(state.stage===0&&!state.nova[i]){state.nova[i]=true;addScore(500,lane.x,lane.y);tone(500+i*90,.08,.035,100);}
    else if(state.stage!==0)addScore(100,lane.x,lane.y);
    if(state.stage===0&&state.nova.every(Boolean)){addScore(2500,360,210);state.multiplier=Math.min(5,state.multiplier+1);burst(360,210,colors.gold,34);advanceStage(1,'NOVA COMPLETE — CLEAR THE TARGETS');}
  }));
  sensorHit(skillShot,'skillShot',()=>{if(ball.skillShotAwarded)return;ball.skillShotAwarded=true;addScore(750,skillShot.x,skillShot.y);say('SKILL SHOT — 750!',1.8);burst(skillShot.x,skillShot.y,colors.cyan,20);tone(430,.16,.045,360);});
  sensorHit(jackpot,'jackpot',()=>{if(state.stage===4){addScore(state.jackpotValue,jackpot.x,jackpot.y);burst(jackpot.x,jackpot.y,colors.gold,42);tone(640,.3,.06,620);state.reactorLevel++;if(state.reactorLevel%2===0)state.lives++;state.stage=0;state.bumperHits=0;state.spinnerHits=0;state.bumperGoal=8+(state.reactorLevel-1)*2;state.jackpotValue=10000*state.reactorLevel;state.nova.fill(false);state.targets.fill(false);say(`JACKPOT! REACTOR LEVEL ${state.reactorLevel}`,3);}else{addScore(250,jackpot.x,jackpot.y);say('JACKPOT NOT LIT',1.2);}});
  const speed=Math.hypot(ball.vx,ball.vy);if(speed>1450){ball.vx*=1450/speed;ball.vy*=1450/speed;}if(ball.y>1055)drainBall();
}

function roundedRect(x,y,w,h,r,fill,stroke,line=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
function glow(color,blur=18){ctx.shadowColor=color;ctx.shadowBlur=blur;}function noGlow(){ctx.shadowBlur=0;}
function draw(){
  canvas.dataset.score=String(state.score);canvas.dataset.lives=String(state.lives);canvas.dataset.ready=String(ball.ready);canvas.dataset.ballX=String(Math.round(ball.x));canvas.dataset.ballY=String(Math.round(ball.y));canvas.dataset.gameOver=String(state.gameOver);canvas.dataset.stage=String(state.stage);canvas.dataset.reactorLevel=String(state.reactorLevel);canvas.dataset.ballSave=String(Math.ceil(state.ballSave));canvas.dataset.warpOpen=String(warpHole.open);canvas.dataset.warpLocks=String(warpTargets.filter(t=>t.dropped).length);
  ctx.clearRect(0,0,W,H);ctx.save();if(state.shake>1)ctx.translate((Math.random()-.5)*state.shake,(Math.random()-.5)*state.shake);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#15103a');bg.addColorStop(.5,'#080721');bg.addColorStop(1,'#03030c');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.16;ctx.strokeStyle='#7565cf';ctx.lineWidth=1;for(let y=40;y<H;y+=44){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.globalAlpha=1;
  roundedRect(22,20,756,1040,32,'rgba(5,5,20,.76)','rgba(97,246,255,.32)',4);
  const topGlow=ctx.createRadialGradient(380,250,20,380,250,320);topGlow.addColorStop(0,'rgba(151,78,255,.19)');topGlow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=topGlow;ctx.fillRect(45,45,710,620);
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='800 28px Orbitron';glow(colors.pink,18);ctx.fillText('NEON NOVA',360,78);noGlow();ctx.font='700 12px Space Grotesk';ctx.fillStyle='#9fa7cc';ctx.fillText('VibeCade Galactic Pinball',360,99);
  roundedRect(132,112,415,55,16,'rgba(2,4,16,.78)','rgba(157,122,255,.32)');ctx.textAlign='left';ctx.font='700 12px Orbitron';ctx.fillStyle=colors.cyan;ctx.fillText('SCORE',150,133);ctx.fillStyle='#fff';ctx.font='800 21px Orbitron';ctx.fillText(String(state.score).padStart(7,'0'),150,158);ctx.fillStyle=colors.gold;ctx.font='700 11px Orbitron';ctx.fillText(`REACTOR ${state.reactorLevel}  ·  BALLS ${Math.max(0,state.lives)}  ·  ×${state.multiplier}${state.ballSave>0?`  ·  SAVE ${Math.ceil(state.ballSave)}`:''}`,335,145);
  roundedRect(112,177,496,36,13,'rgba(12,8,36,.9)',state.stage===4?'rgba(255,225,113,.8)':'rgba(97,246,255,.28)',2);ctx.textAlign='center';ctx.fillStyle=state.stage===4?colors.gold:colors.cyan;ctx.font='700 12px Orbitron';ctx.fillText(objectiveText(),360,200);
  const cabinetRails=[...walls,...crownRails];ctx.strokeStyle='rgba(97,246,255,.68)';ctx.lineWidth=6;ctx.lineCap='round';ctx.lineJoin='round';glow(colors.cyan,10);cabinetRails.forEach(w=>{ctx.beginPath();ctx.moveTo(w[0],w[1]);ctx.lineTo(w[2],w[3]);ctx.stroke();});noGlow();ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=2;cabinetRails.forEach(w=>{ctx.beginPath();ctx.moveTo(w[0],w[1]);ctx.lineTo(w[2],w[3]);ctx.stroke();});glow(topNub.color,12);ctx.beginPath();ctx.arc(topNub.x,topNub.y,topNub.r,0,TAU);ctx.fillStyle='#fff4b0';ctx.fill();ctx.strokeStyle=topNub.color;ctx.lineWidth=3;ctx.stroke();noGlow();ctx.save();ctx.setLineDash([6,5]);ctx.strokeStyle='rgba(255,225,113,.75)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(oneWayGate.x,oneWayGate.y1);ctx.lineTo(oneWayGate.x,oneWayGate.y2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=colors.gold;ctx.beginPath();ctx.moveTo(oneWayGate.x-10,100);ctx.lineTo(oneWayGate.x-2,94);ctx.lineTo(oneWayGate.x-2,106);ctx.closePath();ctx.fill();ctx.restore();
  lanes.forEach((lane,i)=>{const lit=state.nova[i],active=state.stage===0;glow(lit?colors.gold:(active?colors.violet:'#46405f'),active?14:5);ctx.beginPath();ctx.arc(lane.x,lane.y,lane.r,0,TAU);ctx.fillStyle=lit?'rgba(255,225,113,.9)':(active?'rgba(80,55,145,.52)':'rgba(35,31,53,.7)');ctx.fill();ctx.strokeStyle=lit?'#fff4ad':(active?'#aa93ff':'#514b66');ctx.lineWidth=3;ctx.stroke();noGlow();ctx.fillStyle=lit?'#161024':(active?'#e5ddff':'#77718b');ctx.font='800 16px Orbitron';ctx.textAlign='center';ctx.fillText(lane.letter,lane.x,lane.y+6);});
  novaPosts.forEach(p=>{const grad=ctx.createRadialGradient(p.x-3,p.y-4,1,p.x,p.y,p.r);grad.addColorStop(0,'#fff');grad.addColorStop(.38,'#dce8f6');grad.addColorStop(1,'#64738d');glow('#dce8f6',8);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle='rgba(255,225,113,.82)';ctx.lineWidth=2;ctx.stroke();noGlow();});
  bumpers.forEach(b=>{const active=state.stage===2,pulse=1+Math.sin(performance.now()/150+b.x)*(active?.07:.025);glow(b.color,active?30:16);ctx.beginPath();ctx.arc(b.x,b.y,b.r*pulse,0,TAU);ctx.fillStyle='rgba(16,12,48,.95)';ctx.fill();ctx.strokeStyle=b.color;ctx.lineWidth=active?8:6;ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,b.r-13,0,TAU);ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.stroke();noGlow();ctx.fillStyle=b.color;ctx.font='800 11px Orbitron';ctx.fillText(active?`${state.bumperHits}/${state.bumperGoal}`:'250',b.x,b.y+5);});
  ctx.textAlign='center';ctx.font='800 10px Orbitron';ctx.fillStyle=state.stage===1?colors.pink:'#77718b';ctx.fillText('TARGET BANK',82,367);targets.forEach((t,i)=>{const active=state.stage===1;glow(colors.pink,active?14:4);roundedRect(t.x-18,t.y-9,36,18,4,state.targets[i]?'#fff':(active?'rgba(255,85,200,.32)':'rgba(45,31,54,.7)'),active?colors.pink:'#62516a',3);noGlow();ctx.fillStyle=state.targets[i]?'#1a0b1c':(active?'#fff':'#7a7080');ctx.fillText(t.label,t.x,t.y+4);});
  glow(colors.gold,state.stage===4?34:10);ctx.beginPath();ctx.arc(jackpot.x,jackpot.y,jackpot.r+(state.stage===4?Math.sin(performance.now()/110)*3:0),0,TAU);ctx.fillStyle=state.stage===4?'rgba(255,225,113,.32)':'rgba(255,225,113,.06)';ctx.fill();ctx.strokeStyle=state.stage===4?colors.gold:'#756c43';ctx.lineWidth=state.stage===4?6:3;ctx.stroke();noGlow();ctx.fillStyle=state.stage===4?colors.gold:'#8d8456';ctx.font='800 9px Orbitron';ctx.fillText('JACKPOT',jackpot.x,jackpot.y+4);
  {const active=state.stage===3,dx=Math.cos(spinner.angle)*spinner.length/2,dy=Math.sin(spinner.angle)*spinner.length/2;glow(spinner.color,active?24:8);ctx.beginPath();ctx.moveTo(spinner.x-dx,spinner.y-dy);ctx.lineTo(spinner.x+dx,spinner.y+dy);ctx.strokeStyle=active?spinner.color:'rgba(97,246,255,.38)';ctx.lineWidth=active?8:5;ctx.stroke();noGlow();ctx.beginPath();ctx.arc(spinner.x,spinner.y,10,0,TAU);ctx.fillStyle=active?'#eaffff':'#34425b';ctx.fill();ctx.strokeStyle=spinner.color;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=active?spinner.color:'#71809b';ctx.font='800 8px Orbitron';ctx.fillText('ION',spinner.x,spinner.y-48);ctx.fillText(active?`${state.spinnerHits}/${state.spinnerGoal}`:'SPIN',spinner.x,spinner.y+54);}
  {const t=performance.now()/700,open=warpHole.open||ball.warping;ctx.save();ctx.translate(warpHole.x,warpHole.y);glow(open?colors.cyan:colors.violet,open?30:10);const core=ctx.createRadialGradient(0,0,2,0,0,warpHole.r);core.addColorStop(0,'#000');core.addColorStop(.58,open?'rgba(28,8,65,.95)':'rgba(13,10,34,.95)');core.addColorStop(1,open?'rgba(97,246,255,.45)':'rgba(157,122,255,.2)');ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,warpHole.r,0,TAU);ctx.fill();for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,warpHole.r-4-i*6,t+i*2.05,t+i*2.05+(open?4.4:2.2));ctx.strokeStyle=i%2?(open?colors.pink:'#5a416f'):(open?colors.cyan:'#554b7a');ctx.lineWidth=3-i*.5;ctx.stroke();}noGlow();ctx.restore();ctx.fillStyle=open?colors.cyan:'#7c7198';ctx.font='800 8px Orbitron';ctx.fillText(open?'WARP OPEN':'WARP LOCK',warpHole.x,warpHole.y+43);warpTargets.forEach(target=>{if(target.dropped){ctx.globalAlpha=.25;ctx.fillStyle='#443957';ctx.beginPath();ctx.arc(target.x,target.y,target.r*.65,0,TAU);ctx.fill();ctx.globalAlpha=1;return;}glow(colors.violet,9);roundedRect(target.x-12,target.y-8,24,16,4,'rgba(157,122,255,.35)',colors.violet,2);noGlow();ctx.fillStyle='#fff';ctx.font='800 8px Orbitron';ctx.fillText(target.label,target.x,target.y+3);});glow(colors.cyan,10);ctx.beginPath();ctx.arc(warpOutlet.x,warpOutlet.y,warpOutlet.r,0,TAU);ctx.fillStyle='rgba(0,0,0,.86)';ctx.fill();ctx.strokeStyle='rgba(97,246,255,.75)';ctx.lineWidth=3;ctx.stroke();noGlow();ctx.fillStyle=colors.cyan;ctx.beginPath();ctx.moveTo(warpOutlet.x+4,warpOutlet.y+5);ctx.lineTo(warpOutlet.x+15,warpOutlet.y+12);ctx.lineTo(warpOutlet.x+7,warpOutlet.y+16);ctx.closePath();ctx.fill();ctx.font='700 7px Orbitron';ctx.fillText('EXIT',warpOutlet.x+1,warpOutlet.y-23);}
  sideKickers.forEach(k=>{const [a,b,c]=k.points;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...c);ctx.closePath();ctx.fillStyle=`rgba(20,16,52,${.7+k.pulse*.12})`;ctx.fill();glow(k.color,7+k.pulse*12);ctx.beginPath();ctx.moveTo(k.active[0],k.active[1]);ctx.lineTo(k.active[2],k.active[3]);ctx.strokeStyle=k.color;ctx.lineWidth=4+k.pulse*2;ctx.stroke();ctx.beginPath();ctx.moveTo(...c);ctx.lineTo(...b);ctx.strokeStyle='rgba(235,242,255,.58)';ctx.lineWidth=2;ctx.stroke();noGlow();});
  laneGuides.forEach(g=>{for(const offset of[-7,0,7]){ctx.beginPath();g.points.forEach((p,i)=>{const x=p[0]+offset,y=p[1];i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=offset===0?'rgba(240,247,255,.92)':'rgba(157,190,235,.5)';ctx.lineWidth=offset===0?4:2;glow(g.color,offset===0?9:3);ctx.stroke();noGlow();}});ctx.font='700 8px Orbitron';ctx.fillStyle='rgba(255,255,255,.5)';ctx.save();ctx.translate(74,850);ctx.rotate(-1.15);ctx.fillText('OUTLANE',0,0);ctx.restore();ctx.save();ctx.translate(658,850);ctx.rotate(1.15);ctx.fillText('OUTLANE',0,0);ctx.restore();
  slings.forEach(s=>{const [a,b,c]=s.points;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...c);ctx.closePath();ctx.fillStyle=`rgba(26,18,62,${.68+s.pulse*.2})`;ctx.fill();ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...c);ctx.strokeStyle='rgba(157,122,255,.55)';ctx.lineWidth=4;ctx.stroke();glow(s.color,14+s.pulse*20);ctx.beginPath();ctx.moveTo(s.active[0],s.active[1]);ctx.lineTo(s.active[2],s.active[3]);ctx.strokeStyle=s.color;ctx.lineWidth=10+s.pulse*5;ctx.stroke();noGlow();for(const p of s.points){ctx.beginPath();ctx.arc(p[0],p[1],10,0,TAU);ctx.fillStyle='#f4f5ff';ctx.fill();ctx.strokeStyle=s.color;ctx.lineWidth=3;ctx.stroke();}});
  flippers.forEach((f,i)=>{const ex=f.pivot.x+Math.cos(f.angle)*f.length,ey=f.pivot.y+Math.sin(f.angle)*f.length;ctx.strokeStyle=i?colors.cyan:colors.pink;ctx.lineWidth=f.radius*2;ctx.lineCap='round';glow(ctx.strokeStyle,18);ctx.beginPath();ctx.moveTo(f.pivot.x,f.pivot.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=4;ctx.stroke();noGlow();});
  ctx.fillStyle='rgba(97,246,255,.08)';ctx.fillRect(695,258,44,678);ctx.fillStyle=colors.cyan;ctx.font='700 11px Orbitron';ctx.save();ctx.translate(722,640);ctx.rotate(-Math.PI/2);ctx.fillText('LAUNCH LANE',0,0);ctx.restore();ctx.beginPath();ctx.arc(skillShot.x,skillShot.y,skillShot.r,0,TAU);ctx.strokeStyle='rgba(97,246,255,.55)';ctx.lineWidth=2;ctx.stroke();ctx.font='700 8px Orbitron';ctx.fillText('SKILL',skillShot.x,skillShot.y+3);roundedRect(703,954,36,70,10,'rgba(5,5,20,.8)','rgba(255,225,113,.5)',2);ctx.fillStyle=colors.gold;ctx.fillRect(709,1017-state.launchCharge*55,24,state.launchCharge*55);
  if(ball.active&&!ball.warping){ball.trail.forEach((p,i)=>{ctx.globalAlpha=(1-i/ball.trail.length)*.22;ctx.beginPath();ctx.arc(p.x,p.y,ball.r*(1-i/ball.trail.length),0,TAU);ctx.fillStyle=colors.cyan;ctx.fill();});ctx.globalAlpha=1;const grad=ctx.createRadialGradient(ball.x-4,ball.y-5,2,ball.x,ball.y,ball.r);grad.addColorStop(0,'#fff');grad.addColorStop(.4,'#d8faff');grad.addColorStop(1,'#6a83a9');glow('#d8faff',12);ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,TAU);ctx.fillStyle=grad;ctx.fill();noGlow();}
  state.particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);});ctx.globalAlpha=1;state.flashes.forEach(f=>{ctx.globalAlpha=f.life;ctx.fillStyle='#fff';ctx.font='800 16px Orbitron';ctx.fillText(f.text,f.x,f.y);});ctx.globalAlpha=1;
  roundedRect(97,1012,526,34,14,'rgba(2,3,14,.82)','rgba(157,122,255,.25)');ctx.fillStyle=state.gameOver?colors.pink:colors.cyan;ctx.font='700 13px Orbitron';ctx.fillText(state.messageTimer>0?state.message:'KEEP IT ALIVE',360,1035);ctx.textAlign='right';ctx.fillStyle='rgba(220,225,255,.55)';ctx.font='700 10px Orbitron';ctx.fillText(`HIGH ${String(state.high).padStart(7,'0')}`,594,1001);ctx.restore();
}
function frame(now){const elapsed=Math.min(.05,(now-last)/1000);last=now;if(!paused){accumulator+=elapsed;while(accumulator>=1/120){update(1/120);accumulator-=1/120;}}draw();requestAnimationFrame(frame);}
function setControl(name,down){if(name==='launch'&&controls.launch&&!down)launchBall();controls[name]=down;}
const keyMap={ArrowLeft:'left',KeyZ:'left',ArrowRight:'right',Slash:'right',Space:'launch',Enter:'launch'};
window.addEventListener('keydown',e=>{if(keyMap[e.code]){e.preventDefault();setControl(keyMap[e.code],true);}if(e.code==='KeyR'&&state.gameOver)restart();});
window.addEventListener('keyup',e=>{if(keyMap[e.code]){e.preventDefault();setControl(keyMap[e.code],false);}});
window.addEventListener('blur',()=>Object.keys(controls).forEach(k=>controls[k]=false));
document.querySelectorAll('.touch-key').forEach(button=>{const name=button.dataset.control;const press=e=>{e.preventDefault();button.classList.add('is-down');setControl(name,true);},release=e=>{e.preventDefault();button.classList.remove('is-down');setControl(name,false);};button.addEventListener('pointerdown',press);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('pointerleave',release);});
function showInstructions(){paused=true;modal.classList.add('is-visible');}
function hideInstructions(){modal.classList.remove('is-visible');paused=false;sessionStorage.setItem(sessionKey,'1');audio?.resume?.();}
startButton.addEventListener('click',hideInstructions);helpButton.addEventListener('click',showInstructions);modal.addEventListener('click',e=>{if(e.target===modal)hideInstructions();});
resizeCanvas();window.addEventListener('resize',resizeCanvas);if(sessionStorage.getItem(sessionKey)!=='1')showInstructions();else paused=false;requestAnimationFrame(frame);
window.pinballDebug={state,ball,restart,launch:()=>{state.launchCharge=1;launchBall();}};

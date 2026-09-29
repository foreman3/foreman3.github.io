(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d');
const W=960,H=600,FLOOR_Y=[125,218,311,404,497], SHAFTS=[108,852];
const profiles=[
  {files:2,guards:1,cameras:0,armor:0,time:110,hearts:5,speed:44,shot:3.9},
  {files:2,guards:2,cameras:0,armor:0,time:105,hearts:5,speed:50,shot:3.5},
  {files:3,guards:3,cameras:1,armor:0,time:100,hearts:5,speed:54,shot:3.3},
  {files:3,guards:4,cameras:1,armor:1,time:96,hearts:5,speed:58,shot:3.1},
  {files:4,guards:5,cameras:2,armor:2,time:92,hearts:5,speed:62,shot:2.9},
  {files:4,guards:6,cameras:2,armor:3,time:83,hearts:4,speed:70,shot:2.5},
  {files:5,guards:7,cameras:3,armor:4,time:76,hearts:3,speed:78,shot:2.15}
];
const fileLayouts=[[[520,1],[365,3]],[[650,1],[300,3]],[[610,1],[340,2],[615,3]],[[650,1],[305,2],[635,3]],[[620,0],[360,1],[645,2],[330,3]],[[640,0],[350,1],[640,2],[350,3]],[[600,0],[350,1],[625,2],[320,3],[565,4]]];
const state={mode:'intro',stage:1,score:0,time:0,hearts:5,player:{x:108,floor:0,face:1,inv:0,lift:0,fire:0},files:[],guards:[],cameras:[],bullets:[],hitLog:[],beam:0,flash:0,shake:0,notice:'',noticeTime:0,muted:false};
let keys={left:false,right:false,up:false,down:false,fire:false},joy=[0,0],audio,last=performance.now(),helpWasPaused=false;
const test=location.search.includes('test=1');
function sound(freq,dur=.08,type='square',vol=.025){if(state.muted||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+dur)}
function unlockSound(){try{audio ||=new(window.AudioContext||window.webkitAudioContext)();audio.resume()}catch{}}
function notice(message,duration=1.4){state.notice=message;state.noticeTime=duration;$('announcement').textContent=message}
function clearInput(){keys={left:false,right:false,up:false,down:false,fire:false};joy=[0,0]}
function beginStage(n){const p=profiles[n-1];state.stage=n;state.mode='playing';state.time=p.time;state.hearts=p.hearts;state.player={x:108,floor:0,face:1,inv:1.2,lift:0,fire:0};state.files=fileLayouts[n-1].map(([x,floor])=>({x,floor,taken:false}));state.guards=[];state.cameras=[];state.bullets=[];state.flash=0;state.shake=0;clearInput();
  state.hitLog=[];state.beam=0;for(let i=0;i<p.guards;i++){let floor=1+i%4,x=260+(i*207)%475;state.guards.push({x,floor,dir:i%2?1:-1,speed:p.speed+(i%3)*5,stun:0,hp:i<p.armor?2:1,armor:i<p.armor,shot:p.shot*(.75+(i%3)*.2)})}
  for(let i=0;i<p.cameras;i++)state.cameras.push({floor:1+(i*2)%4,x:410+i*140,phase:i*2.1});
  $('result-modal').classList.remove('is-visible');$('pause').textContent='Pause';notice(`SHIFT ${n} · FIND THE FILES`,1.9);hud();last=performance.now()}
function reset(){if(state.mode==='intro'||state.mode==='help')return;state.score=0;beginStage(1)}
function hud(){$('stage').textContent=`${state.stage} / 7`;$('files').textContent=`${state.files.filter(f=>f.taken).length} / ${state.files.length}`;$('time').textContent=Math.max(0,Math.ceil(state.time));$('hearts').textContent='♥'.repeat(state.hearts)||'0';$('score').textContent=state.score.toLocaleString()}
function end(win){state.mode=win?'clear':'over';clearInput();const final=win&&state.stage===7;$('result-title').textContent=final?'THE FILES ARE SAFE!':win?'SHIFT CLEARED':'MISSION FAILED';$('result-text').textContent=win?final?`Seven escapes complete · ${state.score.toLocaleString()} points`:`${state.files.length} files secured · ${Math.ceil(state.time)} seconds left`:'The tower caught you. Reset and plan another route.';$('next').hidden=!win||final;$('again').hidden=win&&!final;$('result-modal').classList.add('is-visible');sound(win?600:150,.25,'sawtooth',.035)}
function damage(source){const pl=state.player;if(pl.inv>0||state.mode!=='playing')return;state.hearts--;if(test)state.hitLog.push({source,time:+state.time.toFixed(1),floor:pl.floor,x:+pl.x.toFixed(1)});pl.inv=2.15;state.shake=.35;state.flash=.2;sound(120,.18,'sawtooth',.04);notice('HIT! KEEP MOVING',.7);hud();if(state.hearts<=0)end(false)}
function fire(){const pl=state.player;if(state.mode!=='playing'||pl.fire>0)return;pl.fire=.33;state.beam=.1;let hit=null,dist=220;for(const g of state.guards){const dx=g.x-pl.x;if(g.floor!==pl.floor||g.stun>0||Math.sign(dx)!==pl.face||Math.abs(dx)>dist)continue;dist=Math.abs(dx);hit=g}let blocked=false;for(let i=state.bullets.length-1;i>=0;i--){const b=state.bullets[i],dx=(b.x-pl.x)*pl.face;if(b.floor===pl.floor&&dx>0&&dx<125){state.bullets.splice(i,1);blocked=true;state.score+=15}}if(hit){hit.hp--;if(hit.hp<=0){hit.stun=5.5;hit.hp=hit.armor?2:1;state.score+=hit.armor?180:100;notice(hit.armor?'ARMORED GUARD DOWN':'GUARD STUNNED',.55)}else notice('ARMOR CRACKED',.55);sound(350,.08,'triangle',.04)}else if(blocked){notice('SHOT BLOCKED',.4);sound(510,.07,'triangle',.025)}else sound(190,.055,'square',.017);state.flash=.08;hud()}
function tick(dt){if(state.mode!=='playing')return;dt=Math.min(dt,.05);const p=profiles[state.stage-1],pl=state.player;state.time-=dt;if(state.time<=0){state.time=0;end(false);return}pl.inv=Math.max(0,pl.inv-dt);pl.lift=Math.max(0,pl.lift-dt);pl.fire=Math.max(0,pl.fire-dt);state.flash=Math.max(0,state.flash-dt);state.shake=Math.max(0,state.shake-dt);state.noticeTime=Math.max(0,state.noticeTime-dt);if(!state.noticeTime){state.notice='';$('announcement').textContent=''}
  state.beam=Math.max(0,state.beam-dt);const h=(Number(keys.right)-Number(keys.left))||joy[0],v=(Number(keys.down)-Number(keys.up))||joy[1],nearLift=SHAFTS.some(x=>Math.abs(pl.x-x)<27);pl.crouch=v>.3&&!nearLift&&Math.abs(h)<.3;if(Math.abs(h)>.3){pl.x=Math.max(26,Math.min(934,pl.x+h*196*dt));pl.face=Math.sign(h)}
  if(Math.abs(v)>.3&&pl.lift===0&&nearLift){const next=pl.floor+Math.sign(v);if(next>=0&&next<5){pl.floor=next;pl.lift=.52;pl.inv=Math.max(pl.inv,.32);sound(270,.09,'sine',.018)}}
  if(keys.fire)fire();
  for(const f of state.files)if(!f.taken&&f.floor===pl.floor&&Math.abs(f.x-pl.x)<23){f.taken=true;state.score+=250;state.flash=.14;notice('FILE SECURED',.7);sound(660,.11,'triangle',.035)}
  if(state.files.every(f=>f.taken)&&pl.floor===4&&pl.x>905){state.score+=Math.ceil(state.time)*10+state.hearts*150;hud();end(true);return}
  for(const g of state.guards){if(g.stun>0){g.stun=Math.max(0,g.stun-dt);continue}g.x+=g.dir*g.speed*dt;if(g.x<185||g.x>775){g.x=Math.max(185,Math.min(775,g.x));g.dir*=-1}g.shot-=dt;if(g.floor===pl.floor){const dx=pl.x-g.x;if(Math.abs(dx)<28)damage('guard');if(g.shot<=0&&Math.abs(dx)<380&&Math.abs(dx)>60){state.bullets.push({x:g.x,y:FLOOR_Y[g.floor]-20,floor:g.floor,vx:Math.sign(dx)*(215+state.stage*17)});g.shot=p.shot*(.8+(g.x%90)/150);sound(95,.04,'square',.008)}}else if(g.shot<.3)g.shot=.3}
  for(let i=state.bullets.length-1;i>=0;i--){const b=state.bullets[i];b.x+=b.vx*dt;if(b.x<35||b.x>925){state.bullets.splice(i,1);continue}if(b.floor===pl.floor&&Math.abs(b.x-pl.x)<14){state.bullets.splice(i,1);if(!pl.crouch)damage('bullet')}}
  for(const c of state.cameras){c.phase+=dt*(1.15+state.stage*.11);const beamX=c.x+Math.sin(c.phase)*85;if(c.floor===pl.floor&&Math.abs(pl.x-beamX)<18)damage('camera')}
  hud()}
const artwork=window.LiftHeistArt.create(canvas);
function draw(){artwork.draw(state)}
let lastDrawMode='';
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;tick(dt);if(state.mode==='playing'||state.mode!==lastDrawMode){draw();lastDrawMode=state.mode}requestAnimationFrame(frame)}
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(k))e.preventDefault();if(state.mode==='intro'||state.mode==='help')return;if(k==='arrowleft'||k==='a')keys.left=true;if(k==='arrowright'||k==='d')keys.right=true;if(k==='arrowup'||k==='w')keys.up=true;if(k==='arrowdown'||k==='s')keys.down=true;if(k===' ')keys.fire=true;if(k==='p')togglePause();if(k==='r')reset();if(k==='m')toggleSound()});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a')keys.left=false;if(k==='arrowright'||k==='d')keys.right=false;if(k==='arrowup'||k==='w')keys.up=false;if(k==='arrowdown'||k==='s')keys.down=false;if(k===' ')keys.fire=false});
function togglePause(){if(state.mode==='playing'){state.mode='paused';clearInput();$('pause').textContent='Resume';notice('PAUSED',999)}else if(state.mode==='paused'){state.mode='playing';$('pause').textContent='Pause';notice('',0);last=performance.now()}}
function showHelp(){if(!['playing','paused'].includes(state.mode))return;helpWasPaused=state.mode==='paused';state.mode='help';clearInput();$('instruction-modal').classList.add('is-visible')}
function hideHelp(){if(state.mode==='intro'){sessionStorage.setItem('vibecade-lift-heist-instructions-v1','1');unlockSound();beginStage(1)}else if(state.mode==='help'){state.mode=helpWasPaused?'paused':'playing';if(helpWasPaused)notice('PAUSED',999);last=performance.now()}$('instruction-modal').classList.remove('is-visible');canvas.focus()}
function toggleSound(){state.muted=!state.muted;$('sound').textContent=state.muted?'Sound off':'Sound on';$('touch-sound').textContent=state.muted?'SOUND OFF':'SOUND';if(!state.muted)unlockSound()}
$('instruction-close').addEventListener('click',hideHelp);$('help-button').addEventListener('click',showHelp);$('pause').addEventListener('click',togglePause);$('reset').addEventListener('click',reset);$('sound').addEventListener('click',toggleSound);$('touch-sound').addEventListener('click',toggleSound);$('next').addEventListener('click',()=>beginStage(state.stage+1));$('again').addEventListener('click',()=>{state.score=0;beginStage(1)});
const fireButton=$('touch-fire');fireButton.addEventListener('pointerdown',e=>{e.preventDefault();try{fireButton.setPointerCapture(e.pointerId)}catch{}keys.fire=true;fireButton.classList.add('pressed');fire()});function releaseFire(){keys.fire=false;fireButton.classList.remove('pressed')}for(const type of ['pointerup','pointercancel','lostpointercapture'])fireButton.addEventListener(type,releaseFire);
window.addEventListener('vibecade:restart',e=>{e.preventDefault();reset()});window.addEventListener('vibecade:reset-input',clearInput);window.addEventListener('blur',()=>{clearInput();if(state.mode==='playing')togglePause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='playing')togglePause()});
const bind=()=>window.VibeCadeJoystick?.(document.querySelector('[data-joystick]'),{mode:'cardinal',onChange:(x,y)=>joy=[x,y]});if(window.VibeCadeJoystick)bind();else window.addEventListener('vibecade-controls-ready',bind,{once:true});
if(sessionStorage.getItem('vibecade-lift-heist-instructions-v1')){$('instruction-modal').classList.remove('is-visible');beginStage(1)}else{state.mode='intro';state.files=fileLayouts[0].map(([x,floor])=>({x,floor,taken:false}));notice('',0);hud()}
if(test)window.__liftTest={state,profiles,tick,beginStage,fire,draw};requestAnimationFrame(frame);
})();

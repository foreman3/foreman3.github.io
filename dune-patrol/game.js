(() => {
 'use strict';
 const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),keys=new Set(),test=new URLSearchParams(location.search).get('test')==='1';
 const profiles=[
  {name:'Apricot Flats',speed:195,length:5100,gap:680,width:78,hp:4},
  {name:'The Broken Road',speed:210,length:6000,gap:650,width:86,hp:4},
  {name:'Kite Mesa',speed:225,length:6700,gap:620,width:92,hp:4},
  {name:'Twin Fissures',speed:240,length:7500,gap:575,width:102,hp:4},
  {name:'Iron Sky',speed:255,length:8300,gap:540,width:112,hp:4},
  {name:'Redline Pass',speed:325,length:10600,gap:425,width:126,hp:3},
  {name:'The Last Horizon',speed:370,length:12900,gap:380,width:136,hp:2}
 ];
 const s={mode:'instructions'},input={jump:false,fire:false},reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;let manual=false,last=0,seen=false,returnMode='playing',audio,muted=false,dirty=true,hudClock=0;
 try{seen=sessionStorage.getItem('dune-patrol-instructions-v1')==='seen';}catch(_){}
 function clearInput(){keys.clear();input.jump=false;input.fire=false;document.querySelectorAll('.held').forEach(e=>e.classList.remove('held'));}
 function wake(){if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_) {}}
 function tone(hz,duration=.07,type='triangle',gain=.035){if(!audio||muted||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(hz,audio.currentTime);g.gain.setValueAtTime(gain,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
 function buildRoute(level){const p=profiles[level-1],a=[];let i=0;for(let x=1100;x<p.length-650;x+=p.gap){const rock=level>=2&&i%3===1;a.push({kind:rock?'rock':'pit',x,w:rock?40:p.width+(i%3)*7,hp:1,done:false});if(level>=4&&i%4===2&&x+p.width+315<p.length-600){x+=p.width+315;a.push({kind:'pit',x,w:p.width-18,hp:1,done:false});}i++;}if(level>=3){for(let x=1900,j=0;x<p.length-700;x+=level>=6?1000:1450,j++)a.push({kind:'plane',x,w:54,y:225+(j%2)*35,hp:level>=5&&j%2===0?2:1,armor:level>=5&&j%2===0,cool:1.1+(j%2)*.4,done:false});}return a.sort((a,b)=>a.x-b.x);}
 function start(level=1,bank=0){clearInput();const objects=buildRoute(level);Object.assign(s,{level,bank,score:bank,mode:'playing',time:0,distance:0,hp:profiles[level-1].hp,y:0,vy:0,held:0,jumpBuffer:0,inv:0,cool:0,jumps:0,hits:0,kills:0,chain:0,best:0,landings:0,shotCount:0,samples:0,objects,tags:level>=2?objects.filter((o,i)=>o.kind==='pit'&&i%3===0).map(o=>({x:o.x,done:false})):[],shots:[],bombs:[],particles:[],message:'',messageTime:0});$('result').hidden=true;$('result').classList.remove('is-visible');$('instruction-modal').classList.remove('is-visible');$('pause').textContent='Pause';dirty=true;hud();render();}
 function say(message){s.message=message;s.messageTime=2;hud();}
 function burst(x,y,color,n=12){if(reduced)n=3;for(let i=0;i<n&&s.particles.length<90;i++)s.particles.push({x,y,vx:Math.cos(i*2.4)*70,vy:-25-Math.sin(i*1.7)*65,life:.6,color});}
 function jump(){if(s.mode!=='playing')return;s.jumpBuffer=.13;if(s.y===0&&s.vy===0)launch();}
 function launch(){s.jumpBuffer=0;s.vy=480;s.held=0;s.jumps++;tone(340,.1);burst(220,430,'#e7b37d',6);}
 function shoot(){if(s.mode!=='playing'||s.cool>0)return;s.cool=.22;s.shotCount++;s.shots.push({x:264,y:392-s.y,vx:690,vy:0,life:1.3},{x:235,y:380-s.y,vx:0,vy:-650,life:1});tone(145,.035,'square',.012);}
 function damage(reason){if(s.inv>0||s.mode!=='playing')return;s.hp--;s.hits++;s.chain=0;s.inv=s.level===7?.8:2.1;s.y=30;s.vy=180;s.jumpBuffer=0;burst(226,400,'#fff0c7',18);tone(72,.2,'sawtooth',.04);say(reason+' · rescue shield active');if(s.hp<=0)finish(false);}
 function award(points){s.chain++;s.best=Math.max(s.best,s.chain);s.score+=points+Math.min(s.chain,10)*10;}
 function finish(win){if(s.mode!=='playing')return;s.mode=win?'clear':'failed';clearInput();s.score+=win?s.hp*250:0;$('result-title').textContent=win?(s.level===7?'The horizon is yours.':'Route secured.'):'Rover needs repairs.';$('result-detail').textContent=`${profiles[s.level-1].name} · ${Math.floor(s.distance/profiles[s.level-1].length*100)}% traversed. ${s.hits} hits, ${s.kills} targets, best chain ${s.best}. Score ${s.score.toLocaleString()}.`;$('next').textContent=win?(s.level===7?'Run again':'Next route'):'Retry route';$('result').hidden=false;$('result').classList.add('is-visible');tone(win?660:98,.3);hud();render();$('next').focus({preventScroll:true});}
 function update(dt){if(s.mode!=='playing')return;const p=profiles[s.level-1];s.time+=dt;s.distance+=p.speed*dt;s.inv=Math.max(0,s.inv-dt);s.cool=Math.max(0,s.cool-dt);s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);s.messageTime=Math.max(0,s.messageTime-dt);
  if(input.fire||keys.has('KeyX')||keys.has('KeyF'))shoot();
  const held=input.jump||keys.has('Space')||keys.has('ArrowUp')||keys.has('KeyW');
  if(s.y>0||s.vy>0){const gravity=held&&s.vy>0&&s.held<.23?620:1250;s.held+=dt;s.vy-=gravity*dt;s.y+=s.vy*dt;if(s.y<=0){s.y=0;s.vy=0;s.landings++;burst(220,430,'#e7b37d',5);if(s.jumpBuffer>0)launch();}}
  for(const o of s.objects){if(o.done)continue;const x=220+o.x-s.distance;
   if(o.kind==='plane'){o.x-=dt*(s.level>=6?50:25);if(x<940&&x>260){o.cool-=dt;if(o.cool<=0){o.cool=s.level>=6?1.05:1.65;s.bombs.push({x,y:o.y+16,vx:-(p.speed*.72),vy:100,life:4});}}}
   for(const b of s.shots){if(b.life<=0||o.kind==='pit')continue;const hit=o.kind==='rock'?Math.abs(b.x-x)<o.w/2+9&&b.y>386&&b.y<434:Math.abs(b.x-x)<34&&Math.abs(b.y-o.y)<22;if(hit){b.life=0;o.hp--;burst(x,o.kind==='rock'?411:o.y,'#ffcf81',7);if(o.hp<=0){o.done=true;s.kills++;award(o.kind==='rock'?100:200);tone(570,.06);}else{say('Armor cracked · one more shot');tone(230,.06);}}}
   if(o.kind==='pit'){if(x+o.w/2<193){o.done=true;if(!o.hit){award(120);tone(470,.035);}}else if(Math.abs(x-220)<o.w/2-7&&s.y<18&&!o.hit){o.hit=true;damage('Fissure hit');}}
   if(o.kind==='rock'&&!o.done&&Math.abs(x-220)<28&&s.y<40){o.done=true;damage('Rock impact');}
   if(x< -70)o.done=true;
  }
  for(const b of s.shots){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;}
  for(const tag of s.tags){if(!tag.done&&Math.abs(tag.x-s.distance)<30&&Math.abs(s.y-121)<29){tag.done=true;s.samples++;award(300);say('Survey sample +300 · clean chain ×'+s.chain);burst(220,286,'#c1ece5',10);tone(880,.1);}}
  for(const b of s.bombs){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=190*dt;b.life-=dt;for(const shot of s.shots){if(shot.life>0&&Math.abs(shot.x-b.x)<19&&Math.abs(shot.y-b.y)<20){shot.life=0;b.life=0;award(60);burst(b.x,b.y,'#fff0cf',7);}}if(b.life>0&&Math.abs(b.x-220)<28&&Math.abs(b.y-(406-s.y))<27){b.life=0;damage('Bomb impact');}if(b.y>431){b.life=0;burst(b.x,430,'#c65c3c',5);}}
  for(const q of s.particles){q.x+=(q.vx-p.speed*.3)*dt;q.y+=q.vy*dt;q.vy+=200*dt;q.life-=dt;}
  s.shots=s.shots.filter(b=>b.life>0&&b.x<1000&&b.y>0);s.bombs=s.bombs.filter(b=>b.life>0);s.particles=s.particles.filter(q=>q.life>0);
  if(s.mode==='playing'&&s.distance>=p.length){s.distance=p.length;finish(true);}hudClock+=dt;if(hudClock>.1){hudClock=0;hud();}
 }
 function step(seconds,draw=true){for(let t=0;t<seconds;t+=1/120)update(Math.min(1/120,seconds-t));if(draw){hud();render();}}
 function hud(){const p=profiles[s.level-1];$('level').textContent=`${s.level} / 7`;$('distance').textContent=Math.min(100,Math.floor(s.distance/p.length*100))+'%';$('health').textContent=`${s.hp} / ${p.hp}`;$('score').textContent=s.score.toLocaleString();$('route-name').textContent=p.name;const lesson=['Tap for a hop. Hold to clear a wide fissure.','Shoot rocks early; leave the next landing clear.','Twin guns cover the road and the sky.','Linked gaps: release, land, then jump again.','Armored aircraft need two hits. Keep your rhythm.','Mastery: shorter landing windows and faster raids.','Final crossing: one recovery. Make every arc count.'][s.level-1];$('status').textContent=s.mode==='paused'?'Paused · P or Pause to resume':s.messageTime>0?s.message:lesson;}
 function instructions(){if(s.mode==='instructions')return;returnMode=s.mode;clearInput();s.mode='instructions';$('instruction-close').textContent=seen?'Return to expedition':'Start the expedition';$('instruction-modal').classList.add('is-visible');$('result').hidden=true;dirty=true;render();$('instruction-close').focus({preventScroll:true});}
 function closeInstructions(){seen=true;try{sessionStorage.setItem('dune-patrol-instructions-v1','seen');}catch(_){}$('instruction-modal').classList.remove('is-visible');s.mode=returnMode;if(['clear','failed'].includes(s.mode)){$('result').hidden=false;$('next').focus();}else canvas.focus({preventScroll:true});wake();dirty=true;}
 function reset(){const gated=!seen;start();if(gated)instructions();else canvas.focus({preventScroll:true});}
 function pause(){if(!['playing','paused'].includes(s.mode))return;clearInput();s.mode=s.mode==='playing'?'paused':'playing';$('pause').textContent=s.mode==='paused'?'Resume':'Pause';hud();dirty=true;render();}
 function sound(){muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on';if(!muted)wake();}
 function render(){window.DuneArt.draw(ctx,s,profiles[s.level-1],reduced);dirty=false;}
 function resize(){const mobile=matchMedia('(max-width:900px),(pointer:coarse)').matches,scale=mobile?1:Math.min(devicePixelRatio||1,2);canvas.width=960*scale;canvas.height=540*scale;ctx.setTransform(scale,0,0,scale,0,0);dirty=true;render();}
 function bind(id,action){const e=$(id);e.addEventListener('pointerdown',ev=>{ev.preventDefault();wake();if(s.mode!=='playing')return;e.setPointerCapture(ev.pointerId);input[action]=true;e.classList.add('held');if(action==='jump')jump();else shoot();});const release=()=>{input[action]=false;e.classList.remove('held');};['pointerup','pointercancel','lostpointercapture'].forEach(n=>e.addEventListener(n,release));e.addEventListener('contextmenu',ev=>ev.preventDefault());}
 bind('jump','jump');bind('fire','fire');$('sound').onclick=sound;$('pause').onclick=pause;$('reset').onclick=reset;$('help-button').onclick=instructions;$('instruction-close').onclick=closeInstructions;$('review').onclick=instructions;$('again').onclick=reset;$('next').onclick=()=>{wake();const level=s.mode==='failed'?s.level:s.level===7?1:s.level+1,bank=s.mode==='failed'?s.bank:s.level===7?0:s.score;start(level,bank);canvas.focus({preventScroll:true});};
 document.addEventListener('keydown',e=>{if(s.mode==='instructions'){if(e.code==='Tab'){e.preventDefault();$('instruction-close').focus();}return;}if(['Space','Enter'].includes(e.code)&&e.target.closest('button'))return;if(['Space','ArrowUp'].includes(e.code))e.preventDefault();if(['clear','failed'].includes(s.mode)&&e.code==='Tab'){const a=[...$('result').querySelectorAll('button')];if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0].focus();}return;}if(e.repeat)return;wake();if(e.code==='KeyP')pause();else if(e.code==='KeyR')reset();else if(e.code==='KeyM')sound();else if(s.mode==='playing'){keys.add(e.code);if(['Space','ArrowUp','KeyW'].includes(e.code))jump();}});
 document.addEventListener('keyup',e=>keys.delete(e.code));canvas.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('blur',()=>{clearInput();if(s.mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(s.mode==='playing')pause();}});window.addEventListener('vibecade:restart',e=>{e.preventDefault();reset();});window.addEventListener('resize',resize);
 start();if(!seen)instructions();resize();
 function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(!manual){if(s.mode==='playing'){step(dt,false);render();}else if(dirty)render();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
 if(test)window.__duneTest={s,keys,input,profiles,start,step,render,jump,shoot,damage,pause,manual:value=>{manual=value;}};
})();

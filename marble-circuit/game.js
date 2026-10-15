(()=>{
 'use strict';
 const R=window.MarbleRules,A=window.MarbleArt,$=id=>document.getElementById(id),canvas=$('game'),g=canvas.getContext('2d'),input={left:false,right:false,up:false,down:false,brake:false,touchX:0,touchY:0},s={};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,session='marble-circuit-instructions-v1';
 let bg,manual=false,dirty=true,last=0,hudClock=0,muted=false,audio,returnMode='playing',optionsPaused=false;
 function wake(){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){}}
 function sound(freq,duration=.09){if(muted||!audio||s.mode==='instructions')return;try{const o=audio.createOscillator(),v=audio.createGain(),now=audio.currentTime;o.type='sine';o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(freq*.65,now+duration);v.gain.setValueAtTime(.045,now);v.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(v).connect(audio.destination);o.start();o.stop(now+duration);}catch(_){}}
 function clearInput(){for(const key of Object.keys(input))input[key]=key.startsWith('touch')?0:false;$('brake').setAttribute('aria-pressed','false');window.dispatchEvent(new Event('vibecade:reset-input'));}
 function effect(x,y,color){if(s.effects.length<18)s.effects.push({x,y,color,left:1});}
 function message(text,seconds=3){s.message=text;s.messageLeft=seconds;}
 function start(level,baseScore=s.score||0){
  clearInput();const course=R.levels[level-1],p=course.points[0];Object.assign(s,{level,course,mode:'playing',baseScore,score:baseScore,lives:course.lives,collected:0,checkpoint:[...p],checkpointIndex:0,elapsed:0,penalty:0,falling:0,falls:0,bumps:0,off:0,edge:false,flash:0,braking:false,trail:Array.from({length:12},()=>({x:p[0],y:p[1]})),trailIndex:0,trailClock:0,effects:[],message:course.tip,messageLeft:8,player:{x:p[0],y:p[1],vx:0,vy:0,roll:0,shield:0}});
  $('result-modal').classList.remove('is-visible');$('pause').textContent='Pause';$('touch-pause').textContent='PAUSE';rebuild();hud();dirty=true;if(!$('instruction-modal').classList.contains('is-visible'))canvas.focus({preventScroll:true});
 }
 function rebuild(){const scale=document.body.classList.contains('touch-device')?1:2;canvas.width=960*scale;canvas.height=600*scale;g.setTransform(scale,0,0,scale,0,0);bg=A.make(s.course,s.level,scale);dirty=true;}
 function remaining(){return Math.max(0,s.course.time-s.elapsed-s.penalty);}
 function hud(){if(!s.course)return;$('level').textContent=`${s.level} / 7`;$('beacons').textContent=`${s.collected} / 3`;$('lives').textContent=s.lives;$('time').textContent=remaining().toFixed(1);$('time').classList.toggle('low',remaining()<12);$('lives').classList.toggle('low',s.lives<2);$('score').textContent=s.score.toLocaleString();$('status').textContent=s.messageLeft>0?s.message:`${s.course.name.toUpperCase()} · ${s.collected<3?`Next: beacon ${s.collected+1}`:'All beacons lit. Find the checkered finish.'} · ${s.braking?'BRAKING':'Release to coast. Hold BRAKE to corner.'}`;}
 function finish(won,reason=''){
  if(!['playing','paused'].includes(s.mode))return;s.mode=won?'cleared':'lost';clearInput();
  if(won){const bonus=Math.floor(remaining()*10)+s.lives*100;s.score+=bonus;s.bonus=bonus;sound(760,.35);}
  $('result-title').textContent=won?(s.level===7?'A beautiful line.':`${s.course.name} complete.`):(reason||'Out of marbles.');
  $('result-text').textContent=won?`${s.elapsed.toFixed(1)}s rolling + ${s.penalty}s fall penalties · ${s.falls} falls · ${s.lives} marbles left. Time and marble bonus: ${s.bonus}. ${s.level===7?'Seven courses mastered. Start again and chase a cleaner run.':'Take that rhythm into the next course.'}`:`${s.collected} of 3 beacons lit. ${s.falls} falls. Retry this course with its starting score and a fresh clock.`;
  $('next').hidden=!won||s.level===7;$('retry').hidden=won;$('result-modal').classList.add('is-visible');(won&&s.level<7?$('next'):won?$('again'):$('retry')).focus();hud();dirty=true;
 }
 function fall(){if(s.mode!=='playing'||s.falling)return;s.falls++;s.lives--;s.penalty+=3;s.falling=.001;s.off=0;s.flash=.2;sound(155,.25);message(`OFF THE EDGE · −1 marble, +3s. Returning to ${s.collected?'beacon '+s.collected:'the start'}.`,3);dirty=true;}
 function update(dt){
  if(s.mode!=='playing'||document.body.classList.contains('touch-device')&&innerHeight>innerWidth)return;
  // Small fixed substeps keep narrow-edge and bumper collisions stable at low frame rates.
  const count=Math.max(1,Math.ceil(dt/(1/120))),step=dt/count;for(let n=0;n<count&&s.mode==='playing';n++)simulate(step);
  hudClock+=dt;if(hudClock>.1){hud();hudClock=0;}dirty=true;
 }
 function simulate(dt){
  const p=s.player,c=s.course;s.elapsed+=dt;s.flash=Math.max(0,s.flash-dt);s.messageLeft=Math.max(0,s.messageLeft-dt);p.shield=Math.max(0,p.shield-dt);
  for(let i=s.effects.length-1;i>=0;i--){s.effects[i].left-=dt*1.4;if(s.effects[i].left<=0)s.effects.splice(i,1);}
  if(remaining()<=0){finish(false,'The clock ran out.');return;}
  if(s.falling){s.falling+=dt;if(s.falling>=.65){if(s.lives<=0){finish(false);return;}p.x=s.checkpoint[0];p.y=s.checkpoint[1];p.vx=0;p.vy=0;p.shield=1.5;s.falling=0;clearInput();}return;}
  let x=(input.right?1:0)-(input.left?1:0)+input.touchX,y=(input.down?1:0)-(input.up?1:0)+input.touchY,length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
  s.braking=input.brake;const acceleration=s.braking?270:430,drag=s.braking?7:1.65,decay=Math.exp(-drag*dt);
  p.vx=(p.vx+x*acceleration*dt)*decay;p.vy=(p.vy+y*acceleration*dt)*decay;
  for(const h of c.boost){const b=R.point(c,h.seg,h.t),dx=p.x-b.x,dy=p.y-b.y;if(Math.abs(dx*b.ux+dy*b.uy)<35&&Math.abs(-dx*b.uy+dy*b.ux)<c.width*.42){const force=s.braking?100:280;p.vx+=b.ux*force*dt;p.vy+=b.uy*force*dt;}}
  const speed=Math.hypot(p.vx,p.vy),cap=s.braking?80:230;if(speed>cap){p.vx*=cap/speed;p.vy*=cap/speed;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.roll+=(p.vx+p.vy)*dt/17;
  s.trailClock+=dt;if(s.trailClock>.035){s.trailClock=0;s.trailIndex=(s.trailIndex+1)%s.trail.length;s.trail[s.trailIndex].x=p.x;s.trail[s.trailIndex].y=p.y;}
  let edgeDistance=Infinity;for(let i=0;i<c.points.length-1;i++)edgeDistance=Math.min(edgeDistance,R.distance(p.x,p.y,c.points[i],c.points[i+1]));s.edge=edgeDistance>c.width/2-11;
  if(!R.supported(c,p.x,p.y)){s.off+=dt;if(s.off>.085){fall();return;}}else s.off=0;
  for(const h of R.hazards(c,s.elapsed)){
   const dx=p.x-h.x,dy=p.y-h.y,d=Math.hypot(dx,dy),min=11+h.r;
   if(d<min&&p.shield===0){const nx=d>.01?dx/d:-h.uy,ny=d>.01?dy/d:h.ux;p.x=h.x+nx*(min+.5);p.y=h.y+ny*(min+.5);const along=p.vx*nx+p.vy*ny;if(along<0){p.vx-=along*nx;p.vy-=along*ny;}p.vx+=nx*90;p.vy+=ny*90;p.shield=.75;s.bumps++;s.flash=.12;effect(h.x,h.y,'#b84230');sound(230);message('BUMPER · Brake to settle, then choose your line.',2);}
  }
  if(s.collected<3){const pos=c.points[c.marks[s.collected]];if(Math.hypot(p.x-pos[0],p.y-pos[1])<25){s.collected++;s.checkpoint=[...pos];s.checkpointIndex=c.marks[s.collected-1];s.score+=250;effect(pos[0],pos[1],'#367f8b');sound(480+s.collected*110,.18);message(s.collected===3?'ALL BEACONS LIT · Roll onto the checkered finish.':`BEACON ${s.collected} · Checkpoint saved. Find ${s.collected+1}.`,3);hud();}}
  const end=c.points.at(-1);if(s.collected===3&&Math.hypot(p.x-end[0],p.y-end[1])<24)finish(true);
 }
 function draw(){if(!dirty)return;A.render(g,s,bg,reduced);dirty=false;}
 function help(){if($('instruction-modal').classList.contains('is-visible'))return;returnMode=s.mode;clearInput();s.mode='instructions';$('result-modal').classList.remove('is-visible');$('instruction-modal').classList.add('is-visible');$('instruction-close').textContent='BACK TO THE CIRCUIT';$('instruction-close').focus();dirty=true;}
 function dismiss(){try{sessionStorage.setItem(session,'seen');}catch(_){}$('instruction-modal').classList.remove('is-visible');s.mode=returnMode;if(['cleared','lost'].includes(s.mode))$('result-modal').classList.add('is-visible');clearInput();wake();if(['cleared','lost'].includes(s.mode))$('result-modal').querySelector('button:not([hidden])').focus();else canvas.focus();dirty=true;hud();}
 function pause(){if(!['playing','paused'].includes(s.mode))return;s.mode=s.mode==='playing'?'paused':'playing';clearInput();$('pause').textContent=s.mode==='paused'?'Resume':'Pause';$('touch-pause').textContent=s.mode==='paused'?'RESUME':'PAUSE';if(s.mode==='playing')canvas.focus({preventScroll:true});dirty=true;hud();}
 function restart(){const blocked=$('instruction-modal').classList.contains('is-visible');start(1,0);if(blocked){s.mode='instructions';returnMode='playing';}dirty=true;}
 function mute(){muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on';$('touch-sound').textContent=muted?'MUTED':'SOUND';if(!muted)wake();}
 const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
 document.addEventListener('keydown',e=>{if(!keys[e.code]&&!['Space','KeyP','KeyR','KeyM','Escape'].includes(e.code))return;if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;e.preventDefault();if(e.code==='KeyR'){if(!e.repeat)restart();return;}if(e.code==='KeyM'){if(!e.repeat)mute();return;}if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)pause();return;}if(s.mode!=='playing')return;wake();if(keys[e.code])input[keys[e.code]]=true;if(e.code==='Space')input.brake=true;});
 document.addEventListener('keyup',e=>{if(keys[e.code])input[keys[e.code]]=false;if(e.code==='Space')input.brake=false;});
 $('instruction-close').onclick=dismiss;$('help-button').onclick=help;$('pause').onclick=$('touch-pause').onclick=pause;$('reset').onclick=$('again').onclick=restart;$('retry').onclick=()=>{start(s.level,s.baseScore);wake();};$('next').onclick=()=>{start(s.level+1);wake();};$('sound').onclick=$('touch-sound').onclick=mute;
 const brake=$('brake');brake.addEventListener('pointerdown',e=>{e.preventDefault();if(s.mode!=='playing')return;brake.setPointerCapture(e.pointerId);input.brake=true;brake.setAttribute('aria-pressed','true');wake();});for(const type of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(type,()=>{input.brake=false;brake.setAttribute('aria-pressed','false');});
 window.VibeCadeJoystick(document.querySelector('[data-joystick]'),{mode:'analog',profile:'precision',onChange:(x,y)=>{input.touchX=s.mode==='playing'?x:0;input.touchY=s.mode==='playing'?y:0;if(x||y)wake();}});
 $('result-help').onclick=help;
 $('vibecade-options')?.addEventListener('toggle',e=>{if(e.newState==='open'){optionsPaused=s.mode==='playing';if(optionsPaused)pause();}else if(optionsPaused){optionsPaused=false;if(s.mode==='paused')pause();}});
 window.addEventListener('vibecade:reset-input',()=>{for(const key of Object.keys(input))input[key]=key.startsWith('touch')?0:false;brake.setAttribute('aria-pressed','false');});window.addEventListener('vibecade:restart',e=>{e.preventDefault();restart();});window.addEventListener('blur',()=>{clearInput();if(s.mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(s.mode==='playing')pause();}});window.addEventListener('resize',()=>{rebuild();draw();});
 document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const modal=document.querySelector('.modal.is-visible');if(!modal)return;const buttons=[...modal.querySelectorAll('button:not([hidden])')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}});
 const params=new URLSearchParams(location.search),level=R.clamp(Math.floor(Number(params.get('course'))||1),1,7);start(level,0);try{if(!sessionStorage.getItem(session)){s.mode='instructions';$('instruction-close').focus();}else $('instruction-modal').classList.remove('is-visible');}catch(_){s.mode='instructions';$('instruction-close').focus();}
 function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(!manual)update(dt);draw();requestAnimationFrame(frame);}hud();draw();requestAnimationFrame(frame);
 if(params.has('test'))window.__marbleTest={state:s,input,rules:R,start,step:dt=>update(dt),fall,finish,manual:v=>{manual=v;},draw:()=>{hud();dirty=true;draw();},muted:()=>muted,remaining,help};
})();

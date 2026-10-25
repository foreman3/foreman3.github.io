(()=>{
  'use strict';
  const R=MarbleRules,P=MarblePhysics,A=MarbleArt,$=id=>document.getElementById(id),canvas=$('game'),g=canvas.getContext('2d'),map=$('map').getContext('2d');
  const s={},input={left:false,right:false,up:false,down:false,brake:false,touchX:0,touchY:0},camera={x:0,y:0,zoom:1.48};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,session='marble-circuit-instructions-v3';
  let art,last=0,dirty=true,manual=false,hudClock=0,returnMode='playing',muted=false,audio,optionsPaused=false,message='',messageLeft=0;
  const mobile=()=>document.body.classList.contains('touch-device');
  function wake(){if(muted)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){}}
  function tone(frequency,duration=.12){if(muted||!audio||s.mode==='instructions')return;try{const o=audio.createOscillator(),v=audio.createGain(),now=audio.currentTime;o.type='sine';o.frequency.setValueAtTime(frequency,now);o.frequency.exponentialRampToValueAtTime(frequency*.65,now+duration);v.gain.setValueAtTime(.045,now);v.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(v).connect(audio.destination);o.start();o.stop(now+duration);}catch(_){}}
  function release(){for(const key of Object.keys(input))input[key]=key.startsWith('touch')?0:false;$('brake').setAttribute('aria-pressed','false');}
  function clearInput(){release();window.dispatchEvent(new Event('vibecade:reset-input'));}
  function resetCamera(){const p=R.project(s.player.x,s.player.y,s.player.z);camera.x=p.x;camera.y=p.y;camera.zoom=mobile()?1.62:1.48;}
  function rebuild(){const scale=mobile()?1:Math.min(2,Math.max(1.5,devicePixelRatio||1));canvas.width=960*scale;canvas.height=600*scale;g.setTransform(scale,0,0,scale,0,0);art=A.prepare(s.course,mobile());resetCamera();dirty=true;}
  function start(level,score=s.score||0){
    clearInput();Object.assign(s,P.create(R.levels[level-1],level,score));message=s.course.tip;messageLeft=9;
    $('result-modal').classList.remove('is-visible');$('pause').textContent='Pause';$('touch-pause').textContent='PAUSE';rebuild();hud();
    if(!$('instruction-modal').classList.contains('is-visible'))canvas.focus({preventScroll:true});
  }
  function hud(){
    if(!s.course)return;$('level').textContent=`${s.level} / 7`;$('beacons').textContent=`${s.collected} / 3`;$('lives').textContent=s.lives;$('time').textContent=P.remaining(s).toFixed(1);$('score').textContent=s.score.toLocaleString();
    $('time').classList.toggle('low',P.remaining(s)<15);$('lives').classList.toggle('low',s.lives<2);
    $('status').textContent=messageLeft>0?message:`${s.collected<3?`Next: beacon ${s.collected+1}`:'All beacons lit. Find the finish.'} · SCENIC = wide / long · EXPRESS = narrow / fast · ${s.braking?'BRAKING':'Hold BRAKE before turns.'}`;
    A.minimap(map,s,art);
  }
  function result(won,reason){
    clearInput();$('result-title').textContent=won?(s.level===7?'The citadel is yours.':`${s.course.name} complete.`):(reason||'Out of marbles.');
    $('result-text').textContent=won?`${s.elapsed.toFixed(1)}s rolling + ${s.penalty}s penalties · ${s.falls} falls · ${s.railRides} rail rides · ${s.launches} launches. Bonus ${s.bonus}. ${s.level===7?'Seven worlds conquered. Try a different route next time.':'Take your rhythm into the next world.'}`:`${s.collected} of 3 beacons lit. Retry restores this course's starting score, marbles, and clock.`;
    $('next').hidden=!won||s.level===7;$('retry').hidden=won;$('result-modal').classList.add('is-visible');(won?(s.level<7?$('next'):$('again')):$('retry')).focus();dirty=true;hud();
  }
  function events(){for(const e of s.events){
    if(e.text){message=e.text;messageLeft=e.type==='rail'?5:3.5;}
    if(e.type==='beacon')tone(540+s.collected*100,.2);if(e.type==='bump'||e.type==='acid')tone(190);if(e.type==='launch')tone(780,.3);if(e.type==='land')tone(380,.15);if(e.type==='fall')tone(120,.3);
    if(e.type==='respawn')clearInput();if(e.type==='clear'||e.type==='lost')result(e.type==='clear',e.text);
  }s.events.length=0;}
  function updateCamera(dt){
    const p=s.player,q=R.project(p.x,p.y,p.z),lead=R.project(p.vx,p.vy,0),smooth=1-Math.exp(-dt*(reduced?15:7));let zoom=mobile()?1.62:1.48;
    if(s.flight){const n=s.flight.launcher.to,landing=R.project(n.x,n.y,n.z),dx=Math.abs(landing.x-q.x),dy=Math.abs(landing.y-q.y);zoom=Math.min(zoom,780/(dx+160),440/(dy+140));q.x=(q.x+landing.x)/2;q.y=(q.y+landing.y)/2;lead.x=0;lead.y=0;}
    camera.x=R.mix(camera.x,q.x+lead.x*.16,smooth);camera.y=R.mix(camera.y,q.y+lead.y*.16,smooth);camera.zoom=R.mix(camera.zoom,zoom,smooth);
  }
  function update(dt){if(s.mode!=='playing'||mobile()&&innerHeight>innerWidth)return;
    P.step(s,{x:(input.right?1:0)-(input.left?1:0)+input.touchX,y:(input.down?1:0)-(input.up?1:0)+input.touchY,brake:input.brake},dt);events();updateCamera(dt);messageLeft=Math.max(0,messageLeft-dt);hudClock+=dt;if(hudClock>.1){hud();hudClock=0;}dirty=true;
  }
  function draw(){if(!dirty)return;A.render(g,s,art,camera,mobile(),reduced);dirty=false;}
  function help(){if($('instruction-modal').classList.contains('is-visible'))return;returnMode=s.mode;clearInput();s.mode='instructions';$('result-modal').classList.remove('is-visible');$('instruction-modal').classList.add('is-visible');$('instruction-close').textContent='BACK TO THE CIRCUIT';$('instruction-close').focus();dirty=true;}
  function dismiss(){try{sessionStorage.setItem(session,'seen');}catch(_){}$('instruction-modal').classList.remove('is-visible');s.mode=returnMode;if(['cleared','lost'].includes(s.mode))$('result-modal').classList.add('is-visible');clearInput();wake();if(['cleared','lost'].includes(s.mode))$('result-modal').querySelector('button:not([hidden])').focus();else canvas.focus();dirty=true;hud();}
  function pause(){if(!['playing','paused'].includes(s.mode))return;s.mode=s.mode==='playing'?'paused':'playing';clearInput();$('pause').textContent=s.mode==='paused'?'Resume':'Pause';$('touch-pause').textContent=s.mode==='paused'?'RESUME':'PAUSE';if(s.mode==='playing')canvas.focus({preventScroll:true});dirty=true;hud();}
  function restart(){const blocked=$('instruction-modal').classList.contains('is-visible');start(1,0);if(blocked){s.mode='instructions';returnMode='playing';$('instruction-close').focus();}dirty=true;}
  function mute(){muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on';$('touch-sound').textContent=muted?'MUTED':'SOUND';if(!muted)wake();}
  const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
  document.addEventListener('keydown',e=>{if(!keys[e.code]&&!['Space','KeyP','KeyR','KeyM','Escape'].includes(e.code))return;if(e.target instanceof HTMLButtonElement&&e.code==='Space')return;e.preventDefault();if(e.code==='KeyR'){if(!e.repeat)restart();return;}if(e.code==='KeyM'){if(!e.repeat)mute();return;}if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat)pause();return;}if(s.mode!=='playing')return;wake();if(keys[e.code])input[keys[e.code]]=true;if(e.code==='Space')input.brake=true;});
  document.addEventListener('keyup',e=>{if(keys[e.code])input[keys[e.code]]=false;if(e.code==='Space')input.brake=false;});
  $('instruction-close').onclick=dismiss;$('help-button').onclick=$('result-help').onclick=help;$('pause').onclick=$('touch-pause').onclick=pause;$('reset').onclick=$('again').onclick=restart;$('retry').onclick=()=>{start(s.level,s.baseScore);wake();};$('next').onclick=()=>{start(s.level+1);wake();};$('sound').onclick=$('touch-sound').onclick=mute;
  const brake=$('brake');brake.addEventListener('pointerdown',e=>{e.preventDefault();if(s.mode!=='playing')return;brake.setPointerCapture(e.pointerId);input.brake=true;brake.setAttribute('aria-pressed','true');wake();});for(const type of['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(type,()=>{input.brake=false;brake.setAttribute('aria-pressed','false');});
  window.VibeCadeJoystick(document.querySelector('[data-joystick]'),{mode:'analog',profile:'precision',onChange:(x,y)=>{input.touchX=s.mode==='playing'?x:0;input.touchY=s.mode==='playing'?y:0;if(x||y)wake();}});
  $('vibecade-options')?.addEventListener('toggle',e=>{if(e.newState==='open'){optionsPaused=s.mode==='playing';if(optionsPaused)pause();}else if(optionsPaused){optionsPaused=false;if(s.mode==='paused')pause();}});
  window.addEventListener('vibecade:reset-input',release);window.addEventListener('vibecade:restart',e=>{e.preventDefault();restart();});window.addEventListener('blur',()=>{clearInput();if(s.mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(s.mode==='playing')pause();}});window.addEventListener('resize',()=>{rebuild();draw();});
  document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const modal=document.querySelector('.modal.is-visible');if(!modal)return;const buttons=[...modal.querySelectorAll('button:not([hidden])')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}});
  const params=new URLSearchParams(location.search),level=R.clamp(Math.floor(Number(params.get('course'))||1),1,7);start(level,0);try{if(!sessionStorage.getItem(session)){s.mode='instructions';$('instruction-close').focus();}else $('instruction-modal').classList.remove('is-visible');}catch(_){s.mode='instructions';$('instruction-close').focus();}
  function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(!manual)update(dt);draw();requestAnimationFrame(frame);}hud();draw();requestAnimationFrame(frame);
  if(params.has('test'))window.__marbleTest={state:s,input,rules:R,physics:P,camera,start,step:dt=>update(dt),fall:reason=>{P.lose(s,reason||'TEST FALL');events();},finish:won=>{P.finish(s,won);events();},manual:v=>{manual=v;},draw:()=>{hud();dirty=true;draw();},snapCamera:()=>{resetCamera();dirty=true;draw();},muted:()=>muted,remaining:()=>P.remaining(s),help};
})();

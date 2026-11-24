(() => {
  'use strict';
  const E=window.BigTopEngine,A=window.BigTopArt,$=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
  const params=new URLSearchParams(location.search),testing=params.get('test')==='1',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let s=E.create(testing?Math.max(1,Math.min(7,Number(params.get('level'))||1)):1),paused=false,modal=true,sound=false,audio=null,dirty=true,last=0,acc=0,fx=[],best=0,uiTime=0;
  const keys=new Set(),pointers=new Map();
  try{best=Number(localStorage.getItem('big-top-bound-best'))||0;}catch(_){}
  function beep(freq,duration=.08){if(!sound||modal||paused)return;try{audio??=new AudioContext();audio.resume().catch(()=>{});const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(freq,audio.currentTime);gain.gain.setValueAtTime(.045,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}catch(_){}}
  function inputs(){s.hold=keys.has('jump')||[...pointers.values()].includes('jump');s.reins=keys.has('reins')||[...pointers.values()].includes('reins');$('jump-button').classList.toggle('is-held',s.hold);$('reins-button').classList.toggle('is-held',s.reins);}
  function clear(){keys.clear();const ids=[...pointers.keys()];pointers.clear();for(const id of ids)for(const b of [$('jump-button'),$('reins-button')])try{if(b.hasPointerCapture(id))b.releasePointerCapture(id);}catch(_){}inputs();}
  function updateHud(){
    $('act').textContent=`ACT ${s.level} / 7`;$('progress').textContent=`${s.cleared} / ${s.obstacles.length} cleared`;$('hearts').textContent='♥ '.repeat(s.hearts).trim()||'—';$('hearts').setAttribute('aria-label',`${s.hearts} safety hearts`);$('score').textContent=String(s.score).padStart(6,'0');
    $('cue').textContent=s.invuln>0?'Shake it off — your next leap is a fresh start.':s.reins?(s.slowing?'REINS · slowing the approach':'Release REINS to refill your reserve.'):s.time<4?(s.level===1?'Hold JUMP to soar. The floor triangle suggests your takeoff.':`${s.cfg.name} · ${s.hearts} hearts · ${s.cfg.pairs?'paired hoops':s.cfg.bob?'dancing hoops':s.cfg.high?'high hoops':s.cfg.pots?'braziers':'wide hoops'}`):'Through the hoops. Over the fire. Keep the applause going.';
    $('pause-button').textContent=paused?'Resume':'Pause';$('touch-pause').textContent=paused?'Resume':'Pause';
  }
  function showInstructions(){clear();modal=true;dirty=true;$('instruction-modal').classList.add('is-visible');document.body.classList.add('modal-open');$('instruction-close').textContent=s.time>0?'Back to the ring':'Enter the ring';$('instruction-close').focus({preventScroll:true});}
  function closeInstructions(){modal=false;dirty=true;acc=0;last=performance.now();$('instruction-modal').classList.remove('is-visible');document.body.classList.remove('modal-open');try{sessionStorage.setItem('big-top-bound-instructions-v1','seen');}catch(_){}canvas.focus({preventScroll:true});}
  function result(){clear();if(s.score>best){best=s.score;try{localStorage.setItem('big-top-bound-best',String(best));}catch(_){}}
    const won=s.state==='won';$('result-kicker').textContent=won?'CURTAIN CALL':'A SECOND CHANCE';$('result-title').textContent=won?(s.level===7?'Standing ovation!':'A splendid act!'):'Dust off the sawdust.';
    $('result-copy').textContent=won?`${s.cleared}/${s.obstacles.length} cleared · ${s.misses} missed · ${s.hearts} hearts left. ${s.level===7?'All seven acts complete! ':''}Score ${s.score.toLocaleString()} · best ${best.toLocaleString()}`:`Act ${s.level}: ${s.cleared}/${s.obstacles.length} cleared. Retry with full hearts; ${s.bank.toLocaleString()} points from earlier acts stay banked.`;
    $('continue-button').textContent=won?(s.level===7?'Play a new show':'Next act'):'Retry this act';$('result').classList.remove('hidden');$('continue-button').focus({preventScroll:true});dirty=true;
  }
  function setAct(level,bank=0){clear();s=E.create(level,bank);fx=[];paused=false;acc=0;dirty=true;$('result').classList.add('hidden');updateHud();canvas.focus({preventScroll:true});}
  function restart(){setAct(1);if(modal)showInstructions();}
  function togglePause(){if(modal||s.state!=='playing')return;clear();paused=!paused;dirty=true;updateHud();$('cue').textContent=paused?'PAUSED · press P or Resume to continue.':$('cue').textContent;}
  $('instruction-close').addEventListener('click',closeInstructions);$('help-button').addEventListener('click',showInstructions);
  $('pause-button').addEventListener('click',togglePause);$('touch-pause').addEventListener('click',togglePause);$('reset-button').addEventListener('click',restart);$('again-button').addEventListener('click',restart);
  $('continue-button').addEventListener('click',()=>{if(s.state==='won')setAct(s.level===7?1:s.level+1,s.level===7?0:s.score);else setAct(s.level,s.bank);});
  function toggleSound(){sound=!sound;for(const id of ['sound-button','touch-sound']){$(id).textContent=sound?'Sound on':'Sound off';$(id).setAttribute('aria-pressed',String(sound));$(id).setAttribute('aria-label',sound?'Disable sound':'Enable sound');}if(sound)beep(440);}
  $('sound-button').addEventListener('click',toggleSound);$('touch-sound').addEventListener('click',toggleSound);
  const jumpCodes=['Space','ArrowUp','KeyW'],reinCodes=['ArrowDown','KeyS'];
  document.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.altKey||event.metaKey)return;
    if(modal){if(event.key==='Escape'&&s.time>0){event.preventDefault();closeInstructions();}return;}
    if(['BUTTON','INPUT'].includes(event.target.tagName)&&['Space','Enter'].includes(event.code))return;
    if(jumpCodes.includes(event.code)||reinCodes.includes(event.code)){event.preventDefault();if(paused||s.state!=='playing')return;const k=jumpCodes.includes(event.code)?'jump':'reins';if(k==='jump'&&!keys.has(k)&&!event.repeat)E.jump(s);keys.add(k);inputs();}
    if(event.repeat)return;
    if(event.code==='KeyP'||event.code==='Escape'){event.preventDefault();togglePause();}
    if(event.code==='KeyR'){event.preventDefault();restart();}if(event.code==='KeyM')toggleSound();if(event.key==='?')showInstructions();
  });
  document.addEventListener('keyup',event=>{if(jumpCodes.includes(event.code))keys.delete('jump');if(reinCodes.includes(event.code))keys.delete('reins');inputs();});
  for(const [id,action] of [['jump-button','jump'],['reins-button','reins']]){
    const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();if(modal||paused||s.state!=='playing'||e.button>0)return;pointers.set(e.pointerId,action);try{b.setPointerCapture(e.pointerId);}catch(_){}if(action==='jump')E.jump(s);inputs();});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{e.preventDefault();pointers.delete(e.pointerId);try{if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);}catch(_){}inputs();});
    b.addEventListener('contextmenu',e=>e.preventDefault());
  }
  window.addEventListener('blur',()=>{clear();if(!modal&&!paused&&s.state==='playing')togglePause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();if(!modal&&!paused&&s.state==='playing')togglePause();}});
  window.addEventListener('vibecade:reset-input',clear);window.addEventListener('vibecade:restart',e=>{e.preventDefault();restart();});
  document.addEventListener('keydown',e=>{const dialog=modal?$('instruction-modal'):s.state!=='playing'?$('result'):null;if(e.key!=='Tab'||!dialog)return;const buttons=[...dialog.querySelectorAll('button')].filter(b=>!b.disabled),first=buttons[0],end=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}});
  function step(dt){E.tick(s,dt);for(const e of s.events){if(e.type==='jump')beep(280);if(e.type==='clear'){beep(e.perfect?880:660);if(fx.length<12)fx.push({x:252,y:330-s.h*.3,life:1,text:e.perfect?'BRAVO! +50':'BEAUTIFUL!',color:'#fff0cd'});}if(e.type==='hit'){beep(120,.2);fx.push({x:252,y:300,life:1,text:'STEADY…',color:'#fff0cd'});}if(e.type==='won'||e.type==='lost')result();}
    for(const p of fx){p.life-=dt;p.y-=dt*34;}fx=fx.filter(p=>p.life>0);uiTime+=dt;if(uiTime>=1/30||s.events.length){updateHud();uiTime=0;}dirty=true;
  }
  function render(){A.draw(ctx,s,fx,reduced);dirty=false;}
  function frame(now){let dt=Math.min(.08,(now-(last||now))/1000);last=now;if(!modal&&!paused&&s.state==='playing'){acc+=dt;for(let n=0;acc>=1/120&&n<10;n++){step(1/120);acc-=1/120;}}else acc=0;if(dirty)render();requestAnimationFrame(frame);}
  try{if(sessionStorage.getItem('big-top-bound-instructions-v1')==='seen'){modal=false;$('instruction-modal').classList.remove('is-visible');}else showInstructions();}catch(_){showInstructions();}
  updateHud();requestAnimationFrame(frame);
  if(testing)window.bigTopTest={get state(){return s;},get paused(){return paused;},get modal(){return modal;},get sound(){return sound;},jump:()=>E.jump(s),load:level=>setAct(level),advance:seconds=>{for(let n=0;n<Math.round(seconds*120);n++)if(!modal&&!paused&&s.state==='playing')step(1/120);render();},render};
})();

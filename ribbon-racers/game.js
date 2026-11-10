(() => {
 'use strict';
 const E=RibbonEngine,$=id=>document.getElementById(id),canvas=document.querySelector('canvas'),g=canvas.getContext('2d'),modal=$('instruction-modal'),result=$('result');
 const test=new URLSearchParams(location.search).has('test');let s=E.create(),bank=0,paused=true,manual=false,last=0,paint=true,sound=false,audio=null,effects=[],joy=null;
 const storage={get(){try{return sessionStorage.getItem('ribbon-racers-instructions-v1');}catch{return null;}},set(){try{sessionStorage.setItem('ribbon-racers-instructions-v1','seen');}catch{}}};
 function beep(hz=.3){if(!sound||paused)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(hz===.3?520:hz,audio.currentTime);gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.13);}catch{}}
 function clearInput(){s.queue=[];s.braking=false;$('brake').classList.remove('held');joy?.reset?.();}
 function label(id,value){const node=$(id),text=String(value);if(node.textContent!==text)node.textContent=text;}
 function hud(){const c=E.levels[s.level-1];label('level',String(s.level).padStart(2,'0')+' / 07');label('rivals',s.riders.slice(1).filter(r=>r.alive).length+' / '+c.rivals);label('patches',s.patches);label('score',(bank+s.score).toLocaleString());$('charge').value=s.brake;label('message',s.brakeLocked&&s.braking?'BRAKE EMPTY · Release to recharge.':s.last);}
 function draw(){RibbonArt.render(g,s,effects);hud();paint=false;}
 function finish(){if(s.status==='playing')return;clearInput();result.hidden=false;$('result-tag').textContent=s.status==='clear'?(s.level===7?'GRAND PRIX WON':'HEAT COMPLETE'):'RIBBON COLLISION';$('result-title').textContent=s.status==='clear'?(s.level===7?'A perfect finish.':'The rink is yours.'):'End of the line.';$('result-copy').textContent=E.levels[s.level-1].name+' · '+s.time.toFixed(1)+' seconds · '+s.used+' patches used · '+(bank+s.score).toLocaleString()+' points.';$('next').hidden=s.status!=='clear'||s.level===7;$('retry').hidden=s.status==='clear';$('new-run').hidden=false;($('next').hidden?$('retry').hidden?$('new-run'):$('retry'):$('next')).focus();}
 function simulate(dt){if(paused||s.status!=='playing')return;E.step(s,dt);for(const event of s.events){beep(event.id===1?160:730);if(!matchMedia('(prefers-reduced-motion:reduce)').matches)for(let i=0;i<12&&effects.length<64;i++)effects.push({x:event.x*20+10,y:event.y*20+10,vx:Math.cos(i*2.4)*65,vy:Math.sin(i*2.4)*65,life:.8,id:event.id});}s.events.length=0;for(const e of effects){e.x+=e.vx*dt;e.y+=e.vy*dt;e.life-=dt;}effects=effects.filter(e=>e.life>0);paint=true;finish();}
 function focusInstructions(){$('instruction-title').focus({preventScroll:true});modal.querySelector('.modal-card').scrollTop=0;}
 function show(){paused=true;window.dispatchEvent(new Event('vibecade:reset-input'));clearInput();modal.classList.add('is-visible');modal.hidden=false;result.hidden=true;$('instruction-close').textContent=storage.get()?'Return to the grid':'Take the grid';focusInstructions();}
 function dismiss(){storage.set();modal.classList.remove('is-visible');modal.hidden=true;paused=false;if(s.status!=='playing')finish();else canvas.focus({preventScroll:true});last=performance.now();paint=true;}
 function load(level=1,resetBank=false){if(resetBank)bank=0;window.dispatchEvent(new Event('vibecade:reset-input'));clearInput();s=E.create(level);effects=[];result.hidden=true;paint=true;if(!modal.classList.contains('is-visible'))paused=false;draw();}
 function reset(){load(1,true);}
 function toggleSound(){sound=!sound;for(const id of ['sound','touch-sound'])$(id).setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'Sound on':'Sound off';beep(700);}
 $('instruction-close').addEventListener('click',dismiss);$('help-button').addEventListener('click',show);$('pause').addEventListener('click',show);$('review').addEventListener('click',show);$('restart-button').addEventListener('click',reset);$('sound').addEventListener('click',toggleSound);$('touch-sound').addEventListener('click',toggleSound);$('new-run').addEventListener('click',reset);$('retry').addEventListener('click',()=>load(s.level));$('next').addEventListener('click',()=>{bank+=s.score;load(s.level+1);});
 const keydirs={ArrowRight:0,d:0,ArrowDown:1,s:1,ArrowLeft:2,a:2,ArrowUp:3,w:3};
 window.addEventListener('keydown',e=>{
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  const activeModal=modal.classList.contains('is-visible')?modal:!result.hidden?result:null;
  if(activeModal){if(activeModal===result&&key==='r'){e.preventDefault();reset();return;}if(e.key==='Tab'){const focus=[...activeModal.querySelectorAll('button:not([hidden]),a')],i=focus.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();focus.at(-1).focus();}else if(!e.shiftKey&&i===focus.length-1){e.preventDefault();focus[0].focus();}}return;}
  if(key in keydirs){e.preventDefault();if(!e.repeat&&!paused)E.turn(s,keydirs[key]);}
  if(e.code==='Space'){e.preventDefault();if(!paused)s.braking=true;}
  if(!e.repeat&&key==='r'){e.preventDefault();reset();}if(!e.repeat&&key==='m')toggleSound();if(!e.repeat&&(key==='p'||key==='Escape')){e.preventDefault();show();}
 });
 window.addEventListener('keyup',e=>{if(e.code==='Space')s.braking=false;});
 const brake=$('brake');brake.addEventListener('pointerdown',e=>{e.preventDefault();if(paused||s.status!=='playing')return;brake.setPointerCapture(e.pointerId);s.braking=true;brake.classList.add('held');});for(const event of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(event,()=>{s.braking=false;brake.classList.remove('held');});
 window.addEventListener('blur',()=>{clearInput();if(!paused&&s.status==='playing')show();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(!paused&&s.status==='playing')show();}});window.addEventListener('vibecade:reset-input',clearInput);window.addEventListener('vibecade:restart',e=>{e.preventDefault();reset();});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());document.querySelector('.touch-controls').addEventListener('contextmenu',e=>e.preventDefault());
 function bind(){if(!window.VibeCadeJoystick){setTimeout(bind,50);return;}joy=window.VibeCadeJoystick(document.querySelector('.virtual-joystick'),{mode:'cardinal',onChange(x,y){if(paused||!x&&!y)return;E.turn(s,Math.abs(x)>Math.abs(y)?x>0?0:2:y>0?1:3);}});}
 if(storage.get()){modal.classList.remove('is-visible');modal.hidden=true;paused=false;}else focusInstructions();bind();draw();
 function frame(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!manual)simulate(dt);if(paint||!paused&&s.status==='playing')draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
 if(test)window.ribbonTest={manual(v){manual=v;},state(){return JSON.parse(JSON.stringify({...s,board:Array.from(s.board),paused,bank,sound}));},level(l,keepBank=false){load(l,!keepBank);},step(seconds){for(let i=0;i<Math.round(seconds*120);i++)simulate(1/120);draw();},turn(d){E.turn(s,d);},autodir(limit=1500){return E.choose(s,s.riders[0],limit,true);}};
})();

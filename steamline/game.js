(()=>{
 'use strict';
 const $=id=>document.getElementById(id),R=SteamlineRules,D=R.D,key=([x,y])=>y*8+x,xy=k=>[k%8,Math.floor(k/8)],inside=(x,y)=>x>=0&&x<8&&y>=0&&y<6;
 const state={level:1,score:0,bank:0,mode:'instructions',board:[],cursor:0,shape:'I',rotation:1,elapsed:0,clock:0,flow:false,head:0,entry:3,progress:0,visited:[],served:new Set(),seals:3,holds:2,hold:0,leak:0,leaks:0,placed:0,early:0},cells=[];
 let manual=false,dirty=true,last=0,visual=0,muted=false,audio=null,returnMode='playing',sessionSeen=false,previousFocus=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function tone(f=360,d=.07){if(muted||!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,audio.currentTime);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d);}
 function wake(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){} }
 const say=t=>{$('status').textContent=t;};
 function pipeSVG(kind,r,wet=false,amount=1,entry=null,valve=null){
  const con=R.connections(kind,r),ends=[[40,0],[80,40],[40,80],[0,40]];let a=con[0],b=con[1];if(entry!==null&&con.includes(entry)){a=entry;b=con.find(d=>d!==entry);}const p=ends[a],q=ends[b];const path=kind==='I'?`M${p} L${q}`:`M${p} Q40,40 ${q}`;
  const bolts=con.map(d=>{const [x,y]=ends[d];return `<g transform="translate(${x},${y}) rotate(${d*90})"><rect x="-16" y="-6" width="32" height="12" rx="3" fill="#5b3c2c"/><rect x="-14" y="-5" width="28" height="9" rx="2" fill="#c9995a"/><circle cx="-9" cy="0" r="2" fill="#f2d094"/><circle cx="9" cy="0" r="2" fill="#f2d094"/></g>`;}).join('');
  let arrow='';if(valve!==null){const angle=valve*90;arrow=`<g transform="translate(40,40) rotate(${angle})"><circle r="17" fill="#3d3234" stroke="#f0cf93" stroke-width="2"/><path d="M0,-11 L8,1 H3 V11 H-3 V1 H-8 Z" fill="#f5d899"/></g>`;}
  return `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="${path}" transform="translate(0,3)" fill="none" stroke="#10171b" stroke-width="26"/><path d="${path}" fill="none" stroke="#6a452f" stroke-width="25"/><path d="${path}" fill="none" stroke="#edc480" stroke-width="21"/><path d="${path}" fill="none" stroke="#bc8547" stroke-width="16"/><path d="${path}" fill="none" stroke="#e0ad62" stroke-width="12"/><path d="${path}" fill="none" stroke="#f9dfa0" stroke-opacity=".6" stroke-width="3"/>${wet?`<path d="${path}" pathLength="100" fill="none" stroke="#1c625e" stroke-width="13" stroke-dasharray="${amount*100} 100"/><path d="${path}" pathLength="100" fill="none" stroke="#b6f7df" stroke-width="5" stroke-dasharray="${amount*100} 100"/>`:''}${bolts}${arrow}</svg>`;
 }
 function start(level=1,bank=0){
  const c=R.contracts[level-1];Object.assign(state,{level,bank,score:bank,mode:'playing',board:Array(48).fill(null),cursor:key(c.route[1]),shape:'I',rotation:1,lift:false,elapsed:0,clock:c.headstart,flow:false,rush:false,head:key(c.route[0]),entry:3,progress:0,visited:[],served:new Set(),seals:c.seals,holds:c.holds,hold:0,leak:0,leaks:0,placed:0,early:0});
  for(const at of c.blocks)state.board[key(at)]={block:true};
  for(const v of c.valves){const connections=[v.entry,v.exit];let kind=(v.entry+2)%4===v.exit?'I':'L',r=0;while(r<4&&!connections.every(d=>R.connections(kind,r).includes(d)))r++;state.board[key(v.at)]={kind,r,fixed:true,valve:v.exit,valveEntry:v.entry};}
  const source=key(c.route[0]),drain=key(c.route.at(-1));state.board[source]={kind:'I',r:1,fixed:true,source:true};state.board[drain]={kind:'I',r:1,fixed:true,drain:true};
  $('result').classList.remove('is-visible');$('instruction-modal').classList.remove('is-visible');say(level===1?'Start at the boiler arrow. Choose, rotate, then fit a pipe.':`${c.name} · Visit all rings, then reach the receiver.`);dirty=true;render();cells[state.cursor].focus({preventScroll:true});
 }
 function shape(kind){if(state.mode!=='playing')return;state.shape=kind;state.lift=false;dirty=true;tone(240);}
 function rotate(){if(state.mode!=='playing')return;state.rotation=(state.rotation+1)%4;dirty=true;tone(300);}
 function fit(k){
  if(state.mode!=='playing'||k<0||k>=48)return false;state.cursor=k;const tile=state.board[k];if(tile?.block||tile?.fixed||state.visited.includes(k)){say('That fitting is fixed. Work on a dry square ahead of the steam.');dirty=true;return false;}
  if(state.lift){remove();state.lift=false;dirty=true;return true;}
  if(tile){tile.r=(tile.r+1)%4;}else{state.board[k]={kind:state.shape,r:state.rotation};state.placed++;}const plan=inspectRoute(),c=R.contracts[state.level-1];say(plan.ready?'Run ready · every service ring and receiver connected. Use fast flow when ready.':`${plan.pipes}/${c.minimum} fitted pipes · ${plan.rings}/${c.rings.length} rings${plan.end?' · receiver connected; extend the route.':''}`);tone(450+k*3);dirty=true;return true;
 }
 function remove(){if(state.mode!=='playing')return;const k=state.cursor,t=state.board[k];if(t&&!t.fixed&&!t.block&&!state.visited.includes(k)){state.board[k]=null;say('Dry fitting removed. Choose another shape.');tone(190);dirty=true;}}
 function hold(){if(state.mode!=='playing'||!state.holds||state.hold>0)return;state.holds--;state.hold=4;say('Main valve held · 4 seconds to get ahead.');tone(160,.2);dirty=true;}
 function launch(){if(state.mode!=='playing')return;if(state.flow){state.rush=!state.rush;say(state.rush?'Fast flow ×3 · tap again for normal pressure.':'Normal steam flow restored.');return;}state.early=Math.floor(state.clock*10);state.clock=0;beginFlow();dirty=true;}
 function beginFlow(){state.flow=true;state.progress=0;state.visited=[state.head];say('Steam is moving. Stay ahead of the turquoise front.');tone(180,.25);}
 function result(win,reason){
  state.mode=win?'clear':'failed';state.hold=0;dirty=true;
  if(win){const bonus=(state.seals*150+state.holds*100+state.early);state.score+=bonus;say('Contract complete.');$('result-title').textContent=state.level===7?'The city is warm.':'Heat on.';$('result-eyebrow').textContent=state.level===7?'ALL SEVEN CONTRACTS COMPLETE':`CONTRACT ${state.level} COMPLETE`;$('result-detail').textContent=`${state.visited.length} connected pipes · ${state.served.size} rings · ${state.leaks} leaks repaired. Reserve bonus ${bonus}. Total score ${state.score}.`;$('next').textContent=state.level===7?'Clock in again':'Next contract';tone(620,.25);
  }else{say(reason);$('result-title').textContent='Pressure lost.';$('result-eyebrow').textContent=`CONTRACT ${state.level} INCOMPLETE`;$('result-detail').textContent=reason+' Retry restores this contract and its starting score.';$('next').textContent='Retry contract';tone(110,.35);}
  $('result').classList.add('is-visible');$('next').focus({preventScroll:true});
 }
 function leak(reason){
  if(!state.seals){result(false,reason+' No repair seals remain.');return;}state.seals--;state.leaks++;state.leak=5;state.progress=0;say(`${reason} Repair seal engaged · fix the open end within 5 seconds.`);tone(125,.2);dirty=true;
 }
 function step(dt){
  if(state.mode!=='playing'||$('vibecade-options')?.matches(':popover-open'))return;
  const s=state,c=R.contracts[s.level-1];s.elapsed+=dt;
  if(s.hold>0){s.hold=Math.max(0,s.hold-dt);return;}
  if(!s.flow){s.clock=Math.max(0,s.clock-dt);if(s.clock<=0)beginFlow();return;}
  if(s.leak>0){s.leak=Math.max(0,s.leak-dt);return;}
  s.progress+=dt*(s.rush?3:1)/c.interval;if(s.progress<1)return;s.progress-=1;
  const t=s.board[s.head],con=R.connections(t.kind,t.r),exit=t.valve??con.find(d=>d!==s.entry),[x,y]=xy(s.head),nx=x+D[exit][0],ny=y+D[exit][1];
  if(!inside(nx,ny)){leak('The pipe runs off the board.');return;}const k=ny*8+nx,next=s.board[k],incoming=(exit+2)%4;
  if(!next||next.block||!R.connections(next.kind,next.r).includes(incoming)){leak('Open end ahead.');return;}
  if(next.valve!==undefined&&next.valveEntry!==incoming){leak('One-way valve entered against its arrow.');return;}
  if(s.visited.includes(k)){result(false,'The run loops into a filled pipe. Build a continuous route without revisiting wet fittings.');return;}
  s.head=k;s.entry=incoming;s.visited.push(k);s.score+=50;
  if(c.rings.some(at=>key(at)===k)){s.served.add(k);s.score+=200;say(`Service ring connected · ${s.served.size} / ${c.rings.length}.`);tone(680,.12);}
  if(next.drain){if(s.served.size<c.rings.length){result(false,'The receiver was reached before every service ring. Route through all numbered rings.');}else if(s.visited.length<c.minimum){result(false,`The run needs ${c.minimum} pipes; this route had ${s.visited.length}. Add a detour before reaching the receiver.`);}else result(true);}
  dirty=true;
 }
 function instructions(){if($('instruction-modal').classList.contains('is-visible'))return;previousFocus=document.activeElement;returnMode=state.mode;state.mode='instructions';$('result').classList.remove('is-visible');$('instruction-modal').classList.add('is-visible');$('instruction-close').textContent=sessionSeen?'Return to workshop':'Clock in · start contract';$('instruction-close').focus({preventScroll:true});dirty=true;}
 function closeInstructions(){wake();sessionSeen=true;try{sessionStorage.setItem('steamline-instructions-v1','seen');}catch(_){}$('instruction-modal').classList.remove('is-visible');state.mode=returnMode;if(['clear','failed'].includes(state.mode))$('result').classList.add('is-visible');dirty=true;render();if(state.mode==='playing')cells[state.cursor].focus({preventScroll:true});else if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function pause(){if(state.mode==='playing'){state.mode='paused';say('Workshop paused · press Pause or P to resume.');}else if(state.mode==='paused'){state.mode='playing';say('Back on shift. Stay ahead of the steam.');}dirty=true;render();}
 function reset(){const blocked=state.mode==='instructions';start(1,0);if(blocked){returnMode='playing';state.mode='instructions';$('instruction-modal').classList.add('is-visible');}dirty=true;render();}
 function sound(){wake();muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!muted));tone(480);}
 function inspectRoute(){const s=state,c=R.contracts[s.level-1],seen=new Set();let k=key(c.route[0]),entry=3,rings=0,end=false;while(!seen.has(k)){const t=s.board[k];if(!t||t.block||!R.connections(t.kind,t.r).includes(entry)||(t.valve!==undefined&&t.valveEntry!==entry))break;seen.add(k);if(c.rings.some(at=>key(at)===k))rings++;if(t.drain){end=true;break;}const exit=t.valve??R.connections(t.kind,t.r).find(d=>d!==entry),[x,y]=xy(k),nx=x+D[exit][0],ny=y+D[exit][1];if(!inside(nx,ny))break;k=ny*8+nx;entry=(exit+2)%4;}return{pipes:seen.size,rings,end,ready:end&&rings===c.rings.length&&seen.size>=c.minimum};}
 function render(){
  const s=state,c=R.contracts[s.level-1];
  if(dirty){for(let k=0;k<48;k++){
   const el=cells[k],t=s.board[k],ring=c.rings.findIndex(at=>key(at)===k),wet=s.visited.includes(k),head=s.head===k&&s.flow;
   el.className='cell'+(t?.block?' block':'')+(t?.source?' source':'')+(t?.drain?' drain':'')+(ring>=0?' ring':'')+(s.served.has(k)?' served':'')+(wet?' wet':'')+(head?' head':'')+(head&&s.leak?' leak':'')+(s.cursor===k?' cursor':'');
   el.tabIndex=s.cursor===k?0:-1;el.setAttribute('aria-label',`Column ${k%8+1}, row ${Math.floor(k/8)+1}: ${t?.block?'blocked':t?.source?'boiler':t?.drain?'receiver':t?.valve!==undefined?'fixed one-way valve':t?t.kind==='I'?'straight pipe':'elbow pipe':'empty'}${ring>=0?`, service ring ${ring+1}`:''}${wet?', steam filled':''}`);
   const artKey=[t?.kind,t?.r,t?.block,t?.source,t?.drain,t?.valve,wet,head,ring,s.served.has(k)].join('|');
   if(el.dataset.artKey===artKey)continue;el.dataset.artKey=artKey;
   el.innerHTML=t?.block?'<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="13" y="13" width="54" height="54" rx="5" fill="#38363d" stroke="#a78a63"/><path d="M24,24 L56,56 M56,24 L24,56" stroke="#181e26" stroke-width="8"/><circle cx="19" cy="19" r="3" fill="#c9aa79"/><circle cx="61" cy="61" r="3" fill="#c9aa79"/></svg>':(t?pipeSVG(t.kind,t.r,wet,head?Math.max(.1,s.progress):1,head?s.entry:null,t.valve):'')+(ring>=0?`<span class="mark">${s.served.has(k)?'✓':ring+1}</span>`:'')+(t?.source?'<span class="tag">BOILER →</span>':t?.drain?'<span class="tag">RECEIVER →</span>':'');
  }
  for(const b of $('pieces').children){b.setAttribute('aria-pressed',String(b.dataset.shape===s.shape));label(b,pipeSVG(b.dataset.shape,s.rotation)+`<span>${b.dataset.shape==='I'?'1 · STRAIGHT':'2 · ELBOW'}</span>`);}
  const plan=inspectRoute();$('route-check').textContent=`${plan.pipes} fitted pipes · ${plan.rings}/${c.rings.length} rings${plan.ready?' · READY':plan.end?' · extend the route':''}`;$('route-check').classList.toggle('ready',plan.ready);document.querySelector('.city').classList.toggle('warm',s.served.size>0||s.mode==='clear');$('lift').setAttribute('aria-pressed',String(s.lift));$('board').classList.toggle('lifting',s.lift);
  for(const at of [c.route[0],c.route.at(-1)])if(!cells[key(at)].querySelector('.endpoint')){const endpoint=document.createElement('span');endpoint.className='endpoint';cells[key(at)].append(endpoint);}
  $('level').textContent=`0${s.level} / 07`;$('length').textContent=`${plan.pipes} / ${c.minimum}`;$('rings').textContent=`${s.served.size} / ${c.rings.length}`;$('seals').textContent=s.seals;$('score').textContent=s.score;$('contract-name').textContent=c.name;$('pace').textContent=`${c.interval.toFixed(2)}s / PIPE`;$('pause').textContent=s.mode==='paused'?'Resume':'Pause';dirty=false;
  }
  $('valve').disabled=!s.holds||s.hold>0||s.mode!=='playing';label($('valve'),`HOLD STEAM <span>${s.hold>0?s.hold.toFixed(1)+'s HELD':s.holds+' × 4s'}</span>`);$('launch').disabled=s.mode!=='playing';label($('launch'),s.flow?(s.rush?'NORMAL FLOW <span>NOW RUNNING ×3</span>':'FAST FLOW ×3 <span>TAP WHEN YOUR RUN IS READY</span>'):'OPEN BOILER <span>EARLY START BONUS</span>');$('launch').setAttribute('aria-pressed',String(s.rush));
  $('pressure-label').textContent=s.mode==='paused'?'WORKSHOP PAUSED':s.hold>0?`VALVE HELD ${s.hold.toFixed(1)}s`:s.leak>0?`REPAIR ${s.leak.toFixed(1)}s`:s.flow?'STEAM IN TRANSIT':`BOILER IN ${s.clock.toFixed(1)}s`;
  $('pressure-fill').style.width=`${100*(s.flow?s.progress:1-s.clock/c.headstart)}%`;
  $('needle').setAttribute('transform',`rotate(${-110+220*(s.flow?(s.leak>0?1:.5+s.progress*.25):1-s.clock/c.headstart)} 75 56)`);
  // Only the active pipe's interior changes between tile transitions.
  if(s.flow&&s.mode==='playing')for(const path of cells[s.head].querySelectorAll('[pathLength]'))path.setAttribute('stroke-dasharray',`${Math.max(.1,s.progress)*100} 100`);
 }
 function label(el,html){if(el.dataset.label===html)return;el.dataset.label=html;el.innerHTML=html;}
 for(let k=0;k<48;k++){const el=document.createElement('button');el.type='button';el.className='cell';el.addEventListener('click',()=>{wake();fit(k);render();});el.addEventListener('contextmenu',e=>{e.preventDefault();if(state.mode==='playing'){state.cursor=k;remove();render();}});cells.push(el);$('board').append(el);}
 for(const kind of ['I','L']){const b=document.createElement('button');b.type='button';b.dataset.shape=kind;b.setAttribute('aria-label',kind==='I'?'Select straight pipe':'Select elbow pipe');b.addEventListener('click',()=>{shape(kind);render();});$('pieces').append(b);}
 $('rotate').onclick=()=>{rotate();render();};$('lift').onclick=()=>{if(state.mode!=='playing')return;state.lift=!state.lift;say(state.lift?'Lift tool ready · tap a dry pipe to remove it.':'Fitting tool ready.');dirty=true;render();};$('valve').onclick=()=>{wake();hold();render();};$('launch').onclick=()=>{wake();launch();render();};$('sound').onclick=sound;$('pause').onclick=pause;$('reset').onclick=reset;$('help-button').onclick=instructions;$('instruction-close').onclick=closeInstructions;$('again').onclick=reset;$('result-help').onclick=instructions;
 $('next').onclick=()=>{wake();if(state.mode==='failed')start(state.level,state.bank);else if(state.level===7)start(1,0);else start(state.level+1,state.score);cells[state.cursor].focus({preventScroll:true});};
 document.addEventListener('keydown',e=>{
  if($('vibecade-options')?.matches(':popover-open'))return;
  if(state.mode==='instructions'){if(e.code==='Escape'&&sessionSeen){e.preventDefault();closeInstructions();}if(e.code==='Tab'){const card=$('instruction-modal'),buttons=[...card.querySelectorAll('button')];if(buttons.length===1){e.preventDefault();buttons[0].focus();}}return;}
  // Leave native Enter/Space activation on toolbar and results buttons intact.
  if(['Space','Enter'].includes(e.code)&&e.target.closest('button')&&!e.target.classList.contains('cell'))return;
  if(['Space','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Backspace'].includes(e.code))e.preventDefault();
  if(e.repeat)return;wake();if(e.code==='KeyM'){sound();return;}if(e.code==='KeyR'){reset();return;}if(e.code==='KeyP'){pause();return;}if(state.mode!=='playing')return;
  const dirs={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
  if(dirs[e.code]!==undefined){e.preventDefault();const [x,y]=xy(state.cursor),d=D[dirs[e.code]],nx=x+d[0],ny=y+d[1];if(inside(nx,ny)){state.cursor=ny*8+nx;cells[state.cursor].focus({preventScroll:true});dirty=true;}}
  else if(e.code==='Digit1')shape('I');else if(e.code==='Digit2')shape('L');else if(e.code==='KeyX')rotate();else if(e.code==='Space')fit(state.cursor);else if(e.code==='Backspace')remove();else if(e.code==='KeyV')hold();else if(e.code==='Enter')launch();render();
 });
 window.addEventListener('blur',()=>{if(state.mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='playing')pause();});window.addEventListener('vibecade:restart',e=>{e.preventDefault();reset();});
 function frame(t){const dt=Math.min(.1,(t-last)/1000||0);last=t;if(!manual){step(dt);if(state.mode==='playing'||dirty){if(t-visual>=(reduced?66:33)){render();visual=t;}}}requestAnimationFrame(frame);}
 start();try{sessionSeen=sessionStorage.getItem('steamline-instructions-v1')==='seen';}catch(_){}if(!sessionSeen)instructions();
 if(new URLSearchParams(location.search).get('test')==='1')window.__steamTest={state,rules:R,start,step:t=>{for(let n=0;n<t;n+=1/120)step(Math.min(1/120,t-n));dirty=true;render();},manual:v=>{manual=v;},fit,shape,rotate,remove,hold,launch,render:()=>{dirty=true;render();},snapshot:()=>({...state,served:[...state.served]})};
 requestAnimationFrame(frame);
})();

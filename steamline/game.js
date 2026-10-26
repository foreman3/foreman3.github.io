(()=>{
  'use strict';
  const R=SteamlineRules,S=SteamlineSave,A=SteamlineArt,$=id=>document.getElementById(id),cells=[];
  let storage=null;try{storage=localStorage;}catch(_){}
  const loaded=S.read(storage);let campaign=loaded.campaign,saveTimer=null,saveOK=!!storage,pendingImport=null;
  const state={level:1,board:[],mode:'plan',cursor:0,shape:'I',rotation:1,lift:false,undo:[],redo:[],plan:null,flow:null,index:0,progress:0,paused:false,fast:campaign.settings.fast,dirty:true,highlight:null,tests:0,blocked:false};
  let manual=false,last=0,visual=0,audio=null,returnMode='plan',ledgerReturn='plan',previousFocus=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,c=()=>R.contracts[state.level-1],say=text=>{$('status').textContent=text;},editable=()=>['plan','flow'].includes(state.mode);
  function tone(f=400){if(campaign.settings.muted||!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.1);}
  function wake(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){}}
  function persist(immediate=false){
    campaign.current=state.level;campaign.drafts[state.level]=S.encode(state.board);campaign.undo=state.undo.slice(-20);campaign.settings.fast=state.fast;
    campaign.tools={shape:state.shape,rotation:state.rotation,cursor:state.cursor};
    if(saveTimer)clearTimeout(saveTimer);
    if(immediate){saveTimer=null;saveOK=S.write(storage,campaign);$('save-state').textContent=saveOK?'Saved':'Not saved';$('save-state').classList.toggle('warning',!saveOK);}
    else{$('save-state').textContent='Saving…';saveTimer=setTimeout(()=>persist(true),120);}
  }
  function baseStart(level,restore=true,bypass=false){
    if(!bypass&&level>campaign.unlocked)return;
    level=Math.max(1,Math.min(50,level));Object.assign(state,{level,board:S.hydrate(R,R.contracts[level-1],restore?campaign.drafts[level]:null),mode:'plan',cursor:R.key(R.contracts[level-1].route[1]),lift:false,undo:[],redo:[],flow:null,index:0,progress:0,paused:false,dirty:true,highlight:null,tests:0,blocked:false});
    for(const el of document.querySelectorAll('.modal'))el.classList.remove('is-visible');
    state.plan=R.trace(c(),state.board);say(c().lesson);render();cells[state.cursor].focus({preventScroll:true});
  }
  function openLevel(level){persist(true);baseStart(level);persist(true);}
  const snapshot=()=>S.encode(state.board);
  function editStart(){if(!editable())return false;if(state.mode==='flow')stopTest(false);return true;}
  function changed(before,message){
    state.undo.push(before);if(state.undo.length>60)state.undo.shift();state.redo=[];
    state.plan=R.trace(c(),state.board);state.highlight=null;state.blocked=false;state.dirty=true;say(message);persist();render();
  }
  function shape(kind){if(!editable())return;state.shape=kind;state.lift=false;state.dirty=true;render();}
  function rotate(){if(!editable())return;state.rotation=(state.rotation+1)%4;state.lift=false;state.dirty=true;render();tone(320);}
  function fit(k){
    if(!editStart()||k<0||k>=48)return false;state.cursor=k;const tile=state.board[k];
    if(tile?.fixed){say('This brass fitting is anchored. Route into its open ends.');state.highlight=k;state.dirty=true;render();return false;}
    if(state.lift){state.lift=false;return remove(k);}
    const before=snapshot();
    if(tile)state.board[k]={...tile,r:(tile.r+1)%4};
    else{
      const used=state.board.filter(t=>t&&!t.fixed&&t.kind===state.shape).length;
      if(c().budget&&used>=c().budget[state.shape]){say('No '+(state.shape==='I'?'straight':'elbow')+' stock remains. Lift another fitting to refund it.');return false;}
      state.board[k]={kind:state.shape,r:state.rotation};
    }
    tone();changed(before,'Planning · '+c().minimum+' pipe squares needed. No timer, no penalty for experiments.');return true;
  }
  function remove(k=state.cursor){
    if(!editStart()||state.board[k]?.fixed)return false;
    if(!state.board[k]){state.dirty=true;render();return false;}
    const before=snapshot();state.board[k]=null;changed(before,'Fitting lifted. Its stock is available again.');tone(220);return true;
  }
  function undo(redo=false){
    if(!editStart())return;const from=redo?state.redo:state.undo,to=redo?state.undo:state.redo;
    if(!from.length)return;to.push(snapshot());state.board=S.hydrate(R,c(),from.pop());state.plan=R.trace(c(),state.board);state.highlight=null;state.blocked=false;state.dirty=true;persist();say(redo?'Edit restored.':'Edit undone. Take your time.');render();
  }
  function reset(){
    const blocked=!editable(),oldMode=state.mode;if(!blocked)stopTest(false);const before=snapshot();state.board=R.initial(c());state.undo.push(before);state.redo=[];
    state.plan=R.trace(c(),state.board);state.highlight=null;state.flow=null;state.blocked=false;state.index=0;state.progress=0;state.paused=false;state.dirty=true;if(blocked){state.mode=oldMode;returnMode='plan';}else state.mode='plan';
    persist();say('Current board reset. Undo restores your fittings; campaign progress is kept.');render();
  }
  function stopTest(message=true){state.mode='plan';state.flow=null;state.index=0;state.progress=0;state.paused=false;state.blocked=false;state.dirty=true;if(message)say('Back at the workbench. Every fitting is kept.');render();}
  function launch(){
    if(!editable())return;wake();if(state.mode==='flow'){stopTest();return;}
    state.plan=R.trace(c(),state.board);state.flow=state.plan;state.index=0;state.progress=0;state.paused=false;state.blocked=false;state.mode='flow';state.highlight=null;state.tests++;state.dirty=true;
    say('Testing your route · return to the plan at any time.');persist();render();
  }
  function success(){
    const result=state.flow,used=state.board.filter(t=>t&&!t.fixed&&!t.block).length,stars=result.unused===0?(used<=c().par?3:2):1,old=campaign.wins[state.level];
    campaign.wins[state.level]={stars:Math.max(old?.stars||0,stars),best:Math.min(old?.best??Infinity,used)};
    campaign.unlocked=Math.max(campaign.unlocked,Math.min(50,state.level+1));persist(true);
    $('result-title').textContent=state.level===50?'The whole city is warm.':'Heat on.';$('result-eyebrow').textContent=state.level===50?'FIFTY CONTRACTS COMPLETE':'CONTRACT '+state.level+' COMPLETE';
    $('result-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('result-stars').setAttribute('aria-label',stars+' stars');
    $('result-detail').textContent=result.unique.length+' pipe squares · '+c().goals.length+' deliveries · '+used+' loose fittings. '+(stars===3?'An economical route and a clean bench.':result.unused?'Lift unused fittings for another star.':'Try '+c().par+' or fewer loose fittings for the economy star.')+' Attempts and thinking time never cost stars.';
    $('next').textContent=state.level===50?'Open city ledger':'Next contract';state.mode='result';state.dirty=true;render();$('result').classList.add('is-visible');$('next').focus({preventScroll:true});tone(650);
  }
  function step(dt){
    if(state.mode!=='flow'||state.paused)return;state.progress+=dt*(state.fast?3:1)/.42;
    while(state.progress>=1&&state.mode==='flow'){
      state.progress--;state.index++;state.dirty=true;
      if(state.index>=state.flow.steps.length){if(state.flow.ok)success();else{const failure=state.flow;stopTest(false);state.blocked=true;state.highlight=failure.at;state.dirty=true;say('Test stopped · '+failure.message+' Your board is kept.');render();tone(140);}}
    }
  }
  function inspect(){if(!editable())return;state.highlight=state.plan.ok?null:state.plan.at;state.dirty=true;say(state.plan.ok?'Route connected. Test the flow to deliver heat and unlock the next contract.':state.plan.message+' '+c().lesson);render();}
  function guide(){
    const features=['Plan without a clock. Minimum '+c().minimum+' distinct pipe squares, including fixed fittings.','The workshop boiler follows Test Flow. Its wheel and lights show flow; on heat puzzles its gauge follows remaining heat.'];
    if(c().goals.some(g=>g.type==='ring'))features.push(c().ordered?'Numbered rings must be visited 1 → 2 → 3.':'Visit every numbered service ring in any order.');
    if(c().goals.some(g=>g.type==='valve'))features.push('Every arrow valve must be visited from its tail.');
    if(c().budget)features.push('Stock: '+c().budget.I+' straights, '+c().budget.L+' elbows. Lifting refunds stock.');
    if(c().bridge!==null)features.push('Cross the bridge on BOTH axes. Its lanes do not join or turn.');
    if(c().ports)features.push('Tunnel A is an entrance; A′ is its distant exit. Follow the open ends.');
    if(c().goals.some(g=>g.type==='gate'))features.push('Visit switch S before passing gate G.');
    if(c().capacity)features.push('H refills '+c().capacity+' heat. Each later square costs one; receiver needs at least one.');
    if(c().goals.some(g=>g.type==='radiator'))features.push('Each radiator R additionally needs and consumes three heat.');
    $('level-guide').replaceChildren(...features.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));
  }
  function dialog(id){
    if(id==='ledger'&&!['ledger','import'].includes(state.mode))ledgerReturn=state.mode;
    previousFocus=document.activeElement;returnMode=state.mode;for(const el of document.querySelectorAll('.modal'))el.classList.remove('is-visible');
    state.mode=id==='instruction-modal'?'instructions':id==='ledger'?'ledger':'import';
    if(id==='instruction-modal')guide();if(id==='ledger')renderLedger();
    $(id).classList.add('is-visible');$(id).querySelector('button')?.focus({preventScroll:true});state.dirty=true;render();
  }
  function closeDialog(){
    for(const el of document.querySelectorAll('.modal'))el.classList.remove('is-visible');
    state.mode=returnMode;if(state.mode==='result')$('result').classList.add('is-visible');if(state.mode==='ledger'){$('ledger').classList.add('is-visible');returnMode=ledgerReturn;}state.dirty=true;render();
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});else cells[state.cursor].focus({preventScroll:true});
  }
  const instructions=()=>dialog('instruction-modal');
  function closeInstructions(){wake();try{sessionStorage.setItem('steamline-puzzle-instructions-v2','seen');}catch(_){}closeDialog();}
  function toggleSound(){wake();campaign.settings.muted=!campaign.settings.muted;persist();state.dirty=true;render();tone(440);}
  function pause(){if(state.mode==='flow'){state.paused=!state.paused;state.dirty=true;render();say(state.paused?'Flow paused. Your plan is safe.':'Flow resumed.');}}
  const starsTotal=()=>Object.values(campaign.wins).reduce((a,w)=>a+w.stars,0);
  function renderLedger(){
    $('ledger-summary').textContent=Object.keys(campaign.wins).length+' / 50 districts served · '+starsTotal()+' / 150 stars. Unfinished boards are saved separately.';$('level-list').replaceChildren();
    for(let chapter=0;chapter<10;chapter++){
      const section=document.createElement('section'),title=document.createElement('h3');title.textContent=R.districts[chapter][0];section.append(title);const row=document.createElement('div');row.className='level-row';
      for(let n=chapter*5+1;n<=chapter*5+5;n++){
        const b=document.createElement('button'),win=campaign.wins[n];b.type='button';b.disabled=n>campaign.unlocked;b.textContent=String(n).padStart(2,'0')+' '+(win?'★'.repeat(win.stars):n>campaign.unlocked?'🔒':campaign.drafts[n]?'· saved':'· new');
        b.setAttribute('aria-label','Contract '+n+(win?', '+win.stars+' stars':b.disabled?', locked':', available'));b.classList.toggle('current',n===state.level);b.onclick=()=>openLevel(n);row.append(b);
      }section.append(row);$('level-list').append(section);
    }
  }
  function label(el,html){if(el.dataset.label===html)return;el.dataset.label=html;el.innerHTML=html;}
  function renderBoiler(){
    // Presentation follows the visited square, never time remaining or a new rule.
    // Keep the reading and wheel still behind help, the ledger, or a paused test.
    const live=!!state.flow,complete=live&&state.flow.ok&&state.index>=state.flow.steps.length,
      stopped=live&&!complete&&(state.paused||state.mode!=='flow'),
      visit=live?state.flow.steps[Math.min(state.index,state.flow.steps.length-1)]:null,
      heat=visit?.heat??0,thermal=!!c().capacity,
      fraction=live?(thermal?Math.max(0,Math.min(1,heat/c().capacity)):.68):0,
      status=complete?'complete':stopped?'paused':live?'running':state.blocked?'blocked':'idle',
      names={idle:'VALVE CLOSED',running:'FLOWING',paused:'FLOW HELD',complete:'HEAT DELIVERED',blocked:'TEST STOPPED'},
      boiler=$('boiler');
    boiler.dataset.state=status;boiler.dataset.heat=live&&thermal?String(heat):'';
    boiler.style.setProperty('--needle-angle',(-50+87*fraction).toFixed(2)+'deg');
    $('boiler-state').textContent=names[status];
    $('boiler-note').textContent=live?(thermal?'HEAT '+heat+' / '+c().capacity:'GAUGE SHOWS FLOW · NO TIMER'):'NO COUNTDOWN · TEST WHEN READY';
    $('route-check').textContent=complete?'A warmer city. Well planned.':stopped?'Your test is paused.':live?'Following your route.':state.blocked?'Edit the highlighted square and try again.':state.plan.ok?'Route connected. Ready to test.':'Take your time. Build a good route.';
    $('route-check').classList.toggle('ready',state.plan.ok);
  }
  function render(){
    if(!state.dirty)return;const plan=state.plan,flowing=state.mode==='flow',completed=(flowing||state.mode==='result')&&state.flow?state.flow.steps.slice(0,state.index+1):[],wet=new Map();
    for(const visit of completed)wet.set(visit.k,(wet.get(visit.k)||0)|(visit.axis===null?3:visit.axis===0?1:2));
    const head=completed.at(-1),done=flowing?(head?.done||[]):plan.done;
    for(let k=0;k<48;k++){
      const el=cells[k],t=state.board[k],mark=c().marks[k],isHead=head?.k===k;
      el.className='cell'+(t?.block?' block':'')+(t?.fixed?' fixed':'')+(t?.source?' source':'')+(t?.drain?' drain':'')+(mark?' marked':'')+(wet.has(k)?' wet':'')+(state.cursor===k?' cursor':'')+(isHead?' head':'')+(state.highlight===k?' problem':'');el.tabIndex=state.cursor===k?0:-1;
      const description=t?.block?'obstruction':t?.source?'boiler':t?.drain?'receiver':t?.kind==='B'?'bridge, independent horizontal and vertical lanes':t?.kind==='A'?'tunnel A entrance':t?.kind==='T'?'tunnel A exit':t?.gate?'gate G':t?.valve!==undefined?'one-way valve':t?t.kind==='I'?'straight pipe':'elbow pipe':'empty';
      el.setAttribute('aria-label','Column '+(k%8+1)+', row '+(Math.floor(k/8)+1)+': '+description+(mark?', '+mark.type+(mark.number?' '+mark.number:''):''));
      const artKey=JSON.stringify([t,wet.get(k)||0,mark,isHead?head.entry:null]);
      if(el.dataset.artKey!==artKey){el.dataset.artKey=artKey;let badge='';
        if(mark)badge='<span class="mark '+mark.type+'">'+(mark.type==='ring'?mark.number:mark.type==='heater'?'H':mark.type==='radiator'?'R':'S')+'</span>';
        if(t?.kind==='B')badge='<span class="mini-tag">OVERPASS</span>';
        el.innerHTML=A.pipe(t,wet.get(k)||0,isHead?head.entry:3)+badge+(t?.source?'<span class="tag">BOILER →</span>':t?.drain?'<span class="tag">RECEIVER →</span>':'');
      }
      if(isHead)for(const p of el.querySelectorAll('.steam'))p.setAttribute('stroke-dasharray',(p.dataset.axis&&Number(p.dataset.axis)!==head.axis?100:Math.max(10,state.progress*100))+' 100');
    }
    for(const b of $('pieces').children){
      const kind=b.dataset.shape,used=state.board.filter(t=>t&&!t.fixed&&t.kind===kind).length,left=c().budget?c().budget[kind]-used:'∞';b.setAttribute('aria-pressed',String(state.shape===kind&&!state.lift));label(b,A.pipe({kind,r:state.rotation})+'<span>'+(kind==='I'?'1 · STRAIGHT':'2 · ELBOW')+'</span><small>'+left+' left</small>');
    }
    $('level').textContent=String(state.level).padStart(2,'0')+' / 50';$('length').textContent=(flowing?new Set(completed.map(s=>s.k)).size:plan.unique.length)+' / '+c().minimum;$('checks').textContent=done.length+' / '+c().goals.length;
    $('heat-label').textContent=c().capacity?(flowing?'HEAT / CAPACITY':'HEAT AT ROUTE END'):'CITY STARS';$('heat').textContent=c().capacity?(flowing?(head?.heat||0):plan.heat)+' / '+c().capacity:starsTotal();
    $('district').textContent=c().name;$('lesson').textContent=c().lesson;$('contract-name').textContent=c().ordered?'DELIVER IN NUMERICAL ORDER':'PLAN · CONNECT · TEST';
    $('stock').textContent=c().budget?'Stock limited · lifting refunds':'Stock unlimited';renderBoiler();
    $('lift').setAttribute('aria-pressed',String(state.lift));$('undo').disabled=!state.undo.length||!editable();$('sound').textContent=campaign.settings.muted?'Sound off':'Sound on';$('pause').textContent=state.paused?'Resume':'Pause';$('pause').disabled=!flowing;
    $('speed').textContent='FLOW ×'+(state.fast?3:1);$('speed').setAttribute('aria-pressed',String(state.fast));label($('launch'),flowing?'BACK TO PLAN <span>EVERY FITTING IS KEPT</span>':'TEST FLOW <span>NO COUNTDOWN</span>');$('launch').disabled=!editable();
    $('pressure-label').textContent=flowing?(state.paused?'FLOW PAUSED':'TESTING FLOW'):'UNHURRIED PLANNING';$('pressure-fill').style.width=(flowing?100*(state.index+state.progress)/Math.max(1,state.flow.steps.length):0)+'%';state.dirty=false;
  }
  for(let k=0;k<48;k++){const b=document.createElement('button');b.type='button';b.className='cell';b.onclick=()=>{wake();fit(k);};b.oncontextmenu=e=>{e.preventDefault();state.cursor=k;remove(k);};cells.push(b);$('board').append(b);}
  for(const kind of ['I','L']){const b=document.createElement('button');b.type='button';b.dataset.shape=kind;b.setAttribute('aria-label','Select '+(kind==='I'?'straight':'elbow')+' pipe');b.onclick=()=>shape(kind);$('pieces').append(b);}
  $('rotate').onclick=rotate;$('lift').onclick=()=>{if(!editable())return;state.lift=!state.lift;state.dirty=true;say(state.lift?'Lift tool ready · tap a loose fitting. Anchors stay fixed.':'Fitting tool ready.');render();};
  $('launch').onclick=launch;$('mission').onclick=inspect;$('undo').onclick=()=>undo();$('reset').onclick=reset;$('save').onclick=()=>{persist(true);say(saveOK?'Board and campaign saved on this device.':'Autosave unavailable. Use Levels → Download save to keep your work.');};
  $('speed').onclick=()=>{state.fast=!state.fast;state.dirty=true;persist();render();};$('sound').onclick=toggleSound;$('pause').onclick=pause;$('help-button').onclick=instructions;$('instruction-close').onclick=closeInstructions;
  $('levels').onclick=()=>dialog('ledger');$('ledger-close').onclick=closeDialog;$('result-levels').onclick=()=>dialog('ledger');$('next').onclick=()=>{if(state.level===50)dialog('ledger');else openLevel(state.level+1);};$('result-edit').onclick=()=>{$('result').classList.remove('is-visible');stopTest();};
  $('download').onclick=()=>{persist(true);const url=URL.createObjectURL(new Blob([JSON.stringify(campaign,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='steamline-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('import').onclick=()=>{$('import-file').value='';$('import-file').click();};
  $('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error();const candidate=S.validate(JSON.parse(await file.text()));if(!candidate)throw Error();pendingImport=candidate;dialog('import-modal');$('import-detail').textContent='Import '+Object.keys(candidate.wins).length+' completed contracts and return to contract '+candidate.current+'? This replaces the current campaign. A local recovery copy will be attempted.';}catch(_){say('This file is not a valid Steamline puzzle save. Current progress is unchanged.');}};
  $('import-cancel').onclick=()=>{pendingImport=null;closeDialog();};
  $('import-confirm').onclick=()=>{if(!pendingImport)return;try{storage?.setItem(S.KEY+'-before-import',JSON.stringify(campaign));}catch(_){}campaign=pendingImport;pendingImport=null;state.fast=campaign.settings.fast;baseStart(campaign.current);state.undo=campaign.undo;Object.assign(state,campaign.tools);state.dirty=true;render();persist(true);say('Campaign imported. Your workbench is ready.');};
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey){if(!document.querySelector('.modal.is-visible')&&['KeyZ','KeyY'].includes(e.code)){e.preventDefault();undo(e.code==='KeyY'||e.shiftKey);}return;}
    const visible=document.querySelector('.modal.is-visible');
    if(visible){if(e.code==='Escape'&&visible.id!=='result'){e.preventDefault();if(visible.id==='instruction-modal')closeInstructions();else if(visible.id==='import-modal')$('import-cancel').click();else closeDialog();}
      if(e.code==='Tab'){const list=[...visible.querySelectorAll('button:not(:disabled),input:not([hidden])')],first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}
    if(['Space','Enter'].includes(e.code)&&e.target.closest('button')&&!e.target.classList.contains('cell'))return;
    const dirs={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
    if(['Space','Enter','Backspace',...Object.keys(dirs)].includes(e.code))e.preventDefault();if(e.repeat)return;wake();
    if(dirs[e.code]!==undefined){const p=R.xy(state.cursor),d=R.D[dirs[e.code]],x=p[0]+d[0],y=p[1]+d[1];if(x>=0&&x<8&&y>=0&&y<6){state.cursor=y*8+x;cells[state.cursor].focus({preventScroll:true});state.dirty=true;render();}}
    else if(e.code==='Digit1')shape('I');else if(e.code==='Digit2')shape('L');else if(e.code==='KeyX')rotate();else if(e.code==='Space')fit(state.cursor);else if(e.code==='Backspace')remove();else if(e.code==='KeyZ')undo(e.shiftKey);else if(e.code==='KeyY')undo(true);else if(e.code==='Enter')launch();else if(e.code==='KeyR')reset();else if(e.code==='KeyM')toggleSound();else if(e.code==='KeyP')pause();
  });
  window.addEventListener('vibecade:restart',e=>{e.preventDefault();reset();});
  const leave=()=>{if(state.mode==='flow'){state.paused=true;state.dirty=true;render();}persist(true);};window.addEventListener('blur',leave);window.addEventListener('pagehide',()=>persist(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();});
  function frame(time){const dt=Math.min(.1,(time-last)/1000||0);last=time;if(!manual){step(dt);if(state.mode==='flow'&&time-visual>=(reduced?66:33)){state.dirty=true;render();visual=time;}else if(state.dirty)render();}requestAnimationFrame(frame);}
  $('ledger-help').onclick=instructions;
  baseStart(campaign.current);state.undo=campaign.undo.slice();Object.assign(state,campaign.tools);state.dirty=true;render();if(loaded.warning)say(loaded.warning);
  let seen=false;try{seen=sessionStorage.getItem('steamline-puzzle-instructions-v2')==='seen';}catch(_){}if(!seen)instructions();
  if(new URLSearchParams(location.search).get('test')==='1')window.__steamTest={state,rules:R,get campaign(){return campaign;},start:(n,restore=false)=>baseStart(n,restore,true),manual:v=>{manual=v;},step:seconds=>{for(let t=0;t<seconds;t+=1/120)step(Math.min(1/120,seconds-t));state.dirty=true;render();},fit,shape,rotate,remove,undo,reset,launch,inspect,persist:()=>persist(true),render:()=>{state.dirty=true;render();}};
  requestAnimationFrame(frame);
})();

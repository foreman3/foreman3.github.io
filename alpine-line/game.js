(() => {
  'use strict';
  const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');
  const LEVELS=[
    {name:'Sunrise nursery',count:10,quota:6,speed:160,gap:310,width:230,swing:150,rough:0,moguls:0,riders:0,linked:false,hearts:5},
    {name:'Blue traverse',count:13,quota:9,speed:185,gap:305,width:210,swing:175,rough:1,moguls:0,riders:0,linked:false,hearts:5},
    {name:'Mogul meadow',count:16,quota:12,speed:210,gap:300,width:190,swing:190,rough:1,moguls:1,riders:0,linked:false,hearts:5},
    {name:'Club crossing',count:21,quota:16,speed:235,gap:290,width:175,swing:205,rough:1,moguls:1,riders:1,linked:false,hearts:5},
    {name:'Summit switchbacks',count:26,quota:20,speed:260,gap:280,width:160,swing:220,rough:1,moguls:1,riders:1,linked:true,hearts:5},
    {name:'Black diamond',count:28,quota:25,speed:320,gap:245,width:130,swing:250,rough:1,moguls:1,riders:1,linked:true,hearts:4},
    {name:'Perfect descent',count:30,quota:29,speed:360,gap:230,width:112,swing:270,rough:1,moguls:1,riders:1,linked:true,hearts:3}
  ];
  const state={level:1,mode:'intro',score:0,time:0,distance:0,x:480,vx:0,speed:0,hearts:5,reserve:1,inv:0,slow:0,gates:[],objects:[],tracks:[],particles:[],streak:0,passed:0,missed:0,hits:0,muted:false,cfg:LEVELS[0],flash:0};
  let input=0,touchInput=0,brake=false,touchBrake=false,manual=false,dirty=true,audio=null,last=0,acc=0,resumeMode='playing',hudStamp='',entryScore=0;
  const keys=new Set(), motion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let seed=1;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function clearInput(){keys.clear();input=touchInput=0;brake=touchBrake=false;$('brake').classList.remove('pressed');}
  function resetHeld(){clearInput();window.dispatchEvent(new Event('vibecade:reset-input'));}
  function sound(f=440,length=.07){if(state.muted||!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(f,audio.currentTime);gain.gain.setValueAtTime(.055,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+length);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+length);}
  function wakeAudio(){try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume()?.catch(()=>{});}catch(_){}}
  function message(text){$('message').textContent=text;}
  function begin(n=1){
    resetHeld();entryScore=state.score;state.level=clamp(n,1,7);state.cfg=LEVELS[state.level-1];const c=state.cfg;
    Object.assign(state,{time:0,distance:0,x:480,vx:0,speed:c.speed,hearts:c.hearts,reserve:1,inv:1.2,slow:0,streak:0,passed:0,missed:0,hits:0,flash:0,gates:[],objects:[],tracks:[],particles:[],mode:'playing'});
    seed=8041+state.level*517;let center=480,y=540;
    for(let i=0;i<c.count;i++){
      const linked=c.linked&&i%4===3;let next=clamp(center+(random()>.5?1:-1)*(c.swing*(.65+random()*.35)),220,740);
      if(i===0)next=480;if(next===center)next=clamp(center+(center>480?-1:1)*c.swing,220,740);
      state.gates.push({x:next,y,width:c.width,num:i+1,done:false,hit:false,linked});
      const side=next>480?1:-1;
      state.objects.push({type:i%3===2?'rock':'tree',x:clamp(next+side*(c.width/2+78+random()*65),145,815),y:y+55,r:21,hit:false});
      if(i>0&&c.rough&&i%4===1)state.objects.push({type:'rough',x:clamp((center+next)/2,260,700),y:y-c.gap*.45,r:85,hit:false});
      if(c.moguls&&i%4===2)state.objects.push({type:'mogul',x:clamp(next-side*95,220,740),y:y+125,r:44,hit:false});
      if(c.riders&&i%4===3)state.objects.push({type:'rider',x:next>480?730:230,base:next>480?730:230,y:y+125,r:18,phase:random()*6,hit:false});
      center=next;y+=c.gap*(linked?.8:1);
    }
    state.finish=y+120;$('result-modal').classList.remove('is-visible');message(`${c.name} · ${c.quota} of ${c.count} gates needed · ${c.count-c.quota} misses allowed`);$('pause').textContent='Pause';$('touch-pause').textContent='PAUSE';dirty=true;hud(true);draw();
  }
  function restart(){state.score=0;const gated=$('instruction-modal').classList.contains('is-visible');begin(1);if(gated){state.mode='intro';resumeMode='playing';}dirty=true;draw();}
  function finish(){if(state.mode!=='playing')return;const win=state.passed>=state.cfg.quota&&state.hearts>0;state.mode=win?'clear':'over';resetHeld();$('result-title').textContent=win?(state.level===7?'A perfect mountain.':'Beautifully carved.'):'Find another line.';$('result-text').textContent=`${state.cfg.name}: ${state.passed} / ${state.cfg.count} gates, ${state.missed} missed, ${state.hits} collisions. ${win?'Finish bonus +'+state.hearts*150+'.':'You needed '+state.cfg.quota+' gates and one heart. Retry this course or start the mountain again.'}`;if(win)state.score+=state.hearts*150;$('next').hidden=!win||state.level===7;$('retry').hidden=win;$('again').hidden=false;$('again').textContent=win&&state.level===7?'SKI AGAIN':'START AGAIN';$('result-modal').classList.add('is-visible');(win?(state.level===7?$('again'):$('next')):$('retry')).focus();hud(true);dirty=true;sound(win?760:180,.18);}
  function damage(){if(state.inv>0||state.mode!=='playing')return;state.hearts--;state.hits++;state.inv=1.7;state.slow=1.1;state.vx*=.2;state.streak=0;state.flash=.32;message('A tumble! Keep your line — brief protection and slower recovery.');burst(state.x,580,'#f2bf4e',12);sound(150,.14);if(state.hearts<=0)finish();}
  function burst(x,y,color,n){if(motion)return;for(let i=0;i<n&&state.particles.length<64;i++)state.particles.push({x,y,dx:(random()-.5)*110,dy:(random()-.5)*90,life:.55,color});}
  function tick(dt){
    if(state.mode!=='playing')return;const c=state.cfg;state.time+=dt;state.inv=Math.max(0,state.inv-dt);state.slow=Math.max(0,state.slow-dt);state.flash=Math.max(0,state.flash-dt);
    input=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
    brake=keys.has('Space')||keys.has('ArrowDown')||keys.has('KeyS');const requestedBrake=brake||touchBrake,braking=requestedBrake&&state.reserve>0;
    state.reserve=clamp(state.reserve+(braking?-.19:requestedBrake?0:.10)*dt,0,1);
    const rough=state.objects.some(o=>o.type==='rough'&&Math.abs(o.y-state.distance)<48&&Math.abs(o.x-state.x)<o.r);
    const steer=input||touchInput,target=steer*(braking?360:390);state.vx+=(target-state.vx)*Math.min(1,dt*(rough?3.5:10));state.x=clamp(state.x+state.vx*dt,135,825);
    if(state.x===135&&state.vx<0||state.x===825&&state.vx>0)state.vx=0;
    const desired=c.speed*(braking?.57:1)*(state.slow>0?.6:1);state.speed+=(desired-state.speed)*Math.min(1,dt*7);
    const previous=state.distance;state.distance+=state.speed*dt;
    for(const g of state.gates){if(!g.done&&previous<g.y&&state.distance>=g.y){g.done=true;g.hit=Math.abs(state.x-g.x)<=g.width/2+5;if(g.hit){state.passed++;state.streak++;state.score+=100+Math.min(6,state.streak)*25;message(`Gate ${g.num} ✓ · ${state.streak} clean${state.streak>=3?' · streak bonus':''}`);burst(state.x,580,'#edb731',7);sound(500+Math.min(6,state.streak)*55);}else{state.missed++;state.streak=0;message(`Gate ${g.num} missed · ${Math.max(0,c.count-c.quota-state.missed)} misses left`);sound(220,.09);if(state.missed>c.count-c.quota){finish();return;}}}}
    for(const o of state.objects){if(o.type==='rider')o.x=clamp(o.base+Math.sin(state.time*1.25+o.phase)*160,180,780);if(o.hit||Math.abs(o.y-state.distance)>o.r+7)continue;
      if(o.type==='tree'||o.type==='rock'||o.type==='rider'){if(Math.abs(o.x-state.x)<o.r+9){o.hit=true;damage();}}
      else if(o.type==='mogul'&&Math.abs(o.x-state.x)<o.r){o.hit=true;state.slow=.7;message('Moguls! Absorb the bump, then carve the next gate.');burst(state.x,580,'#ffffff',6);}
    }
    if(!motion){if(state.tracks.length===0||state.distance-state.tracks[state.tracks.length-1].d>9){state.tracks.push({x:state.x,d:state.distance,lean:state.vx/390});if(Math.abs(state.vx)>180)burst(state.x-Math.sign(state.vx)*15,595,'#ffffff',1);}if(state.tracks.length>80)state.tracks.shift();}
    for(let i=state.particles.length-1;i>=0;i--){const p=state.particles[i];p.life-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;if(p.life<=0)state.particles.splice(i,1);}
    if(state.distance>=state.finish)finish();hud();dirty=true;
  }
  function hud(force=false){const progress=clamp(Math.round(state.distance/state.finish*100),0,100),stamp=[state.level,state.passed,state.hearts,Math.round(state.reserve*100),state.score,state.mode,progress].join('|');if(!force&&stamp===hudStamp)return;hudStamp=stamp;$('level').textContent=`${state.level} / 7`;$('gates').textContent=`${state.passed} / ${state.cfg.quota}`;$('hearts').textContent=state.hearts;$('reserve').textContent=`${Math.round(state.reserve*100)}%`;$('score').textContent=state.score.toLocaleString();$('brake').textContent=state.reserve<.03?'RELEASE':'BRAKE';$('progress').setAttribute('aria-valuenow',progress);$('progress').firstElementChild.style.transform=`scaleX(${progress/100})`;}
  function draw(){window.AlpineArt.draw(ctx,state,motion);dirty=false;}
  function help(){if($('instruction-modal').classList.contains('is-visible'))return;resumeMode=state.mode==='paused'?'paused':state.mode;state.mode='help';resetHeld();$('instruction-modal').classList.add('is-visible');$('instruction-close').textContent='BACK TO THE SLOPE';$('instruction-close').focus();dirty=true;}
  function dismiss(){wakeAudio();$('instruction-modal').classList.remove('is-visible');try{sessionStorage.setItem('alpine-line-instructions-v1','seen');}catch(_){}if(state.mode==='intro')begin(new URLSearchParams(location.search).get('level')*1||1);else state.mode=resumeMode;canvas.focus({preventScroll:true});dirty=true;}
  function pause(){if(!['playing','paused'].includes(state.mode))return;state.mode=state.mode==='playing'?'paused':'playing';resetHeld();$('pause').textContent=state.mode==='paused'?'Resume':'Pause';$('touch-pause').textContent=state.mode==='paused'?'RESUME':'PAUSE';message(state.mode==='paused'?'Paused · press P or Resume.':state.cfg.name+' · find your line.');dirty=true;}
  function mute(){state.muted=!state.muted;$('sound').textContent=state.muted?'Sound off':'Sound on';$('touch-sound').textContent=state.muted?'MUTED':'SOUND';if(!state.muted){wakeAudio();sound();}}
  document.addEventListener('keydown',e=>{const globalKey=['KeyP','KeyR','KeyM'].includes(e.code);if(!globalKey&&(state.mode!=='playing'||e.target.matches('button')&&e.code==='Space'))return;if(['ArrowLeft','ArrowRight','ArrowDown','Space','KeyA','KeyD','KeyS','KeyR','KeyM','KeyP'].includes(e.code)&&!e.target.matches('input,textarea')){e.preventDefault();if(globalKey){if(!e.repeat)({KeyP:pause,KeyR:restart,KeyM:mute})[e.code]();return;}wakeAudio();keys.add(e.code);}});
  document.addEventListener('keyup',e=>keys.delete(e.code));
  $('instruction-close').onclick=dismiss;$('help-button').onclick=help;$('pause').onclick=$('touch-pause').onclick=pause;$('sound').onclick=$('touch-sound').onclick=mute;$('reset').onclick=restart;$('again').onclick=restart;$('next').onclick=()=>begin(state.level+1);$('retry').onclick=()=>{state.score=entryScore;begin(state.level);};
  $('brake').addEventListener('pointerdown',e=>{e.preventDefault();if(state.mode!=='playing')return;wakeAudio();touchBrake=true;$('brake').classList.add('pressed');$('brake').setPointerCapture(e.pointerId);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])$('brake').addEventListener(type,e=>{e.preventDefault();touchBrake=false;$('brake').classList.remove('pressed');});
  window.VibeCadeJoystick($('touch-controls').querySelector('[data-joystick]'),{mode:'horizontal',profile:'precision',onChange:x=>{touchInput=state.mode==='playing'?x:0;if(touchInput)wakeAudio();}});
  window.addEventListener('vibecade:reset-input',clearInput);window.addEventListener('vibecade:restart',e=>{e.preventDefault();restart();});
  function blur(){resetHeld();if(state.mode==='playing')pause();}window.addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});
  window.addEventListener('resize',()=>{resetHeld();dirty=true;});
  function frame(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;if(!manual){acc=Math.min(.1,acc+dt);while(acc>=1/60){tick(1/60);acc-=1/60;}}if(dirty)draw();requestAnimationFrame(frame);}
  begin(new URLSearchParams(location.search).get('level')*1||1);let seen=false;try{seen=sessionStorage.getItem('alpine-line-instructions-v1')==='seen';}catch(_){}if(seen){$('instruction-modal').classList.remove('is-visible');}else state.mode='intro';dirty=true;requestAnimationFrame(frame);
  if(new URLSearchParams(location.search).has('test'))window.__alpineTest={state,levels:LEVELS,begin,tick,draw,damage,finish,manual:v=>{manual=v;acc=0;},setInput:(x,b=false)=>{keys.clear();touchInput=x;touchBrake=b;},input:()=>({touchInput,touchBrake,keys:[...keys]}),pause};
})();

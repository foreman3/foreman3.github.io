(() => {
  'use strict';
  const $ = id => document.getElementById(id), pads = [...document.querySelectorAll('[data-pad]')];
  // Three progressively longer phrases per act. No new rules at higher acts.
  const curve = [
    {length:3, beat:.76, limit:6, lives:4, replays:3},
    {length:4, beat:.70, limit:5.5, lives:4, replays:3},
    {length:5, beat:.64, limit:5, lives:4, replays:3},
    {length:6, beat:.58, limit:4.5, lives:3, replays:2},
    {length:7, beat:.52, limit:4, lives:3, replays:2},
    {length:9, beat:.43, limit:2.8, lives:2, replays:1},
    {length:12,beat:.35, limit:1.8, lives:1, replays:0}
  ];
  let level=1, round=0, score=0, bank=0, lives=4, replays=3, sequence=[], position=0;
  let phase='ready', clock=0, remaining=6, flash=-1, flashClock=0, paused=true, started=false, muted=true, audio, seed=1, last=0, previousFocus, manual=false;
  const names=['Sun','Wave','Moon','Star'], frequencies=[261.63,329.63,392,523.25];
  const cfg=()=>curve[level-1];
  function tone(index,duration=.22){
    if(muted||paused)return;
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=index<0?130:frequencies[index];g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.13,audio.currentTime+.012);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration+.02);}catch(_){}
  }
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function text(id,value){if($(id).textContent!==String(value))$(id).textContent=value;}
  function light(index){flash=index;flashClock=.25;tone(index);}
  function status(mode,message){text('mode',mode);text('message',message);}
  function dots(){ $('progress').replaceChildren(...sequence.map((_,i)=>{const dot=document.createElement('i');dot.className=i<position?'done':'';return dot;})); }
  function hud(){text('level',`${level} / 7`);text('round',`${round+1} / 3`);text('score',String(score).padStart(5,'0'));text('lives',lives);text('replays',replays);$('replay').disabled=phase!=='input'||paused||replays===0;text('hint',level===7?'Flawless encore · no extra listens':`${sequence.length} notes · ${cfg().limit}s between notes`);}
  function playback(){phase='lead';clock=.8;position=0;flash=-1;status('LISTEN','Watch the lights. Remember the order.');dots();hud();}
  function phrase(){sequence=Array.from({length:cfg().length+round},()=>Math.floor(random()*4));playback();}
  function begin(act=1,startingScore=0){level=act;round=0;score=startingScore;bank=startingScore;lives=cfg().lives;replays=cfg().replays;seed=(Date.now()>>>0)||1;started=true;$('result').hidden=true;phrase();hud();}
  function finish(won){phase=won?'clear':'over';flash=-1;$('result').hidden=false;text('result-label',won?'BRAVO!':'ONE MORE PERFORMANCE?');text('result-title',won?(level===7?'The perfect encore':'Act complete'):'The melody slipped away');text('result-copy',won?`${score} points. ${level===7?'All seven acts complete. You own the pavilion.':`${lives} chances left. A fresh set awaits in act ${level+1}.`}`:`${score} points · Act ${level}, phrase ${round+1}. Listen for little groups of two or three.`);$('next').hidden=!won||level===7;$('retry').textContent=won?'New performance':'Try this act again';$('next').focus();if($('next').hidden)$('retry').focus();hud();}
  function miss(){lives--;tone(-1,.35);if(!lives){finish(false);return;}phase='recover';clock=1.35;position=0;flash=-1;status('TAKE A BREATH',`${lives} chances left. Same phrase, fresh start.`);dots();hud();}
  function press(index){if(paused||phase!=='input')return;light(index);if(sequence[position]!==index){miss();return;}position++;remaining=cfg().limit;dots();status('YOUR TURN',`${names[index]} · ${position} of ${sequence.length}`);if(position===sequence.length){score+=sequence.length*100+replays*25;phase='celebrate';clock=1.0;status('BEAUTIFULLY PLAYED',round===2?'The pavilion applauds.':'A longer phrase is coming.');}hud();}
  function update(dt){if(paused)return;if(flashClock>0){flashClock-=dt;if(flashClock<=0)flash=-1;}
    if(['lead','play','recover','celebrate'].includes(phase)){
      clock-=dt;if(clock<=0){if(phase==='lead'){phase='play';position=0;light(sequence[0]);clock=cfg().beat;}
        else if(phase==='play'){position++;if(position>=sequence.length){phase='input';position=0;remaining=cfg().limit;flash=-1;status('YOUR TURN','Play the melody back.');hud();}else{light(sequence[position]);clock=cfg().beat;}}
        else if(phase==='recover')playback();else if(round===2)finish(true);else{round++;phrase();}}
    }else if(phase==='input'){remaining-=dt;if(remaining<=0)miss();}
  }
  function paint(){const cabinet=document.querySelector('.cabinet');if(cabinet.dataset.phase!==phase)cabinet.dataset.phase=phase;[...$('progress').children].forEach((dot,i)=>dot.classList.toggle('current',phase==='play'&&position===i));pads.forEach((p,i)=>p.classList.toggle('lit',i===flash&&!paused));$('time').style.transform=`scaleX(${phase==='input'?Math.max(0,remaining/cfg().limit):0})`;}
  function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(!manual)update(dt);paint();requestAnimationFrame(frame);}
  function showInstructions(){previousFocus=document.activeElement;paused=true;$('result').hidden=true;audio?.suspend().catch(()=>{});$('instruction-modal').hidden=false;$('instruction-modal').classList.add('is-visible');document.body.classList.add('modal-open');$('instruction-close').textContent=started?'Return to the melody':'Open the pavilion';$('instruction-close').focus();hud();}
  function closeInstructions(){paused=false;$('instruction-modal').hidden=true;$('instruction-modal').classList.remove('is-visible');document.body.classList.remove('modal-open');try{sessionStorage.setItem('echo-pavilion-instructions','seen');}catch(_){}audio?.resume().catch(()=>{});if(!started)begin();if(phase==='clear'||phase==='over')$('result').hidden=false;hud();(previousFocus&&previousFocus!==document.body?previousFocus:pads[0]).focus();}
  function restart(){if(!$('instruction-modal').hidden)return;paused=false;begin();pads[0].focus();}
  function sound(){muted=!muted;text('sound',muted?'Sound off':'Sound on');$('sound').setAttribute('aria-pressed',String(!muted));if(!muted)tone(0);else audio?.suspend().catch(()=>{});}
  pads.forEach((p,i)=>{p.addEventListener('pointerdown',e=>{e.preventDefault();if(e.button!==0)return;p.setPointerCapture(e.pointerId);p.classList.add('pressed');press(i);});const release=()=>p.classList.remove('pressed');['pointerup','pointercancel','lostpointercapture'].forEach(event=>p.addEventListener(event,release));p.addEventListener('contextmenu',e=>e.preventDefault());p.addEventListener('click',e=>{if(e.detail===0)press(i);});});
  const keyMap={KeyQ:0,KeyW:1,KeyA:2,KeyS:3,Digit1:0,Digit2:1,Digit3:2,Digit4:3};
  document.addEventListener('keydown',e=>{if(e.code==='Tab'){const modal=[...document.querySelectorAll('.modal')].find(m=>!m.hidden);if(modal){const buttons=[...modal.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}if(e.target.matches('button')&&['Enter','Space'].includes(e.code))return;if(e.code in keyMap){e.preventDefault();if(!e.repeat)press(keyMap[e.code]);}else if(['KeyR','KeyM','KeyP','Space'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(e.code==='KeyR')restart();if(e.code==='KeyM')sound();if(e.code==='KeyP')showInstructions();if(e.code==='Space')$('replay').click();}else if(e.code==='Escape'&&!$('instruction-modal').hidden&&started)closeInstructions();});
  $('instruction-close').onclick=closeInstructions;$('help-button').onclick=showInstructions;$('pause').onclick=showInstructions;$('restart-button').onclick=restart;$('sound').onclick=sound;
  $('replay').onclick=()=>{if(paused||phase!=='input'||!replays)return;replays--;playback();};
  $('next').onclick=()=>{level++;bank=score;round=0;lives=cfg().lives;replays=cfg().replays;$('result').hidden=true;phrase();pads[0].focus();};
  $('retry').onclick=()=>{begin(phase==='over'?level:1,phase==='over'?bank:0);pads[0].focus();};
  window.addEventListener('vibecade:restart',e=>{e.preventDefault();restart();});
  const release=()=>pads.forEach(p=>p.classList.remove('pressed'));
  window.addEventListener('vibecade:reset-input',release);window.addEventListener('blur',()=>{release();if(started&&$('result').hidden)showInstructions();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&$('result').hidden)showInstructions();});
  // Opt-in browser verification only; never present during ordinary play.
  if(new URLSearchParams(location.search).has('test'))window.echoTest={manual:value=>manual=value,state:()=>({level,round,score,lives,replays,sequence:[...sequence],position,phase,paused,remaining,clock,flash}),jump:act=>{paused=false;$('instruction-modal').hidden=true;$('instruction-modal').classList.remove('is-visible');document.body.classList.remove('modal-open');begin(act);},step:seconds=>{for(let t=0;t<seconds;t+=.01)update(Math.min(.01,seconds-t));paint();},curve};
  try{if(sessionStorage.getItem('echo-pavilion-instructions')==='seen'){paused=false;$('instruction-modal').hidden=true;$('instruction-modal').classList.remove('is-visible');begin();}else showInstructions();}catch(_){showInstructions();}
  requestAnimationFrame(frame);
})();

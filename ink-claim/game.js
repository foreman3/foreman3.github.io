(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id),modal=$('instruction-modal'),result=$('result-modal'),banner=$('banner');
const W=32,H=20,C=22,BX=128,BY=91,profiles=[
  {goal:60,marks:0,moths:1,speed:2.6,time:10,pens:5,drawStep:.11},
  {goal:64,marks:1,moths:1,speed:3,time:9.5,pens:5,drawStep:.12},
  {goal:68,marks:2,moths:2,speed:3.4,time:8.5,pens:5,drawStep:.13},
  {goal:72,marks:3,moths:2,speed:3.9,time:7.8,pens:5,drawStep:.14},
  {goal:76,marks:4,moths:3,speed:4.4,time:7,pens:5,drawStep:.15},
  {goal:80,marks:4,moths:3,speed:5.3,time:6.3,pens:2,drawStep:.16},
  {goal:84,marks:4,moths:4,speed:6,time:5.5,pens:1,drawStep:.17}
];
const sealOrder=[{x:24,y:5},{x:7,y:15},{x:7,y:5},{x:24,y:15}];
const state={level:1,grid:[],trail:[],player:{x:0,y:10},moths:[],marks:[],marksClaimed:0,keys:{up:false,down:false,left:false,right:false},tapQueue:[],lastDir:'right',drawing:false,drawHeld:false,moveClock:0,trailClock:0,pens:5,claimed:0,score:0,phase:'gate',paused:false,muted:false,invuln:0,flash:0,clock:0,seed:3911,stats:{cuts:0,misses:0}};
window.InkClaim=state;
const random=()=>{state.seed=(1664525*state.seed+1013904223)>>>0;return state.seed/4294967296};
const profile=()=>profiles[state.level-1];
const inside=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const index=(x,y)=>y*W+x;
const cell=(x,y)=>inside(x,y)?state.grid[index(x,y)]:1;
const setCell=(x,y,value)=>{if(inside(x,y))state.grid[index(x,y)]=value};
const status=(message,duration=1.5)=>{banner.textContent=message;state.flash=duration};
let audio;
function tone(freq=440,duration=.07,type='triangle',volume=.04){if(state.muted||state.phase==='gate')return;try{audio ||=new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch(_){}}
function updateHud(){const p=profile();$('level').textContent=`${state.level} / 7`;$('claim').textContent=`${Math.floor(state.claimed)} / ${p.goal}%`;$('marks').textContent=p.marks?`${state.marksClaimed} / ${p.marks}`:'—';$('lives').textContent=String(state.pens);$('score').textContent=state.score.toLocaleString()}
function newPoster(number){
  state.level=number;state.grid=Array(W*H).fill(0);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||x===W-1||y===0||y===H-1)setCell(x,y,1);
  state.trail=[];state.player={x:0,y:10};state.moths=[];
  state.marks=sealOrder.slice(0,profile().marks).map((mark,i)=>({...mark,id:i+1,claimed:false}));state.marksClaimed=0;
  state.pens=profile().pens;state.claimed=0;state.drawing=false;state.drawHeld=false;syncDrawButton();
  state.moveClock=0;state.tapQueue=[];state.trailClock=0;state.invuln=number<6?1.1:number===6?.6:.2;
  state.paused=false;state.phase='play';state.stats={cuts:0,misses:0};state.keys={up:false,down:false,left:false,right:false};
  for(let i=0;i<profile().moths;i++){const x=[9,15,12,24][i],y=i%2?14:5;state.moths.push({x,y,vx:(i%2?-1:1)*profile().speed*.79,vy:(i%3?-1:1)*profile().speed*.62,wing:random()*6})}
  result.classList.remove('is-visible');document.body.classList.remove('result-open');status(`POSTER ${number} · CLAIM ${profile().goal}%`,2);updateHud();canvas.focus({preventScroll:true})
}
function fail(reason){state.stats.misses++;state.pens--;for(const [x,y] of state.trail)setCell(x,y,0);state.trail=[];state.drawing=false;state.drawHeld=false;state.tapQueue=[];syncDrawButton();state.trailClock=0;state.player={x:0,y:10};state.invuln=1.4;tone(190,.2,'sawtooth',.035);status(reason,2);updateHud();if(state.pens<=0)end(false)}
function end(won){state.phase=won?'clear':'over';state.drawing=false;state.drawHeld=false;state.tapQueue=[];state.keys={up:false,down:false,left:false,right:false};result.classList.add('is-visible');document.body.classList.add('result-open');$('result-title').textContent=won?(state.level===7?'THE EDITION IS COMPLETE!':`POSTER ${state.level} FINISHED`):'THE INK RAN OUT';$('result-text').textContent=won?(state.level===7?`All seven posters printed. Final score: ${state.score.toLocaleString()}.`:`${Math.floor(state.claimed)}% claimed and ${state.marksClaimed} marks printed with ${state.pens} pen${state.pens===1?'':'s'} left. Ready for poster ${state.level+1}?`):`You reached ${Math.floor(state.claimed)}% and ${state.marksClaimed} marks on poster ${state.level}. Try another route.`;$('continue').hidden=!won||state.level===7;$('again').hidden=won&&state.level<7;($('continue').hidden?$('again'):$('continue')).focus({preventScroll:true});tone(won?660:160,.18)}
function capture(){
  const safe=new Uint8Array(W*H),queue=new Int16Array(W*H);let head=0,tail=0;
  for(const moth of state.moths){
    const mx=Math.max(1,Math.min(W-2,Math.round(moth.x))),my=Math.max(1,Math.min(H-2,Math.round(moth.y)));
    let start=index(mx,my);
    if(state.grid[start]!==0){
      let best=Infinity;
      for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(cell(x,y)===0){const d=(x-moth.x)**2+(y-moth.y)**2;if(d<best){best=d;start=index(x,y)}}
    }
    if(state.grid[start]===0&&!safe[start]){safe[start]=1;queue[tail++]=start}
  }
  while(head<tail){
    const id=queue[head++],x=id%W,y=(id/W)|0;
    for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(inside(nx,ny)){
      const ni=index(nx,ny);if(state.grid[ni]===0&&!safe[ni]){safe[ni]=1;queue[tail++]=ni}
    }
  }
  let gained=0;
  for(let i=0;i<state.grid.length;i++)if(state.grid[i]===2||state.grid[i]===0&&!safe[i]){state.grid[i]=1;gained++}
  state.trail=[];state.drawing=false;state.drawHeld=false;syncDrawButton();state.trailClock=0;state.stats.cuts++;
  state.claimed=100*(state.grid.filter(v=>v===1).length-(W*2+H*2-4))/((W-2)*(H-2));
  let newMarks=0;for(const mark of state.marks)if(!mark.claimed&&cell(mark.x,mark.y)===1){mark.claimed=true;newMarks++}
  state.marksClaimed+=newMarks;
  state.score+=gained*10+Math.round(gained*gained/30)+newMarks*350;
  state.invuln=.25;tone(newMarks?820:gained>12?680:480,.11);
  status(newMarks?`+${gained} CELLS · ${newMarks} MARK${newMarks===1?'':'S'} PRINTED`:`+${gained} CELLS`,1.4);
  updateHud();if(state.claimed>=profile().goal&&state.marksClaimed===profile().marks)end(true)
}
function direction(){for(const name of [state.lastDir,'up','down','left','right'])if(state.keys[name])return name;return null}
function move(dir=direction()){if(state.phase!=='play'||state.paused||!dir)return;const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir],nx=state.player.x+delta[0],ny=state.player.y+delta[1];if(!inside(nx,ny))return;const target=cell(nx,ny);if(state.drawing){if(target===2)return;state.player={x:nx,y:ny};if(target===1)capture();else{setCell(nx,ny,2);state.trail.push([nx,ny])}return}if(target===1){state.player={x:nx,y:ny};return}if(state.drawHeld&&target===0){state.drawing=true;state.trailClock=0;state.player={x:nx,y:ny};setCell(nx,ny,2);state.trail.push([nx,ny]);tone(410,.04)}}
function moveMoths(dt){for(const moth of state.moths){for(const axis of ['x','y']){const trial=moth[axis]+moth[axis==='x'?'vx':'vy']*dt,tx=axis==='x'?trial:moth.x,ty=axis==='y'?trial:moth.y;const cx=Math.round(tx),cy=Math.round(ty);if(cx<1||cx>W-2||cy<1||cy>H-2||cell(cx,cy)===1){moth[axis==='x'?'vx':'vy']*=-1}else moth[axis]=trial}moth.wing+=dt*12;if(state.invuln<=0){if(Math.hypot(moth.x-state.player.x,moth.y-state.player.y)<.75&&state.drawing){fail('MOTH HIT THE PEN');return}for(const [x,y] of state.trail)if(Math.hypot(moth.x-x,moth.y-y)<.72){fail('MOTH CUT THE LINE');return}}}}
function tick(dt){if(state.phase!=='play'||state.paused||modal.classList.contains('is-visible'))return;state.clock+=dt;state.invuln=Math.max(0,state.invuln-dt);state.flash=Math.max(0,state.flash-dt);if(!state.flash)banner.textContent='';state.moveClock+=dt;let steps=0;while(steps<3){const interval=state.drawing?profile().drawStep:.085;if(state.moveClock<interval)break;const dir=state.tapQueue.shift()||direction();if(!dir){state.moveClock=Math.min(state.moveClock,interval);break}state.moveClock-=interval;move(dir);steps++;if(state.phase!=='play')return}if(state.drawing){state.trailClock+=dt;if(state.trailClock>profile().time){fail('THE LINE DRIED OUT');return}}moveMoths(dt)}
function drawMarks(){
  for(const mark of state.marks){
    const px=BX+(mark.x+.5)*C,py=BY+(mark.y+.5)*C;
    ctx.save();ctx.translate(px,py);
    ctx.fillStyle=mark.claimed?'#f7e6b8':'#e7a940';ctx.strokeStyle='#173f45';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#173f45';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 13px Arial';
    ctx.fillText(mark.claimed?'✓':String(mark.id),0,1);
    ctx.restore();
  }
}
function draw(){ctx.fillStyle='#eadab3';ctx.fillRect(0,0,960,600);ctx.fillStyle='#d8c79c';for(let i=0;i<45;i++){const x=(i*173)%960,y=(i*257)%600;ctx.fillRect(x,y,2,2)}ctx.fillStyle='#173f45';ctx.fillRect(0,0,960,66);ctx.fillStyle='#f2e6c9';ctx.font='900 30px Arial';ctx.fillText(`POSTER ${String(state.level).padStart(2,'0')}`,128,45);ctx.textAlign='right';ctx.font='700 16px Arial';ctx.fillText(`${Math.floor(state.claimed)}% / ${profile().goal}% CLAIMED`,832,42);ctx.textAlign='left';ctx.fillStyle='#f8f1d7';ctx.fillRect(BX-7,BY-7,W*C+14,H*C+14);ctx.fillStyle='#a59679';ctx.fillRect(BX,BY,W*C,H*C);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=cell(x,y);if(v===0)continue;const px=BX+x*C,py=BY+y*C;ctx.fillStyle=v===1?'#1d6063':'#b24631';ctx.fillRect(px,py,C,C);if(v===1){ctx.fillStyle=(x+y)%4===0?'#74a5a0':'#397f7e';ctx.fillRect(px+2,py+2,C-4,C-4);ctx.fillStyle='#d9ddbb';if((x*7+y*11)%23===0){ctx.beginPath();ctx.arc(px+11,py+11,2.5,0,7);ctx.fill()}}else{ctx.fillStyle='#fff0c8';ctx.fillRect(px+7,py+7,8,8)}}ctx.strokeStyle='#183f45';ctx.lineWidth=4;ctx.strokeRect(BX-.5,BY-.5,W*C+1,H*C+1);drawMarks();for(const moth of state.moths){const px=BX+(moth.x+.5)*C,py=BY+(moth.y+.5)*C;ctx.save();ctx.translate(px,py);ctx.rotate(Math.sin(moth.wing)*.15);ctx.fillStyle='#ab392e';ctx.beginPath();ctx.ellipse(-10,-3,11,6,Math.sin(moth.wing)*.5,0,7);ctx.ellipse(10,-3,11,6,-Math.sin(moth.wing)*.5,0,7);ctx.fill();ctx.fillStyle='#283e40';ctx.beginPath();ctx.ellipse(0,0,6,11,0,0,7);ctx.fill();ctx.fillStyle='#f7dca1';ctx.fillRect(-3,-5,2,2);ctx.fillRect(2,-5,2,2);ctx.restore()}const px=BX+(state.player.x+.5)*C,py=BY+(state.player.y+.5)*C;ctx.save();ctx.translate(px,py);if(state.invuln>0&&Math.floor(state.clock*8)%2)ctx.globalAlpha=.45;ctx.fillStyle='#f0b744';ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.fill();ctx.strokeStyle='#243c3d';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#173f45';ctx.fillRect(-3,-5,6,10);ctx.restore();if(state.drawing){const fraction=1-state.trailClock/profile().time;ctx.fillStyle='#173f45';ctx.fillRect(BX,BY+H*C+14,W*C,7);ctx.fillStyle=fraction<.28?'#b24631':'#e7a940';ctx.fillRect(BX,BY+H*C+14,W*C*Math.max(0,fraction),7)}ctx.fillStyle='#173f45';ctx.font='700 15px Arial';ctx.fillText(state.drawing?'FINISH THE LINE BEFORE IT DRIES':state.drawHeld?'DRAW ARMED · CROSS THE BLANK PAPER':'TAP DRAW TO LEAVE THE PRINTED EDGE',BX,BY+H*C+41);if(state.paused){ctx.fillStyle='#173f45bb';ctx.fillRect(BX,BY,W*C,H*C);ctx.fillStyle='#fff1d4';ctx.font='900 54px Arial';ctx.textAlign='center';ctx.fillText('PAUSED',480,330);ctx.textAlign='left'}}
let last=0;function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;tick(dt);draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
function reset(){window.dispatchEvent(new Event('vibecade:reset-input'));state.score=0;state.seed=3911;newPoster(1)}
function setPause(value){if(state.phase!=='play')return;state.paused=value;$('pause').textContent=value?'Resume':'Pause';if(value)window.dispatchEvent(new Event('vibecade:reset-input'))}
function toggleSound(){state.muted=!state.muted;$('sound').textContent=state.muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(state.muted));$('touch-sound').innerHTML=state.muted?'SOUND<br>OFF':'SOUND<br>ON';if(!state.muted)tone(550)}
function syncDrawButton(){const button=$('draw');button.classList.toggle('is-pressed',state.drawHeld||state.drawing);button.setAttribute('aria-pressed',String(state.drawHeld||state.drawing));button.innerHTML=state.drawHeld||state.drawing?'DRAW<br>ON':'TAP<br>DRAW'}
function toggleDraw(){if(state.phase!=='play'||state.paused||state.drawing)return;state.drawHeld=!state.drawHeld;syncDrawButton();tone(state.drawHeld?510:300,.04)}
function openHelp(){if(state.phase!=='play')return;setPause(true);modal.classList.add('is-visible');document.body.classList.add('instructions-open');$('instruction-close').focus({preventScroll:true})}
function closeHelp(){modal.classList.remove('is-visible');document.body.classList.remove('instructions-open');if(state.phase==='gate'){try{sessionStorage.setItem('ink-claim-instructions-v2','seen')}catch(_){}const requested=Number(new URLSearchParams(location.search).get('poster'));newPoster(requested>=1&&requested<=7?Math.floor(requested):1)}else setPause(false);canvas.focus({preventScroll:true})}
const codes={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
addEventListener('keydown',e=>{if(codes[e.code]||['Space','KeyP','KeyR','KeyM'].includes(e.code))e.preventDefault();if(e.code==='KeyM'){if(!e.repeat)toggleSound();return}if(e.code==='KeyR'){if(!e.repeat)reset();return}if(modal.classList.contains('is-visible')||state.phase!=='play')return;if(e.code==='KeyP'){if(!e.repeat)setPause(!state.paused);return}if(e.code==='Space'){if(!e.repeat)toggleDraw();return}const dir=codes[e.code];if(dir){state.keys[dir]=true;state.lastDir=dir;if(!e.repeat&&state.tapQueue.length<3)state.tapQueue.push(dir)}});
addEventListener('keyup',e=>{const dir=codes[e.code];if(dir)state.keys[dir]=false});
function clearInput(){state.drawHeld=false;state.keys={up:false,down:false,left:false,right:false};state.tapQueue=[];syncDrawButton()}
addEventListener('blur',clearInput);addEventListener('vibecade:reset-input',clearInput);addEventListener('vibecade:restart',e=>{e.preventDefault();reset()});
function bindJoystick(){if(!window.VibeCadeJoystick||document.documentElement.dataset.inkJoystickBound)return;document.documentElement.dataset.inkJoystickBound='true';window.VibeCadeJoystick(document.querySelector('[data-joystick]'),{mode:'cardinal',onChange(x,y){for(const key of ['up','down','left','right'])state.keys[key]=false;const dir=Math.abs(x)>.5?(x<0?'left':'right'):Math.abs(y)>.5?(y<0?'up':'down'):null;if(dir){state.keys[dir]=true;state.lastDir=dir;if(state.phase==='play'&&!state.paused&&state.tapQueue.length<3)state.tapQueue.push(dir)}}})}if(window.VibeCadeJoystick)bindJoystick();else addEventListener('vibecade-controls-ready',bindJoystick,{once:true});
const drawButton=$('draw');drawButton.addEventListener('pointerdown',e=>{e.preventDefault();toggleDraw()});$('touch-sound').addEventListener('click',toggleSound);$('sound').addEventListener('click',toggleSound);$('pause').addEventListener('click',()=>setPause(!state.paused));$('reset').addEventListener('click',reset);$('help-button').addEventListener('click',openHelp);$('instruction-close').addEventListener('click',closeHelp);$('continue').addEventListener('click',()=>newPoster(state.level+1));$('again').addEventListener('click',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();setPause(true)}});
updateHud();try{if(sessionStorage.getItem('ink-claim-instructions-v2')==='seen'){modal.classList.remove('is-visible');document.body.classList.remove('instructions-open');const requested=Number(new URLSearchParams(location.search).get('poster'));newPoster(requested>=1&&requested<=7?Math.floor(requested):1)}}catch(_){}draw();})();

(() => {
'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const COLS=24,ROWS=14,CELL=36,OX=48,OY=132;
const vaults=[
  {quota:3,interval:.19,growth:3,lives:4,time:50,beam:false,gates:false},
  {quota:4,interval:.18,growth:3,lives:4,time:65,beam:false,gates:false},
  {quota:5,interval:.18,growth:3,lives:4,time:75,beam:true,gates:false},
  {quota:6,interval:.17,growth:4,lives:4,time:85,beam:false,gates:true},
  {quota:8,interval:.14,growth:5,lives:2,time:85,beam:true,gates:true}
];
const names=['Grab & Go','Split Decision','Watch the Sweep','Changing Routes','The Perfect Heist'];
const briefs=['Three rubies, then reach the EXIT.','Two chambers. Cross the passages to steal from both.','Scanner targets your head. Jewelry passes safely.','Shutters alternate. Cross the OPEN passage; watch the countdown.','Scanners + shutters. Spend your tail to survive, or risk a bonus.'];
const exitCell={x:22,y:7};
let detection=null;
let unlocked=false,bonus=0,alarm=0,securityClock=0,gateClock=0,openGate=0,gateHeld=[false,false],beam=null,shedCooldown=0,grace=0;
const doorRows=[[3,4],[9,10]];

let pillars=[];
const dirs=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
const params=new URLSearchParams(location.search),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed=Number(params.get('seed'))||15927;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
let level=1,score=0,gems=0,lives=4,time=95,charge=4,snake=[],gem=null,dir=1,queue=[],grow=0,phase='instructions',resumePhase='playing',elapsed=0,acc=0,slow=false,recovery=0,flash=0,effects=[],last=0,dirty=true,sound=true,audio=null;
const same=(a,b)=>!!a&&!!b&&a.x===b.x&&a.y===b.y;
function tone(freq,duration=.1){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.7,audio.currentTime+duration);g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch(_){}}
function clearInput(){queue=[];slow=false;$('slow').classList.remove('is-pressed');}
function announce(s){$('callout').textContent=s;}
function refresh(){
 const v=vaults[level-1];$('level').textContent=level+' / 5';$('gems').textContent=unlocked?'EXIT →':gems+' / '+v.quota;
 $('lives').textContent=lives===1?'1 LAST':lives;$('time').textContent=Math.ceil(time);$('score').textContent=score.toLocaleString();
 $('brake-meter').value=charge;$('charge').textContent=charge.toFixed(1)+'s';$('time').classList.toggle('urgent',time<=12);$('lives').classList.toggle('urgent',lives===1);
 const ready=snake.length>6&&shedCooldown<=0;for(const id of ['shed','shed-desktop']){$(id).disabled=!ready;$(id).textContent=shedCooldown>0?'SHED '+Math.ceil(shedCooldown)+'s':'SHED'+(id==='shed-desktop'?' · X':'');}
 $('shed-state').textContent=ready?'X · SHED −'+Math.min(score,(snake.length-6)*25):shedCooldown>0?'SHED '+Math.ceil(shedCooldown)+'s':'SHED: GROW FIRST';
 let security='ALARM '+Math.round(alarm*100)+'%';
 if(v.beam&&beam)security+=' · '+(grace>0?'SCAN JAMMED':beam.stage==='warning'?'SCAN IN '+(beam.left/pressure()).toFixed(1)+'s':beam.stage==='active'?'SCANNING HEAD':'SCAN RECHARGING');
 if(v.gates)security+=' · '+(openGate===0?'TOP':'BOTTOM')+' OPEN '+Math.ceil((gatePeriod()-gateClock)/pressure())+'s';
 $('security-note').textContent=security;
}
function placeGem(){
 if(unlocked&&bonus>=3){gem=null;return;}
 // The foyer teaches three short routes; later thefts alternate chambers.
 const tutorial=[{x:9,y:4},{x:18,y:10},{x:4,y:11}];
 if(level===1&&!unlocked&&!snake.some(p=>same(p,tutorial[gems]))){gem={...tutorial[gems]};return;}
 let choices=[];for(let y=1;y<ROWS-1;y++)for(let x=2;x<COLS-2;x++){
  const p={x,y};if(same(p,exitCell)||x===11||snake.some(a=>same(a,p))||pillars.some(a=>same(a,p))||Math.abs(x-snake[0].x)+Math.abs(y-snake[0].y)<6)continue;
  if(level>=2&&((gems+bonus)%2===0?x<14:x>8))continue;choices.push(p);
 }
 gem=choices[Math.floor(random()*choices.length)]||{x:20,y:12};
}
function resetSnake(){snake=Array.from({length:6},(_,i)=>({x:5-i,y:7}));dir=1;grow=0;clearInput();acc=0;}
function startVault(n){
 level=n;detection=null;const v=vaults[n-1];gems=0;bonus=0;unlocked=false;alarm=0;securityClock=0;gateClock=0;openGate=0;gateHeld=[false,false];beam=null;shedCooldown=0;grace=0;
 lives=v.lives;time=v.time;charge=4;elapsed=0;gemAge=0;effects=[];flash=0;recovery=1.8;
 pillars=n===1?[]:[{x:5,y:5},{x:18,y:8}];
 if(n>=2)for(let y=0;y<ROWS;y++)if(!doorRows.flat().includes(y))pillars.push({x:11,y});
 resetSnake();placeGem();if(v.beam)armBeam();makeBackdrop();phase='playing';
 $('result-modal').classList.remove('is-visible');document.body.classList.remove('gameover-open');$('pause').textContent='Pause';$('touch-pause').textContent='PAUSE';
 announce(briefs[n-1]);refresh();dirty=true;
}
function reset(){score=0;startVault(1);if($('instruction-modal').classList.contains('is-visible')){phase='instructions';resumePhase='playing';}else canvas.focus({preventScroll:true});}
function turn(d){if(phase!=='playing')return;const previous=queue.length?queue[queue.length-1]:dir;if(d===previous||d===(previous+2)%4||queue.length>=2)return;queue.push(d);}
function finish(won){
 phase='result';clearInput();$('result-modal').classList.add('is-visible');document.body.classList.add('gameover-open');const next=won&&level<5;
 $('result-title').textContent=next?'Haul secured':won?'The perfect getaway':'Caught in the vault';
 $('result-text').textContent=won?gems+' rubies + '+bonus+' bonus jewels banked. '+lives+' lives left. Score '+score.toLocaleString()+'. '+(next?'NEXT — '+names[level]+': '+briefs[level]:'All five heists complete.'):'Vault '+level+': '+gems+' rubies, '+bonus+' bonus jewels. '+(lives===0?'Your last life was spent.':'The alarm locked the vault.')+' Score '+score.toLocaleString()+'. Shed your tail with X when a route closes.';
 $('next').hidden=!next;(next?$('next'):$('restart')).focus();tone(won?880:130,.25);dirty=true;
}
function crash(reason='Collision',caught=snake[0]){
 const spotted=reason==='Head detected';detection=spotted?{x:caught.x,y:caught.y,life:1.6}:null;
 lives--;flash=spotted?0:.6;tone(spotted?740:130,.2);if(lives<=0){finish(false);refresh();return;}
 resetSnake();recovery=1.6;grace=2;charge=Math.max(charge,2);if(gem&&snake.some(a=>same(a,gem)))placeGem();if(vaults[level-1].beam)armBeam();
 announce(reason+' · '+lives+' lives · haul kept');refresh();dirty=true;
}
function tick(){
 if(queue.length)dir=queue.shift();const d=dirs[dir],head={x:snake[0].x+d.x,y:snake[0].y+d.y};
 const eating=gem&&same(head,gem),body=snake.slice(0,grow>0||eating?snake.length:snake.length-1);
 if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||pillars.some(a=>same(a,head))||closedGate(head)||body.some(a=>same(a,head))){crash('Route blocked');return;}
 if(beamHits(head)){crash('Head detected',head);return;}
 snake.unshift(head);
 if(unlocked&&same(head,exitCell)){score+=lives*200+Math.ceil(time)*5;finish(true);refresh();return;}
 if(eating){
  const wasBonus=unlocked;if(wasBonus){bonus++;score+=400+bonus*100;time=Math.max(1,time-4);}else{gems++;score+=150+Math.max(0,Math.round(40-gemAge*2));}
  gemAge=0;grow+=vaults[level-1].growth;charge=Math.min(4,charge+1);
  effects.push({x:OX+(head.x+.5)*CELL,y:OY+(head.y+.5)*CELL,life:.65,label:wasBonus?'+ BONUS':'+ RUBY'});effects=effects.slice(-8);tone(wasBonus?1000:650);
  if(!unlocked&&gems>=vaults[level-1].quota){unlocked=true;announce('EXIT OPEN → Bank your haul, or risk up to 3 bonus jewels!');tone(900,.2);}
  else announce(wasBonus?'Bonus +'+(400+bonus*100)+' · alarm rising · EXIT is open':gems+' / '+vaults[level-1].quota+' rubies · keep a route to the exit');
  placeGem();
 }
 if(grow>0)grow--;else snake.pop();refresh();dirty=true;
}
let gemAge=0;
function pressure(){return 1+alarm*.35;}
function gatePeriod(){return level===5?5.6:7.5;}
function armBeam(){beam={axis:dir%2?'row':'col',line:dir%2?snake[0].y:snake[0].x,stage:'warning',left:level===5?1.5:2.4};}
function beamHits(p){return grace<=0&&beam&&beam.stage==='active'&&(beam.axis==='row'?p.y===beam.line:p.x===beam.line);}
function closedGate(p){if(!vaults[level-1].gates||p.x!==11)return false;const i=doorRows.findIndex(rows=>rows.includes(p.y));return i>=0&&i!==openGate&&!gateHeld[i];}
function updateSecurity(dt){
 const v=vaults[level-1];securityClock+=dt*pressure();
 if(v.gates){gateClock+=dt*pressure();if(gateClock>=gatePeriod()){gateClock-=gatePeriod();openGate=1-openGate;gateHeld=doorRows.map(rows=>snake.some(p=>p.x===11&&rows.includes(p.y)));tone(270,.06);}
  gateHeld=gateHeld.map((held,i)=>held&&snake.some(p=>p.x===11&&doorRows[i].includes(p.y)));
 }
 if(v.beam&&beam){beam.left-=dt*pressure();if(beam.left<=0){if(beam.stage==='warning'){beam.stage='active';beam.left=level===5?1.1:.8;tone(560,.06);}else if(beam.stage==='active'){beam.stage='idle';beam.left=level===5?1.7:2.8;}else armBeam();}}
}
function shed(){
 if(phase!=='playing'||snake.length<=6||shedCooldown>0)return;
 const count=snake.length-6;for(const p of snake.slice(6).filter((_,i)=>i%3===0).slice(0,8))effects.push({x:OX+(p.x+.5)*CELL,y:OY+(p.y+.5)*CELL,life:.65,label:'SHED'});
 effects=effects.slice(-8);snake=snake.slice(0,6);grow=0;const cost=Math.min(score,count*25);score-=cost;shedCooldown=6;grace=1.4;
 if(beam){beam.stage='idle';beam.left=1.6;}announce('Tail shed −'+cost+' · scanner jam 1.4s · haul kept');tone(330,.2);refresh();dirty=true;
}

function step(dt){
 if(phase!=='playing')return;if(document.body.classList.contains('touch-device')&&innerWidth<600&&innerHeight>innerWidth)return;
 elapsed+=dt;if(detection){detection.life=Math.max(0,detection.life-dt);if(!detection.life)detection=null;}effects.forEach(e=>e.life-=dt);effects=effects.filter(e=>e.life>0);flash=Math.max(0,flash-dt);
 if(recovery>0){recovery=Math.max(0,recovery-dt);dirty=true;return;}
 time=Math.max(0,time-dt);gemAge+=dt;shedCooldown=Math.max(0,shedCooldown-dt);grace=Math.max(0,grace-dt);
 alarm=Math.min(1,gems/vaults[level-1].quota*.45+bonus*.16+(vaults[level-1].time-time)/vaults[level-1].time*.2);
 if(time<=0){finish(false);refresh();return;}updateSecurity(dt);
 if(beamHits(snake[0])){crash('Head detected');return;}
 const braking=slow&&charge>0;if(braking)charge=Math.max(0,charge-dt);acc+=dt;
 const interval=vaults[level-1].interval*(braking?2:1);let steps=0;while(acc+1e-9>=interval&&phase==='playing'&&recovery<=0&&steps++<3){acc-=interval;tick();}
 refresh();dirty=true;
}
function help(){if(phase==='result')return;resumePhase=phase==='instructions'?resumePhase:phase;phase='instructions';clearInput();$('instruction-modal').classList.add('is-visible');document.body.classList.add('instructions-open');$('instruction-close').textContent='RETURN TO THE VAULT';$('instruction-close').focus();dirty=true;}
function dismiss(){try{sessionStorage.setItem('velvet-coil-scanner-intro','1');}catch(_){}$('instruction-modal').classList.remove('is-visible');document.body.classList.remove('instructions-open');phase=resumePhase;last=performance.now();canvas.focus({preventScroll:true});dirty=true;}
function pause(){if(phase==='playing'){phase='paused';clearInput();}else if(phase==='paused'){phase='playing';last=performance.now();}else return;$('pause').textContent=phase==='paused'?'Resume':'Pause';$('touch-pause').textContent=phase==='paused'?'RESUME':'PAUSE';dirty=true;}
function toggleSound(){sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('touch-sound').textContent=sound?'SOUND ON':'SOUND OFF';for(const id of ['sound','touch-sound'])$(id).setAttribute('aria-pressed',String(!sound));}
function path(points,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
function text(s,x,y,size,color='#e3c586'){ctx.fillStyle=color;ctx.font=`${size}px Georgia`;ctx.textAlign='center';ctx.fillText(s,x,y);}
function diamond(x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();}
const backdrop=document.createElement('canvas');backdrop.width=960;backdrop.height=720;
function makeBackdrop(){ctx.fillStyle='#142237';ctx.fillRect(0,0,960,720);for(let i=0;i<8;i++){path([[14+i*7,105-i*9],[120+i*12,14],[840-i*12,14],[946-i*7,105-i*9]],'#89734b55');path([[14+i*7,615+i*9],[120+i*12,706],[840-i*12,706],[946-i*7,615+i*9]],'#89734b55');}ctx.strokeStyle='#c2a365';ctx.lineWidth=2;ctx.strokeRect(19,19,922,682);text('V E L V E T   C O I L',480,51,28);if(!matchMedia('(max-width:900px),(pointer:coarse)').matches)text(names[level-1].toUpperCase(),480,75,13,'#cfad78');diamond(238,51,7,'#dfbd7b');diamond(722,51,7,'#dfbd7b');ctx.fillStyle='#1c3047';ctx.fillRect(OX-5,OY-5,COLS*CELL+10,ROWS*CELL+10);ctx.strokeStyle='#b89a63';ctx.strokeRect(OX-5,OY-5,COLS*CELL+10,ROWS*CELL+10);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){ctx.fillStyle=(x+y)%2?'#1a2b40':'#1c2e43';ctx.fillRect(OX+x*CELL,OY+y*CELL,CELL,CELL);ctx.fillStyle='#71809433';ctx.fillRect(OX+x*CELL,OY+y*CELL,1,1);}pillars.forEach(p=>{const x=OX+p.x*CELL,y=OY+p.y*CELL;ctx.fillStyle='#090f1c';ctx.fillRect(x+5,y+7,30,30);ctx.fillStyle='#8e744e';ctx.fillRect(x+1,y+1,34,34);ctx.fillStyle='#aa8650';ctx.fillRect(x+3,y+3,30,30);ctx.strokeStyle='#f3d799';ctx.strokeRect(x+6,y+6,24,24);diamond(x+18,y+18,8,'#e6ca8d');});backdrop.getContext('2d').drawImage(canvas,0,0);}
function draw(){ctx.drawImage(backdrop,0,0);drawSecurity();if(gem){const x=OX+(gem.x+.5)*CELL,y=OY+(gem.y+.5)*CELL;diamond(x,y,18,'#f3d296');diamond(x,y,14,unlocked?'#72dfce':'#d75165');ctx.save();ctx.beginPath();ctx.moveTo(x,y-14);ctx.lineTo(x+14,y);ctx.lineTo(x,y+14);ctx.closePath();ctx.fillStyle=unlocked?'#247d89':'#8c2945';ctx.fill();ctx.restore();path([[x-9,y],[x,y-10],[x+6,y]],'#ffcab4',2);if(unlocked)text('+',x,y+8,26,'#f1fff5');if(!reduced){const r=21+Math.sin(elapsed*3)*2;ctx.strokeStyle='#e3c58670';ctx.strokeRect(x-r,y-r,r*2,r*2);}}
// Fine gold links make the chain readable through every bend.
ctx.lineCap='round';for(let i=1;i<snake.length;i++){const a=snake[i-1],b=snake[i];path([[OX+(a.x+.5)*CELL,OY+(a.y+.5)*CELL],[OX+(b.x+.5)*CELL,OY+(b.y+.5)*CELL]],'#e9c985',12);}ctx.lineCap='butt';
for(let i=snake.length-1;i>=0;i--){const p=snake[i],x=OX+p.x*CELL,y=OY+p.y*CELL;ctx.fillStyle='#07122080';ctx.beginPath();ctx.roundRect(x+5,y+7,30,30,8);ctx.fill();ctx.fillStyle=i===0?'#fff1cd':i%3===0?'#e4ba72':'#c69155';ctx.beginPath();ctx.roundRect(x+3,y+3,30,30,i===0?10:8);ctx.fill();ctx.strokeStyle='#745337';ctx.lineWidth=2;ctx.stroke();if(i>0){ctx.strokeStyle='#f9dfab99';ctx.strokeRect(x+9,y+9,18,18);diamond(x+18,y+18,i%4===0?6:4,i%4===0?'#a83955':'#f5d99b');}else{const d=dirs[dir],px=-d.y,py=d.x;path([[x+18+d.x*7-px*10,y+18+d.y*7-py*10],[x+18+d.x*7+px*10,y+18+d.y*7+py*10]],'#233149',9);for(const side of [-1,1]){ctx.fillStyle='#fff5d4';ctx.beginPath();ctx.arc(x+18+d.x*7+px*side*6,y+18+d.y*7+py*side*6,3,0,7);ctx.fill();}diamond(x+18+d.x*16,y+18+d.y*16,3,'#fff1cd');}}
drawScannerFeedback();
if(phase==='playing'&&recovery<=0){const d=dirs[queue[0]??dir],h={x:snake[0].x+d.x,y:snake[0].y+d.y};const danger=h.x<0||h.x>=COLS||h.y<0||h.y>=ROWS||pillars.some(p=>same(p,h))||snake.slice(0,grow>0?snake.length:-1).some(p=>same(p,h));if(danger){const x=OX+(snake[0].x+.5)*CELL+d.x*17,y=OY+(snake[0].y+.5)*CELL+d.y*17;diamond(x,y,7,'#fb7c80');}}
effects.forEach(e=>{ctx.globalAlpha=Math.max(0,e.life/.65);const r=reduced?20:20+(1-e.life/.65)*22;diamond(e.x,e.y,r,'#f1d28c55');text(e.label||'+ RUBY',e.x,e.y-24,16,'#fff1cd');ctx.globalAlpha=1;});if(slow&&charge>0){ctx.strokeStyle='#b6e4ed';ctx.lineWidth=3;ctx.strokeRect(OX-8,OY-8,COLS*CELL+16,ROWS*CELL+16);}if(flash>0){ctx.fillStyle=`rgba(227,108,99,${flash*.2})`;ctx.fillRect(OX,OY,COLS*CELL,ROWS*CELL);}if(recovery>0){ctx.fillStyle='#101a2ddd';ctx.fillRect(125,260,710,115);text(detection?'HEAD DETECTED':names[level-1].toUpperCase(),480,298,26);text(detection?'The scanner spotted the thief. Your jewelry was not the target.':briefs[level-1],480,330,17,'#fff1d3');text('READY · '+Math.ceil(recovery),480,358,15,'#cfad78');}if(phase==='paused'){ctx.fillStyle='#101a2de8';ctx.fillRect(OX,OY,COLS*CELL,ROWS*CELL);text('THE VAULT CAN WAIT',480,350,30);text('Resume when you are ready',480,388,19,'#fff1d3');}dirty=false;}

function drawSecurity(){
 // The exit is a physical destination, never an automatic level transition.
 const x=OX+exitCell.x*CELL,y=OY+exitCell.y*CELL;
 ctx.fillStyle=unlocked?'#78d5bd':'#41526a';ctx.fillRect(x-2,y-3,40,42);ctx.fillStyle='#142237';ctx.fillRect(x+3,y+2,30,32);
 path([[x+9,y+18],[x+27,y+18],[x+21,y+12]],unlocked?'#baffdc':'#8393a5',3);path([[x+27,y+18],[x+21,y+24]],unlocked?'#baffdc':'#8393a5',3);text(unlocked?'EXIT':'LOCK',x+18,y-9,16,unlocked?'#baffdc':'#afbbca');
 if(level>=2){for(let i=0;i<2;i++){const top=OY+doorRows[i][0]*CELL,px=OX+11*CELL,shut=closedGate({x:11,y:doorRows[i][0]}),warning=vaults[level-1].gates&&i===openGate&&gateClock>gatePeriod()-2.2;
 ctx.fillStyle=shut?'#a96753':warning?'#94734370':'#5aaf9955';ctx.fillRect(px+1,top,34,72);
 ctx.strokeStyle=shut?'#f2b095':warning?'#ffe1a1':'#8dedcc';ctx.lineWidth=2;ctx.strokeRect(px+2,top+1,32,70);
 if(shut){for(let j=0;j<5;j++)path([[px+4,top+8+j*13],[px+31,top+8+j*13]],'#f2b095',3);}else{ctx.setLineDash([4,5]);path([[px+18,top+6],[px+18,top+66]],warning?'#ffe1a1':'#baffdc',2);ctx.setLineDash([]);}
 if(vaults[level-1].gates){text(shut?'CLOSED':gateHeld[i]&&i!==openGate?'TAIL SAFE':warning?'CLOSING':'OPEN',px+18,top-6,11,shut?'#ffc6b3':'#d3ffee');}
 }}
 if(beam&&beam.stage!=='idle'){
  const active=beam.stage==='active'&&grace<=0,row=beam.axis==='row',position=beam.line*CELL;
  const bx=row?OX:OX+position,by=row?OY+position:OY,bw=row?COLS*CELL:CELL,bh=row?CELL:ROWS*CELL;
  ctx.save();ctx.beginPath();ctx.rect(OX,OY,COLS*CELL,ROWS*CELL);ctx.clip();
  // A translucent inspection strip, not a damaging laser. Its footprint matches detection.
  ctx.fillStyle=active?'#8edbcc35':'#e9c98520';ctx.fillRect(bx,by,bw,bh);
  ctx.strokeStyle=active?'#9fddce':'#e4c888';ctx.lineWidth=1.5;ctx.setLineDash(active?[]:[5,7]);ctx.strokeRect(bx+1,by+1,bw-2,bh-2);ctx.setLineDash([]);
  const drift=reduced?0:(elapsed*12)%18;
  ctx.strokeStyle=active?'#b3eedb30':'#f0d79f18';ctx.lineWidth=1;
  for(let n=0;n<(row?bw:bh);n+=18){if(row)path([[bx+n+drift,by+3],[bx+n+drift,by+bh-3]],ctx.strokeStyle,1);else path([[bx+3,by+n+drift],[bx+bw-3,by+n+drift]],ctx.strokeStyle,1);}
  ctx.restore();
  // Paired optical readers at the strip edges explain its purpose.
  for(const end of [0,1]){const ex=row?OX+(end?COLS*CELL:0):bx+18,ey=row?by+18:OY+(end?ROWS*CELL:0);
   ctx.fillStyle='#142237';ctx.beginPath();ctx.arc(ex,ey,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle=active?'#b8ead7':'#e4c888';ctx.lineWidth=2;ctx.stroke();
   ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(ex,ey,4,0,Math.PI*2);ctx.fill();
  }
 }

}


function drawScannerFeedback(){
 if(beam&&beam.stage!=='idle'){
  const inStrip=p=>beam.axis==='row'?p.y===beam.line:p.x===beam.line;
  // Jewelry is recognized as inert loot, so it sparkles without triggering capture.
  if(beam.stage==='active')for(const p of snake.slice(1)){if(!inStrip(p))continue;const x=OX+(p.x+.5)*CELL,y=OY+(p.y+.5)*CELL;
   path([[x-7,y],[x+7,y]],'#e9fff0',2);path([[x,y-7],[x,y+7]],'#e9fff0',2);
  }
  if(inStrip(snake[0])&&grace<=0&&recovery<=0){const p=snake[0];reticle(OX+(p.x+.5)*CELL,OY+(p.y+.5)*CELL,'#ffdfa0');}
 }
 if(detection){reticle(OX+(detection.x+.5)*CELL,OY+(detection.y+.5)*CELL,'#ffe6ab');}
}
function reticle(x,y,color){
 const r=23;for(const sx of [-1,1])for(const sy of [-1,1])path([[x+sx*(r-8),y+sy*r],[x+sx*r,y+sy*r],[x+sx*r,y+sy*(r-8)]],color,2.5);
}

function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(!(params.has("test")&&params.has("manual")))step(dt);if(dirty)draw();requestAnimationFrame(frame);}
$('shed').onclick=shed;$('shed-desktop').onclick=shed;$('instruction-close').onclick=dismiss;$('help-button').onclick=help;$('reset').onclick=reset;$('restart').onclick=reset;$('next').onclick=()=>{startVault(level+1);canvas.focus({preventScroll:true});};$('pause').onclick=pause;$('touch-pause').onclick=pause;$('sound').onclick=toggleSound;$('touch-sound').onclick=toggleSound;
const keyDirs={arrowup:0,w:0,arrowright:1,d:1,arrowdown:2,s:2,arrowleft:3,a:3};
addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(e.target.closest?.('.modal.is-visible'))return;if(key in keyDirs){e.preventDefault();if(!e.repeat)turn(keyDirs[key]);}else if(key===' '){e.preventDefault();if(phase==='playing')slow=true;}else if(!e.repeat){if(key==='r'){e.preventDefault();reset();}if(key==='x'){e.preventDefault();shed();}if(key==='m')toggleSound();if(key==='?')help();if(key==='escape')pause();}});
addEventListener('keyup',e=>{if(e.key===' ')slow=false;});
const slowButton=$('slow');slowButton.addEventListener('pointerdown',e=>{e.preventDefault();if(phase==='playing'){slow=true;slowButton.classList.add('is-pressed');slowButton.setPointerCapture(e.pointerId);}});for(const event of ['pointerup','pointercancel','lostpointercapture'])slowButton.addEventListener(event,()=>{slow=false;slowButton.classList.remove('is-pressed');});
let swipe=null;canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus({preventScroll:true});swipe={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!swipe)return;const x=e.clientX-swipe.x,y=e.clientY-swipe.y;if(Math.max(Math.abs(x),Math.abs(y))<16)return;turn(Math.abs(x)>Math.abs(y)?x>0?1:3:y>0?2:0);swipe={x:e.clientX,y:e.clientY};});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>swipe=null);
function bindJoystick(){window.VibeCadeJoystick(document.querySelector('[data-joystick]'),{mode:'cardinal',onChange:(x,y)=>{if(x||y)turn(Math.abs(x)>Math.abs(y)?x>0?1:3:y>0?2:0);}});}if(window.VibeCadeJoystick)bindJoystick();else addEventListener('vibecade-controls-ready',bindJoystick,{once:true});
addEventListener('vibecade:restart',e=>{e.preventDefault();reset();});addEventListener('vibecade:reset-input',clearInput);addEventListener('blur',()=>{clearInput();swipe=null;if(phase==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(phase==='playing')pause();}});
for(const modal of document.querySelectorAll('.modal'))modal.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...modal.querySelectorAll('button')].filter(b=>!b.hidden);const first=buttons[0],end=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}});
startVault(Math.max(1,Math.min(5,Math.floor(Number(params.get('vault'))||1))));let seen=false;try{seen=sessionStorage.getItem('velvet-coil-scanner-intro')==='1';}catch(_){}if(!seen){phase='instructions';$('instruction-close').focus();}else{$('instruction-modal').classList.remove('is-visible');document.body.classList.remove('instructions-open');}
if(params.has('test'))window.coilTest={state:()=>({level,score,gems,lives,time,charge,snake:snake.map(p=>({...p})),gem:gem&&{...gem},dir,queue:[...queue],grow,phase,recovery,slow,elapsed,acc,vaults,pillars,unlocked,bonus,alarm,beam:beam&&{...beam},gateClock,openGate,gateHeld:[...gateHeld],gatePeriod:gatePeriod(),shedCooldown,grace,exitCell,detection}),seed:n=>seed=n>>>0,jump:n=>startVault(n),step,turn,crash,draw,shed,setTime:t=>time=t,setGem:p=>gem=p,setSnake:(a,d)=>{snake=a;dir=d;grow=0;queue=[];recovery=0;acc=0;},setGems:n=>{gems=n;unlocked=n>=vaults[level-1].quota;},setBeam:b=>beam=b,setGate:t=>gateClock=t,setScore:n=>score=n};
addEventListener('resize',()=>{makeBackdrop();dirty=true;});
requestAnimationFrame(frame);
})();

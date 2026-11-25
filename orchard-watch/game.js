(() => {
'use strict';
const $ = id => document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d');
const keys=[...'qwerasdfzxcv'];
let worldWidth=1200;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Bursts add simultaneous decisions; interval is the gap after a complete burst.
const rounds=[
 {quota:12,time:35,life:1.8,interval:1.95,group:1,burstGap:0,friends:0,baskets:6},
 {quota:18,time:38,life:1.75,interval:1.4,group:2,burstGap:.34,friends:.10,baskets:6},
 {quota:24,time:42,life:1.55,interval:1.1,group:3,burstGap:.25,friends:.14,baskets:6},
 {quota:32,time:45,life:1.35,interval:.75,group:4,burstGap:.18,friends:.18,baskets:6},
 {quota:45,time:42,life:.9,interval:.4,group:5,burstGap:.12,friends:.27,baskets:3}
];
const names=['First light','Busy branches','The afternoon rush','Golden hour','Master harvest'];
const positions=Array.from({length:keys.length},(_,i)=>({x:(i%4+.5)*worldWidth/4,y:250+Math.floor(i/4)*160}));
let rng=Number(new URLSearchParams(location.search).get('seed'))||92731;
const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
let level=1,score=0,hits=0,baskets=6,time=35,elapsed=0,spawnIn=.8,burstLeft=0,actors=Array(keys.length).fill(null),effects=[],streak=0,phase='instructions',resumePhase='playing',sound=true,audio=null,last=0,bannerTime=0,dirty=true,hitLock=0;
let seen=false;try{seen=sessionStorage.getItem('orchard-watch-intro')==='1';}catch(_){}
const buttons=positions.map((p,i)=>{const b=document.createElement('button');b.className='hole';b.style.left=`${(p.x-100)/worldWidth*100}%`;b.style.top=`${(p.y/650-.20)*100}%`;b.setAttribute('aria-label',`Burrow ${i+1}, key ${keys[i].toUpperCase()}`);b.innerHTML=`<span>${keys[i].toUpperCase()}</span>`;$('holes').appendChild(b);b.addEventListener('pointerdown',e=>{e.preventDefault();b.focus({preventScroll:true});thump(i);});b.addEventListener('click',e=>{if(e.detail===0)thump(i);});return b;});
function tone(freq,duration=.07){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.55,audio.currentTime+duration);g.gain.setValueAtTime(.075,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch(_){}}
function announce(text){$('banner').textContent=text;bannerTime=2.2;dirty=true;}
function refresh(){const r=rounds[level-1];$('round').textContent=`${level} / 5`;$('quota').textContent=`${hits} / ${r.quota}`;$('lives').textContent=`${baskets} left`;$('time').textContent=`${Math.ceil(time)}s`;$('score').textContent=score.toLocaleString();$('lives').classList.toggle('urgent',baskets<=2);$('time').classList.toggle('urgent',time<=10);}
function startRound(n){level=n;const r=rounds[n-1];hits=0;baskets=r.baskets;time=r.time;elapsed=0;spawnIn=.9;burstLeft=r.group;actors.fill(null);effects=[];streak=0;hitLock=0;phase='playing';$('result-modal').classList.remove('is-visible');document.body.classList.remove('gameover-open');announce(`${names[n-1]} · ${r.quota} marmots to chase`);refresh();dirty=true;}
function reset(){score=0;$('pause').textContent='Pause';startRound(1);if($('instruction-modal').classList.contains('is-visible')){resumePhase='playing';phase='instructions';}else buttons[4].focus({preventScroll:true});}
function showHelp(){if(phase==='result')return;resumePhase=phase==='instructions'?resumePhase:phase;phase='instructions';$('instruction-modal').classList.add('is-visible');document.body.classList.add('instructions-open');$('instruction-close').textContent='BACK TO THE ORCHARD';$('instruction-close').focus();dirty=true;}
function dismiss(){try{sessionStorage.setItem('orchard-watch-intro','1');}catch(_){}$('instruction-modal').classList.remove('is-visible');document.body.classList.remove('instructions-open');phase=resumePhase;last=performance.now();buttons[4].focus({preventScroll:true});dirty=true;}
function finish(won){phase='result';document.body.classList.add('gameover-open');$('result-modal').classList.add('is-visible');const next=won&&level<5;$('result-title').textContent=next?'Harvest secured!':won?'Master of the orchard!':'The orchard needs you';$('result-text').textContent=won?`${hits} marmots chased. ${baskets} baskets saved. Score ${score.toLocaleString()}. ${next?'Fresh baskets await in the next round.':'Five harvests protected. Beautiful work.'}`:`Round ${level}: ${hits} of ${rounds[level-1].quota} marmots chased. ${baskets<=0?'Your baskets are empty.':'The harvest bell rang.'} Score ${score.toLocaleString()}. Watch for striped faces and leave the hats alone.`;$('continue').hidden=!next;$('restart').textContent='PLAY AGAIN · ROUND 1';(next?$('continue'):$('restart')).focus();dirty=true;}
function damage(i,text){baskets--;streak=0;effects.push({i,text,life:.85,bad:true});tone(130,.13);announce(`${text} · ${baskets} baskets left`);if(baskets<=0)finish(false);}
function thump(i){if(phase!=='playing'||hitLock>0)return;hitLock=.09;const a=actors[i];if(!a){hitLock=.24;streak=0;effects.push({i,text:'Empty!',life:.5});tone(180,.04);}else{actors[i]=null;if(a.friend)damage(i,'Careful! Gardener');else{hits++;streak++;const points=100+Math.min(5,Math.floor(streak/4))*25;score+=points;if(streak%4===0)announce(`${streak} clean thumps - ${points} points each`);effects.push({i,text:`+${points}`,life:.65,hit:true});tone(400+Math.min(streak,12)*28);if(hits>=rounds[level-1].quota){score+=baskets*100+Math.ceil(time)*10;finish(true);}}}effects=effects.slice(-16);refresh();dirty=true;}
function spawn(){const empty=[];actors.forEach((a,i)=>{if(!a)empty.push(i);});if(!empty.length)return;const i=empty[Math.floor(random()*empty.length)];const friend=random()<rounds[level-1].friends;actors[i]={age:0,life:rounds[level-1].life,friend};}
function step(dt){if(phase!=='playing')return;elapsed+=dt;time=Math.max(0,time-dt);hitLock=Math.max(0,hitLock-dt);spawnIn-=dt;bannerTime-=dt;if(bannerTime<=0)$('banner').textContent='';for(let i=0;i<actors.length;i++){const a=actors[i];if(a){a.age+=dt;if(a.age>=a.life){actors[i]=null;if(!a.friend)damage(i,'One apple lost');if(phase==='result')break;}}}if(phase!=='playing'){refresh();return;}if(time<=0){finish(false);refresh();return;}if(spawnIn<=0){spawn();const r=rounds[level-1];burstLeft--;if(burstLeft>0){spawnIn+=r.burstGap;}else{burstLeft=r.group;spawnIn+=r.interval*(.93+random()*.14);}}effects.forEach(e=>e.life-=dt);effects=effects.filter(e=>e.life>0);refresh();dirty=true;}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(points,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
function text(s,x,y,size,color='#fff2cf'){ctx.fillStyle=color;ctx.font=`bold ${size}px Georgia`;ctx.textAlign='center';ctx.fillText(s,x,y);}
const backdrop=document.createElement('canvas');backdrop.width=900;backdrop.height=650;
function drawScene(){const sky=ctx.createLinearGradient(0,0,0,220);sky.addColorStop(0,'#d2d9bd');sky.addColorStop(1,'#aac2ae');ctx.fillStyle=sky;ctx.fillRect(0,0,worldWidth,650);ellipse(710,68,43,43,'#f6d182');ellipse(270,224,430,150,'#6f9470');ellipse(790,235,470,146,'#52765c');ctx.fillStyle='#486043';ctx.fillRect(0,182,worldWidth,468);for(let i=0;i<Math.ceil(worldWidth/85)+1;i++){const x=i*87-24;ctx.fillStyle='#856645';ctx.fillRect(x,80,10,128);line([[x+2,115],[x+2,199]],'#b18b58',2);line([[x+7,134],[x+7,195]],'#554e35',1);ellipse(x+6,67,63,50,i%2?'#be703e':'#dc9b49');ellipse(x-13,87,38,31,'#cc833e');for(let k=0;k<30;k++){const lx=x-49+(k*31)%108,ly=37+(k*17)%70;ellipse(lx,ly,8,3,k%3===0?'#f2be654c':k%3===1?'#874b342f':'#ffe0a52b');}
 for(let j=0;j<5;j++){const ax=x-34+j*18,ay=64+(j%2)*27;ellipse(ax,ay,7,8,'#a9442f');ellipse(ax-2,ay-2,2,3,'#f2a05b');line([[ax,ay-7],[ax+1,ay-10]],'#594831',1);}}line([[0,182],[worldWidth,182]],'#ead7a1',9);line([[0,208],[worldWidth,208]],'#ccb580',7);for(let i=0;i<Math.ceil(worldWidth/85)+1;i++){ctx.fillStyle='#efdda8';ctx.fillRect(i*85+24,160,8,65);}for(let row=0;row<3;row++){ellipse(worldWidth/2,260+row*160,worldWidth/2+20,62,row%2?'#ac864f':'#bc9259');line([[0,315+row*160],[worldWidth,315+row*160]],'#314f3b',8);}for(let i=0;i<42;i++){const x=(i*173+53)%worldWidth,y=235+(i*97)%398;ellipse(x,y,4,2,'#d5aa68');}// Etched furrows, pebbles and grass are baked into the resize-only backdrop.
 for(let row=0;row<3;row++){
  ctx.save();ctx.beginPath();ctx.ellipse(worldWidth/2,260+row*160,worldWidth/2+20,62,0,0,Math.PI*2);ctx.clip();
  for(let y=215+row*160;y<321+row*160;y+=9)line([[0,y],[worldWidth,y]],y%2?'#f4c78627':'#684d3021',1);
  for(let i=0;i<160;i++){const x=(i*179+row*23)%worldWidth,y=215+row*160+(i*37)%106;ellipse(x,y,1.8,.8,i%2?'#f2c28354':'#624a3644');}ctx.restore();
  for(let i=0;i<Math.ceil(worldWidth/65);i++){const x=i*65+17,y=334+row*160;line([[x-5,y+4],[x-8,y-5],[x,y],[x+5,y-8]],'#8a9a5b',1.5);}
 }
 text('EST. 1982',65,36,12,'#385643');}
function drawSign(){
ctx.save();ctx.translate(worldWidth/2-450,0);
line([[322,17],[328,50]],'#3b4e36',4);line([[579,17],[573,50]],'#3b4e36',4);
ctx.fillStyle='#423a2840';ctx.fillRect(301,46,304,82);
const paper=ctx.createLinearGradient(0,40,0,122);paper.addColorStop(0,'#fff0c9');paper.addColorStop(1,'#dbc28a');ctx.fillStyle=paper;ctx.fillRect(298,40,304,82);
 for(let i=0;i<65;i++){ctx.fillStyle='#94784917';ctx.fillRect(304+(i*41)%292,47+(i*17)%68,12,1);}
ctx.strokeStyle='#916a3d';ctx.lineWidth=3;ctx.strokeRect(303,45,294,72);ctx.strokeStyle='#fff4d5';ctx.lineWidth=1;ctx.strokeRect(307,49,286,64);
text('APPLE HILL',450,79,31,'#304c37');text('HARVEST CO-OPERATIVE',450,102,11,'#655331');
ellipse(311,53,3,3,'#927341');ellipse(589,53,3,3,'#927341');
ctx.restore();
}
function drawBurrows(){positions.forEach((p,i)=>{ellipse(p.x,p.y+21,105,28,'#846141');ellipse(p.x,p.y+11,95,25,'#3c3024');ellipse(p.x,p.y+7,81,17,'#231f1b');
 ctx.save();ctx.beginPath();ctx.ellipse(p.x,p.y+21,105,28,0,0,Math.PI*2);ctx.clip();
 for(let k=0;k<24;k++){const x=p.x-100+(k*29)%200,y=p.y+23+(k*7)%22;line([[x,y],[x+4,y-1]],k%2?'#c499626e':'#443b2c50',1.5);}ctx.restore();
 ctx.strokeStyle='#c09a66';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(p.x,p.y+11,96,26,0,.12,Math.PI-.12);ctx.stroke();for(let j=0;j<4;j++){const x=p.x-92+j*61;line([[x,p.y+31],[x-5,p.y+20],[x+7,p.y+26]],'#6c7846',3);}});}
function resizeField(){
 const bounds=$('field').getBoundingClientRect();
 if(!bounds.width||!bounds.height)return;
 worldWidth=Math.round(650*bounds.width/bounds.height);canvas.width=worldWidth;
 positions.forEach((p,i)=>{p.x=(i%4+.5)*worldWidth/4;buttons[i].style.left=`${(p.x-100)/worldWidth*100}%`;buttons[i].style.width=`${200/worldWidth*100}%`;});
 drawScene();drawSign();drawBurrows();
 backdrop.width=worldWidth;backdrop.getContext('2d').drawImage(canvas,0,0);dirty=true;draw();
}
new ResizeObserver(resizeField).observe($('field'));
// Cached painted portraits retain every original silhouette and identifying mark.
const portraits=[false,true].map(friend=>{
 const c=document.createElement('canvas');c.width=202;c.height=215;const g=c.getContext('2d');g.translate(101,123);
 const ellipse=(x,y,rx,ry,color)=>{const shade=g.createRadialGradient(x-rx*.36,y-ry*.4,1,x,y,Math.max(rx,ry)*1.18);shade.addColorStop(0,color);shade.addColorStop(.62,color);shade.addColorStop(1,'#3c302c');g.fillStyle=shade;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};
 const line=(points,color,width=3)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke();};
 if(friend){ellipse(0,0-23,48,60,'#456851');ellipse(0,0-61,36,36,'#e9b47d');ellipse(0,0-88,60,13,'#f3d799');g.fillStyle='#d8b16a';g.fillRect(0-35,0-119,70,30);line([[0-35,0-96],[0+35,0-96]],'#9f512e',8);ellipse(0-12,0-64,3.5,4,'#352e27');ellipse(0+12,0-64,3.5,4,'#352e27');line([[0-8,0-49],[0,0-44],[0+9,0-49]],'#7b5135',3);line([[0+39,0-4],[0+56,0-57]],'#dae0a0',3);for(let k=0;k<5;k++){const t=k*Math.PI*2/5;ellipse(0+56+Math.cos(t)*10,0-58+Math.sin(t)*10,7,7,'#fff2cf');}ellipse(0+56,0-58,5,5,'#e5ac3c');}else{ellipse(0,0-29,51,65,'#8e5237');ellipse(0-35,0-90,17,21,'#74452f');ellipse(0+35,0-90,17,21,'#74452f');ellipse(0-35,0-90,9,12,'#c89665');ellipse(0+35,0-90,9,12,'#c89665');ellipse(0,0-64,46,39,'#b97949');g.fillStyle='#eed5a2';g.beginPath();g.moveTo(0-9,0-101);g.lineTo(0+9,0-101);g.lineTo(0+6,0-46);g.lineTo(0-6,0-46);g.fill();ellipse(0-21,0-69,6,7,'#2b2820');ellipse(0+21,0-69,6,7,'#2b2820');ellipse(0-23,0-72,2,2,'#fff');ellipse(0+19,0-72,2,2,'#fff');ellipse(0,0-45,24,16,'#e3ba83');ellipse(0,0-50,9,6,'#382c24');g.fillStyle='#fff0ca';g.fillRect(0-7,0-36,6,9);g.fillRect(0+1,0-36,6,9);ellipse(0-24,0-7,15,11,'#c48b5a');ellipse(0+26,0-7,15,11,'#c48b5a');ellipse(0+14,0-15,14,16,'#bd482c');line([[0+14,0-29],[0+17,0-37]],'#504431',3);ellipse(0+23,0-32,9,4,'#768a43');}
 if(friend){
  // Straw weave, folded work jacket, collar and buttons stay inside the original shapes.
  g.save();g.beginPath();g.rect(-35,-119,70,23);g.clip();
  for(let i=-40;i<40;i+=7)line([[i,-119],[i+16,-97]],'#fff0c14d',1);
  for(let i=-115;i<-95;i+=5)line([[-35,i],[35,i]],'#7e5b362f',1);g.restore();
  g.save();g.beginPath();g.ellipse(0,-23,48,60,0,0,Math.PI*2);g.clip();
  line([[-24,-37],[-5,-17],[0,-31],[5,-17],[24,-37]],'#a3b193',3);
  line([[0,-27],[0,14]],'#243f32',2);for(const y of [-15,-1,12])ellipse(1,y,2,2,'#d6c496');
  line([[-35,1],[-15,-5],[-12,12],[-30,14]],'#849a7e',2);g.restore();
 }else{
  // Short painted fur strokes on the chest, cheek edges and ears.
  g.save();g.beginPath();g.ellipse(0,-29,51,65,0,0,Math.PI*2);g.clip();
  for(let i=0;i<52;i++){const x=-46+(i*29)%92,y=-24+(i*17)%57;line([[x,y],[x+2,y+5]],i%2?'#e1af762e':'#452d272e',1.5);}g.restore();
  for(const side of [-1,1]){line([[side*30,-87],[side*35,-94],[side*39,-86]],'#e3b57b',1.5);line([[side*27,-47],[side*41,-48]],'#e3ba83',1);line([[side*28,-43],[side*42,-40]],'#e3ba83',1);}
  ellipse(10,-20,3,6,'#ee9b59');
 }
 return c;
});
function drawActor(a,p){const rise=Math.min(1,a.age/.13,(a.life-a.age)/.16);const y=p.y+65*(1-Math.max(0,rise));ctx.save();ctx.beginPath();ctx.rect(p.x-101,p.y-123,202,139);ctx.clip();ctx.drawImage(portraits[a.friend?1:0],p.x-101,y-123);ctx.restore();const left=Math.max(0,1-a.age/a.life);ctx.fillStyle='#362f22';ctx.fillRect(p.x-38,p.y+36,76,5);ctx.fillStyle=a.friend?'#f7e9c6':left<.3?'#ffe19b':'#d7c987';ctx.fillRect(p.x-38,p.y+36,76*left,5);}
function draw(){ctx.drawImage(backdrop,0,0);actors.forEach((a,i)=>{if(a)drawActor(a,positions[i]);});effects.forEach(e=>{const p=positions[e.i];ctx.globalAlpha=Math.min(1,e.life*3);ellipse(p.x,p.y-48,62,44,e.bad?'#93462ec9':'#fbe6aca6');text(e.text,p.x,p.y-49-(reducedMotion?0:(1-e.life)*22),e.bad?19:25,e.bad?'#fff2cf':'#274939');if(e.hit&&!reducedMotion){ctx.strokeStyle='#fff3c9';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y-48,35+(1-e.life)*38,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;});if(phase==='paused'){ctx.fillStyle='#183b2dd9';ctx.fillRect(0,0,worldWidth,650);text('A moment in the shade',worldWidth/2,302,34);text('Tap Resume to return to the harvest',worldWidth/2,340,19);}dirty=false;}
function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;step(dt);if(dirty)draw();requestAnimationFrame(frame);}
function togglePause(){if(phase==='playing'){phase='paused';$('pause').textContent='Resume';}else if(phase==='paused'){phase='playing';$('pause').textContent='Pause';}dirty=true;}
function toggleSound(){sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(!sound));}
$('instruction-close').onclick=dismiss;$('help-button').onclick=showHelp;$('sound').onclick=toggleSound;$('pause').onclick=togglePause;$('reset').onclick=reset;$('restart').onclick=reset;$('continue').onclick=()=>startRound(level+1);
window.addEventListener('vibecade:restart',e=>{e.preventDefault();reset();});
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(keys.includes(key)){if(e.target.closest('.modal.is-visible'))return;e.preventDefault();if(!e.repeat)thump(keys.indexOf(key));}else if(key==='backspace'&&!e.repeat){e.preventDefault();reset();}else if(key==='m'&&!e.repeat)toggleSound();else if(key==='?'&&!e.repeat)showHelp();else if(key==='escape'&&!e.repeat)togglePause();});
window.addEventListener('blur',()=>{if(phase==='playing')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing')togglePause();});
startRound(1);if(!seen){phase='instructions';$('instruction-close').focus();}else{document.body.classList.remove('instructions-open');$('instruction-modal').classList.remove('is-visible');}
if(new URLSearchParams(location.search).has('test'))window.orchardTest={state:()=>({level,score,hits,baskets,time,elapsed,phase,actors:actors.map(a=>a&&({...a})),rounds}),jump:n=>{startRound(n);},step,thump,setActor:(i,friend=false,age=0)=>{actors[i]={friend,age,life:rounds[level-1].life};dirty=true;},setTime:t=>time=t,draw,clear:()=>actors.fill(null)};
resizeField();
requestAnimationFrame(frame);
})();

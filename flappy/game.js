import {HEIGHT,routes,newFlight,flap,advance} from './flight.js';
import {paint,postalPortrait,sceneryReady} from './art.js';

const $=id=>document.getElementById(id);
const canvas=$('gameCanvas'),p=canvas.getContext('2d'),guide=$('instruction-modal');
const seenKey='vibecade-instructions-flappy';
const recordKey=i=>'vibecade-flappy-post-'+i;
function read(store,key){try{return window[store].getItem(key);}catch{return null;}}
function save(store,key,value){try{window[store].setItem(key,String(value));}catch{/* Flight works without storage. */}}
const scores=Array.from({length:routes.length+1},(_,i)=>{
  const n=Number(read('localStorage',recordKey(i)));
  return Number.isSafeInteger(n)&&n>0?n:0;
});
function record(i){return scores[i];}
function unlocked(){const i=routes.findIndex((_,i)=>!record(i));return i===-1?routes.length:i;}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let f=newFlight(unlocked()), paused=false, muted=read('localStorage','flappy-airmail-audio')!=='on';
let width=960,frame=0,last=0,acc=0,noticeUntil=0,audio;
const fx=[];
function tone(notes,type='sine'){
  if(muted||guide.open)return;
  try{
    audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});
    for(const [i,hz] of notes.entries()){
      const at=audio.currentTime+i*.075,osc=audio.createOscillator(),gain=audio.createGain();
      osc.type=type;osc.frequency.setValueAtTime(hz,at);osc.frequency.exponentialRampToValueAtTime(hz*1.05,at+.08);
      gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.047,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.16);
      osc.connect(gain);gain.connect(audio.destination);osc.start(at);osc.stop(at+.17);
    }
  }catch{/* Audio is optional. */}
}
function sound(){muted=!muted;save('localStorage','flappy-airmail-audio',muted?'off':'on');soundLabel();tone([440,660]);}
function soundLabel(){$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!muted));}

function render(){
  p.setTransform(canvas.width/width,0,0,canvas.height/HEIGHT,0,0);
  paint(p,f,width,fx,reduced.matches);
}
function fit(){
  const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.7);
  width=Math.max(1,rect.width)*HEIGHT/Math.max(1,rect.height);
  canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));
  render();
}
function updateHUD(){
  const endless=f.index===routes.length;
  $('leg').textContent=endless?'Express':`Leg ${String(f.index+1).padStart(2,'0')} / 07`;
  $('port').textContent=f.route.name;
  $('beacons').textContent=endless?String(f.passed):`${f.passed} / ${f.route.heights.length}`;
  $('postage').textContent=endless?String(f.stamps):`${f.stamps} / ${f.route.quota}`;
  $('shield').textContent=f.shield?'ARMED':'● '.repeat(f.chain)+'○ '.repeat(3-f.chain);
  $('shield').setAttribute('aria-label',f.shield?'Spare wing ready':`${f.chain} of 3 consecutive stamps`);
  $('score').textContent=String(f.score).padStart(5,'0');
  $('pause').disabled=f.phase!=='flying';$('pause').textContent=paused?'Resume':'Pause';
  $('pause').setAttribute('aria-label',paused?'Resume flight':'Pause flight');
  $('takeoff').hidden=guide.open || (f.phase!=='ready'&&!paused);
  $('takeoff').firstChild.textContent=paused?'Resume flight ':'Tap to take off ';
}
function map(){
  const n=unlocked(),stops=$('stops');stops.replaceChildren();
  $('delivered').textContent=`${n} of ${routes.length} delivered`;
  for(let i=0;i<routes.length+(n===routes.length);i++){
    const route=routes[i],b=document.createElement('button'),code=document.createElement('b'),name=document.createElement('span');
    b.className='stop';b.disabled=i>n;
    if(i===f.index)b.setAttribute('aria-current','step');
    if(record(i)&&route)b.classList.add('done');
    code.textContent=route?.code||'EXP';name.textContent=route?.name||'Night Express';
    b.title=`${name.textContent}${record(i)?' · Best '+record(i):''}`;b.setAttribute('aria-label',b.title);
    b.append(code,name);b.addEventListener('click',()=>{if(i!==f.index && !guide.open)reset(i);});stops.append(b);
  }
}
function notify(text,duration=1.05){$('notice').textContent=text;noticeUntil=f.time+duration;}
function confetti(color){
  if(reduced.matches)return;
  for(let i=0;i<10;i++){
    if(fx.length>=40)fx.shift();
    fx.push({x:4,y:f.y,dx:-22-Math.random()*65,dy:(Math.random()-.55)*78,age:0,life:.48+Math.random()*.2,size:3+Math.random()*3,color});
  }
}
function receipt(){
  const delivered=f.phase==='delivered',short=f.phase==='short',express=f.index===routes.length;
  if((delivered||express)&&f.score>record(f.index)){
    scores[f.index]=f.score;
    save('localStorage',recordKey(f.index),f.score);
  }
  $('cancel-mark').textContent=delivered?'Delivered':'Return to sender';
  $('result-leg').textContent=f.route.name;
  $('result-title').textContent=delivered?(f.stamps===f.route.heights.length?'Perfect post!':'Mail delivered!'):short?'Postage short.':'Flight grounded.';
  $('result-detail').textContent=delivered?
    `${f.stamps} stamps · ${f.score} points.${f.index===routes.length-1?' The Night Express is open.':''}`:
    short?`You brought ${f.stamps} of the ${f.route.quota} stamps due. Fly this leg again.`:
    `${f.reason}. ${f.passed} beacons cleared · ${f.score} points.`;
  $('again').textContent=delivered?(f.index===routes.length-1?'Fly the Night Express →':'Fly the next leg →'):'Retry this flight ↻';
  $('arrival').hidden=false;$('again').focus({preventScroll:true});map();
}
function event(kind){
  if(kind==='stamp'){confetti('#ffdc86');tone([684,912]);}
  if(kind==='shield'){notify('Spare wing armed');tone([540,710,950]);}
  if(kind==='save'){confetti('#dbf9f0');notify('Spare wing used');tone([690,470]);}
  if(['lost','delivered','short'].includes(kind)){
    tone(kind==='delivered'?[523,659,784,1046]:[280,195]);
    $('notice').textContent='';receipt();
  }
  updateHUD();
}
function flying(){return f.phase==='flying'&&!paused&&!guide.open;}
function tick(now){
  frame=0;
  if(!flying())return;
  acc+=Math.min((now-last)/1000,.08);last=now;
  while(acc>=1/120 && flying()){advance(f,1/120,event);acc-=1/120;for(const e of fx)e.age+=1/120;}
  for(let i=fx.length-1;i>=0;i--)if(fx[i].age>=fx[i].life)fx.splice(i,1);
  if(noticeUntil && f.time>=noticeUntil){$('notice').textContent='';noticeUntil=0;}
  render();if(flying())frame=requestAnimationFrame(tick);
}
function stop(){cancelAnimationFrame(frame);frame=0;acc=0;}
function startClock(){if(!frame&&flying()){last=performance.now();frame=requestAnimationFrame(tick);}}
function reset(index=f.index){
  stop();f=newFlight(index);paused=false;fx.length=0;noticeUntil=0;
  $('arrival').hidden=true;$('notice').textContent='';map();updateHUD();render();canvas.focus({preventScroll:true});
}
function action(){
  if(guide.open)return;
  if(paused){paused=false;updateHUD();}
  if(f.phase==='delivered')return;
  if(f.phase==='lost'||f.phase==='short')reset();
  flap(f);updateHUD();render();startClock();
}
function togglePause(){
  if(guide.open||f.phase!=='flying')return;
  paused=!paused;
  if(paused)stop();
  else{canvas.focus({preventScroll:true});startClock();}
  updateHUD();render();
}
function hold(){if(flying()){paused=true;stop();updateHUD();}}
function help(){
  if(guide.open)return;
  hold();guide.classList.add('is-visible');guide.showModal();updateHUD();
}
function dismiss(){
  guide.close();guide.classList.remove('is-visible');save('sessionStorage',seenKey,'1');
  updateHUD();(f.phase==='flying'||f.phase==='ready'?canvas:$('again')).focus({preventScroll:true});
}
function next(){if(guide.open)return;reset(f.phase==='delivered'?Math.min(f.index+1,routes.length):f.index);action();}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;e.preventDefault();canvas.focus({preventScroll:true});action();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
$('again').addEventListener('click',next);
$('takeoff').addEventListener('click',()=>{canvas.focus({preventScroll:true});action();});
$('sound').addEventListener('click',sound);$('pause').addEventListener('click',togglePause);
$('help-button').addEventListener('click',help);$('instruction-close').addEventListener('click',dismiss);
guide.addEventListener('cancel',e=>{e.preventDefault();if(read('sessionStorage',seenKey)==='1')dismiss();});
window.addEventListener('vibecade:restart',e=>{e.preventDefault();if(!guide.open)reset();});
document.addEventListener('keydown',e=>{
  if(guide.open||e.altKey||e.ctrlKey||e.metaKey)return;
  if(['Space','ArrowUp','KeyW'].includes(e.code)){
    if(e.code==='Space'&&e.target.closest('button,a'))return;
    e.preventDefault();if(!e.repeat)action();return;
  }
  if(e.repeat)return;
  switch(e.key.toLowerCase()){
    case 'p':case 'escape':togglePause();break;
    case '?':help();break;
    case 'r':reset();break;
    case 'm':sound();break;
  }
});
window.addEventListener('blur',hold);
document.addEventListener('visibilitychange',()=>{if(document.hidden)hold();});
new ResizeObserver(fit).observe(canvas);
postalPortrait($('courier'));fit();map();soundLabel();updateHUD();sceneryReady.then(render);
if(read('sessionStorage',seenKey)!=='1')help();

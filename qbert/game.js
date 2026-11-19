import {movements,newMovement,steps,hop,rewind,adjacent,liftAt} from './movement.js';
import {layout,pick,paint,artwork} from './art.js';

const $=id=>document.getElementById(id);
const canvas=$('board'),ctx=canvas.getContext('2d'),dialog=$('instruction-modal');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const seenKey='vibecade-qbert-clockwork-manual';
function read(store,key){try{return window[store].getItem(key);}catch{return null;}}
function save(store,key,value){try{window[store].setItem(key,String(value));}catch{/* Use session memory when storage is unavailable. */}}
const recordKey=i=>'vibecade-qbert-clockwork-best-'+i;
const best=movements.map((_,i)=>{const n=Number(read('localStorage',recordKey(i)));return Number.isSafeInteger(n)&&n>0?n:0;});
function unlocked(){const i=best.indexOf(0);return i<0?movements.length:i;}
const roman=['I','II','III','IV','V','VI','VII'];
let state=newMovement(unlocked()),anim=null,frame=0,queued=null,last=0,face=1,geometry;
let width=800,height=540,sound=read('localStorage','qbert-clockwork-sound')==='on',audio;
const rules=[
  'One hop lights a tile. Plan each landing before the winder moves.',
  'Count the sockets. Two sockets take two landings to fill.',
  'The horned hunter follows your last position. Triangle-marked tiles flip off when revisited.',
  'Two winders move together. Watch both crosses before the chime.',
  'Wind past the rim patrol and the hunter. Save the marked ratchets for your way out.',
  'The bell runner cuts across the center. Three-socket tiles take three landings.',
  'All three winders move every second hop. Use the lifts to change sides.'
];
function chime(notes,wave='sine'){
  if(!sound||dialog.open)return;
  try{
    audio??=new (window.AudioContext||window.webkitAudioContext)();
    if(audio.state==='suspended')audio.resume().catch(()=>{});
    for(const [i,hz] of notes.entries()){
      const at=audio.currentTime+.075*i,o=audio.createOscillator(),g=audio.createGain();
      o.type=wave;o.frequency.value=hz;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.048,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+.21);
      o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+.22);
    }
  }catch{/* The movement can be played silently. */}
}
function soundLabel(){$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));}
function toggleSound(){sound=!sound;save('localStorage','qbert-clockwork-sound',sound?'on':'off');soundLabel();chime([440,660]);}
function draw(){ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);paint(ctx,state,width,height,geometry,anim,face);}
function resize(){
  const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
  const dpr=Math.min(1.75,window.devicePixelRatio||1);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  geometry=layout(state,width,height);draw();
}
function nav(){
  const list=$('movements'),limit=unlocked();list.replaceChildren();
  for(let i=0;i<movements.length+Number(limit===movements.length);i++){
    const b=document.createElement('button'),num=document.createElement('b'),name=document.createElement('span');
    b.className='stop';b.disabled=i>limit;
    num.textContent=roman[i]||'∞';name.textContent=movements[i]?.name||'Encore';
    if(i===Math.min(state.index,movements.length))b.setAttribute('aria-current','step');
    b.title=name.textContent+(best[i]?' · Best '+best[i]+' hops':'');b.setAttribute('aria-label',b.title);
    b.append(num,name);b.onclick=()=>{if(state.index!==i)begin(i);};list.append(b);
  }
}
function hud(){
  const lit=state.tiles.filter(t=>t.charge===t.need).length;
  $('tiles').textContent=lit+' / '+state.tiles.length;$('hops').textContent=state.hops;$('lives').textContent=state.lives;
  const left=state.spec.beat-state.beat;
  $('beat').textContent=left===1?'Next hop':left+' hops';
  $('hand').style.transform='rotate('+state.beat/state.spec.beat*360+'deg)';
  $('rewind').disabled=!state.rewinds||!state.previous||state.phase==='won';
}
function begin(index){
  cancelAnimationFrame(frame);anim=null;queued=null;frame=0;state=newMovement(index);face=1;
  geometry=layout(state,width,height);
  const encore=index>=movements.length;
  $('stage-number').textContent=encore?'Encore '+(index-6):'Movement '+roman[index]+' / VII';
  $('stage-name').textContent=state.spec.name;$('rule').textContent=rules[movements.indexOf(state.spec)];
  $('result').hidden=true;
  $('status').textContent=best[index]?'Personal best · '+best[index]+' hops.':'Wind every tile until its face shines gold.';
  nav();hud();draw();if(!dialog.open)canvas.focus({preventScroll:true});
}
function showResult(){
  if(state.phase==='playing')return;
  const won=state.phase==='won';
  $('result-label').textContent=won?'Movement complete':'Movement stopped';
  $('result-title').textContent=won?(state.index===6?'Midnight strikes!':'The clock sings.'): 'Out of lives.';
  $('result-text').textContent=won?`${state.hops} hops · ${state.lives} ${state.lives===1?'life':'lives'} left.${state.index===6?' The encore is open.':''}`:'Restart this movement or rewind the last hop if your key is still wound.';
  $('advance').textContent=won?(state.index>=6?'Play the encore →':'Next movement →'):'Restart movement';
  $('rescue').hidden=won||!state.rewinds;
  $('result').hidden=false;$('advance').focus({preventScroll:true});
}
function finish(){
  anim=null;frame=0;draw();hud();
  if(state.phase!=='playing'){queued=null;showResult();return;}
  const next=queued;queued=null;if(next)move(next);
}
function animate(now){
  frame=0;if(!anim||dialog.open)return;
  anim.elapsed+=Math.min(65,Math.max(0,now-last));last=now;
  if(anim.elapsed>=anim.duration){finish();return;}
  draw();frame=requestAnimationFrame(animate);
}
function startAnim(event,patrol){
  const long=['lift','fall','hit'].includes(event.kind);
  anim={...event,patrol,elapsed:0,duration:reduced.matches?0:long?420:210};
  if(!anim.duration){finish();return;}
  last=performance.now();draw();frame=requestAnimationFrame(animate);
}
const messages={fall:'Off the pyramid! The lit tiles hold their charge.',hit:'Caught by a winder! The lit tiles hold their charge.',lift:'The lift returns you to the crown.',unwind:'That ratchet slipped. Land on it again to relight it.',charge:'Socket wound. This tile needs another landing.'};
function move(dir){
  if(dialog.open||state.phase!=='playing')return;
  if(anim){if(!['fall','hit','rewind'].includes(anim.kind))queued=dir;return;}
  const event=hop(state,dir);if(!event)return;
  face=dir==='ne'||dir==='se'?1:-1;
  if(state.phase==='won'){
    if(state.index<movements.length && (!best[state.index]||state.hops<best[state.index])){
      best[state.index]=state.hops;save('localStorage',recordKey(state.index),state.hops);nav();
    }
    chime([392,494,587,784]);
  }else if(event.kind==='hit'||event.kind==='fall')chime([196,131],'triangle');
  else if(event.kind==='lift')chime([349,440,523]);
  else if(event.chime)chime([523,784]);
  else chime([event.kind==='lit'?587:330],'triangle');
  $('status').textContent=messages[event.kind]||(state.beat===state.spec.beat-1?'Chime on your next hop. Avoid the crossed tiles.':event.kind==='lit'?'Another tile shines gold.':'The clock ticks on.');
  hud();startAnim(event,state.previous.patrol.map(e=>e[0]));
}
function windBack(){
  if(dialog.open)return;
  const from=state.at,patrol=state.enemies.map(e=>e.at);
  if(!rewind(state))return;
  cancelAnimationFrame(frame);queued=null;anim=null;$('result').hidden=true;
  $('status').textContent='One hop unwound. Choose another landing.';chime([659,523,392]);hud();
  startAnim({from,to:state.at,kind:'rewind'},patrol);canvas.focus({preventScroll:true});
}
function showHelp(){if(dialog.open)return;cancelAnimationFrame(frame);queued=null;dialog.classList.add('is-visible');dialog.showModal();}
function closeHelp(){
  dialog.close();dialog.classList.remove('is-visible');save('sessionStorage',seenKey,'1');
  if(anim){last=performance.now();frame=requestAnimationFrame(animate);}
  (state.phase==='playing'?canvas:$('advance')).focus({preventScroll:true});
}
const keys={ArrowUp:'nw',ArrowRight:'ne',ArrowLeft:'sw',ArrowDown:'se',KeyQ:'nw',KeyE:'ne',KeyA:'sw',KeyD:'se'};
document.addEventListener('keydown',e=>{
  if(dialog.open||e.ctrlKey||e.altKey||e.metaKey)return;
  if(keys[e.code]){e.preventDefault();if(!e.repeat)move(keys[e.code]);return;}
  if(e.repeat)return;
  if(e.code==='KeyZ')windBack();
  if(e.code==='KeyR')begin(state.index);
  if(e.code==='KeyM')toggleSound();
  if(e.key==='?')showHelp();
});
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.isPrimary||dialog.open||state.phase!=='playing')return;
  e.preventDefault();canvas.focus({preventScroll:true});
  const r=canvas.getBoundingClientRect(),cell=pick(state,geometry,e.clientX-r.left,e.clientY-r.top);
  if(!cell)return;
  const dir=Object.keys(steps).find(d=>cell.lift!==undefined?liftAt(state,state.at,d)===cell.lift:adjacent(state,state.at,d)===cell.id);
  if(dir)move(dir);else $('status').textContent='Hop to a neighboring tile. The lifts board from the next-to-last row.';
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.querySelectorAll('[data-hop]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.hop)));
$('rewind').onclick=windBack;$('rescue').onclick=windBack;$('sound').onclick=toggleSound;
$('reset-button').onclick=()=>begin(state.index);
$('advance').onclick=()=>begin(state.phase==='won'?state.index+1:state.index);
$('help-button').onclick=showHelp;$('instruction-close').onclick=closeHelp;
dialog.addEventListener('cancel',e=>{e.preventDefault();if(read('sessionStorage',seenKey)==='1')closeHelp();});
window.addEventListener('vibecade:restart',e=>{e.preventDefault();if(!dialog.open)begin(state.index);});
window.addEventListener('blur',()=>{queued=null;});
new ResizeObserver(resize).observe(canvas);
geometry=layout(state,width,height);begin(state.index);resize();soundLabel();artwork.then(draw).catch(()=>draw());
if(read('sessionStorage',seenKey)!=='1')showHelp();

import {cells, burrow, escapeRoute, gardens, wildGarden} from './gardens.js';
import {svg, stamp, center, preparePlate} from './illustrations.js';

const $ = id => document.getElementById(id);
const board = $('board'), modal = $('instruction-modal');
const seenKey = 'vibecade-instructions-trap-the-mouse';
function read(store, key) { try { return window[store].getItem(key); } catch { return null; } }
function save(store, key, value) { try { window[store].setItem(key, value); } catch { /* Play without storage. */ } }
const recordKey = i => 'vibecade-mouse-garden-best-' + i;
const best = gardens.map((_,i) => {
  const v = Number(read('localStorage',recordKey(i)));
  return Number.isSafeInteger(v) && v > 0 ? v : null;
});
function unlocked() {
  const next = best.indexOf(null);
  return next < 0 ? gardens.length : next;
}
let stage = unlocked(), wildLayout = [], hedges, mouse, route, outcome, history, selected, face = 1;
let guardedUntil = 0, sound = read('localStorage','vibecade-mouse-sound') === 'on', audio;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const portrait = matchMedia('(max-width:640px) and (orientation:portrait)');
const figures = [], plots = [], bestiary = ['#ded3ac','#e3d7b3','#d7cda8','#e5d9b7'];
let press = null, scout = null, ignoreTap = false;
const path = '0,-27.4 23.7,-13.7 23.7,13.7 0,27.4 -23.7,13.7 -23.7,-13.7';
const pad = n => String(n).padStart(2,'0');

function chime(notes) {
  if (!sound || modal.open) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    for (const [i,hz] of notes.entries()) {
      const at = audio.currentTime + i*.09, osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = 'sine'; osc.frequency.value = hz;
      gain.gain.setValueAtTime(.0001,at);
      gain.gain.exponentialRampToValueAtTime(.095,at+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,at+.26);
      osc.connect(gain); gain.connect(audio.destination);
      osc.start(at); osc.stop(at+.27);
    }
  } catch { /* Sound is optional. */ }
}

function makePlots() {
  for (const cell of cells) {
    const {x,y} = center(cell);
    const plot = svg('g',{class:'cell',transform:`translate(${x} ${y})`,role:'button','data-cell':cell.id});
    plot.append(svg('polygon',{class:'face',points:path,fill:cell.edge?'#c59b71':bestiary[(cell.id*7+cell.r+8)%4]}));
    if (cell.edge) {
      const angle = Math.atan2(y-231,x-340)*180/Math.PI+90;
      plot.append(stamp('exit-mark',{transform:`rotate(${angle}) translate(0 -13)`}));
    } else {
      plot.append(stamp('tuft',{transform:`translate(${cell.id%2?11:-11} 10) scale(.75)`}));
    }
    const hedge = stamp('hedge',{transform:`scale(${cell.id%3===0?-1:1} 1)`});
    plot.append(hedge);
    $('plots').append(plot);
    plots.push(plot); figures.push(hedge);
  }
}

function drawTrail(line = route, origin = mouse) {
  const tracks = $('tracks');
  tracks.replaceChildren();
  let from = center(cells[origin]);
  for (const id of line || []) {
    const to = center(cells[id]);
    const angle = Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI + 90;
    const print = svg('g',{transform:`translate(${to.x} ${to.y}) rotate(${angle})`});
    print.append(stamp('paw',{transform:'translate(-3 4) rotate(-12)'}),stamp('paw',{transform:'translate(3 -4) rotate(12)'}));
    tracks.append(print);
    from = to;
  }
}

function drawBoard(previous = mouse) {
  for (const c of cells) {
    const occupied = hedges.has(c.id), here = mouse === c.id;
    figures[c.id].setAttribute('visibility',occupied?'visible':'hidden');
    const trailIndex = route?.indexOf(c.id) ?? -1;
    const description = occupied ? 'hedge' : here ? 'mouse' : trailIndex >= 0 ? 'mouse trail, step '+(trailIndex+1) : 'empty';
    plots[c.id].setAttribute('aria-label',`Row ${c.r+5}, plot ${c.q-Math.max(-4,-c.r-4)+1}, ${description}${c.edge?', exit':''}`);
    plots[c.id].setAttribute('aria-disabled',String(occupied || here || !!outcome));
    plots[c.id].setAttribute('tabindex',c.id === selected && !outcome ? '0':'-1');
  }
  const pos = center(cells[mouse]), old = center(cells[previous]);
  if (old.x !== pos.x) face = Math.sign(pos.x-old.x);
  $('runner').setAttribute('transform',`translate(${pos.x} ${pos.y})`);
  $('hop').querySelector('use').setAttribute('transform',`scale(${face} 1)`);
  $('hop').getAnimations().forEach(a=>a.cancel());
  if (previous !== mouse && !reducedMotion.matches) {
    const dx = old.x-pos.x, dy = old.y-pos.y;
    $('hop').animate([
      {transform:`translate(${dx}px,${dy}px)`},
      {transform:`translate(${dx*.5}px,${dy*.5-6}px)`},
      {transform:'translate(0,0)'}
    ],{duration:210,easing:'ease-in-out'});
  }
  drawTrail();
}

function drawChapters() {
  const trail = $('trail');
  trail.replaceChildren();
  for (let i=0; i < gardens.length + Number(unlocked()===gardens.length); i++) {
    const b = document.createElement('button');
    b.textContent = i===gardens.length ? '✤' : String(i+1);
    let name = gardens[i]?.name || 'Wild garden';
    if (best[i]) name += `, best ${best[i]} moves`;
    b.title = name; b.setAttribute('aria-label',name);
    if (i===stage) b.setAttribute('aria-current','step');
    b.disabled = i > unlocked();
    b.addEventListener('click',()=>{ if (stage!==i) begin(i,true); });
    trail.append(b);
  }
}

function startMessage() {
  return best[stage] ? `Garden best: ${best[stage]} moves.` : 'Plant a hedge to close an escape route.';
}
function begin(i, fresh = false) {
  endScout();
  stage = i;
  const garden = gardens[i];
  if (!garden && (fresh || !wildLayout.length)) wildLayout = wildGarden();
  hedges = new Set(garden?.hedges || wildLayout);
  history = []; mouse = burrow; outcome = ''; face = 1; guardedUntil = 0;
  route = escapeRoute(mouse,hedges); selected = route[0];
  $('garden-number').textContent = garden ? `Garden ${pad(i+1)} / 05` : 'Endless gardens';
  $('garden-name').textContent = garden?.name || 'The Wild Garden';
  board.style.setProperty('--bloom',garden?.bloom || '#c7a15f');
  $('result').hidden = true;
  $('move-count').textContent = '00'; $('undo').disabled = true;
  $('status').textContent = startMessage();
  drawChapters(); drawBoard();
}
function showResult() {
  const caught = outcome === 'caught', last = stage===gardens.length-1;
  const turns = history.length;
  $('result-label').textContent = caught ? 'All paths closed' : 'At the garden edge';
  $('result-title').textContent = caught ? last ? 'The gardens are safe!' : 'Mouse caught!' : 'The mouse slipped out.';
  $('result-detail').textContent = caught ? `Caught in ${turns} ${turns===1?'move':'moves'}.${last?' Wild gardens are now open.':''}` : 'Undo the last hedge and try another route.';
  $('advance').textContent = caught ? stage>=gardens.length-1 ? 'Enter a wild garden →':'Next garden →' : 'Undo last move';
  $('result').hidden = false;
  $('advance').focus({preventScroll:true});
}
function plant(id) {
  if (modal.open || outcome || performance.now()<guardedUntil || hedges.has(id) || mouse===id) return;
  const previous = mouse;
  history.push({id,mouse,face});
  hedges.add(id);
  const path = escapeRoute(mouse,hedges);
  if (!path) outcome = 'caught';
  else {
    mouse = path[0];
    if (cells[mouse].edge) outcome = 'escaped';
  }
  route = outcome ? null : escapeRoute(mouse,hedges);
  guardedUntil = performance.now() + (reducedMotion.matches ? 0 : 215);
  $('move-count').textContent = pad(history.length);
  $('undo').disabled = false;
  drawBoard(previous);
  if (!reducedMotion.matches) figures[id].animate([{opacity:.25},{opacity:1}],{duration:180});
  if (outcome==='caught' && stage<gardens.length && (!best[stage] || history.length<best[stage])) {
    best[stage] = history.length;
    save('localStorage',recordKey(stage),String(history.length));
    drawChapters();
  }
  chime(outcome==='caught'?[523,659,784]:outcome==='escaped'?[392,294]:[392,494]);
  $('status').textContent = outcome ? outcome==='caught'?'Every escape route is closed.':'The mouse reached an exit.' :
    route.length===1 ? 'One step from the edge!' : `Nearest exit is ${route.length} steps away.`;
  if (outcome) showResult();
}
function undoMove() {
  endScout();
  if (modal.open || !history.length) return;
  const last = history.pop();
  mouse = last.mouse; face = last.face; selected = last.id; hedges.delete(last.id);
  outcome = ''; guardedUntil = 0; route = escapeRoute(mouse,hedges);
  $('result').hidden = true;
  $('status').textContent = 'Last hedge lifted. Try another plot.';
  $('move-count').textContent = pad(history.length); $('undo').disabled = !history.length;
  drawBoard();
  plots[selected].focus({preventScroll:true});
}
function openHelp() {
  if (modal.open) return;
  endScout();
  $('instruction-close').firstChild.textContent = read('sessionStorage',seenKey)==='1'?'Return to the garden ':'Enter the garden ';
  modal.classList.add('is-visible'); modal.showModal();
  $('hop').getAnimations().forEach(a=>a.pause());
}
function closeHelp() {
  modal.close(); modal.classList.remove('is-visible');
  save('sessionStorage',seenKey,'1');
  $('hop').getAnimations().forEach(a=>a.play());
  (outcome?$('advance'):plots[selected]).focus({preventScroll:true});
}
function syncSound() {
  $('sound').textContent = sound ? 'Sound on':'Sound off';
  $('sound').setAttribute('aria-pressed',String(sound));
}
function toggleSound() {
  sound=!sound; save('localStorage','vibecade-mouse-sound',sound?'on':'off'); syncSound();
  if (sound) chime([523]);
}
function focusTile(id) {
  endScout();
  plots[selected].setAttribute('tabindex','-1');
  selected = id; plots[selected].setAttribute('tabindex','0');
  plots[selected].focus({preventScroll:true});
}
function endScout() {
  if (press) clearTimeout(press.timer);
  press = null;
  if (!scout) return;
  $('forecast').replaceChildren();
  $('runner').removeAttribute('opacity');
  $('status').textContent = scout.status;
  scout = null;
  drawTrail();
}
function scoutPlot(id) {
  if (scout || modal.open || outcome || hedges.has(id) || mouse===id) return;
  const trial = new Set(hedges).add(id);
  const reply = escapeRoute(mouse,trial);
  scout = {status:$('status').textContent};
  const plot = center(cells[id]);
  const preview = $('forecast');
  preview.append(stamp('hedge',{transform:`translate(${plot.x} ${plot.y})`,opacity:'.68'}));
  drawTrail(reply ? reply.slice(1) : [],reply?.[0] ?? mouse);
  if (!reply) {
    $('status').textContent = 'Scouting · This hedge closes every route.';
    return;
  }
  const to = center(cells[reply[0]]), from = center(cells[mouse]);
  $('runner').setAttribute('opacity','.35');
  preview.append(svg('path',{d:`M${from.x} ${from.y}L${to.x} ${to.y}`,stroke:'#774737','stroke-width':2,'stroke-dasharray':'3 4'}));
  preview.append(stamp('field-mouse',{transform:`translate(${to.x} ${to.y}) scale(${Math.sign(to.x-from.x)||face} 1)`}));
  $('status').textContent = cells[reply[0]].edge ? 'Scouting · The mouse would escape.' : 'Scouting · The mouse would step here.';
}
board.addEventListener('pointerdown',e => {
  if (!e.isPrimary || e.button!==0 || modal.open || outcome) return;
  endScout(); ignoreTap = false;
  const plot = e.target.closest('.cell');
  if (!plot || plot.getAttribute('aria-disabled')==='true') return;
  const id = Number(plot.dataset.cell);
  press = {pointer:e.pointerId,x:e.clientX,y:e.clientY,timer:setTimeout(()=>{
    scoutPlot(id);
    ignoreTap = true;
  },360)};
  plot.setPointerCapture(e.pointerId);
});
board.addEventListener('pointermove',e => {
  if (press && e.pointerId===press.pointer && Math.hypot(e.clientX-press.x,e.clientY-press.y)>12) {
    ignoreTap = true;
    endScout();
  }
});
for (const type of ['pointerup','pointercancel','lostpointercapture']) {
  board.addEventListener(type,e=>{ if (press?.pointer===e.pointerId) endScout(); });
}
board.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('blur',endScout);
window.addEventListener('keyup',e=>{ if (e.key.toLowerCase()==='p') endScout(); });
board.addEventListener('click',e => {
  if (ignoreTap) { ignoreTap=false; return; }
  const plot = e.target.closest('.cell');
  if (plot && !modal.open && !outcome) {
    const id = Number(plot.dataset.cell);
    focusTile(id); plant(id);
  }
});
board.addEventListener('keydown',e => {
  if (modal.open || outcome) return;
  if (e.key.toLowerCase()==='p') { e.preventDefault(); scoutPlot(selected); return; }
  endScout();
  if (['Enter',' '].includes(e.key)) { e.preventDefault(); if (!e.repeat) plant(selected); return; }
  const moves = {ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowDown:[0,1],ArrowUp:[0,-1]};
  if (!moves[e.key]) return;
  e.preventDefault();
  const here=cells[selected], [dq,dr]=moves[e.key];
  let target=cells.find(c=>c.q===here.q+dq && c.r===here.r+dr);
  // At the sloping edge, keep vertical navigation on the nearest plot.
  if (!target && dr) target=cells.find(c=>c.q===here.q-dr && c.r===here.r+dr);
  if (target) focusTile(target.id);
});
document.addEventListener('keydown',e => {
  if (modal.open || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.key.toLowerCase()) {
    case 'u': undoMove(); break;
    case 'r': begin(stage); plots[selected].focus(); break;
    case 'm': toggleSound(); break;
    case '?': openHelp(); break;
  }
});
$('advance').addEventListener('click',()=> {
  if (outcome==='escaped') { undoMove(); return; }
  begin(Math.min(stage+1,gardens.length),true); plots[selected].focus({preventScroll:true});
});
$('help-button').addEventListener('click',openHelp);
$('instruction-close').addEventListener('click',closeHelp);
modal.addEventListener('cancel',e=>{e.preventDefault(); if (read('sessionStorage',seenKey)==='1') closeHelp();});
$('sound').addEventListener('click',toggleSound);
$('reset-button').addEventListener('click',()=>{ if (!modal.open) begin(stage); });
$('undo').addEventListener('click',undoMove);
function frame() { board.setAttribute('viewBox', portrait.matches ? '105 25 470 412' : '0 0 680 462'); }
portrait.addEventListener('change',frame);
preparePlate(); makePlots(); frame(); begin(stage); syncSound();
if (read('sessionStorage',seenKey)!=='1') openHelp();

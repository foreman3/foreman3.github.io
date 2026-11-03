(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const pads = [...document.querySelectorAll('[data-pad]')];
  const names = ['Sun', 'Wave', 'Moon', 'Star'];
  const frequencies = [261.63, 329.63, 392, 523.25];
  const instructionKey = 'echo-pavilion-endless-instructions';
  const bestKey = 'echo-pavilion-best-length';
  const beat = .7;
  let sequence = [], position = 0, completed = 0, best = 0;
  let phase = 'ready', clock = 0, flash = -1, flashClock = 0;
  let paused = true, started = false, muted = true, audio, seed = 1;
  let last = 0, previousFocus, manual = false, progressKey = '';
  try {
    const saved = Number(localStorage.getItem(bestKey));
    if (Number.isSafeInteger(saved) && saved > 0) best = saved;
  } catch (_) {}

  function tone(index, duration = .22) {
    if (muted || paused) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume().catch(() => {});
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = index < 0 ? 130 : frequencies[index];
      gain.gain.setValueAtTime(.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.13, audio.currentTime + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + duration + .02);
    } catch (_) {}
  }
  function randomNote() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor(seed / 4294967296 * 4);
  }
  function text(id, value) {
    if ($(id).textContent !== String(value)) $(id).textContent = value;
  }
  function light(index) { flash = index; flashClock = .25; tone(index); }
  function status(mode, message) { text('mode', mode); text('message', message); }
  function hud() {
    text('length', sequence.length || 1);
    text('completed', completed);
    text('best', best);
    text('hint', 'One more note each round · Take your time');
  }
  function saveBest() {
    if (completed <= best) return;
    best = completed;
    try { localStorage.setItem(bestKey, String(best)); } catch (_) {}
  }
  function playback() {
    phase = 'lead'; clock = .8; position = 0; flash = -1;
    status('LISTEN', sequence.length === 1 ? 'Remember the first note.' : 'Same melody. One new note.');
    hud();
  }
  function begin() {
    sequence = []; position = 0; completed = 0;
    seed = (Date.now() >>> 0) || 1;
    sequence.push(randomNote());
    started = true; $('result').hidden = true;
    playback();
  }
  function finish() {
    phase = 'over'; flash = -1; tone(-1, .35);
    status('PERFORMANCE COMPLETE', 'A new melody is waiting.');
    text('result-title', completed === 1 ? 'You remembered 1 note' : 'You remembered ' + completed + ' notes');
    text('result-copy', 'Your longest complete sequence: ' + completed + '. Best: ' + best + '. Start a new game and see how far you can go.');
    $('result').hidden = false; $('retry').focus(); hud();
  }
  function press(index) {
    if (paused || phase !== 'input') return;
    light(index);
    if (sequence[position] !== index) { finish(); return; }
    position++;
    status('YOUR TURN', names[index] + ' · ' + position + ' of ' + sequence.length);
    if (position === sequence.length) {
      completed = sequence.length; saveBest();
      phase = 'celebrate'; clock = 1;
      status('BEAUTIFULLY PLAYED', 'One new note joins your melody.');
    }
    hud();
  }
  function update(dt) {
    if (paused) return;
    if (flashClock > 0) { flashClock -= dt; if (flashClock <= 0) flash = -1; }
    // Clock controls presentation only. Input can wait indefinitely.
    if (!['lead', 'play', 'celebrate'].includes(phase)) return;
    clock -= dt;
    if (clock > 0) return;
    if (phase === 'lead') {
      phase = 'play'; position = 0; light(sequence[0]); clock = beat;
    } else if (phase === 'play') {
      position++;
      if (position === sequence.length) {
        phase = 'input'; position = 0; flash = -1;
        status('YOUR TURN', 'Repeat the sequence. Take as long as you need.');
      } else { light(sequence[position]); clock = beat; }
    } else {
      sequence.push(randomNote());
      playback();
    }
  }
  function paint() {
    const cabinet = document.querySelector('.cabinet');
    if (cabinet.dataset.phase !== phase) cabinet.dataset.phase = phase;
    const key = [phase, position, sequence.length].join(':');
    if (key !== progressKey) {
      progressKey = key;
      // A sliding window keeps the display bounded even for very long runs.
      const start = Math.max(0, Math.min(position - 12, sequence.length - 24));
      const end = Math.min(sequence.length, start + 24), dots = [];
      for (let i = start; i < end; i++) {
        const dot = document.createElement('i');
        dot.className = i < position ? 'done' : '';
        if (phase === 'play' && position === i) dot.classList.add('current');
        dots.push(dot);
      }
      $('progress').replaceChildren(...dots);
      $('progress').setAttribute('aria-label', position + ' of ' + sequence.length + ' notes');
    }
    pads.forEach((pad, i) => pad.classList.toggle('lit', i === flash && !paused));
  }
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (!manual) update(dt);
    paint(); requestAnimationFrame(frame);
  }
  function showInstructions() {
    if (!$('instruction-modal').hidden && started && paused) return;
    previousFocus = document.activeElement; paused = true; $('result').hidden = true;
    audio?.suspend().catch(() => {});
    $('instruction-modal').hidden = false;
    $('instruction-modal').classList.add('is-visible');
    document.body.classList.add('modal-open');
    text('instruction-close', started ? 'Return to the melody' : 'Start a new game');
    $('instruction-close').focus();
  }
  function closeInstructions() {
    paused = false; $('instruction-modal').hidden = true;
    $('instruction-modal').classList.remove('is-visible');
    document.body.classList.remove('modal-open');
    try { sessionStorage.setItem(instructionKey, 'seen'); } catch (_) {}
    if (!muted) audio?.resume().catch(() => {});
    if (!started) begin();
    if (phase === 'over') { $('result').hidden = false; $('retry').focus(); }
    else (previousFocus && previousFocus !== document.body ? previousFocus : pads[0]).focus();
  }
  function restart() {
    if (!$('instruction-modal').hidden) return;
    paused = false; begin(); pads[0].focus();
  }
  function sound() {
    muted = !muted;
    text('sound', muted ? 'Sound off' : 'Sound on');
    $('sound').setAttribute('aria-pressed', String(!muted));
    if (!muted) tone(0); else audio?.suspend().catch(() => {});
  }
  pads.forEach((p,i)=>{p.addEventListener('pointerdown',e=>{e.preventDefault();if(e.button!==0)return;p.setPointerCapture(e.pointerId);p.classList.add('pressed');press(i);});const release=()=>p.classList.remove('pressed');['pointerup','pointercancel','lostpointercapture'].forEach(event=>p.addEventListener(event,release));p.addEventListener('contextmenu',e=>e.preventDefault());p.addEventListener('click',e=>{if(e.detail===0)press(i);});});
  const keyMap={KeyQ:0,KeyW:1,KeyA:2,KeyS:3,Digit1:0,Digit2:1,Digit3:2,Digit4:3};
  document.addEventListener('keydown',e=>{if(e.code==='Tab'){const modal=[...document.querySelectorAll('.modal')].find(m=>!m.hidden);if(modal){const buttons=[...modal.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}if(e.target.matches('button')&&['Enter','Space'].includes(e.code))return;if(e.code in keyMap){e.preventDefault();if(!e.repeat)press(keyMap[e.code]);}else if(['KeyR','KeyM','KeyP'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(e.code==='KeyR')restart();if(e.code==='KeyM')sound();if(e.code==='KeyP')showInstructions();}else if(e.code==='Escape'&&!$('instruction-modal').hidden&&started)closeInstructions();});
  $('instruction-close').onclick=closeInstructions;$('help-button').onclick=showInstructions;$('pause').onclick=showInstructions;$('restart-button').onclick=restart;$('sound').onclick=sound;
  $('retry').onclick=restart;
  window.addEventListener('vibecade:restart',e=>{e.preventDefault();restart();});
  const release=()=>pads.forEach(p=>p.classList.remove('pressed'));
  window.addEventListener('vibecade:reset-input',release);window.addEventListener('blur',()=>{release();if(started&&$('result').hidden)showInstructions();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&$('result').hidden)showInstructions();});

  if (new URLSearchParams(location.search).has('test')) window.echoTest = {
    manual: value => manual = value,
    state: () => ({sequence: [...sequence], position, completed, best, phase, paused, clock, flash}),
    step: seconds => {
      // Input and game over do not consume time; only finish the light animation.
      if (paused || phase === 'input' || phase === 'over') { update(seconds); paint(); return; }
      for (let t = 0; t < seconds; t += .01) update(Math.min(.01, seconds - t));
      paint();
    }
  };
  hud();
  try {
    if (sessionStorage.getItem(instructionKey) === 'seen') {
      paused = false; $('instruction-modal').hidden = true;
      $('instruction-modal').classList.remove('is-visible'); begin();
    } else showInstructions();
  } catch (_) { showInstructions(); }
  requestAnimationFrame(frame);
})();

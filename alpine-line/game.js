(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const LEVELS = [
    { name: 'Sunrise qualifier', count: 12, speed: 240, gap: 310, width: 230, swing: 140, limit: 21 },
    { name: 'Club sprint', count: 18, speed: 275, gap: 300, width: 220, swing: 175, limit: 21 },
    { name: 'Ridge challenge', count: 24, speed: 305, gap: 285, width: 210, swing: 205, limit: 25 },
    { name: 'Valley grand prix', count: 30, speed: 335, gap: 275, width: 205, swing: 230, limit: 28.5 },
    { name: 'Summit cup', count: 36, speed: 365, gap: 265, width: 200, swing: 250, limit: 38 },
    { name: 'Black diamond final', count: 42, speed: 400, gap: 255, width: 195, swing: 275, limit: 43 },
    { name: 'Alpine championship', count: 48, speed: 435, gap: 245, width: 190, swing: 300, limit: 60 }
  ];
  const MISS_PENALTY = 2;
  const state = {
    level: 1, mode: 'intro', cfg: LEVELS[0], score: 0, time: 0, penalty: 0,
    distance: 0, finish: 1, x: 480, vx: 0, heading: 0, speed: 0,
    speedControl: 'normal', groundSpeed: 0, passed: 0, missed: 0, streak: 0,
    gates: [], tracks: [], particles: [], muted: false, flash: 0, feedbackUntil: 0
  };
  let touchInput = 0, touchAccelerate = false, touchBrake = false;
  let manual = false, dirty = true, audio = null, last = 0, acc = 0;
  let resumeMode = 'playing', entryScore = 0, hudStamp = '';
  const keys = new Set(), motion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const approach = (n, target, step) => n + clamp(target - n, -step, step);
  const raceTime = () => state.time + state.penalty;
  const turnRate = speed => 2.8 * Math.pow(260 / Math.max(100, speed), 1.25);
  let seed = 1;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }

  function clearInput() {
    keys.clear(); touchInput = 0; touchAccelerate = touchBrake = false;
    $('accelerate').classList.remove('pressed'); $('brake').classList.remove('pressed');
    state.speedControl = 'normal';
    $('accelerate').setAttribute('aria-pressed', 'false'); $('brake').setAttribute('aria-pressed', 'false');
  }
  function resetHeld() { clearInput(); window.dispatchEvent(new Event('vibecade:reset-input')); }
  function sound(f = 440, length = .07) {
    if (state.muted || !audio) return;
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(f, audio.currentTime);
    gain.gain.setValueAtTime(.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
    osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + length);
  }
  function wakeAudio() {
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume()?.catch(() => {}); } catch (_) {}
  }
  function message(text, duration = 1.2) { $('message').textContent = text; state.feedbackUntil = state.time + duration; }
  function burst(x, y, color, n) {
    if (motion) return;
    for (let i = 0; i < n && state.particles.length < 64; i++) {
      state.particles.push({ x, y, dx: (random() - .5) * 110, dy: (random() - .5) * 90, life: .55, color });
    }
  }
  function begin(n = 1) {
    resetHeld(); entryScore = state.score;
    state.level = Number.isFinite(n) ? clamp(Math.trunc(n), 1, 7) : 1;
    const c = state.cfg = LEVELS[state.level - 1];
    Object.assign(state, {
      time: 0, penalty: 0, distance: 0, x: 480, vx: 0, heading: 0, speed: c.speed,
      speedControl: 'normal', groundSpeed: c.speed, streak: 0, passed: 0, missed: 0,
      flash: 0, feedbackUntil: 0, gates: [], tracks: [], particles: [], mode: 'playing'
    });
    seed = 8041 + state.level * 517;
    let center = 480, y = 540, direction = 1;
    for (let i = 0; i < c.count; i++) {
      // Alternating turns and straighter pairs create deliberate acceleration windows.
      const straight = i > 0 && i % 5 === 0;
      if (!straight) direction *= -1;
      let next = clamp(center + direction * c.swing * (straight ? .22 : .72 + random() * .28), 235, 725);
      if (i === 0) next = 480;
      if (!straight && i > 0 && Math.abs(next - center) < c.swing * .35) {
        direction *= -1; next = clamp(center + direction * c.swing * .85, 235, 725);
      }
      const linked = state.level >= 3 && i % 6 === 4;
      state.gates.push({ x: next, y, width: c.width, num: i + 1, done: false, hit: false, linked, straight });
      center = next; y += c.gap * (linked ? .88 : straight ? 1.18 : 1);
    }
    state.finish = y + 120;
    $('result-modal').classList.remove('is-visible');
    $('pause').textContent = 'Pause'; $('touch-pause').textContent = 'PAUSE';
    message(`${c.name} · qualify in ${c.limit.toFixed(1)}s · missed gate +${MISS_PENALTY.toFixed(1)}s`, 2);
    dirty = true; hud(true); draw();
  }
  function restart() {
    state.score = 0;
    const gated = $('instruction-modal').classList.contains('is-visible');
    begin(1);
    if (gated) { state.mode = 'intro'; resumeMode = 'playing'; }
    dirty = true; draw();
  }
  function finish() {
    if (state.mode !== 'playing') return;
    const win = state.distance >= state.finish && raceTime() <= state.cfg.limit + .001;
    state.mode = win ? 'clear' : 'over'; resetHeld();
    $('result-title').textContent = win ? (state.level === 7 ? 'Alpine champion!' : 'Qualified!') : 'Outside the qualifying time.';
    $('result-text').textContent = `${state.cfg.name}: ${state.time.toFixed(2)}s racing + ${state.penalty.toFixed(1)}s penalties = ${raceTime().toFixed(2)}s. Target ${state.cfg.limit.toFixed(1)}s. ${state.passed}/${state.cfg.count} gates. ${win ? 'Next race unlocked.' : 'Retry and push the straights; slow down before the tighter turns.'}`;
    if (win) state.score += Math.max(0, Math.round((state.cfg.limit - raceTime()) * 100)) + 500;
    $('result-text').textContent += ` Score: ${state.score.toLocaleString()}.`;
    $('next').hidden = !win || state.level === 7;
    $('retry').hidden = win; $('again').textContent = win && state.level === 7 ? 'RACE AGAIN' : 'START AGAIN';
    $('result-modal').classList.add('is-visible');
    (win ? (state.level === 7 ? $('again') : $('next')) : $('retry')).focus();
    hud(true); dirty = true; sound(win ? 760 : 180, .18);
  }
  function tick(dt) {
    if (state.mode !== 'playing') return;
    const c = state.cfg;
    const steering = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
    const accelerate = keys.has('ArrowUp') || keys.has('KeyW') || touchAccelerate;
    const brake = keys.has('ArrowDown') || keys.has('KeyS') || keys.has('Space') || touchBrake;
    const steer = steering || touchInput;
    state.speedControl = brake ? 'brake' : accelerate ? 'accelerate' : 'normal';
    // Held controls directly change speed; release settles toward cruise, without a reserve.
    if (brake) state.speed = Math.max(c.speed * .58, state.speed - 310 * dt);
    else if (accelerate) state.speed = Math.min(c.speed * 1.52, state.speed + 190 * dt);
    else state.speed = approach(state.speed, c.speed, 75 * dt);
    // Angular response falls as speed rises, so fast skis carve genuinely wider arcs.
    state.heading = approach(state.heading, steer * .78, turnRate(state.speed) * dt);
    const oldX = state.x, previous = state.distance;
    state.vx = Math.sin(state.heading) * state.speed;
    state.groundSpeed = Math.cos(state.heading) * state.speed;
    state.x = clamp(state.x + state.vx * dt, 135, 825);
    if (state.x === 135 && state.heading < 0 || state.x === 825 && state.heading > 0) {
      state.heading = 0; state.vx = 0;
    }
    const advance = Math.min(state.groundSpeed * dt, state.finish - previous);
    state.distance += advance; state.time += advance / state.groundSpeed;
    state.flash = Math.max(0, state.flash - dt);
    for (const g of state.gates) {
      if (g.done || previous >= g.y || state.distance < g.y) continue;
      const atGate = oldX + (state.x - oldX) * (g.y - previous) / Math.max(.001, advance);
      g.done = true; g.hit = Math.abs(atGate - g.x) <= g.width / 2 + 5;
      if (g.hit) {
        state.passed++; state.streak++; state.score += 100 + Math.min(6, state.streak) * 25;
        message(`Gate ${g.num} ✓ · ${state.streak} clean · keep racing`, .7);
        burst(state.x, 580, '#edb731', 5); sound(500 + Math.min(6, state.streak) * 55);
      } else {
        state.missed++; state.streak = 0; state.penalty += MISS_PENALTY; state.flash = .45;
        message(`Gate ${g.num} missed · +${MISS_PENALTY.toFixed(1)}s · win the time back!`, 1.4);
        sound(220, .12);
      }
    }
    if (!motion) {
      if (state.tracks.length === 0 || state.distance - state.tracks[state.tracks.length - 1].d > 9) {
        state.tracks.push({ x: state.x, d: state.distance, lean: state.heading });
        if (Math.abs(state.heading) > .25) burst(state.x - Math.sign(state.heading) * 15, 595, '#ffffff', 1);
      }
      if (state.tracks.length > 80) state.tracks.shift();
    }
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i]; p.life -= dt; p.x += p.dx * dt; p.y += p.dy * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    if (state.time >= state.feedbackUntil) {
      message(`${c.name} · ${Math.max(0, c.limit - raceTime()).toFixed(1)}s left · push the straights`, .4);
    }
    // Qualification depends only on crossing the finish within adjusted time.
    if (state.distance >= state.finish || raceTime() > c.limit) finish();
    hud(); dirty = true;
  }
  function hud(force = false) {
    const progress = clamp(Math.round(state.distance / state.finish * 100), 0, 100);
    const total = raceTime(), left = Math.max(0, state.cfg.limit - total);
    const projected = total + (state.finish - state.distance) / Math.max(1, state.groundSpeed);
    const margin = state.cfg.limit - projected;
    const stamp = [state.level, total.toFixed(1), state.passed, Math.round(state.speed / 6), state.speedControl, state.mode, progress, margin.toFixed(1)].join('|');
    if (!force && stamp === hudStamp) return;
    hudStamp = stamp;
    $('level').textContent = `${state.level} / 7`; $('race-time').textContent = `${total.toFixed(1)}s`;
    $('qualify').textContent = `${state.cfg.limit.toFixed(1)}s`; $('speed').textContent = `${Math.round(state.speed / 6)}`;
    $('gates').textContent = `${state.passed}/${state.cfg.count}`;
    $('pace').textContent = `${margin >= 0 ? 'PACE AHEAD' : 'PACE BEHIND'} ${Math.abs(margin).toFixed(1)}s · PENALTY +${state.penalty.toFixed(1)}s`;
    $('hud').classList.toggle('time-tight', left < 6 || margin < 0); $('pace').classList.toggle('behind', margin < 0);
    $('accelerate').setAttribute('aria-pressed', state.speedControl === 'accelerate');
    $('brake').setAttribute('aria-pressed', state.speedControl === 'brake');
    $('progress').setAttribute('aria-valuenow', progress); $('progress').firstElementChild.style.transform = `scaleX(${progress / 100})`;
  }
  function draw() { window.AlpineArt.draw(ctx, state, motion); dirty = false; }
  function help() {
    if ($('instruction-modal').classList.contains('is-visible')) return;
    resumeMode = state.mode; state.mode = 'help'; resetHeld(); $('instruction-modal').classList.add('is-visible');
    $('instruction-close').textContent = 'BACK TO THE RACE'; $('instruction-close').focus(); dirty = true;
  }
  function dismiss() {
    wakeAudio(); $('instruction-modal').classList.remove('is-visible');
    try { sessionStorage.setItem('alpine-line-instructions-v2', 'seen'); } catch (_) {}
    if (state.mode === 'intro') begin(Number(new URLSearchParams(location.search).get('level')) || 1); else state.mode = resumeMode;
    canvas.focus({ preventScroll: true }); dirty = true;
  }
  function pause() {
    if (!['playing', 'paused'].includes(state.mode)) return;
    state.mode = state.mode === 'playing' ? 'paused' : 'playing'; resetHeld();
    $('pause').textContent = state.mode === 'paused' ? 'Resume' : 'Pause'; $('touch-pause').textContent = state.mode === 'paused' ? 'RESUME' : 'PAUSE';
    message(state.mode === 'paused' ? 'Paused · press P or Resume.' : state.cfg.name + ' · beat the qualifying time.'); dirty = true;
  }
  function mute() {
    state.muted = !state.muted; $('sound').textContent = state.muted ? 'Sound off' : 'Sound on'; $('touch-sound').textContent = state.muted ? 'MUTED' : 'SOUND';
    if (!state.muted) { wakeAudio(); sound(); }
  }
  document.addEventListener('keydown', e => {
    const globalKey = ['KeyP', 'KeyR', 'KeyM'].includes(e.code);
    if (!globalKey && (state.mode !== 'playing' || e.target.matches('button') && e.code === 'Space')) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyR', 'KeyM', 'KeyP'].includes(e.code) || e.target.matches('input,textarea')) return;
    e.preventDefault();
    if (globalKey) { if (!e.repeat) ({ KeyP: pause, KeyR: restart, KeyM: mute })[e.code](); return; }
    wakeAudio(); keys.add(e.code);
  });
  document.addEventListener('keyup', e => keys.delete(e.code));
  $('instruction-close').onclick = dismiss; $('help-button').onclick = help; $('pause').onclick = $('touch-pause').onclick = pause;
  $('sound').onclick = $('touch-sound').onclick = mute; $('reset').onclick = $('again').onclick = restart;
  $('next').onclick = () => begin(state.level + 1); $('retry').onclick = () => { state.score = entryScore; begin(state.level); };
  function bindSpeedButton(id, set) {
    const button = $(id), held = new Set();
    button.addEventListener('pointerdown', e => {
      e.preventDefault(); if (state.mode !== 'playing') return;
      wakeAudio(); held.add(e.pointerId); set(true); button.classList.add('pressed'); button.setPointerCapture(e.pointerId);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, e => {
      e.preventDefault(); held.delete(e.pointerId); set(held.size > 0); button.classList.toggle('pressed', held.size > 0);
    });
    window.addEventListener('vibecade:reset-input', () => held.clear());
  }
  bindSpeedButton('accelerate', v => { touchAccelerate = v; }); bindSpeedButton('brake', v => { touchBrake = v; });
  window.VibeCadeJoystick($('touch-controls').querySelector('[data-joystick]'), {
    mode: 'horizontal', profile: 'precision', onChange: x => { touchInput = state.mode === 'playing' ? x : 0; if (touchInput) wakeAudio(); }
  });
  window.addEventListener('vibecade:reset-input', clearInput); window.addEventListener('vibecade:restart', e => { e.preventDefault(); restart(); });
  function blur() { resetHeld(); if (state.mode === 'playing') pause(); }
  window.addEventListener('blur', blur); document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); });
  window.addEventListener('resize', () => { resetHeld(); dirty = true; });
  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000 || 0); last = now;
    if (!manual) { acc = Math.min(.1, acc + dt); while (acc >= 1 / 60) { tick(1 / 60); acc -= 1 / 60; } }
    if (dirty) draw(); requestAnimationFrame(frame);
  }
  begin(Number(new URLSearchParams(location.search).get('level')) || 1);
  let seen = false; try { seen = sessionStorage.getItem('alpine-line-instructions-v2') === 'seen'; } catch (_) {}
  if (seen) $('instruction-modal').classList.remove('is-visible'); else state.mode = 'intro';
  dirty = true; requestAnimationFrame(frame);
  if (new URLSearchParams(location.search).has('test')) window.__alpineTest = {
    state, levels: LEVELS, begin, tick, draw, finish, turnRate, raceTime, penalty: MISS_PENALTY,
    manual: v => { manual = v; acc = 0; },
    setInput: (x, speed = 'normal') => { keys.clear(); touchInput = x; touchAccelerate = speed === 'accelerate'; touchBrake = speed === 'brake'; },
    input: () => ({ touchInput, touchAccelerate, touchBrake, keys: [...keys] }), pause
  };
})();

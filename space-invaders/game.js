(() => {
  'use strict';

  const W = 800;
  const H = 600;
  const MOBILE = matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 900px)').matches;
  let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let autoFire = false;
  const SCALE = MOBILE ? 0.75 : 1;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  canvas.dataset.renderScale = SCALE.toFixed(2);
  canvas.dataset.renderer = MOBILE ? 'mobile-cached' : 'desktop-cached';
  if (MOBILE) document.body.classList.add('touch-device');

  const ui = {
    score: document.getElementById('score'), wave: document.getElementById('wave'), lives: document.getElementById('lives'),
    status: document.getElementById('status'), power: document.getElementById('power-status'), boss: document.getElementById('boss-hud'), bossBar: document.querySelector('#boss-hud i'),
    instructions: document.getElementById('instruction-modal'), start: document.getElementById('instruction-close'),
    help: document.getElementById('help-button'), sound: document.getElementById('sound-button'),
    results: document.getElementById('end-modal'), title: document.getElementById('end-title'),
    kicker: document.getElementById('result-kicker'), summary: document.getElementById('run-summary'),
    restart: document.getElementById('restart-button'), fire: document.querySelector('[data-action="fire"]'),
    autoFire: document.getElementById('auto-fire-option'), reducedMotion: document.getElementById('reduced-motion-option'),
    pulse: document.querySelector('[data-action="pulse"]'), pulseLabel: document.querySelector('[data-action="pulse"] small')
  };

  const keys = Object.create(null);
  const bullets = [];
  const bombs = [];
  const aliens = [];
  const shieldBlocks = [];
  const particles = [];
  const flashes = [];
  const pickups = [];
  const stars = [];
  let joystickX = 0;
  let fireHeld = false;
  let running = false;
  let paused = true;
  let started = false;
  let wave = 1;
  let score = 0;
  let lives = 3;
  let formationDirection = 1;
  let formationStepTimer = 0;
  let enemyFireTimer = 0;
  let waveTime = 0;
  let waveScore = 0;
  let shotsFired = 0;
  let shotsHit = 0;
  let waveStartLives = 3;
  let killsTowardPulse = 0;
  let pulseCharges = 1;
  let pulseEffect = 0;
  let saucer = null;
  let saucerTimer = 12;
  let activePickup = null;
  let pickupTimer = 0;
  let boss = null;
  let bossPhaseStarted = false;
  let transitionQueued = false;
  let soundOn = true;
  let audio = null;
  let renderEvery = 1;
  let slowFrames = 0;
  let frameCounter = 0;
  let lastStatus = '';
  let lastPowerStatus = '';

  const player = { x: W / 2, y: H - 45, w: 46, h: 25, cooldown: 0, invulnerable: 0, alive: true };
  const waveConfig = [
    null,
    { rows: 4, cols: 8, armored: 0, specialists: 0, step: 7, interval: .54, fire: 1.05 },
    { rows: 4, cols: 9, armored: 5, specialists: 0, step: 8, interval: .48, fire: .9 },
    { rows: 5, cols: 9, armored: 7, specialists: 2, step: 9, interval: .43, fire: .76 },
    { rows: 5, cols: 10, armored: 10, specialists: 5, step: 10, interval: .38, fire: .65 },
    { rows: 3, cols: 8, armored: 8, specialists: 4, step: 11, interval: .34, fire: .58 }
  ];

  function makeCanvas(width, height, draw) {
    const surface = document.createElement('canvas');
    surface.width = width * SCALE;
    surface.height = height * SCALE;
    const paint = surface.getContext('2d');
    paint.scale(SCALE, SCALE);
    draw(paint, width, height);
    return surface;
  }

  const background = makeCanvas(W, H, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#071831'); sky.addColorStop(.62, '#050c1d'); sky.addColorStop(1, '#02050d');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    let seed = 911;
    const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    g.fillStyle = '#d9ffff';
    for (let i = 0; i < (MOBILE ? 70 : 130); i++) {
      g.globalAlpha = .2 + random() * .65;
      const size = .5 + random() * 1.5;
      g.fillRect(random() * W, random() * H, size, size);
    }
    g.globalAlpha = 1;
    const glow = g.createRadialGradient(140, 160, 15, 140, 160, 170);
    glow.addColorStop(0, '#5d9ee999'); glow.addColorStop(.55, '#1b397dbb'); glow.addColorStop(1, '#05081700');
    g.fillStyle = glow; g.beginPath(); g.arc(140, 160, 170, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#73e5de42'; g.lineWidth = 9; g.beginPath(); g.ellipse(140, 160, 220, 46, -.22, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#061023cc'; g.beginPath(); g.arc(140, 160, 100, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3c71b0aa'; g.beginPath(); g.arc(118, 138, 72, 0, Math.PI * 2); g.fill();
    const horizon = g.createLinearGradient(0, 440, 0, H);
    horizon.addColorStop(0, '#29b6d200'); horizon.addColorStop(1, '#0b88a638');
    g.fillStyle = horizon; g.fillRect(0, 420, W, 180);
    g.strokeStyle = '#52cec522'; g.lineWidth = 1;
    for (let y = 455; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  });

  const sprite = {
    player: makeCanvas(70, 46, g => {
      g.translate(35, 23); g.fillStyle = '#58fff0'; g.beginPath(); g.moveTo(0, -18); g.lineTo(15, 2); g.lineTo(31, 10); g.lineTo(18, 16); g.lineTo(8, 12); g.lineTo(0, 18); g.lineTo(-8, 12); g.lineTo(-18, 16); g.lineTo(-31, 10); g.lineTo(-15, 2); g.closePath(); g.fill();
      g.fillStyle = '#e8ffff'; g.fillRect(-4, -9, 8, 20); g.fillStyle = '#467fff'; g.fillRect(-10, 2, 20, 7); g.fillStyle = '#061127'; g.fillRect(-2, -3, 4, 4);
    }),
    standard: makeCanvas(50, 38, g => {
      g.translate(25, 19); g.fillStyle = '#59eee2'; g.fillRect(-14, -9, 28, 18); g.fillRect(-21, -3, 42, 10); g.fillRect(-17, 9, 7, 5); g.fillRect(10, 9, 7, 5); g.fillStyle = '#061024'; g.fillRect(-8, -3, 5, 5); g.fillRect(3, -3, 5, 5); g.fillRect(-3, 7, 6, 4);
    }),
    armored: makeCanvas(50, 38, g => {
      g.translate(25, 19); g.fillStyle = '#ffd56a'; g.fillRect(-17, -10, 34, 21); g.fillRect(-23, -4, 46, 12); g.fillStyle = '#8e542c'; g.fillRect(-18, 10, 9, 5); g.fillRect(9, 10, 9, 5); g.fillStyle = '#071024'; g.fillRect(-10, -4, 7, 6); g.fillRect(3, -4, 7, 6); g.strokeStyle = '#fff3bd'; g.strokeRect(-15, -8, 30, 17);
    }),
    specialist: makeCanvas(50, 38, g => {
      g.translate(25, 19); g.fillStyle = '#ff78ad'; g.beginPath(); g.moveTo(0, -15); g.lineTo(22, -2); g.lineTo(13, 13); g.lineTo(0, 7); g.lineTo(-13, 13); g.lineTo(-22, -2); g.closePath(); g.fill(); g.fillStyle = '#25051a'; g.fillRect(-9, -3, 6, 6); g.fillRect(3, -3, 6, 6); g.fillStyle = '#ffe2ee'; g.fillRect(-3, 7, 6, 5);
    }),
    saucer: makeCanvas(90, 32, g => {
      g.translate(45, 16); g.fillStyle = '#ffdc76'; g.fillRect(-32, -2, 64, 11); g.fillStyle = '#74fff1'; g.beginPath(); g.ellipse(0, -2, 19, 10, 0, Math.PI, 0); g.fill(); g.fillStyle = '#fff4bd'; g.fillRect(-39, 5, 78, 5);
    }),
    boss: makeCanvas(190, 80, g => {
      g.translate(95, 40); g.fillStyle = '#912f62'; g.beginPath(); g.moveTo(-88, 4); g.lineTo(-57, -25); g.lineTo(0, -36); g.lineTo(57, -25); g.lineTo(88, 4); g.lineTo(58, 31); g.lineTo(-58, 31); g.closePath(); g.fill(); g.fillStyle = '#ff7eb0'; g.fillRect(-64, -8, 128, 28); g.fillStyle = '#160821'; g.fillRect(-49, -1, 98, 14); g.fillStyle = '#ffe479'; for (const x of [-48, 0, 48]) { g.beginPath(); g.arc(x, 13, 9, 0, Math.PI * 2); g.fill(); }
    })
  };

  for (let i = 0; i < (MOBILE ? 22 : 36); i++) stars.push({ x: Math.random() * W, y: Math.random() * H, speed: 10 + Math.random() * 24, size: 1 + Math.random() * 1.5 });

  function setStatus(text) {
    if (text === lastStatus) return;
    lastStatus = text;
    ui.status.textContent = text;
  }

  function setPowerStatus(text) {
    if (text === lastPowerStatus) return;
    lastPowerStatus = text;
    ui.power.textContent = text;
  }

  function updateHud() {
    ui.score.textContent = String(score).padStart(6, '0');
    ui.wave.textContent = `WAVE ${wave}`;
    ui.lives.textContent = `LIVES ${lives}`;
    ui.pulse.disabled = pulseCharges < 1 || paused || !running;
    ui.pulseLabel.textContent = pulseCharges ? 'READY' : `${killsTowardPulse}/12`;
    if (boss) {
      ui.boss.hidden = false;
      ui.bossBar.style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
    } else ui.boss.hidden = true;
  }

  function ensureAudio() {
    if (!soundOn || audio) return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) audio = new AudioCtor();
  }

  function tone(frequency, duration = .06, type = 'square', volume = .035, slide = 0) {
    if (!soundOn) return;
    ensureAudio();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    osc.type = type; osc.frequency.setValueAtTime(frequency, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(audio.destination); osc.start(now); osc.stop(now + duration);
  }

  function createShields() {
    shieldBlocks.length = 0;
    for (let bunker = 0; bunker < 4; bunker++) {
      const ox = 95 + bunker * 175;
      for (let row = 0; row < 4; row++) for (let col = 0; col < 8; col++) {
        if (row > 1 && col > 2 && col < 5) continue;
        shieldBlocks.push({ x: ox + col * 10, y: 474 + row * 9, hp: 2, bunker });
      }
    }
  }

  function createAliens() {
    aliens.length = 0;
    const config = waveConfig[wave];
    const width = (config.cols - 1) * 62;
    let id = 0;
    for (let row = 0; row < config.rows; row++) for (let col = 0; col < config.cols; col++) {
      let role = 'standard';
      if (id < config.specialists) role = 'specialist';
      else if (id < config.specialists + config.armored) role = 'armored';
      aliens.push({ id, row, col, x: W / 2 - width / 2 + col * 62, y: 88 + row * 51, w: 42, h: 30, role, hp: role === 'armored' ? 2 : 1, alive: true, warning: 0 });
      id++;
    }
  }

  function resetTransient() {
    bullets.length = 0; bombs.length = 0; particles.length = 0; flashes.length = 0; pickups.length = 0;
    saucer = null; boss = null; bossPhaseStarted = false; pulseEffect = 0; transitionQueued = false;
    delayed.length = 0; formationDirection = 1; formationStepTimer = 0; enemyFireTimer = .8; waveTime = 0; saucerTimer = wave === 1 ? 9 : 12 + Math.random() * 5;
    player.x = W / 2; player.cooldown = 0; player.invulnerable = 1.1; player.alive = true;
    fireHeld = false; joystickX = 0; Object.keys(keys).forEach(key => delete keys[key]);
  }

  function beginWave() {
    resetTransient();
    createAliens(); createShields();
    waveScore = 0; shotsFired = 0; shotsHit = 0; waveStartLives = lives;
    running = true; paused = false; updateHud(); setStatus(wave === 5 ? 'MOTHERSHIP ESCORT INBOUND' : 'SECTOR ENGAGED');
    canvas.focus({ preventScroll: true });
  }

  function newGame() {
    wave = 1; score = 0; lives = 3; pulseCharges = 1; killsTowardPulse = 0; activePickup = null; pickupTimer = 0;
    setPowerStatus(''); ui.results.classList.remove('is-visible'); beginWave();
  }

  function firePlayer() {
    const rapid = activePickup === 'rapid';
    const maxShots = rapid ? 5 : 3;
    if (!running || paused || !player.alive || player.cooldown > 0 || bullets.length >= maxShots) return;
    bullets.push({ x: player.x, y: player.y - 17, vy: -650, pierce: activePickup === 'pierce' ? 3 : 1, alive: true });
    player.cooldown = rapid ? .105 : .225; shotsFired++; tone(520, .035, 'square', .022, 130);
  }

  function usePulse() {
    if (!running || paused || pulseCharges < 1 || !player.alive) return;
    pulseCharges--; pulseEffect = .42; let cleared = 0;
    for (const bomb of bombs) if (Math.hypot(bomb.x - player.x, bomb.y - player.y) < 185) { bomb.alive = false; cleared++; }
    score += cleared * 15; waveScore += cleared * 15; setStatus(cleared ? `PULSE CLEARED ${cleared} THREATS` : 'PULSE DEPLOYED');
    burst(player.x, player.y, '#64fff1', 14); tone(130, .35, 'sawtooth', .055, 500); updateHud();
  }

  function burst(x, y, color, count = 7) {
    flashes.push({ x, y, radius: 4, life: .28, color });
    const allowed = Math.min(count, (MOBILE ? 55 : 90) - particles.length);
    for (let i = 0; i < allowed; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 115;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .25 + Math.random() * .3, color });
    }
  }

  function registerKill(alien) {
    alien.alive = false; const points = alien.role === 'armored' ? 25 : alien.role === 'specialist' ? 35 : 15;
    score += points; waveScore += points; killsTowardPulse++;
    if (killsTowardPulse >= 12 && pulseCharges < 1) { pulseCharges = 1; killsTowardPulse = 0; setStatus('PULSE RECHARGED'); tone(760, .15, 'sine', .04, 240); }
    burst(alien.x, alien.y, alien.role === 'specialist' ? '#ff7eaf' : '#62f7e9'); tone(210, .075, 'square', .025, -80); updateHud();
  }

  function damagePlayer() {
    if (player.invulnerable > 0 || !player.alive) return;
    lives--; player.invulnerable = 1.2; burst(player.x, player.y, '#ff6d7e', 16); tone(170, .35, 'sawtooth', .055, -100); updateHud();
    bombs.forEach(bomb => { if (Math.hypot(bomb.x - player.x, bomb.y - player.y) < 95) bomb.alive = false; });
    if (lives <= 0) finishRun(false);
  }

  function repairShield() {
    const byBunker = [0, 0, 0, 0];
    shieldBlocks.forEach(block => byBunker[block.bunker] += block.hp);
    let target = byBunker.indexOf(Math.min(...byBunker));
    shieldBlocks.filter(block => block.bunker === target).forEach(block => block.hp = 2);
    setStatus(`BUNKER ${target + 1} RESTORED`); tone(420, .2, 'sine', .04, 350);
  }

  function collectPickup(pickup) {
    pickup.alive = false;
    if (pickup.type === 'repair') repairShield();
    else { activePickup = pickup.type; pickupTimer = 10; setStatus(pickup.type === 'rapid' ? 'RAPID FIRE ACQUIRED' : 'PIERCING SHOT ACQUIRED'); setPowerStatus(`${pickup.type === 'rapid' ? 'RAPID FIRE' : 'PIERCING'} · 10s`); tone(600, .25, 'triangle', .045, 600); }
  }

  function spawnSaucer() {
    saucer = { x: -55, y: 54, vx: 105 + wave * 8, alive: true, hp: 1 };
    setStatus('SUPPLY SAUCER DETECTED'); tone(330, .13, 'sine', .025, 150);
  }

  function spawnPickup(x, y) {
    const types = ['rapid', 'pierce', 'repair'];
    const type = types[Math.floor(Math.random() * types.length)];
    pickups.push({ x, y, vy: 80, type, alive: true });
  }

  function lowestShooters() {
    const selected = [];
    const config = waveConfig[wave];
    for (let col = 0; col < config.cols; col++) {
      let lowest = null;
      for (const alien of aliens) if (alien.alive && alien.col === col && (!lowest || alien.row > lowest.row)) lowest = alien;
      if (lowest) selected.push(lowest);
    }
    return selected;
  }

  function fireEnemy(alien, aimed = false) {
    if (bombs.filter(b => b.alive).length >= (MOBILE ? 9 : 12)) return;
    const dx = aimed ? Math.max(-120, Math.min(120, player.x - alien.x)) : 0;
    const speed = 190 + wave * 10;
    bombs.push({ x: alien.x, y: alien.y + 17, vx: dx * .5, vy: speed, alive: true, color: aimed ? '#ff78ad' : '#ffcb68' });
  }

  function startBoss() {
    bossPhaseStarted = true; bombs.length = 0; saucer = null;
    boss = { x: W / 2, y: 110, w: 180, h: 66, vx: 95, hp: 42, maxHp: 42, fire: 1.1, warning: 0, beamX: 0, core: 0 };
    setStatus('MOTHERSHIP CORE EXPOSED'); tone(80, .7, 'sawtooth', .05, 80); updateHud();
  }

  function updateFormation(dt) {
    let aliveCount = 0;
    let lowest = -Infinity;
    for (const alien of aliens) if (alien.alive) { aliveCount++; lowest = Math.max(lowest, alien.y); }
    if (!aliveCount) { if (wave === 5 && !bossPhaseStarted) startBoss(); else if (!boss) finishWave(); return; }
    const config = waveConfig[wave];
    formationStepTimer += dt;
    const remainingRatio = aliveCount / aliens.length;
    const interval = Math.max(.18, config.interval * (.62 + remainingRatio * .38));
    if (formationStepTimer >= interval) {
      formationStepTimer -= interval;
      let left = Infinity, right = -Infinity;
      for (const alien of aliens) if (alien.alive) { left = Math.min(left, alien.x - alien.w / 2); right = Math.max(right, alien.x + alien.w / 2); }
      if ((formationDirection < 0 && left < 24) || (formationDirection > 0 && right > W - 24)) {
        formationDirection *= -1;
        for (const alien of aliens) if (alien.alive) alien.y += 17;
      } else for (const alien of aliens) if (alien.alive) alien.x += formationDirection * config.step;
      tone(92 + (1 - remainingRatio) * 65, .025, 'square', .009);
    }
    if (lowest > 430) {
      for (const alien of aliens) if (alien.alive && alien.y > 425) for (const block of shieldBlocks) if (block.hp && Math.abs(alien.x - block.x) < 28 && Math.abs(alien.y - block.y) < 25) block.hp = 0;
    }
    if (lowest > player.y - 34) { finishRun(false); return; }

    enemyFireTimer -= dt;
    if (enemyFireTimer <= 0) {
      const shooters = lowestShooters();
      if (shooters.length) {
        const specialists = shooters.filter(a => a.role === 'specialist');
        const shooter = specialists.length && Math.random() < .45 ? specialists[Math.floor(Math.random() * specialists.length)] : shooters[Math.floor(Math.random() * shooters.length)];
        if (shooter.role === 'specialist') { shooter.warning = .55; tone(690, .08, 'sine', .025, 180); setTimeoutSafe(() => shooter.alive && fireEnemy(shooter, true), .52); }
        else fireEnemy(shooter);
      }
      enemyFireTimer = config.fire * (.8 + Math.random() * .5);
    }
    for (const alien of aliens) if (alien.warning > 0) alien.warning -= dt;
  }

  const delayed = [];
  function setTimeoutSafe(action, delay) { delayed.push({ action, time: delay }); }

  function updateBoss(dt) {
    if (!boss) return;
    boss.x += boss.vx * dt;
    if (boss.x < 110 || boss.x > W - 110) { boss.vx *= -1; boss.x = Math.max(110, Math.min(W - 110, boss.x)); }
    boss.core = (boss.core + dt * .42) % 3;
    boss.fire -= dt;
    if (boss.warning > 0) {
      boss.warning -= dt;
      if (boss.warning <= 0) {
        for (const offset of [-20, 0, 20]) bombs.push({ x: boss.beamX + offset, y: boss.y + 25, vx: 0, vy: 330, alive: true, color: '#ff4f83', beam: true });
        tone(110, .25, 'sawtooth', .045, -50);
      }
    } else if (boss.fire <= 0) {
      boss.warning = .75; boss.beamX = Math.max(45, Math.min(W - 45, player.x)); boss.fire = 1.7;
      setStatus('WARNING · COLUMN STRIKE'); tone(760, .14, 'square', .035, -300);
    }
  }

  function hitBoss(bullet) {
    if (!boss || bullet.y > boss.y + boss.h / 2 || bullet.y < boss.y - boss.h / 2 || Math.abs(bullet.x - boss.x) > boss.w / 2) return false;
    const cores = [-48, 0, 48];
    const activeCore = Math.floor(boss.core) % 3;
    const coreX = boss.x + cores[activeCore];
    bullet.alive = false;
    if (Math.abs(bullet.x - coreX) < 18) {
      boss.hp--; shotsHit++; score += 25; waveScore += 25; burst(coreX, boss.y + 12, '#ffe576', 5); tone(250, .055, 'square', .025, -90); updateHud();
      if (boss.hp <= 0) { burst(boss.x, boss.y, '#ff72a9', 30); boss = null; finishWave(); }
    } else { flashes.push({ x: bullet.x, y: bullet.y, radius: 3, life: .12, color: '#8bb1c9' }); tone(90, .035, 'square', .012); }
    return true;
  }

  function updateProjectiles(dt) {
    for (const bullet of bullets) {
      const previousY = bullet.y; bullet.y += bullet.vy * dt;
      if (bullet.y < -20) bullet.alive = false;
      if (bullet.alive && boss && bullet.y <= boss.y + boss.h / 2 && previousY >= boss.y - boss.h / 2) hitBoss(bullet);
      if (!bullet.alive) continue;
      for (const alien of aliens) {
        if (!alien.alive || bullet.x < alien.x - alien.w / 2 || bullet.x > alien.x + alien.w / 2 || bullet.y > alien.y + alien.h / 2 || previousY < alien.y - alien.h / 2) continue;
        alien.hp--; bullet.pierce--; shotsHit++;
        if (alien.hp <= 0) registerKill(alien); else { burst(alien.x, alien.y, '#fff1a0', 3); tone(150, .04, 'square', .015); }
        if (bullet.pierce <= 0) bullet.alive = false;
        break;
      }
      if (!bullet.alive) continue;
      for (const block of shieldBlocks) if (block.hp && Math.abs(bullet.x - block.x) < 6 && bullet.y <= block.y + 6 && previousY >= block.y - 6) { block.hp--; bullet.alive = false; break; }
      if (saucer?.alive && Math.abs(bullet.x - saucer.x) < 45 && bullet.y < saucer.y + 17 && previousY > saucer.y - 17) {
        bullet.alive = false; saucer.alive = false; shotsHit++; score += 150; waveScore += 150; spawnPickup(saucer.x, saucer.y); burst(saucer.x, saucer.y, '#ffe47a', 14); tone(470, .25, 'triangle', .045, 600);
      }
    }
    for (const bomb of bombs) {
      const previousY = bomb.y; bomb.x += bomb.vx * dt; bomb.y += bomb.vy * dt;
      if (bomb.y > H + 15 || bomb.x < -15 || bomb.x > W + 15) bomb.alive = false;
      if (bomb.alive && player.invulnerable <= 0 && Math.abs(bomb.x - player.x) < player.w * .42 && bomb.y >= player.y - player.h / 2 && previousY <= player.y + player.h / 2) { bomb.alive = false; damagePlayer(); }
      if (!bomb.alive) continue;
      for (const block of shieldBlocks) if (block.hp && Math.abs(bomb.x - block.x) < 6 && bomb.y >= block.y - 6 && previousY <= block.y + 6) { block.hp--; bomb.alive = false; burst(block.x, block.y, '#4ee8e0', 2); break; }
    }
    for (const pickup of pickups) {
      pickup.y += pickup.vy * dt;
      if (pickup.y > H) pickup.alive = false;
      if (pickup.alive && Math.abs(pickup.x - player.x) < 34 && Math.abs(pickup.y - player.y) < 25) collectPickup(pickup);
    }
    removeDead(bullets); removeDead(bombs); removeDead(pickups);
  }

  function removeDead(collection) {
    for (let i = collection.length - 1; i >= 0; i--) if (!collection[i].alive) collection.splice(i, 1);
  }

  function updateEffects(dt) {
    for (const particle of particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vx *= .97; particle.vy *= .97; particle.life -= dt; }
    for (const flash of flashes) { flash.radius += 135 * dt; flash.life -= dt; }
    if (!reducedMotion) for (const star of stars) { star.y += star.speed * dt; if (star.y > H) { star.y = 0; star.x = Math.random() * W; } }
    removeExpired(particles); removeExpired(flashes);
    if (pulseEffect > 0) pulseEffect -= dt;
    if (pickupTimer > 0) {
      pickupTimer -= dt;
      if (pickupTimer <= 0) { activePickup = null; setPowerStatus(''); setStatus('WEAPON SYSTEM NORMAL'); }
      else setPowerStatus(`${activePickup === 'rapid' ? 'RAPID FIRE' : 'PIERCING'} · ${Math.ceil(pickupTimer)}s`);
    }
  }

  function removeExpired(collection) {
    for (let i = collection.length - 1; i >= 0; i--) if (collection[i].life <= 0) collection.splice(i, 1);
  }

  function update(dt) {
    for (let i = delayed.length - 1; i >= 0; i--) { delayed[i].time -= dt; if (delayed[i].time <= 0) { const action = delayed[i].action; delayed.splice(i, 1); action(); } }
    updateEffects(dt);
    if (!running) return;
    waveTime += dt;
    const movement = Math.max(-1, Math.min(1, ((keys.ArrowRight || keys.d || keys.D) ? 1 : 0) - ((keys.ArrowLeft || keys.a || keys.A) ? 1 : 0) + joystickX));
    player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x + movement * 390 * dt));
    player.cooldown = Math.max(0, player.cooldown - dt); player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (autoFire || fireHeld || keys[' ']) firePlayer();
    if (saucer) { saucer.x += saucer.vx * dt; if (!saucer.alive || saucer.x > W + 55) saucer = null; }
    else { saucerTimer -= dt; if (saucerTimer <= 0 && !boss) { spawnSaucer(); saucerTimer = 18 + Math.random() * 8; } }
    updateFormation(dt); updateBoss(dt); updateProjectiles(dt);
  }

  function finishWave() {
    if (transitionQueued) return;
    transitionQueued = true; running = false;
    const accuracy = shotsFired ? Math.min(100, Math.round(shotsHit / shotsFired * 100)) : 0;
    const clearBonus = 300 * wave;
    const accuracyBonus = Math.round(accuracy * wave * 2);
    score += clearBonus + accuracyBonus;
    updateHud(); tone(520, .4, 'triangle', .045, 440);
    if (wave >= 5) { finishRun(true); return; }
    setStatus(`WAVE ${wave} CLEARED · +${clearBonus + accuracyBonus} · ACC ${accuracy}%`);
    setTimeoutSafe(() => { wave++; beginWave(); }, 1.6);
  }

  function finishRun(victory) {
    running = false; paused = true; transitionQueued = true;
    ui.kicker.textContent = victory ? 'EARTH DEFENDED' : 'DEFENSE LINE LOST';
    ui.title.textContent = victory ? 'Victory' : 'Game over';
    ui.summary.innerHTML = `<span>FINAL SCORE<br>${score}</span><span>WAVE REACHED<br>${wave}</span><span>HOSTILES HIT<br>${shotsHit}</span><span>PULSE<br>${pulseCharges ? 'READY' : `${killsTowardPulse}/12`}</span>`;
    ui.restart.textContent = 'RESTART'; ui.results.classList.add('is-visible'); tone(victory ? 520 : 170, .6, victory ? 'triangle' : 'sawtooth', .05, victory ? 500 : -110);
  }

  function draw() {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.drawImage(background, 0, 0, W, H);
    ctx.fillStyle = '#d9ffff';
    for (const star of stars) ctx.fillRect(star.x, star.y, star.size, star.size * 1.8);
    for (const block of shieldBlocks) if (block.hp) { ctx.fillStyle = block.hp === 2 ? '#43e0d5' : '#267f89'; ctx.fillRect(block.x - 5, block.y - 4, 9, 8); }
    if (saucer) ctx.drawImage(sprite.saucer, saucer.x - 45, saucer.y - 16, 90, 32);
    const visualTime = performance.now();
    for (const alien of aliens) if (alien.alive) {
      const bob = reducedMotion ? 0 : Math.sin(visualTime / 260 + alien.col) * 1.5;
      if (alien.warning > 0) { ctx.strokeStyle = '#ffedf5'; ctx.lineWidth = 2; ctx.strokeRect(alien.x - 26, alien.y - 21, 52, 42); }
      ctx.drawImage(sprite[alien.role], alien.x - 25, alien.y - 19 + bob, 50, 38);
      if (alien.hp > 1) { ctx.fillStyle = '#fff1a8'; ctx.fillRect(alien.x - 11, alien.y - 18, 22, 2); }
    }
    if (boss) {
      if (boss.warning > 0) { ctx.fillStyle = '#ff4f8322'; ctx.fillRect(boss.beamX - 28, boss.y + 25, 56, H - boss.y); ctx.strokeStyle = '#ff8aa5'; ctx.strokeRect(boss.beamX - 28, boss.y + 25, 56, H - boss.y); }
      ctx.drawImage(sprite.boss, boss.x - 95, boss.y - 40, 190, 80);
      const cores = [-48, 0, 48];
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = i === Math.floor(boss.core) ? '#fff5a0' : '#602548'; ctx.lineWidth = i === Math.floor(boss.core) ? 4 : 2; ctx.beginPath(); ctx.arc(boss.x + cores[i], boss.y + 13, 12, 0, Math.PI * 2); ctx.stroke(); }
    }
    for (const pickup of pickups) {
      ctx.fillStyle = pickup.type === 'rapid' ? '#ffd56a' : pickup.type === 'pierce' ? '#ff7cb0' : '#63f3e7';
      ctx.fillRect(pickup.x - 12, pickup.y - 12, 24, 24); ctx.fillStyle = '#06111d'; ctx.font = '900 12px ui-monospace'; ctx.textAlign = 'center'; ctx.fillText(pickup.type === 'rapid' ? 'R' : pickup.type === 'pierce' ? 'P' : '+', pickup.x, pickup.y + 5);
    }
    ctx.fillStyle = '#eaffff';
    for (const bullet of bullets) { ctx.fillRect(bullet.x - 2, bullet.y - 12, 4, 15); ctx.fillStyle = activePickup === 'pierce' ? '#ff8abc' : '#eaffff'; }
    for (const bomb of bombs) { ctx.fillStyle = bomb.color; ctx.fillRect(bomb.x - (bomb.beam ? 3 : 2), bomb.y - 5, bomb.beam ? 6 : 4, bomb.beam ? 16 : 11); }
    for (const particle of particles) { ctx.globalAlpha = Math.min(1, particle.life * 3); ctx.fillStyle = particle.color; ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
    for (const flash of flashes) { ctx.globalAlpha = Math.min(1, flash.life * 4); ctx.strokeStyle = flash.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (pulseEffect > 0) { ctx.strokeStyle = '#75fff1'; ctx.lineWidth = 4; ctx.globalAlpha = pulseEffect / .42; ctx.beginPath(); ctx.arc(player.x, player.y, (1 - pulseEffect / .42) * 185, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    if (player.alive && (player.invulnerable <= 0 || Math.floor(player.invulnerable * 12) % 2 === 0)) ctx.drawImage(sprite.player, player.x - 35, player.y - 23, 70, 46);
  }

  let previous = performance.now();
  let accumulator = 0;
  const step = 1 / 60;
  function loop(now) {
    const elapsedMs = Math.min(100, now - previous); previous = now;
    if (!paused) {
      accumulator = Math.min(.12, accumulator + elapsedMs / 1000);
      while (accumulator >= step) { update(step); accumulator -= step; }
      frameCounter++;
      if (frameCounter % renderEvery === 0) draw();
      if (MOBILE) {
        if (elapsedMs > 24) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
        if (slowFrames > 45) { renderEvery = 2; canvas.dataset.renderFps = '30-fallback'; }
      }
    } else accumulator = 0;
    requestAnimationFrame(loop);
  }

  function resetInput() { fireHeld = false; joystickX = 0; Object.keys(keys).forEach(key => delete keys[key]); ui.fire.classList.remove('pressed'); }
  function bindHoldButton(button, press, release = () => {}) {
    let pointer = null;
    button.addEventListener('pointerdown', event => { event.preventDefault(); if (pointer !== null || button.disabled) return; pointer = event.pointerId; button.setPointerCapture(pointer); button.classList.add('pressed'); press(); });
    const end = event => { if (event.pointerId !== pointer) return; pointer = null; button.classList.remove('pressed'); release(); };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, end));
    button.addEventListener('contextmenu', event => event.preventDefault());
  }

  bindHoldButton(ui.fire, () => { fireHeld = true; firePlayer(); }, () => { fireHeld = false; });
  bindHoldButton(ui.pulse, usePulse);
  const bindJoystick = () => {
    if (!window.VibeCadeJoystick) return;
    window.VibeCadeJoystick(document.querySelector('[data-joystick]'), { mode: 'horizontal', profile: 'precision', onChange: x => { joystickX = x; } });
  };
  if (window.VibeCadeJoystick) bindJoystick(); else addEventListener('vibecade-controls-ready', bindJoystick, { once: true });

  addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    if ((event.key === 'r' || event.key === 'R') && !ui.instructions.classList.contains('is-visible')) { newGame(); return; }
    if (/BUTTON|INPUT/.test(event.target.tagName)) return;
    ensureAudio(); keys[event.key] = true;
    if (event.key === 'x' || event.key === 'X') usePulse();
    if (event.key === 'm' || event.key === 'M') toggleSound();
  });
  addEventListener('keyup', event => { keys[event.key] = false; });
  addEventListener('blur', resetInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetInput(); });
  canvas.addEventListener('contextmenu', event => event.preventDefault());

  function toggleSound() {
    soundOn = !soundOn; ui.sound.textContent = soundOn ? 'SOUND ON' : 'SOUND OFF'; ui.sound.setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound');
  }
  ui.sound.addEventListener('click', toggleSound);
  ui.autoFire.addEventListener('change', () => { autoFire = ui.autoFire.checked; ui.fire.textContent = autoFire ? 'AUTO' : 'FIRE'; });
  ui.reducedMotion.checked = reducedMotion;
  ui.reducedMotion.addEventListener('change', () => { reducedMotion = ui.reducedMotion.checked; });
  ui.help.addEventListener('click', () => { resetInput(); paused = true; ui.instructions.classList.add('is-visible'); });
  ui.start.addEventListener('click', () => {
    ensureAudio(); ui.instructions.classList.remove('is-visible');
    if (!started) { started = true; newGame(); } else { paused = false; canvas.focus({ preventScroll: true }); }
    sessionStorage.setItem('vibecade-instructions-space-invaders', '1');
  });
  ui.restart.addEventListener('click', () => { ensureAudio(); newGame(); });
  addEventListener('vibecade:restart', event => { event.preventDefault(); newGame(); });

  if (new URLSearchParams(location.search).has('debug')) {
    window.__spaceInvadersDebug = {
      snapshot: () => ({ wave, score, lives, running, paused, playerX: player.x, bullets: bullets.length, bombs: bombs.length, aliens: aliens.filter(a => a.alive).length, bossHp: boss?.hp ?? null, pulseCharges, activePickup, shieldHealth: shieldBlocks.reduce((total, block) => total + block.hp, 0), renderEvery }),
      startWave: number => { wave = Math.max(1, Math.min(5, Number(number) || 1)); beginWave(); },
      clearFormation: () => { aliens.forEach(alien => { alien.alive = false; }); },
      spawnSaucer: () => { spawnSaucer(); },
      spawnPickup: type => { pickups.push({ x: player.x, y: player.y - 30, vy: 80, type, alive: true }); },
      awardKills: count => { aliens.filter(alien => alien.alive).slice(0, count).forEach(registerKill); },
      setBossHp: hp => { if (boss) boss.hp = Math.max(1, Number(hp) || 1); },
      defeatBoss: () => { if (boss) { boss = null; finishWave(); } },
      lose: () => { lives = 0; finishRun(false); },
      addBomb: (x = player.x, y = player.y - 100) => { bombs.push({ x, y, vx: 0, vy: 190, alive: true, color: '#ffcb68' }); },
      setPulse: value => { pulseCharges = value ? 1 : 0; updateHud(); }
    };
  }

  updateHud(); draw(); requestAnimationFrame(loop);
  if (sessionStorage.getItem('vibecade-instructions-space-invaders') === '1') {
    ui.instructions.classList.remove('is-visible'); started = true; newGame();
  }
})();

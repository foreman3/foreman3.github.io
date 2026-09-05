(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const shell = document.getElementById('game-shell');
  const modal = document.getElementById('instruction-modal');
  const closeInstructions = document.getElementById('instruction-close');
  const helpButton = document.getElementById('help-button');
  const liveRegion = document.getElementById('live-region');
  const hud = {
    score: document.getElementById('score'),
    phase: document.getElementById('phase'),
    delivered: document.getElementById('delivered'),
    quota: document.getElementById('quota'),
    papers: document.getElementById('papers'),
    lives: document.getElementById('lives'),
    route: document.getElementById('route-fill'),
    sound: document.getElementById('sound-status')
  };

  const W = 960;
  const H = 540;
  const HORIZON = 132;
  const PLAYER_Y = 447;
  const ROUTE_DIFFICULTY = [
    { worldSpeed: 156, targetEvery: 1.8, obstacleEvery: 2.2, dogChance: 0, doubleChance: 0, dogWeave: .16, carDrift: 0, name: 'QUIET MORNING' },
    { worldSpeed: 180, targetEvery: 1.65, obstacleEvery: 1.8, dogChance: 0, doubleChance: 0, dogWeave: .17, carDrift: .16, name: 'COMMUTER TRAFFIC' },
    { worldSpeed: 208, targetEvery: 1.55, obstacleEvery: 1.5, dogChance: .16, doubleChance: 0, dogWeave: .22, carDrift: .22, name: 'DOGS ON THE LOOSE' },
    { worldSpeed: 238, targetEvery: 1.5, obstacleEvery: 1.27, dogChance: .21, doubleChance: .08, dogWeave: .26, carDrift: .28, name: 'BUSY INTERSECTIONS' },
    { worldSpeed: 256, targetEvery: 1.4, obstacleEvery: 1.05, dogChance: .27, doubleChance: .16, dogWeave: .30, carDrift: .34, name: 'RUSH HOUR' }
  ];
  const params = new URLSearchParams(location.search);
  const initialPhase = Math.max(1, Math.min(8, Number(params.get('phase')) || 1));
  const testScenario = params.get('scenario') || '';
  let randomSeed = (Number(params.get('seed')) || 271828) >>> 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const input = { left: false, right: false, joystick: 0 };
  const targets = [];
  const hazards = [];
  const bundles = [];
  const flyingPapers = [];
  const particles = [];
  const scenery = [];
  const MIN_CUSTOMERS = 4;
  const neighborhood = Array.from({ length: 24 }, (_, id) => ({
    id, number: 101 + id, side: id % 2 ? 1 : -1,
    subscribed: id % 3 === 0,
    hue: ['#d8cbb5', '#a7b5ab', '#ba8c73', '#d7d3c3'][id % 4],
    roof: ['#544c48', '#424f56', '#775b4c'][id % 3]
  }));
  const customerCount = () => neighborhood.filter(home => home.subscribed).length;

  const player = {
    x: W / 2,
    vx: 0,
    tilt: 0,
    invulnerable: 0
  };

  const state = {
    started: false,
    paused: true,
    mode: 'ready',
    phase: initialPhase,
    score: 0,
    lives: 3,
    papers: 11,
    delivered: 0,
    quota: 8,
    combo: 0,
    bestCombo: 0,
    misses: 0,
    gained: 0,
    lost: 0,
    crashes: 0,
    perfect: false,
    newSubscribers: [],
    carDrift: 0,
    nextAddress: 0,
    endReason: '',
    routeTotal: 32,
    routeRemaining: 32,
    worldSpeed: ROUTE_DIFFICULTY[0].worldSpeed,
    targetEvery: ROUTE_DIFFICULTY[0].targetEvery,
    obstacleEvery: ROUTE_DIFFICULTY[0].obstacleEvery,
    dogChance: ROUTE_DIFFICULTY[0].dogChance,
    doubleChance: ROUTE_DIFFICULTY[0].doubleChance,
    dogWeave: ROUTE_DIFFICULTY[0].dogWeave,
    worldScroll: 0,
    obstacleTimer: 1.3,
    targetTimer: .8,
    bundleTimer: 8,
    throwCooldown: 0,
    message: 'READY FOR THE MORNING EDITION',
    messageTimer: 2,
    transitionTimer: 0,
    transitionSuccess: false,
    shake: 0,
    sound: true
  };

  let audioContext = null;
  let lastTime = performance.now();
  let animationFrame = 0;
  let modalWasPlaying = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const random = () => {
    randomSeed = (1664525 * randomSeed + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  };
  const randomRange = (min, max) => min + (max - min) * random();

  function routeDifficulty(phase) {
    if (phase <= ROUTE_DIFFICULTY.length) return ROUTE_DIFFICULTY[Math.max(1, phase) - 1];
    const extra = phase - ROUTE_DIFFICULTY.length;
    return {
      worldSpeed: 256 + Math.min(4, extra) * 10,
      targetEvery: Math.max(1.3, 1.4 - extra * .02),
      obstacleEvery: Math.max(.82, 1.05 - extra * .04),
      dogChance: Math.min(.42, .28 + extra * .025),
      doubleChance: Math.min(.3, extra * .06),
      dogWeave: Math.min(.38, .30 + extra * .02),
      carDrift: Math.min(.4, .34 + extra * .02),
      name: 'OVERTIME EDITION'
    };
  }

  function roadHalf(y) {
    const depth = clamp((y - HORIZON) / (H - HORIZON), 0, 1);
    return lerp(70, 425, depth);
  }

  function roadX(lane, y) {
    return W / 2 + lane * roadHalf(y) * .72;
  }

  function ensureAudio() {
    if (!state.sound) return;
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioContext = new AudioCtor();
    }
    if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function tone(frequency, duration = .07, type = 'square', volume = .035, delay = 0) {
    if (!state.sound) return;
    ensureAudio();
    if (!audioContext) return;
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  function soundDelivery() {
    tone(540, .08, 'square', .04);
    tone(760, .11, 'square', .035, .07);
  }

  function soundCrash() {
    tone(105, .18, 'sawtooth', .055);
    tone(72, .22, 'square', .045, .08);
  }

  function announce(message) {
    liveRegion.textContent = '';
    requestAnimationFrame(() => { liveRegion.textContent = message; });
  }

  function showMessage(message, duration = 1.4) {
    state.message = message;
    state.messageTimer = duration;
  }

  function updateHud() {
    hud.score.textContent = String(Math.floor(state.score)).padStart(6, '0');
    hud.phase.textContent = state.phase;
    hud.delivered.textContent = state.delivered;
    hud.quota.textContent = state.quota;
    document.getElementById('customers').textContent = `${customerCount()}/${neighborhood.length}`;
    document.getElementById('customer-card').classList.toggle('at-risk', customerCount() <= MIN_CUSTOMERS + 1);
    document.getElementById('customer-status').textContent = state.mode === 'gameover' ? 'ROUTE CLOSED · RESTART TO TRY AGAIN' : `KEEP ${MIN_CUSTOMERS}+ · ${customerCount() <= MIN_CUSTOMERS ? 'LAST CHANCE' : state.misses === 0 && state.crashes === 0 ? 'PERFECT: +2 AT FINISH' : '+1 SUBSCRIBER AT FINISH'}`;
    hud.papers.textContent = state.papers;
    hud.lives.textContent = '♥'.repeat(Math.max(0, state.lives)) || '—';
    hud.route.style.transform = `scaleX(${clamp(state.routeRemaining / state.routeTotal, 0, 1)})`;
    hud.sound.textContent = `SOUND ${state.sound ? 'ON' : 'OFF'} · M`;
    shell.dataset.gameMode = state.mode;
    shell.dataset.started = String(state.started);
    shell.dataset.paused = String(state.paused);
    shell.dataset.phase = String(state.phase);
    shell.dataset.playerX = player.x.toFixed(1);
    shell.dataset.routeRemaining = state.routeRemaining.toFixed(2);
    shell.dataset.quota = String(state.quota);
    shell.dataset.worldSpeed = String(state.worldSpeed);
    shell.dataset.targetEvery = String(state.targetEvery);
    shell.dataset.obstacleEvery = String(state.obstacleEvery);
    shell.dataset.dogChance = String(state.dogChance);
    shell.dataset.doubleChance = String(state.doubleChance);
    shell.dataset.targetCount = String(targets.length);
    shell.dataset.hazardCount = String(hazards.length);
    shell.dataset.customers = String(customerCount());
    shell.dataset.customerRoster = neighborhood.map(home => home.subscribed ? '1' : '0').join('');
    const nextTarget = targets.filter(target => target.wasSubscribed && !target.dead && !target.delivered).sort((a, b) => b.y - a.y)[0];
    shell.dataset.targetSide = nextTarget ? String(nextTarget.side) : '0';
    shell.dataset.targetY = nextTarget ? nextTarget.y.toFixed(1) : '0';
  }

  function seedScenery() {
    scenery.length = 0;
    for (let index = 0; index < 8; index += 1) {
      scenery.push({
        y: HORIZON + index * 68,
        side: index % 2 ? 1 : -1,
        hue: ['#e7a44d', '#dd6d4b', '#5a8794', '#c7b956'][index % 4],
        roof: ['#753b35', '#344e59', '#97543d'][index % 3]
      });
    }
  }

  function startPhase(phase) {
    state.phase = Math.max(1, phase);
    const difficulty = routeDifficulty(state.phase);
    state.quota = customerCount();
    state.delivered = 0;
    state.misses = 0;
    state.gained = 0;
    state.lost = 0;
    state.crashes = 0;
    state.perfect = false;
    state.newSubscribers = [];
    state.nextAddress = 0;
    state.endReason = '';
    state.combo = 0;
    state.papers = Math.min(20, state.quota + 3);
    state.routeTotal = difficulty.targetEvery * (neighborhood.length - 1) + 6;
    state.routeRemaining = state.routeTotal;
    state.worldSpeed = difficulty.worldSpeed;
    state.targetEvery = difficulty.targetEvery;
    state.obstacleEvery = difficulty.obstacleEvery;
    state.dogChance = difficulty.dogChance;
    state.doubleChance = difficulty.doubleChance;
    state.dogWeave = difficulty.dogWeave;
    state.carDrift = difficulty.carDrift;
    state.obstacleTimer = 1.25;
    state.targetTimer = .7;
    state.bundleTimer = 8;
    state.throwCooldown = 0;
    state.mode = 'playing';
    state.transitionTimer = 0;
    state.shake = 0;
    player.x = W / 2;
    player.vx = 0;
    player.tilt = 0;
    player.invulnerable = 0;
    targets.length = 0;
    hazards.length = 0;
    bundles.length = 0;
    flyingPapers.length = 0;
    particles.length = 0;
    seedScenery();
    if (testScenario === 'delivery') {
      player.x = W / 2 + roadHalf(PLAYER_Y) * .67;
      spawnTarget(1);
      targets[0].y = 365;
      targets[0].x = W / 2 + roadHalf(targets[0].y) + 31;
      state.targetTimer = 4;
    } else if (testScenario === 'clear') {
      state.delivered = state.quota;
      state.nextAddress = neighborhood.length;
      state.routeRemaining = .35;
    }
    const routeCallout = `DAY ${state.phase} · ${difficulty.name}`;
    showMessage(routeCallout, 2.2);
    announce(`Day ${state.phase}. ${state.quota} deliveries across ${neighborhood.length} houses. ${difficulty.name}. Serve subscribers only. Finish for one new subscriber, or two with every delivery and no crashes.`);
    updateHud();
  }

  function restartGame() {
    state.score = 0;
    state.lives = 3;
    state.worldScroll = 0;
    neighborhood.forEach(home => { home.subscribed = home.id % 3 === 0; });
    state.started = true;
    startPhase(1);
    state.paused = modal.classList.contains('is-visible');
    lastTime = performance.now();
    showMessage('FRESH BAG · FRESH START', 1.6);
  }

  window.restartGame = restartGame;

  function spawnTarget(forcedSide = 0) {
    if (state.nextAddress >= neighborhood.length) return;
    const home = neighborhood[state.nextAddress++];
    const side = forcedSide || home.side;
    targets.push({
      home,
      wasSubscribed: home.subscribed,
      y: HORIZON + 4,
      x: W / 2,
      side,
      delivered: false,
      dead: false,
      pulse: randomRange(0, Math.PI * 2)
    });
  }

  function spawnHazard(forcedType = '') {
    const roll = random();
    let type = forcedType;
    if (!type) {
      if (roll < state.dogChance) type = 'dog';
      else if (roll < .56) type = 'car';
      else if (roll < .8) type = 'puddle';
      else type = 'cones';
    }
    let lane = randomRange(-.82, .82);
    if (type === 'cones') lane = [-.55, 0, .55][Math.floor(random() * 3)];
    hazards.push({
      type,
      y: HORIZON + 3,
      x: W / 2,
      lane,
      baseLane: lane,
      phase: randomRange(0, Math.PI * 2),
      color: ['#d84f39', '#315f79', '#e6ac3e'][Math.floor(random() * 3)],
      dead: false
    });
  }

  function spawnBundle() {
    bundles.push({
      y: HORIZON + 3,
      x: W / 2,
      lane: randomRange(-.68, .68),
      spin: randomRange(0, Math.PI * 2),
      dead: false
    });
  }

  function burst(x, y, color, count = 12) {
    const available = Math.max(0, 96 - particles.length);
    const total = Math.min(count, available, reducedMotion ? 5 : count);
    for (let index = 0; index < total; index += 1) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(45, 160);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: randomRange(.35, .8),
        maxLife: .8,
        color,
        size: randomRange(2, 6)
      });
    }
  }

  function throwPaper() {
    if (!state.started || state.paused || state.mode !== 'playing' || state.throwCooldown > 0) return;
    ensureAudio();
    state.throwCooldown = .23;
    if (state.papers <= 0) {
      showMessage('EMPTY BAG · FIND A BUNDLE', 1.2);
      tone(118, .12, 'square', .03);
      return;
    }

    let side = player.x < W / 2 ? -1 : 1;
    if (Math.abs(player.x - W / 2) < 24) {
      const nearest = targets.filter(target => target.wasSubscribed && !target.dead && !target.delivered).sort((a, b) => b.y - a.y)[0];
      if (nearest) side = nearest.side;
    }
    state.papers -= 1;
    flyingPapers.push({
      x: player.x + side * 17,
      y: PLAYER_Y - 18,
      vx: side * (365 + Math.min(state.phase, 6) * 8),
      vy: -92,
      rotation: side * .15,
      spin: side * 8.5,
      dead: false
    });
    tone(260, .05, 'triangle', .025);
    updateHud();
  }

  function hitPlayer(hazard) {
    hazard.dead = true;
    if (player.invulnerable > 0) return;
    player.invulnerable = 2.1;
    state.lives -= 1;
    state.crashes += 1;
    state.combo = 0;
    state.shake = reducedMotion ? 2 : 12;
    burst(player.x, PLAYER_Y, '#f5e8c8', 18);
    soundCrash();
    if (state.lives <= 0) {
      state.mode = 'gameover';
      state.endReason = 'Three wipeouts ended your delivery run';
      showMessage('ROUTE CANCELLED', 99);
      announce(`Game over. Score ${Math.floor(state.score)}. Press R to restart.`);
    } else {
      showMessage('WIPEOUT! · KEEP PEDALING', 1.5);
      announce(`${state.lives} lives remaining.`);
    }
    updateHud();
  }

  function deliver(target, paper) {
    if (target.delivered || target.dead) return;
    if (!target.wasSubscribed) {
      paper.dead = true;
      showMessage(`#${target.home.number} · NOT A SUBSCRIBER`, 1);
      return;
    }
    target.delivered = true;
    paper.dead = true;
    state.delivered += 1;
    state.combo = Math.min(5, state.combo + 1);
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const points = 100 * state.combo + state.phase * 25;
    state.score += points;
    burst(target.x, target.y, '#f4c95d', 16);
    soundDelivery();
    showMessage(`#${target.home.number} DELIVERED · +${points}`, 1.2);
    announce(`Delivered to ${target.home.number}.`);
    updateHud();
  }

  function collectBundle(bundle) {
    bundle.dead = true;
    const gained = Math.max(0, Math.min(5, 20 - state.papers));
    state.papers += gained;
    state.score += 50;
    burst(bundle.x, bundle.y, '#fff5cf', 10);
    tone(410, .06, 'triangle', .035);
    tone(610, .09, 'triangle', .03, .055);
    showMessage(`BAG REFILL +${gained}`, 1);
    updateHud();
  }

  function finishPhase() {
    if (state.mode !== 'playing') return;
    const success = customerCount() >= MIN_CUSTOMERS;
    state.mode = 'transition';
    state.transitionSuccess = success;
    state.transitionTimer = 6;
    if (success) {
      state.perfect = state.delivered === state.quota && state.crashes === 0;
      const candidates = neighborhood.filter(home => !home.subscribed);
      // Rotate new addresses through the street so the delivery pattern keeps changing.
      const offset = candidates.length ? (state.phase * 7) % candidates.length : 0;
      for (let i = 0; i < Math.min(state.perfect ? 2 : 1, candidates.length); i++) {
        const home = candidates[(offset + i) % candidates.length];
        home.subscribed = true;
        state.newSubscribers.push(home.number);
      }
      state.gained = state.newSubscribers.length;
      const bonus = 500 + state.phase * 100 + state.papers * 15;
      state.score += bonus;
      showMessage(`DAY ${state.phase} COMPLETE · ${customerCount()} CUSTOMERS`, 6);
      state.lives = Math.min(3, state.lives + 1);
      tone(440, .1, 'square', .04);
      tone(660, .12, 'square', .035, .1);
      tone(880, .16, 'square', .03, .21);
      announce(`Day ${state.phase} complete. ${state.perfect ? 'Perfect run! ' : ''}${state.gained} new subscribers. ${state.newSubscribers.join(', ')}. ${customerCount()} customers total.`);
    } else {
      state.mode = 'gameover';
      state.endReason = 'Too few customers to keep the route';
    }
    updateHud();
  }

  function updateScenery(dt, speed) {
    scenery.forEach(item => {
      const depth = clamp((item.y - HORIZON) / (H - HORIZON), 0, 1);
      item.y += speed * dt * (.44 + depth * .62);
      if (item.y > H + 105) {
        item.y = HORIZON + randomRange(0, 20);
        item.side *= -1;
      }
    });
  }

  function updatePlaying(dt) {
    const steer = clamp((input.right ? 1 : 0) - (input.left ? 1 : 0) + input.joystick, -1, 1);
    const acceleration = steer ? 13 : 9;
    player.vx = lerp(player.vx, steer * 450, 1 - Math.exp(-acceleration * dt));
    player.x += player.vx * dt;
    const playerEdge = roadHalf(PLAYER_Y) * .7;
    player.x = clamp(player.x, W / 2 - playerEdge, W / 2 + playerEdge);
    player.tilt = lerp(player.tilt, steer * .18, 1 - Math.exp(-8 * dt));
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    state.throwCooldown = Math.max(0, state.throwCooldown - dt);
    state.routeRemaining = Math.max(0, state.routeRemaining - dt);
    state.worldScroll += state.worldSpeed * dt;
    updateScenery(dt, state.worldSpeed);

    state.targetTimer -= dt;
    if (state.targetTimer <= 0 && state.nextAddress < neighborhood.length) {
      spawnTarget();
      state.targetTimer = state.targetEvery;
    }

    state.obstacleTimer -= dt;
    if (state.obstacleTimer <= 0 && state.routeRemaining > 2) {
      spawnHazard();
      if (random() < state.doubleChance) spawnHazard(random() < .45 ? 'cones' : 'puddle');
      state.obstacleTimer = state.obstacleEvery + randomRange(-.12, .26);
    }

    state.bundleTimer -= dt;
    if (state.bundleTimer <= 0 && state.routeRemaining > 5) {
      spawnBundle();
      state.bundleTimer = randomRange(8.5, 11.5);
    }

    targets.forEach(target => {
      const depth = clamp((target.y - HORIZON) / (H - HORIZON), 0, 1);
      target.y += state.worldSpeed * dt * (.48 + depth * .62);
      target.x = W / 2 + target.side * (roadHalf(target.y) + 31);
      target.pulse += dt * 5;
      if (target.y > H + 45) {
        target.dead = true;
        if (target.wasSubscribed && !target.delivered) {
          state.misses += 1;
          state.combo = 0;
          if (target.home.subscribed) {
            target.home.subscribed = false;
            state.lost += 1;
            showMessage(`#${target.home.number} CANCELLED · ${customerCount()} CUSTOMERS`, 1.4);
            announce(`Missed delivery. ${target.home.number} cancelled. ${customerCount()} customers remain.`);
            if (customerCount() < MIN_CUSTOMERS) {
              state.mode = 'gameover';
              state.endReason = `Only ${customerCount()} customers left · minimum ${MIN_CUSTOMERS}`;
              showMessage('TOO FEW CUSTOMERS · ROUTE CLOSED', 99);
              soundCrash();
            }
          }
        }
      }
    });
    if (state.mode !== 'playing') return;

    hazards.forEach(hazard => {
      const depth = clamp((hazard.y - HORIZON) / (H - HORIZON), 0, 1);
      hazard.y += state.worldSpeed * dt * (.5 + depth * .68) * (hazard.type === 'dog' ? 1.06 : 1);
      if (hazard.type === 'dog') {
        const weave = Math.sin(state.worldScroll * .022 + hazard.phase) * state.dogWeave;
        hazard.lane = clamp(hazard.baseLane + weave, -.88, .88);
      }
      if (hazard.type === 'car' && state.carDrift > 0) {
        const progress = clamp((hazard.y - 210) / 190, 0, 1);
        const direction = hazard.baseLane > 0 ? -1 : 1;
        hazard.lane = hazard.baseLane + direction * state.carDrift * progress * progress * (3 - 2 * progress);
      }
      hazard.x = roadX(hazard.lane, hazard.y);
      const scale = .28 + depth * .92;
      const hitRadius = hazard.type === 'puddle' ? 27 * scale : hazard.type === 'car' ? 31 * scale : 24 * scale;
      if (!hazard.dead && hazard.y > PLAYER_Y - 50 && hazard.y < PLAYER_Y + 36 && Math.abs(hazard.x - player.x) < hitRadius + 17) hitPlayer(hazard);
      if (hazard.y > H + 80) hazard.dead = true;
    });

    bundles.forEach(bundle => {
      const depth = clamp((bundle.y - HORIZON) / (H - HORIZON), 0, 1);
      bundle.y += state.worldSpeed * dt * (.5 + depth * .66);
      bundle.x = roadX(bundle.lane, bundle.y);
      bundle.spin += dt * 4;
      if (!bundle.dead && Math.abs(bundle.y - PLAYER_Y) < 36 && Math.abs(bundle.x - player.x) < 36) collectBundle(bundle);
      if (bundle.y > H + 55) bundle.dead = true;
    });

    flyingPapers.forEach(paper => {
      paper.x += paper.vx * dt;
      paper.y += paper.vy * dt;
      paper.vy += 28 * dt;
      paper.rotation += paper.spin * dt;
      for (const target of targets) {
        if (paper.dead || target.dead || target.delivered || Math.sign(paper.vx) !== target.side) continue;
        const depth = clamp((target.y - HORIZON) / (H - HORIZON), 0, 1);
        const radius = 22 + depth * 24;
        if (Math.hypot(paper.x - target.x, (paper.y - target.y) * .85) < radius) deliver(target, paper);
      }
      if (paper.x < -40 || paper.x > W + 40 || paper.y < 80 || paper.y > H + 30) paper.dead = true;
    });

    for (let index = targets.length - 1; index >= 0; index -= 1) if (targets[index].dead) targets.splice(index, 1);
    for (let index = hazards.length - 1; index >= 0; index -= 1) if (hazards[index].dead) hazards.splice(index, 1);
    for (let index = bundles.length - 1; index >= 0; index -= 1) if (bundles[index].dead) bundles.splice(index, 1);
    for (let index = flyingPapers.length - 1; index >= 0; index -= 1) if (flyingPapers[index].dead) flyingPapers.splice(index, 1);

    if (state.routeRemaining <= 0 && state.nextAddress === neighborhood.length && targets.length === 0) finishPhase();
  }

  function updateParticles(dt) {
    particles.forEach(particle => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 150 * dt;
      particle.life -= dt;
    });
    for (let index = particles.length - 1; index >= 0; index -= 1) if (particles[index].life <= 0) particles.splice(index, 1);
  }

  function update(dt) {
    if (state.paused || !state.started) return;
    if (state.messageTimer > 0) state.messageTimer -= dt;
    state.shake = Math.max(0, state.shake - dt * 24);
    updateParticles(dt);

    if (state.mode === 'playing') updatePlaying(dt);
    else if (state.mode === 'transition') {
      state.transitionTimer -= dt;
      updateScenery(dt, state.worldSpeed * .25);
      if (state.transitionTimer <= 0) {
        if (state.transitionSuccess) startPhase(state.phase + 1);
        else if (state.lives > 0) startPhase(state.phase);
      }
    }
    updateHud();
  }

  function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(245, 232, 200, .82)';
    ctx.beginPath();
    ctx.arc(-28, 5, 20, 0, Math.PI * 2);
    ctx.arc(0, -4, 29, 0, Math.PI * 2);
    ctx.arc(31, 6, 18, 0, Math.PI * 2);
    ctx.rect(-29, 3, 60, 22);
    ctx.fill();
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = '#78bdc3';
    ctx.fillRect(0, 0, W, HORIZON + 7);
    ctx.fillStyle = '#f4c95d';
    ctx.beginPath();
    ctx.arc(770, 84, 40, 0, Math.PI * 2);
    ctx.fill();
    drawCloud(188 - (state.worldScroll * .03) % 240, 73, .72);
    drawCloud(535 - (state.worldScroll * .018) % 330, 48, .52);

    // Distant gardens and rooftops ground the vanishing point in a neighborhood.
    ctx.fillStyle = '#739381';
    for (let i = 0; i < 24; i++) {
      const x = i * 43;
      ctx.beginPath(); ctx.arc(x, HORIZON + 2, 13 + i % 4 * 5, Math.PI, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#486f57';
    ctx.fillRect(0, HORIZON, W, H - HORIZON);
    ctx.fillStyle = '#c8c3af';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 82, HORIZON);
    ctx.lineTo(W / 2 + 82, HORIZON);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4d5558';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 68, HORIZON);
    ctx.lineTo(W / 2 + 68, HORIZON);
    ctx.lineTo(W - 55, H);
    ctx.lineTo(55, H);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f5e8c8';
    ctx.lineWidth = 4;
    ctx.setLineDash([19, 18]);
    ctx.lineDashOffset = state.worldScroll * .75;
    ctx.beginPath();
    ctx.moveTo(W / 2, HORIZON + 4);
    ctx.lineTo(W / 2, H + 30);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(23, 42, 50, .18)';
    ctx.lineWidth = 1;
    for (let y = 152; y < H; y += 28) {
      ctx.beginPath();
      ctx.moveTo(W / 2 - roadHalf(y), y);
      ctx.lineTo(W / 2 + roadHalf(y), y);
      ctx.stroke();
    }
  }

  function drawGarden(item) {
    const depth = clamp((item.y - HORIZON) / (H - HORIZON), 0, 1);
    const scale = .2 + depth * .8;
    const x = W / 2 + item.side * (roadHalf(item.y) + 180 * scale);
    ctx.save(); ctx.translate(x, item.y); ctx.scale(scale, scale);
    ctx.fillStyle = '#243f3738'; ctx.beginPath(); ctx.ellipse(17, 7, 45, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#70604b'; ctx.fillRect(-5, -70, 10, 74);
    ctx.strokeStyle = '#70604b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -33); ctx.lineTo(-19, -63); ctx.moveTo(1, -44); ctx.lineTo(21, -76); ctx.stroke();
    ctx.fillStyle = '#365d43'; ctx.beginPath(); ctx.arc(-20, -79, 27, 0, Math.PI * 2); ctx.arc(15, -90, 33, 0, Math.PI * 2); ctx.arc(28, -66, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#638453'; ctx.beginPath(); ctx.ellipse(-12, -93, 26, 18, -.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b7b1a0'; ctx.fillRect(-61, 13, 122, 4); ctx.fillRect(-61, 26, 122, 4);
    for (let x = -59; x <= 60; x += 15) ctx.fillRect(x, 7, 5, 31);
    ctx.restore();
  }

  function drawHouse(item) {
    const depth = clamp((item.y - HORIZON) / (H - HORIZON), 0, 1);
    const scale = .26 + depth * .68;
    const x = W / 2 + item.side * (roadHalf(item.y) + 97 * scale);
    const y = item.y - 44 * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(23, 42, 50, .22)';
    ctx.beginPath();
    ctx.ellipse(0, 55, 78, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // A three-quarter house: shaded side wall, clapboard front and shingled roof.
    ctx.fillStyle = '#b8b1a0';
    ctx.beginPath(); ctx.moveTo(-65, 53); ctx.lineTo(-96, 35); ctx.lineTo(-96, -45); ctx.lineTo(-65, -27); ctx.closePath(); ctx.fill();
    ctx.fillStyle = item.hue;
    ctx.strokeStyle = '#645f54';
    ctx.lineWidth = 1.5;
    const tall = item.id % 3 === 0 ? 22 : 0;
    ctx.fillRect(-65, -30 - tall, 130, 83 + tall);
    ctx.strokeRect(-65, -30 - tall, 130, 83 + tall);
    ctx.strokeStyle = 'rgba(64,55,43,.22)';
    for (let row = -24 - tall; row < 51; row += 7) {
      ctx.beginPath(); ctx.moveTo(-64, row); ctx.lineTo(64, row); ctx.stroke();
    }
    ctx.fillStyle = item.roof;
    ctx.beginPath();
    ctx.moveTo(-75, -29 - tall);
    ctx.lineTo(-8, -86 - tall);
    ctx.lineTo(75, -29 - tall);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3c4141';
    ctx.beginPath(); ctx.moveTo(-75, -29 - tall); ctx.lineTo(-106, -47 - tall); ctx.lineTo(-39, -103 - tall); ctx.lineTo(-8, -86 - tall); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#986f59'; ctx.fillRect(34, -83 - tall, 15, 31);
    ctx.fillStyle = '#c3ad92'; ctx.fillRect(31, -86 - tall, 21, 5);
    ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1;
    for (let row = 1; row < 6; row++) {
      const ry = -86 - tall + row * 9;
      ctx.beginPath(); ctx.moveTo(-8 - row * 10.6, ry); ctx.lineTo(-8 + row * 13, ry); ctx.stroke();
    }
    ctx.fillStyle = '#efe7d5'; ctx.fillRect(-72, -30 - tall, 145, 5);
    for (const wx of [-46, 27]) {
      ctx.fillStyle = '#eee8d8'; ctx.fillRect(wx - 3, -15 - tall, 29, 35);
      ctx.fillStyle = '#496b77'; ctx.fillRect(wx, -12 - tall, 23, 29);
      ctx.fillStyle = '#b5d5d6'; ctx.beginPath(); ctx.moveTo(wx + 2, -10 - tall); ctx.lineTo(wx + 20, -10 - tall); ctx.lineTo(wx + 2, 8 - tall); ctx.fill();
      ctx.fillStyle = '#e9e0cc'; ctx.fillRect(wx + 10, -12 - tall, 2, 29); ctx.fillRect(wx, 1 - tall, 23, 2);
      ctx.fillStyle = item.roof; ctx.fillRect(wx - 10, -14 - tall, 5, 32); ctx.fillRect(wx + 28, -14 - tall, 5, 32);
    }
    ctx.fillStyle = '#594b3d'; ctx.fillRect(-13, 4, 27, 49);
    ctx.fillStyle = '#88a4a6'; ctx.fillRect(-8, 9, 17, 15);
    ctx.fillStyle = '#d4b472'; ctx.beginPath(); ctx.arc(8, 35, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b1a593'; ctx.fillRect(-27, 51, 56, 6); ctx.fillRect(-32, 57, 66, 6);
    ctx.fillStyle = '#ddd2b9'; ctx.fillRect(-25, 9, 4, 42); ctx.fillRect(24, 9, 4, 42);
    ctx.fillStyle = item.roof; ctx.beginPath(); ctx.moveTo(-33, 10); ctx.lineTo(-3, -9); ctx.lineTo(35, 10); ctx.fill();
    ctx.fillStyle = '#3e6446';
    for (const bx of [-49, 48]) { ctx.beginPath(); ctx.ellipse(bx, 49, 20, 10, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#dfd8c4'; ctx.fillRect(-15, 63, 30, 18);
    ctx.restore();
  }

  function drawMailbox(target) {
    const depth = clamp((target.y - HORIZON) / (H - HORIZON), 0, 1);
    const scale = .32 + depth * .9;
    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.scale(scale, scale);
    const subscriber = target.wasSubscribed;
    if (subscriber && !target.delivered) {
      ctx.strokeStyle = subscriber ? '#b5e4a5' : '#edc579';
      ctx.lineWidth = 8;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.arc(0, -23, 39, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#172a32';
    ctx.fillRect(-5, -8, 10, 50);
    ctx.fillStyle = target.delivered ? '#e7a44d' : subscriber ? '#f5e8c8' : '#919895';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 4;
    roundedRect(-25, -44, 49, 31, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d84f39';
    ctx.fillRect(target.side < 0 ? 17 : -24, -50, 6, 28);
    ctx.fillRect(target.side < 0 ? 17 : -37, -50, 19, 11);
    if (target.delivered) {
      ctx.strokeStyle = '#34694d';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-12, -29);
      ctx.lineTo(-2, -18);
      ctx.lineTo(15, -39);
      ctx.stroke();
    }
    ctx.fillStyle = subscriber ? '#254d36' : '#4b5354';
    roundedRect(-40, -79, 80, 23, 4); ctx.fill();
    ctx.fillStyle = '#fff9e8'; ctx.font = 'bold 13px Trebuchet MS'; ctx.textAlign = 'center';
    ctx.fillText(target.delivered ? 'THANKS!' : subscriber ? 'DELIVER' : 'PASS', 0, -63);
    ctx.fillStyle = '#fff8df'; ctx.font = 'bold 12px Trebuchet MS'; ctx.fillText(`#${target.home.number}`, 0, 30);
    ctx.restore();
  }

  function drawCar(hazard, scale) {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(23, 42, 50, .27)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 39, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hazard.color;
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#20272a';
    roundedRect(-37, -17, 12, 39, 4); ctx.fill(); roundedRect(25, -17, 12, 39, 4); ctx.fill();
    ctx.fillStyle = hazard.color;
    roundedRect(-34, -39, 68, 62, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-31, -29); ctx.lineTo(-24, -60); ctx.quadraticCurveTo(0, -68, 24, -60); ctx.lineTo(31, -29); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#344f5a';
    ctx.beginPath(); ctx.moveTo(-23, -34); ctx.lineTo(-19, -56); ctx.lineTo(19, -56); ctx.lineTo(23, -34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a6c9ce'; ctx.beginPath(); ctx.moveTo(-18, -53); ctx.lineTo(14, -53); ctx.lineTo(-19, -39); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff24'; ctx.fillRect(-25, -26, 50, 16);
    ctx.strokeStyle = '#00000038'; ctx.beginPath(); ctx.moveTo(-24, -25); ctx.lineTo(-28, -3); ctx.moveTo(24, -25); ctx.lineTo(28, -3); ctx.stroke();
    ctx.fillStyle = '#d8d5c8'; roundedRect(-34, 12, 68, 7, 3); ctx.fill();
    ctx.fillStyle = '#222d30'; ctx.fillRect(-14, 2, 28, 10);
    ctx.fillStyle = '#b3b9b6'; for (let gx = -11; gx < 13; gx += 5) ctx.fillRect(gx, 4, 2, 6);
    ctx.fillStyle = '#fff0bc'; ctx.fillRect(-29, 0, 13, 9); ctx.fillRect(16, 0, 13, 9);
    ctx.fillStyle = '#f8f0dd'; ctx.fillRect(-9, 15, 18, 5);
    ctx.fillStyle = hazard.color; ctx.fillRect(-41, -33, 9, 6); ctx.fillRect(32, -33, 9, 6);
    if (state.carDrift > 0 && hazard.y < 400 && Math.floor(hazard.y / 18) % 2 === 0) {
      ctx.fillStyle = '#ffb52e'; ctx.fillRect(hazard.baseLane > 0 ? -31 : 24, -3, 7, 5);
    }
    ctx.restore();
  }

  function drawDog(hazard, scale) {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.fillStyle = '#b86a39';
    ctx.beginPath();
    ctx.ellipse(0, -9, 27, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(23, -22, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-17, 3); ctx.lineTo(-24, 24);
    ctx.moveTo(13, 3); ctx.lineTo(20, 24);
    ctx.moveTo(-25, -15); ctx.quadraticCurveTo(-43, -31, -37, -42);
    ctx.stroke();
    ctx.fillStyle = '#172a32';
    ctx.beginPath(); ctx.arc(30, -25, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPuddle(hazard, scale) {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#315f79';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 18, -.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#a7d3cf';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-6, -1, 14, Math.PI * .1, Math.PI * .75); ctx.stroke();
    ctx.restore();
  }

  function drawCones(hazard, scale) {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.scale(scale, scale);
    [-20, 20].forEach((x, index) => {
      ctx.fillStyle = '#ee6b3b';
      ctx.strokeStyle = '#172a32';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, -28 - index * 4);
      ctx.lineTo(x - 15, 16);
      ctx.lineTo(x + 15, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f5e8c8';
      ctx.fillRect(x - 10, -2, 20, 8);
    });
    ctx.restore();
  }

  function drawBundle(bundle) {
    const depth = clamp((bundle.y - HORIZON) / (H - HORIZON), 0, 1);
    const scale = .34 + depth * .82;
    ctx.save();
    ctx.translate(bundle.x, bundle.y);
    ctx.rotate(Math.sin(bundle.spin) * .1);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#f5e8c8';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 4;
    roundedRect(-28, -20, 56, 38, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d84f39';
    ctx.fillRect(-28, -3, 56, 9);
    ctx.fillStyle = '#172a32';
    ctx.font = '900 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRA!', 0, -8);
    ctx.restore();
  }

  function drawFlyingPaper(paper) {
    ctx.save();
    ctx.translate(paper.x, paper.y);
    ctx.rotate(paper.rotation);
    ctx.fillStyle = '#fff9e8';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 2;
    ctx.fillRect(-13, -9, 26, 18);
    ctx.strokeRect(-13, -9, 26, 18);
    ctx.fillStyle = '#d84f39';
    ctx.fillRect(-11, -6, 22, 4);
    ctx.restore();
  }

  function drawPlayer() {
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) return;
    ctx.save();
    ctx.translate(player.x, PLAYER_Y);
    ctx.rotate(player.tilt);

    // Rear-view silhouette: every major bike part converges toward the road's
    // vanishing point, so the rider reads as traveling away from the camera.
    ctx.fillStyle = 'rgba(23, 42, 50, .28)';
    ctx.beginPath();
    ctx.ellipse(0, 40, 31, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Narrow, foreshortened wheels: the smaller front tire sits farther up-road.
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, -17, 6, 17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(0, 22, 10, 24, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rear fender and tapered frame rails point straight toward the horizon.
    ctx.strokeStyle = '#ee6b3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 22, 15, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 22);
    ctx.lineTo(-9, -5);
    ctx.lineTo(0, -21);
    ctx.lineTo(9, -5);
    ctx.lineTo(6, 22);
    ctx.closePath();
    ctx.stroke();

    // Fork, seat, handlebars, crank, and pedals remain symmetrical from behind.
    ctx.strokeStyle = '#172a32';
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-2, -34); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(0, -32);
    ctx.moveTo(-17, -30); ctx.lineTo(17, -30);
    ctx.moveTo(-8, -8); ctx.lineTo(8, -8);
    ctx.moveTo(0, 4); ctx.lineTo(-17, 10);
    ctx.moveTo(0, 4); ctx.lineTo(17, 10);
    ctx.stroke();

    // Newspaper satchel rides beside the rear rack instead of defining the bike axis.
    ctx.fillStyle = '#f4c95d';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 4;
    roundedRect(-37, -18, 25, 32, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#172a32';
    ctx.font = '900 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEWS', -24.5, 1);

    // Legs straddle the centered frame and lead naturally to the pedals.
    ctx.strokeStyle = '#315f79';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-7, -13); ctx.lineTo(-13, 8); ctx.lineTo(-17, 10);
    ctx.moveTo(7, -13); ctx.lineTo(13, 8); ctx.lineTo(17, 10);
    ctx.stroke();

    // Back, shoulders, and arms taper toward the handlebars.
    ctx.fillStyle = '#ee6b3b';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-13, -43);
    ctx.quadraticCurveTo(0, -49, 13, -43);
    ctx.lineTo(10, -14);
    ctx.quadraticCurveTo(0, -9, -10, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#f1b07a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-12, -39); ctx.lineTo(-18, -29);
    ctx.moveTo(12, -39); ctx.lineTo(18, -29);
    ctx.stroke();

    // Rear of the rider's head and cap complete the away-facing pose.
    ctx.fillStyle = '#f1b07a';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -55, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#315f79';
    ctx.beginPath();
    ctx.arc(0, -58, 13, Math.PI, Math.PI * 2);
    ctx.lineTo(14, -58);
    ctx.lineTo(8, -54);
    ctx.lineTo(-12, -54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawActors() {
    const actors = [
      ...targets.map(item => ({ kind: 'target', item })),
      ...hazards.map(item => ({ kind: 'hazard', item })),
      ...bundles.map(item => ({ kind: 'bundle', item }))
    ].sort((a, b) => a.item.y - b.item.y);

    actors.forEach(actor => {
      if (actor.kind === 'target') drawMailbox(actor.item);
      else if (actor.kind === 'bundle') drawBundle(actor.item);
      else {
        const depth = clamp((actor.item.y - HORIZON) / (H - HORIZON), 0, 1);
        const scale = .3 + depth * .92;
        if (actor.item.type === 'car') drawCar(actor.item, scale);
        else if (actor.item.type === 'dog') drawDog(actor.item, scale);
        else if (actor.item.type === 'puddle') drawPuddle(actor.item, scale);
        else drawCones(actor.item, scale);
      }
    });
  }

  function drawParticles() {
    particles.forEach(particle => {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
  }

  function drawComicTexture() {
    ctx.save();
    ctx.globalAlpha = .065;
    ctx.fillStyle = '#172a32';
    for (let y = 6; y < H; y += 12) {
      for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }
    ctx.restore();
  }

  function drawMessage() {
    if (state.messageTimer <= 0) return;
    const alpha = clamp(state.messageTimer * 2, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, 112);
    ctx.rotate(-.012);
    ctx.font = '900 22px Impact, Arial Black, sans-serif';
    const width = ctx.measureText(state.message).width + 38;
    ctx.fillStyle = '#f5e8c8';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 4;
    roundedRect(-width / 2, -20, width, 38, 7);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#172a32';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.message, 0, 0);
    ctx.restore();
  }

  function deliveryReady(target) {
    if ((player.x - W / 2) * target.side < 90) return false;
    const a = state.worldSpeed * .48;
    const b = state.worldSpeed * .62 / (H - HORIZON);
    for (let t = .06; t <= .7; t += .025) {
      const y = HORIZON + (target.y - HORIZON + a / b) * Math.exp(b * t) - a / b;
      const x = W / 2 + target.side * (roadHalf(y) + 31);
      const px = player.x + target.side * (17 + (365 + Math.min(state.phase, 6) * 8) * t);
      const py = PLAYER_Y - 18 - 92 * t + 14 * t * t;
      if (Math.hypot(px - x, (py - y) * .85) < 28) return true;
    }
    return false;
  }

  function drawDeliveryCue() {
    if (state.mode !== 'playing') return;
    const next = targets.find(target => target.wasSubscribed && !target.delivered && !target.dead && target.y > 290 && target.y < 440);
    if (!next) return;
    const ready = deliveryReady(next);
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = ready ? '#fff2b5' : '#f6eedb'; ctx.strokeStyle = '#172a32'; ctx.lineWidth = 4;
    ctx.font = 'bold 17px Trebuchet MS';
    const cue = ready ? 'THROW NOW!' : next.side < 0 ? '← LEFT DELIVERY' : 'RIGHT DELIVERY →';
    ctx.strokeText(cue, player.x, PLAYER_Y + 61); ctx.fillText(cue, player.x, PLAYER_Y + 61);
    ctx.restore();
  }

  function drawEndOverlay() {
    if (state.mode !== 'gameover' && state.mode !== 'transition') return;
    ctx.save();
    ctx.fillStyle = 'rgba(12, 29, 36, .62)';
    ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2 + 24);
    ctx.rotate(-.015);
    ctx.fillStyle = '#f5e8c8';
    ctx.strokeStyle = '#172a32';
    ctx.lineWidth = 6;
    roundedRect(-260, -116, 520, 262, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = state.mode === 'gameover' ? '#c84630' : state.transitionSuccess ? '#34694d' : '#c84630';
    ctx.font = '900 38px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.mode === 'gameover' ? 'ROUTE CANCELLED' : state.perfect ? 'PERFECT RUN!' : `DAY ${state.phase} · CUSTOMER REPORT`, 0, -76);
    ctx.fillStyle = '#172a32';
    ctx.font = '900 18px Trebuchet MS, sans-serif';
    if (state.mode === 'gameover') {
      ctx.font = 'bold 17px Trebuchet MS';
      ctx.fillText(state.endReason, 0, -23);
      ctx.fillText(`FINAL SCORE ${String(Math.floor(state.score)).padStart(6, '0')}`, 0, 13);
      ctx.font = '800 15px Trebuchet MS, sans-serif';
      ctx.fillText('PRESS R OR TAP ↻ TO START FRESH', 0, 52);
    } else {
      ctx.fillText(`${customerCount()} CUSTOMERS · +${state.gained} JOINED / −${state.lost} CANCELLED`, 0, -45);
      neighborhood.forEach((home, index) => {
        const x = -235 + (index % 12) * 40;
        const y = -27 + Math.floor(index / 12) * 30;
        ctx.fillStyle = state.newSubscribers.includes(home.number) ? '#ba6b21' : home.subscribed ? '#34694d' : '#bfae95';
        ctx.fillRect(x, y, 30, 24);
        ctx.fillStyle = '#fff9e7'; ctx.font = 'bold 11px Trebuchet MS'; ctx.fillText(home.number, x + 15, y + 16);
      });
      ctx.fillStyle = '#172a32';
      ctx.font = '800 14px Trebuchet MS, sans-serif';
      ctx.fillText(state.gained ? `NEW NEXT DAY: ${state.newSubscribers.map(number => '#' + number).join(' & ')}` : 'THE WHOLE STREET SUBSCRIBES!', 0, 52);
      ctx.fillText(`${state.delivered}/${state.quota} DELIVERED · ${state.crashes} CRASHES · ${state.lives}/3 LIVES`, 0, 77);
      ctx.fillText(`DAY ${state.phase + 1} STARTS IN ${Math.max(1, Math.ceil(state.transitionTimer))}…`, 0, 113);
    }
    ctx.restore();
  }

  function render() {
    ctx.save();
    if (state.shake > 0) ctx.translate(randomRange(-state.shake, state.shake), randomRange(-state.shake, state.shake));
    drawBackground();
    scenery.slice().sort((a, b) => a.y - b.y).forEach(drawGarden);
    targets.slice().sort((a, b) => a.y - b.y).forEach(target => drawHouse({ ...target.home, y: target.y, side: target.side }));
    drawActors();
    flyingPapers.forEach(drawFlyingPaper);
    drawPlayer();
    drawDeliveryCue();
    drawParticles();
    drawMessage();
    drawEndOverlay();
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(.04, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    update(dt);
    render();
    animationFrame = requestAnimationFrame(frame);
  }

  function setMovement(action, active) {
    input[action] = active;
    if (active) ensureAudio();
  }

  function resetInput() {
    input.left = false;
    input.right = false;
    input.joystick = 0;
    document.querySelectorAll('[data-action="throw"]').forEach(button => button.classList.remove('pressed'));
  }

  function showInstructions() {
    modalWasPlaying = state.started && !state.paused && state.mode !== 'gameover';
    state.paused = true;
    resetInput();
    closeInstructions.textContent = state.started ? 'Return to the route' : 'Start the route';
    modal.classList.add('is-visible');
    updateHud();
    closeInstructions.focus({ preventScroll: true });
  }

  function hideInstructions() {
    modal.classList.remove('is-visible');
    try { sessionStorage.setItem('vibecade-instructions-paper-route-rush-v3', '1'); } catch (_) {}
    ensureAudio();
    if (!state.started) {
      state.started = true;
      state.paused = false;
      startPhase(initialPhase);
    } else {
      state.paused = false;
      if (modalWasPlaying) showMessage('BACK ON THE ROUTE', .8);
    }
    lastTime = performance.now();
    updateHud();
    shell.focus({ preventScroll: true });
  }

  closeInstructions.addEventListener('click', hideInstructions);
  helpButton.addEventListener('click', showInstructions);
  modal.addEventListener('click', event => {
    if (event.target === modal) hideInstructions();
  });

  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', ' ', 'a', 'd', 'f', 'r', 'm'].includes(key)) event.preventDefault();
    if (key === 'arrowleft' || key === 'a') {
      setMovement('left', true);
      if (!event.repeat) player.vx = Math.max(-345, player.vx - 58);
    }
    if (key === 'arrowright' || key === 'd') {
      setMovement('right', true);
      if (!event.repeat) player.vx = Math.min(345, player.vx + 58);
    }
    if ((key === ' ' || key === 'f') && !event.repeat) throwPaper();
    if (key === 'r' && !event.repeat && !modal.classList.contains('is-visible')) restartGame();
    if (key === 'm' && !event.repeat) {
      state.sound = !state.sound;
      if (state.sound) {
        ensureAudio();
        tone(520, .07, 'square', .03);
      }
      updateHud();
      announce(`Sound ${state.sound ? 'on' : 'off'}.`);
    }
  });

  document.addEventListener('keyup', event => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') setMovement('left', false);
    if (key === 'arrowright' || key === 'd') setMovement('right', false);
  });

  window.addEventListener('blur', resetInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.started && !state.paused && state.mode !== 'gameover') showInstructions();
  });
  shell.addEventListener('pointerdown', () => shell.focus({ preventScroll: true }));

  function bindJoystick() {
    const joystick = document.querySelector('[data-joystick]');
    if (!joystick || joystick.dataset.bound === 'true' || !window.VibeCadeJoystick) return;
    joystick.dataset.bound = 'true';
    window.VibeCadeJoystick(joystick, {
      mode: 'horizontal',
      profile: 'precision',
      onChange: x => {
        input.joystick = x;
        shell.dataset.joystickX = x.toFixed(3);
        shell.dataset.joystickPeak = Math.max(Number(shell.dataset.joystickPeak) || 0, Math.abs(x)).toFixed(3);
        shell.dataset.joystickSamples = String((Number(shell.dataset.joystickSamples) || 0) + 1);
      }
    });
  }

  if (window.VibeCadeJoystick) bindJoystick();
  else window.addEventListener('vibecade-controls-ready', bindJoystick, { once: true });

  document.querySelectorAll('[data-action="throw"]').forEach(button => {
    const press = event => {
      event.preventDefault();
      button.classList.add('pressed');
      try { button.setPointerCapture(event.pointerId); } catch (_) {}
      throwPaper();
    };
    const release = event => {
      event?.preventDefault();
      button.classList.remove('pressed');
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', event => event.preventDefault());
  });

  window.addEventListener('vibecade:restart', event => {
    event.preventDefault();
    restartGame();
  });

  window.__paperRouteDebug = Object.freeze({
    snapshot: () => ({
      started: state.started,
      paused: state.paused,
      mode: state.mode,
      phase: state.phase,
      score: state.score,
      lives: state.lives,
      papers: state.papers,
      delivered: state.delivered,
      quota: state.quota,
      routeRemaining: Number(state.routeRemaining.toFixed(2)),
      routeTotal: state.routeTotal,
      worldSpeed: state.worldSpeed,
      targetEvery: state.targetEvery,
      obstacleEvery: state.obstacleEvery,
      dogChance: state.dogChance,
      doubleChance: state.doubleChance,
      targets: targets.length,
      hazards: hazards.length,
      joystick: input.joystick
    }),
    setPhase: phase => {
      state.started = true;
      state.paused = false;
      modal.classList.remove('is-visible');
      startPhase(clamp(Number(phase) || 1, 1, 8));
    },
    spawnMailbox: side => spawnTarget(side < 0 ? -1 : 1),
    spawnHazard: type => spawnHazard(type),
    setRouteRemaining: seconds => { state.routeRemaining = Math.max(0, Number(seconds) || 0); },
    setInvulnerable: seconds => { player.invulnerable = Math.max(0, Number(seconds) || 0); }
  });

  seedScenery();
  updateHud();
  render();
  animationFrame = requestAnimationFrame(frame);

  let hasSeenInstructions = false;
  try { hasSeenInstructions = sessionStorage.getItem('vibecade-instructions-paper-route-rush-v3') === '1'; } catch (_) {}
  if (hasSeenInstructions) {
    modal.classList.remove('is-visible');
    state.started = true;
    state.paused = false;
    startPhase(initialPhase);
  } else {
    closeInstructions.focus({ preventScroll: true });
  }

  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
})();

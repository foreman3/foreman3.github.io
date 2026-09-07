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
    street: document.getElementById('street'),
    delivered: document.getElementById('delivered'),
    quota: document.getElementById('quota'),
    papers: document.getElementById('papers'),
    health: document.getElementById('health'),
    strikes: document.getElementById('strikes'),
    route: document.getElementById('route-fill'),
    sound: document.getElementById('sound-status')
  };
  const attemptAction = document.getElementById('attempt-action');
  const trafficWarning = document.getElementById('traffic-warning');

  const W = 960;
  const H = 540;
  const HORIZON = 132;
  const PLAYER_Y = 447;
  const STREET_TRANSITION_SECONDS = 1.2;
  const ROUTE_DIFFICULTY = [
    { worldSpeed: 150, targetEvery: 1.9, obstacleEvery: 3.0, dogChance: 0, doubleChance: 0, dogWeave: .16, crossChance: 0, overtakeChance: 0, name: 'QUIET MORNING' },
    { worldSpeed: 166, targetEvery: 1.82, obstacleEvery: 2.6, dogChance: 0, doubleChance: 0, dogWeave: .17, crossChance: .48, overtakeChance: .14, name: 'COMMUTER TRAFFIC' },
    { worldSpeed: 181, targetEvery: 1.74, obstacleEvery: 2.25, dogChance: .12, doubleChance: 0, dogWeave: .20, crossChance: .58, overtakeChance: .18, name: 'AROUND THE CORNER' },
    { worldSpeed: 212, targetEvery: 1.66, obstacleEvery: 1.5, dogChance: .25, doubleChance: .12, dogWeave: .24, crossChance: .92, overtakeChance: .48, name: 'BUSY INTERSECTIONS' },
    { worldSpeed: 230, targetEvery: 1.58, obstacleEvery: 1.32, dogChance: .29, doubleChance: .16, dogWeave: .28, crossChance: 1, overtakeChance: .58, name: 'RUSH HOUR' }
  ];
  const params = new URLSearchParams(location.search);
  const initialPhase = Math.max(1, Math.min(8, Number(params.get('phase')) || 1));
  const testScenario = params.get('scenario') || '';
  let randomSeed = (Number(params.get('seed')) || 271828) >>> 0;
  let visualSeed = randomSeed ^ 0x9e3779b9;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const input = { left: false, right: false, joystick: 0 };
  const targets = [];
  const hazards = [];
  const bundles = [];
  const flyingPapers = [];
  const particles = [];
  const scenery = [];
  const intersections = [];
  const roadMarks = [];
  const PASS_TARGET = 7;
  const BAG_CAPACITY = 24;
  const BLOCK_SIZE = 6;
  const STARTING_SUBSCRIBERS = new Set([0, 2, 5, 7, 10, 12, 15, 17, 20, 22]);
  const neighborhoods = [1, 2].map(street => Array.from({ length: 24 }, (_, id) => ({
    id, number: street * 100 + 101 + id, side: id % 2 ? 1 : -1,
    subscribed: STARTING_SUBSCRIBERS.has(id),
    hue: ['#d8cbb5', '#a7b5ab', '#ba8c73', '#d7d3c3'][(id + street) % 4],
    roof: ['#544c48', '#424f56', '#775b4c'][(id + street) % 3]
  })));
  let neighborhood = neighborhoods[0];
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
    health: 3,
    healthMax: 3,
    strikes: 0,
    street: 1,
    streetCount: 1,
    streetResults: [],
    levelCheckpoint: null,
    papers: 13,
    delivered: 0,
    quota: PASS_TARGET,
    combo: 0,
    bestCombo: 0,
    misses: 0,
    gained: 0,
    lost: 0,
    crashes: 0,
    perfect: false,
    newSubscribers: [],
    crossChance: 0,
    overtakeChance: 0,
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
    nextIntersectionAddress: BLOCK_SIZE,
    overtakeTimer: 9,
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
  // Effects and rendering must never change the traffic a retry will encounter.
  const visualRange = (min, max) => {
    visualSeed = (1664525 * visualSeed + 1013904223) >>> 0;
    return min + (max - min) * visualSeed / 4294967296;
  };

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
      crossChance: Math.min(.92, .84 + extra * .02),
      overtakeChance: Math.min(.38, .30 + extra * .02),
      name: 'OVERTIME EDITION'
    };
  }

  function roadHalf(y) {
    if (state.street === 2) return 70 + 355 * (PLAYER_Y - HORIZON) / (H - HORIZON);
    const depth = clamp((y - HORIZON) / (H - HORIZON), 0, 1);
    return lerp(70, 425, depth);
  }

  function roadX(lane, y) {
    return W / 2 + lane * roadHalf(y) * .72;
  }

  const routeSpawnY = () => state.street === 2 ? -260 : HORIZON + 4;
  const groundAdvance = (y, distance) => y + distance * (state.street === 2 ? .96
    : .48 + clamp((y - HORIZON) / (H - HORIZON), 0, 1) * .62);

  function seedRoadMarks() {
    roadMarks.length = 0;
    for (let y = routeSpawnY(); y < H + 200;) {
      const gap = state.street === 2 ? 70 : 14 + clamp((y - HORIZON) / (H - HORIZON), 0, 1) * 44;
      roadMarks.push({ y, endY: y + gap * .48 });
      y += gap;
    }
  }

  function updateRoadMarks(distance) {
    for (const mark of roadMarks) {
      mark.y = groundAdvance(mark.y, distance);
      mark.endY = groundAdvance(mark.endY, distance);
    }
    while (roadMarks.at(-1)?.y > H + 200) roadMarks.pop();
    const gap = state.street === 2 ? 70 : 14;
    while (roadMarks[0].y > routeSpawnY() + gap) {
      const y = roadMarks[0].y - gap;
      roadMarks.unshift({ y, endY: y + gap * .48 });
    }
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
    hud.street.textContent = `${state.street}/${state.streetCount}`;
    hud.delivered.textContent = state.delivered;
    hud.quota.textContent = PASS_TARGET;
    document.getElementById('customers').textContent = `${customerCount()}/${neighborhood.length}`;
    document.getElementById('customer-card').classList.toggle('at-risk', state.delivered < PASS_TARGET && state.misses > Math.max(0, state.quota - PASS_TARGET));
    document.getElementById('customer-status').textContent = state.mode === 'gameover' ? 'THREE STRIKES · ROUTE CLOSED' : state.mode === 'failed' ? 'STRIKE · RETRY THIS LEVEL' : `${Math.max(0, PASS_TARGET - state.delivered)} MORE TO PASS · ${state.delivered}/${state.quota} SUBSCRIBERS SERVED`;
    hud.papers.textContent = state.papers;
    hud.health.textContent = `${Math.max(0, state.health)}/${state.healthMax}`;
    hud.strikes.textContent = '●'.repeat(state.strikes) + '○'.repeat(Math.max(0, 3 - state.strikes));
    hud.route.style.transform = `scaleX(${clamp(state.routeRemaining / state.routeTotal, 0, 1)})`;
    hud.sound.textContent = `SOUND ${state.sound ? 'ON' : 'OFF'} · M`;
    trafficWarning.hidden = state.paused || state.mode !== 'playing'
      || !hazards.some(hazard => hazard.type === 'overtaking' && !hazard.dead && hazard.y > PLAYER_Y - 50);
    attemptAction.hidden = state.mode !== 'failed' && state.mode !== 'gameover';
    attemptAction.textContent = state.mode === 'gameover' ? 'Start over · Level 1' : 'Retry level';
    shell.dataset.gameMode = state.mode;
    shell.dataset.started = String(state.started);
    shell.dataset.paused = String(state.paused);
    shell.dataset.phase = String(state.phase);
    shell.dataset.street = String(state.street);
    shell.dataset.streetCount = String(state.streetCount);
    shell.dataset.health = String(state.health);
    shell.dataset.healthMax = String(state.healthMax);
    shell.dataset.dogModes = hazards.filter(hazard => hazard.type === 'dog' && !hazard.dead).map(dog => dog.dogMode).join(',');
    shell.dataset.branchCount = String(hazards.filter(hazard => hazard.type === 'branch' && !hazard.dead).length);
    shell.dataset.strikes = String(state.strikes);
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

  function clearStreetActors() {
    targets.length = 0;
    hazards.length = 0;
    bundles.length = 0;
    flyingPapers.length = 0;
    particles.length = 0;
    intersections.length = 0;
  }

  function startStreet(street) {
    state.street = street;
    neighborhood = neighborhoods[street - 1];
    const difficulty = routeDifficulty(state.phase);
    state.quota = customerCount();
    state.delivered = 0;
    state.misses = 0;
    state.streetCrashes = 0;
    state.nextAddress = 0;
    state.endReason = '';
    state.combo = 0;
    state.papers = Math.min(BAG_CAPACITY, state.quota + 4);
    const junctionCount = Math.floor((neighborhood.length - 1) / BLOCK_SIZE);
    state.routeTotal = difficulty.targetEvery * (neighborhood.length - 1 + junctionCount) + (street === 2 ? 10 : 6);
    state.routeRemaining = state.routeTotal;
    state.worldSpeed = difficulty.worldSpeed;
    state.targetEvery = difficulty.targetEvery;
    state.obstacleEvery = difficulty.obstacleEvery;
    state.dogChance = difficulty.dogChance;
    state.doubleChance = difficulty.doubleChance;
    state.dogWeave = difficulty.dogWeave;
    state.crossChance = difficulty.crossChance;
    state.overtakeChance = difficulty.overtakeChance;
    state.obstacleTimer = 2.1;
    state.nextIntersectionAddress = BLOCK_SIZE;
    state.worldScroll = 0;
    state.overtakeTimer = 7.5;
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
    clearStreetActors();
    seedScenery();
    seedRoadMarks();
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
    } else if (testScenario === 'fail') {
      state.delivered = 6;
      state.nextAddress = neighborhood.length;
      state.routeRemaining = .35;
    } else if (testScenario === 'dog') {
      spawnHazard('dog');
      Object.assign(hazards.at(-1), { homeSide: 1, lane: 1.4, y: 345, dogMode: 'charging' });
      hazards.at(-1).x = roadX(1.4, 345);
      player.x = roadX(.62, PLAYER_Y);
      spawnHazard('branch');
      Object.assign(hazards.at(-1), { lane: -.55, y: 370, x: roadX(-.55, 370) });
      state.obstacleTimer = state.overtakeTimer = 8;
    } else if (testScenario === 'traffic') {
      spawnIntersection(true);
      intersections[0].y = 315;
      const crossing = hazards.find(hazard => hazard.type === 'cross');
      if (crossing) { crossing.x = 255; crossing.y = 315; }
      spawnHazard('parked');
      hazards.at(-1).y = 215;
      spawnHazard('oncoming');
      hazards.at(-1).y = 245;
      if (state.phase >= 2) {
        spawnHazard('overtaking');
        hazards.at(-1).y = 505;
      }
      state.obstacleTimer = 5;
    }
    const routeCallout = street === 2 ? `STREET 2 · ANGLED AVENUE` : state.streetCount > 1 ? `LEVEL ${state.phase} · STREET 1` : `LEVEL ${state.phase} · ${difficulty.name}`;
    showMessage(routeCallout, 2.2);
    announce(`Level ${state.phase}, street ${street} of ${state.streetCount}. ${state.quota} subscribers across ${neighborhood.length} houses. Deliver to at least seven.`);
    updateHud();
  }

  function startPhase(phase, retry = false) {
    state.phase = Math.max(1, phase);
    state.streetCount = state.phase >= 3 ? 2 : 1;
    if (!retry) {
      state.levelCheckpoint = {
        score: state.score,
        randomSeed,
        rosters: neighborhoods.map(street => street.map(home => home.subscribed))
      };
    } else if (state.levelCheckpoint) {
      state.score = state.levelCheckpoint.score;
      randomSeed = state.levelCheckpoint.randomSeed;
      neighborhoods.forEach((street, streetIndex) => street.forEach((home, homeIndex) => {
        home.subscribed = state.levelCheckpoint.rosters[streetIndex][homeIndex];
      }));
    }
    state.healthMax = state.phase + 2;
    state.health = state.healthMax;
    state.gained = 0;
    state.lost = 0;
    state.crashes = 0;
    state.streetCrashes = 0;
    state.perfect = false;
    state.newSubscribers = [];
    state.streetResults = [];
    startStreet(1);
    if ((testScenario === 'street2' || params.get('street') === '2') && state.streetCount > 1) startStreet(2);
    if (testScenario === 'street2') {
      for (let index=0;index<6;index+=1) {
        spawnTarget();
        const target=targets.at(-1);
        target.y=180+index*58;
        target.x=W/2+target.side*(roadHalf(target.y)+31);
      }
      state.targetTimer=3;
    }
  }

  function retryLevel() {
    if (state.mode !== 'failed') return;
    startPhase(state.phase, true);
    showMessage(`LEVEL ${state.phase} · TRY AGAIN`, 1.8);
  }

  function restartGame() {
    state.score = 0;
    state.strikes = 0;
    state.worldScroll = 0;
    neighborhoods.forEach(street => street.forEach(home => { home.subscribed = STARTING_SUBSCRIBERS.has(home.id); }));
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
      y: routeSpawnY(),
      x: W / 2 + side * (roadHalf(routeSpawnY()) + 31),
      side,
      delivered: false,
      dead: false,
      pulse: visualRange(0, Math.PI * 2)
    });
    // One branch in level two, two per street thereafter, away from junctions.
    if (state.phase >= 2 && (home.id === 4 || (state.phase >= 3 && home.id === 16))) spawnHazard('branch');
  }

  function spawnHazard(forcedType = '') {
    const roll = random();
    let type = forcedType === 'car' ? 'oncoming' : forcedType;
    if (!type) {
      if (roll < state.dogChance) type = 'dog';
      else if (roll < .43) type = 'parked';
      else if (roll < .66) type = 'oncoming';
      else if (roll < .84) type = 'puddle';
      else type = 'cones';
    }
    if (!forcedType && type === 'dog' && hazards.some(hazard => hazard.type === 'dog' && !hazard.dead && hazard.dogMode !== 'retreating')) type = 'cones';
    let lane = randomRange(-.82, .82);
    if (type === 'cones') lane = [-.55, 0, .55][Math.floor(random() * 3)];
    if (type === 'parked') lane = random() < .5 ? -.78 : .78;
    if (type === 'oncoming') lane = -.38;
    if (type === 'overtaking') lane = .38;
    const homeSide = random() < .5 ? -1 : 1;
    if (type === 'dog') lane = homeSide * 1.65;
    const y = type === 'overtaking' ? (state.street === 2 ? H + 300 : H + 72) : routeSpawnY();
    hazards.push({
      type,
      y,
      x: type === 'parked' ? W / 2 + Math.sign(lane) * roadHalf(y) * .86 : roadX(lane, y),
      lane,
      baseLane: lane,
      homeSide,
      dogMode: 'waiting',
      attackAge: 0,
      phase: randomRange(0, Math.PI * 2),
      color: ['#d84f39', '#315f79', '#e6ac3e'][Math.floor(random() * 3)],
      dead: false
    });
  }

  function spawnIntersection(forceTraffic = false) {
    const intersection = { y: routeSpawnY(), dead: false, crossTraffic: false };
    intersections.push(intersection);
    if (state.phase >= 2 && (forceTraffic || random() < state.crossChance)) {
      const direction = random() < .5 ? 1 : -1;
      intersection.crossTraffic = true;
      hazards.push({
        type: 'cross', intersection, direction,
        y: intersection.y, x: state.street === 2 ? W / 2 - direction * 3.5 * roadHalf(intersection.y) : direction > 0 ? -120 : W + 120,
        groundU: -direction * 700,
        color: ['#d84f39', '#315f79', '#e6ac3e'][Math.floor(random() * 3)], dead: false
      });
    }
  }

  function spawnBundle() {
    const lane = randomRange(-.68, .68);
    bundles.push({
      y: routeSpawnY(),
      x: roadX(lane, routeSpawnY()),
      lane,
      spin: visualRange(0, Math.PI * 2),
      dead: false
    });
  }

  function burst(x, y, color, count = 12) {
    const available = Math.max(0, 96 - particles.length);
    const total = Math.min(count, available, reducedMotion ? 5 : count);
    for (let index = 0; index < total; index += 1) {
      const angle = visualRange(0, Math.PI * 2);
      const speed = visualRange(45, 160);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: visualRange(.35, .8),
        maxLife: .8,
        color,
        size: visualRange(2, 6)
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
    if (state.mode !== 'playing' || hazard.dead || hazard.contacted || player.invulnerable > 0) return;
    if (hazard.type === 'dog' && (hazard.dogMode === 'retreating' || (player.x - W / 2) * hazard.homeSide < 0)) return;
    hazard.contacted = true;
    if (hazard.type === 'dog') hazard.dogMode = 'retreating';
    player.invulnerable = 2.1;
    const damage = hazard.type === 'dog' ? 2 : ['oncoming', 'overtaking', 'cross'].includes(hazard.type) ? 4 : 1;
    state.health -= damage;
    state.crashes += 1;
    state.streetCrashes += 1;
    state.combo = 0;
    state.shake = reducedMotion ? 2 : 12;
    burst(player.x, PLAYER_Y, '#f5e8c8', 18);
    soundCrash();
    if (state.health <= 0) {
      state.health = 0;
      state.mode = 'falling';
      state.transitionTimer = 1.5;
      state.endReason = `Health reached zero on street ${state.street}`;
      player.tilt = 1.25;
      showMessage('RIDER DOWN!', 2);
      announce('Health reached zero. The route attempt failed.');
    } else {
      showMessage(`CRASH! · −${damage} HEALTH`, 1.5);
      announce(`${damage} damage. ${state.health} health remaining.`);
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
    const gained = Math.max(0, Math.min(5, BAG_CAPACITY - state.papers));
    state.papers += gained;
    state.score += 50;
    burst(bundle.x, bundle.y, '#fff5cf', 10);
    tone(410, .06, 'triangle', .035);
    tone(610, .09, 'triangle', .03, .055);
    showMessage(gained ? `BAG REFILL +${gained}` : 'BAG FULL · +50', 1);
    updateHud();
  }

  function failAttempt(reason) {
    if (state.mode === 'failed' || state.mode === 'gameover') return;
    state.strikes = Math.min(3, state.strikes + 1);
    state.endReason = reason;
    state.mode = state.strikes >= 3 ? 'gameover' : 'failed';
    state.transitionTimer = 0;
    showMessage(state.mode === 'gameover' ? 'THREE STRIKES · GAME OVER' : `STRIKE ${state.strikes} · RETRY LEVEL ${state.phase}`, 99);
    announce(state.mode === 'gameover' ? `Game over after three strikes. Final score ${Math.floor(state.score)}.` : `${reason}. Strike ${state.strikes} of 3. Retry level ${state.phase}.`);
    updateHud();
    requestAnimationFrame(() => attemptAction.focus({ preventScroll: true }));
  }

  function awardSubscribers() {
    state.newSubscribers = [];
    state.gained = 0;
    state.streetResults.forEach(result => {
      const street = neighborhoods[result.street - 1];
      const candidates = street.filter(home => !home.subscribed);
      const offset = candidates.length ? (state.phase * 7 + result.street * 5) % candidates.length : 0;
      for (let i = 0; i < Math.min(result.perfect ? 2 : 1, candidates.length); i += 1) {
        const home = candidates[(offset + i) % candidates.length];
        home.subscribed = true;
        state.newSubscribers.push(home.number);
        state.gained += 1;
      }
    });
  }

  function completeLevel() {
    awardSubscribers();
    state.perfect = state.streetResults.every(result => result.perfect);
    state.mode = 'transition';
    state.transitionSuccess = true;
    state.transitionTimer = 5.5;
    const bonus = 500 + state.phase * 100 + state.papers * 15 + (state.streetCount - 1) * 350;
    state.score += bonus;
    showMessage(`LEVEL ${state.phase} COMPLETE · +${state.gained} SUBSCRIBERS`, 5.5);
    tone(440, .1, 'square', .04);
    tone(660, .12, 'square', .035, .1);
    tone(880, .16, 'square', .03, .21);
    announce(`Level ${state.phase} complete. ${state.gained} new subscribers. Level ${state.phase + 1} begins soon.`);
    updateHud();
  }

  function finishPhase() {
    if (state.mode !== 'playing') return;
    if (state.delivered < PASS_TARGET) {
      failAttempt(`Street ${state.street}: ${state.delivered} delivered · ${PASS_TARGET} required`);
      return;
    }
    state.streetResults.push({
      street: state.street,
      delivered: state.delivered,
      quota: state.quota,
      perfect: state.delivered === state.quota && state.streetCrashes === 0
    });
    if (state.street < state.streetCount) {
      state.mode = 'turning';
      state.transitionTimer = STREET_TRANSITION_SECONDS;
      showMessage('STREET 1 COMPLETE', STREET_TRANSITION_SECONDS);
      tone(520, .08, 'square', .03);
      tone(680, .1, 'square', .025, .09);
    } else {
      completeLevel();
    }
    updateHud();
  }

  function updateScenery(dt, speed) {
    scenery.forEach(item => {
      item.y = groundAdvance(item.y, speed * dt);
      if (item.y > H + 105) {
        item.y = HORIZON + visualRange(0, 20);
        item.side *= -1;
      }
    });
  }

  const moveToward = (value, target, step) => value + clamp(target - value, -step, step);

  function updateDog(dog, dt) {
    if (dog.dogMode === 'waiting') {
      dog.y = groundAdvance(dog.y, state.worldSpeed * dt);
      if (dog.y >= 285) dog.dogMode = 'charging';
    } else if (dog.dogMode === 'charging') {
      dog.attackAge += dt;
      const riderLane = (player.x - W / 2) / (roadHalf(PLAYER_Y) * .72);
      const destination = dog.homeSide * clamp(riderLane * dog.homeSide, .22, .98);
      dog.lane = moveToward(dog.lane, destination, (state.phase >= 4 ? 1.2 : .95) * dt);
      dog.y = moveToward(dog.y, PLAYER_Y - 20, 175 * dt);
      if (dog.attackAge > 3) dog.dogMode = 'retreating';
    } else {
      dog.lane += dog.homeSide * 2.1 * dt;
      dog.y = groundAdvance(dog.y, state.worldSpeed * dt);
      if (Math.abs(dog.lane) > 3) dog.dead = true;
    }
  }

  function paperHitsDog(dog, dt) {
    if (dog.dead || dog.dogMode === 'retreating') return;
    const radius = state.street === 2 ? 25 : 18 + clamp((dog.y - HORIZON) / (H - HORIZON), 0, 1) * 19;
    for (const paper of flyingPapers) {
      if (paper.dead) continue;
      const dx = paper.vx * dt, dy = paper.vy * dt;
      const t = clamp(((dog.x - paper.x) * dx + (dog.y - 9 - paper.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      if (Math.hypot(paper.x + dx * t - dog.x, paper.y + dy * t - (dog.y - 9)) > radius) continue;
      paper.dead = true;
      dog.dogMode = 'retreating';
      burst(dog.x, dog.y - 15, '#f5e8c8', 8);
      tone(470, .08, 'triangle', .025);
      announce('Dog chased away.');
      break;
    }
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
    updateRoadMarks(state.worldSpeed * dt);
    updateScenery(dt, state.worldSpeed);

    state.targetTimer -= dt;
    if (state.targetTimer <= 0 && state.nextAddress < neighborhood.length) {
      // Reserve a full house slot for each junction so driveways never open into it.
      if (state.nextAddress === state.nextIntersectionAddress) {
        spawnIntersection();
        state.nextIntersectionAddress += BLOCK_SIZE;
      } else spawnTarget();
      state.targetTimer = state.targetEvery;
    }

    state.obstacleTimer -= dt;
    const junctionAtSpawn = (state.nextAddress === state.nextIntersectionAddress && state.targetTimer < .9)
      || intersections.some(intersection => intersection.y < routeSpawnY() + 80);
    if (state.obstacleTimer <= 0 && state.routeRemaining > 2 && !junctionAtSpawn) {
      spawnHazard();
      if (random() < state.doubleChance) spawnHazard(random() < .45 ? 'cones' : 'puddle');
      state.obstacleTimer = state.obstacleEvery + randomRange(-.12, .26);
    }

    if (state.phase >= 2) {
      state.overtakeTimer -= dt;
      if (state.overtakeTimer <= 0 && state.routeRemaining > 5 && !hazards.some(hazard => hazard.type === 'overtaking')) {
        if (random() < state.overtakeChance) spawnHazard('overtaking');
        state.overtakeTimer = state.phase >= 4 ? randomRange(4.5, 6.5) : randomRange(6.5, 9.5);
      }
    }

    state.bundleTimer -= dt;
    if (state.bundleTimer <= 0 && state.routeRemaining > 5) {
      spawnBundle();
      state.bundleTimer = randomRange(8.5, 11.5);
    }

    targets.forEach(target => {
      target.y = groundAdvance(target.y, state.worldSpeed * dt);
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
          }
        }
      }
    });
    if (state.mode !== 'playing') return;

    intersections.forEach(intersection => {
      intersection.y = groundAdvance(intersection.y, state.worldSpeed * dt);
      if (intersection.y > H + 90) intersection.dead = true;
    });

    for (const hazard of hazards) {
      if (hazard.type === 'cross') {
        hazard.y = hazard.intersection.y;
        if (state.street === 2) {
          hazard.groundU += hazard.direction * (185 + state.phase * 12) * dt;
          hazard.x = W / 2 + hazard.groundU / 200 * roadHalf(hazard.y);
          if (Math.abs(hazard.groundU) > 1100) hazard.dead = true;
        } else {
          hazard.x += hazard.direction * (155 + state.phase * 12) * dt;
          if (hazard.x < -170 || hazard.x > W + 170) hazard.dead = true;
        }
        if (hazard.intersection.dead) hazard.dead = true;
      } else if (hazard.type === 'dog') {
        updateDog(hazard, dt);
      } else {
        if (hazard.type === 'overtaking') hazard.y -= (68 + state.phase * 7) * dt;
        else {
          const speedFactor = hazard.type === 'oncoming' ? 1.62 : 1;
          hazard.y = groundAdvance(hazard.y, state.worldSpeed * dt * speedFactor);
        }
      }
      const depth = clamp((hazard.y - HORIZON) / (H - HORIZON), 0, 1);
      if (hazard.type === 'parked') hazard.x = W / 2 + Math.sign(hazard.lane) * roadHalf(hazard.y) * .86;
      else if (hazard.type !== 'cross') hazard.x = roadX(hazard.lane, hazard.y);
      // Resolve a thrown paper before the dog's bite on this frame.
      if (hazard.type === 'dog') paperHitsDog(hazard, dt);
      const scale = .28 + depth * .92;
      const hitRadius = hazard.type === 'cross' ? 48 * scale : hazard.type === 'branch' ? 45 * scale : hazard.type === 'puddle' ? 27 * scale : ['parked', 'oncoming', 'overtaking'].includes(hazard.type) ? 31 * scale : 24 * scale;
      if (!hazard.dead && hazard.y > PLAYER_Y - 50 && hazard.y < PLAYER_Y + 36 && Math.abs(hazard.x - player.x) < hitRadius + 17) hitPlayer(hazard);
      if (state.mode !== 'playing') return;
      if (hazard.y > H + (hazard.type === 'overtaking' && state.street === 2 ? 400 : 80) || hazard.y < routeSpawnY() - 80) hazard.dead = true;
    }

    bundles.forEach(bundle => {
      bundle.y = groundAdvance(bundle.y, state.worldSpeed * dt);
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
    for (let index = intersections.length - 1; index >= 0; index -= 1) if (intersections[index].dead) intersections.splice(index, 1);
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
      if (state.transitionTimer <= 0) startPhase(state.phase + 1);
    } else if (state.mode === 'turning') {
      state.transitionTimer -= dt;
      if (state.street === 1 && state.transitionTimer <= STREET_TRANSITION_SECONDS / 2) {
        const remaining = state.transitionTimer;
        startStreet(2);
        state.mode = 'turning';
        state.transitionTimer = remaining;
      }
      if (state.transitionTimer <= 0) state.mode = 'playing';
    } else if (state.mode === 'falling') {
      state.transitionTimer -= dt;
      if (state.transitionTimer <= 0) failAttempt(state.endReason);
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

    ctx.fillStyle = '#f5e8c8';
    for (const mark of roadMarks) {
      const top = Math.max(HORIZON, mark.y), bottom = Math.min(H, mark.endY);
      if (bottom <= top) continue;
      const width = roadHalf(top) / roadHalf(PLAYER_Y) * 4;
      ctx.fillRect(W / 2 - width / 2, top, width, bottom - top);
    }
  }

  function drawIntersection(intersection) {
    const depth = clamp((intersection.y - HORIZON) / (H - HORIZON), 0, 1);
    const height = 20 + depth * 94;
    ctx.save();
    ctx.translate(0, intersection.y);
    ctx.fillStyle = '#4d5558';
    ctx.fillRect(0, -height / 2, W, height);
    ctx.fillStyle = '#c8c3af';
    ctx.fillRect(0, -height / 2 - 8, W, 8);
    ctx.fillRect(0, height / 2, W, 8);
    // Paint belongs to this street: project fixed marks about the junction's
    // center, independent of the main road's animated canvas dash offset.
    ctx.fillStyle = 'rgba(245,232,200,.82)';
    const paintScale = roadHalf(intersection.y) / roadHalf(PLAYER_Y);
    const markCount = Math.ceil(W / (48 * paintScale));
    for (let mark = -markCount; mark <= markCount; mark += 1) {
      ctx.fillRect(W / 2 + (mark * 48 - 11) * paintScale, -2 * paintScale, 22 * paintScale, 4 * paintScale);
    }
    ctx.fillStyle = 'rgba(245,232,200,.85)';
    const halfRoad = roadHalf(intersection.y) * .72;
    for (let stripe = -2; stripe <= 2; stripe += 1) {
      const x = W / 2 + stripe * halfRoad * .22;
      ctx.fillRect(x - 5 - depth * 4, -height / 2, 10 + depth * 8, height);
    }
    ctx.restore();
  }

  function drawGarden(item) {
    const depth = clamp((item.y - HORIZON) / (H - HORIZON), 0, 1);
    const scale = .2 + depth * .8;
    if (intersections.some(junction => {
      const junctionDepth = clamp((junction.y - HORIZON) / (H - HORIZON), 0, 1);
      return Math.abs(item.y - junction.y) < 10 + junctionDepth * 47 + 40 * scale;
    })) return;
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

  function drawMailbox(target, fixedScale = null) {
    const depth = clamp((target.y - HORIZON) / (H - HORIZON), 0, 1);
    const scale = fixedScale ?? .32 + depth * .9;
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
    if (hazard.type === 'cross') {
      drawSideCar(hazard, scale);
      return;
    }
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
    ctx.fillStyle = hazard.type === 'overtaking' || hazard.type === 'parked' ? '#d94432' : '#fff0bc';
    ctx.fillRect(-29, 0, 13, 9); ctx.fillRect(16, 0, 13, 9);
    ctx.fillStyle = '#f8f0dd'; ctx.fillRect(-9, 15, 18, 5);
    ctx.fillStyle = hazard.color; ctx.fillRect(-41, -33, 9, 6); ctx.fillRect(32, -33, 9, 6);
    if (hazard.type === 'overtaking' && hazard.y < 400 && Math.floor(hazard.y / 18) % 2 === 0) {
      ctx.fillStyle = '#ffb52e'; ctx.fillRect(hazard.baseLane > 0 ? -31 : 24, -3, 7, 5);
    }
    ctx.restore();
  }

  function drawSideCar(car, scale) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.scale(scale * car.direction, scale);
    ctx.fillStyle = '#172a3240';
    ctx.beginPath(); ctx.ellipse(0, 10, 53, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#172a32'; ctx.lineWidth = 3;
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.moveTo(-53, 0); ctx.lineTo(-52, -22); ctx.lineTo(-33, -28);
    ctx.lineTo(-22, -47); ctx.lineTo(17, -47); ctx.lineTo(34, -27);
    ctx.lineTo(51, -22); ctx.lineTo(55, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#afd2d7';
    ctx.beginPath(); ctx.moveTo(-27, -28); ctx.lineTo(-18, -42); ctx.lineTo(-3, -42); ctx.lineTo(-3, -28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(3, -42); ctx.lineTo(14, -42); ctx.lineTo(27, -28); ctx.lineTo(3, -28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#172a3270'; ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, -3); ctx.stroke();
    ctx.fillStyle = '#fff0bc'; ctx.fillRect(46, -18, 7, 8);
    ctx.fillStyle = '#cc3f31'; ctx.fillRect(-53, -18, 6, 8);
    for (const x of [-33, 33]) {
      ctx.fillStyle = '#172a32'; ctx.beginPath(); ctx.arc(x, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b7c2c1'; ctx.beginPath(); ctx.arc(x, 0, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawDog(hazard, scale) {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    const facing = hazard.dogMode === 'retreating' ? hazard.homeSide : -hazard.homeSide;
    ctx.scale(scale * (facing || 1), scale);
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
    ctx.beginPath(); ctx.roundRect(30, -21, 19, 12, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#754629';
    ctx.beginPath(); ctx.moveTo(13, -35); ctx.lineTo(23, -32); ctx.lineTo(14, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#172a32'; ctx.beginPath(); ctx.ellipse(47, -18, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    const stride = hazard.dogMode === 'waiting' ? 0 : Math.sin(state.worldScroll * .09) * 9;
    ctx.moveTo(-17, 3); ctx.lineTo(-24 + stride, 24);
    ctx.moveTo(13, 3); ctx.lineTo(20 - stride, 24);
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

  function drawBranch(hazard, scale) {
    ctx.save(); ctx.translate(hazard.x, hazard.y); ctx.scale(scale, scale);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [color, width] of [['#24352b55', 15], ['#493d30', 12], ['#997044', 7]]) {
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(-49, 13); ctx.lineTo(-10, -2); ctx.lineTo(45, -9); ctx.stroke();
    }
    ctx.strokeStyle = '#735236'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-17, 1); ctx.lineTo(-25, -22); ctx.lineTo(-14, -34);
    ctx.moveTo(13, -5); ctx.lineTo(30, 17); ctx.lineTo(45, 23); ctx.stroke();
    ctx.fillStyle = '#d4b284'; ctx.beginPath(); ctx.ellipse(-49, 13, 4, 6, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#668448';
    for (const [x,y] of [[-26,-24],[-12,-31],[33,17],[46,21]]) {
      ctx.beginPath(); ctx.ellipse(x,y,8,4,-.6,0,Math.PI*2); ctx.fill();
    }
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
    if (state.mode === 'playing' && player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) return;
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
        if (['parked', 'oncoming', 'overtaking', 'cross'].includes(actor.item.type)) drawCar(actor.item, scale);
        else if (actor.item.type === 'dog') drawDog(actor.item, scale);
        else if (actor.item.type === 'puddle') drawPuddle(actor.item, scale);
        else if (actor.item.type === 'branch') drawBranch(actor.item, scale);
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

  function drawTurnSequence() {
    if (state.mode !== 'turning') return;
    const progress = clamp(1 - state.transitionTimer / STREET_TRANSITION_SECONDS, 0, 1);
    const fade = 1 - Math.abs(progress * 2 - 1);
    ctx.save();
    ctx.globalAlpha = fade * fade * (3 - 2 * fade);
    ctx.fillStyle = '#172a32';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function deliveryReady(target) {
    if ((player.x - W / 2) * target.side < 90) return false;
    const a = state.worldSpeed * .48;
    const b = state.worldSpeed * .62 / (H - HORIZON);
    for (let t = .06; t <= .7; t += .025) {
      const y = state.street === 2 ? target.y + state.worldSpeed * .96 * t
        : HORIZON + (target.y - HORIZON + a / b) * Math.exp(b * t) - a / b;
      const x = W / 2 + target.side * (roadHalf(y) + 31);
      const px = player.x + target.side * (17 + (365 + Math.min(state.phase, 6) * 8) * t);
      const py = PLAYER_Y - 18 - 92 * t + 14 * t * t;
      if (Math.hypot(px - x, (py - y) * .85) < 28) return true;
    }
    return false;
  }

  function drawEndOverlay() {
    if (!['gameover', 'failed', 'transition'].includes(state.mode)) return;
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
    ctx.fillStyle = state.mode === 'transition' ? '#34694d' : '#c84630';
    ctx.font = '900 38px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.mode === 'gameover' ? 'GAME OVER' : state.mode === 'failed' ? `STRIKE ${state.strikes}` : state.perfect ? 'PERFECT LEVEL!' : `LEVEL ${state.phase} COMPLETE`, 0, -76);
    ctx.fillStyle = '#172a32';
    ctx.font = '900 18px Trebuchet MS, sans-serif';
    if (state.mode === 'gameover' || state.mode === 'failed') {
      ctx.font = 'bold 17px Trebuchet MS';
      ctx.fillText(state.endReason, 0, -23);
      ctx.fillText(state.mode === 'gameover' ? `FINAL SCORE ${String(Math.floor(state.score)).padStart(6, '0')}` : `STRIKES ${state.strikes}/3 · LEVEL ${state.phase}`, 0, 13);
      ctx.font = '800 15px Trebuchet MS, sans-serif';
      ctx.fillText(state.mode === 'gameover' ? 'RESTART BEGINS AT LEVEL 1' : 'RETRY RESTORES THIS LEVEL', 0, 52);
    } else {
      state.streetResults.forEach((result, index) => {
        ctx.fillText(`STREET ${result.street}: ${result.delivered}/${result.quota} DELIVERED${result.perfect ? ' · PERFECT' : ''}`, 0, -35 + index * 31);
      });
      ctx.fillStyle = '#172a32';
      ctx.font = '800 14px Trebuchet MS, sans-serif';
      ctx.fillText(`+${state.gained} SUBSCRIBERS · ${state.crashes} CRASHES · ${state.health}/${state.healthMax} HEALTH`, 0, 57);
      ctx.fillText(`STRIKES ${state.strikes}/3 · LEVEL ${state.phase + 1} IN ${Math.max(1, Math.ceil(state.transitionTimer))}…`, 0, 87);
    }
    ctx.restore();
  }

  // Convert the simulation's road-relative coordinates into an orthographic
  // isometric ground plane. Every actor uses this same mapping, including papers.
  function isoGround(u, v, height = 0) {
    return { x: 335 + .866 * (u + v), y: 365 + .5 * (u - v) - height };
  }

  function isoPosition(x, y) {
    return { u: (x - W / 2) / roadHalf(y) * 200, v: (PLAYER_Y - y) * 1.55 };
  }

  function isoPolygon(points, color, outline = false) {
    ctx.beginPath();
    points.forEach(([u, v, h = 0], index) => {
      const p = isoGround(u, v, h);
      if (index === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    if (outline) { ctx.strokeStyle = '#263c3e'; ctx.lineWidth = 1.4; ctx.stroke(); }
  }

  function isoBox(u, v, width, length, height, colors, base = 0) {
    const a = u - width / 2, b = u + width / 2;
    const c = v - length / 2, d = v + length / 2;
    isoPolygon([[a,c,base],[b,c,base],[b,c,base+height],[a,c,base+height]], colors[0], true);
    isoPolygon([[b,c,base],[b,d,base],[b,d,base+height],[b,c,base+height]], colors[1], true);
    isoPolygon([[a,c,base+height],[b,c,base+height],[b,d,base+height],[a,d,base+height]], colors[2], true);
  }

  function drawIsoHouse(home, v) {
    const u = home.side * 325;
    isoPolygon([[u-65,v-64],[u+65,v-64],[u+65,v+64],[u-65,v+64]], '#8da477');
    isoPolygon([[home.side*211,v-9],[u,v-9],[u,v+9],[home.side*211,v+9]], '#c9c4ae');
    isoBox(u, v, 89, 75, 59, [home.hue, '#9aab98', '#e3d6bc']);
    const a = u - 49, b = u + 49, c = v - 43, d = v + 43;
    isoPolygon([[a,c,59],[b,c,59],[u,c,89]], '#d2c1a7', true);
    isoPolygon([[a,c,59],[u,c,89],[u,d,89],[a,d,59]], home.roof, true);
    isoPolygon([[u,c,89],[b,c,59],[b,d,59],[u,d,89]], '#677274', true);
    for (const offset of [-25, 22]) {
      isoPolygon([[u+offset-8,v-38,23],[u+offset+8,v-38,23],[u+offset+8,v-38,43],[u+offset-8,v-38,43]], '#b5d7d6', true);
    }
    isoPolygon([[u-8,v-38,0],[u+8,v-38,0],[u+8,v-38,31],[u-8,v-38,31]], '#6e5947', true);
    isoBox(u+24, v+10, 12, 14, 27, ['#9d705b','#765446','#c49377'], 65);
  }

  function drawIsoCar(car, u, v) {
    const crossing = car.type === 'cross';
    const width = crossing ? 66 : 30, length = crossing ? 30 : 66;
    isoPolygon([[u-width/2-4,v-length/2-3],[u+width/2+4,v-length/2-3],[u+width/2+4,v+length/2+3],[u-width/2-4,v+length/2+3]], '#243b3c45');
    isoBox(u, v, width, length, 17, [car.color, car.color, car.color], 5);
    isoBox(u, v+2, crossing ? 33 : 26, crossing ? 26 : 33, 14, ['#71929b','#416778','#b8ced0'], 22);
    isoBox(u, v+3, crossing ? 24 : 23, crossing ? 23 : 24, 2, [car.color,car.color,car.color], 36);
    for (const offset of [-21, 21]) {
      const p = isoGround(u + (crossing ? offset : 17), v + (crossing ? -17 : offset), 7);
      ctx.fillStyle = '#172a32'; ctx.beginPath(); ctx.ellipse(p.x,p.y,5,8,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#bbc6c2'; ctx.beginPath(); ctx.arc(p.x,p.y,2.5,0,Math.PI*2); ctx.fill();
    }
    const front = car.type === 'oncoming' ? -1 : 1;
    for (const side of [-1, 1]) {
      const p = crossing ? isoGround(u+car.direction*width/2, v+side*10, 13) : isoGround(u+side*10,v+front*length/2,13);
      ctx.fillStyle = '#fff2bb'; ctx.fillRect(p.x-3,p.y-2,6,4);
    }
  }

  function drawIsoRider(u, v) {
    if (player.invulnerable > 0 && state.mode !== 'falling' && Math.floor(player.invulnerable * 12) % 2 === 0) return;
    const p = isoGround(u,v);
    ctx.save(); ctx.translate(p.x,p.y);
    if (state.mode === 'falling') ctx.rotate(1.1);
    ctx.fillStyle = '#172a323a'; ctx.beginPath(); ctx.ellipse(0,7,31,9,-.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#172a32'; ctx.lineWidth = 4;
    for (const [x,y] of [[-19,12],[20,-10]]) {
      ctx.beginPath(); ctx.ellipse(x,y,9,16,.35,0,Math.PI*2); ctx.stroke();
    }
    ctx.strokeStyle = '#ed7546'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-19,12); ctx.lineTo(-9,-14); ctx.lineTo(8,3); ctx.lineTo(-19,12); ctx.lineTo(18,-25); ctx.lineTo(20,-10); ctx.stroke();
    ctx.strokeStyle = '#263b43'; ctx.beginPath(); ctx.moveTo(12,-28); ctx.lineTo(26,-23); ctx.moveTo(-17,-16); ctx.lineTo(-4,-19); ctx.stroke();
    ctx.strokeStyle = '#325f79'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-9,-24); ctx.lineTo(-2,-6); ctx.lineTo(9,-2); ctx.moveTo(-6,-23); ctx.lineTo(-18,-1); ctx.lineTo(-9,7); ctx.stroke();
    ctx.strokeStyle = '#ee7945'; ctx.lineWidth = 17;
    ctx.beginPath(); ctx.moveTo(-9,-25); ctx.lineTo(0,-45); ctx.stroke();
    ctx.strokeStyle = '#f1b07a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(1,-42); ctx.lineTo(13,-29); ctx.lineTo(23,-25); ctx.stroke();
    ctx.fillStyle = '#f1b07a'; ctx.beginPath(); ctx.arc(5,-57,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#315f79'; ctx.beginPath(); ctx.arc(4,-59,11,Math.PI,Math.PI*2); ctx.fill(); ctx.fillRect(4,-60,17,4);
    ctx.fillStyle = '#f4c95d'; ctx.strokeStyle = '#263b43'; ctx.lineWidth=2;
    ctx.fillRect(-32,-14,18,21); ctx.strokeRect(-32,-14,18,21);
    ctx.restore();
  }

  function drawIsometricStreet() {
    ctx.fillStyle = '#86a27b'; ctx.fillRect(0,0,W,H);
    isoPolygon([[-226,-1100],[226,-1100],[226,1500],[-226,1500]], '#d3cfb9');
    isoPolygon([[-200,-1100],[200,-1100],[200,1500],[-200,1500]], '#505d60');
    for (const mark of roadMarks) {
      const v = isoPosition(W / 2, mark.y).v, end = isoPosition(W / 2, mark.endY).v;
      isoPolygon([[-2,v],[2,v],[2,end],[-2,end]], '#efe4bc');
    }
    for (const intersection of intersections) {
      const v = isoPosition(W/2,intersection.y).v;
      isoPolygon([[-1300,v-51],[1300,v-51],[1300,v+51],[-1300,v+51]], '#c9c7b3');
      isoPolygon([[-1300,v-43],[1300,v-43],[1300,v+43],[-1300,v+43]], '#505d60');
      for (let u=-650;u<1050;u+=72) isoPolygon([[u,v-2],[u+30,v-2],[u+30,v+2],[u,v+2]], '#eee3bb');
    }
    const actors = [];
    for (const target of targets) {
      const pos = isoPosition(target.x,target.y);
      actors.push({ depth: isoGround(target.side*325,pos.v).y, draw: () => drawIsoHouse(target.home,pos.v) });
      actors.push({ depth: isoGround(pos.u,pos.v).y, draw: () => {
        const p = isoGround(pos.u,pos.v);
        drawMailbox({...target,x:p.x,y:p.y},.65);
      }});
    }
    for (const hazard of hazards) {
      const pos = isoPosition(hazard.x,hazard.y), p = isoGround(pos.u,pos.v);
      actors.push({depth:p.y,draw:()=>{
        if (['parked','oncoming','overtaking','cross'].includes(hazard.type)) drawIsoCar(hazard,pos.u,pos.v);
        else if (hazard.type==='dog') drawDog({...hazard,x:p.x,y:p.y},.6);
        else if (hazard.type==='puddle') drawPuddle({...hazard,x:p.x,y:p.y},.65);
        else if (hazard.type==='branch') drawBranch({...hazard,x:p.x,y:p.y},.85);
        else drawCones({...hazard,x:p.x,y:p.y},.6);
      }});
    }
    for (const bundle of bundles) {
      const pos=isoPosition(bundle.x,bundle.y),p=isoGround(pos.u,pos.v);
      actors.push({depth:p.y,draw:()=>{
        isoBox(pos.u,pos.v,22,25,10,['#ddd7bb','#b6baa7','#fff1ca']);
        ctx.fillStyle='#bd5736';ctx.fillRect(p.x-6,p.y-16,12,4);
      }});
    }
    const rider=isoPosition(player.x,PLAYER_Y);
    actors.push({depth:isoGround(rider.u,rider.v).y,draw:()=>drawIsoRider(rider.u,rider.v)});
    actors.sort((a,b)=>a.depth-b.depth).forEach(actor=>actor.draw());
    for (const paper of flyingPapers) {
      const pos=isoPosition(paper.x,paper.y),p=isoGround(pos.u,pos.v);
      drawFlyingPaper({...paper,x:p.x,y:p.y});
    }
    for (const particle of particles) {
      const pos=isoPosition(particle.x,particle.y),p=isoGround(pos.u,pos.v);
      ctx.globalAlpha=clamp(particle.life/particle.maxLife,0,1);ctx.fillStyle=particle.color;
      ctx.fillRect(p.x,p.y,particle.size,particle.size);
    }
    ctx.globalAlpha=1;
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#78bdc3';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (state.shake > 0) ctx.translate(visualRange(-state.shake, state.shake), visualRange(-state.shake, state.shake));
    ctx.save();
    if (state.street === 2) drawIsometricStreet();
    else {
    drawBackground();
    intersections.slice().sort((a, b) => a.y - b.y).forEach(drawIntersection);
    scenery.slice().sort((a, b) => a.y - b.y).forEach(drawGarden);
    targets.slice().sort((a, b) => a.y - b.y).forEach(target => drawHouse({ ...target.home, y: target.y, side: target.side }));
    drawActors();
    flyingPapers.forEach(drawFlyingPaper);
    drawPlayer();
    drawParticles();
    }
    ctx.restore();
    drawMessage();
    drawEndOverlay();
    drawTurnSequence();
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
    try { sessionStorage.setItem('vibecade-instructions-paper-route-rush-v4', '1'); } catch (_) {}
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
  attemptAction.addEventListener('click', () => {
    if (state.mode === 'failed') retryLevel();
    else if (state.mode === 'gameover') restartGame();
    shell.focus({ preventScroll: true });
  });
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
    if (key === 'r' && !event.repeat && !modal.classList.contains('is-visible')) {
      restartGame();
    }
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
      health: state.health,
      healthMax: state.healthMax,
      strikes: state.strikes,
      street: state.street,
      streetCount: state.streetCount,
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
      intersections: intersections.length,
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
    spawnIntersection,
    retryLevel,
    failAttempt,
    finishPhase,
    setRouteRemaining: seconds => { state.routeRemaining = Math.max(0, Number(seconds) || 0); },
    setInvulnerable: seconds => { player.invulnerable = Math.max(0, Number(seconds) || 0); }
  });

  seedScenery();
  seedRoadMarks();
  updateHud();
  render();
  animationFrame = requestAnimationFrame(frame);

  let hasSeenInstructions = false;
  try { hasSeenInstructions = sessionStorage.getItem('vibecade-instructions-paper-route-rush-v4') === '1'; } catch (_) {}
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

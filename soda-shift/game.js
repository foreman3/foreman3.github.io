(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LANE_Y = [205, 321, 437, 553];
  const SERVE_X = 286;
  const CATCH_X = 244;
  const GUEST_FAIL_X = 303;
  const EXIT_X = 1230;
  const GLASS_LIMIT_X = 1208;
  const FIXED_STEP = 1 / 60;

  const PHASES = [
    {
      name: 'Lunch Warm-Up',
      active: [1, 2],
      quota: 7,
      speed: 48,
      spawnEvery: 2.1,
      maxPerLane: 2,
      emptySpeed: 280,
      types: ['regular', 'regular', 'regular', 'regular'],
      callout: 'Two counters. Find the rhythm.'
    },
    {
      name: 'After-School Crowd',
      active: [0, 1, 2],
      quota: 10,
      speed: 64,
      spawnEvery: 1.35,
      maxPerLane: 2,
      emptySpeed: 340,
      types: ['regular', 'regular', 'greaser', 'greaser'],
      callout: 'Three counters. Greasers move fast.'
    },
    {
      name: 'Supper Rush',
      active: [0, 1, 2, 3],
      quota: 14,
      speed: 82,
      spawnEvery: 0.82,
      maxPerLane: 3,
      emptySpeed: 410,
      types: ['regular', 'greaser', 'tourist', 'dancer', 'greaser'],
      callout: 'All counters live. Tourists need two sodas.'
    },
    {
      name: 'Saturday Stampede',
      active: [0, 1, 2, 3],
      quota: 18,
      speed: 105,
      spawnEvery: 0.55,
      maxPerLane: 4,
      emptySpeed: 485,
      types: ['greaser', 'tourist', 'dancer', 'dancer', 'regular'],
      callout: 'No quiet counters. No slow glasses.'
    }
  ];

  const PATRON_TYPES = {
    regular: { sprite: '#patron-regular', speed: 1, thirst: 1, push: 188, scale: 0.82, points: 300, label: 'REGULAR' },
    greaser: { sprite: '#patron-greaser', speed: 1.2, thirst: 1, push: 176, scale: 0.82, points: 375, label: 'GREASER' },
    tourist: { sprite: '#patron-tourist', speed: 0.82, thirst: 2, push: 126, scale: 0.84, points: 540, label: 'TOURIST' },
    dancer: { sprite: '#patron-dancer', speed: 1.42, thirst: 1, push: 210, scale: 0.82, points: 450, label: 'DANCER' }
  };

  const shell = document.getElementById('game-shell');
  const gameSvg = document.getElementById('game-svg');
  const actorsLayer = document.getElementById('actors-layer');
  const effectsLayer = document.getElementById('effects-layer');
  const playerSprite = document.getElementById('player-sprite');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const quotaEl = document.getElementById('quota');
  const phaseLabelEl = document.getElementById('phase-label');
  const shiftNameEl = document.getElementById('shift-name');
  const streakEl = document.getElementById('streak');
  const banner = document.getElementById('banner');
  const bannerTitle = document.getElementById('banner-title');
  const bannerSubtitle = document.getElementById('banner-subtitle');
  const coach = document.getElementById('coach');
  const endPanel = document.getElementById('end-panel');
  const finalScoreEl = document.getElementById('final-score');
  const bestScoreEl = document.getElementById('best-score');
  const endSummary = document.getElementById('end-summary');
  const liveRegion = document.getElementById('live-region');
  const restartButton = document.getElementById('restart-button');
  const modal = document.getElementById('instruction-modal');
  const modalClose = document.getElementById('instruction-close');
  const helpButton = document.getElementById('help-button');

  let patrons = [];
  let drinks = [];
  let empties = [];
  let effects = [];
  let state = createIdleState();
  let player = { lane: 1, visualY: LANE_Y[1], serveCooldown: 0 };
  let started = false;
  let paused = true;
  let lastTime = performance.now();
  let lastVisualTime = 0;
  let renderVisuals = true;
  let accumulator = 0;
  let bannerToken = 0;
  let coachToken = 0;
  let audioContext = null;
  let focusBeforeDialog = null;
  let orientationPaused = false;
  const held = { serve: false };
  const activePointerSets = new Set();
  const instructionKey = 'vibecade-instructions-soda-shift-v1';
  const launchParams = new URLSearchParams(window.location.search);
  const requestedPhase = Number.parseInt(launchParams.get('phase') || '1', 10);
  const requestedStartPhase = Number.isFinite(requestedPhase) ? Math.max(0, requestedPhase - 1) : 0;
  const requestedTestQuota = Number.parseInt(launchParams.get('testQuota') || '0', 10);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileQuality = window.matchMedia('(max-width: 900px)').matches;
  document.body.classList.toggle('mobile-quality', mobileQuality);
  gameSvg.dataset.quality = mobileQuality ? 'mobile' : 'full';
  gameSvg.dataset.visualHz = mobileQuality ? '30' : 'display';

  function createIdleState() {
    return {
      mode: 'idle',
      phaseIndex: 0,
      score: 0,
      lives: 3,
      streak: 0,
      served: 0,
      spawned: 0,
      quota: PHASES[0].quota,
      spawnTimer: 0,
      countdown: 0,
      transition: 0,
      freeze: 0,
      tutorialStep: 0,
      muted: readStoredValue('vibecade-soda-shift-muted') === '1',
      best: Number(readStoredValue('vibecade-soda-shift-best')) || 0
    };
  }

  function readStoredValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function writeStoredValue(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (_error) {
      // The game remains fully playable when storage is unavailable.
    }
  }

  function sessionHasSeenInstructions() {
    try {
      return sessionStorage.getItem(instructionKey) === '1';
    } catch (_error) {
      return false;
    }
  }

  function markInstructionsSeen() {
    try {
      sessionStorage.setItem(instructionKey, '1');
    } catch (_error) {
      // Ignore storage restrictions; the modal still works for this load.
    }
  }

  function phaseConfig(index = state.phaseIndex) {
    let config;
    if (index < PHASES.length) {
      config = PHASES[index];
    } else {
      const extra = index - PHASES.length + 1;
      config = {
        name: `Overtime ${extra}`,
        active: [0, 1, 2, 3],
        quota: 18 + extra * 2,
        speed: 105 + extra * 8,
        spawnEvery: Math.max(0.38, 0.55 - extra * 0.025),
        maxPerLane: 4,
        emptySpeed: 485 + extra * 24,
        types: ['greaser', 'tourist', 'dancer', 'dancer', 'tourist'],
        callout: 'Overtime: the fountain only gets faster.'
      };
    }
    if (index === requestedStartPhase && Number.isFinite(requestedTestQuota) && requestedTestQuota > 0) {
      return { ...config, quota: Math.max(1, Math.min(99, requestedTestQuota)) };
    }
    return config;
  }

  function svgUse(href, className) {
    const element = document.createElementNS(SVG_NS, 'use');
    element.setAttribute('href', href);
    if (className) element.setAttribute('class', className);
    return element;
  }

  function removeEntity(entity) {
    if (entity && entity.el && entity.el.parentNode) entity.el.remove();
  }

  function clearEntities() {
    [...patrons, ...drinks, ...empties, ...effects].forEach(removeEntity);
    patrons = [];
    drinks = [];
    empties = [];
    effects = [];
    actorsLayer.replaceChildren();
    effectsLayer.replaceChildren();
  }

  function resetGame(startPhase = 0) {
    clearHeldControls();
    clearEntities();
    const muted = state.muted;
    const best = Math.max(state.best || 0, Number(readStoredValue('vibecade-soda-shift-best')) || 0);
    state = createIdleState();
    state.muted = muted;
    state.best = best;
    player = { lane: phaseConfig(startPhase).active[0], visualY: LANE_Y[phaseConfig(startPhase).active[0]], serveCooldown: 0 };
    endPanel.classList.remove('show');
    beginPhase(startPhase, true);
    lastTime = performance.now();
    accumulator = 0;
    syncPlayer();
    updateHud();
  }

  function beginPhase(index, fromReset = false) {
    clearEntities();
    state.phaseIndex = index;
    const config = phaseConfig(index);
    state.mode = 'countdown';
    state.countdown = fromReset ? 2.45 : 2.15;
    state.transition = 0;
    state.freeze = 0;
    state.served = 0;
    state.spawned = 0;
    state.quota = config.quota;
    state.spawnTimer = 0;
    if (!config.active.includes(player.lane)) {
      player.lane = config.active[0];
      player.visualY = LANE_Y[player.lane];
    }
    player.serveCooldown = 0;
    document.querySelectorAll('.lane-base').forEach((laneEl) => {
      laneEl.classList.toggle('active', config.active.includes(Number(laneEl.dataset.lane)));
    });
    showBanner(`Phase ${index + 1}`, config.name, 1.55);
    announce(`Phase ${index + 1}: ${config.name}. ${config.callout}`);
    toneSequence([392, 494, 659], 0.07, 0.07);
    updateHud();
  }

  function completePhase() {
    if (state.mode !== 'playing') return;
    state.mode = 'phaseclear';
    state.transition = 2.4;
    const bonus = 1000 * (state.phaseIndex + 1) + state.lives * 250;
    state.score += bonus;
    drinks.forEach(removeEntity);
    empties.forEach(removeEntity);
    drinks = [];
    empties = [];
    patrons.forEach((patron) => {
      patron.status = 'leaving';
      patron.timer = 0;
    });
    showBanner('Counter Clear!', `Phase bonus +${bonus.toLocaleString()}`, 1.55);
    announce(`Counter clear. Bonus ${bonus}.`);
    burst(710, 390, '#f3c75d', 34, 250);
    toneSequence([523, 659, 784, 1047], 0.08, 0.065);
  }

  function endGame(reason) {
    state.mode = 'gameover';
    paused = true;
    clearHeldControls();
    const finalScore = Math.floor(state.score);
    state.best = Math.max(state.best, finalScore);
    writeStoredValue('vibecade-soda-shift-best', state.best);
    finalScoreEl.textContent = finalScore.toLocaleString();
    bestScoreEl.textContent = state.best.toLocaleString();
    endSummary.textContent = `${reason} You reached phase ${state.phaseIndex + 1} and served ${state.served} guests in the final rush.`;
    endPanel.classList.add('show');
    restartButton.focus({ preventScroll: true });
    announce(`Game over. Score ${finalScore}. Press R or choose Clock In Again.`);
    toneSequence([220, 174, 131, 98], 0.14, 0.11);
    updateHud();
  }

  function movePlayer(direction) {
    if (!started || paused || modal.classList.contains('is-visible') || state.mode === 'gameover') return;
    const activeLanes = phaseConfig().active;
    const currentIndex = Math.max(0, activeLanes.indexOf(player.lane));
    const next = activeLanes[Math.max(0, Math.min(activeLanes.length - 1, currentIndex + direction))];
    if (next === player.lane) return;
    player.lane = next;
    tone(190 + next * 32, 0.035, 'triangle', 0.018);
    syncPlayer();
  }

  function serveDrink() {
    if (!started || paused || state.mode !== 'playing' || state.freeze > 0) return;
    if (player.serveCooldown > 0) return;
    const laneDrinks = drinks.filter((drink) => drink.lane === player.lane).length;
    if (laneDrinks >= 2) {
      showCoach('That counter is full—catch or wait!', 0.8);
      tone(118, 0.06, 'square', 0.018);
      player.serveCooldown = 0.16;
      return;
    }
    const element = svgUse('#full-glass', 'actor drink');
    const drink = {
      el: element,
      lane: player.lane,
      x: SERVE_X,
      y: LANE_Y[player.lane] - 1,
      speed: 570 + state.phaseIndex * 12,
      rotation: 0,
      dead: false
    };
    drinks.push(drink);
    actorsLayer.appendChild(element);
    player.serveCooldown = 0.27;
    burst(SERVE_X, drink.y - 3, '#f4d271', 7, 85);
    tone(246, 0.055, 'square', 0.025);
    updateDrinkVisual(drink);
  }

  function spawnPatron(options = {}) {
    const config = phaseConfig();
    if (state.spawned >= config.quota) return false;
    let available = config.active.filter((lane) => {
      const lanePatrons = patrons.filter((patron) => patron.lane === lane && patron.status !== 'leaving');
      if (lanePatrons.length >= config.maxPerLane) return false;
      const rightmost = lanePatrons.reduce((value, patron) => Math.max(value, patron.x), -Infinity);
      return rightmost < 1088;
    });
    if (!available.length) return false;

    let lane = options.lane;
    if (!available.includes(lane)) {
      const counts = new Map(available.map((candidate) => [candidate, patrons.filter((patron) => patron.lane === candidate && patron.status !== 'leaving').length]));
      const minCount = Math.min(...counts.values());
      const quietLanes = available.filter((candidate) => counts.get(candidate) === minCount);
      lane = quietLanes[Math.floor(Math.random() * quietLanes.length)];
    }

    const typeName = options.type || config.types[Math.floor(Math.random() * config.types.length)];
    const type = PATRON_TYPES[typeName];
    const element = svgUse(type.sprite, 'actor patron');
    const patron = {
      el: element,
      lane,
      type: typeName,
      x: options.x || 1190 + Math.random() * 55,
      speed: config.speed * type.speed * (0.94 + Math.random() * 0.12),
      thirst: type.thirst,
      maxThirst: type.thirst,
      status: 'incoming',
      timer: 0,
      phase: Math.random() * Math.PI * 2,
      willLeave: false,
      dead: false
    };
    patrons.push(patron);
    actorsLayer.appendChild(element);
    state.spawned += 1;
    updatePatronVisual(patron);
    return true;
  }

  function spawnEmpty(patron, delay) {
    const element = svgUse('#empty-glass', 'actor empty-glass');
    const empty = {
      el: element,
      lane: patron.lane,
      x: patron.x - 12,
      y: LANE_Y[patron.lane] - 1,
      wait: delay,
      speed: phaseConfig().emptySpeed * (0.95 + Math.random() * 0.1),
      rotation: 0,
      dead: false
    };
    empties.push(empty);
    actorsLayer.appendChild(element);
    updateEmptyVisual(empty);
  }

  function hitPatron(patron, drink) {
    drink.dead = true;
    removeEntity(drink);
    const type = PATRON_TYPES[patron.type];
    patron.thirst -= 1;
    patron.willLeave = patron.thirst <= 0;
    patron.status = 'drinking';
    patron.timer = patron.willLeave ? 0.46 : 0.62;
    patron.x = Math.min(1135, patron.x + (patron.willLeave ? type.push : type.push * 0.72));
    spawnEmpty(patron, patron.timer * 0.82);

    state.streak = Math.min(24, state.streak + 1);
    const multiplier = streakMultiplier();
    const points = patron.willLeave ? type.points : 175;
    state.score += Math.round(points * multiplier);
    floater(`${patron.willLeave ? '+' + Math.round(points * multiplier) : 'REFILL!'}`, patron.x, LANE_Y[patron.lane] - 55, patron.willLeave ? '#f5d160' : '#fff0b5');
    burst(patron.x, LANE_Y[patron.lane] - 14, patron.willLeave ? '#e3b548' : '#78b9a9', 13, 135);
    tone(patron.willLeave ? 620 : 470, 0.075, 'triangle', 0.035);

    if (patron.willLeave) {
      state.served += 1;
      if (state.served === 1 && state.phaseIndex === 0) {
        state.tutorialStep = 1;
        showCoach('Great! Stay in this lane to catch the empty.', 3.1);
      }
    } else {
      showCoach('Tourists want a refill—send one more!', 1.4);
    }
  }

  function catchEmpty(empty) {
    empty.dead = true;
    removeEntity(empty);
    state.streak = Math.min(24, state.streak + 1);
    const points = Math.round(125 * streakMultiplier());
    state.score += points;
    floater(`CATCH +${points}`, CATCH_X + 55, LANE_Y[empty.lane] - 48, '#8ad2bd');
    burst(CATCH_X + 24, LANE_Y[empty.lane] - 3, '#dff4e4', 10, 115);
    toneSequence([640, 820], 0.045, 0.035);
    if (state.phaseIndex === 0 && state.tutorialStep === 1) {
      state.tutorialStep = 2;
      showCoach('Clean catch. Now watch both lit counters.', 2.8);
    }
  }

  function loseGlass(reason, x, y) {
    if (state.mode !== 'playing' || state.freeze > 0) return;
    state.lives -= 1;
    state.streak = 0;
    state.freeze = 0.58;
    shell.classList.remove('shake');
    void shell.offsetWidth;
    shell.classList.add('shake');
    burst(x, y, '#f5ead7', 30, 260);
    showBanner('Glass Down!', reason, 0.82);
    announce(`${reason}. ${state.lives} glasses remaining.`);
    toneSequence([150, 112, 84], 0.09, 0.075);
    if (state.lives <= 0) endGame(reason);
  }

  function streakMultiplier() {
    return Math.min(5, 1 + Math.floor(state.streak / 4) * 0.5);
  }

  function update(dt) {
    player.serveCooldown = Math.max(0, player.serveCooldown - dt);
    player.visualY += (LANE_Y[player.lane] - player.visualY) * Math.min(1, dt * 15);
    syncPlayer();
    updateEffects(dt);

    if (state.mode === 'countdown') {
      state.countdown -= dt;
      if (state.countdown <= 0) {
        state.mode = 'playing';
        state.spawnTimer = 0;
        hideBanner();
        if (state.phaseIndex === 0 && state.spawned === 0) {
          spawnPatron({ lane: 1, type: 'regular', x: 760 });
          state.spawnTimer = phaseConfig().spawnEvery * 1.2;
          showCoach('A guest is coming—SPACE sends a soda.', 4.2);
        }
      }
      updateHud();
      updateDiagnostics();
      return;
    }

    if (state.mode === 'phaseclear') {
      state.transition -= dt;
      updatePatrons(dt, true);
      if (state.transition <= 0) beginPhase(state.phaseIndex + 1);
      updateHud();
      updateDiagnostics();
      return;
    }

    if (state.mode !== 'playing') {
      updateHud();
      updateDiagnostics();
      return;
    }

    if (state.freeze > 0) {
      state.freeze -= dt;
      updateHud();
      updateDiagnostics();
      return;
    }

    if (held.serve) serveDrink();
    const config = phaseConfig();
    state.spawnTimer -= dt;
    if (state.spawned < config.quota && state.spawnTimer <= 0) {
      if (spawnPatron()) {
        const pressure = Math.min(0.25, state.served / Math.max(1, config.quota) * 0.18);
        state.spawnTimer = config.spawnEvery * (0.9 + Math.random() * 0.22) - pressure;
      } else {
        state.spawnTimer = 0.24;
      }
    }

    updatePatrons(dt, false);
    if (state.mode !== 'playing' || state.freeze > 0) {
      updateHud();
      updateDiagnostics();
      return;
    }
    updateDrinks(dt);
    if (state.mode !== 'playing' || state.freeze > 0) {
      updateHud();
      updateDiagnostics();
      return;
    }
    updateEmpties(dt);
    if (state.mode !== 'playing' || state.freeze > 0) {
      updateHud();
      updateDiagnostics();
      return;
    }
    enforceQueues();
    const allGuestsServed = patrons.every((patron) => patron.status === 'leaving');
    if (state.served >= config.quota && state.spawned >= config.quota && allGuestsServed && drinks.length === 0 && empties.length === 0) completePhase();
    updateHud();
    updateDiagnostics();
  }

  function updatePatrons(dt, clearing) {
    for (const patron of patrons) {
      if (patron.dead) continue;
      if (clearing && patron.status !== 'leaving') patron.status = 'leaving';
      if (patron.status === 'incoming') {
        patron.x -= patron.speed * dt;
        if (patron.x <= GUEST_FAIL_X) {
          patron.dead = true;
          removeEntity(patron);
          state.spawned = Math.max(state.served, state.spawned - 1);
          loseGlass(`${PATRON_TYPES[patron.type].label} reached the taps`, patron.x, LANE_Y[patron.lane]);
          break;
        }
      } else if (patron.status === 'drinking') {
        patron.timer -= dt;
        if (patron.timer <= 0) patron.status = patron.willLeave ? 'leaving' : 'incoming';
      } else if (patron.status === 'leaving') {
        patron.x += (290 + state.phaseIndex * 18) * dt;
        if (patron.x >= EXIT_X) {
          patron.dead = true;
          removeEntity(patron);
          continue;
        }
      }
      patron.phase += dt * (patron.type === 'dancer' ? 12 : 6);
      updatePatronVisual(patron);
    }
    patrons = patrons.filter((patron) => !patron.dead);
  }

  function updateDrinks(dt) {
    for (const drink of drinks) {
      if (drink.dead) continue;
      const previousX = drink.x;
      drink.x += drink.speed * dt;
      drink.rotation += dt * 92;
      const target = patrons
        .filter((patron) => patron.lane === drink.lane && patron.status === 'incoming' && !patron.dead)
        .sort((a, b) => a.x - b.x)
        .find((patron) => drink.x + 22 >= patron.x - 18 && previousX - 22 <= patron.x + 22);
      if (target) {
        hitPatron(target, drink);
        continue;
      }
      if (drink.x >= GLASS_LIMIT_X) {
        drink.dead = true;
        removeEntity(drink);
        loseGlass('A full soda sailed off the counter', drink.x, drink.y);
        break;
      }
      updateDrinkVisual(drink);
    }
    drinks = drinks.filter((drink) => !drink.dead);
  }

  function updateEmpties(dt) {
    for (const empty of empties) {
      if (empty.dead) continue;
      if (empty.wait > 0) {
        empty.wait -= dt;
        updateEmptyVisual(empty);
        continue;
      }
      empty.x -= empty.speed * dt;
      empty.rotation -= dt * 145;
      if (empty.x <= CATCH_X) {
        if (player.lane === empty.lane && Math.abs(player.visualY - LANE_Y[empty.lane]) < 30) {
          catchEmpty(empty);
        } else {
          empty.dead = true;
          removeEntity(empty);
          loseGlass('An empty shattered at the station', empty.x, empty.y);
          break;
        }
        continue;
      }
      updateEmptyVisual(empty);
    }
    empties = empties.filter((empty) => !empty.dead);
  }

  function enforceQueues() {
    for (let lane = 0; lane < 4; lane += 1) {
      const queue = patrons
        .filter((patron) => patron.lane === lane && patron.status === 'incoming' && !patron.dead)
        .sort((a, b) => a.x - b.x);
      for (let index = 1; index < queue.length; index += 1) {
        const front = queue[index - 1];
        const rear = queue[index];
        if (rear.x - front.x < 88) rear.x = front.x + 88;
      }
    }
  }

  function updatePatronVisual(patron) {
    if (!renderVisuals) return;
    const type = PATRON_TYPES[patron.type];
    const bob = !prefersReducedMotion && patron.status === 'incoming' ? Math.sin(patron.phase) * (patron.type === 'dancer' ? 4.5 : 1.5) : 0;
    const lean = prefersReducedMotion ? 0 : patron.status === 'leaving' ? -4 : patron.type === 'dancer' ? Math.sin(patron.phase * 0.7) * 3 : 0;
    patron.el.setAttribute('transform', `translate(${patron.x.toFixed(2)} ${(LANE_Y[patron.lane] + bob).toFixed(2)}) rotate(${lean.toFixed(2)}) scale(${type.scale})`);
    patron.el.classList.toggle('is-drinking', patron.status === 'drinking');
    patron.el.setAttribute('opacity', patron.status === 'drinking' ? '0.9' : '1');
  }

  function updateDrinkVisual(drink) {
    if (!renderVisuals) return;
    const tilt = prefersReducedMotion ? 0 : Math.sin(drink.rotation * Math.PI / 180) * 4;
    drink.el.setAttribute('transform', `translate(${drink.x.toFixed(2)} ${drink.y}) rotate(${tilt}) scale(.72)`);
  }

  function updateEmptyVisual(empty) {
    if (!renderVisuals) return;
    const waitingBob = !prefersReducedMotion && empty.wait > 0 ? Math.sin(performance.now() * 0.012) * 2 : 0;
    const tilt = prefersReducedMotion ? 0 : Math.sin(empty.rotation * Math.PI / 180) * 6;
    empty.el.setAttribute('transform', `translate(${empty.x.toFixed(2)} ${(empty.y + waitingBob).toFixed(2)}) rotate(${tilt}) scale(.68)`);
  }

  function syncPlayer() {
    if (!renderVisuals) return;
    const bounce = !prefersReducedMotion && started && !paused && state.mode === 'playing' ? Math.sin(performance.now() * 0.008) * 1.2 : 0;
    playerSprite.setAttribute('transform', `translate(246 ${(player.visualY + bounce).toFixed(2)}) scale(.78)`);
  }

  function burst(x, y, color, count = 12, force = 150) {
    const particleCount = prefersReducedMotion ? Math.min(4, count) : mobileQuality ? Math.min(6, Math.ceil(count * 0.5)) : count;
    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = force * (0.25 + Math.random() * 0.75);
      const element = document.createElementNS(SVG_NS, 'circle');
      const size = 1.8 + Math.random() * 4.2;
      element.setAttribute('r', size.toFixed(1));
      element.setAttribute('fill', color);
      effectsLayer.appendChild(element);
      effects.push({
        el: element,
        kind: 'particle',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.38 + Math.random() * 0.52,
        maxLife: 0.9,
        dead: false
      });
    }
  }

  function floater(text, x, y, color) {
    const element = document.createElementNS(SVG_NS, 'text');
    element.textContent = text;
    element.setAttribute('text-anchor', 'middle');
    element.setAttribute('font-size', '18');
    element.setAttribute('font-weight', '1000');
    element.setAttribute('font-family', 'Trebuchet MS, sans-serif');
    element.setAttribute('fill', color);
    element.setAttribute('stroke', '#3a1b16');
    element.setAttribute('stroke-width', '3');
    element.setAttribute('paint-order', 'stroke');
    effectsLayer.appendChild(element);
    effects.push({ el: element, kind: 'floater', x, y, life: 1.05, maxLife: 1.05, dead: false });
  }

  function updateEffects(dt) {
    for (const effect of effects) {
      effect.life -= dt;
      if (effect.life <= 0) {
        effect.dead = true;
        removeEntity(effect);
        continue;
      }
      if (effect.kind === 'particle') {
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
        effect.vy += 170 * dt;
        effect.vx *= 0.985;
        if (renderVisuals) {
          effect.el.setAttribute('cx', effect.x.toFixed(2));
          effect.el.setAttribute('cy', effect.y.toFixed(2));
        }
      } else {
        effect.y -= 34 * dt;
        if (renderVisuals) {
          effect.el.setAttribute('x', effect.x.toFixed(2));
          effect.el.setAttribute('y', effect.y.toFixed(2));
        }
      }
      if (renderVisuals) effect.el.setAttribute('opacity', Math.min(1, effect.life / effect.maxLife).toFixed(2));
    }
    effects = effects.filter((effect) => !effect.dead);
  }

  function updateHud() {
    if (!renderVisuals) return;
    const config = phaseConfig();
    scoreEl.textContent = Math.floor(state.score).toLocaleString();
    livesEl.textContent = state.lives > 0 ? Array(state.lives).fill('●').join(' ') : '—';
    quotaEl.textContent = `${state.served} / ${config.quota}`;
    phaseLabelEl.textContent = `Phase ${state.phaseIndex + 1}`;
    shiftNameEl.textContent = config.name;
    streakEl.textContent = `×${streakMultiplier().toFixed(1).replace('.0', '')}`;
  }

  function updateDiagnostics() {
    if (!renderVisuals) return;
    gameSvg.dataset.mode = state.mode;
    gameSvg.dataset.phase = String(state.phaseIndex + 1);
    gameSvg.dataset.difficulty = phaseConfig().name;
    gameSvg.dataset.served = String(state.served);
    gameSvg.dataset.quota = String(phaseConfig().quota);
    gameSvg.dataset.spawned = String(state.spawned);
    gameSvg.dataset.lives = String(state.lives);
    gameSvg.dataset.playerLane = String(player.lane + 1);
    gameSvg.dataset.patrons = String(patrons.filter((patron) => patron.status !== 'leaving').length);
    gameSvg.dataset.drinks = String(drinks.length);
    gameSvg.dataset.empties = String(empties.length);
    gameSvg.dataset.activeLanes = phaseConfig().active.map((lane) => lane + 1).join(',');
    gameSvg.dataset.paused = paused ? '1' : '0';
    gameSvg.dataset.started = started ? '1' : '0';
  }

  function showBanner(title, subtitle, duration = 1) {
    bannerToken += 1;
    const token = bannerToken;
    bannerTitle.textContent = title;
    bannerSubtitle.textContent = subtitle;
    banner.classList.add('show');
    window.setTimeout(() => {
      if (token === bannerToken) banner.classList.remove('show');
    }, duration * 1000);
  }

  function hideBanner() {
    bannerToken += 1;
    banner.classList.remove('show');
  }

  function showCoach(message, duration = 2) {
    coachToken += 1;
    const token = coachToken;
    coach.textContent = message;
    coach.classList.add('show');
    window.setTimeout(() => {
      if (token === coachToken) coach.classList.remove('show');
    }, duration * 1000);
  }

  function announce(message) {
    liveRegion.textContent = '';
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 20);
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioContext = new AudioCtor();
    }
    if (audioContext && audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function tone(frequency, duration, type = 'triangle', volume = 0.028, delay = 0) {
    if (state.muted) return;
    ensureAudio();
    if (!audioContext) return;
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function toneSequence(notes, duration, gap) {
    notes.forEach((note, index) => tone(note, duration, index % 2 ? 'triangle' : 'square', 0.025, index * (duration + gap)));
  }

  function toggleSound() {
    state.muted = !state.muted;
    writeStoredValue('vibecade-soda-shift-muted', state.muted ? '1' : '0');
    showCoach(state.muted ? 'Sound off' : 'Sound on', 0.8);
    if (!state.muted) toneSequence([330, 440], 0.05, 0.04);
  }

  function clearHeldControls() {
    held.serve = false;
    activePointerSets.forEach((pointerSet) => pointerSet.clear());
    document.querySelectorAll('.touch-button.pressed').forEach((button) => button.classList.remove('pressed'));
  }

  function portraitPauseActive() {
    return touchDevice && window.matchMedia('(orientation: portrait)').matches;
  }

  function syncOrientationState() {
    const shouldPause = portraitPauseActive();
    if (shouldPause) {
      orientationPaused = true;
      if (started && state.mode !== 'gameover' && !modal.classList.contains('is-visible')) {
        paused = true;
        clearHeldControls();
      }
    } else if (orientationPaused) {
      orientationPaused = false;
      if (started && state.mode !== 'gameover' && !modal.classList.contains('is-visible')) {
        paused = false;
        lastTime = performance.now();
        accumulator = 0;
      }
    }
    updateDiagnostics();
  }

  function showInstructions() {
    if (modal.classList.contains('is-visible')) return;
    focusBeforeDialog = document.activeElement;
    paused = true;
    clearHeldControls();
    modalClose.textContent = started ? 'Resume the Shift' : 'Open the Fountain';
    modal.classList.add('is-visible');
    if (!document.hidden) modalClose.focus({ preventScroll: true });
    updateDiagnostics();
  }

  function hideInstructions() {
    ensureAudio();
    markInstructionsSeen();
    modal.classList.remove('is-visible');
    if (!started) {
      started = true;
      resetGame(requestedStartPhase);
    }
    paused = state.mode === 'gameover' || portraitPauseActive();
    orientationPaused = portraitPauseActive();
    lastTime = performance.now();
    accumulator = 0;
    const focusTarget = focusBeforeDialog && focusBeforeDialog !== document.body ? focusBeforeDialog : shell;
    if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true });
    focusBeforeDialog = null;
    updateDiagnostics();
  }

  function frame(now) {
    const elapsed = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    if (started && !paused) {
      accumulator += elapsed;
      const visualDue = !mobileQuality || now - lastVisualTime >= 1000 / 30;
      const availableSteps = Math.min(7, Math.floor(accumulator / FIXED_STEP));
      let guard = 0;
      while (accumulator >= FIXED_STEP && guard < 7) {
        renderVisuals = !mobileQuality || (visualDue && guard === Math.max(0, availableSteps - 1));
        update(FIXED_STEP);
        accumulator -= FIXED_STEP;
        guard += 1;
      }
      if (visualDue && guard > 0) lastVisualTime = now;
    } else {
      accumulator = 0;
      renderVisuals = true;
      syncPlayer();
      updateDiagnostics();
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (modal.classList.contains('is-visible')) {
      if (key === 'tab') {
        event.preventDefault();
        modalClose.focus({ preventScroll: true });
      } else if ((key === 'enter' || key === ' ') && !event.repeat) {
        event.preventDefault();
        hideInstructions();
      }
      return;
    }
    if (endPanel.classList.contains('show') && key === 'tab') {
      event.preventDefault();
      restartButton.focus({ preventScroll: true });
      return;
    }
    if (endPanel.classList.contains('show') && (key === 'enter' || key === ' ') && !event.repeat) {
      event.preventDefault();
      restartButton.click();
      return;
    }
    if (key === 'r' && !event.repeat) {
      event.preventDefault();
      paused = portraitPauseActive();
      resetGame();
      shell.focus({ preventScroll: true });
      return;
    }
    const targetIsControl = event.target instanceof Element && Boolean(event.target.closest('button, a, input, select, textarea'));
    if (targetIsControl) return;
    if (['arrowup', 'arrowdown', ' ', 'enter'].includes(key)) event.preventDefault();
    ensureAudio();
    if ((key === 'arrowup' || key === 'w') && !event.repeat) movePlayer(-1);
    if ((key === 'arrowdown' || key === 's') && !event.repeat) movePlayer(1);
    if ((key === ' ' || key === 'enter') && !event.repeat) {
      held.serve = true;
      serveDrink();
    }
    if (key === 'm' && !event.repeat) toggleSound();
  });

  document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') held.serve = false;
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    const action = button.dataset.action;
    const activePointers = new Set();
    activePointerSets.add(activePointers);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      ensureAudio();
      activePointers.add(event.pointerId);
      try {
        button.setPointerCapture(event.pointerId);
      } catch (_error) {
        // Some embedded browsers do not expose pointer capture.
      }
      button.classList.add('pressed');
      if (action === 'up') movePlayer(-1);
      if (action === 'down') movePlayer(1);
      if (action === 'serve') {
        held.serve = true;
        if (state.mode === 'gameover') {
          paused = false;
          resetGame();
        } else {
          serveDrink();
        }
      }
    });
    const release = (event) => {
      activePointers.delete(event.pointerId);
      if (!activePointers.size) {
        button.classList.remove('pressed');
        if (action === 'serve') held.serve = false;
      }
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });

  helpButton.addEventListener('click', showInstructions);
  modalClose.addEventListener('click', hideInstructions);
  restartButton.addEventListener('click', () => {
    ensureAudio();
    paused = portraitPauseActive();
    resetGame();
    shell.focus({ preventScroll: true });
  });

  window.addEventListener('blur', clearHeldControls);
  window.addEventListener('orientationchange', () => window.setTimeout(syncOrientationState, 120));
  document.addEventListener('visibilitychange', () => {
    clearHeldControls();
    if (document.hidden && started && state.mode !== 'gameover' && !modal.classList.contains('is-visible')) showInstructions();
  });

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const touchDevice = launchParams.get('touch') === '1' || coarsePointer || (navigator.maxTouchPoints > 0 && window.matchMedia('(hover: none)').matches);
  document.body.classList.toggle('touch-device', touchDevice);
  const portraitMedia = window.matchMedia('(orientation: portrait)');
  if (typeof portraitMedia.addEventListener === 'function') portraitMedia.addEventListener('change', syncOrientationState);

  window.__sodaShiftTest = Object.freeze({
    snapshot: () => ({
      mode: state.mode,
      phase: state.phaseIndex + 1,
      difficulty: phaseConfig().name,
      score: Math.floor(state.score),
      lives: state.lives,
      served: state.served,
      quota: phaseConfig().quota,
      playerLane: player.lane + 1,
      activeLanes: phaseConfig().active.map((lane) => lane + 1),
      patrons: patrons.length,
      drinks: drinks.length,
      empties: empties.length,
      paused
    }),
    forcePhase: (phaseNumber) => {
      if (!started) return false;
      paused = false;
      beginPhase(Math.max(0, Math.floor(phaseNumber) - 1));
      state.countdown = 0.05;
      return true;
    },
    moveToLane: (laneNumber) => {
      player.lane = Math.max(0, Math.min(3, Math.floor(laneNumber) - 1));
      player.visualY = LANE_Y[player.lane];
      syncPlayer();
    },
    serve: serveDrink
  });

  updateHud();
  updateDiagnostics();
  syncPlayer();
  requestAnimationFrame(frame);

  if (sessionHasSeenInstructions()) {
    modal.classList.remove('is-visible');
    started = true;
    paused = false;
    resetGame(requestedStartPhase);
  } else {
    window.requestAnimationFrame(() => modalClose.focus({ preventScroll: true }));
  }
  syncOrientationState();
})();

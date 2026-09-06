// Run with Node. Exercises the real game state machine without a browser or wall-clock delays.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(`${__dirname}/game.js`, 'utf8');

function boot() {
  const elements = new Map();
  const context2d = new Proxy({}, {
    get: (_, key) => key === 'measureText' ? text => ({ width: text.length * 10 }) : () => {}
  });
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set(id === 'instruction-modal' ? ['is-visible'] : []);
      elements.set(id, {
        dataset: {}, style: {}, textContent: '', hidden: false,
        classList: {
          contains: value => classes.has(value), add: value => classes.add(value),
          remove: value => classes.delete(value), toggle: (value, on) => on ? classes.add(value) : classes.delete(value)
        },
        addEventListener() {}, focus() {}, getContext: () => context2d
      });
    }
    return elements.get(id);
  }
  const sandbox = {
    console, URLSearchParams, location: { search: '' }, performance: { now: () => 0 },
    matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    sessionStorage: { getItem: () => null, setItem() {} },
    document: { getElementById: element, querySelectorAll: () => [], querySelector: () => null, addEventListener() {} },
    window: { addEventListener() {} }
  };
  vm.createContext(sandbox);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, `window.test = {
    state, player, neighborhoods, targets, hazards, intersections, input, update, startPhase,
    startStreet, restartGame, retryLevel, deliver, throwPaper, deliveryReady, customerCount,
    finishPhase, failAttempt, hitPlayer, spawnHazard, spawnIntersection, isoGround, isoPosition, render,
    burst, collectBundle, bundles, flyingPapers, roadMarks, spawnTarget, spawnBundle, roadHalf, roadX,
    groundAdvance, routeSpawnY, updateDog, paperHitsDog
  }; })();`), sandbox);
  const game = sandbox.window.test;
  game.state.sound = false;
  return { ...game, element, start(level = 1) {
    element('instruction-modal').classList.remove('is-visible');
    game.state.started = true; game.state.paused = false; game.startPhase(level);
  } };
}

{
  const game = boot();
  game.update(1);
  assert.equal(game.state.routeRemaining, 32, 'instructions gate simulation');
  assert.equal(game.neighborhoods.map(street => street.length).join(','), '24,24');
  assert.equal(game.neighborhoods.map(street => street.filter(home => home.subscribed).length).join(','), '10,10');
  game.start(1);
  assert.equal(game.state.health, 3);
  assert.equal(game.state.streetCount, 1);
  assert.equal(game.state.quota, 10);
}

{
  const game = boot();
  game.start(3);
  assert.equal(game.state.healthMax, 5, 'health starts one higher each level');
  game.hitPlayer({ type: 'parked', dead: false });
  assert.equal(game.state.health, 4, 'stationary items cause one damage');
  game.player.invulnerable = 0;
  game.hitPlayer({ type: 'dog', dead: false });
  assert.equal(game.state.health, 2, 'dogs cause two damage');
  game.player.invulnerable = 0;
  game.hitPlayer({ type: 'oncoming', dead: false });
  assert.equal(game.state.health, 0, 'moving cars cause four damage');
  assert.equal(game.state.mode, 'falling');
  game.update(2);
  assert.equal(game.state.mode, 'failed');
  assert.equal(game.state.strikes, 1);
  game.retryLevel();
  assert.equal(game.state.health, 5, 'retry restores full level health');
  assert.equal(game.state.street, 1, 'retry starts the whole level again');
  assert.equal(game.state.strikes, 1, 'retry keeps strikes');
}

{
  const game = boot();
  game.start(1);
  game.state.score = 900;
  game.neighborhoods[0][0].subscribed = false;
  game.state.delivered = 6;
  game.finishPhase();
  assert.equal(game.state.mode, 'failed');
  assert.equal(game.state.strikes, 1, 'six deliveries causes a strike');
  game.retryLevel();
  assert.equal(game.state.score, 0, 'retry restores score from level start');
  assert.equal(game.neighborhoods[0][0].subscribed, true, 'retry restores subscriber roster');
  game.state.delivered = 7;
  game.finishPhase();
  assert.equal(game.state.mode, 'transition', 'seven deliveries passes');
  assert.equal(game.state.gained, 1, 'non-perfect street gains one subscriber');
}

{
  const game = boot();
  game.start(3);
  game.state.health = 2;
  game.state.delivered = 7;
  game.finishPhase();
  assert.equal(game.state.mode, 'turning');
  game.update(2.5);
  assert.equal(game.state.street, 2, 'level three turns onto the second street');
  assert.equal(game.state.health, 2, 'health carries between streets');
  assert.equal(game.state.quota, 10, 'second street has its own ten subscribers');
  game.state.delivered = 6;
  game.finishPhase();
  assert.equal(game.state.mode, 'failed', 'each street independently requires seven');
}

{
  const game = boot();
  game.start(3);
  game.state.health = 2;
  game.state.delivered = 7;
  game.finishPhase();
  game.update(.4);
  assert.equal(game.state.street, 1, 'the first street fades out before the camera switches');
  game.update(.3);
  assert.equal(game.state.street, 2, 'the camera switches while the screen is covered');
  assert.equal(game.state.mode, 'turning');
  const remaining = game.state.routeRemaining;
  game.update(.3);
  assert.equal(game.state.routeRemaining, remaining, 'street two stays paused during the fade in');
  assert.equal(game.state.health, 2, 'the camera transition preserves health');
  assert.equal(game.state.streetResults.length, 1, 'the first street result is preserved');
  game.update(.3);
  assert.equal(game.state.mode, 'playing');
  game.update(.1);
  assert.ok(game.state.routeRemaining < remaining, 'play resumes when the view is visible');
}

{
  const game = boot();
  game.start(1);
  game.spawnIntersection(true);
  assert.equal(game.hazards.filter(hazard => hazard.type === 'cross').length, 0, 'level one intersections have no cross traffic');
  game.startPhase(2);
  game.spawnIntersection(true);
  assert.equal(game.hazards.filter(hazard => hazard.type === 'cross').length, 1, 'cross traffic begins on level two');
  game.spawnHazard('oncoming');
  const oncoming = game.hazards.at(-1);
  const oncomingY = oncoming.y;
  game.update(.05);
  assert.ok(oncoming.y > oncomingY, 'oncoming traffic advances toward the rider');
  game.spawnHazard('overtaking');
  const overtaking = game.hazards.at(-1);
  const overtakingY = overtaking.y;
  game.update(.05);
  assert.ok(overtaking.y < overtakingY, 'overtaking traffic passes from behind and moves away');
}

{
  const game = boot();
  game.start(3);
  game.state.delivered = game.state.quota;
  game.finishPhase();
  game.update(2.5);
  game.state.delivered = game.state.quota;
  game.finishPhase();
  assert.equal(game.state.mode, 'transition');
  assert.equal(game.state.gained, 4, 'two perfect streets each gain two subscribers');
  game.update(5.6);
  assert.equal(game.state.phase, 4);
  assert.equal(game.state.health, 6, 'new level refills increased health');
  assert.equal(game.state.strikes, 0);
}

{
  const game = boot();
  game.start(2);
  game.failAttempt('first'); game.retryLevel();
  game.failAttempt('second'); game.retryLevel();
  game.failAttempt('third');
  assert.equal(game.state.mode, 'gameover', 'third strike ends the game');
  game.restartGame();
  assert.equal(game.state.phase, 1, 'restart begins at level one');
  assert.equal(game.state.strikes, 0);
  assert.equal(game.state.health, 3);
  assert.equal(game.neighborhoods.map(street => street.filter(home => home.subscribed).length).join(','), '10,10');
}

{
  const game = boot();
  const origin = game.isoGround(0, 0), across = game.isoGround(100, 0), along = game.isoGround(0, 100);
  assert.ok(Math.abs(Math.hypot(across.x-origin.x, across.y-origin.y)-Math.hypot(along.x-origin.x, along.y-origin.y)) < .001, 'isometric axes have equal scale');
  assert.equal(game.isoGround(0, 0, 30).x, origin.x, 'building height is vertical on screen');
  assert.equal(game.isoGround(0, 0, 30).y, origin.y-30);
  game.start(3);
  game.startStreet(2);
  game.spawnIntersection(true);
  game.spawnHazard('oncoming');
  game.spawnHazard('overtaking');
  game.spawnHazard('parked');
  game.update(.8);
  game.render();
}

{
  const game = boot();
  game.start(2);
  for (const [before, after] of [[20, 24], [23, 24], [24, 24]]) {
    game.state.papers = before;
    game.collectBundle({ x: 480, y: 447, dead: false });
    assert.equal(game.state.papers, after, 'bundles refill to the full 24-paper capacity');
  }
  game.spawnHazard('overtaking');
  game.update(.01);
  assert.equal(game.element('traffic-warning').hidden, false, 'passing car is announced before reaching the rider');
  game.hazards[0].y = 390;
  game.update(.01);
  assert.equal(game.element('traffic-warning').hidden, true, 'passing warning clears once the car is ahead');
}

{
  const game = boot();
  game.start(1);
  game.spawnHazard('oncoming');
  Object.assign(game.hazards[0], { y: 447, lane: 0 });
  game.spawnHazard('dog');
  game.hazards[1].y = 447;
  game.bundles.push({ x: 480, y: 447, lane: 0, spin: 0, dead: false });
  game.flyingPapers.push({ x: 100, y: 300, vx: 100, vy: 0, spin: 0, rotation: 0 });
  game.update(.01);
  assert.equal(game.state.mode, 'falling');
  assert.equal(game.state.crashes, 1, 'a fatal collision is processed once');
  assert.equal(game.hazards[0].dead, false, 'cars stay visible after contact');
  assert.equal(game.hazards[1].y, 447, 'later hazards stop on the fatal frame');
  assert.equal(game.bundles[0].dead, false, 'a fallen rider cannot collect a bundle');
  assert.equal(game.flyingPapers[0].x, 100, 'papers stop on the fatal frame');
  game.hitPlayer({ type: 'dog' });
  assert.equal(game.state.crashes, 1, 'falling prevents further damage');
}

{
  const game = boot();
  game.start(3);
  const hazard = { type: 'parked', dead: false };
  game.player.invulnerable = 1;
  game.hitPlayer(hazard);
  assert.equal(hazard.dead, false, 'invulnerability does not erase obstacles');
  game.player.invulnerable = 0;
  game.hitPlayer(hazard);
  game.player.invulnerable = 0;
  game.hitPlayer(hazard);
  assert.equal(game.state.health, 4, 'one sustained contact only damages the rider once');
}

{
  const game = boot();
  game.start(3);
  function trafficTrace(withEffects) {
    const trace = [];
    for (let frame = 0; frame < 2100; frame += 1) {
      game.player.invulnerable = 10;
      if (withEffects) {
        if (frame % 20 === 0) game.burst(480, 447, '#fff', 18);
        game.state.shake = 5;
        game.render();
      }
      game.update(1 / 60);
      if (frame % 60 === 0) trace.push(game.hazards.map(({ type, x, y, lane }) => ({ type, x, y, lane })));
      for (const junction of game.intersections) {
        if (junction.y < 260 || junction.y > 540) continue;
        assert.ok(game.targets.every(target => Math.abs(target.y - junction.y) > 55), 'junctions have clear gaps between houses');
        assert.ok(game.hazards.filter(hazard => hazard.type === 'parked').every(hazard => Math.abs(hazard.y - junction.y) > 35), 'parked cars stay out of junctions');
      }
    }
    return JSON.stringify(trace);
  }
  const firstAttempt = trafficTrace(false);
  game.failAttempt('retry traffic check');
  game.retryLevel();
  assert.equal(trafficTrace(true), firstAttempt, 'traffic and dog paths repeat regardless of particle effects and render count');
}

for (const street of [1, 2]) {
  const game = boot();
  game.start(3); game.startStreet(street);
  game.state.targetTimer = game.state.obstacleTimer = game.state.bundleTimer = game.state.overtakeTimer = 100;
  game.spawnTarget(); game.targets[0].y = 300;
  game.spawnHazard('branch'); game.hazards[0].y = 300;
  game.spawnBundle(); game.bundles[0].y = 300;
  const mark = { y: 300, endY: 315 };
  game.roadMarks.splice(5, 0, mark);
  game.player.invulnerable = 100;
  for (let frame = 0; frame < 30; frame += 1) game.update(1 / 60);
  assert.equal(mark.y, game.targets[0].y, `street ${street}: paint and houses share ground motion`);
  assert.equal(mark.y, game.hazards[0].y, `street ${street}: paint and fallen branches share ground motion`);
  assert.equal(mark.y, game.bundles[0].y, `street ${street}: bundles rest on the same ground`);
}

{
  const game = boot(); game.start(3); game.startStreet(2);
  game.spawnTarget(); game.spawnBundle();
  for (const type of ['parked', 'oncoming', 'overtaking', 'branch', 'dog']) game.spawnHazard(type);
  game.spawnIntersection(true);
  for (const actor of [...game.targets, ...game.bundles, ...game.hazards]) {
    const position = game.isoPosition(actor.x, actor.y), p = game.isoGround(position.u, position.v);
    assert.ok(p.x < -65 || p.x > 1025 || p.y < -65 || p.y > 625, `${actor.type || 'house/bundle'} starts outside the isometric viewport with sprite clearance`);
  }
  for (const side of [-1, 1]) {
    const p = game.isoGround(side * 325, game.isoPosition(480, game.routeSpawnY()).v);
    assert.ok(p.x < -100 || p.x > 1060 || p.y < -100 || p.y > 740, 'entire house begins offscreen');
  }
}

for (const street of [1, 2]) {
  for (const side of [-1, 1]) {
    const game = boot(); game.start(4); game.startStreet(street);
    game.state.targetTimer = game.state.obstacleTimer = game.state.bundleTimer = game.state.overtakeTimer = 100;
    game.spawnHazard('dog');
    const dog = game.hazards[0];
    Object.assign(dog, { homeSide: side, lane: side * 1.65, y: 285, dogMode: 'charging' });
    game.player.x = game.roadX(-side * .8, 447);
    for (let frame = 0; frame < 170; frame += 1) {
      game.update(1 / 60);
      assert.ok(dog.lane * side >= .22 - .0001, 'dog never crosses the center line');
    }
    assert.equal(game.state.health, 6, 'crossing the road escapes the dog');
  }
  const game = boot(); game.start(4); game.startStreet(street);
  game.state.targetTimer = game.state.obstacleTimer = game.state.bundleTimer = game.state.overtakeTimer = 100;
  game.spawnHazard('dog');
  const dog = game.hazards[0];
  Object.assign(dog, { homeSide: 1, lane: .96, y: 415, dogMode: 'charging' });
  game.player.x = game.roadX(.62, 447);
  game.throwPaper();
  for (let frame = 0; frame < 25; frame += 1) game.update(1 / 60);
  assert.equal(dog.dogMode, 'retreating', `street ${street}: a real thrown paper repels a charging dog`);
  assert.equal(game.state.health, 6, 'successful defense prevents the bite');
  assert.equal(game.state.papers, 13, 'defending uses one newspaper');
  assert.equal(game.state.delivered, 0, 'a dog hit does not count as a delivery');
}

{
  const game = boot(); game.start(4);
  game.state.targetTimer = game.state.obstacleTimer = game.state.bundleTimer = game.state.overtakeTimer = 100;
  game.spawnHazard('dog');
  Object.assign(game.hazards[0], { homeSide: 1, lane: 1.65, y: 285, dogMode: 'charging' });
  game.player.x = game.roadX(.65, 447);
  for (let frame = 0; frame < 140; frame += 1) game.update(1 / 60);
  assert.equal(game.state.health, 4, 'ignoring a charging dog causes a two-health bite');
}

for (let level = 1; level <= 5; level += 1) {
  const game = boot(); game.start(level);
  for (let address = 0; address < 24; address += 1) game.spawnTarget();
  assert.equal(game.hazards.filter(hazard => hazard.type === 'branch').length, level === 1 ? 0 : level === 2 ? 1 : 2, 'branches are limited to one or two per street from level two');
}

for (let level = 1; level <= 5; level += 1) {
  const game = boot();
  game.start(level);
  const thrownAt = new Set();
  for (let frame = 0; frame < 16000 && !['transition', 'failed', 'gameover'].includes(game.state.mode); frame += 1) {
    if (game.state.mode === 'playing') {
      game.player.invulnerable = 10;
      const target = game.targets.find(item => item.wasSubscribed && !item.delivered && !item.dead && item.y < 430);
      if (target) {
        game.input.left = target.side < 0;
        game.input.right = target.side > 0;
        const key = `${game.state.street}-${target.home.id}`;
        if (!thrownAt.has(key) && game.state.throwCooldown <= 0 && game.deliveryReady(target)) {
          game.throwPaper();
          thrownAt.add(key);
        }
      }
    }
    game.update(1 / 60);
  }
  assert.equal(game.state.mode, 'transition', `level ${level}: a skilled delivery run can pass`);
  assert.equal(game.state.streetResults.length, level >= 3 ? 2 : 1, `level ${level}: every required street completes`);
  game.state.streetResults.forEach(result => assert.ok(result.delivered >= 7, `level ${level}, street ${result.street}: delivery target is attainable`));
}

console.log('Paper Route Rush subscriber, two-street, health, damage, traffic, strike, retry, and restart checks passed.');

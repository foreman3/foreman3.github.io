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
    finishPhase, failAttempt, hitPlayer, spawnHazard, spawnIntersection
  }; })();`), sandbox);
  const game = sandbox.window.test;
  game.state.sound = false;
  return { ...game, start(level = 1) {
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

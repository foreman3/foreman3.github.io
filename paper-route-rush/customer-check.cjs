// Run with Node. Exercises the real game loop without a browser or wall-clock delays.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(`${__dirname}/game.js`, 'utf8');
function boot() {
  const elements = new Map();
  const context2d = new Proxy({}, { get: (_, key) => key === 'measureText' ? text => ({ width: text.length * 10 }) : () => {} });
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set(id === 'instruction-modal' ? ['is-visible'] : []);
      elements.set(id, { dataset: {}, style: {}, textContent: '',
        classList: { contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) },
        addEventListener() {}, focus() {}, getContext: () => context2d });
    }
    return elements.get(id);
  }
  const sandbox = { console, URLSearchParams, location: { search: '' }, performance: { now: () => 0 },
    matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    sessionStorage: { getItem: () => null },
    document: { getElementById: element, querySelectorAll: () => [], addEventListener() {} },
    window: { addEventListener() {} } };
  vm.createContext(sandbox);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'window.test = { state, player, neighborhood, targets, hazards, input, update, startPhase, restartGame, deliver, throwPaper, deliveryReady, customerCount, finishPhase, hitPlayer, spawnHazard }; })();'), sandbox);
  const game = sandbox.window.test;
  game.state.sound = false;
  return { ...game, start(day = 1) { element('instruction-modal').classList.remove('is-visible'); game.state.started = true; game.state.paused = false; game.startPhase(day); } };
}
const game = boot();
game.update(1);
assert.equal(game.state.routeRemaining, 32, 'instructions gate simulation');
assert.equal(game.neighborhood.length, 24);
game.start();
game.update(.8);
const first = game.targets[0];
game.deliver(first, {});
assert.equal(game.customerCount(), 8, 'regular delivery retains customer');
game.update(1.8);
const prospect = game.targets.find(t => !t.wasSubscribed);
assert.ok(prospect, 'scheduled route includes noncustomers');
const wasted = {};
const scoreBefore = game.state.score;
game.deliver(prospect, wasted);
assert.equal(game.customerCount(), 8, 'free samples never recruit');
assert.equal(game.state.delivered, 1, 'noncustomer receives no delivery credit');
assert.equal(game.state.score, scoreBefore);
assert.equal(wasted.dead, true, 'wrong-address throw consumes the paper');
game.state.delivered = game.state.quota;
game.hitPlayer({});
game.finishPhase();
assert.equal(game.state.perfect, false, 'a crash prevents a perfect run');
assert.equal(game.state.gained, 1, 'ordinary completion awards one');
assert.equal(game.customerCount(), 9);
game.finishPhase();
assert.equal(game.customerCount(), 9, 'completion cannot award twice');
game.update(6.1);
assert.equal(game.state.quota, 9, 'next day includes newly awarded customer');
game.restartGame();
assert.equal(game.customerCount(), 8);
assert.equal(game.state.phase, 1);
let survivedAtFour = false;
for (let i = 0; i < 2000 && game.state.mode === 'playing'; i++) {
  game.player.invulnerable = 10;
  game.update(1 / 60);
  if (game.customerCount() === 4) {
    assert.equal(game.state.mode, 'playing');
    survivedAtFour = true;
  }
}
assert.ok(survivedAtFour, 'four customers keeps the route open');
assert.equal(game.state.mode, 'gameover');
assert.equal(game.customerCount(), 3, 'falls below four, not at four');
assert.equal(game.state.gained, 0, 'failed levels award no subscribers');
assert.match(game.state.endReason, /minimum 4/);
for (let day = 1; day <= 5; day++) {
  const ride = boot();
  // A successful player can have 16 subscribers by day 5.
  const additions = ride.neighborhood.filter(home => !home.subscribed).slice(0, (day - 1) * 2);
  additions.forEach(home => { home.subscribed = true; });
  ride.start(day);
  const thrownAt = new Set();
  for (let i = 0; i < 4000 && ride.state.mode === 'playing'; i++) {
    ride.player.invulnerable = 10;
    const target = ride.targets.find(t => t.wasSubscribed && !t.delivered && !t.dead && t.y < 430);
    if (target) {
      ride.input.left = target.side < 0;
      ride.input.right = target.side > 0;
      if (!thrownAt.has(target.home.id) && ride.state.throwCooldown <= 0 && ride.deliveryReady(target)) {
        ride.throwPaper();
        thrownAt.add(target.home.id);
      }
    }
    ride.update(1 / 60);
  }
  assert.equal(ride.state.mode, 'transition', `day ${day} survives`);
  assert.equal(ride.state.nextAddress, 24, `day ${day} offers every address`);
  assert.equal(ride.state.delivered, ride.state.quota, `day ${day} delivery timing is attainable`);
  assert.equal(ride.state.gained, ride.state.delivered === ride.state.quota ? 2 : 1, 'reward matches run quality');
  console.log(`Day ${day}: ${ride.state.delivered}/${ride.state.quota} delivered, ${ride.customerCount()} customers, speed ${ride.state.worldSpeed}, traffic interval ${ride.state.obstacleEvery}s`);
  const retained = ride.customerCount();
  ride.update(6.1);
  assert.equal(ride.state.phase, day + 1);
  assert.equal(ride.customerCount(), retained);
}
const capped = boot(); capped.start();
capped.neighborhood.forEach(home => { home.subscribed = true; });
capped.state.delivered = capped.state.quota;
capped.finishPhase();
assert.equal(capped.customerCount(), 24, 'full neighborhood is capped safely');
assert.equal(capped.state.gained, 0);
const imperfect = boot(); imperfect.start();
imperfect.state.delivered = imperfect.state.quota - 1;
imperfect.state.misses = 1;
imperfect.neighborhood[0].subscribed = false;
imperfect.finishPhase();
assert.equal(imperfect.state.perfect, false);
assert.equal(imperfect.state.gained, 1, 'missing a subscriber yields only the normal award');
assert.equal(imperfect.customerCount(), 8, 'one cancellation plus one level reward balances');
const oneSlot = boot(); oneSlot.start();
oneSlot.neighborhood.forEach((home, index) => { home.subscribed = index !== 23; });
oneSlot.state.delivered = oneSlot.state.quota;
oneSlot.finishPhase();
assert.equal(oneSlot.state.gained, 1, 'perfect reward caps at the remaining vacant house');
for (let day = 1; day <= 5; day++) {
  const traffic = boot(); traffic.start(day);
  traffic.spawnHazard('car');
  const car = traffic.hazards[0];
  car.y = 320;
  traffic.update(.01);
  assert.equal(car.lane !== car.baseLane, day >= 2, 'cars start drifting on day two');
}
console.log('Subscriber-only delivery, level rewards, perfection, persistence, loss threshold, restart, and five-day delivery simulation passed.');

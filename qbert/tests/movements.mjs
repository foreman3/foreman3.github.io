import assert from 'node:assert/strict';
import {newMovement,hop,rewind,forecast,movements} from '../movement.js';
const keys={Q:'nw',E:'ne',A:'sw',D:'se'};
// Replay legal, no-damage clears through the actual enemy clocks and ratchets.
const clears=[
  'AADEEDAEDQEAAA',
  'AAAAEQDAAEDEAAQAEDEDQQDDED',
  'AAEDEAAAQAEAEEDDEEDAEAED',
  'DAQAAEAAAEAEDEEDEEDQAAAEDEAEDQEDD',
  'AAEAAAEAAEAEDEEEEDAEDAEAAQQQDDEDDEDQEAADDAEA',
  'DDAQQAAAEAAAEAEDEEEEDAAAQEDDEEEADEDQDAQAQEDDQDEDQQQQAADA',
  'DDDADDEDQQADEAQAQAQDQAEQAAEDQEEDEAEAQEEQDQAAAAAAEAEQDAAAQ'
];
for (const [i,keysPressed] of clears.entries()) {
  const s=newMovement(i);
  for(const key of keysPressed)hop(s,keys[key]);
  assert.equal(s.phase,'won',movements[i].name);
  assert.equal(s.lives,3);
  assert.equal(s.rewinds,1);
}
// Spending the key restores lost lives and clock phase, even after a fatal fall.
const s=newMovement(0);
for(let i=0;i<3;i++)hop(s,'nw');
assert.equal(s.phase,'lost');
assert(rewind(s));assert.equal(s.phase,'playing');assert.equal(s.lives,1);
assert.equal(s.rewinds,0);assert.equal(rewind(s),false);
// The lift is single-use. Rewinding the ride returns its charge and the patrol.
const lift=newMovement(0);
hop(lift,'sw');hop(lift,'sw');
const before=forecast(lift);
assert.equal(hop(lift,'nw').kind,'lift');assert.equal(lift.lifts[0],false);
assert(rewind(lift));assert.equal(lift.lifts[0],true);assert.deepEqual(forecast(lift),before);
console.log('Seven no-damage clears, fatal-hop rewind and lift restoration passed.');

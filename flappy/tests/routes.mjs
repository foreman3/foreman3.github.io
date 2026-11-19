import assert from 'node:assert/strict';
import {routes,newFlight,flap,advance,gateY} from '../flight.js';

function fly(index, reaction, strategy='collect') {
  const f=newFlight(index), events=[];
  flap(f);
  for (let tick=0;tick<12000 && f.phase==='flying';tick++) {
    const next=f.gates.find(g=>!g.passed);
    const margin=f.route.gap/2-39;
    const offset=Math.max(-margin,Math.min(margin,next.offset));
    const target=gateY(f,next)+(strategy==='avoid'?-offset:offset);
    const coasting=strategy==='coast after chain' && events.includes('shield');
    if (!coasting && tick%reaction===0 && f.y>target+17 && f.vy>0) flap(f);
    advance(f,1/120,event=>events.push(event));
  }
  return {f,events};
}

// Discrete taps must be sufficient to land each leg, including the moving gates.
for (const [index,route] of routes.entries()) {
  const landed=[5,6,7,8,9,10,12,14,15].some(interval=>fly(index,interval).f.phase==='delivered');
  assert(landed,route.name);
}
const grace=fly(0,6,'coast after chain');
assert.equal(grace.events.filter(e=>e==='save').length,1);
assert.equal(grace.f.phase,'lost');
assert([5,6,7,8,9].some(interval=>fly(0,interval,'avoid').f.phase==='short'));
console.log('All seven deliveries, postage shortfall, and one-hit spare wing passed.');

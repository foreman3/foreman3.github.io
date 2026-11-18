import assert from 'node:assert/strict';
import {createBoard, gardens} from '../gardens.js';

// Replay a catch on every layout so later edits to a border, shrub, or
// shortest-path tie-break cannot silently make a campaign round unwinnable.
const catches = [
  [22,33,72,46,45],
  [91,103,132,86,62,77],
  [43,99,98,97,96,59,60],
  [59,50,49,38,62,47],
  [29,76,88,81,84,90,74],
  [31,18,19,20,21,22],
  [33,32,24,1,20,12,5,21,22],
  [28,20,33,32,10,6,7],
  [27,32,35,23,21,20,18]
];

assert.equal(gardens.length, catches.length);
let previousPlots = Infinity, previousShrubs = Infinity, previousCover = 1;
for (const [round, garden] of gardens.entries()) {
  const {cells, burrow, escapeRoute} = createBoard(garden.width);
  const shrubs = new Set(garden.hedges);
  const cover = shrubs.size / cells.length;
  assert(cells.length < previousPlots && shrubs.size < previousShrubs && cover < previousCover, garden.name);
  previousPlots = cells.length;
  previousShrubs = shrubs.size;
  previousCover = cover;

  let mouse = burrow;
  assert(escapeRoute(mouse, shrubs)?.length > 0, garden.name);
  const moves = catches[round];
  for (const [turn, plot] of moves.entries()) {
    assert(cells[plot] && !shrubs.has(plot) && plot !== mouse, garden.name);
    shrubs.add(plot);
    const route = escapeRoute(mouse, shrubs);
    if (turn === moves.length - 1) assert.equal(route, null, garden.name);
    else {
      assert(route?.length && !cells[route[0]].edge, garden.name);
      mouse = route[0];
    }
  }
}
console.log('All nine gardens shrink, start with sparser cover, and have a playable catch.');

export const radius = 4;
const directions = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
export const cells = [];
const indices = new Map();
for (let r = -radius; r <= radius; r++) {
  for (let q = Math.max(-radius, -r-radius); q <= Math.min(radius, -r+radius); q++) {
    const id = cells.length;
    const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(q+r));
    cells.push({ id, q, r, edge: distance === radius });
    indices.set([q,r].join(), id);
  }
}
for (const cell of cells) {
  cell.neighbors = directions.map(([dq,dr]) => indices.get([cell.q+dq,cell.r+dr].join())).filter(id => id !== undefined);
}
export const burrow = indices.get('0,0');

// The trail and the mouse both use this walk. Equal-length routes break ties
// in compass order, so replaying the same move always gets the same response.
export function escapeRoute(mouse, hedges) {
  const parents = new Int16Array(cells.length).fill(-1);
  const queue = [mouse];
  parents[mouse] = mouse;
  for (let head = 0; head < queue.length; head++) {
    let id = queue[head];
    if (cells[id].edge) {
      const path = [];
      while (id !== mouse) {
        path.push(id);
        id = parents[id];
      }
      return path.reverse();
    }
    for (const next of cells[id].neighbors) {
      if (parents[next] !== -1 || hedges.has(next)) continue;
      parents[next] = id;
      queue.push(next);
    }
  }
  return null;
}


export const gardens = [
  {name:'Blackberry Patch', bloom:'#a75449', hedges:[1,5,7,8,10,11,12,13,15,16,17,19,22,23,24,28,31,32,34,36,38,40,49,52,53,56,58]},
  {name:'Clover Hollow', bloom:'#ab7181', hedges:[2,5,6,7,9,10,15,19,20,22,23,24,29,31,32,41,42,44,45,47,48,49,52,53,60]},
  {name:'Marigold Walk', bloom:'#c48738', hedges:[6,7,8,12,18,19,21,23,24,25,26,31,33,34,35,36,41,42,43,51,53,54]},
  {name:'Foxglove Close', bloom:'#a16e99', hedges:[5,8,10,14,16,18,19,20,26,27,32,33,34,38,39,40,42,46,48,59]},
  {name:'Moonflower Maze', bloom:'#e9dba6', hedges:[4,6,9,15,17,20,22,24,25,27,32,37,41,43,45,50,53,55,56,59]}
];

// Wild gardens retain the original game's fresh layouts. Verify a line of
// play before offering one, with a bounded search and a known-good fallback.
export function wildGarden() {
  function canCatch(mouse, hedges, turns, budget) {
    if (--budget.left < 0 || !turns || cells[mouse].edge) return false;
    for (const tile of escapeRoute(mouse, hedges)) {
      hedges.add(tile);
      const next = escapeRoute(mouse, hedges);
      const won = !next || canCatch(next[0], hedges, turns - 1, budget);
      hedges.delete(tile);
      if (won) return true;
      if (budget.left < 0) break;
    }
    return false;
  }
  for (let attempt = 0; attempt < 18; attempt++) {
    const layout = new Set(cells.filter(c => c.id !== burrow && Math.random() < (c.edge ? .28 : .42)).map(c => c.id));
    if (escapeRoute(burrow, layout) && canCatch(burrow, layout, 7, {left:600})) return [...layout];
  }
  return [...gardens[Math.floor(Math.random() * gardens.length)].hedges];
}

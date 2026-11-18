const directions = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];

export function createBoard(width) {
  const low = -Math.floor(width/2), high = low+width-1;
  const cells = [], indices = new Map();
  for (let r = low; r <= high; r++) {
    const first = Math.max(low,low-r);
    for (let q = first; q <= Math.min(high,high-r); q++) {
      const id = cells.length;
      cells.push({id,q,r,row:r-low+1,column:q-first+1});
      indices.set([q,r].join(),id);
    }
  }
  for (const cell of cells) {
    cell.neighbors = directions.map(([dq,dr]) => indices.get([cell.q+dq,cell.r+dr].join())).filter(id => id !== undefined);
    cell.edge = cell.neighbors.length < 6;
  }

  // The trail and the mouse both use this walk. Equal-length routes break ties
  // in compass order, so replaying the same move always gets the same response.
  function escapeRoute(mouse, hedges) {
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
  return {cells,burrow:indices.get("0,0"),escapeRoute};
}

export const gardens = [
  {name:'Blackberry Patch', bloom:'#a75449', width:15, hedges:[0,3,8,10,18,20,21,25,26,30,39,41,43,47,52,53,55,59,64,66,74,77,78,81,82,85,86,87,89,92,93,94,97,98,99,102,106,108,110,111,118,125,126,128,133,134,135,138,139,141,142,145,146,149,150,152,154,156,165,166,167,168]},
  {name:'Clover Hollow', bloom:'#ab7181', width:14, hedges:[1,7,8,16,23,25,29,32,34,36,45,54,55,57,58,59,60,61,63,67,68,70,71,78,80,82,85,87,92,94,96,98,100,104,106,108,111,113,114,120,122,124,126,128,129,133,138,141,142,143,146]},
  {name:'Marigold Walk', bloom:'#c48738', width:13, hedges:[3,4,8,13,14,19,20,21,22,23,26,28,30,32,33,38,41,48,49,50,51,54,55,57,62,66,67,70,71,77,78,79,81,82,85,89,90,93,103,104,105,122]},
  {name:'Bramble Orchard', bloom:'#95545c', width:12, hedges:[2,6,9,13,14,21,23,34,37,40,41,43,45,64,71,72,73,74,76,78,79,80,82,83,84,85,86,87,89,90,91,94,98,100]},
  {name:'Foxglove Close', bloom:'#a16e99', width:11, hedges:[2,4,6,8,14,16,19,20,26,28,30,31,34,37,39,43,44,50,51,52,55,57,60,68,69,75,89]},
  {name:'Briar Terrace', bloom:'#c16c55', width:10, hedges:[1,17,27,37,41,44,47,51,52,53,54,55,56,59,60,61,64,65,66,74]},
  {name:'Thistle Gate', bloom:'#997da1', width:9, hedges:[0,2,3,8,9,10,15,16,25,28,40,41,50,55,59]},
  {name:'Yew Pocket', bloom:'#ab6049', width:8, hedges:[5,9,13,16,22,23,24,30,34,35,41]},
  {name:'Moonflower Maze', bloom:'#e9dba6', width:7, hedges:[2,17,19,29,31,34,36]}
];

// Wild gardens retain the original game's fresh layouts. Verify a line of
// play before offering one, with a bounded search and a known-good fallback.
export function wildGarden({cells,burrow,escapeRoute}) {
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
  return [...gardens.find(garden => garden.width === 9).hedges];
}

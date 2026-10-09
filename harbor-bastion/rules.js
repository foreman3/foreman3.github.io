(() => {
  'use strict';
  const C=40,COLS=15,ROWS=16;
  const upgrades={
    tower:{name:'Cannon tower',level:3,cost:14,w:2,h:2,hp:3,description:'Each tower adds a gun with its own reload. Hold fire to use ready manual guns.'},
    keep:{name:'Keep expansion',level:5,cost:20,description:'Each expansion adds one row and column, and 6 maximum health. Existing health stays unchanged; repair separately.'},
    mage:{name:'Magician’s tower',level:7,cost:20,w:2,h:2,hp:3,description:'Each magician stops one nearby shell within 190 units, then recharges independently for 5 seconds.'},
    captain:{name:'Captain’s quarters',level:9,cost:18,w:2,h:2,hp:3,description:'Each captain aims a separate tower gun. Spare captains wait for a tower. Your keep gun stays manual.'},
    workshop:{name:'Workshop',level:11,cost:22,w:2,h:2,hp:3,description:'Each workshop cuts remaining manual reload time by 20% and adds 3 patch stones per preparation.'}
  };
  const pieces=[[[0,0],[1,0]],[[0,0],[1,0],[2,0]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[0,1],[1,1]]];
  const pieceNames=['Domino','Beam','Corner','Square'];
  const id=(x,y)=>y*COLS+x,xy=n=>[n%COLS,Math.floor(n/COLS)],inside=(x,y)=>x>=1&&x<COLS-1&&y>=1&&y<ROWS-1;
  function footprint(b){const cells=[];for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)cells.push(id(x,y));return cells;}
  function buildingAt(s,x,y){return s.buildings.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);}
  function occupied(s,x,y){return s.walls.has(id(x,y))||Boolean(buildingAt(s,x,y));}
  function enclosure(s){const outside=new Set(),queue=[];for(let x=0;x<COLS;x++)queue.push(id(x,0),id(x,ROWS-1));for(let y=1;y<ROWS-1;y++)queue.push(id(0,y),id(COLS-1,y));
    for(let i=0;i<queue.length;i++){const n=queue[i];if(outside.has(n)||s.walls.has(n))continue;outside.add(n);const [x,y]=xy(n);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(x+dx>=0&&x+dx<COLS&&y+dy>=0&&y+dy<ROWS){const next=id(x+dx,y+dy);if(!outside.has(next))queue.push(next);}}
    const protectedCells=new Set();for(let n=0;n<COLS*ROWS;n++)if(!outside.has(n)&&!s.walls.has(n))protectedCells.add(n);
    const keep=s.buildings.find(b=>b.type==='keep');return{outside,protectedCells,sealed:footprint(keep).every(n=>protectedCells.has(n)),free:[...protectedCells].filter(n=>{const [x,y]=xy(n);return !buildingAt(s,x,y);}).length};
  }
  function rotate(points,r){let p=points.map(a=>a.slice());for(let i=0;i<r;i++)p=p.map(([x,y])=>[-y,x]);const minX=Math.min(...p.map(a=>a[0])),minY=Math.min(...p.map(a=>a[1]));return p.map(([x,y])=>[x-minX,y-minY]);}
  function upgradeSize(s,type){if(type==='keep'){const b=s.buildings.find(b=>b.type==='keep');return{w:b.w+1,h:b.h+1};}return upgrades[type];}
  function selection(s){if(s.tool==='wall')return rotate(pieces[s.hand[s.slot]],s.rotation);if(s.tool==='patch')return [[0,0]];if(upgrades[s.tool]){const u=upgradeSize(s,s.tool);return Array.from({length:u.w*u.h},(_,i)=>[i%u.w,Math.floor(i/u.w)]);}return [[0,0]];}
  function placement(s,x=s.cursor.x,y=s.cursor.y){const points=selection(s).map(([dx,dy])=>[x+dx,y+dy]),u=upgrades[s.tool],e=enclosure(s),wallCost=points.length*(s.tool==='patch'?2:1);
    if(s.tool==='repair'){const b=buildingAt(s,x,y);return{ok:Boolean(b&&b.hp<b.maxHp&&s.supplies>=2),points,cost:2,reason:'Select a damaged building. Repairs cost 2 per health.'};}
    if(s.tool==='salvage'){const b=buildingAt(s,x,y);return{ok:s.walls.has(id(x,y))||Boolean(b&&b.type!=='keep'),points,cost:0,reason:'Select a wall stone or an upgrade. The keep cannot be salvaged.'};}
    if(points.some(([a,b])=>!inside(a,b)))return{ok:false,points,cost:0,reason:'The entire piece must fit on buildable land.'};
    if(u){if(s.level<u.level)return{ok:false,points,cost:u.cost,reason:u.name+' unlocks at level '+u.level+'.'};if(s.tool==='keep'){const keep=s.buildings.find(b=>b.type==='keep');if(!footprint(keep).every(n=>points.some(([a,b])=>id(a,b)===n)))return{ok:false,points,cost:u.cost,reason:'Expansion must contain the existing keep.'};}}
    if(points.some(([a,b])=>s.walls.has(id(a,b))||Boolean(buildingAt(s,a,b)&&!(s.tool==='keep'&&buildingAt(s,a,b).type==='keep'))))return{ok:false,points,cost:u?u.cost:wallCost,reason:'No overlap. Every new stone needs an empty square.'};
    if(u&&!points.every(([a,b])=>e.protectedCells.has(id(a,b))))return{ok:false,points,cost:u.cost,reason:'Enclose the entire footprint with walls first.'};
    if(!u&&!points.some(([a,b])=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>occupied(s,a+dx,b+dy))))return{ok:false,points,cost:wallCost,reason:'Join the piece to a wall or building by an edge.'};
    if(s.tool==='patch'&&s.patches<=0)return{ok:false,points,cost:2,reason:'No patch stones left. Choose or exchange a wall piece.'};
    const cost=u?u.cost:wallCost;return{ok:s.supplies>=cost,points,cost,reason:s.supplies<cost?'Not enough supplies. Salvage old walls or choose a smaller plan.':'Fits perfectly · '+cost+' supplies'};
  }
  function snapshot(s){return{level:s.level,supplies:s.supplies,score:s.score,walls:[...s.walls],rubble:[...s.rubble],buildings:s.buildings.map(b=>({...b})),hand:[...s.hand],deck:s.deck,patches:s.patches};}
  function restore(s,p){s.level=p.level;s.supplies=p.supplies;s.score=p.score;s.walls=new Set(p.walls);s.rubble=new Set(p.rubble||[]);s.buildings=p.buildings.map(b=>({...b}));s.hand=[...p.hand];s.deck=p.deck;s.patches=p.patches;}
  window.HarborRules={C,COLS,ROWS,id,xy,inside,upgrades,pieces,pieceNames,footprint,buildingAt,occupied,enclosure,rotate,upgradeSize,selection,placement,snapshot,restore};
})();

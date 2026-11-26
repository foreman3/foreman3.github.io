/* A geometry-aware two-dose search policy. It never changes board contents. */
const E=require('../engine.js');
function copy(s){return{...s,board:E.clone(s.board),piece:s.piece?{...s.piece}:null,queue:s.queue.map(p=>[...p]),history:[],flash:[...s.flash]};}
function evaluate(s){if(s.phase==='won')return 1e6;if(s.phase==='lost')return-1e6;let v=s.cleared*2000,holes=0,height=0;
  for(let x=0;x<8;x++){let top=14;for(let y=0;y<14;y++){const c=s.board[y][x];if(c){top=Math.min(top,y);v-=c.bug?0:8;if(!c.bug)v-=(14-y)*2;for(const [dx,dy]of[[1,0],[0,1]])if(x+dx<8&&y+dy<14&&s.board[y+dy][x+dx]?.c===c.c)v+=c.bug||s.board[y+dy][x+dx].bug?28:12;}else if(top<14)holes++;}height+=(14-top)**2;}
  // Reward an accessible vertical recipe above each fixed microbe, and avoid
  // burying one beneath an incompatible capsule. This is a policy, not a proof
  // of human enjoyment or difficulty.
  for(let y=0;y<14;y++)for(let x=0;x<8;x++){const c=s.board[y][x];if(!c?.bug)continue;let run=1;for(let yy=y-1;yy>=0;yy--){const a=s.board[yy][x];if(!a)break;if(a.c!==c.c){v-=a.bug?5:90;break;}run++;}v+=run*run*26;}
  return v-height*4-holes*7;
}
function candidates(s){if(s.phase!=='fall')return[];const result=[];let start=copy(s);if(!E.fits(start,start.piece))return[];const q=[{p:start.piece,commands:[]}],seen=new Set();
  // Explore keyboard-reachable positions at the top, including wall kicks.
  while(q.length){const n=q.shift(),key=[n.p.x,n.p.y,n.p.r].join();if(seen.has(key))continue;seen.add(key);const a=copy(start);a.piece={...n.p};E.drop(a);E.settle(a);result.push({s:a,commands:n.commands,value:evaluate(a)});
    for(const command of['left','right','rotate']){const b=copy(start);b.piece={...n.p};if(command==='rotate'?E.rotate(b):E.move(b,command==='left'?-1:1)){const k=[b.piece.x,b.piece.y,b.piece.r].join();if(!seen.has(k))q.push({p:b.piece,commands:[...n.commands,command]});}}
  }return result;
}
function choose(s,depth=2){const first=candidates(s).sort((a,b)=>b.value-a.value).slice(0,7);for(const a of first){if(depth>1&&a.s.phase==='fall'){const future=candidates(a.s);a.rank=a.value*.3+Math.max(...future.map(b=>b.value));}else a.rank=a.value*1.3;}return first.sort((a,b)=>b.rank-a.rank)[0];}
function run(level,seed=19,max=200){const s=E.create(level,seed);let actions=[];while(s.phase==='fall'&&s.doses<max){const c=choose(s);if(!c)break;for(const a of c.commands){if(a==='rotate')E.rotate(s);else E.move(s,a==='left'?-1:1);}E.drop(s);E.settle(s);actions.push(c.commands);}return{level,seed,phase:s.phase,doses:s.doses,cleared:s.cleared,total:s.cfg.bugs,score:s.score,actions,state:s};}
module.exports={choose,run,candidates,evaluate};
if(require.main===module)for(let i=1;i<=7;i++){const r=run(i);delete r.actions;delete r.state;console.log(r);}

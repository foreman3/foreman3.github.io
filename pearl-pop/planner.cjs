const E=require('./engine.js');
function choose(s,precision=.015){let best=null,bestValue=-Infinity;const routes=new Map();for(let swap=0;swap<2;swap++){for(let a=-1.32;a<=1.32;a+=precision){const path=E.trace(s,a);if(!path.slot)continue;const tag=swap+':'+path.slot.r+','+path.slot.c+':'+path.bank+':'+Math.sign(a);const route=routes.get(tag);if(route)route.max=a;else routes.set(tag,{min:a,max:a,swap});}}
for(const route of routes.values()){const a=(route.min+route.max)/2,swap=route.swap,c=E.clone(s);if(swap)[c.current,c.next]=[c.next,c.current];const path=E.trace(c,a);if(!path.slot)continue;E.resolve(c,path);let value=(Object.keys(s.board).length-Object.keys(c.board).length)*10;
    // Prefer extending pairs to burying a lone off-color pearl.
    if(!c.last.removed.length){const id=E.key(path.slot.r,path.slot.c);const matches=E.neighbors(path.slot.r,path.slot.c).filter(([r,col])=>c.board[E.key(r,col)]===c.board[id]).length;value+=matches*5;}
    value-=path.slot.r*.12;value-=Math.abs(a)*.1;if(c.status==='over')value-=10000;if(c.status==='clear')value+=10000;if(value>bestValue){bestValue=value;best={angle:a,swap,value,remaining:Object.keys(c.board).length};}
  }return best;}
module.exports={choose};
if(require.main===module){for(let l=1;l<=9;l++){const s=E.create(l);let swaps=0,banks=0,n=0;while(s.status==='playing'&&n<100){const b=choose(s);if(!b)break;if(b.swap){[s.current,s.next]=[s.next,s.current];swaps++;}const path=E.trace(s,b.angle);banks+=path.bank>0;E.resolve(s,path);n++;}console.log(JSON.stringify({level:l,n,swaps,banks,status:s.status,shots:s.shots,remaining:Object.keys(s.board).length,popped:s.popped,fallen:s.fallen}));}}

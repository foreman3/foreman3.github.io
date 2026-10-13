(() => {
 'use strict';
 const W=20,H=12,T=48;
 const levels=[
  {name:'The nursery',pods:4,bugs:1,pace:.65,time:130,hearts:5,whistles:2,note:'Collect the four golden pods. Up climbs the leafy vines.'},
  {name:'Twin trails',pods:5,bugs:2,pace:.59,time:125,hearts:5,whistles:2,note:'Two beetles patrol different shelves. Dig a trap before they reach you.'},
  {name:'Rope garden',pods:6,bugs:2,pace:.53,time:120,hearts:5,whistles:2,note:'Ropes cross missing soil. Down drops from a rope; falls are safe.'},
  {name:'Stone terraces',pods:7,bugs:3,pace:.47,time:115,hearts:5,whistles:2,note:'Pale stone will not dig. Lead beetles onto brown soil.'},
  {name:'The wild canopy',pods:8,bugs:4,pace:.41,time:110,hearts:5,whistles:2,note:'Striped beetles move faster. Route, trap, and save a whistle for recovery.'},
  {name:'Master gardener',pods:9,bugs:5,pace:.30,time:90,hearts:3,whistles:1,note:'One whistle. Faster pursuit. Read the ladders before committing.'},
  {name:'The perfect harvest',pods:10,bugs:5,pace:.28,time:60,hearts:2,whistles:0,note:'No whistles, one recoverable hit. Make every detour count.'}
 ];
 function garden(level){
  const tiles=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x===0||x===W-1||y===H-1?'=':[3,6,9].includes(y)?'#':'.'));
  const ladderPairs=[[3,16],[5,14],[3,15],[5,16],[4,14],[3,16],[3,16]],ladders=ladderPairs[level-1];
  for(const x of ladders)for(let y=2;y<11;y++)tiles[y][x]='H';
  if(level>=3){for(let x=8;x<=11;x++){tiles[6][x]='.';tiles[5][x]='-';}}
  if(level>=4)for(const y of [3,9])for(const x of [7,8,11,12])tiles[y][x]='=';
  if(level>=5){for(let x=7;x<=12;x++)tiles[8][x]='-';for(const x of [9,10])tiles[9][x]='.';}
  const candidates=[[7,10],[12,8],[7,5],[12,2],[17,10],[2,5],[2,2],[17,8],[17,5],[9,2]];
  const pods=candidates.slice(0,levels[level-1].pods).map(([x,y])=>({x,y,collected:false}));
  const homes=[[17,2],[2,8],[17,5],[12,level>=6?8:10],[2,2],[7,8]];
  const bugs=homes.slice(0,levels[level-1].bugs).map(([x,y],i)=>({x,y,home:{x,y},fast:level>=5&&i%2===1,move:null,wait:2+i*.45,stun:0,trap:0,respawn:0}));
  return{tiles,pods,bugs,start:{x:2,y:10},exit:{x:18,y:2}};
 }
 const key=(x,y)=>`${x},${y}`;
 function tile(s,x,y){return s.tiles[y]?.[x]??'=';}
 function hole(s,x,y){return s.holes.find(h=>h.x===x&&h.y===y);}
 function solid(s,x,y){const v=tile(s,x,y);return(v==='#'||v==='=')&&!hole(s,x,y);}
 function neighbors(s,a){
  const{x,y}=a,out=[],on=tile(s,x,y),inPit=hole(s,x,y),supported=solid(s,x,y+1)||on==='H'||on==='-'||inPit;
  if(!supported){if(!solid(s,x,y+1))out.push({x,y:y+1,dir:'down',fall:true});return out;}
  if(!solid(s,x-1,y))out.push({x:x-1,y,dir:'left'});if(!solid(s,x+1,y))out.push({x:x+1,y,dir:'right'});
  if((on==='H'||tile(s,x,y-1)==='H'||inPit)&&!solid(s,x,y-1))out.push({x,y:y-1,dir:'up'});
  if((on==='H'||on==='-'||!solid(s,x,y+1))&&!solid(s,x,y+1))out.push({x,y:y+1,dir:'down',fall:on!=='H'});
  return out.filter(n=>n.x>=1&&n.x<W-1&&n.y>=1&&n.y<H-1);
 }
 function route(s,from,to,cost=()=>0){
  const frontier=[{x:from.x,y:from.y,score:0,first:null}],best=new Map([[key(from.x,from.y),0]]);
  while(frontier.length){frontier.sort((a,b)=>a.score-b.score);const p=frontier.shift();if(p.x===to.x&&p.y===to.y)return p.first;
   for(const n of neighbors(s,p)){const score=p.score+1+cost(n),k=key(n.x,n.y);if(score>=(best.get(k)??Infinity))continue;best.set(k,score);frontier.push({...n,score,first:p.first||n});}
  }return null;
 }
 window.CanopyRules={W,H,T,levels,garden,key,tile,hole,solid,neighbors,route};
})();

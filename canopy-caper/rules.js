(() => {
 'use strict';
 const T=48,VIEW_W=20,VIEW_H=12;
 const levels=[
  {name:'Fern Hollow',width:26,height:15,pods:4,bugs:1,pace:.60,time:150,hearts:5,whistles:2,note:'Explore the hollow. DIG follows your facing arrow; pits lift you out after 2s.'},
  {name:'The Forked Atrium',width:30,height:17,pods:6,bugs:2,pace:.53,time:170,hearts:5,whistles:2,note:'Green wardens guard seeds instead of joining the chase. Choose another vine.'},
  {name:'Orchid Islands',width:32,height:19,pods:8,bugs:3,pace:.48,time:185,hearts:5,whistles:2,note:'Purple interceptors head for vine junctions. Use the rope bridges and safe drops.'},
  {name:'Rootstone Ruins',width:34,height:21,pods:10,bugs:4,pace:.43,time:195,hearts:5,whistles:2,note:'Stone ruins split the terraces. Trap pursuers on soil and loop around the wardens.'},
  {name:'The Split Canopy',width:36,height:22,pods:12,bugs:5,pace:.39,time:205,hearts:5,whistles:2,note:'Striped scouts aim ahead. Change your route, dig a retreat, and watch the map.'},
  {name:'Monsoon Galleries',width:38,height:24,pods:14,bugs:6,pace:.33,time:195,hearts:3,whistles:1,note:'Mastery: mixed patrols, one whistle, and a wide network of vine routes.'},
  {name:'The Crown Garden',width:40,height:25,pods:16,bugs:7,pace:.31,time:185,hearts:3,whistles:0,note:'Near perfection: no whistles, two recoverable hits across sixteen pods. Read the patrol roles.'}
 ];
 const plans=[[[4,8,23],[9,1,19],[14,1,24]],[[3,8,22],[7,3,27],[12,1,23],[16,1,28]],[[4,1,20],[9,8,30],[14,1,25],[18,1,30]],[[3,7,32],[8,1,24],[13,10,32],[17,2,28],[20,1,32]],[[4,12,33],[8,2,33],[12,1,25],[17,8,34],[21,1,34]],[[3,3,35],[8,8,36],[13,1,31],[18,4,36],[23,1,36]],[[3,14,38],[7,4,32],[12,1,38],[17,10,38],[21,2,30],[24,1,38]]];
 const key=(x,y)=>`${x},${y}`;
 function garden(level){
  const cfg=levels[level-1],width=cfg.width,height=cfg.height;
  const tiles=Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>x===0||x===width-1?'=':y===height-1?'#':'.'));
  const shelves=plans[level-1].map(([y,a,b])=>({y,a,b})),junctions=[];
  for(const p of shelves)for(let x=p.a;x<=p.b;x++)tiles[p.y][x]='#';
  for(let i=0;i<shelves.length-1;i++){
   const upper=shelves[i],lower=shelves[i+1],lo=Math.max(upper.a,lower.a)+1,hi=Math.min(upper.b,lower.b)-1,columns=[lo+1,hi-1];if(level>=4)columns.push(Math.round((lo+hi)/2));
   for(const x of [...new Set(columns)]){for(let y=upper.y-1;y<lower.y;y++)tiles[y][x]='H';junctions.push({x,y:upper.y-1},{x,y:lower.y-1});}
  }
  const annexes=[];if(level===2)annexes.push({y:10,a:25,b:28,link:7,x:26});if(level===3)annexes.push({y:6,a:25,b:30,link:9,x:28});if(level>=4)annexes.push({y:5,a:1,b:5,link:shelves[1].y,x:4});
  for(const p of annexes){for(let x=p.a;x<=p.b;x++)tiles[p.y][x]='#';for(let y=Math.min(p.y,p.link)-1;y<Math.max(p.y,p.link);y++)tiles[y][p.x]='H';junctions.push({x:p.x,y:p.y-1});}
  if(level>=3)for(let i=0;i<shelves.length-1;i++){const p=shelves[i],mid=Math.floor((p.a+p.b)/2)+(i%2?2:-1);for(let x=mid;x<=mid+2;x++)if(tiles[p.y][x]==='#'){tiles[p.y][x]='.';tiles[p.y-1][x]='-';}}
  if(level>=4)for(const p of shelves.slice(0,-1))for(const x of [p.a+3,p.a+4,p.b-3])if(tiles[p.y][x]==='#')tiles[p.y][x]='=';
  if(level===3){for(let x=20;x<=28;x++)if(tiles[3][x]==='.')tiles[3][x]='-';for(let y=3;y<9;y++)tiles[y][28]='H';junctions.push({x:28,y:3});}
  const start={x:2,y:height-2},top=shelves[0],exit={x:top.b-1,y:top.y-1},sites=[];
  for(const p of [...shelves].reverse().concat(annexes))for(const fraction of [.25,.72,.05,.92,.48]){const x=Math.round(p.a+(p.b-p.a)*fraction),y=p.y-1;if(tiles[y][x]==='.'&&['#','='].includes(tiles[y+1][x])&&key(x,y)!==key(exit.x,exit.y)&&Math.abs(x-start.x)+Math.abs(y-start.y)>3&&!sites.some(n=>n.x===x&&n.y===y))sites.push({x,y});}
  const pods=[],perShelf=[...shelves].reverse().concat(annexes).map(p=>sites.filter(n=>n.y===p.y-1));
  for(let column=0;pods.length<cfg.pods&&column<5;column++)for(const list of perShelf){const p=list[column];if(p&&pods.length<cfg.pods&&!pods.some(n=>n.x===p.x&&n.y===p.y))pods.push({...p,collected:false});}
  const roles=['chaser','warden','interceptor',level>=5?'scout':'chaser','warden','interceptor','scout'];
  const bugs=Array.from({length:cfg.bugs},(_,i)=>{const p=pods[(i*3+1)%pods.length],shelf=shelves.find(n=>n.y===p.y+1)||shelves[1];let x=Math.max(shelf.a+1,Math.min(shelf.b-1,p.x+(i%2?3:-3))),y=p.y;if(level>=6&&Math.abs(x-start.x)+Math.abs(y-start.y)<12){const perch=shelves[1+i%2];x=perch.a+3+(i*5)%(perch.b-perch.a-5);y=perch.y-1;}return{x,y,home:{x,y},role:roles[i],fast:roles[i]==='scout',facing:1,move:null,wait:1.6+i*.25,stun:0,trap:0,respawn:0,patrol:0,alert:0,target:null,pitTime:0};});
  return{width,height,tiles,shelves,junctions,pods,bugs,start,exit,escapes:[]};
 }
 function baseTile(s,x,y){return s.tiles[y]?.[x]??'=';}
 function tile(s,x,y){return s.escapes?.some(e=>e.x===x&&e.y===y)?'H':baseTile(s,x,y);}
 function hole(s,x,y){return s.holes.find(h=>h.x===x&&h.y===y);}
 function solid(s,x,y){return ['#','='].includes(tile(s,x,y))&&!hole(s,x,y);}
 function neighbors(s,a){
  const{x,y}=a,out=[],on=tile(s,x,y),inPit=hole(s,x,y),supported=solid(s,x,y+1)||on==='H'||on==='-'||inPit;
  if(!supported){if(!solid(s,x,y+1))out.push({x,y:y+1,dir:'down',fall:true});return out;}
  if(!solid(s,x-1,y))out.push({x:x-1,y,dir:'left'});if(!solid(s,x+1,y))out.push({x:x+1,y,dir:'right'});
  if((on==='H'||tile(s,x,y-1)==='H'||inPit)&&!solid(s,x,y-1))out.push({x,y:y-1,dir:'up'});
  if((on==='H'||on==='-'||!solid(s,x,y+1))&&!solid(s,x,y+1))out.push({x,y:y+1,dir:'down',fall:on!=='H'});
  return out.filter(n=>n.x>=1&&n.x<s.width-1&&n.y>=1&&n.y<s.height);
 }
 function route(s,from,to,cost=null){
  const frontier=[{x:from.x,y:from.y,score:0,first:null}],best=new Map([[key(from.x,from.y),0]]);let index=0;
  while(index<frontier.length){if(cost){frontier.sort((a,b)=>a.score-b.score);index=0;}const p=cost?frontier.shift():frontier[index++];if(p.x===to.x&&p.y===to.y)return p.first;
   for(const n of neighbors(s,p)){const score=p.score+1+(cost?cost(n):0),k=key(n.x,n.y);if(score>=(best.get(k)??Infinity))continue;best.set(k,score);frontier.push({...n,score,first:p.first||n});}
  }return null;
 }
 function reachable(s,from){const found=new Set([key(from.x,from.y)]),queue=[from];for(let i=0;i<queue.length;i++)for(const n of neighbors(s,queue[i]))if(!found.has(key(n.x,n.y))){found.add(key(n.x,n.y));queue.push(n);}return found;}
 function target(s,b){
  const p=s.player,distance=Math.hypot(p.x-b.x,p.y-b.y),remaining=s.pods.filter(n=>!n.collected);b.alert=distance<(b.role==='warden'?4:b.role==='scout'?11:9)?1:0;
  if(b.role==='chaser'&&b.alert)return{x:p.x,y:p.y};
  if(b.role==='scout'&&b.alert){let ahead={x:p.move?.x??p.x,y:p.move?.y??p.y};for(let i=0;i<5;i++){const next=neighbors(s,ahead).find(n=>n.dir===(p.facing<0?'left':'right'));if(!next)break;ahead=next;}return ahead;}
  if(b.role==='interceptor'&&b.alert){const score=n=>Math.abs(n.x-p.x)+Math.abs(n.y-p.y)*1.5+(Math.sign(n.x-p.x)!==p.facing?4:0),candidates=s.junctions.filter(n=>Math.abs(n.y-p.y)<=5&&Math.abs(n.x-p.x)>1);candidates.sort((a,c)=>score(a)-score(c));if(candidates[0])return candidates[0];}
  if(b.role==='warden'){const defended=remaining.filter(n=>Math.abs(n.y-b.home.y)<=4).sort((a,c)=>Math.abs(a.x-b.home.x)+Math.abs(a.y-b.home.y)-Math.abs(c.x-b.home.x)-Math.abs(c.y-b.home.y))[0]||b.home;if(distance<2.8&&Math.abs(p.y-b.home.y)<=1&&Math.hypot(p.x-b.home.x,p.y-b.home.y)<4)return{x:p.x,y:p.y};const edge=dir=>{for(const distance of [3,2,1]){const n={x:defended.x+dir*distance,y:defended.y};if(n.x>0&&n.x<s.width-1&&!solid(s,n.x,n.y)&&(solid(s,n.x,n.y+1)||['H','-'].includes(tile(s,n.x,n.y))))return n;}return defended;};let lip=edge(b.patrol?1:-1);if(b.x===lip.x&&b.y===lip.y){b.patrol=1-b.patrol;lip=edge(b.patrol?1:-1);}return lip;}
  const choices=remaining.length?remaining:s.junctions,site=choices[(s.bugs.indexOf(b)*2+b.patrol)%choices.length]||b.home;if(b.x===site.x&&b.y===site.y)b.patrol=(b.patrol+1)%Math.max(1,choices.length);return site;
 }
 window.CanopyRules={T,VIEW_W,VIEW_H,levels,garden,key,tile,baseTile,hole,solid,neighbors,route,reachable,target};
})();

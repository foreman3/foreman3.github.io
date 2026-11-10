/* Deterministic light-cycle simulation, shared with the reproducible checks. */
(function(root){
 'use strict';
 const W=52,H=34,D=[[1,0],[0,1],[-1,0],[0,-1]];
 const levels=[
  {name:'The warm-up',speed:6,rivals:1,patches:3,islands:0,look:35},
  {name:'Split decision',speed:6.6,rivals:1,patches:3,islands:1,look:65},
  {name:'Three is a crowd',speed:7.1,rivals:2,patches:3,islands:1,look:90},
  {name:'The chicane',speed:7.7,rivals:2,patches:3,islands:2,look:130},
  {name:'Full grid',speed:8.2,rivals:3,patches:3,islands:2,look:170},
  {name:'The masters',speed:10,rivals:3,patches:1,islands:2,look:260},
  {name:'A perfect line',speed:12,rivals:3,patches:0,islands:2,look:400}
 ];
 const at=(x,y)=>y*W+x,inside=(x,y)=>x>0&&x<W-1&&y>0&&y<H-1;
 function create(level=1,seed=1977){
  const c=levels[level-1],board=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!inside(x,y))board[at(x,y)]=9;
  const block=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)board[at(i,j)]=9;};
  if(c.islands===1)block(24,13,4,8);
  if(c.islands===2){block(17,10,4,8);block(31,16,4,8);}
  const starts=[[8,25,3],[43,8,1],[8,8,0],[43,25,2]];
  const riders=starts.slice(0,c.rivals+1).map(([x,y,d],i)=>({x,y,px:x,py:y,d,alive:true,wait:0,grace:0,id:i+1}));
  riders.forEach(r=>board[at(r.x,r.y)]=r.id);
  return {level,board,riders,seed:seed>>>0,time:0,acc:0,tick:0,patches:c.patches,used:0,brake:1,braking:false,brakeLocked:false,queue:[],score:0,status:'playing',events:[],last:'Find open space. Make them follow your line.'};
 }
 function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
 function turn(s,d){const r=s.riders[0],prev=s.queue.length?s.queue[s.queue.length-1]:r.d;if(d!==prev&&d!==(prev+2)%4&&s.queue.length<2)s.queue.push(d);}
 const visit=new Uint32Array(W*H),queue=new Int32Array(W*H);let stamp=0;
 function area(s,x,y,limit){
  if(!inside(x,y)||s.board[at(x,y)])return 0;
  stamp++;let head=0,tail=1;queue[0]=at(x,y);visit[queue[0]]=stamp;
  while(head<tail&&tail<limit){const p=queue[head++],px=p%W,py=Math.floor(p/W);for(const [dx,dy]of D){const nx=px+dx,ny=py+dy,n=at(nx,ny);if(inside(nx,ny)&&!s.board[n]&&visit[n]!==stamp){visit[n]=stamp;queue[tail++]=n;}}}
  return tail;
 }
 function choose(s,r,limit=120,expert=false){
  let best=r.d,top=-1e9;
  for(const d of [r.d,(r.d+1)%4,(r.d+3)%4]){
   const [dx,dy]=D[d],x=r.x+dx,y=r.y+dy;
   let ray=0;while(ray<16&&inside(x+dx*ray,y+dy*ray)&&!s.board[at(x+dx*ray,y+dy*ray)])ray++;
   let score=area(s,x,y,limit)*2+ray*.8+(d===r.d?1:0);
   if(!inside(x,y)||s.board[at(x,y)])score=-10000;
   for(const other of s.riders)if(other!==r&&other.alive){const dist=Math.abs(x-other.x)+Math.abs(y-other.y);if(dist<=1)score-=expert?300:80;}
   if(score>top){top=score;best=d;}
  }return best;
 }
 function crash(s,r,cause=0){
  s.events.push({type:'crash',x:r.x,y:r.y,id:r.id});
  if(r.id===1&&s.patches>0){
   s.patches--;s.used++;r.grace=5;s.last='PATCH USED · Pick a fresh line!';
   for(let y=r.y-3;y<=r.y+3;y++)for(let x=r.x-3;x<=r.x+3;x++)if(inside(x,y)&&s.board[at(x,y)]!==9)s.board[at(x,y)]=0;
   r.d=choose(s,r,200,true);s.queue=[];
  }else{r.alive=false;if(r.id===1){s.status='over';s.last='Your ribbon met its match.';}else{const cut=cause===1;s.score+=cut?1000:400;s.last=cut?'CUT-OFF +1,000 · Beautifully boxed in.':'RIVAL OUT +400 · Own the space.';}}
 }
 function step(s,dt){
  if(s.status!=='playing')return;
  dt=Math.min(dt,.05);s.time+=dt;s.acc+=dt;const c=levels[s.level-1];
  if(!s.braking)s.brakeLocked=false;
  if(s.braking&&!s.brakeLocked){s.brake=Math.max(0,s.brake-dt*.42);if(s.brake===0)s.brakeLocked=true;}else s.brake=Math.min(1,s.brake+dt*.16);
  if(s.acc<1/c.speed)return;s.acc-=1/c.speed;s.tick++;
  const plans=[];
  for(const r of s.riders){
   if(!r.alive)continue;r.px=r.x;r.py=r.y;
   if(r.id===1&&s.braking&&!s.brakeLocked&&s.tick%2===0)continue;
   if(r.id===1){if(s.queue.length)r.d=s.queue.shift();}
   else{r.d=choose(s,r,c.look,s.level>=4);/* Early opponents leave more room for a cut-off. */
    if(s.level<4&&s.tick%19===r.id&&random(s)<.28){const d=(r.d+1)%4,[dx,dy]=D[d];if(d!==(r.d+2)%4&&inside(r.x+dx,r.y+dy)&&!s.board[at(r.x+dx,r.y+dy)])r.d=d;}}
   const [dx,dy]=D[r.d];plans.push({r,x:r.x+dx,y:r.y+dy,bad:false});
  }
  for(const p of plans){p.bad=!inside(p.x,p.y)||s.board[at(p.x,p.y)]!==0;if(p.r.grace>0&&inside(p.x,p.y)&&s.board[at(p.x,p.y)]!==9)p.bad=false;
   for(const q of plans)if(q!==p&&p.x===q.x&&p.y===q.y)p.bad=q.bad=true;}
  for(const p of plans){const r=p.r;if(p.bad){crash(s,r,s.board[at(p.x,p.y)]);continue;}r.x=p.x;r.y=p.y;s.board[at(r.x,r.y)]=r.id;if(r.grace>0)r.grace--;if(r.id===1)s.score+=2;}
  if(s.status==='playing'&&!s.riders.slice(1).some(r=>r.alive)){s.status='clear';s.score+=1000+s.patches*150+Math.floor(s.brake*100);s.last='The rink is yours.';}
 }
 const api={W,H,D,levels,create,turn,step,choose,area,at};
 if(typeof module!=='undefined')module.exports=api;else root.RibbonEngine=api;
})(typeof window==='undefined'?globalThis:window);

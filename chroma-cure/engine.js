/* Chroma Cure — deterministic rules, shared by the browser and verification. */
(function (root) {
  'use strict';
  const W=8,H=14;
  const LEVELS=[
    {name:'First prescription',bugs:6,rows:3,colors:2,fall:1.15,lock:.62,rewinds:3},
    {name:'A little chemistry',bugs:10,rows:4,colors:2,fall:1.02,lock:.60,rewinds:3},
    {name:'The third ingredient',bugs:14,rows:5,colors:3,fall:.90,lock:.58,rewinds:3},
    {name:'Chain reaction',bugs:18,rows:6,colors:3,fall:.78,lock:.56,rewinds:3},
    {name:'The busy dispensary',bugs:22,rows:7,colors:3,fall:.68,lock:.54,rewinds:3},
    {name:'Chief chemist',bugs:26,rows:8,colors:3,fall:.43,lock:.36,rewinds:1},
    {name:'The perfect formula',bugs:30,rows:9,colors:3,fall:.27,lock:.24,rewinds:0}
  ];
  const clone=b=>b.map(row=>row.map(c=>c?{...c}:null));
  function random(s){s.rng^=s.rng<<13;s.rng^=s.rng>>>17;s.rng^=s.rng<<5;return(s.rng>>>0)/4294967296;}
  function matches(b){const out=new Set();for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!b[y][x])continue;for(const [dx,dy]of[[1,0],[0,1]]){let n=1;while(x+n*dx<W&&y+n*dy<H&&b[y+n*dy][x+n*dx]?.c===b[y][x].c)n++;if(n>=4)for(let k=0;k<n;k++)out.add((y+k*dy)*W+x+k*dx);}}return[...out];}
  function cells(p){const dirs=[[1,0],[0,1],[-1,0],[0,-1]],d=dirs[p.r];return[{x:p.x,y:p.y,c:p.a},{x:p.x+d[0],y:p.y+d[1],c:p.b}];}
  function fits(s,p){return cells(p).every(c=>c.x>=0&&c.x<W&&c.y>=0&&c.y<H&&!s.board[c.y][c.x]);}
  function nextPair(s){const counts=[0,0,0];for(const row of s.board)for(const c of row)if(c?.bug)counts[c.c]++;const colors=counts.flatMap((n,c)=>n?[c]:[]);if(!colors.length)colors.push(0,1);const a=colors[Math.floor(random(s)*colors.length)],b=colors[Math.floor(random(s)*colors.length)];return[a,b];}
  function spawn(s){while(s.queue.length<4)s.queue.push(nextPair(s));const [a,b]=s.queue.shift();s.piece={x:3,y:0,r:0,a,b};s.fall=0;s.ground=0;s.adjustments=0;s.usedHold=false;s.phase='fall';if(!fits(s,s.piece)){s.phase='lost';s.message='The bottle is full. Rewind a dose or try this lab again.';}}
  function create(level=1,seed=19,score=0){level=Math.max(1,Math.min(7,level));const salts=[0,0,-17,-17,-18,-4,-18];const s={level,seed,rng:(seed+salts[level-1]+level*7099)|0,cfg:LEVELS[level-1],board:Array.from({length:H},()=>Array(W).fill(null)),queue:[],hold:null,phase:'fall',piece:null,score,bank:score,cleared:0,doses:0,rewinds:LEVELS[level-1].rewinds,history:[],serial:0,time:0,timer:0,chain:0,flash:[],message:'Match four of the same symbol. Clear every microbe.',event:0};
    // Fixed microbes float; capsules alone obey gravity. Reject pre-cleared groups.
    let placed=0;
    // The opening's two trios teach both a four-match and split-half gravity.
    if(level===1){for(const [y,x0,c]of[[13,0,0],[12,5,1]])for(let x=x0;x<x0+3;x++){s.board[y][x]={c,bug:true,id:0};placed++;}}
    while(placed<s.cfg.bugs){const x=Math.floor(random(s)*W),y=H-1-Math.floor(random(s)*s.cfg.rows);if(s.board[y][x])continue;const c=Math.floor(random(s)*s.cfg.colors);s.board[y][x]={c,bug:true,id:0};if(matches(s.board).length)s.board[y][x]=null;else placed++;}
    spawn(s);return s;
  }
  function move(s,dx,dy=0){if(s.phase!=='fall')return false;const p={...s.piece,x:s.piece.x+dx,y:s.piece.y+dy};if(!fits(s,p))return false;s.piece=p;if(s.adjustments++<10)s.ground=0;return true;}
  function rotate(s,dir=1){if(s.phase!=='fall')return false;for(const [dx,dy]of[[0,0],[-1,0],[1,0],[0,-1]]){const p={...s.piece,r:(s.piece.r+dir+4)%4,x:s.piece.x+dx,y:s.piece.y+dy};if(fits(s,p)){s.piece=p;if(s.adjustments++<10)s.ground=0;return true;}}return false;}
  function ghost(s){if(!s.piece)return[];const p={...s.piece};while(fits(s,{...p,y:p.y+1}))p.y++;return cells(p);}
  function hold(s){if(s.phase!=='fall'||s.usedHold)return false;const pair=[s.piece.a,s.piece.b],old=s.hold;s.hold=pair;if(old){s.piece={x:3,y:0,r:0,a:old[0],b:old[1]};s.fall=0;s.ground=0;if(!fits(s,s.piece))s.phase='lost';}else spawn(s);s.usedHold=true;s.event++;s.message='Reserve swapped. One swap per capsule.';return true;}
  function checkpoint(s){return{board:clone(s.board),queue:s.queue.map(p=>[...p]),hold:s.hold?[...s.hold]:null,rng:s.rng,score:s.score,cleared:s.cleared,doses:s.doses,serial:s.serial,piece:{...s.piece,x:3,y:0,r:0}};}
  function lock(s){if(s.phase!=='fall')return;s.history.push(checkpoint(s));if(s.history.length>4)s.history.shift();const id=++s.serial;for(const c of cells(s.piece))s.board[c.y][c.x]={c:c.c,bug:false,id};s.piece=null;s.doses++;s.chain=0;scan(s);}
  function drop(s){if(s.phase!=='fall')return false;while(move(s,0,1)){}lock(s);return true;}
  function scan(s){s.flash=matches(s.board);if(s.flash.length){s.chain++;s.phase='clear';s.timer=.32;s.event++;}else if(s.board.every(r=>r.every(c=>!c?.bug))){s.phase='won';s.message='Every microbe cleared!';s.event++;}else spawn(s);}
  function remove(s){let bugs=0;for(const i of s.flash){const c=s.board[Math.floor(i/W)][i%W];if(c?.bug)bugs++;s.board[Math.floor(i/W)][i%W]=null;}s.score+=(s.flash.length*20+bugs*180)*s.chain;s.cleared+=bugs;s.message=s.chain>1?`${s.chain}× CHAIN · ${bugs} microbes cleared`:`${bugs?bugs+' microbes cleared':'Four matched'} · make room for the next dose`;s.flash=[];s.phase='settle';s.timer=.075;}
  function gravity(b){let moved=false;const visited=new Set();for(let y=H-1;y>=0;y--)for(let x=0;x<W;x++){const c=b[y][x];if(!c||c.bug||visited.has(c.id))continue;visited.add(c.id);let group=[];for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(b[yy][xx]&&!b[yy][xx].bug&&b[yy][xx].id===c.id)group.push({x:xx,y:yy,c:b[yy][xx]});
      if(group.every(p=>p.y+1<H&&(!b[p.y+1][p.x]||group.some(q=>q.x===p.x&&q.y===p.y+1)))){for(const p of group)b[p.y][p.x]=null;for(const p of group)b[p.y+1][p.x]=p.c;moved=true;}}
    return moved;
  }
  function rewind(s){if(!s.rewinds||!s.history.length||s.phase==='won')return false;const h=s.history.pop(),left=s.rewinds-1;Object.assign(s,h);s.board=clone(h.board);s.rewinds=left;s.phase='fall';s.timer=0;s.fall=0;s.ground=0;s.adjustments=0;s.flash=[];s.chain=0;s.usedHold=false;s.message='Dose rewound. Try a different placement.';s.event++;return true;}
  function tick(s,dt,soft=false){dt=Math.min(.05,dt);if(['won','lost'].includes(s.phase))return;s.time+=dt;if(s.phase==='fall'){s.fall+=dt;if(fits(s,{...s.piece,y:s.piece.y+1})){s.ground=0;if(s.fall>=(soft?.045:s.cfg.fall)){s.fall=0;move(s,0,1);}}else{s.ground+=dt;if(s.ground>=s.cfg.lock)lock(s);}}else{s.timer-=dt;if(s.timer<=0){if(s.phase==='clear')remove(s);else if(gravity(s.board))s.timer=.075;else scan(s);}}}
  function settle(s){let n=0;while(!['fall','won','lost'].includes(s.phase)&&n++<1000)tick(s,.05);return s;}
  const api={W,H,LEVELS,create,cells,fits,matches,move,rotate,ghost,hold,drop,lock,rewind,tick,settle,clone,gravity};
  if(typeof module!=='undefined')module.exports=api;else root.CureEngine=api;
})(typeof window!=='undefined'?window:globalThis);

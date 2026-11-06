/* Shared by the game and its deterministic verification controller. */
((root) => {
  'use strict';
  const W=540,H=680,R=21,P=43,DY=P*Math.sqrt(3)/2,COLS=10;
  const levels=[
    {name:'Sheltered shallows',rows:3,colors:3,shots:12,tide:6},
    {name:'Kelp corridor',rows:4,colors:3,shots:14,tide:6},
    {name:'Anemone arch',rows:5,colors:4,shots:19,tide:5},
    {name:'Blue grotto',rows:6,colors:4,shots:21,tide:5},
    {name:'The pearl garden',rows:7,colors:5,shots:19,tide:5},
    {name:'Abyssal crown',rows:8,colors:5,shots:17,tide:4},
    {name:'The twilight reef',rows:9,colors:5,shots:16,tide:3},
    {name:'Moonlit trench',rows:9,colors:5,shots:21,tide:4},
    {name:'The last reef',rows:9,colors:5,shots:22,tide:3}
  ];
  const key=(r,c)=>r+','+c;
  const xy=(r,c,drop=0)=>({x:66+c*P+(r%2)*P/2,y:62+r*DY+drop});
  function neighbors(r,c){return [[r,c-1],[r,c+1],[r-1,c+(r%2?0:-1)],[r-1,c+(r%2?1:0)],[r+1,c+(r%2?0:-1)],[r+1,c+(r%2?1:0)]].filter(([a,b])=>a>=0&&b>=0&&b<COLS);}
  function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
  function color(s){const colors=[...new Set(Object.values(s.board))].sort();return colors[Math.floor(random(s)*colors.length)]??0;}
  function create(level=1){const cfg=levels[level-1],s={level,board:{},seed:127+level*177,drop:0,shots:cfg.shots,misses:0,popped:0,fallen:0,score:0,turn:0,status:'playing',current:0,next:0,last:null};
    for(let r=0;r<cfg.rows;r++)for(let c=0;c<COLS;c++){
      // Interlocking two-row shoals. Higher reefs break the shoals into smaller pockets.
      const group=level===1?Math.floor(c/3):level===2||level===4?Math.floor((c+(Math.floor(r/2)%2))/2):Math.floor((c+(Math.floor(r/2)%2))/3);
      s.board[key(r,c)]=(group+Math.floor(r/2)*2+level-1)%cfg.colors;
    }
    s.current=color(s);s.next=color(s);return s;
  }
  function trace(s,angle){let x=W/2,y=610,dx=Math.sin(angle),dy=-Math.cos(angle),bank=0;const points=[{x,y}];let hit=null;
    const actors=Object.keys(s.board).map(id=>{const[r,c]=id.split(',').map(Number);return {id,...xy(r,c,s.drop)};});
    for(let i=0;i<1400;i++){
      x+=dx*3;y+=dy*3;
      if(x<45+R||x>495-R){x=Math.max(45+R,Math.min(495-R,x));dx=-dx;bank++;points.push({x,y});}
      if(y<=62+s.drop){hit='ceiling';break;}
      for(const p of actors){if((p.x-x)**2+(p.y-y)**2<(R*2-1)**2){hit=p.id;break;}}
      if(hit)break;
    }
    points.push({x,y});if(!hit)return {slot:null,points,bank};
    const candidates=hit==='ceiling'?Array.from({length:COLS},(_,c)=>[0,c]):neighbors(...hit.split(',').map(Number));
    let best=null,dist=Infinity;for(const [r,c]of candidates){if(key(r,c)in s.board)continue;const p=xy(r,c,s.drop),d=(p.x-x)**2+(p.y-y)**2;if(d<dist){dist=d;best={r,c,...p};}}
    return {slot:best,points,bank};
  }
  function cluster(board,start){const type=board[start],seen=new Set([start]),todo=[start];while(todo.length){const [r,c]=todo.pop().split(',').map(Number);for(const [a,b]of neighbors(r,c)){const k=key(a,b);if(!seen.has(k)&&board[k]===type){seen.add(k);todo.push(k);}}}return [...seen];}
  function resolve(s,path){if(s.status!=='playing'||!path.slot)return null;const {r,c}=path.slot,k=key(r,c),type=s.current;s.board[k]=type;s.shots--;s.turn++;
    const group=cluster(s.board,k),removed=[],fall=[];
    if(group.length>=3){for(const id of group){removed.push({id,type:s.board[id]});delete s.board[id];}
      const linked=new Set(Object.keys(s.board).filter(id=>id.startsWith('0,'))),todo=[...linked];while(todo.length){const [a,b]=todo.pop().split(',').map(Number);for(const [nr,nc]of neighbors(a,b)){const id=key(nr,nc);if(id in s.board&&!linked.has(id)){linked.add(id);todo.push(id);}}}
      for(const id in s.board)if(!linked.has(id)){fall.push({id,type:s.board[id]});delete s.board[id];}
      s.popped+=removed.length;s.fallen+=fall.length;s.score+=removed.length*50+fall.length*100+(path.bank?75:0);s.misses=0;
    }else{s.misses++;if(s.misses>=levels[s.level-1].tide){s.drop+=DY;s.misses=0;}}
    const remaining=Object.keys(s.board);if(!remaining.length){s.status='clear';s.score+=s.shots*100;}else if(s.shots<=0||remaining.some(id=>{const[a,b]=id.split(',').map(Number);return xy(a,b,s.drop).y+R>=551;}))s.status='over';
    s.current=s.next;if(!Object.values(s.board).includes(s.current))s.current=color(s);s.next=color(s);
    return s.last={removed,fall,bank:path.bank,slot:path.slot,type};
  }
  function shot(s,a){return resolve(s,trace(s,a));}
  function clone(s){return {...s,board:{...s.board},last:null};}
  const api={W,H,R,P,DY,COLS,levels,key,xy,neighbors,create,trace,resolve,shot,clone};
  if(typeof module!=='undefined')module.exports=api;else root.PearlEngine=api;
})(typeof window==='undefined'?globalThis:window);

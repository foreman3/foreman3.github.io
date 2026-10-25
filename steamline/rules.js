/* Fifty deterministic puzzle contracts. The witness route proves construction
   feasibility; the flow evaluator accepts any route meeting the same rules. */
(function (root) {
  'use strict';
  const W = 8, H = 6, D = [[0,-1],[1,0],[0,1],[-1,0]];
  const key = p => p[1] * W + p[0], xy = k => [k % W, Math.floor(k / W)];
  const direction = (a,b) => D.findIndex(d => a[0]+d[0]===b[0] && a[1]+d[1]===b[1]);
  const connections = (kind,r=0) => kind === 'I' ? [r%2,r%2+2] : [r%4,(r+1)%4];
  function fitting(a,b) {
    if(a<0||b<0||a===b) throw Error('Invalid witness connection');
    const kind = (a+2)%4===b ? 'I' : 'L';
    for(let r=0;r<4;r++) if(connections(kind,r).every(d=>d===a||d===b)) return {kind,r};
  }
  function rng(seed) { return () => { seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function line(points) {
    const out=[points[0]];
    for(const p of points.slice(1)) {
      let [x,y]=out.at(-1);
      while(x!==p[0]||y!==p[1]) { x+=Math.sign(p[0]-x); y+=Math.sign(p[1]-y); out.push([x,y]); }
    }
    return out;
  }
  function simpleRoute(level,target) {
    for(let attempt=0;attempt<40;attempt++) {
      const random=rng(level*7187+attempt*139), sy=1+(level%4), dy=1+((level*3+1)%4);
      const start=[0,sy],end=[7,dy],path=[start],seen=new Set([key(start)]);
      let wanted=target; if((wanted-1-(7+Math.abs(sy-dy)))%2)wanted++;
      let visits=0;
      function walk(p) {
        if(++visits>120000)return false;
        if(key(p)===key(end))return path.length===wanted;
        const remain=wanted-path.length, dist=Math.abs(7-p[0])+Math.abs(dy-p[1]);
        if(dist>remain||remain<=0)return false;
        const choices=D.map(d=>[p[0]+d[0],p[1]+d[1]]).filter(n=>n[0]>=0&&n[0]<W&&n[1]>=0&&n[1]<H&&!seen.has(key(n)))
          .map(n=>({n,order:random()})).sort((a,b)=>a.order-b.order);
        for(const {n} of choices) {
          if(path.length===1&&(n[0]!==1||n[1]!==sy))continue;
          if(key(n)===key(end)&&(path.length!==wanted-1||p[0]!==6||p[1]!==dy))continue;
          seen.add(key(n));path.push(n);if(walk(n))return true;path.pop();seen.delete(key(n));
        }
        return false;
      }
      if(walk(start))return path;
    }
    throw Error('No route for contract '+level);
  }
  const districts=[
    ['APPRENTICE ROW','Make room for a longer run. There is no countdown.'],
    ['THE LAUNDRY QUARTER','Connect every numbered service ring, in any order.'],
    ['CHECK VALVE WORKS','Every arrow valve is compulsory. Enter at its tail; leave through its point.'],
    ['THE FITTING EXCHANGE','Stock is limited. Lift a pipe to refund it, or undo freely.'],
    ['OVERPASS DISTRICT','Use both independent lanes of the bridge. Steam crosses without turning.'],
    ['UNDERGROUND MAIL','Enter A at its arrow, then continue from the matching underground exit.'],
    ['THE GATEHOUSE','Visit S to open G before sending steam through the gate.'],
    ['THE REHEATING HOUSE','H refills heat. Each later square costs one heat; reach the receiver hot.'],
    ['RADIATOR GARDENS','Each R needs and consumes three heat, in addition to travel.'],
    ['THE CITY CIRCUIT','Deliver to rings in numerical order. Use everything you have learned.']
  ];
  function makeContract(level) {
    const chapter=Math.floor((level-1)/5),part=(level-1)%5,random=rng(level*9829);
    const bridge = chapter===4 || (chapter===5&&part>=3) || (chapter===6&&part===4) ||
      (chapter===7&&part===4) || (chapter===8&&part>=2) || (chapter===9&&[1,3,4].includes(part));
    const portal = chapter===5 || (chapter===6&&part>=2) || (chapter===7&&part>=3) ||
      (chapter===8&&part===4) || (chapter===9&&part>=2);
    const switched=chapter===6||(chapter===7&&part>=2)||(chapter===8&&part>=3)||chapter===9;
    const heated=chapter>=7, radiators=chapter>=8, ordered=chapter===9;
    const budget=chapter===3||(chapter===4&&part>=3)||chapter===6||chapter>=8;
    const arrows=chapter===2||chapter===3||(chapter===4&&part>=2)||chapter===5||
      (chapter===7&&part>=1)||chapter===9;
    let route,bridgeKey=null;
    if(bridge) {
      const sy=2+(level%2),cx=2+(level%3),right=6,top=level%2,bottom=5;
      route=line([[0,sy],[right,sy],[right,top],[cx,top],[cx,bottom],[6,bottom],[6,4],[7,4]]);
      if(level%4>=2)route=route.map(([x,y])=>[x,5-y]);
      const counts=new Map();for(const p of route)counts.set(key(p),(counts.get(key(p))||0)+1);
      bridgeKey=[...counts].find(([,n])=>n===2)?.[0];
      if(bridgeKey===undefined)throw Error('Bridge witness missing');
    } else route=simpleRoute(level,9+chapter*2+Math.floor(part*.8));
    let ports=null;
    if(portal) {
      const candidates=[];
      for(let i=2;i<route.length-7;i++)for(let j=i+3;j<=Math.min(i+5,route.length-3);j++) {
        if(route.slice(i,j+1).some(p=>key(p)===bridgeKey))continue;
        if(Math.abs(route[i][0]-route[j][0])+Math.abs(route[i][1]-route[j][1])<2)continue;
        candidates.push([i,j]);
      }
      if(!candidates.length)throw Error('Portal witness missing '+level);
      const [i,j]=candidates[Math.floor(random()*candidates.length)];
      ports={a:key(route[i]),b:key(route[j]),entry:direction(route[i],route[i-1]),exit:direction(route[j],route[j+1])};
      route=[...route.slice(0,i+1),...route.slice(j)];
    }
    const c={level,chapter,part,name:districts[chapter][0]+' · '+(part+1),lesson:districts[chapter][1],
      route,source:key(route[0]),drain:key(route.at(-1)),bridge:bridgeKey,ports,
      ordered,capacity:0,marks:{},fixed:{},blocks:[],goals:[],budget:null,par:0};
    const reserved=new Set([c.source,c.drain]);if(bridgeKey!==null)reserved.add(bridgeKey);
    if(ports){reserved.add(ports.a);reserved.add(ports.b);}
    const choose=(fraction)=> {
      const desired=Math.floor((route.length-1)*fraction);
      const choices=route.map((p,i)=>({k:key(p),i})).filter(v=>!reserved.has(v.k))
        .sort((a,b)=>Math.abs(a.i-desired)-Math.abs(b.i-desired));
      if(!choices.length)throw Error('No marker square '+level);
      const choice=choices[0];reserved.add(choice.k);return choice;
    };
    const addGoal=(k,type,label,axis=null)=>c.goals.push({k,type,label,axis,token:type+':'+k+(axis===null?'':':'+axis)});
    if(bridgeKey!==null) { c.fixed[bridgeKey]={kind:'B',fixed:true};addGoal(bridgeKey,'bridge','Bridge horizontal',1);addGoal(bridgeKey,'bridge','Bridge vertical',0); }
    if(ports) { c.fixed[ports.a]={kind:'A',fixed:true,entry:ports.entry,pair:ports.b};c.fixed[ports.b]={kind:'T',fixed:true,exit:ports.exit};addGoal(ports.b,'tunnel','Underground delivery'); }
    const rings=chapter===0?0:chapter===1?(part<3?1:2):chapter<8?2:3;
    for(let n=0;n<rings;n++) { const p=choose((n+1)/(rings+1));c.marks[p.k]={type:'ring',number:n+1};addGoal(p.k,'ring','Ring '+(n+1)); }
    if(arrows) {
      const p=choose(.27),a=direction(route[p.i],route[p.i-1]),b=direction(route[p.i],route[p.i+1]);
      c.fixed[p.k]={...fitting(a,b),fixed:true,valve:b,valveEntry:a};addGoal(p.k,'valve','Arrow valve');
    }
    if(switched) {
      const s=choose(.19),g=choose(.69);c.marks[s.k]={type:'switch'};addGoal(s.k,'switch','Switch S');
      c.fixed[g.k]={...fitting(direction(route[g.i],route[g.i-1]),direction(route[g.i],route[g.i+1])),fixed:true,gate:true};addGoal(g.k,'gate','Gate G');
    }
    let heaterIndex=-1,radiatorCount=0;
    if(heated) {
      const p=choose(.47);heaterIndex=p.i;c.marks[p.k]={type:'heater'};addGoal(p.k,'heater','Heater H');
      if(radiators)for(const fraction of part>=3?[.72,.88]:[.78]) { const r=choose(fraction);c.marks[r.k]={type:'radiator'};addGoal(r.k,'radiator','Radiator R');radiatorCount++; }
      c.capacity=route.length-1-heaterIndex+radiatorCount*3+(part===0?4:2);
    }
    // A few anchored fittings constrain approaches without filling the solution.
    const anchorCount=level<3?0:1+Math.floor(part/3);
    for(let n=0;n<anchorCount;n++) {
      const p=choose(.12+n*.7),a=direction(route[p.i],route[p.i-1]),b=direction(route[p.i],route[p.i+1]);
      c.fixed[p.k]={...fitting(a,b),fixed:true,anchor:true};
    }
    c.minimum=new Set(route.map(key)).size-(level<3?1:part===0?2:0);
    const routeKeys=new Set(route.map(key)),free=Array.from({length:48},(_,k)=>k).filter(k=>!routeKeys.has(k));
    // Explicit shuffle keeps saved boards identical across browser engines.
    for(let i=free.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[free[i],free[j]]=[free[j],free[i]];}
    c.blocks=free.slice(0,Math.min(3+chapter,free.length-3));
    const solution=buildSolution(c),counts={I:0,L:0};
    for(const t of solution)if(t&&!t.fixed&&!t.block)counts[t.kind]++;
    c.par=counts.I+counts.L;
    if(budget)c.budget={I:counts.I+(part===0?3:part<4?2:1),L:counts.L+(part===0?2:1)};
    return c;
  }
  function initial(c) {
    const board=Array(48).fill(null);
    for(const k of c.blocks)board[k]={block:true,fixed:true};
    for(const [k,t] of Object.entries(c.fixed))board[k]={...t};
    board[c.source]={kind:'I',r:1,fixed:true,source:true};board[c.drain]={kind:'I',r:1,fixed:true,drain:true};
    return board;
  }
  function buildSolution(c) {
    const board=initial(c);
    for(let i=1;i<c.route.length-1;i++) {
      const k=key(c.route[i]);if(board[k]?.fixed)continue;
      board[k]=fitting(direction(c.route[i],c.route[i-1]),direction(c.route[i],c.route[i+1]));
    }
    return board;
  }
  function trace(c,board) {
    const steps=[],seen=new Set(),unique=new Set(),done=new Set(),bridgeAxes={};
    let k=c.source,entry=3,switched=false,heat=0,nextRing=1;
    const counts={I:0,L:0};for(const t of board)if(t&&!t.fixed&&!t.block&&counts[t.kind]!==undefined)counts[t.kind]++;
    const summary=(ok,message,at=k)=>({ok,message,at,steps,done:[...done],unique:[...unique],heat,counts,bridgeAxes,
      unused:board.filter((t,i)=>t&&!t.fixed&&!t.block&&!unique.has(i)).length});
    if(c.budget&&(counts.I>c.budget.I||counts.L>c.budget.L))return summary(false,'The fitting stock is exceeded. Lift an unused fitting.');
    for(let guard=0;guard<160;guard++) {
      const t=board[k],coord=xy(k),place='column '+(coord[0]+1)+', row '+(coord[1]+1);
      if(!t||t.block)return summary(false,'Open end at '+place+'. Fit a connecting pipe here.');
      if(t.kind==='A'&&entry!==t.entry)return summary(false,'Enter tunnel A through its tail.');
      if(t.kind==='T'&&entry!==-1)return summary(false,'This is the tunnel exit. Enter at A instead.');
      if(!['A','T','B'].includes(t.kind)&&!connections(t.kind,t.r).includes(entry))return summary(false,'The pipe at '+place+' faces away from the incoming steam.');
      if(t.valve!==undefined&&entry!==t.valveEntry)return summary(false,'Approach the arrow valve from its tail.');
      if(t.gate&&!switched)return summary(false,'Gate G is shut. Visit switch S before the gate.');
      const axis=t.kind==='B'?entry%2:null,token=k+':'+(axis===null?'pipe':axis);
      if(seen.has(token))return summary(false,'This run loops back into the same pipe lane.');
      seen.add(token);unique.add(k);
      if(t.kind==='B')bridgeAxes[k]=(bridgeAxes[k]||0)|(axis===0?1:2);
      const mark=c.marks[k];
      if(c.capacity)heat=mark?.type==='heater'?c.capacity:Math.max(0,heat-1);
      if(mark?.type==='switch')switched=true;
      if(mark?.type==='ring'&&c.ordered) {
        if(mark.number!==nextRing)return summary(false,'Visit the rings in order: '+nextRing+' comes next.');
        nextRing++;
      }
      if(mark?.type==='radiator') {
        if(heat<3)return summary(false,'Radiator R needs three heat. Reach heater H first, then shorten the hot run.');
        heat-=3;
      }
      for(const goal of c.goals)if(goal.k===k&&(goal.axis===null||goal.axis===axis))done.add(goal.token);
      steps.push({k,entry,heat,switched,done:[...done],axis});
      if(t.drain) {
        if(done.size<c.goals.length)return summary(false,'Receiver reached. Still needed: '+c.goals.filter(g=>!done.has(g.token)).map(g=>g.label).slice(0,4).join(', ')+'.');
        if(unique.size<c.minimum)return summary(false,'The route has '+unique.size+' squares; it needs '+c.minimum+'. Add a detour.');
        if(c.capacity&&heat<1)return summary(false,'The receiver is cold. Keep the route after heater H shorter.');
        return summary(true,'The district is warm.');
      }
      if(t.kind==='A'){k=t.pair;entry=-1;continue;}
      const exit=t.kind==='B'?(entry+2)%4:t.kind==='T'?t.exit:t.valve??connections(t.kind,t.r).find(d=>d!==entry);
      const [dx,dy]=D[exit],nx=coord[0]+dx,ny=coord[1]+dy;
      if(nx<0||nx>=W||ny<0||ny>=H)return summary(false,'The pipe runs off the board. Turn it back into the workshop.',k);
      k=ny*W+nx;entry=(exit+2)%4;
    }
    return summary(false,'This route repeats too many pipe lanes.');
  }
  const contracts=Array.from({length:50},(_,i)=>makeContract(i+1));
  const api={W,H,D,key,xy,direction,connections,fitting,initial,buildSolution,trace,contracts,districts};
  root.SteamlineRules=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);

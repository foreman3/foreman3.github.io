export const movements = [
  {name:'Winding Room', rows:4, double:[], triple:[], ratchets:[], beat:4, patrols:['rim']},
  {name:'Minute Train', rows:5, double:[4,8,12], triple:[], ratchets:[], beat:4, patrols:['rim']},
  {name:'Twin Barrels', rows:5, double:[1,4,6,7,10,13], triple:[], ratchets:[12], beat:3, patrols:['chaser']},
  {name:'Quarter Strike', rows:6, double:[3,5,8,12,15,18], triple:[10], ratchets:[13,20], beat:3, patrols:['rim','bell']},
  {name:'The Escapement', rows:6, double:[1,3,5,6,9,10,15,17], triple:[7,13], ratchets:[11,18,20], beat:2, patrols:['rim','chaser']},
  {name:'Sidereal Dial', rows:7, double:[4,6,8,10,14,16,20,21,24], triple:[13,18,26], ratchets:[7,15,22,27], beat:2, patrols:['bell','chaser']},
  {name:'Midnight Chime', rows:7, double:[2,4,6,8,11,16,20,21,24], triple:[12,17,26], ratchets:[5,10,15,22,25,27], beat:2, patrols:['rim','bell','chaser']}
];
export const steps = {nw:[-1,-1],ne:[-1,0],sw:[1,0],se:[1,1]};
export const numberAt = (r,c)=>r*(r+1)/2+c;
export function position(id) {
  const r=Math.floor((Math.sqrt(8*id+1)-1)/2);
  return {r,c:id-numberAt(r,0)};
}
export function adjacent(state, at, direction) {
  const {r,c}=position(at),[dr,dc]=steps[direction];
  const row=r+dr,col=c+dc;
  return row>=0 && row<state.spec.rows && col>=0 && col<=row ? numberAt(row,col) : -1;
}
function initialPatrol(type,rows){
  const base=numberAt(rows-1,0);
  if(type==='chaser')return {type,at:base+rows-1,path:[],index:0};
  const path=[];
  if(type==='rim'){
    for(let c=0;c<rows;c++)path.push(base+c);
    for(let r=rows-2;r>0;r--)path.push(numberAt(r,r));
    for(let r=2;r<rows-1;r++)path.push(numberAt(r,0));
  }else{
    for(let r=1;r<rows;r++)path.push(numberAt(r,Math.floor(r/2)));
    for(let r=rows-2;r>1;r--)path.push(numberAt(r,Math.min(r,Math.floor(r/2)+1)));
  }
  return {type,at:path[0],path,index:0};
}
export function newMovement(index=0){
  const encore=index-movements.length;
  const spec=encore<0?movements[index]:movements[4+encore%3],count=numberAt(spec.rows,0);
  const tiles=Array.from({length:count},(_,i)=>({
    charge:i===0?1:0,need:spec.triple.includes(i)?3:spec.double.includes(i)?2:1,ratchet:spec.ratchets.includes(i)
  }));
  if(encore>=0 && Math.floor(encore/3)%2===0){
    for(let r=1;r<spec.rows;r++)for(let c=0;c<(r+1)/2;c++){
      const a=numberAt(r,c),b=numberAt(r,r-c);
      [tiles[a],tiles[b]]=[tiles[b],tiles[a]];
    }
  }
  return {index,spec,tiles,at:0,hops:0,beat:0,lives:3,lifts:[true,true],rewinds:1,
    enemies:spec.patrols.map(type=>initialPatrol(type,spec.rows)),phase:'playing',previous:null};
}
export function forecast(s) {
  return s.enemies.map(e=>{
    if(s.beat+1<s.spec.beat)return e.at;
    if(e.type!=='chaser')return e.path[(e.index+1)%e.path.length];
    const target=position(s.at);
    // In diagonal coordinates (column, row-column), a hop changes one axis.
    const distance=id=>{const p=position(id);return Math.abs(p.c-target.c)+Math.abs((p.r-p.c)-(target.r-target.c));};
    const options=Object.keys(steps).map(d=>adjacent(s,e.at,d)).filter(id=>id>0);
    return options.sort((a,b)=>distance(a)-distance(b)||a-b)[0]??e.at;
  });
}
export function liftAt(s,at,direction){
  const {r,c}=position(at);
  if(r!==s.spec.rows-2)return -1;
  if(direction==='nw'&&c===0&&s.lifts[0])return 0;
  if(direction==='ne'&&c===r&&s.lifts[1])return 1;
  return -1;
}
export function hop(s,direction){
  if(s.phase!=='playing'||!steps[direction])return null;
  const from=s.at, dest=adjacent(s,from,direction), lift=liftAt(s,from,direction);
  s.previous={at:from,charges:s.tiles.map(t=>t.charge),hops:s.hops,beat:s.beat,lives:s.lives,lifts:[...s.lifts],
    patrol:s.enemies.map(e=>[e.at,e.index])};
  const next=forecast(s), chime=s.beat+1===s.spec.beat;
  s.hops++;s.beat=(s.beat+1)%s.spec.beat;
  s.enemies.forEach((e,i)=>{if(chime&&e.path.length)e.index=(e.index+1)%e.path.length;e.at=next[i];});
  if(lift!==-1){s.lifts[lift]=false;s.at=0;return {from,to:0,direction,kind:'lift',chime};}
  if(dest<0 || next.includes(dest)){
    s.lives--;s.at=0;s.beat=0;
    s.enemies=s.spec.patrols.map(type=>initialPatrol(type,s.spec.rows));
    if(!s.lives)s.phase='lost';
    return {from,to:dest,direction,kind:dest<0?'fall':'hit',chime};
  }
  s.at=dest;
  const tile=s.tiles[dest],old=tile.charge;
  tile.charge=tile.ratchet && old===tile.need ? 0 : Math.min(tile.need,old+1);
  if(s.tiles.every(t=>t.charge===t.need))s.phase='won';
  return {from,to:dest,direction,chime,kind:tile.charge<old?'unwind':old===tile.charge?'step':tile.charge===tile.need?'lit':'charge'};
}
export function rewind(s){
  const back=s.previous;
  if(!s.rewinds||!back||s.phase==='won')return false;
  s.at=back.at;s.hops=back.hops;s.beat=back.beat;s.lives=back.lives;s.lifts=back.lifts;
  s.tiles.forEach((tile,i)=>tile.charge=back.charges[i]);
  s.enemies.forEach((e,i)=>{[e.at,e.index]=back.patrol[i];});
  s.rewinds--;s.previous=null;s.phase='playing';return true;
}

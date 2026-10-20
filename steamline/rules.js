/* N, E, S, W. Every contract has a verified example route, but play accepts
   any simple route meeting its length, service-ring and one-way constraints. */
window.SteamlineRules=(()=>{
 const D=[[0,-1],[1,0],[0,1],[-1,0]];
 const line=(points)=>{const out=[points[0]];for(let n=1;n<points.length;n++){let [x,y]=out.at(-1);const [tx,ty]=points[n];while(x!==tx||y!==ty){x+=Math.sign(tx-x);y+=Math.sign(ty-y);out.push([x,y]);}}return out;};
 const specs=[
  ['THE APPRENTICE',[[0,2],[6,2],[6,3],[7,3]],24,1.8,8,[],[],[[3,0],[4,0],[3,5]]],
  ['THE LAUNDRY',[[0,4],[2,4],[2,1],[6,1],[6,3],[7,3]],21,1.65,12,[5],[],[[0,1],[1,1],[4,3],[4,4]]],
  ['THE BATHHOUSE',[[0,1],[1,1],[1,4],[4,4],[4,1],[6,1],[6,3],[7,3]],18,1.5,14,[5,11],[],[[3,0],[3,1],[3,2],[6,5],[7,5]]],
  ['THE GLASSWORKS',[[0,4],[2,4],[2,1],[5,1],[5,4],[6,4],[6,2],[7,2]],16,1.35,15,[4,10],[7],[[0,0],[1,2],[3,3],[4,3],[6,0],[7,0]]],
  ['THE NIGHT SHIFT',[[0,2],[1,2],[1,5],[4,5],[4,1],[6,1],[6,3],[7,3]],14,1.2,17,[5,12],[8],[[0,0],[2,1],[2,2],[3,3],[5,4],[7,5]]],
  ['THE CHIEF ENGINEER',[[0,4],[1,4],[1,1],[3,1],[3,5],[5,5],[5,0],[6,0],[6,3],[7,3]],8,.86,22,[4,10,17],[7,16],[[0,0],[2,3],[4,2],[7,0],[6,4]]],
  ['THE CITY NEVER SLEEPS',[[0,2],[1,2],[1,5],[3,5],[3,0],[5,0],[5,4],[6,4],[6,1],[7,1]],4,.64,23,[4,10,17],[7,15],[[0,0],[2,1],[2,3],[4,2],[7,3],[6,5]]]
 ];
 const contracts=specs.map((s,i)=>{const route=line(s[1]);return{name:s[0],route,headstart:s[2],interval:s[3],minimum:s[4],rings:s[5].map(k=>route[k]),valves:s[6].map(k=>({at:route[k],entry:D.findIndex(d=>d[0]===route[k-1][0]-route[k][0]&&d[1]===route[k-1][1]-route[k][1]),exit:D.findIndex(d=>d[0]===route[k+1][0]-route[k][0]&&d[1]===route[k+1][1]-route[k][1])})),blocks:s[7],seals:i<5?3:i===5?1:0,holds:i<5?2:i===5?1:0};});
 return{D,contracts,connections:(kind,r)=>kind==='I'?[r%2,(r%2)+2]:[r%4,(r+1)%4]};
})();

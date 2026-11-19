export const HEIGHT = 440;
export const GATE_WIDTH = 42;
export const HIT_RADIUS = 10;
const GRAVITY = 835;
const FLAP_SPEED = -268;

// Heights trace each coastline. The stamp offsets alternate sides of the
// opening, giving the pilot a choice between a wide line and a scoring line.
export const routes = [
  {name:'Pelican Bay', code:'PLB', sky:'dawn', gap:158, speed:145, spacing:232, drift:0, quota:2, heights:[222,198,240,208,176,216]},
  {name:'Kelp Sound', code:'KLP', sky:'day', gap:152, speed:151, spacing:229, drift:0, quota:3, heights:[220,175,226,258,213,165,198]},
  {name:'Fog Bell Point', code:'FBP', sky:'mist', gap:145, speed:156, spacing:226, drift:8, quota:3, heights:[215,258,232,171,202,257,193,215]},
  {name:'Copper Narrows', code:'CPN', sky:'amber', gap:135, speed:163, spacing:223, drift:13, quota:4, heights:[220,170,202,259,197,158,208,257]},
  {name:'Stormglass Reach', code:'SGR', sky:'squall', gap:125, speed:171, spacing:219, drift:18, quota:5, heights:[220,259,210,157,202,264,225,163,208]},
  {name:'Lantern Strait', code:'LNS', sky:'blue', gap:118, speed:178, spacing:214, drift:22, quota:5, heights:[217,169,223,271,221,158,206,253,188,220]},
  {name:'Last Light', code:'LST', sky:'night', gap:110, speed:185, spacing:209, drift:24, quota:6, heights:[220,173,218,270,215,158,209,258,206,165,220]}
];

const endless = {...routes.at(-1),name:'Night Express',code:'EXP',quota:0};
export function newFlight(index) {
  const route = routes[index] ?? endless;
  const f = {index,route,phase:'ready',y:220,vy:0,time:0,distance:0,gates:[],made:0,
    passed:0,stamps:0,chain:0,shield:false,grace:0,score:0,flapAge:1,reason:''};
  for (let i=0;i<(route===endless ? 6 : route.heights.length);i++) addGate(f);
  return f;
}
function addGate(f) {
  const i=f.made++, r=f.route;
  const base = r===endless ? 148+Math.random()*132 : r.heights[i];
  const sign = [1,-1,-1,1,-1,1][i%6];
  const inset = f.index < 3 ? 41-f.index*3 : 31;
  const offset = i===0 && f.index===0 ? 0 : sign * (r.gap/2-inset-(i%3)*5);
  f.gates.push({i,at:285+i*r.spacing,base,offset,stamp:false,passed:false,
    drift:i%3===0 ? 0 : r.drift,phase:i*1.91});
}
export function gateY(f,g) {
  return g.base + g.drift * Math.sin(f.time*1.6+g.phase);
}
export function flap(f) {
  if (f.phase==='ready') f.phase='flying';
  if (f.phase!=='flying') return;
  f.vy=FLAP_SPEED; f.flapAge=0;
}
export function advance(f,dt,notify=()=>{}) {
  if (f.phase!=='flying') return;
  f.time+=dt; f.distance+=f.route.speed*dt; f.flapAge+=dt;
  f.grace=Math.max(0,f.grace-dt);
  f.vy+=GRAVITY*dt; f.y+=f.vy*dt;
  const hitWall=f.y < HIT_RADIUS || f.y > HEIGHT-HIT_RADIUS;
  let hit=hitWall;
  let safeY=Math.max(65,Math.min(HEIGHT-65,f.y));
  for (const g of f.gates) {
    if (g.passed) continue;
    const dx=g.at-f.distance;
    if (dx>GATE_WIDTH/2+HIT_RADIUS) break;
    const cy=gateY(f,g);
    if (Math.abs(dx)<GATE_WIDTH/2+HIT_RADIUS && Math.abs(f.y-cy)>f.route.gap/2-HIT_RADIUS) {
      hit=true; safeY=cy;
    }
    if (!hit && !g.stamp && Math.hypot(dx,f.y-cy-g.offset)<24) {
      g.stamp=true; f.stamps++; f.chain++; f.score+=25; notify('stamp');
      if(f.chain===3){f.chain=0;f.shield=true;f.score+=25;notify('shield');}
    }
    if(dx < -GATE_WIDTH/2-HIT_RADIUS) {
      g.passed=true; f.passed++; f.score+=5;
      if(!g.stamp) f.chain=0;
      notify('gate');
    }
  }
  if(hit && !f.grace) {
    if(!f.shield){f.phase='lost';f.reason=hitWall?'Flight boundary':'Beacon strike';notify('lost');return;}
    f.shield=false; f.chain=0; f.grace=.78; f.y=safeY; f.vy=-70; notify('save');
  }
  if(f.grace && hitWall){f.y=safeY;f.vy=-70;}
  if(f.route===endless) {
    if(f.gates[0].at-f.distance < -450){f.gates.shift();addGate(f);}
  } else if(f.passed===f.gates.length) {
    f.phase=f.stamps>=f.route.quota?'delivered':'short';
    notify(f.phase);
  }
}

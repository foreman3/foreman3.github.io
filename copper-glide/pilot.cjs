const E=require('./engine.js');
function strategy(s,style=0){const q=s.q,p=s.p;
 if(style>=20){
  const x=[85,160,240,320][Math.floor((style-20)/12)%4],aim=[195,220,250,280,310,340,365,-119,-204,679,764,849][(style-20)%12];
  if(s.serve>0)return{x,y:280};
  if(q.vx<0){const t=Math.max(0,(x+40-q.x)/q.vx),y=E.reflect(q.y+t*q.vy),dx=970-x-40,dy=aim-y,len=Math.hypot(dx,dy),speed=Math.hypot(q.vx,q.vy);let nx=dx/len*speed-q.vx,ny=dy/len*speed-q.vy;const n=Math.hypot(nx,ny);return{x,y:y-ny/n*40};}return{x,y:280};
 }
 if(style>=2){
  const x=style>=8?300:style>=5?180:85;
  if(s.serve>0)return {x,y:280};
  if(q.vx<0){const t=Math.max(0,(x+40-q.x)/q.vx),y=E.reflect(q.y+t*q.vy);let aim=[220,340,280,76-280,1044-280][(style-2)%5];
   const dx=970-x-40,dy=aim-y,len=Math.hypot(dx,dy),speed=Math.hypot(q.vx,q.vy);let nx=dx/len*speed-q.vx,ny=dy/len*speed-q.vy;const n=Math.hypot(nx,ny);return{x,y:y-ny/n*39};}
  return {x,y:280};
 }
 if(s.serve>0)return {x:155,y:280};
 if(q.x>495){const y=q.vx<0?E.reflect(q.y+(160-q.x)/q.vx*q.vy):280;return {x:155,y};}
 const goal=style===1?(q.y<280?208:352):280;
 const ny=(goal-q.y)/(970-q.x),offset=ny*45;
 // Stay goal-side, then sweep forward through the approaching puck.
 if(p.x>q.x-20&&q.vx>0)return {x:Math.max(85,q.x-100),y:Math.max(70,Math.min(490,q.y+(q.y<280?95:-95)))};
 const t=Math.max(0,(q.x-p.x-40)/Math.max(200,-q.vx+650));
 return {x:Math.min(460,q.x+65),y:E.reflect(q.y+q.vy*t)-offset};
}
function target(s,style=0){const t=strategy(s,style);return{x:Math.round(Math.max(66,Math.min(465,t.x))*10)/10,y:Math.round(Math.max(66,Math.min(494,t.y))*10)/10};}
function pilot(level,style=0,concede=0,initial){const s=initial?structuredClone(initial):E.create(level),events=[];if(!initial)for(let i=0;i<concede;i++)E.goal(s,1);let tick=0;for(;tick<120*600&&s.status==='playing';tick+=6){const t=target(s,style);events.push({tick,...t});for(let k=0;k<6;k++)E.step(s,{pointer:true,...t},1/120);}return {s,events,ticks:tick};}
if(require.main===module)for(let l=1;l<=7;l++){let p=pilot(l);console.log(l,p.s.status,p.s.goals,p.s.rival,p.s.time.toFixed(1),p.s.hits);}
module.exports={pilot,target};

(function(root){
 'use strict';
 const W=2440,H=600,GROUND=510,LAND=486;
 const levels=[
  {name:'First light',people:[3,3,0],hull:4,time:160,guns:0,drones:0,wind:0,rate:4.8,speed:140},
  {name:'The watchtower',people:[4,4,0],hull:4,time:165,guns:1,drones:0,wind:0,rate:4.6,speed:145},
  {name:'Passing company',people:[4,3,3],hull:4,time:185,guns:1,drones:1,wind:0,rate:4.4,speed:155},
  {name:'Crosswind pass',people:[4,3,3],hull:4,time:180,guns:2,drones:1,wind:24,rate:4.2,speed:170},
  {name:'The far ridge',people:[4,4,4],hull:4,time:175,guns:3,drones:2,wind:28,rate:3.9,speed:185},
  {name:'Master pilot',people:[4,4,4],hull:2,time:100,guns:3,drones:2,wind:34,rate:3.3,speed:210},
  {name:'The last light',people:[4,4,4],hull:1,time:78,guns:3,drones:2,wind:38,rate:2.8,speed:230}
 ];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function create(level=1){level=clamp(level,1,7);const c=levels[level-1];return {level,status:'playing',time:0,x:160,y:LAND,vx:0,vy:0,face:1,hull:c.hull,hits:0,inv:0,aboard:0,saved:0,total:c.people.reduce((a,b)=>a+b,0),score:0,pads:[{x:160,left:0,id:0},...c.people.map((n,i)=>({x:[780,1470,2210][i],left:n,id:i+1}))],guns:[1080,1840,2040].slice(0,c.guns).map((x,i)=>({x,y:GROUND-18,hp:level>=5?3:2,timer:2+i*.85,aim:null})),drones:Array.from({length:c.drones},(_,i)=>({x:1180+i*700,y:170+i*80,hp:2,dir:i%2?-1:1,timer:3+i})),bullets:[],shots:[],events:[],fireCD:0,boardCD:0,last:'Fly right to pad 1. Release to hover; descend to land.',landed:0,cam:0,tick:0};}
 function hit(s,why){if(s.inv>0||s.status!=='playing')return;s.hull--;s.hits++;s.inv=2;s.events.push({type:'hit',x:s.x,y:s.y});s.last=why+' · '+s.hull+' hull left. Passengers safe.';if(s.hull<=0){s.status='over';s.last='Helicopter grounded. Everyone aboard is safe — retry the valley.';}}
 function step(s,dt,input={}){if(s.status!=='playing')return;const c=levels[s.level-1];dt=Math.min(dt,.05);s.tick++;s.time+=dt;s.inv=Math.max(0,s.inv-dt);s.fireCD-=dt;
  let ix=input.x||0,iy=input.y||0;const n=Math.hypot(ix,iy);if(n>1){ix/=n;iy/=n;}if(Math.abs(ix)>.08)s.face=Math.sign(ix);
  const wind=c.wind*Math.sin(s.time*.55)*Math.min(1,(LAND-s.y)/100);
  const assist=s.pads.some(p=>Math.abs(p.x-s.x)<67)&&s.y>410&&iy>0;
  s.vx+=(ix*255+wind-s.vx)*Math.min(1,dt*7);s.vy+=(iy*(assist?65:205)-s.vy)*Math.min(1,dt*7);s.x=clamp(s.x+s.vx*dt,40,W-40);s.y=clamp(s.y+s.vy*dt,64,LAND);
  const pad=s.pads.find(p=>Math.abs(p.x-s.x)<67);const onPad=pad&&s.y>=LAND-3;
  if(s.y>=LAND&&!pad){hit(s,'Rough ground');s.y=LAND-65;s.vy=-85;}
  if(onPad&&s.vy>95){hit(s,'Hard landing');s.y=LAND-45;s.vy=-60;}
  if(onPad&&Math.abs(s.vx)<55&&Math.abs(s.vy)<50){s.landed=pad.id;s.boardCD-=dt;
   if(s.boardCD<=0){if(pad.id===0&&s.aboard){s.aboard--;s.saved++;s.score+=500;s.boardCD=.38;s.events.push({type:'home',x:s.x,y:s.y});s.last='Hiker home · '+s.saved+' / '+s.total+' rescued.';}
    else if(pad.id&&pad.left&&s.aboard<4){pad.left--;s.aboard++;s.boardCD=.5;s.events.push({type:'board',x:s.x,y:s.y});s.last=s.aboard===4?'CABIN FULL · Return left to BASE.':'Boarding · Hold still on the pad.';}
    else if(pad.id&&(!pad.left||s.aboard===4))s.last=s.aboard===4?'CABIN FULL · Return left to BASE.':'Pad clear · Find the next hikers or return to BASE.';
    else if(!pad.id&&!s.aboard)s.last='BASE · Follow the route strip to the next gold rescue pad.';
   }
  }else{s.landed=-1;s.boardCD=.2;}
  if(input.fire&&s.fireCD<=0){s.fireCD=.22;s.shots.push({x:s.x+s.face*35,y:s.y+6,vx:s.face*650,life:1.2});s.events.push({type:'fire',x:s.x,y:s.y});}
  for(const a of s.shots){a.x+=a.vx*dt;a.life-=dt;for(const t of [...s.guns,...s.drones])if(a.life>0&&t.hp>0&&Math.abs(a.x-t.x)<27&&Math.abs(a.y-t.y)<25){a.life=0;t.hp--;s.events.push({type:'spark',x:t.x,y:t.y});if(!t.hp){s.score+=250;s.last='Threat disabled +250';}}}
  s.shots=s.shots.filter(a=>a.life>0);
  for(const t of s.guns){if(t.hp<=0)continue;t.timer-=dt;if(t.timer<.9&&!t.aim&&Math.abs(s.x-t.x)<700)t.aim={x:s.x,y:s.y};if(t.timer<=0){if(t.aim){const dx=t.aim.x-t.x,dy=t.aim.y-t.y,dist=Math.hypot(dx,dy);s.bullets.push({x:t.x,y:t.y,vx:dx/dist*c.speed,vy:dy/dist*c.speed,life:5});}t.aim=null;t.timer=c.rate;}}
  for(const d of s.drones){if(d.hp<=0)continue;d.x+=d.dir*(55+s.level*4)*dt;if(d.x<640||d.x>2320)d.dir*=-1;d.timer-=dt;if(d.timer<=0){if(Math.abs(d.x-s.x)<800){const dx=s.x-d.x,dy=s.y-d.y,dist=Math.max(1,Math.hypot(dx,dy));s.bullets.push({x:d.x,y:d.y,vx:dx/dist*c.speed*.85,vy:dy/dist*c.speed*.85,life:5});}d.timer=c.rate+1;}}
  for(const b of s.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.hypot((b.x-s.x)/1.5,b.y-s.y)<17){hit(s,'Flak hit');b.life=0;}}
  s.bullets=s.bullets.filter(b=>b.life>0&&b.y>20&&b.y<GROUND);s.cam=clamp(s.x-400,0,W-1000);
  if(s.saved===s.total){s.status='clear';s.score+=Math.ceil(Math.max(0,c.time-s.time))*10+s.hull*150;s.last='Everyone home.';}else if(s.time>=c.time){s.status='over';s.last='Weather window closed. Retry the valley.';}
 }
 const api={W,H,GROUND,LAND,levels,create,step,hit};if(typeof module==='object')module.exports=api;else root.CloudEngine=api;
})(typeof window==='object'?window:globalThis);

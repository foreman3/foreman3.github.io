/* Copper Glide simulation. No DOM, network, or frame-rate dependency. */
(function(root){'use strict';
const levels=[
 {name:'The Apprentice',speed:225,reaction:.34,error:120,look:.12,attack:0,returnSpeed:350,max:590,win:3,lose:5},
 {name:'The Rail Reader',speed:265,reaction:.29,error:105,look:.16,attack:.15,returnSpeed:400,max:620,win:4,lose:5},
 {name:'The Counterpuncher',speed:305,reaction:.25,error:90,look:.20,attack:.35,returnSpeed:450,max:650,win:4,lose:5},
 {name:'The Angle Maker',speed:345,reaction:.21,error:76,look:.25,attack:.50,returnSpeed:500,max:680,win:5,lose:5},
 {name:'The Club Captain',speed:385,reaction:.18,error:64,look:.30,attack:.65,returnSpeed:550,max:710,win:5,lose:5},
 {name:'The Silver Medalist',speed:455,reaction:.14,error:52,look:.38,attack:.80,returnSpeed:650,max:760,win:5,lose:3},
 {name:'The Copper Champion',speed:525,reaction:.10,error:52,look:.48,attack:.92,returnSpeed:740,max:810,win:5,lose:1}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function create(level=1,bank=0){const c=levels[level-1];return {level,bank,score:bank,status:'playing',time:0,goals:0,rival:0,hits:0,banks:0,rallyBanks:0,goalValue:0,flash:0,flashX:0,flashY:0,flashKind:'',last:'',event:0,seed:3901+level*197,p:{x:185,y:280,vx:0,vy:0},a:{x:825,y:280,vx:0,vy:0},q:{x:300,y:280,vx:0,vy:0},target:{x:185,y:280},ai:{x:825,y:280,wait:0,error:0,aim:0},serve:1.4,server:0,goalFlash:0,trail:[],config:c};}
function rand(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function reflect(y){const h=484;let z=((y-38)%(2*h)+2*h)%(2*h);return 38+(z>h?2*h-z:z);}
function move(b,x,y,speed,dt,left){const ox=b.x,oy=b.y,dx=x-ox,dy=y-oy,d=Math.hypot(dx,dy),k=d>0?Math.min(1,speed*dt/d):0;b.x=clamp(ox+dx*k,left?80:540,left?460:920);b.y=clamp(oy+dy*k,80,480);b.vx=(b.x-ox)/dt;b.vy=(b.y-oy)/dt;}
function goal(s,who){if(s.status!=='playing')return;const c=s.config;s.goalFlash=1;s.last=who?'rival-goal':'goal';s.event++;if(!who){s.goals++;s.goalValue=100+Math.min(3,s.rallyBanks)*35;s.score+=s.goalValue;}else{s.rival++;s.goalValue=0;}if(s.goals>=c.win){s.status='clear';s.score+=Math.max(0,c.lose-s.rival)*75;}else if(s.rival>=c.lose)s.status='over';else {s.server=who?0:1;s.serve=1.35;s.q={x:s.server?700:300,y:280,vx:0,vy:0};s.trail.length=0;s.rallyBanks=0;s.ai.wait=0;}}
function strike(s,b,who){const q=s.q,dx=q.x-b.x,dy=q.y-b.y,d=Math.hypot(dx,dy),r=41;if(d>=r)return;let nx=dx/(d||1),ny=dy/(d||1);if(d<.001){nx=who?-1:1;ny=0;}q.x=b.x+nx*(r+.1);q.y=b.y+ny*(r+.1);const relative=(q.vx-b.vx)*nx+(q.vy-b.vy)*ny;if(relative<0){q.vx-=1.86*relative*nx;q.vy-=1.86*relative*ny;q.vx+=b.vx*.12;q.vy+=b.vy*.12;const v=Math.hypot(q.vx,q.vy),speed=clamp(v,240,who?s.config.returnSpeed:s.config.max);q.vx=q.vx/v*speed;q.vy=q.vy/v*speed;s.last=who?'return':'strike';s.event++;s.hits++;s.rallyBanks=0;}}
function step(s,input,dt){if(s.status!=='playing')return;dt=Math.min(dt,1/60);s.time+=dt;s.goalFlash=Math.max(0,s.goalFlash-dt);s.flash=Math.max(0,s.flash-dt);const oldEvent=s.event,c=s.config;
 if(input.pointer){s.target.x=input.x;s.target.y=input.y;}else if(input.dx||input.dy){const n=Math.max(1,Math.hypot(input.dx,input.dy)),speed=input.fine?330:620;s.target.x=s.p.x+input.dx/n*speed*dt;s.target.y=s.p.y+input.dy/n*speed*dt;}else{s.target.x=s.p.x;s.target.y=s.p.y;}
 move(s.p,s.target.x,s.target.y,1050,dt,true);
 const q=s.q,a=s.a;s.ai.wait-=dt;
 if(s.ai.wait<=0){s.ai.wait=c.reaction;s.ai.error=(rand(s)*2-1)*c.error;s.ai.aim=(rand(s)*2-1)*82;
  let ty=q.vx>10?reflect(q.y+clamp((825-q.x)/q.vx,0,c.look)*q.vy):280;
  let tx=825;
  if(q.x>560&&q.vx<220&&rand(s)<c.attack){tx=q.x+35;ty=q.y+(q.y-(280+s.ai.aim))*.20;}
  s.ai.x=clamp(tx,555,912);s.ai.y=clamp(ty+s.ai.error,66,494);
 }
 move(a,s.ai.x,s.ai.y,c.speed,dt,false);
 if(s.serve>0){s.serve-=dt;if(s.serve<=0){q.vx=s.server?-300:280;q.vy=(rand(s)*2-1)*85;s.last='serve';s.event++;}return;}
 q.x+=q.vx*dt;q.y+=q.vy*dt;
 if(q.y<38){q.y=76-q.y;q.vy=Math.abs(q.vy);s.banks++;s.rallyBanks++;s.last='rail';s.event++;}
 if(q.y>522){q.y=1044-q.y;q.vy=-Math.abs(q.vy);s.banks++;s.rallyBanks++;s.last='rail';s.event++;}
 const inGoal=q.y>186&&q.y<374;
 if(q.x<38){if(inGoal&&q.x<15){goal(s,1);return;}if(!inGoal){q.x=76-q.x;q.vx=Math.abs(q.vx);s.last='rail';s.event++;}}
 if(q.x>962){if(inGoal&&q.x>985){goal(s,0);return;}if(!inGoal){q.x=1924-q.x;q.vx=-Math.abs(q.vx);s.last='rail';s.event++;}}
 strike(s,s.p,0);strike(s,a,1);
 if(s.event!==oldEvent){s.flash=.18;s.flashX=q.x;s.flashY=q.y;s.flashKind=s.last;}
 const speed=Math.hypot(q.vx,q.vy);if(speed>1&&speed<200){q.vx*=Math.pow(1.22,dt);q.vy*=Math.pow(1.22,dt);}
 // A nearly vertical rally gradually opens up, preventing an endless rail loop.
 if(Math.abs(q.vx)<85){q.vx+=(q.x<500?1:-1)*55*dt;}
}
const api={levels,create,step,reflect,goal};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CopperEngine=api;
})(typeof window!=='undefined'?window:globalThis);

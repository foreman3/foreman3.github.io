(function(root){
 'use strict';
 const levels=[
  {name:'House shoes',target:16,hook:0,assist:8,sway:0,period:4,bumpers:true},
  {name:'Find the pocket',target:18,hook:.35,assist:7,sway:.006,period:3.8},
  {name:'Read the oil',target:20,hook:.55,assist:6,sway:.012,period:3.6},
  {name:'League night',target:22,hook:.75,assist:5,sway:.022,period:3.3},
  {name:'The house final',target:24,hook:1,assist:4,sway:.03,period:3.1},
  {name:'Scratch league',target:27,hook:1.2,assist:2,sway:.065,period:2.7},
  {name:'Almost perfect',target:29,hook:1.4,assist:0,sway:.09,period:2.3}
 ];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function pins(){const a=[];let id=1;for(let row=0;row<4;row++)for(let j=0;j<=row;j++)a.push({id:id++,x:(j-row/2)*35,y:825+row*31,vx:0,vy:0,down:false,removed:false,angle:0});return a;}
 function create(level=1){return{level:clamp(level,1,7),rack:1,shot:1,total:0,score:0,history:[],phase:'ready',pins:pins(),ball:null,time:0,clock:0,pos:0,aim:0,spin:0,power:.75,last:'Aim just beside the head pin. Ten pins, two rolls.',events:[],first:0,gutter:false};}
 function oil(s){return s.level<3?{name:'EVEN',factor:1,dry:520}:{name:['LONG','SHORT','MEDIUM'][s.rack-1],factor:[.72,1.2,.95][s.rack-1],dry:[640,420,540][s.rack-1]};}
 function release(s){const c=levels[s.level-1];return s.aim+Math.sin(s.time*Math.PI*2/c.period+s.rack*.85+s.shot*.4)*c.sway;}
 function launch(s){if(s.phase!=='ready')return false;const angle=release(s);s.phase='rolling';s.clock=0;s.gutter=false;s.ball={x:s.pos,y:38,vx:angle*(520+s.power*190),vy:520+s.power*190,spin:s.spin};s.events.push('roll');s.last='Watch the pocket. Spares count just as much as strikes.';return true;}
 function knock(s,p,vx,vy){if(p.down||p.removed)return;p.down=true;p.vx=vx*.5;p.vy=vy*.5;p.angle=Math.atan2(vy,vx);s.events.push('pin');}
 function step(s,dt){if(['clear','over'].includes(s.phase))return;s.time+=dt;if(s.phase!=='rolling')return;s.clock+=dt;const b=s.ball,c=levels[s.level-1],o=oil(s);
  if(b&&b.y<1090){if(!s.gutter){const dry=b.y>o.dry?1:.16;b.vx+=b.spin*c.hook*o.factor*83*dry*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(Math.abs(b.x)>148){if(c.bumpers){b.x=clamp(b.x,-147,147);b.vx*=-.72;s.events.push('bumper');}else{s.gutter=true;b.x=Math.sign(b.x)*168;s.last='Gutter. Adjust your line; the spare is still yours.';}}}else b.y+=b.vy*dt;
   if(!s.gutter)for(const p of s.pins){if(p.removed||p.down)continue;const dx=p.x-b.x,dy=p.y-b.y;if(dx*dx+dy*dy<(25+c.assist)**2){const ang=Math.atan2(dy,dx),speed=Math.hypot(b.vx,b.vy);knock(s,p,Math.cos(ang)*speed*.65+b.vx*.4,Math.sin(ang)*speed*.65+b.vy*.22);b.vx-=Math.cos(ang)*28;b.vy*=.97;}}
  }
  for(const p of s.pins){if(!p.down||p.removed)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-1.65*dt);p.vy*=Math.exp(-1.65*dt);if(p.y>1010){p.y=1010;p.vy=-Math.abs(p.vy)*.25;}if(Math.abs(p.x)>151){p.x=clamp(p.x,-151,151);p.vx=-p.vx*.38;}for(const q of s.pins){if(q===p||q.down||q.removed)continue;const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),speed=Math.hypot(p.vx,p.vy);if(d<27&&speed>35){knock(s,q,p.vx*.65+dx*2,p.vy*.65+dy*2);p.vx*=.58;p.vy*=.58;}}}
  if(s.clock>3.1){const fallen=s.pins.filter(p=>p.down&&!p.removed).length;s.total+=fallen;s.score+=fallen*100;for(const p of s.pins)if(p.down)p.removed=true;s.ball=null;
   if(s.shot===1&&fallen<10){s.first=fallen;s.shot=2;s.phase='ready';s.last=fallen+' down. '+(10-fallen)+' left: move your starting point for the spare.';s.events.push('ready');}
   else{const tally=s.shot===1?10:s.first+fallen,mark=s.shot===1?'X':tally===10?'/':String(tally);s.history.push({rack:s.rack,pins:tally,mark});if(tally===10)s.score+=s.shot===1?250:100;s.last=mark==='X'?'STRIKE! All ten, one beautiful line.':mark==='/'?'SPARE! A well-earned recovery.':tally+' pins banked. Every pin helps.';s.phase=s.rack===3?(s.total>=c.target?'clear':'over'):'between';s.events.push(mark==='X'?'strike':'ready');}
  }
 }
 function next(s){if(s.phase!=='between')return false;s.rack++;s.shot=1;s.pins=pins();s.first=0;s.ball=null;s.phase='ready';s.last='Fresh rack. Read the oil strip, then choose your line.';return true;}
 const api={levels,create,launch,step,next,oil,release,clamp};if(typeof module!=='undefined')module.exports=api;root.PocketEngine=api;
})(typeof window==='undefined'?globalThis:window);

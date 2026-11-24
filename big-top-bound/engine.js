/* Deterministic fixed-step simulation. CommonJS export supports mechanical checks. */
(() => {
  'use strict';
  const ACTS = [
    {name:'First applause',speed:205,gap:2.18,groups:8,hearts:5,tolerance:68,pots:false,high:false,bob:0,pairs:false},
    {name:'A little spark',speed:222,gap:2.08,groups:10,hearts:5,tolerance:64,pots:true,high:false,bob:0,pairs:false},
    {name:'Higher ambitions',speed:240,gap:1.98,groups:12,hearts:5,tolerance:60,pots:true,high:true,bob:0,pairs:false},
    {name:'The dancing ring',speed:258,gap:1.88,groups:14,hearts:5,tolerance:56,pots:true,high:true,bob:12,pairs:false},
    {name:'Two for the show',speed:276,gap:1.80,groups:16,hearts:4,tolerance:52,pots:true,high:true,bob:14,pairs:true},
    {name:'The headliner',speed:304,gap:1.65,groups:18,hearts:3,tolerance:38,pots:true,high:true,bob:16,pairs:true},
    {name:'Standing ovation',speed:334,gap:1.52,groups:20,hearts:2,tolerance:29,pots:true,high:true,bob:18,pairs:true}
  ];
  function create(level=1,bank=0) {
    const cfg=ACTS[level-1], obstacles=[];
    for(let i=0;i<cfg.groups;i++) {
      const x=620+i*cfg.speed*cfg.gap;
      const type=cfg.pots && i%4===2?'pot':'hoop';
      const high=cfg.high && i%4===3;
      obstacles.push({x,type,target:type==='pot'?(high?68:44):(high?140:108),high,phase:i*1.7,group:i,done:false});
      if(cfg.pairs && i%4===1) obstacles.push({x:x+cfg.speed*.38,type:'hoop',target:118,high:false,phase:i*1.7,group:i,done:false});
    }
    return {level,cfg,obstacles,finish:obstacles.at(-1).x+360,distance:0,h:0,v:0,jumpAge:0,hold:false,reins:false,reinReserve:3,slowing:false,buffer:0,hearts:cfg.hearts,score:bank,bank,streak:0,cleared:0,misses:0,time:0,invuln:0,state:'playing',events:[],lastGroup:-1};
  }
  function target(s,o){return o.target+(o.type==='hoop'?s.cfg.bob*Math.sin(s.time*2.1+o.phase):0);}
  function jump(s){if(s.state==='playing')s.buffer=.14;}
  function tick(s,dt) {
    s.events.length=0;
    if(s.state!=='playing')return;
    s.time+=dt;s.invuln=Math.max(0,s.invuln-dt);
    s.buffer=Math.max(0,s.buffer-dt);
    if(s.buffer>0 && s.h<=.01){s.v=575;s.jumpAge=0;s.buffer=0;s.events.push({type:'jump'});}
    if(s.h>0 || s.v>0){s.jumpAge+=dt;const gravity=s.hold&&s.v>0&&s.jumpAge<.24?800:1150;s.v-=gravity*dt;s.h=Math.max(0,s.h+s.v*dt);if(s.h===0){s.v=0;s.events.push({type:'land'});}}
    s.slowing=s.reins&&s.reinReserve>0;
    s.reinReserve=Math.max(0,Math.min(3,s.reinReserve+(s.reins?-1:.4)*dt));
    const before=s.distance;s.distance+=s.cfg.speed*(s.slowing?.62:1)*dt;
    for(const o of s.obstacles){
      if(o.done||o.x<before||o.x>s.distance)continue;
      o.done=true;
      const good=o.type==='pot'?s.h>=o.target:Math.abs(s.h-target(s,o))<=s.cfg.tolerance;
      if(good){s.cleared++;s.streak++;const perfect=o.type==='hoop'&&Math.abs(s.h-target(s,o))<18;s.score+=100+Math.min(5,s.streak)*20+(perfect?50:0);s.events.push({type:'clear',perfect,x:o.x,h:s.h});}
      else {s.misses++;s.streak=0;if(s.invuln<=0){s.hearts--;s.invuln=1.1;s.events.push({type:'hit',x:o.x});}else s.events.push({type:'saved'});}
      if(s.hearts<=0){s.state='lost';s.events.push({type:'lost'});break;}
    }
    if(s.state==='playing'&&s.distance>=s.finish){s.state='won';s.score+=s.hearts*150;s.events.push({type:'won'});}
  }
  const api={ACTS,create,tick,jump,target};
  if(typeof module!=='undefined')module.exports=api;
  else window.BigTopEngine=api;
})();

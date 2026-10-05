/* Input-only combat pilot, shared by end-to-end checks. */
window.runIronBoss=function({dodge=true,cores=true}={}){const stage=__iron.snapshot().stage,w=__iron.world(),initialLives=__iron.snapshot().lives;
const pressed=new Set(),key=(code,on)=>{if(pressed.has(code)===on)return;dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?pressed.add(code):pressed.delete(code);},tap=code=>{key(code,true);key(code,false);};const trace=[];let frames=0,age=0,rest=0,shots=0,min=28,lastBoss=__iron.snapshot().boss;
 for(;frames<9000;frames++){const s=__iron.snapshot(),p=s.player,b=s.boss;if(s.mode!=='play'||s.lives<initialLives||!b)break;lastBoss=b;if(p.hp<min&&stage===4)trace.push({seconds:frames/60,hp:p.hp,x:p.x,y:p.y,bx:b.x,by:b.y,pattern:b.pattern,phase:b.phase});min=Math.min(min,p.hp);let goal=b.x<w.arena+350&&b.y>265?w.arena+700:w.arena+95;
  if(dodge&&b.pattern===1&&['tell','attack'].includes(b.phase)||dodge&&stage===0&&b.pattern===4&&['tell','attack'].includes(b.phase)){if(Math.abs(p.x-b.mark-39)<160)goal=p.x<w.arena+450?w.arena+640:w.arena+95;else goal=p.x;}
  if(dodge&&b.pattern===3&&stage>0&&b.marks?.length){const spots=Array.from({length:6},(_,n)=>w.arena+85+n*125).filter(x=>b.marks.every(m=>Math.abs(x-m)>65)&&(b.y<260||Math.abs(x-b.x)>155));if(spots.length)goal=spots.sort((a,b)=>Math.abs(a-p.x)-Math.abs(b-p.x))[0];}
  const incoming=__iron.bullets().filter(a=>a.owner==='enemy').map(a=>{const time=(p.x+13-a.x)/(a.vx||.001);return{...a,time,yHit:a.y+a.vy*Math.max(0,time)};}).filter(a=>a.time>0&&a.time<.38||Math.abs(a.vx)<1&&Math.abs(a.x-p.x)<35&&a.y<p.y);
  const high=incoming.some(a=>Math.abs(a.vy)<25&&a.yHit>=392&&a.yHit+a.h<=418),low=incoming.some(a=>a.yHit+a.h>419&&a.yHit<445),body=b.phase==='attack'&&b.y+b.h>p.y+10&&b.y>285&&Math.abs(b.x-p.x)<190;
  const jump=dodge&&!high&&(p.ground&&(low||body)||pressed.has('Space')&&p.vy<-35);key('ArrowDown',dodge&&high&&!jump);key('Space',jump);key('ArrowRight',p.x<goal-12);key('ArrowLeft',p.x>goal+12);
  const weapon=cores&&s.energy>[0,8,11,13,10][stage]+.2?stage:0;if(s.weapon!==weapon)tap('Digit'+(weapon+1));const aligned=p.y+(p.crouch?9:18)>b.y-12&&p.y+18<b.y+b.h+6;
  if(rest>0){key('KeyX',false);rest--;}else{key('KeyX',true);age++;if(age>=42&&aligned){key('ArrowRight',b.x>p.x);key('ArrowLeft',b.x<=p.x);key('KeyX',false);age=0;rest=18;shots++;}}
  if(dodge&&(body&&Math.abs(b.x-p.x)<90||incoming.some(a=>a.time<.16&&a.time>0&&a.yHit<p.y+p.h&&a.yHit+a.h>p.y))&&p.dash<=0){key('ShiftLeft',!pressed.has('ShiftLeft'));}else key('ShiftLeft',false);
  __iron.step(1,false);
 }for(const code of [...pressed])key(code,false);const s=__iron.snapshot();return{stage:stage+1,dodge,cores,result:s.mode==='clear'?'clear':s.lives<initialLives?'lost attempt':s.mode,seconds:frames/60,minArmor:min,armor:s.player.hp,lives:s.lives,bossHP:s.boss?.hp??lastBoss.hp,shots,trace};
};

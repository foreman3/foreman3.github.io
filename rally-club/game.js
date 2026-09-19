(() => {
'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d');
const profiles=[
 {name:'THE WARM-UP',speed:310,ai:145,error:95,width:165,goal:3,angle:.28,spin:.35},
 {name:'THE STEADY HAND',speed:335,ai:175,error:75,width:165,goal:5,angle:.35,spin:.5},
 {name:'THE ANGLE ARTIST',speed:350,ai:200,error:65,width:165,goal:5,angle:.65,spin:.65},
 {name:'THE COUNTERPUNCHER',speed:385,ai:225,error:48,width:165,goal:5,angle:.72,spin:.8},
 {name:'THE CLUB CHAMPION',speed:450,ai:285,error:22,width:125,goal:5,angle:.85,spin:1}
];
const params=new URLSearchParams(location.search), testing=params.has('test');
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;let level=Math.max(1,Math.min(5,Number(params.get('court'))||1)),phase='instructions',resume='serve',score=0,points=0,against=0,player=500,opponent=500,velocity=0,target=null,ball={x:500,y:570,vx:0,vy:0},rally=0,elapsed=0,aim=500,aiClock=0,flash=0,muted=false,audio,seed=42,keys=new Set(),trail=[],brush=0,lastHitter='player',feedback='',feedbackTime=0,spinLabel="";
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},p=()=>profiles[level-1];
function tone(f){if(muted||phase==='instructions')return;try{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.13);}catch{}}
function setBrush(value){if(brush===value)return;brush=value;for(const [id,v] of [["spin-left",-1],["spin-flat",0],["spin-right",1]]){$(id).classList.toggle("selected",v===brush);$(id).setAttribute("aria-pressed",String(v===brush));}}
function clearInput(){keys.clear();target=null;velocity=0;setBrush(0);}
function spinHud(){const incoming=phase==="play"&&ball.vy>0;const direction=ball.spin>.05?"RIGHT":ball.spin<-.05?"LEFT":"NONE";const label=incoming?"INCOMING "+direction+" SPIN · "+(direction==="NONE"?"PLACE YOUR SHOT":"BRUSH "+(ball.spin>0?"LEFT ←":"RIGHT →")):phase==="play"?"YOUR RETURN · "+direction+" CURVE":"Q / E OR BUTTONS · BRUSH LEFT / RIGHT";if(label!==spinLabel){spinLabel=label;$("spin-readout").textContent=label;}}function hud(){spinHud(); $('level').textContent=level+' / 5';$('points').textContent=points;$('against').textContent=against;$('score').textContent=score;$('opponent').textContent=String(level).padStart(2,'0')+' / '+p().name;$('serve').disabled=phase!=='serve';$('serve').textContent=phase==='play'?'RALLY IN PLAY':'SERVE BALL';$('pause').textContent=phase==='paused'?'Resume':'Pause';$('drag').setAttribute('aria-valuenow',Math.round(player));$('thumb').style.left=(player/10)+'%';}
function prepare(){clearInput();ball={x:player,y:563,vx:0,vy:0,spin:0};feedback="";feedbackTime=0;rally=0;trail=[];phase='serve';$('callout').textContent='FIRST TO '+p().goal+' · YOUR SERVE';hud();draw();}
function match(n){document.getElementById("result").classList.remove("is-visible");level=n;points=against=0;opponent=player=500;elapsed=0;prepare();}
function reset(){score=0;$('result').classList.remove('is-visible');match(1);if($('instruction-modal').classList.contains('is-visible')){resume='serve';phase='instructions';}hud();draw();}
function serve(){if(phase!=='serve')return;phase='play';ball.x=player;ball.spin=brush*p().spin;lastHitter="player";ball.vy=-p().speed;const flight=475/p().speed;ball.vx=(500-ball.x)/flight-.5*ball.spin*250*flight;aiClock=0;$('callout').textContent='';tone(540);hud();}
function point(won,reason=""){if(phase!=='play')return;flash=.28;if(won){points++;score+=100+rally*15;tone(760);}else{against++;tone(170);}if(points>=p().goal||against>=p().goal){phase='result';$('result-title').textContent=won?(level===5?'Club champion!':'Court conquered!'):'Rematch?';$('result-text').textContent=points+' – '+against+' · '+score+' points. '+(reason?reason+'. ':'')+(won?'Placement and counterspin win rallies.':'Watch incoming spin: brush in the opposite direction.');$('next').hidden=!won||level===5;$('result').classList.add('is-visible');$('again').textContent=won?'PLAY AGAIN':'RETRY COURT';(won&&level<5?$('next'):$('again')).focus();}else {prepare();document.getElementById("callout").textContent=(won?"YOUR POINT":"CLUB POINT")+" · "+(reason||"SERVE WHEN READY");}hud();}
function help(){if(phase==='result')return;resume=phase==='instructions'?resume:phase;phase='instructions';clearInput();$('instruction-modal').classList.add('is-visible');$('instruction-close').textContent='LET’S PLAY';$('instruction-close').focus();}
function closeHelp(){try{sessionStorage.setItem('rally-club-spin-v2','seen');}catch{}$('instruction-modal').classList.remove('is-visible');phase=resume;clearInput();hud();canvas.focus();}
function pause(){if(phase==='instructions'||phase==='result')return;if(phase==='paused')phase=resume;else{resume=phase;phase='paused';}clearInput();$('callout').textContent=phase==='paused'?'MATCH PAUSED':phase==='serve'?'YOUR SERVE':'';hud();}
function step(dt){
 if(phase!=='play'&&phase!=='serve')return;
 elapsed+=dt;flash=Math.max(0,flash-dt);feedbackTime=Math.max(0,feedbackTime-dt);
 const old=player,dir=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0);
 player=clamp(player+(target===null?dir*700*dt:clamp(target-player,-900*dt,900*dt)),45+p().width/2,955-p().width/2);velocity=(player-old)/dt;
 if(phase==='serve'){ball.x=player;return;}
 const acceleration=ball.spin*250;
 aiClock-=dt;
 if(aiClock<=0){aiClock=.18;const t=Math.max(0,(ball.y-88)/Math.max(1,-ball.vy));aim=ball.vy<0?ball.x+ball.vx*t+.5*acceleration*t*t+(rand()-.5)*p().error*2:500;}
 const recoverySpeed=p().ai/(1+Math.max(0,rally-4)*.045);opponent=clamp(opponent+clamp(aim-opponent,-recoverySpeed*dt,recoverySpeed*dt),115,885);
 if(!reduced){trail.push({x:ball.x,y:ball.y});if(trail.length>28)trail.shift();}
 const previousY=ball.y;
 ball.x+=ball.vx*dt+.5*acceleration*dt*dt;ball.vx+=acceleration*dt;ball.y+=ball.vy*dt;
 // Open sidelines: an out belongs to the striker, never the receiver.
 if(ball.x<49||ball.x>951){point(lastHitter==='club',lastHitter==='player'?'YOUR SHOT WENT WIDE':'CLUB SHOT WENT WIDE');return;}
 if(ball.vy>0&&ball.y>=562&&previousY<562&&Math.abs(ball.x-player)<p().width/2+9){
  ball.y=561;rally++;score+=5;lastHitter='player';
  const incoming=ball.spin,added=brush*(Math.abs(incoming)>.05?Math.abs(incoming):p().spin),residual=incoming+added;
  const speed=Math.min(p().speed+14*rally,p().speed*1.3),flight=473/speed;
  const contact=clamp((ball.x-player)/(p().width/2),-1,1),destination=clamp(500+contact*330,125,875);
  ball.spin=clamp(residual,-2,2);ball.vy=-speed;
  // Uncancelled spin grips the rubber and kicks the return sideways, then continues to curve.
  ball.vx=(destination-ball.x)/flight+residual*260;
  const cancelled=Math.abs(incoming)>.05&&Math.abs(residual)<.05;
  feedback=cancelled?'CLEAN COUNTERSPIN +25':Math.abs(residual)>.05?'SPIN CARRIED INTO RETURN':'PLACED RETURN';
  if(cancelled)score+=25;feedbackTime=.9;trail=[];tone(cancelled?790:600);hud();
 }
 if(ball.vy<0&&ball.y<=88&&previousY>88&&Math.abs(ball.x-opponent)<79){
  ball.y=89;lastHitter='club';
  // The club cancels the received spin and brushes a new curved, legally placed shot.
  const direction=level===1?1:level===2?(rally%2?1:-1):(rand()<.5?-1:1);
  ball.spin=direction*p().spin;
  const speed=Math.min(p().speed+14*rally,p().speed*1.3),flight=473/speed;
  const destination=level>=4?(player>500?210:790):level===3?250+rand()*500:360+rand()*280;
  ball.vx=(destination-ball.x-.5*ball.spin*250*flight*flight)/flight;ball.vy=speed;
  feedback=ball.spin>0?'RIGHT SPIN · BRUSH LEFT ←':'LEFT SPIN · BRUSH RIGHT →';feedbackTime=1.1;trail=[];tone(440);
 }
 if(ball.y>625)point(false,'MISSED THE RETURN');else if(ball.y<20)point(true,'PAST THE CLUB PADDLE');
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}function text(s,x,y,size,c,align='center'){ctx.fillStyle=c;ctx.font=`bold ${size}px Arial`;ctx.textAlign=align;ctx.fillText(s,x,y);}
function draw(){rect(0,0,1000,650,'#d47856');for(let x=0;x<1000;x+=90)rect(x,0,2,650,'#c56b4c');rect(31,24,938,606,'#9a583e');rect(40,18,920,605,'#285b50');rect(48,26,904,589,'#377563');ctx.strokeStyle='#e9edcf';ctx.lineWidth=4;ctx.strokeRect(59,37,882,566);rect(498,39,3,562,'#bed5ba');rect(59,320,882,2,'#f2ecd4');for(let x=54;x<950;x+=13)rect(x,310,1,23,'#f2ecd4');rect(45,306,8,29,'#eee4c6');rect(948,306,8,29,'#eee4c6');text('RALLY / CLUB',500,226,50,'#61917c');text('1978   •   MEMBERS & GUESTS',500,259,13,'#a0b69a');text('CLUB',85,65,13,'#e5e7cc','left');text('YOU',85,595,13,'#e5e7cc','left');
 rect(opponent-70,66,140,17,'#163c35');rect(opponent-70,61,140,17,'#edb86f');rect(opponent-40,61,80,3,'#fff0bf');rect(player-p().width/2,574,p().width,18,'#183e35');rect(player-p().width/2,568,p().width,18,'#ec745c');rect(player-p().width/2+8,568,p().width-16,4,'#ffc2a3');rect(player-p().width*.26,574,2,9,'#ffd0ab');rect(player+p().width*.26,574,2,9,'#ffd0ab');
 if(!reduced){trail.forEach((v,i)=>{ctx.fillStyle='rgba(255,246,218,'+(i/90)+')';ctx.beginPath();ctx.arc(v.x,v.y,1+i*.1,0,Math.PI*2);ctx.fill();});}ctx.fillStyle='#173e3555';ctx.beginPath();ctx.ellipse(ball.x+5,ball.y+10,10,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff6da';ctx.beginPath();ctx.arc(ball.x,ball.y,9,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c7613f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ball.x,ball.y,6,elapsed*ball.spin*12,elapsed*ball.spin*12+Math.PI);ctx.stroke();text(feedbackTime>0?feedback:rally>1?rally+' SHOT RALLY':'',500,410,18,'#f6eccb');if(flash>0){ctx.strokeStyle='#fff3c6';ctx.lineWidth=5;ctx.strokeRect(44,22,912,597);}}
$('instruction-close').onclick=closeHelp;$('help-button').onclick=help;$('pause').onclick=pause;$('reset').onclick=reset;$('serve').onclick=serve;$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(muted));};$('next').onclick=()=>{$('result').classList.remove('is-visible');match(level+1);};$('again').onclick=()=>{const retry=against>=p().goal;$('result').classList.remove('is-visible');if(retry)match(level);else reset();};
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','a','d','q','e','r','m','p'].includes(e.key))e.preventDefault();if(e.repeat&&['r','m','p',' '].includes(e.key))return;keys.add(e.key);if(e.key==='q')setBrush(-1);if(e.key==='e')setBrush(1);if(e.key===' ')serve();if(e.key==='r')reset();if(e.key==='m')$('sound').click();if(e.key==='p')pause();});window.addEventListener('keyup',e=>{keys.delete(e.key);if(e.key==='q'||e.key==='e')setBrush(keys.has('q')?-1:keys.has('e')?1:0);});window.addEventListener('blur',()=>{clearInput();if(phase==='play')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(phase==='play')pause();}});window.addEventListener('vibecade:reset-input',clearInput);window.addEventListener('vibecade:restart',e=>{e.preventDefault();reset();});
let pointer=null;const drag=$('drag');function position(e){const r=drag.getBoundingClientRect();target=clamp((e.clientX-r.left)/r.width*1000,80,920);}drag.addEventListener('pointerdown',e=>{if(phase!=='play'&&phase!=='serve')return;e.preventDefault();pointer=e.pointerId;drag.setPointerCapture(pointer);position(e);});drag.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();position(e);}});for(const name of ['pointerup','pointercancel','lostpointercapture'])drag.addEventListener(name,()=>{pointer=null;target=null;});drag.addEventListener('contextmenu',e=>e.preventDefault());
for(const [id,value] of [['spin-left',-1],['spin-flat',0],['spin-right',1]]){$(id).onclick=()=>{if(phase==='play'||phase==='serve')setBrush(value);};}
match(level);resume='serve';phase='instructions';try{if(sessionStorage.getItem('rally-club-spin-v2')){phase='serve';$('instruction-modal').classList.remove('is-visible');}}catch{}if(phase==='instructions')$('instruction-close').focus();hud();draw();let last=performance.now();function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(phase==='play'||phase==='serve'){for(let t=0;t<dt;t+=.008)step(Math.min(.008,dt-t));draw();spinHud();$('thumb').style.left=player/10+'%';}requestAnimationFrame(frame);}requestAnimationFrame(frame);
if(testing)window.rallyTest={state:()=>({level,phase,score,points,against,player,opponent,ball:{...ball},rally,elapsed,profiles,muted,brush,lastHitter,feedback}),jump:n=>{match(n);},step:dt=>{for(let t=0;t<dt;t+=.008)step(Math.min(.008,dt-t));draw();spinHud();},target:x=>{target=x;},serve,point,brush:setBrush,ball:b=>{Object.assign(ball,b);},draw};
})();

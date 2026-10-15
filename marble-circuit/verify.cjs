/* Reproduce: serve the repo on 8771, set NODE_PATH to your Playwright install,
   then node marble-circuit/verify.cjs. All automation hooks require ?test=1. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.MARBLE_BASE_URL||'http://127.0.0.1:8771',out=process.env.MARBLE_REPORT_DIR||'C:/Users/forem/.codex/visualizations/2026/10/15/01a13e28-0aeb-7bc1-929b-89d3934a20df';
// Input-only controller: follows centerline waypoints, slows for corners, and
// chooses a side of visible obstacles. It never moves the marble or clears stages.
function installPilot(){
 window.pilot=(level,{delay=.12,pace=145,careful=true,forced=0,stop=Infinity}={})=>{
  const t=__marbleTest,s=t.state,R=t.rules;t.start(level,0);let goal=1,think=0,elapsed=0,forceLeft=forced,frames=0;
  const dt=1/120;while(s.mode==='playing'&&elapsed<s.course.time+1&&elapsed<stop){
   const p=s.player,c=s.course;if(forceLeft&&s.collected>=forced-forceLeft+1&&!s.falling){t.fall();forceLeft--;}
   if(s.falling){goal=Math.max(1,s.checkpointIndex+1);think=0;t.step(dt);elapsed+=dt;continue;}
   const target=c.points[goal];if(Math.hypot(p.x-target[0],p.y-target[1])<14&&goal<c.points.length-1){goal++;think=0;}
   think-=dt;if(think<=0){think=delay;const target=c.points[goal],dx=target[0]-p.x,dy=target[1]-p.y,d=Math.hypot(dx,dy),prev=c.points[Math.max(0,goal-1)],len=Math.hypot(target[0]-prev[0],target[1]-prev[1]),ux=(target[0]-prev[0])/len,uy=(target[1]-prev[1])/len;
    let aimX=target[0],aimY=target[1],desired=Math.min(pace,Math.sqrt(Math.max(0,d-4)*260)),avoid=false;
    if(careful)for(const h of R.hazards(c,s.elapsed)){
     const along=(h.x-p.x)*ux+(h.y-p.y)*uy,cross=(h.x-p.x)*(-uy)+(h.y-p.y)*ux;
     if(along>-16&&along<Math.min(d-20,115)&&Math.abs(cross)<c.width*.9){
      // With narrow lanes, wait for moving sweepers to leave the center.
      if(h.kind==='sweeper'&&c.width<60){if(Math.abs(cross)<20){desired=Math.min(desired,Math.max(0,(along-42)*1.2));}continue;}
      const centerCross=(h.x-prev[0])*(-uy)+(h.y-prev[1])*ux;
      const side=centerCross>=0?-1:1,offset=side*(c.width/2-9);aimX=p.x+ux*Math.max(30,along)-uy*(offset-((p.x-prev[0])*(-uy)+(p.y-prev[1])*ux));aimY=p.y+uy*Math.max(30,along)+ux*(offset-((p.x-prev[0])*(-uy)+(p.y-prev[1])*ux));desired=Math.min(desired,75);avoid=true;break;
     }
    }
    const ax=aimX-p.x,ay=aimY-p.y,ad=Math.hypot(ax,ay)||1,wantX=ax/ad*desired,wantY=ay/ad*desired;
    const lateral=Math.abs(p.vx*(-uy)+p.vy*ux),speed=Math.hypot(p.vx,p.vy);
    t.input.brake=careful&&(speed>desired+18||(!avoid&&d<55&&speed>55)||lateral>40);
    const k=t.input.brake?7:1.65,acc=t.input.brake?270:430;
    let ix=(wantX*k+(wantX-p.vx)*5)/acc,iy=(wantY*k+(wantY-p.vy)*5)/acc,m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m;}t.input.touchX=ix;t.input.touchY=iy;
   }
   t.step(dt);elapsed+=dt;frames++;
  }
  t.draw();return{level,delay,pace,mode:s.mode,seconds:+s.elapsed.toFixed(2),penalty:s.penalty,left:+t.remaining().toFixed(2),beacons:s.collected,lives:s.lives,falls:s.falls,bumps:s.bumps,score:s.score,goal,position:{x:+s.player.x.toFixed(1),y:+s.player.y.toFixed(1)}};
 };
}
async function frames(page){return page.evaluate(async()=>{__marbleTest.start(5,0);__marbleTest.manual(false);const values=[];let prev;await new Promise(resolve=>{const tick=t=>{if(prev)values.push(t-prev);prev=t;if(values.length<120)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});__marbleTest.manual(true);values.sort((a,b)=>a-b);return{mean:values.reduce((a,b)=>a+b)/values.length,p95:values[Math.floor(values.length*.95)]};});}
async function keyboardOpening(page){
 await page.evaluate(()=>__marbleTest.start(1,0));let goal=1,held=new Set();
 for(let i=0;i<900;i++){
  const q=await page.evaluate(()=>{const s=__marbleTest.state;return{mode:s.mode,p:s.player,points:s.course.points,seconds:s.elapsed,collected:s.collected,falls:s.falls};});if(q.mode!=='playing'){for(const k of held)await page.keyboard.up(k);return q;}
  let target=q.points[goal],dx=target[0]-q.p.x,dy=target[1]-q.p.y,d=Math.hypot(dx,dy);if(d<16&&goal<q.points.length-1){target=q.points[++goal];dx=target[0]-q.p.x;dy=target[1]-q.p.y;d=Math.hypot(dx,dy);}
  const v=Math.min(130,Math.sqrt(Math.max(0,d-4)*200)),vx=dx/(d||1)*v,vy=dy/(d||1)*v,fx=vx*1.65+(vx-q.p.vx)*5,fy=vy*1.65+(vy-q.p.vy)*5,pressed=new Set();if(fx>35)pressed.add('ArrowRight');if(fx< -35)pressed.add('ArrowLeft');if(fy>35)pressed.add('ArrowDown');if(fy< -35)pressed.add('ArrowUp');if(Math.hypot(q.p.vx,q.p.vy)>v+30)pressed.add('Space');
  for(const k of held)if(!pressed.has(k))await page.keyboard.up(k);for(const k of pressed)if(!held.has(k))await page.keyboard.down(k);held=pressed;await page.evaluate(()=>__marbleTest.step(.08));
 }for(const k of held)await page.keyboard.up(k);throw Error('Keyboard opening did not finish');
}
async function main(){
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']}),report={},errors=[],watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});watch(page);await page.goto(base+'/marble-circuit/?test=1');
  const frozen=await page.evaluate(()=>__marbleTest.state.elapsed);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>__marbleTest.state.elapsed),frozen);await page.locator('#instruction-close').focus();await page.keyboard.press('Space');await page.evaluate(()=>__marbleTest.manual(true));await page.evaluate(installPilot);
  report.curve=await page.evaluate(()=>Array.from({length:7},(_,i)=>pilot(i+1,{delay:.22,pace:145})));console.log('curve',JSON.stringify(report.curve));
  report.expert=await page.evaluate(()=>Array.from({length:7},(_,i)=>pilot(i+1,{delay:.07,pace:160})));console.log('expert',JSON.stringify(report.expert));
  report.simple=await page.evaluate(()=>Array.from({length:7},(_,i)=>pilot(i+1,{delay:.32,pace:165,careful:false})));console.log('simple',JSON.stringify(report.simple));
  report.recovery=await page.evaluate(()=>pilot(5,{delay:.12,pace:145,forced:2}));console.log('recovery',JSON.stringify(report.recovery));
  await page.evaluate(()=>pilot(5,{delay:.12,pace:145,stop:10}));await page.screenshot({path:out+'/marble-circuit-gameplay.png'});
  fs.writeFileSync(out+'/draft.json',JSON.stringify(report,null,2));
  if(process.env.MARBLE_DRAFT)return;
  for(const r of report.curve.slice(0,5))assert.equal(r.mode,'cleared');for(const r of report.expert)assert.equal(r.mode,'cleared');assert.equal(report.recovery.mode,'cleared');assert.ok(report.recovery.falls>=2&&report.recovery.lives>=2);
  report.keyboardOpening=await keyboardOpening(page);assert.equal(report.keyboardOpening.mode,'cleared');assert.ok(report.keyboardOpening.falls<=1);console.log('keyboard opening',JSON.stringify(report.keyboardOpening));
  // Mechanics and endings, using actual production collision/scoring paths.
  await page.evaluate(()=>{const t=__marbleTest,s=t.state,R=t.rules,check=(v,m)=>{if(!v)throw Error(m);};
   for(let l=1;l<=7;l++){t.start(l,0);for(let i=0;i<s.course.points.length-1;i++)for(let j=0;j<=20;j++){const p=R.point(s.course,i,j/20);check(R.supported(s.course,p.x,p.y),'connected route '+l);}check(!R.supported(s.course,-100,-100),'edge fall');}
   t.start(1,0);s.player.x=300;s.player.y=320;t.step(.01);check(s.collected===1&&s.score===250,'beacon checkpoint scoring');s.player.x=700;s.player.y=40;for(let i=0;i<20;i++)t.step(.01);check(s.falls===1&&s.lives===4,'actual edge fall');for(let i=0;i<80;i++)t.step(.01);check(s.collected===1&&s.player.x===300&&s.player.y===320,'checkpoint recovery retains beacon');
   t.start(3,0);const h=R.hazards(s.course,0)[0];s.player.x=h.x+20;s.player.y=h.y;t.step(.01);check(s.bumps===1&&Math.hypot(s.player.vx,s.player.vy)>0&&s.lives===5,'bumper physical impulse');t.step(.01);check(s.bumps===1,'bumper shield');
   t.start(5,0);const b=R.point(s.course,s.course.boost[0].seg,s.course.boost[0].t);s.player.x=b.x;s.player.y=b.y;t.step(.1);const free=s.player.vx;t.start(5,0);s.player.x=b.x;s.player.y=b.y;t.input.brake=true;t.step(.1);check(s.player.vx<free,'brake counteracts tailwind');
   t.start(1,0);t.input.right=true;for(let i=0;i<40;i++)t.step(1/120);const v=s.player.vx;t.input.right=false;t.step(.05);check(s.player.vx>0&&s.player.vx<v,'coasting drag');t.input.brake=true;t.step(.1);check(s.player.vx<v*.6,'brake deceleration');
   t.start(4,0);s.elapsed=s.course.time;t.step(.01);check(s.mode==='lost','timeout');t.start(2,0);s.lives=1;t.fall();for(let i=0;i<80;i++)t.step(.01);check(s.mode==='lost','last marble game over');
  });
  await page.locator('#result-help').click();assert.equal(await page.locator('#result-modal').isVisible(),false);await page.locator('#instruction-close').click();assert.ok(await page.locator('#result-modal').isVisible());await page.locator('#retry').click();assert.equal(await page.evaluate(()=>__marbleTest.state.level),2);
  await page.evaluate(()=>__marbleTest.start(1,0));await page.keyboard.down('ArrowUp');await page.evaluate(()=>{for(let i=0;i<60;i++)__marbleTest.step(1/120);});await page.keyboard.up('ArrowUp');assert.ok(await page.evaluate(()=>__marbleTest.state.player.y<440));await page.keyboard.down('Space');assert.ok(await page.evaluate(()=>__marbleTest.input.brake));await page.keyboard.up('Space');assert.equal(await page.evaluate(()=>__marbleTest.input.brake),false);
  await page.locator('#help-button').click();const time=await page.evaluate(()=>__marbleTest.state.elapsed);await page.evaluate(()=>__marbleTest.step(.2));assert.equal(await page.evaluate(()=>__marbleTest.state.elapsed),time);await page.keyboard.press('KeyR');assert.ok(await page.locator('#instruction-modal').isVisible());await page.locator('#instruction-close').click();await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>__marbleTest.state.mode),'paused');await page.keyboard.press('KeyP');await page.keyboard.press('KeyM');assert.ok(await page.evaluate(()=>__marbleTest.muted()));await page.keyboard.press('KeyR');assert.equal(await page.evaluate(()=>__marbleTest.state.score),0);
  await page.evaluate(()=>{__marbleTest.start(4,200);__marbleTest.state.score=999;__marbleTest.finish(false);});await page.locator('#retry').click();assert.equal(await page.evaluate(()=>__marbleTest.state.score),200);await page.evaluate(()=>__marbleTest.finish(true));await page.locator('#next').click();assert.equal(await page.evaluate(()=>__marbleTest.state.level),5);await page.evaluate(()=>{__marbleTest.start(7,0);__marbleTest.finish(true);});assert.equal(await page.locator('#next').isVisible(),false);await page.locator('#again').click();assert.equal(await page.evaluate(()=>__marbleTest.state.level),1);
  await page.reload();assert.equal(await page.locator('#instruction-modal').isVisible(),false);await page.evaluate(()=>__marbleTest.manual(true));await page.keyboard.down('ArrowRight');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>__marbleTest.input.right),false);assert.equal(await page.evaluate(()=>__marbleTest.state.mode),'paused');await page.keyboard.up('ArrowRight');
  report.layouts=[];
  for(const[width,height]of[[667,375],[740,390],[844,390],[390,844]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1});await context.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('test refusal'));});const mobile=await context.newPage();watch(mobile);await mobile.goto(base+'/marble-circuit/?test=1');assert.equal(await mobile.locator('#brake').isVisible(),false);await mobile.locator('#instruction-close').click();await mobile.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');await mobile.evaluate(()=>__marbleTest.manual(true));
   if(width>height){
    const cdp=await context.newCDPSession(mobile),joy=await mobile.locator('[data-joystick]').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2,touch=async(type,points)=>{await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});await mobile.waitForTimeout(20);};
    await touch('touchStart',[{x:x+25,y,id:1}]);assert.ok(await mobile.evaluate(()=>__marbleTest.input.touchX>.5));await touch('touchMove',[{x:x+21,y:y-21,id:1}]);assert.ok(await mobile.evaluate(()=>__marbleTest.input.touchX>0&&__marbleTest.input.touchY<0));await touch('touchMove',[{x,y,id:1}]);assert.equal(await mobile.evaluate(()=>__marbleTest.input.touchX+__marbleTest.input.touchY),0);await touch('touchEnd',[]);
    const b=await mobile.locator('#brake').boundingBox();await touch('touchStart',[{x:x+25,y,id:1},{x:b.x+b.width/2,y:b.y+b.height/2,id:2}]);assert.ok(await mobile.evaluate(()=>__marbleTest.input.brake&&__marbleTest.input.touchX>0));await mobile.evaluate(()=>{for(let i=0;i<60;i++)__marbleTest.step(1/120);});assert.ok(await mobile.evaluate(()=>__marbleTest.state.player.x>115));await touch('touchCancel',[]);assert.equal(await mobile.evaluate(()=>Boolean(__marbleTest.input.brake||__marbleTest.input.touchX)),false);
    assert.ok(await mobile.locator('[data-joystick]').evaluate(el=>!el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))));
    await mobile.locator('.vibecade-mobile-options').click();await mobile.waitForFunction(()=>__marbleTest.state.mode==='paused');await mobile.locator('#vibecade-options').getByRole('button',{name:'Use buttons in all games',exact:true}).click();await mobile.locator('.vibecade-options-close').click();await mobile.waitForFunction(()=>__marbleTest.state.mode==='playing');const right=await mobile.locator('[data-direction="right"]').boundingBox(),up=await mobile.locator('[data-direction="up"]').boundingBox();await touch('touchStart',[{x:right.x+20,y:right.y+20,id:3},{x:up.x+20,y:up.y+20,id:4}]);assert.ok(await mobile.evaluate(()=>__marbleTest.input.touchX>0&&__marbleTest.input.touchY<0&&Math.hypot(__marbleTest.input.touchX,__marbleTest.input.touchY)<=1.01));await touch('touchEnd',[]);assert.equal(await mobile.evaluate(()=>__marbleTest.input.touchX),0);assert.equal(await mobile.evaluate(()=>localStorage.getItem('vibecade-mobile-controls')),'buttons');
    await mobile.locator('#touch-pause').tap();assert.equal(await mobile.evaluate(()=>__marbleTest.state.mode),'paused');await mobile.locator('#touch-pause').tap();await mobile.locator('#touch-sound').tap();assert.ok(await mobile.evaluate(()=>__marbleTest.muted()));await mobile.locator('.vibecade-mobile-restart').tap();assert.equal(await mobile.evaluate(()=>__marbleTest.state.level),1);
    const geo=await mobile.evaluate(()=>{const r=e=>{const q=e.getBoundingClientRect();return{x:q.x,y:q.y,right:q.right,bottom:q.bottom,width:q.width,height:q.height};};return{play:r(document.getElementById('playfield')),canvas:r(document.getElementById('game')),joy:r(document.querySelector('[data-joystick]')),actions:[...document.querySelectorAll('.touch-actions button')].map(r),overflow:document.documentElement.scrollWidth>innerWidth};});assert.equal(geo.overflow,false);assert.ok(geo.joy.right<=geo.play.x+1);assert.ok(geo.play.bottom<=height);assert.ok(Math.abs(geo.canvas.width/geo.canvas.height-1.6)<.03);for(const a of geo.actions){assert.ok(a.x>=geo.play.right-1);assert.ok(a.bottom<=height);}for(let i=1;i<geo.actions.length;i++)assert.ok(geo.actions[i].y>geo.actions[i-1].bottom);report.layouts.push({width,height,...geo});
    await mobile.evaluate(()=>{__marbleTest.start(5,0);__marbleTest.draw();});await mobile.screenshot({path:out+`/mobile-${width}x${height}.png`});
    if(width===667){report.mobilePerformance=await frames(mobile);await mobile.reload();await mobile.waitForSelector('.vibecade-mobile-ready');assert.equal(await mobile.evaluate(()=>__marbleTest.state.mode),'instructions');assert.equal(await mobile.evaluate(()=>document.querySelector('[data-joystick]').dataset.controlStyle),'buttons');await mobile.locator('.vibecade-mobile-play').tap();await mobile.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');assert.equal(await mobile.evaluate(()=>document.documentElement.dataset.mobileFullscreenAttempted),'true');}
   }else{assert.ok(await mobile.locator('#orientation').isVisible());const time=await mobile.evaluate(()=>__marbleTest.state.elapsed);await mobile.evaluate(()=>__marbleTest.step(.1));assert.equal(await mobile.evaluate(()=>__marbleTest.state.elapsed),time);await mobile.screenshot({path:out+'/portrait.png'});}await context.close();
  }
  report.performance=await frames(page);await page.evaluate(installPilot);await page.evaluate(()=>pilot(5,{delay:.12,pace:145,stop:12}));await page.locator('#game').click();await page.screenshot({path:out+'/marble-circuit-gameplay.png'});for(let level=1;level<=7;level++){await page.evaluate(l=>{__marbleTest.start(l,0);__marbleTest.draw();},level);await page.screenshot({path:out+`/course-${level}.png`});}
  const normal=await browser.newPage({viewport:{width:1440,height:900}});watch(normal);await normal.goto(base+'/marble-circuit/');assert.equal(await normal.evaluate(()=>typeof __marbleTest),'undefined');await normal.locator('#instruction-close').click();await normal.keyboard.down('ArrowUp');await normal.waitForTimeout(550);await normal.keyboard.up('ArrowUp');await normal.locator('#help-button').click();const clock=await normal.locator('#time').textContent();await normal.waitForTimeout(200);assert.equal(await normal.locator('#time').textContent(),clock);await normal.close();
  const root=await browser.newPage();const rootErrors=[];root.on('pageerror',e=>rootErrors.push(e.message));await root.goto(base+'/');const card=root.locator('a.card[href="marble-circuit/"]');assert.equal(await card.count(),1);assert.equal(await card.evaluate(e=>e.closest('[data-status]').dataset.status),'work');await card.click();assert.match(await root.title(),/Marble Circuit/);assert.deepEqual(rootErrors,[]);await root.close();assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));console.log('Controls, layouts, gameplay, recovery, endings, links and consoles passed.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

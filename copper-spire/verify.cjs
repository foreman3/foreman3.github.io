const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SPIRE_BASE_URL||'http://127.0.0.1:8767';
const out=process.env.SPIRE_REPORT_DIR||'C:/Users/forem/.codex/visualizations/2026/10/08/01a11a19-2994-7df3-9a5d-e1a1a1e7ae2c';
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
 try{
 fs.mkdirSync(out,{recursive:true});const report={},errors=[];
 const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
 const page=await browser.newPage({viewport:{width:1440,height:900}});watch(page);await page.goto(base+'/copper-spire/?test=1');await page.waitForTimeout(150);
 assert.equal(await page.locator('#instruction-modal').isVisible(),true);const before=await page.evaluate(()=>__spireTest.state.time);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>__spireTest.state.time),before);
 await page.locator('#instruction-close').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>__spireTest.state.mode==='playing');await page.evaluate(()=>__spireTest.manual(true));
 await page.evaluate(()=>{
  const t=__spireTest,s=t.state;window.benchmark=(level,delay=.35,forced=0,usePulse=true,naturalLosses=0)=>{
   t.start(level,0);let target=0,think=0,time=0,forcedLeft=forced;const recoverAt=s.shields-naturalLosses;t.input.fire=!naturalLosses;
   while(s.mode==='playing'&&time<95){
    if(s.shields>recoverAt){t.input.fire=false;t.input.left=t.input.right=false;t.step(1/60);time+=1/60;continue;}t.input.fire=true;
    if(forcedLeft>0&&s.time>2+(forced-forcedLeft)*2.2){s.shieldTime=0;t.damage({lane:0,p:1,dead:false});forcedLeft--;}
    if(think<=0){const candidates=s.enemies.filter(e=>!e.dead);candidates.sort((a,b)=>b.p-a.p);if(candidates.length)target=candidates[0].lane;think=delay;}
    const delta=((target-s.lane+18)%12)-6;t.input.left=delta<0;t.input.right=delta>0;
    if(usePulse&&s.pulses>0&&s.enemies.filter(e=>e.p>.72).length>=2)t.pulse();
    t.step(1/60);think-=1/60;time+=1/60;
   }
   return{level,delay,mode:s.mode,time:+time.toFixed(2),shields:s.shields,pulses:s.pulses,kills:s.kills,breaches:s.breaches,score:s.score};
  };
 });
 report.curve=await page.evaluate(()=>[1,2,3,4,5,6,7].map(l=>benchmark(l,.35)));
 report.slower=await page.evaluate(()=>[1,2,3,4,5,6,7].map(l=>benchmark(l,.65)));
 report.expert=await page.evaluate(()=>[6,7].map(l=>benchmark(l,.12)));
 report.recovery=await page.evaluate(()=>benchmark(5,.35,2));
 report.naturalRecovery=await page.evaluate(()=>benchmark(5,.35,0,true,2));
 report.idle=await page.evaluate(()=>[1,2,3,4,5,6,7].map(l=>benchmark(l,.35,0,false,10)));
 console.log('Curve: '+JSON.stringify(report.curve)+' Recovery: '+JSON.stringify(report.recovery));
 fs.writeFileSync(out+'/curve-initial.json',JSON.stringify(report,null,2));
 // Actual keyboard path, help freeze, pause, mute, reset and returning-session gate.
 await page.evaluate(()=>__spireTest.start(1,0));await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>__spireTest.state.lane),1);
 await page.keyboard.down('Space');await page.evaluate(()=>__spireTest.step(.03));assert.equal(await page.evaluate(()=>__spireTest.input.fire),true);await page.keyboard.up('Space');assert.equal(await page.evaluate(()=>__spireTest.input.fire),false);
 await page.locator('#help-button').click();assert.equal(await page.evaluate(()=>__spireTest.state.mode),'instructions');const freeze=await page.evaluate(()=>__spireTest.state.time);await page.evaluate(()=>__spireTest.step(.04));assert.equal(await page.evaluate(()=>__spireTest.state.time),freeze);await page.locator('#instruction-close').click();
 await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>__spireTest.state.mode),'paused');await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>__spireTest.state.mode),'playing');await page.keyboard.press('KeyM');assert.equal(await page.evaluate(()=>__spireTest.muted()),true);
 await page.keyboard.press('KeyR');assert.equal(await page.evaluate(()=>__spireTest.state.level),1);assert.equal(await page.evaluate(()=>__spireTest.state.score),0);
 await page.evaluate(()=>{__spireTest.finish(true);});await page.locator('#next').click();assert.equal(await page.evaluate(()=>__spireTest.state.level),2);
 await page.evaluate(()=>{const t=__spireTest;t.start(4,200);t.state.score=999;t.state.shields=1;t.state.shieldTime=0;t.damage({lane:0,p:1});});await page.locator('#retry').click();assert.equal(await page.evaluate(()=>__spireTest.state.score),200);
 await page.evaluate(()=>{__spireTest.start(7,0);__spireTest.finish(true);});assert.equal(await page.locator('#next').isVisible(),false);await page.locator('#again').click();assert.equal(await page.evaluate(()=>__spireTest.state.level),1);
 await page.reload();assert.equal(await page.locator('#instruction-modal').isVisible(),false);await page.evaluate(()=>__spireTest.manual(true));
 await page.locator('#help-button').click();await page.keyboard.press('KeyR');assert.equal(await page.locator('#instruction-modal').isVisible(),true);assert.equal(await page.evaluate(()=>__spireTest.state.mode),'instructions');await page.locator('#instruction-close').click();
 // Real actors exercise shot damage, armor, pulse reach/reserve, breach and protection.
 await page.evaluate(()=>{const t=__spireTest,s=t.state;const check=(v,m)=>{if(!v)throw Error(m);};t.start(4,0);s.enemies=[{lane:0,p:.9,type:'armor',hp:2,age:0,flipAt:2,dead:false}];t.fire();t.step(.04);check(s.enemies[0].hp===1,'armor first plate');for(let i=0;i<12;i++)t.step(1/60);t.fire();t.step(.04);check(s.kills===1,'armor killed');s.enemies=[{lane:0,p:.1,type:'climb',hp:1,age:0,dead:false},{lane:1,p:.7,type:'climb',hp:1,age:0,dead:false}];t.pulse();check(s.pulses===1&&s.enemies[0].dead===false&&s.enemies[1].dead,'pulse range');const h=s.shields;s.shieldTime=0;s.enemies=[{lane:2,p:.999,type:'climb',hp:1,age:0,dead:false}];t.step(.03);check(s.shields===h-1,'real breach');s.enemies=[{lane:3,p:.999,type:'climb',hp:1,age:0,dead:false}];t.step(.03);check(s.shields===h-1,'protection');});
 await page.evaluate(()=>{const t=__spireTest,s=t.state,check=(v,m)=>{if(!v)throw Error(m);};t.start(5,0);const e={lane:2,p:.4,type:'flip',hp:1,age:1,flipAt:.2,dir:1,dead:false};s.enemies=[e];t.step(.04);check(e.warning===1&&e.lane===2,'flip warning');for(let i=0;i<15;i++)t.step(1/60);check(e.lane===3,'flip switch');const z={lane:4,p:.3,type:'surge',hp:1,age:1.12,dead:false};s.enemies=[z];t.step(.03);check(z.warning===1,'surge warning');const p=z.p;z.age=1.6;t.step(.03);check(z.p-p>.015,'surge speed');t.start(3,0);for(let i=0;i<220;i++)t.step(1/60);check(s.enemies.some(e=>e.type==='needle'),'needles introduced in 3');});
 report.layouts=[];
 for(const [width,height]of [[667,375],[740,390],[844,390],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1});await context.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('fullscreen refused for test'));});const mobile=await context.newPage();watch(mobile);await mobile.goto(base+'/copper-spire/?test=1');
  assert.equal(await mobile.locator('#instruction-modal').isVisible(),true);assert.equal(await mobile.locator('#fire').isVisible(),false);await mobile.locator('#instruction-close').click();await mobile.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');await mobile.evaluate(()=>__spireTest.manual(true));
  if(width>height){
   const cdp=await context.newCDPSession(mobile),box=await mobile.locator('[data-joystick]').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
   const touch=async(type,points)=>{await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});await mobile.waitForTimeout(30);};
   await touch('touchStart',[{x:x+29,y,id:1}]);assert.equal(await mobile.evaluate(()=>__spireTest.input.touch>0),true);await mobile.evaluate(()=>__spireTest.step(.04));
   await touch('touchMove',[{x:x-29,y,id:1}]);assert.equal(await mobile.evaluate(()=>__spireTest.input.touch<0),true);
   await touch('touchMove',[{x,y,id:1}]);assert.equal(await mobile.evaluate(()=>__spireTest.input.touch),0);
   await touch('touchMove',[{x:x+29,y,id:1}]);const f=await mobile.locator('#fire').boundingBox();await touch('touchMove',[{x:x+29,y,id:1},{x:f.x+f.width/2,y:f.y+f.height/2,id:2}]);
   // A second touchStart introduces the independent fire finger.
   await touch('touchEnd',[]);await touch('touchStart',[{x:x+29,y,id:1},{x:f.x+f.width/2,y:f.y+f.height/2,id:2}]);assert.equal(await mobile.evaluate(()=>__spireTest.input.touchFire),true);await touch('touchCancel',[]);assert.equal(await mobile.evaluate(()=>Boolean(__spireTest.input.touchFire||__spireTest.input.touch)),false);
   await mobile.locator('.vibecade-mobile-options').click();await mobile.locator('#vibecade-options').getByRole('button',{name:'Use buttons in all games',exact:true}).click();await mobile.locator('.vibecade-options-close').click();
   const db=await mobile.locator('[data-direction="right"]').boundingBox();await touch('touchStart',[{x:db.x+db.width/2,y:db.y+db.height/2,id:3}]);assert.equal(await mobile.evaluate(()=>__spireTest.input.touch),1);await mobile.evaluate(()=>__spireTest.step(.04));await touch('touchEnd',[]);assert.equal(await mobile.evaluate(()=>__spireTest.input.touch),0);assert.equal(await mobile.evaluate(()=>localStorage.getItem('vibecade-mobile-controls')),'buttons');
   const prevented=await mobile.evaluate(()=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.querySelector('[data-joystick]').dispatchEvent(e);return e.defaultPrevented;});assert.equal(prevented,true);
   await mobile.locator('#touch-pause').tap();assert.equal(await mobile.evaluate(()=>__spireTest.state.mode),'paused');await mobile.locator('#touch-pause').tap();await mobile.locator('#touch-sound').tap();assert.equal(await mobile.evaluate(()=>__spireTest.muted()),true);
   await mobile.locator('.vibecade-mobile-restart').tap();assert.equal(await mobile.evaluate(()=>__spireTest.state.level),1);
   const geometry=await mobile.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};return{play:rect(document.getElementById('playfield')),joy:rect(document.querySelector('[data-joystick]')),actions:[...document.querySelectorAll('.touch-actions button')].map(rect),overflow:document.documentElement.scrollWidth>innerWidth};});assert.equal(geometry.overflow,false);assert.ok(geometry.joy.right<=geometry.play.x+1);for(const a of geometry.actions){assert.ok(a.x>=geometry.play.right-1);assert.ok(a.bottom<=height);}for(let i=1;i<geometry.actions.length;i++)assert.ok(geometry.actions[i].y>=geometry.actions[i-1].bottom);report.layouts.push({width,height,...geometry});
   await mobile.evaluate(()=>{__spireTest.start(5,0);for(let i=0;i<210;i++)__spireTest.step(1/60);});await mobile.screenshot({path:out+`/mobile-${width}x${height}.png`});
   if(width===667){
    report.mobilePerformance=await mobile.evaluate(async()=>{__spireTest.manual(false);const times=[];let prev;await new Promise(resolve=>{const tick=t=>{if(prev)times.push(t-prev);prev=t;if(times.length<120)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});__spireTest.manual(true);times.sort((a,b)=>a-b);return{mean:times.reduce((a,b)=>a+b)/times.length,p95:times[Math.floor(times.length*.95)]};});
    await mobile.reload();await mobile.waitForSelector('.vibecade-mobile-ready');assert.equal(await mobile.evaluate(()=>__spireTest.state.mode),'instructions');assert.equal(await mobile.evaluate(()=>document.querySelector('[data-joystick]').dataset.controlStyle),'buttons');await mobile.locator('.vibecade-mobile-play').tap();await mobile.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');assert.equal(await mobile.evaluate(()=>__spireTest.state.mode),'playing');assert.equal(await mobile.evaluate(()=>document.documentElement.dataset.mobileFullscreenAttempted),'true');
   }
  }else{assert.equal(await mobile.locator('#orientation').isVisible(),true);await mobile.screenshot({path:out+'/portrait.png'});report.layouts.push({width,height,orientationPrompt:true});}
  await context.close();
 }
 report.performance=await page.evaluate(async()=>{__spireTest.start(5,0);__spireTest.manual(false);__spireTest.input.fire=true;const times=[];let previous;await new Promise(resolve=>{const tick=t=>{if(previous)times.push(t-previous);previous=t;if(times.length<120)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});__spireTest.manual(true);times.sort((a,b)=>a-b);return{mean:times.reduce((a,b)=>a+b)/times.length,p95:times[Math.floor(times.length*.95)]};});
 await page.evaluate(()=>{__spireTest.start(5,0);__spireTest.input.fire=true;for(let i=0;i<480;i++){if(i%90===0)__spireTest.rotate(1);__spireTest.step(1/60);}__spireTest.input.fire=false;});
 await page.screenshot({path:out+'/copper-spire-gameplay.png'});assert.deepEqual(errors,[]);
 // Normal page without diagnostic hooks: actual keyboard shooting and rim travel.
 const natural=await browser.newPage({viewport:{width:1440,height:900}});watch(natural);await natural.goto(base+'/copper-spire/');assert.equal(await natural.evaluate(()=>typeof __spireTest),'undefined');await natural.locator('#instruction-close').click();await natural.keyboard.down('Space');await natural.waitForTimeout(2200);await natural.keyboard.down('ArrowRight');await natural.waitForTimeout(1000);await natural.keyboard.up('ArrowRight');await natural.keyboard.up('Space');assert.ok(Number((await natural.locator('#score').textContent()).replaceAll(',',''))>0);await natural.locator('#help-button').click();const naturalScore=await natural.locator('#score').textContent();await natural.waitForTimeout(150);assert.equal(await natural.locator('#score').textContent(),naturalScore);await natural.close();
 const root=await browser.newPage();const rootErrors=[];root.on('pageerror',e=>rootErrors.push(e.message));await root.goto(base+'/');const card=root.locator('.game-section[data-status="work"] a[href="copper-spire/"]');assert.equal(await card.count(),1);await card.click();await root.waitForURL('**/copper-spire/');assert.equal(await root.title(),'Copper Spire | VibeCade');assert.deepEqual(rootErrors,[]);await root.close();report.errors=errors;fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));console.log('Functional, mobile, layout, console and frame checks passed');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.HARBOR_BASE_URL||'http://127.0.0.1:8765',out=process.env.HARBOR_REPORT_DIR||'C:/Users/forem/.codex/visualizations/2026/10/06/01a10fcd-3510-78c0-a111-5c284d643a73';
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});globalThis.browser=browser;fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],report={};
 const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')errors.push(e.text());});};watch(page);
 await page.goto(base+'/harbor-bastion/?test=1');await page.waitForTimeout(250);
 assert.equal(await page.locator('#instruction-modal').isVisible(),true);const intro=await page.evaluate(()=>__harborTest.state.time);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>__harborTest.state.time),intro);
 await page.locator('#instruction-close').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>__harborTest.state.mode==='playing');
 await page.evaluate(()=>__harborTest.manual(true));await page.locator('canvas').focus();const x=await page.evaluate(()=>__harborTest.state.cursor.x);await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>__harborTest.state.cursor.x),x+1);await page.keyboard.press('x');assert.equal(await page.evaluate(()=>__harborTest.state.rotation),1);
 await page.keyboard.press('p');assert.equal(await page.evaluate(()=>__harborTest.state.mode),'paused');await page.keyboard.press('p');await page.locator('#help-button').click();assert.equal(await page.evaluate(()=>__harborTest.state.mode),'help');const frozen=await page.evaluate(()=>__harborTest.state.time);await page.evaluate(()=>__harborTest.tick(1));assert.equal(await page.evaluate(()=>__harborTest.state.time),frozen);await page.locator('#instruction-close').click();
 await page.keyboard.press('m');assert.equal(await page.evaluate(()=>__harborTest.state.muted),true);await page.keyboard.press('m');
 // Deterministic planners use the exact test-only state. They are mechanical checks, not human difficulty ratings.
 await page.evaluate(()=>{
  window.repair=(n,delay=1)=>{const t=__harborTest,s=t.state;t.begin(n,false);let placements=0;
   for(let attempt=0;attempt<45&&!t.enclosure().sealed&&s.mode==='playing';attempt++){
    let best=null;
    for(let r=0;r<4;r++){s.rotation=r;const pts=t.shape();for(let y=0;y<12;y++)for(let x=0;x<10;x++){
     const cells=pts.map(([dx,dy])=>[x+dx,y+dy]);if(cells.some(([a,b])=>a<0||a>=10||b<0||b>=12||(a>=3&&a<=5&&b>=4&&b<=7)))continue;
     let value=0;for(const [a,b]of cells)if(!s.walls.has(b*20+a)&&((a>=1&&a<=7&&(b===2||b===9))||(b>=3&&b<=8&&(a===1||a===7))))value++;
     if(value&&(!best||value>best.value))best={x,y,r,value};
    }}
    if(!best)throw Error('Unsolvable repair coast '+n);s.rotation=best.r;t.setCursor(best.x,best.y);for(let z=0;z<delay*60;z++)t.tick(1/60);t.place();placements++;
   }return {sealed:t.enclosure().sealed,placements,remaining:s.time,mode:s.mode};
  };
  window.battle=(n,policy='lead',delay=.25,forced=0)=>{
   const t=__harborTest,s=t.state;const build=repair(n,1.1);if(!build.sealed)return{build,mode:s.mode};t.launch();let think=0,time=0,mends=0,missStart=forced;
   while(s.mode==='playing'&&time<70){
    if(think<=0){think=delay;
     if(policy!=='flat'&&s.mends>0&&(s.hp<=s.cfg.hp-2||s.shells.length>=3)){const before=s.mends;t.mend();mends+=before-s.mends;}
     let target=[...s.ships].sort((a,b)=>a.fire-b.fire)[0];
     if(policy==='expert')target=[...s.ships].filter(ship=>s.shots.filter(q=>q.targetId===ship.id).length<ship.hp).sort((a,b)=>a.fire-b.fire)[0];
     if(policy==='expert'&&s.cooldown<=0&&!t.enclosure().sealed){
      const q=s.shells.filter(q=>q.t>=0&&!s.walls.has(Math.floor(q.ty/50)*20+Math.floor(q.tx/50))&&!s.shots.some(shot=>shot.shellTarget===q)).sort((a,b)=>(a.duration-a.t)-(b.duration-b.t))[0];
      if(q){let x=q.x,y=q.y;const start=t.nextCannon();for(let i=0;i<4;i++){const travel=Math.hypot(x-start[0],y-start[1])/600,a=Math.min(1,(q.t+travel)/q.duration);x=q.sx+(q.tx-q.sx)*a;y=q.sy+(q.ty-q.sy)*a;}if(x>=20){t.aim(x,y);t.fire();s.shots.at(-1).shellTarget=q;target=null;}}
     }
     if(target&&s.cooldown<=0){let y=target.y;let duration=Math.hypot(target.x-320,y-300)/600;
      if(policy==='expert'){const start=t.nextCannon();for(let i=0;i<4;i++){duration=Math.hypot(target.x-start[0],y-start[1])/600;y=target.y+target.dir*target.speed*duration;if(y>515)y=1030-y;if(y<80)y=160-y;}}
      else if(policy==='lead'){y+=target.dir*target.speed*duration;if(y>515)y=1030-y;if(y<80)y=160-y;}
      if(missStart>0){y=target.y+170;missStart--;}
      t.aim(target.x,y);t.fire();if(policy==='expert')s.shots.at(-1).targetId=target.id;
     }
    }t.tick(1/60);think-=1/60;time+=1/60;
   }t.render();return{level:n,policy,build,time:+time.toFixed(2),mode:s.mode,hp:s.hp,kills:s.kills,shots:s.shotsFired,misses:s.misses,interceptions:s.interceptions,mends,damage:s.damage};
  };
 });
 report.curve=await page.evaluate(()=>Array.from({length:7},(_,i)=>battle(i+1,'lead',.35)));
 report.flat=await page.evaluate(()=>Array.from({length:7},(_,i)=>battle(i+1,'flat',.45)));
 report.expert=await page.evaluate(()=>[battle(6,'expert',.12),battle(7,'expert',.08)]);
 report.missMargin=await page.evaluate(()=>battle(5,'lead',.35,5));
 report.recovery=await page.evaluate(()=>{const t=__harborTest;repair(5);t.launch();t.damage();t.damage();t.mend();/* continue using the existing siege */let time=0;while(t.state.mode==='playing'&&time<70){const s=t.state.ship;const ship=__harborTest.state.ships[0];if(ship&&t.state.cooldown<=0){let y=ship.y+ship.dir*ship.speed*Math.hypot(ship.x-320,ship.y-300)/600;if(y>515)y=1030-y;if(y<80)y=160-y;t.aim(ship.x,y);t.fire();}t.tick(1/60);time+=1/60;}return{mode:t.state.mode,hp:t.state.hp,damage:t.state.damage,time,misses:t.state.misses};});
 console.log(JSON.stringify(report,null,2));
 if(process.env.HARBOR_CURVE_ONLY){await browser.close();return;}
 assert.ok(report.curve.slice(0,6).every(r=>r.mode==='won'));assert.equal(report.flat[5].mode,'lost');assert.equal(report.flat[6].mode,'lost');assert.equal(report.expert[1].mode,'won');assert.ok(report.missMargin.hp>=2&&report.missMargin.mode==='won');assert.equal(report.recovery.mode,'won');
 report.mechanics=await page.evaluate(()=>{
  const t=__harborTest,s=t.state;repair(5);t.launch();const initial=s.hp;
  // Damage the real wall, verify a breach allows keep damage, then use a real repair.
  const wall=[...s.walls].find(id=>{s.walls.delete(id);const required=!t.enclosure().sealed;s.walls.add(id);return required;}),x=(wall%20)*50+25,y=Math.floor(wall/20)*50+25;t.impact({tx:x,ty:y});const breached=!t.enclosure().sealed;t.impact({tx:x,ty:y});const hurt=s.hp===initial-1;t.mend();const restored=t.enclosure().sealed&&s.mends===1;
  s.shells=[{x:725,y:300,sx:725,sy:300,tx:725,ty:300,t:0,duration:9}];t.aim(725,300);t.fire();for(let i=0;i<70;i++)t.tick(1/60);const intercepted=s.interceptions>0;
  t.begin(1);s.time=.01;t.tick(1/60);const timeout=s.mode==='lost';return{breached,hurt,restored,intercepted,timeout};
 });assert.ok(Object.values(report.mechanics).every(Boolean));
 // Active desktop screenshot from real-time natural spawns after repairing coast 5.
 await page.evaluate(()=>{repair(5);__harborTest.launch();__harborTest.manual(false);});await page.waitForTimeout(250);
 for(let attempt=0;attempt<3;attempt++){const target=await page.evaluate(()=>{const t=__harborTest,s=t.state.ships[0];if(!s)return null;const c=t.nextCannon(),duration=Math.hypot(s.x-c[0],s.y-c[1])/600;let y=s.y+s.dir*s.speed*duration;if(y>515)y=1030-y;if(y<80)y=160-y;const r=document.querySelector('canvas').getBoundingClientRect();return{x:r.x+s.x/1000*r.width,y:r.y+y/600*r.height};});if(target)await page.mouse.click(target.x,target.y);await page.waitForTimeout(1100);}
 await page.waitForTimeout(4600);await page.screenshot({path:out+'/harbor-bastion-gameplay.png'});report.screenshotState=await page.evaluate(()=>({mode:__harborTest.state.mode,kills:__harborTest.state.kills,hp:__harborTest.state.hp,ships:__harborTest.state.ships.length,shells:__harborTest.state.shells.length}));assert.equal(report.screenshotState.mode,'playing');
 await page.evaluate(()=>__harborTest.manual(true));
 // Real pointer/keyboard combat and build controls.
 const box=await page.locator('canvas').boundingBox();await page.mouse.click(box.x+box.width*.75,box.y+box.height*.4);assert.ok(await page.evaluate(()=>__harborTest.state.shotsFired)>0);
 await page.locator('canvas').focus();await page.evaluate(()=>__harborTest.state.cooldown=0);const shots=await page.evaluate(()=>__harborTest.state.shotsFired);await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__harborTest.state.shotsFired),shots+1);
 await page.keyboard.press('r');assert.equal(await page.evaluate(()=>__harborTest.state.level),1);await page.evaluate(()=>{__harborTest.setCursor(3,2);});const stones=await page.evaluate(()=>__harborTest.state.walls.size);await page.keyboard.press('Space');assert.ok(await page.evaluate(()=>__harborTest.state.walls.size)>stones);
 await page.evaluate(()=>__harborTest.finish(false,'test'));await page.locator('#retry').click();assert.equal(await page.evaluate(()=>__harborTest.state.mode),'playing');await page.evaluate(()=>{__harborTest.state.level=7;__harborTest.finish(true);});await page.locator('#again').click();assert.equal(await page.evaluate(()=>__harborTest.state.level),1);
 await page.reload();assert.equal(await page.locator('#instruction-modal').isVisible(),false);await page.evaluate(()=>{__harborTest.manual(true);__harborTest.begin(5);__harborTest.state.walls=new Set(Array.from({length:7},(_,x)=>[2*20+x+1,9*20+x+1]).flat().concat(Array.from({length:6},(_,y)=>[(y+3)*20+1,(y+3)*20+7]).flat()));__harborTest.launch();__harborTest.manual(false);});
 report.frames=await page.evaluate(async()=>{const deltas=[];let previous=performance.now();return await new Promise(resolve=>{function frame(now){deltas.push(now-previous);previous=now;if(deltas.length<120)requestAnimationFrame(frame);else{deltas.sort((a,b)=>a-b);resolve({mean:deltas.reduce((a,b)=>a+b,0)/deltas.length,p95:deltas[Math.floor(deltas.length*.95)]});}}requestAnimationFrame(frame);});});
 await page.evaluate(()=>{__harborTest.manual(true);__harborTest.state.mode='paused';__harborTest.render();});report.layouts=[];
 for(const [width,height]of [[667,375],[740,390],[844,390],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});const p=await context.newPage();watch(p);
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Test refusal'));});await p.goto(base+'/harbor-bastion/?test=1');await p.locator('#instruction-close').click();await p.waitForTimeout(900);
  if(width>height){await p.waitForFunction(()=>__harborTest.state.mode==='playing');await p.evaluate(()=>__harborTest.manual(true));const c=await p.locator('canvas').boundingBox();await p.touchscreen.tap(c.x+c.width*.3,c.y+c.height/6);const before=await p.evaluate(()=>__harborTest.state.walls.size);await p.locator('#place').tap();assert.ok(await p.evaluate(()=>__harborTest.state.walls.size)>before);await p.locator('#rotate').tap();assert.equal(await p.evaluate(()=>__harborTest.state.rotation),1);await p.locator('.vibecade-mobile-restart').tap();assert.equal(await p.evaluate(()=>__harborTest.state.piece),0);
   assert.equal(await p.evaluate(()=>document.documentElement.dataset.mobileFullscreenAttempted),'true');
   if(width===667){const cdp=await context.newCDPSession(p),point=(x,y)=>({x:c.x+c.width*x,y:c.y+c.height*y,id:1,radiusX:4,radiusY:4,force:1});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(.2,.2)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.35,.4)]});assert.deepEqual(await p.evaluate(()=>__harborTest.state.cursor),{x:7,y:4});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await p.evaluate(()=>{const t=__harborTest;t.state.walls=new Set(Array.from({length:7},(_,x)=>[2*20+x+1,9*20+x+1]).flat().concat(Array.from({length:6},(_,y)=>[(y+3)*20+1,(y+3)*20+7]).flat()));t.launch();t.manual(false);});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(.7,.5)]});await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>__harborTest.inputs().pointerFire),true);assert.ok(await p.evaluate(()=>__harborTest.state.shotsFired)>=2);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.85,.6)]});assert.ok(await p.evaluate(()=>__harborTest.state.aim.x)>800);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await p.evaluate(()=>__harborTest.inputs().pointerFire),false);
    await p.evaluate(()=>{window.dispatchEvent(new Event('blur'));});assert.equal(await p.evaluate(()=>__harborTest.state.mode),'paused');await p.locator('#pause').tap();await p.locator('#sound').tap();assert.equal(await p.evaluate(()=>__harborTest.state.muted),true);
    await p.evaluate(()=>{const t=__harborTest;t.state.walls.delete(2*20+4);t.render();});await p.locator('#mend').tap();assert.equal(await p.evaluate(()=>__harborTest.state.mends),1);await p.locator('.vibecade-mobile-restart').tap();
    await p.evaluate(()=>{const t=__harborTest;t.begin(5);t.state.walls=new Set(Array.from({length:7},(_,x)=>[2*20+x+1,9*20+x+1]).flat().concat(Array.from({length:6},(_,y)=>[(y+3)*20+1,(y+3)*20+7]).flat()));t.launch();t.manual(false);});await p.waitForTimeout(5000);
    report.mobileFrames=await p.evaluate(async()=>{const deltas=[];let previous=performance.now();return await new Promise(resolve=>{function frame(now){deltas.push(now-previous);previous=now;if(deltas.length<90)requestAnimationFrame(frame);else{deltas.sort((a,b)=>a-b);resolve({mean:deltas.reduce((a,b)=>a+b,0)/deltas.length,p95:deltas[Math.floor(deltas.length*.95)]});}}requestAnimationFrame(frame);});});
   }
   const bounds=await p.evaluate(()=>{const c=document.querySelector('canvas').getBoundingClientRect(),a=document.querySelector('.actions').getBoundingClientRect(),h=document.querySelector('#hud').getBoundingClientRect();return{canvas:{x:c.x,y:c.y,right:c.right,bottom:c.bottom},actions:{x:a.x,y:a.y,right:a.right,bottom:a.bottom},hudBottom:h.bottom,overflow:document.documentElement.scrollWidth>innerWidth};});assert.ok(bounds.actions.x>=bounds.canvas.right);assert.ok(bounds.actions.bottom<=height);assert.ok(bounds.canvas.bottom<=height);assert.equal(bounds.overflow,false);report.layouts.push({width,height,...bounds});
   await p.screenshot({path:out+`/mobile-${width}.png`});await p.reload();await p.locator('.vibecade-mobile-play').click();await p.waitForFunction(()=>__harborTest.state.mode==='playing');
  }else{assert.equal(await p.locator('#orientation').isVisible(),true);report.layouts.push({width,height,orientation:true});await p.screenshot({path:out+'/portrait.png'});}
  await context.close();
 }
 const rootErrors=[],rootConsole=[];const root=await browser.newPage();root.on('pageerror',e=>rootErrors.push(e.message));root.on('console',e=>{if(e.type()==='error')rootConsole.push(e.text());});await root.goto(base);await root.locator('a[href="harbor-bastion/"]').click();assert.match(await root.title(),/Harbor Bastion/);report.rootScriptErrors=rootErrors;report.rootResourceErrors=rootConsole;assert.deepEqual(rootErrors,[]);
 assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));await browser.close();
}
main().catch(async e=>{console.error(e);await globalThis.browser?.close();process.exit(1);});

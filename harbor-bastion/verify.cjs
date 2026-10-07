const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.HARBOR_BASE_URL||'http://127.0.0.1:8766',out=process.env.HARBOR_REPORT_DIR||'C:/Users/forem/.codex/visualizations/2026/10/06/01a10fcd-3510-78c0-a111-5c284d643a73/campaign';
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});globalThis.browser=browser;fs.mkdirSync(out,{recursive:true});
 const report={},errors=[],watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')errors.push(e.text());});};
 const page=await browser.newPage({viewport:{width:1440,height:900}});watch(page);await page.goto(base+'/harbor-bastion/?test=1');
 await page.waitForTimeout(200);assert.equal(await page.locator('#instruction-modal').isVisible(),true);const time=await page.evaluate(()=>__harborTest.state.time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__harborTest.state.time),time);
 await page.locator('#instruction-close').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>__harborTest.state.mode==='playing');await page.evaluate(()=>__harborTest.manual(true));
 await page.evaluate(()=>{
  const t=__harborTest,s=t.state,R=t.rules;
  window.check=(v,m)=>{if(!v)throw Error(m);};
  window.ring=(left,top,right,bottom)=>{const a=new Set();for(let x=left;x<=right;x++)a.add(R.id(x,top)).add(R.id(x,bottom));for(let y=top+1;y<bottom;y++)a.add(R.id(left,y)).add(R.id(right,y));return a;};
  window.fitRing=(desired)=>{
   for(let attempt=0;attempt<150;attempt++){
    const missing=[...desired].filter(n=>!s.walls.has(n));if(!missing.length)return;
    let candidate=null;
    for(let slot=0;slot<3&&!candidate;slot++)for(let rot=0;rot<4&&!candidate;rot++){
     s.tool='wall';s.slot=slot;s.rotation=rot;
     for(const n of missing){const [x,y]=R.xy(n),p=R.placement(s,x,y);if(p.ok&&p.points.every(([a,b])=>desired.has(R.id(a,b)))){candidate={slot,rot,x,y};break;}}
    }
    if(candidate){s.tool='wall';s.slot=candidate.slot;s.rotation=candidate.rot;t.setCursor(candidate.x,candidate.y);check(t.place(),'piece failed');}
    else{
     s.tool='patch';const n=missing.find(n=>{const [x,y]=R.xy(n);return R.placement(s,x,y).ok;});
     if(n!==undefined&&s.patches>0){const [x,y]=R.xy(n);t.setCursor(x,y);check(t.place(),'patch failed');}
     else{
      // A stranded single-square gap can be reshaped by salvaging a neighbor and fitting a complete piece.
      let reshape=null;
      for(let slot=0;slot<3&&!reshape;slot++)for(let rot=0;rot<4&&!reshape;rot++){
       s.tool='wall';s.slot=slot;s.rotation=rot;
       for(const n of desired){const [x,y]=R.xy(n),points=R.selection(s).map(([a,b])=>R.id(x+a,y+b));
        if(!points.every(v=>desired.has(v))||!points.some(v=>missing.includes(v)))continue;
        const removed=points.filter(v=>s.walls.has(v));removed.forEach(v=>s.walls.delete(v));const ok=R.placement(s,x,y).ok;removed.forEach(v=>s.walls.add(v));
        if(ok){reshape={slot,rot,x,y,removed};break;}
       }
      }
      if(reshape){for(const n of reshape.removed){const [x,y]=R.xy(n);s.tool='salvage';t.setCursor(x,y);check(t.place(),'reshape salvage');}s.tool='wall';s.slot=reshape.slot;s.rotation=reshape.rot;t.setCursor(reshape.x,reshape.y);check(t.place(),'reshape piece');}
      else{check(s.supplies>=2,'planner ran out of supplies: '+s.level+' missing '+missing.length);s.mode='plans';s.slot=attempt%3;t.exchange();s.mode='playing';}
     }
    }
   }throw Error('No ring solution level '+s.level+' missing '+[...desired].filter(n=>!s.walls.has(n)).length+' supplies '+s.supplies);
  };
  window.put=(type,x,y)=>{t.select(type);t.setCursor(x,y);check(t.place(),type+' failed '+R.placement(s).reason);};
  window.equip=()=>{
   const desired=s.level<5?ring(2,5,7,9):ring(1,3,10,12);
   if(s.level>=10)for(const n of ring(1,2,11,13))desired.add(n);
   fitRing(desired);
   if(s.level>=5){
    for(const n of [...s.walls])if(!desired.has(n)){const [x,y]=R.xy(n);put('salvage',x,y);}
    if(s.buildings[0].w===2)put('keep',2,5);
   }
   const plans=[['tower',3,5,6],['mage',7,7,5],['captain',9,5,9],['workshop',11,7,9]];
   for(const [type,level,x,y]of plans)if(s.level>=level&&!s.buildings.some(b=>b.type===type))put(type,x,y);
   if(s.level>=6&&s.buildings.filter(b=>b.type==='tower').length<2)put('tower',5,4);
   for(const b of s.buildings)while(b.hp<b.maxHp&&s.supplies>=2)put('repair',b.x,b.y);
   check(R.enclosure(s).sealed,'keep not enclosed');
  };
  window.fight=(options={})=>{
   const {policy='lead',delay=.35,forced=0,missEvery=0}=options;let elapsed=0,think=0,failed=forced,attempt=0;
   while(s.mode==='playing'&&elapsed<105){
    if(think<=0){think=delay;const g=t.guns().find(g=>!g.auto&&g.b.cooldown<=0),target=[...s.ships].filter(v=>s.shots.filter(q=>q.targetId===v.id).length<v.hp).sort((a,b)=>a.fire-b.fire)[0];
     if(g&&target){let y=target.y,x=target.x;
      if(policy==='lead')for(let k=0;k<4;k++){const travel=Math.hypot(x-g.x,y-g.y)/620;y=target.y+target.dir*target.speed*travel;x=target.x+target.vx*travel;if(y>555)y=1110-y;if(y<85)y=170-y;}
      const miss=failed>0||(missEvery>0&&++attempt%missEvery===0);if(miss){y+=170;failed--;}
      t.aim(x,y);if(t.fire()&&!miss)s.shots.at(-1).targetId=target.id;
     }
    }
    t.tick(1/60);elapsed+=1/60;think-=1/60;
   }
   return {level:s.level,name:t.profiles[s.level-1].name,policy,mode:s.mode,seconds:+elapsed.toFixed(2),hp:s.buildings[0].hp,maxHp:s.buildings[0].maxHp,kills:s.kills,shots:s.shotsFired,misses:s.misses,keepHits:s.keepHits,mageBlocks:s.mageBlocks,captainShots:s.captainShots,supplies:s.supplies,walls:s.walls.size};
  };
  window.starts=[];window.curve=[];t.fresh();
  for(let level=1;level<=13;level++){
   if(level>1){const before=R.snapshot(s);t.prepare(level);check(JSON.stringify(before.walls)===JSON.stringify([...s.walls]),'walls did not persist');check(before.buildings[0].hp===s.buildings[0].hp,'health did not persist');check(before.supplies===s.supplies,'supplies did not persist');equip();}
   starts.push(R.snapshot(s));if(level>1)t.startBattle();
   const r=fight();curve.push(r);if(r.mode!=='won')break;
  }
 });
 report.curve=await page.evaluate(()=>curve);console.log(JSON.stringify(report.curve,null,2));
 assert.equal(report.curve.length,13);assert.ok(report.curve.every(r=>r.mode==='won'));
 report.margin=await page.evaluate(()=>{const t=__harborTest;t.rules.restore(t.state,starts[4]);t.startBattle();return fight({forced:6,missEvery:4,delay:.5});});
 report.flat=await page.evaluate(()=>[0,1,2,3,4,5,6,12].map(i=>{const t=__harborTest;t.rules.restore(t.state,starts[i]);t.startBattle();return fight({policy:'flat',delay:.6});}));
 report.lateMargin=await page.evaluate(()=>{const t=__harborTest;t.rules.restore(t.state,starts[12]);t.startBattle();return fight({forced:3,missEvery:6,delay:.35});});
 report.lateRecovery=await page.evaluate(()=>[3,6,9].map(forced=>{const t=__harborTest;t.rules.restore(t.state,starts[12]);t.startBattle();return {...fight({forced,delay:.35}),forced};}));
 console.log('MARGINS',JSON.stringify({margin:report.margin,flat:report.flat,late:report.lateMargin,recovery:report.lateRecovery},null,2));
 if(process.env.HARBOR_CURVE_ONLY){fs.writeFileSync(out+'/curve.json',JSON.stringify(report,null,2));await browser.close();return;}
 assert.equal(report.margin.mode,'won');assert.ok(report.margin.misses>=6);
 assert.ok(report.lateRecovery.some(r=>r.forced===6&&r.mode==='won'&&r.hp>=5));
 report.mechanics=await page.evaluate(()=>{
  const t=__harborTest,s=t.state,R=t.rules,flags={};R.restore(s,starts[6]);s.mode='playing';s.phase='build';s.supplies=200;t.select('wall',0);t.setCursor(1,3);
  const before=JSON.stringify(R.snapshot(s));flags.overlapRejected=!t.place()&&before===JSON.stringify(R.snapshot(s));
  t.select('mage');t.setCursor(11,6);flags.outsideRejected=!t.place();
  const saved=R.snapshot(s);R.restore(s,starts[1]);s.mode='playing';s.phase='build';s.supplies=200;t.select('tower');t.setCursor(5,6);flags.lockedRejected=!t.place();
  t.select('salvage');t.setCursor(2,6);const pre=JSON.stringify(R.snapshot(s));check(t.place(),'salvage');t.undo();flags.undoExact=pre===JSON.stringify(R.snapshot(s));
  R.restore(s,starts[3]);s.level=5;s.walls=new Set(starts[4].walls);s.mode='playing';s.phase='build';s.supplies=200;s.buildings[0].hp=7;
  t.select('keep');t.setCursor(2,5);check(t.place(),'keep expansion');flags.expansionPreservesHealth=s.buildings[0].w===3&&s.buildings[0].hp===7&&s.buildings[0].maxHp===16;
  t.undo();flags.expansionUndo=s.buildings[0].w===2&&s.buildings[0].hp===7&&s.buildings[0].maxHp===10;
  R.restore(s,starts[4]);s.mode='playing';s.phase='build';s.buildings[0].hp=7;t.select('repair');t.setCursor(2,5);const bank=s.supplies;check(t.place(),'repair');flags.repairCost=s.buildings[0].hp===8&&s.supplies===bank-2;
  R.restore(s,starts[2]);t.startBattle();const hp=s.buildings[0].hp;
  // A real shell meets the perimeter before it can reach the keep; a second crosses its breach.
  const shell=()=>({x:600,y:270,vx:-200,vy:0,delay:0,tx:160,ty:270});let q=shell();check(t.moveShell(q,3),'wall collision');flags.wallBlocks=s.buildings[0].hp===hp&&!s.walls.has(R.id(7,6));
  q=shell();check(t.moveShell(q,3),'tower collision');flags.towerHit=s.buildings.find(b=>b.type==='tower').hp===2&&s.buildings[0].hp===hp;
  s.walls.delete(R.id(7,7));s.buildings.find(b=>b.type==='tower').hp=0;q={x:600,y:300,vx:-200,vy:0,delay:0};t.moveShell(q,3);flags.visibleKeepHit=s.buildings[0].hp===hp-1&&s.keepHits===1;
  const damaged=s.buildings[0].hp;for(let i=0;i<60;i++)t.tick(1/60);flags.noGapDamage=s.buildings[0].hp===damaged;
  R.restore(s,saved);t.startBattle();const mage=s.buildings.find(b=>b.type==='mage'),c=t.center(mage);s.spawned=t.profiles[s.level-1].ships;s.spawnTime=100;
  s.shells=[{x:c.x+50,y:c.y,vx:0,vy:0,delay:0},{x:c.x+60,y:c.y,vx:0,vy:0,delay:0},{x:c.x+210,y:c.y,vx:0,vy:0,delay:0}];t.tick(1/60);flags.mageLocalSingle=s.shells.length===2&&mage.cooldown===5&&s.mageBlocks===1;t.tick(1);flags.mageCooldown=s.mageBlocks===1;
  R.restore(s,starts[8]);t.prepare(9);t.startBattle();flags.captainOneGun=t.guns().filter(g=>g.auto).length===1&&t.guns().filter(g=>!g.auto).length===2;
  const captain=s.buildings.find(b=>b.type==='captain');captain.hp=0;flags.disabledCaptain=t.guns().every(g=>!g.auto);
  s.phase='build';t.select('repair');t.setCursor(captain.x,captain.y);check(t.place(),'repair disabled captain');flags.repairRestoresCaptain=t.guns().filter(g=>g.auto).length===1;s.phase='battle';
  t.retry();flags.retryLevel=s.level===9&&s.phase==='build'&&s.mode==='playing';
  s.phase='battle';s.time=.01;t.tick(1/60);flags.timeout=s.mode==='lost';
  R.restore(s,starts[10]);t.prepare(11);flags.workshopPatches=s.patches===6;t.startBattle();const manualGun=t.guns().find(g=>!g.auto);t.aim(760,320);check(t.fire(),'workshop shot');flags.workshopReload=manualGun.b.cooldown===.8;t.tick(.2);const second=t.guns().find(g=>!g.auto&&g.b.cooldown<=0);check(t.fire(),'second independent cannon');flags.independentGuns=second.b.cooldown===.8&&manualGun.b.cooldown>0;
  return flags;
 });console.log('MECHANICS',report.mechanics);assert.ok(Object.values(report.mechanics).every(Boolean));
 // Real keyboard, mouse, modal and restart controls.
 await page.evaluate(()=>{const t=__harborTest;t.fresh();t.tick(1/60);t.state.buildings[0].cooldown=0;});await page.locator('canvas').focus();await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__harborTest.inputs().keyFire),false);
 await page.keyboard.press('p');assert.equal(await page.evaluate(()=>__harborTest.state.mode),'paused');await page.keyboard.press('p');await page.locator('#help-button').click();const helpTime=await page.evaluate(()=>__harborTest.state.time);await page.evaluate(()=>__harborTest.tick(1));assert.equal(await page.evaluate(()=>__harborTest.state.time),helpTime);await page.locator('#instruction-close').click();
 await page.keyboard.press('m');assert.equal(await page.evaluate(()=>__harborTest.state.muted),true);await page.keyboard.press('m');await page.keyboard.press('r');assert.equal(await page.evaluate(()=>__harborTest.state.level),1);
 await page.evaluate(()=>{__harborTest.prepare(2);});await page.locator('canvas').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>__harborTest.state.cursor.x),3);await page.keyboard.press('x');assert.equal(await page.evaluate(()=>__harborTest.state.rotation),1);
 await page.keyboard.press('b');assert.equal(await page.evaluate(()=>__harborTest.state.mode),'plans');await page.locator('[data-tool="patch"]').click();assert.equal(await page.evaluate(()=>__harborTest.state.tool),'patch');await page.locator('canvas').focus();await page.evaluate(()=>__harborTest.setCursor(2,6));await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__harborTest.state.walls.size),1);await page.keyboard.press('z');assert.equal(await page.evaluate(()=>__harborTest.state.walls.size),0);
 assert.equal(await page.locator('#mend').count(),0);await page.keyboard.press('e');assert.equal(await page.evaluate(()=>__harborTest.state.walls.size),0);
 const box=await page.locator('canvas').boundingBox();await page.mouse.click(box.x+box.width*.1,box.y+box.height*.4);await page.keyboard.press('r');assert.equal(await page.evaluate(()=>__harborTest.state.level),2);assert.equal(await page.evaluate(()=>__harborTest.state.phase),'build');
 // Desktop active late-campaign screenshot with natural shells, not a static victory screen.
 await page.evaluate(()=>{const t=__harborTest;t.rules.restore(t.state,starts[12]);t.startBattle();for(let i=0;i<600;i++)t.tick(1/60);t.aim(845,390);t.fire();t.render();});
 assert.equal(await page.evaluate(()=>__harborTest.state.mode),'playing');await page.screenshot({path:out+'/harbor-bastion-campaign.png'});
 await page.evaluate(()=>{__harborTest.manual(false);});report.desktopFrames=await frames(page);await page.evaluate(()=>{__harborTest.manual(true);__harborTest.state.mode='paused';__harborTest.render();});
 report.layouts=[];
 for(const [width,height]of [[667,375],[740,390],[844,390],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await context.newPage();watch(p);
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Test refusal'));});await p.goto(base+'/harbor-bastion/?test=1');await p.locator('#instruction-close').click();await p.waitForTimeout(500);
  if(width>height){
   await p.waitForFunction(()=>__harborTest.state.mode==='playing');await p.evaluate(()=>{__harborTest.manual(true);__harborTest.prepare(2);});const c=await p.locator('canvas').boundingBox();
   await p.touchscreen.tap(c.x+c.width*.1,c.y+c.height*.4);await p.locator('#plans').tap();await p.locator('[data-tool="patch"]').tap();await p.locator('#place').tap();assert.equal(await p.evaluate(()=>__harborTest.state.walls.size),1);await p.locator('#undo').tap();assert.equal(await p.evaluate(()=>__harborTest.state.walls.size),0);
   await p.locator('#plans').tap();await p.locator('[data-slot="0"]').last().tap();await p.locator('#rotate').tap();assert.equal(await p.evaluate(()=>__harborTest.state.rotation),1);await p.locator('.vibecade-mobile-restart').tap();assert.equal(await p.evaluate(()=>__harborTest.state.level),2);
   const bounds=await p.evaluate(()=>{const c=document.querySelector('canvas').getBoundingClientRect(),a=document.querySelector('.actions').getBoundingClientRect();return {canvas:{x:c.x,y:c.y,right:c.right,bottom:c.bottom},actions:{x:a.x,y:a.y,right:a.right,bottom:a.bottom},overflow:document.documentElement.scrollWidth>innerWidth};});
   assert.ok(bounds.actions.x>=bounds.canvas.right);assert.ok(bounds.actions.bottom<=height);assert.ok(bounds.canvas.bottom<=height);assert.equal(bounds.overflow,false);report.layouts.push({width,height,...bounds});
   if(width===667){
    const cdp=await context.newCDPSession(p),point=(x,y)=>({x:c.x+c.width*x,y:c.y+c.height*y,id:1,radiusX:4,radiusY:4,force:1});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(.2,.2)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.35,.4)]});assert.equal(await p.evaluate(()=>__harborTest.state.cursor.x),8);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await p.evaluate(()=>{__harborTest.fresh();__harborTest.manual(false);});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(.7,.5)]});await p.waitForTimeout(1200);assert.ok(await p.evaluate(()=>__harborTest.state.shotsFired)>=2);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.85,.6)]});assert.ok(await p.evaluate(()=>__harborTest.state.aim.x)>800);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await p.evaluate(()=>__harborTest.inputs().pointerFire),false);
    await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await p.evaluate(()=>__harborTest.state.mode),'paused');await p.locator('#pause').tap();
    report.mobileFrames=await frames(p);assert.equal(await p.evaluate(()=>document.documentElement.dataset.mobileFullscreenAttempted),'true');
   }
   await p.screenshot({path:out+'/mobile-'+width+'.png'});await p.reload();await p.locator('.vibecade-mobile-play').click();await p.waitForFunction(()=>__harborTest.state.mode==='playing');assert.equal(await p.locator('#instruction-modal').isVisible(),false);
  }else {assert.equal(await p.locator('#orientation').isVisible(),true);report.layouts.push({width,height,orientation:true});await p.screenshot({path:out+'/portrait.png'});}
  await context.close();
 }
 // Real localStorage persistence, including a completed-campaign reload without duplicated rewards.
 const savePage=await browser.newPage({viewport:{width:1440,height:900}});watch(savePage);await savePage.goto(base+'/harbor-bastion/');
 await savePage.locator('#instruction-close').click();await savePage.waitForTimeout(11300);
 const liveBox=await savePage.locator('canvas').boundingBox();
 for(const [x,y]of [[680,90],[795,227],[910,364]]){await savePage.mouse.click(liveBox.x+x/1000*liveBox.width,liveBox.y+y/640*liveBox.height);await savePage.waitForTimeout(1100);}
 await savePage.locator('#next').waitFor({state:'visible'});const damagedHealth=await savePage.locator('#health').textContent();assert.notEqual(damagedHealth,'10 / 10');await savePage.locator('#next').click();assert.equal(await savePage.locator('#health').textContent(),damagedHealth);
 await savePage.locator('canvas').focus();await savePage.keyboard.press('4');await savePage.mouse.click(liveBox.x+100/1000*liveBox.width,liveBox.y+260/640*liveBox.height);
 const genuineSave=await savePage.evaluate(()=>JSON.parse(localStorage.getItem('harbor-bastion-campaign-v3')));assert.equal(genuineSave.castle.walls.length,1);assert.equal(genuineSave.castle.level,2);
 await savePage.reload();assert.equal(await savePage.locator('#health').textContent(),damagedHealth);assert.equal(await savePage.locator('#level').textContent(),'2 / 13');const reloadedSave=await savePage.evaluate(()=>JSON.parse(localStorage.getItem('harbor-bastion-campaign-v3')));assert.deepEqual(reloadedSave,genuineSave);
 report.liveOpening={health:damagedHealth,savedWalls:genuineSave.castle.walls.length,supplies:genuineSave.castle.supplies};
 const state=await page.evaluate(()=>starts[12]);state.supplies=123;
 await savePage.evaluate(v=>{localStorage.setItem('harbor-bastion-campaign-v3',JSON.stringify({version:3,phase:'won',castle:v,checkpoint:v}));sessionStorage.removeItem('harbor-bastion-instructions-v3');},state);
 await savePage.reload();await savePage.locator('#instruction-close').click();assert.equal(await savePage.locator('#result-title').textContent(),'Your bastion endures.');assert.equal(await savePage.locator('#supplies').textContent(),'123');await savePage.reload();assert.equal(await savePage.locator('#supplies').textContent(),'123');
 await savePage.locator('#again').click();assert.equal(await savePage.locator('#level').textContent(),'1 / 13');await savePage.close();report.persistence=true;
 const root=await browser.newPage(),rootResources=[];root.on('console',e=>{if(e.type()==='error')rootResources.push(e.text());});await root.goto(base);await root.locator('a[href="harbor-bastion/"]').click();assert.match(await root.title(),/Harbor Bastion/);report.registration=true;report.rootResourceErrors=rootResources;await root.close();
 assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));await browser.close();console.log('PASS: campaign, mechanics, controls, layouts, save and console');
}
async function frames(page){return page.evaluate(async()=>{const d=[];let previous=performance.now();return new Promise(resolve=>{function f(now){d.push(now-previous);previous=now;if(d.length<90)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);resolve({mean:d.reduce((a,b)=>a+b,0)/d.length,p95:d[Math.floor(d.length*.95)]});}}requestAnimationFrame(f);});});}
main().catch(async e=>{console.error(e);await globalThis.browser?.close();process.exit(1);});

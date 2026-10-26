/* Verify the live Blender instrument against real flow state and responsive UI. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {installPilot}=require('./verify.cjs');
const out=process.env.STEAM_REPORT_DIR||'C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/boiler-integration';
const base=process.env.STEAM_BASE_URL||'http://127.0.0.1:8771';
async function run(){
  const {chromium}=require('playwright'),browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const report={date:new Date().toISOString(),errors:[],checks:[],heat:[],layouts:[]};fs.mkdirSync(out,{recursive:true});
  const check=(ok,label)=>{assert.ok(ok,label);report.checks.push(label);};
  const watch=p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});p.on('requestfailed',r=>report.errors.push(r.url()+': '+r.failure().errorText));};
  try{
    const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),p=await context.newPage();watch(p);
    await p.goto(base+'/steamline/?test=1');await p.evaluate(()=>__steamTest.manual(true));
    check(await p.locator('#boiler').getAttribute('data-state')==='idle','instructions leave boiler idle');
    await p.locator('#instruction-close').click();await p.evaluate(installPilot);
    await p.locator('.boiler-art img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
    check(await p.locator('.boiler-art img').evaluateAll(imgs=>imgs.length===4&&imgs.every(i=>i.naturalWidth===512&&i.naturalHeight===512)),'all four local Blender layers decoded');
    await p.evaluate(()=>{build(36);__steamTest.launch();__steamTest.step(1);});
    check(await p.locator('#boiler').getAttribute('data-state')==='running','flow opens boiler');
    const wheel=p.locator('.boiler-wheel'),matrix=await wheel.evaluate(e=>getComputedStyle(e).transform);await p.waitForTimeout(200);
    check(await wheel.evaluate(e=>getComputedStyle(e).transform)!==matrix,'wheel visibly rotates during flow');
    await p.keyboard.press('KeyP');
    check(await p.locator('#boiler').getAttribute('data-state')==='paused','pause holds instrument');
    await p.waitForTimeout(80);const held=await wheel.evaluate(e=>getComputedStyle(e).transform);await p.waitForTimeout(180);
    check(await wheel.evaluate(e=>getComputedStyle(e).transform)===held,'wheel freezes on pause');
    await p.keyboard.press('KeyP');await p.locator('#help-button').click();
    check(await p.locator('#boiler').getAttribute('data-state')==='paused','help holds boiler');
    const gauge=await p.locator('#boiler').getAttribute('style');await p.evaluate(()=>__steamTest.step(10));
    check(await p.locator('#boiler').getAttribute('style')===gauge,'help freezes gauge reading');
    await p.locator('#instruction-close').click();check(await p.locator('#boiler').getAttribute('data-state')==='running','closing help resumes boiler');
    for(const n of [36,41,50]){
      const readings=await p.evaluate(n=>{
        build(n);const t=__steamTest;t.launch();const v=[];
        while(t.state.mode==='flow'){
          const s=t.state.flow.steps[t.state.index],cap=t.rules.contracts[n-1].capacity,b=document.getElementById('boiler');
          v.push({square:s.k,heat:s.heat,display:Number(b.dataset.heat),angle:parseFloat(b.style.getPropertyValue('--needle-angle')),expected:-50+87*Math.max(0,Math.min(1,s.heat/cap))});t.step(.421);
        }return v;
      },n);
      check(readings.every(r=>r.heat===r.display&&Math.abs(r.angle-r.expected)<.011),'contract '+n+' gauge follows every visited heat value');
      check(readings.some(r=>r.heat===0)&&readings.some(r=>r.heat>0),'contract '+n+' shows cold and reheated route');report.heat.push({level:n,readings});
      check(await p.locator('#boiler').getAttribute('data-state')==='complete','contract '+n+' completion holds warm boiler');
    }
    await p.evaluate(()=>{__steamTest.start(1);__steamTest.launch();__steamTest.step(40);});
    check(await p.locator('#boiler').getAttribute('data-state')==='blocked','invalid route stops boiler');
    check((await p.locator('#boiler').getAttribute('style')).includes('-50.00deg'),'failure drops gauge to idle');
    check(/Your board is kept/.test(await p.locator('#status').textContent()),'failed test preserves recovery message');
    await p.evaluate(()=>{build(41);__steamTest.launch();__steamTest.step(4.7);});await p.waitForTimeout(550);
    await p.screenshot({path:out+'/steamline-boiler-gameplay.png'});
    await p.locator('#boiler').screenshot({path:out+'/working-boiler-detail.png'});
    for(const [width,height,touch]of[[1440,900,false],[1280,720,false],[1024,768,false],[900,600,false],[667,375,true],[740,390,true],[844,390,true],[390,844,true]]){
      const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,serviceWorkers:'block'}),q=await ctx.newPage();watch(q);
      await q.goto(base+'/steamline/?test=1');await q.locator('#instruction-close').click();await q.evaluate(()=>__steamTest.manual(true));await q.evaluate(installPilot);await q.evaluate(()=>{build(41);__steamTest.launch();__steamTest.step(4.7);});
      const g=await q.evaluate(()=>{const rect=id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible:getComputedStyle(e).display!=='none'};};return{boiler:rect('boiler'),board:rect('board'),cabinet:rect('cabinet'),overflow:document.documentElement.scrollWidth>innerWidth};});
      report.layouts.push({width,height,touch,...g});check(!g.overflow,'no horizontal overflow '+width+'x'+height);
      check(g.cabinet.bottom<=height,'cabinet fits '+width+'x'+height);
      check(g.boiler.visible&&g.boiler.x>=0&&g.boiler.right<=width&&g.boiler.bottom<=height,'boiler visible and unclipped '+width+'x'+height);
      check(g.boiler.right<=g.board.x||g.boiler.y>=g.board.bottom,'boiler does not cover board '+width+'x'+height);
      await q.screenshot({path:out+'/boiler-'+width+'x'+height+'.png'});await ctx.close();
    }
    const rc=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',serviceWorkers:'block'}),r=await rc.newPage();watch(r);
    await r.goto(base+'/steamline/?test=1');await r.locator('#instruction-close').click();await r.evaluate(()=>__steamTest.manual(true));await r.evaluate(installPilot);await r.evaluate(()=>{build(41);__steamTest.launch();__steamTest.step(4.7);});
    check(await r.locator('.boiler-wheel').evaluate(e=>getComputedStyle(e).animationName)==='none','reduced motion disables decorative wheel');
    check(await r.locator('.boiler-needle').evaluate(e=>getComputedStyle(e).transitionDuration)==='0s','reduced motion removes needle tween');
    check((await r.locator('#boiler-note').textContent()).startsWith('HEAT '),'reduced motion retains numeric heat');await rc.close();
    assert.deepEqual(report.errors,[]);console.log(JSON.stringify({checks:report.checks.length,layouts:report.layouts,errors:report.errors},null,2));
  }finally{fs.writeFileSync(out+'/boiler-verification.json',JSON.stringify(report,null,2));await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});

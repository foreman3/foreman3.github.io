// Agent Yoda — OW-20261123T0114Z-YODA. Unfrozen local browser checks.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),shots=path.resolve(__dirname,'../screenshots');
const server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(f!==root&&!f.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'chrome',headless:true}),report={agent:'Agent Yoda',run:'OW-20261123T0114Z-YODA',layouts:[]};
try{
 for(const [width,height] of [[1440,900],[667,375],[740,390],[844,390],[390,844]]){
  const mobile=width<1000,c=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile}),p=await c.newPage(),errors=[],resources=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)resources.push({url:r.url(),status:r.status()});});
  await p.addInitScript(()=>{const AC=AudioContext;window.AudioContext=class extends AC{constructor(...args){super(...args);window.__audio=this;}};});
  await p.goto(base+'/orchard-watch/?test&seed=42');await p.waitForTimeout(160);assert.equal(await p.evaluate(()=>orchardTest.state().elapsed),0);
  assert.equal(await p.locator('#holes').isVisible(),false);await p.locator('#instruction-close').scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(shots,`instructions-start-${width}x${height}.jpg`),quality:94});
  await p.locator('#instruction-close').click();await p.locator('.vibecade-mobile-settling').waitFor({state:'hidden'});
  for(let i=0;i<12;i++){await p.evaluate(i=>{orchardTest.jump(1);orchardTest.clear();orchardTest.setActor(i,false,.3);},i);if(mobile)await p.locator('.hole').nth(i).tap();else await p.keyboard.press('qwerasdfzxcv'[i]);assert.equal(await p.evaluate(()=>orchardTest.state().hits),1);}
  assert.equal(await p.evaluate(()=>__audio.state),'running');await p.locator('#sound').click();assert.equal(await p.locator('#sound').innerText(),'Sound off');await p.locator('#sound').click();
  await p.locator('#pause').click();const t=await p.evaluate(()=>orchardTest.state().time);await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>orchardTest.state().time),t);await p.locator('#pause').click();
  if(!mobile){await p.locator('#help-button').click();const t=await p.evaluate(()=>orchardTest.state().time);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>orchardTest.state().time),t);await p.locator('#instruction-close').click();}
  if(mobile)await p.locator('.vibecade-mobile-restart').tap();else await p.keyboard.press('Backspace');assert.equal(await p.evaluate(()=>orchardTest.state().score),0);
  await p.evaluate(()=>orchardTest.jump(4));const frames=await p.evaluate(()=>new Promise(r=>{let last;const a=[];function sample(t){if(last)a.push(t-last);last=t;if(a.length<90)requestAnimationFrame(sample);else r(a.sort((a,b)=>a-b));}requestAnimationFrame(sample);}));
  assert.deepEqual(errors,[]);assert.deepEqual(resources,[]);report.layouts.push({width,height,allTwelveInputs:true,gate:true,pause:true,restart:true,audio:'running',errors,resources,medianMs:frames[45],p95Ms:frames[85]});await c.close();
 }
 const c=await browser.newContext({viewport:{width:1440,height:900}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/');assert.equal(await p.locator('[data-status="ready"] a[href="orchard-watch/"]').count(),1);await p.locator('a.card[href="orchard-watch/"]').click();await p.locator('#instruction-close').click();await p.waitForTimeout(1100);await p.keyboard.press('q');await p.screenshot({path:path.join(shots,'live-1440x900.jpg'),quality:94});assert.equal(await p.evaluate(()=>typeof orchardTest),'undefined');assert.deepEqual(errors,[]);report.uninstrumentedArcadeLink=true;
 fs.writeFileSync(path.join(__dirname,'live-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

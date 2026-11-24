/* NODE_PATH must contain Playwright, or set PLAYWRIGHT_PATH to its package directory. */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../..'),out=process.env.ARTIFACT_DIR||path.join(process.env.TEMP||'/tmp','big-top-bound-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};fs.readFile(file,(err,data)=>{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.writeHead(err?404:200);res.end(err?'Not found':data);});});
async function pilot(page,level,{missGroups=[],reaction=.32,timingError=0,stopAfter=999}={}){
  await page.evaluate(level=>bigTopTest.load(level),level);
  return page.evaluate(({missGroups,reaction,timingError,stopAfter})=>{
    const T=bigTopTest,E=BigTopEngine;let frames=0,jumps=0;
    // Fixed deterministic input policy. Reads geometry; never edits gameplay state.
    while(T.state.state==='playing'&&frames++<16000){const s=T.state,o=s.obstacles.find(o=>!o.done);if(o&&s.h===0&&!missGroups.includes(o.group)){
      const pair=s.cfg.pairs&&o.group%4===1;
      let threshold=o.type==='pot'?.38:o.high?.43:reaction;
      if(o.type==='hoop'){
        const until=(o.x-s.distance)/s.cfg.speed,yt=o.target+s.cfg.bob*Math.sin((s.time+until)*2.1+o.phase);
        let best=-Infinity;
        for(let lead=.16;lead<.70;lead+=.002){
          const h=t=>Math.max(0,575*t-575*t*t);
          let margin=s.cfg.tolerance-Math.abs(h(lead)-yt);
          if(pair){const p=s.obstacles.find(p=>p!==o&&p.group===o.group),yt2=p.target+s.cfg.bob*Math.sin((s.time+until+.38)*2.1+p.phase);margin=Math.min(margin,s.cfg.tolerance-Math.abs(h(lead+.38)-yt2));}
          if(margin>best){best=margin;threshold=lead;}
        }
      }
      threshold+=timingError*[1,-1,.5,-.5][o.group%4];
      if((o.x-s.distance)/s.cfg.speed<=threshold){T.jump();jumps++;}
    }T.advance(1/120);if(T.state.cleared>=stopAfter)break;}
    const s=T.state;return{level:s.level,state:s.state,cleared:s.cleared,total:s.obstacles.length,misses:s.misses,hearts:s.hearts,seconds:+s.time.toFixed(2),score:s.score,jumps};
  },{missGroups,reaction,timingError,stopAfter});
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.BASE_URL||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:'chrome'}),report={base,curve:[],layouts:[],errors:[]};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(base+'/big-top-bound/?test=1');await page.waitForFunction(()=>window.bigTopTest);
  const frozen=await page.evaluate(()=>bigTopTest.state.time);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>bigTopTest.state.time),frozen);assert.equal(await page.locator('#instruction-modal').isVisible(),true);await page.locator('#instruction-close').click();
  await page.keyboard.down('Space');await page.waitForTimeout(150);assert((await page.evaluate(()=>bigTopTest.state.h))>20);await page.keyboard.up('Space');
  await page.locator('#help-button').click();const pauseTime=await page.evaluate(()=>bigTopTest.state.time);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>bigTopTest.state.time),pauseTime);await page.locator('#instruction-close').click();
  await page.keyboard.press('KeyP');assert(await page.evaluate(()=>bigTopTest.paused));await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>bigTopTest.paused),false);await page.keyboard.press('KeyM');assert(await page.evaluate(()=>bigTopTest.sound));await page.keyboard.press('KeyM');
  for(let level=1;level<=7;level++){const r=await pilot(page,level);report.curve.push(r);assert.equal(r.state,'won',JSON.stringify(r));}
  await page.locator('#continue-button').click();assert.equal(await page.evaluate(()=>bigTopTest.state.level),1);assert.equal(await page.evaluate(()=>bigTopTest.state.score),0);
  report.imprecise=[];for(let level=1;level<=7;level++)report.imprecise.push(await pilot(page,level,{timingError:.09}));
  report.recovery=await pilot(page,5,{missGroups:[0,3,7]});assert.equal(report.recovery.state,'won');assert.equal(report.recovery.hearts,1);
  await page.locator('#continue-button').click();assert.equal(await page.evaluate(()=>bigTopTest.state.level),6);
  const fail=await pilot(page,7,{missGroups:[0,2]});assert.equal(fail.state,'lost');await page.locator('#continue-button').click();assert.equal(await page.evaluate(()=>bigTopTest.state.level),7);assert.equal(await page.evaluate(()=>bigTopTest.state.hearts),2);
  await page.keyboard.press('KeyR');assert.equal(await page.evaluate(()=>bigTopTest.state.level),1);
  await page.reload();assert.equal(await page.locator('#instruction-modal').isVisible(),false);
  // A natural active scene, using a real jump and normal simulation time.
  await pilot(page,5,{stopAfter:6});await page.screenshot({path:path.join(out,'gameplay.png')});
  report.desktopFrames=await page.evaluate(()=>new Promise(resolve=>{const samples=[];let last=0;function frame(now){if(last)samples.push(now-last);last=now;if(samples.length<150)requestAnimationFrame(frame);else{samples.sort((a,b)=>a-b);resolve({mean:samples.reduce((a,b)=>a+b,0)/samples.length,p95:samples[Math.floor(samples.length*.95)],max:samples.at(-1)});}}requestAnimationFrame(frame);}));
  report.layouts.push({width:1440,height:900,desktop:true});
  await context.close();
  for(const [width,height] of [[667,375],[740,390],[844,390],[390,844]]){
    const c=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,serviceWorkers:'block'});await c.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Refused for test'));});const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});await p.goto(base+'/big-top-bound/?test=1');await p.locator('#instruction-close').tap();await p.waitForFunction(()=>!bigTopTest.modal);
    const boxes=await p.evaluate(()=>{const box=id=>{const r=document.getElementById(id).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};return{board:box('game-shell'),jump:box('jump-button'),reins:box('reins-button'),hud:box('hud'),scroll:document.documentElement.scrollWidth,inner:innerWidth};});
    function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
    assert(!overlaps(boxes.board,boxes.jump)&&!overlaps(boxes.board,boxes.reins),JSON.stringify(boxes));assert(boxes.scroll<=width+1);assert.equal(await p.locator('#help-button').isVisible(),false);
    await p.locator('#jump-button').dispatchEvent('pointerdown',{pointerId:4,pointerType:'touch',button:0});await p.waitForTimeout(100);assert((await p.evaluate(()=>bigTopTest.state.h))>0);assert(await p.evaluate(()=>bigTopTest.state.hold));await p.locator('#jump-button').dispatchEvent('pointercancel',{pointerId:4,pointerType:'touch'});assert.equal(await p.evaluate(()=>bigTopTest.state.hold),false);
    await p.locator('#reins-button').dispatchEvent('pointerdown',{pointerId:5,pointerType:'touch',button:0});assert(await p.evaluate(()=>bigTopTest.state.reins));await p.locator('#reins-button').dispatchEvent('pointerup',{pointerId:5,pointerType:'touch'});assert.equal(await p.evaluate(()=>bigTopTest.state.reins),false);
    await p.locator('#touch-pause').tap();assert(await p.evaluate(()=>bigTopTest.paused));await p.locator('#touch-pause').tap();await p.locator('#touch-sound').tap();assert(await p.evaluate(()=>bigTopTest.sound));await p.locator('#touch-sound').tap();
    await p.locator('.vibecade-mobile-restart').tap();assert.equal(await p.evaluate(()=>bigTopTest.state.level),1);
    assert.equal(await p.locator('#jump-button').evaluate(el=>el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))),false);
    await p.screenshot({path:path.join(out,`mobile-${width}.png`)});report.layouts.push({width,height,...boxes});await c.close();
  }
  const normal=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});normal.on('pageerror',e=>report.errors.push(e.message));normal.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});await normal.goto(base+'/');assert.equal(await normal.locator('a[href="big-top-bound/"]').count(),1);await normal.locator('a[href="big-top-bound/"]').click();assert.equal(await normal.evaluate(()=>typeof window.bigTopTest),'undefined');await normal.locator('#instruction-close').click();const start=Date.now();
  for(let i=0;i<8;i++){const due=((620/205)+i*2.18-.30)*1000;await normal.waitForTimeout(Math.max(0,due-(Date.now()-start)));await normal.keyboard.press('Space');}
  await normal.locator('#result:not(.hidden)').waitFor({timeout:7000});report.normalOpening=await normal.locator('#result-copy').innerText();assert(report.normalOpening.startsWith('8/8 cleared'));await normal.locator('#continue-button').click();assert.equal(await normal.locator('#act').innerText(),'ACT 2 / 7');await normal.close();
  assert.deepEqual(report.errors,[]);
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

// Run with Playwright available: NODE_PATH=<packages> node orchard-watch/verify.cjs
// Optional: BROWSER_EXE and SHOT_DIR. Tests use only the ?test diagnostic hooks.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.env.SHOT_DIR || path.join(require('node:os').tmpdir(), 'orchard-watch-qa');
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', {'.js':'text/javascript','.css':'text/css','.html':'text/html'}[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const report = {curve:[], layouts:[], errors:[]};
  fs.mkdirSync(output, {recursive:true});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:900}});
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type()==='error') report.errors.push(m.text()); });
    await page.goto(base + '/orchard-watch/?test&seed=42');
    const state = () => page.evaluate(() => orchardTest.state());
    await page.waitForTimeout(180);
    assert.equal((await state()).time, 35);
    assert.equal((await state()).phase, 'instructions');
    await page.locator('#instruction-close').click();
    for (const [i,key] of [...'qweasdzxc'].entries()) {
      await page.evaluate(i => {orchardTest.jump(1);orchardTest.clear();orchardTest.setActor(i);},i);
      await page.keyboard.press(key);
      assert.equal((await state()).hits,1);
    }
    await page.locator('#help-button').click();
    const paused = (await state()).time;
    await page.waitForTimeout(160);
    assert.equal((await state()).time,paused);
    await page.locator('#instruction-close').click();
    await page.locator('#pause').click();
    assert.equal((await state()).phase,'paused');
    await page.keyboard.press('r');
    assert.equal((await state()).score,0);
    assert.equal(await page.locator('#pause').innerText(),'Pause');
    await page.keyboard.press('m');
    assert.equal(await page.locator('#sound').innerText(),'Sound off');
    await page.evaluate(() => {orchardTest.clear();orchardTest.setActor(0,true);});
    await page.locator('.hole').nth(0).click();
    assert.equal((await state()).baskets,5);
    report.curve = await page.evaluate(() => {
      const results=[];
      for (let n=1;n<=5;n++) {
        orchardTest.jump(n);
        let ticks=0,next=0,misses=n===4?2:0,skipped=new Set();
        while (orchardTest.state().phase==='playing' && ticks<5000) {
          orchardTest.step(.02);
          const s=orchardTest.state();
          for(let i=0;i<9;i++) {
            const a=s.actors[i];
            if(a&&!a.friend&&a.age>.45&&s.elapsed>=next) {
              if(misses>0&&!skipped.has(i)){skipped.add(i);misses--;}
              else if(!skipped.has(i)){orchardTest.thump(i);next=s.elapsed+.22;}
            }
          }
          for(const i of [...skipped])if(!s.actors[i])skipped.delete(i);
          ticks++;
        }
        const s=orchardTest.state();
        results.push({level:n,hits:s.hits,baskets:s.baskets,seconds:+s.elapsed.toFixed(2),won:s.hits===s.rounds[n-1].quota});
      }
      return results;
    });
    assert(report.curve.every(r=>r.won));
    assert.equal(report.curve[3].baskets,4);
    assert.match(await page.locator('#result-title').innerText(),/Master/);
    await page.locator('#restart').click();
    assert.equal((await state()).level,1);
    report.slowerReaction = await page.evaluate(() => {
      const out=[];
      for(const n of [4,5]){
        orchardTest.jump(n);
        for(let tick=0;tick<5000&&orchardTest.state().phase==='playing';tick++){
          orchardTest.step(.02);orchardTest.state().actors.forEach((a,i)=>{if(a&&!a.friend&&a.age>.95)orchardTest.thump(i);});
        }
        const s=orchardTest.state();out.push({level:n,hits:s.hits,baskets:s.baskets,won:s.hits===s.rounds[n-1].quota});
      }return out;
    });
    assert(report.slowerReaction[0].won && !report.slowerReaction[1].won);
    await page.locator('#restart').click();
    await page.evaluate(()=>{orchardTest.setTime(.01);orchardTest.step(.02);});
    assert.match(await page.locator('#result-text').innerText(),/bell rang/);
    await page.locator('#restart').click();
    await page.evaluate(()=>{orchardTest.jump(4);for(let i=0;i<22;i++){orchardTest.setActor(0);orchardTest.thump(0);orchardTest.step(.1);}});
    await page.locator('#continue').click();
    assert.equal((await state()).level,5);
    await page.evaluate(()=>{orchardTest.jump(4);orchardTest.clear();orchardTest.setActor(0,false,.35);orchardTest.setActor(4,true,.45);orchardTest.setActor(8,false,.65);orchardTest.draw();});
    await page.screenshot({path:path.join(output,'orchard-watch-gameplay.png')});
    report.desktopFooterBottom = await page.locator('main > footer').evaluate(e=>e.getBoundingClientRect().bottom);
    assert(report.desktopFooterBottom<=900);
    await page.reload();
    assert.equal(await page.locator('#instruction-modal').isVisible(),false);
    for(const [width,height] of [[667,375],[740,390],[844,390],[390,844]]) {
      const mc=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
      await mc.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Deliberate fullscreen refusal'));});
      const mp=await mc.newPage();mp.on('pageerror',e=>report.errors.push(e.message));
      await mp.goto(base+'/orchard-watch/?test');
      await mp.locator('#instruction-close').click();
      await mp.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');
      await mp.evaluate(()=>{orchardTest.clear();orchardTest.setActor(4,false,.3);});
      await mp.locator('.hole').nth(4).tap();
      assert.equal(await mp.evaluate(()=>orchardTest.state().hits),1);
      await mp.locator('#pause').tap();
      assert.equal(await mp.evaluate(()=>orchardTest.state().phase),'paused');
      await mp.locator('#pause').tap();
      await mp.locator('#sound').tap();
      assert.equal(await mp.locator('#sound').innerText(),'Sound off');
      await mp.locator('.vibecade-mobile-restart').tap();
      assert.equal(await mp.evaluate(()=>orchardTest.state().score),0);
      const layout=await mp.evaluate(()=>{
        const field=document.querySelector('#field').getBoundingClientRect();
        const header=document.querySelector('header').getBoundingClientRect();
        const buttons=[...document.querySelectorAll('.hole')].map(b=>b.getBoundingClientRect());
        return {field:{x:field.x,y:field.y,width:field.width,height:field.height,bottom:field.bottom},minTarget:Math.min(...buttons.map(b=>Math.min(b.width,b.height))),overlap:header.bottom>field.top,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      assert(!layout.overlap&&!layout.overflow);assert(layout.minTarget>=44);assert(layout.field.bottom<=height);
      report.layouts.push({width,height,...layout});
      await mp.evaluate(()=>{orchardTest.jump(4);orchardTest.clear();orchardTest.setActor(0,false,.4);orchardTest.setActor(4,true,.4);orchardTest.setActor(8,false,.4);orchardTest.draw();});
      await mp.screenshot({path:path.join(output,`orchard-watch-${width}x${height}.png`)});
      await mp.reload();
      await mp.locator('.vibecade-mobile-play').click();
      await mp.waitForFunction(()=>document.documentElement.dataset.vibecadeLaunch==='playing');
      await mc.close();
    }
    await page.goto(base+'/orchard-watch/?test');
    await page.evaluate(()=>orchardTest.jump(4));
    report.frames=await page.evaluate(()=>new Promise(resolve=>{const samples=[];let last=performance.now();function frame(t){samples.push(t-last);last=t;if(samples.length<100)requestAnimationFrame(frame);else{samples.shift();samples.sort((a,b)=>a-b);resolve({mean:samples.reduce((a,b)=>a+b,0)/samples.length,p95:samples[Math.floor(samples.length*.95)]});}}requestAnimationFrame(frame);}));
    const arcade=await context.newPage();const arcadeErrors=[];arcade.on('pageerror',e=>arcadeErrors.push(e.message));
    await arcade.goto(base+'/index.html');
    assert.equal(await arcade.locator('[data-status="work"] a[href="orchard-watch/"]').count(),1);
    await arcade.locator('a[href="orchard-watch/"]').click();
    assert.match(await arcade.title(),/Orchard Watch/);
    report.arcadeScriptErrors=arcadeErrors;
    assert.equal(report.errors.length,0);assert.equal(arcadeErrors.length,0);
    fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

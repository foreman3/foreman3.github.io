// Agent Yoda — TT-20261122T0105Z-YODA. Test-only instrumentation, no shipped hooks.
// NODE_PATH must include Playwright. Run with `before` before editing, then without arguments.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const shots = path.resolve(__dirname, '../screenshots');
fs.mkdirSync(shots, { recursive: true });
const baseline = execFileSync('git', ['show', '90c920e:tetris/index.html'], { cwd: root, encoding: 'utf8' });
const current = fs.readFileSync(path.join(root, 'tetris/index.html'), 'utf8');
const normalize = text => text.replace(/\r\n/g, '\n');
const script = html => [...normalize(html).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.trim());
new vm.Script(script(current));
const outsideArt = html => script(html).replace(/    function drawCell\([\s\S]*?(?=    function update\()/, '<PRESENTATION>');
assert.equal(outsideArt(current), outsideArt(baseline), 'All simulation, geometry, input, startup, audio and timing bytes unchanged');
assert.equal(normalize(current).split('<body>')[1].split('  <script>')[0], normalize(baseline).split('<body>')[1].split('  <script>')[0], 'DOM, instructions and buttons unchanged');
const expose = html => html.replace('    initMusic();', '    window.__audit = expression => eval(expression);\n    initMusic();');
const fixture = `board=Array.from({length:ROWS},()=>Array(COLS).fill(0));
  for(let y=15;y<20;y++)for(let x=0;x<10;x++)if((x+y)%5!==0 && y>=15+(x%3))board[y][x]=1+(x+Math.floor(y/2))%7;
  current={type:5,rot:0,x:3,y:7};nextType=2;score=1200;lines=12;drawNextPiece();draw()`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
const report = { agent: 'Agent Yoda', run: 'TT-20261122T0105Z-YODA', baseline: '90c920e', sourceParity: true, scenarios: [], viewports: [] };
(async () => {
  await new Promise(resolve => server.listen(8767, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const url = 'http://127.0.0.1:8767/tetris/';
  try {
    if (process.argv.includes('before')) {
      for (const [width,height] of [[1440,900],[667,375]]) {
        const context = await browser.newContext({ viewport:{width,height}, hasTouch:width<1000, isMobile:width<1000 });
        const page = await context.newPage();
        await page.route('**/tetris/', route => route.fulfill({contentType:'text/html',body:expose(baseline)}));
        await page.goto(url);
        await page.getByRole('button',{name:'Start',exact:true}).click();
        await page.locator('.vibecade-mobile-settling').waitFor({state:'hidden'});
        await page.waitForTimeout(250);
        await page.evaluate(code=>__audit(code), fixture);
        await page.screenshot({path:path.join(shots,`before-${width}x${height}.jpg`),type:'jpeg',quality:92});
        await context.close();
      }
      return;
    }
    // Compare original and final states with identical random streams and animation timestamps.
    const pages=[];
    for(const html of [baseline,current]) {
      const context=await browser.newContext({viewport:{width:1440,height:900}});
      const page=await context.newPage();
      await page.addInitScript(()=>{
        let seed=9843,now=0,callbacks=[];
        Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
        performance.now=()=>now;
        requestAnimationFrame=fn=>{callbacks.push(fn);return 1;};
        window.__tick=count=>{for(let n=0;n<count;n++){now+=1000/60;const batch=callbacks;callbacks=[];batch.forEach(fn=>fn(now));}};
      });
      await page.route('**/tetris/',route=>route.fulfill({contentType:'text/html',body:expose(html)}));
      await page.goto(url);pages.push(page);
    }
    const both=async fn=>{for(const p of pages)await fn(p);};
    const snap=`JSON.stringify({board,current,nextType,score,lines,dropInterval,lastTime,gameOver,clearingRows,clearTimer,gamePaused,gameStarted,BLOCK,PREVIEW_BLOCK})`;
    async function compare(label){assert.deepEqual(await pages[1].evaluate(s=>__audit(s),snap),await pages[0].evaluate(s=>__audit(s),snap),label);report.scenarios.push(label);}
    await both(p=>p.evaluate(()=>__tick(120)));await compare('First-load instructions gate simulation');
    await both(p=>p.getByRole('button',{name:'Start',exact:true}).click());
    await both(p=>p.evaluate(()=>__tick(120)));await compare('Opening gravity');
    for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space']){
      await both(p=>p.keyboard.press(key));await both(p=>p.evaluate(()=>__tick(2)));await compare('Keyboard '+key);
    }
    await both(p=>p.getByRole('button',{name:'How to play',exact:true}).click());
    await both(p=>p.evaluate(()=>__tick(120)));await compare('Help pause');
    for(const p of pages)assert.equal(await p.evaluate(()=>__audit('gamePaused')),true);
    await both(p=>p.getByRole('button',{name:'Start',exact:true}).click());
    for(let rows=1;rows<=4;rows++){
      await both(p=>p.evaluate(n=>__audit(`resetGame();for(let y=20-${n};y<20;y++)board[y].fill(1);checkLines();`),rows));
      await both(p=>p.evaluate(()=>__tick(2)));await compare(rows+' line clear flash');
      await both(p=>p.evaluate(()=>__tick(30)));await compare(rows+' line clear scoring');
      for(const p of pages)assert.deepEqual(await p.evaluate(()=>__audit('[score,lines]')),[100*rows,rows]);
    }
    await both(p=>p.evaluate(()=>__audit('board.forEach(row=>row.fill(1));newPiece();draw()')));await compare('Top out');
    await both(p=>p.keyboard.press('r'));await compare('Restart resets complete run');
    for(const p of pages){
      assert.deepEqual(await p.evaluate(()=>__audit('[score,lines,gameOver]')),[0,0,false]);
      assert.equal(await p.evaluate(()=>{const original=requestAnimationFrame;let count=0;requestAnimationFrame=()=>count++;for(let i=0;i<5;i++)__audit('resetGame()');requestAnimationFrame=original;return count;}),0);
    }
    report.scenarios.push('Existing Tetris restart regression [0,0]; five restarts schedule zero extra loops');
    for(const p of pages)await p.context().close();
    for(const [width,height] of [[1440,900],[667,375],[740,390],[844,390],[390,844]]){
      const mobile=width<1000;
      const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});
      const page=await context.newPage();const errors=[];
      page.on('requestfailed',r=>console.log('REQUEST FAILED',r.url(),r.failure()));
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});
      await page.route('**/tetris/',route=>route.fulfill({contentType:'text/html',body:expose(current)}));
      await page.goto(url);
      assert.equal(await page.evaluate(()=>__audit('gameStarted')),false);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(()=>__audit('gameStarted')),false);
      await page.screenshot({path:path.join(shots,`instructions-${width}x${height}.jpg`),type:'jpeg',quality:90});
      await page.getByRole('button',{name:'Start',exact:true}).click();
      await page.locator('.vibecade-mobile-settling').waitFor({state:'hidden'});
      await page.waitForTimeout(250);
      await page.evaluate(code=>__audit(code),fixture);
      await page.screenshot({path:path.join(shots,`after-${width}x${height}.jpg`),type:'jpeg',quality:92});
      if(width===1440||width===844){
        await page.evaluate(()=>__audit('gameOver=true;draw()'));
        await page.screenshot({path:path.join(shots,`top-out-${width}x${height}.jpg`),type:'jpeg',quality:92});
        await page.evaluate(()=>__audit('gameOver=false;gamePaused=true;board[19].fill(4);clearingRows=[19];draw()'));
        await page.screenshot({path:path.join(shots,`line-clear-${width}x${height}.jpg`),type:'jpeg',quality:92});
        await page.evaluate(()=>__audit('gamePaused=false'));
      }
      const geometry=await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
        return {canvas:rect(document.querySelector('#gameCanvas')),preview:rect(document.querySelector('#next')),info:rect(document.querySelector('#info')),buttons:[...document.querySelectorAll('.control-button')].map(rect)};
      });
      const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
      const c=geometry.canvas;
      assert(c.x>=0&&c.y>=0&&c.x+c.width<=width+1&&c.y+c.height<=height+1,'Playfield onscreen');
      assert(!overlaps(c,geometry.info)&&!overlaps(c,geometry.preview),'HUD outside playfield');
      if(mobile){
        const client=await context.newCDPSession(page);
        for(const action of ['left','right','down','rotate','drop']){
          const b=page.locator(`[data-action="${action}"]`);const box=await b.boundingBox();
          assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Touch control onscreen');
          assert(!overlaps(c,box),'Touch control outside playfield');
          await page.evaluate(()=>__audit('resetGame()'));
          const previous=await page.evaluate(()=>__audit('JSON.stringify({current,board})'));
          await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});
          await page.waitForTimeout(60);
          await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          assert.notEqual(await page.evaluate(()=>__audit('JSON.stringify({current,board})')),previous,action+' real touch');
          assert(!(await b.getAttribute('class')).includes('pressed'),'Touch releases pressed appearance');
        }
        await page.evaluate(()=>__audit('score=900;lines=20'));
        await page.getByRole('button',{name:'Restart game',exact:true}).tap();
        assert.deepEqual(await page.evaluate(()=>__audit('[score,lines]')),[0,0],'Existing mobile restart button');
      }else{
        await page.getByRole('button',{name:'How to play',exact:true}).click();
        const previous=await page.evaluate(()=>__audit('JSON.stringify({board,current})'));
        await page.waitForTimeout(1100);
        assert.equal(await page.evaluate(()=>__audit('JSON.stringify({board,current})')),previous,'Help pauses');
        await page.getByRole('button',{name:'Start',exact:true}).click();
        await page.keyboard.press('r');
      }
      const audio=await page.evaluate(()=>__audit('({state:audioCtx.state,notes:theme.length,tempo})'));
      assert.equal(audio.state,'running','Existing music starts from gesture');
      const frames=await page.evaluate(()=>new Promise(resolve=>{let last;const values=[];function sample(t){if(last)values.push(t-last);last=t;if(values.length===60)resolve(values);else requestAnimationFrame(sample);}requestAnimationFrame(sample);}));
      frames.sort((a,b)=>a-b);assert.deepEqual(errors,[]);
      report.viewports.push({width,height,geometry,audio,medianFrameMs:frames[30],p95FrameMs:frames[57],errors});
      await context.close();
    }
    // Final smoke loads the uninstrumented game through the actual arcade link.
    const smoke=await browser.newPage({viewport:{width:1440,height:900}});
    const smokeErrors=[];smoke.on('pageerror',e=>smokeErrors.push(e.message));
    await smoke.goto('http://127.0.0.1:8767/');
    await smoke.locator('a[href="tetris/"]').click();
    assert.equal(await smoke.evaluate(()=>typeof window.__audit),'undefined');
    await smoke.getByRole('button',{name:'Start',exact:true}).click();
    await smoke.waitForTimeout(300);
    for(const key of ['ArrowLeft','ArrowUp','Space','ArrowRight','Space'])await smoke.keyboard.press(key);
    await smoke.screenshot({path:path.join(shots,'live-opening-1440x900.jpg'),type:'jpeg',quality:92});
    assert.deepEqual(smokeErrors,[]);
    report.scenarios.push('Uninstrumented arcade link, launch, keyboard play and resource loading');
    await smoke.close();
    fs.writeFileSync(path.join(__dirname,'graphics-results.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({...report,viewports:report.viewports.map(({geometry,...rest})=>rest)},null,2));
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

// Run with Playwright available: node tests/mobile-controls.cjs
// Set BROWSER_CHANNEL=msedge to use an installed Edge browser.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const fixture = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#183044}canvas{display:block}.touch-controls{display:flex}</style>
<canvas width="960" height="600"></canvas><div class="touch-controls"><div class="virtual-joystick" data-joystick><span class="joystick-knob"></span></div></div>
<script src="/mobile-fullscreen.js"></script><script>
window.values=[];window.unbind=VibeCadeJoystick(document.querySelector('[data-joystick]'),{
mode:new URLSearchParams(location.search).get('mode')||'analog',profile:'precision',onChange:(x,y)=>values.push([x,y])});
</script>`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/controls-test') { res.setHeader('Content-Type','text/html');res.end(fixture);return; }
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
  const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
  fs.readFile(file,(error,data)=>{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.writeHead(error?404:200);res.end(error?'Not found':data);});
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  try {
    const context = await browser.newContext({viewport:{width:740,height:390},hasTouch:true,isMobile:true});
    await context.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Fullscreen unavailable in test'));});
    const page = await context.newPage();
    const errors = [];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/controls-test?mode=analog');
    const toggle = page.locator('.vibecade-control-toggle');
    const vector = () => page.evaluate(()=>values.at(-1));
    const press = (direction,id) => page.locator(`[data-direction="${direction}"]`).dispatchEvent('pointerdown',{pointerId:id,pointerType:'touch',bubbles:true});
    const release = id => page.locator('.vibecade-direction-pad').dispatchEvent('pointerup',{pointerId:id,pointerType:'touch',bubbles:true});
    await toggle.click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('vibecade-mobile-controls')),'buttons');
    await press('up',1);assert.deepEqual(await vector(),[0,-1]);
    await press('right',2);let v=await vector();assert(Math.abs(v[0]-Math.SQRT1_2)<.0001 && Math.abs(v[1]+Math.SQRT1_2)<.0001);
    await release(1);assert.deepEqual(await vector(),[1,0]);
    await release(2);assert.deepEqual(await vector(),[0,0]);
    await press('left',3);await press('right',4);assert.deepEqual(await vector(),[0,0]);await release(3);await release(4);
    // Real capture: slide across directions and through neutral without lifting.
    const left=await page.locator('[data-direction="left"]').boundingBox();const up=await page.locator('[data-direction="up"]').boundingBox();const pad=await page.locator('.vibecade-direction-pad').boundingBox();
    await page.mouse.move(left.x+22,left.y+22);await page.mouse.down();assert.deepEqual(await vector(),[-1,0]);
    await page.mouse.move(up.x+22,up.y+22);assert.deepEqual(await vector(),[0,-1]);
    await page.mouse.move(pad.x+63,pad.y+63);assert.deepEqual(await vector(),[0,0]);await page.mouse.up();
    for(const event of ['pointercancel','lostpointercapture']){await press('left',5);await page.locator('.vibecade-direction-pad').dispatchEvent(event,{pointerId:5,bubbles:true});assert.deepEqual(await vector(),[0,0]);}
    for(const event of ['blur','resize','vibecade:reset-input']){await press('left',6);await page.evaluate(type=>dispatchEvent(new Event(type)),event);assert.deepEqual(await vector(),[0,0]);}
    await press('left',10);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;});assert.deepEqual(await vector(),[0,0]);
    await press('left',7);await toggle.click();assert.deepEqual(await vector(),[0,0]);assert.equal(await page.locator('.vibecade-direction-pad').isVisible(),false);
    const joy=await page.locator('[data-joystick]').boundingBox();await page.mouse.move(joy.x+63,joy.y+63);await page.mouse.down();await page.mouse.move(joy.x+90,joy.y+63);assert((await vector())[0]>.7);await page.mouse.up();assert.deepEqual(await vector(),[0,0]);
    await toggle.click();
    const other=await context.newPage();await other.goto(base+'/controls-test?mode=horizontal');
    assert.equal(await other.locator('[data-joystick]').getAttribute('data-control-style'),'buttons');assert.equal(await other.locator('[data-direction]').count(),2);
    await other.locator('.vibecade-control-toggle').click();await page.waitForFunction(()=>document.querySelector('[data-joystick]').dataset.controlStyle==='joystick');
    await other.reload();assert.equal(await other.locator('[data-joystick]').getAttribute('data-control-style'),'joystick');await other.close();
    await page.goto(base+'/controls-test?mode=cardinal');await toggle.click();await press('left',8);await press('up',9);assert.deepEqual(await vector(),[0,-1]);await release(9);assert.deepEqual(await vector(),[-1,0]);await release(8);
    await page.locator('[data-direction="right"]').focus();await page.keyboard.down('Space');assert.deepEqual(await vector(),[1,0]);await page.keyboard.up('Space');assert.deepEqual(await vector(),[0,0]);
    assert.equal(await page.locator('[data-joystick]').evaluate(el=>el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))),false);
    await page.evaluate(()=>{const modal=document.createElement('section');modal.id='instruction-modal';modal.className='is-visible';document.body.append(modal);});assert.equal(await toggle.isVisible(),false);await page.locator('#instruction-modal').evaluate(el=>el.remove());
    // Decorative overflow must not push either control mode onto the playfield.
    await page.addStyleTag({content:'body::before{content:"";position:absolute;left:0;top:0;width:120vw;height:1px;pointer-events:none}'});
    for(const [width,height] of [[667,375],[740,390],[844,390]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(100);
      const board=await page.locator('canvas').boundingBox();
      for(const selector of ['.vibecade-control-toggle','.vibecade-direction-pad']){const box=await page.locator(selector).boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=board.x+1&&box.y+box.height<=height,JSON.stringify({width,height,selector,box,board}));}
    }
    await page.evaluate(()=>unbind());assert.equal(await page.locator('.vibecade-control-toggle').count(),0);assert.deepEqual(await vector(),[0,0]);
    const desktop=await browser.newPage({viewport:{width:1440,height:900}});await desktop.goto(base+'/controls-test');assert.equal(await desktop.locator('.vibecade-control-toggle').isVisible(),false);await desktop.close();
    const blocked=await browser.newContext({viewport:{width:740,height:390}});await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});const bp=await blocked.newPage();await bp.goto(base+'/controls-test');await bp.locator('.vibecade-control-toggle').click();assert.equal(await bp.locator('[data-joystick]').getAttribute('data-control-style'),'buttons');await blocked.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: direction modes, diagonals, capture, slide, release, toggle, cross-game/tab persistence, storage refusal, desktop hiding and mobile layouts');
    await context.close();
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());



// Uses the same local server and Playwright setup as restart-check.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {instrument} = require('./restart-check.cjs');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await instrument(page,'space-invaders');
  await page.goto('http://127.0.0.1:8765/space-invaders/?debug');
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>__audit('waveTime')),0,'Instructions gate simulation');
  await page.locator('#instruction-close').click();
  await page.waitForFunction(()=>window.__spaceInvadersDebug.snapshot().running);
  // Leave an action captured, as browsers can do when rotating or losing focus.
  await page.locator('[data-action="fire"]').dispatchEvent('pointerdown',{pointerId:71,pointerType:'touch'});
  await page.locator('[data-joystick]').dispatchEvent('pointerdown',{pointerId:72,pointerType:'touch',clientX:100,clientY:730});
  for(const [width,height] of [[667,375],[740,390],[844,390]]){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(150);
    const before=await page.evaluate(()=>__audit('waveTime'));
    await page.waitForTimeout(200);
    assert.ok(await page.evaluate(()=>__audit('waveTime'))>before,'Simulation continues after rotation');
    const joystick=page.locator('[data-joystick]'),fire=page.locator('[data-action="fire"]');
    const j=await joystick.boundingBox(),f=await fire.boundingBox(),c=await page.locator('canvas').boundingBox();
    assert.ok(j.x+j.width<=c.x+1 && f.x>=c.x+c.width-1,'Controls stay outside battlefield');
    await joystick.dispatchEvent('pointerdown',{pointerId:73,pointerType:'touch',clientX:j.x+j.width-8,clientY:j.y+j.height/2});
    assert.ok(await page.evaluate(()=>__audit('joystickX'))>.5,'Fresh touch works after rotation');
    await joystick.dispatchEvent('pointermove',{pointerId:73,pointerType:'touch',clientX:j.x+j.width/2,clientY:j.y+j.height/2});
    assert.equal(await page.evaluate(()=>__audit('joystickX')),0,'Return to neutral');
    await joystick.dispatchEvent('pointerup',{pointerId:73,pointerType:'touch'});
    await fire.dispatchEvent('pointerdown',{pointerId:74,pointerType:'touch'});
    assert.equal(await page.evaluate(()=>__audit('fireHeld')),true,'Fire accepts a new touch');
    await page.evaluate(()=>dispatchEvent(new Event('blur')));
    assert.equal(await page.evaluate(()=>__audit('fireHeld')),false);
    console.log(`PASS portrait to ${width}x${height}: simulation, hold, neutral, release, rails`);
  }
  // A transition can clear older specialist-shot callbacks while processing the queue.
  await page.evaluate(()=>__audit('delayed.push({time:4,action:()=>{throw new Error("stale callback")}});delayed.push({time:0,action:beginWave});update(1/60)'));
  assert.equal(await page.evaluate(()=>__audit('delayed.length')),0);
  for(let wave=1;wave<=5;wave++){
    await page.evaluate(w=>__spaceInvadersDebug.startWave(w),wave);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>__spaceInvadersDebug.snapshot().wave),wave);
  }
  await page.evaluate(()=>{__spaceInvadersDebug.startWave(1);document.querySelector('[data-action="fire"]').dispatchEvent(new PointerEvent('pointerdown',{pointerId:75}));});
  await page.waitForTimeout(350);
  const output=process.env.VIBECADE_SCREENSHOT_DIR || require('node:os').tmpdir();
  fs.mkdirSync(output,{recursive:true});
  await page.screenshot({path:path.join(output,'space-invaders-landscape.png')});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#instruction-modal').isVisible(),false);
  await page.close();
  const desktop=await browser.newPage({viewport:{width:1440,height:900}});
  desktop.on('pageerror',e=>errors.push(e.message));
  await desktop.goto('http://127.0.0.1:8765/space-invaders/?debug');
  await desktop.locator('#instruction-close').click();
  await desktop.keyboard.down('ArrowRight');await desktop.waitForTimeout(200);await desktop.keyboard.up('ArrowRight');
  assert.ok(await desktop.evaluate(()=>__spaceInvadersDebug.snapshot().playerX)>400);
  await desktop.locator('#help-button').click();assert.equal(await desktop.evaluate(()=>__spaceInvadersDebug.snapshot().paused),true);
  await desktop.locator('#instruction-close').click();await desktop.keyboard.press('r');
  assert.equal(await desktop.evaluate(()=>__spaceInvadersDebug.snapshot().wave),1);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS wave transitions, waves 1–5, desktop keyboard/help/restart');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});

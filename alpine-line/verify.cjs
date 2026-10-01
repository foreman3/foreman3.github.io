const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.env.ALPINE_REPORT_DIR || 'C:/Users/forem/.codex/visualizations/2026/10/01/01a0f60d-3d50-7101-b656-37990e60463a/timed-racing';
const base = process.env.ALPINE_BASE_URL || 'http://127.0.0.1:8765';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'] });
  globalThis.activeBrowser = browser; fs.mkdirSync(out, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors = [];
  const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', e => { if (e.type() === 'error') errors.push(e.text()); }); };
  watch(page);
  await page.goto(base + '/alpine-line/?test=1'); await page.waitForTimeout(250);
  assert.equal(await page.locator('#instruction-modal').isVisible(), true);
  assert.equal(await page.evaluate(() => __alpineTest.state.time), 0);
  await page.keyboard.press('r'); assert.equal(await page.evaluate(() => __alpineTest.state.mode), 'intro');
  await page.locator('#instruction-close').focus(); await page.keyboard.press('Space');
  await page.waitForFunction(() => __alpineTest.state.mode === 'playing'); await page.locator('canvas').focus();
  await page.keyboard.down('ArrowRight'); await page.keyboard.down('ArrowUp'); await page.waitForTimeout(250);
  await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowUp');
  assert.ok(await page.evaluate(() => __alpineTest.state.x) > 480);
  assert.ok(await page.evaluate(() => __alpineTest.state.speed) > 240);
  await page.keyboard.down('Space'); await page.waitForTimeout(400); await page.keyboard.up('Space');
  assert.ok(await page.evaluate(() => __alpineTest.state.speed) < 240);
  await page.locator('#help-button').click(); const frozen = await page.evaluate(() => __alpineTest.state.time);
  await page.waitForTimeout(180); assert.equal(await page.evaluate(() => __alpineTest.state.time), frozen);
  await page.locator('#instruction-close').click(); await page.keyboard.press('p');
  assert.equal(await page.evaluate(() => __alpineTest.state.mode), 'paused'); await page.keyboard.press('p');
  await page.keyboard.press('m'); assert.equal(await page.evaluate(() => __alpineTest.state.muted), true);
  await page.keyboard.press('r'); await page.reload(); assert.equal(await page.locator('#instruction-modal').isVisible(), false);
  await page.evaluate(() => {
    __alpineTest.manual(true);
    window.race = (n, delay = .16, policy = 'adaptive', forcedMisses = 0, maxTime = 180) => {
      const t = __alpineTest, s = t.state; t.begin(n); s.score = 0;
      let elapsed = 0, think = 0, accelerations = 0, brakes = 0, changes = 0, previousControl = 'normal';
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      while (s.mode === 'playing' && elapsed < maxTime) {
        if (think <= 0) {
          think = delay;
          const i = s.gates.findIndex(g => !g.done), g = s.gates[i], next = s.gates[i + 1];
          let targetX = g ? g.x + (next ? clamp((next.x - g.x) * .35, -g.width * .28, g.width * .28) : 0) : 480;
          let targetY = g ? g.y : s.finish;
          if (g && g.num <= forcedMisses) targetX = g.x + (g.x < 480 ? 1 : -1) * (g.width / 2 + 75);
          else if (g && next && g.y - s.distance < s.groundSpeed * .18 && Math.abs(s.x - g.x) < g.width * .40) {
            targetX = next.x; targetY = next.y;
          }
          const dy = Math.max(30, targetY - s.distance);
          const desired = clamp(Math.atan2(targetX - s.x, dy) * 1.35, -.75, .75);
          const move = clamp((desired + (desired - s.heading) * .45) / .78, -1, 1);
          let control = policy === 'flat' ? 'normal' : 'accelerate';
          if (policy === 'adaptive') {
            const change = Math.max(.2, Math.abs(desired - s.heading) * 1.4);
            const safeSpeed = Math.pow(2.8 * Math.pow(260, 1.25) * dy / change, 1 / 2.25) * .87;
            const outgoing = next && g ? Math.atan2(next.x - g.x, next.y - g.y) : desired;
            const cornerSpeed = Math.pow(2.8 * Math.pow(260, 1.25) * (next && g ? next.y - g.y : 400) / Math.max(.25, Math.abs(outgoing - desired) * 1.5), 1 / 2.25);
            const targetSpeed = Math.min(s.cfg.speed * 1.52, safeSpeed, g && g.y - s.distance < s.speed * .85 ? cornerSpeed : Infinity);
            control = s.speed > targetSpeed + 20 ? 'brake' : s.speed < targetSpeed - 8 ? 'accelerate' : 'normal';
          }
          if (control === 'accelerate') accelerations++;
          if (control === 'brake') brakes++;
          if (previousControl !== control) changes++;
          previousControl = control; t.setInput(move, control);
        }
        t.tick(1 / 60); elapsed += 1 / 60; think -= 1 / 60;
      }
      t.setInput(0); t.draw();
      return { level: n, delay, policy, mode: s.mode, gates: s.passed, count: s.cfg.count, misses: s.missed,
        elapsed: +s.time.toFixed(2), penalty: s.penalty, total: +t.raceTime().toFixed(2), limit: s.cfg.limit,
        accelerations, brakes, changes, progress: +(s.distance / s.finish).toFixed(2) };
    };
  });
  const curve = await page.evaluate(() => Array.from({ length: 7 }, (_, i) => race(i + 1)));
  const flat = await page.evaluate(() => Array.from({ length: 7 }, (_, i) => race(i + 1, .16, 'flat')));
  const reckless = await page.evaluate(() => Array.from({ length: 7 }, (_, i) => race(i + 1, .16, 'fast')));
  const slower = await page.evaluate(() => Array.from({ length: 7 }, (_, i) => race(i + 1, .42)));
  const recovery = await page.evaluate(() => race(5, .16, 'adaptive', 2));
  const expert = await page.evaluate(() => Array.from({ length: 7 }, (_, i) => race(i + 1, .08)));
  console.log('CURVE', JSON.stringify(curve)); console.log('FLAT', JSON.stringify(flat));
  console.log('RECKLESS', JSON.stringify(reckless)); console.log('SLOWER', JSON.stringify(slower)); console.log('RECOVERY', JSON.stringify(recovery));
  console.log('EXPERT', JSON.stringify(expert));
  if (process.env.ALPINE_PROBE) { await browser.close(); return; }
  for (const r of curve.slice(0, 6)) assert.equal(r.mode, 'clear', `race ${r.level}`);
  for (const r of expert) assert.equal(r.mode, 'clear', `expert race ${r.level}`);
  for (const r of flat.slice(1)) assert.equal(r.mode, 'over', `cruise race ${r.level}`);
  for (const r of reckless.slice(2)) assert.equal(r.mode, 'over', `reckless race ${r.level}`);
  assert.ok(expert[6].misses >= 3, 'championship permits meaningful gate penalties');
  assert.equal(recovery.mode, 'clear'); assert.ok(recovery.misses >= 2);
  const mechanics = await page.evaluate(() => {
    const t = __alpineTest, s = t.state;
    function turnAt(mode) { t.begin(4); t.setInput(0, mode); for (let i = 0; i < 60; i++) t.tick(1 / 60);
      const speed = s.speed; s.heading = 0; t.setInput(1, mode); for (let i = 0; i < 12; i++) t.tick(1 / 60);
      return { speed, angle: s.heading, radius: speed / t.turnRate(speed) }; }
    const fast = turnAt('accelerate'), slow = turnAt('brake');
    const wider = fast.radius > slow.radius * 2 && fast.angle < slow.angle;
    t.begin(1); const g = s.gates[0]; s.distance = g.y - 1; s.x = g.x + g.width; t.tick(1 / 60);
    const miss = s.missed === 1 && s.penalty === 2 && s.mode === 'playing';
    t.begin(1); s.distance = s.finish - 1; s.time = s.cfg.limit - 3; s.penalty = 2; t.tick(1 / 60);
    const qualifyWithMiss = s.mode === 'clear';
    t.begin(1); s.distance = s.finish - 1; s.time = s.cfg.limit - 1; s.penalty = 2; t.tick(1 / 60);
    const penaltyFails = s.mode === 'over';
    t.begin(1); t.setInput(0, 'brake'); for (let i = 0; i < 240; i++) t.tick(1 / 60);
    const unlimited = s.speed === s.cfg.speed * .58 && !('reserve' in s);
    t.setInput(0); for (let i = 0; i < 120; i++) t.tick(1 / 60);
    const cruise = Math.abs(s.speed - s.cfg.speed) < .01;
    return { wider, miss, qualifyWithMiss, penaltyFails, unlimited, cruise, fast, slow };
  });
  console.log('MECHANICS', JSON.stringify(mechanics));
  for (const key of ['wider', 'miss', 'qualifyWithMiss', 'penaltyFails', 'unlimited', 'cruise']) assert.equal(mechanics[key], true, key);
  await page.evaluate(() => race(1)); await page.locator('#next').click(); assert.equal(await page.evaluate(() => __alpineTest.state.level), 2);
  await page.evaluate(() => race(7, .08)); assert.equal(await page.locator('#result-title').textContent(), 'Alpine champion!');
  await page.locator('#again').click(); assert.equal(await page.evaluate(() => __alpineTest.state.score), 0);
  await page.evaluate(() => { const t = __alpineTest; t.state.score = 880; t.begin(4); t.state.score = 2000; t.state.time = t.state.cfg.limit; t.tick(1 / 60); });
  await page.locator('#retry').click(); assert.equal(await page.evaluate(() => __alpineTest.state.level), 4);
  assert.equal(await page.evaluate(() => __alpineTest.state.score), 880); assert.equal(await page.evaluate(() => __alpineTest.state.penalty), 0);
  await page.keyboard.press('p'); await page.locator('#help-button').click(); await page.keyboard.press('r');
  await page.locator('#instruction-close').click(); assert.equal(await page.evaluate(() => __alpineTest.state.mode), 'playing');
  const capture = await page.evaluate(() => race(5, .16, 'adaptive', 0, 11));
  await page.locator('canvas').evaluate(e => e.blur()); await page.screenshot({ path: out + '/alpine-line-timed-gameplay.png' });
  await page.evaluate(() => __alpineTest.manual(false)); const desktopFrames = await frames(page); await page.evaluate(() => __alpineTest.manual(true));
  const layouts = [];
  for (const [width, height] of [[1440, 900], [667, 375], [740, 390], [844, 390], [390, 844]]) {
    await page.setViewportSize({ width, height }); await page.waitForTimeout(120);
    layouts.push(await page.evaluate(() => { const r = id => { const b = document.querySelector(id).getBoundingClientRect(); return { x: b.x, y: b.y, right: b.right, bottom: b.bottom }; };
      return { w: innerWidth, h: innerHeight, board: r('#playfield'), joy: r('[data-joystick]'), actions: r('.touch-actions'), overflow: document.documentElement.scrollWidth > innerWidth }; }));
    await page.screenshot({ path: out + `/alpine-line-${width}.png` });
  }
  for (const r of layouts) { assert.equal(r.overflow, false); assert.ok(r.board.x >= -1 && r.board.right <= r.w + 1 && r.board.bottom <= r.h + 1);
    assert.ok(r.actions.y >= 0 && r.actions.bottom <= r.h);
    if (r.w < 900 && r.w > r.h) { assert.ok(r.joy.right < r.board.x); assert.ok(r.actions.x > r.board.right); }
    if (r.w < r.h) { assert.ok(r.joy.y > r.board.bottom); assert.ok(r.actions.y > r.board.bottom); } }
  const touch = await browser.newPage({ viewport: { width: 667, height: 375 }, hasTouch: true, isMobile: true }); watch(touch);
  await touch.addInitScript(() => { HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error('Test fullscreen refusal')); });
  await touch.goto(base + '/alpine-line/?test=1'); assert.equal(await touch.locator('#touch-controls').isVisible(), false);
  await touch.locator('#instruction-close').tap(); await touch.waitForFunction(() => __alpineTest.state.mode === 'playing');
  assert.equal(await touch.evaluate(() => document.documentElement.dataset.mobileFullscreenAttempted), 'true');
  const cdp = await touch.context().newCDPSession(touch), j = await touch.locator('[data-joystick]').boundingBox(), cx = j.x + j.width / 2, cy = j.y + j.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx + 26, y: cy, id: 1 }] });
  await touch.waitForTimeout(200); assert.ok(await touch.evaluate(() => __alpineTest.state.x) > 480);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 27, y: cy, id: 1 }] });
  assert.ok(await touch.evaluate(() => __alpineTest.input().touchInput) < 0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await touch.waitForFunction(() => __alpineTest.input().touchInput === 0);
  assert.equal(await touch.evaluate(() => __alpineTest.input().touchInput), 0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await touch.evaluate(() => { const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); document.querySelector('[data-joystick]').dispatchEvent(e); return e.defaultPrevented; }), true);
  const ab = await touch.locator('#accelerate').boundingBox(), bb = await touch.locator('#brake').boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx + 25, y: cy, id: 1 }, { x: ab.x + 40, y: ab.y + 25, id: 2 }] });
  await touch.waitForTimeout(300); assert.ok(await touch.evaluate(() => __alpineTest.state.speed) > 240);
  assert.ok(await touch.evaluate(() => __alpineTest.input().touchInput) > 0); assert.equal(await touch.evaluate(() => __alpineTest.input().touchAccelerate), true);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); assert.equal(await touch.evaluate(() => __alpineTest.input().touchAccelerate), false);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bb.x + 40, y: bb.y + 25, id: 3 }] });
  await touch.waitForTimeout(450); assert.ok(await touch.evaluate(() => __alpineTest.state.speed) < 240);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); assert.equal(await touch.evaluate(() => __alpineTest.input().touchBrake), false);
  await touch.locator('#touch-sound').tap(); assert.equal(await touch.evaluate(() => __alpineTest.state.muted), true);
  await touch.locator('#touch-pause').tap(); assert.equal(await touch.evaluate(() => __alpineTest.state.mode), 'paused');
  await touch.locator('.vibecade-mobile-restart').tap(); assert.equal(await touch.evaluate(() => __alpineTest.state.level), 1);
  await touch.locator('.vibecade-mobile-options').tap(); await touch.locator('.vibecade-control-toggle').click(); await touch.locator('.vibecade-options-close').click();
  const rb = await touch.locator('.vibecade-direction-pad [data-direction="right"]').boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rb.x + 22, y: rb.y + 22, id: 4 }] });
  await touch.waitForTimeout(170); assert.ok(await touch.evaluate(() => __alpineTest.state.x) > 480);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); assert.equal(await touch.evaluate(() => __alpineTest.input().touchInput), 0);
  await touch.evaluate(() => window.dispatchEvent(new Event('blur'))); assert.equal(await touch.evaluate(() => __alpineTest.state.mode), 'paused');
  await touch.locator('.vibecade-mobile-restart').tap(); await touch.reload(); await touch.locator('.vibecade-mobile-play').waitFor({ state: 'visible' });
  await touch.locator('.vibecade-mobile-play').tap(); await touch.waitForFunction(() => __alpineTest.state.mode === 'playing');
  assert.equal(await touch.locator('.virtual-joystick').getAttribute('data-control-style'), 'buttons');
  await touch.screenshot({ path: out + '/alpine-line-touch.png' }); const mobileFrames = await frames(touch); await touch.close();
  assert.deepEqual(errors, []);
  await page.goto(base + '/'); assert.equal(await page.locator('section[data-status="work"] a[href="alpine-line/"]').count(), 1);
  await page.locator('a[href="alpine-line/"]').click(); assert.equal(await page.title(), 'Alpine Line | VibeCade');
  const rootResources = errors.filter(e => e === 'Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED' || e === 'Failed to load resource: the server responded with a status of 404 (File not found)');
  assert.deepEqual(errors.filter(e => !rootResources.includes(e)), []);
  await browser.close(); fs.writeFileSync(out + '/verification.json', JSON.stringify({ curve, expert, flat, reckless, slower, recovery, mechanics, capture, layouts, desktopFrames, mobileFrames, rootResources }, null, 2));
  console.log('FRAMES', JSON.stringify({ desktopFrames, mobileFrames })); console.log('PASS');
}
async function frames(page) { return page.evaluate(() => new Promise(resolve => { const a = []; let prev = 0;
  function f(n) { if (prev) a.push(n - prev); prev = n; if (a.length < 120) requestAnimationFrame(f); else { a.sort((x, y) => x - y); resolve({ mean: +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(2), p95: +a[Math.floor(a.length * .95)].toFixed(2) }); } } requestAnimationFrame(f); })); }
run().catch(async e => { console.error(e); await globalThis.activeBrowser?.close(); process.exitCode = 1; });

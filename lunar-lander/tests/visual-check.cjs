// Agent Yoda. Local browser visual/interaction evidence; production hooks are unchanged.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const shots = path.resolve(__dirname, '../screenshots');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const [width, height] of [[1440, 900], [667, 375], [740, 390], [844, 390], [390, 844]]) {
      const mobile = width < 1000;
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: mobile, isMobile: mobile });
      const page = await context.newPage();
      // This minimal localhost server has no site favicon; keep that unrelated request out of game checks.
      await page.route('**/favicon.ico', route => route.fulfill({ status: 204 }));
      const errors = [];
      page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text() + ' ' + m.location().url); });
      const response = await page.goto('http://127.0.0.1:8766/lunar-lander/');
      assert((await response.text()).includes('A quiet Earth'), 'Server must serve current artwork');
      const initial = await page.evaluate(() => __lunarLanderTest.snapshot());
      await page.waitForTimeout(180);
      assert.deepEqual(await page.evaluate(() => __lunarLanderTest.snapshot()), initial, 'Instructions gate flight');
      await page.getByRole('button', { name: 'BEGIN DESCENT', exact: true }).click();
      await page.locator('.vibecade-mobile-settling').waitFor({ state: 'hidden' });
      await page.locator('#instruction-modal').waitFor({ state: 'hidden' });
      await page.screenshot({ type: 'jpeg' }); // Wait for the first settled paint after launch.
      await page.evaluate(() => __lunarLanderTest.setApproach({ altitude: 190, vy: 0 }));
      await page.screenshot({ path: path.join(shots, `after-${width}x${height}.jpg`), type: 'jpeg', quality: 92 });
      const geometry = await page.evaluate(() => {
        const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        return { canvas: rect(document.querySelector('canvas')), controls: [...document.querySelectorAll('.touch-button')].map(rect), width: innerWidth, height: innerHeight };
      });
      if (mobile) {
        const c = geometry.canvas;
        for (const b of geometry.controls) {
          assert(b.x + b.width <= c.x || b.x >= c.x + c.width || b.y >= c.y + c.height || b.y + b.height <= c.y, 'Touch controls stay outside playfield');
          assert(b.x >= 0 && b.y >= 0 && b.x + b.width <= width + 1 && b.y + b.height <= height + 1, 'Touch buttons remain onscreen');
        }
        const client = await context.newCDPSession(page);
        for (const label of ['Rotate counterclockwise', 'Rotate clockwise', 'Fire main engine']) {
          await page.getByRole('button', { name: 'Restart mission', exact: true }).tap();
          const before = await page.evaluate(() => __lunarLanderTest.snapshot());
          const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
          await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
          await page.waitForTimeout(220);
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          const after = await page.evaluate(() => __lunarLanderTest.snapshot());
          assert(label === 'Fire main engine' ? after.fuel < before.fuel : after.angle !== before.angle, 'Real touch hold changes appropriate flight input');
        }
        await page.getByLabel('Toggle sound', { exact: true }).tap();
        assert.equal(await page.getByLabel('Toggle sound', { exact: true }).getAttribute('aria-pressed'), 'true');
        await page.getByLabel('Toggle sound', { exact: true }).tap();
        await page.getByRole('button', { name: 'Restart mission', exact: true }).tap();
        assert.equal((await page.evaluate(() => __lunarLanderTest.snapshot())).hull, 3);
      }
      const frames = await page.evaluate(() => new Promise(resolve => {
        const intervals = []; let last;
        function sample(now) { if (last) intervals.push(now - last); last = now; if (intervals.length === 60) resolve(intervals); else requestAnimationFrame(sample); }
        requestAnimationFrame(sample);
      }));
      frames.sort((a,b) => a-b);
      if (width === 1440 || width === 844) {
        for (const level of [3, 5]) {
          await page.evaluate(level => { __lunarLanderTest.jumpToLevel(level); __lunarLanderTest.setApproach({ altitude: 110, vy: 3, angle: 3 }); }, level);
          await page.screenshot({ path: path.join(shots, `after-${width}x${height}-mission-${level}.jpg`), type: 'jpeg', quality: 92 });
        }
      }
      assert.deepEqual(errors, []);
      results.push({ width, height, geometry, medianFrameMs: frames[30], p95FrameMs: frames[57], errors });
      await context.close();
    }
    fs.writeFileSync(path.join(__dirname, 'visual-results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results.map(({geometry,...rest})=>rest), null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

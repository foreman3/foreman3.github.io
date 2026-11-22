// Agent Yoda, LL-20261121T1905Z-YODA. Test-only instrumentation; no runtime changes.
// NODE_PATH may point to the host's bundled dependencies. Serve repo on localhost:8766.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const baseline = execFileSync('git', ['show', '90c920e:lunar-lander/index.html'], { cwd: root, encoding: 'utf8' });
const current = fs.readFileSync(path.join(root, 'lunar-lander/index.html'), 'utf8');
const scripts = html => [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
for (const script of scripts(current)) new vm.Script(script);
// All non-rendering script bytes, including constants, terrain, controls and hooks, must match.
// Compare source outside the presentation block independently of the dynamic comparison.
const prefix = html => scripts(html).join('\n').split('    function line(')[0];
const suffix = html => scripts(html).join('\n').split('    var accumulator = 0;')[1];
assert.equal(prefix(current), prefix(baseline), 'Simulation/constants/audio must be byte-identical');
assert.equal(suffix(current), suffix(baseline), 'Frame clock/input/test hooks/startup must be byte-identical');
assert.equal(current.split('  <script>')[0], baseline.split('  <script>')[0], 'DOM/CSS/instructions/control layout must be byte-identical');
const report = { run: 'LL-20261121T1905Z-YODA', agent: 'Agent Yoda', baseline: '90c920e', sourceParity: true, scenarios: [], errors: [] };
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const pages = [];
    for (const html of [baseline, current]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      page.on('pageerror', e => report.errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
      await page.addInitScript(() => {
        let seed = 3245, now = 0, callbacks = [];
        Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
        performance.now = () => now;
        window.requestAnimationFrame = fn => { callbacks.push(fn); return 1; };
        window.__tick = count => { for (let n = 0; n < count; n++) { now += 1000 / 60; const batch = callbacks; callbacks = []; batch.forEach(fn => fn(now)); } };
      });
      await page.route('**/lunar-lander/', route => route.fulfill({ contentType: 'text/html', body: html.replace('} catch (bootError)', 'window.__audit = expression => eval(expression);\n} catch (bootError)') }));
      await page.goto('http://127.0.0.1:8766/lunar-lander/');
      pages.push(page);
    }
    async function compare(label) {
      const values = [];
      for (const page of pages) values.push(await page.evaluate(() => JSON.parse(__audit('JSON.stringify({state,controls})'))));
      assert.deepEqual(values[1], values[0], label);
      report.scenarios.push(label);
    }
    const both = async fn => { for (const page of pages) await fn(page); };
    await both(p => p.evaluate(() => __tick(120)));
    await compare('First-load gating: 120 frames stay paused');
    for (const page of pages) assert.equal((await page.evaluate(() => __lunarLanderTest.snapshot())).paused, true);
    await both(p => p.getByRole('button', { name: 'BEGIN DESCENT', exact: true }).click());
    await both(p => p.evaluate(() => __tick(30)));
    await compare('Opening descent');
    for (const key of ['ArrowLeft', 'ArrowRight', 'a', 'd', 'ArrowUp', 'w', 'Space']) {
      await both(async p => { await p.keyboard.down(key); await p.evaluate(() => __tick(12)); await p.keyboard.up(key); });
      await compare('Keyboard ' + key);
    }
    await both(p => p.keyboard.press('m'));
    await compare('Keyboard mute');
    await both(p => p.getByRole('button', { name: 'How to play Lunar Lander', exact: true }).click());
    await both(p => p.evaluate(() => __tick(60)));
    await compare('Help pauses flight');
    await both(p => p.getByRole('button', { name: 'BEGIN DESCENT', exact: true }).click());
    await both(p => p.keyboard.press('r'));
    await compare('Keyboard restart');
    for (let level = 1; level <= 5; level++) {
      await both(p => p.evaluate(level => { __lunarLanderTest.jumpToLevel(level); __lunarLanderTest.setApproach({ altitude: 1, vy: 4 }); __tick(24); }, level));
      await compare('Mission ' + level + ' safe landing and scoring');
      for (const page of pages) assert.equal((await page.evaluate(() => __lunarLanderTest.snapshot())).mode, level === 5 ? 'won' : 'landed');
      await both(p => p.evaluate(level => { __lunarLanderTest.jumpToLevel(level); __lunarLanderTest.setApproach({ altitude: 1, vy: 120 }); __tick(24); }, level));
      await compare('Mission ' + level + ' crash and hull');
      for (const page of pages) assert.equal((await page.evaluate(() => __lunarLanderTest.snapshot())).hull, 2);
    }
    await both(p => p.setViewportSize({ width: 667, height: 375 }));
    await both(p => p.getByRole('button', { name: 'Restart mission', exact: true }).click());
    for (const label of ['Rotate counterclockwise', 'Rotate clockwise', 'Fire main engine']) {
      await both(async p => { const button = p.getByRole('button', { name: label, exact: true }); const box = await button.boundingBox(); await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.evaluate(() => __tick(12)); await p.mouse.up(); });
      await compare('Pointer hold/release ' + label);
    }
    await both(p => p.getByLabel('Toggle sound', { exact: true }).dispatchEvent('pointerdown', { pointerId: 2 }));
    await compare('Touch sound toggle');
    await both(p => p.evaluate(() => { __audit('state.level=4;state.score=900;state.hull=1'); document.querySelector('[data-action="restart"]').click(); }));
    await compare('Existing restart regression state');
    for (const page of pages) assert.deepEqual(await page.evaluate(() => __audit('[state.level,state.score,state.hull]')), [1, 0, 3]);
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(path.join(__dirname, 'graphics-results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

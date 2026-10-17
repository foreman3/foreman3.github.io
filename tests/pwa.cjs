// NODE_PATH must include Playwright. Set BROWSER_CHANNEL=msedge if needed.
// Run: node tests/pwa.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const screenshotDir = process.env.PWA_SCREENSHOT_DIR || require('node:os').tmpdir();
const root = path.resolve(__dirname, '..');
const inventoryContext = { self: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'offline-assets.js'), 'utf8'), inventoryContext);
const inventory = inventoryContext.self.VIBECADE_OFFLINE;
const games = inventory.assets.filter(asset => /^[a-z0-9-]+\/index\.html$/.test(asset));
let failingAsset = null;
let updateVersion = false;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/^\/arcade(?=\/)/, '');
  if (pathname === failingAsset) return res.writeHead(503).end('Test download interruption');
  let file = path.resolve(root, '.' + decodeURIComponent(pathname));
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
  fs.readFile(file, (error, data) => {
    if (!error && updateVersion && pathname === '/offline-assets.js') data = Buffer.from(data.toString().replace(inventory.version, inventory.version + '-update-test'));
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.writeHead(error ? 404 : 200).end(error ? 'Not found' : data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  try {
    for (const prefix of ['/', '/arcade/']) {
      const base = origin + prefix;
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.waitForFunction(() => navigator.serviceWorker.controller);
      const cdp = await context.newCDPSession(page);
      const manifest = await cdp.send('Page.getAppManifest');
      assert.deepEqual(manifest.errors, [], JSON.stringify(manifest));
      const parsed = JSON.parse(manifest.data);
      assert.equal(parsed.display, 'fullscreen');
      assert.equal(new URL(parsed.start_url, manifest.url).href, base);
      assert.equal(new URL(parsed.scope, manifest.url).href, base);
      assert.equal(new URL(parsed.id, manifest.url).href, base);
      for (const icon of parsed.icons) {
        const response = await context.request.get(new URL(icon.src, manifest.url).href);
        assert.equal(response.status(), 200);
        const bytes = await response.body();
        const [width, height] = icon.sizes.split('x').map(Number);
        assert.equal(bytes.readUInt32BE(16), width);
        assert.equal(bytes.readUInt32BE(20), height);
      }
      const installability = await cdp.send('Page.getInstallabilityErrors');
      // Playwright's isolated contexts are incognito, which disables actual
      // installation; all manifest/installability criteria must still pass.
      assert.deepEqual(installability.installabilityErrors.filter(error => error.errorId !== 'in-incognito'), [], JSON.stringify(installability));
      console.log(`PASS: Chromium manifest criteria, icons and scope at ${prefix}`);
      await page.waitForFunction(() => document.getElementById('offline-status').textContent.includes('games ready offline'));

      // A browser that hasn't offered an install prompt still has a useful path.
      await page.locator('#install-app').click();
      assert.match(await page.locator('#install-help').textContent(), /Add to home screen/);
      // Exercise both one-shot prompt outcomes without installing on the host.
      for (const outcome of ['dismissed', 'accepted', 'rejected']) {
        await page.evaluate(outcome => {
          window.promptCalls = 0;
          const event = new Event('beforeinstallprompt', { cancelable: true });
          event.prompt = async () => { window.promptCalls++; if (outcome === 'rejected') throw Error('Unavailable'); };
          event.userChoice = Promise.resolve({ outcome });
          dispatchEvent(event);
          window.promptPrevented = event.defaultPrevented;
        }, outcome);
        await page.locator('#install-app').click();
        await page.waitForFunction(() => !document.getElementById('install-app').disabled);
        assert.equal(await page.evaluate(() => promptCalls), 1);
        assert.equal(await page.evaluate(() => promptPrevented), true);
        assert.match(await page.locator('#install-help').textContent(), outcome === 'accepted' ? /Finish installing/ : /menu/);
      }
      for (const [width, height] of [[390, 844], [667, 375], [740, 390], [844, 390], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        const button = await page.locator('#install-app').boundingBox();
        assert(button.width >= 44 && button.height >= 44 && button.x >= 0 && button.x + button.width <= width);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await page.setViewportSize({ width: 390, height: 844 });
      if (prefix === '/') await page.screenshot({ path: path.join(screenshotDir, 'vibecade-pwa-mobile.png') });
      await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
      assert.equal(await page.locator('#install-card').isVisible(), false);

      await page.goto(base + 'canopy-caper/');
      await page.waitForFunction(() => document.querySelector('link[rel="manifest"]'));
      assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'), base + 'manifest.webmanifest');
      assert.deepEqual(errors, []);
      await context.setOffline(true);
      // Every game must load offline without having been visited first. Also
      // check that all its same-origin runtime requests are fulfilled.
      const failed = [];
      page.on('requestfailed', request => { if (request.url().startsWith(base)) failed.push(request.url()); });
      for (const game of games) {
        const source = fs.readFileSync(path.join(root, game), 'utf8');
        const title = source.match(/<title>(.*?)<\/title>/i)[1];
        const before = errors.length;
        await page.goto(base + game.replace('index.html', ''), { waitUntil: 'load' });
        assert.equal(await page.title(), title, game);
        assert.deepEqual(errors.slice(before), [], game);
      }
      await page.goto(base);
      assert.match(await page.locator('#offline-status').textContent(), /games ready offline/);
      await page.goto(base + 'not-a-cached-page/');
      assert.match(await page.locator('h1').textContent(), /isn’t saved yet/);
      await page.waitForFunction(base => document.getElementById('arcade-link').href === base, base);
      await page.locator('#arcade-link').click();
      await page.waitForSelector('#game-search');
      assert.deepEqual(failed, []);
      await context.close();
      console.log(`PASS: install choices, responsive menu, all ${games.length} games offline and offline fallback at ${prefix}`);
    }

    // Interrupted first download must offer recovery. A failed later release
    // must leave the saved release usable; a complete update waits for exit.
    const recovery = await browser.newContext();
    let recoveryPage = await recovery.newPage();
    failingAsset = '/vendor/matter-0.19.0.min.js';
    await recoveryPage.goto(origin + '/');
    await recoveryPage.locator('#offline-retry').waitFor({ state: 'visible' });
    assert.equal(await recoveryPage.evaluate(() => navigator.serviceWorker.controller), null);
    failingAsset = null;
    await recoveryPage.locator('#offline-retry').click();
    await recoveryPage.waitForFunction(() => document.getElementById('offline-status').textContent.includes('games ready offline'));
    await recoveryPage.waitForFunction(() => navigator.serviceWorker.controller);
    updateVersion = true;
    failingAsset = '/vendor/matter-0.19.0.min.js';
    await recoveryPage.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await recoveryPage.locator('#offline-retry').waitFor({ state: 'visible' });
    await recovery.setOffline(true);
    await recoveryPage.goto(origin + '/balance/');
    assert.equal(await recoveryPage.evaluate(() => typeof Matter.Engine.create), 'function');
    await recovery.setOffline(false);
    failingAsset = null;
    await recoveryPage.goto(origin + '/');
    await recoveryPage.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await recoveryPage.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting));
    await recoveryPage.close();
    recoveryPage = await recovery.newPage();
    await recoveryPage.goto(origin + '/');
    await recoveryPage.waitForFunction(async oldVersion => {
      const keys = await caches.keys();
      return keys.some(key => key.endsWith('-update-test')) && !keys.some(key => key.endsWith('-' + oldVersion));
    }, inventory.version);
    await recovery.close();
    updateVersion = false;
    console.log('PASS: interrupted download retry, failed update preserves offline games, completed update activates after exit');

    // Manifest fullscreen does not populate document.fullscreenElement. Keep
    // instructions paused, and start without requesting Fullscreen API again.
    const installed = await browser.newContext({ viewport: { width: 740, height: 390 }, isMobile: true, hasTouch: true });
    await installed.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = query => {
        const result = original(query);
        if (query.includes('display-mode: fullscreen')) Object.defineProperty(result, 'matches', { value: true });
        return result;
      };
      window.fullscreenRequests = 0;
      Element.prototype.requestFullscreen = () => { window.fullscreenRequests++; return Promise.reject(Error('Unexpected fullscreen request')); };
    });
    const page = await installed.newPage();
    await page.goto(origin + '/');
    assert.equal(await page.locator('#install-card').isVisible(), false);
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await installed.setOffline(true);
    await page.goto(origin + '/canopy-caper/');
    await page.waitForFunction(() => document.documentElement.dataset.vibecadeLaunch === 'instructions');
    assert.equal(await page.locator('#instruction-modal').isVisible(), true);
    assert.equal(await page.evaluate(() => document.fullscreenElement), null);
    assert.equal(await page.locator('html').getAttribute('data-mobile-fullscreen'), 'entered');
    await page.locator('#instruction-close').click();
    await page.waitForFunction(() => document.documentElement.dataset.vibecadeLaunch === 'playing');
    assert.equal(await page.evaluate(() => fullscreenRequests), 0);
    await page.screenshot({ path: path.join(screenshotDir, 'vibecade-pwa-game.png') });
    await installed.close();
    console.log('PASS: installed fullscreen recognition and instruction-gated launch');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());

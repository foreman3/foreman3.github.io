importScripts('./offline-assets.js');
const inventory = self.VIBECADE_OFFLINE;
const appRoot = new URL('./', self.location.href);
// Scope the cache so deployments on the same origin cannot delete each other.
const cachePrefix = `vibecade-arcade-${appRoot.pathname}-`;
const cacheName = cachePrefix + inventory.version;
const assetURLs = inventory.assets.map(asset => new URL(asset, appRoot).href);
const knownAssets = new Set(assetURLs);
const offlineURL = new URL('offline.html', appRoot).href;
const status = (completed, state = 'downloading') => ({
  type: 'VIBECADE_OFFLINE_STATUS', state, completed, total: assetURLs.length,
  games: inventory.games, bytes: inventory.bytes
});
async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.filter(client => client.url.startsWith(appRoot.href)).forEach(client => client.postMessage(message));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    let completed = 0;
    let next = 0;
    await broadcast(status(0));
    try {
      // A failed download leaves the previous release active. Only a complete
      // release activates, and at most four requests run at once on mobile.
      await Promise.all(Array.from({ length: 4 }, async () => {
        while (next < assetURLs.length) {
          const url = assetURLs[next++];
          const response = await fetch(url, { cache: 'reload' });
          if (!response.ok) throw Error(`Offline asset unavailable: ${url}`);
          await cache.put(url, response);
          completed++;
          if (completed % 8 === 0 || completed === assetURLs.length) await broadcast(status(completed));
        }
      }));
      await broadcast(status(completed, 'ready'));
    } catch (error) {
      await broadcast(status(completed, 'error'));
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
    await broadcast(status(assetURLs.length, 'ready'));
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'VIBECADE_OFFLINE_STATUS') return;
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    const completed = (await cache.keys()).length;
    event.source?.postMessage(status(completed, completed === assetURLs.length ? 'ready' : 'downloading'));
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(appRoot.href)) return;
  // Normalize directory navigation and version-query script URLs to the
  // inventory keys. Serve one consistent release until the next activates.
  if (url.pathname.endsWith('/')) url.pathname += 'index.html';
  url.search = '';
  url.hash = '';
  if (knownAssets.has(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      return await cache.match(url.href) || fetch(event.request);
    })());
  } else if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(cacheName);
      return await cache.match(offlineURL) || Response.error();
    }));
  }
});

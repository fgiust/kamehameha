self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open('kamehameha-pwa-v1');
    await cache.addAll([
      '/',
      '/index.html',
      '/manifest.webmanifest',
      '/favicon.svg',
      '/kame.svg',
      '/kame-red.svg',
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === 'kamehameha-pwa-v1' ? Promise.resolve() : caches.delete(k))));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting().catch(() => {});
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const network = await fetch(request);
        const cache = await caches.open('kamehameha-pwa-v1');
        cache.put('/index.html', network.clone()).catch(() => {});
        return network;
      } catch {
        const cached = await caches.match('/index.html');
        return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const network = await fetch(request);
      const cache = await caches.open('kamehameha-pwa-v1');
      cache.put(request, network.clone()).catch(() => {});
      return network;
    } catch {
      return new Response('', { status: 504 });
    }
  })());
});

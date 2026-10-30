/**
 * SlideVault High-Performance Service Worker v3.0
 * Stale-While-Revalidate caching for static assets, network-first for documents,
 * strict bypass for SSE real-time channels and dynamic APIs.
 */

const CACHE_NAME = 'slidevault-cache-v8';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/trangchudong.html',
  '/vault.html',
  '/font/fonts.css',
  '/tệp hệ thống/tailwind-shadcn/shadcn.css',
  '/tệp hệ thống/glass-theme.css',
  '/tệp hệ thống/glass-theme.js',
  '/tệp hệ thống/tailwind-shadcn/tailwind.min.js',
  '/tệp hệ thống/tailwind-shadcn/lucide.min.js',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best-effort precache (does not fail install if an individual asset is missing)
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Prune obsolete caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Strict bypass for non-GET and real-time APIs (SSE stream, cloudflared, 3D touch)
  if (req.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.includes('/stream')) {
    return;
  }

  // 2. HTML navigation: Network-first with cache fallback
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedRes = await caches.match(req);
          if (cachedRes) return cachedRes;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Static assets (CSS, JS, Fonts, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});

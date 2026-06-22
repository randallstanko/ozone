const CACHE_NAME = 'ozone-v2';
const APP_SHELL = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache app shell (NOT the HTML — we want network-first for that)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches + claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for everything (HTML, JS, CSS, API)
// Falls back to cache only if network is unavailable
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Network-first for ALL requests
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets (not API/HTML)
        if (
          response &&
          response.status === 200 &&
          response.type !== 'opaque' &&
          !url.pathname.startsWith('/api/') &&
          !url.pathname.endsWith('.html') &&
          url.pathname !== '/'
        ) {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

/* ═══════════════════════════════════════════════════════════
   SPRINT OS — Service Worker  v2
   Provides offline support, cache-first for static assets,
   network-first for dynamic data.
   Cache name is versioned — bump CACHE_VER on any deploy.
═══════════════════════════════════════════════════════════ */

const CACHE_VER  = 'sprint-os-v2';
const CACHE_CORE = 'sprint-core-v2';   // App shell — never stale
const CACHE_DATA = 'sprint-data-v2';   // Runtime fetches

// App shell — everything needed to render offline
const SHELL = [
  '/life-plan/',
  '/life-plan/index.html',
  '/life-plan/daily.html',
  '/life-plan/courses.html',
  '/life-plan/milestones.html',
  '/life-plan/savings.html',
  '/life-plan/roadmap.html',
  '/life-plan/habits.html',
  '/life-plan/review.html',
  '/life-plan/404.html',
  '/life-plan/style.css',
  '/life-plan/data.js',
  '/life-plan/update.js',
  '/life-plan/manifest.json',
  '/life-plan/icon-192.png',
  '/life-plan/icon-512.png',
  // Google Fonts (cached on first load)
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Geist+Mono:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap',
];

// ── INSTALL ───────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_CORE)
      .then(cache => {
        // Add one by one so one failure doesn't block the whole shell
        return Promise.allSettled(
          SHELL.map(url => cache.add(url).catch(() => console.warn('SW: failed to cache', url)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_CORE && k !== CACHE_DATA)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API calls (gapi, Drive)
  if (event.request.method !== 'GET') return;
  if (url.hostname === 'apis.google.com')         return;
  if (url.hostname === 'www.googleapis.com')       return;
  if (url.hostname === 'accounts.google.com')      return;

  // Google Fonts — cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request, CACHE_DATA));
    return;
  }

  // App shell — cache-first (stale-while-revalidate for HTML)
  if (SHELL.includes(url.pathname) || SHELL.includes(url.href)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Everything else — network-first, fall back to cache
  event.respondWith(networkFirst(event.request));
});

// ── STRATEGIES ────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE_CORE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await fetchPromise) || offlineFallback(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_DATA);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || offlineFallback(request);
  }
}

function offlineFallback(request) {
  if (request.destination === 'document') {
    return caches.match('/life-plan/404.html');
  }
  return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}

// ── PUSH NOTIFICATIONS ────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json().catch(() => ({ title:'Sprint OS', body: event.data.text() }));
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sprint OS', {
      body:  data.body  || '',
      icon:  '/life-plan/icon-192.png',
      badge: '/life-plan/icon-192.png',
      tag:   data.tag   || 'sprint-notif',
      data:  data.url   || '/life-plan/',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data || '/life-plan/';
  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── BACKGROUND SYNC (savings log backup) ─────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-savings') {
    event.waitUntil(syncSavings());
  }
});

async function syncSavings() {
  // Placeholder — actual sync done via Drive API in update.js
  // This fires when connectivity is restored after an offline save
  const clients2 = await self.clients.matchAll();
  clients2.forEach(c => c.postMessage({ type: 'sync-ready' }));
}

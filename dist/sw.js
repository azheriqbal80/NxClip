const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `nxclip-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `nxclip-dynamic-${CACHE_VERSION}`;

// Shell resources to pre-cache on service worker installation
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install Event: Cache critical shell assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event triggered');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching core application shell');
        // We catch errors individually so that failure of a single non-essential asset
        // doesn't block the entire Service Worker registration.
        return Promise.allSettled(
          CORE_ASSETS.map((url) => {
            return cache.add(url).catch((err) => {
              console.warn(`[Service Worker] Failed to pre-cache ${url}:`, err);
            });
          })
        );
      })
  );
});

// Activate Event: Cleanup old cache groups
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event triggered');
  const validCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheKeys) => {
      return Promise.all(
        cacheKeys.map((key) => {
          if (!validCaches.includes(key)) {
            console.log(`[Service Worker] Deleting obsolete cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Take immediate control of all active clients
      return self.clients.claim();
    })
  );
});

// Message Event: Listen for update skip waiting instructions
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting requested. Activating immediately.');
    self.skipWaiting();
  }
});

// Fetch Event: Robust caching strategy (App Shell / Stale-While-Revalidate / Offline Safeguard)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Bypass rules for non-GET requests, local development sockets, APIs and third-party integrations
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('firestore') ||
    url.pathname.includes('identitytoolkit') ||
    url.pathname.includes('google') ||
    url.pathname.includes('googleapis') ||
    request.url.includes('chrome-extension')
  ) {
    return;
  }

  // 2. Navigation fallback - App Shell architecture
  // If user requests a page, serve '/index.html' from static cache if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        console.log('[Service Worker] Navigation failed or offline. Displaying App Shell index.html.');
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate for static assets, local resources, and media files
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // If response is valid, update dynamic cache safely
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.warn('[Service Worker] Background fetch failed (likely offline):', error);
          // Return the cached response if offline fetch failed
        });

      // Serve the cached copy immediately for high speed while updating in the background,
      // or wait for the network response if nothing is cached yet.
      return cachedResponse || fetchPromise;
    })
  );
});

// Sync Event: Trigger draft synchronization once network connection is recovered
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-drafts') {
    console.log('[Service Worker] Background Sync event triggered for tag: sync-drafts');
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientsList) => {
          console.log(`[Service Worker] dispatching TRIGGER_DRAFT_SYNC payload to ${clientsList.length} clients`);
          clientsList.forEach((client) => {
            client.postMessage({ type: 'TRIGGER_DRAFT_SYNC' });
          });
        })
    );
  }
});


const CACHE_NAME = 'darbo-zurnalas-v3';
const urlsToCache = [
  '/darbo-zurnalas/',
  '/darbo-zurnalas/index.html',
  '/darbo-zurnalas/icon.svg'
];

// Install event - cache important assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', (event) => {
  // Skip service worker for Google Apps Script API requests
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('script.googleusercontent.com')) {
    // Let the request go directly to the network without SW intervention
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        // Cache the fetched response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If not in cache, return offline page or error
            return new Response('Offline - no cached version available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

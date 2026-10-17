const CACHE_NAME = 'taniku-app-v2';
const STATIC_ASSETS = [
  './',
  './Index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// Install Service Worker & Pre-cache aset vital
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Gagal pre-cache beberapa aset, tetap melanjutkan:', err);
      });
    })
  );
  self.skipWaiting();
});

// Aktivasi & Pembersihan Cache Versi Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategi Fetch: Network-First dengan Fallback ke Cache untuk Ketahanan Offline
self.addEventListener('fetch', (event) => {
  // Hanya proses permintaan GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika respon valid, salin ke cache secara dinamis
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika koneksi internet terputus (offline), ambil dari cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback utama ke Index.html jika navigasi halaman utama
          if (event.request.mode === 'navigate') {
            return caches.match('./Index.html');
          }
        });
      })
  );
});

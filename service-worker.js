const CACHE_NAME = 'Chinesi-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/192.png',
  './icons/512.png'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Carica i file singolarmente in modo che un singolo errore non blocchi l'installazione della PWA
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Risorsa non trovata per la cache:', asset);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((res) => res || fetch(evt.request))
  );
});
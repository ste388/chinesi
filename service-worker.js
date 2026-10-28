const CACHE_NAME = 'Chinesi-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/192.png',
  './icons/512.png'
  // Se hai un file style.css o script.js separati, aggiungili qui:
  // './style.css',
  // './script.js'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((res) => res || fetch(evt.request))
  );
});

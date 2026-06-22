self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('rpg-xp-voting-v1').then((cache) => cache.addAll(['/'])));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

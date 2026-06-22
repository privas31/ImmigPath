// ImmigPath Service Worker v1.0
const CACHE_NAME = 'immigpath-v1';
const CACHE_URLS = [
  '/',
  '/app.html',
  '/portal-cliente.html',
  '/index.html',
  '/manifest.json',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-512x512.png',
];

// Instalar — cachear recursos principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(() => {
        // Ignorar errores de cache individual
      });
    })
  );
  self.skipWaiting();
});

// Activar — limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first, cache fallback
self.addEventListener('fetch', event => {
  // Solo interceptar GETs del mismo origen
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia fresca en cache
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red — servir desde cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback para navegación
          if (event.request.mode === 'navigate') {
            return caches.match('/app.html');
          }
        });
      })
  );
});

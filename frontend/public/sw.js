/* GabConcours — service worker PWA (vanilla, sans dépendance).
 * Stratégie :
 * - navigations : réseau d'abord, repli sur /index.html en cache (hors-ligne partiel) ;
 * - assets même origine (JS/CSS/images) : cache d'abord, réactualisation en arrière-plan ;
 * - /api/* et requêtes non-GET : toujours réseau (jamais de données métier en cache).
 * À chaque modification de cette stratégie, incrémenter CACHE pour forcer la mise à jour.
 */
const CACHE = 'gabconcours-v2';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(OFFLINE_URL, copy));
          return response;
        })
        // Jamais de valeur indéfinie : en dernier recours, réponse d'erreur
        // réseau plutôt qu'exception non interceptée.
        .catch(() => caches.match(OFFLINE_URL).then((cached) => cached || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Notifications push : affiche l'alerte même application fermée.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'GabConcours';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/', nupcan: data.nupcan || '' },
    tag: data.nupcan ? `gabconcours-${data.nupcan}` : 'gabconcours',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notification : ouvre (ou réutilise) l'onglet vers l'URL liée.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  const url = new URL(target, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => w.url === url);
      if (existing) return existing.focus();
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin) return w.navigate(url).then((w2) => w2.focus());
      }
      return self.clients.openWindow(url);
    })
  );
});

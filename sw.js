// Service worker de la botiga: fa que s'obri ràpid des de la pantalla d'inici
// i que es pugui consultar sense connexió (amb l'últim catàleg descarregat).
// El panell d'administració i l'API privada no es desen mai a la memòria cau.
const CACHE = 'fundicat-v22';
const SHELL = [
  '/', '/css/styles.css', '/js/i18n.js', '/js/config.js', '/js/boot.js', '/js/shipping.js', '/js/legal.js', '/js/account.js', '/js/store.js', '/js/app.js',
  '/manifest.webmanifest', '/marca/favicon.svg', '/marca/icon-192.png', '/marca/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const isPrivate = (url) => url.pathname.startsWith('/api/admin') || url.pathname === '/admin.html' || url.pathname === '/admin.webmanifest' || url.pathname.startsWith('/js/admin') || url.pathname.startsWith('/css/admin');

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || isPrivate(url)) return;

  // Pàgines i catàleg: primer la xarxa (dades fresques), si no hi ha connexió, la còpia.
  if (req.mode === 'navigate' || url.pathname === '/api/catalog.js') {
    e.respondWith(
      fetch(req)
        .then((res) => { if (res.ok && (req.mode !== 'navigate' || url.pathname === '/')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req.mode === 'navigate' ? '/' : req, copy)); } return res; })
        .catch(() => caches.match(req.mode === 'navigate' ? '/' : req, { ignoreSearch: true })),
    );
    return;
  }
  if (url.pathname.startsWith('/api/')) return;

  // Fitxers estàtics i imatges: la còpia a l'instant i s'actualitza de fons.
  e.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || fresh;
    }),
  );
});

// ---------- Avisos al mòbil (panell d'administració) ----------
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Fundicat', {
    body: d.body || 'Hi ha novetats a la botiga.',
    icon: '/marca/admin-192.png',
    badge: '/marca/icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || '/admin.html#/comandes' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || '/admin.html#/comandes', self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = wins.find((w) => new URL(w.url).pathname === '/admin.html');
    if (open) { open.postMessage({ type: 'obre', url: target }); return open.focus(); } // el panell ja obert canvia de pantalla i refresca
    return self.clients.openWindow(target);
  })());
});

// Generic offline cache. Encrypted blobs (d/<hex>.bin) are content-addressed, so cache-first is safe.
const C = 'r2';
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))));
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (/\/v\.json$/.test(u.pathname)) { e.respondWith(fetch(r, { cache: 'no-store' })); return; }
  if (/\/d\/[0-9a-f]{24}\.bin$/.test(u.pathname)) {
    e.respondWith(caches.open(C).then(async c => { const hit = await c.match(r); if (hit) return hit; const n = await fetch(r); if (n.ok) c.put(r, n.clone()); return n; }));
  } else if (r.mode === 'navigate') {
    e.respondWith(fetch(r.url, { cache: 'no-store', credentials: 'same-origin' }).then(n => { if (n.ok) { const cl = n.clone(); caches.open(C).then(c => c.put('./', cl)); } return n; }).catch(() => caches.open(C).then(c => c.match('./')).then(x => x || Response.error())));
  }
});

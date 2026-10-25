// sw.js — lets the installed app open offline, without ever mixing two versions.
// The page and the app shell (index.html, app.js, React, manifest, icon) are
// network first: online, every visit gets one consistent deploy, and the cache is
// only the offline fallback. index.html loads app.js?v=<content hash>; `npm run
// compile` stamps the same hash below, so a new app.js also brings a new service
// worker with its own cache. Fonts are cache first (their URLs never change);
// videos are left to the browser (range requests).
const BUILD = '8075b9fe68'; // stamped by scripts/compile.mjs
const REACT = '18.3.1'; // stamped by scripts/compile.mjs
const CACHE = 'vedome-utraceni-v3-' + BUILD;
const CORE = [
  './', './index.html', './app.js?v=' + BUILD,
  './vendor/react.production.min.js?v=' + REACT, './vendor/react-dom.production.min.js?v=' + REACT,
  './manifest.webmanifest', './icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// network first; the cached copy only when offline (a page falls back to index.html)
function networkFirst(req, key) {
  return fetch(req)
    .then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key || req, copy)); }
      return res;
    })
    .catch(() => caches.match(key || req));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/\.(mp4|webm)$/i.test(url.pathname) || req.headers.has('range')) return;

  if (req.mode === 'navigate') { event.respondWith(networkFirst(req, './index.html')); return; }
  if (url.origin === self.location.origin) { event.respondWith(networkFirst(req)); return; }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }))));
  }
});

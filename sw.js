// sw.js — lets the installed app open offline, without ever mixing two versions.
// The page and the app shell (index.html, app.js, React, manifest, small icon) are
// network first: online, every visit gets one consistent deploy, and the cache is
// only the offline fallback. index.html loads app.js?v=<content hash>; `npm run
// compile` stamps the same hash below, so a new app.js also brings a new service
// worker with its own cache. Fonts are stored with the app and cache first (their
// files never change); videos are left to the browser (range requests).
const BUILD = '1e58e89559'; // stamped by scripts/compile.mjs
const REACT = '18.3.1'; // stamped by scripts/compile.mjs
const CACHE = 'vedome-utraceni-v3-' + BUILD;
const CORE = [
  './', './index.html', './app.js?v=' + BUILD,
  './vendor/react.production.min.js?v=' + REACT, './vendor/react-dom.production.min.js?v=' + REACT,
  './manifest.webmanifest', './icon-192.png', './register-sw.js',
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
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/fonts/')) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }))));
    return;
  }
  event.respondWith(networkFirst(req));
});

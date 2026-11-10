// Registers the service worker (sw.js) for offline use. A separate file, so the
// Content-Security-Policy can forbid inline scripts.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}

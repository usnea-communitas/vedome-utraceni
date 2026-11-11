// Registers the service worker (sw.js) for offline use. A separate file, so the
// Content-Security-Policy can forbid inline scripts. Installing the worker downloads
// the app shell once more, so it waits until a few seconds after the page has
// loaded and does not compete with the first visit.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', function () {
    setTimeout(function () { navigator.serviceWorker.register('sw.js').catch(function () {}); }, 3000);
  });
}

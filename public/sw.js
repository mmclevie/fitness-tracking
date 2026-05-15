// Minimal service worker — installs and claims so iOS treats the app as installable.
// No data caching: training logs must always be fresh.

const CACHE_NAME = "hmtd-v1";
const APP_SHELL = ["/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only cache GETs of static assets matching APP_SHELL
  if (event.request.method === "GET" && APP_SHELL.some((p) => url.pathname === p)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached ?? fetch(event.request))
    );
  }
  // Everything else: pass through to network (no-op handler)
});

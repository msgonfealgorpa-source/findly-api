const CACHE_NAME = "findly-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("Service Worker Installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

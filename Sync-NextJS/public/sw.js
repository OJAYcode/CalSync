// CalSync Service Worker — PWA + Web Push Notifications

const CACHE_NAME = "calsync-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/calendar",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg",
];

// ─── Install: pre-cache static shell ────────────────────────────────────────
self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS).catch(function () {
        // Non-fatal if some assets aren't available yet
      });
    }),
  );
});

// ─── Activate: clean up old caches ──────────────────────────────────────────
self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      }),
    ]),
  );
});

// ─── Fetch: network-first for API calls, cache-first for assets ─────────────
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API calls
  if (event.request.method !== "GET") return;
  if (
    url.hostname !== self.location.hostname &&
    url.pathname.startsWith("/api")
  )
    return;

  // For API/backend calls: network only (no caching)
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/")
  ) {
    // Let the browser handle it normally — just add offline fallback for navigation
    if (event.request.mode === "navigate") {
      event.respondWith(
        fetch(event.request).catch(function () {
          return (
            caches.match("/") ||
            new Response("Offline - please reconnect", { status: 503 })
          );
        }),
      );
    }
    return;
  }

  // Cache-first for static assets, network-first with cache fallback for pages
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/favicon.ico"
  ) {
    // Cache-first
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        return (
          cached ||
          fetch(event.request).then(function (response) {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
        );
      }),
    );
    return;
  }

  // Network-first for HTML pages, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response.ok && event.request.mode === "navigate") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function () {
        return (
          caches.match(event.request) ||
          caches.match("/") ||
          new Response("Offline", { status: 503 })
        );
      }),
  );
});

// ─── Push Notifications ──────────────────────────────────────────────────────
self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "CalSync",
      body: event.data.text(),
    };
  }

  const title = data.title || "CalSync Notification";
  const options = {
    body: data.body || data.message || "",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: data.tag || "calsync-notification",
    data: {
      url: data.url || data.click_url || "/",
    },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Focus existing tab if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new tab
        return clients.openWindow(url);
      }),
  );
});

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

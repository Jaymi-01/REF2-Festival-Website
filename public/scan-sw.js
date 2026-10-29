/* =============================================================================
 * Gate scanner service worker.
 *
 * Its only job is to make the app itself open with no signal. The guest list
 * and the scan queue already live in IndexedDB; without this, a steward who
 * force-quits the app in a dead spot can't get back into it.
 *
 * Scoped to /scan — it never touches the public site.
 * ========================================================================== */

const VERSION = "ref2-gate-v1";
const SHELL = "shell-" + VERSION;

// Never cache these: they are the live truth.
const NEVER_CACHE = ["/api/scan/", "/api/register", "/api/ticket/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        cache.addAll([
          "/scan",
          "/scanner.webmanifest",
          "/app-icons/icon-192.png",
          "/app-icons/icon-512.png",
          "/app-icons/apple-touch-icon.png",
        ]),
      )
      // A missing file must not block the install, or the app never caches.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((p) => url.pathname.startsWith(p))) return;

  // Navigations: try the network first so an updated build lands, fall back to
  // the cached shell when there is no signal.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("/scan", copy));
          return res;
        })
        .catch(() => caches.match("/scan").then((r) => r ?? Response.error())),
    );
    return;
  }

  // Build assets are content-hashed, so cache-first is safe and instant.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});

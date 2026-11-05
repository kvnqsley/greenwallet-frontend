const CACHE_NAME = "greenwallet-shell-v6";
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/fonts/manrope-variable-latin.woff2",
  "/assets/imgrectangle1465.png",
  "/assets/imgframe1618870115.svg",
  "/assets/imgarrowrightalt.svg",
  "/assets/imgdatabase.svg",
  "/assets/imgcardsstack.svg",
  "/assets/imgreceipt.svg",
  "/assets/imgframe.svg",
  "/assets/imgframe1.svg",
  "/assets/imgframe2.svg",
  "/assets/imgframe3.svg",
  "/assets/imgframe4.svg",
  "/assets/imgcable.svg",
  "/assets/imgverified.svg",
  "/assets/imgframe5.svg",
  "/assets/imgframe6.svg",
  "/assets/auth-logo-signup.svg",
  "/assets/auth-logo-signin.svg",
  "/assets/auth-logo-verification.svg",
  "/assets/icon-confirmation-number.svg",
  "/assets/icon-person.svg",
  "/assets/icon-dropdown.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);

      const index = await cache.match("/index.html");
      if (!index) throw new Error("GreenWallet app shell is missing index.html.");

      const html = await index.text();
      const bundles = [
        ...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))(?:\?[^"]*)?"/g),
      ].map((match) => match[1]);
      if (bundles.length === 0) {
        throw new Error("GreenWallet app bundles were missing from its cached HTML.");
      }

      await cache.addAll(bundles);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("greenwallet-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch((error) =>
                console.error("GreenWallet could not update its offline page cache.", error),
              );
          }
          return response;
        })
        .catch(async () => {
          const cachedPage =
            (await caches.match(request)) ||
            (await caches.match("/")) ||
            (await caches.match("/index.html")) ||
            (await caches.match("/offline.html"));
          if (!cachedPage) {
            throw new Error("The GreenWallet offline app shell is unavailable.");
          }
          return cachedPage;
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch((error) =>
              console.error("GreenWallet could not cache a local app asset.", error),
            );
        }
        return response;
      });
    })
  );
});

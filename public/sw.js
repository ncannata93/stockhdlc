// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE = "pwabuilder-offline-page"

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = "offline.html"

self.addEventListener("install", (event) => {
  console.log("[PWA Builder] Install Event processing")

  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      console.log("[PWA Builder] Cached offline page during install")

      return cache.add(offlineFallbackPage)
    }),
  )
})

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        console.log("[PWA Builder] add page to offline cache: " + response.url)

        // If request was success, add or update it in the cache
        event.waitUntil(updateCache(event.request, response.clone()))

        return response
      })
      .catch((error) => {
        console.log("[PWA Builder] Network request Failed. Serving content from cache: " + error)
        return fromCache(event.request)
      }),
  )
})

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return the offline page
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((matching) => {
      if (!matching || matching.status === 404) {
        // The following validates that the request was for a navigation to a new document
        if (request.destination !== "document" || request.mode !== "navigate") {
          return Promise.reject("no-match")
        }

        return cache.match(offlineFallbackPage)
      }

      return matching
    }),
  )
}

function updateCache(request, response) {
  return caches.open(CACHE).then((cache) => cache.put(request, response))
}

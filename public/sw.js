const CACHE = 'mywell-v3'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => clients.forEach(client => client.navigate(client.url)))
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Hashed assets are immutable — cache-first
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(r => {
          caches.open(CACHE).then(c => c.put(request, r.clone()))
          return r
        })
      })
    )
    return
  }

  // HTML and everything else — network-first, cache as fallback
  e.respondWith(
    fetch(request)
      .then(r => {
        if (request.mode === 'navigate') {
          caches.open(CACHE).then(c => c.put(request, r.clone()))
        }
        return r
      })
      .catch(() => caches.match(request))
  )
})

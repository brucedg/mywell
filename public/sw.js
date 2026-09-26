const CACHE = 'mywell-v4'

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
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

  // HTML — network-first, guaranteed cache fallback (shell pre-cached on install)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(r => {
          caches.open(CACHE).then(c => c.put(request, r.clone()))
          return r
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Everything else — network-first, cache fallback, no blank on failure
  e.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

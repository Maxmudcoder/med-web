/* Minimal PWA: brauzer oflayn-cache qilmaydi, keyin kengaytirish mumkin */
self.addEventListener('install', (e) => {
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

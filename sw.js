const CACHE_NAME = 'lorven-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/state.js',
  './js/data.js',
  './js/i18n.js',
  './js/helpers.js',
  './js/ui.js',
  './js/products.js',
  './js/invoices.js',
  './js/history.js',
  './js/reports.js',
  './js/settings.js',
  './js/importExport.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// تثبيت الـ service worker وتخزين الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// استراتيجية: نحاول من الشبكة، وإذا فشلنا نستخدم الكاش
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
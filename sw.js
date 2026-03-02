const CACHE_NAME = 'lorven-cache-v2'; // تحديث الإصدار لتنشيط التغييرات
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

// 1. مرحلة التثبيت: حفظ الملفات في الكاش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching essential assets...');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // تفعيل النسخة الجديدة فوراً
});

// 2. مرحلة التنشيط: حذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim(); // السيطرة على الصفحات المفتوحة فوراً
});

// 3. استراتيجية جلب البيانات: الشبكة أولاً، ثم الكاش في حال انقطاع الإنترنت
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

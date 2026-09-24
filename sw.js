// تم تغيير الإصدار إلى v5 لإجبار المتصفح على حذف الكاش القديم وتحديث الموقع فوراً
const CACHE_NAME = 'bread-card-v5';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // التفعيل المباشر بدون انتظار إغلاق المتصفح
});

// تفعيل الـ Service Worker وتنظيف الكاش القديم (مثل v4 وما قبله)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('حذف الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // تطبيق التغييرات فوراً على جميع الصفحات المفتوحة
});

// التعامل مع الطلبات (جلبه من الكاش أو من الإنترنت)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
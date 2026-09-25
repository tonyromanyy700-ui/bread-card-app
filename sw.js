// ==========================================
// بطاقة الأسرة والتموين - Service Worker v6
// تطوير: Eng. Tony
// ==========================================

const CACHE_NAME = 'bread-card-v6';

// الملفات الأساسية للتخزين المؤقت (Offline Shell)
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1️⃣ تثبيت الـ Service Worker وتخزين الأصول الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] جاري تخزين ملفات التطبيق أوفلاين...');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // التفعيل المباشر بدون انتظار إغلاق المتصفح
});

// 2️⃣ تفعيل الـ Service Worker وتنظيف الكاش القديم (v5 وما قبله)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] حذف الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // تطبيق التغييرات فوراً على جميع الصفحات المفتوحة
});

// 3️⃣ التعامل مع الطلبات (Fetch Event) باستراتيجية الاستجابة السريعة
self.addEventListener('fetch', (event) => {
  // تجنب كاش طلبات غير GET أو الطلبات الخاصة بإضافات المتصفح أو شبكات Firebase
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // محاولة الجلب من الشبكة مع تحديث الكاش تلقائياً (Stale-While-Revalidate)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      // إرجاع النسخة المخزنة فوراً إن وجدت، أو الانتظار للجلب من الشبكة، وإذا فشلا يُرجع index.html
      return cachedResponse || fetchPromise.catch(() => {
        console.log('[SW] تعذر الاتصال بالشبكة، يتم التحميل من الكاش المحفوظ أوفلاين.');
        return caches.match('./index.html');
      });
    })
  );
});

// 4️⃣ استقبال التنبيهات والإشعارات (Push Notifications)
self.addEventListener('push', (event) => {
  let data = { title: 'تذكير بطاقة التموين 🍞', body: 'حان موعد صرف حصتك اليوم!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5️⃣ التعامل مع النقر على الإشعار (Notification Click)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // إذا كان التطبيق مفتوحاً بالفعل، قم بالتركيز عليه
      for (let client of windowClients) {
        if (client.url.includes('index.html') || client.url === self.registration.scope) {
          return client.focus();
        }
      }
      // إذا لم يكن مفتوحاً، فتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

// 6️⃣ استقبال الرسائل المباشرة والتنبيهات المتكررة من التطبيق (Client Messaging)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  // معالجة طلب إرسال الإشعار المتكرر المباشر من التطبيق
  if (event.data.action === 'SHOW_RECURRING_NOTIFICATION') {
    const title = event.data.title || '🍞 تذكير مستمر بصرف الخبز';
    const body = event.data.body || 'تذكير: بطاقتك جاهزة للصرف اليوم!';

    self.registration.showNotification(title, {
      body: body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: './' }
    });
  }
});

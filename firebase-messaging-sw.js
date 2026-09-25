importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// تهيئة إعدادات Firebase Cloud Messaging
const firebaseConfig = {
  apiKey: "AIzaSyBzCbEv09jVBLyKs2W5PSUHJZ9b5f5wox0",
  authDomain: "bread-app-fa911.firebaseapp.com",
  projectId: "bread-app-fa911",
  storageBucket: "bread-app-fa911.firebasestorage.app",
  messagingSenderId: "881646311297",
  appId: "1:881646311297:web:8de38d7dd1d2533a23fa80",
  measurementId: "G-D3WF378JCB"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

const CACHE_NAME = 'bread-app-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. تثبيت الـ Service Worker وتخزين ملفات التطبيق للعمل أوفلاين
self.addEventListener('install', (event) => {
  console.log('[Service Worker] تم تثبيت ملف الخدمة بنجاح.');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] جاري تخزين عناصر التطبيق مؤقتاً...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. تفعيل ملف الخدمة وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] تم تفعيل ملف الخدمة.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] مسح الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. معالجة الطلبات وتشغيل التطبيق بدون إنترنت (Offline Mode)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('gstatic.com') || event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// 4. استقبال وإظهار الإشعارات عندما يكون التطبيق مغلقاً أو في الخلفية
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] تم استقبال إشعار في الخلفية:', payload);

  const title = payload.notification?.title || "تطبيق الخبز والتموين 🍞";
  const options = {
    body: payload.notification?.body || "تذكير بموعد صرف حصتك اليومية.",
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'bread-reminder-notification',
    renotify: true,
    data: {
      url: payload.data?.url || './index.html'
    }
  };

  self.registration.showNotification(title, options);
});

// 5. الاستجابة عند ضغط المستخدم على الإشعار لفتح التطبيق
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] تم الضغط على الإشعار.');
  event.notification.close();

  const targetUrl = event.notification.data?.url || './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

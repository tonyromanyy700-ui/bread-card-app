// استيراد مكتبات فايربيس للخدمة الخلفية (متطابقة مع إصدار التطبيق 9.6.1)
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBzCbEv09jVBLyKs2W5PSUHJZ9b5f5wox0",
  authDomain: "bread-app-fa911.firebaseapp.com",
  projectId: "bread-app-fa911",
  storageBucket: "bread-app-fa911.firebasestorage.app",
  messagingSenderId: "881646311297",
  appId: "1:881646311297:web:8de38d7dd1d2533a23fa80",
  measurementId: "G-D3WF378JCB"
});

const messaging = firebase.messaging();

// التعامل مع الإشعارات عندما يكون التطبيق في الخلفية أو مغلقاً تماماً
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || "تنبيه تموين العيش 🍞";
  const notificationOptions = {
    body: payload.notification?.body || "لديك تحديث جديد بخصوص حصة البطاقة.",
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'alarm-notification',
    renotify: true,
    requireInteraction: true, // يظل الإشعار ثابتاً على الشاشة حتى يضغط عليه المستخدم
    vibrate: [500, 200, 500, 200, 500, 200, 500], // اهتزاز قوي يشبه المنبه
    data: {
      url: './'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// الحدث عند الضغط على الإشعار لفتح التطبيق
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

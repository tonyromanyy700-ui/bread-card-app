// استيراد مكتبات فايربيس للخدمة الخلفية
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  projectId: "bread-app-fa911",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// التعامل مع الإشعارات عندما يكون التطبيق في الخلفية أو مغلقاً
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', // أيقونة التطبيق
    tag: 'alarm-notification', // تاج يمنع تكرار الإشعارات ويجعلها ثابتة
    renotify: true,
    requireInteraction: true, // يخلي الإشعار ثابت على الشاشة وما يختفيش لوحده لحد ما المستخدم يضغط عليه
    vibrate: [500, 200, 500, 200, 500, 200, 500], // اهتزاز متكرر وقوي زي المنبه
    data: {
      url: '/' // الصفحة اللي هفتحها لما يضغط على الإشعار
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// الحدث عند الضغط على الإشعار لتشغيل الصوت الفعلي داخل التطبيق
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // لو التطبيق مفتوح، ركز عليه، لو مغلق افتحه
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients.get(i);
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

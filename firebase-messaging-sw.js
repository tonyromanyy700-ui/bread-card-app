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

// استقبال وإظهار الإشعارات عندما يكون التطبيق مغلقاً أو في الخلفية
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] تم استقبال إشعار في الخلفية:', payload);

  const title = payload.notification?.title || "تطبيق الخبز والتموين 🍞";
  const options = {
    body: payload.notification?.body || "تذكير بموعد صرف حصتك اليومية.",
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(title, options);
});
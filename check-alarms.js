const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

// دالة لتحويل صيغة الوقت (HH:mm) إلى دقائق إجمالية لمقارنة دقيقة
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

async function checkAndSendAlarms() {
  try {
    const options = {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const currentTime = formatter.format(new Date());
    
    console.log(`Current Cairo Time: ${currentTime}`);

    const snapshot = await db.collection('alarms').where('isSent', '==', false).get();

    if (snapshot.empty) {
      console.log('No pending alarms found.');
      return;
    }

    let sentCount = 0;
    const currentMinutes = timeToMinutes(currentTime);

    for (const doc of snapshot.docs) {
      const alarmData = doc.data();
      console.log(`Checking alarm: ID=${doc.id}, alarmTime=${alarmData.alarmTime}`);

      const alarmMinutes = timeToMinutes(alarmData.alarmTime);

    if (alarmMinutes <= currentMinutes) {
        // البحث عن الtoken بأكثر من اسم محتمل لضمان عدم حدوث خطأ undefined
        const fcmToken = alarmData.token || alarmData.fcmToken || alarmData.deviceToken;

        if (!fcmToken) {
          console.error(`Error: Token is missing for alarm ${doc.id}`);
          continue;
        }

        console.log(`Alarm matched! Sending notification for token: ${fcmToken}`);

        const message = {
          token: fcmToken,
          notification: {
            title: 'تنبيه حصة العيش والتموين',
            body: 'ميعاد استحقاق التنبيه الخاص بك قد حان الآن!'
          }
        };

        try {
          await admin.messaging().send(message);
          await db.collection('alarms').doc(doc.id).update({ isSent: true });
          sentCount++;
          console.log(`Notification sent successfully for alarm ${doc.id}`);
        } catch (messagingError) {
          console.error(`Error sending message for ${doc.id}:`, messagingError);
        }
      }

checkAndSendAlarms();

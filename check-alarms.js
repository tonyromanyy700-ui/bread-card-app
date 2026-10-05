const admin = require('firebase-admin');

// تهيئة فايربيز باستخدام متغير البيئة المحفوظ في جيت هاب
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

async function checkAndSendAlarms() {
  try {
    // الحصول على الوقت الحالي بتوقيت مصر (Africa/Cairo) بصيغة HH:mm
    const options = {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const currentTime = formatter.format(new Date());
    
    console.log(`Current Cairo Time: ${currentTime}`);

    // جلب التنبيهات غير المرسلة من قاعدة البيانات
    const snapshot = await db.collection('alarms').where('isSent', '==', false).get();

    if (snapshot.empty) {
      console.log('No pending alarms found.');
      return;
    }

    let sentCount = 0;

    for (const doc of snapshot.docs) {
      const alarmData = doc.data();
      console.log(`Checking alarm: ID=${doc.id}, alarmTime=${alarmData.alarmTime}`);

      // مقارنة وقت التنبيه المخزن مع الوقت الحالي في مصر
      if (alarmData.alarmTime === currentTime) {
        console.log(`Alarm matched! Sending notification for token: ${alarmData.token}`);

        // إرسال الإشعار عبر Firebase Cloud Messaging (FCM)
        const message = {
          token: alarmData.token,
          notification: {
            title: 'تنبيه حصة العيش والتموين',
            body: 'ميعاد استحقاق التنبيه الخاص بك قد حان الآن!'
          }
        };

        try {
          await admin.messaging().send(message);
          // تحديث الحقل لتصبح isSent تساوي true حتى لا يتكرر الإشعار
          await db.collection('alarms').doc(doc.id).update({ isSent: true });
          sentCount++;
          console.log(`Notification sent successfully for alarm ${doc.id}`);
        } catch (messagingError) {
          console.error(`Error sending message for ${doc.id}:`, messagingError);
        }
      }
    }

    console.log(`Check completed. Notifications sent: ${sentCount}`);
  } catch (error) {
    console.error('Error checking alarms:', error);
  }
}

checkAndSendAlarms();

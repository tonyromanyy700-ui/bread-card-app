const admin = require("firebase-admin");

// التهيئة باستخدام مفتاح الأمان السري
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});

async function runCheck() {
  try {
    const db = admin.firestore();
    const alarmsSnapshot = await db.collection("alarms").get();
    
    // جلب الوقت والتاريخ بتوقيت مصر
    const now = new Date();
    const timeOptions = { timeZone: "Africa/Cairo", hour12: false, hour: '2-digit', minute: '2-digit' };
    const dateOptions = { timeZone: "Africa/Cairo", year: 'numeric', month: '2-digit', day: '2-digit' };
    
    const currentTimeStr = now.toLocaleTimeString("en-GB", timeOptions); // مثال: "09:30"
    const currentDateStr = now.toLocaleDateString("en-CA", dateOptions); // مثال: "2026-10-05"

    let sentCount = 0;

    for (const doc of alarmsSnapshot.docs) {
      const data = doc.data();
      
      // التحقق من الشروط
      if (
        data.token &&
        data.isClaimed !== true &&
        data.nextDate === currentDateStr &&
        data.startTime && data.endTime &&
        currentTimeStr >= data.startTime &&
        currentTimeStr <= data.endTime
      ) {
        const payload = {
          notification: {
            title: "تنبيه صرف العيش 🥖",
            body: "ميعاد صرف العيش شغال دلوقتي! متنساش تسجل."
          },
          token: data.token
        };

        await admin.messaging().send(payload);
        sentCount++;
      }
    }

    console.log(`Check completed. Notifications sent: ${sentCount}`);
  } catch (error) {
    console.error("Error in check script:", error);
    process.exit(1);
  }
}

runCheck();
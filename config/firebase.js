const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "firebase-service-account.json"); 

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin Initialized");
} catch (err) {
  console.error("❌ Firebase Admin initialization failed:", err);
}

module.exports = admin.firestore();

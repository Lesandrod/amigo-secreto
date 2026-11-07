import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBpeTMnUDxxCH6ErXRZkvX-gw1jJQ3Ib2g",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "amigosecreto-a58d2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "amigosecreto-a58d2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "amigosecreto-a58d2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "234658934976",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:234658934976:web:de449a5dd5a2797786bd25",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-QTPEHVVQ29"
};

export const isFirebaseConfigured = true;

let app = null;
let db = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.error("Firebase init error:", err);
}

export { app, db, firebaseConfig };

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration with environment variable fallbacks
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDHwPBFMBa5PTxTFh6tsi_KFGTJeF7kxP0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "japanihaul.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "japanihaul",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "japanihaul.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "720827278239",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:720827278239:web:4850b2aaf67bef06eb93aa",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-93CJYC9L17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

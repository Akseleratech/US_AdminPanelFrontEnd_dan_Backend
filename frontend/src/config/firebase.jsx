// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-unionspace-crm.appspot.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-unionspace-crm",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-unionspace-crm.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo",
  // measurementId is optional - only include if available
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID && {
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  })
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development - use simple flag to prevent multiple connections
let emulatorsConnected = false;

if ((import.meta.env.DEV || window.location.hostname === 'localhost') && !emulatorsConnected) {
  try {
    console.log('🔧 Connecting to Firebase emulators...');
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8888);
    connectStorageEmulator(storage, '127.0.0.1', 9999);
    emulatorsConnected = true;
    console.log('✅ Connected to Firebase emulators');
    console.log('   - Auth: http://127.0.0.1:9099');
    console.log('   - Firestore: 127.0.0.1:8888');
    console.log('   - Storage: 127.0.0.1:9999');
  } catch (error) {
    console.warn('⚠️ Emulators already connected or failed to connect:', error.message);
  }
}

// Analytics is optional - only initialize if measurementId is provided
export const analytics = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? getAnalytics(app) : null;

export default app; 
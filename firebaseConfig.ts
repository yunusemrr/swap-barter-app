import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validate Firebase config
const isValidConfig = Object.values(firebaseConfig).every(val => val !== '');

let app;
let db;
let auth;

try {
  if (!isValidConfig) {
    throw new Error('Firebase credentials are missing. Check your .env file.');
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // Optional: Use emulators in development
  if (import.meta.env.DEV && !auth.emulatorConfig) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      // Emulator might already be initialized, that's ok
      console.log('Emulator already initialized or not available');
    }
  }
} catch (error) {
  console.error('Firebase Initialization Error:', error);
  // Fail gracefully - app won't work but won't crash
}

export { auth, db, app };
export default app;
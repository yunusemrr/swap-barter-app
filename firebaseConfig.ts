import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// Senin sağladığın Firebase konfigürasyonu
const firebaseConfig = {
  apiKey: "AIzaSyDtv4aPJuIDP8r6xlJRBvunF17WePyIU8A",
  authDomain: "swap-barter2.firebaseapp.com",
  projectId: "swap-barter2",
  storageBucket: "swap-barter2.firebasestorage.app",
  messagingSenderId: "473764891578",
  appId: "1:473764891578:web:97a2a726fe9d114d026b83",
  measurementId: "G-ZFB60GX49K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

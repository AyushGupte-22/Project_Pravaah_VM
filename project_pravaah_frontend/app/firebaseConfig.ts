// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsaS-d7lHosLfQ5PphNYyZv8eiyOVudCg",
  authDomain: "projectpravaah-f386e.firebaseapp.com",
  projectId: "projectpravaah-f386e",
  storageBucket: "projectpravaah-f386e.firebasestorage.app",
  messagingSenderId: "1061590686679",
  appId: "1:1061590686679:web:15cfa0657b0f9cb62e4992",
  measurementId: "G-5NWZ7FPN9S"
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);

/// 1. Initialize 'app'
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize 'auth' (safe for server)
const auth = getAuth(app);

// 3. Conditionally initialize 'analytics' (client-side only)
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// 4. Export all the services
export { auth, app, analytics };
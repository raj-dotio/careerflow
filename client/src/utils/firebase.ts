import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoPlaceholderNotConfigured',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'careerflow-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'careerflow-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'careerflow-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

// Initialize Firebase safely (avoid duplicate initialization)
const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request basic profile & email permissions
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;

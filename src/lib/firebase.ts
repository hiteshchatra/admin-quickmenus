import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcJgANsxjpwpWFaRxG3rQxfpdlq6kbVJM",
  authDomain: "qrmenu-7d16d.firebaseapp.com",
  projectId: "qrmenu-7d16d",
  storageBucket: "qrmenu-7d16d.firebasestorage.app",
  messagingSenderId: "976316644154",
  appId: "1:976316644154:web:d78bc2e5dd9052ebccee03",
  measurementId: "G-KFXRV0XYJH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseConfigured = false;

try {
  // Resolve config from environment variables or bundled firebase-applet-config.json
  const env = (import.meta as any).env || {};
  const apiKey = env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey;
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain;
  const projectId = env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId;
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket;
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId;
  const appId = env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId;
  const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';

  if (apiKey && projectId) {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    // Initialize firestore with custom databaseId if provisioned, or default
    if (databaseId && databaseId !== '(default)') {
      db = getFirestore(app, databaseId);
    } else {
      db = getFirestore(app);
    }

    try {
      storage = getStorage(app);
    } catch {
      storage = null;
    }

    isFirebaseConfigured = true;
    console.log('[TECHNOVA FIREBASE]: Cloud Firestore & Auth enclaves successfully mounted.');
  }
} catch (err) {
  console.warn('[TECHNOVA FIREBASE]: Operating in Offline / Demo Fallback mode.', err);
  isFirebaseConfigured = false;
}

export { app, auth, db, storage, isFirebaseConfigured };

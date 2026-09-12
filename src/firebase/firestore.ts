import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export const firestoreService = {
  getDb() {
    return db;
  },

  isAvailable(): boolean {
    return isFirebaseConfigured && db !== null;
  },

  async setDocument(collName: string, docId: string, data: any): Promise<void> {
    if (!this.isAvailable() || !db) return;
    try {
      const docRef = doc(db, collName, docId);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn(`[TECHNOVA FIRESTORE]: setDoc error on ${collName}/${docId}`, err);
    }
  },

  async getDocument(collName: string, docId: string): Promise<any | null> {
    if (!this.isAvailable() || !db) return null;
    try {
      const docRef = doc(db, collName, docId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return null;
    } catch (err) {
      console.warn(`[TECHNOVA FIRESTORE]: getDoc error on ${collName}/${docId}`, err);
      return null;
    }
  },

  async queryUserCollection(collName: string, userId: string): Promise<any[]> {
    if (!this.isAvailable() || !db) return [];
    try {
      const collRef = collection(db, collName);
      const q = query(collRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn(`[TECHNOVA FIRESTORE]: queryUserCollection error on ${collName}`, err);
      return [];
    }
  },

  listenUserCollection(
    collName: string,
    userId: string,
    callback: (items: any[]) => void
  ) {
    if (!this.isAvailable() || !db) return () => {};
    try {
      const collRef = collection(db, collName);
      const q = query(collRef, where('userId', '==', userId));
      return onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(items);
        },
        (error: FirestoreError) => {
          console.warn(`[TECHNOVA FIRESTORE]: listen error on ${collName}`, error);
        }
      );
    } catch (err) {
      console.warn(`[TECHNOVA FIRESTORE]: subscription error on ${collName}`, err);
      return () => {};
    }
  }
};

import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

export const storageService = {
  isAvailable(): boolean {
    return isFirebaseConfigured && storage !== null;
  },

  async uploadDocument(
    userId: string,
    documentId: string,
    content: string | Blob,
    fileName: string
  ): Promise<string> {
    if (!this.isAvailable() || !storage) {
      // In offline/demo fallback mode, return a simulated path
      return `simulated://documents/${userId}/${documentId}/${fileName}`;
    }

    try {
      const storageRef = ref(storage, `documents/${userId}/${documentId}/${fileName}`);
      if (typeof content === 'string') {
        await uploadString(storageRef, content);
      } else {
        await uploadBytes(storageRef, content);
      }
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.warn('[TECHNOVA STORAGE]: Upload fallback activated.', err);
      return `fallback://documents/${userId}/${documentId}/${fileName}`;
    }
  }
};

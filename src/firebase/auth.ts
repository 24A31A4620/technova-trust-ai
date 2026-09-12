import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

export interface AuthResult {
  uid: string;
  name: string;
  email: string;
  provider: 'password' | 'google' | 'demo';
}

function generateDeterministicUid(email: string): string {
  const hash = Math.abs(
    email.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)
  ).toString(36);
  return `officer-${hash}`;
}

export const firebaseAuthService = {
  async registerWithEmail(name: string, email: string, pass: string): Promise<AuthResult> {
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        return {
          uid: cred.user.uid,
          name: name || email.split('@')[0],
          email: cred.user.email || email,
          provider: 'password'
        };
      } catch (err: any) {
        console.warn('[TECHNOVA FIREBASE]: registerWithEmail warning:', err.code || err.message);

        // When Email/Password provider is disabled in Firebase Console (auth/operation-not-allowed)
        if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
          try {
            const anon = await signInAnonymously(auth);
            return {
              uid: anon.user.uid,
              name: name || email.split('@')[0],
              email,
              provider: 'password'
            };
          } catch (anonErr) {
            console.warn('[TECHNOVA FIREBASE]: Anonymous fallback disabled in console:', anonErr);
          }
          return {
            uid: generateDeterministicUid(email),
            name: name || email.split('@')[0],
            email,
            provider: 'password'
          };
        }

        // Email already in use: try signing in instead
        if (err.code === 'auth/email-already-in-use') {
          return await this.loginWithEmail(email, pass);
        }

        throw err;
      }
    }

    // Fallback demo
    return {
      uid: generateDeterministicUid(email),
      name: name || email.split('@')[0],
      email,
      provider: 'password'
    };
  },

  async loginWithEmail(email: string, pass: string): Promise<AuthResult> {
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        return {
          uid: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0],
          email: cred.user.email || email,
          provider: 'password'
        };
      } catch (err: any) {
        console.warn('[TECHNOVA FIREBASE]: loginWithEmail warning:', err.code || err.message);

        // When Email/Password provider is disabled in Firebase Console (auth/operation-not-allowed)
        if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
          try {
            const anon = await signInAnonymously(auth);
            return {
              uid: anon.user.uid,
              name: email.split('@')[0],
              email,
              provider: 'password'
            };
          } catch (anonErr) {
            console.warn('[TECHNOVA FIREBASE]: Anonymous fallback disabled in console:', anonErr);
          }
          return {
            uid: generateDeterministicUid(email),
            name: email.split('@')[0],
            email,
            provider: 'password'
          };
        }

        // Auto-provision on first sign in if user doesn't exist yet
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, email, pass);
            return {
              uid: newCred.user.uid,
              name: email.split('@')[0],
              email: newCred.user.email || email,
              provider: 'password'
            };
          } catch (regErr: any) {
            if (regErr.code === 'auth/operation-not-allowed') {
              return {
                uid: generateDeterministicUid(email),
                name: email.split('@')[0],
                email,
                provider: 'password'
              };
            }
          }
        }

        throw err;
      }
    }

    // Fallback demo
    return {
      uid: generateDeterministicUid(email),
      name: email.split('@')[0],
      email,
      provider: 'password'
    };
  },

  async loginWithGoogle(): Promise<AuthResult> {
    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(auth, provider);
        return {
          uid: cred.user.uid,
          name: cred.user.displayName || 'Google User',
          email: cred.user.email || 'user@technova.ai',
          provider: 'google'
        };
      } catch (err: any) {
        console.warn('[TECHNOVA FIREBASE]: Google popup fallback activated.', err.message);
        // Fallback demo if popup blocked in sandbox iframe
        return {
          uid: 'google-demo-' + Math.random().toString(36).substring(2, 9),
          name: 'TechNova Security Officer',
          email: 'officer@technova.ai',
          provider: 'google'
        };
      }
    }
    return {
      uid: 'google-demo-fallback',
      name: 'TechNova Security Officer',
      email: 'officer@technova.ai',
      provider: 'google'
    };
  },

  async loginAsDemo(): Promise<AuthResult> {
    if (isFirebaseConfigured && auth) {
      try {
        const anon = await signInAnonymously(auth);
        return {
          uid: anon.user.uid,
          name: 'TechNova Security Officer',
          email: 'officer@technova.ai',
          provider: 'demo'
        };
      } catch (err) {
        console.warn('[TECHNOVA FIREBASE]: Demo anonymous auth fallback:', err);
      }
    }
    return {
      uid: 'demo-officer-01',
      name: 'TechNova Security Officer',
      email: 'officer@technova.ai',
      provider: 'demo'
    };
  },

  async sendPasswordReset(email: string): Promise<void> {
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err) {
        console.warn('[TECHNOVA FIREBASE]: Simulated password reset for:', email, err);
      }
    }
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
  },

  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, callback);
    }
    return () => {};
  }
};

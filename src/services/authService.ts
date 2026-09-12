import { firebaseAuthService, AuthResult } from '../firebase/auth';
import { userService, UserProfile } from './userService';
import { simulatorService } from './simulatorService';
import { transactionService } from './transactionService';
import { auditService } from './auditService';
import { authStorage } from '../utils/auth';

export interface AppAuthUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  provider: string;
}

export const authService = {
  async register(name: string, email: string, pass: string): Promise<AppAuthUser> {
    const authRes = await firebaseAuthService.registerWithEmail(name, email, pass);
    return await this.handlePostAuth(authRes);
  },

  async login(email: string, pass: string): Promise<AppAuthUser> {
    const authRes = await firebaseAuthService.loginWithEmail(email, pass);
    return await this.handlePostAuth(authRes);
  },

  async loginWithGoogle(): Promise<AppAuthUser> {
    const authRes = await firebaseAuthService.loginWithGoogle();
    return await this.handlePostAuth(authRes);
  },

  async loginAsDemo(): Promise<AppAuthUser> {
    const authRes = await firebaseAuthService.loginAsDemo();
    return await this.handlePostAuth(authRes);
  },

  async sendPasswordReset(email: string): Promise<void> {
    await firebaseAuthService.sendPasswordReset(email);
  },

  async logout(): Promise<void> {
    await firebaseAuthService.logout();
    authStorage.clearAuth();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('technova_uid');
    }
  },

  async handlePostAuth(authRes: AuthResult): Promise<AppAuthUser> {
    // 1. Persist/Sync user profile in Firestore
    const profile = await userService.syncUserProfile({
      uid: authRes.uid,
      name: authRes.name,
      email: authRes.email,
      provider: authRes.provider
    });

    // 2. Ensure Demo Simulator Account & Beneficiaries exist
    await simulatorService.ensureDemoData(authRes.uid);

    // 3. Seed demo transactions & audit chain once
    await transactionService.seedDemoTransactions(authRes.uid);
    await auditService.seedDemoAuditChain(authRes.uid);

    // 4. Update local session storage
    authStorage.setAuth({
      name: profile.name,
      email: profile.email,
      provider: profile.authProvider as any
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('technova_uid', authRes.uid);
    }

    return {
      uid: profile.uid,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      provider: profile.authProvider
    };
  },

  getCurrentUid(): string {
    return localStorage.getItem('technova_uid') || 'demo-officer-01';
  }
};

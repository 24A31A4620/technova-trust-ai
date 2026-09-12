import { firestoreService } from '../firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  authProvider: string;
  accountStatus: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt: string;
}

export const userService = {
  async syncUserProfile(user: { uid: string; name: string; email: string; provider?: string }): Promise<UserProfile> {
    const existing = await firestoreService.getDocument('users', user.uid);
    const now = new Date().toISOString();

    if (existing) {
      const updated: UserProfile = {
        ...existing,
        name: user.name || existing.name,
        email: user.email || existing.email,
        lastLoginAt: now
      };
      await firestoreService.setDocument('users', user.uid, updated);
      return updated;
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      name: user.name || 'Security Officer',
      email: user.email,
      role: 'team_member',
      authProvider: user.provider || 'password',
      accountStatus: 'active',
      createdAt: now,
      lastLoginAt: now
    };

    await firestoreService.setDocument('users', user.uid, newProfile);
    return newProfile;
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    return await firestoreService.getDocument('users', uid);
  }
};

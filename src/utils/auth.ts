export interface AuthUser {
  name: string;
  email: string;
  provider?: 'credentials' | 'google';
}

const AUTH_KEY = 'technova_auth';
const USER_NAME_KEY = 'technova_user_name';
const USER_EMAIL_KEY = 'technova_user_email';

export const authStorage = {
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(AUTH_KEY) === 'true';
  },

  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const isAuth = localStorage.getItem(AUTH_KEY) === 'true';
    if (!isAuth) return null;
    return {
      name: localStorage.getItem(USER_NAME_KEY) || 'Security Officer',
      email: localStorage.getItem(USER_EMAIL_KEY) || 'officer@technova.ai'
    };
  },

  setAuth(user: AuthUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_NAME_KEY, user.name);
    localStorage.setItem(USER_EMAIL_KEY, user.email);
  },

  clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
  }
};

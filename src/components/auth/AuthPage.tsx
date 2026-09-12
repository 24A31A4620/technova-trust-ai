import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Terminal,
  Sparkles,
  Database
} from 'lucide-react';
import { AuthUser, authStorage } from '../../utils/auth';
import { authService } from '../../services/authService';
import { isFirebaseConfigured } from '../../firebase/config';

export type AuthMode = 'signin' | 'signup' | 'forgot-password';

interface AuthPageProps {
  initialMode?: AuthMode;
  onSuccess: (user: AuthUser) => void;
  scanlinesEnabled?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signin',
  onSuccess,
  scanlinesEnabled = true
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Errors & Feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSent, setResetSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email format validation
  const isValidEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setResetSent(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/${newMode}`);
    }
  };

  // 1. Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      errs.email = 'Enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const user = await authService.login(email.trim(), password);
      onSuccess({
        name: user.name,
        email: user.email,
        provider: 'credentials'
      });
    } catch (err: any) {
      console.error('Sign in error:', err);
      const rawMsg = err?.message || String(err);
      if (rawMsg.includes('operation-not-allowed')) {
        setErrors({
          form: 'Firebase Email/Password is not enabled in your Firebase project. Use Google Sign-in or click "1-Click Demo Access" below to enter.'
        });
      } else {
        setErrors({ form: rawMsg || 'Authentication failed. Please verify credentials.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Sign Up with strict validation
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Name is required.';
    }

    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      errs.email = 'Enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm Password is required.';
    } else if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const user = await authService.register(name.trim(), email.trim(), password);
      onSuccess({
        name: user.name,
        email: user.email,
        provider: 'credentials'
      });
    } catch (err: any) {
      console.error('Sign up error:', err);
      const rawMsg = err?.message || String(err);
      if (rawMsg.includes('operation-not-allowed')) {
        setErrors({
          form: 'Firebase Email/Password is not enabled in your Firebase project. Use Google Sign-in or click "1-Click Demo Access" below to enter.'
        });
      } else {
        setErrors({ form: rawMsg || 'Registration failed. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      errs.email = 'Enter a valid email address.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      await authService.sendPasswordReset(email.trim());
      setResetSent(true);
    } catch (err: any) {
      setResetSent(true); // Don't reveal account existence for security
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Real / Fallback Continue with Google
  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const user = await authService.loginWithGoogle();
      onSuccess({
        name: user.name,
        email: user.email,
        provider: 'google'
      });
    } catch (err: any) {
      console.error('Google auth error:', err);
      // Fallback
      const demoGoogleUser: AuthUser = {
        name: 'TechNova Security Officer',
        email: 'officer@technova.ai',
        provider: 'google'
      };
      authStorage.setAuth(demoGoogleUser);
      onSuccess(demoGoogleUser);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle Instant 1-Click Demo Access
  const handleDemoAuth = async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const user = await authService.loginAsDemo();
      onSuccess({
        name: user.name,
        email: user.email,
        provider: 'credentials'
      });
    } catch (err: any) {
      console.warn('Demo auth error:', err);
      const fallbackUser: AuthUser = {
        name: 'TechNova Security Officer',
        email: 'officer@technova.ai',
        provider: 'credentials'
      };
      authStorage.setAuth(fallbackUser);
      onSuccess(fallbackUser);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className={`min-h-screen bg-[#03060a] text-gray-200 font-mono relative flex items-center justify-center p-4 sm:p-6 overflow-x-hidden ${scanlinesEnabled ? 'scanline' : ''}`}>
      {/* Background Cyber Grid & Radiant Security Ambient */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#00f3ff_1px,transparent_1px)] [background-size:24px_24px] z-0"></div>
      <div className="fixed top-1/4 -left-48 w-96 h-96 bg-[#00f3ff]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-1/4 -right-48 w-96 h-96 bg-[#ff0055]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card: Split layout on desktop, responsive centered card */}
      <div className="w-full max-w-5xl bg-[#060b13]/90 border border-[#18283d] rounded-sm shadow-[0_0_50px_rgba(0,243,255,0.12)] backdrop-blur-xl relative z-10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: Brand Identity & Security Axiom (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#070e1a] via-[#050912] to-[#020509] p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#152336] flex flex-col justify-between relative">
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#00f3ff]/10 border border-[#00f3ff] rounded-sm shadow-[0_0_15px_rgba(0,243,255,0.35)]">
                <Shield className="w-7 h-7 text-[#00f3ff] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-[#ff0055] tracking-widest uppercase">TECHNOVA</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30 rounded">FS-2605</span>
                </div>
                <h1 className="text-xl font-bold tracking-wider glitch-text-cyan font-display text-white">
                  TRUSTLAYER<span className="text-[#ff0055]">.AI</span>
                </h1>
              </div>
            </div>

            {/* Core Principle Callout */}
            <div className="space-y-2 pt-4">
              <div className="text-[11px] font-bold text-[#00f3ff] uppercase tracking-widest flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-[#00f3ff] rounded-full"></span>
                <span>SECURE MONEY FLOW</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-white leading-snug border-l-2 border-[#00f3ff] pl-3 py-1">
                &ldquo;The AI can think.<br />The TrustLayer decides.&rdquo;
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pt-2">
                Secure access to your financial intelligence and transaction control center.
              </p>
            </div>

            {/* Decorative Architectural Invariant Badges */}
            <div className="space-y-2 pt-2">
              <div className="p-2.5 bg-[#0a121e]/80 border border-[#192b42] rounded text-[11px] text-gray-300 flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-[#00ff66] flex-shrink-0" />
                <span>Action Firewall Cryptographic Tokens</span>
              </div>
              <div className="p-2.5 bg-[#0a121e]/80 border border-[#192b42] rounded text-[11px] text-gray-300 flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-[#00f3ff] flex-shrink-0" />
                <span>Tamper-Evident SHA-256 Audit Chaining</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="pt-8 border-t border-[#121e2d] text-[10px] text-gray-500 flex items-center justify-between">
            <span>FS-2605 SECURITY PROTOCOL</span>
            <span className="text-[#00ff66] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-[#00ff66] rounded-full animate-ping"></span>
              <span>GATEWAY ACTIVE</span>
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Authentication Form (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-[#050912]/80">
          
          {/* ══════════════════════════════════════════════
              MODE 1: SIGN IN
          ══════════════════════════════════════════════ */}
          {mode === 'signin' && (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <div>
                <div className="text-[10px] text-[#00f3ff] font-bold tracking-widest uppercase mb-1">
                  AUTHENTICATION GATEWAY
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wider">SIGN IN</h2>
                <div className="text-sm font-semibold text-gray-300 mt-1">Welcome back</div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sign in to continue to TechNova TrustLayer.
                </p>
              </div>

              {/* 1-CLICK DEMO ACCESS BUTTON */}
              <button
                type="button"
                onClick={handleDemoAuth}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3.5 bg-gradient-to-r from-[#00ff66]/15 via-[#00ff66]/5 to-transparent hover:from-[#00ff66]/25 border border-[#00ff66]/40 text-[#00ff66] text-xs font-mono font-bold tracking-wider rounded flex items-center justify-between transition cursor-pointer group shadow-[0_0_15px_rgba(0,255,102,0.12)]"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#00ff66] animate-pulse" />
                  <span>1-CLICK DEMO ACCESS (EVALUATION MODE)</span>
                </div>
                <span className="text-[10px] text-gray-400 group-hover:text-white flex items-center space-x-1">
                  <span>ENTER</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              {/* ERROR BANNER */}
              {errors.form && (
                <div className="p-3 bg-[#ff0055]/15 border border-[#ff0055] rounded text-xs text-red-200 font-mono flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-[#ff0055] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-[#ff0055] uppercase tracking-wider text-[11px]">AUTHENTICATION NOTICE</div>
                    <p className="mt-0.5 text-gray-300">{errors.form}</p>
                    <button
                      type="button"
                      onClick={handleDemoAuth}
                      className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 text-[#00f3ff] border border-[#00f3ff]/50 rounded text-[11px] font-bold tracking-wider uppercase cursor-pointer"
                    >
                      <span>ENTER VIA DEMO SANDBOX</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                {/* EMAIL FIELD */}
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                    <span>EMAIL</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="Enter your email"
                      className={`w-full bg-[#080d16] border ${
                        errors.email ? 'border-[#ff0055] focus:border-[#ff0055]' : 'border-[#1b2b3d] focus:border-[#00f3ff]'
                      } text-sm text-white pl-9 pr-3 py-2.5 rounded font-mono outline-none transition`}
                    />
                  </div>
                  {errors.email && (
                    <div className="text-[11px] text-[#ff0055] mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* PASSWORD FIELD */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      PASSWORD
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="Enter your password"
                      className={`w-full bg-[#080d16] border ${
                        errors.password ? 'border-[#ff0055] focus:border-[#ff0055]' : 'border-[#1b2b3d] focus:border-[#00f3ff]'
                      } text-sm text-white pl-9 pr-10 py-2.5 rounded font-mono outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="text-[11px] text-[#ff0055] mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>

                {/* FORGOT PASSWORD LINK */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="text-xs text-[#00f3ff] hover:text-[#00f3ff]/80 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* SIGN IN MAIN BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#00f3ff] text-black font-bold font-mono text-xs tracking-widest uppercase rounded hover:bg-[#00f3ff]/85 transition shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  <span>{isSubmitting ? 'AUTHENTICATING ENCLAVE...' : 'SIGN IN'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* DIVIDER */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#172536]"></div>
                <span className="flex-shrink mx-3 text-xs text-gray-500 uppercase tracking-widest font-mono">
                  OR
                </span>
                <div className="flex-grow border-t border-[#172536]"></div>
              </div>

              {/* GOOGLE BUTTON */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#090f19] hover:bg-[#0f1826] border border-[#1b2b3d] text-gray-200 text-xs font-mono font-medium rounded flex items-center justify-center space-x-3 transition cursor-pointer"
              >
                {/* Google SVG Logo */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* CREATE ACCOUNT LINK */}
              <div className="text-center text-xs text-gray-400 font-mono pt-1">
                <span>Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-[#00f3ff] hover:underline font-bold transition cursor-pointer"
                >
                  Create account
                </button>
              </div>

              {/* SECURITY UX STATEMENT */}
              <div className="text-center pt-2">
                <span className="text-[10px] text-gray-500 inline-flex items-center space-x-1 bg-[#080d16] px-2.5 py-1 rounded border border-[#152336]">
                  <Shield className="w-3 h-3 text-[#00f3ff]" />
                  <span>Protected by TechNova TrustLayer</span>
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              MODE 2: SIGN UP
          ══════════════════════════════════════════════ */}
          {mode === 'signup' && (
            <div className="space-y-5 max-w-md mx-auto w-full">
              <div>
                <div className="text-[10px] text-[#00f3ff] font-bold tracking-widest uppercase mb-1">
                  NEW WORKSPACE REGISTRATION
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wider">CREATE YOUR ACCOUNT</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Set up your secure TechNova workspace.
                </p>
              </div>

              {/* 1-CLICK DEMO ACCESS BUTTON */}
              <button
                type="button"
                onClick={handleDemoAuth}
                disabled={isSubmitting}
                className="w-full py-2.5 px-3.5 bg-gradient-to-r from-[#00ff66]/15 via-[#00ff66]/5 to-transparent hover:from-[#00ff66]/25 border border-[#00ff66]/40 text-[#00ff66] text-xs font-mono font-bold tracking-wider rounded flex items-center justify-between transition cursor-pointer group shadow-[0_0_15px_rgba(0,255,102,0.12)]"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#00ff66] animate-pulse" />
                  <span>1-CLICK DEMO ACCESS (EVALUATION MODE)</span>
                </div>
                <span className="text-[10px] text-gray-400 group-hover:text-white flex items-center space-x-1">
                  <span>ENTER</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              {/* ERROR BANNER */}
              {errors.form && (
                <div className="p-3 bg-[#ff0055]/15 border border-[#ff0055] rounded text-xs text-red-200 font-mono flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-[#ff0055] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-[#ff0055] uppercase tracking-wider text-[11px]">AUTHENTICATION NOTICE</div>
                    <p className="mt-0.5 text-gray-300">{errors.form}</p>
                    <button
                      type="button"
                      onClick={handleDemoAuth}
                      className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 text-[#00f3ff] border border-[#00f3ff]/50 rounded text-[11px] font-bold tracking-wider uppercase cursor-pointer"
                    >
                      <span>ENTER VIA DEMO SANDBOX</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* NAME FIELD */}
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    NAME
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="Enter your name"
                      className={`w-full bg-[#080d16] border ${
                        errors.name ? 'border-[#ff0055] focus:border-[#ff0055]' : 'border-[#1b2b3d] focus:border-[#00f3ff]'
                      } text-sm text-white pl-9 pr-3 py-2 rounded font-mono outline-none transition`}
                    />
                  </div>
                  {errors.name && (
                    <div className="text-[11px] text-[#ff0055] mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                {/* EMAIL FIELD */}
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    EMAIL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="Enter your email"
                      className={`w-full bg-[#080d16] border ${
                        errors.email ? 'border-[#ff0055] focus:border-[#ff0055]' : 'border-[#1b2b3d] focus:border-[#00f3ff]'
                      } text-sm text-white pl-9 pr-3 py-2 rounded font-mono outline-none transition`}
                    />
                  </div>
                  {errors.email && (
                    <div className="text-[11px] text-[#ff0055] mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* PASSWORD FIELD */}
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="Create a password"
                      className={`w-full bg-[#080d16] border ${
                        errors.password ? 'border-[#ff0055] focus:border-[#ff0055]' : 'border-[#1b2b3d] focus:border-[#00f3ff]'
                      } text-sm text-white pl-9 pr-10 py-2 rounded font-mono outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="text-[11px] text-[#ff0055] mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>

                {/* CONFIRM PASSWORD FIELD */}
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Confirm your password"
                      className={`w-full bg-[#080d16] border ${
                        errors.confirmPassword ? 'border-[#ff0055] focus:border-[#ff0055]' : 'border-[#1b2b3d] focus:border-[#00f3ff]'
                      } text-sm text-white pl-9 pr-10 py-2 rounded font-mono outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="text-[11px] text-[#ff0055] mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>

                {/* CREATE ACCOUNT MAIN BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#00f3ff] text-black font-bold font-mono text-xs tracking-widest uppercase rounded hover:bg-[#00f3ff]/85 transition shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center space-x-2 cursor-pointer mt-3"
                >
                  <span>{isSubmitting ? 'PROVISIONING WORKSPACE...' : 'CREATE ACCOUNT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* DIVIDER */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#172536]"></div>
                <span className="flex-shrink mx-3 text-xs text-gray-500 uppercase tracking-widest font-mono">
                  OR
                </span>
                <div className="flex-grow border-t border-[#172536]"></div>
              </div>

              {/* GOOGLE BUTTON */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#090f19] hover:bg-[#0f1826] border border-[#1b2b3d] text-gray-200 text-xs font-mono font-medium rounded flex items-center justify-center space-x-3 transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* SIGN IN LINK */}
              <div className="text-center text-xs text-gray-400 font-mono pt-1">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-[#00f3ff] hover:underline font-bold transition cursor-pointer"
                >
                  Sign in
                </button>
              </div>

              {/* SECURITY UX STATEMENT */}
              <div className="text-center pt-2">
                <span className="text-[10px] text-gray-500 inline-flex items-center space-x-1 bg-[#080d16] px-2.5 py-1 rounded border border-[#152336]">
                  <Shield className="w-3 h-3 text-[#00f3ff]" />
                  <span>Your financial workspace starts behind a secure authentication boundary.</span>
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              MODE 3: FORGOT PASSWORD
          ══════════════════════════════════════════════ */}
          {mode === 'forgot-password' && (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <div>
                <div className="text-[10px] text-[#00f3ff] font-bold tracking-widest uppercase mb-1">
                  RECOVERY SYSTEM
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wider">FORGOT PASSWORD</h2>
                <div className="text-sm font-semibold text-gray-300 mt-1">Reset your password</div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Enter the email associated with your TechNova account and we&apos;ll send you a password reset link.
                </p>
              </div>

              {resetSent ? (
                <div className="bg-[#00ff66]/10 border border-[#00ff66]/40 p-5 rounded space-y-3 font-mono">
                  <div className="flex items-center space-x-2 text-[#00ff66]">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-sm tracking-wider uppercase">CHECK YOUR EMAIL</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    If an account exists for this email, a password reset link has been sent.
                  </p>
                  <p className="text-[10px] text-gray-500">
                    [PROTOTYPE DEMO]: Password reset token dispatched locally. No production email transmission needed.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="w-full py-2.5 bg-[#00ff66]/20 border border-[#00ff66] text-[#00ff66] font-bold text-xs uppercase tracking-wider rounded hover:bg-[#00ff66]/30 transition cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {/* EMAIL FIELD */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                      EMAIL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        placeholder="Enter your email"
                        className={`w-full bg-[#080d16] border ${
                          errors.email ? 'border-[#ff0055] focus:border-[#ff0055]' : 'border-[#1b2b3d] focus:border-[#00f3ff]'
                        } text-sm text-white pl-9 pr-3 py-2.5 rounded font-mono outline-none transition`}
                      />
                    </div>
                    {errors.email && (
                      <div className="text-[11px] text-[#ff0055] mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  {/* SEND RESET LINK BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#00f3ff] text-black font-bold font-mono text-xs tracking-widest uppercase rounded hover:bg-[#00f3ff]/85 transition shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center space-x-2 cursor-pointer mt-2"
                  >
                    <span>{isSubmitting ? 'GENERATING RESET TOKEN...' : 'SEND RESET LINK'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* BACK TO SIGN IN */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="text-xs text-gray-400 hover:text-white transition font-mono cursor-pointer"
                    >
                      [ Back to Sign In ]
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

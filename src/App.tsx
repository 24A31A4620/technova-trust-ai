/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { AttackLab } from './components/AttackLab';
import { JudgeDemoRunner } from './components/JudgeDemoRunner';
import { AuditLedgerView } from './components/AuditLedgerView';
import { PrivacyProofView } from './components/PrivacyProofView';
import { TestMatrixView } from './components/TestMatrixView';
import { FailureDisclosureView } from './components/FailureDisclosureView';
import { AuthPage, AuthMode } from './components/auth/AuthPage';
import { apiClient } from './services/apiClient';
import { FinancialAccount } from './types';
import { AuthUser, authStorage } from './utils/auth';
import { Shield, Terminal, Zap } from 'lucide-react';
import { simulatorService } from './services/simulatorService';
import { transactionService } from './services/transactionService';
import { auditService } from './services/auditService';

export default function App() {
  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('pipeline');
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);

  // Authentication State (persisted in localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return authStorage.isAuthenticated();
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return authStorage.getUser();
  });

  // Determine initial auth mode from URL path if unauthenticated
  const getInitialAuthMode = (): AuthMode => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('signup')) return 'signup';
      if (path.includes('forgot')) return 'forgot-password';
    }
    return 'signin';
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Initialize demo data in Firestore for first-time user (creates once)
      simulatorService.ensureDemoData(currentUser.uid).catch(err => console.warn(err));
      transactionService.seedDemoTransactions(currentUser.uid).catch(err => console.warn(err));
      auditService.seedDemoAuditChain(currentUser.uid).catch(err => console.warn(err));
      fetchAccount();
    }
  }, [isAuthenticated, currentUser]);

  const fetchAccount = async () => {
    try {
      const acc = await apiClient.getAccount();
      setAccount(acc);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('signin') || path.includes('signup') || path.includes('forgot')) {
        window.history.pushState({}, '', '/');
      }
    }
    fetchAccount();
  };

  const handleLogout = () => {
    authStorage.clearAuth();
    setIsAuthenticated(false);
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/signin');
    }
  };

  const handleResetDemo = async () => {
    try {
      // Re-initialize account balance and clean audit
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  // If user is not authenticated, present the secure authentication gate
  if (!isAuthenticated) {
    return (
      <AuthPage
        initialMode={getInitialAuthMode()}
        onSuccess={handleLoginSuccess}
        scanlinesEnabled={scanlinesEnabled}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#03060a] text-gray-200 font-mono relative overflow-x-hidden ${scanlinesEnabled ? 'scanline' : ''}`}>
      {/* Background cyber grid */}
      <div className="fixed inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#00f3ff_1px,transparent_1px)] [background-size:24px_24px] z-0"></div>

      {/* Retro HUD Header */}
      <Header
        account={account}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scanlinesEnabled={scanlinesEnabled}
        setScanlinesEnabled={setScanlinesEnabled}
        onResetDemo={handleResetDemo}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Terminal Viewport */}
      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {activeTab === 'pipeline' && (
          <PipelineVisualizer account={account} onRefreshAccount={fetchAccount} />
        )}

        {activeTab === 'attack_lab' && <AttackLab />}

        {activeTab === 'judge_demo' && (
          <JudgeDemoRunner onRefreshAccount={fetchAccount} />
        )}

        {activeTab === 'audit_chain' && <AuditLedgerView />}

        {activeTab === 'privacy_proof' && <PrivacyProofView />}

        {activeTab === 'tests' && <TestMatrixView />}

        {activeTab === 'disclosure' && <FailureDisclosureView />}
      </main>

      {/* Cyberpunk Footer */}
      <footer className="border-t border-[#121c29] bg-[#020407] py-6 mt-12 text-xs text-gray-500 font-mono relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#00f3ff]" />
            <span className="text-gray-400 font-bold">TECHNOVA TRUSTLAYER AI</span>
            <span>// FS-2605 FINANCIAL DEFENSE SPECIFICATION</span>
          </div>

          <div className="text-center md:text-right text-[11px] text-gray-500">
            DETERMINISTIC SIMULATION ONLY • ZERO REAL MONEY EXPOSURE • CRYPTOGRAPHIC PROVENANCE
          </div>
        </div>
      </footer>
    </div>
  );
}

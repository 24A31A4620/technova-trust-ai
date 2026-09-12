import React from 'react';
import { Shield, Terminal, Zap, Lock, AlertTriangle, LogOut, User as UserIcon, Database } from 'lucide-react';
import { FinancialAccount } from '../types';
import { AuthUser } from '../utils/auth';
import { isFirebaseConfigured } from '../firebase/config';

interface HeaderProps {
  account: FinancialAccount | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scanlinesEnabled: boolean;
  setScanlinesEnabled: (val: boolean) => void;
  onResetDemo: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  activeTab,
  setActiveTab,
  scanlinesEnabled,
  setScanlinesEnabled,
  onResetDemo,
  user,
  onLogout
}) => {
  const tabs = [
    { id: 'pipeline', label: 'EXECUTION_PIPELINE', icon: Shield },
    { id: 'attack_lab', label: 'ATTACK_LAB [10]', icon: AlertTriangle },
    { id: 'judge_demo', label: '18-STEP_DEMO', icon: Zap },
    { id: 'audit_chain', label: 'AUDIT_LEDGER', icon: Lock },
    { id: 'privacy_proof', label: 'PRIVACY_PROOF', icon: Terminal },
    { id: 'tests', label: 'TEST_MATRIX', icon: Terminal },
    { id: 'disclosure', label: 'WHERE_THIS_BREAKS', icon: AlertTriangle }
  ];

  return (
    <header className="border-b border-[#1f2d3d] bg-[#070b12]/95 backdrop-blur sticky top-0 z-40">
      {/* Top Warning Marquee */}
      <div className="bg-[#ff0055]/10 border-b border-[#ff0055]/30 px-3 py-1 text-[11px] flex justify-between items-center text-[#ff0055] tracking-wider uppercase font-mono overflow-hidden">
        <div className="flex items-center space-x-2 animate-pulse">
          <span className="inline-block w-2 h-2 bg-[#ff0055] rounded-full"></span>
          <span>FS-2605 FINANCIAL DEFENSE PROTOCOL ACTIVE // SIMULATOR ONLY // ZERO REAL MONEY AT RISK</span>
        </div>
        <div className="hidden md:flex items-center space-x-3">
          {isFirebaseConfigured ? (
            <span className="text-[#00ff66] flex items-center space-x-1 font-bold">
              <Database className="w-3 h-3 text-[#00ff66]" />
              <span>CLOUD DATABASE CONNECTED ✓</span>
            </span>
          ) : (
            <span className="text-[#ffb700] flex items-center space-x-1">
              <span>DEMO MODE — Cloud database is not configured.</span>
            </span>
          )}
          <span className="text-gray-600">|</span>
          <span className="text-[#00f3ff]">&quot;THE AI CAN THINK. THE TRUSTLAYER DECIDES.&quot;</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative p-2 bg-[#00f3ff]/10 border border-[#00f3ff] rounded-sm shadow-[0_0_12px_rgba(0,243,255,0.4)]">
            <Shield className="w-6 h-6 text-[#00f3ff] animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff0055] rounded-full"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#ff0055] tracking-widest uppercase">TECHNOVA CORP</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30 rounded">FS-2605</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wider glitch-text-cyan font-display">
              TRUSTLAYER<span className="text-[#ff0055]">.AI</span>
            </h1>
          </div>
        </div>

        {/* Live Simulator Account Telemetry */}
        <div className="flex items-center space-x-4">
          <div className="bg-[#0b1320] border border-[#00f3ff]/30 px-3 py-1.5 rounded flex items-center space-x-3">
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Treasury Vault ({account?.accountId || 'TN-DEMO-001'})</div>
              <div className="text-sm md:text-base font-bold text-[#00ff66] font-mono tracking-wide">
                ₹{account ? account.balance.toLocaleString() : '150,000'} <span className="text-[10px] text-[#00f3ff]">INR</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
              title="Toggle CRT Screen Scanlines"
              className={`text-xs px-2.5 py-1.5 border rounded transition-all font-mono ${
                scanlinesEnabled
                  ? 'border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/10'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              CRT FX: {scanlinesEnabled ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={onResetDemo}
              title="Reset Simulator to default benchmark state"
              className="text-xs px-2.5 py-1.5 border border-[#ff0055]/50 text-[#ff0055] hover:bg-[#ff0055]/15 rounded transition-all font-mono uppercase cursor-pointer"
            >
              RESET_SIM
            </button>
          </div>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center space-x-2 pl-3 border-l border-[#192b40]">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-bold text-gray-200 truncate max-w-[140px]">
                  {user.name}
                </span>
                <span className="text-[9px] text-[#00f3ff] truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Logout from TechNova TrustLayer"
                  className="text-xs px-2.5 py-1.5 border border-[#ff0055]/60 text-[#ff0055] hover:bg-[#ff0055]/20 rounded transition-all font-mono uppercase flex items-center space-x-1.5 cursor-pointer shadow-[0_0_8px_rgba(255,0,85,0.2)]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Retro Navigation Tabs */}
      <div className="border-t border-[#162232] bg-[#05080e] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/10 shadow-[0_4px_12px_rgba(0,243,255,0.2)]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00f3ff]' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

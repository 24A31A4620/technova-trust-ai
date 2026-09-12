import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Flame,
  ArrowDown
} from 'lucide-react';
import { AuditRecord } from '../types';
import { apiClient } from '../services/apiClient';

export const AuditLedgerView: React.FC = () => {
  const [chain, setChain] = useState<AuditRecord[]>([]);
  const [verification, setVerification] = useState<{
    valid: boolean;
    invalidBlock: string | null;
    details?: string;
  } | null>(null);
  const [tamperInfo, setTamperInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChain();
  }, []);

  const loadChain = async () => {
    setLoading(true);
    try {
      const records = await apiClient.getAuditChain();
      setChain(records);
      const verifyRes = await apiClient.verifyAuditChain();
      setVerification(verifyRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTamperSimulation = async () => {
    try {
      const res = await apiClient.tamperAuditLog();
      setTamperInfo(res);
      await loadChain();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreLog = async () => {
    try {
      await apiClient.restoreAuditLog();
      setTamperInfo(null);
      await loadChain();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="bg-[#080d16] border border-[#00f3ff]/30 p-5 rounded flex flex-wrap items-center justify-between gap-4 glitch-border-cyan">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-[#00f3ff]" />
            <h2 className="text-lg font-bold text-white font-mono tracking-wider">
              TAMPER-EVIDENT SHA-256 AUDIT LEDGER
            </h2>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Every authorization decision is anchored in a cryptographic block hash chain. Altering in-memory logs immediately breaks linkage.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTamperSimulation}
            className="px-3.5 py-2 bg-[#ff0055]/15 border border-[#ff0055] text-[#ff0055] hover:bg-[#ff0055]/25 font-mono text-xs font-bold rounded uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>SIMULATE TAMPERING</span>
          </button>

          <button
            onClick={handleRestoreLog}
            className="px-3.5 py-2 bg-[#00ff66]/15 border border-[#00ff66] text-[#00ff66] hover:bg-[#00ff66]/25 font-mono text-xs font-bold rounded uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTORE LEDGER</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verification && (
        <div
          className={`p-4 rounded border font-mono text-xs flex items-center justify-between gap-4 ${
            verification.valid
              ? 'bg-[#00ff66]/10 border-[#00ff66]/40 text-[#00ff66]'
              : 'bg-[#ff0055]/15 border-[#ff0055] text-[#ff0055] animate-pulse'
          }`}
        >
          <div className="flex items-center space-x-3">
            {verification.valid ? (
              <ShieldCheck className="w-6 h-6 flex-shrink-0 text-[#00ff66]" />
            ) : (
              <AlertTriangle className="w-6 h-6 flex-shrink-0 text-[#ff0055]" />
            )}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider">
                {verification.valid ? 'AUDIT CHAIN INTEGRITY VERIFIED' : 'CRITICAL INTEGRITY VIOLATION DETECTED'}
              </div>
              <div className="text-[11px] text-gray-300 mt-0.5">
                {verification.details || (verification.valid ? 'All blocks cryptographically verified.' : `Tampered block: ${verification.invalidBlock}`)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 block uppercase">TOTAL BLOCKS</span>
            <span className="text-base font-bold text-white">{chain.length}</span>
          </div>
        </div>
      )}

      {/* Chain Explorer */}
      <div className="space-y-4">
        {chain.map((block, idx) => {
          const isTampered = block.tampered;
          return (
            <React.Fragment key={block.blockId}>
              <div
                className={`bg-[#060a12] border p-4 rounded font-mono text-xs space-y-3 transition ${
                  isTampered
                    ? 'border-[#ff0055] bg-[#1a0812] shadow-[0_0_15px_rgba(255,0,85,0.4)]'
                    : 'border-[#182333] hover:border-[#00f3ff]/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#141f2e] pb-2">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30 font-bold rounded">
                      {block.blockId}
                    </span>
                    <span className="text-gray-400">Txn: <strong className="text-white">{block.transactionId}</strong></span>
                    <span className="text-gray-500 text-[10px]">
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isTampered && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#ff0055] text-white font-bold rounded animate-pulse">
                        TAMPERED IN-MEMORY
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        block.decision === 'ALLOW'
                          ? 'bg-[#00ff66]/20 text-[#00ff66]'
                          : block.decision === 'BLOCK'
                          ? 'bg-[#ff0055]/20 text-[#ff0055]'
                          : 'bg-[#ffb700]/20 text-[#ffb700]'
                      }`}
                    >
                      {block.decision}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-gray-300">
                  <div>
                    <span className="text-gray-500 block text-[10px]">ORIGINAL INTENT:</span>
                    <span>₹{block.originalIntent?.amount || 0} → {block.originalIntent?.beneficiary || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">AI PROPOSAL:</span>
                    <span>₹{block.aiProposal?.amount || 0} → {block.aiProposal?.beneficiary || 'N/A'}</span>
                  </div>
                </div>

                {/* Hashes Display */}
                <div className="bg-[#03060a] p-2.5 rounded border border-gray-900 text-[10px] space-y-1">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className="text-gray-500 font-bold uppercase w-20 flex-shrink-0">Prev Hash:</span>
                    <span className="text-gray-400 truncate font-mono">{block.previousHash}</span>
                  </div>
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className="text-[#00f3ff] font-bold uppercase w-20 flex-shrink-0">Block Hash:</span>
                    <span className="text-[#00f3ff] truncate font-mono">{block.currentHash}</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 italic">
                  &quot;{block.reason}&quot;
                </div>
              </div>

              {idx < chain.length - 1 && (
                <div className="flex justify-center my-1 text-gray-600">
                  <ArrowDown className="w-4 h-4 text-[#00f3ff]/60" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

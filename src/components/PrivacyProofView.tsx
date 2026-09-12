import React, { useState } from 'react';
import { Lock, CheckCircle2, ShieldCheck, EyeOff, Terminal, Key } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { PrivacyProofResult } from '../types';
import { privacyService } from '../services/privacyService';
import { authService } from '../services/authService';

export const PrivacyProofView: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(50000);
  const [proof, setProof] = useState<PrivacyProofResult | null>(null);
  const [verificationOutput, setVerificationOutput] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateProof = async () => {
    setGenerating(true);
    setVerificationOutput(null);
    try {
      const res = await apiClient.generatePrivacyProof(threshold);
      setProof(res);

      // Async Firestore Persistence (Zero-Exposure)
      const uid = authService.getCurrentUid();
      privacyService.recordPrivacyProof({
        userId: uid,
        predicate: 'balance_greater_than',
        threshold: res.threshold,
        commitment: res.commitment,
        proofSnippet: res.verificationResult.claimHolds ? 'VALID_COMMITMENT_PROOF' : 'INVALID_COMMITMENT_PROOF',
        verificationResult: res.verificationResult.claimHolds ? 'VALID' : 'INVALID'
      }).catch(err => console.warn('[TECHNOVA FIRESTORE]: Privacy proof save warning:', err));
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proof) return;
    try {
      const res = await apiClient.verifyPrivacyProof({
        commitment: proof.commitment,
        salt: proof.salt,
        claimHolds: proof.verificationResult.claimHolds,
        threshold: proof.threshold
      });
      setVerificationOutput(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Notice Card */}
      <div className="bg-[#080d16] border border-[#00f3ff]/40 p-5 rounded glitch-border-cyan space-y-2">
        <div className="flex items-center space-x-2">
          <EyeOff className="w-5 h-5 text-[#00f3ff]" />
          <h2 className="text-lg font-bold text-white tracking-wider">
            VERIFIABLE PRIVACY PROOF // ZERO-EXPOSURE SOLVENCY DEMO
          </h2>
        </div>
        <p className="text-xs text-gray-400">
          Enables third parties or smart contracts to verify corporate solvency claims (e.g. &quot;Treasury Balance &gt; ₹50,000&quot;) without inspecting or revealing the confidential bank balance.
        </p>
        <div className="inline-block text-[10px] bg-[#ffb700]/10 text-[#ffb700] border border-[#ffb700]/30 px-2 py-0.5 rounded uppercase font-bold">
          [PROTOTYPE PRIVACY PROOF — Cryptographic Commitment Demonstration]
        </div>
      </div>

      {/* Proof Generator Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Prover Input */}
        <div className="bg-[#070c14] border border-[#182535] p-5 rounded space-y-4">
          <div className="flex items-center justify-between border-b border-[#141f2e] pb-2">
            <span className="text-xs font-bold text-[#00f3ff] uppercase">1. PROVER (TECHNOVA TREASURY)</span>
            <Key className="w-4 h-4 text-gray-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Claim Threshold (INR):</label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm">₹</span>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full bg-[#04070c] border border-gray-800 text-sm text-white p-2 rounded focus:border-[#00f3ff] outline-none"
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">
              Claim to prove: &quot;Current Treasury Balance &gt; ₹{threshold.toLocaleString()} INR&quot;
            </span>
          </div>

          <div className="p-3 bg-[#04080e] border border-gray-900 rounded text-xs space-y-1">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Privacy Guarantee:</div>
            <div className="text-gray-300">
              The exact ledger balance remains strictly private inside the secure enclave. Only the salt + cryptographic SHA-256 hash commitment are published to the external verifier.
            </div>
          </div>

          <button
            onClick={handleGenerateProof}
            disabled={generating}
            className="w-full py-2.5 bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff] rounded font-bold text-xs uppercase tracking-wider hover:bg-[#00f3ff]/30 transition cursor-pointer"
          >
            {generating ? 'COMPUTING COMMITMENT...' : 'GENERATE PRIVACY PROOF'}
          </button>
        </div>

        {/* Right Column: Verifier Enclave */}
        <div className="bg-[#070c14] border border-[#182535] p-5 rounded space-y-4">
          <div className="flex items-center justify-between border-b border-[#141f2e] pb-2">
            <span className="text-xs font-bold text-[#00ff66] uppercase">2. VERIFIER (AUDITOR / RECIPIENT)</span>
            <ShieldCheck className="w-4 h-4 text-gray-500" />
          </div>

          {proof ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Claim Statement:</span>
                <span className="text-white font-bold">{proof.claim}</span>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Cryptographic Commitment:</span>
                <div className="bg-[#03060b] p-2 rounded border border-gray-900 text-[10px] text-[#00f3ff] break-all">
                  {proof.commitment}
                </div>
              </div>

              <div>
                <span className="text-gray-500 block text-[10px] uppercase">Verification Salt (16-char):</span>
                <span className="text-gray-300">{proof.salt}</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleVerifyProof}
                  className="w-full py-2 bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66] rounded font-bold text-xs uppercase tracking-wider hover:bg-[#00ff66]/30 transition cursor-pointer"
                >
                  VERIFY COMMITMENT MATHEMATICALLY
                </button>
              </div>

              {verificationOutput && (
                <div className="p-3 bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] rounded text-xs mt-2 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{verificationOutput.message}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-gray-500 text-center">
              Generate a proof on the left to verify commitment parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

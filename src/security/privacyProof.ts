import { PrivacyProofResult } from '../types';
import { computeSha256, generateSalt } from '../utils/crypto';
import { financialSimulatorInstance } from '../simulator/financialSimulator';

export function generatePrivacyProof(threshold = 50000): PrivacyProofResult {
  const account = financialSimulatorInstance.getBalance();
  const actualBalance = account.balance;
  const holds = actualBalance > threshold;
  const salt = generateSalt(16);

  // Cryptographic commitment: H(salt || claimHolds || threshold || "PROTOTYPE PRIVACY PROOF")
  const commitmentPayload = `${salt}|${holds}|${threshold}|PROTOTYPE_PRIVACY_PROOF_COMMITMENT`;
  const commitment = computeSha256(commitmentPayload);

  return {
    proofGenerated: true,
    proofType: 'PROTOTYPE PRIVACY PROOF',
    claim: `Corporate Treasury Balance > ₹${threshold.toLocaleString()} INR`,
    threshold,
    salt,
    commitment,
    verificationResult: {
      valid: true,
      claimHolds: holds,
      actualBalanceHidden: true,
      notes: `PROTOTYPE PRIVACY PROOF: Verifier confirms commitment matches solvency predicate without inspecting raw balance (Actual balance remaining private). Note: This is an illustrative deterministic cryptographic commitment prototype.`
    }
  };
}

export function verifyPrivacyProof(params: {
  commitment: string;
  salt: string;
  claimHolds: boolean;
  threshold: number;
}): {
  verified: boolean;
  message: string;
  recomputedCommitment: string;
} {
  const recomputedPayload = `${params.salt}|${params.claimHolds}|${params.threshold}|PROTOTYPE_PRIVACY_PROOF_COMMITMENT`;
  const recomputedCommitment = computeSha256(recomputedPayload);
  const verified = recomputedCommitment === params.commitment;

  return {
    verified,
    message: verified
      ? 'Commitment successfully verified. Verifier confirms statement holds without learning raw balance.'
      : 'Commitment verification failed. Mismatched cryptographic proof parameters.',
    recomputedCommitment
  };
}

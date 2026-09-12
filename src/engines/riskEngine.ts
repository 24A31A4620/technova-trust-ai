import {
  RiskFactor,
  RiskResult,
  IntentBindingResult,
  ProvenanceResult,
  PromptInjectionResult,
  Beneficiary
} from '../types';

export function calculateRisk(params: {
  intentBinding: IntentBindingResult;
  provenance: ProvenanceResult;
  promptInjection: PromptInjectionResult;
  beneficiaryRecord?: Beneficiary;
  hasUntrustedInstruction?: boolean;
  proposedAmount: number;
}): RiskResult {
  const {
    intentBinding,
    provenance,
    promptInjection,
    beneficiaryRecord,
    hasUntrustedInstruction,
    proposedAmount
  } = params;

  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // 1. Prompt injection (+40)
  if (promptInjection.detected) {
    const points = 40;
    totalScore += points;
    factors.push({
      name: 'Prompt Injection Detected',
      points,
      reason: `Adversarial instruction markers detected in untrusted content: [${promptInjection.indicators.join(', ')}]`
    });
  }

  // 2. Amount drift (+30)
  if (intentBinding.amountDrift) {
    const points = 30;
    totalScore += points;
    factors.push({
      name: 'Amount Drift',
      points,
      reason: `AI proposed amount (${proposedAmount}) deviates from verified user intent (${intentBinding.original.amount})`
    });
  }

  // 3. Beneficiary drift (+30)
  if (intentBinding.beneficiaryDrift) {
    const points = 30;
    totalScore += points;
    factors.push({
      name: 'Beneficiary Drift',
      points,
      reason: `AI proposed beneficiary (${intentBinding.proposed.beneficiary}) does not match authorized target (${intentBinding.original.beneficiary})`
    });
  }

  // 4. Untrusted instruction (+30)
  if (hasUntrustedInstruction || provenance.untrustedFields.length > 0) {
    const points = 30;
    totalScore += points;
    factors.push({
      name: 'Untrusted Instruction / Content',
      points,
      reason: 'Transaction relies on unverified external payload (e.g. supplier PDF/email) attempting authoritative command'
    });
  }

  // 5. Missing provenance (+25)
  if (!provenance.valid && provenance.missingProvenance.length > 0) {
    const points = 25;
    totalScore += points;
    factors.push({
      name: 'Missing Provenance',
      points,
      reason: `Authoritative provenance missing for critical fields: ${provenance.missingProvenance.join(', ')}`
    });
  }

  // 6. Unknown or Unverified beneficiary (+20)
  const isUnknown = !beneficiaryRecord || beneficiaryRecord.status === 'UNVERIFIED';
  if (isUnknown) {
    const points = 20;
    totalScore += points;
    factors.push({
      name: 'Unknown / Unverified Beneficiary',
      points,
      reason: beneficiaryRecord
        ? `Target account is marked as UNVERIFIED (Risk: ${beneficiaryRecord.risk})`
        : 'Beneficiary is not registered in verified internal corporate ledger'
    });
  }

  // 7. High value (+15)
  // Threshold: e.g. >= 50,000 INR
  if (proposedAmount >= 50000) {
    const points = 15;
    totalScore += points;
    factors.push({
      name: 'High Value Transaction',
      points,
      reason: `Transaction value (₹${proposedAmount.toLocaleString()}) reaches high-value audit threshold (≥₹50,000)`
    });
  }

  const displayScore = Math.min(100, totalScore);

  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (totalScore >= 76) {
    level = 'CRITICAL';
  } else if (totalScore >= 51) {
    level = 'HIGH';
  } else if (totalScore >= 21) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  return {
    score: totalScore,
    displayScore,
    level,
    factors
  };
}

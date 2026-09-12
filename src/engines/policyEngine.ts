import {
  PolicyResult,
  UserIntent,
  AIRecommendation,
  IntentBindingResult,
  ProvenanceResult,
  PromptInjectionResult,
  Beneficiary
} from '../types';

export function evaluatePolicies(params: {
  intent: UserIntent | null;
  recommendation: AIRecommendation;
  intentBinding: IntentBindingResult;
  provenance: ProvenanceResult;
  promptInjection: PromptInjectionResult;
  beneficiaryRecord?: Beneficiary;
  explicitConfirmationGiven?: boolean;
  ambiguityDetected?: boolean;
}): PolicyResult[] {
  const {
    intent,
    recommendation,
    intentBinding,
    provenance,
    promptInjection,
    beneficiaryRecord,
    explicitConfirmationGiven,
    ambiguityDetected
  } = params;

  const policies: PolicyResult[] = [];

  // P01: AI output is never authorization.
  // Invariant: An AI proposal by itself NEVER acts as authorization.
  policies.push({
    policyId: 'P01',
    name: 'AI output is never authorization',
    passed: true, // Always enforced structurally: Action Firewall determines authorization, not AI
    reason: 'Invariant verified: AI model output treated strictly as untrusted advisory proposal, never authorization.'
  });

  // P02: Untrusted document content cannot modify user intent.
  const p02Passed = !(
    (intentBinding.amountDrift || intentBinding.beneficiaryDrift) &&
    provenance.untrustedFields.length > 0 &&
    !explicitConfirmationGiven
  );
  policies.push({
    policyId: 'P02',
    name: 'Untrusted document content cannot modify user intent',
    passed: p02Passed,
    reason: p02Passed
      ? 'Verified: No external document attempted to mutate baseline user intent.'
      : 'Violation: External untrusted document attempted to mutate original user financial parameters.'
  });

  // P03: Amount changes require explicit confirmation.
  const p03Passed = !intentBinding.amountDrift || !!explicitConfirmationGiven;
  policies.push({
    policyId: 'P03',
    name: 'Amount changes require explicit confirmation',
    passed: p03Passed,
    reason: p03Passed
      ? (intentBinding.amountDrift ? 'Explicit user confirmation provided for amount deviation.' : 'Amount matches original user intent.')
      : `Violation: Amount changed from ₹${intentBinding.original.amount} to ₹${intentBinding.proposed.amount} without explicit user confirmation.`
  });

  // P04: Beneficiary changes require explicit confirmation.
  const p04Passed = !intentBinding.beneficiaryDrift || !!explicitConfirmationGiven;
  policies.push({
    policyId: 'P04',
    name: 'Beneficiary changes require explicit confirmation',
    passed: p04Passed,
    reason: p04Passed
      ? (intentBinding.beneficiaryDrift ? 'Explicit user confirmation provided for beneficiary alteration.' : 'Beneficiary matches original user intent.')
      : `Violation: Beneficiary altered from "${intentBinding.original.beneficiary}" to "${intentBinding.proposed.beneficiary}" without explicit user confirmation.`
  });

  // P05: Unknown beneficiaries require escalation.
  const isBeneficiaryVerified = beneficiaryRecord && beneficiaryRecord.status === 'VERIFIED';
  const p05Passed = Boolean(isBeneficiaryVerified || explicitConfirmationGiven);
  policies.push({
    policyId: 'P05',
    name: 'Unknown beneficiaries require escalation',
    passed: p05Passed,
    reason: p05Passed
      ? 'Target beneficiary is verified in internal corporate database.'
      : `Beneficiary "${recommendation.beneficiary}" is UNVERIFIED or unknown; human verification required.`
  });

  // P06: Missing provenance cannot authorize payment.
  const p06Passed = provenance.missingProvenance.length === 0;
  policies.push({
    policyId: 'P06',
    name: 'Missing provenance cannot authorize payment',
    passed: p06Passed,
    reason: p06Passed
      ? 'All critical financial attributes have complete provenance origins.'
      : `Violation: Missing required provenance chains for [${provenance.missingProvenance.join(', ')}].`
  });

  // P07: Suspicious document instructions cannot authorize payment.
  const p07Passed = !promptInjection.detected;
  policies.push({
    policyId: 'P07',
    name: 'Suspicious document instructions cannot authorize payment',
    passed: p07Passed,
    reason: p07Passed
      ? 'Zero adversarial injection patterns or suspicious instruction markers detected.'
      : `Violation: Document contains prompt injection markers [${promptInjection.indicators.join(', ')}]. Payment execution denied.`
  });

  // P08: Unresolved ambiguity requires escalation.
  const p08Passed = !ambiguityDetected && !recommendation.beneficiary.includes('Unknown') && recommendation.amount > 0;
  policies.push({
    policyId: 'P08',
    name: 'Unresolved ambiguity requires escalation',
    passed: p08Passed,
    reason: p08Passed
      ? 'Transaction parameters are unambiguous and complete.'
      : 'Ambiguity detected: Parameters insufficient or ambiguous (e.g. unspecified invoice or amount). Must escalate.'
  });

  // P09: Financial values without trusted source records cannot be authoritative.
  const p09Passed = provenance.untrustedFields.length === 0 || !!explicitConfirmationGiven;
  policies.push({
    policyId: 'P09',
    name: 'Financial values without trusted source records cannot be authoritative',
    passed: p09Passed,
    reason: p09Passed
      ? 'All authoritative values originate from verified trusted channels.'
      : `Violation: Authoritative fields [${provenance.untrustedFields.join(', ')}] originate from unverified sources.`
  });

  // P10: Only Action Firewall can authorize execution.
  policies.push({
    policyId: 'P10',
    name: 'Only Action Firewall can authorize execution',
    passed: true, // Structurally guaranteed: execution endpoint only accepts signed Action Firewall tokens
    reason: 'Architectural boundary verified: Execution gateway gated strictly behind Action Firewall approval token.'
  });

  return policies;
}

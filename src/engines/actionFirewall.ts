import {
  UserIntent,
  AIRecommendation,
  ProvenanceResult,
  IntentBindingResult,
  RiskResult,
  PolicyResult,
  ActionFirewallResult,
  Decision,
  PromptInjectionResult
} from '../types';
import { computeSha256 } from '../utils/crypto';

// In-memory token vault for verified authorization tokens
const authorizedTokens = new Map<string, {
  transactionId: string;
  amount: number;
  beneficiary: string;
  timestamp: number;
  consumed: boolean;
}>();

export function authorizeTransaction(params: {
  transactionId: string;
  intent: UserIntent | null;
  recommendation: AIRecommendation;
  provenance: ProvenanceResult;
  intentBinding: IntentBindingResult;
  risk: RiskResult;
  policies: PolicyResult[];
  promptInjection: PromptInjectionResult;
  explicitConfirmationGiven?: boolean;
  modelUnavailable?: boolean;
  ambiguityDetected?: boolean;
}): ActionFirewallResult {
  const {
    transactionId,
    intent,
    recommendation,
    provenance,
    intentBinding,
    risk,
    policies,
    promptInjection,
    explicitConfirmationGiven,
    modelUnavailable,
    ambiguityDetected
  } = params;

  // Track checks independently
  const checks = {
    hasTrustedIntent: !!intent && intent.trusted,
    provenanceValid: provenance.valid,
    intentBindingMatches: intentBinding.matched,
    noBlockingRisk: risk.level !== 'CRITICAL',
    allCriticalPoliciesPass: policies.every(p => p.passed)
  };

  // 1. ESCALATION CHECKS (Missing info, model down, unknown beneficiary, ambiguity)
  if (modelUnavailable || recommendation.modelStatus === 'UNAVAILABLE') {
    return {
      decision: 'ESCALATE',
      reason: 'AI model is unavailable. System entered safe mode. Escalate for human authorization.',
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  if (ambiguityDetected) {
    return {
      decision: 'ESCALATE',
      reason: 'Insufficient trusted information or ambiguous invoice identity. Explicit human confirmation required.',
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  if (!recommendation.amount || recommendation.amount <= 0) {
    return {
      decision: 'ESCALATE',
      reason: 'Amount could not be determined unambiguously. Escalate for human confirmation.',
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  if (!recommendation.beneficiary || recommendation.beneficiary === 'Unknown Beneficiary') {
    return {
      decision: 'ESCALATE',
      reason: 'Beneficiary could not be resolved from trusted database. Escalate for manual verification.',
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  // If unknown beneficiary policy failed and no explicit confirmation
  const p05 = policies.find(p => p.policyId === 'P05');
  if (p05 && !p05.passed) {
    return {
      decision: 'ESCALATE',
      reason: 'Target beneficiary is unverified in corporate records. Requires escalation and human confirmation.',
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  // 2. BLOCK CONDITIONS (Attack, injection + drift, untrusted override, missing provenance, critical risk)
  if (promptInjection.detected && (intentBinding.amountDrift || intentBinding.beneficiaryDrift)) {
    return {
      decision: 'BLOCK',
      reason: `Action Firewall BLOCKED: Prompt injection attack detected with intent drift [${promptInjection.indicators.join(', ')}].`,
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  if (intentBinding.amountDrift && !explicitConfirmationGiven) {
    return {
      decision: 'BLOCK',
      reason: `Action Firewall BLOCKED: Amount drift (Original: ₹${intentBinding.original.amount} vs Proposed: ₹${intentBinding.proposed.amount}) without explicit confirmation.`,
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  if (intentBinding.beneficiaryDrift && !explicitConfirmationGiven) {
    return {
      decision: 'BLOCK',
      reason: `Action Firewall BLOCKED: Beneficiary drift (Original: ${intentBinding.original.beneficiary} vs Proposed: ${intentBinding.proposed.beneficiary}) without explicit confirmation.`,
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  if (risk.level === 'CRITICAL') {
    return {
      decision: 'BLOCK',
      reason: `Action Firewall BLOCKED: Cumulative risk score (${risk.score}) classified as CRITICAL.`,
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  // Check critical security policies
  const failedPolicies = policies.filter(p => !p.passed);
  if (failedPolicies.length > 0) {
    const failedIds = failedPolicies.map(p => `${p.policyId} (${p.name})`).join(', ');
    return {
      decision: 'BLOCK',
      reason: `Action Firewall BLOCKED: Security policies failed: ${failedIds}`,
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  // Missing provenance
  if (provenance.missingProvenance.length > 0) {
    return {
      decision: 'BLOCK',
      reason: `Action Firewall BLOCKED: Missing authoritative provenance records for ${provenance.missingProvenance.join(', ')}.`,
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  // Untrusted source override attempt
  if (provenance.untrustedFields.length > 0 && !explicitConfirmationGiven) {
    return {
      decision: 'BLOCK',
      reason: 'Action Firewall BLOCKED: Untrusted external data attempted to override authoritative financial baseline.',
      authorized: false,
      timestamp: Date.now(),
      checks
    };
  }

  // 3. ALLOW CONDITION
  // Must satisfy all positive requirements
  if (
    intent &&
    intent.trusted &&
    intentBinding.matched &&
    provenance.valid &&
    risk.level === 'LOW' &&
    failedPolicies.length === 0
  ) {
    // Generate tamper-evident authorization token
    const tokenPayload = `${transactionId}:${intent.amount}:${intent.beneficiary}:${Date.now()}`;
    const token = `AUTH-FIREWALL-${computeSha256(tokenPayload).substring(0, 24).toUpperCase()}`;

    authorizedTokens.set(token, {
      transactionId,
      amount: intent.amount,
      beneficiary: intent.beneficiary,
      timestamp: Date.now(),
      consumed: false
    });

    return {
      decision: 'ALLOW',
      reason: 'Action Firewall APPROVED: All provenance verified, intent strictly bound, risk within acceptable baseline, and all security policies passed.',
      authorized: true,
      authorizationToken: token,
      timestamp: Date.now(),
      checks: {
        hasTrustedIntent: true,
        provenanceValid: true,
        intentBindingMatches: true,
        noBlockingRisk: true,
        allCriticalPoliciesPass: true
      }
    };
  }

  // Default safe-fail fallback
  return {
    decision: 'BLOCK',
    reason: 'Action Firewall BLOCKED: Transaction did not meet strict positive authorization criteria.',
    authorized: false,
    timestamp: Date.now(),
    checks
  };
}

export function consumeAuthorizationToken(token: string): {
  valid: boolean;
  data?: { transactionId: string; amount: number; beneficiary: string };
  reason?: string;
} {
  if (!token || !authorizedTokens.has(token)) {
    return { valid: false, reason: 'Invalid or nonexistent authorization token.' };
  }

  const record = authorizedTokens.get(token)!;
  if (record.consumed) {
    return { valid: false, reason: 'Authorization token has already been consumed (anti-replay protection).' };
  }

  // Mark token as consumed
  record.consumed = true;
  return {
    valid: true,
    data: {
      transactionId: record.transactionId,
      amount: record.amount,
      beneficiary: record.beneficiary
    }
  };
}

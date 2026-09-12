export type TrustLevel = 'TRUSTED' | 'UNTRUSTED';

export type TrustSource = 
  // Trusted
  | 'USER_REQUEST'
  | 'VERIFIED_ACCOUNT'
  | 'VERIFIED_BENEFICIARY'
  | 'SYSTEM_POLICY'
  // Untrusted
  | 'SUPPLIER_PDF'
  | 'SUPPLIER_EMAIL'
  | 'OCR_OUTPUT'
  | 'EXTERNAL_TEXT'
  | 'MERCHANT_STRING'
  | 'AI_RECOMMENDATION';

export interface UserIntent {
  intentId: string;
  action: 'PAYMENT' | string;
  amount: number;
  currency: string;
  beneficiary: string;
  purpose: string;
  source: 'USER_REQUEST';
  trusted: true;
  timestamp: number;
  rawText?: string;
  normalizedFrom?: string;
}

export interface AIRecommendation {
  recommendationId: string;
  action: string;
  amount: number;
  currency: string;
  beneficiary: string;
  purpose: string;
  confidence: number;
  evidence: string[];
  modelStatus?: 'ACTIVE' | 'UNAVAILABLE';
  generatedTimestamp: number;
}

export interface FieldProvenance {
  field: 'amount' | 'beneficiary' | 'currency' | 'purpose' | 'action';
  value: any;
  source: TrustSource;
  trust: TrustLevel;
  referenceDocument?: string;
  matchedTrustedIntent?: boolean;
}

export interface ProvenanceResult {
  valid: boolean;
  fields: FieldProvenance[];
  untrustedFields: string[];
  missingProvenance: string[];
  summary: string;
}

export interface PromptInjectionResult {
  detected: boolean;
  indicators: string[];
  source: TrustSource | string;
  suspiciousSnippets: string[];
}

export interface IntentBindingResult {
  matched: boolean;
  amountDrift: boolean;
  beneficiaryDrift: boolean;
  currencyDrift: boolean;
  purposeDrift: boolean;
  actionDrift: boolean;
  original: {
    amount: number;
    beneficiary: string;
    currency: string;
    purpose: string;
    action: string;
  };
  proposed: {
    amount: number;
    beneficiary: string;
    currency: string;
    purpose: string;
    action: string;
  };
  details: string[];
}

export interface RiskFactor {
  name: string;
  points: number;
  reason: string;
}

export interface RiskResult {
  score: number; // 0 - 100+
  displayScore: number; // capped at 100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
}

export interface PolicyResult {
  policyId: 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P07' | 'P08' | 'P09' | 'P10';
  name: string;
  passed: boolean;
  reason: string;
}

export type Decision = 'ALLOW' | 'BLOCK' | 'ESCALATE';

export interface ActionFirewallResult {
  decision: Decision;
  reason: string;
  authorized: boolean;
  authorizationToken?: string;
  timestamp: number;
  checks: {
    hasTrustedIntent: boolean;
    provenanceValid: boolean;
    intentBindingMatches: boolean;
    noBlockingRisk: boolean;
    allCriticalPoliciesPass: boolean;
  };
}

export interface TrustCheckResult {
  passed: boolean;
  trustLevel: TrustLevel;
  sourcesEvaluated: { source: TrustSource; level: TrustLevel }[];
  failureReasons: string[];
}

export interface AuditRecord {
  blockIndex: number;
  blockId: string;
  timestamp: number;
  transactionId: string;
  originalIntent: Partial<UserIntent>;
  aiProposal: Partial<AIRecommendation>;
  evidenceSources: string[];
  trustResult: { result: 'PASS' | 'FAIL'; level: TrustLevel };
  provenanceResult: { valid: boolean; fields: FieldProvenance[] };
  intentResult: { matched: boolean; amountDrift: boolean; beneficiaryDrift: boolean };
  riskScore: number;
  riskFactors: RiskFactor[];
  policyResults: PolicyResult[];
  decision: Decision;
  reason: string;
  previousHash: string;
  currentHash: string;
  tampered?: boolean;
}

export type TransactionState =
  | 'CREATED'
  | 'ANALYZING'
  | 'PROPOSED'
  | 'VALIDATING'
  | 'ALLOWED'
  | 'BLOCKED'
  | 'ESCALATED'
  | 'USER_CONFIRMATION'
  | 'EXECUTED';

export interface TransactionStepLog {
  state: TransactionState;
  timestamp: number;
  message: string;
  metadata?: any;
}

export interface FinancialAccount {
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
}

export interface Beneficiary {
  name: string;
  status: 'VERIFIED' | 'UNVERIFIED';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  accountNumber: string;
  upiId?: string;
}

export interface SimulatedTransaction {
  transactionId: string;
  timestamp: number;
  amount: number;
  currency: string;
  beneficiary: string;
  purpose: string;
  previousBalance: number;
  newBalance: number;
  status: 'EXECUTED' | 'ROLLED_BACK';
  authorizationToken: string;
}

export interface AttackScenario {
  attackId: number;
  name: string;
  category: string;
  description: string;
  userPrompt: string;
  untrustedDocContent: string;
  aiProposal: Partial<AIRecommendation>;
  expectedDecision: Decision;
  expectedRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
}

export interface AttackRunResult {
  attackId: number;
  name: string;
  input: {
    userPrompt: string;
    untrustedDocument: string;
  };
  aiProposal: AIRecommendation;
  trustResult: TrustCheckResult;
  intentResult: IntentBindingResult;
  risk: RiskResult;
  decision: Decision;
  reason: string;
  timeline: string[];
}

export interface PrivacyProofResult {
  proofGenerated: boolean;
  proofType: 'PROTOTYPE PRIVACY PROOF';
  claim: string;
  threshold: number;
  salt: string;
  commitment: string;
  verificationResult: {
    valid: boolean;
    claimHolds: boolean;
    actualBalanceHidden: boolean;
    notes: string;
  };
}

export interface AnalysisResponse {
  transactionId: string;
  decision: 'ALLOW' | 'BLOCK' | 'ESCALATE';
  risk: RiskResult;
  trust: {
    result: 'PASS' | 'FAIL';
    sources: any[];
  };
  provenance: ProvenanceResult;
  intentBinding: IntentBindingResult;
  policies: PolicyResult[];
  firewall: ActionFirewallResult;
  promptInjection: any;
  auditBlock?: AuditRecord;
}


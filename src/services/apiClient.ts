import {
  UserIntent,
  AIRecommendation,
  AnalysisResponse,
  TrustCheckResult,
  ProvenanceResult,
  IntentBindingResult,
  RiskResult,
  PolicyResult,
  ActionFirewallResult,
  AuditRecord,
  SimulatedTransaction,
  FinancialAccount,
  Beneficiary,
  PrivacyProofResult,
  AttackRunResult
} from '../types';
import { trustEngineServiceInstance } from './trustEngine';
import { financialSimulatorInstance } from '../simulator/financialSimulator';
import { auditLedgerInstance } from '../audit/auditLedger';
import { generatePrivacyProof, verifyPrivacyProof } from '../security/privacyProof';
import { simulateModelFailure } from '../security/modelFailure';
import { ATTACK_SCENARIOS, runSingleAttack, runAllAttacksSummary } from '../engines/attackLab';
import { runTestSuite, TestSuiteSummary } from '../tests/trustEngine.test';

export const apiClient = {
  // Intent
  async setIntent(text: string): Promise<UserIntent> {
    try {
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        return data.intent;
      }
    } catch {
      // Fallback to in-process service
    }
    return trustEngineServiceInstance.setIntentFromText(text);
  },

  async getActiveIntent(): Promise<UserIntent | null> {
    try {
      const res = await fetch('/api/intent');
      if (res.ok) {
        const data = await res.json();
        return data.intent;
      }
    } catch {
      // Fallback
    }
    return trustEngineServiceInstance.getActiveIntent();
  },

  // Full Pipeline Analysis
  async analyze(params: {
    intent?: UserIntent | null;
    recommendation: AIRecommendation;
    untrustedDocumentContent?: string;
    explicitConfirmationGiven?: boolean;
    ambiguityDetected?: boolean;
    modelUnavailable?: boolean;
  }): Promise<AnalysisResponse> {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return trustEngineServiceInstance.analyze(params);
  },

  // Financial Simulator
  async getAccount(): Promise<FinancialAccount> {
    try {
      const res = await fetch('/api/account');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return financialSimulatorInstance.getBalance();
  },

  async getBeneficiaries(): Promise<Beneficiary[]> {
    try {
      const res = await fetch('/api/beneficiaries');
      if (res.ok) {
        const data = await res.json();
        return data.beneficiaries;
      }
    } catch {
      // Fallback
    }
    return financialSimulatorInstance.getBeneficiaries();
  },

  async getTransactions(): Promise<SimulatedTransaction[]> {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        return data.transactions;
      }
    } catch {
      // Fallback
    }
    return financialSimulatorInstance.getTransactions();
  },

  async executePayment(params: {
    authorizationToken: string;
    beneficiary: string;
    amount: number;
    currency?: string;
    purpose?: string;
  }): Promise<{ success: boolean; transaction?: SimulatedTransaction; error?: string }> {
    try {
      const res = await fetch('/api/transactions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch {
      // Fallback
    }
    return trustEngineServiceInstance.executePayment(params);
  },

  // Audit Ledger
  async getAuditChain(): Promise<AuditRecord[]> {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        return data.chain;
      }
    } catch {
      // Fallback
    }
    return auditLedgerInstance.getChain();
  },

  async verifyAuditChain(): Promise<{ valid: boolean; invalidBlock: string | null; details?: string }> {
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return auditLedgerInstance.verifyAuditChain();
  },

  async tamperAuditLog(blockId?: string): Promise<any> {
    try {
      const res = await fetch('/api/audit/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return auditLedgerInstance.simulateLogTampering(blockId);
  },

  async restoreAuditLog(): Promise<any> {
    try {
      const res = await fetch('/api/audit/restore', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return auditLedgerInstance.restoreOriginalLog();
  },

  // Privacy Proof
  async generatePrivacyProof(threshold = 50000): Promise<PrivacyProofResult> {
    try {
      const res = await fetch('/api/privacy/prove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return generatePrivacyProof(threshold);
  },

  async verifyPrivacyProof(params: {
    commitment: string;
    salt: string;
    claimHolds: boolean;
    threshold: number;
  }): Promise<any> {
    try {
      const res = await fetch('/api/privacy/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return verifyPrivacyProof(params);
  },

  // Attack Lab
  async getAttacks(): Promise<any[]> {
    try {
      const res = await fetch('/api/attacks');
      if (res.ok) {
        const data = await res.json();
        return data.attacks;
      }
    } catch {
      // Fallback
    }
    return ATTACK_SCENARIOS;
  },

  async runAttack(id: number): Promise<AttackRunResult> {
    try {
      const res = await fetch(`/api/attacks/${id}/run`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return runSingleAttack(id);
  },

  async runAllAttacks(): Promise<any> {
    try {
      const res = await fetch('/api/attacks/run-all', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return runAllAttacksSummary();
  },

  // Demo Narrative
  async runJudgeDemo(): Promise<any> {
    try {
      const res = await fetch('/api/demo/run', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return trustEngineServiceInstance.runJudgeDemoSequence();
  },

  // Model Failure
  async simulateFailure(): Promise<any> {
    try {
      const res = await fetch('/api/model/failure', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return simulateModelFailure();
  },

  // Failure Disclosure
  async getDisclosure(): Promise<any> {
    try {
      const res = await fetch('/api/failures/disclosure');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return trustEngineServiceInstance.getFailureDisclosure();
  },

  // Unit Test Suite
  async runTests(): Promise<TestSuiteSummary> {
    try {
      const res = await fetch('/api/tests/run');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return runTestSuite();
  }
};

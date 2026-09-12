import { firestoreService } from '../firebase/firestore';
import { simulatorService } from './simulatorService';
import { financialSimulatorInstance } from '../simulator/financialSimulator';

export type TransactionStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'PROPOSED'
  | 'VALIDATING'
  | 'ALLOWED'
  | 'EXECUTED'
  | 'BLOCKED'
  | 'ESCALATED'
  | 'ROLLED_BACK';

export interface FirestoreTransactionDoc {
  transactionId: string;
  userId: string;
  originalIntent: {
    action: string;
    amount: number;
    currency: string;
    beneficiary: string;
    purpose: string;
    source: string;
  };
  aiProposal: {
    action: string;
    amount: number;
    currency: string;
    beneficiary: string;
    purpose: string;
    confidence: number;
    source: string;
  };
  trustResult: {
    trustLevel: string;
    source: string;
    reason: string;
  };
  provenance: any[];
  intentBinding: {
    amountMatch: boolean;
    beneficiaryMatch: boolean;
    currencyMatch: boolean;
    purposeMatch: boolean;
    amountDrift: boolean;
    beneficiaryDrift: boolean;
  };
  risk: {
    score: number;
    level: string;
    factors: string[];
  };
  policyResult: {
    passed: boolean;
    failedRules: string[];
  };
  firewallDecision: {
    decision: 'ALLOW' | 'BLOCK' | 'ESCALATE';
    reason: string;
  };
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
}

export const transactionService = {
  async seedDemoTransactions(userId: string): Promise<void> {
    const existing = await firestoreService.queryUserCollection('transactions', userId);
    if (existing.length > 0) return;

    const now = new Date().toISOString();
    const demoTxns: FirestoreTransactionDoc[] = [
      {
        transactionId: `TXN-DEMO-001-${userId.substring(0, 4)}`,
        userId,
        originalIntent: {
          action: 'PAYMENT',
          amount: 18500,
          currency: 'INR',
          beneficiary: 'ABC Supplies',
          purpose: 'Raw material procurement invoice #INV-8812',
          source: 'USER_COMMAND'
        },
        aiProposal: {
          action: 'PAYMENT',
          amount: 18500,
          currency: 'INR',
          beneficiary: 'ABC Supplies',
          purpose: 'Invoice #INV-8812 settlement',
          confidence: 0.99,
          source: 'AI_ADVISORY'
        },
        trustResult: {
          trustLevel: 'TRUSTED',
          source: 'USER_DIRECT_INTENT',
          reason: 'Direct user instruction without external injection drift'
        },
        provenance: [
          { field: 'amount', value: '18500', source: 'USER', trust: 'TRUSTED' },
          { field: 'beneficiary', value: 'ABC Supplies', source: 'USER', trust: 'TRUSTED' }
        ],
        intentBinding: {
          amountMatch: true,
          beneficiaryMatch: true,
          currencyMatch: true,
          purposeMatch: true,
          amountDrift: false,
          beneficiaryDrift: false
        },
        risk: {
          score: 12,
          level: 'LOW',
          factors: []
        },
        policyResult: {
          passed: true,
          failedRules: []
        },
        firewallDecision: {
          decision: 'ALLOW',
          reason: 'Strict invariant satisfied: token bound to verified beneficiary'
        },
        status: 'EXECUTED',
        createdAt: now,
        updatedAt: now,
        executedAt: now
      },
      {
        transactionId: `TXN-DEMO-002-${userId.substring(0, 4)}`,
        userId,
        originalIntent: {
          action: 'PAYMENT',
          amount: 18500,
          currency: 'INR',
          beneficiary: 'ABC Supplies',
          purpose: 'Vendor invoice payment',
          source: 'USER_COMMAND'
        },
        aiProposal: {
          action: 'PAYMENT',
          amount: 81500,
          currency: 'INR',
          beneficiary: 'XYZ Trading',
          purpose: 'Overridden invoice from untrusted attachment',
          confidence: 0.72,
          source: 'ADVERSARIAL_PAYLOAD'
        },
        trustResult: {
          trustLevel: 'UNTRUSTED',
          source: 'INVOICE_XYZ_MALICIOUS.PDF',
          reason: 'Adversarial prompt injection detected in unverified attachment'
        },
        provenance: [
          { field: 'amount', value: '81500', source: 'INVOICE_XYZ.PDF', trust: 'UNTRUSTED' },
          { field: 'beneficiary', value: 'XYZ Trading', source: 'INVOICE_XYZ.PDF', trust: 'UNTRUSTED' }
        ],
        intentBinding: {
          amountMatch: false,
          beneficiaryMatch: false,
          currencyMatch: true,
          purposeMatch: false,
          amountDrift: true,
          beneficiaryDrift: true
        },
        risk: {
          score: 95,
          level: 'CRITICAL',
          factors: ['CRITICAL_AMOUNT_DRIFT', 'UNVERIFIED_BENEFICIARY_HIJACK', 'PROMPT_INJECTION_DETECTED']
        },
        policyResult: {
          passed: false,
          failedRules: ['P02_BENEFICIARY_WHITELIST', 'P03_INTENT_DRIFT_THRESHOLD', 'P07_INJECTION_CONTAINMENT']
        },
        firewallDecision: {
          decision: 'BLOCK',
          reason: 'ACTION FIREWALL TRIPPED: Unauthorized amount drift (₹18,500 -> ₹81,500) and beneficiary swap'
        },
        status: 'BLOCKED',
        createdAt: now,
        updatedAt: now
      },
      {
        transactionId: `TXN-DEMO-003-${userId.substring(0, 4)}`,
        userId,
        originalIntent: {
          action: 'PAYMENT',
          amount: 60000,
          currency: 'INR',
          beneficiary: 'DEF Services',
          purpose: 'Cloud infrastructure support',
          source: 'USER_COMMAND'
        },
        aiProposal: {
          action: 'PAYMENT',
          amount: 60000,
          currency: 'INR',
          beneficiary: 'DEF Services',
          purpose: 'Annual cloud license fee',
          confidence: 0.85,
          source: 'AI_ADVISORY'
        },
        trustResult: {
          trustLevel: 'PARTIALLY_TRUSTED',
          source: 'SCHEDULED_CONTRACT',
          reason: 'Exceeds standard non-dual-control threshold (₹50,000)'
        },
        provenance: [
          { field: 'amount', value: '60000', source: 'CONTRACT_DEF.PDF', trust: 'TRUSTED' },
          { field: 'beneficiary', value: 'DEF Services', source: 'USER', trust: 'TRUSTED' }
        ],
        intentBinding: {
          amountMatch: true,
          beneficiaryMatch: true,
          currencyMatch: true,
          purposeMatch: true,
          amountDrift: false,
          beneficiaryDrift: false
        },
        risk: {
          score: 48,
          level: 'MEDIUM',
          factors: ['HIGH_VALUE_THRESHOLD_EXCEEDED']
        },
        policyResult: {
          passed: false,
          failedRules: ['P01_MAX_SINGLE_TRANSACTION_LIMIT']
        },
        firewallDecision: {
          decision: 'ESCALATE',
          reason: 'DUAL_CONTROL_REQUIRED: Single transaction exceeds standard automatic approval ceiling'
        },
        status: 'ESCALATED',
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const txn of demoTxns) {
      await firestoreService.setDocument('transactions', txn.transactionId, txn);
    }
  },

  async recordTransaction(txn: FirestoreTransactionDoc): Promise<void> {
    await firestoreService.setDocument('transactions', txn.transactionId, txn);
  },

  async executeSimulatedPayment(params: {
    transactionId: string;
    userId: string;
    authorizationToken: string;
    amount: number;
    beneficiary: string;
    currency?: string;
  }): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    // 1. Submit through the cryptographic simulator boundary
    const simResult = financialSimulatorInstance.simulatePayment({
      authorizationToken: params.authorizationToken,
      beneficiary: params.beneficiary,
      amount: params.amount,
      currency: params.currency || 'INR'
    });

    if (!simResult.success || !simResult.transaction) {
      return {
        success: false,
        error: simResult.error || 'Transaction execution declined by Action Firewall gate.'
      };
    }

    // 2. Persist updated transaction status to Firestore
    const now = new Date().toISOString();
    await firestoreService.setDocument('transactions', params.transactionId, {
      status: 'EXECUTED',
      executedAt: now,
      updatedAt: now
    });

    // 3. Update simulator account balance in Firestore
    await simulatorService.updateAccountBalance(params.userId, simResult.transaction.newBalance);

    return {
      success: true,
      newBalance: simResult.transaction.newBalance
    };
  },

  listenTransactions(userId: string, callback: (txns: FirestoreTransactionDoc[]) => void) {
    return firestoreService.listenUserCollection('transactions', userId, callback);
  }
};

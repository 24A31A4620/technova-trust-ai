import { firestoreService } from '../firebase/firestore';
import { auditLedgerInstance } from '../audit/auditLedger';
import { AuditRecord } from '../types';
import { computeSha256 } from '../utils/crypto';

export interface AuditLogDoc {
  auditId: string;
  userId: string;
  transactionId: string;
  timestamp: string;
  eventType: string;
  originalIntent: any;
  aiProposal: any;
  trustResult: any;
  provenance: any;
  intentBinding: any;
  riskResult: any;
  policyResult: any;
  firewallDecision: any;
  previousHash: string;
  currentHash: string;
  integrityStatus: 'VERIFIED' | 'TAMPERED';
}

export const auditService = {
  async persistAuditRecord(userId: string, record: AuditRecord): Promise<void> {
    const auditId = `audit-${userId}-${record.blockId}`;
    const doc: AuditLogDoc = {
      auditId,
      userId,
      transactionId: record.transactionId,
      timestamp: new Date(record.timestamp).toISOString(),
      eventType: 'SECURITY_EVALUATION',
      originalIntent: record.originalIntent,
      aiProposal: record.aiProposal,
      trustResult: record.trustResult,
      provenance: record.provenanceResult,
      intentBinding: record.intentResult,
      riskResult: { score: record.riskScore, factors: record.riskFactors },
      policyResult: record.policyResults,
      firewallDecision: { decision: record.decision, reason: record.reason },
      previousHash: record.previousHash,
      currentHash: record.currentHash,
      integrityStatus: 'VERIFIED'
    };

    await firestoreService.setDocument('auditLogs', auditId, doc);
  },

  async seedDemoAuditChain(userId: string): Promise<void> {
    const existing = await firestoreService.queryUserCollection('auditLogs', userId);
    if (existing.length > 0) return;

    // Seed the local audit ledger chain records into Firestore
    const localRecords = auditLedgerInstance.getChain();
    for (const rec of localRecords) {
      await this.persistAuditRecord(userId, rec);
    }
  },

  listenAuditLogs(userId: string, callback: (logs: AuditLogDoc[]) => void) {
    return firestoreService.listenUserCollection('auditLogs', userId, callback);
  }
};

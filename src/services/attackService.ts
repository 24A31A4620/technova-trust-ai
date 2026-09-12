import { firestoreService } from '../firebase/firestore';

export type AttackType =
  | 'AMOUNT_MANIPULATION'
  | 'BENEFICIARY_HIJACKING'
  | 'HIDDEN_PDF_INSTRUCTION'
  | 'SUPPLIER_EMAIL_INJECTION'
  | 'FAKE_SYSTEM_MESSAGE'
  | 'CURRENCY_MANIPULATION'
  | 'URGENCY_INJECTION'
  | 'INVOICE_REPLACEMENT'
  | 'MULTILINGUAL_INJECTION'
  | 'HALLUCINATED_FINANCIAL_FIGURE';

export interface AttackResultDoc {
  attackId: string;
  userId: string;
  attackType: AttackType;
  input: string;
  maliciousContent: string;
  aiProposal: any;
  trustResult: any;
  provenance: any;
  intentBinding: any;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  policyResult: any;
  firewallDecision: 'BLOCK' | 'ALLOW' | 'ESCALATE';
  result: 'BLOCKED_SUCCESSFULLY' | 'CONTAINED' | 'BYPASSED_FAIL';
  createdAt: string;
}

export const attackService = {
  async recordAttackResult(attack: AttackResultDoc): Promise<void> {
    await firestoreService.setDocument('attackResults', attack.attackId, attack);

    // Update aggregated system metrics
    const metricId = `metric-${attack.userId}`;
    const existingMetric = await firestoreService.getDocument('systemMetrics', metricId);

    const now = new Date().toISOString();
    const updatedMetric = {
      metricId,
      userId: attack.userId,
      attacksTested: (existingMetric?.attacksTested || 0) + 1,
      attacksBlocked:
        (existingMetric?.attacksBlocked || 0) + (attack.firewallDecision === 'BLOCK' ? 1 : 0),
      promptInjectionsDetected:
        (existingMetric?.promptInjectionsDetected || 0) +
        (attack.riskLevel === 'CRITICAL' || attack.riskLevel === 'HIGH' ? 1 : 0),
      updatedAt: now
    };

    await firestoreService.setDocument('systemMetrics', metricId, updatedMetric);
  },

  listenAttackResults(userId: string, callback: (attacks: AttackResultDoc[]) => void) {
    return firestoreService.listenUserCollection('attackResults', userId, callback);
  }
};

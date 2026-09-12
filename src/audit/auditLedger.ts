import { AuditRecord, Decision, FieldProvenance, PolicyResult, RiskFactor } from '../types';
import { computeSha256 } from '../utils/crypto';

class AuditLedger {
  private chain: AuditRecord[] = [];
  private genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
  private blockCounter = 100;
  private backupSnapshot: string | null = null;

  constructor() {
    this.createGenesisBlock();
  }

  private createGenesisBlock() {
    this.blockCounter++;
    const blockId = `BLOCK-${this.blockCounter}`;
    const timestamp = Date.now();
    const payload = `${this.genesisHash}|${timestamp}|TXN-GENESIS|ALLOW|TECHNOVA TRUSTLAYER ROOT ANCHOR`;
    const currentHash = computeSha256(payload);

    const genesisRecord: AuditRecord = {
      blockIndex: 0,
      blockId,
      timestamp,
      transactionId: 'TXN-GENESIS',
      originalIntent: { intentId: 'INTENT-000', amount: 0, beneficiary: 'SYSTEM_ROOT' },
      aiProposal: { recommendationId: 'AI-000', amount: 0, beneficiary: 'SYSTEM_ROOT' },
      evidenceSources: ['SYSTEM_POLICY'],
      trustResult: { result: 'PASS', level: 'TRUSTED' },
      provenanceResult: { valid: true, fields: [] },
      intentResult: { matched: true, amountDrift: false, beneficiaryDrift: false },
      riskScore: 0,
      riskFactors: [],
      policyResults: [],
      decision: 'ALLOW',
      reason: 'TrustLayer Genesis Root Security Anchor Established.',
      previousHash: this.genesisHash,
      currentHash
    };

    this.chain.push(genesisRecord);
  }

  public recordTransaction(params: {
    transactionId: string;
    originalIntent: any;
    aiProposal: any;
    evidenceSources: string[];
    trustResult: { result: 'PASS' | 'FAIL'; level: any };
    provenanceResult: { valid: boolean; fields: FieldProvenance[] };
    intentResult: { matched: boolean; amountDrift: boolean; beneficiaryDrift: boolean };
    riskScore: number;
    riskFactors: RiskFactor[];
    policyResults: PolicyResult[];
    decision: Decision;
    reason: string;
  }): AuditRecord {
    this.blockCounter++;
    const blockIndex = this.chain.length;
    const blockId = `BLOCK-${this.blockCounter}`;
    const timestamp = Date.now();

    const previousHash = this.chain[this.chain.length - 1].currentHash;

    // Calculate tamper-evident hash
    const hashData = [
      previousHash,
      timestamp.toString(),
      params.transactionId,
      params.decision,
      params.originalIntent?.amount?.toString() || '0',
      params.originalIntent?.beneficiary || 'NONE',
      params.aiProposal?.amount?.toString() || '0',
      params.aiProposal?.beneficiary || 'NONE',
      params.riskScore.toString(),
      params.reason
    ].join('|');

    const currentHash = computeSha256(hashData);

    const record: AuditRecord = {
      blockIndex,
      blockId,
      timestamp,
      transactionId: params.transactionId,
      originalIntent: params.originalIntent,
      aiProposal: params.aiProposal,
      evidenceSources: params.evidenceSources,
      trustResult: params.trustResult,
      provenanceResult: params.provenanceResult,
      intentResult: params.intentResult,
      riskScore: params.riskScore,
      riskFactors: params.riskFactors,
      policyResults: params.policyResults,
      decision: params.decision,
      reason: params.reason,
      previousHash,
      currentHash
    };

    this.chain.push(record);
    return record;
  }

  public getChain(): AuditRecord[] {
    return [...this.chain];
  }

  public computeBlockHash(block: AuditRecord, prevHash: string): string {
    const hashData = [
      prevHash,
      block.timestamp.toString(),
      block.transactionId,
      block.decision,
      block.originalIntent?.amount?.toString() || '0',
      block.originalIntent?.beneficiary || 'NONE',
      block.aiProposal?.amount?.toString() || '0',
      block.aiProposal?.beneficiary || 'NONE',
      block.riskScore.toString(),
      block.reason
    ].join('|');

    return computeSha256(hashData);
  }

  public verifyAuditChain(): {
    valid: boolean;
    invalidBlock: string | null;
    expectedHash?: string;
    actualHash?: string;
    details?: string;
  } {
    if (this.chain.length === 0) {
      return { valid: true, invalidBlock: null };
    }

    // Check genesis block
    for (let i = 0; i < this.chain.length; i++) {
      const current = this.chain[i];

      if (i === 0) {
        if (current.previousHash !== this.genesisHash) {
          return {
            valid: false,
            invalidBlock: current.blockId,
            expectedHash: this.genesisHash,
            actualHash: current.previousHash,
            details: 'Genesis block previousHash corrupt'
          };
        }
        continue;
      }

      const previous = this.chain[i - 1];

      // Check linkage: current.previousHash must match previous.currentHash
      if (current.previousHash !== previous.currentHash) {
        return {
          valid: false,
          invalidBlock: current.blockId,
          expectedHash: previous.currentHash,
          actualHash: current.previousHash,
          details: `Linkage break between ${previous.blockId} and ${current.blockId}`
        };
      }

      // Recompute hash for the block
      const calculatedHash = this.computeBlockHash(current, current.previousHash);
      if (calculatedHash !== current.currentHash) {
        return {
          valid: false,
          invalidBlock: current.blockId,
          expectedHash: calculatedHash,
          actualHash: current.currentHash,
          details: `Cryptographic tamper detected: Payload in ${current.blockId} was modified after hash commitment.`
        };
      }
    }

    return { valid: true, invalidBlock: null, details: 'All audit blocks cryptographically linked and verified.' };
  }

  public simulateLogTampering(blockId?: string): {
    tampered: boolean;
    blockId: string;
    fieldTampered: string;
    oldValue: any;
    newValue: any;
  } {
    // Save backup before tampering if not already saved
    if (!this.backupSnapshot) {
      this.backupSnapshot = JSON.stringify(this.chain);
    }

    // Find block to tamper: choose specified or block index 1/2
    let targetIndex = 1;
    if (blockId) {
      const found = this.chain.findIndex(b => b.blockId === blockId);
      if (found !== -1) targetIndex = found;
    } else if (this.chain.length > 1) {
      targetIndex = this.chain.length - 1;
    }

    if (targetIndex >= this.chain.length) {
      targetIndex = 0;
    }

    const targetBlock = this.chain[targetIndex];
    const oldValue = targetBlock.decision;
    const newValue = targetBlock.decision === 'BLOCK' ? 'ALLOW' : 'ALLOW';

    // Covertly alter decision without updating the SHA-256 hash or dependent blocks
    targetBlock.decision = newValue;
    targetBlock.reason = 'COVERT TAMPER: Audit decision flipped in memory to simulate insider ledger manipulation.';
    targetBlock.tampered = true;

    return {
      tampered: true,
      blockId: targetBlock.blockId,
      fieldTampered: 'decision',
      oldValue,
      newValue
    };
  }

  public restoreOriginalLog(): { restored: boolean; message: string } {
    if (this.backupSnapshot) {
      this.chain = JSON.parse(this.backupSnapshot);
      this.backupSnapshot = null;
      return { restored: true, message: 'Tampered ledger restored from authoritative snapshot. Chain validity restored.' };
    }

    // Recalculate genuine hashes if no snapshot
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      block.tampered = false;
      if (block.reason.startsWith('COVERT TAMPER')) {
        block.decision = 'BLOCK';
        block.reason = 'Action Firewall BLOCKED: Untrusted document attempted to modify trusted transaction intent';
      }
      block.previousHash = this.chain[i - 1].currentHash;
      block.currentHash = this.computeBlockHash(block, block.previousHash);
    }

    return { restored: true, message: 'Ledger hashes recalculated to clean state.' };
  }
}

export const auditLedgerInstance = new AuditLedger();

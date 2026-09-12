import { firestoreService } from '../firebase/firestore';

export interface PrivacyProofDoc {
  proofId: string;
  userId: string;
  predicate: string;
  threshold: number;
  commitment: string;
  proof: string;
  verificationResult: 'VALID' | 'INVALID';
  createdAt: string;
}

export const privacyService = {
  async recordPrivacyProof(params: {
    userId: string;
    predicate: string;
    threshold: number;
    commitment: string;
    proofSnippet: string;
    verificationResult: 'VALID' | 'INVALID';
  }): Promise<PrivacyProofDoc> {
    const proofId = `PROOF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const proofDoc: PrivacyProofDoc = {
      proofId,
      userId: params.userId,
      predicate: params.predicate,
      threshold: params.threshold,
      commitment: params.commitment,
      // NOTE: Private balance is STRICTLY omitted from the public proof object.
      proof: params.proofSnippet || 'PROTOTYPE PRIVACY PROOF',
      verificationResult: params.verificationResult,
      createdAt: new Date().toISOString()
    };

    await firestoreService.setDocument('privacyProofs', proofId, proofDoc);
    return proofDoc;
  },

  async getUserPrivacyProofs(userId: string): Promise<PrivacyProofDoc[]> {
    return await firestoreService.queryUserCollection('privacyProofs', userId);
  }
};

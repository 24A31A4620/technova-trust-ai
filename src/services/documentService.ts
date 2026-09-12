import { firestoreService } from '../firebase/firestore';
import { storageService } from '../firebase/storage';

export interface DocumentRecord {
  documentId: string;
  userId: string;
  fileName: string;
  documentType: string;
  sourceType: 'external_upload' | 'supplier_invoice' | 'email_attachment';
  trustLevel: 'UNTRUSTED'; // CARDINAL RULE: Always UNTRUSTED
  storagePath: string;
  extractedText: string;
  injectionDetected: boolean;
  injectionIndicators: string[];
  extractedFinancialFields: {
    amount?: number;
    currency?: string;
    beneficiary?: string;
    accountReference?: string;
  };
  uploadedAt: string;
}

export const documentService = {
  async processAndPersistDocument(params: {
    userId: string;
    fileName: string;
    content: string | Blob;
    documentType: string;
    extractedText: string;
    injectionDetected: boolean;
    injectionIndicators: string[];
    financialFields: {
      amount?: number;
      currency?: string;
      beneficiary?: string;
      accountReference?: string;
    };
  }): Promise<DocumentRecord> {
    const documentId = `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const storageUrl = await storageService.uploadDocument(
      params.userId,
      documentId,
      params.content,
      params.fileName
    );

    const docRecord: DocumentRecord = {
      documentId,
      userId: params.userId,
      fileName: params.fileName,
      documentType: params.documentType,
      sourceType: 'external_upload',
      trustLevel: 'UNTRUSTED', // NEVER converted to TRUSTED
      storagePath: storageUrl,
      extractedText: params.extractedText,
      injectionDetected: params.injectionDetected,
      injectionIndicators: params.injectionIndicators,
      extractedFinancialFields: params.financialFields,
      uploadedAt: new Date().toISOString()
    };

    await firestoreService.setDocument('documents', documentId, docRecord);
    return docRecord;
  },

  async getUserDocuments(userId: string): Promise<DocumentRecord[]> {
    return await firestoreService.queryUserCollection('documents', userId);
  }
};

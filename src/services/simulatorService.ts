import { firestoreService } from '../firebase/firestore';
import { financialSimulatorInstance } from '../simulator/financialSimulator';
import { FinancialAccount, Beneficiary } from '../types';

export interface SimulatorAccountDoc {
  accountId: string;
  userId: string;
  accountName: string;
  currency: string;
  balance: number;
  status: 'active' | 'frozen';
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaryDoc {
  beneficiaryId: string;
  userId: string;
  name: string;
  status: 'verified' | 'unverified';
  riskLevel: 'low' | 'medium' | 'high';
  accountReference: string;
  createdAt: string;
}

export const simulatorService = {
  async ensureDemoData(userId: string): Promise<SimulatorAccountDoc> {
    const accountId = `TN-DEMO-${userId.substring(0, 5).toUpperCase()}`;
    const existing = await firestoreService.getDocument('simulatorAccounts', accountId);

    if (existing) {
      // Sync in-memory balance to persisted balance
      const inMemory = financialSimulatorInstance.getBalance();
      if (inMemory.balance !== existing.balance) {
        // align in-memory
        (financialSimulatorInstance as any).account.balance = existing.balance;
      }
      return existing;
    }

    // Initialize Demo Account
    const now = new Date().toISOString();
    const demoAccount: SimulatorAccountDoc = {
      accountId,
      userId,
      accountName: 'TechNova Demo Business',
      currency: 'INR',
      balance: 150000,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
    await firestoreService.setDocument('simulatorAccounts', accountId, demoAccount);

    // Initialize 3 Default Demo Beneficiaries
    const demoBeneficiaries: BeneficiaryDoc[] = [
      {
        beneficiaryId: `ben-${userId}-abc`,
        userId,
        name: 'ABC Supplies',
        status: 'verified',
        riskLevel: 'low',
        accountReference: 'HDFC-882190-VND',
        createdAt: now
      },
      {
        beneficiaryId: `ben-${userId}-xyz`,
        userId,
        name: 'XYZ Trading',
        status: 'unverified',
        riskLevel: 'high',
        accountReference: 'KYC-PENDING-UNTRUSTED',
        createdAt: now
      },
      {
        beneficiaryId: `ben-${userId}-def`,
        userId,
        name: 'DEF Services',
        status: 'verified',
        riskLevel: 'medium',
        accountReference: 'ICICI-441098-CORP',
        createdAt: now
      }
    ];

    for (const b of demoBeneficiaries) {
      await firestoreService.setDocument('beneficiaries', b.beneficiaryId, b);
    }

    return demoAccount;
  },

  async getAccount(userId: string): Promise<FinancialAccount> {
    const accountId = `TN-DEMO-${userId.substring(0, 5).toUpperCase()}`;
    const doc = await firestoreService.getDocument('simulatorAccounts', accountId);

    if (doc) {
      return {
        accountId: doc.accountId,
        accountName: doc.accountName,
        currency: doc.currency,
        balance: doc.balance
      };
    }

    // Fallback to in-memory simulator state
    const inMem = financialSimulatorInstance.getBalance();
    return {
      accountId: inMem.accountId,
      accountName: inMem.accountName,
      currency: inMem.currency,
      balance: inMem.balance
    };
  },

  async updateAccountBalance(userId: string, newBalance: number): Promise<void> {
    const accountId = `TN-DEMO-${userId.substring(0, 5).toUpperCase()}`;
    await firestoreService.setDocument('simulatorAccounts', accountId, {
      balance: newBalance,
      userId,
      updatedAt: new Date().toISOString()
    });
  },

  async getBeneficiaries(userId: string): Promise<Beneficiary[]> {
    const docs = await firestoreService.queryUserCollection('beneficiaries', userId);
    if (docs.length > 0) {
      return docs.map(d => ({
        name: d.name,
        status: d.status || 'VERIFIED',
        risk: (d.riskLevel || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
        accountNumber: d.accountReference || 'ACC-99999'
      }));
    }
    return financialSimulatorInstance.getBeneficiaries();
  }
};

import { FinancialAccount, Beneficiary } from '../types';

export const INITIAL_ACCOUNT_DATA: FinancialAccount = {
  accountId: 'TN-DEMO-001',
  accountName: 'TECHNOVA DEMO BUSINESS',
  balance: 150000,
  currency: 'INR'
};

export const INITIAL_BENEFICIARIES: Beneficiary[] = [
  {
    name: 'ABC Supplies',
    status: 'VERIFIED',
    risk: 'LOW',
    accountNumber: 'IN-HDFC-009218274',
    upiId: 'abcsupplies@okhdfc'
  },
  {
    name: 'XYZ Trading',
    status: 'UNVERIFIED',
    risk: 'HIGH',
    accountNumber: 'IN-PAYTM-998811234',
    upiId: 'xyztrading@paytm'
  },
  {
    name: 'Apex Industrial',
    status: 'VERIFIED',
    risk: 'LOW',
    accountNumber: 'IN-ICICI-443322119',
    upiId: 'apexind@okicici'
  }
];

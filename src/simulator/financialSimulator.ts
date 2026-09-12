import {
  FinancialAccount,
  Beneficiary,
  SimulatedTransaction
} from '../types';
import { INITIAL_ACCOUNT_DATA, INITIAL_BENEFICIARIES } from '../data/mockAccount';
import { consumeAuthorizationToken } from '../engines/actionFirewall';

class FinancialSimulator {
  private account: FinancialAccount;
  private beneficiaries: Beneficiary[];
  private transactions: SimulatedTransaction[] = [];
  private txnCounter = 1040;

  constructor() {
    this.account = { ...INITIAL_ACCOUNT_DATA };
    this.beneficiaries = [...INITIAL_BENEFICIARIES];
  }

  public getBalance(): { balance: number; currency: string; accountId: string; accountName: string } {
    return {
      balance: this.account.balance,
      currency: this.account.currency,
      accountId: this.account.accountId,
      accountName: this.account.accountName
    };
  }

  public getBeneficiaries(): Beneficiary[] {
    return [...this.beneficiaries];
  }

  public getBeneficiary(name: string): Beneficiary | undefined {
    return this.beneficiaries.find(b => b.name.toLowerCase() === name.toLowerCase());
  }

  public getTransactions(): SimulatedTransaction[] {
    return [...this.transactions];
  }

  /**
   * CRITICAL SECURITY INVARIANT:
   * Payment simulation requires a cryptographic authorization token
   * issued EXCLUSIVELY by the Action Firewall upon positive ALLOW.
   * Frontend or client execution flags are categorically rejected.
   */
  public simulatePayment(params: {
    authorizationToken: string;
    beneficiary: string;
    amount: number;
    currency?: string;
    purpose?: string;
  }): {
    success: boolean;
    transaction?: SimulatedTransaction;
    error?: string;
  } {
    const { authorizationToken, beneficiary, amount, currency = 'INR', purpose = 'Invoice payment' } = params;

    // Verify token with Action Firewall token vault
    const tokenVerification = consumeAuthorizationToken(authorizationToken);
    if (!tokenVerification.valid || !tokenVerification.data) {
      return {
        success: false,
        error: `SIMULATION REJECTED BY TRUSTLAYER: ${tokenVerification.reason || 'Unauthorized money movement attempted without valid Action Firewall clearance.'}`
      };
    }

    // Verify token data bounds match requested execution parameters
    if (tokenVerification.data.amount !== amount || tokenVerification.data.beneficiary.toLowerCase() !== beneficiary.toLowerCase()) {
      return {
        success: false,
        error: 'PARAMETER DRIFT AT EXECUTION GATE: Token parameters do not match requested execution parameters.'
      };
    }

    // Check account balance in simulator
    if (this.account.balance < amount) {
      return {
        success: false,
        error: `INSUFFICIENT SIMULATED FUNDS: Available balance ₹${this.account.balance.toLocaleString()} is less than requested ₹${amount.toLocaleString()}.`
      };
    }

    this.txnCounter++;
    const transactionId = `TXN-${this.txnCounter}`;
    const previousBalance = this.account.balance;
    const newBalance = previousBalance - amount;

    // Mutate state in deterministic simulator ONLY
    this.account.balance = newBalance;

    const record: SimulatedTransaction = {
      transactionId,
      timestamp: Date.now(),
      amount,
      currency,
      beneficiary,
      purpose,
      previousBalance,
      newBalance,
      status: 'EXECUTED',
      authorizationToken
    };

    this.transactions.unshift(record);

    return {
      success: true,
      transaction: record
    };
  }

  public rollbackTransaction(transactionId: string): { success: boolean; message: string } {
    const txn = this.transactions.find(t => t.transactionId === transactionId);
    if (!txn) {
      return { success: false, message: 'Transaction ID not found.' };
    }

    if (txn.status === 'ROLLED_BACK') {
      return { success: false, message: 'Transaction is already marked as rolled back.' };
    }

    // Restore balance
    this.account.balance += txn.amount;
    txn.status = 'ROLLED_BACK';

    return {
      success: true,
      message: `Transaction ${transactionId} reversed. Balance restored to ₹${this.account.balance.toLocaleString()}.`
    };
  }

  public resetDemoState(): void {
    this.account = { ...INITIAL_ACCOUNT_DATA };
    this.beneficiaries = [...INITIAL_BENEFICIARIES];
    this.transactions = [];
    this.txnCounter = 1040;
  }
}

export const financialSimulatorInstance = new FinancialSimulator();

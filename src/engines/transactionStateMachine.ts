import { TransactionState, TransactionStepLog } from '../types';

export class TransactionStateMachine {
  private currentState: TransactionState;
  private history: TransactionStepLog[] = [];
  private confirmationReceived = false;

  constructor(initialState: TransactionState = 'CREATED') {
    this.currentState = initialState;
    this.recordStep(initialState, 'Transaction context initialized.');
  }

  public getState(): TransactionState {
    return this.currentState;
  }

  public getHistory(): TransactionStepLog[] {
    return [...this.history];
  }

  private recordStep(state: TransactionState, message: string, metadata?: any) {
    this.currentState = state;
    this.history.push({
      state,
      timestamp: Date.now(),
      message,
      metadata
    });
  }

  public transitionTo(nextState: TransactionState, reason: string, metadata?: any): boolean {
    const valid = this.isValidTransition(this.currentState, nextState);
    if (!valid) {
      throw new Error(
        `ILLEGAL STATE MACHINE TRANSITION: Cannot transition from ${this.currentState} to ${nextState}. Direct execution without re-validation is strictly forbidden.`
      );
    }

    if (nextState === 'USER_CONFIRMATION') {
      this.confirmationReceived = true;
    }

    this.recordStep(nextState, reason, metadata);
    return true;
  }

  public isValidTransition(from: TransactionState, to: TransactionState): boolean {
    switch (from) {
      case 'CREATED':
        return to === 'ANALYZING';
      case 'ANALYZING':
        return to === 'PROPOSED';
      case 'PROPOSED':
        return to === 'VALIDATING';
      case 'VALIDATING':
        return to === 'ALLOWED' || to === 'BLOCKED' || to === 'ESCALATED';
      case 'ALLOWED':
        return to === 'EXECUTED' || to === 'BLOCKED';
      case 'BLOCKED':
        return false; // Terminal state for this cycle
      case 'ESCALATED':
        return to === 'USER_CONFIRMATION';
      case 'USER_CONFIRMATION':
        // Crucial invariant: ESCALATED -> USER_CONFIRMATION -> MUST go back to VALIDATING
        return to === 'VALIDATING';
      case 'EXECUTED':
        return false; // Terminal
      default:
        return false;
    }
  }

  public hasReceivedConfirmation(): boolean {
    return this.confirmationReceived;
  }
}

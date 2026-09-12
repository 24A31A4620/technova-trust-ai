import { Decision } from '../types';

export interface ModelFailureState {
  aiStatus: 'ACTIVE' | 'UNAVAILABLE';
  trustLayer: 'ACTIVE';
  fallbackMode: 'SAFE_MODE' | 'STANDARD';
  decision: Decision;
  message: string;
  timestamp: number;
}

export function simulateModelFailure(): ModelFailureState {
  return {
    aiStatus: 'UNAVAILABLE',
    trustLayer: 'ACTIVE',
    fallbackMode: 'SAFE_MODE',
    decision: 'ESCALATE',
    message: 'AI unavailable. No financial action was executed. System in deterministic safe fallback mode.',
    timestamp: Date.now()
  };
}

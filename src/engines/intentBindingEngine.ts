import { UserIntent, AIRecommendation, IntentBindingResult } from '../types';

export function bindIntent(
  originalIntent: UserIntent | null,
  aiRecommendation: AIRecommendation
): IntentBindingResult {
  if (!originalIntent) {
    return {
      matched: false,
      amountDrift: true,
      beneficiaryDrift: true,
      currencyDrift: false,
      purposeDrift: false,
      actionDrift: false,
      original: {
        amount: 0,
        beneficiary: 'NONE',
        currency: 'NONE',
        purpose: 'NONE',
        action: 'NONE'
      },
      proposed: {
        amount: aiRecommendation.amount,
        beneficiary: aiRecommendation.beneficiary,
        currency: aiRecommendation.currency,
        purpose: aiRecommendation.purpose,
        action: aiRecommendation.action
      },
      details: ['No baseline original intent registered. Unbound recommendation.']
    };
  }

  const amountDrift = originalIntent.amount !== aiRecommendation.amount;
  const beneficiaryDrift =
    originalIntent.beneficiary.trim().toLowerCase() !==
    aiRecommendation.beneficiary.trim().toLowerCase();
  const currencyDrift =
    originalIntent.currency.trim().toUpperCase() !==
    aiRecommendation.currency.trim().toUpperCase();
  const actionDrift =
    originalIntent.action.trim().toUpperCase() !==
    aiRecommendation.action.trim().toUpperCase();
  const purposeDrift =
    originalIntent.purpose.trim().toLowerCase() !==
    aiRecommendation.purpose.trim().toLowerCase();

  const details: string[] = [];

  if (amountDrift) {
    details.push(
      `Amount Drift Detected: User intended ${originalIntent.currency} ${originalIntent.amount.toLocaleString()}, but AI proposed ${aiRecommendation.currency} ${aiRecommendation.amount.toLocaleString()}.`
    );
  }
  if (beneficiaryDrift) {
    details.push(
      `Beneficiary Drift Detected: User intended "${originalIntent.beneficiary}", but AI proposed "${aiRecommendation.beneficiary}".`
    );
  }
  if (currencyDrift) {
    details.push(
      `Currency Drift Detected: User intended ${originalIntent.currency}, but AI proposed ${aiRecommendation.currency}.`
    );
  }
  if (actionDrift) {
    details.push(
      `Action Drift Detected: User intended ${originalIntent.action}, but AI proposed ${aiRecommendation.action}.`
    );
  }

  const matched = !amountDrift && !beneficiaryDrift && !currencyDrift && !actionDrift;

  return {
    matched,
    amountDrift,
    beneficiaryDrift,
    currencyDrift,
    purposeDrift,
    actionDrift,
    original: {
      amount: originalIntent.amount,
      beneficiary: originalIntent.beneficiary,
      currency: originalIntent.currency,
      purpose: originalIntent.purpose,
      action: originalIntent.action
    },
    proposed: {
      amount: aiRecommendation.amount,
      beneficiary: aiRecommendation.beneficiary,
      currency: aiRecommendation.currency,
      purpose: aiRecommendation.purpose,
      action: aiRecommendation.action
    },
    details: details.length > 0 ? details : ['Recommendation strictly matches original user intent.']
  };
}

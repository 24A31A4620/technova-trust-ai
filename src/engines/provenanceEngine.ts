import { FieldProvenance, ProvenanceResult, UserIntent, AIRecommendation, TrustSource } from '../types';
import { classifyTrustSource } from './trustCheck';

export function traceProvenance(
  intent: UserIntent | null,
  recommendation: AIRecommendation,
  untrustedDocSource: TrustSource = 'SUPPLIER_PDF',
  referenceDocName = 'invoice_payload.pdf'
): ProvenanceResult {
  const fields: FieldProvenance[] = [];
  const untrustedFields: string[] = [];
  const missingProvenance: string[] = [];

  // 1. Amount Provenance
  if (!recommendation.amount || isNaN(recommendation.amount)) {
    missingProvenance.push('amount');
  } else if (intent && intent.amount === recommendation.amount) {
    fields.push({
      field: 'amount',
      value: recommendation.amount,
      source: 'USER_REQUEST',
      trust: 'TRUSTED',
      matchedTrustedIntent: true
    });
  } else {
    // Differs from user intent or intent was absent: provenance is from untrusted doc
    fields.push({
      field: 'amount',
      value: recommendation.amount,
      source: untrustedDocSource,
      trust: classifyTrustSource(untrustedDocSource),
      referenceDocument: referenceDocName,
      matchedTrustedIntent: false
    });
    untrustedFields.push('amount');
  }

  // 2. Beneficiary Provenance
  if (!recommendation.beneficiary || recommendation.beneficiary === 'Unknown Beneficiary') {
    missingProvenance.push('beneficiary');
  } else if (intent && intent.beneficiary.toLowerCase() === recommendation.beneficiary.toLowerCase()) {
    fields.push({
      field: 'beneficiary',
      value: recommendation.beneficiary,
      source: 'USER_REQUEST',
      trust: 'TRUSTED',
      matchedTrustedIntent: true
    });
  } else {
    fields.push({
      field: 'beneficiary',
      value: recommendation.beneficiary,
      source: untrustedDocSource,
      trust: classifyTrustSource(untrustedDocSource),
      referenceDocument: referenceDocName,
      matchedTrustedIntent: false
    });
    untrustedFields.push('beneficiary');
  }

  // 3. Currency Provenance
  if (!recommendation.currency) {
    missingProvenance.push('currency');
  } else if (intent && intent.currency === recommendation.currency) {
    fields.push({
      field: 'currency',
      value: recommendation.currency,
      source: 'USER_REQUEST',
      trust: 'TRUSTED',
      matchedTrustedIntent: true
    });
  } else {
    fields.push({
      field: 'currency',
      value: recommendation.currency,
      source: untrustedDocSource,
      trust: classifyTrustSource(untrustedDocSource),
      matchedTrustedIntent: false
    });
    untrustedFields.push('currency');
  }

  // 4. Purpose Provenance
  if (!recommendation.purpose) {
    missingProvenance.push('purpose');
  } else if (intent && intent.purpose.toLowerCase() === recommendation.purpose.toLowerCase()) {
    fields.push({
      field: 'purpose',
      value: recommendation.purpose,
      source: 'USER_REQUEST',
      trust: 'TRUSTED',
      matchedTrustedIntent: true
    });
  } else {
    fields.push({
      field: 'purpose',
      value: recommendation.purpose,
      source: untrustedDocSource,
      trust: classifyTrustSource(untrustedDocSource),
      matchedTrustedIntent: false
    });
  }

  const valid = missingProvenance.length === 0 && untrustedFields.length === 0;

  let summary = 'All financial fields traced to verified, trusted user provenance.';
  if (missingProvenance.length > 0) {
    summary = `Missing authoritative provenance for: ${missingProvenance.join(', ')}.`;
  } else if (untrustedFields.length > 0) {
    summary = `Untrusted provenance detected for: ${untrustedFields.join(', ')}. Values derived from external unverified data.`;
  }

  return {
    valid,
    fields,
    untrustedFields,
    missingProvenance,
    summary
  };
}

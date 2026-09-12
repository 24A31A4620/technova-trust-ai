import { TrustLevel, TrustSource, TrustCheckResult } from '../types';

export const TRUSTED_SOURCES: Set<TrustSource> = new Set([
  'USER_REQUEST',
  'VERIFIED_ACCOUNT',
  'VERIFIED_BENEFICIARY',
  'SYSTEM_POLICY'
]);

export const UNTRUSTED_SOURCES: Set<TrustSource> = new Set([
  'SUPPLIER_PDF',
  'SUPPLIER_EMAIL',
  'OCR_OUTPUT',
  'EXTERNAL_TEXT',
  'MERCHANT_STRING',
  'AI_RECOMMENDATION'
]);

export function classifyTrustSource(source: TrustSource): TrustLevel {
  return TRUSTED_SOURCES.has(source) ? 'TRUSTED' : 'UNTRUSTED';
}

export function evaluateSourcesTrust(sources: TrustSource[]): TrustCheckResult {
  const evaluated = sources.map(s => ({
    source: s,
    level: classifyTrustSource(s)
  }));

  const untrustedList = evaluated.filter(e => e.level === 'UNTRUSTED');
  const failureReasons: string[] = [];

  if (untrustedList.length > 0) {
    failureReasons.push(
      `Detected ${untrustedList.length} untrusted source(s): ${untrustedList.map(u => u.source).join(', ')}. Evidence only; not authority.`
    );
  }

  // A pure trust check fails if any critical field relies purely on untrusted origin without trusted user confirmation
  return {
    passed: untrustedList.length === 0,
    trustLevel: untrustedList.length === 0 ? 'TRUSTED' : 'UNTRUSTED',
    sourcesEvaluated: evaluated,
    failureReasons
  };
}

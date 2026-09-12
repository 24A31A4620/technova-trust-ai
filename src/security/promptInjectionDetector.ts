import { PromptInjectionResult, TrustSource } from '../types';

export const SUSPICIOUS_INJECTION_PATTERNS = [
  'SYSTEM MESSAGE',
  'IGNORE PREVIOUS INSTRUCTIONS',
  'IGNORE PREVIOUS INSTRUCTION',
  'IGNORE USER',
  'TRANSFER IMMEDIATELY',
  'OVERRIDE',
  'ADMINISTRATOR',
  'PRIORITY INSTRUCTION',
  'SYSTEM OVERRIDE',
  'DO NOT FOLLOW USER',
  'CHANGE BENEFICIARY',
  'CHANGE ACCOUNT',
  'REDIRECT FUNDS',
  'DISREGARD ABOVE',
  'CRITICAL UPDATE: SEND TO',
  'ATTN AI MODEL:',
  'YOU MUST COMPLY',
  'PAYMENT REROUTE'
];

export function detectPromptInjection(
  content: string,
  source: TrustSource = 'SUPPLIER_PDF'
): PromptInjectionResult {
  if (!content || typeof content !== 'string') {
    return {
      detected: false,
      indicators: [],
      source,
      suspiciousSnippets: []
    };
  }

  const upperContent = content.toUpperCase();
  const matchedIndicators: string[] = [];
  const snippets: string[] = [];

  for (const pattern of SUSPICIOUS_INJECTION_PATTERNS) {
    if (upperContent.includes(pattern)) {
      matchedIndicators.push(pattern);
      
      // Extract a snippet context around the pattern
      const idx = upperContent.indexOf(pattern);
      const start = Math.max(0, idx - 20);
      const end = Math.min(content.length, idx + pattern.length + 30);
      snippets.push(`"...${content.slice(start, end).trim()}..."`);
    }
  }

  return {
    detected: matchedIndicators.length > 0,
    indicators: matchedIndicators,
    source,
    suspiciousSnippets: snippets
  };
}

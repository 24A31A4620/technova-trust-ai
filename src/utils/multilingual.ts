import { UserIntent } from '../types';

export interface NormalizedIntentDraft {
  action: 'PAYMENT' | string;
  amount: number;
  currency: string;
  beneficiary: string;
  purpose: string;
  rawText: string;
  languageDetected?: string;
}

export function normalizeFinancialPrompt(input: string): NormalizedIntentDraft {
  const text = input.trim();
  let language = 'ENGLISH';

  // Detect language markers
  if (text.includes('cheyyi') || text.includes('ki ') || text.includes('చెయ్యి')) {
    language = 'TELUGU';
  } else if (text.includes('karo') || text.includes('ko ') || text.includes('rupees transfer') || text.includes('करो')) {
    language = 'HINDI';
  } else if (text.includes('பண்ணு') || text.includes('-க்கு') || text.includes('pay pannu')) {
    language = 'TAMIL';
  } else if (text.includes('bhejo') || text.includes('de do')) {
    language = 'HINDI';
  }

  // Extract amount: e.g. ₹18,500, Rs. 18,500, 18500 rupees, 81,500
  let amount = 0;
  let currency = 'INR';

  if (text.includes('$') || text.toLowerCase().includes('usd')) {
    currency = 'USD';
  } else if (text.includes('€') || text.toLowerCase().includes('eur')) {
    currency = 'EUR';
  }

  // Clean numbers like 18,500 or ₹18500
  const amountMatch = text.match(/(?:₹|Rs\.?|INR|\$|€)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
  if (amountMatch && amountMatch[1]) {
    const cleanNum = amountMatch[1].replace(/,/g, '');
    const parsed = parseFloat(cleanNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  // Extract Beneficiary: e.g. "ABC Supplies", "XYZ Trading"
  let beneficiary = '';
  const knownBeneficiaries = ['ABC Supplies', 'XYZ Trading', 'Apex Industrial', 'Quantum Logistics', 'Global Tech Vendors'];
  
  for (const name of knownBeneficiaries) {
    const regex = new RegExp(name, 'i');
    if (regex.test(text)) {
      beneficiary = name;
      break;
    }
  }

  if (!beneficiary) {
    // Try regex patterns like:
    // "Pay ₹18,500 to ABC Supplies"
    // "ABC Supplies ko..."
    // "ABC Supplies ki..."
    // "ABC Supplies-க்கு..."
    const toMatch = text.match(/to\s+([A-Za-z0-9\s]+?)(?:\.|\s+for|\s+invoice|$)/i);
    const hindiMatch = text.match(/^([A-Za-z0-9\s]+?)(?:\s+ko|\s+ki|-க்கு|\s+for)/i);
    
    if (toMatch && toMatch[1]) {
      beneficiary = toMatch[1].trim();
    } else if (hindiMatch && hindiMatch[1]) {
      beneficiary = hindiMatch[1].trim();
    } else {
      beneficiary = 'Unknown Beneficiary';
    }
  }

  // Extract Purpose
  let purpose = 'Invoice payment';
  const purposeMatch = text.match(/for\s+([A-Za-z0-9\s\-]+?)(?:\.|$)/i);
  if (purposeMatch && purposeMatch[1]) {
    purpose = purposeMatch[1].trim();
  }

  return {
    action: 'PAYMENT',
    amount,
    currency,
    beneficiary,
    purpose,
    rawText: text,
    languageDetected: language
  };
}

export function createImmutableIntent(draft: NormalizedIntentDraft): UserIntent {
  return {
    intentId: `INTENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: draft.action || 'PAYMENT',
    amount: draft.amount,
    currency: draft.currency || 'INR',
    beneficiary: draft.beneficiary,
    purpose: draft.purpose || 'Invoice payment',
    source: 'USER_REQUEST',
    trusted: true,
    timestamp: Date.now(),
    rawText: draft.rawText,
    normalizedFrom: draft.languageDetected
  };
}

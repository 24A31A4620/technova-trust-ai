import { Router, Request, Response } from 'express';
import { trustEngineServiceInstance } from '../services/trustEngine';
import { financialSimulatorInstance } from '../simulator/financialSimulator';
import { auditLedgerInstance } from '../audit/auditLedger';
import { generatePrivacyProof, verifyPrivacyProof } from '../security/privacyProof';
import { simulateModelFailure } from '../security/modelFailure';
import { ATTACK_SCENARIOS, runSingleAttack, runAllAttacksSummary } from '../engines/attackLab';
import { runTestSuite } from '../tests/trustEngine.test';
import { evaluateSourcesTrust } from '../engines/trustCheck';
import { traceProvenance } from '../engines/provenanceEngine';
import { bindIntent } from '../engines/intentBindingEngine';
import { calculateRisk } from '../engines/riskEngine';
import { evaluatePolicies } from '../engines/policyEngine';
import { authorizeTransaction } from '../engines/actionFirewall';
import { detectPromptInjection } from '../security/promptInjectionDetector';

export const apiRouter = Router();

// POST /api/intent
apiRouter.post('/intent', (req: Request, res: Response) => {
  try {
    const { text, intent } = req.body;
    let saved;
    if (text) {
      saved = trustEngineServiceInstance.setIntentFromText(text);
    } else if (intent) {
      saved = trustEngineServiceInstance.setExplicitIntent(intent);
    } else {
      return res.status(400).json({ error: 'Provide text or intent object.' });
    }
    return res.json({ success: true, intent: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/intent
apiRouter.get('/intent', (req: Request, res: Response) => {
  const intent = trustEngineServiceInstance.getActiveIntent();
  return res.json({ intent });
});

// POST /api/recommendation
// Validates structured AI recommendation contract
apiRouter.post('/recommendation', (req: Request, res: Response) => {
  try {
    const rec = req.body;
    if (!rec || typeof rec.amount !== 'number' || !rec.beneficiary || !rec.action) {
      return res.status(400).json({
        valid: false,
        error: 'REJECTED: Recommendation violates structured data contract. Required: action, amount, beneficiary.'
      });
    }
    return res.json({ valid: true, recommendation: rec });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/analyze - Full pipeline execution
apiRouter.post('/analyze', (req: Request, res: Response) => {
  try {
    const {
      intent,
      recommendation,
      untrustedDocumentContent,
      explicitConfirmationGiven,
      ambiguityDetected,
      modelUnavailable,
      referenceDocName
    } = req.body;

    if (!recommendation) {
      return res.status(400).json({ error: 'AI Recommendation object required.' });
    }

    const result = trustEngineServiceInstance.analyze({
      intent,
      recommendation,
      untrustedDocumentContent,
      explicitConfirmationGiven,
      ambiguityDetected,
      modelUnavailable,
      referenceDocName
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/trust/check
apiRouter.post('/trust/check', (req: Request, res: Response) => {
  try {
    const { sources } = req.body;
    const result = evaluateSourcesTrust(sources || ['USER_REQUEST', 'SUPPLIER_PDF']);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/provenance
apiRouter.post('/provenance', (req: Request, res: Response) => {
  try {
    const { intent, recommendation, source, referenceDoc } = req.body;
    const result = traceProvenance(intent, recommendation, source, referenceDoc);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/intent-binding
apiRouter.post('/intent-binding', (req: Request, res: Response) => {
  try {
    const { intent, recommendation } = req.body;
    const result = bindIntent(intent, recommendation);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/risk
apiRouter.post('/risk', (req: Request, res: Response) => {
  try {
    const { intentBinding, provenance, promptInjection, beneficiary, proposedAmount } = req.body;
    const benRecord = financialSimulatorInstance.getBeneficiary(beneficiary || '');
    const result = calculateRisk({
      intentBinding,
      provenance,
      promptInjection: promptInjection || { detected: false, indicators: [], source: 'SUPPLIER_PDF', suspiciousSnippets: [] },
      beneficiaryRecord: benRecord,
      hasUntrustedInstruction: promptInjection?.detected,
      proposedAmount: proposedAmount || 0
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/policy
apiRouter.post('/policy', (req: Request, res: Response) => {
  try {
    const { intent, recommendation, intentBinding, provenance, promptInjection, explicitConfirmationGiven } = req.body;
    const benRecord = financialSimulatorInstance.getBeneficiary(recommendation?.beneficiary || '');
    const result = evaluatePolicies({
      intent,
      recommendation,
      intentBinding,
      provenance,
      promptInjection,
      beneficiaryRecord: benRecord,
      explicitConfirmationGiven
    });
    return res.json({ policies: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/firewall/authorize
apiRouter.post('/firewall/authorize', (req: Request, res: Response) => {
  try {
    const {
      transactionId = 'TXN-DIRECT',
      intent,
      recommendation,
      provenance,
      intentBinding,
      risk,
      policies,
      promptInjection,
      explicitConfirmationGiven
    } = req.body;

    const result = authorizeTransaction({
      transactionId,
      intent,
      recommendation,
      provenance,
      intentBinding,
      risk,
      policies,
      promptInjection: promptInjection || { detected: false, indicators: [], source: 'SUPPLIER_PDF', suspiciousSnippets: [] },
      explicitConfirmationGiven
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions/execute
apiRouter.post('/transactions/execute', (req: Request, res: Response) => {
  try {
    const { authorizationToken, beneficiary, amount, currency, purpose } = req.body;

    if (!authorizationToken) {
      return res.status(403).json({
        success: false,
        error: 'CRITICAL SECURITY ERROR: Direct client execution forbidden. Requires backend Action Firewall authorization token.'
      });
    }

    const execution = trustEngineServiceInstance.executePayment({
      authorizationToken,
      beneficiary,
      amount,
      currency,
      purpose
    });

    if (!execution.success) {
      return res.status(403).json(execution);
    }

    return res.json(execution);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions
apiRouter.get('/transactions', (req: Request, res: Response) => {
  const txns = financialSimulatorInstance.getTransactions();
  return res.json({ transactions: txns });
});

// GET /api/account
apiRouter.get('/account', (req: Request, res: Response) => {
  const account = financialSimulatorInstance.getBalance();
  return res.json(account);
});

// GET /api/beneficiaries
apiRouter.get('/beneficiaries', (req: Request, res: Response) => {
  const list = financialSimulatorInstance.getBeneficiaries();
  return res.json({ beneficiaries: list });
});

// GET /api/audit
apiRouter.get('/audit', (req: Request, res: Response) => {
  const chain = auditLedgerInstance.getChain();
  return res.json({ chain, length: chain.length });
});

// POST /api/audit/verify
apiRouter.post('/audit/verify', (req: Request, res: Response) => {
  const verification = auditLedgerInstance.verifyAuditChain();
  return res.json(verification);
});

// POST /api/audit/tamper
apiRouter.post('/audit/tamper', (req: Request, res: Response) => {
  const { blockId } = req.body;
  const result = auditLedgerInstance.simulateLogTampering(blockId);
  return res.json(result);
});

// POST /api/audit/restore
apiRouter.post('/audit/restore', (req: Request, res: Response) => {
  const result = auditLedgerInstance.restoreOriginalLog();
  return res.json(result);
});

// POST /api/privacy/prove
apiRouter.post('/privacy/prove', (req: Request, res: Response) => {
  const { threshold = 50000 } = req.body;
  const proof = generatePrivacyProof(threshold);
  return res.json(proof);
});

// POST /api/privacy/verify
apiRouter.post('/privacy/verify', (req: Request, res: Response) => {
  const { commitment, salt, claimHolds, threshold } = req.body;
  const verification = verifyPrivacyProof({ commitment, salt, claimHolds, threshold });
  return res.json(verification);
});

// GET /api/attacks
apiRouter.get('/attacks', (req: Request, res: Response) => {
  return res.json({ attacks: ATTACK_SCENARIOS });
});

// POST /api/attacks/:id/run
apiRouter.post('/attacks/:id/run', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const result = runSingleAttack(id);
  return res.json(result);
});

// POST /api/attacks/run-all
apiRouter.post('/attacks/run-all', (req: Request, res: Response) => {
  const summary = runAllAttacksSummary();
  return res.json(summary);
});

// POST /api/demo/run
apiRouter.post('/demo/run', (req: Request, res: Response) => {
  const demoNarrative = trustEngineServiceInstance.runJudgeDemoSequence();
  return res.json(demoNarrative);
});

// POST /api/model/failure
apiRouter.post('/model/failure', (req: Request, res: Response) => {
  const failure = simulateModelFailure();
  return res.json(failure);
});

// GET /api/failures/disclosure
apiRouter.get('/failures/disclosure', (req: Request, res: Response) => {
  const disclosure = trustEngineServiceInstance.getFailureDisclosure();
  return res.json(disclosure);
});

// GET /api/tests/run
apiRouter.get('/tests/run', (req: Request, res: Response) => {
  const summary = runTestSuite();
  return res.json(summary);
});

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Cpu,
  User,
  GitFork,
  Activity,
  Lock,
  Landmark,
  Play,
  RotateCcw,
  Zap
} from 'lucide-react';
import { AnalysisResponse } from '../types';

interface TrustFlowVisualizerProps {
  analysisResult: AnalysisResponse | null;
  loading: boolean;
  onReplay?: () => void;
}

interface FlowModule {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'PENDING' | 'ACTIVE' | 'PASS' | 'FAIL' | 'WARN';
  headline: string;
  detail: string;
  metric?: string;
}

export const TrustFlowVisualizer: React.FC<TrustFlowVisualizerProps> = ({
  analysisResult,
  loading,
  onReplay
}) => {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timerRef.current.forEach((t) => clearTimeout(t));
    timerRef.current = [];
  };

  // Run or re-run the real-time animation whenever analysisResult updates or during loading
  useEffect(() => {
    clearAllTimers();

    if (loading) {
      setActiveStep(0);
      setAnimationComplete(false);
      // Progressive simulation while backend runs
      const t1 = setTimeout(() => setActiveStep(1), 200);
      const t2 = setTimeout(() => setActiveStep(2), 400);
      timerRef.current.push(t1, t2);
      return;
    }

    if (analysisResult) {
      setActiveStep(0);
      setAnimationComplete(false);

      // 9 steps total (0 to 8)
      const stepDuration = 260;
      for (let i = 0; i <= 8; i++) {
        const timer = setTimeout(() => {
          setActiveStep(i);
          if (i === 8) {
            setAnimationComplete(true);
          }
        }, i * stepDuration);
        timerRef.current.push(timer);
      }
    } else {
      setActiveStep(-1);
      setAnimationComplete(false);
    }

    return () => clearAllTimers();
  }, [analysisResult, loading]);

  const handleManualReplay = () => {
    if (!analysisResult) return;
    clearAllTimers();
    setActiveStep(0);
    setAnimationComplete(false);

    const stepDuration = 280;
    for (let i = 0; i <= 8; i++) {
      const timer = setTimeout(() => {
        setActiveStep(i);
        if (i === 8) {
          setAnimationComplete(true);
        }
      }, i * stepDuration);
      timerRef.current.push(timer);
    }

    if (onReplay) onReplay();
  };

  // Derive status details for each security module from analysisResult
  const getModules = (): FlowModule[] => {
    if (!analysisResult) {
      return [
        {
          id: 'user_intent',
          name: 'USER INTENT',
          role: 'AUTHORITATIVE BASELINE',
          icon: User,
          status: 'PENDING',
          headline: 'Awaiting Prompt',
          detail: 'Captures and locks intent'
        },
        {
          id: 'ai_advisory',
          name: 'AI / LLM ADVISORY',
          role: 'STRUCTURED RECOMMENDATION',
          icon: Cpu,
          status: 'PENDING',
          headline: 'Schema Extraction',
          detail: 'Evidence only — never authority'
        },
        {
          id: 'trust_boundary',
          name: 'TRUST BOUNDARY',
          role: 'ISOLATION PERIMETER',
          icon: Shield,
          status: 'PENDING',
          headline: 'Source Classification',
          detail: 'Trusted vs. Untrusted partition'
        },
        {
          id: 'provenance',
          name: 'PROVENANCE',
          role: 'FIELD ORIGIN TRACE',
          icon: GitFork,
          status: 'PENDING',
          headline: 'Origin Verification',
          detail: 'Validates source of amount & payee'
        },
        {
          id: 'intent_binding',
          name: 'INTENT BINDING',
          role: 'DRIFT DETECTOR',
          icon: CheckCircle2,
          status: 'PENDING',
          headline: 'Parameter Lock',
          detail: 'Detects amount/beneficiary drift'
        },
        {
          id: 'risk_engine',
          name: 'RISK ENGINE',
          role: 'ANOMALY SCORING',
          icon: Activity,
          status: 'PENDING',
          headline: 'Multi-Factor Scoring',
          detail: 'Evaluates injection & risk scores'
        },
        {
          id: 'policy_engine',
          name: 'POLICY ENGINE',
          role: 'P01-P10 RULES',
          icon: Shield,
          status: 'PENDING',
          headline: 'Deterministic Policies',
          detail: 'Enforces limits and whitelists'
        },
        {
          id: 'action_firewall',
          name: 'ACTION FIREWALL',
          role: 'TOKEN GATEKEEPER',
          icon: Lock,
          status: 'PENDING',
          headline: 'Single-Use Auth Token',
          detail: 'ALLOW / BLOCK / ESCALATE'
        },
        {
          id: 'simulator',
          name: 'FINANCIAL SIMULATOR',
          role: 'EXECUTION BOUNDARY',
          icon: Landmark,
          status: 'PENDING',
          headline: 'Balance Vault',
          detail: 'Zero money moves without token'
        }
      ];
    }

    const intent = analysisResult.intentBinding.original;
    const proposed = analysisResult.intentBinding.proposed;
    const hasDrift = analysisResult.intentBinding.amountDrift || analysisResult.intentBinding.beneficiaryDrift;
    const injection = analysisResult.promptInjection.detected;
    const riskLevel = analysisResult.risk.level;
    const decision = analysisResult.decision;
    const policiesPassed = analysisResult.policies.filter((p) => p.passed).length;
    const totalPolicies = analysisResult.policies.length;

    return [
      {
        id: 'user_intent',
        name: 'USER INTENT',
        role: 'AUTHORITATIVE BASELINE',
        icon: User,
        status: 'PASS',
        headline: intent.amount > 0 ? `₹${intent.amount.toLocaleString()} INR` : 'Intent Captured',
        detail: intent.beneficiary ? `Beneficiary: ${intent.beneficiary}` : 'Normalized User Command',
        metric: 'IMMUTABLE'
      },
      {
        id: 'ai_advisory',
        name: 'AI / LLM ADVISORY',
        role: 'STRUCTURED RECOMMENDATION',
        icon: Cpu,
        status: injection ? 'FAIL' : 'PASS',
        headline: proposed.amount > 0 ? `Proposed ₹${proposed.amount.toLocaleString()}` : 'Schema Validated',
        detail: injection ? 'Adversarial override payload detected' : `Payee: ${proposed.beneficiary}`,
        metric: injection ? 'INJECTION DETECTED' : 'ADVISORY SCHEMA'
      },
      {
        id: 'trust_boundary',
        name: 'TRUST BOUNDARY',
        role: 'ISOLATION PERIMETER',
        icon: Shield,
        status: analysisResult.trust.result === 'PASS' ? 'PASS' : 'WARN',
        headline: analysisResult.trust.result === 'PASS' ? 'Perimeter Secure' : 'Untrusted Input Partitioned',
        detail: `${analysisResult.trust.sources.length} sources partitioned & tagged`,
        metric: 'ISOLATED'
      },
      {
        id: 'provenance',
        name: 'PROVENANCE',
        role: 'FIELD ORIGIN TRACE',
        icon: GitFork,
        status: analysisResult.provenance.fields.every((f) => f.trust === 'TRUSTED') ? 'PASS' : 'WARN',
        headline: analysisResult.provenance.summary.split('.')[0] || 'Field Origins Mapped',
        detail: `${analysisResult.provenance.fields.length} parameter origins traced`,
        metric: 'ORIGIN TRACKED'
      },
      {
        id: 'intent_binding',
        name: 'INTENT BINDING',
        role: 'DRIFT DETECTOR',
        icon: hasDrift ? 'FAIL' : 'PASS',
        status: hasDrift ? 'FAIL' : 'PASS',
        headline: hasDrift ? 'Parameter Drift Detected' : 'Intent 100% Bound',
        detail: hasDrift
          ? `${analysisResult.intentBinding.amountDrift ? 'Amount Drift ' : ''}${
              analysisResult.intentBinding.beneficiaryDrift ? 'Payee Drift' : ''
            }`
          : 'Proposal exactly mirrors user intent',
        metric: hasDrift ? 'DRIFT ALERT' : 'ZERO DRIFT'
      },
      {
        id: 'risk_engine',
        name: 'RISK ENGINE',
        role: 'ANOMALY SCORING',
        icon: Activity,
        status: riskLevel === 'LOW' ? 'PASS' : riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'FAIL' : 'WARN',
        headline: `Risk Score: ${analysisResult.risk.score}/100`,
        detail: `${analysisResult.risk.factors.length} anomaly factor(s) flagged`,
        metric: `[${riskLevel}]`
      },
      {
        id: 'policy_engine',
        name: 'POLICY ENGINE',
        role: 'P01-P10 RULES',
        icon: Shield,
        status: policiesPassed === totalPolicies ? 'PASS' : 'FAIL',
        headline: `${policiesPassed}/${totalPolicies} Policies Passed`,
        detail: policiesPassed === totalPolicies ? 'All P01-P10 boundaries satisfied' : 'Violated mandatory policy checks',
        metric: policiesPassed === totalPolicies ? 'COMPLIANT' : 'VIOLATION'
      },
      {
        id: 'action_firewall',
        name: 'ACTION FIREWALL',
        role: 'TOKEN GATEKEEPER',
        icon: Lock,
        status: decision === 'ALLOW' ? 'PASS' : decision === 'BLOCK' ? 'FAIL' : 'WARN',
        headline: `Decision: ${decision}`,
        detail:
          decision === 'ALLOW'
            ? 'Issued single-use cryptographic token'
            : decision === 'BLOCK'
            ? 'Execution definitively barred'
            : 'Human escalation required',
        metric: decision
      },
      {
        id: 'simulator',
        name: 'FINANCIAL SIMULATOR',
        role: 'EXECUTION BOUNDARY',
        icon: Landmark,
        status: decision === 'ALLOW' ? 'PASS' : decision === 'BLOCK' ? 'FAIL' : 'WARN',
        headline:
          decision === 'ALLOW'
            ? 'Ready for Settlement'
            : decision === 'BLOCK'
            ? 'Balance Protected (₹0 Moved)'
            : 'Execution Halted',
        detail:
          decision === 'ALLOW'
            ? 'Authorized payment can be dispatched'
            : 'Unauthorized money movement strictly blocked',
        metric: decision === 'ALLOW' ? 'AUTHORIZED' : 'LOCKED'
      }
    ];
  };

  const modules = getModules();

  return (
    <div className="bg-[#05080e] border-2 border-[#00f3ff]/40 rounded-sm p-4 md:p-5 space-y-4 font-mono relative overflow-hidden shadow-[0_0_20px_rgba(0,243,255,0.15)]">
      {/* Dynamic Cyber Scanning Line Effect */}
      {activeStep >= 0 && !animationComplete && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent animate-pulse pointer-events-none z-20"></div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#152335] pb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Activity className="w-5 h-5 text-[#00f3ff] animate-spin" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00ff66] rounded-full animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
                REAL-TIME &apos;TRUST FLOW&apos; TRACER
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30 rounded">
                FS-2605 RUNTIME
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Live cryptographic &amp; deterministic path traversal across nine security enclaves
            </p>
          </div>
        </div>

        {/* Status Indicators & Replay Control */}
        <div className="flex items-center space-x-3">
          {analysisResult && (
            <button
              onClick={handleManualReplay}
              disabled={loading}
              className="px-3 py-1 bg-[#00f3ff]/15 border border-[#00f3ff]/50 text-[#00f3ff] hover:bg-[#00f3ff]/25 text-xs font-bold rounded flex items-center space-x-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REPLAY TRACE</span>
            </button>
          )}

          <div className="flex items-center space-x-1 text-[11px]">
            <span className="text-gray-500 mr-1">STATUS:</span>
            <span className="flex items-center space-x-1 text-[#00ff66]">
              <span className="w-2 h-2 rounded-full bg-[#00ff66]"></span>
              <span className="text-[10px]">PASS</span>
            </span>
            <span className="flex items-center space-x-1 text-[#ffb700] ml-2">
              <span className="w-2 h-2 rounded-full bg-[#ffb700]"></span>
              <span className="text-[10px]">WARN</span>
            </span>
            <span className="flex items-center space-x-1 text-[#ff0055] ml-2">
              <span className="w-2 h-2 rounded-full bg-[#ff0055]"></span>
              <span className="text-[10px]">BLOCK</span>
            </span>
          </div>
        </div>
      </div>

      {/* Trust Flow Animated Progress Path */}
      <div className="relative pt-2 pb-1">
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden xl:block absolute top-[52px] left-[4%] right-[4%] h-[3px] bg-[#0c1624] z-0">
          <div
            className="h-full bg-gradient-to-r from-[#00f3ff] via-[#ff0055] to-[#00ff66] transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, ((activeStep + 1) / modules.length) * 100))}%`
            }}
          ></div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-3 relative z-10">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            const isCurrent = activeStep === idx;
            const isReached = activeStep >= idx;
            const isUpcoming = activeStep < idx;

            // Determine border & glow colors based on module status when reached
            let colorClasses = 'border-gray-800 bg-[#060a12] text-gray-500';
            let badgeBg = 'bg-gray-800 text-gray-400';
            let iconColor = 'text-gray-600';

            if (isReached) {
              if (m.status === 'PASS') {
                colorClasses = isCurrent
                  ? 'border-[#00ff66] bg-[#00ff66]/10 shadow-[0_0_15px_rgba(0,255,102,0.4)] text-white'
                  : 'border-[#00ff66]/60 bg-[#00ff66]/5 text-white';
                badgeBg = 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/40';
                iconColor = 'text-[#00ff66]';
              } else if (m.status === 'FAIL') {
                colorClasses = isCurrent
                  ? 'border-[#ff0055] bg-[#ff0055]/15 shadow-[0_0_20px_rgba(255,0,85,0.5)] text-white'
                  : 'border-[#ff0055]/70 bg-[#ff0055]/10 text-white';
                badgeBg = 'bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/40';
                iconColor = 'text-[#ff0055]';
              } else if (m.status === 'WARN') {
                colorClasses = isCurrent
                  ? 'border-[#ffb700] bg-[#ffb700]/15 shadow-[0_0_15px_rgba(255,183,0,0.4)] text-white'
                  : 'border-[#ffb700]/70 bg-[#ffb700]/10 text-white';
                badgeBg = 'bg-[#ffb700]/20 text-[#ffb700] border border-[#ffb700]/40';
                iconColor = 'text-[#ffb700]';
              } else {
                colorClasses = 'border-[#00f3ff]/50 bg-[#00f3ff]/5 text-white';
                badgeBg = 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/40';
                iconColor = 'text-[#00f3ff]';
              }
            }

            return (
              <div
                key={m.id}
                className={`p-3 rounded border transition-all duration-300 relative flex flex-col justify-between min-h-[140px] ${colorClasses} ${
                  isCurrent ? 'scale-[1.02] ring-1 ring-[#00f3ff]' : ''
                }`}
              >
                {/* Node Step Index & Live Scanning Ping */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-500">
                    0{idx + 1}
                  </span>

                  {isCurrent && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f3ff] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f3ff]"></span>
                    </span>
                  )}

                  {isReached && !isCurrent && (
                    <span>
                      {m.status === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66]" />}
                      {m.status === 'FAIL' && <XCircle className="w-3.5 h-3.5 text-[#ff0055]" />}
                      {m.status === 'WARN' && <AlertTriangle className="w-3.5 h-3.5 text-[#ffb700]" />}
                    </span>
                  )}
                </div>

                {/* Module Icon & Name */}
                <div className="space-y-1 my-1">
                  <div className="flex items-center space-x-1.5">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-[11px] font-bold tracking-tight truncate block">
                      {m.name}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-tighter truncate">
                    {m.role}
                  </div>
                </div>

                {/* Dynamic Status Payload & Metric Badge */}
                <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                  <div className="text-[11px] font-bold leading-tight truncate">
                    {isReached ? m.headline : <span className="text-gray-600">Pending...</span>}
                  </div>

                  {isReached && m.metric && (
                    <div className="pt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${badgeBg}`}>
                        {m.metric}
                      </span>
                    </div>
                  )}

                  {isReached && (
                    <div className="text-[9px] text-gray-400 line-clamp-2 leading-tight">
                      {m.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trace Narrative Footer Banner */}
      {analysisResult && (
        <div className="bg-[#080d16] border border-[#162232] p-2.5 rounded text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#00f3ff]" />
            <span className="text-gray-400">ACTIVE TRACE RESULT:</span>
            <span
              className={`font-bold ${
                analysisResult.decision === 'ALLOW'
                  ? 'text-[#00ff66]'
                  : analysisResult.decision === 'BLOCK'
                  ? 'text-[#ff0055]'
                  : 'text-[#ffb700]'
              }`}
            >
              PATH TERMINATION: {analysisResult.decision}
            </span>
          </div>

          <div className="text-[11px] text-gray-400">
            {analysisResult.decision === 'ALLOW' && (
              <span className="text-[#00ff66]">
                Cryptographic token authenticated • Financial Simulator disbursement unlocked
              </span>
            )}
            {analysisResult.decision === 'BLOCK' && (
              <span className="text-[#ff0055]">
                Invariants violated • Action Firewall sealed • Zero treasury mutation permitted
              </span>
            )}
            {analysisResult.decision === 'ESCALATE' && (
              <span className="text-[#ffb700]">
                Ambiguity threshold tripped • Awaiting human multi-party signoff
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

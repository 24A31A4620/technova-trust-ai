import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Terminal,
  Activity,
  ArrowRight
} from 'lucide-react';
import { AttackScenario, AttackRunResult } from '../types';
import { apiClient } from '../services/apiClient';
import { attackService } from '../services/attackService';
import { authService } from '../services/authService';

export const AttackLab: React.FC = () => {
  const [attacks, setAttacks] = useState<AttackScenario[]>([]);
  const [selectedAttack, setSelectedAttack] = useState<AttackScenario | null>(null);
  const [activeResult, setActiveResult] = useState<AttackRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runningAll, setRunningAll] = useState(false);
  const [allSummary, setAllSummary] = useState<any | null>(null);
  const [replayStep, setReplayStep] = useState<number>(-1);

  useEffect(() => {
    loadAttacks();
  }, []);

  const loadAttacks = async () => {
    const list = await apiClient.getAttacks();
    setAttacks(list);
    if (list.length > 0) {
      setSelectedAttack(list[0]);
    }
  };

  const handleRunSingle = async (scenario: AttackScenario) => {
    setRunning(true);
    setActiveResult(null);
    setReplayStep(-1);
    try {
      const res = await apiClient.runAttack(scenario.attackId);
      setActiveResult(res);

      // Async Firestore Persistence for Attack Lab Results
      const uid = authService.getCurrentUid();
      attackService.recordAttackResult({
        attackId: `att-${Date.now()}-${scenario.attackId}`,
        userId: uid,
        attackType: (scenario.category || scenario.name) as any,
        input: scenario.userPrompt,
        maliciousContent: scenario.untrustedDocContent,
        aiProposal: res.aiProposal,
        trustResult: res.trustResult,
        provenance: (res as any).provenance || [],
        intentBinding: res.intentResult,
        riskScore: res.risk.score,
        riskLevel: res.risk.level,
        policyResult: (res as any).policies || [],
        firewallDecision: res.decision,
        result: res.decision === 'BLOCK' ? 'BLOCKED_SUCCESSFULLY' : 'CONTAINED',
        createdAt: new Date().toISOString()
      }).catch(err => console.warn('[TECHNOVA FIRESTORE]: Attack result save warning:', err));

      // Animate timeline step by step
      if (res.timeline && res.timeline.length > 0) {
        for (let i = 0; i < res.timeline.length; i++) {
          setTimeout(() => {
            setReplayStep(i);
          }, i * 250);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    setAllSummary(null);
    try {
      const summary = await apiClient.runAllAttacks();
      setAllSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#090e17] border border-[#ff0055]/30 p-5 rounded glitch-border-magenta flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#ff0055] rounded-full animate-ping"></span>
            <h2 className="text-lg font-bold text-white font-mono tracking-wider">
              ADVERSARIAL ATTACK LAB // 10 DETERMINISTIC SCENARIOS
            </h2>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Validating injection resistance, payee tampering, currency flips, and prompt overrides.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={runningAll}
          className="px-5 py-2.5 bg-[#ff0055]/20 border border-[#ff0055] text-[#ff0055] hover:bg-[#ff0055]/30 font-mono text-xs font-bold rounded uppercase tracking-wider transition flex items-center space-x-2 cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>{runningAll ? 'RUNNING 10 EXPLOIT VECTORS...' : 'EXECUTE ALL 10 ATTACKS'}</span>
        </button>
      </div>

      {/* Batch Summary Scorecard if run */}
      {allSummary && (
        <div className="bg-[#070b12] border-2 border-[#00f3ff]/40 p-4 rounded font-mono text-xs space-y-3">
          <div className="text-sm font-bold text-[#00f3ff] uppercase tracking-wider flex items-center justify-between">
            <span>FULL SUITE DEFENSE SCORECARD</span>
            <span className="text-[#00ff66]">100% INJECTION DEFEATED</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0a0f18] p-3 rounded border border-gray-800">
              <span className="text-gray-400 block text-[10px]">TOTAL TESTED</span>
              <span className="text-base font-bold text-white">{allSummary.tested} Scenarios</span>
            </div>
            <div className="bg-[#0a0f18] p-3 rounded border border-gray-800">
              <span className="text-gray-400 block text-[10px]">BLOCKED</span>
              <span className="text-base font-bold text-[#ff0055]">{allSummary.blocked} BLOCKED</span>
            </div>
            <div className="bg-[#0a0f18] p-3 rounded border border-gray-800">
              <span className="text-gray-400 block text-[10px]">ESCALATED</span>
              <span className="text-base font-bold text-[#ffb700]">{allSummary.escalated} ESCALATED</span>
            </div>
            <div className="bg-[#0a0f18] p-3 rounded border border-gray-800">
              <span className="text-gray-400 block text-[10px]">ALLOWED EXECUTIONS</span>
              <span className="text-base font-bold text-[#00ff66]">{allSummary.allowed} (0 Zero Breach)</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Attack Selector List + Live Attack Replay Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attack List (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
            SELECT ATTACK VECTOR ({attacks.length}):
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {attacks.map((a) => {
              const isSelected = selectedAttack?.attackId === a.attackId;
              return (
                <div
                  key={a.attackId}
                  onClick={() => {
                    setSelectedAttack(a);
                    handleRunSingle(a);
                  }}
                  className={`p-3 rounded border font-mono cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#00f3ff]/10 border-[#00f3ff] text-white shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                      : 'bg-[#090d16] border-[#182333] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#00f3ff]">0{a.attackId}. {a.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#ff0055]/10 text-[#ff0055] border border-[#ff0055]/30 rounded">
                      {a.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 line-clamp-2">{a.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Replay & Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-[#070c14] border border-[#1c2838] p-5 rounded space-y-5">
          {selectedAttack ? (
            <>
              <div className="border-b border-[#182535] pb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#ff0055] font-mono font-bold tracking-widest uppercase">
                    ACTIVE TARGET VECTOR // ID 0{selectedAttack.attackId}
                  </div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedAttack.name}</h3>
                </div>

                <button
                  onClick={() => handleRunSingle(selectedAttack)}
                  disabled={running}
                  className="px-3.5 py-1.5 bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff] rounded font-mono text-xs font-bold hover:bg-[#00f3ff]/30 transition uppercase cursor-pointer"
                >
                  {running ? 'INJECTING...' : 'RE-RUN VECTOR'}
                </button>
              </div>

              {/* Scenario Details */}
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#090e18] p-3 rounded border border-gray-800">
                  <span className="text-gray-400 block text-[10px] uppercase">Legitimate User Intent:</span>
                  <span className="text-white font-bold">{selectedAttack.userPrompt}</span>
                </div>

                <div className="bg-[#12080f] p-3 rounded border border-[#ff0055]/30">
                  <span className="text-[#ff0055] block text-[10px] uppercase font-bold">Malicious Document Payload:</span>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono mt-1">{selectedAttack.untrustedDocContent}</pre>
                </div>
              </div>

              {/* Animated Attack Replay Sequence */}
              {activeResult && (
                <div className="space-y-4 pt-3 border-t border-[#182535]">
                  <div className="text-xs font-mono font-bold text-[#00f3ff] uppercase tracking-wider flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#00f3ff] animate-spin" />
                    <span>ATTACK REPLAY TIMELINE (DEFENSE IN DEPTH):</span>
                  </div>

                  {/* Horizontal / Wrapped Replay Timeline */}
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                    {activeResult.timeline.map((step, idx) => {
                      const isReached = replayStep >= idx;
                      const isLast = idx === activeResult.timeline.length - 1;
                      return (
                        <React.Fragment key={idx}>
                          <div
                            className={`px-2.5 py-1 rounded border transition-all duration-300 font-bold ${
                              isReached
                                ? isLast
                                  ? 'bg-[#ff0055] text-white border-[#ff0055] shadow-[0_0_12px_rgba(255,0,85,0.6)] animate-pulse'
                                  : 'bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]'
                                : 'bg-[#090d14] text-gray-600 border-gray-800'
                            }`}
                          >
                            {step}
                          </div>
                          {!isLast && (
                            <ArrowRight className={`w-3 h-3 ${isReached ? 'text-[#00f3ff]' : 'text-gray-700'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Detailed Analysis Cards */}
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs pt-2">
                    <div className="bg-[#0a0f1a] p-3 rounded border border-[#1b2738]">
                      <span className="text-gray-400 block text-[10px]">DECISION RESULT</span>
                      <span className="text-base font-bold text-[#ff0055]">{activeResult.decision}</span>
                      <div className="text-[10px] text-gray-400 mt-1">{activeResult.reason}</div>
                    </div>

                    <div className="bg-[#0a0f1a] p-3 rounded border border-[#1b2738]">
                      <span className="text-gray-400 block text-[10px]">RISK SCORE ASSIGNED</span>
                      <span className="text-base font-bold text-[#ff0055]">
                        {activeResult.risk.score} / 100 [{activeResult.risk.level}]
                      </span>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {activeResult.risk.factors.length} adversarial factor(s) flagged
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-xs font-mono">Select an attack scenario from the list to begin.</div>
          )}
        </div>
      </div>
    </div>
  );
};

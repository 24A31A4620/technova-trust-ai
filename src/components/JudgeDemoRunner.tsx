import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, AlertTriangle, Info, Zap, RotateCcw } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface DemoStep {
  stepNumber: number;
  name: string;
  phase: string;
  status: 'SUCCESS' | 'BLOCKED' | 'ESCALATED' | 'INFO';
  detail: string;
  data?: any;
}

export const JudgeDemoRunner: React.FC<{ onRefreshAccount: () => void }> = ({ onRefreshAccount }) => {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<DemoStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);

  const runFullDemo = async () => {
    setRunning(true);
    setSteps([]);
    setActiveStepIndex(-1);

    try {
      const result = await apiClient.runJudgeDemo();
      const allSteps: DemoStep[] = result.steps || [];
      setSteps(allSteps);

      // Animate step by step
      for (let i = 0; i < allSteps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        setActiveStepIndex(i);
      }

      onRefreshAccount();
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#090f19] border border-[#00f3ff]/40 p-5 rounded flex flex-wrap items-center justify-between gap-4 glitch-border-cyan">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-[#00f3ff] animate-pulse" />
            <h2 className="text-lg font-bold text-white font-mono tracking-wider">
              18-STEP AUTOMATED JUDGE DEMONSTRATION NARRATIVE
            </h2>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Executes the complete proof sequence: Normal ALLOW → Malicious Injections → Prompt Drift → BLOCK → Audit Verification → Safe Fallback.
          </p>
        </div>

        <button
          onClick={runFullDemo}
          disabled={running}
          className="px-6 py-3 bg-[#00f3ff] text-black hover:bg-[#00f3ff]/80 font-mono text-xs font-bold rounded uppercase tracking-widest transition flex items-center space-x-2 shadow-[0_0_15px_rgba(0,243,255,0.4)] cursor-pointer"
        >
          <Play className="w-4 h-4 text-black fill-current" />
          <span>{running ? `ANIMATING STEP ${activeStepIndex + 1} OF 18...` : 'RUN 18-STEP SEQUENCE'}</span>
        </button>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isVisible = idx <= activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          if (!isVisible) return null;

          return (
            <div
              key={step.stepNumber}
              className={`p-3.5 rounded border font-mono text-xs transition-all duration-300 ${
                isCurrent
                  ? 'bg-[#00f3ff]/10 border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                  : 'bg-[#080d16] border-[#162232]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded bg-[#101b2a] border border-gray-700 flex items-center justify-center font-bold text-[10px] text-[#00f3ff]">
                    {step.stepNumber < 10 ? `0${step.stepNumber}` : step.stepNumber}
                  </span>
                  <span className="font-bold text-white text-sm">{step.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2 py-0.5 bg-[#121c2c] text-gray-400 border border-gray-700 rounded">
                    {step.phase}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center space-x-1 ${
                      step.status === 'SUCCESS'
                        ? 'bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30'
                        : step.status === 'BLOCKED'
                        ? 'bg-[#ff0055]/15 text-[#ff0055] border border-[#ff0055]/30'
                        : step.status === 'ESCALATED'
                        ? 'bg-[#ffb700]/15 text-[#ffb700] border border-[#ffb700]/30'
                        : 'bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30'
                    }`}
                  >
                    {step.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {step.status === 'BLOCKED' && <XCircle className="w-3 h-3 mr-1" />}
                    {step.status === 'ESCALATED' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {step.status === 'INFO' && <Info className="w-3 h-3 mr-1" />}
                    <span>{step.status}</span>
                  </span>
                </div>
              </div>

              <div className="text-gray-300 text-xs pl-8">{step.detail}</div>
            </div>
          );
        })}

        {steps.length === 0 && (
          <div className="p-8 text-center bg-[#070b12] border border-[#162232] rounded font-mono text-gray-500 text-xs">
            Press &quot;RUN 18-STEP SEQUENCE&quot; to execute the complete judge evaluation pipeline.
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, XCircle, Play, ShieldAlert } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { TestSuiteSummary } from '../tests/trustEngine.test';

export const TestMatrixView: React.FC = () => {
  const [suite, setSuite] = useState<TestSuiteSummary | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    runSuite();
  }, []);

  const runSuite = async () => {
    setRunning(true);
    try {
      const summary = await apiClient.runTests();
      setSuite(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Control Banner */}
      <div className="bg-[#080d16] border border-[#00f3ff]/40 p-5 rounded glitch-border-cyan flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-[#00f3ff]" />
            <h2 className="text-lg font-bold text-white tracking-wider">
              UNIT TEST MATRIX // CORE SECURITY INVARIANTS
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Deterministic verification of the 16 core security assertions, including the cardinal invariant: &quot;NO AI OUTPUT CAN DIRECTLY EXECUTE A TRANSACTION.&quot;
          </p>
        </div>

        <button
          onClick={runSuite}
          disabled={running}
          className="px-5 py-2.5 bg-[#00f3ff] text-black font-bold rounded uppercase tracking-wider hover:bg-[#00f3ff]/80 transition flex items-center space-x-2 cursor-pointer"
        >
          <Play className="w-4 h-4 text-black fill-current" />
          <span>{running ? 'RUNNING TEST MATRIX...' : 'RE-RUN TEST MATRIX'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      {suite && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#070c14] p-3 rounded border border-gray-800">
            <span className="text-gray-400 block text-[10px] uppercase">TOTAL TESTS</span>
            <span className="text-base font-bold text-white">{suite.total} Invariants</span>
          </div>
          <div className="bg-[#070c14] p-3 rounded border border-gray-800">
            <span className="text-gray-400 block text-[10px] uppercase">PASSED</span>
            <span className="text-base font-bold text-[#00ff66]">{suite.passed} PASS</span>
          </div>
          <div className="bg-[#070c14] p-3 rounded border border-gray-800">
            <span className="text-gray-400 block text-[10px] uppercase">FAILED</span>
            <span className={`text-base font-bold ${suite.failed === 0 ? 'text-[#00ff66]' : 'text-[#ff0055]'}`}>
              {suite.failed} FAIL
            </span>
          </div>
          <div className="bg-[#070c14] p-3 rounded border border-gray-800">
            <span className="text-gray-400 block text-[10px] uppercase">EXECUTION DURATION</span>
            <span className="text-base font-bold text-[#00f3ff]">{suite.durationMs} ms</span>
          </div>
        </div>
      )}

      {/* Test Items Table */}
      <div className="space-y-2">
        {suite?.tests.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded border flex flex-wrap items-center justify-between gap-3 ${
              t.passed ? 'bg-[#060b14] border-[#152335]' : 'bg-[#1a0812] border-[#ff0055]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#00f3ff]">{t.id}:</span>
                <span className="font-bold text-white text-sm">{t.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">
                  {t.category}
                </span>
              </div>
              <div className="text-[11px] text-gray-400">{t.details}</div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right text-[11px] hidden sm:block">
                <span className="text-gray-500 block text-[10px]">EXPECTED / ACTUAL:</span>
                <span className="text-gray-300">{t.expected} → {t.actual}</span>
              </div>

              <span
                className={`px-3 py-1 rounded font-bold uppercase flex items-center space-x-1 ${
                  t.passed
                    ? 'bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30'
                    : 'bg-[#ff0055]/15 text-[#ff0055] border border-[#ff0055]/30'
                }`}
              >
                {t.passed ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                <span>{t.passed ? 'PASS' : 'FAIL'}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

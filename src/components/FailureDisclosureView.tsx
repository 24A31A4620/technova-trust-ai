import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldX, Terminal, Skull, AlertOctagon } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export const FailureDisclosureView: React.FC = () => {
  const [disclosure, setDisclosure] = useState<any | null>(null);

  useEffect(() => {
    loadDisclosure();
  }, []);

  const loadDisclosure = async () => {
    const data = await apiClient.getDisclosure();
    setDisclosure(data);
  };

  const failureModes = [
    {
      id: 'MODE-01',
      title: 'TRUSTED SOURCE COMPROMISE',
      severity: 'CRITICAL',
      icon: Skull,
      description:
        'If the authenticated user’s physical device, session token, or biometric authorization is hijacked, TrustLayer identifies the command source as TRUSTED. Because USER_REQUEST holds authoritative provenance, the system cannot distinguish between a legitimate human command and a malware-driven proxy signing legitimate tokens.',
      mitigations: [
        'Multi-factor out-of-band step-up for high-value outliers.',
        'Continuous behavioral biometric verification.',
        'Mandatory cooldown delays on newly registered beneficiaries.'
      ]
    },
    {
      id: 'MODE-02',
      title: 'RECOVERY-PARTY COLLUSION & SOCIAL ENGINEERING',
      severity: 'HIGH',
      icon: AlertOctagon,
      description:
        'When transactions escalate to human reviewers or multi-sig recovery parties, malicious actors can socially engineer or collude with the approvers. If secondary approvers sign off without thoroughly verifying physical paper invoices, the TrustLayer firewall will execute the payment in good faith.',
      mitigations: [
        'Threshold cryptography requiring independent non-colluding entities.',
        'Blind review protocols (parties review disjoint fragments of invoice data).',
        'Cryptographic audit trails attributing individual reviewer keys with legal liability.'
      ]
    },
    {
      id: 'MODE-03',
      title: 'STEALTH CORRUPTION (SLOW-BOIL DRIFT)',
      severity: 'HIGH',
      icon: ShieldX,
      description:
        'An adversary gradually shifts transaction baselines over 12-18 months by submitting legitimate-looking micro-invoices with 1-2% monthly inflation or subtle vendor name tweaks. Over time, the baseline profile recalibrates, normalizing what would previously have triggered anomalous risk scores.',
      mitigations: [
        'Global immutable anchors across fiscal quarter closing reports.',
        'Cross-vendor price benchmarks from industry databases.',
        'Periodic non-adaptive cold audits comparing 2-year horizon deltas.'
      ]
    }
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Title Banner */}
      <div className="bg-[#12080e] border border-[#ff0055]/50 p-5 rounded glitch-border-magenta space-y-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-[#ff0055] animate-pulse" />
          <h2 className="text-lg font-bold text-white tracking-wider">
            &quot;WHERE THIS BREAKS&quot; // ARCHITECTURAL FAILURE DISCLOSURE
          </h2>
        </div>
        <p className="text-xs text-gray-300">
          FS-2605 mandates complete honesty regarding adversarial failure modes. No authorization architecture is omnipotent; security boundaries must explicitly document where perimeter assumptions collapse.
        </p>
      </div>

      {/* Failure Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {failureModes.map((fm) => {
          const Icon = fm.icon;
          return (
            <div
              key={fm.id}
              className="bg-[#080d16] border border-[#1e2a3c] hover:border-[#ff0055] p-5 rounded space-y-4 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-[10px] text-gray-500 font-bold">{fm.id}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#ff0055]/15 text-[#ff0055] border border-[#ff0055]/30 rounded font-bold">
                    {fm.severity}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-[#ff0055] flex-shrink-0" />
                  <h3 className="font-bold text-white text-sm">{fm.title}</h3>
                </div>

                <p className="text-gray-400 text-xs leading-relaxed">{fm.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-900 space-y-1.5">
                <span className="text-[10px] text-[#00f3ff] uppercase font-bold block">
                  Mandated Defense Countermeasures:
                </span>
                {fm.mitigations.map((m, i) => (
                  <div key={i} className="text-[11px] text-gray-300">
                    • {m}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Architectural Contract Note */}
      <div className="bg-[#05080f] p-4 rounded border border-gray-800 text-gray-400 text-[11px] space-y-1">
        <span className="text-[#00f3ff] font-bold">CYBERSECURITY ARCHITECT NOTE:</span>
        <div>
          By enforcing the separation of LLM cognition from financial authorization tokens, the TrustLayer removes prompt injection and LLM hallucinations as single-point-of-failure vulnerabilities. Compromises can only occur if the underlying cryptographic root or human identity is subverted.
        </div>
      </div>
    </div>
  );
};

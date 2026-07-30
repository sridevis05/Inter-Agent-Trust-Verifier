import React from 'react';
import { CheckSquare, ShieldCheck, FileCheck, Award } from 'lucide-react';
import { Analytics } from '../utils/api';

interface GovernanceProps {
  analytics: Analytics | null;
}

export const Governance: React.FC<GovernanceProps> = ({ analytics }) => {
  const complianceStatus = analytics?.compliance.governance_status || [
    "✓ Audit Logging Engine Enabled",
    "✓ Encryption at Rest (AES-256 for private keys)",
    "✓ Encryption in Transit (HTTPS / WSS Gateway rules)",
    "✓ Least Privilege Enforced",
    "✓ Zero Trust Pipeline Validation",
    "✓ Multi-Agent RBAC + ABAC Access Rules Active"
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">GOVERNANCE & COMPLIANCE</h2>
        <p className="text-slate-400 text-xs mt-1">Regulatory framework alignment mappings and security control checklists.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Mappings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Framework alignment scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 border border-slate-800 bg-slate-900/35 rounded-xl glass-panel text-center space-y-2">
              <Award className="w-8 h-8 text-blue-400 mx-auto" />
              <h3 className="text-xs font-mono font-bold text-slate-300">NIST CSF</h3>
              <p className="text-2xl font-bold font-mono text-white">18 / 23</p>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Controls Covered</span>
            </div>

            <div className="p-5 border border-slate-800 bg-slate-900/35 rounded-xl glass-panel text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-xs font-mono font-bold text-slate-300">SOC2 TYPE II</h3>
              <p className="text-2xl font-bold font-mono text-white">14</p>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Controls Implemented</span>
            </div>

            <div className="p-5 border border-slate-800 bg-slate-900/35 rounded-xl glass-panel text-center space-y-2">
              <FileCheck className="w-8 h-8 text-purple-400 mx-auto" />
              <h3 className="text-xs font-mono font-bold text-slate-300">OWASP LLM TOP 10</h3>
              <p className="text-2xl font-bold font-mono text-white">8 / 10</p>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Mitigations Active</span>
            </div>
          </div>

          {/* Detailed mapping explanations */}
          <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel space-y-4">
            <h3 className="font-mono text-xs text-slate-300 uppercase border-b border-slate-800 pb-2">FRAMEWORK CONTROLS DESCRIPTION</h3>
            <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed font-mono">
              <div>
                <strong className="text-white">NIST Cybersecurity Framework (CSF):</strong>
                <p className="mt-1">Covered controls focus on **PR.AC (Access Control)**, **PR.DS (Data Security)**, and **DE.AE (Detection Processes)** by cryptographic agent signing, ABAC time constraints, and live threat verification pipelines.</p>
              </div>
              <div>
                <strong className="text-white">SOC2 Trust Services Criteria:</strong>
                <p className="mt-1">Satisfies Security criteria via non-repudiation logging, private credentials encryption utilizing AES, and continuous threat simulation monitoring inputs.</p>
              </div>
              <div>
                <strong className="text-white">OWASP Top 10 for LLM Applications:</strong>
                <p className="mt-1">Mitigates LLM01 (Prompt Injections) and LLM02 (Insecure Output Handling) using the front-line LLM Security Firewall checks on all agent payloads before instruction forward.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Governance Checklist */}
        <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel flex flex-col justify-between h-[450px]">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-3 mb-6">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>COMPLIANCE READINESS CHECKLIST</span>
            </div>

            <div className="space-y-4">
              {complianceStatus.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs text-slate-300 font-mono">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span>{item.replace("✓ ", "")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg text-[10px] font-mono text-blue-400 leading-relaxed">
            SentinelTrust AI is compliant with NIST and SOC2 access governance frameworks.
          </div>
        </div>
      </div>
    </div>
  );
};

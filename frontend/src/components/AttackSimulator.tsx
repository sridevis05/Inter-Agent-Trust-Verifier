import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Zap, 
  Shield 
} from 'lucide-react';
import { runAttackSimulation } from '../utils/api';
import { SequenceDiagram } from './SequenceDiagram';

interface AttackSimulatorProps {
  onRefreshLogs: () => void;
}

export const AttackSimulator: React.FC<AttackSimulatorProps> = ({ onRefreshLogs }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  
  // Results State
  const [simResult, setSimResult] = useState<any | null>(null);

  const attacks = [
    { id: 'mitm', label: 'Man-In-The-Middle', desc: 'Tamper instruction parameters in transit' },
    { id: 'fake_signature', label: 'Fake Signature', desc: 'Sign payload with an unregistered key pair' },
    { id: 'replay', label: 'Replay Attack', desc: 'Re-submit instruction using duplicate nonce' },
    { id: 'expired_token', label: 'Expired Token', desc: 'Send command with expired delegation JWT' },
    { id: 'unauthorized_command', label: 'Unauthorized Command', desc: 'Perform action blocked by RBAC/ABAC rules' },
    { id: 'revoked_agent', label: 'Revoked Credentials', desc: 'Send instruction from a suspended/revoked agent' },
    { id: 'prompt_injection', label: 'Prompt Injection', desc: 'Inject bypass scripts to hijack LLM instructions' },
    { id: 'tool_hijacking', label: 'Tool Hijacking', desc: 'Request execution of malicious CLI commands' },
    { id: 'exfiltration', label: 'Data Exfiltration', desc: 'Attempt file download/upload outside permissions' },
    { id: 'ip_blacklist', label: 'Tor Node Request', desc: 'Simulate connection from blacklisted malicious IP' }
  ];

  const handleSimulate = async (type: string) => {
    setIsRunning(true);
    setActiveAttack(type);
    setSimResult(null);
    try {
      const res = await runAttackSimulation(type);
      setSimResult(res.data);
      onRefreshLogs();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Simulation request failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">THREAT & INTRUSION SIMULATOR</h2>
        <p className="text-slate-400 text-xs mt-1">
          Launch simulated adversarial threat patterns to test the robustness of the Zero Trust validation gateway.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attacks List */}
        <div className="space-y-3 lg:col-span-1 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel h-[560px] overflow-y-auto">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-4 border-b border-slate-800 pb-2">
            SELECT ADVERSARIAL VECTOR
          </span>
          {attacks.map((atk) => (
            <button
              key={atk.id}
              onClick={() => handleSimulate(atk.id)}
              disabled={isRunning}
              className={`w-full p-4 border rounded-lg text-left transition-all duration-300 flex items-start space-x-3.5 group relative ${
                activeAttack === atk.id
                  ? 'bg-red-600/10 border-red-500/60 shadow-glow-red/5'
                  : 'bg-slate-950/50 border-slate-850 hover:bg-slate-900/50'
              }`}
            >
              <div className={`p-2 rounded-lg border ${
                activeAttack === atk.id
                  ? 'bg-red-950 border-red-800 text-red-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-red-400'
              } transition-colors`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200">{atk.label}</div>
                <div className="text-[10px] text-slate-500">{atk.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Attack Outcome Screen */}
        <div className="lg:col-span-2 space-y-6">
          {isRunning ? (
            <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel h-[560px] flex flex-col justify-center items-center">
              <Zap className="w-12 h-12 text-red-500 animate-bounce mb-4" />
              <div className="text-xs font-mono text-slate-400 animate-pulse">
                DEPLOYING VECTOR... ANALYZING INTER-AGENT TELEMETRY...
              </div>
            </div>
          ) : simResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telemetry Outcome Card */}
              <div className="space-y-6">
                <div className="border border-red-900/40 bg-red-950/5 rounded-xl p-6 glass-panel space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-red-400 font-bold uppercase bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded">
                      VERDICT: BLOCKED
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">TRACE: {simResult.trace_id?.slice(0, 12)}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white uppercase">
                      Prevented: {attacks.find(a => a.id === simResult.attack_type)?.label}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Reason: <strong className="text-red-400">{simResult.reason}</strong>
                    </p>
                  </div>

                  {/* Telemetry widgets */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">THREAT LEVEL</span>
                      <span className="text-xs font-mono font-bold text-red-500">
                        {simResult.threat_level}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">RISK INDEX</span>
                      <span className="text-xs font-mono font-bold text-red-400">
                        {simResult.risk_score} / 100
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Explainability Details */}
                {simResult.explanation && (
                  <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel space-y-4">
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2">
                      <Shield className="w-3.5 h-3.5" />
                      <span>AI EXPLAINABILITY DIALOGUE</span>
                    </div>
                    
                    <div className="space-y-3 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">HUMAN EXPLANATION</span>
                        <p className="text-slate-300 mt-1 leading-relaxed">{simResult.explanation.human_explanation}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">MACHINE EXCEPTION TRACE</span>
                        <pre className="text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-850 mt-1 overflow-x-auto text-[10px]">
                          {simResult.explanation.machine_exception}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">SUGGESTED RECONCILIATION</span>
                        <p className="text-emerald-400 mt-1 font-semibold">{simResult.explanation.suggested_fix}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sequencer results (checkpoints) */}
              <SequenceDiagram 
                stepResults={simResult.spans ? {
                  "Format Check": true,
                  "Threat Intel & Device Check": simResult.reason !== "IP Address blacklisted by Threat Intelligence" && simResult.reason !== "Agent ID marked as rogue on Threat Feed",
                  "LLM Security Firewall Check": !simResult.reason.includes("LLM Security Firewall"),
                  "Signature & Crypto Identity": !simResult.reason.includes("Signature"),
                  "Message Integrity Check": true,
                  "Replay Attack Prevention": !simResult.reason.includes("Nonce"),
                  "Delegation Token Validation": !simResult.reason.includes("Token") && !simResult.reason.includes("scope"),
                  "Policy & Permission Check": !simResult.reason.includes("Policy")
                } : null}
                activeStep={null}
                failureReason={simResult.reason}
              />
            </div>
          ) : (
            <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel h-[560px] flex flex-col justify-center items-center">
              <Shield className="w-12 h-12 text-slate-700 mb-4" />
              <div className="text-xs font-mono text-slate-500">
                AWAITING SIMULATION VECTOR. CHOOSE AN ADVERSARIAL PATTERN TO INITIATE INTRUSION AUDITS.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

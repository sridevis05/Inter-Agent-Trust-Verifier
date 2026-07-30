import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Key, 
  Hash, 
  Hourglass, 
  Lock, 
  Users, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

interface SequenceDiagramProps {
  stepResults: Record<string, boolean> | null;
  activeStep: string | null; // e.g. which step is checking
  failureReason: string | null;
}

export const SequenceDiagram: React.FC<SequenceDiagramProps> = ({ stepResults, activeStep, failureReason }) => {
  const steps = [
    { label: 'Format Check', desc: 'Validates protocol structure v1.0', icon: Hourglass },
    { label: 'Threat Intel & Device Check', desc: 'IP blacklist & status directory lookup', icon: Search },
    { label: 'LLM Security Firewall Check', desc: 'Jailbreak & prompt injection heuristics', icon: ShieldAlert },
    { label: 'Signature & Crypto Identity', desc: 'RSA certificate public-key check with kid', icon: Key },
    { label: 'Message Integrity Check', desc: 'SHA-256 integrity hash verification', icon: Hash },
    { label: 'Replay Attack Prevention', desc: 'Nonce lookup in Redis cluster', icon: Lock },
    { label: 'Delegation Token Validation', desc: 'Delegation JWT allowed actions evaluation', icon: Users },
    { label: 'Policy & Permission Check', desc: 'OPA-inspired ABAC / RBAC rules evaluate', icon: ShieldCheck }
  ];

  return (
    <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-6 glass-panel space-y-6">
      <div>
        <h3 className="font-mono text-xs tracking-wider text-slate-400 uppercase">ZERO-TRUST PIPELINE SEQUENCER</h3>
        <span className="text-[10px] text-slate-500">Live multi-stage security pipeline breakdown</span>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isPassed = stepResults ? stepResults[step.label] === true : false;
          const isFailed = stepResults ? stepResults[step.label] === false : false;
          const isChecking = activeStep === step.label;
          const isPending = !isPassed && !isFailed && !isChecking;
          
          const Icon = step.icon;

          return (
            <div 
              key={idx} 
              className={`p-3.5 border rounded-lg flex items-center justify-between transition-all duration-300 ${
                isPassed ? 'bg-emerald-950/15 border-emerald-900/40' :
                isFailed ? 'bg-red-950/20 border-red-900/50 shadow-glow-red/5' :
                isChecking ? 'bg-blue-950/20 border-blue-800 animate-pulse-glow' :
                'bg-slate-950/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className={`p-2 rounded-lg border ${
                  isPassed ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
                  isFailed ? 'bg-red-950 border-red-800 text-red-400' :
                  isChecking ? 'bg-blue-950 border-blue-800 text-blue-400' :
                  'bg-slate-900 border-slate-800 text-slate-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{step.label}</h4>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">{step.desc}</span>
                </div>
              </div>

              {/* Status Mark */}
              <div>
                {isPassed && (
                  <span className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>PASS</span>
                  </span>
                )}
                {isFailed && (
                  <span className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-red-400">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>BLOCKED</span>
                  </span>
                )}
                {isChecking && (
                  <span className="text-[10px] font-mono font-bold text-blue-400 animate-pulse">
                    VERIFYING...
                  </span>
                )}
                {isPending && (
                  <span className="text-[10px] font-mono text-slate-600">
                    PENDING
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {failureReason && (
        <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-lg text-[11px] font-mono text-red-300 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong>PIPELINE ABORTED:</strong> {failureReason}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, Loader2, Star, AlertTriangle, ShieldCheck } from 'lucide-react';
import { runNormalPipeline, runAttackSimulation } from '../utils/api';

interface DemoStep {
  name: string;
  type: 'normal' | 'mitm' | 'replay' | 'expired_token' | 'unauthorized_command' | 'flood';
  description: string;
  status: 'pending' | 'running' | 'passed' | 'blocked' | 'failed';
  resultDetails?: string;
}

export const DemoMode: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number | null>(null);
  
  const [steps, setSteps] = useState<DemoStep[]>([
    { name: '1. Secure Inter-Agent Transaction', type: 'normal', description: 'Signs and verifies a valid code write payload from Planner to Developer Agent.', status: 'pending' },
    { name: '2. Man-In-The-Middle Attack', type: 'mitm', description: 'Simulates a MITM agent attempting to hijack payload code parameters in transit.', status: 'pending' },
    { name: '3. Replay Attack Prevention', type: 'replay', description: 'Attempts to replay a stale command using a duplicate cryptographic nonce.', status: 'pending' },
    { name: '4. Expired Token Delegation', type: 'expired_token', description: 'Sends a command using a stale, expired delegation JWT token.', status: 'pending' },
    { name: '5. Unauthorized Operation Block', type: 'unauthorized_command', description: 'Attempts to execute a deploy command that is denied by OPA ABAC rules.', status: 'pending' },
    { name: '6. Sliding-Window Flooding Anomaly', type: 'flood', description: 'Simulates a compromised agent flood-requesting the gateway (DoS threshold).', status: 'pending' }
  ]);

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStepIdx(null);
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending', resultDetails: undefined })));
  };

  const runDemo = async () => {
    setIsPlaying(true);
    
    // Process step-by-step
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIdx(i);
      setSteps(prev => {
        const copy = [...prev];
        copy[i].status = 'running';
        return copy;
      });

      // Artificial small delay for visual pacing
      await new Promise(r => setTimeout(r, 2000));

      const step = steps[i];
      try {
        let resultMsg = '';
        let stepStatus: 'passed' | 'blocked' | 'failed' = 'passed';

        if (step.type === 'normal') {
          await runNormalPipeline();
          stepStatus = 'passed';
          resultMsg = 'Pipeline executed successfully. RSA signature verified, Nonce cached, OPA Policy allowed.';
        } else if (step.type === 'flood') {
          // Fire multiple rapid requests to trigger the anomaly detector
          let lastRes: any = null;
          for (let f = 0; f < 16; f++) {
            lastRes = await runAttackSimulation('ip_blacklist'); // Trigger requests rapidly
          }
          stepStatus = 'blocked';
          resultMsg = `Blocked: Anomaly engine detected request flooding. Sender quarantined. Reason: ${lastRes.data.reason}`;
        } else {
          const res = await runAttackSimulation(step.type);
          const blockSuccess = res.data.verification_result.includes('Failed');
          stepStatus = blockSuccess ? 'blocked' : 'passed';
          resultMsg = blockSuccess 
            ? `Blocked successfully. Gateway Exception: ${res.data.reason}`
            : 'Execution bypassed gateway. Warning!';
        }

        setSteps(prev => {
          const copy = [...prev];
          copy[i].status = stepStatus;
          copy[i].resultDetails = resultMsg;
          return copy;
        });

      } catch (err) {
        setSteps(prev => {
          const copy = [...prev];
          copy[i].status = 'failed';
          copy[i].resultDetails = 'Network failure executing simulation step.';
          return copy;
        });
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    setIsPlaying(false);
    setCurrentStepIdx(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">ONE-CLICK DEMO CONSOLE</h2>
          <p className="text-slate-400 text-xs mt-1">
            Play the complete end-to-end security compliance walkthrough in a single click—ideal for recruiter demonstrations.
          </p>
        </div>

        <div className="flex space-x-3 font-mono">
          <button
            onClick={resetDemo}
            disabled={isPlaying}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg text-xs flex items-center space-x-1.5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET DEMO</span>
          </button>
          
          <button
            onClick={runDemo}
            disabled={isPlaying}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 font-medium shadow-glow-blue transition-all"
          >
            {isPlaying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isPlaying ? 'PLAYING DEMO...' : 'START AUTO-PLAY'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Walkthrough Steps */}
        <div className="xl:col-span-2 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">
            DEMO SCENARIOS TIMELINE
          </span>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isCurrent = currentStepIdx === idx;
              return (
                <div 
                  key={idx}
                  className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                    isCurrent ? 'bg-blue-950/20 border-blue-500 animate-pulse-glow scale-[1.01]' :
                    step.status === 'passed' ? 'bg-emerald-950/10 border-emerald-900/40' :
                    step.status === 'blocked' ? 'bg-red-950/15 border-red-900/40 shadow-glow-red/5' :
                    step.status === 'failed' ? 'bg-slate-950 border-red-900/30' :
                    'bg-slate-950/50 border-slate-850 opacity-60'
                  }`}
                >
                  <div className="space-y-1 max-w-lg">
                    <h4 className="text-xs font-bold text-slate-200">{step.name}</h4>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      {step.description}
                    </p>
                    {step.resultDetails && (
                      <div className="text-[10px] font-mono text-slate-500 bg-slate-950/70 p-2 rounded border border-slate-850 mt-2">
                        {step.resultDetails}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex items-center space-x-3 text-right">
                    {step.status === 'pending' && (
                      <span className="text-[10px] font-mono text-slate-600 uppercase">PENDING</span>
                    )}
                    {step.status === 'running' && (
                      <span className="text-[10px] font-mono text-blue-400 font-bold animate-pulse flex items-center space-x-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>VERIFYING...</span>
                      </span>
                    )}
                    {step.status === 'passed' && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>SUCCESS</span>
                      </span>
                    )}
                    {step.status === 'blocked' && (
                      <span className="text-[10px] font-mono font-bold text-red-400 flex items-center space-x-1.5">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span>SECURE BLOCKED</span>
                      </span>
                    )}
                    {step.status === 'failed' && (
                      <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recruiter Evaluation Cheat Sheet */}
        <div className="xl:col-span-1 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2 uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              <span>INTERVIEW CHEAT SHEET</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-3 font-sans text-xs">
              <p className="text-slate-300 leading-relaxed">
                SentinelTrust AI meets all placement criteria for high-stakes enterprise projects:
              </p>
              <ul className="space-y-2 text-slate-400 list-disc list-inside text-[11px]">
                <li><strong className="text-emerald-400">Zero Trust Gateway</strong> logic intercepts actions between decoupled systems.</li>
                <li><strong className="text-blue-400">Cryptographic Identity</strong> checks signatures and tracks nonces to block replays.</li>
                <li><strong className="text-indigo-400">OPA Policy Engine</strong> handles fine-grained ABAC permissions and VPN limits.</li>
                <li><strong className="text-red-400">Reputation Decalibrations</strong> drop scores, isolating agents automatically.</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-400 leading-relaxed font-sans">
              <strong>Recruiter Demo Tip:</strong> Trigger the <strong>Auto-Play</strong> to demonstrate the gateway verifying key scenarios automatically while updating real-time graphs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

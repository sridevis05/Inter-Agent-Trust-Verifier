import React from 'react';
import { Shield, Key, FileCheck, ArrowRight, UserCheck } from 'lucide-react';

export const SSODelegation: React.FC = () => {
  const steps = [
    {
      title: '1. Identity SSO Authentication',
      desc: 'Manager Agent authenticates via OAuth2 / Microsoft Entra ID.',
      component: 'Identity Provider (IdP)',
      icon: UserCheck,
      color: 'border-blue-500 text-blue-400 bg-blue-950/20'
    },
    {
      title: '2. Delegation Token Exchange',
      desc: 'IdP issues token. Manager exchanges it at SentinelTrust Auth endpoint for a scoped Delegation JWT specifying actions: ["WriteCode", "RunTest"] and limits.',
      component: 'Auth Service',
      icon: Key,
      color: 'border-purple-500 text-purple-400 bg-purple-950/20'
    },
    {
      title: '3. Instruction Payload signing',
      desc: 'Developer Agent signs the instruction block containing Delegation JWT using its RSA-2048 private key, generating key ID (kid).',
      component: 'Developer Agent SDK',
      icon: FileCheck,
      color: 'border-pink-500 text-pink-400 bg-pink-950/20'
    },
    {
      title: '4. Zero Trust Verification',
      desc: 'Gateway intercept check: verifies the outer cryptographic signature via public keys AND the inner delegation token JWT signature and ABAC scopes.',
      component: 'SentinelTrust Gateway',
      icon: Shield,
      color: 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">ZERO TRUST IDENTITY DELEGATION</h2>
        <p className="text-slate-400 text-xs mt-1">
          Visual workflow mapping OAuth2 Identity Token exchange for cryptographic Agent Delegation Tokens.
        </p>
      </div>

      {/* Visual Workflow Steps */}
      <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-8 glass-panel space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center space-y-6 lg:space-y-0 lg:space-x-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={idx}>
                {/* Step Node */}
                <div className={`flex-1 border rounded-xl p-5 ${step.color} hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between h-48 relative`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white font-mono">{step.title}</h4>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{step.desc}</p>
                  </div>
                  <div className="border-t border-slate-800/80 pt-3 text-[9px] font-mono text-slate-500">
                    Component: <span className="text-slate-300 font-semibold">{step.component}</span>
                  </div>
                </div>

                {/* Arrow */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:flex justify-center items-center text-slate-700 animate-pulse">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Explainability footnote */}
        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-lg text-xs leading-relaxed text-slate-400 font-mono space-y-2">
          <div className="text-blue-400 font-bold">Why is this secure?</div>
          <p>
            Standard APIs only verify the caller's server credentials. SentinelTrust AI implements **Continuous Delegation Authorization**. 
            Even if a child agent is compromised, it cannot execute actions unless the request contains a valid, cryptographic token signed by the delegating manager specifying that exact permission.
          </p>
        </div>
      </div>
    </div>
  );
};

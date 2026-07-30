import React, { useState } from 'react';
import { Play, Plus, Shield, CheckCircle2, XCircle, Clock, Globe, Activity } from 'lucide-react';
import { createPolicy, api, VerifyResponse } from '../utils/api';
import { SequenceDiagram } from './SequenceDiagram';

interface PolicyPlaygroundProps {
  tenantId: string;
  onRefreshPolicies: () => void;
}

export const PolicyPlayground: React.FC<PolicyPlaygroundProps> = ({ tenantId, onRefreshPolicies }) => {
  // Test parameters
  const [testRole, setTestRole] = useState('DeveloperAgent');
  const [testAction, setTestAction] = useState('Deploy');
  const [testResource, setTestResource] = useState('ProductionServer');
  const [testVpn, setTestVpn] = useState(false);
  const [testTime, setTestTime] = useState('14:00'); // Business hours
  const testAmount = '10000';

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  // Policy Creation Form
  const [policyId, setPolicyId] = useState('');
  const [policyRole, setPolicyRole] = useState('DeveloperAgent');
  const [policyAction, setPolicyAction] = useState('Deploy');
  const [policyResource, setPolicyResource] = useState('ProductionServer');
  const [policyEffect, setPolicyEffect] = useState('Allow');
  const [useVpnCond, setUseVpnCond] = useState(false);
  const [useTimeCond, setUseTimeCond] = useState(false);

  const handleTestEvaluation = async () => {
    setIsRunning(true);
    setResult(null);

    // Build payload mimicking SignedInstruction parameters
    const mockParams: Record<string, any> = {
      amount: parseFloat(testAmount),
      time: testTime,
      env: "Production"
    };

    const payload = {
      action: testAction,
      resource: testResource,
      params: mockParams
    };

    try {
      const res = await api.post<VerifyResponse>('/verify', {
        protocol_version: "1.0",
        instruction_id: `play_${Math.random().toString(36).substring(4)}`,
        sender: testRole.toLowerCase().replace("agent", "_agent"),
        receiver: "developer_agent",
        timestamp: new Date().toISOString(),
        nonce: `nonce_play_${Math.random().toString(36).substring(2)}`,
        kid: `key_${testRole.toLowerCase().replace("agent", "_agent")}_v1`,
        signature: "mock_signature_of_playground",
        payload: payload
      }, {
        headers: {
          "X-Trace-ID": `trace_play_${Math.random().toString(36).substring(4)}`,
          "X-Span-ID": `span_play_${Math.random().toString(36).substring(6)}`
        }
      });
      setResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Playground evaluation request failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyId.trim()) return;

    const conditions: Record<string, any> = {};
    if (useVpnCond) conditions["source_vpn"] = true;
    if (useTimeCond) conditions["time_of_day"] = "09:00-18:00";

    try {
      await createPolicy({
        id: policyId.toLowerCase().replace(/\s+/g, '_'),
        tenant_id: tenantId,
        subject_role: policyRole,
        action: policyAction,
        resource: policyResource,
        effect: policyEffect as 'Allow' | 'Deny',
        conditions: Object.keys(conditions).length > 0 ? conditions : undefined
      });
      alert('OPA Policy successfully compiled and saved in database!');
      setPolicyId('');
      setUseVpnCond(false);
      setUseTimeCond(false);
      onRefreshPolicies();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create policy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">OPA POLICY PLAYGROUND</h2>
        <p className="text-slate-400 text-xs mt-1">
          Dynamically evaluate policy parameters, verify RBAC/ABAC rule matching, and author new security guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Test Engine */}
        <div className="xl:col-span-1 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">
            EVALUATE ATTRIBUTES (ABAC Sandbox)
          </span>

          <div className="space-y-3.5 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">CALLING ROLE (SUBJECT)</label>
              <select
                value={testRole}
                onChange={(e) => setTestRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none text-[11px]"
              >
                <option value="DeveloperAgent">DeveloperAgent</option>
                <option value="ManagerAgent">ManagerAgent</option>
                <option value="PlannerAgent">PlannerAgent</option>
                <option value="DeploymentAgent">DeploymentAgent</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">ACTION (OPERATION)</label>
              <select
                value={testAction}
                onChange={(e) => setTestAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none text-[11px]"
              >
                <option value="Deploy">Deploy</option>
                <option value="WriteCode">WriteCode</option>
                <option value="ReadDatabase">ReadDatabase</option>
                <option value="SearchWeb">SearchWeb</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">TARGET RESOURCE</label>
              <select
                value={testResource}
                onChange={(e) => setTestResource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none text-[11px]"
              >
                <option value="ProductionServer">ProductionServer</option>
                <option value="SourceRepo">SourceRepo</option>
                <option value="Database">Database</option>
                <option value="KnowledgeBase">KnowledgeBase</option>
              </select>
            </div>

            <div className="border-t border-slate-800/80 pt-3 mt-3 space-y-3">
              <span className="text-[9px] text-slate-500 uppercase block">Context Attributes</span>
              
              <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-850">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Company VPN active?</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={testVpn} 
                  onChange={(e) => setTestVpn(e.target.checked)} 
                  className="rounded border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] mb-1">TIME OF DAY</label>
                <input 
                  type="time" 
                  value={testTime} 
                  onChange={(e) => setTestTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-[11px]"
                />
              </div>
            </div>

            <button
              onClick={handleTestEvaluation}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-lg font-mono font-medium shadow-glow-blue flex items-center justify-center space-x-2 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'EVALUATING...' : 'TEST INSTRUCTION'}</span>
            </button>
          </div>
        </div>

        {/* Live Sequencer Results */}
        <div className="xl:col-span-1 space-y-6">
          {isRunning ? (
            <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel h-[500px] flex flex-col justify-center items-center">
              <Activity className="w-12 h-12 text-blue-500 animate-bounce mb-4" />
              <div className="text-xs font-mono text-slate-400 animate-pulse">
                PARSING PIPELINE METRICS... OPA EVALUATION IN PROGRESS...
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className={`p-4 border rounded-xl flex items-center justify-between ${
                result.is_valid ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'
              }`}>
                <div className="flex items-center space-x-3">
                  {result.is_valid ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">EVALUATION OUTCOME</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Verdict: <strong className={result.is_valid ? 'text-emerald-400' : 'text-red-400'}>
                        {result.is_valid ? 'ALLOWED' : 'BLOCKED'}
                      </strong>
                    </span>
                  </div>
                </div>
                {!result.is_valid && (
                  <span className="text-[9px] font-mono bg-red-950 border border-red-800 text-red-400 px-2 py-0.5 rounded uppercase">
                    Deny
                  </span>
                )}
              </div>

              {!result.is_valid && result.failure_reason && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-[10px] font-mono text-red-300">
                  <strong>Denial Reason:</strong> {result.failure_reason}
                </div>
              )}

              <SequenceDiagram 
                stepResults={result.step_results}
                activeStep={null}
                failureReason={result.failure_reason}
              />
            </div>
          ) : (
            <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel h-[500px] flex flex-col justify-center items-center">
              <Shield className="w-12 h-12 text-slate-700 mb-4" />
              <div className="text-xs font-mono text-slate-500 text-center">
                AWAITING SIMULATION TEST RUN. SELECT ATTRIBUTES AND TRIGGER EVALUATION.
              </div>
            </div>
          )}
        </div>

        {/* Policy Authoring */}
        <div className="xl:col-span-1 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">
            COMPILE & SAVE OPA RULES
          </span>

          <form onSubmit={handleSavePolicy} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">POLICY IDENTIFIER</label>
              <input
                type="text"
                required
                placeholder="e.g. pol_developer_code_access"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">SUBJECT (ROLE)</label>
              <select
                value={policyRole}
                onChange={(e) => setPolicyRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none text-[11px]"
              >
                <option value="DeveloperAgent">DeveloperAgent</option>
                <option value="ManagerAgent">ManagerAgent</option>
                <option value="PlannerAgent">PlannerAgent</option>
                <option value="DeploymentAgent">DeploymentAgent</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">ACTION</label>
                <select
                  value={policyAction}
                  onChange={(e) => setPolicyAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-[11px]"
                >
                  <option value="*">* (All)</option>
                  <option value="Deploy">Deploy</option>
                  <option value="WriteCode">WriteCode</option>
                  <option value="ReadDatabase">ReadDatabase</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">RESOURCE</label>
                <select
                  value={policyResource}
                  onChange={(e) => setPolicyResource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-[11px]"
                >
                  <option value="*">* (All)</option>
                  <option value="ProductionServer">ProductionServer</option>
                  <option value="SourceRepo">SourceRepo</option>
                  <option value="Database">Database</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">EFFECT</label>
              <select
                value={policyEffect}
                onChange={(e) => setPolicyEffect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none text-[11px]"
              >
                <option value="Allow">Allow</option>
                <option value="Deny">Deny</option>
              </select>
            </div>

            <div className="border-t border-slate-800/80 pt-3 space-y-3">
              <span className="text-[9px] text-slate-500 uppercase block">ABAC Policy Conditions</span>
              
              <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-850">
                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Enforce Company VPN</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={useVpnCond} 
                  onChange={(e) => setUseVpnCond(e.target.checked)} 
                  className="rounded border-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-850">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Enforce Business Hours</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={useTimeCond} 
                  onChange={(e) => setUseTimeCond(e.target.checked)} 
                  className="rounded border-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 rounded-lg font-mono font-medium shadow-glow-green flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>COMPILE & SAVE RULE</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  RefreshCw, 
  Play, 
  ArrowRight, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../utils/api';

export const SimpleMediatorSandbox: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [mediatorPluggedIn, setMediatorPluggedIn] = useState<boolean>(true);
  const [selectedScenario, setSelectedScenario] = useState<string>('normal');
  
  // Sandbox state from backend
  const [sandboxInfo, setSandboxInfo] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const scenarios = [
    { 
      id: 'normal', 
      label: 'NORMAL SANCTIONED ACTION', 
      desc: 'agent alpha sends a valid signed backup logs command.', 
      action: 'BackupLogs', 
      resource: 'BackupServer', 
      params: { target: 's3://secure-backup-bucket' },
      attack_type: 'none'
    },
    { 
      id: 'fake_key', 
      label: 'UNREGISTERED KEY EXPLOIT', 
      desc: 'agent alpha signs the command using a fake unrecognized key.', 
      action: 'BackupLogs', 
      resource: 'BackupServer', 
      params: { target: 's3://secure-backup-bucket' },
      attack_type: 'fake_key'
    },
    { 
      id: 'malicious_command', 
      label: 'COMMAND INJECTION ATTACK', 
      desc: 'agent alpha attempts to inject a destructive rm -rf command in params.', 
      action: 'ExecuteScript', 
      resource: 'ProductionHost', 
      params: { command: 'rm -rf /app/backup' },
      attack_type: 'malicious_command'
    }
  ];

  const fetchSandboxInfo = async () => {
    try {
      const res = await api.get('/simple-sandbox/info');
      setSandboxInfo(res.data);
    } catch (err) {
      console.error('failed to fetch sandbox info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSandboxInfo();
  }, []);

  const handleSimulate = async () => {
    setRunning(true);
    setSimulationResult(null);
    const scenario = scenarios.find(s => s.id === selectedScenario);
    if (!scenario) return;

    try {
      const res = await api.post('/simple-sandbox/simulate', {
        action: scenario.action,
        resource: scenario.resource,
        params: scenario.params,
        mediator_plugged_in: mediatorPluggedIn,
        attack_type: scenario.attack_type
      });
      setSimulationResult(res.data);
      // Refresh sandbox state logs
      await fetchSandboxInfo();
    } catch (err) {
      console.error('simulation run failed:', err);
      alert('failed to run simulation.');
    } finally {
      setRunning(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setSimulationResult(null);
    try {
      await api.post('/simple-sandbox/reset');
      setMediatorPluggedIn(true);
      setSelectedScenario('normal');
      await fetchSandboxInfo();
    } catch (err) {
      console.error('reset sandbox failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[500px]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <span className="text-xs font-mono text-slate-500">synchronizing sandbox environment...</span>
      </div>
    );
  }

  const alpha = sandboxInfo?.agent_alpha;
  const beta = sandboxInfo?.agent_beta;
  const med = sandboxInfo?.mediator;

  // check if agent beta is currently compromised
  const isBetaCompromised = beta?.logs?.some((log: any) => log.is_compromised);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">PLUG-IN ZERO-TRUST GATEWAY SANDBOX</h2>
          <p className="text-slate-400 text-xs mt-1">
            demonstrating isolation of 2 separate agents mediated by a pluggable security system.
          </p>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 py-2 px-4 rounded transition-colors text-xs font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESET ENVIRONMENT</span>
        </button>
      </div>

      {/* Main Sandbox Visualizer */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        
        {/* Agent Alpha Block */}
        <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                SENDER MODULE
              </span>
              <span className="text-[9px] font-mono bg-blue-950/60 border border-blue-900/40 text-blue-400 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white uppercase mb-2">AGENT ALPHA</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              this agent generates instructions and cryptographically signs payloads using its unique private key. it cannot directly access agent beta's runtime environment.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">KEY IDENTIFIER (KID)</span>
                <span className="text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-900 block font-semibold">
                  {alpha?.kid}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">PUBLIC KEY PEM (VERIFICATION TARGET)</span>
                <pre className="text-[9px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-900 overflow-x-auto h-24 max-h-24">
                  {alpha?.public_key}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">MODULE PATH</span>
            <code className="text-[10px] text-blue-400 font-mono">simple_agent_system/agents/agent_alpha.py</code>
          </div>
        </div>

        {/* Security Mediator (Pluggable) Block */}
        <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel flex flex-col justify-between relative overflow-hidden">
          {/* Plugin Toggle Header */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                SECURITY MEDIATOR PLUGIN
              </span>
              
              {/* Plugin Switch */}
              <button
                onClick={() => setMediatorPluggedIn(!mediatorPluggedIn)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono border transition-all duration-350 ${
                  mediatorPluggedIn 
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400 shadow-glow-green/5' 
                    : 'bg-red-950/60 border-red-800/80 text-red-400 shadow-glow-red/5'
                }`}
              >
                {mediatorPluggedIn ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{mediatorPluggedIn ? 'PLUGGED IN (ACTIVE)' : 'PLUGGED OUT (BYPASSED)'}</span>
              </button>
            </div>

            <h3 className="text-lg font-bold text-white uppercase mb-2">GATEWAY MEDIATOR</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              intercepts messages to verify cryptographic integrity using agent alpha's public key, and scans payloads for threat behavior. can be plugged out to simulate direct unverified communications.
            </p>

            {/* Visual Indicator of plugin route */}
            <div className="flex justify-center items-center py-4 space-x-3 bg-slate-950/40 rounded-lg border border-slate-900 mb-4">
              <span className="text-[10px] font-mono text-blue-400">ALPHA</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
              
              <div className={`p-2.5 rounded-lg border transition-all ${
                mediatorPluggedIn 
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-400' 
                  : 'bg-slate-900 border-slate-850 text-slate-600 line-through'
              }`}>
                <Shield className="w-5 h-5" />
              </div>
              
              <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[10px] font-mono text-purple-400">BETA</span>
            </div>

            {/* Mediator logs */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                MEDIATOR AUDIT STREAM
              </span>
              <div className="bg-slate-950 border border-slate-900 rounded p-3 h-36 max-h-36 overflow-y-auto font-mono text-[10px] space-y-2">
                {med?.logs?.length === 0 ? (
                  <div className="text-slate-600 text-center py-8">no security transactions recorded.</div>
                ) : (
                  med?.logs?.map((log: any, idx: number) => (
                    <div key={idx} className={`pb-1.5 border-b border-slate-900/60 last:border-b-0 ${
                      log.verdict === 'blocked' ? 'text-red-400' : log.verdict === 'bypassed' ? 'text-yellow-500 animate-pulse' : 'text-emerald-400'
                    }`}>
                      <div className="flex justify-between font-bold">
                        <span>verdict: {log.verdict}</span>
                        <span>level: {log.threat_level}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850 flex justify-between items-center">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block">MODULE PATH</span>
              <code className="text-[10px] text-blue-400 font-mono">simple_agent_system/security/mediator.py</code>
            </div>
          </div>
        </div>

        {/* Agent Beta Block */}
        <div className={`border rounded-xl p-6 glass-panel flex flex-col justify-between transition-all ${
          isBetaCompromised 
            ? 'border-red-950/80 bg-red-950/5 shadow-glow-red/5' 
            : 'border-slate-850 bg-slate-900/35'
        }`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                RECEIVER MODULE
              </span>
              
              {isBetaCompromised ? (
                <span className="text-[9px] font-mono bg-red-950 border border-red-900 text-red-400 px-2 py-0.5 rounded animate-pulse font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                  <span>COMPROMISED</span>
                </span>
              ) : (
                <span className="text-[9px] font-mono bg-purple-950/60 border border-purple-900/40 text-purple-400 px-2 py-0.5 rounded">
                  STANDBY
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white uppercase mb-2">AGENT BETA</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              this agent receives instructions and executes them. it trusts incoming commands blindly if the mediator is plugged out, demonstrating vulnerability to unauthorized triggers.
            </p>

            {/* Executed Logs */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                BETA TRANSACTION LEDGER
              </span>
              <div className="bg-slate-950 border border-slate-900 rounded p-3 h-44 max-h-44 overflow-y-auto font-mono text-[10px] space-y-2">
                {beta?.logs?.length === 0 ? (
                  <div className="text-slate-600 text-center py-12">no executed instructions.</div>
                ) : (
                  beta?.logs?.map((log: any, idx: number) => (
                    <div key={idx} className={`pb-2 border-b border-slate-900/60 last:border-b-0 ${
                      log.status === 'compromised' ? 'text-red-400 font-bold' : 'text-slate-300'
                    }`}>
                      <div className="flex justify-between">
                        <span>action: {log.action}</span>
                        <span className={log.status === 'compromised' ? 'text-red-400' : 'text-emerald-400'}>
                          [{log.status}]
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">MODULE PATH</span>
            <code className="text-[10px] text-blue-400 font-mono">simple_agent_system/agents/agent_beta.py</code>
          </div>
        </div>

      </div>

      {/* Interaction Controller */}
      <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white uppercase">TRIGGER INTER-AGENT COMMUNICATION</h3>
          <p className="text-slate-400 text-xs mt-1">
            select an instruction scenario and test how the gateway blocks or allows communication based on its plugin status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setSelectedScenario(sc.id)}
              className={`p-4 border rounded-lg text-left transition-all flex flex-col justify-between ${
                selectedScenario === sc.id
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-glow-blue/5'
                  : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/30'
              }`}
            >
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                {sc.label}
              </span>
              <p className="text-[10px] text-slate-500">{sc.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSimulate}
            disabled={running}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors text-xs font-mono shadow-glow-blue/10 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{running ? 'RUNNING TRANSACTION...' : 'EXECUTE TRANSACTION CHANNEL'}</span>
          </button>
        </div>
      </div>

      {/* Step Execution Telemetry Details */}
      {simulationResult && (
        <div className="border border-slate-850 bg-slate-900/15 rounded-xl p-6 glass-panel space-y-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-850 pb-2">
            SIMULATION STEP TRANSACTION REPORT
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instruction Payload */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-300">SENT INSTRUCTION DATA</h4>
              <div className="bg-slate-950 border border-slate-900 rounded p-4 font-mono text-[10px] space-y-2">
                <div>
                  <span className="text-slate-500 block uppercase">sender identifier</span>
                  <span className="text-slate-300">{simulationResult.instruction.sender}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">receiver identifier</span>
                  <span className="text-slate-300">{simulationResult.instruction.receiver}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">cryptographic key signature (kid)</span>
                  <span className="text-slate-300">{simulationResult.instruction.kid}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">raw payload digest</span>
                  <pre className="text-slate-400 mt-1 bg-slate-900/60 p-2 rounded border border-slate-950 overflow-x-auto">
                    {JSON.stringify(simulationResult.instruction.payload, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase">cryptographic signature</span>
                  <pre className="text-slate-400 mt-1 bg-slate-900/60 p-2 rounded border border-slate-950 overflow-x-auto text-[8px] break-all white-space-pre-wrap">
                    {simulationResult.instruction.signature}
                  </pre>
                </div>
              </div>
            </div>

            {/* Validation & Execution Results */}
            <div className="space-y-4">
              {/* Validation Card */}
              <div className={`p-4 rounded-lg border ${
                simulationResult.verification.verdict === 'blocked'
                  ? 'bg-red-950/20 border-red-900/40'
                  : simulationResult.verification.verdict === 'bypassed'
                  ? 'bg-yellow-950/20 border-yellow-900/40'
                  : 'bg-emerald-950/20 border-emerald-900/40'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {simulationResult.verification.verdict === 'blocked' ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : simulationResult.verification.verdict === 'bypassed' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  )}
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    mediator verdict: {simulationResult.verification.verdict}
                  </h4>
                </div>

                <div className="font-mono text-[10px] space-y-1">
                  {simulationResult.verification.reason && (
                    <div>
                      <span className="text-slate-500 uppercase block">rejection reason</span>
                      <span className="text-red-400 font-semibold">{simulationResult.verification.reason}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 uppercase block">verdict explanation</span>
                    <p className="text-slate-300 mt-0.5">{simulationResult.verification.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Execution Card */}
              <div className={`p-4 rounded-lg border ${
                simulationResult.execution?.status === 'compromised'
                  ? 'bg-red-950/30 border-red-900/60 shadow-glow-red/5'
                  : simulationResult.execution
                  ? 'bg-purple-950/20 border-purple-900/40'
                  : 'bg-slate-950 border-slate-900'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  receiver execution status: {simulationResult.execution?.status || 'no execution'}
                </h4>
                
                {simulationResult.execution ? (
                  <div className="font-mono text-[10px] space-y-1">
                    <div>
                      <span className="text-slate-500 uppercase block">agent beta logs</span>
                      <p className={`mt-0.5 font-semibold ${
                        simulationResult.execution.status === 'compromised' ? 'text-red-400 animate-pulse' : 'text-slate-300'
                      }`}>
                        {simulationResult.execution.details}
                      </p>
                    </div>
                    {simulationResult.execution.is_compromised && (
                      <div className="mt-2 p-2 bg-red-950/40 border border-red-900/50 rounded flex items-center space-x-2 text-red-400 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                        <span>security alert: instruction executed without mediation check! agent state corrupted!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">
                    instruction blocked by mediator. no execution request sent to agent beta.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

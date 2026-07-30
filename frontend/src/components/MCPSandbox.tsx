import React, { useState } from 'react';
import { Terminal, Shield, Play, Key, Database, Globe, Zap } from 'lucide-react';
import { api, VerifyResponse } from '../utils/api';
import { SequenceDiagram } from './SequenceDiagram';

export const MCPSandbox: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('research_agent');
  const [selectedTool, setSelectedTool] = useState('fetch_uri');
  const [toolParams, setToolParams] = useState('{"uri": "https://api.github.com/repos"}');
  
  // Results
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [rawPayload, setRawPayload] = useState<any | null>(null);

  const toolsList = [
    { id: 'fetch_uri', name: 'fetch_uri', desc: 'Read content from a public web URI', icon: Globe, defaultParams: '{"uri": "https://api.github.com/repos"}' },
    { id: 'read_secrets', name: 'read_secrets', desc: 'Retrieve system access tokens from vault', icon: Key, defaultParams: '{"secret_name": "db_auth_token"}' },
    { id: 'write_database', name: 'write_database', desc: 'Write configuration records to the data base', icon: Database, defaultParams: '{"table": "users", "records": [{"id": 1, "role": "admin"}]}' },
    { id: 'execute_system_command', name: 'execute_system_command', desc: 'Execute bash shell scripts on host', icon: Terminal, defaultParams: '{"command": "rm -rf /"}' }
  ];

  const handleToolChange = (toolId: string) => {
    setSelectedTool(toolId);
    const tool = toolsList.find(t => t.id === toolId);
    if (tool) setToolParams(tool.defaultParams);
  };

  const handleExecute = async () => {
    setIsRunning(true);
    setResult(null);
    
    // Parse params
    let parsedParams = {};
    try {
      parsedParams = JSON.parse(toolParams);
    } catch (e) {
      alert('Invalid JSON parameters format');
      setIsRunning(false);
      return;
    }

    // Wrap in SentinelTrust protocol structure
    const payload = {
      action: selectedTool,
      resource: 'MCPToolServer',
      params: parsedParams
    };
    
    setRawPayload({
      protocol_version: '1.0',
      instruction_id: `mcp_${Math.random().toString(36).substring(4)}`,
      sender: selectedAgent,
      receiver: 'mcp_server',
      timestamp: new Date().toISOString(),
      nonce: `nonce_${Math.random().toString(36).substring(2)}`,
      kid: `key_${selectedAgent}_v1`,
      payload: payload
    });

    try {
      // Send directly to the gateway verify endpoint
      const res = await api.post<VerifyResponse>('/verify', {
        protocol_version: '1.0',
        instruction_id: `mcp_${Math.random().toString(36).substring(4)}`,
        sender: selectedAgent,
        receiver: 'mcp_server',
        timestamp: new Date().toISOString(),
        nonce: `nonce_${Math.random().toString(36).substring(2)}`,
        kid: `key_${selectedAgent}_v1`,
        signature: 'mock_signature_of_mcp_client',
        payload: payload
      });
      
      setResult(res.data);
    } catch (err: any) {
      alert('MCP Sandbox execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">MCP SECURITY GATEWAY SANDBOX</h2>
        <p className="text-slate-400 text-xs mt-1">
          Validate Model Context Protocol (MCP) tool execution requests against enterprise Zero Trust controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configure Tool */}
        <div className="space-y-6 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-4 border-b border-slate-800 pb-2">
              MCP SESSION SETTINGS
            </span>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">CALLING AGENT (MCP CLIENT)</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
                >
                  <option value="research_agent">ResearchAgent (Low Privilege)</option>
                  <option value="manager_agent">ManagerAgent (High Privilege)</option>
                  <option value="developer_agent">DeveloperAgent (Medium Privilege)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">MCP TARGET TOOL</label>
                <div className="space-y-2">
                  {toolsList.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleToolChange(t.id)}
                        className={`w-full p-2.5 border rounded-lg text-left flex items-start space-x-3 transition-all ${
                          selectedTool === t.id
                            ? 'bg-blue-600/10 border-blue-500/60'
                            : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40'
                        }`}
                      >
                        <div className={`p-1.5 rounded border ${
                          selectedTool === t.id ? 'bg-blue-950 border-blue-800 text-blue-400' : 'bg-slate-900 border-slate-850 text-slate-500'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-200">{t.name}</div>
                          <div className="text-[8px] text-slate-500">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">TOOL ARGUMENTS (JSON)</label>
                <textarea
                  rows={3}
                  value={toolParams}
                  onChange={(e) => setToolParams(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none"
                />
              </div>

              <button
                onClick={handleExecute}
                disabled={isRunning}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-lg font-mono font-medium shadow-glow-blue flex items-center justify-center space-x-2 transition-all"
              >
                <Play className="w-4 h-4" />
                <span>{isRunning ? 'VERIFYING...' : 'AUTHORIZE MCP TOOL'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Evaluation Output */}
        <div className="lg:col-span-2 space-y-6">
          {isRunning ? (
            <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel h-[500px] flex flex-col justify-center items-center">
              <Zap className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <div className="text-xs font-mono text-slate-500 animate-pulse">
                INTERCEPTING MCP SESSION CALL...
              </div>
            </div>
          ) : result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telemetry Result */}
              <div className="space-y-6">
                <div className={`border rounded-xl p-6 glass-panel space-y-4 ${
                  result.is_valid ? 'border-emerald-900/40 bg-emerald-950/5' : 'border-red-900/40 bg-red-950/5'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      result.is_valid ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-red-950 border border-red-800 text-red-400'
                    }`}>
                      VERDICT: {result.is_valid ? 'ALLOWED' : 'BLOCKED'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">MCP PROTOCOL</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase font-mono">
                      Tool: {selectedTool}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Result: <strong className={result.is_valid ? 'text-emerald-400' : 'text-red-400'}>
                        {result.is_valid ? 'Authorized and executed successfully.' : result.failure_reason}
                      </strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-xs font-mono">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">THREAT LEVEL</span>
                      <span className={result.is_valid ? 'text-emerald-400' : 'text-red-500'}>
                        {result.threat_level}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">RISK INDEX</span>
                      <span className={result.is_valid ? 'text-emerald-400' : 'text-red-400'}>
                        {result.risk_score} / 100
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Explainability */}
                {result.explanation ? (
                  <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel space-y-4">
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2">
                      <Shield className="w-3.5 h-3.5" />
                      <span>AI EXPLAINABILITY DIALOGUE</span>
                    </div>
                    <div className="space-y-3 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">ANALYSIS</span>
                        <p className="text-slate-300 mt-1 leading-relaxed">{result.explanation.human_explanation}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">SUGGESTED RECONCILIATION</span>
                        <p className="text-emerald-400 mt-1 font-semibold">{result.explanation.suggested_fix}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  result.is_valid && (
                    <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel space-y-2 text-xs font-mono">
                      <div className="text-[9px] text-slate-500 uppercase font-bold">RAW PAYLOAD SENT</div>
                      <pre className="text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-850 mt-1 overflow-x-auto text-[10px]">
                        {JSON.stringify(rawPayload, null, 2)}
                      </pre>
                    </div>
                  )
                )}
              </div>

              {/* Step checklist */}
              <SequenceDiagram
                stepResults={result.step_results}
                activeStep={null}
                failureReason={result.failure_reason || null}
              />
            </div>
          ) : (
            <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel h-[500px] flex flex-col justify-center items-center">
              <Shield className="w-12 h-12 text-slate-700 mb-4" />
              <div className="text-xs font-mono text-slate-500">
                AWAITING MCP TRANSACTION ACTION. CONFIGURE SETTINGS TO VALIDATE TOOL PROTOCOLS.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

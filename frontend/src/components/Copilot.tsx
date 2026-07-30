import React, { useState, useEffect, useRef } from 'react';
import { Send, Cpu, Bot, User, Shield, Key } from 'lucide-react';
import { askCopilot, AuditLog, getAuditLogs } from '../utils/api';

interface CopilotProps {
  tenantId: string;
  initialLogId?: string;
  onClearInitialLog: () => void;
}

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  suggestedAction?: string;
  relevantPolicyId?: string;
  timestamp: string;
}

export const Copilot: React.FC<CopilotProps> = ({ tenantId, initialLogId, onClearInitialLog }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: "Hello. I am the SentinelTrust AI Security Copilot. I analyze agent directories, OPA permissions, and incident logs. Ask me how to remediate anomalies, review ABAC conditions, or analyze recent threats.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [incidentLogs, setIncidentLogs] = useState<AuditLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchIncidents = async () => {
    try {
      const res = await getAuditLogs({ tenant_id: tenantId, incident_only: true });
      setIncidentLogs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [tenantId]);

  // Load initial incident context if navigated from Incident Center
  useEffect(() => {
    if (initialLogId) {
      setSelectedLogId(initialLogId);
      const query = "Analyze this incident log and explain the root cause and suggested remediation.";
      setInputQuery(query);
      handleSend(query, initialLogId);
      onClearInitialLog();
    }
  }, [initialLogId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string, overrideLogId?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const activeLogId = overrideLogId !== undefined ? overrideLogId : selectedLogId;
      const res = await askCopilot(textToSend, tenantId, activeLogId || undefined);
      const copMsg: Message = {
        sender: 'copilot',
        text: res.data.answer,
        suggestedAction: res.data.suggested_action,
        relevantPolicyId: res.data.relevant_policy_id || undefined,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, copMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'copilot',
        text: 'Sorry, I encountered an error communicating with the security gateway backend. Please check connection.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestion = (suggestion: string) => {
    setInputQuery(suggestion);
    handleSend(suggestion);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">AI SECURITY COPILOT</h2>
        <p className="text-slate-400 text-xs mt-1">
          Query the Gemini-powered virtual security analyst for real-time compliance insights and policy audits.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Incident Context Selector */}
        <div className="xl:col-span-1 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-4 h-fit">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">
            COPILOT QUERY CONTEXT
          </span>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">SELECT TARGET INCIDENT LOG</label>
              <select
                value={selectedLogId}
                onChange={(e) => setSelectedLogId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none text-[11px]"
              >
                <option value="">No Active Incident Context</option>
                {incidentLogs.map(log => (
                  <option key={log.id} value={log.id}>
                    {log.id.slice(0, 10).toUpperCase()} - {log.failure_reason?.slice(0, 20)}...
                  </option>
                ))}
              </select>
            </div>
            
            {selectedLogId && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded text-[10px] text-slate-400 leading-relaxed">
                Incident metadata has been attached as prompt context. Ask the Copilot to analyze it.
              </div>
            )}

            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <span className="text-[9px] text-slate-500 block uppercase">EXAMPLE PROMPTS</span>
              <button 
                onClick={() => loadSuggestion("How do I solve cross-tenant instruction routing violations?")}
                className="w-full text-left p-2 border border-slate-850 bg-slate-950/40 hover:bg-slate-900/40 rounded text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                "Solve cross-tenant violations..."
              </button>
              <button 
                onClick={() => loadSuggestion("Explain the OPA-inspired ABAC VPN policy pol_07 requirements.")}
                className="w-full text-left p-2 border border-slate-850 bg-slate-950/40 hover:bg-slate-900/40 rounded text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                "Explain OPA VPN policies..."
              </button>
              <button 
                onClick={() => loadSuggestion("Analyze the sliding-window rate limit anomaly checks.")}
                className="w-full text-left p-2 border border-slate-850 bg-slate-950/40 hover:bg-slate-900/40 rounded text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                "Analyze rate limit thresholds..."
              </button>
            </div>
          </div>
        </div>

        {/* Chat Console */}
        <div className="xl:col-span-3 border border-slate-800 bg-slate-900/35 rounded-xl glass-panel h-[560px] flex flex-col justify-between overflow-hidden">
          {/* Console Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center space-x-3">
            <Bot className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">SENTINELTRUST virtual analyst</h3>
              <span className="text-[9px] text-slate-500 font-mono">Real-time LLM-backed security dialogue logs</span>
            </div>
          </div>

          {/* Messages scroll box */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex space-x-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`p-2 rounded-lg border flex-shrink-0 ${
                  msg.sender === 'user' ? 'bg-blue-950 border-blue-800 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-2">
                  <div className={`p-3.5 rounded-lg border ${
                    msg.sender === 'user' ? 'bg-blue-600/10 border-blue-500/40 text-blue-200' : 'bg-slate-950/60 border-slate-850 text-slate-300'
                  }`}>
                    {msg.text}
                  </div>
                  
                  {/* Assistant Actions block */}
                  {msg.sender === 'copilot' && (msg.suggestedAction || msg.relevantPolicyId) && (
                    <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg space-y-2 text-[10px]">
                      <span className="text-[8px] text-slate-500 uppercase font-mono block">SUGGESTED COPILOT ACTIONS</span>
                      {msg.suggestedAction && (
                        <div className="text-emerald-400 flex items-start space-x-1.5">
                          <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>Action: <strong>{msg.suggestedAction}</strong></span>
                        </div>
                      )}
                      {msg.relevantPolicyId && (
                        <div className="text-blue-400 flex items-start space-x-1.5">
                          <Key className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>Policy Context: Target Policy ID {msg.relevantPolicyId}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <span className="text-[8px] text-slate-500 block text-right font-mono mt-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex space-x-3 max-w-[80%]">
                <div className="p-2 rounded-lg border bg-slate-900 border-slate-800 text-slate-400 animate-pulse">
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-lg text-slate-500 animate-pulse">
                  Analyzing system state... executing trace audits...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form console input */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center space-x-3.5"
            >
              <input
                type="text"
                placeholder="Ask Virtual Copilot for audit, policy, or remediation recommendations..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white p-3 rounded-lg shadow-glow-blue flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

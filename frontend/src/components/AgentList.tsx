import React, { useState } from 'react';
import { 
  Key, 
  RefreshCw, 
  UserCheck, 
  UserMinus, 
  ShieldAlert, 
  Plus, 
  X, 
  Clipboard, 
  Check 
} from 'lucide-react';
import { Agent, registerAgent, toggleAgentStatus, rotateKeys } from '../utils/api';

interface AgentListProps {
  agents: Agent[];
  onRefresh: () => void;
}

export const AgentList: React.FC<AgentListProps> = ({ agents, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('DeveloperAgent');
  const [newPerms, setNewPerms] = useState('ReadDatabase, WriteFile');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) return;
    
    try {
      const perms = newPerms.split(',').map(p => p.trim()).filter(Boolean);
      await registerAgent({
        id: newId.toLowerCase().replace(/\s+/g, '_'),
        name: newName,
        role: newRole,
        permissions: perms,
        delegation_scope: { allowed_actions: perms }
      });
      
      // Reset form
      setNewId('');
      setNewName('');
      setNewRole('DeveloperAgent');
      setNewPerms('ReadDatabase, WriteFile');
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register agent');
    }
  };

  const handleStatusToggle = async (agentId: string, status: 'Active' | 'Suspended' | 'Revoked') => {
    try {
      await toggleAgentStatus(agentId, status);
      onRefresh();
    } catch (err) {
      alert('Failed to update agent status');
    }
  };

  const handleRotateKeys = async (agentId: string) => {
    try {
      await rotateKeys(agentId);
      alert(`RSA certificate key pair rotated successfully for agent: ${agentId}`);
      onRefresh();
    } catch (err) {
      alert('Key rotation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">AGENT DIRECTORY</h2>
          <p className="text-slate-400 text-xs mt-1">Directory of registered autonomous agents and credential statuses.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 font-mono font-medium shadow-glow-blue transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER SECURE AGENT</span>
        </button>
      </div>

      {/* Grid of registered agents */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="border border-slate-800 bg-slate-900/30 rounded-xl p-6 glass-panel flex flex-col justify-between">
            {/* Identity & Status */}
            <div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded">
                      {agent.role}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">KID: {agent.kid}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{agent.name}</h3>
                  <p className="text-xs font-mono text-slate-500">{agent.id}</p>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  {/* Status Badge */}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    agent.status === 'Active' ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' :
                    agent.status === 'Suspended' ? 'bg-yellow-950 border border-yellow-800 text-yellow-400' :
                    'bg-red-950 border border-red-800 text-red-400'
                  }`}>
                    {agent.status}
                  </span>

                  {/* Trust Score */}
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-slate-500 block">TRUST SCORE</span>
                    <span className={`text-sm font-mono font-bold ${
                      agent.trust_score >= 80 ? 'text-emerald-400' :
                      agent.trust_score >= 50 ? 'text-yellow-400' :
                      agent.trust_score >= 30 ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {agent.trust_score.toFixed(1)} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    agent.trust_score >= 80 ? 'bg-emerald-500' :
                    agent.trust_score >= 50 ? 'bg-yellow-500' :
                    agent.trust_score >= 30 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${agent.trust_score}%` }}
                />
              </div>

              {/* Agent Grid Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 font-mono text-[9px] text-slate-500">
                <div className="p-2 bg-slate-950/40 border border-slate-850 rounded">
                  <span>RISK INDEX</span>
                  <span className={`block font-bold text-[10px] mt-0.5 uppercase ${
                    agent.trust_score >= 80 ? 'text-emerald-400' :
                    agent.trust_score >= 50 ? 'text-yellow-400' :
                    agent.trust_score >= 30 ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {agent.trust_score >= 80 ? 'Low' :
                     agent.trust_score >= 50 ? 'Medium' :
                     agent.trust_score >= 30 ? 'High' : 'Critical'}
                  </span>
                </div>
                <div className="p-2 bg-slate-950/40 border border-slate-850 rounded">
                  <span>MSG PROCESSED</span>
                  <span className="block font-bold text-[10px] text-slate-300 mt-0.5">
                    {agent.role === 'ManagerAgent' ? '184' :
                     agent.role === 'PlannerAgent' ? '142' :
                     agent.role === 'DeveloperAgent' ? '238' : '96'}
                  </span>
                </div>
                <div className="p-2 bg-slate-950/40 border border-slate-850 rounded">
                  <span>SUCCESS RATE</span>
                  <span className="block font-bold text-[10px] text-emerald-400 mt-0.5">
                    {Math.min(100.0, agent.trust_score * 0.98 + (agent.id === 'planner_agent' ? 5 : 0)).toFixed(1)}%
                  </span>
                </div>
                <div className="p-2 bg-slate-950/40 border border-slate-850 rounded">
                  <span>CERT VALIDITY</span>
                  <span className={`block font-bold text-[10px] mt-0.5 ${agent.status === 'Revoked' ? 'text-red-400' : 'text-slate-400'}`}>
                    {agent.status === 'Revoked' ? 'EXPIRED' : 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Collapsible Key details */}
              <div className="mt-6 border border-slate-800/80 bg-slate-950/60 p-3 rounded-lg flex items-center justify-between font-mono text-[10px] text-slate-400">
                <div className="flex items-center space-x-2 truncate">
                  <Key className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">Public Certificate: {agent.public_key_pem}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(agent.public_key_pem, agent.id)}
                  className="p-1 hover:text-white transition-colors"
                  title="Copy Public Key"
                >
                  {copiedId === agent.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex space-x-1.5">
                {agent.status !== 'Active' && (
                  <button
                    onClick={() => handleStatusToggle(agent.id, 'Active')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs flex items-center space-x-1 transition-all"
                    title="Activate Agent"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">ACTIVATE</span>
                  </button>
                )}
                {agent.status === 'Active' && (
                  <button
                    onClick={() => handleStatusToggle(agent.id, 'Suspended')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-yellow-400 rounded-lg text-xs flex items-center space-x-1 transition-all"
                    title="Suspend Agent"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">SUSPEND</span>
                  </button>
                )}
                {agent.status !== 'Revoked' && (
                  <button
                    onClick={() => handleStatusToggle(agent.id, 'Revoked')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg text-xs flex items-center space-x-1 transition-all"
                    title="Revoke Keys"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">REVOKE</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => handleRotateKeys(agent.id)}
                className="px-3 py-2 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-mono flex items-center space-x-1.5 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                <span>ROTATE CERTIFICATE</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Agent */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-md">Register New Agent Credentials</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">AGENT UNIQUE ID (e.g. analysis_agent)</label>
                <input
                  type="text"
                  required
                  placeholder="planner_agent"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">AGENT DISPLAY NAME</label>
                <input
                  type="text"
                  required
                  placeholder="Task Planner Agent"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">RBAC SYSTEM ROLE</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ManagerAgent">ManagerAgent (Supervisor)</option>
                  <option value="PlannerAgent">PlannerAgent (Task Layout)</option>
                  <option value="ResearchAgent">ResearchAgent (Knowledge Search)</option>
                  <option value="DeveloperAgent">DeveloperAgent (Code Writer)</option>
                  <option value="TestingAgent">TestingAgent (Test Orchestration)</option>
                  <option value="ReviewerAgent">ReviewerAgent (Audit Checker)</option>
                  <option value="DeploymentAgent">DeploymentAgent (Prod Deploy)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DEFAULT DELEGATED SCOPES (Comma separated)</label>
                <input
                  type="text"
                  placeholder="ReadDatabase, WriteFile"
                  value={newPerms}
                  onChange={(e) => setNewPerms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-glow-blue"
                >
                  Generate Keypair & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

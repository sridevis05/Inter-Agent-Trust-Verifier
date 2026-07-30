import React, { useState } from 'react';
import { 
  Trash2, 
  Plus, 
  X, 
  Globe, 
  Lock, 
  ShieldAlert 
} from 'lucide-react';
import { Policy, createPolicy, deletePolicy } from '../utils/api';

interface PolicyManagerProps {
  policies: Policy[];
  onRefresh: () => void;
}

export const PolicyManager: React.FC<PolicyManagerProps> = ({ policies, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [newId, setNewId] = useState('');
  const [newRole, setNewRole] = useState('DeveloperAgent');
  const [newAction, setNewAction] = useState('WriteCode');
  const [newResource, setNewResource] = useState('SourceRepo');
  const [newEffect, setNewEffect] = useState<'Allow' | 'Deny'>('Allow');
  
  // Conditions helpers
  const [useVpn, setUseVpn] = useState(false);
  const [timeRange, setTimeRange] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const [allowedEnv, setAllowedEnv] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await deletePolicy(id);
      onRefresh();
    } catch (err) {
      alert('Failed to delete policy');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newAction || !newResource) return;

    // Build conditions object
    const conditions: Record<string, any> = {};
    if (useVpn) conditions["source_vpn"] = true;
    if (timeRange) conditions["time_of_day"] = timeRange; // e.g. 09:00-18:00
    if (maxAmt) conditions["max_amount"] = Number(maxAmt);
    if (allowedEnv) conditions["allowed_env"] = allowedEnv; // e.g. Production

    try {
      await createPolicy({
        id: newId.toLowerCase().replace(/\s+/g, '_'),
        subject_role: newRole,
        action: newAction,
        resource: newResource,
        effect: newEffect,
        conditions: Object.keys(conditions).length > 0 ? conditions : undefined
      });

      // Clear Form
      setNewId('');
      setNewAction('WriteCode');
      setNewResource('SourceRepo');
      setNewEffect('Allow');
      setUseVpn(false);
      setTimeRange('');
      setMaxAmt('');
      setAllowedEnv('');
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create policy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">POLICY COMPILER</h2>
          <p className="text-slate-400 text-xs mt-1">Manage OPA-inspired RBAC and ABAC access parameters dynamically.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 font-mono font-medium shadow-glow-blue transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>COMPILE NEW POLICY</span>
        </button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <div 
            key={policy.id} 
            className={`border rounded-xl p-5 glass-panel flex flex-col justify-between hover:border-slate-700 transition-all ${
              policy.effect === 'Deny' ? 'border-red-950/40 bg-red-950/5' : 'border-slate-800 bg-slate-900/35'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500">ID: {policy.id}</span>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {policy.subject_role} <span className="text-slate-500">→</span> {policy.action}
                  </h4>
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                  policy.effect === 'Allow' 
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' 
                    : 'bg-red-950 border border-red-800 text-red-400'
                }`}>
                  {policy.effect}
                </span>
              </div>

              {/* Resource Target */}
              <div className="mt-4 flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-mono">Resource:</span>
                <span className="font-semibold font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {policy.resource}
                </span>
              </div>

              {/* Conditions details */}
              <div className="mt-4 space-y-2">
                <span className="text-[9px] font-mono text-slate-500 block">ABAC CONDITIONS</span>
                {!policy.conditions || Object.keys(policy.conditions).length === 0 ? (
                  <div className="text-[10px] font-mono text-slate-500 italic">No conditional restrictions active (Unconditional).</div>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(policy.conditions).map(([key, val]) => (
                      <div key={key} className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                        {key === 'source_vpn' && <Lock className="w-3 h-3 text-blue-400" />}
                        {key === 'time_of_day' && <Globe className="w-3 h-3 text-purple-400" />}
                        {key === 'max_amount' && <ShieldAlert className="w-3 h-3 text-yellow-400" />}
                        <span>
                          {key}: <strong className="text-slate-200">{String(val)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800/40 flex justify-end">
              <button
                onClick={() => handleDelete(policy.id)}
                className="p-1.5 bg-slate-800/60 hover:bg-red-950/40 text-slate-500 hover:text-red-400 border border-slate-800 rounded-lg transition-colors"
                title="Delete Policy"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-md">Compile OPA Policy Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">RULE ID</label>
                  <input
                    type="text"
                    required
                    placeholder="pol_developer_write"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">EFFECT</label>
                  <select
                    value={newEffect}
                    onChange={(e) => setNewEffect(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Allow">ALLOW</option>
                    <option value="Deny">DENY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SUBJECT AGENT ROLE</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="*">* (Any Agent)</option>
                  <option value="ManagerAgent">ManagerAgent</option>
                  <option value="PlannerAgent">PlannerAgent</option>
                  <option value="ResearchAgent">ResearchAgent</option>
                  <option value="DeveloperAgent">DeveloperAgent</option>
                  <option value="TestingAgent">TestingAgent</option>
                  <option value="ReviewerAgent">ReviewerAgent</option>
                  <option value="DeploymentAgent">DeploymentAgent</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">ACTION</label>
                  <input
                    type="text"
                    required
                    placeholder="WriteCode"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">RESOURCE TARGET</label>
                  <input
                    type="text"
                    required
                    placeholder="SourceRepo"
                    value={newResource}
                    onChange={(e) => setNewResource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* ABAC Conditions Checkboxes */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">ABAC ATTRIBUTES RULES</span>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="vpn"
                    checked={useVpn}
                    onChange={(e) => setUseVpn(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-0"
                  />
                  <label htmlFor="vpn" className="text-slate-300">Enforce Company VPN only</label>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Allowed Time Range (e.g. 09:00-18:00)</label>
                  <input
                    type="text"
                    placeholder="09:00-17:00"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Max Authorized Value (Amount)</label>
                    <input
                      type="number"
                      placeholder="50000"
                      value={maxAmt}
                      onChange={(e) => setMaxAmt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Target Environment</label>
                    <input
                      type="text"
                      placeholder="Production"
                      value={allowedEnv}
                      onChange={(e) => setAllowedEnv(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
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
                  Compile Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

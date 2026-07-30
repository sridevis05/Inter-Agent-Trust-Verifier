import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clipboard, Check, Shield } from 'lucide-react';
import { ApiKey, ApiKeyPlain, getApiKeys, createApiKey, revokeApiKey } from '../utils/api';

interface ApiKeyManagerProps {
  tenantId: string;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ tenantId }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keyName, setKeyName] = useState('');
  const [createdPlainKey, setCreatedPlainKey] = useState<ApiKeyPlain | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await getApiKeys(tenantId);
      setKeys(res.data);
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [tenantId]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setLoading(true);
    try {
      const res = await createApiKey(tenantId, keyName);
      setCreatedPlainKey(res.data);
      setKeyName('');
      fetchKeys();
    } catch (err) {
      alert('Failed to generate API Key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
    try {
      await revokeApiKey(keyId);
      fetchKeys();
    } catch (err) {
      alert('Failed to revoke API key');
    }
  };

  const handleCopyKey = () => {
    if (!createdPlainKey) return;
    navigator.clipboard.writeText(createdPlainKey.plain_key);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">API KEY MANAGEMENT</h2>
        <p className="text-slate-400 text-xs mt-1">
          Issue and manage secure system access keys for autonomous agents calling the validation gateway.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Key Form */}
        <div className="lg:col-span-1 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-4 h-fit">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">
            ISSUE NEW API KEY
          </span>

          <form onSubmit={handleCreateKey} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">KEY DESCRIPTION / NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. Production Agent Pipeline"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs px-4 py-2.5 rounded-lg font-mono font-medium shadow-glow-blue flex items-center justify-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'GENERATING...' : 'GENERATE API KEY'}</span>
            </button>
          </form>

          {/* Secure Display Dialog */}
          {createdPlainKey && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-lg space-y-3">
              <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-400 font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>KEY SUCCESSFULLY GENERATED</span>
              </div>
              <p className="text-[9px] text-slate-400">
                Copy this key now. It will not be shown again for security reasons.
              </p>
              <div className="flex items-center bg-slate-950 p-2.5 rounded border border-slate-850 font-mono text-[10px] justify-between">
                <span className="text-emerald-300 truncate pr-2">{createdPlainKey.plain_key}</span>
                <button
                  onClick={handleCopyKey}
                  className="hover:text-white text-slate-500 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={() => setCreatedPlainKey(null)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-[9px] py-1.5 rounded font-mono hover:text-white"
              >
                DONE / DISMISS
              </button>
            </div>
          )}
        </div>

        {/* API Key Directory */}
        <div className="lg:col-span-2 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">
            ACTIVE GATEWAY CREDENTIALS
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-mono">
                  <th className="pb-3 font-medium">KEY NAME</th>
                  <th className="pb-3 font-medium">KEY HASH (SHA-255)</th>
                  <th className="pb-3 font-medium">EXPIRES AT</th>
                  <th className="pb-3 font-medium">STATUS</th>
                  <th className="pb-3 font-medium text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                      NO ACTIVE API KEYS REGISTERED FOR THIS TENANT.
                    </td>
                  </tr>
                ) : (
                  keys.map((k) => (
                    <tr key={k.id} className="border-b border-slate-800/40 hover:bg-slate-900/10 text-slate-300 transition-colors">
                      <td className="py-4 font-bold text-slate-200">{k.name}</td>
                      <td className="py-4 font-mono text-[10px] text-slate-500">
                        {k.key_hash.slice(0, 16)}...
                      </td>
                      <td className="py-4 font-mono text-[10px] text-slate-400">
                        {new Date(k.expires_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          k.status === 'Active' ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-red-950 border border-red-800 text-red-400'
                        }`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {k.status === 'Active' && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="p-1.5 bg-red-950/20 border border-red-900/35 hover:bg-red-950/40 text-red-400 rounded transition-colors"
                            title="Revoke API Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

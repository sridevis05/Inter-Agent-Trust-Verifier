import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Cpu, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Analytics, AuditLog } from '../utils/api';

interface DashboardOverviewProps {
  analytics: Analytics | null;
  logs: AuditLog[];
  onNavigateToSimulator: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ analytics, logs, onNavigateToSimulator }) => {
  const cards = [
    {
      label: 'GATEWAY REQUEST INGEST',
      value: analytics?.total_verifications ?? 0,
      icon: Cpu,
      color: 'text-blue-400',
      bg: 'bg-blue-950/20 border-blue-900/30',
      glow: 'shadow-glow-blue/5'
    },
    {
      label: 'AUTHORIZED EXECUTIONS',
      value: analytics?.success_count ?? 0,
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/20 border-emerald-900/30',
      glow: 'shadow-glow-green/5'
    },
    {
      label: 'THREATS PREVENTED',
      value: analytics?.attack_blocked_count ?? 0,
      icon: ShieldAlert,
      color: 'text-red-400',
      bg: 'bg-red-950/20 border-red-900/30',
      glow: 'shadow-glow-red/5'
    },
    {
      label: 'VERIFICATION LATENCY',
      value: `${analytics?.average_latency_ms ?? 0} ms`,
      icon: Clock,
      color: 'text-purple-400',
      bg: 'bg-purple-950/20 border-purple-900/30',
      glow: 'shadow-glow-purple/5'
    }
  ];

  // Convert latency trend to recharts readable object
  const chartData = (analytics?.latency_trend ?? [12, 11, 10, 14, 12, 11, 9, 10, 12, 11]).map((val, idx) => ({
    name: `t-${10 - idx}`,
    latency: val
  }));

  const recentLogs = logs.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">GATEWAY CONTROL CENTER</h2>
          <p className="text-slate-400 text-xs mt-1">Real-time Zero-Trust network telemetry and threat intelligence feeds.</p>
        </div>
        <button
          onClick={onNavigateToSimulator}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-lg font-mono font-medium shadow-glow-blue transition-all"
        >
          LAUNCH ATTACK SIMULATOR
        </button>
      </div>

      {/* Alert Banner for compromised nodes */}
      {analytics && analytics.attack_blocked_count > 0 && (
        <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center space-x-3 text-xs text-red-400 font-mono shadow-glow-red/5">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <strong>ACTIVE SOC THREAT ALERT:</strong> Quarantined anomalies detected in active agent telemetry. Inspect incident triggers in the <span className="font-bold">Incident Center</span>.
          </div>
        </div>
      )}

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`p-6 border rounded-xl glass-panel ${card.bg} ${card.glow} flex justify-between items-start`}>
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">{card.label}</span>
                <div className="text-3xl font-bold text-white tracking-tight">{card.value}</div>
              </div>
              <div className={`p-2.5 rounded-lg bg-slate-900 border border-slate-800 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Threat Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Trend */}
        <div className="lg:col-span-2 p-6 border border-slate-800 bg-slate-900/35 rounded-xl glass-panel flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-mono text-xs tracking-wider text-slate-400 uppercase">GATEWAY PERFORMANCE TELEMETRY</h3>
              <span className="text-[10px] text-slate-500">Latency distribution over time</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-blue-400 bg-blue-950/40 border border-blue-900/40 px-2 py-1 rounded">
              <Activity className="w-3.5 h-3.5" />
              <span>LIVE EDGE POLLING</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} className="font-mono" />
                <YAxis stroke="#64748b" fontSize={10} className="font-mono" unit="ms" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  labelStyle={{ fontFamily: 'monospace' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#a855f7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Intelligence Feed */}
        <div className="p-6 border border-slate-800 bg-slate-900/35 rounded-xl glass-panel flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-xs tracking-wider text-slate-400 uppercase">THREAT INTELLIGENCE SIGNATURES</h3>
              <span className="text-[10px] text-slate-500">Known malicious pattern database</span>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {analytics?.threat_feed.map((feed) => (
              <div key={feed.id} className="p-3 border border-slate-800 bg-slate-950/60 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-500">{feed.id}</div>
                  <div className="text-xs font-semibold text-slate-300 mt-0.5">{feed.name}</div>
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  feed.severity === 'Critical' ? 'bg-red-950 border border-red-800 text-red-400' :
                  feed.severity === 'High' ? 'bg-orange-950 border border-orange-800 text-orange-400' :
                  'bg-yellow-950 border border-yellow-800 text-yellow-400'
                }`}>
                  {feed.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Event Log Activity */}
      <div className="p-6 border border-slate-800 bg-slate-900/35 rounded-xl glass-panel">
        <h3 className="font-mono text-xs tracking-wider text-slate-400 uppercase mb-4">RECENT SECURITY LEDGER EVENTS</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono">
                <th className="pb-3 font-medium">EVENT ID</th>
                <th className="pb-3 font-medium">TIMESTAMP</th>
                <th className="pb-3 font-medium">ROUTE</th>
                <th className="pb-3 font-medium">ACTION</th>
                <th className="pb-3 font-medium">THREAT LEVEL</th>
                <th className="pb-3 font-medium text-right">OUTCOME</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-mono">
                    NO TRAFFIC LOGGED IN THE AUDIT EVENT STORE.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/40 hover:bg-slate-900/20 text-slate-300 transition-colors">
                    <td className="py-3 font-mono text-[10px] text-slate-500">{log.id}</td>
                    <td className="py-3 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 font-mono">
                      {log.sender_id} <span className="text-slate-600">→</span> {log.receiver_id}
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-300">{log.action}</span>
                      <span className="text-slate-500 text-[10px] block mt-0.5">{log.resource}</span>
                    </td>
                    <td className="py-3">
                      <span className={`font-mono text-[10px] uppercase ${
                        log.threat_level === 'Critical' ? 'text-red-400 font-bold' :
                        log.threat_level === 'High' ? 'text-orange-400' :
                        log.threat_level === 'Medium' ? 'text-yellow-400' :
                        'text-slate-500'
                      }`}>
                        {log.threat_level}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.verification_result === 'Success' 
                          ? 'bg-emerald-950/50 border border-emerald-900/60 text-emerald-400' 
                          : 'bg-red-950/50 border border-red-900/60 text-red-400'
                      }`}>
                        {log.verification_result === 'Success' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ALLOWED</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>BLOCKED</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

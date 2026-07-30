import React from 'react';
import { Gauge, Zap, Cpu, Server, Database } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const Benchmarks: React.FC = () => {
  const metrics = [
    { label: 'AVERAGE LATENCY', value: '11.8 ms', desc: 'Crypto check + policy evaluate duration' },
    { label: 'THROUGHPUT RATIO', value: '1,850 rps', desc: 'Maximum load before message queueing' },
    { label: 'CONCURRENT SESSIONS', value: '500 agents', desc: 'Simultaneous active key mappings' },
    { label: 'VERIFICATION ACCURACY', value: '99.99 %', desc: 'Zero signature false-negatives' }
  ];

  // Mock CPU / Memory usage data over nodes
  const nodeData = [
    { name: 'Gateway-1', CPU: 42, Memory: 68, Latency: 11.2 },
    { name: 'Gateway-2', CPU: 38, Memory: 72, Latency: 12.1 },
    { name: 'Gateway-3', CPU: 45, Memory: 65, Latency: 11.6 }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">SYSTEM HEALTH & BENCHMARKS</h2>
        <p className="text-slate-400 text-xs mt-1">Live metrics of the load-balanced SentinelTrust gateway cluster.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-5 border border-slate-800 bg-slate-900/35 rounded-xl glass-panel space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">{m.label}</span>
            <div className="text-2xl font-bold text-white tracking-tight font-mono">{m.value}</div>
            <p className="text-[10px] text-slate-400">{m.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node latency metrics */}
        <div className="lg:col-span-2 border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel flex flex-col justify-between h-[380px]">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-3 mb-6">
              <Cpu className="w-3.5 h-3.5" />
              <span>CLUSTER GATEWAYS CPU & MEMORY TELEMETRY</span>
            </div>
          </div>
          
          <div className="flex-1 w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nodeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} className="font-mono" />
                <YAxis stroke="#64748b" fontSize={10} className="font-mono" unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  labelStyle={{ fontFamily: 'monospace' }}
                />
                <Bar dataKey="CPU" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Memory" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrastructure components status */}
        <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel flex flex-col justify-between h-[380px]">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-3 mb-6">
              <Server className="w-3.5 h-3.5" />
              <span>SYSTEM INFRASTRUCTURE STATUS</span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 border border-slate-800 bg-slate-950/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>PostgreSQL (Event Store)</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">ONLINE</span>
              </div>

              <div className="flex items-center justify-between p-2.5 border border-slate-800 bg-slate-950/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Redis (Nonce Cache)</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">ONLINE</span>
              </div>

              <div className="flex items-center justify-between p-2.5 border border-slate-800 bg-slate-950/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  <span>RabbitMQ (Message Queue)</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">ONLINE</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[10px] text-slate-500 leading-relaxed text-center font-mono">
            Load balancer NGINX nodes active. Latency standard deviation: ±0.34ms.
          </div>
        </div>
      </div>
    </div>
  );
};

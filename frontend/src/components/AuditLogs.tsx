import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  RefreshCw 
} from 'lucide-react';
import { AuditLog, exportAuditLogsCSV, getSiemLogs } from '../utils/api';

interface AuditLogsProps {
  logs: AuditLog[];
  onRefresh?: () => void;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [threatFilter, setThreatFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // SIEM logs console state
  const [siemLogs, setSiemLogs] = useState<string[]>([]);
  const [showSiemConsole, setShowSiemConsole] = useState(false);

  const loadSiemLogs = async () => {
    try {
      const res = await getSiemLogs();
      setSiemLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (showSiemConsole) {
      loadSiemLogs();
      const interval = setInterval(loadSiemLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [showSiemConsole]);

  const filteredLogs = logs.filter(log => {
    const matchesOutcome = outcomeFilter === '' || log.verification_result === outcomeFilter;
    const matchesThreat = threatFilter === '' || log.threat_level === threatFilter;
    const matchesSearch = searchTerm === '' || 
      log.sender_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.receiver_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.failure_reason && log.failure_reason.toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesOutcome && matchesThreat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">SECURITY AUDIT LEDGER</h2>
          <p className="text-slate-400 text-xs mt-1">Immutable ledger storing all verified inter-agent transaction payloads.</p>
        </div>

        <div className="flex space-x-2">
          {/* Toggle SIEM view */}
          <button
            onClick={() => setShowSiemConsole(!showSiemConsole)}
            className="border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 font-mono"
          >
            <Terminal className="w-4 h-4" />
            <span>{showSiemConsole ? 'HIDE SIEM STREAM' : 'VIEW SIEM STREAM'}</span>
          </button>

          {/* CSV Export */}
          <a
            href={exportAuditLogsCSV()}
            download
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 font-mono font-medium shadow-glow-blue transition-all print:hidden"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT CSV</span>
          </a>

          {/* PDF Print */}
          <button
            onClick={() => window.print()}
            className="border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 font-mono print:hidden"
          >
            <Download className="w-4 h-4" />
            <span>PRINT PDF</span>
          </button>
        </div>
      </div>

      {/* SIEM Stream console box */}
      {showSiemConsole && (
        <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl space-y-3 font-mono text-[10px] text-slate-400">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-500 font-bold">SENTINELTRUST SIEM CONSOLE (COMMON EVENT FORMAT - CEF)</span>
            <button onClick={loadSiemLogs} className="hover:text-white" title="Refresh Feed">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-40 overflow-y-auto space-y-1.5 scroll-smooth pr-1 leading-relaxed">
            {siemLogs.length === 0 ? (
              <div className="text-slate-600 italic text-center pt-16">
                No SIEM logs forwarded to Datadog/Splunk yet. Run simulations first.
              </div>
            ) : (
              siemLogs.map((log, idx) => (
                <div key={idx} className="hover:bg-slate-900 py-0.5 px-1 rounded transition-colors break-all">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter logs by agent, action or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Outcome */}
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All Outcomes</option>
          <option value="Success">Success (Allowed)</option>
          <option value="Failed">Failed (Blocked)</option>
        </select>

        {/* Threat Level */}
        <select
          value={threatFilter}
          onChange={(e) => setThreatFilter(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All Threat Levels</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-800 bg-slate-900/35 rounded-xl p-6 glass-panel overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 font-mono">
              <th className="pb-3 font-medium">EVENT ID</th>
              <th className="pb-3 font-medium">TIMESTAMP</th>
              <th className="pb-3 font-medium">SENDER</th>
              <th className="pb-3 font-medium">RECEIVER</th>
              <th className="pb-3 font-medium">ACTION</th>
              <th className="pb-3 font-medium text-center">THREAT</th>
              <th className="pb-3 font-medium text-right">OUTCOME</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                  NO AUDIT EVENTS MATCH FILTER CRITERIA.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/40 hover:bg-slate-900/10 text-slate-300 transition-colors">
                  <td className="py-3.5 font-mono text-[10px] text-slate-500">{log.id}</td>
                  <td className="py-3.5 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 font-semibold text-slate-300">{log.sender_id}</td>
                  <td className="py-3.5 font-semibold text-slate-300">{log.receiver_id}</td>
                  <td className="py-3.5">
                    <span className="font-semibold text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{log.resource}</span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      log.threat_level === 'Critical' ? 'text-red-400 font-bold bg-red-950/20' :
                      log.threat_level === 'High' ? 'text-orange-400 bg-orange-950/20' :
                      log.threat_level === 'Medium' ? 'text-yellow-400 bg-yellow-950/20' :
                      'text-slate-500'
                    }`}>
                      {log.threat_level}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-[10px] font-bold ${
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
  );
};

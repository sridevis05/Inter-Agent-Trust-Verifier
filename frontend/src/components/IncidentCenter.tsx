import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, ArrowRight, HelpCircle, Activity } from 'lucide-react';
import { AuditLog, getAuditLogs, updateIncidentStatus } from '../utils/api';

interface IncidentCenterProps {
  tenantId: string;
  onNavigateToCopilot: (logId: string) => void;
}

export const IncidentCenter: React.FC<IncidentCenterProps> = ({ tenantId, onNavigateToCopilot }) => {
  const [incidents, setIncidents] = useState<AuditLog[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<AuditLog | null>(null);
  const [updateStatus, setUpdateStatus] = useState('Open');
  const [assignee, setAssignee] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchIncidents = async () => {
    try {
      const res = await getAuditLogs({ tenant_id: tenantId, incident_only: true });
      setIncidents(res.data);
      // Auto-select first one if none selected
      if (res.data.length > 0 && !selectedIncident) {
        setSelectedIncident(res.data[0]);
        setUpdateStatus(res.data[0].incident_status);
        setAssignee(res.data[0].incident_assignee || '');
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 6000);
    return () => clearInterval(interval);
  }, [tenantId]);

  const selectIncidentDetail = (inc: AuditLog) => {
    setSelectedIncident(inc);
    setUpdateStatus(inc.incident_status);
    setAssignee(inc.incident_assignee || '');
  };

  const handleUpdate = async () => {
    if (!selectedIncident) return;
    setLoading(true);
    try {
      await updateIncidentStatus(selectedIncident.id, updateStatus, assignee);
      alert('Incident updated successfully.');
      fetchIncidents();
    } catch (err) {
      alert('Failed to update incident status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">SECURITY INCIDENT CENTER</h2>
          <p className="text-slate-400 text-xs mt-1">
            Quarantine compromised agents, analyze threat vectors, and assign incident response actions.
          </p>
        </div>
        
        {/* Incident Summary Badges */}
        <div className="flex space-x-3 text-xs font-mono">
          <div className="bg-red-950/30 border border-red-900/40 px-3 py-1.5 rounded-lg text-red-400">
            {incidents.filter(i => i.incident_status === 'Open').length} OPEN
          </div>
          <div className="bg-yellow-950/30 border border-yellow-900/40 px-3 py-1.5 rounded-lg text-yellow-400">
            {incidents.filter(i => i.incident_status === 'Assigned').length} ASSIGNED
          </div>
          <div className="bg-emerald-950/30 border border-emerald-900/40 px-3 py-1.5 rounded-lg text-emerald-400">
            {incidents.filter(i => i.incident_status === 'Resolved').length} RESOLVED
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Incidents List */}
        <div className="xl:col-span-2 border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-4 max-h-[580px] overflow-y-auto">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-2">
            CRITICAL INCIDENT DIRECTORY
          </span>

          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                <span>NO CRITICAL INCIDENTS FLAGGED FOR THIS TENANT. STATUS SECURE.</span>
              </div>
            ) : (
              incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => selectIncidentDetail(inc)}
                  className={`w-full p-4 border rounded-xl text-left transition-all duration-300 flex items-start justify-between group relative ${
                    selectedIncident?.id === inc.id
                      ? 'bg-red-950/15 border-red-500 shadow-glow-red/5'
                      : 'bg-slate-950/50 border-slate-850 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2.5 rounded-lg border ${
                      selectedIncident?.id === inc.id ? 'bg-red-950 border-red-800 text-red-400' : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-red-400'
                    } transition-colors`}>
                      <ShieldAlert className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                        <span>{inc.id.toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase">
                        {inc.failure_reason}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500">
                        {inc.sender_id} $\rightarrow$ {inc.receiver_id} ({inc.action} on {inc.resource})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2 text-right">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      inc.incident_status === 'Resolved' ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' :
                      inc.incident_status === 'Assigned' ? 'bg-yellow-950 border border-yellow-800 text-yellow-400' :
                      'bg-red-950 border border-red-800 text-red-400'
                    }`}>
                      {inc.incident_status}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      Risk Index: <strong className="text-red-400">{inc.risk_score}</strong>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Incident Detail / Action Panel */}
        {selectedIncident && (
          <div className="border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-6 flex flex-col justify-between max-h-[580px] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  INCIDENT INVESTIGATOR
                </span>
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase">
                  {selectedIncident.threat_level} RISK
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">VIOLATION SYNOPSIS</span>
                <h4 className="text-sm font-bold text-white">{selectedIncident.failure_reason}</h4>
              </div>

              {/* Step checklist */}
              <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-lg space-y-2 text-[10px] font-mono">
                <span className="text-[8px] text-slate-500 block uppercase">ORIGIN DETAILS</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">OFFENDER:</span>
                  <span className="text-slate-300 font-bold">{selectedIncident.sender_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ACTION:</span>
                  <span className="text-slate-300 font-bold">{selectedIncident.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RESOURCE:</span>
                  <span className="text-slate-300 font-bold">{selectedIncident.resource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IP ADDRESS:</span>
                  <span className="text-slate-400">{selectedIncident.ip_address}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-2 mt-2">
                  <span className="text-slate-500">TRACE ID:</span>
                  <span className="text-slate-500 truncate max-w-[150px]">{selectedIncident.trace_id}</span>
                </div>
              </div>

              {/* Action items form */}
              <div className="space-y-3">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">REMEDIATION STATUS</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 mb-1">INCIDENT STATUS</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none text-[11px]"
                    >
                      <option value="Open">Open</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 mb-1">ASSIGNED ANALYST</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none text-[11px]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-mono py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>COMMIT REMEDIATION LOG</span>
                </button>
              </div>
            </div>

            {/* AI Copilot integration trigger */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg text-[10px] text-slate-400 font-sans leading-relaxed flex items-start space-x-2.5">
                <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>AI Copilot Integration:</strong> Ask SentinelTrust Copilot to examine this incident's payload logs and recommend an exact fix.
                </div>
              </div>
              
              <button
                onClick={() => onNavigateToCopilot(selectedIncident.id)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-lg font-mono font-medium shadow-glow-blue flex items-center justify-center space-x-2 transition-all"
              >
                <span>CONSULT AI SECURITY COPILOT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

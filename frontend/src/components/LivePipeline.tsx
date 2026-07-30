import React, { useState } from 'react';
import { Network, Play, Terminal, ShieldAlert } from 'lucide-react';
import { runNormalPipeline } from '../utils/api';

interface LivePipelineProps {
  socketEvents: any[];
  setSocketEvents: React.Dispatch<React.SetStateAction<any[]>>;
}

export const LivePipeline: React.FC<LivePipelineProps> = ({ socketEvents, setSocketEvents }) => {
  const [isRunning, setIsRunning] = useState(false);

  // Coordinates mapping for SVGs
  const nodes = [
    { id: 'manager_agent', name: 'Manager', role: 'ManagerAgent', cx: 100, cy: 200 },
    { id: 'planner_agent', name: 'Planner', role: 'PlannerAgent', cx: 250, cy: 100 },
    { id: 'research_agent', name: 'Research', role: 'ResearchAgent', cx: 400, cy: 100 },
    { id: 'developer_agent', name: 'Developer', role: 'DeveloperAgent', cx: 550, cy: 200 },
    { id: 'tester_agent', name: 'Tester', role: 'TestingAgent', cx: 400, cy: 300 },
    { id: 'reviewer_agent', name: 'Reviewer', role: 'ReviewerAgent', cx: 250, cy: 300 },
    { id: 'deployer_agent', name: 'Deployer', role: 'DeploymentAgent', cx: 700, cy: 200 }
  ];

  const links = [
    { source: 'manager_agent', target: 'planner_agent' },
    { source: 'planner_agent', target: 'research_agent' },
    { source: 'research_agent', target: 'developer_agent' },
    { source: 'developer_agent', target: 'tester_agent' },
    { source: 'tester_agent', target: 'reviewer_agent' },
    { source: 'reviewer_agent', target: 'deployer_agent' }
  ];

  const handleStartPipeline = async () => {
    setIsRunning(true);
    setSocketEvents([]);
    try {
      await runNormalPipeline();
    } catch (err) {
      alert('Failed to trigger pipeline simulation');
    } finally {
      setIsRunning(false);
    }
  };

  const getCoordinates = (id: string) => {
    const node = nodes.find(n => n.id === id);
    return node ? { x: node.cx, y: node.cy } : { x: 0, y: 0 };
  };

  // Find latest step event to highlight connection
  const latestEvent = socketEvents[socketEvents.length - 1]?.data;
  let activeLinkIndex = -1;
  if (latestEvent) {
    activeLinkIndex = links.findIndex(l => 
      l.source === latestEvent.sender && l.target === latestEvent.receiver
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">LIVE AGENT COMMUNICATIONS</h2>
          <p className="text-slate-400 text-xs mt-1">Inter-agent communication pipeline verification and network topology.</p>
        </div>
        <button
          onClick={handleStartPipeline}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 font-mono font-medium shadow-glow-blue transition-all"
        >
          <Play className="w-4 h-4" />
          <span>{isRunning ? 'SIMULATION RUNNING...' : 'TRIGGER SECURE SIMULATION'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Network SVG Graph representation */}
        <div className="xl:col-span-2 border border-slate-800 bg-slate-900/30 rounded-xl p-6 glass-panel relative">
          <div className="absolute top-4 left-4 flex items-center space-x-2 text-[10px] font-mono text-slate-500">
            <Network className="w-3.5 h-3.5" />
            <span>SENTINELTRUST COMMUNICATIONS GRAPH (SVG)</span>
          </div>

          <div className="w-full flex justify-center py-6">
            <svg viewBox="0 0 800 400" className="w-full max-w-3xl overflow-visible">
              <defs>
                <filter id="glow-b" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Marker definition for line arrows */}
                <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b" />
                </marker>
                <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
              </defs>

              {/* Draw Static & Active Links */}
              {links.map((link, idx) => {
                const sCoords = getCoordinates(link.source);
                const tCoords = getCoordinates(link.target);
                const isActive = activeLinkIndex === idx;
                const isBlocked = isActive && !latestEvent?.is_valid;
                return (
                  <g key={idx}>
                    <line
                      x1={sCoords.x}
                      y1={sCoords.y}
                      x2={tCoords.x}
                      y2={tCoords.y}
                      stroke={isActive ? (isBlocked ? '#ef4444' : '#3b82f6') : '#1e293b'}
                      strokeWidth={isActive ? 3 : 2}
                      markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                      className={isActive ? 'animate-svg-dash' : ''}
                      strokeDasharray={isActive ? "8, 4" : "0"}
                      style={{ transition: 'stroke 0.3s' }}
                    />
                    
                    {/* Glowing pulse dot moving from source to target when connection is active */}
                    {isActive && !isBlocked && (
                      <circle r="6" fill="#3b82f6" filter="url(#glow-b)">
                        <animateMotion
                          path={`M ${sCoords.x} ${sCoords.y} L ${tCoords.x} ${tCoords.y}`}
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {nodes.map((node) => {
                const isSender = latestEvent?.sender === node.id;
                const isReceiver = latestEvent?.receiver === node.id;
                const isNodeActive = isSender || isReceiver;
                const isFailed = isNodeActive && !latestEvent?.is_valid;

                return (
                  <g key={node.id} className="cursor-pointer">
                    {/* Glowing Outer Aura */}
                    {isNodeActive && (
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={28}
                        fill="none"
                        stroke={isFailed ? '#ef4444' : '#3b82f6'}
                        strokeWidth="2"
                        className="animate-ping opacity-25"
                      />
                    )}

                    {/* Node Core */}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={22}
                      fill="#0f172a"
                      stroke={isNodeActive ? (isFailed ? '#ef4444' : '#3b82f6') : '#1e293b'}
                      strokeWidth={isNodeActive ? 3 : 2}
                      className="transition-all"
                    />

                    {/* Node Icon/Text label inside */}
                    <text
                      x={node.cx}
                      y={node.cy + 4}
                      textAnchor="middle"
                      fill={isNodeActive ? (isFailed ? '#f87171' : '#60a5fa') : '#94a3b8'}
                      fontSize={11}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {node.name[0]}
                    </text>

                    {/* Labels below nodes */}
                    <text
                      x={node.cx}
                      y={node.cy + 36}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      {node.name}
                    </text>
                    <text
                      x={node.cx}
                      y={node.cy + 46}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize={8}
                      fontFamily="monospace"
                    >
                      {node.role}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Live event logs console */}
        <div className="border border-slate-800 bg-slate-950 rounded-xl p-6 flex flex-col h-[400px]">
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 mb-4 border-b border-slate-800 pb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>SECURE GATEWAY WEBSOCKET ACTIVITY</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1 text-[11px] font-mono scroll-smooth">
            {socketEvents.length === 0 ? (
              <div className="text-slate-600 italic text-center pt-24">
                [SYSTEM IDLE] Waiting for communication signals...
              </div>
            ) : (
              socketEvents.map((evt, idx) => {
                const data = evt.data;
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border text-xs ${
                      data.is_valid 
                        ? 'bg-slate-900/40 border-slate-800 text-slate-300' 
                        : 'bg-red-950/20 border-red-900/40 text-red-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[10px] text-slate-500">
                      <span>TRACE: {data.trace_id?.slice(0, 12)}...</span>
                      <span>RISK: {data.risk_score}</span>
                    </div>
                    <div>
                      <strong className="text-white">{data.sender}</strong> <span className="text-slate-500">sent</span>{' '}
                      <span className="font-semibold text-blue-400">{data.action}</span> <span className="text-slate-500">to</span>{' '}
                      <strong className="text-white">{data.receiver}</strong>
                    </div>
                    {!data.is_valid && (
                      <div className="mt-2 text-[10px] text-red-400 flex items-start space-x-1 border-t border-red-900/35 pt-1.5">
                        <ShieldAlert className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>BLOCKED: {data.failure_reason}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

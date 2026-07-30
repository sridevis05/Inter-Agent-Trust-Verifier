import React from 'react';
import { Sidebar } from './Sidebar';
import { Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  recentAlertsCount: number;
  tenantId: string;
  setTenantId: (tenant: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  recentAlertsCount,
  tenantId,
  setTenantId,
  userRole,
  setUserRole
}) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <div className="print:hidden flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header telemetry */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-500 animate-pulse" />
              <h2 className="text-sm font-semibold tracking-wide text-slate-300 font-mono hidden md:block">
                SENTINELTRUST GATEWAY
              </h2>
            </div>
            
            <div className="h-4 w-[1px] bg-slate-800 hidden md:block"></div>
            
            {/* Tenant Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono text-slate-500">ORGANIZATION:</span>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 rounded p-1.5 focus:outline-none focus:border-blue-600 transition-colors"
              >
                <option value="org_a">Organization A (Development)</option>
                <option value="org_b">Organization B (Sandbox)</option>
              </select>
            </div>

            {/* Role Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono text-slate-500 font-semibold">VIEW ROLE:</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 rounded p-1.5 focus:outline-none focus:border-blue-600 transition-colors"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Auditor">Auditor</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Live alerts indicator */}
            <div className="flex items-center space-x-2 text-xs font-mono bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded-full text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>{recentAlertsCount} ALERT{recentAlertsCount !== 1 ? 'S' : ''} DETECTED</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-800 hidden lg:block"></div>

            {/* Micro details */}
            <div className="hidden lg:flex items-center space-x-4 text-slate-400">
              <div className="text-right text-xs font-mono">
                <div className="text-[9px] text-slate-500">OPERATIONAL REGION</div>
                <div className="font-semibold text-slate-300 text-[10px]">EAST_US_EDGE_NODE</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
};

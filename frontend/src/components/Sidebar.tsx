import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  FileLock2, 
  History
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const categories = [
    {
      label: "Dashboard",
      items: [
        { id: 'overview', label: 'Overview', icon: Activity },
      ]
    },
    {
      label: "Operations",
      items: [
        { id: 'agents', label: 'Agent Directory', icon: Users },
        { id: 'simulator', label: 'Threat Simulator', icon: ShieldAlert },
        { id: 'audit-logs', label: 'Security Audits', icon: History },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none overflow-y-auto min-h-screen">
      <div>
        {/* Branding header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-lg shadow-glow-blue">
            <FileLock2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold tracking-wider text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
              SENTINELTRUST
            </h1>
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500">
              AI Security Platform
            </span>
          </div>
        </div>

        {/* User context info */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/20 font-mono text-[9px] text-slate-500 flex justify-between">
          <span>ROLE: {userRole}</span>
          <span className="text-emerald-400">ONLINE</span>
        </div>

        {/* Menu Navigation */}
        <div className="p-4 space-y-4">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-1">
              <span className="px-4 text-[9px] font-mono tracking-widest text-slate-600 uppercase block font-semibold">
                {cat.label}
              </span>
              <nav className="space-y-0.5">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  // Restrict Auditor role from accessing Playground & Simulator
                  const isRestricted = userRole === 'Auditor' && ['playground', 'simulator'].includes(item.id);
                  if (isRestricted) return null;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-xs transition-all duration-300 font-medium ${
                        isActive 
                          ? 'bg-blue-600/15 border-l-4 border-blue-500 text-blue-300 shadow-glow-blue/5' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer metadata */}
      <div className="p-4 border-t border-slate-800 text-center font-mono text-[9px] text-slate-600">
        <div>PROTOCOL VERSION 1.0</div>
        <div className="text-blue-500/50 mt-1">SAAS ENGINE STABLE</div>
      </div>
    </aside>
  );
};


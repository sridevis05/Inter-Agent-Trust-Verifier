import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardOverview } from './components/DashboardOverview';
import { AgentList } from './components/AgentList';
import { AttackSimulator } from './components/AttackSimulator';
import { AuditLogs } from './components/AuditLogs';
import { SimpleMediatorSandbox } from './components/SimpleMediatorSandbox';

import { 
  Agent, 
  AuditLog, 
  Analytics, 
  getAgents, 
  getAuditLogs, 
  getAnalytics, 
  getWSUrl 
} from './utils/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Dynamic Role & Tenant selections
  const [tenantId, setTenantId] = useState<string>('org_a');
  const [userRole, setUserRole] = useState<string>('Super Admin');

  // Data State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Function to load all core data scoped by active Tenant ID
  const loadAllData = async () => {
    try {
      const [agentsRes, logsRes, analyticsRes] = await Promise.all([
        getAgents(tenantId),
        getAuditLogs({ tenant_id: tenantId }),
        getAnalytics()
      ]);
      setAgents(agentsRes.data);
      setLogs(logsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to poll dashboard data from backend:', err);
    }
  };

  // 1. Fetch initial states and poll when tenant changes
  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [tenantId]);

  // 2. Establish WebSocket listening
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      const wsUrl = getWSUrl();
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to SentinelTrust WS Server');
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          if (parsed.event === 'step_completed') {
            // Dynamically refresh directories on transaction steps
            loadAllData();
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('WS Connection closed. Reconnecting...');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Filter logs context to active tenant and count alerts (High / Critical threat levels)
  const recentAlertsCount = logs.filter(l => 
    l.verification_result === 'Failed' && ['High', 'Critical'].includes(l.threat_level)
  ).length;

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      recentAlertsCount={recentAlertsCount}
      tenantId={tenantId}
      setTenantId={setTenantId}
      userRole={userRole}
      setUserRole={setUserRole}
    >
      {activeTab === 'overview' && (
        <DashboardOverview 
          analytics={analytics} 
          logs={logs} 
          onNavigateToSimulator={() => setActiveTab('simulator')} 
        />
      )}
      {activeTab === 'agents' && (
        <AgentList 
          agents={agents} 
          onRefresh={loadAllData} 
        />
      )}
      {activeTab === 'simulator' && (
        <AttackSimulator 
          onRefreshLogs={loadAllData} 
        />
      )}
      {activeTab === 'plugin-mediator' && (
        <SimpleMediatorSandbox />
      )}
      {activeTab === 'audit-logs' && (
        <AuditLogs 
          logs={logs} 
          onRefresh={loadAllData} 
        />
      )}
    </Layout>
  );
};

export default App;

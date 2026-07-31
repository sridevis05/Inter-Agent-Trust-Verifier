import axios from 'axios';

const API_HOST = 'inter-agent-trust-verifier-1.onrender.com';
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000/api/v1'
  : `https://${API_HOST}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Agent {
  id: string;
  name: string;
  kid: string;
  public_key_pem: string;
  role: string;
  permissions: string[];
  delegation_scope: Record<string, any>;
  status: 'Active' | 'Suspended' | 'Revoked';
  trust_score: number;
  created_at: string;
}

export interface Policy {
  id: string;
  tenant_id?: string;
  subject_role: string;
  action: string;
  resource: string;
  effect: 'Allow' | 'Deny';
  conditions?: Record<string, any>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  instruction_id?: string;
  sender_id: string;
  receiver_id: string;
  action: string;
  resource: string;
  verification_result: 'Success' | 'Failed';
  failure_reason?: string;
  policy_decision?: string;
  trust_score: number;
  risk_score: number;
  confidence_score: number;
  threat_level: 'Low' | 'Medium' | 'High' | 'Critical';
  latency_ms: number;
  ip_address: string;
  agent_version: string;
  trace_id?: string;
  step_results?: Record<string, boolean>;
  incident_status: string;
  incident_assignee?: string;
}

export interface Analytics {
  total_verifications: number;
  success_count: number;
  failure_count: number;
  attack_blocked_count: number;
  average_latency_ms: number;
  latency_trend: number[];
  compliance: {
    nist_csf: string;
    soc2: string;
    owasp_llm: string;
    governance_status: string[];
  };
  threat_feed: Array<{
    id: string;
    name: string;
    severity: string;
  }>;
}

// API Calls
export const getAgents = (tenantId: string = "org_a") => api.get<Agent[]>(`/agents?tenant_id=${tenantId}`);
export const registerAgent = (data: { id: string; name: string; role: string; tenant_id?: string; permissions?: string[]; delegation_scope?: Record<string, any> }) => 
  api.post<Agent>('/agents/register', data);
export const toggleAgentStatus = (id: string, status: 'Active' | 'Suspended' | 'Revoked') => 
  api.post<{ message: string }>(`/agents/${id}/status?status_value=${status}`);
export const rotateKeys = (id: string) => api.post<Agent>(`/agents/${id}/rotate-keys`);

export const getPolicies = (tenantId: string = "org_a") => api.get<Policy[]>(`/policies?tenant_id=${tenantId}`);
export const createPolicy = (data: Omit<Policy, 'created_at' | 'version' | 'is_active'>) => api.post<Policy>('/policies/create', data);
export const deletePolicy = (id: string) => api.delete<{ message: string }>(`/policies/${id}`);
export const rollbackPolicy = (id: string, version: number) => api.post<Policy>(`/policies/${id}/rollback`, { version });

export const getAuditLogs = (params?: Record<string, any>) => api.get<AuditLog[]>('/audit', { params });
export const exportAuditLogsCSV = (tenantId: string = "org_a") => `${API_BASE}/audit/export-csv?tenant_id=${tenantId}`;

export const getAnalytics = () => api.get<Analytics>('/simulator/analytics');
export const runNormalPipeline = () => api.post<{ status: string; steps_count: number }>('/simulator/run-normal');
export const runAttackSimulation = (attack_type: string) => 
  api.post<{
    status: string;
    attack_type: string;
    verification_result: string;
    risk_score: number;
    threat_level: string;
    reason: string;
    explanation?: {
      human_explanation: string;
      machine_exception: string;
      suggested_fix: string;
    };
    trace_id: string;
    spans: Array<{
      span_id: string;
      name: string;
      service: string;
      latency_ms: number;
      status: string;
    }>;
  }>('/simulator/run-attack', { attack_type });

export const getSiemLogs = () => api.get<string[]>('/simulator/siem-logs');
export const getWSUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://127.0.0.1:8000/ws';
  }
  return `${protocol}//${API_HOST}/ws`;
};

export interface VerifyResponse {
  is_valid: boolean;
  risk_score: number;
  confidence_score: number;
  trust_score: number;
  threat_level: 'Low' | 'Medium' | 'High' | 'Critical';
  failure_reason: string | null;
  explanation: {
    human_explanation: string;
    machine_exception: string;
    suggested_fix: string;
  } | null;
  step_results: Record<string, boolean>;
  latency_ms: number;
}


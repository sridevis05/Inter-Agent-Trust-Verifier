from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TenantRegister(BaseModel):
    id: str = Field(..., description="Unique organization/tenant identifier")
    name: str = Field(..., description="Human readable name of organization")

class TenantResponse(BaseModel):
    id: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

class AgentRegister(BaseModel):
    id: str = Field(..., description="Unique agent identifier")
    tenant_id: Optional[str] = Field(default="org_a", description="Target Tenant ID")
    name: str = Field(..., description="Human readable name")
    role: str = Field(..., description="Agent role, e.g. PlannerAgent")
    permissions: Optional[List[str]] = Field(default=[], description="List of permissions")
    delegation_scope: Optional[Dict[str, Any]] = Field(default={}, description="Attributes constraints")

class AgentResponse(BaseModel):
    id: str
    tenant_id: Optional[str]
    name: str
    kid: str
    public_key_pem: str
    role: str
    permissions: List[str]
    delegation_scope: Dict[str, Any]
    status: str
    trust_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class PolicyCreate(BaseModel):
    id: str
    tenant_id: Optional[str] = "org_a"
    subject_role: str
    action: str
    resource: str
    effect: str  # Allow / Deny
    conditions: Optional[Dict[str, Any]] = None
    version: Optional[int] = 1

class PolicyResponse(BaseModel):
    id: str
    tenant_id: Optional[str]
    subject_role: str
    action: str
    resource: str
    effect: str
    conditions: Optional[Dict[str, Any]]
    version: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PolicyRollback(BaseModel):
    version: int

class APIKeyCreate(BaseModel):
    tenant_id: str = Field(default="org_a")
    name: str

class APIKeyResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    key_hash: str
    status: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True

class APIKeyPlainResponse(BaseModel):
    key_id: str
    plain_key: str
    message: str

class IncidentStatusUpdate(BaseModel):
    status: str  # Open, Assigned, Resolved
    assignee: Optional[str] = None

class InstructionPayload(BaseModel):
    action: str
    resource: str
    params: Optional[Dict[str, Any]] = None

class SignedInstruction(BaseModel):
    protocol_version: str = Field(default="1.0")
    instruction_id: str
    sender: str
    receiver: str
    timestamp: str  # ISO timestamp
    nonce: str
    delegation_token: Optional[str] = None
    signature: Optional[str] = None
    kid: str
    payload: Dict[str, Any]

class ExplainabilityDetails(BaseModel):
    human_explanation: str
    machine_exception: str
    suggested_fix: str

class VerifyResponse(BaseModel):
    is_valid: bool
    risk_score: float
    confidence_score: float
    trust_score: float
    threat_level: str  # Low, Medium, High, Critical
    failure_reason: Optional[str] = None
    explanation: Optional[ExplainabilityDetails] = None
    step_results: Dict[str, bool]  # e.g., {"Format Check": True, "Signature Check": False...}
    latency_ms: float

class TokenRequest(BaseModel):
    issuer: str
    subject: str
    role: str
    allowed_actions: List[str]
    scope: Optional[Dict[str, Any]] = None
    expires_in_seconds: Optional[int] = 3600

class TokenResponse(BaseModel):
    token: str
    expires_at: datetime

class AttackRequest(BaseModel):
    attack_type: str

class AuditLogResponse(BaseModel):
    id: str
    tenant_id: Optional[str]
    timestamp: datetime
    instruction_id: Optional[str]
    sender_id: str
    receiver_id: str
    action: str
    resource: str
    verification_result: str
    failure_reason: Optional[str]
    policy_decision: Optional[str]
    incident_status: str
    incident_assignee: Optional[str]
    trust_score: float
    risk_score: float
    confidence_score: float
    threat_level: str
    latency_ms: float
    ip_address: str
    agent_version: str
    trace_id: Optional[str]
    step_results: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True

class ComplianceMapping(BaseModel):
    nist_csf: str
    soc2: str
    owasp_llm: str
    governance_status: List[str]

class AnalyticsResponse(BaseModel):
    total_verifications: int
    success_count: int
    failure_count: int
    attack_blocked_count: int
    average_latency_ms: float
    latency_trend: List[float]
    compliance: ComplianceMapping
    threat_feed: List[Dict[str, Any]]

class CopilotQuery(BaseModel):
    query: str
    tenant_id: Optional[str] = "org_a"
    context_log_id: Optional[str] = None

class CopilotResponse(BaseModel):
    answer: str
    suggested_action: Optional[str] = None
    relevant_policy_id: Optional[str] = None


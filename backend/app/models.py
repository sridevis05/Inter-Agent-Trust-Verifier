import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    agents = relationship("Agent", back_populates="tenant", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="tenant", cascade="all, delete-orphan")

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True)
    name = Column(String, nullable=False)
    kid = Column(String, nullable=False, unique=True)  # Current active Key ID
    public_key_pem = Column(Text, nullable=False)
    encrypted_private_key_pem = Column(Text, nullable=False)  # Encrypted with AES for secure storage
    role = Column(String, nullable=False)
    permissions = Column(JSON, nullable=True)  # e.g., ["ReadDatabase", "WriteFile"]
    delegation_scope = Column(JSON, nullable=True)  # e.g., {"max_amount": 50000}
    status = Column(String, default="Active")  # Active, Suspended, Revoked
    trust_score = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="agents")
    score_history = relationship("TrustScoreHistory", back_populates="agent", cascade="all, delete-orphan")
    keys = relationship("KeyHistory", back_populates="agent", cascade="all, delete-orphan")

class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True)
    subject_role = Column(String, nullable=False)  # Agent role, e.g. "DeveloperAgent"
    action = Column(String, nullable=False)        # e.g. "Delete" or "Write"
    resource = Column(String, nullable=False)      # e.g. "Database" or "File"
    effect = Column(String, nullable=False)        # Allow or Deny
    conditions = Column(JSON, nullable=True)       # e.g. {"time_of_day": "09:00-18:00", "source_vpn": true}
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="policies")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    instruction_id = Column(String, nullable=True)
    sender_id = Column(String, nullable=False)
    receiver_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    verification_result = Column(String, nullable=False)  # Success, Failed
    failure_reason = Column(String, nullable=True)
    policy_decision = Column(String, nullable=True)
    
    # Incident Tracking (Enterprise SaaS incident center)
    incident_status = Column(String, default="Resolved")  # Open, Assigned, Resolved
    incident_assignee = Column(String, nullable=True)
    
    # Risk Metrics
    trust_score = Column(Float, default=100.0)
    risk_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=100.0)
    threat_level = Column(String, default="Low")  # Low, Medium, High, Critical
    
    # Metadata & Tracing
    latency_ms = Column(Float, default=0.0)
    payload_hash = Column(String, nullable=True)
    ip_address = Column(String, default="127.0.0.1")
    agent_version = Column(String, default="1.0")
    trace_id = Column(String, nullable=True)
    span_id = Column(String, nullable=True)
    
    # Step-by-step diagnostic results
    step_results = Column(JSON, nullable=True)  # Detailed pass/fail per security step
    
    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    key_hash = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="Active")  # Active, Revoked
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="api_keys")

class Nonce(Base):
    __tablename__ = "nonces"
    
    nonce = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class TrustScoreHistory(Base):
    __tablename__ = "trust_score_history"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Float, nullable=False)
    change_reason = Column(String, nullable=True)
    
    agent = relationship("Agent", back_populates="score_history")

class KeyHistory(Base):
    __tablename__ = "key_history"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    kid = Column(String, nullable=False, unique=True)
    public_key_pem = Column(Text, nullable=False)
    encrypted_private_key_pem = Column(Text, nullable=False)
    status = Column(String, default="Active")  # Active, Grace, Deactivated
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    agent = relationship("Agent", back_populates="keys")

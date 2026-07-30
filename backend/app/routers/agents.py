import datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Agent, KeyHistory, TrustScoreHistory, AuditLog
from app.schemas import AgentRegister, AgentResponse
from app.security.crypto import generate_rsa_key_pair, encrypt_private_key
from typing import List, Optional

router = APIRouter(prefix="/agents", tags=["Agents Directory"])

@router.get("", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    # Pydantic schemas will automatically handle serializing JSON columns
    return agents

@router.post("/register", response_model=AgentResponse)
def register_agent(payload: AgentRegister, db: Session = Depends(get_db)):
    # Check if agent ID already exists
    existing = db.query(Agent).filter(Agent.id == payload.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent ID is already registered in Directory"
        )
        
    # Generate RSA key pair
    pub_key, priv_key = generate_rsa_key_pair()
    encrypted_priv = encrypt_private_key(priv_key)
    
    # Define Key ID
    kid = f"key_{payload.id}_v1"
    
    # Store Agent
    new_agent = Agent(
        id=payload.id,
        name=payload.name,
        kid=kid,
        public_key_pem=pub_key,
        encrypted_private_key_pem=encrypted_priv,
        role=payload.role,
        permissions=payload.permissions,
        delegation_scope=payload.delegation_scope,
        status="Active",
        trust_score=100.0
    )
    db.add(new_agent)
    
    # Log key history
    key_history = KeyHistory(
        agent_id=payload.id,
        kid=kid,
        public_key_pem=pub_key,
        encrypted_private_key_pem=encrypted_priv,
        status="Active",
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=30)
    )
    db.add(key_history)
    
    # Trust Score initial log
    score_hist = TrustScoreHistory(
        agent_id=payload.id,
        score=100.0,
        change_reason="Agent initialized with baseline trust score."
    )
    db.add(score_hist)
    
    db.commit()
    db.refresh(new_agent)
    return new_agent

@router.post("/{agent_id}/status")
def update_agent_status(agent_id: str, status_value: str, db: Session = Depends(get_db)):
    if status_value not in ["Active", "Suspended", "Revoked"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status value. Must be 'Active', 'Suspended', or 'Revoked'."
        )
        
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
        
    agent.status = status_value
    
    # Log action reason
    reason = f"Credential status explicitly toggled to {status_value} by Administrator"
    if status_value == "Revoked":
        agent.trust_score = 0.0  # Clear trust on revocation
        
    score_history = TrustScoreHistory(
        agent_id=agent.id,
        score=agent.trust_score,
        change_reason=reason
    )
    db.add(score_history)
    db.commit()
    
    return {"message": f"Agent status updated to {status_value}", "agent_id": agent_id}

@router.post("/{agent_id}/rotate-keys", response_model=AgentResponse)
def rotate_agent_keys(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
        
    # Set current key status in history to Grace (valid for 24 hours)
    current_key_hist = db.query(KeyHistory).filter(
        KeyHistory.agent_id == agent_id,
        KeyHistory.kid == agent.kid
    ).first()
    if current_key_hist:
        current_key_hist.status = "Grace"
        current_key_hist.expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        
    # Generate new RSA Keypair
    pub_key, priv_key = generate_rsa_key_pair()
    encrypted_priv = encrypt_private_key(priv_key)
    
    # Assign new unique Key ID
    ver_suffix = int(secrets.token_hex(2), 16)
    new_kid = f"key_{agent_id}_v_{ver_suffix}"
    
    # Update agent fields
    agent.kid = new_kid
    agent.public_key_pem = pub_key
    agent.encrypted_private_key_pem = encrypted_priv
    
    # Log new key in history
    new_key_history = KeyHistory(
        agent_id=agent_id,
        kid=new_kid,
        public_key_pem=pub_key,
        encrypted_private_key_pem=encrypted_priv,
        status="Active",
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=30)
    )
    db.add(new_key_history)
    db.commit()
    db.refresh(agent)
    
    return agent

@router.get("/{agent_id}/trust-history")
def get_agent_trust_history(agent_id: str, db: Session = Depends(get_db)):
    history = db.query(TrustScoreHistory).filter(TrustScoreHistory.agent_id == agent_id).order_by(TrustScoreHistory.timestamp.asc()).all()
    # Format to serializable list
    return [
        {
            "id": h.id,
            "agent_id": h.agent_id,
            "timestamp": h.timestamp.isoformat() + "Z",
            "score": h.score,
            "change_reason": h.change_reason
        }
        for h in history
    ]

@router.post("/incidents/{incident_id}/status")
def update_incident_status(incident_id: str, status_value: str, assignee: Optional[str] = None, db: Session = Depends(get_db)):
    incident = db.query(AuditLog).filter(AuditLog.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident audit record not found"
        )
    if status_value not in ["Open", "Assigned", "Resolved"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status value. Must be 'Open', 'Assigned', or 'Resolved'"
        )
    incident.incident_status = status_value
    if assignee:
        incident.incident_assignee = assignee
    db.commit()
    return {
        "message": "Incident status updated successfully",
        "incident_id": incident_id,
        "status": status_value,
        "assignee": incident.incident_assignee
    }

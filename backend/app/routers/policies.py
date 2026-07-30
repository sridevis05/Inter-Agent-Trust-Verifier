from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Policy, Tenant
from app.schemas import PolicyCreate, PolicyResponse, PolicyRollback
from typing import List, Optional

router = APIRouter(prefix="/policies", tags=["Policy Engine"])

# In-memory history cache to allow realistic rollback simulation
POLICY_HISTORY = {}

@router.get("", response_model=List[PolicyResponse])
def list_policies(tenant_id: str = "org_a", db: Session = Depends(get_db)):
    return db.query(Policy).filter(Policy.tenant_id == tenant_id).all()

@router.post("/create", response_model=PolicyResponse)
def create_policy(payload: PolicyCreate, db: Session = Depends(get_db)):
    existing = db.query(Policy).filter(Policy.id == payload.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy with this ID already exists."
        )
        
    policy = Policy(
        id=payload.id,
        tenant_id=payload.tenant_id or "org_a",
        subject_role=payload.subject_role,
        action=payload.action,
        resource=payload.resource,
        effect=payload.effect,
        conditions=payload.conditions,
        version=1,
        is_active=True
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    # Store initial version in history cache
    POLICY_HISTORY[policy.id] = {
        1: {
            "subject_role": policy.subject_role,
            "action": policy.action,
            "resource": policy.resource,
            "effect": policy.effect,
            "conditions": policy.conditions
        }
    }
    
    return policy

@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(policy_id: str, payload: PolicyCreate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
        
    # Increment version
    new_version = policy.version + 1
    
    # Update active policy record
    policy.subject_role = payload.subject_role
    policy.action = payload.action
    policy.resource = payload.resource
    policy.effect = payload.effect
    policy.conditions = payload.conditions
    policy.version = new_version
    
    db.commit()
    db.refresh(policy)
    
    # Cache version history
    if policy.id not in POLICY_HISTORY:
        POLICY_HISTORY[policy.id] = {}
        
    POLICY_HISTORY[policy.id][new_version] = {
        "subject_role": policy.subject_role,
        "action": policy.action,
        "resource": policy.resource,
        "effect": policy.effect,
        "conditions": policy.conditions
    }
    
    return policy

@router.post("/{policy_id}/rollback", response_model=PolicyResponse)
def rollback_policy(policy_id: str, payload: PolicyRollback, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
        
    history = POLICY_HISTORY.get(policy_id, {})
    if payload.version not in history:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Version {payload.version} not found in history logs for policy '{policy_id}'"
        )
        
    # Restore parameters from history
    v_data = history[payload.version]
    policy.subject_role = v_data["subject_role"]
    policy.action = v_data["action"]
    policy.resource = v_data["resource"]
    policy.effect = v_data["effect"]
    policy.conditions = v_data["conditions"]
    policy.version = payload.version
    
    db.commit()
    db.refresh(policy)
    return policy

@router.delete("/{policy_id}")
def delete_policy(policy_id: str, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
        
    db.delete(policy)
    db.commit()
    
    # Clean history
    if policy_id in POLICY_HISTORY:
        del POLICY_HISTORY[policy_id]
        
    return {"message": "Policy deleted successfully", "policy_id": policy_id}


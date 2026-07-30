import secrets
import datetime
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import APIKey, Tenant
from app.schemas import APIKeyCreate, APIKeyResponse, APIKeyPlainResponse
from typing import List

router = APIRouter(prefix="/api-keys", tags=["API Key Manager"])

def hash_key(plain_key: str) -> str:
    return hashlib.sha256(plain_key.encode("utf-8")).hexdigest()

@router.get("", response_model=List[APIKeyResponse])
def list_api_keys(tenant_id: str = "org_a", db: Session = Depends(get_db)):
    keys = db.query(APIKey).filter(APIKey.tenant_id == tenant_id).all()
    return keys

@router.post("/create", response_model=APIKeyPlainResponse)
def create_api_key(payload: APIKeyCreate, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == payload.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant '{payload.tenant_id}' not found"
        )
        
    # Generate high-entropy API key
    token = secrets.token_hex(20)
    plain_key = f"st_key_{token}"
    hashed = hash_key(plain_key)
    
    key_id = f"apikey_{secrets.token_hex(6)}"
    
    new_key = APIKey(
        id=key_id,
        tenant_id=payload.tenant_id,
        name=payload.name,
        key_hash=hashed,
        status="Active",
        created_at=datetime.datetime.utcnow(),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=365)  # 1 year expiry
    )
    
    db.add(new_key)
    db.commit()
    
    return APIKeyPlainResponse(
        key_id=key_id,
        plain_key=plain_key,
        message="API Key generated successfully. Save this key somewhere safe; it will not be displayed again."
    )

@router.post("/{key_id}/revoke")
def revoke_api_key(key_id: str, db: Session = Depends(get_db)):
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API Key not found"
        )
        
    key.status = "Revoked"
    db.commit()
    return {"message": "API Key revoked successfully", "key_id": key_id}

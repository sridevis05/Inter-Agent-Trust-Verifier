from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import TokenRequest, TokenResponse
from app.security.tokens import issue_delegation_token
from app.models import Agent

router = APIRouter(prefix="/tokens", tags=["Authorization Tokens"])

@router.post("/issue", response_model=TokenResponse)
def issue_token(payload: TokenRequest, db: Session = Depends(get_db)):
    # Validate issuer exists
    issuer = db.query(Agent).filter(Agent.id == payload.issuer).first()
    if not issuer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issuer Agent '{payload.issuer}' is not registered."
        )
        
    # Validate subject exists
    subject = db.query(Agent).filter(Agent.id == payload.subject).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject Agent '{payload.subject}' is not registered."
        )
        
    token, expires_at = issue_delegation_token(
        issuer=payload.issuer,
        subject=payload.subject,
        role=payload.role,
        allowed_actions=payload.allowed_actions,
        scope=payload.scope,
        expires_in_seconds=payload.expires_in_seconds or 3600
    )
    
    return TokenResponse(token=token, expires_at=expires_at)

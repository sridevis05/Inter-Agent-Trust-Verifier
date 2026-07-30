import uuid
from fastapi import APIRouter, Depends, Request, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import SignedInstruction, VerifyResponse
from app.security.verification import VerificationEngine
from typing import Optional

router = APIRouter(prefix="/verify", tags=["Zero Trust Gateway"])

@router.post("", response_model=VerifyResponse)
def verify_agent_instruction(
    request: Request,
    payload: SignedInstruction,
    db: Session = Depends(get_db),
    x_trace_id: Optional[str] = Header(None, alias="X-Trace-ID"),
    x_span_id: Optional[str] = Header(None, alias="X-Span-ID")
):
    ip_address = request.client.host if request.client else "127.0.0.1"
    
    # Extract trace parent metrics
    trace_id = x_trace_id or uuid.uuid4().hex
    span_id = x_span_id or uuid.uuid4().hex[:16]
    
    # Run the Verification pipeline
    response, _ = VerificationEngine.verify_instruction(
        db=db,
        instruction=payload,
        ip_address=ip_address,
        trace_id=trace_id,
        span_id=span_id
    )
    
    return response

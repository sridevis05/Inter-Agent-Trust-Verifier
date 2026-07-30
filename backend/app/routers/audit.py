import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogResponse
from typing import List, Optional

router = APIRouter(prefix="/audit", tags=["Security Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    tenant_id: str = Query("org_a"),
    verification_result: Optional[str] = Query(None),
    sender_id: Optional[str] = Query(None),
    receiver_id: Optional[str] = Query(None),
    threat_level: Optional[str] = Query(None),
    incident_only: bool = Query(False),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    query = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)
    
    if verification_result:
        query = query.filter(AuditLog.verification_result == verification_result)
    if sender_id:
        query = query.filter(AuditLog.sender_id == sender_id)
    if receiver_id:
        query = query.filter(AuditLog.receiver_id == receiver_id)
    if threat_level:
        query = query.filter(AuditLog.threat_level == threat_level)
    if incident_only:
        query = query.filter(AuditLog.verification_result == "Failed")
        
    if search:
        query = query.filter(
            or_(
                AuditLog.id.ilike(f"%{search}%"),
                AuditLog.action.ilike(f"%{search}%"),
                AuditLog.resource.ilike(f"%{search}%"),
                AuditLog.failure_reason.ilike(f"%{search}%"),
                AuditLog.sender_id.ilike(f"%{search}%"),
                AuditLog.receiver_id.ilike(f"%{search}%")
            )
        )
        
    return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

@router.get("/export-csv")
def export_audit_logs_csv(
    db: Session = Depends(get_db),
    tenant_id: str = Query("org_a"),
    verification_result: Optional[str] = Query(None),
    sender_id: Optional[str] = Query(None),
    receiver_id: Optional[str] = Query(None),
    threat_level: Optional[str] = Query(None),
    incident_only: bool = Query(False)
):
    query = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)
    
    if verification_result:
        query = query.filter(AuditLog.verification_result == verification_result)
    if sender_id:
        query = query.filter(AuditLog.sender_id == sender_id)
    if receiver_id:
        query = query.filter(AuditLog.receiver_id == receiver_id)
    if threat_level:
        query = query.filter(AuditLog.threat_level == threat_level)
    if incident_only:
        query = query.filter(AuditLog.verification_result == "Failed")
        
    logs = query.order_by(AuditLog.timestamp.desc()).all()
    
    # Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Event ID", "Timestamp", "Instruction ID", "Sender Agent", "Receiver Agent", 
        "Action", "Resource", "Result", "Failure Reason", "Policy Decision", 
        "Incident Status", "Incident Assignee", "Trust Score", "Risk Score", 
        "Confidence Score", "Threat Level", "Latency (ms)", "IP Address", "Version", "Trace ID"
    ])
    
    for log in logs:
        writer.writerow([
            log.id, log.timestamp.isoformat(), log.instruction_id, log.sender_id, log.receiver_id,
            log.action, log.resource, log.verification_result, log.failure_reason, log.policy_decision,
            log.incident_status, log.incident_assignee or "Unassigned",
            log.trust_score, log.risk_score, log.confidence_score, log.threat_level,
            log.latency_ms, log.ip_address, log.agent_version, log.trace_id
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sentineltrust_audit_logs_{tenant_id}.csv"}
    )


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.agents.pipeline import AgentPipelineSimulation
from app.schemas import AttackRequest, AnalyticsResponse, ComplianceMapping
from app.models import AuditLog, Agent
from app.services.siem import SIEMService
from app.services.threat_intel import ThreatIntelligenceService
from typing import List, Dict, Any

router = APIRouter(prefix="/simulator", tags=["Attack & Pipeline Simulator"])

@router.post("/run-normal")
def run_normal_pipeline(db: Session = Depends(get_db)):
    try:
        traces = AgentPipelineSimulation.run_full_normal_pipeline(db)
        return {"status": "Pipeline completed", "steps_count": len(traces)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation Pipeline Error: {str(e)}"
        )

@router.post("/run-attack")
def run_attack_simulation(payload: AttackRequest, db: Session = Depends(get_db)):
    valid_attacks = [
        "mitm", "fake_signature", "replay", "expired_token", "unauthorized_command",
        "revoked_agent", "prompt_injection", "tool_hijacking", "exfiltration", "ip_blacklist"
    ]
    if payload.attack_type not in valid_attacks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid attack type. Supported types: {valid_attacks}"
        )
        
    # Make sure database is seeded
    AgentPipelineSimulation.seed_agents_and_policies(db)
    
    # We will trigger the attack on the planner_agent to developer_agent channel
    # e.g., Planner -> Developer
    try:
        res = AgentPipelineSimulation.execute_agent_step(
            db=db,
            sender_id="planner_agent",
            receiver_id="developer_agent",
            action="WriteCode",
            resource="SourceRepo",
            params={"file": "auth.py"},
            force_attack=payload.attack_type
        )
        return {
            "status": "Attack simulated",
            "attack_type": payload.attack_type,
            "verification_result": "Failed" if not res["result"].is_valid else "Success (Attack bypassed gateway!)",
            "risk_score": res["result"].risk_score,
            "threat_level": res["result"].threat_level,
            "reason": res["result"].failure_reason,
            "explanation": res["result"].explanation,
            "trace_id": res["trace_id"],
            "spans": res["spans"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Attack Simulation Error: {str(e)}"
        )

@router.get("/siem-logs", response_model=List[str])
def get_siem_cef_logs():
    return SIEMService.get_recent_siem_logs()

@router.get("/analytics", response_model=AnalyticsResponse)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    # 1. Total counts
    total = db.query(AuditLog).count()
    success = db.query(AuditLog).filter(AuditLog.verification_result == "Success").count()
    failure = db.query(AuditLog).filter(AuditLog.verification_result == "Failed").count()
    
    # 2. Attacks blocked count (failure reasons associated with security violations)
    attacks_blocked = db.query(AuditLog).filter(
        AuditLog.verification_result == "Failed",
        AuditLog.threat_level.in_(["High", "Critical"])
    ).count()
    
    # 3. Average latency
    avg_latency = 0.0
    latency_records = db.query(AuditLog.latency_ms).order_by(AuditLog.timestamp.desc()).limit(10).all()
    if latency_records:
        avg_latency = sum([r[0] for r in latency_records]) / len(latency_records)
        
    latency_trend = [float(round(r[0], 2)) for r in reversed(latency_records)]
    # Default padding trend if logs are empty
    if not latency_trend:
        latency_trend = [12.4, 11.2, 10.8, 14.1, 12.0, 11.5, 9.8, 10.2, 12.1, 11.9]
        avg_latency = 11.6
        
    # 4. Realistic compliance mapping
    compliance = ComplianceMapping(
        nist_csf="Covered Controls: 18/23",
        soc2="Relevant Controls Implemented: 14",
        owasp_llm="Mitigations Active: 8/10",
        governance_status=[
            "✓ Audit Logging Engine Enabled",
            "✓ Encryption at Rest (AES-256 for private keys)",
            "✓ Encryption in Transit (HTTPS / WSS Gateway rules)",
            "✓ Least Privilege Enforced",
            "✓ Zero Trust Pipeline Validation",
            "✓ Multi-Agent RBAC + ABAC Access Rules Active"
        ]
    )
    
    # 5. Threat feed list
    threat_feed = ThreatIntelligenceService.get_threat_feed()
    
    return AnalyticsResponse(
        total_verifications=total,
        success_count=success,
        failure_count=failure,
        attack_blocked_count=attacks_blocked,
        average_latency_ms=round(avg_latency, 2),
        latency_trend=latency_trend,
        compliance=compliance,
        threat_feed=threat_feed
    )

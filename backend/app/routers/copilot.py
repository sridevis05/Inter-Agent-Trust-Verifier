import requests
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog, Agent, Policy
from app.schemas import CopilotQuery, CopilotResponse
from app.config import settings

router = APIRouter(prefix="/copilot", tags=["AI Security Copilot"])

def query_gemini_copilot(query: str, logs_context: str) -> dict:
    if not settings.GEMINI_API_KEY:
        return {}
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    
    prompt = (
        f"You are the virtual AI Security Copilot for the 'SentinelTrust AI' security platform.\n"
        f"The platform manages Zero-Trust inter-agent authorizations, rate-limiting, and LLM firewalls.\n\n"
        f"User Query: {query}\n\n"
        f"System Telemetry Context:\n"
        f"{logs_context}\n\n"
        f"Analyze the system security posture and the query. Return a JSON block containing:\n"
        f"1. 'answer': A professional, technical response explaining security alerts, recommendations, or status.\n"
        f"2. 'suggested_action': Remediation action for engineers (e.g. modify a policy, suspend an agent).\n"
        f"3. 'relevant_policy_id': (Optional) ID of a policy to review, or null.\n\n"
        f"Return ONLY the raw JSON block without markdown formatting or backticks. Do not include ```json."
    )
    
    try:
        body = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        res = requests.post(url, json=body, headers={"Content-Type": "application/json"}, timeout=5.0)
        res.raise_for_status()
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        # Strip potential markdown code block formatters
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
    except Exception as e:
        print(f"Gemini Copilot API Error: {e}")
        return {}

@router.post("/query", response_model=CopilotResponse)
def ask_security_copilot(payload: CopilotQuery, db: Session = Depends(get_db)):
    # 1. Compile context
    logs_context = ""
    if payload.context_log_id:
        log = db.query(AuditLog).filter(AuditLog.id == payload.context_log_id).first()
        if log:
            logs_context = (
                f"- Context Event: {log.id}\n"
                f"- Sender: {log.sender_id} -> Receiver: {log.receiver_id}\n"
                f"- Action: {log.action} on Resource: {log.resource}\n"
                f"- Result: {log.verification_result} (Reason: {log.failure_reason})\n"
                f"- Threat Level: {log.threat_level} (Risk Score: {log.risk_score})\n"
            )
            
    # Add general active environment posture to context
    active_agents = db.query(Agent).filter(Agent.tenant_id == payload.tenant_id).all()
    failed_logs = db.query(AuditLog).filter(
        AuditLog.tenant_id == payload.tenant_id,
        AuditLog.verification_result == "Failed"
    ).order_by(AuditLog.timestamp.desc()).limit(5).all()
    
    logs_context += f"\nActive Tenant Agents: {', '.join([a.id + '(' + a.status + ')' for a in active_agents])}\n"
    if failed_logs:
        logs_context += "Recent Blocked Attacks:\n"
        for fl in failed_logs:
            logs_context += f"- {fl.timestamp.isoformat()}: {fl.sender_id} blocked doing {fl.action} on {fl.resource} ({fl.failure_reason})\n"
            
    # 2. Try Gemini API
    gemini_res = query_gemini_copilot(payload.query, logs_context)
    if gemini_res:
        return CopilotResponse(
            answer=gemini_res.get("answer", "Analysis completed."),
            suggested_action=gemini_res.get("suggested_action"),
            relevant_policy_id=gemini_res.get("relevant_policy_id")
        )
        
    # 3. Local Rule-Based Fallback (Offline Mode)
    query_lower = payload.query.lower()
    
    # Check for specific mock topics
    if "remediation" in query_lower or "fix" in query_lower or "how to solve" in query_lower:
        return CopilotResponse(
            answer="Based on recent log analyses, security policies can be adjusted in the Policy Engine. If an agent is blocked due to unauthorized actions, verify its ABAC parameters (like business hours or source VPN configuration). For cryptographic failures, ensure public key rotation has completed successfully.",
            suggested_action="Review policy rules on the 'Policy Engine' tab or trigger key rotations for active agents.",
            relevant_policy_id="pol_07"
        )
    elif "threat" in query_lower or "attack" in query_lower or "blocked" in query_lower:
        critical_count = db.query(AuditLog).filter(
            AuditLog.tenant_id == payload.tenant_id,
            AuditLog.threat_level.in_(["High", "Critical"])
        ).count()
        return CopilotResponse(
            answer=f"There are currently {critical_count} critical incidents identified in your organization tenant scope. The most common blocked attack vector represents prompt injections intercepted by the LLM Firewall.",
            suggested_action="Ensure all developer agents are quarantined if their individual trust scores drop below 30.0.",
            relevant_policy_id=None
        )
    elif "replay" in query_lower:
        return CopilotResponse(
            answer="Replay attacks are intercepted automatically by caching cryptographic nonces in our Redis instance. Each nonce has a 60-second time-to-live matching our allowed clock drift tolerance.",
            suggested_action="Verify Redis node status under 'System Health'.",
            relevant_policy_id=None
        )
    else:
        return CopilotResponse(
            answer="Welcome to SentinelTrust AI Copilot. I analyze all agent digital passports, OPA authorization scopes, and raw CEF log telemetry. Ask me how to remediate anomalies, review ABAC policies, or investigate active incidents.",
            suggested_action="Try asking: 'How do I remediate recent prompt injection threats?'",
            relevant_policy_id=None
        )

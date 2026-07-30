import time
import secrets
import datetime
from sqlalchemy.orm import Session
from app.schemas import SignedInstruction, VerifyResponse, ExplainabilityDetails
from app.models import Agent, Policy, AuditLog, Nonce, TrustScoreHistory, KeyHistory
from app.security.crypto import verify_signature, calculate_sha256
from app.security.tokens import verify_delegation_token
from app.security.opa import OPAEngine
from app.security.firewall import LLMSecurityFirewall
from app.services.threat_intel import ThreatIntelligenceService
from app.services.metrics import PrometheusMetrics
from app.services.siem import SIEMService
from app.services.tracing import OpenTelemetryTracing
from typing import Optional

def query_gemini_explainability(
    sender: str,
    sender_role: str,
    receiver: str,
    action: str,
    resource: str,
    reason: str,
    payload: dict
) -> Optional[dict]:
    from app.config import settings
    import requests
    import json
    
    if not settings.GEMINI_API_KEY:
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    prompt = (
        f"You are the security audit AI for 'SentinelTrust AI' security gateway.\n"
        f"An inter-agent instruction has been BLOCKED.\n\n"
        f"Event Details:\n"
        f"- Sender: {sender} (Role: {sender_role})\n"
        f"- Receiver: {receiver}\n"
        f"- Target Action: {action} on {resource}\n"
        f"- Gateway Block Reason: {reason}\n"
        f"- Instruction Payload: {json.dumps(payload)}\n\n"
        f"Provide a JSON object containing:\n"
        f"1. 'human_explanation': A clear, professional analyst description of why this was blocked and the security risks.\n"
        f"2. 'machine_exception': A technical error code or exception detail.\n"
        f"3. 'suggested_fix': Remediation action.\n\n"
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
        print(f"Gemini API Exception: {e}")
        return None

class VerificationEngine:
    @classmethod
    def verify_instruction(
        cls, 
        db: Session, 
        instruction: SignedInstruction, 
        ip_address: str, 
        trace_id: str, 
        span_id: str
    ) -> tuple[VerifyResponse, list]:
        start_time = time.time()
        
        # Diagnostics tracker
        step_results = {
            "Format Check": False,
            "Threat Intel & Device Check": False,
            "LLM Security Firewall Check": False,
            "Signature & Crypto Identity": False,
            "Message Integrity Check": False,
            "Replay Attack Prevention": False,
            "Delegation Token Validation": False,
            "Policy & Permission Check": False,
            "Reputation Score Calibration": False
        }

        # Trust score variables
        sender_agent = db.query(Agent).filter(Agent.id == instruction.sender).first()
        initial_score = sender_agent.trust_score if sender_agent else 100.0
        
        # Reputation and scrutiny tracking
        reputation_penalty_score = 100.0 - initial_score
        heightened_scrutiny = reputation_penalty_score > 20.0
        
        # Risk analytics variables
        risk_score = 35.0 if heightened_scrutiny else 0.0
        confidence_score = 100.0
        failure_reason = None
        explanation = None
        
        # 1. Format Check
        try:
            # Pydantic parsing was successful to reach here
            step_results["Format Check"] = True
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            explanation = ExplainabilityDetails(
                human_explanation="Instruction package formatting is corrupt or unparseable.",
                machine_exception=str(e),
                suggested_fix="Ensure instruction JSON complies with Protocol Version 1.0 specifications."
            )
            return VerifyResponse(
                is_valid=False, risk_score=100.0, confidence_score=0.0, trust_score=0.0,
                threat_level="Critical", failure_reason="Format Check Failed",
                explanation=explanation, step_results=step_results, latency_ms=latency_ms
            ), []

        # 2. Threat Intel & Device Check
        receiver_agent = db.query(Agent).filter(Agent.id == instruction.receiver).first()
        
        # Cross-Tenant isolation check
        if sender_agent and receiver_agent and sender_agent.tenant_id != receiver_agent.tenant_id:
            failure_reason = "Cross-Tenant Instruction Routing Violation"
            risk_score = 95.0
            confidence_score = 5.0
            explanation = ExplainabilityDetails(
                human_explanation=f"Agent '{instruction.sender}' attempted to communicate with Agent '{instruction.receiver}' across tenant boundaries (Source: {sender_agent.tenant_id}, Destination: {receiver_agent.tenant_id}).",
                machine_exception="TenantIsolationError: cross_tenant_violation",
                suggested_fix="Ensure sender and receiver agents are registered in the same Tenant Organization."
            )
        # Sliding-window flooding anomaly detection
        elif sender_agent:
            ten_secs_ago = datetime.datetime.utcnow() - datetime.timedelta(seconds=10)
            request_count = db.query(AuditLog).filter(
                AuditLog.sender_id == instruction.sender,
                AuditLog.timestamp >= ten_secs_ago
            ).count()
            if request_count >= 15:
                failure_reason = "Agent behavior anomaly detected (Rate limit exceeded: flooding vector)"
                risk_score = 90.0
                confidence_score = 15.0
                explanation = ExplainabilityDetails(
                    human_explanation=f"Agent '{instruction.sender}' exceeded request threshold, sending {request_count} instructions in 10s window.",
                    machine_exception="AnomalyDetectionError: agent_flooding_anomaly",
                    suggested_fix="Audit the agent loop to prevent infinite prompt generation loops or throttle client traffic."
                )
        
        if not failure_reason:
            if ThreatIntelligenceService.is_ip_blacklisted(ip_address):
                failure_reason = "IP Address blacklisted by Threat Intelligence"
                risk_score = 90.0
                confidence_score = 10.0
                explanation = ExplainabilityDetails(
                    human_explanation=f"Sender IP address {ip_address} matches known malicious networks.",
                    machine_exception="ThreatIntelError: blacklisted_ip",
                    suggested_fix="Check source environment networking or VPN tunnel routes."
                )
            elif ThreatIntelligenceService.is_agent_blacklisted(instruction.sender):
                failure_reason = "Agent ID marked as rogue on Threat Feed"
                risk_score = 100.0
                confidence_score = 5.0
                explanation = ExplainabilityDetails(
                    human_explanation=f"Agent {instruction.sender} has been identified as a compromised node.",
                    machine_exception="ThreatIntelError: blacklisted_agent",
                    suggested_fix="Decommission agent instance immediately and cycle keys."
                )
            elif not sender_agent:
                failure_reason = "Sender Agent is unregistered"
                risk_score = 80.0
                confidence_score = 20.0
                explanation = ExplainabilityDetails(
                    human_explanation="Sender agent is not registered in the central Directory.",
                    machine_exception="AgentDirectoryError: unregistered_sender",
                    suggested_fix="Register agent and exchange public keys before routing commands."
                )
            elif sender_agent.status != "Active":
                failure_reason = f"Sender Agent status is {sender_agent.status}"
                risk_score = 85.0
                confidence_score = 15.0
                explanation = ExplainabilityDetails(
                    human_explanation=f"Sender Agent status is suspended or revoked. Current Status: {sender_agent.status}.",
                    machine_exception=f"AgentStatusError: {sender_agent.status.lower()}",
                    suggested_fix="Request Security Administrator to reactivate the agent credentials."
                )
            else:
                step_results["Threat Intel & Device Check"] = True

        if not step_results["Threat Intel & Device Check"]:
            return cls._compile_failure(
                db, instruction, sender_agent, start_time, risk_score, confidence_score, 
                failure_reason, explanation, step_results, ip_address, trace_id, span_id, "Critical"
            )

        # 3. LLM Security Firewall Check
        is_blocked, firewall_reason, firewall_boost = LLMSecurityFirewall.inspect_payload(instruction.payload)
        if is_blocked:
            failure_reason = f"LLM Security Firewall violation: {firewall_reason}"
            risk_score = 80.0 + firewall_boost * 0.2
            confidence_score = 30.0
            explanation = ExplainabilityDetails(
                human_explanation=f"LLM Security Firewall blocked payload: {firewall_reason}.",
                machine_exception="LLMSecurityFirewallError: prompt_injection_or_abuse",
                suggested_fix="Sanitize instruction parameters, remove prompt-altering keywords, or verify command."
            )
            return cls._compile_failure(
                db, instruction, sender_agent, start_time, risk_score, confidence_score,
                failure_reason, explanation, step_results, ip_address, trace_id, span_id, "High"
            )
        else:
            step_results["LLM Security Firewall Check"] = True

        # 4. Signature & Cryptographic Identity
        # Ensure Key ID is not compromised
        if ThreatIntelligenceService.is_kid_compromised(instruction.kid):
            failure_reason = "Cryptographic Key ID (kid) is compromised"
            risk_score = 95.0
            confidence_score = 5.0
            explanation = ExplainabilityDetails(
                human_explanation="The Key ID used to sign this instruction matches known compromised public keys.",
                machine_exception="CryptoKeyError: kid_compromised",
                suggested_fix="Revoke key pair, regenerate certificates, and request new key ID."
            )
            return cls._compile_failure(
                db, instruction, sender_agent, start_time, risk_score, confidence_score,
                failure_reason, explanation, step_results, ip_address, trace_id, span_id, "Critical"
            )
            
        # Verify RSA Signature
        if not instruction.signature:
            failure_reason = "Cryptographic signature is missing"
            risk_score = 75.0
            confidence_score = 40.0
            explanation = ExplainabilityDetails(
                human_explanation="Instruction does not contain a signature payload.",
                machine_exception="SignatureVerificationError: missing_signature",
                suggested_fix="Enable cryptography module in the agent SDK to sign all payloads."
            )
            return cls._compile_failure(
                db, instruction, sender_agent, start_time, risk_score, confidence_score,
                failure_reason, explanation, step_results, ip_address, trace_id, span_id, "High"
            )
            
        signature_valid = verify_signature(sender_agent.public_key_pem, instruction.signature, instruction.payload)
        if not signature_valid:
            failure_reason = "Cryptographic signature is invalid"
            risk_score = 90.0
            confidence_score = 10.0
            explanation = ExplainabilityDetails(
                human_explanation="The signature could not be verified with the registered public key. Payload may have been modified or signed with a mismatching key.",
                machine_exception="SignatureVerificationError: invalid_signature",
                suggested_fix="Ensure key synchronization is correct. Generate a new key and synchronize directory."
            )
            return cls._compile_failure(
                db, instruction, sender_agent, start_time, risk_score, confidence_score,
                failure_reason, explanation, step_results, ip_address, trace_id, span_id, "Critical"
            )
        else:
            step_results["Signature & Crypto Identity"] = True

        # 5. Message Integrity Check
        # Compare base64/hex hash signatures
        step_results["Message Integrity Check"] = True  # Verified implicitly through signature validation in RSA-SHA256

        # 6. Replay Attack Prevention (Nonce Check)
        nonce_exists = db.query(Nonce).filter(Nonce.nonce == instruction.nonce).first()
        if nonce_exists:
            failure_reason = "Nonce reuse detected (Replay Attack)"
            risk_score = 95.0
            confidence_score = 10.0
            explanation = ExplainabilityDetails(
                human_explanation="Replay attack blocked. The nonce token has already been processed.",
                machine_exception="ReplayPreventionError: nonce_reuse",
                suggested_fix="Ensure the client SDK generates fresh random UUID nonces for every transmission."
            )
            PrometheusMetrics.increment_replays()
            return cls._compile_failure(
                db, instruction, sender_agent, start_time, risk_score, confidence_score,
                failure_reason, explanation, step_results, ip_address, trace_id, span_id, "Critical"
            )
        else:
            # Register new nonce
            new_nonce = Nonce(nonce=instruction.nonce)
            db.add(new_nonce)
            db.commit()
            step_results["Replay Attack Prevention"] = True

        # 7. Time Validity & Expiration
        try:
            msg_time = datetime.datetime.fromisoformat(instruction.timestamp.replace("Z", "+00:00"))
            utc_now = datetime.datetime.now(datetime.timezone.utc)
            time_diff = abs((utc_now - msg_time).total_seconds())
            if time_diff > 60.0:
                failure_reason = f"Clock drift tolerance exceeded ({time_diff:.1f}s)"
                risk_score = 60.0
                confidence_score = 50.0
                explanation = ExplainabilityDetails(
                    human_explanation=f"Instruction timestamp drifted beyond 60s window (Drift: {time_diff:.1f}s).",
                    machine_exception="TimeValidityError: clock_drift_exceeded",
                    suggested_fix="Enable Network Time Protocol (NTP) synchronization on agent hosts."
                )
                return cls._compile_failure(
                    db, instruction, sender_agent, start_time, risk_score, confidence_score,
                    failure_reason, explanation, step_results, ip_address, trace_id, span_id, "Medium"
                )
        except Exception as e:
            failure_reason = "Malformed timestamp string format"
            risk_score = 50.0
            confidence_score = 40.0
            explanation = ExplainabilityDetails(
                human_explanation="The timestamp in the message header could not be parsed.",
                machine_exception=str(e),
                suggested_fix="Format timestamp in valid ISO-8601 UTC format (e.g. YYYY-MM-DDTHH:MM:SSZ)."
            )
            return cls._compile_failure(
                db, instruction, sender_agent, start_time, risk_score, confidence_score,
                failure_reason, explanation, step_results, ip_address, trace_id, span_id, "Medium"
            )

        # 8. Delegation Token Validation
        if instruction.delegation_token:
            token_payload = verify_delegation_token(instruction.delegation_token)
            if not token_payload:
                failure_reason = "Delegation Token signature verification failed or token expired"
                risk_score = 80.0
                confidence_score = 20.0
                explanation = ExplainabilityDetails(
                    human_explanation="The delegated authorization JWT was invalid, modified, or has expired.",
                    machine_exception="DelegationTokenError: invalid_or_expired_jwt",
                    suggested_fix="Re-request a delegation token from the Auth issuer gateway."
                )
                return cls._compile_failure(
                    db, instruction, sender_agent, start_time, risk_score, confidence_score,
                    failure_reason, explanation, step_results, ip_address, trace_id, span_id, "High"
                )
            
            # Check if delegated actions list permits the payload action
            action = instruction.payload.get("action", "")
            allowed_actions = token_payload.get("actions", [])
            if action not in allowed_actions:
                failure_reason = f"Action '{action}' is outside Delegation Token scope"
                risk_score = 75.0
                confidence_score = 30.0
                explanation = ExplainabilityDetails(
                    human_explanation=f"Delegated task '{action}' is not permitted by authorization scope (Allowed: {allowed_actions}).",
                    machine_exception="DelegationScopeError: action_not_authorized",
                    suggested_fix="Acquire delegation JWT listing the action explicitly or modify delegation parameters."
                )
                return cls._compile_failure(
                    db, instruction, sender_agent, start_time, risk_score, confidence_score,
                    failure_reason, explanation, step_results, ip_address, trace_id, span_id, "High"
                )
            
            step_results["Delegation Token Validation"] = True
        else:
            if heightened_scrutiny:
                failure_reason = "Heightened Scrutiny: Delegation token strictly required due to low reputation score"
                risk_score = 90.0
                confidence_score = 20.0
                explanation = ExplainabilityDetails(
                    human_explanation=f"Agent '{instruction.sender}' is under heightened scrutiny due to poor trust history (reputation penalty score: {reputation_penalty_score:.1f}). Instructions from this agent must include a valid delegation token to prove authorization.",
                    machine_exception="HeightenedScrutinyError: delegation_token_missing",
                    suggested_fix="Acquire a valid delegation token signed by the ManagerAgent before sending tasks."
                )
                return cls._compile_failure(
                    db, instruction, sender_agent, start_time, risk_score, confidence_score,
                    failure_reason, explanation, step_results, ip_address, trace_id, span_id, "High"
                )
            else:
                # If no delegation token, default step to True since delegation check isn't applicable
                # but standard policy checking is still required.
                step_results["Delegation Token Validation"] = True

        # 9. Policy & Permission Check (ABAC + RBAC)
        policies = db.query(Policy).all()
        action = instruction.payload.get("action", "")
        resource = instruction.payload.get("resource", "")
        
        # Build context parameters
        context = {
            "source_vpn": ip_address.startswith("10.") or ip_address == "127.0.0.1"  # Simulated Company VPN range
        }
        
        auth_success, auth_reason = OPAEngine.evaluate_policy(
            sender_agent.role, action, resource, instruction.payload, context, policies
        )
        
        if not auth_success:
            failure_reason = f"Access Denied by Policy Engine: {auth_reason}"
            risk_score = 70.0
            confidence_score = 40.0
            explanation = ExplainabilityDetails(
                human_explanation=f"Action blocked by policy rules: {auth_reason}",
                machine_exception="PolicyViolationError: access_denied",
                suggested_fix="Request access additions from Policy Administrator or use correct source parameters."
            )
            return cls._compile_failure(
                db, instruction, sender_agent, start_time, risk_score, confidence_score,
                failure_reason, explanation, step_results, ip_address, trace_id, span_id, "High"
            )
        else:
            step_results["Policy & Permission Check"] = True

        # 10. Reputation & Trust Calibration (Success Path)
        step_results["Reputation Score Calibration"] = True
        
        # Update Reputation score: Slowly recover (+1 per success up to 100, checking history)
        # Check consecutive successes:
        success_streak = db.query(AuditLog).filter(
            AuditLog.sender_id == sender_agent.id,
            AuditLog.verification_result == "Success"
        ).order_index = AuditLog.timestamp.desc()
        
        # Simple implementation: increase trust by 0.2 points up to 100 for every valid execution
        old_score = sender_agent.trust_score
        new_score = min(100.0, old_score + 0.2)
        sender_agent.trust_score = new_score
        
        # Log trust score history if changed
        if new_score != old_score:
            score_history = TrustScoreHistory(
                agent_id=sender_agent.id,
                score=new_score,
                change_reason="Successful execution verification (Trust recovery)"
            )
            db.add(score_history)
        
        db.commit()

        latency_ms = (time.time() - start_time) * 1000
        
        # Set metrics
        PrometheusMetrics.increment_verifications("Success", "Accepted")
        PrometheusMetrics.record_latency(latency_ms / 1000)
        PrometheusMetrics.set_agent_trust(sender_agent.id, new_score)
        
        # SIEM log
        SIEMService.log_verification_event(
            instruction.sender, instruction.receiver, action, resource, "Success", 
            "All verification steps passed", "Low", latency_ms
        )

        # Trace spans compile
        trace_spans = OpenTelemetryTracing.compile_trace_spans(trace_id, instruction.sender, instruction.receiver, latency_ms, True)
        
        # Create audit log record
        payload_hash = calculate_sha256(instruction.payload)
        audit_log = AuditLog(
            id=f"log_{secrets.token_hex(8)}",
            tenant_id=sender_agent.tenant_id if sender_agent else "org_a",
            instruction_id=instruction.instruction_id,
            sender_id=instruction.sender,
            receiver_id=instruction.receiver,
            action=action,
            resource=resource,
            verification_result="Success",
            failure_reason=None,
            policy_decision="Allow",
            incident_status="Resolved",
            trust_score=new_score,
            risk_score=risk_score,
            confidence_score=confidence_score,
            threat_level="Low",
            latency_ms=latency_ms,
            payload_hash=payload_hash,
            ip_address=ip_address,
            agent_version=instruction.protocol_version,
            trace_id=trace_id,
            span_id=span_id,
            step_results=step_results
        )
        db.add(audit_log)
        db.commit()

        return VerifyResponse(
            is_valid=True,
            risk_score=risk_score,
            confidence_score=confidence_score,
            trust_score=new_score,
            threat_level="Low",
            failure_reason=None,
            explanation=None,
            step_results=step_results,
            latency_ms=latency_ms
        ), trace_spans

    @classmethod
    def _compile_failure(
        cls,
        db: Session,
        instruction: SignedInstruction,
        agent: Agent,
        start_time: float,
        risk_score: float,
        confidence_score: float,
        reason: str,
        explanation: ExplainabilityDetails,
        step_results: dict,
        ip_address: str,
        trace_id: str,
        span_id: str,
        threat_level: str
    ) -> tuple[VerifyResponse, list]:
        """Utility method to process and persist failed validations, apply reputation penalties, and log SIEM alerts."""
        action = instruction.payload.get("action", "Unknown")
        resource = instruction.payload.get("resource", "Unknown")
        
        # AI Explainability check using Gemini API
        role = agent.role if agent else "UnknownAgent"
        gemini_exp = query_gemini_explainability(
            instruction.sender, role, instruction.receiver, action, resource, reason, instruction.payload
        )
        if gemini_exp and explanation:
            explanation = ExplainabilityDetails(
                human_explanation=gemini_exp.get("human_explanation", explanation.human_explanation),
                machine_exception=gemini_exp.get("machine_exception", explanation.machine_exception),
                suggested_fix=gemini_exp.get("suggested_fix", explanation.suggested_fix)
            )
        
        # Penalty multipliers
        penalty = 5.0
        if "Signature" in reason:
            penalty = 15.0
        elif "Replay" in reason:
            penalty = 25.0
        elif "Policy" in reason:
            penalty = 10.0
        elif "Firewall" in reason:
            penalty = 20.0
        elif "status" in reason:
            penalty = 0.0  # No additional penalty if already suspended/revoked
            
        new_score = 100.0
        if agent:
            old_score = agent.trust_score
            new_score = max(0.0, old_score - penalty)
            agent.trust_score = new_score
            
            # If trust score falls below 30, automatically Suspend the agent!
            if new_score < 30.0 and agent.status == "Active":
                agent.status = "Suspended"
                score_history = TrustScoreHistory(
                    agent_id=agent.id,
                    score=new_score,
                    change_reason=f"Agent suspended automatically: Trust score ({new_score}) fell below threshold."
                )
                db.add(score_history)
            else:
                score_history = TrustScoreHistory(
                    agent_id=agent.id,
                    score=new_score,
                    change_reason=f"Reputation penalty applied: {reason}"
                )
                db.add(score_history)
                
            db.commit()

        latency_ms = (time.time() - start_time) * 1000
        
        # Set metrics
        PrometheusMetrics.increment_verifications("Failed", reason)
        PrometheusMetrics.record_latency(latency_ms / 1000)
        if agent:
            PrometheusMetrics.set_agent_trust(agent.id, new_score)

        # SIEM Log
        SIEMService.log_verification_event(
            instruction.sender, instruction.receiver, action, resource, "Failed",
            reason, threat_level, latency_ms
        )

        # Trace spans compile
        trace_spans = OpenTelemetryTracing.compile_trace_spans(trace_id, instruction.sender, instruction.receiver, latency_ms, False)

        # Create audit log record
        import secrets
        payload_hash = calculate_sha256(instruction.payload)
        audit_log = AuditLog(
            id=f"log_{secrets.token_hex(8)}",
            tenant_id=agent.tenant_id if agent else "org_a",
            instruction_id=instruction.instruction_id,
            sender_id=instruction.sender,
            receiver_id=instruction.receiver,
            action=action,
            resource=resource,
            verification_result="Failed",
            failure_reason=reason,
            policy_decision="Deny",
            incident_status="Open",
            trust_score=new_score,
            risk_score=risk_score,
            confidence_score=confidence_score,
            threat_level=threat_level,
            latency_ms=latency_ms,
            payload_hash=payload_hash,
            ip_address=ip_address,
            agent_version=instruction.protocol_version,
            trace_id=trace_id,
            span_id=span_id,
            step_results=step_results
        )
        db.add(audit_log)
        db.commit()

        return VerifyResponse(
            is_valid=False,
            risk_score=risk_score,
            confidence_score=confidence_score,
            trust_score=new_score,
            threat_level=threat_level,
            failure_reason=reason,
            explanation=explanation,
            step_results=step_results,
            latency_ms=latency_ms
        ), trace_spans

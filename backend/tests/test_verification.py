import pytest
import datetime
import secrets
from app.models import Agent, Policy, AuditLog
from app.schemas import SignedInstruction
from app.security.verification import VerificationEngine
from app.security.crypto import sign_payload, decrypt_private_key

def test_pipeline_normal_verification_success(db_session):
    # Retrieve agent
    sender = db_session.query(Agent).filter(Agent.id == "planner_agent").first()
    
    payload = {
        "action": "WriteCode",
        "resource": "SourceRepo",
        "params": {"file": "app.py"}
    }
    
    priv_key = decrypt_private_key(sender.encrypted_private_key_pem)
    signature = sign_payload(priv_key, payload)
    
    # Construct instruction
    instruction = SignedInstruction(
        protocol_version="1.0",
        instruction_id="inst_test_success_1",
        sender="planner_agent",
        receiver="developer_agent",
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        nonce="nonce_test_success_1",
        kid=sender.kid,
        signature=signature,
        payload=payload
    )
    
    res, _ = VerificationEngine.verify_instruction(
        db=db_session,
        instruction=instruction,
        ip_address="127.0.0.1",
        trace_id="trace_id_1",
        span_id="span_id_1"
    )
    
    assert res.is_valid is True
    assert res.threat_level == "Low"

def test_pipeline_cross_tenant_violation(db_session):
    sender = db_session.query(Agent).filter(Agent.id == "planner_agent").first()  # org_a
    receiver = db_session.query(Agent).filter(Agent.id == "org_b_developer").first()  # org_b
    
    payload = {"action": "WriteCode", "resource": "SourceRepo", "params": {}}
    priv_key = decrypt_private_key(sender.encrypted_private_key_pem)
    signature = sign_payload(priv_key, payload)
    
    instruction = SignedInstruction(
        protocol_version="1.0",
        instruction_id="inst_test_tenant_fail",
        sender="planner_agent",
        receiver="org_b_developer",
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        nonce="nonce_tenant_1",
        kid=sender.kid,
        signature=signature,
        payload=payload
    )
    
    res, _ = VerificationEngine.verify_instruction(
        db=db_session,
        instruction=instruction,
        ip_address="127.0.0.1",
        trace_id="trace_id_tenant",
        span_id="span_id_tenant"
    )
    
    assert res.is_valid is False
    assert "Cross-Tenant" in res.failure_reason

def test_pipeline_replay_attack_prevention(db_session):
    sender = db_session.query(Agent).filter(Agent.id == "planner_agent").first()
    payload = {"action": "WriteCode", "resource": "SourceRepo", "params": {}}
    priv_key = decrypt_private_key(sender.encrypted_private_key_pem)
    signature = sign_payload(priv_key, payload)
    
    instruction = SignedInstruction(
        protocol_version="1.0",
        instruction_id="inst_replay_1",
        sender="planner_agent",
        receiver="developer_agent",
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        nonce="duplicate_nonce_value",
        kid=sender.kid,
        signature=signature,
        payload=payload
    )
    
    # Run once
    res1, _ = VerificationEngine.verify_instruction(
        db=db_session, instruction=instruction, ip_address="127.0.0.1",
        trace_id="tr1", span_id="sp1"
    )
    assert res1.is_valid is True
    
    # Run again with same nonce
    res2, _ = VerificationEngine.verify_instruction(
        db=db_session, instruction=instruction, ip_address="127.0.0.1",
        trace_id="tr2", span_id="sp2"
    )
    assert res2.is_valid is False
    assert "Nonce reuse detected" in res2.failure_reason

def test_pipeline_flooding_anomaly_detection(db_session):
    sender = db_session.query(Agent).filter(Agent.id == "planner_agent").first()
    payload = {"action": "WriteCode", "resource": "SourceRepo", "params": {}}
    priv_key = decrypt_private_key(sender.encrypted_private_key_pem)
    signature = sign_payload(priv_key, payload)
    
    # Insert 15 mock audit logs to simulate request flood in the last 10 seconds
    for f in range(16):
        log = AuditLog(
            id=f"flood_log_{secrets.token_hex(4)}",
            tenant_id="org_a",
            timestamp=datetime.datetime.utcnow(),
            sender_id="planner_agent",
            receiver_id="developer_agent",
            action="WriteCode",
            resource="SourceRepo",
            verification_result="Success",
            threat_level="Low"
        )
        db_session.add(log)
    db_session.commit()
    
    # Attempt verification
    instruction = SignedInstruction(
        protocol_version="1.0",
        instruction_id="inst_flood_test",
        sender="planner_agent",
        receiver="developer_agent",
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        nonce="nonce_flood_test",
        kid=sender.kid,
        signature=signature,
        payload=payload
    )
    
    res, _ = VerificationEngine.verify_instruction(
        db=db_session, instruction=instruction, ip_address="127.0.0.1",
        trace_id="tr_flood", span_id="sp_flood"
    )
    assert res.is_valid is False
    assert "flooding vector" in res.failure_reason

def test_heightened_scrutiny_enforcement(db_session):
    sender = db_session.query(Agent).filter(Agent.id == "planner_agent").first()
    
    # Store old trust score
    old_trust = sender.trust_score
    try:
        # Set trust score below 80.0 to trigger heightened scrutiny
        sender.trust_score = 75.0
        db_session.commit()
        
        payload = {
            "action": "WriteCode",
            "resource": "SourceRepo",
            "params": {"file": "app.py"}
        }
        priv_key = decrypt_private_key(sender.encrypted_private_key_pem)
        signature = sign_payload(priv_key, payload)
        
        # Instruction without delegation token
        instruction = SignedInstruction(
            protocol_version="1.0",
            instruction_id="inst_test_scrutiny_fail",
            sender="planner_agent",
            receiver="developer_agent",
            timestamp=datetime.datetime.utcnow().isoformat() + "Z",
            nonce="nonce_test_scrutiny_fail",
            kid=sender.kid,
            signature=signature,
            payload=payload
        )
        
        res, _ = VerificationEngine.verify_instruction(
            db=db_session,
            instruction=instruction,
            ip_address="127.0.0.1",
            trace_id="trace_scrutiny",
            span_id="span_scrutiny"
        )
        
        # Should be rejected because it lacks a delegation token under heightened scrutiny
        assert res.is_valid is False
        assert "Heightened Scrutiny" in res.failure_reason
        assert res.risk_score == 90.0
        
        # Now reset trust score to 100.0 (scrutiny inactive)
        sender.trust_score = 100.0
        db_session.commit()
        
        # Use a new nonce
        instruction.nonce = "nonce_test_scrutiny_success"
        
        res2, _ = VerificationEngine.verify_instruction(
            db=db_session,
            instruction=instruction,
            ip_address="127.0.0.1",
            trace_id="trace_scrutiny_2",
            span_id="span_scrutiny_2"
        )
        # Should now succeed since heightened scrutiny is inactive
        assert res2.is_valid is True
        
    finally:
        # Restore agent state
        sender.trust_score = old_trust
        db_session.commit()

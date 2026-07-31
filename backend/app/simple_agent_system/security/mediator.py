from app.security.crypto import verify_signature

class SecurityMediator:
    def __init__(self, sender_public_key: str):
        self.sender_public_key = sender_public_key
        self.security_logs = []

    def inspect_and_forward(self, instruction: dict, receiver_agent) -> dict:
        """
        Intercepts communication from Agent Alpha to Agent Beta.
        Validates:
        1. Signature (cryptographic verification using Agent Alpha's public key).
        2. Parameter/Action validation (malicious behavior detection).
        
        If clean, forwards to receiver_agent for execution.
        If blocked, logs and returns security violation.
        """
        sender = instruction.get("sender")
        payload = instruction.get("payload", {})
        signature = instruction.get("signature")
        kid = instruction.get("kid")
        
        action = payload.get("action")
        resource = payload.get("resource")
        params = payload.get("params", {})
        
        # 1. Verify key ID (kid) and Cryptographic signature
        if kid != "key_agent_alpha_v1":
            log_entry = {
                "verdict": "blocked",
                "reason": "invalid key identification (kid mismatch)",
                "details": f"key id '{kid}' is not recognized or has been revoked.",
                "threat_level": "critical"
            }
            self.security_logs.append(log_entry)
            return {
                "is_valid": False,
                "mediator_verdict": "blocked",
                "failure_reason": log_entry["reason"],
                "threat_level": log_entry["threat_level"],
                "explanation": log_entry["details"],
                "execution_result": None
            }
            
        is_sig_valid = verify_signature(self.sender_public_key, signature, payload)
        if not is_sig_valid:
            log_entry = {
                "verdict": "blocked",
                "reason": "cryptographic signature validation failed",
                "details": "the instruction signature does not match agent alpha's public key. payload may have been tampered.",
                "threat_level": "critical"
            }
            self.security_logs.append(log_entry)
            return {
                "is_valid": False,
                "mediator_verdict": "blocked",
                "failure_reason": log_entry["reason"],
                "threat_level": log_entry["threat_level"],
                "explanation": log_entry["details"],
                "execution_result": None
            }
            
        # 2. Behavioral Check (check for malicious commands or unauthorized actions)
        params_str = str(params.values()).lower()
        if "rm -rf" in params_str or "compromise" in params_str or "backdoor" in params_str:
            log_entry = {
                "verdict": "blocked",
                "reason": "malicious behavior signature detected",
                "details": f"blocked action '{action}' due to potential exploit patterns: malicious input detected in parameters.",
                "threat_level": "high"
            }
            self.security_logs.append(log_entry)
            return {
                "is_valid": False,
                "mediator_verdict": "blocked",
                "failure_reason": log_entry["reason"],
                "threat_level": log_entry["threat_level"],
                "explanation": log_entry["details"],
                "execution_result": None
            }
            
        # If all checks pass, log success and forward to Agent Beta
        log_entry = {
            "verdict": "allowed",
            "reason": "all security policies satisfied",
            "details": f"verified signature for key {kid}. behavioral analysis clean. forwarded to agent beta.",
            "threat_level": "low"
        }
        self.security_logs.append(log_entry)
        
        # Forward execution to agent beta
        execution_result = receiver_agent.execute_instruction(instruction)
        
        return {
            "is_valid": True,
            "mediator_verdict": "allowed",
            "failure_reason": None,
            "threat_level": "low",
            "explanation": log_entry["details"],
            "execution_result": execution_result
        }

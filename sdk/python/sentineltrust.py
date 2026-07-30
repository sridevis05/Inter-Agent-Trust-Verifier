import requests
import datetime
import uuid
import json
import base64
import hashlib
from typing import Dict, Any, Optional, List
from functools import wraps

class SentinelTrustClient:
    """
    Framework-agnostic Python SDK for SentinelTrust AI Security Gateway.
    Allows easy integration with LangChain, CrewAI, AutoGen, or custom agents.
    """
    def __init__(self, gateway_url: str = "http://localhost:8000/api/v1", api_key: Optional[str] = None):
        self.gateway_url = gateway_url
        self.api_key = api_key

    def verify_instruction(
        self,
        sender: str,
        receiver: str,
        action: str,
        resource: str,
        params: Dict[str, Any],
        kid: str,
        private_key_pem: str,
        delegation_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Signs the payload and sends it to SentinelTrust AI Gateway for verification.
        """
        payload = {
            "action": action,
            "resource": resource,
            "params": params
        }
        
        # 1. Sign payload
        signature = self._sign_payload(private_key_pem, payload)
        
        # 2. Package instruction details
        instruction = {
            "protocol_version": "1.0",
            "instruction_id": f"inst_{uuid.uuid4().hex[:12]}",
            "sender": sender,
            "receiver": receiver,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "nonce": f"nonce_{uuid.uuid4().hex[:16]}",
            "delegation_token": delegation_token,
            "signature": signature,
            "kid": kid,
            "payload": payload
        }
        
        # 3. Call Gateway
        url = f"{self.gateway_url}/verify"
        headers = {
            "Content-Type": "application/json",
            "X-Trace-ID": uuid.uuid4().hex,
            "X-Span-ID": uuid.uuid4().hex[:16]
        }
        
        try:
            response = requests.post(url, json=instruction, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "is_valid": False,
                "failure_reason": f"Gateway request failed: {str(e)}",
                "risk_score": 100.0,
                "threat_level": "Critical",
                "step_results": {}
            }

    def verify(self, sender: str, receiver: str, action: str, resource: str, kid: str, private_key_pem: str, delegation_token: Optional[str] = None):
        """
        SDK Middleware decorator to enforce Zero Trust authorization checks before executing agent tools.
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Execute verify before executing the function logic
                verify_res = self.verify_instruction(
                    sender=sender,
                    receiver=receiver,
                    action=action,
                    resource=resource,
                    params={"args": list(args), "kwargs": kwargs},
                    kid=kid,
                    private_key_pem=private_key_pem,
                    delegation_token=delegation_token
                )
                
                if not verify_res.get("is_valid", False):
                    raise PermissionError(
                        f"SentinelTrust Blocked Execution! Reason: {verify_res.get('failure_reason')}. "
                        f"Explanation: {verify_res.get('explanation', {}).get('human_explanation')}"
                    )
                
                return func(*args, **kwargs)
            return wrapper
        return decorator

    def _sign_payload(self, private_key_pem: str, payload: dict) -> str:
        """Sign payload using cryptography algorithms."""
        try:
            from cryptography.hazmat.primitives.asymmetric import padding
            from cryptography.hazmat.primitives import serialization, hashes
            
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode('utf-8'),
                password=None
            )
            serialized = json.dumps(payload, sort_keys=True)
            signature = private_key.sign(
                serialized.encode('utf-8'),
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            return base64.b64encode(signature).decode('utf-8')
        except ImportError:
            # Fallback mock signature if cryptography is not installed locally
            serialized = json.dumps(payload, sort_keys=True)
            mock_hash = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
            return f"mock_signature_of_{mock_hash}"

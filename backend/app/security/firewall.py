import re
from typing import Dict, Any

class LLMSecurityFirewall:
    # Pattern matching for prompt injection and jailbreaks
    JAILBREAK_PATTERNS = [
        r"(?i)ignore\s+(?:all\s+)?previous\s+instructions",
        r"(?i)system\s+override",
        r"(?i)you\s+are\s+now\s+in\s+developer\s+mode",
        r"(?i)dan\s+mode",
        r"(?i)act\s+as\s+a\s+terminal",
        r"(?i)bypass\s+restrictions",
        r"(?i)sudo\s+override",
    ]
    
    # Pattern matching for data exfiltration attempts
    EXFILTRATION_PATTERNS = [
        r"(?i)exfiltrate",
        r"(?i)curl\s+http[s]?://",
        r"(?i)wget\s+http[s]?://",
        r"(?i)send\s+keys\s+to",
        r"(?i)ftp\s+upload",
        r"(?i)upload\s+private\s+key",
    ]
    
    # Pattern matching for malicious shell commands and database drops
    TOOL_ABUSE_PATTERNS = [
        r"(?i)rm\s+-rf",
        r"(?i)drop\s+database",
        r"(?i)drop\s+table",
        r"(?i)delete\s+from\s+.*\s+where\s+1\s*=\s*1",
        r"(?i)format\s+c:",
        r"(?i)shutdown\s+/s",
        r"(?i)kill\s+-9",
    ]

    @classmethod
    def inspect_payload(cls, payload: Dict[str, Any]) -> tuple[bool, str, float]:
        """
        Inspect instruction payload for prompt injections, jailbreaks, data exfiltration, or tool abuse.
        Returns:
            is_blocked: bool
            violation_type: str (e.g. PromptInjection, DataExfiltration, ToolAbuse, None)
            risk_score_boost: float (added to the request risk metrics)
        """
        # Convert entire payload to string for inspection
        payload_str = str(payload)
        
        # 1. Jailbreak Check
        for pattern in cls.JAILBREAK_PATTERNS:
            if re.search(pattern, payload_str):
                return True, "Jailbreak / Prompt Injection Attack Detected", 60.0
                
        # 2. Exfiltration Check
        for pattern in cls.EXFILTRATION_PATTERNS:
            if re.search(pattern, payload_str):
                return True, "Data Exfiltration Signature Blocked", 70.0
                
        # 3. Tool Abuse Check
        for pattern in cls.TOOL_ABUSE_PATTERNS:
            if re.search(pattern, payload_str):
                return True, "Unauthorized Command / Tool Abuse Signature Detected", 80.0
                
        # 4. Check for obvious hallucinated tool names in action parameters
        action = payload.get("action", "")
        if action and not re.match(r"^[a-zA-Z0-9_\-\.]+$", action):
            return True, "Suspicious Tool Invocations: Malformed Action Format", 40.0
            
        return False, "", 0.0

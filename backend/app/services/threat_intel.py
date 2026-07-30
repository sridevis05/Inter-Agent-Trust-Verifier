from typing import List, Dict, Any

class ThreatIntelligenceService:
    # Simulating enterprise threat vectors and local signatures
    BLACKLISTED_IPS = {
        "192.168.1.99",
        "45.227.254.12",
        "185.220.101.5",  # Known Tor exit nodes / proxy servers
    }
    
    BLACKLISTED_AGENTS = {
        "rogue_agent_0x",
        "compromised_deployer_agent",
        "malicious_test_agent"
    }
    
    COMPROMISED_KIDS = {
        "key_compromised_0x99",
        "key_theft_tester_v2"
    }
    
    KNOWN_ATTACK_PATTERNS = [
        {"id": "TH-001", "name": "LLM Prompt Injection - Ignored Instructions", "severity": "High"},
        {"id": "TH-002", "name": "Tool Hijacking - sudo bash privilege escalation", "severity": "Critical"},
        {"id": "TH-003", "name": "Replay Attack - Nonce reuse across systems", "severity": "Medium"},
        {"id": "TH-004", "name": "Rogue Agent Registration - Fake RSA signatures", "severity": "High"},
        {"id": "TH-005", "name": "MITM Payload Tampering", "severity": "High"}
    ]

    @classmethod
    def is_ip_blacklisted(cls, ip: str) -> bool:
        return ip in cls.BLACKLISTED_IPS

    @classmethod
    def is_agent_blacklisted(cls, agent_id: str) -> bool:
        return agent_id in cls.BLACKLISTED_AGENTS

    @classmethod
    def is_kid_compromised(cls, kid: str) -> bool:
        return kid in cls.COMPROMISED_KIDS

    @classmethod
    def get_threat_feed(cls) -> List[Dict[str, Any]]:
        return cls.KNOWN_ATTACK_PATTERNS

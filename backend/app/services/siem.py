import logging
import datetime
from typing import Dict, Any, List

# Create a logger for SIEM audit trail
logger = logging.getLogger("sentineltrust_siem")
logger.setLevel(logging.INFO)

# In-memory buffer to stream logs to dashboard console
siem_buffer: List[str] = []

class SIEMService:
    @classmethod
    def log_verification_event(
        cls, 
        sender: str, 
        receiver: str, 
        action: str, 
        resource: str, 
        result: str, 
        reason: str, 
        threat_level: str, 
        latency_ms: float
    ) -> str:
        """
        Formats security verification outcomes into the standard Common Event Format (CEF) for SIEM ingest.
        Adds formatted logs to the logger and streaming dashboard buffer.
        """
        now = datetime.datetime.utcnow().isoformat() + "Z"
        severity_map = {
            "Low": "2",
            "Medium": "5",
            "High": "8",
            "Critical": "10"
        }
        severity = severity_map.get(threat_level, "0")
        
        signature_id = "VERIFY_ALLOW" if result.upper() == "SUCCESS" else "VERIFY_DENY"
        event_name = f"Instruction Verification {result}"
        
        # Build CEF string
        cef = (
            f"CEF:0|SentinelTrust|SecurityGateway|1.0|{signature_id}|{event_name}|{severity}|"
            f"rt={now} src={sender} dst={receiver} act={action} res={resource} "
            f"msg={reason.replace(' ', '_')} latency={latency_ms:.2f}ms"
        )
        
        logger.info(cef)
        
        # Keep track of last 50 events in dashboard SIEM console buffer
        siem_buffer.append(cef)
        if len(siem_buffer) > 50:
            siem_buffer.pop(0)
            
        return cef

    @classmethod
    def get_recent_siem_logs(cls) -> List[str]:
        return siem_buffer

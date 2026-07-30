import uuid
import secrets
from typing import Dict, Any, List

class OpenTelemetryTracing:
    """
    Simulates distributed OpenTelemetry tracing spans.
    Provides mock span details matching trace parent headers for visualization.
    """
    @staticmethod
    def generate_trace_context() -> Dict[str, str]:
        """Generate trace_id and span_id hex strings."""
        return {
            "trace_id": secrets.token_hex(16),
            "span_id": secrets.token_hex(8)
        }

    @staticmethod
    def compile_trace_spans(trace_id: str, sender: str, receiver: str, latency_ms: float, success: bool) -> List[Dict[str, Any]]:
        """
        Creates a list of spans showing timing breakdown through security nodes.
        Used to display a Jaeger-style distributed trace list in the UI.
        """
        base_time = latency_ms
        # Distribute latency across sub-operations
        gateway_lat = base_time * 0.15
        firewall_lat = base_time * 0.20
        crypto_lat = base_time * 0.25
        policy_lat = base_time * 0.25
        reputation_lat = base_time * 0.15

        spans = [
            {
                "span_id": secrets.token_hex(8),
                "name": f"API NGINX Gateway Ingress",
                "service": "api-gateway",
                "latency_ms": round(gateway_lat, 2),
                "status": "OK" if success else "ERROR"
            },
            {
                "span_id": secrets.token_hex(8),
                "name": f"LLM Security Firewall Inspection",
                "service": "security-gateway",
                "latency_ms": round(firewall_lat, 2),
                "status": "OK" if success else "ERROR"
            },
            {
                "span_id": secrets.token_hex(8),
                "name": f"Signature Verification ({sender} public_key)",
                "service": "security-gateway",
                "latency_ms": round(crypto_lat, 2),
                "status": "OK" if success else "ERROR"
            },
            {
                "span_id": secrets.token_hex(8),
                "name": f"Policy Compilation Check (ABAC/RBAC)",
                "service": "policy-engine",
                "latency_ms": round(policy_lat, 2),
                "status": "OK" if success else "ERROR"
            },
            {
                "span_id": secrets.token_hex(8),
                "name": f"Reputation Score Calibration",
                "service": "reputation-engine",
                "latency_ms": round(reputation_lat, 2),
                "status": "OK"
            },
            {
                "span_id": secrets.token_hex(8),
                "name": f"Message Queue RabbitMQ Publish",
                "service": "rabbitmq-broker",
                "latency_ms": 0.5,
                "status": "OK" if success else "ERROR"
            }
        ]
        
        return spans

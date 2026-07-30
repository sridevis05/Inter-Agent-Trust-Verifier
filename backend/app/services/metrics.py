import time
from typing import Dict, Any

class PrometheusMetrics:
    """
    Exposes metrics for Prometheus scraping on /metrics.
    Implements a custom text generator to avoid dependency issues if prometheus_client is absent.
    """
    _metrics = {
        "trustguard_verifications_total": {
            "type": "counter",
            "desc": "Total number of instruction verifications",
            "values": {}  # keys: (status, reason) -> count
        },
        "trustguard_replays_blocked_total": {
            "type": "counter",
            "desc": "Total number of replay attacks blocked",
            "value": 0
        },
        "trustguard_verification_latency_seconds": {
            "type": "histogram",
            "desc": "Verification latency in seconds",
            "count": 0,
            "sum": 0.0
        },
        "trustguard_agent_trust_score": {
            "type": "gauge",
            "desc": "Current agent trust scores",
            "values": {}  # keys: agent_id -> score
        }
    }

    @classmethod
    def increment_verifications(cls, status: str, reason: str):
        key = (status, reason)
        cls._metrics["trustguard_verifications_total"]["values"][key] = \
            cls._metrics["trustguard_verifications_total"]["values"].get(key, 0) + 1

    @classmethod
    def increment_replays(cls):
        cls._metrics["trustguard_replays_blocked_total"]["value"] += 1

    @classmethod
    def record_latency(cls, duration_seconds: float):
        cls._metrics["trustguard_verification_latency_seconds"]["count"] += 1
        cls._metrics["trustguard_verification_latency_seconds"]["sum"] += duration_seconds

    @classmethod
    def set_agent_trust(cls, agent_id: str, score: float):
        cls._metrics["trustguard_agent_trust_score"]["values"][agent_id] = score

    @classmethod
    def generate_prometheus_output(cls) -> str:
        lines = []
        for name, data in cls._metrics.items():
            lines.append(f"# HELP {name} {data['desc']}")
            lines.append(f"# TYPE {name} {data['type']}")
            
            if data["type"] == "counter":
                if "values" in data:
                    for (status, reason), val in data["values"].items():
                        lines.append(f'{name}{{status="{status}",reason="{reason}"}} {val}')
                else:
                    lines.append(f'{name} {data["value"]}')
                    
            elif data["type"] == "gauge":
                for agent_id, score in data["values"].items():
                    lines.append(f'{name}{{agent_id="{agent_id}"}} {score}')
                    
            elif data["type"] == "histogram":
                # Print count, sum
                lines.append(f'{name}_count {data["count"]}')
                lines.append(f'{name}_sum {data["sum"]:.6f}')
                
        return "\n".join(lines) + "\n"

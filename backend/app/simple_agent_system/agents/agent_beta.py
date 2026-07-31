import time

class AgentBeta:
    def __init__(self, agent_id: str = "agent_beta", name: str = "Agent Beta"):
        self.id = agent_id
        self.name = name
        self.execution_log = []

    def execute_instruction(self, instruction: dict) -> dict:
        """
        Executes the received instruction payload.
        Does not perform security validation itself (zero-trust design delegating validation to mediator).
        """
        payload = instruction.get("payload", {})
        action = payload.get("action")
        resource = payload.get("resource")
        params = payload.get("params", {})
        
        # Simple execution logic
        execution_msg = f"executing action '{action}' on resource '{resource}' with params {params}"
        
        # Simulate execution outcomes
        status = "success"
        details = f"successfully completed: {execution_msg}"
        
        # Malicious outcome simulation if bypass occurred (Security Plugged Out)
        is_compromised = False
        params_str = str(params.values()).lower()
        if "rm -rf" in params_str:
            is_compromised = True
            status = "compromised"
            details = "alert: malicious system command executed! critical database backup deleted! data loss imminent!"
        elif "compromise" in params_str:
            is_compromised = True
            status = "compromised"
            details = "alert: remote access backdoor code executed! rogue listener active!"
            
        result = {
            "receiver": self.id,
            "action": action,
            "resource": resource,
            "status": status,
            "details": details,
            "is_compromised": is_compromised,
            "timestamp": time.time()
        }
        
        self.execution_log.append(result)
        return result

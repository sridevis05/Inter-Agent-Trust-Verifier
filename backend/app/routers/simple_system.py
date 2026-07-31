from fastapi import APIRouter, HTTPException
from app.simple_agent_system.agents.agent_alpha import AgentAlpha
from app.simple_agent_system.agents.agent_beta import AgentBeta
from app.simple_agent_system.security.mediator import SecurityMediator
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter(prefix="/simple-sandbox", tags=["Simple Plugin Sandbox"])

# Persistent global instances for the demo sandbox
agent_alpha = AgentAlpha()
agent_beta = AgentBeta()
mediator = SecurityMediator(sender_public_key=agent_alpha.public_key)

class SimulationRequest(BaseModel):
    action: str
    resource: str
    params: dict
    mediator_plugged_in: bool
    attack_type: str  # "none", "fake_key", "malicious_command"

@router.get("/info")
def get_sandbox_info():
    return {
        "agent_alpha": {
            "id": agent_alpha.id,
            "name": agent_alpha.name,
            "public_key": agent_alpha.public_key,
            "kid": agent_alpha.kid
        },
        "agent_beta": {
            "id": agent_beta.id,
            "name": agent_beta.name,
            "logs": agent_beta.execution_log
        },
        "mediator": {
            "sender_public_key": mediator.sender_public_key,
            "logs": mediator.security_logs
        }
    }

@router.post("/simulate")
def run_sandbox_simulation(req: SimulationRequest):
    global agent_alpha, agent_beta, mediator
    
    fake_key_sign = (req.attack_type == "fake_key")
    params = dict(req.params)
    
    if req.attack_type == "malicious_command":
        params["command"] = "rm -rf /app/backup"
        params["payload"] = "compromise system backdoor"
        
    # 1. Agent Alpha creates the instruction and signs it
    instruction = agent_alpha.create_instruction(
        action=req.action,
        resource=req.resource,
        params=params,
        fake_key_sign=fake_key_sign
    )
    
    # 2. Mediate or bypass
    if req.mediator_plugged_in:
        # Security Mediator is plugged in (acts as mediator)
        verdict = mediator.inspect_and_forward(instruction, agent_beta)
        return {
            "mediator_plugged_in": True,
            "instruction": instruction,
            "verification": {
                "is_valid": verdict["is_valid"],
                "verdict": verdict["mediator_verdict"],
                "reason": verdict["failure_reason"],
                "threat_level": verdict["threat_level"],
                "explanation": verdict["explanation"]
            },
            "execution": verdict["execution_result"]
        }
    else:
        # Security Mediator is plugged out (bypassed communication)
        execution_result = agent_beta.execute_instruction(instruction)
        
        mediator.security_logs.append({
            "verdict": "bypassed",
            "reason": "security mediator plugout active",
            "details": f"direct channel established between {agent_alpha.id} and {agent_beta.id}. bypassed security mediator validation.",
            "threat_level": "medium"
        })
        
        return {
            "mediator_plugged_in": False,
            "instruction": instruction,
            "verification": {
                "is_valid": True,
                "verdict": "bypassed",
                "reason": "mediator bypassed (plugged out)",
                "threat_level": "none",
                "explanation": "the security mediator was plugged out. no authorization or signature checks were conducted."
            },
            "execution": execution_result
        }

@router.post("/reset")
def reset_sandbox():
    global agent_alpha, agent_beta, mediator
    agent_alpha = AgentAlpha()
    agent_beta = AgentBeta()
    mediator = SecurityMediator(sender_public_key=agent_alpha.public_key)
    return {"message": "Sandbox reset successfully."}

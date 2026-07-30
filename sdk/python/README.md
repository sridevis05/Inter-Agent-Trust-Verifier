# SentinelTrust AI Python SDK

Lightweight client wrapper to integrate any Python AI agents (e.g. LangChain, CrewAI, AutoGen, Custom Agents) with **SentinelTrust AI Security Gateway**.

## Installation

```bash
pip install requests cryptography
```

## Basic Usage

```python
from sentineltrust import SentinelTrustClient

# 1. Initialize client
client = SentinelTrustClient(gateway_url="http://localhost:8000/api/v1")

# 2. Verify instruction manually
result = client.verify_instruction(
    sender="planner_agent",
    receiver="developer_agent",
    action="WriteCode",
    resource="SourceRepo",
    params={"file": "auth.py"},
    kid="key_planner_agent_v1",
    private_key_pem="---BEGIN PRIVATE KEY...---",
    delegation_token=None
)

if result["is_valid"]:
    print("Action Authorized!")
else:
    print(f"Blocked: {result['failure_reason']}")
```

## SDK Middleware Decorator (Zero Trust)

Secure any agent tool dynamically:

```python
@client.verify(
    sender="developer_agent",
    receiver="deployer_agent",
    action="Deploy",
    resource="ProductionServer",
    kid="key_developer_agent_v1",
    private_key_pem="---BEGIN PRIVATE KEY...---"
)
def deploy_application(version):
    print(f"Deploying application v{version} to prod...")
```

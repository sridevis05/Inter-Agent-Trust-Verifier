# SentinelTrust AI - API Documentation

The **SentinelTrust AI** Security Gateway exposes REST APIs under `/api/v1` for verifying agent messages, authoring OPA policies, managing scoped developer keys, and consulting the virtual security analyst.

---

## 1. Zero Trust Verification Pipeline
Verify that an inter-agent instruction payload complies with security headers, signatures, nonces, and OPA rules.

- **Endpoint**: `POST /api/v1/verify`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Trace-ID: <uuid_string>` (Optional - generated automatically if omitted)
  - `X-Span-ID: <string_16>` (Optional)
- **Request Body**:
```json
{
  "protocol_version": "1.0",
  "instruction_id": "inst_9f82d1",
  "sender": "planner_agent",
  "receiver": "developer_agent",
  "timestamp": "2026-07-30T14:40:00Z",
  "nonce": "nonce_82f1d9a2",
  "kid": "key_planner_agent_v1",
  "signature": "mock_signature_value_here",
  "payload": {
    "action": "WriteCode",
    "resource": "SourceRepo",
    "params": {
      "file": "auth.py",
      "lines": 120
    }
  }
}
```

- **Response Payload (Success)**:
```json
{
  "is_valid": true,
  "risk_score": 0.0,
  "confidence_score": 100.0,
  "trust_score": 100.0,
  "threat_level": "Low",
  "failure_reason": null,
  "explanation": null,
  "step_results": {
    "Format Check": true,
    "Threat Intel & Device Check": true,
    "LLM Security Firewall Check": true,
    "Signature & Crypto Identity": true,
    "Message Integrity Check": true,
    "Replay Attack Prevention": true,
    "Delegation Token Validation": true,
    "Policy & Permission Check": true,
    "Reputation Score Calibration": true
  },
  "latency_ms": 12.50
}
```

---

## 2. API Key Management
Issue and manage authentication keys for third-party systems calling the gateway.

- **Endpoint**: `POST /api/v1/api-keys/create`
- **Request Body**:
```json
{
  "tenant_id": "org_a",
  "name": "Production Deploy Server"
}
```
- **Response Payload**:
```json
{
  "key_id": "apikey_fa82e1",
  "plain_key": "st_key_92a8f2d91a92e10a28f8221b22ff82d921a928f2",
  "message": "API Key generated successfully. Save this key somewhere safe; it will not be displayed again."
}
```

---

## 3. AI Security Copilot Dialogue
Consult the security analyst on active threats or suggested system remediations.

- **Endpoint**: `POST /api/v1/copilot/query`
- **Request Body**:
```json
{
  "query": "How do I solve the cross-tenant instruction routing violations?",
  "tenant_id": "org_a",
  "context_log_id": "log_a82d1c"
}
```
- **Response Payload**:
```json
{
  "answer": "Cross-tenant violations occur when an agent in Organization A attempts to call an agent registered under Organization B. Inspect the sender agent's passport settings and verify that all interacting nodes are registered with matching tenant IDs.",
  "suggested_action": "Verify sender agent passport details in the Agent Directory tab.",
  "relevant_policy_id": null
}
```

# SentinelTrust AI - Low Level Design (LLD)

This document describes the low-level verification loop, data models, schema structures, and class components implemented in the **SentinelTrust AI** Security Gateway.

---

## 1. Data Schema & Models

### A. Tenant
- `id` (String, PK)
- `name` (String, Unique)
- `created_at` (DateTime)

### B. Agent
- `id` (String, PK)
- `tenant_id` (String, FK -> Tenant)
- `name` (String)
- `kid` (String, Unique) - active Key ID
- `public_key_pem` (Text) - public RSA certificate
- `encrypted_private_key_pem` (Text) - private key encrypted via AES-GCM
- `role` (String)
- `permissions` (JSON list)
- `delegation_scope` (JSON dict)
- `status` (String) - `Active`, `Suspended`, `Revoked`
- `trust_score` (Float) - baseline 100.0

### C. Policy
- `id` (String, PK)
- `tenant_id` (String, FK -> Tenant)
- `subject_role` (String) - e.g., `DeveloperAgent`
- `action` (String) - e.g., `Deploy` or `*`
- `resource` (String) - e.g., `ProductionServer` or `*`
- `effect` (String) - `Allow` or `Deny`
- `conditions` (JSON dict) - e.g., `{"source_vpn": true, "time_of_day": "09:00-18:00"}`
- `version` (Integer) - auto-incrementing tracking version
- `is_active` (Boolean) - active toggle

---

## 2. Verification Sequence Loop
The `VerificationEngine.verify_instruction` class coordinates the validation sequence:

```
  [Payload Ingest]
         │
         ▼
  1. Format Check (Validates JSON structures against Pydantic models)
         │
         ▼
  2. Tenant & Anomaly check (Enforces tenant boundaries & sliding-window rate limits)
         │
         ▼
  3. Threat Intel & Device Check (Filters IP against blacklist databases)
         │
         ▼
  4. LLM Firewall Inspect (Filters input string parameters using safety regexes)
         │
         ▼
  5. Cryptographical Signature Check (Verifies RSA-SHA256 signature with matching kid)
         │
         ▼
  6. Replay Prevention (Verifies nonce uniqueness in database)
         │
         ▼
  7. Time Expiration Check (Validates timestamp age within 60s NTP drift tolerance)
         │
         ▼
  8. Delegation Check (Validates JWT tokens if present)
         │
         ▼
  9. OPA ABAC Policy Check (Evaluates conditions: Time, VPN, max_amount, allowed_env)
         │
         ▼
  [Success Auditing] -> Calibrate Trust Score + Publish to RabbitMQ Queue
```

---

## 3. Cryptographic Signature Validation
Instructing agents must hash their instruction payload and sign the resulting hash using their private RSA key:
$$\text{Signature} = \text{Encrypt}_{\text{PrivateKey}}(\text{SHA-256}(\text{Payload}))$$

On the gateway side, the [verify_signature](file:///c:/Users/mails/OneDrive/Desktop/TRUST%20VERIFIER/backend/app/security/crypto.py) routine decodes the base64 signature, extracts the agent's public key from the Directory using the instruction `kid`, and verifies the signature matches the SHA-256 hash of the received payload. If they do not match, the gateway rejects the instruction with `Cryptographic signature is invalid`.

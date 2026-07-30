# SentinelTrust AI Security Platform Architecture

This document describes the architectural layout, components relationship, and verification sequence of **SentinelTrust AI**.

---

## 1. High-Level System Flow

```
[Agent A] ──(Signs Instruction with Private Key)
   │
   ▼
[NGINX Gateway] ──(Validates SSL & Rates)
   │
   ▼
[FastAPI Gateway]
   ├── 1. Format Check (Pydantic schemas)
   ├── 2. Threat Intel Lookups (IP, Rogue status)
   ├── 3. LLM Security Firewall Checks (Regex pattern library)
   ├── 4. Identity Check (Signature + kid verification)
   ├── 5. Replay Attack Check (Redis Nonce TTL match)
   ├── 6. Delegation Token Validate (JWT verification)
   ├── 7. Policy Engine (OPA-inspired ABAC evaluation)
   └── 8. Reputation Calibrate (Increments / Decrements)
   │
   ▼ (Valid/Success)
[PostgreSQL Event Store] (Audit Logs) + [SIEM logs (CEF)]
   │
   ▼ (Async Publish)
[RabbitMQ Queue] ──(Delivers to)──> [Agent B Worker]
```

---

## 2. Dynamic Verification Pipeline

The pipeline implements **Zero Trust** mechanics. Identity is evaluated continuously.

1. **Format Validation**: Ensure JSON follows protocol structure v1.0.
2. **Directory Lookup**: Fetch public key matching `kid` from SQLite/PostgreSQL.
3. **Integrity Validation**: Re-hash payload and match signature values.
4. **Authorizations**: Verify permissions and attributes (ABAC limits).
5. **Score Adjustments**: Deduct trust score on failures; recover slowly on consecutive successes.

# SentinelTrust AI Threat Model

This document outlines the security architecture, potential threats, and operational mitigations implemented in **SentinelTrust AI**.

---

## 1. Trust Model Boundaries

SentinelTrust AI enforces a **Zero Trust Architecture** where all communication crossing agent boundaries is audited, verified, and restricted.

```
[Agent A] (Untrusted) ──(Signed Instruction)──> [ API Gateway ] (SSL Termination)
                                                       │
                                                       ▼
[Agent B] (Execution) <──(Async RabbitMQ)── [ SentinelTrust Gateway ] (Verify Pipeline)
```

---

## 2. Threat Vector Matrix

| ID | Threat Vector | Risk Level | Target Component | Mitigations Implemented |
| :--- | :--- | :--- | :--- | :--- |
| **STR-01** | **Man-In-The-Middle (Spoofing)** | High | Message Payload | RSA-SHA256 digital signatures verify integrity of instructions in transit. |
| **STR-02** | **Replay Attacks (Tampering)** | Critical | Nonce Tracker | Redis cache tracks nonce history with TTL. Duplicate nonces are instantly dropped. |
| **STR-03** | **Prompt Injection (Information Disclosure)** | Critical | Downstream LLM | **LLM Security Firewall** filters payload strings matching injection/jailbreak heuristics. |
| **STR-04** | **Privilege Escalation** | High | Policy Engine | OPA-inspired RBAC and ABAC rules block unauthorized resources (e.g. databases). |
| **STR-05** | **Compromised Credentials** | Critical | Agent Directories | Automated RSA Key pair rotation (30-day lifecycle) with 24h grace overlap. |
| **STR-06** | **Denial of Service (DoS)** | Medium | API Ingress | Sliding-window rate limiters configured in Redis block flood behaviors. |

---

## 3. Security Controls & Standards

### Cryptography (Identity Verification)
- **Key Pairs**: RSA 2048-bit keys automatically generated during agent registration.
- **Key Storage**: Private keys are encrypted using AES-GCM (via Fernet) before DB storage.
- **Key Identifiers**: Unique `kid` parameters added to every payload to support multiple key versions during overlap.

### Access Control (ABAC + RBAC)
- **Attribute Scoping (ABAC)**: Evaluates requests based on environmental attributes:
  - Source IP check (VPN restriction check).
  - Time window checks (restricted to work hours).
  - Parameter thresholds check (e.g., maximum transfer limits).

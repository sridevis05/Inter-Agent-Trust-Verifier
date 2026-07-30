# SentinelTrust AI - Project Interview Q&A Database

This document lists critical technical questions and answers categorized by technology area to help you prepare for technical interviews and placement drives.

---

## 1. Project & System Design Questions

### Q1: What is SentinelTrust AI and what problem does it solve?
**Answer**: SentinelTrust AI is an enterprise-grade Zero Trust Security Gateway designed to intercept and verify inter-agent instructions in autonomous AI systems. It solves the vulnerability where AI agents blindly trust instructions from other agents without validating their identity, permissions, payload integrity, or checking for prompt injections.

### Q2: How does the system handle multi-tenancy?
**Answer**: Data is logically isolated at the database schema level using a `tenant_id` foreign key mapped to a `Tenant` model. All routers filter queries (for agents, policies, and audit logs) dynamically based on the requesting tenant's context, preventing cross-tenant information leaks.

### Q3: Why is NGINX placed in front of the FastAPI Gateway?
**Answer**: NGINX acts as the reverse proxy edge. It handles SSL termination, manages connection timeouts, filters malicious header sizes, serves static frontend builds under production, and implements preliminary client-IP rate checks to shield the Python backend service.

---

## 2. Cybersecurity & Zero Trust Questions

### Q4: How is Replay Attack Prevention implemented?
**Answer**: Every instruction payload includes a unique, single-use `nonce` and a `timestamp`. The gateway stores nonces in a Redis cache with a 60-second Time-To-Live (TTL). When a request is received:
1. The gateway checks if the nonce exists in Redis. If it exists, the request is rejected immediately as a replay attempt.
2. The gateway calculates the clock drift between the request's timestamp and UTC now. If it exceeds 60 seconds (the NTP drift limit), the request is rejected.
3. If valid, the nonce is cached in Redis for the duration of the 60-second window.

### Q5: How does the AI Firewall identify jailbreaks or prompt injections?
**Answer**: The gateway passes instruction parameters through the `LLMSecurityFirewall` inspect library, executing regex checks against a database of known jailbreak heuristics (e.g. ignoring previous commands, DAN mode activation, unauthorized CLI overrides like `rm -rf`, and data exfiltration patterns).

---

## 3. Cryptography & Signature Questions

### Q6: Describe the cryptographic signature validation flow.
**Answer**: Senders hash the instruction payload using SHA-256 and sign it using their RSA 2048-bit private key. The gateway uses the payload Key ID (`kid`) in the header to retrieve the matching public key from the Directory database, recalculates the payload hash, and verifies the signature using `verify_signature` (RSA PKCS#1 v1.5 with SHA-256).

### Q7: What is the grace-period key rotation policy?
**Answer**: When keys are rotated, the active RSA pair updates to `Active` with a new `kid`. The previous key pair is marked as `Grace` with a 24-hour expiration. Senders sign with the new key immediately, but in-flight messages signed with the grace key are still accepted, ensuring zero downtime during key rollover.

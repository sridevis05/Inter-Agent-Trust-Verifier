# SentinelTrust AI - Testing & Verification Documentation

This document describes the testing architecture, validation scopes, and automated execution scripts for the **SentinelTrust AI** Security Gateway.

---

## 1. Test Directory Layout
All test definitions reside in the `backend/tests` folder:
- `tests/test_crypto.py`: Validates RSA key pair generation, SHA-256 integrity, signature matching, and Grace key rollovers.
- `tests/test_verification.py`: Validates the 8-stage verification pipeline under normal execution, replays, expired tokens, OPA ABAC checks, and rate-limiting anomalies.
- `tests/test_firewall.py`: Asserts AI Firewall regex pattern matching against prompt injections, tool abuse commands, and data leaks.

---

## 2. Dynamic Test Scopes

### A. Cryptography Verification
- **RSA Signature Assertions**: Verifies that tampered payloads (even a single character modification) fail signature validation.
- **Grace Period Rollback**: Verifies that keys in "Grace" status verify successfully, while keys in "Deactivated" status fail.

### B. Replay Attack Preventer
- **Nonce Registry**: Tests that submitting the exact same nonce twice within 60 seconds returns an immediate `Nonce reuse detected` block.
- **Clock Drift Bounds**: Validates that request timestamps older than 60 seconds are rejected with `Clock drift tolerance exceeded`.

### C. OPA ABAC Permission Checks
- **VPN Restrictions**: Asserts that deployment commands coming from outside the Company VPN range (e.g. non-VPN IPs) are blocked.
- **Time Window Rules**: Validates that off-hours requests fail OPA evaluation.

---

## 3. How to Run Tests
To execute all backend tests locally using `pytest`:
```bash
cd backend
python -m pytest -v
```
To run tests inside a temporary docker container environment:
```bash
docker compose run --entrypoint "pytest -v" backend
```

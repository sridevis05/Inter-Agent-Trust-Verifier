# SentinelTrust AI - High Level Design (HLD)

This document describes the high-level system components, architectural boundaries, data routing pipelines, and tenant-isolation constraints of the **SentinelTrust AI** Zero-Trust Security gateway.

---

## 1. System Context & Boundaries
SentinelTrust AI acts as an intercepting gateway between autonomous agent frameworks (e.g. LangChain, AutoGen, CrewAI, MCP Client) and downstream systems or execution agents. Senders must route all payload instructions through the gateway prior to command execution.

```
+--------------------+
|  Agent Sender (A)  | (Sends Cryptographically Signed Instruction)
+---------+----------+
          |
          ▼
+--------------------+
|  NGINX Gateway     | (Terminates SSL/TLS, manages rate limits, proxy routing)
+---------+----------+
          |
          ▼
+---------+----------+
|  FastAPI Gateway   | (Central Pipeline Engine: Runs the 8 verification stages)
+----+----+----+-----+
     |    |    |
     |    |    +---> [ Redis Nonce Cache ] (Replay attack detection)
     |    |
     |    +---------> [ OPA Policy Database ] (RBAC + ABAC Policy Engine)
     |
     +--------------> [ Gemini API Engine ] (Explainability Copilot)
          |
          ▼ (If Verification = Success)
+---------+----------+
|  PostgreSQL DB     | (Audit Log Ledgers / Incident Registry)
+---------+----------+
          |
          ▼ (Asynchronous Publish)
+---------+----------+
|  RabbitMQ Queue    | (Routes approved messages to destination exchange)
+---------+----------+
          |
          ▼
+---------+----------+
|  Agent Recipient B | (Listens on queue, executes task tool securely)
+--------------------+
```

---

## 2. Component Directory
1. **NGINX Edge Router**: Reverse proxies incoming calls, terminated SSL, and handles rate limiting.
2. **FastAPI Web API App**: Evaluates payload formats, runs cryptographical verification, queries the OPA database, triggers anomaly metrics, and publishes to the message broker.
3. **Redis Cluster (Nonce Cache)**: In-memory cache holding UUID nonces with a 60-second TTL to intercept replay command attempts.
4. **PostgreSQL Event Database**: Stores registered agent identities (roles, public certificates, trust metrics), ABAC policies, and audit logs.
5. **RabbitMQ Message Broker**: Manages asynchronous, safe message delivery to receiver agents via a Dead Letter Queue (DLQ) retry design.
6. **Gemini API Engine**: Dynamically queries LLM endpoints during failure states to formulate natural language descriptions and suggested policy remediations for security analysts.

---

## 3. Multi-Tenant Architecture
Organizations are fully segmented under separate `tenant_id` scopes:
- **Database Partitioning**: Queries for agent profiles, logs, and policies are scoped to the active tenant.
- **Routing Isolation**: The gateway denies cross-tenant routing attempts immediately (`Cross-Tenant Instruction Routing Violation` block).

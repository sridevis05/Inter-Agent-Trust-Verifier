# SentinelTrust AI - Zero Trust Inter-Agent Security Gateway

SentinelTrust AI is a framework-agnostic Zero Trust security gateway that verifies every inter-agent instruction using cryptographic identity, delegated authorization, policy evaluation, and continuous risk assessment before execution.

It acts as an enterprise-grade security gateway that intercepts communications between AI agents (using frameworks like LangChain, CrewAI, AutoGen, or Model Context Protocol (MCP) servers), enforcing continuous authentication, attribute-based access control (ABAC), supply-chain tool validation, LLM security firewalling, and multi-dimensional risk analysis.

---

## 🛡️ Enterprise Architecture

```
[Agent A] (signs payload) ──(Signed Instruction)──> [ NGINX Load Balancer ]
                                                              │
                                                              ▼
[Agent B] (execution) <──(Async RabbitMQ)── [ SentinelTrust Gateway Cluster ]
                                                              │
                                             ┌────────────────┴───────────────┐
                                             ▼                                ▼
                                     [ OPA Policy Engine ]           [ Redis Nonce Cache ]
                                     (ABAC + RBAC Rules)             (Replay Prevention)
```

---

## 🛠️ Technology Stack

- **Backend Gateway**: Python, FastAPI, SQLAlchemy, WebSockets, PyJWT, Cryptography, Uvicorn.
- **Frontend Dashboard**: React, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **Database & Cache**: PostgreSQL (audit logs & event ledger), Redis (nonce cache, session cache, sliding-window rate limiting).
- **Asynchronous Delivery**: RabbitMQ Message Broker.
- **Observability**: Prometheus `/metrics` exporter, SIEM log streams (Common Event Format - CEF).
- **Deployment**: Docker Compose, Nginx, Kubernetes (Helm), Terraform.

---

## 📂 Scalable Enterprise Directory Layout

- `backend/`: FastAPI source files, models, and verification routers.
- `frontend/`: React components, charts, and tracing dashboards.
- `sdk/`: Lightweight client wrappers:
  - `sdk/python/`: Python SDK including `@sentineltrust.verify` decorator.
  - `sdk/typescript/`: Node.js/TypeScript Axios client wrappers.
- `deploy/`: Terraform scripts, Kubernetes Helm charts.
- `docs/`: Architecture documents, Threat logs, and Interview guides.
- `docker-compose.yml`: Multi-container orchestrations file.

---

## 🚀 Fast Start (Local Execution)

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Run Multi-Container Services
1. Clone or extract this repository into your workspace.
2. In the root directory, execute:
   ```bash
   docker-compose up --build
   ```
3. Once running, access the interfaces:
   - **Frontend Control Center**: [http://localhost:3000](http://localhost:3000)
   - **API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Prometheus Metrics**: [http://localhost:8000/metrics](http://localhost:8000/metrics)
   - **RabbitMQ Dashboard**: [http://localhost:15672](http://localhost:15672) (User/Pass: `guest/guest`)

---

## 🎯 Verification Demo Scenarios

The simulator includes specific scenarios to test the gateway controls:
1. **Authorized Signed Instruction**: Normal execution flow between agents. (Allowed)
2. **Unsigned Instruction**: Instruction payload missing digital signature. (Blocked)
3. **Signed but Unauthorized**: Valid signature but violates ABAC policy (e.g. developer deploying directly). (Blocked)
4. **Tampered Payload**: Payload altered in transit, resulting in signature mismatch. (Blocked)
5. **Replay Attack**: Duplicate nonce re-used to replay command. (Blocked)
6. **Expired Token**: Sending instruction using an expired delegation JWT. (Blocked)
7. **Revoked Agent**: Request originating from a suspended/revoked credentials account. (Blocked)
8. **Compromised Agent**: Automatic suspension when agent trust score drops below 30.
9. **Prompt Injection**: LLM security firewall blocks prompt hijack attempts.
10. **Tor Node Ingress**: Requests originating from blacklisted threat intelligence IPs blocked.

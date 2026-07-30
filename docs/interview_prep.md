# SentinelTrust AI - Placement Drive Interview Preparation Q&A

Use these questions and answers to prep for interviews. They highlight key engineering and architectural decisions.

---

### Q1: Why did you build SentinelTrust AI as a standalone gateway rather than embedding security inside the agent frameworks?
**Answer:** 
> "Embedding security rules inside individual agents creates tight coupling and configuration fragmentation. 
> Frameworks like LangChain, CrewAI, AutoGen, or custom Python scripts all have different internal structures. 
> SentinelTrust AI acts as an **agent-agnostic security gateway (middleware)**. 
> It provides a lightweight SDK. Any agent, regardless of its framework or language, can sign its instruction and send it to our NGINX/FastAPI cluster. 
> This consolidates security monitoring, logging, and policy evaluations in one place."

---

### Q2: How does your system prevent Replay Attacks?
**Answer:**
> "Every signed instruction contains a unique `nonce` (number used once) and a UTC `timestamp`. 
> When the gateway receives a request, it checks the database and Redis cache for the existence of that `nonce`. 
> If the nonce has been used before, the gateway rejects the message. 
> To prevent nonces from consuming infinite memory, we enforce a clock drift tolerance of ±60 seconds. 
> Nonces older than 60 seconds are dropped automatically by checking the timestamp drift, and Redis handles nonce records with a TTL corresponding to this window."

---

### Q3: What is the difference between RBAC and ABAC in your policy engine?
**Answer:**
> "RBAC (Role-Based Access Control) assigns permissions to agent roles (e.g. `DeveloperAgent` can execute `WriteCode`). 
> ABAC (Attribute-Based Access Control) adds context constraints. 
> Our OPA-inspired engine checks conditions like:
> 1. **source_vpn**: Actions restricted to VPN IP ranges.
> 2. **time_of_day**: Actions permitted only during business hours.
> 3. **max_amount**: Restricts financial operations based on value parameters inside the payload.
> Even if an agent's role allows an action, ABAC can block it if context parameters fail validation."

---

### Q4: How is Key Rotation handled without breaking active agent processes?
**Answer:**
> "We implement a **Grace Period key rotation system**. 
> When keys rotate, we generate a new RSA pair and a new `kid` (Key ID), marking it as `Active`. 
> The previous key's status is updated to `Grace` in the history, keeping it valid for a 24-hour overlap window. 
> Senders sign with the new `kid`. However, if the gateway receives an in-flight instruction signed with the previous `kid`, it checks the `key_history` directory, identifies that it is in its grace period, and validates the request. 
> After 24 hours, the grace status expires, and the key is permanently `Deactivated`."

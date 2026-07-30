# SentinelTrust AI - Guided Visual Demo Script (7 Minutes)

This script helps you present a comprehensive walkthrough of **SentinelTrust AI** to recruiters, interviewers, or judges.

---

### Introduction (0:00 - 1:00)
- **Visuals**: Show the **Overview Dashboard** with the real-time line charts, metrics cards, and compliance indicators.
- **Talking Points**:
  > *"Hello. Today I am demonstrating SentinelTrust AI, a Zero-Trust security platform for multi-agent systems. 
  > As businesses deploy autonomous AI agents to interact with databases and tools, agent-to-agent communication introduces vulnerabilities. 
  > An attacker could hijack a planner agent via prompt injection, perform man-in-the-middle attacks, or replay expired commands. 
  > SentinelTrust AI acts as an enterprise-grade security gateway, verifying every inter-agent instruction before it can be executed."*

### Telemetry & Organization Scoping (1:00 - 2:00)
- **Visuals**: Toggle between **Organization A** and **Organization B** in the header dropdown.
- **Talking Points**:
  > *"SentinelTrust AI is built as a multi-tenant SaaS platform. 
  > Notice that when I switch from Organization A to Organization B, the active agents list, policies, and audit logs update immediately. 
  > This ensures tenant data isolation at the gateway edge."*

### Interactive Pipeline & Secure Flow (2:00 - 3:30)
- **Visuals**: Navigate to the **Agent Pipeline** page. Click **Trigger Secure Simulation** or run through the **One-Click Demo** step 1.
- **Talking Points**:
  > *"Let's trigger a secure communication sequence. Senders sign their instruction payloads using RSA keys. 
  > In our live pipeline tracker, we see the instruction pass through our 8 security checks: signature validation, nonce check, OPA ABAC checks, and the LLM Firewall. 
  > Everything is verified and successfully published to a RabbitMQ queue for delivery."*

### Attack Simulator & Incident Center (3:30 - 5:00)
- **Visuals**: Navigate to **Threat Simulator** page. Select and trigger the **Man-In-The-Middle (MITM)** attack.
- **Talking Points**:
  > *"What happens under attack? We'll simulate a MITM agent tampering with code parameters in transit. 
  > The gateway intercepts the payload, detects the signature mismatch, blocks the request, and drops the sender's reputation trust score. 
  > When an agent's trust score falls below 30, the system automatically quarantines it, setting its status to Suspended."*
- **Visuals**: Navigate to **Incident Center**. Show the newly created incident, update its status to `Assigned`, and enter your name as the assignee.
- **Talking Points**:
  > *"Every block is logged as an incident in the Security Incident Center, resembling platforms like Microsoft Sentinel. 
  > Analysts can track threat severities, assign responders, and monitor the incident lifecycle."*

### AI Security Copilot (5:00 - 6:00)
- **Visuals**: Click **Consult AI Security Copilot** inside the incident details. The page automatically switches to the Copilot tab with the incident attached as context.
- **Talking Points**:
  > *"Investigating errors manually is slow. When I consult the AI Security Copilot, it automatically imports the incident context. 
  > Backed by Gemini, the Copilot analyzes the failure and explains the root cause in natural language, suggesting the exact remediation step, such as modifying OPA policy conditions."*

### Policy Playground & Verification (6:00 - 7:00)
- **Visuals**: Navigate to the **Policy Playground**. Select a role and check an action like deploying a server off-hours, seeing it Denied. Author a new Policy allowing it, compile it, and test it again to see the pipeline turn Green.
- **Talking Points**:
  > *"Lastly, the OPA Policy Playground allows developers to visually build and test RBAC and ABAC rules. 
  > I can select roles and resource context parameters, see the OPA evaluation, and instantly compile and push the new policy rule to the database. 
  > SentinelTrust AI consolidates security, supply chain verification, and auditability, making multi-agent systems production-ready. Thank you."*

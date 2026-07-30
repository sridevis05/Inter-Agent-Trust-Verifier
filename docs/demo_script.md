# SentinelTrust AI - 5-Minute Demo Script

This script helps you present **SentinelTrust AI** to recruiters, interviewers, or hackathon judges in a highly structured, professional way.

---

## Part 1: High-Level Introduction (1 Minute)

> "Hello. Today, I am demonstrating **SentinelTrust AI**, a framework-agnostic Zero Trust security gateway for autonomous AI agents. 
> As multi-agent systems are deployed in enterprises, agents communicate instructions to each other. 
> However, an attacker could hijack an agent via prompt injection, perform man-in-the-middle attacks, or replay stale messages. 
> SentinelTrust AI acts as an interception gateway. It verifies every instruction using cryptographic signatures, delegation tokens, OPA-inspired ABAC policies, and a real-time reputation score."

---

## Part 2: Normal Flow Showcase (1.5 Minutes)

1. Navigate to **Agent Pipeline** tab.
2. Click **Trigger Secure Simulation**.
3. Point out the animated network graph:
   > "Here we see our development pipeline agents (Manager, Planner, Research, Developer, Tester, Reviewer, Deployer) talking to each other. 
   > For each link, the sender signs the instruction payload using its RSA key. The gateway intercepts it, evaluates the signatures and nonces, check OPA policies, and forwards it to RabbitMQ for delivery. All messages pass with a green pulse."
4. Show the **Security Audits** page. Point out that all successful transactions are logged with trace IDs.

---

## Part 3: Threat Simulation Showcase (2 Minutes)

1. Navigate to **Threat Simulator** tab.
2. Trigger the **Man-In-The-Middle (MITM) / Tampered Payload** attack.
   > "Here, we simulated a MITM attacker changing code parameters in transit. The gateway calculated the payload SHA-256 hash, compared it with the signature, caught the discrepancy, and blocked it immediately."
3. Point out the **AI Explainability card**:
   > "Notice the AI Explainability response. It outputs a Human explanation, Machine stack traceback, and Suggested Fix so engineers can debug failures instantly."
4. Trigger the **Prompt Injection** attack.
   > "We injected prompt bypass keys. The **LLM Security Firewall** parsed the string patterns, flagged the jailbreak attempt, and aborted the step."
5. Trigger the **Unauthorized Command** attack (Developer trying to Deploy directly).
   > "Our OPA-inspired ABAC engine detected that Developer Agent does not have the Deploy permission, denying access instantly."
6. Show how the agent's **Trust Score** dropped in the Agent Directory tab due to these blocks.

---

## Part 4: Conclusion (30 Seconds)

> "By providing this unified cryptographic security gateway, SentinelTrust AI makes multi-agent systems safe, compliant (SOC2/NIST readiness mapped), and ready for production enterprise deployment. Thank you."

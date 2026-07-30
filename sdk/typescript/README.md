# SentinelTrust AI TypeScript/JavaScript SDK

Lightweight package to integrate Node.js, Next.js, or browser-based AI agents (e.g. LangChain JS, Custom TS Agents, REST agents) with the **SentinelTrust AI Security Gateway**.

## Installation

```bash
npm install axios
```

## Basic Usage

```typescript
import { SentinelTrustClient } from './sentineltrust';

const client = new SentinelTrustClient('http://localhost:8000/api/v1');

async function checkAgentAction() {
  const result = await client.verifyInstruction({
    sender: 'planner_agent',
    receiver: 'developer_agent',
    action: 'WriteCode',
    resource: 'SourceRepo',
    payloadParams: { file: 'index.ts' },
    kid: 'key_planner_agent_v1',
    privateKeyPem: '---BEGIN RSA PRIVATE KEY...---',
    delegationToken: undefined
  });

  if (result.is_valid) {
    console.log('Action Authorized!');
  } else {
    console.log(`Action Blocked: ${result.failure_reason}`);
  }
}
```

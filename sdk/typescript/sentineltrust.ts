import axios from 'axios';
import * as crypto from 'crypto';

export interface InstructionPayload {
  action: string;
  resource: string;
  params?: Record<string, any>;
}

export interface SignedInstruction {
  protocol_version: string;
  instruction_id: string;
  sender: string;
  receiver: string;
  timestamp: string;
  nonce: string;
  delegation_token?: string;
  signature: string;
  kid: string;
  payload: InstructionPayload;
}

export interface VerifyResponse {
  is_valid: boolean;
  risk_score: number;
  confidence_score: number;
  trust_score: number;
  threat_level: string;
  failure_reason?: string;
  explanation?: {
    human_explanation: string;
    machine_exception: string;
    suggested_fix: string;
  };
  step_results: Record<string, boolean>;
  latency_ms: number;
}

export class SentinelTrustClient {
  private gatewayUrl: string;

  constructor(gatewayUrl: string = 'http://localhost:8000/api/v1') {
    this.gatewayUrl = gatewayUrl;
  }

  /**
   * Signs the payload and sends it to SentinelTrust AI Gateway for verification.
   */
  public async verifyInstruction(params: {
    sender: string;
    receiver: string;
    action: string;
    resource: string;
    payloadParams?: Record<string, any>;
    kid: string;
    privateKeyPem: string;
    delegationToken?: string;
  }): Promise<VerifyResponse> {
    const payload: InstructionPayload = {
      action: params.action,
      resource: params.resource,
      params: params.payloadParams,
    };

    // 1. Sign payload
    const signature = this.signPayload(payload, params.privateKeyPem);

    // 2. Package instruction details
    const instruction: SignedInstruction = {
      protocol_version: '1.0',
      instruction_id: `inst_${crypto.randomBytes(6).toString('hex')}`,
      sender: params.sender,
      receiver: params.receiver,
      timestamp: new Date().toISOString(),
      nonce: `nonce_${crypto.randomBytes(8).toString('hex')}`,
      delegation_token: params.delegationToken,
      signature: signature,
      kid: params.kid,
      payload: payload,
    };

    // 3. Make HTTP request to Gateway
    const url = `${this.gatewayUrl}/verify`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Trace-ID': crypto.randomBytes(16).toString('hex'),
      'X-Span-ID': crypto.randomBytes(8).toString('hex'),
    };

    try {
      const response = await axios.post<VerifyResponse>(url, instruction, { headers });
      return response.data;
    } catch (error: any) {
      return {
        is_valid: false,
        risk_score: 100,
        confidence_score: 0,
        trust_score: 0,
        threat_level: 'Critical',
        failure_reason: `Gateway request failed: ${error.message}`,
        step_results: {},
        latency_ms: 0,
      };
    }
  }

  private signPayload(payload: InstructionPayload, privateKeyPem: string): string {
    const data = JSON.stringify(payload, Object.keys(payload).sort());
    try {
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      sign.end();
      return sign.sign(privateKeyPem, 'base64');
    } catch (err) {
      // Fallback mock signature
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      return `mock_node_signature_of_${hash}`;
    }
  }
}

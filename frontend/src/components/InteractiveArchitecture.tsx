import React, { useState } from 'react';
import { 
  Users, 
  Server, 
  ShieldAlert, 
  FileText, 
  Layers, 
  ArrowRight, 
  Cpu, 
  Database, 
  Info
} from 'lucide-react';

interface ComponentDetails {
  title: string;
  technology: string;
  purpose: string;
  security: string;
  api: string;
}

export const InteractiveArchitecture: React.FC = () => {
  const [selectedComp, setSelectedComp] = useState<string>('gateway');

  const componentsData: Record<string, ComponentDetails> = {
    agents: {
      title: "AI Agent Endpoints",
      technology: "LangChain, AutoGen, CrewAI, Python SDK",
      purpose: "Autonomous systems executing enterprise task loops (Planner, Developer, Deployer). Senders must cryptographically sign instructions using local RSA key pairs before egress routing.",
      security: "PKCS#1 v1.5 RSA 2048-bit digital signatures. Private keys are encrypted using AES-GCM (Fernet) before persistent database storage.",
      api: "SentinelTrust SDK: `@sentineltrust.verify` wrapper decorator enforces verification middleware prior to executing agent actions."
    },
    nginx: {
      title: "NGINX API Edge Gateway",
      technology: "Nginx Docker Image, SSL/TLS reverse proxy",
      purpose: "Unified reverse proxy gateway routing web app traffic and API connections. Terminates SSL, manages client IP forwarding, and handles rate limiting.",
      security: "SSL termination, CORS header configuration, Brotli/Gzip gzip compressions, client-IP rate checks, secure HTTP headers.",
      api: "Configuration: `deploy/nginx.conf` routing API queries to upstream `backend_servers` on Port 8000."
    },
    gateway: {
      title: "FastAPI Verification Gateway",
      technology: "FastAPI, Uvicorn, Python 3.13, Pydantic",
      purpose: "Central execution check gateway. Intercepts incoming inter-agent messages and coordinates all validation stages (Identity, Replay, ABAC Policy, Firewall).",
      security: "Pydantic schema constraints, automated input validation, structured logger carrying UUID request tracing headers.",
      api: "REST Endpoint: `POST /api/v1/verify` accepting signed instructions."
    },
    firewall: {
      title: "LLM Security Firewall",
      technology: "Python Regex engine, heuristics",
      purpose: "Scans payloads to block adversarial prompts, system escapes, or data exfiltrations before execution occurs.",
      security: "Regex signatures checking for jailbreak prompts (DAN mode), exfiltration patterns (curl upload), and tool hijacking commands (rm -rf).",
      api: "Internal module: `LLMSecurityFirewall.inspect_payload` running prior to authorization evaluation."
    },
    opa: {
      title: "OPA Policy Engine",
      technology: "SQLAlchemy DB Policy Engine, JSON Rules",
      purpose: "Enforces fine-grained Attribute-Based Access Control (ABAC) and Role-Based Access Control (RBAC). Evaluates context parameters like source IP, VPN, hours, and amount limits.",
      security: "Deny-by-default architecture, policy priority resolution, timezone checking, conditional statement validations.",
      api: "REST Endpoint: `GET /api/v1/policies` to list active rules, and version rollback triggers."
    },
    redis: {
      title: "Redis Nonce Cache",
      technology: "Redis, Connection Pooling",
      purpose: "High-performance cache that tracks single-use nonces to eliminate message duplication attacks.",
      security: "Nonce cache TTL matching allowed clock drift windows (60 seconds). Intercepts and denies duplicate requests.",
      api: "Redis Client URI: `redis://localhost:6379/0` verifying unique nonce keys."
    },
    rabbitmq: {
      title: "RabbitMQ Message Broker",
      technology: "RabbitMQ AMQP Server, Pika Engine",
      purpose: "Asynchronous delivery manager routing approved tasks securely to execution workers.",
      security: "AMQP credential scoping, channel separation, dead-letter-queues (DLQ) support for unhandled events.",
      api: "RabbitMQ Queue: `sentineltrust-rabbitmq` routing success tasks asynchronously."
    }
  };

  const current = componentsData[selectedComp];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">INTERACTIVE PLATFORM BLUEPRINT</h2>
        <p className="text-slate-400 text-xs mt-1">
          Click any component of the SentinelTrust AI Zero Trust pipeline to inspect its internal mechanics, APIs, and security parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Visual Map */}
        <div className="xl:col-span-2 border border-slate-800 bg-slate-900/35 p-8 rounded-xl glass-panel min-h-[500px] flex flex-col justify-center items-center space-y-8 relative overflow-hidden">
          <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            PIPELINE FLOW GRAPH
          </div>

          {/* Row 1: Senders */}
          <div className="flex items-center justify-between w-full max-w-2xl">
            <button 
              onClick={() => setSelectedComp('agents')}
              className={`p-4 border rounded-xl flex flex-col items-center space-y-2 w-36 transition-all duration-300 ${
                selectedComp === 'agents' ? 'bg-blue-600/15 border-blue-500 shadow-glow-blue/10 scale-105' : 'bg-slate-950/60 border-slate-855 hover:border-slate-700'
              }`}
            >
              <Users className="w-6 h-6 text-blue-400" />
              <span className="text-[10px] font-mono font-bold text-slate-200 uppercase">AI Agent A</span>
              <span className="text-[8px] text-slate-500 font-mono">Generates Signature</span>
            </button>

            <ArrowRight className="w-5 h-5 text-slate-700 animate-pulse" />

            <button 
              onClick={() => setSelectedComp('nginx')}
              className={`p-4 border rounded-xl flex flex-col items-center space-y-2 w-36 transition-all duration-300 ${
                selectedComp === 'nginx' ? 'bg-blue-600/15 border-blue-500 shadow-glow-blue/10 scale-105' : 'bg-slate-950/60 border-slate-855 hover:border-slate-700'
              }`}
            >
              <Server className="w-6 h-6 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold text-slate-200 uppercase">NGINX Proxy</span>
              <span className="text-[8px] text-slate-500 font-mono">SSL & Rate Limit</span>
            </button>

            <ArrowRight className="w-5 h-5 text-slate-700" />

            <button 
              onClick={() => setSelectedComp('gateway')}
              className={`p-4 border rounded-xl flex flex-col items-center space-y-2 w-40 transition-all duration-300 ${
                selectedComp === 'gateway' ? 'bg-blue-600/15 border-blue-500 shadow-glow-blue/10 scale-105' : 'bg-slate-950/60 border-slate-855 hover:border-slate-700'
              }`}
            >
              <Layers className="w-6 h-6 text-purple-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-200 uppercase">FastAPI Gateway</span>
              <span className="text-[8px] text-slate-500 font-mono">Pipeline Integrator</span>
            </button>
          </div>

          {/* Row 2: Verification Checkpoints */}
          <div className="h-10 w-[1px] bg-gradient-to-b from-purple-500/20 to-emerald-500/20"></div>

          <div className="flex items-center justify-center space-x-6">
            <button 
              onClick={() => setSelectedComp('firewall')}
              className={`p-3 border rounded-xl flex flex-col items-center space-y-1.5 w-32 transition-all duration-300 ${
                selectedComp === 'firewall' ? 'bg-blue-600/15 border-blue-500 shadow-glow-blue/10 scale-105' : 'bg-slate-950/40 border-slate-855 hover:border-slate-700'
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span className="text-[9px] font-mono font-bold text-slate-300">AI Firewall</span>
            </button>

            <button 
              onClick={() => setSelectedComp('opa')}
              className={`p-3 border rounded-xl flex flex-col items-center space-y-1.5 w-32 transition-all duration-300 ${
                selectedComp === 'opa' ? 'bg-blue-600/15 border-blue-500 shadow-glow-blue/10 scale-105' : 'bg-slate-950/40 border-slate-855 hover:border-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 text-emerald-400" />
              <span className="text-[9px] font-mono font-bold text-slate-300">OPA Policy</span>
            </button>

            <button 
              onClick={() => setSelectedComp('redis')}
              className={`p-3 border rounded-xl flex flex-col items-center space-y-1.5 w-32 transition-all duration-300 ${
                selectedComp === 'redis' ? 'bg-blue-600/15 border-blue-500 shadow-glow-blue/10 scale-105' : 'bg-slate-950/40 border-slate-855 hover:border-slate-700'
              }`}
            >
              <Database className="w-5 h-5 text-amber-400" />
              <span className="text-[9px] font-mono font-bold text-slate-300">Redis Nonce</span>
            </button>
          </div>

          {/* Row 3: Output */}
          <div className="h-10 w-[1px] bg-gradient-to-b from-emerald-500/20 to-blue-500/20"></div>

          <div className="flex items-center justify-between w-full max-w-2xl">
            <div className="w-36"></div> {/* Spacer */}
            <ArrowRight className="w-5 h-5 text-slate-700 rotate-90" />
            <button 
              onClick={() => setSelectedComp('rabbitmq')}
              className={`p-4 border rounded-xl flex flex-col items-center space-y-2 w-36 transition-all duration-300 ${
                selectedComp === 'rabbitmq' ? 'bg-blue-600/15 border-blue-500 shadow-glow-blue/10 scale-105' : 'bg-slate-950/60 border-slate-855 hover:border-slate-700'
              }`}
            >
              <Cpu className="w-6 h-6 text-pink-400" />
              <span className="text-[10px] font-mono font-bold text-slate-200 uppercase">RabbitMQ</span>
              <span className="text-[8px] text-slate-500 font-mono">Async Task Delivery</span>
            </button>
            <ArrowRight className="w-5 h-5 text-slate-700" />
            <div className="p-4 border border-slate-850 bg-slate-950/30 rounded-xl flex flex-col items-center space-y-2 w-36 opacity-60">
              <Users className="w-6 h-6 text-slate-500" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">AI Agent B</span>
              <span className="text-[8px] text-slate-600 font-mono">Receives payload</span>
            </div>
          </div>
        </div>

        {/* Blueprint Metadata Sidebar */}
        <div className="border border-slate-800 bg-slate-900/35 p-6 rounded-xl glass-panel space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>Blueprint Parameters</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Component Name</span>
              <h3 className="text-xl font-bold text-white uppercase tracking-wide">{current.title}</h3>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Technology Stack</span>
              <span className="text-xs font-mono font-bold text-blue-400">{current.technology}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Functional Purpose</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{current.purpose}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Security Safeguard</span>
              <p className="text-xs text-emerald-400 font-mono leading-relaxed">{current.security}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-lg space-y-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">API / Config Schema Reference</span>
            <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap">{current.api}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

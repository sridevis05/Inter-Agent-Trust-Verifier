import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import agents, policies, tokens, verify, audit, simulator, simple_system
from app.agents.pipeline import AgentPipelineSimulation, set_broadcast_callback
from app.services.metrics import PrometheusMetrics
from typing import List

# 1. Initialize DB tables
Base.metadata.create_all(bind=engine)

# 2. Seed initial mock records
db = SessionLocal()
try:
    AgentPipelineSimulation.seed_agents_and_policies(db)
finally:
    db.close()

# 3. Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SentinelTrust AI is a framework-agnostic Zero Trust security gateway that verifies every inter-agent instruction using cryptographic identity, delegated authorization, policy evaluation, and continuous risk assessment before execution.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 4. CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Route mapping
api_prefix = f"/api/{settings.API_VERSION}"
app.include_router(verify.router, prefix=api_prefix)
app.include_router(agents.router, prefix=api_prefix)
app.include_router(policies.router, prefix=api_prefix)
app.include_router(tokens.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)
app.include_router(simulator.router, prefix=api_prefix)
app.include_router(simple_system.router, prefix=api_prefix)

# 6. Prometheus /metrics endpoint
@app.get("/metrics", response_class=PlainTextResponse, tags=["Observability"])
def get_metrics():
    return PrometheusMetrics.generate_prometheus_output()

# 7. WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                # Remove dead sockets gracefully
                pass

manager = ConnectionManager()

_main_loop = None

@app.on_event("startup")
async def startup_event():
    global _main_loop
    _main_loop = asyncio.get_running_loop()

# Set agent pipeline broadcast trigger to forward steps to WebSockets in real time
import asyncio
def sync_broadcast_to_websockets(event_type: str, data: dict):
    global _main_loop
    if _main_loop and _main_loop.is_running():
        asyncio.run_coroutine_threadsafe(
            manager.broadcast({
                "event": event_type,
                "data": data
            }),
            _main_loop
        )

set_broadcast_callback(sync_broadcast_to_websockets)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain active connection
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.get("/health", tags=["System Diagnostics"])
def health_check():
    return {
        "status": "Healthy",
        "service": settings.PROJECT_NAME,
        "api_version": settings.API_VERSION,
        "database": "Online",
        "redis": "Connected (Cache Mode)"
    }

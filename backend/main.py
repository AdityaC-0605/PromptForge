"""
APE — Automated Prompt Engineer
FastAPI entry point with REST API and WebSocket endpoints.
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager


from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import ACCURACY_TARGET, MAX_ITERATIONS
from backend.llm.llm_router import get_llm_router
from backend.modules.audit_log import AuditLog
from backend.modules.dataset_manager import DatasetManager
from backend.modules.iteration_ctrl import IterationController, IterationEvent
from backend.modules.task_registry import TaskRegistry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Global state ──────────────────────────────────────────────────────────
audit_log = AuditLog()
task_registry = TaskRegistry()
dataset_manager = DatasetManager()

# Active WebSocket connections per run_id
active_connections: dict[str, list[WebSocket]] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    await audit_log.initialize()
    task_registry.load_all()
    logger.info(f"APE loaded {len(task_registry.list_tasks())} tasks")
    yield


app = FastAPI(
    title="APE — Automated Prompt Engineer",
    description="Self-optimizing AI prompt system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ─────────────────────────────────────────────


class RunRequest(BaseModel):
    task_id: str
    accuracy_target: float = ACCURACY_TARGET
    max_iterations: int = MAX_ITERATIONS
    seed_strategy: str | None = None


class RunResponse(BaseModel):
    run_id: str
    message: str


# ── API Endpoints ─────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {"name": "APE — Automated Prompt Engineer", "version": "1.0.0"}


@app.get("/api/tasks")
async def list_tasks():
    """List all available tasks."""
    return task_registry.list_tasks()


@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """Get a specific task by ID."""
    try:
        task = task_registry.get_task(task_id)
        return task.model_dump()
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/runs", response_model=RunResponse)
async def start_run(req: RunRequest):
    """Start a new optimization run (runs in background)."""
    try:
        task = task_registry.get_task(req.task_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if not task.dataset_file:
        raise HTTPException(
            status_code=400, detail="Task has no dataset_file configured"
        )

    # Load dataset
    try:
        split = dataset_manager.load(task.dataset_file)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Initialize LLM
    try:
        llm = await get_llm_router()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Create run
    run_id = await audit_log.create_run(
        task_id=task.task_id,
        accuracy_target=req.accuracy_target,
        llm_provider=llm.provider,
    )

    # Run optimization in background
    controller = IterationController(
        llm=llm,
        audit_log=audit_log,
        max_iterations=req.max_iterations,
        accuracy_target=req.accuracy_target,
    )

    async def _event_callback(event: IterationEvent):
        """Broadcast events to connected WebSocket clients."""
        if run_id in active_connections:
            msg = json.dumps({"type": event.event_type, **event.data}, default=str)
            dead = []
            for ws in active_connections[run_id]:
                try:
                    await ws.send_text(msg)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                active_connections[run_id].remove(ws)

    asyncio.create_task(
        controller.run(
            task=task,
            test_cases=split.test,
            seed_strategy=req.seed_strategy,
            event_callback=_event_callback,
            run_id=run_id,
        )
    )

    return RunResponse(
        run_id=run_id,
        message=f"Optimization started for task '{task.task_id}' with {len(split.test)} test cases",
    )


@app.get("/api/runs")
async def list_runs():
    """List all optimization runs."""
    return await audit_log.list_runs()


@app.get("/api/runs/{run_id}")
async def get_run(run_id: str):
    """Get a complete run with all prompt versions."""
    run = await audit_log.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return run.model_dump()


@app.get("/api/runs/{run_id}/best-prompt")
async def get_best_prompt(run_id: str):
    """Get the best-performing prompt from a run."""
    prompt = await audit_log.get_best_prompt(run_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return {"run_id": run_id, "best_prompt": prompt}


@app.get("/api/runs/{run_id}/export")
async def export_run(run_id: str):
    """Export full run data as JSON."""
    try:
        data = await audit_log.export_run_json(run_id)
        return json.loads(data)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── WebSocket for live updates ────────────────────────────────────────────


@app.websocket("/ws/run/{run_id}")
async def websocket_run(websocket: WebSocket, run_id: str):
    """WebSocket endpoint for live optimization updates."""
    await websocket.accept()

    if run_id not in active_connections:
        active_connections[run_id] = []
    active_connections[run_id].append(websocket)

    logger.info(f"WebSocket connected for run {run_id}")

    try:
        while True:
            # Keep connection alive; client can send commands if needed
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        if run_id in active_connections:
            active_connections[run_id] = [
                ws for ws in active_connections[run_id] if ws != websocket
            ]
        logger.info(f"WebSocket disconnected for run {run_id}")

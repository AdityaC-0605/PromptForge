"""
PromptForge — Automated Prompt Engineer
FastAPI entry point with REST API and WebSocket endpoints.
"""

import asyncio
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import ACCURACY_TARGET, MAX_ITERATIONS, DATASETS_DIR, OLLAMA_MODEL, GEMINI_MODEL, LLM_PROVIDER
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

# Active run cancellation flags
active_runs: dict[str, dict] = {}  # run_id -> {"cancelled": bool, "paused": bool}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    await audit_log.initialize()
    task_registry.load_all()
    logger.info(f"PromptForge loaded {len(task_registry.list_tasks())} tasks")
    yield


app = FastAPI(
    title="PromptForge — Automated Prompt Engineer",
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
    # Extra fields from frontend (accepted but mapped appropriately)
    dataset_id: str | None = None
    concurrency: int | None = None
    model_id: str | None = None


class RunResponse(BaseModel):
    run_id: str
    message: str


# ── API Endpoints ─────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {"name": "PromptForge — Automated Prompt Engineer", "version": "1.0.0"}


@app.get("/api/status")
async def get_status():
    """Backend health check and active model info."""
    try:
        llm = await get_llm_router()
        provider = llm.provider
        if provider == "ollama":
            model = OLLAMA_MODEL
        else:
            model = GEMINI_MODEL
        return {"status": "ok", "model": model, "provider": provider, "version": "1.0.0"}
    except Exception:
        # Return degraded status if LLM not available yet
        model = GEMINI_MODEL if LLM_PROVIDER == "gemini" else OLLAMA_MODEL
        return {"status": "degraded", "model": model, "provider": LLM_PROVIDER, "version": "1.0.0"}


@app.get("/api/models")
async def list_models():
    """List available LLM models and their availability."""
    models = []

    # Check Ollama
    try:
        from backend.llm.ollama_client import OllamaClient
        ollama = OllamaClient()
        ollama_available = await ollama.is_available()
    except Exception:
        ollama_available = False

    models.append({
        "id": f"ollama-{OLLAMA_MODEL}",
        "name": f"{OLLAMA_MODEL.capitalize()} (Ollama)",
        "available": ollama_available,
        "provider": "ollama",
    })

    # Check Gemini
    from backend.config import GEMINI_API_KEY
    gemini_available = bool(GEMINI_API_KEY)
    models.append({
        "id": f"gemini-{GEMINI_MODEL}",
        "name": f"Gemini ({GEMINI_MODEL})",
        "available": gemini_available,
        "provider": "gemini",
    })

    return models


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


@app.get("/api/tasks/{task_id}/datasets")
async def list_task_datasets(task_id: str):
    """List datasets available for a given task."""
    try:
        task = task_registry.get_task(task_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    datasets = []
    if task.dataset_file:
        dataset_path = DATASETS_DIR / task.dataset_file
        if dataset_path.exists():
            # Count items in dataset
            try:
                split = dataset_manager.load(task.dataset_file)
                size = split.total
            except Exception:
                size = 0
            datasets.append({
                "dataset_id": task.dataset_file,
                "name": task.dataset_file.replace("_", " ").replace(".json", "").replace(".csv", "").title(),
                "size": size,
            })

    # Also scan for any dataset files matching the task_id pattern
    for path in DATASETS_DIR.glob(f"{task_id}*.json"):
        dataset_id = path.name
        if not any(d["dataset_id"] == dataset_id for d in datasets):
            try:
                split = dataset_manager.load(dataset_id)
                size = split.total
            except Exception:
                size = 0
            datasets.append({
                "dataset_id": dataset_id,
                "name": path.stem.replace("_", " ").title(),
                "size": size,
            })

    return datasets


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

    # Track run state
    active_runs[run_id] = {"cancelled": False, "paused": False}

    # Run optimization in background
    controller = IterationController(
        llm=llm,
        audit_log=audit_log,
        max_iterations=req.max_iterations,
        accuracy_target=req.accuracy_target,
    )

    async def _broadcast(msg: dict):
        """Broadcast a message to all connected WebSocket clients for this run."""
        if run_id in active_connections:
            payload = json.dumps(msg, default=str)
            dead = []
            for ws in active_connections[run_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                active_connections[run_id].remove(ws)

    async def _event_callback(event: IterationEvent):
        """Broadcast events to connected WebSocket clients."""
        msg = {"type": event.event_type, "run_id": run_id, "data": event.data}
        await _broadcast(msg)

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


@app.post("/api/runs/{run_id}/pause")
async def pause_run(run_id: str):
    """Pause or resume a running optimization run."""
    run = await audit_log.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    if run_id not in active_runs:
        raise HTTPException(status_code=400, detail="Run is not active")
    active_runs[run_id]["paused"] = not active_runs[run_id]["paused"]
    paused = active_runs[run_id]["paused"]
    return {"success": True, "paused": paused}


@app.post("/api/runs/{run_id}/stop")
async def stop_run(run_id: str):
    """Stop a running optimization run."""
    run = await audit_log.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    if run_id in active_runs:
        active_runs[run_id]["cancelled"] = True
    await audit_log.finish_run(run_id, "error")
    return {"success": True}


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
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        if run_id in active_connections:
            active_connections[run_id] = [
                ws for ws in active_connections[run_id] if ws != websocket
            ]
        logger.info(f"WebSocket disconnected for run {run_id}")

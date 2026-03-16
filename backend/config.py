"""
APE — Automated Prompt Engineer
Global configuration module.
"""

import os
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
TASKS_DIR = DATA_DIR / "tasks"
DATASETS_DIR = DATA_DIR / "datasets"
RUNS_DIR = DATA_DIR / "runs"
DB_PATH = DATA_DIR / "ape.db"

# Ensure directories exist
for d in (TASKS_DIR, DATASETS_DIR, RUNS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ── LLM Settings ──────────────────────────────────────────────────────────
LLM_PROVIDER = os.getenv("APE_LLM_PROVIDER", "auto")  # "ollama", "gemini", "auto"

# Ollama
OLLAMA_BASE_URL = os.getenv("APE_OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("APE_OLLAMA_MODEL", "llama3")

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("APE_GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_RPM_LIMIT = 15  # free-tier rate limit

# ── Optimization Defaults ─────────────────────────────────────────────────
MAX_ITERATIONS = int(os.getenv("APE_MAX_ITERATIONS", "20"))
ACCURACY_TARGET = float(os.getenv("APE_ACCURACY_TARGET", "0.95"))
EARLY_STOP_PATIENCE = 2  # consecutive drops before reverting to best
EVAL_CONCURRENCY = int(os.getenv("APE_EVAL_CONCURRENCY", "3"))

# ── Rate Limiting ─────────────────────────────────────────────────────────
RATE_LIMIT_BACKOFF_BASE = 2  # seconds
RATE_LIMIT_MAX_RETRIES = 5

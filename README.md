# APE — Automated Prompt Engineer

> **Stop treating AI as magic. Treat prompts as software — measurable, testable, and automatically improvable.**

APE is a meta-AI system where the AI writes, tests, scores, and rewrites its own prompts — with no human intervention after the initial task definition. Give APE a task + test dataset + accuracy target, and it returns an optimized prompt with a full audit trail.

---

## Quick Start

```bash
# 1. Set up environment
cd PromptForge
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 2. Configure LLM backend (choose one)
# Option A: Ollama (local, free, no rate limits)
# Install from https://ollama.ai, then:
ollama pull llama3

# Option B: Gemini (cloud, free tier)
export GEMINI_API_KEY="your-api-key-here"

# 3. Start the server
uvicorn backend.main:app --reload --port 8000

# 4. Open API docs
open http://localhost:8000/docs
```

## How It Works

```
Task Definition + Test Cases
        │
        ▼
   Generate Seed Prompt (v0)
        │
        ▼
   ┌──────────────────────────┐
   │  Evaluate against tests  │◄─────┐
   │  Score + cluster failures│      │
   │  Hit target? → DONE      │      │
   │  Below target? ──────────┼──────┤
   └──────────────────────────┘      │
        │                            │
        ▼                            │
   Optimizer rewrites prompt ────────┘
   (meta-prompt sees only failures)
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all available tasks |
| `GET` | `/api/tasks/{id}` | Get task details |
| `POST` | `/api/runs` | Start an optimization run |
| `GET` | `/api/runs` | List all runs |
| `GET` | `/api/runs/{id}` | Get run with all prompt versions |
| `GET` | `/api/runs/{id}/best-prompt` | Get the best prompt |
| `GET` | `/api/runs/{id}/export` | Export full run as JSON |
| `WS` | `/ws/run/{id}` | Live updates via WebSocket |

### Start a Run
```bash
curl -X POST http://localhost:8000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"task_id": "sentiment_classification", "accuracy_target": 0.95}'
```

## Built-in Demo Tasks

| Task | Type | Test Cases | Evaluation |
|------|------|-----------|------------|
| Sentiment Classification | classification | 172 | exact_match |
| Named Entity Extraction | extraction | 150 | f1_score |
| Math Word Problems | QA | 100 | contains_match |
| Text Summarization | generation | 76 | f1_score |
| JSON Extraction | extraction | 120 | f1_score |

## Architecture

```
backend/
├── main.py                     # FastAPI app + WebSocket
├── config.py                   # Global settings (env-var driven)
├── llm/
│   ├── ollama_client.py        # Local Ollama wrapper
│   ├── gemini_client.py        # Gemini API wrapper
│   └── llm_router.py           # Auto-detect + fallback
├── modules/
│   ├── task_registry.py        # YAML task config loading
│   ├── dataset_manager.py      # CSV/JSON dataset handling
│   ├── prompt_generator.py     # 4 seed strategies
│   ├── evaluator.py            # Async parallel evaluation
│   ├── scorer.py               # 4 scoring methods + failure clustering
│   ├── optimizer.py            # Meta-prompt rewriting engine
│   ├── iteration_ctrl.py       # Main optimization loop
│   └── audit_log.py            # SQLite persistence
├── data/
│   ├── tasks/                  # YAML task definitions
│   ├── datasets/               # JSON test datasets
│   └── runs/                   # Run artifacts
└── tests/                      # 36 unit + integration tests
```

## Configuration

All settings configurable via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `APE_LLM_PROVIDER` | `auto` | `ollama`, `gemini`, or `auto` |
| `APE_OLLAMA_MODEL` | `llama3` | Ollama model name |
| `APE_GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model name |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `APE_MAX_ITERATIONS` | `20` | Max optimization iterations |
| `APE_ACCURACY_TARGET` | `0.95` | Target accuracy (0.0–1.0) |
| `APE_EVAL_CONCURRENCY` | `3` | Parallel evaluation calls |

## Testing

```bash
source venv/bin/activate
python -m pytest backend/tests/ -v
```

## Tech Stack

| Component | Tool |
|-----------|------|
| Backend | FastAPI + Python |
| LLM (local) | Ollama (Llama 3 / Mistral) |
| LLM (cloud) | Google Gemini 2.0 Flash |
| Database | SQLite |
| Testing | pytest |

---

*APE — Because prompts should be engineered, not guessed.*

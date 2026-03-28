# PromptForge — Automated Prompt Engineer

> **Stop treating AI as magic. Treat prompts as software — measurable, testable, and automatically improvable.**

PromptForge is a meta-AI system where the AI writes, tests, scores, and rewrites its own prompts with no human intervention after the initial task definition. Give it a task, a test dataset, and an accuracy target — it returns an optimized prompt with a full audit trail and a live dashboard to watch it work.

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) (local) **or** a Google Gemini API key (cloud)

### 1. Backend

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

Configure your LLM backend — pick one:

```bash
# Option A: Ollama (local, free, no rate limits)
# Install from https://ollama.ai, then pull a model:
ollama pull llama3

# Option B: Google Gemini (cloud, free tier available)
export GEMINI_API_KEY="your-api-key-here"
```

Start the backend:

```bash
uvicorn backend.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

### 3. Environment Variables (Frontend)

The frontend reads from `frontend/.env.local`. Defaults are already set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 4. Mock Mode

To run the frontend without a backend (uses simulated data):

```
http://localhost:3000/run/mock-run-1?mock=true
```

---

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

---

## Features

- **Live run dashboard** — three-column view with real-time score ring, prompt diff, test case feed, and failure charts streaming over WebSocket
- **Premium design system** — modern glassmorphism UI with vibrant hover effects, smooth transitions, and glowing components
- **Web-based run configuration** — easily start new prompt optimization runs right from your browser
- **LCS-based prompt diff** — line-by-line diff of every prompt version with added/removed highlighting
- **Score ring** — color-coded accuracy gauge (red < 60%, amber 60–84%, green ≥ 85%) with target tick mark
- **Run history** — filterable table of all past runs with inline sparklines and per-row actions
- **Prompt version browser** — browse, compare, copy, and export any prompt version
- **Failure clustering** — bar chart breakdown of failure types (wrong format, wrong content, hallucination, refusal)
- **Keyboard shortcuts** — `P` pause, `E` export, `Esc` stop, `←`/`→` navigate versions
- **Mock mode** — full UI simulation with no backend required

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all available tasks |
| `GET` | `/api/tasks/{id}` | Get task details |
| `GET` | `/api/datasets` | List datasets (filter by `?task_id=`) |
| `POST` | `/api/runs` | Start an optimization run |
| `GET` | `/api/runs` | List all runs |
| `GET` | `/api/runs/{id}` | Get run with all prompt versions |
| `POST` | `/api/runs/{id}/pause` | Pause a running run |
| `POST` | `/api/runs/{id}/stop` | Stop a running run |
| `GET` | `/api/runs/{id}/best-prompt` | Get the best prompt |
| `GET` | `/api/runs/{id}/export` | Export full run as JSON |
| `GET` | `/api/runs/{id}/prompt-versions` | List all prompt versions |
| `GET` | `/api/models` | List available LLM models |
| `GET` | `/api/status` | Backend health + active model |
| `WS` | `/ws/run/{id}` | Live updates via WebSocket |

### Start a Run

The easiest way to start a new optimization run is via the Web Dashboard at `http://localhost:3000/dashboard` by filling out the "New Run" form. 

Alternatively, you can trigger a run directly via the API:

```bash
curl -X POST http://localhost:8000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "sentiment_classification",
    "dataset_id": "sentiment_dataset",
    "accuracy_target": 0.95,
    "max_iterations": 20,
    "seed_strategy": "zero_shot",
    "concurrency": 3,
    "model": "llama3"
  }'
```

---

## Built-in Demo Tasks

| Task | Type | Test Cases | Evaluation |
|------|------|-----------|------------|
| Sentiment Classification | classification | 172 | exact_match |
| Named Entity Extraction | extraction | 150 | f1_score |
| Math Word Problems | QA | 100 | contains_match |
| Text Summarization | generation | 76 | f1_score |
| JSON Extraction | extraction | 120 | f1_score |

---

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
└── tests/                      # Unit + integration tests

frontend/
├── app/
│   ├── page.tsx                # Landing page
│   ├── layout.tsx              # Root layout (fonts, ToastProvider)
│   └── (app)/
│       ├── layout.tsx          # App shell (sidebar + main)
│       ├── dashboard/          # Dashboard overview
│       ├── run/[id]/           # Live run view
│       ├── history/            # Run history table
│       ├── prompts/[runId]/    # Prompt version browser
│       └── tasks/              # Task list
├── src/
│   ├── components/
│   │   ├── ScoreRing.tsx       # Animated accuracy gauge
│   │   ├── PromptDiff.tsx      # LCS-based line diff
│   │   ├── SparklineChart.tsx  # Score history sparkline
│   │   ├── FailureBarChart.tsx # Failure type breakdown
│   │   ├── TestCaseFeed.tsx    # Live streaming test results
│   │   ├── RunControlPanel.tsx # Left-column run controls
│   │   ├── RunHistoryTable.tsx # Filterable run history
│   │   ├── PromptVersionBrowser.tsx
│   │   ├── RunConfigForm.tsx   # New run configuration form
│   │   ├── Sidebar.tsx         # Nav + model status pill
│   │   ├── AppShell.tsx        # Layout wrapper
│   │   ├── ToastProvider.tsx   # Global toast notifications
│   │   └── landing/            # Landing page sections
│   └── hooks/
│       └── useRunStream.ts     # WebSocket + mock streaming hook
└── lib/
    ├── api.ts                  # Typed API client (real + mock)
    ├── types.ts                # Shared TypeScript types
    ├── mockData.ts             # Mock fixtures + stream simulator
    └── utils.ts                # Formatting helpers
```

---

## Configuration

All backend settings are configurable via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `APE_LLM_PROVIDER` | `auto` | `ollama`, `gemini`, or `auto` |
| `APE_OLLAMA_MODEL` | `llama3` | Ollama model name |
| `APE_GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model name |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `APE_MAX_ITERATIONS` | `20` | Max optimization iterations |
| `APE_ACCURACY_TARGET` | `0.95` | Target accuracy (0.0–1.0) |
| `APE_EVAL_CONCURRENCY` | `3` | Parallel evaluation calls |

Frontend environment variables (in `frontend/.env.local`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | WebSocket base URL |

---

## Testing

### Backend

```bash
source venv/bin/activate
python -m pytest backend/tests/ -v
```

### Frontend

```bash
cd frontend
npx vitest run
```

Property-based tests (fast-check) cover:
- ScoreRing color threshold correctness
- PromptDiff line classification and round-trip reconstruction
- TestCaseFeed DOM cap (max 200 entries)
- useRunStream testCaseResults array cap
- API error propagation (status codes 400–599)
- Toast auto-dismiss timing

---

## Tech Stack

| Component | Tool |
|-----------|------|
| Backend | FastAPI + Python 3.11 |
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | TailwindCSS v4 + Custom Glassmorphism CSS |
| Charting | Recharts |
| Icons | lucide-react |
| Property testing | fast-check + Vitest |
| LLM (local) | Ollama (Llama 3 / Mistral) |
| LLM (cloud) | Google Gemini 2.0 Flash |
| Database | SQLite (aiosqlite) |
| Backend testing | pytest + pytest-asyncio |

---

*PromptForge — Because prompts should be engineered, not guessed.*

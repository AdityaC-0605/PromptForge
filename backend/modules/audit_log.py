"""
Audit Log — SQLite-backed persistence for prompt versions, scores, and run history.
"""

import json
import time
import uuid
from pathlib import Path
from typing import Any

import aiosqlite
from pydantic import BaseModel
from backend.config import DB_PATH


class PromptVersion(BaseModel):
    """A stored prompt version with metadata."""

    version: int
    prompt_text: str
    score: float
    passed: int
    failed: int
    failure_summary: str
    optimizer_reasoning: str
    prompt_diff: str
    timestamp: float


class RunRecord(BaseModel):
    """Summary of a complete optimization run."""

    run_id: str
    task_id: str
    status: str  # running, completed, stopped, error
    total_iterations: int
    best_score: float
    best_version: int
    accuracy_target: float
    llm_provider: str
    started_at: float
    finished_at: float | None = None
    prompt_versions: list[PromptVersion] = []


class AuditLog:
    """SQLite-backed audit log for APE optimization runs."""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._initialized = False

    async def initialize(self) -> None:
        """Create database tables if they don't exist."""
        if self._initialized:
            return

        async with aiosqlite.connect(str(self.db_path)) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS runs (
                    run_id TEXT PRIMARY KEY,
                    task_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'running',
                    total_iterations INTEGER DEFAULT 0,
                    best_score REAL DEFAULT 0.0,
                    best_version INTEGER DEFAULT 0,
                    accuracy_target REAL DEFAULT 0.95,
                    llm_provider TEXT DEFAULT '',
                    started_at REAL NOT NULL,
                    finished_at REAL
                )
            """)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS prompt_versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    prompt_text TEXT NOT NULL,
                    score REAL NOT NULL,
                    passed INTEGER NOT NULL,
                    failed INTEGER NOT NULL,
                    failure_summary TEXT DEFAULT '',
                    optimizer_reasoning TEXT DEFAULT '',
                    prompt_diff TEXT DEFAULT '',
                    timestamp REAL NOT NULL,
                    FOREIGN KEY (run_id) REFERENCES runs(run_id)
                )
            """)
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_pv_run
                ON prompt_versions(run_id, version)
            """)
            await db.commit()

        self._initialized = True

    async def create_run(
        self, task_id: str, accuracy_target: float, llm_provider: str
    ) -> str:
        """Create a new optimization run. Returns the run_id."""
        await self.initialize()
        run_id = str(uuid.uuid4())
        now = time.time()

        async with aiosqlite.connect(str(self.db_path)) as db:
            await db.execute(
                """INSERT INTO runs
                   (run_id, task_id, status, accuracy_target, llm_provider, started_at)
                   VALUES (?, ?, 'running', ?, ?, ?)""",
                (run_id, task_id, accuracy_target, llm_provider, now),
            )
            await db.commit()

        return run_id

    async def log_version(
        self,
        run_id: str,
        version: int,
        prompt_text: str,
        score: float,
        passed: int,
        failed: int,
        failure_summary: str = "",
        optimizer_reasoning: str = "",
        prompt_diff: str = "",
    ) -> None:
        """Log a prompt version and its evaluation results."""
        await self.initialize()
        now = time.time()

        async with aiosqlite.connect(str(self.db_path)) as db:
            await db.execute(
                """INSERT INTO prompt_versions
                   (run_id, version, prompt_text, score, passed, failed,
                    failure_summary, optimizer_reasoning, prompt_diff, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    run_id,
                    version,
                    prompt_text,
                    score,
                    passed,
                    failed,
                    failure_summary,
                    optimizer_reasoning,
                    prompt_diff,
                    now,
                ),
            )

            # Update run with best score
            await db.execute(
                """UPDATE runs SET
                   total_iterations = ?,
                   best_score = MAX(best_score, ?),
                   best_version = CASE WHEN ? > best_score THEN ? ELSE best_version END
                   WHERE run_id = ?""",
                (version + 1, score, score, version, run_id),
            )
            await db.commit()

    async def finish_run(self, run_id: str, status: str = "completed") -> None:
        """Mark a run as finished."""
        await self.initialize()
        now = time.time()

        async with aiosqlite.connect(str(self.db_path)) as db:
            await db.execute(
                "UPDATE runs SET status = ?, finished_at = ? WHERE run_id = ?",
                (status, now, run_id),
            )
            await db.commit()

    async def get_run(self, run_id: str) -> RunRecord | None:
        """Retrieve a run with all its prompt versions."""
        await self.initialize()

        async with aiosqlite.connect(str(self.db_path)) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,))
            row = await cursor.fetchone()
            if not row:
                return None

            run = RunRecord(
                run_id=row["run_id"],
                task_id=row["task_id"],
                status=row["status"],
                total_iterations=row["total_iterations"],
                best_score=row["best_score"],
                best_version=row["best_version"],
                accuracy_target=row["accuracy_target"],
                llm_provider=row["llm_provider"],
                started_at=row["started_at"],
                finished_at=row["finished_at"],
            )

            cursor = await db.execute(
                "SELECT * FROM prompt_versions WHERE run_id = ? ORDER BY version",
                (run_id,),
            )
            rows = await cursor.fetchall()
            run.prompt_versions = [
                PromptVersion(
                    version=r["version"],
                    prompt_text=r["prompt_text"],
                    score=r["score"],
                    passed=r["passed"],
                    failed=r["failed"],
                    failure_summary=r["failure_summary"],
                    optimizer_reasoning=r["optimizer_reasoning"],
                    prompt_diff=r["prompt_diff"],
                    timestamp=r["timestamp"],
                )
                for r in rows
            ]

        return run

    async def list_runs(self, limit: int = 50) -> list[dict[str, Any]]:
        """List recent runs without full prompt versions."""
        await self.initialize()

        async with aiosqlite.connect(str(self.db_path)) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                """SELECT run_id, task_id, status, total_iterations,
                          best_score, best_version, started_at, finished_at
                   FROM runs ORDER BY started_at DESC LIMIT ?""",
                (limit,),
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_best_prompt(self, run_id: str) -> str | None:
        """Get the best-performing prompt text from a run."""
        run = await self.get_run(run_id)
        if not run or not run.prompt_versions:
            return None
        best = max(run.prompt_versions, key=lambda v: v.score)
        return best.prompt_text

    async def export_run_json(self, run_id: str) -> str:
        """Export a full run as JSON."""
        run = await self.get_run(run_id)
        if not run:
            raise KeyError(f"Run '{run_id}' not found")
        return json.dumps(run.model_dump(), indent=2, default=str)

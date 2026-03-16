"""
Task Registry — loads and validates YAML task definitions.
"""

from pathlib import Path
from typing import Any
import yaml  # type: ignore
from pydantic import BaseModel, Field
from backend.config import TASKS_DIR


class TaskConfig(BaseModel):
    """Schema for a task definition."""

    task_id: str
    task_type: str = Field(description="classification | extraction | generation | qa")
    description: str
    input_schema: dict[str, Any] = Field(default_factory=dict)
    output_schema: dict[str, Any] = Field(default_factory=dict)
    evaluation_method: str = Field(
        default="exact_match",
        description="exact_match | contains_match | regex | f1_score | llm_judge",
    )
    dataset_file: str = ""
    seed_strategy: str = Field(
        default="zero_shot",
        description="zero_shot | role_based | chain_of_thought | format_constrained",
    )


class TaskRegistry:
    """Manages task definitions stored as YAML files."""

    def __init__(self, tasks_dir: Path = TASKS_DIR):
        self.tasks_dir = tasks_dir
        self._cache: dict[str, TaskConfig] = {}

    def load_all(self) -> dict[str, TaskConfig]:
        """Load all YAML task configs from the tasks directory."""
        self._cache.clear()
        for path in sorted(self.tasks_dir.glob("*.yaml")):
            task = self._load_file(path)
            self._cache[task.task_id] = task
        for path in sorted(self.tasks_dir.glob("*.yml")):
            task = self._load_file(path)
            if task.task_id not in self._cache:
                self._cache[task.task_id] = task
        return self._cache

    def _load_file(self, path: Path) -> TaskConfig:
        """Load and validate a single task YAML file."""
        with open(path, "r") as f:
            raw = yaml.safe_load(f)
        if not isinstance(raw, dict):
            raise ValueError(f"Invalid task config in {path}: expected a mapping")
        return TaskConfig(**raw)

    def get_task(self, task_id: str) -> TaskConfig:
        """Get a task by ID. Loads all tasks if not cached."""
        if not self._cache:
            self.load_all()
        if task_id not in self._cache:
            raise KeyError(
                f"Task '{task_id}' not found. Available: {list(self._cache.keys())}"
            )
        return self._cache[task_id]

    def list_tasks(self) -> list[dict[str, str]]:
        """Return a summary list of all available tasks."""
        if not self._cache:
            self.load_all()
        return [
            {
                "task_id": t.task_id,
                "task_type": t.task_type,
                "description": t.description,
                "evaluation_method": t.evaluation_method,
            }
            for t in self._cache.values()
        ]

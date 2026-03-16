"""
Prompt Generator — creates seed prompts from task definitions.
Supports four seed strategies: zero-shot, role-based, chain-of-thought, format-constrained.
"""

from backend.modules.task_registry import TaskConfig

# ── Strategy templates ─────────────────────────────────────────────────────

_ZERO_SHOT_TEMPLATE = """You are given the following task:
{description}

Input: {{input}}

Provide your answer and nothing else."""

_ROLE_BASED_TEMPLATE = """You are an expert {role}. Your task is:
{description}

Input: {{input}}

Provide your answer and nothing else."""

_COT_TEMPLATE = """You are given the following task:
{description}

Input: {{input}}

Think step by step before answering, then provide ONLY your final answer on the last line."""

_FORMAT_CONSTRAINED_TEMPLATE = """You are given the following task:
{description}

Input: {{input}}

You MUST format your output exactly as: {output_format}
Provide your answer and nothing else."""


# ── Role mapping for role-based strategy ──────────────────────────────────

_ROLE_MAP = {
    "classification": "text classification analyst",
    "extraction": "information extraction specialist",
    "generation": "text generation expert",
    "qa": "question answering specialist",
}

# ── Output format hints per task type ─────────────────────────────────────

_FORMAT_MAP = {
    "classification": "a single label (e.g., positive, negative)",
    "extraction": "a JSON object with the extracted entities",
    "generation": "the generated text",
    "qa": "a direct, concise answer",
}


class PromptGenerator:
    """Generates seed prompts using different strategies."""

    def generate(self, task: TaskConfig, strategy: str | None = None) -> str:
        """
        Generate a seed prompt for the task.
        strategy: zero_shot | role_based | chain_of_thought | format_constrained
        If None, uses the strategy specified in the task config.
        """
        strategy = strategy or task.seed_strategy

        if strategy == "zero_shot":
            return self._zero_shot(task)
        elif strategy == "role_based":
            return self._role_based(task)
        elif strategy == "chain_of_thought":
            return self._chain_of_thought(task)
        elif strategy == "format_constrained":
            return self._format_constrained(task)
        else:
            raise ValueError(f"Unknown seed strategy: {strategy}")

    def generate_all_strategies(self, task: TaskConfig) -> dict[str, str]:
        """Generate seed prompts for all strategies."""
        return {
            strategy: self.generate(task, strategy)
            for strategy in [
                "zero_shot",
                "role_based",
                "chain_of_thought",
                "format_constrained",
            ]
        }

    def _zero_shot(self, task: TaskConfig) -> str:
        return _ZERO_SHOT_TEMPLATE.format(description=task.description)

    def _role_based(self, task: TaskConfig) -> str:
        role = _ROLE_MAP.get(task.task_type, "AI assistant")
        return _ROLE_BASED_TEMPLATE.format(role=role, description=task.description)

    def _chain_of_thought(self, task: TaskConfig) -> str:
        return _COT_TEMPLATE.format(description=task.description)

    def _format_constrained(self, task: TaskConfig) -> str:
        output_format = _FORMAT_MAP.get(task.task_type, "the expected output format")
        # Use output_schema description if available
        if task.output_schema and "format" in task.output_schema:
            output_format = task.output_schema["format"]
        return _FORMAT_CONSTRAINED_TEMPLATE.format(
            description=task.description,
            output_format=output_format,
        )

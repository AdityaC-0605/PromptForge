"""Tests for the Prompt Generator module."""

import pytest
from backend.modules.prompt_generator import PromptGenerator
from backend.modules.task_registry import TaskConfig


@pytest.fixture
def sample_task():
    return TaskConfig(
        task_id="test_sentiment",
        task_type="classification",
        description="Classify sentiment as positive or negative.",
        output_schema={"format": "positive or negative"},
        evaluation_method="exact_match",
    )


class TestPromptGenerator:
    def test_zero_shot(self, sample_task):
        gen = PromptGenerator()
        prompt = gen.generate(sample_task, "zero_shot")
        assert "{input}" in prompt
        assert "Classify sentiment" in prompt
        assert "nothing else" in prompt.lower()

    def test_role_based(self, sample_task):
        gen = PromptGenerator()
        prompt = gen.generate(sample_task, "role_based")
        assert "{input}" in prompt
        assert "expert" in prompt.lower()
        assert "classification" in prompt.lower() or "analyst" in prompt.lower()

    def test_chain_of_thought(self, sample_task):
        gen = PromptGenerator()
        prompt = gen.generate(sample_task, "chain_of_thought")
        assert "{input}" in prompt
        assert "step by step" in prompt.lower()

    def test_format_constrained(self, sample_task):
        gen = PromptGenerator()
        prompt = gen.generate(sample_task, "format_constrained")
        assert "{input}" in prompt
        assert "format" in prompt.lower()

    def test_generate_all_strategies(self, sample_task):
        gen = PromptGenerator()
        all_prompts = gen.generate_all_strategies(sample_task)
        assert len(all_prompts) == 4
        for strategy, prompt in all_prompts.items():
            assert "{input}" in prompt, f"Strategy {strategy} missing {{input}}"

    def test_unknown_strategy_raises(self, sample_task):
        gen = PromptGenerator()
        with pytest.raises(ValueError, match="Unknown"):
            gen.generate(sample_task, "nonexistent")

    def test_default_strategy_from_task(self):
        task = TaskConfig(
            task_id="test",
            task_type="qa",
            description="Answer questions.",
            seed_strategy="chain_of_thought",
        )
        gen = PromptGenerator()
        prompt = gen.generate(task)
        assert "step by step" in prompt.lower()

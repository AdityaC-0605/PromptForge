"""
Evaluator Engine — runs test cases against a prompt via the LLM.
Supports async parallel evaluation with configurable concurrency.
"""

import asyncio
import logging
from pydantic import BaseModel
from backend.config import EVAL_CONCURRENCY
from backend.llm.llm_router import LLMRouter
from backend.modules.dataset_manager import TestCase
from typing import Callable

logger = logging.getLogger(__name__)


class EvalResult(BaseModel):
    """Result of evaluating a single test case."""

    input: str
    expected_output: str
    actual_output: str
    passed: bool
    must_pass: bool = False
    error: str | None = None


class Evaluator:
    """
    Runs test cases through the LLM using the current prompt.
    Supports parallel evaluation with semaphore-based concurrency control.
    """

    def __init__(self, llm: LLMRouter, concurrency: int = EVAL_CONCURRENCY):
        self.llm = llm
        self.concurrency = concurrency

    async def evaluate(
        self,
        prompt_template: str,
        test_cases: list[TestCase],
        score_fn: Callable[[str, str], bool],
        dry_run: bool = False,
    ) -> list[EvalResult]:
        """
        Evaluate all test cases against the prompt.

        Args:
            prompt_template: The prompt with {input} placeholder.
            test_cases: List of test cases to evaluate.
            score_fn: Callable(expected, actual) -> bool
            dry_run: If True, validate that all cases are evaluable without calling LLM.
        """
        if dry_run:
            return self._dry_run(prompt_template, test_cases)

        semaphore = asyncio.Semaphore(self.concurrency)
        tasks = [
            self._evaluate_single(semaphore, prompt_template, case, score_fn)
            for case in test_cases
        ]
        results = await asyncio.gather(*tasks)
        return list(results)

    async def _evaluate_single(
        self,
        semaphore: asyncio.Semaphore,
        prompt_template: str,
        case: TestCase,
        score_fn: Callable[[str, str], bool],
    ) -> EvalResult:
        """Evaluate a single test case with concurrency control."""
        async with semaphore:
            try:
                # Build the full prompt by substituting {input}
                full_prompt = prompt_template.replace("{input}", case.input)
                actual_output = await self.llm.generate(full_prompt)
                passed = score_fn(case.expected_output, actual_output)
                return EvalResult(
                    input=case.input,
                    expected_output=case.expected_output,
                    actual_output=actual_output,
                    passed=passed,
                    must_pass=case.must_pass,
                )
            except Exception as exc:
                logger.error(
                    f"Evaluation error for input '{case.input[:50]}...': {exc}"
                )
                return EvalResult(
                    input=case.input,
                    expected_output=case.expected_output,
                    actual_output="",
                    passed=False,
                    must_pass=case.must_pass,
                    error=str(exc),
                )

    def _dry_run(
        self, prompt_template: str, test_cases: list[TestCase]
    ) -> list[EvalResult]:
        """Validate that all test cases can be evaluated (no LLM calls)."""
        results: list[EvalResult] = []
        for case in test_cases:
            try:
                prompt_template.replace("{input}", case.input)
                results.append(
                    EvalResult(
                        input=case.input,
                        expected_output=case.expected_output,
                        actual_output="[DRY RUN]",
                        passed=True,
                        must_pass=case.must_pass,
                    )
                )
            except Exception as exc:
                results.append(
                    EvalResult(
                        input=case.input,
                        expected_output=case.expected_output,
                        actual_output="",
                        passed=False,
                        must_pass=case.must_pass,
                        error=f"Template error: {exc}",
                    )
                )
        return results

"""
Iteration Controller — orchestrates the full prompt optimization loop.
"""

import asyncio
import logging
import time
import uuid
from typing import Any, Callable

from backend.llm.llm_router import LLMRouter
from backend.modules.audit_log import AuditLog
from backend.modules.dataset_manager import DataTestCase
from backend.modules.evaluator import Evaluator
from backend.modules.optimizer import Optimizer
from backend.modules.prompt_generator import PromptGenerator
from backend.modules.scorer import Scorer
from backend.modules.task_registry import TaskConfig
from backend.config import MAX_ITERATIONS, ACCURACY_TARGET, EARLY_STOP_PATIENCE

logger = logging.getLogger(__name__)


class IterationEvent:
    """Event emitted during the optimization loop for live updates."""

    def __init__(
        self,
        event_type: str,
        data: dict[str, Any],
    ):
        self.event_type = (
            event_type  # iteration_start, iteration_end, run_complete, error
        )
        self.data = data


class IterationController:
    """
    Main optimization loop orchestrator.
    Runs the evaluate → score → optimize cycle until target is hit or max iterations reached.
    """

    def __init__(
        self,
        llm: LLMRouter,
        audit_log: AuditLog,
        max_iterations: int = MAX_ITERATIONS,
        accuracy_target: float = ACCURACY_TARGET,
        early_stop_patience: int = EARLY_STOP_PATIENCE,
    ):
        self.llm = llm
        self.audit_log = audit_log
        self.max_iterations = max_iterations
        self.accuracy_target = accuracy_target
        self.early_stop_patience = early_stop_patience
        self.evaluator = Evaluator(llm)
        self.scorer = Scorer()
        self.optimizer = Optimizer(llm)
        self.prompt_generator = PromptGenerator()

    async def run(
        self,
        task: TaskConfig,
        test_cases: list[DataTestCase],
        seed_strategy: str | None = None,
        event_callback: Callable[[IterationEvent], Any] | None = None,
        run_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Execute the full optimization loop.

        Returns a run summary dict.
        """
        start_time = time.time()

        # Create run in audit log
        if not run_id:
            run_id = await self.audit_log.create_run(
                task_id=task.task_id,
                accuracy_target=self.accuracy_target,
                llm_provider=self.llm.provider,
            )

        # Get scoring function
        score_fn: Callable[[str, str], bool]
        if task.evaluation_method == "llm_judge":
            logger.warning(
                "llm_judge evaluation is not yet implemented — falling back to contains_match"
            )
            score_fn = self.scorer.contains_match
        else:
            score_fn = self.scorer.get_scoring_function(task.evaluation_method)

        # Generate seed prompt (v0)
        current_prompt = self.prompt_generator.generate(task, seed_strategy)
        best_prompt = current_prompt
        best_score = 0.0
        best_version = 0
        consecutive_drops = 0
        prev_score = 0.0
        prev_prompt = current_prompt
        optimizer_reasoning = ""
        iteration = -1

        for iteration in range(self.max_iterations):
            logger.info(f"=== Iteration {iteration} ===")

            # Emit start event
            if event_callback:
                await self._emit(
                    event_callback,
                    IterationEvent(
                        "iteration_start",
                        {
                            "run_id": run_id,
                            "iteration": iteration,
                            "prompt": current_prompt,
                        },
                    ),
                )

            # Evaluate
            results = await self.evaluator.evaluate(
                prompt_template=current_prompt,
                test_cases=test_cases,
                score_fn=score_fn,
            )

            # Score
            report = self.scorer.compute(results)

            logger.info(
                f"  Score: {report.accuracy:.1%} "
                f"({report.passed}/{report.total} passed)"
            )

            # Compute diff (empty for v0)
            prompt_diff = ""
            if iteration > 0:
                prompt_diff = self.optimizer.generate_diff(prev_prompt, current_prompt)

            # Log to audit
            await self.audit_log.log_version(
                run_id=run_id,
                version=iteration,
                prompt_text=current_prompt,
                score=report.accuracy,
                passed=report.passed,
                failed=report.failed,
                failure_summary=report.failure_summary,
                optimizer_reasoning=optimizer_reasoning,
                prompt_diff=prompt_diff,
            )

            # Emit test_case_result events for each evaluated case
            if event_callback:
                for result in results:
                    await self._emit(
                        event_callback,
                        IterationEvent(
                            "test_case_result",
                            {
                                "id": str(uuid.uuid4()),
                                "input": result.input,
                                "expected": result.expected_output,
                                "actual": result.actual_output,
                                "passed": result.passed,
                                "timestamp": time.time(),
                                "latency": None,
                            },
                        ),
                    )

            # Emit end event — use "version" and "score" to match frontend expectations
            if event_callback:
                await self._emit(
                    event_callback,
                    IterationEvent(
                        "iteration_end",
                        {
                            "run_id": run_id,
                            "version": iteration,
                            "score": report.accuracy,
                            "passed": report.passed,
                            "failed": report.failed,
                            "failure_clusters": [
                                c.model_dump() for c in report.failure_clusters
                            ],
                        },
                    ),
                )

            # Track best
            if report.accuracy > best_score:
                best_score = report.accuracy
                best_prompt = current_prompt
                best_version = iteration

            # Check target
            if report.accuracy >= self.accuracy_target:
                logger.info(f"  🎯 Target {self.accuracy_target:.0%} reached!")
                await self.audit_log.finish_run(run_id, "completed")
                break

            # Early stopping check
            if iteration > 0:
                if report.accuracy < prev_score:
                    consecutive_drops += 1
                    if consecutive_drops >= self.early_stop_patience:
                        logger.info(
                            f"  ⚠️ Early stopping: {consecutive_drops} consecutive drops. "
                            f"Reverting to best (v{best_version}, {best_score:.1%})"
                        )
                        await self.audit_log.finish_run(run_id, "early_stopped")
                        break
                else:
                    consecutive_drops = 0

            prev_score = report.accuracy

            # Optimize (get improved prompt)
            if iteration < self.max_iterations - 1:
                # Gather passing examples for the optimizer
                passing = [
                    {"input": r.input, "expected": r.expected_output}
                    for r in results
                    if r.passed
                ]
                prev_prompt = current_prompt
                new_prompt, optimizer_reasoning = await self.optimizer.optimize(
                    current_prompt=current_prompt,
                    score_report=report,
                    passing_examples=passing,
                    version=iteration,
                    target=self.accuracy_target,
                )
                current_prompt = new_prompt
        else:
            # Max iterations reached
            logger.info(f"  Max iterations ({self.max_iterations}) reached.")
            await self.audit_log.finish_run(run_id, "max_iterations")

        elapsed = time.time() - start_time
        total_iterations_run = min(iteration + 1, self.max_iterations) if self.max_iterations > 0 else 0

        summary = {
            "run_id": run_id,
            "task_id": task.task_id,
            "status": "completed",
            "total_iterations": total_iterations_run,
            "best_score": best_score,
            "best_version": best_version,
            "best_prompt": best_prompt,
            "accuracy_target": self.accuracy_target,
            "time_elapsed_seconds": round(elapsed, 1),
            "llm_provider": self.llm.provider,
        }

        # Emit completion event
        if event_callback:
            await self._emit(event_callback, IterationEvent("run_complete", summary))

        return summary

    async def _emit(
        self, callback: Callable[[IterationEvent], Any], event: IterationEvent
    ) -> None:
        """Safely emit an event."""
        try:
            result = callback(event)
            if asyncio.iscoroutine(result):
                await result
        except Exception as exc:
            logger.error(f"Event callback error: {exc}")

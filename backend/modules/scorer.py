"""
Scorer & Diagnostics — computes accuracy, clusters failures, and generates feedback.
"""

import re
from typing import Callable
from pydantic import BaseModel
from backend.modules.evaluator import EvalResult


class FailureCluster(BaseModel):
    """A cluster of failures with a common pattern."""

    category: str  # wrong_format, wrong_content, hallucination, refusal
    count: int
    examples: list[dict]  # [{input, expected, actual}]


class ScoreReport(BaseModel):
    """Comprehensive score report for an evaluation run."""

    accuracy: float
    total: int
    passed: int
    failed: int
    must_pass_total: int
    must_pass_failed: int
    failure_clusters: list[FailureCluster]
    failure_summary: str  # Human-readable summary for the optimizer


class Scorer:
    """
    Computes accuracy and clusters failures by type.
    Provides scoring functions for different evaluation methods.
    """

    # ── Scoring Functions ─────────────────────────────────────────────────

    @staticmethod
    def exact_match(expected: str, actual: str) -> bool:
        """Case-insensitive exact match after normalization."""
        return expected.strip().lower() == actual.strip().lower()

    @staticmethod
    def contains_match(expected: str, actual: str) -> bool:
        """Check if actual output contains the expected string."""
        return expected.strip().lower() in actual.strip().lower()

    @staticmethod
    def regex_match(expected: str, actual: str) -> bool:
        """Check if actual output matches the expected regex pattern."""
        try:
            return bool(re.search(expected.strip(), actual.strip(), re.IGNORECASE))
        except re.error:
            return False

    @staticmethod
    def f1_score(expected: str, actual: str) -> bool:
        """Token-overlap F1 score. Returns True if F1 >= 0.5."""
        expected_tokens = set(expected.strip().lower().split())
        actual_tokens = set(actual.strip().lower().split())
        if not expected_tokens or not actual_tokens:
            return False
        intersection = expected_tokens & actual_tokens
        if not intersection:
            return False
        precision = len(intersection) / len(actual_tokens)
        recall = len(intersection) / len(expected_tokens)
        f1 = 2 * precision * recall / (precision + recall)
        return f1 >= 0.5

    @staticmethod
    def get_scoring_function(method: str) -> Callable[[str, str], bool]:
        """Get the scoring function for the given evaluation method."""
        scoring_fns = {
            "exact_match": Scorer.exact_match,
            "contains_match": Scorer.contains_match,
            "regex": Scorer.regex_match,
            "f1_score": Scorer.f1_score,
            # llm_judge is handled separately in the evaluator
        }
        if method not in scoring_fns:
            raise ValueError(
                f"Unknown evaluation method: {method}. "
                f"Available: {list(scoring_fns.keys())}"
            )
        return scoring_fns[method]

    # ── Score Computation ─────────────────────────────────────────────────

    def compute(self, results: list[EvalResult]) -> ScoreReport:
        """Compute a full score report from evaluation results."""
        total = len(results)
        passed = sum(1 for r in results if r.passed)
        failed = total - passed
        accuracy = passed / total if total > 0 else 0.0

        must_pass_total = sum(1 for r in results if r.must_pass)
        must_pass_failed = sum(1 for r in results if r.must_pass and not r.passed)

        # Cluster failures
        failures = [r for r in results if not r.passed]
        clusters = self._cluster_failures(failures)

        # Generate summary
        summary = self._generate_failure_summary(accuracy, failures, clusters)

        return ScoreReport(
            accuracy=round(accuracy, 4),
            total=total,
            passed=passed,
            failed=failed,
            must_pass_total=must_pass_total,
            must_pass_failed=must_pass_failed,
            failure_clusters=clusters,
            failure_summary=summary,
        )

    def _cluster_failures(self, failures: list[EvalResult]) -> list[FailureCluster]:
        """Classify failures into categories."""
        categories: dict[str, list[dict]] = {
            "wrong_format": [],
            "wrong_content": [],
            "refusal": [],
            "error": [],
        }

        for f in failures:
            actual = f.actual_output.strip().lower()

            if f.error:
                categories["error"].append(self._failure_example(f))
            elif self._is_refusal(actual):
                categories["refusal"].append(self._failure_example(f))
            elif self._is_format_mismatch(f.expected_output, f.actual_output):
                categories["wrong_format"].append(self._failure_example(f))
            else:
                categories["wrong_content"].append(self._failure_example(f))

        clusters = []
        for cat, examples in categories.items():
            if examples:
                clusters.append(
                    FailureCluster(
                        category=cat,
                        count=len(examples),
                        examples=examples[:5],  # Cap at 5 examples per cluster
                    )
                )

        return sorted(clusters, key=lambda c: c.count, reverse=True)

    def _failure_example(self, result: EvalResult) -> dict:
        return {
            "input": result.input[:200],
            "expected": result.expected_output[:200],
            "actual": result.actual_output[:200],
        }

    def _is_refusal(self, output: str) -> bool:
        """Check if the output is a refusal."""
        refusal_indicators = [
            "i cannot",
            "i can't",
            "i'm unable",
            "i am unable",
            "as an ai",
            "i don't have",
            "i do not have",
            "i'm not able",
            "i apologize",
            "sorry, i cannot",
        ]
        return any(indicator in output for indicator in refusal_indicators)

    def _is_format_mismatch(self, expected: str, actual: str) -> bool:
        """
        Heuristic: if expected looks like a specific format (JSON, single word, number)
        but actual doesn't match that shape, it's a format issue.
        """
        expected_s = expected.strip()
        actual_s = actual.strip()

        # Expected is JSON-like but actual isn't
        if expected_s.startswith("{") and not actual_s.startswith("{"):
            return True
        if expected_s.startswith("[") and not actual_s.startswith("["):
            return True

        # Expected is a single word/label but actual is multi-sentence
        if len(expected_s.split()) <= 2 and len(actual_s.split()) > 10:
            return True

        return False

    def _generate_failure_summary(
        self,
        accuracy: float,
        failures: list[EvalResult],
        clusters: list[FailureCluster],
    ) -> str:
        """Generate a human-readable failure summary for the optimizer."""
        if not failures:
            return "All test cases passed."

        lines = [
            f"Accuracy: {accuracy:.1%} ({len(failures)} failures)",
            "",
            "Failure breakdown:",
        ]
        for cluster in clusters:
            lines.append(f"  - {cluster.category}: {cluster.count} cases")
            for ex in cluster.examples[:3]:
                lines.append(f"    Input: {ex['input'][:100]}")
                lines.append(f"    Expected: {ex['expected'][:100]}")
                lines.append(f"    Got: {ex['actual'][:100]}")
                lines.append("")

        return "\n".join(lines)

"""Tests for the Scorer module."""

import pytest
from backend.modules.scorer import Scorer
from backend.modules.evaluator import EvalResult


class TestScoringFunctions:
    def test_exact_match_pass(self):
        assert Scorer.exact_match("positive", "Positive") is True

    def test_exact_match_fail(self):
        assert Scorer.exact_match("positive", "negative") is False

    def test_exact_match_whitespace(self):
        assert Scorer.exact_match("  positive  ", "positive") is True

    def test_contains_match_pass(self):
        assert Scorer.contains_match("42", "The answer is 42.") is True

    def test_contains_match_fail(self):
        assert Scorer.contains_match("42", "The answer is 43.") is False

    def test_regex_match_pass(self):
        assert Scorer.regex_match(r"\d{3}-\d{4}", "Call 555-1234 now") is True

    def test_regex_match_fail(self):
        assert Scorer.regex_match(r"^\d+$", "no numbers here") is False

    def test_f1_score_pass(self):
        # Significant overlap
        assert Scorer.f1_score("the cat sat on the mat", "the cat on the mat") is True

    def test_f1_score_fail(self):
        # No overlap
        assert Scorer.f1_score("hello world", "foo bar baz") is False

    def test_get_scoring_function(self):
        fn = Scorer.get_scoring_function("exact_match")
        assert callable(fn)
        assert fn("hello", "HELLO") is True

    def test_get_scoring_function_invalid(self):
        with pytest.raises(ValueError, match="Unknown"):
            Scorer.get_scoring_function("nonexistent_method")


class TestScoreReport:
    def test_all_pass(self):
        results = [
            EvalResult(input="a", expected_output="x", actual_output="x", passed=True),
            EvalResult(input="b", expected_output="y", actual_output="y", passed=True),
        ]
        scorer = Scorer()
        report = scorer.compute(results)
        assert report.accuracy == 1.0
        assert report.passed == 2
        assert report.failed == 0
        assert len(report.failure_clusters) == 0

    def test_partial_pass(self):
        results = [
            EvalResult(input="a", expected_output="x", actual_output="x", passed=True),
            EvalResult(input="b", expected_output="y", actual_output="z", passed=False),
            EvalResult(input="c", expected_output="w", actual_output="w", passed=True),
            EvalResult(
                input="d", expected_output="v", actual_output="nope", passed=False
            ),
        ]
        scorer = Scorer()
        report = scorer.compute(results)
        assert report.accuracy == 0.5
        assert report.passed == 2
        assert report.failed == 2

    def test_must_pass_tracking(self):
        results = [
            EvalResult(
                input="a",
                expected_output="x",
                actual_output="y",
                passed=False,
                must_pass=True,
            ),
            EvalResult(
                input="b",
                expected_output="y",
                actual_output="y",
                passed=True,
                must_pass=False,
            ),
        ]
        scorer = Scorer()
        report = scorer.compute(results)
        assert report.must_pass_total == 1
        assert report.must_pass_failed == 1

    def test_refusal_detection(self):
        results = [
            EvalResult(
                input="a",
                expected_output="x",
                actual_output="I cannot provide that information",
                passed=False,
            ),
        ]
        scorer = Scorer()
        report = scorer.compute(results)
        assert len(report.failure_clusters) == 1
        assert report.failure_clusters[0].category == "refusal"

    def test_format_mismatch_detection(self):
        results = [
            EvalResult(
                input="a",
                expected_output='{"key": "value"}',
                actual_output="The key is value and it means something important in the context",
                passed=False,
            ),
        ]
        scorer = Scorer()
        report = scorer.compute(results)
        assert len(report.failure_clusters) == 1
        assert report.failure_clusters[0].category == "wrong_format"

    def test_failure_summary_generated(self):
        results = [
            EvalResult(input="a", expected_output="x", actual_output="y", passed=False),
        ]
        scorer = Scorer()
        report = scorer.compute(results)
        assert "Accuracy" in report.failure_summary
        assert "1 failures" in report.failure_summary

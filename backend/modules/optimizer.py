"""
Optimizer — the meta-prompt engine that rewrites prompts to fix failures.
The core innovation of APE.
"""

import logging
from backend.llm.llm_router import LLMRouter
from backend.modules.scorer import ScoreReport

logger = logging.getLogger(__name__)


# ── The Meta-Prompt ───────────────────────────────────────────────────────

META_PROMPT = """You are an expert prompt engineer. Your job is to rewrite an LLM prompt to improve its accuracy on a specific task.

## Current Prompt (Version {version})
```
{current_prompt}
```

## Current Performance
- Accuracy: {accuracy:.1%} ({passed}/{total} test cases passed)
- Target: {target:.0%}

## Failure Analysis
{failure_summary}

## Rewriting Guidelines
Based on the failure patterns above, apply the most appropriate strategies:

1. **Clarification injection** — If failures show ambiguity, add more specific instructions.
2. **Negative examples** — If the model keeps making the same mistake, add "Do NOT..." clauses.
3. **Output format enforcement** — If format failures dominate, add explicit format requirements.
4. **Few-shot examples** — If the model doesn't understand the task, add 2-3 examples from the passing cases below.
5. **Constraint addition** — Add length limits, language constraints, or domain restrictions if needed.
6. **Role refinement** — If the persona isn't helping, sharpen or change it.

## Passing Examples (for reference)
{passing_examples}

## Rules
- Return ONLY the new prompt text, nothing else.
- The prompt must contain {{input}} as a placeholder for the test case input.
- Do NOT explain your changes — just output the improved prompt.
- Keep the prompt as concise as possible while fixing the failures.
- Focus on fixing the most common failure pattern first.
"""


class Optimizer:
    """
    Meta-prompt engine that rewrites prompts based on failure analysis.
    Only sees failure cases (not full dataset) to prevent overfitting.
    """

    def __init__(self, llm: LLMRouter):
        self.llm = llm

    async def optimize(
        self,
        current_prompt: str,
        score_report: ScoreReport,
        passing_examples: list[dict],
        version: int,
        target: float,
    ) -> tuple[str, str]:
        """
        Generate an improved prompt based on failure analysis.

        Returns:
            (new_prompt, reasoning) — the rewritten prompt and the meta-prompt used.
        """
        # Select a few passing examples for few-shot reference
        example_text = self._format_passing_examples(passing_examples[:5])

        # Build the meta-prompt
        meta_prompt = META_PROMPT.format(
            version=version,
            current_prompt=current_prompt,
            accuracy=score_report.accuracy,
            passed=score_report.passed,
            total=score_report.total,
            target=target,
            failure_summary=score_report.failure_summary,
            passing_examples=example_text,
        )

        logger.info(
            f"Optimizer: Generating v{version + 1} (current accuracy: {score_report.accuracy:.1%})"
        )

        # Call the LLM with the meta-prompt
        new_prompt = await self.llm.generate(meta_prompt)

        # Clean up — remove markdown code fences if the LLM wrapped it
        new_prompt = self._clean_prompt(new_prompt)

        # Validate that the new prompt still has {input} placeholder
        if "{input}" not in new_prompt:
            logger.warning(
                "Optimizer output missing {input} placeholder — injecting it"
            )
            new_prompt += "\n\nInput: {input}\n\nProvide your answer and nothing else."

        return new_prompt, meta_prompt

    def _format_passing_examples(self, examples: list[dict]) -> str:
        """Format passing examples for the meta-prompt."""
        if not examples:
            return "(No passing examples available)"

        lines = []
        for i, ex in enumerate(examples, 1):
            lines.append(f"Example {i}:")
            lines.append(f"  Input: {ex.get('input', '')[:200]}")
            lines.append(f"  Expected Output: {ex.get('expected', '')[:200]}")
            lines.append("")
        return "\n".join(lines)

    def _clean_prompt(self, prompt: str) -> str:
        """Remove markdown code fences and other wrapper artifacts."""
        prompt = prompt.strip()

        # Remove ```[lang]\n...\n``` wrapping
        if prompt.startswith("```") and prompt.endswith("```"):
            lines = prompt.split("\n")
            # Remove first line (fence + optional language tag) and last line (closing fence)
            lines = lines[1:-1]
            prompt = "\n".join(lines).strip()

        return prompt

    def generate_diff(self, old_prompt: str, new_prompt: str) -> str:
        """Generate a simple text diff between two prompts."""
        old_lines = old_prompt.strip().splitlines()
        new_lines = new_prompt.strip().splitlines()

        diff_lines: list[str] = []

        # Simple line-by-line comparison
        max_lines = max(len(old_lines), len(new_lines))
        for i in range(max_lines):
            old_line = old_lines[i] if i < len(old_lines) else ""
            new_line = new_lines[i] if i < len(new_lines) else ""

            if old_line == new_line:
                diff_lines.append(f"  {old_line}")
            else:
                if old_line:
                    diff_lines.append(f"- {old_line}")
                if new_line:
                    diff_lines.append(f"+ {new_line}")

        return "\n".join(diff_lines)

"""
Dataset Manager — loads, validates, and splits test case datasets.
"""

import csv
import json
import random
from pathlib import Path

from pydantic import BaseModel
from backend.config import DATASETS_DIR


class DataTestCase(BaseModel):
    """A single test case with input, expected output, and metadata."""

    input: str
    expected_output: str
    must_pass: bool = False
    tags: list[str] = []


class DatasetSplit(BaseModel):
    """Train/test split of a dataset."""

    train: list[DataTestCase]
    test: list[DataTestCase]
    total: int
    must_pass_count: int


class DatasetManager:
    """Loads and manages test case datasets."""

    def __init__(self, datasets_dir: Path = DATASETS_DIR):
        self.datasets_dir = datasets_dir

    def load(
        self,
        filename: str,
        test_ratio: float = 0.2,
        seed: int = 42,
    ) -> DatasetSplit:
        """
        Load a dataset from CSV or JSON file.
        Returns a train/test split.
        """
        path = self.datasets_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found: {path}")

        if path.suffix == ".json":
            cases = self._load_json(path)
        elif path.suffix == ".csv":
            cases = self._load_csv(path)
        else:
            raise ValueError(f"Unsupported file format: {path.suffix}")

        # Validate
        cases = self._validate(cases)

        # Split
        rng = random.Random(seed)
        shuffled = cases.copy()
        rng.shuffle(shuffled)

        split_idx = max(1, int(len(shuffled) * (1 - test_ratio)))
        train = shuffled[:split_idx]
        test = shuffled[split_idx:]

        must_pass_count = sum(1 for c in cases if c.must_pass)

        return DatasetSplit(
            train=train,
            test=test,
            total=len(cases),
            must_pass_count=must_pass_count,
        )

    def load_all(self, filename: str) -> list[DataTestCase]:
        """Load all test cases without splitting."""
        path = self.datasets_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found: {path}")

        if path.suffix == ".json":
            cases = self._load_json(path)
        elif path.suffix == ".csv":
            cases = self._load_csv(path)
        else:
            raise ValueError(f"Unsupported file format: {path.suffix}")

        return self._validate(cases)

    def _load_json(self, path: Path) -> list[DataTestCase]:
        """Load test cases from a JSON file."""
        with open(path, "r") as f:
            raw = json.load(f)
        if not isinstance(raw, list):
            raise ValueError(f"JSON dataset must be a list, got {type(raw).__name__}")
        return [DataTestCase(**item) for item in raw]

    def _load_csv(self, path: Path) -> list[DataTestCase]:
        """Load test cases from a CSV file."""
        cases: list[DataTestCase] = []
        with open(path, "r", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                must_pass = row.get("must_pass", "false").lower() in (
                    "true",
                    "1",
                    "yes",
                )
                tags_raw = row.get("tags", "")
                tags = (
                    [t.strip() for t in tags_raw.split(",") if t.strip()]
                    if tags_raw
                    else []
                )
                cases.append(
                    DataTestCase(
                        input=row["input"],
                        expected_output=row["expected_output"],
                        must_pass=must_pass,
                        tags=tags,
                    )
                )
        return cases

    def _validate(self, cases: list[DataTestCase]) -> list[DataTestCase]:
        """Validate and deduplicate test cases."""
        if not cases:
            raise ValueError("Dataset is empty")

        # Remove duplicates by (input, expected_output)
        seen: set[tuple[str, str]] = set()
        unique: list[DataTestCase] = []
        for case in cases:
            if not case.input.strip():
                continue  # Skip empty inputs
            if not case.expected_output.strip():
                continue  # Skip empty outputs
            key = (case.input.strip(), case.expected_output.strip())
            if key not in seen:
                seen.add(key)
                unique.append(case)

        if not unique:
            raise ValueError("Dataset has no valid test cases after validation")

        return unique

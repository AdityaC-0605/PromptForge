"""Tests for the Dataset Manager module."""

import json

import pytest
from backend.modules.dataset_manager import DatasetManager, TestCase


@pytest.fixture
def tmp_datasets(tmp_path):
    """Create temporary dataset files for testing."""
    # JSON dataset
    json_data = [
        {"input": "I love this movie", "expected_output": "positive"},
        {"input": "Terrible film", "expected_output": "negative"},
        {"input": "Great acting", "expected_output": "positive"},
        {"input": "Boring plot", "expected_output": "negative"},
        {"input": "Outstanding", "expected_output": "positive"},
        {"input": "Awful waste of time", "expected_output": "negative"},
        {"input": "Beautiful cinematography", "expected_output": "positive"},
        {"input": "Bad dialogue", "expected_output": "negative"},
        {"input": "Highly recommend", "expected_output": "positive"},
        {"input": "Do not watch", "expected_output": "negative"},
    ]
    json_path = tmp_path / "test_dataset.json"
    with open(json_path, "w") as f:
        json.dump(json_data, f)

    # CSV dataset
    csv_path = tmp_path / "test_dataset.csv"
    with open(csv_path, "w") as f:
        f.write("input,expected_output,must_pass\n")
        f.write("Hello world,greeting,true\n")
        f.write("Goodbye,farewell,false\n")
        f.write("Thanks,gratitude,false\n")

    return tmp_path


class TestDatasetManager:
    def test_load_json(self, tmp_datasets):
        dm = DatasetManager(datasets_dir=tmp_datasets)
        split = dm.load("test_dataset.json", test_ratio=0.2)
        assert split.total == 10
        assert len(split.train) + len(split.test) == 10

    def test_load_csv(self, tmp_datasets):
        dm = DatasetManager(datasets_dir=tmp_datasets)
        split = dm.load("test_dataset.csv", test_ratio=0.33)
        assert split.total == 3
        assert split.must_pass_count == 1

    def test_load_all(self, tmp_datasets):
        dm = DatasetManager(datasets_dir=tmp_datasets)
        cases = dm.load_all("test_dataset.json")
        assert len(cases) == 10
        assert all(isinstance(c, TestCase) for c in cases)

    def test_deduplication(self, tmp_datasets):
        # Create dataset with duplicates
        dup_data = [
            {"input": "Same input", "expected_output": "same output"},
            {"input": "Same input", "expected_output": "same output"},
            {"input": "Different", "expected_output": "output"},
        ]
        dup_path = tmp_datasets / "dup_dataset.json"
        with open(dup_path, "w") as f:
            json.dump(dup_data, f)

        dm = DatasetManager(datasets_dir=tmp_datasets)
        cases = dm.load_all("dup_dataset.json")
        assert len(cases) == 2  # Deduped

    def test_empty_dataset_raises(self, tmp_datasets):
        empty_path = tmp_datasets / "empty.json"
        with open(empty_path, "w") as f:
            json.dump([], f)

        dm = DatasetManager(datasets_dir=tmp_datasets)
        with pytest.raises(ValueError, match="empty"):
            dm.load_all("empty.json")

    def test_file_not_found(self, tmp_datasets):
        dm = DatasetManager(datasets_dir=tmp_datasets)
        with pytest.raises(FileNotFoundError):
            dm.load_all("nonexistent.json")

    def test_split_ratio(self, tmp_datasets):
        dm = DatasetManager(datasets_dir=tmp_datasets)
        split = dm.load("test_dataset.json", test_ratio=0.3)
        # With 10 items and 0.3 test ratio, we expect ~7 train / ~3 test
        assert len(split.train) == 7
        assert len(split.test) == 3

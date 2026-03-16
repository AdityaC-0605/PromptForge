"""Tests for the FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestAPI:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "APE" in data["name"]

    def test_list_tasks(self, client):
        resp = client.get("/api/tasks")
        assert resp.status_code == 200
        tasks = resp.json()
        assert isinstance(tasks, list)
        assert len(tasks) >= 5
        task_ids = [t["task_id"] for t in tasks]
        assert "sentiment_classification" in task_ids
        assert "math_word_problems" in task_ids

    def test_get_task(self, client):
        resp = client.get("/api/tasks/sentiment_classification")
        assert resp.status_code == 200
        task = resp.json()
        assert task["task_id"] == "sentiment_classification"
        assert task["task_type"] == "classification"

    def test_get_task_not_found(self, client):
        resp = client.get("/api/tasks/nonexistent_task")
        assert resp.status_code == 404

    def test_list_runs_empty(self, client):
        resp = client.get("/api/runs")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

"""
Ollama local LLM client.
Communicates with the Ollama HTTP API at localhost:11434.
"""

import asyncio
import httpx
from backend.config import (
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    RATE_LIMIT_BACKOFF_BASE,
    RATE_LIMIT_MAX_RETRIES,
)


class OllamaClient:
    """Async wrapper around the Ollama REST API."""

    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def is_available(self) -> bool:
        """Check if Ollama is running and reachable."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except (httpx.ConnectError, httpx.TimeoutException):
            return False

    async def generate(self, prompt: str, model: str | None = None) -> str:
        """
        Generate a completion from Ollama.
        Retries with exponential backoff on transient failures.
        """
        model = model or self.model
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.3},
        }

        last_error: Exception | None = None
        for attempt in range(RATE_LIMIT_MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(
                        f"{self.base_url}/api/generate",
                        json=payload,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    return data.get("response", "").strip()
            except (
                httpx.HTTPStatusError,
                httpx.ConnectError,
                httpx.TimeoutException,
            ) as exc:
                last_error = exc
                wait = RATE_LIMIT_BACKOFF_BASE ** (attempt + 1)
                await asyncio.sleep(wait)

        raise RuntimeError(
            f"Ollama generation failed after {RATE_LIMIT_MAX_RETRIES} retries: {last_error}"
        )

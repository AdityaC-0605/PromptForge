"""
Google Gemini API client.
Uses the google-genai SDK with free-tier rate limiting (15 RPM).
"""

import asyncio
import time
from google import genai
from google.genai import types
from backend.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_RPM_LIMIT,
    RATE_LIMIT_MAX_RETRIES,
)


class GeminiClient:
    """Async-compatible wrapper around the Google GenAI SDK."""

    def __init__(self, api_key: str = GEMINI_API_KEY, model: str = GEMINI_MODEL):
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set. "
                "Export it as an env var or configure it in config.py."
            )
        self.model = model
        self.client = genai.Client(api_key=api_key)
        # Simple rate limiter state
        self._call_timestamps: list[float] = []
        self._rpm_limit = GEMINI_RPM_LIMIT
        self._lock = asyncio.Lock()

    async def _wait_for_rate_limit(self) -> None:
        """Enforce RPM rate limit by sleeping if needed."""
        async with self._lock:
            now = time.monotonic()
            # Remove timestamps older than 60s
            self._call_timestamps = [t for t in self._call_timestamps if now - t < 60]
            if len(self._call_timestamps) >= self._rpm_limit:
                oldest = self._call_timestamps[0]
                sleep_time = 60 - (now - oldest) + 0.5
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)
            self._call_timestamps.append(time.monotonic())

    async def is_available(self) -> bool:
        """Check if Gemini API key is configured."""
        return bool(GEMINI_API_KEY)

    async def generate(self, prompt: str) -> str:
        """
        Generate a completion from Gemini.
        Handles rate limiting and retries on quota errors.
        """
        last_error: Exception | None = None
        for attempt in range(RATE_LIMIT_MAX_RETRIES):
            await self._wait_for_rate_limit()
            try:
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                    ),
                )
                return response.text.strip() if response.text else ""
            except Exception as exc:
                last_error = exc
                error_str = str(exc).lower()
                if "quota" in error_str or "rate" in error_str or "429" in error_str:
                    wait = min(2 ** (attempt + 2), 60)
                    await asyncio.sleep(wait)
                else:
                    raise

        raise RuntimeError(
            f"Gemini generation failed after {RATE_LIMIT_MAX_RETRIES} retries: {last_error}"
        )

"""
LLM Router — unified interface that auto-detects available backend.
Priority: Ollama (local) → Gemini (cloud).
"""

import logging
from backend.config import LLM_PROVIDER, GEMINI_API_KEY
from backend.llm.ollama_client import OllamaClient
from backend.llm.gemini_client import GeminiClient

logger = logging.getLogger(__name__)


class LLMRouter:
    """
    Unified LLM interface. Auto-detects Ollama availability,
    falls back to Gemini.
    """

    def __init__(self) -> None:
        self._ollama = OllamaClient()
        self._gemini: GeminiClient | None = None
        self._active_provider: str | None = None
        self._active_client: OllamaClient | GeminiClient | None = None

    async def initialize(self) -> str:
        """
        Detect available provider and set up the active client.
        Returns the name of the selected provider.
        """
        provider = LLM_PROVIDER.lower()

        if provider == "ollama" or provider == "auto":
            if await self._ollama.is_available():
                self._active_client = self._ollama
                self._active_provider = "ollama"
                logger.info("LLM Router: Using Ollama (local)")
                return "ollama"
            elif provider == "ollama":
                raise RuntimeError(
                    "Ollama was explicitly requested but is not available at "
                    f"{self._ollama.base_url}"
                )

        # Fall back to Gemini
        if GEMINI_API_KEY:
            self._gemini = GeminiClient()
            self._active_client = self._gemini
            self._active_provider = "gemini"
            logger.info("LLM Router: Using Gemini (cloud)")
            return "gemini"

        if provider == "gemini":
            raise RuntimeError(
                "Gemini was explicitly requested but GEMINI_API_KEY is not set."
            )

        raise RuntimeError(
            "No LLM backend available. Either start Ollama or set GEMINI_API_KEY."
        )

    @property
    def provider(self) -> str:
        if not self._active_provider:
            raise RuntimeError("LLMRouter not initialized. Call initialize() first.")
        return self._active_provider

    async def generate(self, prompt: str) -> str:
        """Generate a completion using the active LLM backend."""
        if not self._active_client:
            await self.initialize()
        assert self._active_client is not None
        return await self._active_client.generate(prompt)


# Module-level singleton
_router: LLMRouter | None = None


async def get_llm_router() -> LLMRouter:
    """Get or create the global LLM router singleton."""
    global _router
    if _router is None:
        router = LLMRouter()
        await router.initialize()
        _router = router
    return _router

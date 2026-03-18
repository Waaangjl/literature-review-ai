"""
LLM abstraction layer — supports three providers:

  provider=ollama    → local Ollama (free, default for dev)
  provider=anthropic → Anthropic API (key per-request or from env)
  provider=openai    → OpenAI-compatible APIs (OpenAI, Groq, Together, etc.)

Priority for API key:
  1. key passed in at call-time (from user's browser)
  2. key in environment / config
"""

import asyncio
import httpx
from config import settings


class LLMClient:
    def __init__(self, provider: str | None = None, api_key: str | None = None):
        self.provider = provider or settings.llm_provider
        # per-request key overrides env key
        self.api_key = api_key or settings.llm_api_key

    async def complete(self, prompt: str, max_tokens: int = 1000) -> str:
        if self.provider == "ollama":
            return await self._ollama(prompt, max_tokens)
        elif self.provider == "anthropic":
            return await self._anthropic(prompt, max_tokens)
        elif self.provider in ("openai", "groq", "together"):
            return await self._openai_compat(prompt, max_tokens)
        elif self.provider == "claude-cli":
            return await self._claude_cli(prompt)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    # ── Ollama (local, free) ────────────────────────────────────────
    async def _ollama(self, prompt: str, max_tokens: int) -> str:
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.post(
                f"{settings.ollama_base_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"num_predict": max_tokens},
                },
            )
            resp.raise_for_status()
            return resp.json()["response"].strip()

    # ── Anthropic API ───────────────────────────────────────────────
    async def _anthropic(self, prompt: str, max_tokens: int) -> str:
        if not self.api_key:
            raise ValueError("Anthropic API key required")
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": settings.anthropic_model,
                    "max_tokens": max_tokens,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"].strip()

    # ── OpenAI-compatible (OpenAI / Groq / Together / etc.) ────────
    async def _openai_compat(self, prompt: str, max_tokens: int) -> str:
        if not self.api_key:
            raise ValueError(f"{self.provider} API key required")
        base_urls = {
            "openai": "https://api.openai.com/v1",
            "groq": "https://api.groq.com/openai/v1",
            "together": "https://api.together.xyz/v1",
        }
        url = settings.openai_base_url or base_urls.get(self.provider, "https://api.openai.com/v1")
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": settings.openai_model,
                    "max_tokens": max_tokens,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()

    # ── Claude CLI (claude -p) ──────────────────────────────────────
    async def _claude_cli(self, prompt: str) -> str:
        proc = await asyncio.create_subprocess_exec(
            "claude", "-p", prompt,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"claude -p failed: {stderr.decode().strip()}")
        return stdout.decode().strip()

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ── Provider selection ──────────────────────────────────────────
    # Options: "ollama" | "anthropic" | "openai" | "groq" | "together" | "claude-cli"
    llm_provider: str = "ollama"

    # ── API keys (leave blank if using ollama or claude-cli) ────────
    llm_api_key: Optional[str] = None          # generic fallback
    semantic_scholar_api_key: Optional[str] = None

    # ── Ollama settings ─────────────────────────────────────────────
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:14b"

    # ── Anthropic settings ──────────────────────────────────────────
    anthropic_model: str = "claude-sonnet-4-6"

    # ── OpenAI-compatible settings ──────────────────────────────────
    openai_model: str = "gpt-4o-mini"
    openai_base_url: Optional[str] = None      # override for Groq/Together/etc.

    class Config:
        env_file = ".env"


settings = Settings()

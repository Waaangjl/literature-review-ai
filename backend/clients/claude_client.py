import anthropic
from config import settings


class ClaudeClient:
    """Thin wrapper around Anthropic async client."""

    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-sonnet-4-6"

    async def complete(self, prompt: str, max_tokens: int = 1000) -> str:
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

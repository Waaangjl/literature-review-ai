import asyncio


class ClaudeClient:
    """
    Calls the Claude CLI via `claude -p` instead of the Anthropic SDK.
    Requires `claude` to be installed and authenticated on the host machine.
    """

    async def complete(self, prompt: str, max_tokens: int = 1000) -> str:
        proc = await asyncio.create_subprocess_exec(
            "claude", "-p", prompt,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            err = stderr.decode().strip()
            raise RuntimeError(f"claude -p failed (exit {proc.returncode}): {err}")

        return stdout.decode().strip()

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    semantic_scholar_api_key: Optional[str] = None  # optional, raises rate limit without it

    class Config:
        env_file = ".env"


settings = Settings()

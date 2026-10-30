"""Environment-driven settings (`HARNESS_*` variables)."""

from functools import cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="HARNESS_")

    database_url: str = "postgresql+psycopg://harness:harness@localhost:5433/harness"


@cache
def get_settings() -> Settings:
    return Settings()

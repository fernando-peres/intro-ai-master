"""Environment-driven settings (`HARNESS_*` variables)."""

from functools import cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="HARNESS_")

    database_url: str = "postgresql+psycopg://harness:harness@localhost:5433/harness"
    #: Root of the local-disk asset store (git-ignored `var/`).
    asset_dir: Path = APP_DIR / "var" / "assets"


@cache
def get_settings() -> Settings:
    return Settings()

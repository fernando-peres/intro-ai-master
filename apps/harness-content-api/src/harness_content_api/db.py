"""SQLAlchemy engine, declarative base and the per-request session dependency."""

from collections.abc import Iterator
from functools import cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session

from harness_content_api.settings import get_settings


class Base(DeclarativeBase):
    pass


@cache
def get_engine() -> Engine:
    return create_engine(get_settings().database_url, pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    """FastAPI dependency; callers commit explicitly, anything uncommitted is rolled back."""
    with Session(get_engine()) as session:
        yield session

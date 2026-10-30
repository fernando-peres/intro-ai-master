"""Alembic environment: online migrations only.

An open connection passed in `config.attributes["connection"]` (tests) is used as-is;
otherwise one is opened from HARNESS_DATABASE_URL.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import Connection, create_engine

from harness_content_api import models  # noqa: F401  (registers tables on Base)
from harness_content_api.db import Base
from harness_content_api.settings import get_settings

config = context.config
if config.config_file_name and not config.attributes.get("connection"):
    fileConfig(config.config_file_name)


def _run(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()


connection = config.attributes.get("connection")
if connection is not None:
    _run(connection)
else:
    with create_engine(get_settings().database_url).connect() as connection:
        _run(connection)

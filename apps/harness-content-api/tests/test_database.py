from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, text
from sqlalchemy.orm import Session

ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"


def test_migrations_reach_head(connection: Connection):
    head = ScriptDirectory.from_config(Config(ALEMBIC_INI)).get_current_head()
    assert connection.scalar(text("SELECT version_num FROM alembic_version")) == head


def test_commit_inside_a_test_stays_visible_to_that_test(session: Session):
    session.execute(text("CREATE TABLE public.isolation_probe (id int)"))
    session.execute(text("INSERT INTO public.isolation_probe VALUES (1)"))
    session.commit()
    assert session.scalar(text("SELECT count(*) FROM public.isolation_probe")) == 1


def test_previous_test_was_rolled_back(session: Session):
    exists = session.scalar(text("SELECT to_regclass('public.isolation_probe')"))
    assert exists is None

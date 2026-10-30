"""Postgres-backed fixtures: one migrated test database, each test rolled back.

Tests are skipped (not failed) when Postgres is unreachable, so `uv run pytest` at the
root still works without Docker; run `docker compose up -d` in this app to enable them.
"""

import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Connection, Engine, create_engine, make_url, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from harness_content_api.db import get_session
from harness_content_api.main import app
from harness_content_api.seed import seed_users
from harness_content_api.settings import get_settings

APP_DIR = Path(__file__).resolve().parents[1]


def _test_url() -> str:
    explicit = os.environ.get("HARNESS_TEST_DATABASE_URL")
    if explicit:
        return explicit
    return (
        make_url(get_settings().database_url)
        .set(database="harness_test")
        .render_as_string(hide_password=False)
    )


def _ensure_database(url: str) -> None:
    target = make_url(url)
    admin = create_engine(target.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as conn:
            exists = conn.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": target.database}
            )
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{target.database}"'))
    finally:
        admin.dispose()


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    url = _test_url()
    try:
        _ensure_database(url)
    except OperationalError as error:
        pytest.skip(f"Postgres not reachable ({error.orig}); run `docker compose up -d`")
    engine = create_engine(url)
    config = Config(APP_DIR / "alembic.ini")
    with engine.begin() as conn:
        config.attributes["connection"] = conn
        command.upgrade(config, "head")
    yield engine
    engine.dispose()


@pytest.fixture
def connection(engine: Engine) -> Iterator[Connection]:
    with engine.connect() as conn:
        outer = conn.begin()
        yield conn
        outer.rollback()


@pytest.fixture
def session(connection: Connection) -> Iterator[Session]:
    """Commits inside the test become savepoints; the outer transaction is rolled back."""
    with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
        yield session


@pytest.fixture
def client(session: Session) -> Iterator[TestClient]:
    app.dependency_overrides[get_session] = lambda: session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_session, None)


class Api:
    """TestClient wrapper that sends `X-User-Id` and asserts the expected status."""

    def __init__(self, client: TestClient) -> None:
        self.client = client

    def call(self, method: str, user: str, url: str, expect: int = 200, **kwargs):
        headers = {"X-User-Id": user, **kwargs.pop("headers", {})}
        response = self.client.request(method, url, headers=headers, **kwargs)
        assert response.status_code == expect, response.text
        return response

    def get(self, user: str, url: str, expect: int = 200, **kwargs):
        return self.call("GET", user, url, expect, **kwargs)

    def post(self, user: str, url: str, json=None, expect: int = 200, **kwargs):
        return self.call("POST", user, url, expect, json=json, **kwargs)

    def patch(self, user: str, url: str, json=None, expect: int = 200, **kwargs):
        return self.call("PATCH", user, url, expect, json=json, **kwargs)

    def box(self, title: str = "Intro to AI") -> str:
        body = {"kind": "box", "title": title}
        return self.post("usr_author", "/api/v1/locations", body, expect=201).json()["id"]

    def artifact(self, locale: str = "en", content: dict | None = None, **fields) -> dict:
        kind = (content or {}).get("type", "slide")
        body = {
            "type": kind,
            "title": "How the Harness Evaluates",
            "locationId": self.box(),
            "locale": locale,
            "content": content or {"schemaVersion": 1, "type": "slide"},
            **fields,
        }
        return self.post("usr_author", "/api/v1/artifacts", body, expect=201).json()

    def edit(self, version_id: str, content: dict, user: str = "usr_author") -> dict:
        etag = self.get(user, f"/api/v1/artifact-versions/{version_id}").headers["ETag"]
        url = f"/api/v1/artifact-versions/{version_id}"
        return self.patch(user, url, {"content": content}, headers={"If-Match": etag}).json()

    def submit(self, version_id: str, user: str = "usr_author") -> str:
        url = f"/api/v1/artifact-versions/{version_id}/submit-review"
        return self.post(user, url, {}, expect=201).json()["id"]

    def approve(self, review_id: str, user: str = "usr_reviewer") -> dict:
        return self.post(user, f"/api/v1/reviews/{review_id}/approve", {}).json()

    def publish(self, version_id: str, comment: str = "First cut", **body) -> dict:
        url = f"/api/v1/artifact-versions/{version_id}/publish"
        return self.post("usr_reviewer", url, {"changeComment": comment, **body}).json()

    def ship(self, version_id: str, comment: str = "First cut", **body) -> dict:
        """Submit, approve and publish in one go."""
        self.approve(self.submit(version_id))
        return self.publish(version_id, comment, **body)

    def flow(self, title: str = "Onboarding path", locale: str = "en") -> str:
        body = {"title": title, "locale": locale}
        return self.post("usr_author", "/api/v1/flows", body, expect=201).json()["id"]

    def set_steps(self, flow_id: str, steps: list[dict], expect: int = 200):
        etag = self.post("usr_author", f"/api/v1/flows/{flow_id}/draft").headers["ETag"]
        url = f"/api/v1/flows/{flow_id}/draft"
        return self.patch(
            "usr_author", url, {"steps": steps}, headers={"If-Match": etag}, expect=expect
        )

    def publish_flow(self, flow_id: str, comment: str = "Ready", expect: int = 200):
        url = f"/api/v1/flows/{flow_id}/publish"
        return self.post("usr_reviewer", url, {"changeComment": comment}, expect=expect)

    def play(self, flow_id: str, revision_id: str, user: str = "usr_viewer") -> dict:
        url = f"/api/v1/flows/{flow_id}/revisions/{revision_id}/play"
        return self.get(user, url).json()

    def fork(self, artifact_id: str, from_version_id: str, locale: str | None = None) -> dict:
        url = f"/api/v1/artifacts/{artifact_id}/drafts?fromVersionId={from_version_id}"
        body = {"locale": locale} if locale else None
        return self.post("usr_author", url, body, expect=201).json()


@pytest.fixture
def api(client: TestClient, session: Session) -> Api:
    seed_users(session)
    return Api(client)

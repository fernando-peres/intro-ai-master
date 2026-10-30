"""Two reviewers publish two approved EN drafts at the same instant.

Uses real commits on separate connections (not the rolled-back fixture), then deletes
everything it created.
"""

import threading
from collections.abc import Iterator

import pytest
from sqlalchemy import Engine, delete
from sqlalchemy.orm import Session

from harness_content_api.models import (
    Artifact,
    ArtifactType,
    ArtifactVersion,
    AuditEvent,
    Location,
    ReviewRequest,
    User,
)
from harness_content_api.schemas import ArtifactCreate, LocationCreate
from harness_content_api.seed import seed_users
from harness_content_api.services import artifacts, locations, reviews


@pytest.fixture
def committed(engine: Engine) -> Iterator[Engine]:
    yield engine
    with Session(engine) as session:
        for model in (AuditEvent, ReviewRequest, ArtifactVersion, Artifact, Location, User):
            session.execute(delete(model))
        session.commit()


def _approved_drafts(engine: Engine) -> tuple[str, list[str]]:
    with Session(engine) as session:
        seed_users(session)
        author = session.get(User, "usr_author")
        reviewer = session.get(User, "usr_reviewer")
        box = locations.create(session, author, LocationCreate(kind="box", title="Race"))
        artifact, first = artifacts.create_artifact(
            session,
            author,
            ArtifactCreate(type=ArtifactType.SLIDE, title="Race", location_id=box.id, locale="en"),
        )
        second = artifacts.create_draft(session, author, artifact.id, None, "en")
        drafts = [first.id, second.id]
        for draft_id in drafts:
            review = reviews.submit(session, author, draft_id, None, "")
            reviews.approve(session, reviewer, review.id, "")
        session.commit()
        return artifact.id, drafts


def test_concurrent_publishes_get_distinct_numbers(committed: Engine):
    artifact_id, drafts = _approved_drafts(committed)
    barrier = threading.Barrier(len(drafts))
    errors: list[BaseException] = []

    def publish(draft_id: str, reviewer_id: str) -> None:
        try:
            with Session(committed) as session:
                reviewer = session.get(User, reviewer_id)
                barrier.wait()
                artifacts.publish(session, reviewer, draft_id, "Race", make_default=False)
                session.commit()
        except BaseException as error:
            errors.append(error)

    threads = [
        threading.Thread(target=publish, args=(draft_id, reviewer_id))
        for draft_id, reviewer_id in zip(drafts, ["usr_reviewer", "usr_reviewer2"], strict=True)
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=30)
    assert not errors, errors

    with Session(committed) as session:
        versions = [session.get(ArtifactVersion, draft_id) for draft_id in drafts]
        assert sorted(v.version_number for v in versions) == [1, 2]
        assert sum(v.is_default for v in versions) == 1
        assert {v.artifact_id for v in versions} == {artifact_id}

"""The demo library stays valid against the content schemas and the publish workflow."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from harness_content_api.models import Artifact, Flow, Location
from harness_content_api.seed import seed_demo


def _counts(session: Session) -> tuple[int | None, ...]:
    return tuple(
        session.scalar(select(func.count()).select_from(model))
        for model in (Location, Artifact, Flow)
    )


def test_demo_seed_is_complete_and_idempotent(api, session: Session):
    before = _counts(session)
    seed_demo(session)
    assert _counts(session) == tuple(
        (count or 0) + added for count, added in zip(before, (4, 7, 1), strict=True)
    )

    seed_demo(session)
    assert _counts(session)[1] == (before[1] or 0) + 7

    pending = api.get("usr_reviewer", "/api/v1/reviews").json()
    assert any(review["artifactTitle"] == "Writing clear instructions" for review in pending)

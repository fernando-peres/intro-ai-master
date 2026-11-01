from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from harness_content_api.auth import CurrentUser
from harness_content_api.db import get_session
from harness_content_api.models import ArtifactVersion, ReviewRequest, ReviewStatus
from harness_content_api.schemas import (
    ApproveAndPublish,
    ReviewDecision,
    ReviewListItem,
    ReviewOut,
    VersionOut,
)
from harness_content_api.services import artifacts, reviews

router = APIRouter(prefix="/api/v1/reviews", tags=["reviews"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[ReviewListItem])
def list_reviews(
    session: SessionDep,
    user: CurrentUser,
    status: ReviewStatus | None = None,
    version_id: Annotated[str | None, Query(alias="versionId")] = None,
) -> list[dict]:
    return reviews.list_reviews(session, user, status, version_id)


@router.post("/{review_id}/approve", response_model=ReviewOut)
def approve(
    session: SessionDep, user: CurrentUser, review_id: str, body: ReviewDecision
) -> ReviewRequest:
    review = reviews.approve(session, user, review_id, body.comment)
    session.commit()
    return review


@router.post("/{review_id}/request-changes", response_model=ReviewOut)
def request_changes(
    session: SessionDep, user: CurrentUser, review_id: str, body: ReviewDecision
) -> ReviewRequest:
    review = reviews.request_changes(session, user, review_id, body.comment)
    session.commit()
    return review


@router.post("/{review_id}/approve-and-publish", response_model=VersionOut)
def approve_and_publish(
    session: SessionDep, user: CurrentUser, review_id: str, body: ApproveAndPublish
) -> ArtifactVersion:
    """One transaction: if publishing fails, the review stays pending."""
    with session.begin_nested():
        review = reviews.approve(session, user, review_id, body.comment)
        version = artifacts.publish(
            session, user, review.version_id, body.change_comment, body.make_default
        )
    session.commit()
    return version

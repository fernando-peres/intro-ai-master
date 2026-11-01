"""Review requests. Approval is tied to the draft's content hash at submission.

Reviewers never decide their own submissions; admins may. An assigned reviewer
(`reviewer_id`) is the only non-admin who may decide that request.
"""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from harness_content_api.auth import EDITORS, PUBLISHERS, require
from harness_content_api.errors import Conflict, Forbidden, Invalid, NotFound
from harness_content_api.ids import new_id
from harness_content_api.models import (
    Artifact,
    ArtifactVersion,
    ReviewRequest,
    ReviewStatus,
    Role,
    User,
    VersionState,
)
from harness_content_api.services import audit, embeds
from harness_content_api.services.artifacts import content_hash
from harness_content_api.timestamps import utc_now


def get(session: Session, review_id: str, *, lock: bool = False) -> ReviewRequest:
    query = select(ReviewRequest).where(ReviewRequest.id == review_id)
    review = session.scalar(query.with_for_update() if lock else query)
    if review is None:
        raise NotFound("review_not_found", f"Review {review_id} does not exist")
    return review


def list_reviews(
    session: Session, user: User, status: ReviewStatus | None, version_id: str | None
) -> list[dict]:
    """Newest first, each with the artifact and locale it reviews."""
    require(user, EDITORS, "list reviews")
    query = (
        select(ReviewRequest, ArtifactVersion, Artifact)
        .join(ArtifactVersion, ArtifactVersion.id == ReviewRequest.version_id)
        .join(Artifact, Artifact.id == ArtifactVersion.artifact_id)
        .order_by(ReviewRequest.created_at.desc())
    )
    if status:
        query = query.where(ReviewRequest.status == status)
    if version_id:
        query = query.where(ReviewRequest.version_id == version_id)
    items = []
    for review, version, artifact in session.execute(query):
        fields = {c.key: getattr(review, c.key) for c in ReviewRequest.__mapper__.column_attrs}
        items.append(
            fields
            | {
                "artifact_id": artifact.id,
                "artifact_title": artifact.title,
                "artifact_type": artifact.type,
                "locale": version.locale,
            }
        )
    return items


def submit(
    session: Session, user: User, version_id: str, reviewer_id: str | None, comment: str
) -> ReviewRequest:
    require(user, EDITORS, "submit drafts for review")
    version = session.get(ArtifactVersion, version_id, with_for_update=True)
    if version is None:
        raise NotFound("version_not_found", f"Version {version_id} does not exist")
    if version.state != VersionState.DRAFT:
        raise Conflict("version_immutable", f"Version {version_id} is {version.state}")
    embeds.check_version(session, version)
    if reviewer_id is not None:
        reviewer = session.get(User, reviewer_id)
        if reviewer is None or reviewer.role not in PUBLISHERS:
            raise Invalid("invalid_reviewer", f"{reviewer_id} cannot review")
    review = ReviewRequest(
        id=new_id("rev"),
        version_id=version.id,
        submitted_by=user.id,
        reviewer_id=reviewer_id,
        status=ReviewStatus.PENDING,
        content_hash=content_hash(version),
        submit_comment=comment,
    )
    session.add(review)
    try:
        with session.begin_nested():
            session.flush()
    except IntegrityError as error:
        raise Conflict("review_pending", "This draft already has a pending review") from error
    audit.record(session, user, "review.submit", "review", review.id, versionId=version.id)
    return review


def _decide(
    session: Session, user: User, review_id: str, status: ReviewStatus, comment: str
) -> ReviewRequest:
    require(user, PUBLISHERS, "decide reviews")
    review = get(session, review_id, lock=True)
    if review.status != ReviewStatus.PENDING:
        raise Conflict("review_closed", f"Review {review_id} is already {review.status}")
    if user.role != Role.ADMIN:
        if review.submitted_by == user.id:
            raise Forbidden("self_review", "Reviewers cannot decide their own submissions")
        if review.reviewer_id not in (None, user.id):
            raise Forbidden("not_assigned", f"Review is assigned to {review.reviewer_id}")
    version = session.get(ArtifactVersion, review.version_id)
    if status == ReviewStatus.APPROVED and content_hash(version) != review.content_hash:
        raise Conflict("approval_stale", "The draft changed after submission; resubmit it")
    review.status = status
    review.decision_comment = comment
    review.decided_by = user.id
    review.decided_at = utc_now()
    session.flush()
    audit.record(session, user, f"review.{status.value}", "review", review.id)
    return review


def approve(session: Session, user: User, review_id: str, comment: str) -> ReviewRequest:
    return _decide(session, user, review_id, ReviewStatus.APPROVED, comment)


def request_changes(session: Session, user: User, review_id: str, comment: str) -> ReviewRequest:
    if not comment.strip():
        raise Invalid("comment_required", "Requesting changes needs a comment")
    return _decide(session, user, review_id, ReviewStatus.CHANGES_REQUESTED, comment)

"""Artifacts and their locale-specific versions (PRD §5.3).

Published and archived content is immutable. Publishing and default switches lock the
artifact row first, so version numbers and defaults are allocated one transaction at a time.
"""

import hashlib
import json
import re
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from harness_content_api.auth import EDITORS, PUBLISHERS, require
from harness_content_api.errors import (
    Conflict,
    Forbidden,
    Invalid,
    NotFound,
    PreconditionFailed,
    PreconditionRequired,
)
from harness_content_api.ids import new_id
from harness_content_api.models import (
    Artifact,
    ArtifactType,
    ArtifactVersion,
    ReviewRequest,
    ReviewStatus,
    Role,
    User,
    VersionState,
)
from harness_content_api.schemas import ArtifactCreate, ArtifactUpdate, VersionUpdate
from harness_content_api.services import audit, content, locations, templates, themes
from harness_content_api.timestamps import utc_now


def _slug(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "artifact"


def content_hash(version: ArtifactVersion) -> str:
    """SHA-256 of the canonical JSON of everything a reviewer approves."""
    payload = {
        "content": version.content,
        "componentManifest": version.component_manifest,
        "contentSchemaVersion": version.content_schema_version,
        "script": version.script,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode()).hexdigest()


def get_artifact(session: Session, artifact_id: str, *, lock: bool = False) -> Artifact:
    query = select(Artifact).where(Artifact.id == artifact_id)
    artifact = session.scalar(query.with_for_update() if lock else query)
    if artifact is None:
        raise NotFound("artifact_not_found", f"Artifact {artifact_id} does not exist")
    return artifact


def _version(session: Session, version_id: str, *, lock: bool = False) -> ArtifactVersion:
    query = select(ArtifactVersion).where(ArtifactVersion.id == version_id)
    version = session.scalar(query.with_for_update() if lock else query)
    if version is None:
        raise NotFound("version_not_found", f"Version {version_id} does not exist")
    return version


def _lock_for_change(session: Session, version_id: str) -> ArtifactVersion:
    """Lock the artifact row, then reload the version under a row lock."""
    version = _version(session, version_id)
    get_artifact(session, version.artifact_id, lock=True)
    session.refresh(version, with_for_update=True)
    return version


def get_version(session: Session, user: User, version_id: str) -> ArtifactVersion:
    version = _version(session, version_id)
    if user.role == Role.VIEWER and version.state == VersionState.DRAFT:
        raise Forbidden("forbidden", "Viewers can only read published content")
    return version


def derived_status(session: Session, artifact_id: str) -> str:
    states = set(
        session.scalars(
            select(ArtifactVersion.state).where(ArtifactVersion.artifact_id == artifact_id)
        )
    )
    if VersionState.PUBLISHED in states:
        return "has-published"
    if VersionState.DRAFT in states:
        return "draft-only"
    return "archived-only"


def defaults(session: Session, artifact_id: str) -> dict[str, str]:
    rows = session.execute(
        select(ArtifactVersion.locale, ArtifactVersion.id).where(
            ArtifactVersion.artifact_id == artifact_id, ArtifactVersion.is_default
        )
    )
    return {locale: version_id for locale, version_id in rows}


def describe(session: Session, artifact: Artifact) -> dict[str, Any]:
    """Artifact fields plus the derived `status` and per-locale `defaults`."""
    columns = {c.key: getattr(artifact, c.key) for c in Artifact.__mapper__.column_attrs}
    return columns | {
        "status": derived_status(session, artifact.id),
        "defaults": defaults(session, artifact.id),
    }


def _check_content(session: Session, artifact_type: str, body: dict) -> None:
    content.check(artifact_type, body)
    if artifact_type in (ArtifactType.SLIDE, ArtifactType.DIAGRAM):
        themes.check_slide(session, body)


def create_artifact(
    session: Session, user: User, data: ArtifactCreate
) -> tuple[Artifact, ArtifactVersion]:
    require(user, EDITORS, "create artifacts")
    locations.get_open(session, data.location_id)
    template = (
        templates.use(session, data.template_id, data.type.value) if data.template_id else None
    )
    fallback = template.content if template else content.empty_content(data.type.value)
    body = data.content if data.content is not None else fallback
    _check_content(session, data.type.value, body)
    artifact = Artifact(
        id=new_id("ra"),
        type=data.type,
        title=data.title,
        slug=_slug(data.title),
        description=data.description,
        location_id=data.location_id,
        tags=data.tags,
        meta=data.meta,
        instructional_design=data.instructional_design,
        resources=data.resources,
        created_by=user.id,
    )
    session.add(artifact)
    session.flush()
    draft = ArtifactVersion(
        id=new_id("rav"),
        artifact_id=artifact.id,
        locale=data.locale,
        state=VersionState.DRAFT,
        content=body,
        created_by=user.id,
    )
    session.add(draft)
    session.flush()
    audit.record(session, user, "artifact.create", "artifact", artifact.id, draftId=draft.id)
    return artifact, draft


def update_artifact(
    session: Session, user: User, artifact_id: str, data: ArtifactUpdate
) -> Artifact:
    require(user, EDITORS, "edit artifacts")
    artifact = get_artifact(session, artifact_id)
    fields = data.model_dump(exclude_unset=True)
    new_location = fields.get("location_id")
    if new_location and new_location != artifact.location_id:
        locations.get_open(session, new_location)
        audit.record(
            session,
            user,
            "artifact.move",
            "artifact",
            artifact.id,
            fromLocationId=artifact.location_id,
            toLocationId=new_location,
        )
    if "title" in fields:
        artifact.slug = _slug(fields["title"])
    for name, value in fields.items():
        setattr(artifact, name, value)
    session.flush()
    return artifact


def list_versions(
    session: Session, user: User, artifact_id: str, locale: str | None = None
) -> list[ArtifactVersion]:
    get_artifact(session, artifact_id)
    query = select(ArtifactVersion).where(ArtifactVersion.artifact_id == artifact_id)
    if locale:
        query = query.where(ArtifactVersion.locale == locale)
    if user.role == Role.VIEWER:
        query = query.where(ArtifactVersion.state != VersionState.DRAFT)
    query = query.order_by(
        ArtifactVersion.locale,
        ArtifactVersion.version_number.desc().nulls_first(),
        ArtifactVersion.created_at.desc(),
    )
    return list(session.scalars(query))


def resolve(session: Session, artifact_id: str, locale: str) -> ArtifactVersion:
    """The default published version for `locale`; no fallback to another locale."""
    get_artifact(session, artifact_id)
    version = session.scalar(
        select(ArtifactVersion).where(
            ArtifactVersion.artifact_id == artifact_id,
            ArtifactVersion.locale == locale,
            ArtifactVersion.is_default,
        )
    )
    if version is None:
        available = sorted(defaults(session, artifact_id))
        raise NotFound(
            "locale_unavailable",
            f"No default published version in '{locale}'",
            availableLocales=available,
        )
    return version


def create_draft(
    session: Session,
    user: User,
    artifact_id: str,
    from_version_id: str | None,
    locale: str | None,
) -> ArtifactVersion:
    """Fork `from_version_id` into a new draft; another `locale` makes it a translation."""
    require(user, EDITORS, "create drafts")
    artifact = get_artifact(session, artifact_id)
    draft = ArtifactVersion(
        id=new_id("rav"),
        artifact_id=artifact.id,
        state=VersionState.DRAFT,
        created_by=user.id,
    )
    if from_version_id:
        source = _version(session, from_version_id)
        if source.artifact_id != artifact.id:
            raise Invalid("version_mismatch", "fromVersionId belongs to another artifact")
        draft.locale = locale or source.locale
        draft.content = source.content
        draft.component_manifest = source.component_manifest
        draft.content_schema_version = source.content_schema_version
        draft.script = source.script
        if draft.locale == source.locale:
            draft.parent_version_id = source.id
        else:
            draft.source_version_id = source.id
    elif locale:
        draft.locale = locale
        draft.content = content.empty_content(artifact.type.value)
    else:
        raise Invalid("draft_source_required", "Pass fromVersionId, locale, or both")
    session.add(draft)
    session.flush()
    audit.record(session, user, "version.draft", "version", draft.id, fromVersionId=from_version_id)
    return draft


def parse_if_match(if_match: str | None) -> int:
    if not if_match:
        raise PreconditionRequired("if_match_required", "Send If-Match with the version ETag")
    try:
        return int(if_match.removeprefix("W/").strip('"'))
    except ValueError as error:
        raise PreconditionFailed("if_match_invalid", f"Bad If-Match: {if_match}") from error


def update_draft(
    session: Session, user: User, version_id: str, if_match: str | None, data: VersionUpdate
) -> ArtifactVersion:
    require(user, EDITORS, "edit drafts")
    expected = parse_if_match(if_match)
    version = _version(session, version_id, lock=True)
    if version.state != VersionState.DRAFT:
        raise Conflict("version_immutable", f"Version {version_id} is {version.state}")
    if user.role == Role.AUTHOR and version.created_by != user.id:
        raise Forbidden("forbidden", "Authors can only edit their own drafts")
    if version.revision != expected:
        raise PreconditionFailed(
            "revision_mismatch",
            f"Draft is at revision {version.revision}, not {expected}",
            currentRevision=version.revision,
        )
    if data.content is not None:
        _check_content(session, session.get(Artifact, version.artifact_id).type.value, data.content)
    for name, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(version, name, value)
    version.revision += 1
    session.flush()
    return version


def _latest_review(session: Session, version_id: str) -> ReviewRequest | None:
    return session.scalar(
        select(ReviewRequest)
        .where(ReviewRequest.version_id == version_id)
        .order_by(ReviewRequest.created_at.desc())
        .limit(1)
    )


def _set_default(session: Session, version: ArtifactVersion) -> None:
    session.execute(
        update(ArtifactVersion)
        .where(
            ArtifactVersion.artifact_id == version.artifact_id,
            ArtifactVersion.locale == version.locale,
            ArtifactVersion.id != version.id,
            ArtifactVersion.is_default,
        )
        .values(is_default=False)
    )
    session.flush()
    version.is_active = True
    version.is_default = True


def publish(
    session: Session, user: User, version_id: str, change_comment: str, make_default: bool
) -> ArtifactVersion:
    require(user, PUBLISHERS, "publish")
    if not change_comment.strip():
        raise Invalid("change_comment_required", "Publishing needs a change comment")
    version = _lock_for_change(session, version_id)
    if version.state != VersionState.DRAFT:
        raise Conflict("version_immutable", f"Version {version_id} is already {version.state}")
    review = _latest_review(session, version.id)
    if review is None or review.status != ReviewStatus.APPROVED:
        raise Conflict("review_required", "Publishing needs an approved review")
    if review.content_hash != content_hash(version):
        raise Conflict("approval_stale", "The draft changed after approval; submit it again")
    _check_content(session, session.get(Artifact, version.artifact_id).type.value, version.content)

    highest = session.scalar(
        select(func.max(ArtifactVersion.version_number)).where(
            ArtifactVersion.artifact_id == version.artifact_id,
            ArtifactVersion.locale == version.locale,
        )
    )
    has_default = version.locale in defaults(session, version.artifact_id)
    version.version_number = (highest or 0) + 1
    version.state = VersionState.PUBLISHED
    version.is_active = True
    version.change_comment = change_comment.strip()
    version.published_at = utc_now()
    version.published_by = user.id
    session.flush()
    if make_default or not has_default:
        _set_default(session, version)
    session.flush()
    audit.record(
        session,
        user,
        "version.publish",
        "version",
        version.id,
        locale=version.locale,
        versionNumber=version.version_number,
        reviewId=review.id,
    )
    return version


def archive(session: Session, user: User, version_id: str) -> ArtifactVersion:
    require(user, PUBLISHERS, "archive versions")
    version = _lock_for_change(session, version_id)
    if version.state != VersionState.PUBLISHED:
        raise Conflict(
            "not_published", f"Only published versions can be archived ({version.state})"
        )
    was_default = version.is_default
    version.state = VersionState.ARCHIVED
    version.is_active = False
    version.is_default = False
    session.flush()
    audit.record(session, user, "version.archive", "version", version.id, wasDefault=was_default)
    return version


def set_activation(
    session: Session, user: User, version_id: str, is_active: bool | None, is_default: bool | None
) -> ArtifactVersion:
    require(user, PUBLISHERS, "change activation")
    version = _lock_for_change(session, version_id)
    if version.state != VersionState.PUBLISHED:
        raise Conflict(
            "not_published", f"Only published versions can be activated ({version.state})"
        )
    active = version.is_active if is_active is None else is_active
    default = version.is_default if is_default is None else is_default
    if default and not active:
        raise Conflict("default_must_be_active", "Choose another default before deactivating")
    if default and not version.is_default:
        _set_default(session, version)
    else:
        version.is_default = default
    version.is_active = active
    session.flush()
    audit.record(
        session,
        user,
        "version.activation",
        "version",
        version.id,
        isActive=active,
        isDefault=default,
    )
    return version

"""ORM models for locations, artifacts, versions, reviews, users and audit events.

Database constraints back the versioning invariants that services enforce: a draft has no
version number and a non-draft always has one, numbers are unique per (artifact, locale),
at most one default per (artifact, locale), and a default is always active and published.
"""

from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column

from harness_content_api.db import Base
from harness_content_api.timestamps import utc_now


class Role(StrEnum):
    ADMIN = "admin"
    AUTHOR = "author"
    REVIEWER = "reviewer"
    VIEWER = "viewer"


class LocationKind(StrEnum):
    BOX = "box"
    UNIT = "unit"
    SECTION = "section"


class ArtifactType(StrEnum):
    DOC = "doc"
    SLIDE = "slide"
    ANIMATION = "animation"


class VersionState(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class RevisionState(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"


class ReviewStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"


def _enum(kind: type[StrEnum], name: str) -> Enum:
    return Enum(
        kind,
        name=name,
        native_enum=False,
        create_constraint=True,
        values_callable=lambda members: [m.value for m in members],
        length=32,
    )


def _created() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), default=utc_now)


def _updated() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    role: Mapped[Role] = mapped_column(_enum(Role, "user_role"))
    created_at: Mapped[datetime] = _created()


class Location(Base):
    __tablename__ = "locations"
    __table_args__ = (
        CheckConstraint("(kind = 'box') = (parent_id IS NULL)", name="ck_locations_box_is_root"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    kind: Mapped[LocationKind] = mapped_column(_enum(LocationKind, "location_kind"))
    parent_id: Mapped[str | None] = mapped_column(ForeignKey("locations.id"), index=True)
    title: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_archived: Mapped[bool] = mapped_column(default=False)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = _created()
    updated_at: Mapped[datetime] = _updated()


class Artifact(Base):
    __tablename__ = "artifacts"
    __table_args__ = (
        Index("ix_artifacts_search_vector", "search_vector", postgresql_using="gin"),
        Index("ix_artifacts_tags", "tags", postgresql_using="gin"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[ArtifactType] = mapped_column(_enum(ArtifactType, "artifact_type"))
    title: Mapped[str] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="")
    location_id: Mapped[str] = mapped_column(ForeignKey("locations.id"), index=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    meta: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, default=dict)
    instructional_design: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    resources: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    #: Maintained by the `artifacts_search_vector` trigger (title, description, tags).
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, deferred=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = _created()
    updated_at: Mapped[datetime] = _updated()


class ArtifactVersion(Base):
    __tablename__ = "artifact_versions"
    __table_args__ = (
        UniqueConstraint(
            "artifact_id", "locale", "version_number", name="uq_versions_locale_number"
        ),
        Index(
            "uq_versions_one_default_per_locale",
            "artifact_id",
            "locale",
            unique=True,
            postgresql_where=text("is_default"),
        ),
        CheckConstraint(
            "(state = 'draft') = (version_number IS NULL)", name="ck_versions_number_iff_not_draft"
        ),
        CheckConstraint(
            "NOT is_default OR (is_active AND state = 'published')",
            name="ck_versions_default_is_active_published",
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    artifact_id: Mapped[str] = mapped_column(ForeignKey("artifacts.id"), index=True)
    locale: Mapped[str] = mapped_column(String(35))
    version_number: Mapped[int | None] = mapped_column(Integer)
    state: Mapped[VersionState] = mapped_column(_enum(VersionState, "version_state"))
    is_active: Mapped[bool] = mapped_column(default=False)
    is_default: Mapped[bool] = mapped_column(default=False)
    parent_version_id: Mapped[str | None] = mapped_column(ForeignKey("artifact_versions.id"))
    source_version_id: Mapped[str | None] = mapped_column(ForeignKey("artifact_versions.id"))
    change_comment: Mapped[str | None] = mapped_column(Text)
    content_schema_version: Mapped[int] = mapped_column(Integer, default=1)
    content: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    component_manifest: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    #: Narration / presenter script for this locale; versioned and approved with the content.
    script: Mapped[str] = mapped_column(Text, default="", server_default="")
    #: Bumped on every draft save; it is the ETag clients send back in If-Match.
    revision: Mapped[int] = mapped_column(Integer, default=1)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    published_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = _created()
    updated_at: Mapped[datetime] = _updated()
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ReviewRequest(Base):
    __tablename__ = "review_requests"
    __table_args__ = (
        Index(
            "uq_reviews_one_open_per_version",
            "version_id",
            unique=True,
            postgresql_where=text("status = 'pending'"),
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    version_id: Mapped[str] = mapped_column(ForeignKey("artifact_versions.id"), index=True)
    submitted_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    reviewer_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[ReviewStatus] = mapped_column(_enum(ReviewStatus, "review_status"))
    #: SHA-256 of the draft content when submitted; publish requires it to still match.
    content_hash: Mapped[str] = mapped_column(String(64))
    submit_comment: Mapped[str] = mapped_column(Text, default="")
    decision_comment: Mapped[str | None] = mapped_column(Text)
    decided_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = _created()
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    at: Mapped[datetime] = _created()
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(Text)
    entity_type: Mapped[str] = mapped_column(Text)
    entity_id: Mapped[str] = mapped_column(String(64), index=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)


class Flow(Base):
    __tablename__ = "flows"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="")
    locale: Mapped[str] = mapped_column(String(35))
    meta: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, default=dict)
    theme: Mapped[str | None] = mapped_column(String(32))
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = _created()
    updated_at: Mapped[datetime] = _updated()


class FlowRevision(Base):
    """A draft (mutable, unnumbered) or a published, frozen list of pinned steps."""

    __tablename__ = "flow_revisions"
    __table_args__ = (
        UniqueConstraint("flow_id", "revision", name="uq_flow_revisions_number"),
        Index(
            "uq_flow_revisions_one_draft",
            "flow_id",
            unique=True,
            postgresql_where=text("state = 'draft'"),
        ),
        CheckConstraint(
            "(state = 'draft') = (revision IS NULL)", name="ck_flow_revisions_number_iff_published"
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    flow_id: Mapped[str] = mapped_column(ForeignKey("flows.id"), index=True)
    revision: Mapped[int | None] = mapped_column(Integer)
    state: Mapped[RevisionState] = mapped_column(_enum(RevisionState, "flow_revision_state"))
    parent_revision_id: Mapped[str | None] = mapped_column(ForeignKey("flow_revisions.id"))
    change_comment: Mapped[str | None] = mapped_column(Text)
    #: Bumped on every draft save; the draft's ETag.
    edit_revision: Mapped[int] = mapped_column(Integer, default=1)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    published_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = _created()
    updated_at: Mapped[datetime] = _updated()
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class FlowStep(Base):
    __tablename__ = "flow_steps"
    __table_args__ = (UniqueConstraint("revision_id", "position", name="uq_flow_steps_position"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    revision_id: Mapped[str] = mapped_column(ForeignKey("flow_revisions.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    artifact_id: Mapped[str] = mapped_column(ForeignKey("artifacts.id"), index=True)
    locale: Mapped[str] = mapped_column(String(35))
    #: Optional while drafting; publishing requires it on every step.
    artifact_version_id: Mapped[str | None] = mapped_column(
        ForeignKey("artifact_versions.id"), index=True
    )
    label: Mapped[str | None] = mapped_column(Text)
    presenter_note: Mapped[str | None] = mapped_column(Text)
    advance_seconds: Mapped[int | None] = mapped_column(Integer)
    theme_override: Mapped[str | None] = mapped_column(String(32))

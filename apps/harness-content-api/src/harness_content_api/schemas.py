"""Request/response models. JSON is camelCase; timestamps are UTC `YYYY-MM-DD-HH-mm-ss`."""

from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer
from pydantic.alias_generators import to_camel

from harness_content_api.models import (
    ArtifactType,
    LocationKind,
    ReviewStatus,
    RevisionState,
    Role,
    VersionState,
)
from harness_content_api.timestamps import utc_stamp

Stamp = Annotated[datetime, PlainSerializer(utc_stamp, return_type=str)]
Locale = Annotated[str, Field(min_length=2, max_length=35, pattern=r"^[a-z]{2,3}(-[A-Za-z0-9]+)*$")]


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class UserOut(ApiModel):
    id: str
    name: str
    role: Role


class LocationCreate(ApiModel):
    kind: LocationKind
    title: str = Field(min_length=1)
    parent_id: str | None = None


class LocationUpdate(ApiModel):
    title: str | None = Field(default=None, min_length=1)
    parent_id: str | None = None
    position: int | None = None


class LocationOut(ApiModel):
    id: str
    kind: LocationKind
    parent_id: str | None
    title: str
    position: int
    is_archived: bool
    created_at: Stamp
    updated_at: Stamp


class ArtifactCreate(ApiModel):
    type: ArtifactType
    title: str = Field(min_length=1)
    location_id: str
    locale: Locale
    description: str = ""
    tags: list[str] = []
    meta: dict[str, Any] = Field(default={}, alias="metadata")
    instructional_design: dict[str, Any] = {}
    resources: list[Any] = []
    content: dict[str, Any] | None = None


class ArtifactImport(ApiModel):
    """Structured JSON from an external generator; the artifact type is `content.type`."""

    title: str = Field(min_length=1)
    location_id: str
    locale: Locale
    description: str = ""
    tags: list[str] = []
    instructional_design: dict[str, Any] = {}
    content: dict[str, Any]


class ArtifactUpdate(ApiModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    location_id: str | None = None
    tags: list[str] | None = None
    meta: dict[str, Any] | None = Field(default=None, alias="metadata")
    instructional_design: dict[str, Any] | None = None
    resources: list[Any] | None = None


class VersionSummary(ApiModel):
    id: str
    artifact_id: str
    locale: str
    version_number: int | None
    state: VersionState
    is_active: bool
    is_default: bool
    parent_version_id: str | None
    source_version_id: str | None
    change_comment: str | None
    revision: int
    created_by: str
    created_at: Stamp
    updated_at: Stamp
    published_at: Stamp | None
    published_by: str | None


class VersionOut(VersionSummary):
    content_schema_version: int
    content: dict[str, Any]
    component_manifest: dict[str, Any]
    script: str


class ArtifactOut(ApiModel):
    id: str
    type: ArtifactType
    title: str
    slug: str
    description: str
    location_id: str
    tags: list[str]
    meta: dict[str, Any] = Field(serialization_alias="metadata")
    instructional_design: dict[str, Any]
    resources: list[Any]
    created_by: str
    created_at: Stamp
    updated_at: Stamp
    status: str
    #: Locale → default published version id.
    defaults: dict[str, str]


class ArtifactCreated(ApiModel):
    artifact: ArtifactOut
    draft: VersionOut


class DraftCreate(ApiModel):
    locale: Locale | None = None


class VersionUpdate(ApiModel):
    content: dict[str, Any] | None = None
    component_manifest: dict[str, Any] | None = None
    content_schema_version: int | None = None
    script: str | None = None


class SubmitReview(ApiModel):
    reviewer_id: str | None = None
    comment: str = ""


class ReviewDecision(ApiModel):
    comment: str = ""


class PublishRequest(ApiModel):
    change_comment: str
    make_default: bool = False


class ActivationUpdate(ApiModel):
    is_active: bool | None = None
    is_default: bool | None = None


class ReviewOut(ApiModel):
    id: str
    version_id: str
    submitted_by: str
    reviewer_id: str | None
    status: ReviewStatus
    content_hash: str
    submit_comment: str
    decision_comment: str | None
    decided_by: str | None
    created_at: Stamp
    decided_at: Stamp | None


class ReviewListItem(ReviewOut):
    artifact_id: str
    artifact_title: str
    artifact_type: ArtifactType
    locale: str


class LocationRef(ApiModel):
    id: str
    kind: LocationKind
    title: str


class LocaleVersions(ApiModel):
    locale: str
    latest_number: int | None
    default_number: int | None
    has_draft: bool


class ArtifactListItem(ArtifactOut):
    location_path: list[LocationRef]
    locale_versions: list[LocaleVersions]
    reuse_count: int


class ArtifactSearch(ApiModel):
    items: list[ArtifactListItem]
    total: int


class TagCount(ApiModel):
    tag: str
    count: int


class Usage(ApiModel):
    flow_id: str
    flow_title: str
    revision_id: str
    revision: int | None
    state: RevisionState
    positions: list[int]
    version_ids: list[str | None]


class FlowCreate(ApiModel):
    title: str = Field(min_length=1)
    locale: Locale
    description: str = ""
    meta: dict[str, Any] = Field(default={}, alias="metadata")
    theme: str | None = None


class FlowUpdate(ApiModel):
    title: str | None = Field(default=None, min_length=1)
    locale: Locale | None = None
    description: str | None = None
    meta: dict[str, Any] | None = Field(default=None, alias="metadata")
    theme: str | None = None


class FlowOut(ApiModel):
    id: str
    title: str
    description: str
    locale: str
    meta: dict[str, Any] = Field(serialization_alias="metadata")
    theme: str | None
    created_by: str
    created_at: Stamp
    updated_at: Stamp
    draft_revision_id: str | None
    latest_revision_id: str | None
    latest_revision: int | None
    step_count: int


class StepIn(ApiModel):
    artifact_id: str
    locale: Locale
    artifact_version_id: str | None = None
    label: str | None = None
    presenter_note: str | None = None
    advance_seconds: int | None = Field(default=None, ge=1)
    theme_override: str | None = None


class StepOut(StepIn):
    id: str
    position: int
    artifact_title: str
    artifact_type: ArtifactType
    version_number: int | None
    version_state: VersionState | None
    #: The artifact's planned duration (`instructionalDesign.durationSeconds`), if set.
    duration_seconds: int | None = None


class RevisionSummary(ApiModel):
    id: str
    flow_id: str
    revision: int | None
    state: RevisionState
    parent_revision_id: str | None
    change_comment: str | None
    edit_revision: int
    created_by: str
    created_at: Stamp
    updated_at: Stamp
    published_at: Stamp | None
    published_by: str | None


class RevisionOut(RevisionSummary):
    steps: list[StepOut]


class DraftSteps(ApiModel):
    steps: list[StepIn]


class FlowPublish(ApiModel):
    change_comment: str


class BehindStep(ApiModel):
    step_id: str
    position: int
    artifact_id: str
    artifact_title: str
    locale: str
    pinned_version_id: str | None
    pinned_number: int | None
    pinned_state: VersionState | None
    default_version_id: str | None
    default_number: int | None
    behind: bool


class BehindReport(ApiModel):
    revision_id: str
    behind_count: int
    steps: list[BehindStep]


class PlayArtifact(ApiModel):
    id: str
    type: ArtifactType
    title: str


class PlayStep(ApiModel):
    id: str
    position: int
    label: str | None
    presenter_note: str | None
    advance_seconds: int | None
    duration_seconds: int | None
    theme_override: str | None
    artifact: PlayArtifact
    version: VersionOut


class PlayFlow(ApiModel):
    id: str
    title: str
    locale: str
    theme: str | None


class Playback(ApiModel):
    flow: PlayFlow
    revision: RevisionSummary
    steps: list[PlayStep]


class AssetOut(ApiModel):
    id: str
    artifact_id: str
    name: str
    mime_type: str
    size_bytes: int
    checksum: str
    revision: int
    created_by: str
    updated_by: str
    created_at: Stamp
    updated_at: Stamp


class AssetRename(ApiModel):
    name: str = Field(min_length=1)


class AssetText(ApiModel):
    text: str

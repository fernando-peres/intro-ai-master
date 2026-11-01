"""Artifact and artifact-version routes (PRD §10). Version reads and writes carry an ETag."""

from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Header, Query, Response
from sqlalchemy.orm import Session

from harness_content_api.auth import CurrentUser
from harness_content_api.db import get_session
from harness_content_api.errors import Invalid
from harness_content_api.models import ArtifactType, ArtifactVersion
from harness_content_api.schemas import (
    ActivationUpdate,
    ArtifactCreate,
    ArtifactCreated,
    ArtifactImport,
    ArtifactOut,
    ArtifactSearch,
    ArtifactTrail,
    ArtifactUpdate,
    DraftCreate,
    PublishRequest,
    ReviewOut,
    SubmitReview,
    TagCount,
    Usage,
    VersionOut,
    VersionSummary,
    VersionUpdate,
)
from harness_content_api.services import artifacts, content, embeds, flows, reviews, search

router = APIRouter(prefix="/api/v1", tags=["artifacts"])
SessionDep = Annotated[Session, Depends(get_session)]


def _with_etag(response: Response, version: ArtifactVersion) -> ArtifactVersion:
    response.headers["ETag"] = f'"{version.revision}"'
    return version


@router.post("/artifacts", response_model=ArtifactCreated, status_code=201)
def create_artifact(session: SessionDep, user: CurrentUser, body: ArtifactCreate) -> Any:
    artifact, draft = artifacts.create_artifact(session, user, body)
    session.commit()
    return {"artifact": artifacts.describe(session, artifact), "draft": draft}


@router.post("/artifacts/import", response_model=ArtifactCreated, status_code=201)
def import_artifact(session: SessionDep, user: CurrentUser, body: ArtifactImport) -> Any:
    """Creates an artifact from generated JSON; 422 with `issues` names every problem."""
    kind = body.content.get("type")
    if kind not in {t.value for t in ArtifactType} or kind not in content.registry()["types"]:
        supported = ", ".join(sorted(content.registry()["types"]))
        raise Invalid(
            "unknown_type",
            f"content.type {kind!r} is not a registered artifact type ({supported})",
            issues=[{"path": "type", "message": f"Expected one of: {supported}"}],
        )
    data = ArtifactCreate.model_validate(body.model_dump(by_alias=False) | {"type": kind})
    embeds.check(session, body.content)
    artifact, draft = artifacts.create_artifact(session, user, data)
    session.commit()
    return {"artifact": artifacts.describe(session, artifact), "draft": draft}


@router.get("/registry")
def get_registry(_: CurrentUser) -> dict[str, Any]:
    """The allowlisted components and empty content per type, for generators and editors."""
    return content.registry()


@router.get("/artifacts", response_model=ArtifactSearch)
def search_artifacts(
    session: SessionDep,
    _: CurrentUser,
    query: str | None = None,
    tag: Annotated[list[str] | None, Query()] = None,
    type: ArtifactType | None = None,
    locale: str | None = None,
    status: Literal["has-published", "draft-only", "archived-only"] | None = None,
    location_id: Annotated[str | None, Query(alias="locationId")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Any:
    return search.search(
        session,
        query=query,
        tags=tag,
        type_=type,
        locale=locale,
        status=status,
        location_id=location_id,
        limit=limit,
        offset=offset,
    )


@router.get("/tags", response_model=list[TagCount])
def tags(session: SessionDep, _: CurrentUser) -> Any:
    return search.tag_counts(session)


@router.get("/artifacts/{artifact_id}/usages", response_model=list[Usage])
def usages(session: SessionDep, _: CurrentUser, artifact_id: str) -> Any:
    artifacts.get_artifact(session, artifact_id)
    return flows.usages(session, artifact_id)


@router.get("/artifacts/{artifact_id}/trails", response_model=list[ArtifactTrail])
def artifact_trails(session: SessionDep, _: CurrentUser, artifact_id: str) -> Any:
    artifacts.get_artifact(session, artifact_id)
    return flows.artifact_trails(session, artifact_id)


@router.put("/artifacts/{artifact_id}/trails/{flow_id}", status_code=204)
def add_to_trail(session: SessionDep, user: CurrentUser, artifact_id: str, flow_id: str) -> None:
    flows.add_artifact(session, user, flow_id, artifact_id)
    session.commit()


@router.delete("/artifacts/{artifact_id}/trails/{flow_id}", status_code=204)
def remove_from_trail(
    session: SessionDep, user: CurrentUser, artifact_id: str, flow_id: str
) -> None:
    flows.remove_artifact(session, user, flow_id, artifact_id)
    session.commit()


@router.get("/artifacts/{artifact_id}", response_model=ArtifactOut)
def get_artifact(session: SessionDep, _: CurrentUser, artifact_id: str) -> Any:
    return artifacts.describe(session, artifacts.get_artifact(session, artifact_id))


@router.patch("/artifacts/{artifact_id}", response_model=ArtifactOut)
def update_artifact(
    session: SessionDep, user: CurrentUser, artifact_id: str, body: ArtifactUpdate
) -> Any:
    artifact = artifacts.update_artifact(session, user, artifact_id, body)
    session.commit()
    return artifacts.describe(session, artifact)


@router.get("/artifacts/{artifact_id}/versions", response_model=list[VersionSummary])
def list_versions(
    session: SessionDep, user: CurrentUser, artifact_id: str, locale: str | None = None
) -> list[ArtifactVersion]:
    return artifacts.list_versions(session, user, artifact_id, locale)


@router.get("/artifacts/{artifact_id}/resolve", response_model=VersionOut)
def resolve(session: SessionDep, _: CurrentUser, artifact_id: str, locale: str) -> ArtifactVersion:
    return artifacts.resolve(session, artifact_id, locale)


@router.post("/artifacts/{artifact_id}/drafts", response_model=VersionOut, status_code=201)
def create_draft(
    session: SessionDep,
    user: CurrentUser,
    response: Response,
    artifact_id: str,
    from_version_id: Annotated[str | None, Query(alias="fromVersionId")] = None,
    body: DraftCreate | None = None,
) -> ArtifactVersion:
    locale = body.locale if body else None
    draft = artifacts.create_draft(session, user, artifact_id, from_version_id, locale)
    session.commit()
    return _with_etag(response, draft)


@router.get("/artifact-versions/{version_id}", response_model=VersionOut)
def get_version(
    session: SessionDep, user: CurrentUser, response: Response, version_id: str
) -> ArtifactVersion:
    return _with_etag(response, artifacts.get_version(session, user, version_id))


@router.patch("/artifact-versions/{version_id}", response_model=VersionOut)
def update_version(
    session: SessionDep,
    user: CurrentUser,
    response: Response,
    version_id: str,
    body: VersionUpdate,
    if_match: Annotated[str | None, Header()] = None,
) -> ArtifactVersion:
    version = artifacts.update_draft(session, user, version_id, if_match, body)
    session.commit()
    return _with_etag(response, version)


@router.post(
    "/artifact-versions/{version_id}/submit-review", response_model=ReviewOut, status_code=201
)
def submit_review(
    session: SessionDep, user: CurrentUser, version_id: str, body: SubmitReview
) -> Any:
    review = reviews.submit(session, user, version_id, body.reviewer_id, body.comment)
    session.commit()
    return review


@router.post("/artifact-versions/{version_id}/publish", response_model=VersionOut)
def publish(
    session: SessionDep,
    user: CurrentUser,
    response: Response,
    version_id: str,
    body: PublishRequest,
) -> ArtifactVersion:
    version = artifacts.publish(session, user, version_id, body.change_comment, body.make_default)
    session.commit()
    return _with_etag(response, version)


@router.post("/artifact-versions/{version_id}/archive", response_model=VersionOut)
def archive(session: SessionDep, user: CurrentUser, version_id: str) -> ArtifactVersion:
    version = artifacts.archive(session, user, version_id)
    session.commit()
    return version


@router.patch("/artifact-versions/{version_id}/activation", response_model=VersionOut)
def activation(
    session: SessionDep, user: CurrentUser, version_id: str, body: ActivationUpdate
) -> ArtifactVersion:
    version = artifacts.set_activation(session, user, version_id, body.is_active, body.is_default)
    session.commit()
    return version

"""Flow routes. Draft writes carry the draft's `edit_revision` as ETag / If-Match."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Query, Response
from sqlalchemy.orm import Session

from harness_content_api.auth import CurrentUser
from harness_content_api.db import get_session
from harness_content_api.models import FlowRevision
from harness_content_api.schemas import (
    BehindReport,
    DraftSteps,
    FlowCreate,
    FlowOut,
    FlowPublish,
    FlowUpdate,
    Playback,
    RevisionOut,
    RevisionSummary,
)
from harness_content_api.services import flows

router = APIRouter(prefix="/api/v1/flows", tags=["flows"])
SessionDep = Annotated[Session, Depends(get_session)]
IfMatch = Annotated[str | None, Header()]


def _revision(session: Session, response: Response, revision: FlowRevision) -> dict[str, Any]:
    response.headers["ETag"] = f'"{revision.edit_revision}"'
    return flows.describe_revision(session, revision)


@router.get("", response_model=list[FlowOut])
def list_flows(session: SessionDep, _: CurrentUser) -> Any:
    return [flows.describe_flow(session, flow) for flow in flows.list_flows(session)]


@router.post("", response_model=FlowOut, status_code=201)
def create_flow(session: SessionDep, user: CurrentUser, body: FlowCreate) -> Any:
    flow = flows.create_flow(session, user, body)
    session.commit()
    return flows.describe_flow(session, flow)


@router.get("/{flow_id}", response_model=FlowOut)
def get_flow(session: SessionDep, _: CurrentUser, flow_id: str) -> Any:
    return flows.describe_flow(session, flows.get_flow(session, flow_id))


@router.patch("/{flow_id}", response_model=FlowOut)
def update_flow(session: SessionDep, user: CurrentUser, flow_id: str, body: FlowUpdate) -> Any:
    flow = flows.update_flow(session, user, flow_id, body)
    session.commit()
    return flows.describe_flow(session, flow)


@router.get("/{flow_id}/draft", response_model=RevisionOut)
def get_draft(session: SessionDep, _: CurrentUser, response: Response, flow_id: str) -> Any:
    return _revision(session, response, flows.get_draft(session, flow_id))


@router.post("/{flow_id}/draft", response_model=RevisionOut)
def ensure_draft(session: SessionDep, user: CurrentUser, response: Response, flow_id: str) -> Any:
    draft = flows.ensure_draft(session, user, flow_id)
    session.commit()
    return _revision(session, response, draft)


@router.patch("/{flow_id}/draft", response_model=RevisionOut)
def replace_steps(
    session: SessionDep,
    user: CurrentUser,
    response: Response,
    flow_id: str,
    body: DraftSteps,
    if_match: IfMatch = None,
) -> Any:
    draft = flows.replace_steps(session, user, flow_id, if_match, body.steps)
    session.commit()
    return _revision(session, response, draft)


@router.post("/{flow_id}/draft/use-current-defaults", response_model=RevisionOut)
def use_current_defaults(
    session: SessionDep,
    user: CurrentUser,
    response: Response,
    flow_id: str,
    if_match: IfMatch = None,
) -> Any:
    draft = flows.use_current_defaults(session, user, flow_id, if_match)
    session.commit()
    return _revision(session, response, draft)


@router.post("/{flow_id}/publish", response_model=RevisionOut)
def publish(
    session: SessionDep, user: CurrentUser, response: Response, flow_id: str, body: FlowPublish
) -> Any:
    revision = flows.publish(session, user, flow_id, body.change_comment)
    session.commit()
    return _revision(session, response, revision)


@router.get("/{flow_id}/revisions", response_model=list[RevisionSummary])
def list_revisions(session: SessionDep, user: CurrentUser, flow_id: str) -> Any:
    return flows.list_revisions(session, user, flow_id)


@router.get("/{flow_id}/revisions/{revision_id}", response_model=RevisionOut)
def get_revision(
    session: SessionDep, user: CurrentUser, response: Response, flow_id: str, revision_id: str
) -> Any:
    return _revision(session, response, flows.get_revision(session, user, flow_id, revision_id))


@router.get("/{flow_id}/behind", response_model=BehindReport)
def behind(
    session: SessionDep,
    user: CurrentUser,
    flow_id: str,
    revision_id: Annotated[str | None, Query(alias="revisionId")] = None,
) -> Any:
    return flows.behind(session, user, flow_id, revision_id)


@router.get("/{flow_id}/revisions/{revision_id}/play", response_model=Playback)
def play(session: SessionDep, user: CurrentUser, flow_id: str, revision_id: str) -> Any:
    return flows.playback(session, user, flow_id, revision_id)

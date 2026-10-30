from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from harness_content_api.auth import CurrentUser
from harness_content_api.db import get_session
from harness_content_api.models import ArtifactTemplate
from harness_content_api.schemas import TemplateCreate, TemplateOut, TemplateUpdate
from harness_content_api.services import templates

router = APIRouter(prefix="/api/v1/artifact-templates", tags=["artifact-templates"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[TemplateOut])
def list_templates(
    session: SessionDep,
    _: CurrentUser,
    theme_id: Annotated[str | None, Query(alias="themeId")] = None,
) -> list[ArtifactTemplate]:
    return templates.list_all(session, theme_id)


@router.get("/{template_id}", response_model=TemplateOut)
def get_template(session: SessionDep, _: CurrentUser, template_id: str) -> ArtifactTemplate:
    return templates.get(session, template_id)


@router.post("", response_model=TemplateOut, status_code=201)
def create_template(
    session: SessionDep, user: CurrentUser, body: TemplateCreate
) -> ArtifactTemplate:
    template = templates.create(session, user, body)
    session.commit()
    return template


@router.patch("/{template_id}", response_model=TemplateOut)
def update_template(
    session: SessionDep, user: CurrentUser, template_id: str, body: TemplateUpdate
) -> ArtifactTemplate:
    template = templates.update(session, user, template_id, body)
    session.commit()
    return template


@router.delete("/{template_id}", status_code=204)
def delete_template(session: SessionDep, user: CurrentUser, template_id: str) -> None:
    templates.delete(session, user, template_id)
    session.commit()

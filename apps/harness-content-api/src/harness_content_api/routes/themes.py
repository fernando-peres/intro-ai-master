from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from harness_content_api.auth import CurrentUser
from harness_content_api.db import get_session
from harness_content_api.schemas import ThemeCreate, ThemeOut, ThemeUpdate
from harness_content_api.services import themes

router = APIRouter(prefix="/api/v1/artifact-themes", tags=["artifact-themes"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[ThemeOut])
def list_themes(session: SessionDep, _: CurrentUser) -> list[ThemeOut]:
    return themes.list_all(session)


@router.post("", response_model=ThemeOut, status_code=201)
def create_theme(session: SessionDep, user: CurrentUser, body: ThemeCreate) -> ThemeOut:
    theme = themes.create(session, user, body)
    session.commit()
    return themes.out(session, theme)


@router.patch("/{theme_id}", response_model=ThemeOut)
def update_theme(
    session: SessionDep, user: CurrentUser, theme_id: str, body: ThemeUpdate
) -> ThemeOut:
    theme = themes.update(session, user, theme_id, body)
    session.commit()
    return themes.out(session, theme)


@router.post("/{theme_id}/duplicate", response_model=ThemeOut, status_code=201)
def duplicate_theme(session: SessionDep, user: CurrentUser, theme_id: str) -> ThemeOut:
    theme = themes.duplicate(session, user, theme_id)
    session.commit()
    return themes.out(session, theme)

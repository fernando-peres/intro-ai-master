"""Artifact themes: saved colour slots that slides resolve by ID."""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from harness_content_api.auth import EDITORS, require
from harness_content_api.errors import Conflict, Invalid, NotFound
from harness_content_api.ids import new_id
from harness_content_api.models import (
    Artifact,
    ArtifactTheme,
    ArtifactType,
    ArtifactVersion,
    User,
    VersionState,
)
from harness_content_api.schemas import ThemeCreate, ThemeOut, ThemeUpdate
from harness_content_api.services import audit

#: Slide content without a theme renders with this one (the schema's default).
DEFAULT_THEME = "dark"


def get(session: Session, theme_id: str) -> ArtifactTheme:
    theme = session.get(ArtifactTheme, theme_id)
    if theme is None:
        raise NotFound("theme_not_found", f"Theme {theme_id} does not exist")
    return theme


def _used_by(session: Session) -> dict[str, int]:
    """Slide artifacts per theme, counting any version that is not archived."""
    theme = func.coalesce(ArtifactVersion.content["theme"].astext, DEFAULT_THEME)
    rows = session.execute(
        select(theme, func.count(ArtifactVersion.artifact_id.distinct()))
        .join(Artifact, Artifact.id == ArtifactVersion.artifact_id)
        .where(Artifact.type == ArtifactType.SLIDE, ArtifactVersion.state != VersionState.ARCHIVED)
        .group_by(theme)
    )
    return {row[0]: row[1] for row in rows}


def _out(theme: ArtifactTheme, used_by: int) -> ThemeOut:
    out = ThemeOut.model_validate(theme)
    out.used_by = used_by
    return out


def list_all(session: Session) -> list[ThemeOut]:
    used = _used_by(session)
    query = select(ArtifactTheme).order_by(ArtifactTheme.builtin.desc(), ArtifactTheme.created_at)
    return [_out(theme, used.get(theme.id, 0)) for theme in session.scalars(query)]


def out(session: Session, theme: ArtifactTheme) -> ThemeOut:
    return _out(theme, _used_by(session).get(theme.id, 0))


def _copy(session: Session, user: User, name: str, source: ArtifactTheme) -> ArtifactTheme:
    theme = ArtifactTheme(id=new_id("thm"), name=name, tokens=source.tokens)
    session.add(theme)
    session.flush()
    audit.record(session, user, "theme.create", "theme", theme.id, fromThemeId=source.id)
    return theme


def create(session: Session, user: User, data: ThemeCreate) -> ArtifactTheme:
    require(user, EDITORS, "create themes")
    return _copy(session, user, data.name, get(session, data.from_theme_id))


def duplicate(session: Session, user: User, theme_id: str) -> ArtifactTheme:
    require(user, EDITORS, "create themes")
    source = get(session, theme_id)
    return _copy(session, user, f"{source.name} copy", source)


def update(session: Session, user: User, theme_id: str, data: ThemeUpdate) -> ArtifactTheme:
    require(user, EDITORS, "edit themes")
    theme = get(session, theme_id)
    if theme.builtin:
        raise Conflict("theme_builtin", "Built-in themes are read-only; duplicate it to edit")
    if data.name is not None:
        theme.name = data.name
    if data.tokens is not None:
        theme.tokens = data.tokens.model_dump(by_alias=True)
    audit.record(session, user, "theme.update", "theme", theme.id)
    session.flush()
    return theme


def check_slide(session: Session, content: dict[str, Any]) -> None:
    """Raises `Invalid` (`unknown_theme`) when slide or diagram content names a missing theme."""
    theme = content.get("theme", DEFAULT_THEME)
    if session.get(ArtifactTheme, theme) is None:
        raise Invalid("unknown_theme", f"Theme {theme!r} does not exist")

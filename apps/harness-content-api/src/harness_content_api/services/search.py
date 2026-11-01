"""Artifact search: prefix full-text over title/tags/description, plus filters.

`location_id` matches the location and everything beneath it, so a search scoped to a box
returns exactly what browsing that box's tree shows.
"""

import re
from typing import Any

from sqlalchemy import Select, exists, func, select
from sqlalchemy.orm import Session

from harness_content_api.models import (
    Artifact,
    ArtifactType,
    ArtifactVersion,
    Location,
    VersionState,
)
from harness_content_api.services import artifacts, flows


def _prefix_query(text: str) -> str | None:
    """Quoted per word, so Postgres splits it as it did the index: `v2.0` stays one token."""
    words = [word for word in text.lower().split() if re.search(r"\w", word)]
    quoted = (word.replace("\\", "\\\\").replace("'", "''") for word in words)
    return " & ".join(f"'{word}':*" for word in quoted) or None


def _subtree(session: Session, location_id: str) -> set[str]:
    children: dict[str | None, list[str]] = {}
    for loc_id, parent_id in session.execute(select(Location.id, Location.parent_id)):
        children.setdefault(parent_id, []).append(loc_id)
    found, stack = set(), [location_id]
    while stack:
        current = stack.pop()
        found.add(current)
        stack.extend(children.get(current, []))
    return found


def _has_state(state: VersionState):
    return exists().where(
        ArtifactVersion.artifact_id == Artifact.id, ArtifactVersion.state == state
    )


def _filtered(
    session: Session,
    query: str | None,
    tags: list[str],
    type_: ArtifactType | None,
    locale: str | None,
    status: str | None,
    location_id: str | None,
) -> tuple[Select, Any]:
    stmt = select(Artifact)
    rank = None
    tsquery = _prefix_query(query) if query else None
    if tsquery:
        ts = func.to_tsquery("simple", tsquery)
        stmt = stmt.where(Artifact.search_vector.op("@@")(ts))
        rank = func.ts_rank(Artifact.search_vector, ts)
    if tags:
        stmt = stmt.where(Artifact.tags.overlap(tags))
    if type_:
        stmt = stmt.where(Artifact.type == type_)
    if locale:
        stmt = stmt.where(
            exists().where(
                ArtifactVersion.artifact_id == Artifact.id, ArtifactVersion.locale == locale
            )
        )
    if status == "has-published":
        stmt = stmt.where(_has_state(VersionState.PUBLISHED))
    elif status == "draft-only":
        stmt = stmt.where(~_has_state(VersionState.PUBLISHED), _has_state(VersionState.DRAFT))
    elif status == "archived-only":
        stmt = stmt.where(~_has_state(VersionState.PUBLISHED), ~_has_state(VersionState.DRAFT))
    if location_id:
        stmt = stmt.where(Artifact.location_id.in_(_subtree(session, location_id)))
    return stmt, rank


def _location_path(locations: dict[str, Location], location_id: str) -> list[dict[str, Any]]:
    path = []
    current = locations.get(location_id)
    while current is not None:
        path.append({"id": current.id, "kind": current.kind, "title": current.title})
        current = locations.get(current.parent_id) if current.parent_id else None
    return list(reversed(path))


def _locale_versions(session: Session, artifact_id: str) -> list[dict[str, Any]]:
    rows = session.execute(
        select(
            ArtifactVersion.locale,
            func.max(ArtifactVersion.version_number),
            func.max(ArtifactVersion.version_number).filter(ArtifactVersion.is_default),
            func.bool_or(ArtifactVersion.state == VersionState.DRAFT),
        )
        .where(ArtifactVersion.artifact_id == artifact_id)
        .group_by(ArtifactVersion.locale)
        .order_by(ArtifactVersion.locale)
    )
    return [
        {"locale": loc, "latest_number": latest, "default_number": default, "has_draft": draft}
        for loc, latest, default, draft in rows
    ]


def search(
    session: Session,
    *,
    query: str | None = None,
    tags: list[str] | None = None,
    type_: ArtifactType | None = None,
    locale: str | None = None,
    status: str | None = None,
    location_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    stmt, rank = _filtered(session, query, tags or [], type_, locale, status, location_id)
    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    order = [rank.desc()] if rank is not None else []
    page = session.scalars(
        stmt.order_by(*order, Artifact.updated_at.desc(), Artifact.id).limit(limit).offset(offset)
    )
    locations = {loc.id: loc for loc in session.scalars(select(Location))}
    items = [
        artifacts.describe(session, artifact)
        | {
            "location_path": _location_path(locations, artifact.location_id),
            "locale_versions": _locale_versions(session, artifact.id),
            "reuse_count": flows.reuse_count(session, artifact.id),
        }
        for artifact in page
    ]
    return {"items": items, "total": total}


def tag_counts(session: Session) -> list[dict[str, Any]]:
    tag = func.unnest(Artifact.tags).label("tag")
    inner = select(tag).subquery()
    rows = session.execute(
        select(inner.c.tag, func.count())
        .group_by(inner.c.tag)
        .order_by(func.count().desc(), inner.c.tag)
    )
    return [{"tag": name, "count": count} for name, count in rows]

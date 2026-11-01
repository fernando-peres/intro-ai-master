"""Box → Unit → Section tree. A unit's parent is a box; a section's parent is a unit."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from harness_content_api.auth import EDITORS, require
from harness_content_api.errors import Conflict, Invalid, NotFound
from harness_content_api.ids import new_id
from harness_content_api.models import Artifact, Location, LocationKind, User
from harness_content_api.schemas import LocationCreate, LocationUpdate
from harness_content_api.services import audit

PARENT_KIND = {LocationKind.UNIT: LocationKind.BOX, LocationKind.SECTION: LocationKind.UNIT}


def get(session: Session, location_id: str) -> Location:
    location = session.get(Location, location_id)
    if location is None:
        raise NotFound("location_not_found", f"Location {location_id} does not exist")
    return location


def get_open(session: Session, location_id: str) -> Location:
    location = get(session, location_id)
    if location.is_archived:
        raise Conflict("location_archived", f"Location {location_id} is archived")
    return location


def _check_parent(session: Session, kind: LocationKind, parent_id: str | None) -> None:
    expected = PARENT_KIND.get(kind)
    if expected is None:
        if parent_id is not None:
            raise Invalid("invalid_parent", "A box has no parent")
        return
    if parent_id is None:
        raise Invalid("invalid_parent", f"A {kind} needs a {expected} parent")
    parent = get_open(session, parent_id)
    if parent.kind != expected:
        raise Invalid(
            "invalid_parent", f"A {kind}'s parent must be a {expected}, not a {parent.kind}"
        )


def list_all(session: Session, include_archived: bool = False) -> list[Location]:
    query = select(Location).order_by(Location.position, Location.created_at)
    if not include_archived:
        query = query.where(Location.is_archived.is_(False))
    return list(session.scalars(query))


def artifact_counts(session: Session) -> dict[str, int]:
    """Artifacts directly in each location; locations holding none are absent."""
    query = select(Artifact.location_id, func.count()).group_by(Artifact.location_id)
    return {location_id: count for location_id, count in session.execute(query)}


def create(session: Session, user: User, data: LocationCreate) -> Location:
    require(user, EDITORS, "create locations")
    _check_parent(session, data.kind, data.parent_id)
    location = Location(
        id=new_id("loc"),
        kind=data.kind,
        parent_id=data.parent_id,
        title=data.title,
        created_by=user.id,
    )
    session.add(location)
    session.flush()
    audit.record(session, user, "location.create", "location", location.id)
    return location


def update(session: Session, user: User, location_id: str, data: LocationUpdate) -> Location:
    require(user, EDITORS, "edit locations")
    location = get_open(session, location_id)
    fields = data.model_dump(exclude_unset=True)
    if "parent_id" in fields and fields["parent_id"] != location.parent_id:
        _check_parent(session, location.kind, fields["parent_id"])
        audit.record(
            session,
            user,
            "location.move",
            "location",
            location.id,
            fromParentId=location.parent_id,
            toParentId=fields["parent_id"],
        )
    for name, value in fields.items():
        setattr(location, name, value)
    session.flush()
    return location


def archive(session: Session, user: User, location_id: str) -> Location:
    require(user, EDITORS, "archive locations")
    location = get_open(session, location_id)
    location.is_archived = True
    audit.record(session, user, "location.archive", "location", location.id)
    session.flush()
    return location

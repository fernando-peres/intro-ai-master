from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from harness_content_api.auth import CurrentUser
from harness_content_api.db import get_session
from harness_content_api.models import Location
from harness_content_api.schemas import LocationCreate, LocationOut, LocationUpdate
from harness_content_api.services import locations

router = APIRouter(prefix="/api/v1/locations", tags=["locations"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[LocationOut])
def list_locations(
    session: SessionDep, _: CurrentUser, include_archived: bool = False
) -> list[Location]:
    return locations.list_all(session, include_archived)


@router.get("/artifact-counts", response_model=dict[str, int])
def artifact_counts(session: SessionDep, _: CurrentUser) -> dict[str, int]:
    return locations.artifact_counts(session)


@router.post("", response_model=LocationOut, status_code=201)
def create_location(session: SessionDep, user: CurrentUser, body: LocationCreate) -> Location:
    location = locations.create(session, user, body)
    session.commit()
    return location


@router.patch("/{location_id}", response_model=LocationOut)
def update_location(
    session: SessionDep, user: CurrentUser, location_id: str, body: LocationUpdate
) -> Location:
    location = locations.update(session, user, location_id, body)
    session.commit()
    return location


@router.post("/{location_id}/archive", response_model=LocationOut)
def archive_location(session: SessionDep, user: CurrentUser, location_id: str) -> Location:
    location = locations.archive(session, user, location_id)
    session.commit()
    return location

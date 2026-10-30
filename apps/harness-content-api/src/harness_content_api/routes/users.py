from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from harness_content_api.auth import CurrentUser
from harness_content_api.db import get_session
from harness_content_api.models import User
from harness_content_api.schemas import UserOut

router = APIRouter(prefix="/api/v1", tags=["users"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.get("/users", response_model=list[UserOut])
def users(session: SessionDep, _: CurrentUser) -> list[User]:
    return list(session.scalars(select(User).order_by(User.id)))
